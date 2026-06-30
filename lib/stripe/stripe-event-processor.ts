import Stripe from "stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { resolveCommissionRate } from "@/lib/commission";
import { trySendNotification } from "@/lib/notifications/server";
import { rejectCompetingApplicationsForOffer } from "@/lib/services/application-chat-closure";
import { isUuid } from "@/lib/security/validation";
import { logCriticalError } from "@/lib/observability/error-log";

type StripeEventRow = {
  id: string;
  stripe_event_id: string;
  event_type: string;
  payload: Stripe.Event;
  retry_count: number;
};

type PaymentSource = {
  applicationId: string | null;
  serviceOrderId: string | null;
  sourceType: "application" | "service_order";
};

type PaymentContractRow = {
  company_id?: string | null;
  source_type?: "application" | "service_order" | null;
  application_id?: string | null;
  service_order_id?: string | null;
  commission_rate?: number | null;
  student_id?: string | null;
  applications?: { offers?: { tytul?: string | null } | null } | { offers?: { tytul?: string | null } | null }[] | null;
};

type TargetApplicationRow = {
  id: string;
  offer_id: string;
  offers: {
    tytul: string | null;
  } | {
    tytul: string | null;
  }[] | null;
};

class LoggedStripeProcessorError extends Error {
  readonly alreadyLogged = true;

  constructor(message: string) {
    super(message);
    this.name = "LoggedStripeProcessorError";
  }
}

function readErrorCode(error: unknown): string | null {
  if (!error || typeof error !== "object" || !("code" in error)) return null;
  const code = (error as { code?: unknown }).code;
  return typeof code === "string" && code.trim().length > 0 ? code.trim() : null;
}

function wasAlreadyLogged(error: unknown): error is LoggedStripeProcessorError {
  return error instanceof LoggedStripeProcessorError || (
    error !== null
    && typeof error === "object"
    && "alreadyLogged" in error
    && (error as { alreadyLogged?: unknown }).alreadyLogged === true
  );
}

async function failStripeProcessor(input: {
  source: string;
  publicMessage: string;
  error?: unknown;
  level?: "error" | "warning" | "info";
  contractId?: string | null;
  stripeSessionId?: string | null;
  stripeEventId?: string | null;
  context?: Record<string, unknown>;
}): Promise<never> {
  await logCriticalError({
    source: input.source,
    level: input.level,
    error: input.error,
    errorCode: readErrorCode(input.error),
    message: input.publicMessage,
    contractId: input.contractId ?? null,
    stripeSessionId: input.stripeSessionId ?? null,
    stripeEventId: input.stripeEventId ?? null,
    context: input.context,
  });
  throw new LoggedStripeProcessorError(input.publicMessage);
}

function processingErrorMessage(error: unknown) {
  return error instanceof LoggedStripeProcessorError
    ? error.message
    : "Stripe event processing failed. See error_logs.";
}

function normalizeMetadataId(value: string | null | undefined): string | null {
  return value && value.trim().length > 0 ? value.trim() : null;
}

function resolvePaymentSource(session: Stripe.Checkout.Session): PaymentSource {
  const applicationId = normalizeMetadataId(session.metadata?.application_id);
  const serviceOrderId = normalizeMetadataId(session.metadata?.service_order_id);
  const selectedSourceCount = Number(Boolean(applicationId)) + Number(Boolean(serviceOrderId));

  if (selectedSourceCount !== 1) {
    throw new Error("Stripe checkout session must reference exactly one payment source.");
  }

  return {
    applicationId,
    serviceOrderId,
    sourceType: applicationId ? "application" : "service_order",
  };
}

function assertSourceMatchesContract(source: PaymentSource, contract: PaymentContractRow | null): void {
  if (!contract) {
    throw new Error("Contract not found for Stripe checkout session.");
  }

  const contractSourceType = contract.source_type ?? (contract.service_order_id ? "service_order" : "application");
  if (source.sourceType === "application") {
    if (
      contractSourceType !== "application"
      || contract.application_id !== source.applicationId
      || contract.service_order_id !== null
    ) {
      throw new Error("Stripe checkout application metadata does not match contract source.");
    }
    return;
  }

  if (
    contractSourceType !== "service_order"
    || contract.service_order_id !== source.serviceOrderId
    || contract.application_id !== null
  ) {
    throw new Error("Stripe checkout service order metadata does not match contract source.");
  }
}

function resolveFeePln(session: Stripe.Checkout.Session): number {
  const raw = session.metadata?.platform_fee;
  if (!raw) {
    throw new Error("Missing platform_fee metadata for Stripe checkout session.");
  }

  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new Error("Invalid platform_fee metadata for Stripe checkout session.");
  }

  return parsed / 100;
}

function parseMilestoneIdsMetadata(value: string | undefined): string[] {
  if (!value) return [];

  try {
    const parsed = JSON.parse(value);
    if (
      !Array.isArray(parsed)
      || parsed.length > 100
      || !parsed.every((item): item is string => typeof item === "string" && isUuid(item))
    ) {
      throw new Error("Invalid milestone_ids metadata");
    }

    return parsed;
  } catch {
    throw new Error("Invalid milestone_ids metadata for Stripe checkout session.");
  }
}

export async function enqueueStripeEvent(event: Stripe.Event): Promise<"queued" | "duplicate"> {
  const supabase = createAdminClient();
  const { error } = await supabase.from("stripe_events").insert({
    stripe_event_id: event.id,
    event_type: event.type,
    payload: event,
  });

  if (!error) {
    return "queued";
  }

  if (error.code === "23505") {
    return "duplicate";
  }

  return failStripeProcessor({
    source: "stripe.event_processor.enqueue_failed",
    publicMessage: "Failed to enqueue Stripe event.",
    error,
    stripeEventId: event.id,
    context: {
      eventType: event.type,
    },
  });
}

export async function processPendingStripeEvents(limit = 10): Promise<{
  processed: number;
  failed: number;
  skipped: number;
}> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("stripe_events")
    .select("id, stripe_event_id, event_type, payload, retry_count")
    .is("processed_at", null)
    .lt("retry_count", 3)
    .order("created_at", { ascending: true })
    .limit(limit);

  if (error) {
    return failStripeProcessor({
      source: "stripe.event_processor.queue_load_failed",
      publicMessage: "Failed to load Stripe event queue.",
      error,
    });
  }

  const rows = (data ?? []) as StripeEventRow[];

  let processed = 0;
  let failed = 0;
  let skipped = 0;

  for (const row of rows) {
    const payload = row.payload;
    if (!payload || typeof payload !== "object" || typeof payload.type !== "string") {
      skipped += 1;
      const { error: invalidPayloadUpdateError } = await supabase
        .from("stripe_events")
        .update({
          retry_count: row.retry_count + 1,
          processing_error: "Invalid event payload",
          last_attempt_at: new Date().toISOString(),
        })
        .eq("id", row.id);
      if (invalidPayloadUpdateError) {
        await logCriticalError({
          source: "stripe.event_processor.invalid_payload_update_failed",
          error: invalidPayloadUpdateError,
          errorCode: invalidPayloadUpdateError.code,
          message: "Failed to mark invalid Stripe event payload.",
          stripeEventId: row.stripe_event_id,
          context: {
            eventType: row.event_type,
            retryCount: row.retry_count,
          },
        });
      }
      continue;
    }

    try {
      await processStripeEvent(payload);

      const { error: processedUpdateError } = await supabase
        .from("stripe_events")
        .update({
          processed_at: new Date().toISOString(),
          processing_error: null,
          last_attempt_at: new Date().toISOString(),
        })
        .eq("id", row.id);

      if (processedUpdateError) {
        await failStripeProcessor({
          source: "stripe.event_processor.processed_update_failed",
          publicMessage: "Failed to mark Stripe event as processed.",
          error: processedUpdateError,
          stripeEventId: row.stripe_event_id,
          context: {
            eventType: row.event_type,
            retryCount: row.retry_count,
          },
        });
      }

      processed += 1;
    } catch (error) {
      failed += 1;
      const message = processingErrorMessage(error);
      if (!wasAlreadyLogged(error)) {
        await logCriticalError({
          source: "stripe.event_processor.processing_failed",
          error,
          message: "Stripe event processing failed.",
          stripeEventId: row.stripe_event_id,
          context: {
            eventType: row.event_type,
            retryCount: row.retry_count,
          },
        });
      }

      const { error: failedUpdateError } = await supabase
        .from("stripe_events")
        .update({
          retry_count: row.retry_count + 1,
          processing_error: message,
          last_attempt_at: new Date().toISOString(),
        })
        .eq("id", row.id);

      if (failedUpdateError) {
        await logCriticalError({
          source: "stripe.event_processor.failed_update_failed",
          error: failedUpdateError,
          errorCode: failedUpdateError.code,
          message: "Failed to update failed Stripe event retry metadata.",
          stripeEventId: row.stripe_event_id,
          context: {
            eventType: row.event_type,
            retryCount: row.retry_count,
          },
        });
      }
    }
  }

  return { processed, failed, skipped };
}

async function processStripeEvent(event: Stripe.Event) {
  switch (event.type) {
    case "checkout.session.completed":
      await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
      return;
    case "checkout.session.async_payment_succeeded":
      await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
      return;
    case "checkout.session.async_payment_failed":
      await handleCheckoutFailed(event.data.object as Stripe.Checkout.Session);
      return;
    case "checkout.session.expired":
      await handleCheckoutExpired(event.data.object as Stripe.Checkout.Session);
      return;
    case "charge.refunded":
      await handleChargeRefunded(event.data.object as Stripe.Charge);
      return;
    case "refund.created":
      await handleRefundCreated(event.data.object as Stripe.Refund);
      return;
    case "payment_intent.payment_failed":
      return;
    case "account.updated":
      await handleAccountUpdated(event.data.object as Stripe.Account);
      return;
    default:
      return;
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  if (session.payment_status !== "paid" && session.payment_status !== "no_payment_required") {
    return;
  }

  const supabase = createAdminClient();

  const contractId = session.metadata?.contract_id;
  const { applicationId, serviceOrderId, sourceType } = resolvePaymentSource(session);
  const milestoneIdsJson = session.metadata?.milestone_ids;

  if (!contractId) {
    throw new Error("Missing contract metadata in Stripe checkout session.");
  }

  if (
    !isUuid(contractId)
    || (applicationId && !isUuid(applicationId))
    || (serviceOrderId && !isUuid(serviceOrderId))
  ) {
    throw new Error("Invalid UUID metadata in Stripe checkout session.");
  }

  const { data: pay, error: paymentStatusError } = await supabase
    .from("payments")
    .select("status")
    .eq("stripe_session_id", session.id)
    .maybeSingle();

  if (paymentStatusError) {
    await failStripeProcessor({
      source: "stripe.event_processor.payment_state_lookup_failed",
      publicMessage: "Failed to load Stripe payment state.",
      error: paymentStatusError,
      stripeSessionId: session.id,
      contractId,
    });
  }

  if (pay?.status === "completed") {
    return;
  }

  const { data: contractData, error: contractError } = await supabase
    .from("contracts")
    .select("company_id, source_type, application_id, service_order_id, commission_rate, student_id, applications!contracts_application_id_fkey(offers(tytul))")
    .eq("id", contractId)
    .maybeSingle();

  if (contractError) {
    await failStripeProcessor({
      source: "stripe.event_processor.contract_lookup_failed",
      publicMessage: "Failed to load contract for Stripe checkout session.",
      error: contractError,
      stripeSessionId: session.id,
      contractId,
    });
  }

  const contract = contractData as PaymentContractRow | null;
  assertSourceMatchesContract({ applicationId, serviceOrderId, sourceType }, contract);

  if (applicationId && contract?.company_id) {
    const { data: targetApplicationData, error: targetApplicationError } = await supabase
      .from("applications")
      .select("id, offer_id, offers!inner(tytul)")
      .eq("id", applicationId)
      .single();

    if (targetApplicationError || !targetApplicationData) {
      await failStripeProcessor({
        source: "stripe.event_processor.application_lookup_failed",
        publicMessage: "Failed to load application for Stripe checkout session.",
        error: targetApplicationError ?? new Error("Missing application for paid Stripe checkout session."),
        stripeSessionId: session.id,
        contractId,
        context: {
          applicationId,
        },
      });
    }

    const targetApplication = targetApplicationData as TargetApplicationRow;
    const offerDetails = Array.isArray(targetApplication.offers)
      ? targetApplication.offers[0]
      : targetApplication.offers;

    const rejectedApplications = await rejectCompetingApplicationsForOffer(supabase, {
      offerId: targetApplication.offer_id,
      acceptedApplicationId: applicationId,
      companyId: contract.company_id,
      senderId: session.metadata?.user_id || contract.company_id,
      content: "Niestety tym razem firma wybrała kogoś innego.",
      statuses: ["sent", "countered", "accepted"],
      cancelContracts: true,
    });

    for (const rejectedApplication of rejectedApplications) {
      await trySendNotification(rejectedApplication.studentId, "offer_closed", {
        offer_id: targetApplication.offer_id,
        offer_title: offerDetails?.tytul ?? "Oferta",
        reason: "accepted_other",
        conversation_id: rejectedApplication.conversationId,
      });
    }
  }

  const commissionRate = resolveCommissionRate({
    explicitRate: contract?.commission_rate ?? (session.metadata?.commission_rate ? Number(session.metadata.commission_rate) : null),
    sourceType,
    isPlatformService: Boolean(serviceOrderId),
  });
  const resolvedFeePln = resolveFeePln(session);

  const milestoneIds = parseMilestoneIdsMetadata(milestoneIdsJson);

  const { error: rpcError } = await supabase.rpc("process_stripe_payment_v4", {
    p_session_id: session.id,
    p_payment_intent_id: session.payment_intent as string,
    p_contract_id: contractId,
    p_application_id: applicationId || null,
    p_service_order_id: serviceOrderId || null,
    p_amount_pln: session.amount_total ? session.amount_total / 100 : 0,
    p_fee_pln: resolvedFeePln,
    p_milestone_ids: milestoneIds,
    p_user_id: session.metadata?.user_id || null,
  });

  if (rpcError) {
    await failStripeProcessor({
      source: "stripe.event_processor.payment_rpc_failed",
      publicMessage: "Failed to process Stripe payment atomically.",
      error: rpcError,
      stripeSessionId: session.id,
      contractId,
      context: {
        sourceType,
        applicationId,
        serviceOrderId,
      },
    });
  }

  if (serviceOrderId) {
    const { error: serviceOrderSyncError } = await supabase
      .from("service_orders")
      .update({ status: "in_progress" })
      .eq("id", serviceOrderId)
      .in("status", [
        "accepted",
        "active",
        "pending",
        "proposal_sent",
        "pending_confirmation",
        "pending_student_confirmation",
      ]);

    if (serviceOrderSyncError) {
      await failStripeProcessor({
        source: "stripe.event_processor.service_order_sync_failed",
        publicMessage: "Failed to sync service order after Stripe payment.",
        error: serviceOrderSyncError,
        stripeSessionId: session.id,
        contractId,
        context: {
          serviceOrderId,
        },
      });
    }
  }

  try {
    await supabase.rpc("_audit", {
      p_entity: "contract",
      p_entity_id: contractId,
      p_action: "funded_via_stripe",
      p_payload: { session_id: session.id, commission_rate: commissionRate },
      p_actor: session.metadata?.user_id || null,
    });
  } catch {
    // ignore audit failures
  }

  const applications = Array.isArray(contract?.applications)
    ? contract?.applications[0] ?? null
    : contract?.applications ?? null;
  const offerTitle = applications?.offers?.tytul || "Zlecenie";

  if (contract?.student_id) {
    await trySendNotification(contract.student_id, "contract_funded", {
      contract_id: contractId,
      application_id: applicationId,
      offer_title: offerTitle,
    });
  }

  // Company invoices are created after FINAL_STAGE_ACCEPTED_BY_COMPANY, not when escrow is funded.
}

async function handleCheckoutExpired(session: Stripe.Checkout.Session) {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("payments")
    .update({ status: "expired" })
    .eq("stripe_session_id", session.id);

  if (error) {
    await failStripeProcessor({
      source: "stripe.event_processor.payment_expire_failed",
      publicMessage: "Failed to mark Stripe payment as expired.",
      error,
      stripeSessionId: session.id,
    });
  }
}

async function handleCheckoutFailed(session: Stripe.Checkout.Session) {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("payments")
    .update({ status: "failed" })
    .eq("stripe_session_id", session.id)
    .neq("status", "completed");

  if (error) {
    await failStripeProcessor({
      source: "stripe.event_processor.payment_failed_update_failed",
      publicMessage: "Failed to mark Stripe payment as failed.",
      error,
      stripeSessionId: session.id,
    });
  }
}

async function handleChargeRefunded(charge: Stripe.Charge) {
  const supabase = createAdminClient();
  const paymentIntentId = typeof charge.payment_intent === "string" ? charge.payment_intent : charge.payment_intent?.id;
  if (!paymentIntentId) return;

  const { data: payment, error: paymentError } = await supabase
    .from("payments")
    .select("contract_id")
    .eq("stripe_payment_intent_id", paymentIntentId)
    .maybeSingle();

  if (paymentError) {
    await failStripeProcessor({
      source: "stripe.event_processor.refund_payment_lookup_failed",
      publicMessage: "Failed to load payment for Stripe charge refund.",
      error: paymentError,
      context: {
        chargeId: charge.id,
        paymentIntentId,
      },
    });
  }

  if (!payment) return;

  for (const refund of charge.refunds?.data || []) {
    const { error: refundError } = await supabase.rpc("process_stripe_refund_v4", {
      p_payment_intent_id: paymentIntentId,
      p_charge_id: charge.id,
      p_refund_id: refund.id,
      p_refund_amount_delta_pln: refund.amount / 100,
      p_currency: (charge.currency || "PLN").toUpperCase(),
      p_reason: refund.reason || null,
    });

    if (refundError) {
      await failStripeProcessor({
        source: "stripe.event_processor.charge_refund_rpc_failed",
        publicMessage: "Failed to process Stripe charge refund.",
        error: refundError,
        context: {
          chargeId: charge.id,
          refundId: refund.id,
          paymentIntentId,
        },
      });
    }
  }
}

async function handleRefundCreated(refund: Stripe.Refund) {
  const supabase = createAdminClient();
  const paymentIntentId = typeof refund.payment_intent === "string" ? refund.payment_intent : refund.payment_intent?.id;
  const chargeId = typeof refund.charge === "string" ? refund.charge : refund.charge?.id;

  if (!paymentIntentId || !chargeId) return;

  const { error } = await supabase.rpc("process_stripe_refund_v4", {
    p_payment_intent_id: paymentIntentId,
    p_charge_id: chargeId,
    p_refund_id: refund.id,
    p_refund_amount_delta_pln: refund.amount / 100,
    p_currency: (refund.currency || "PLN").toUpperCase(),
    p_reason: refund.reason || null,
  });

  if (error) {
    await failStripeProcessor({
      source: "stripe.event_processor.refund_rpc_failed",
      publicMessage: "Failed to process Stripe refund.",
      error,
      context: {
        refundId: refund.id,
        paymentIntentId,
        chargeId,
      },
    });
  }
}

async function handleAccountUpdated(account: Stripe.Account) {
  const supabase = createAdminClient();
  const metadataUserId = normalizeMetadataId(account.metadata?.user_id);
  const transfersCapability = account.capabilities?.transfers;
  const onboardingComplete = Boolean(
    account.details_submitted
    && account.payouts_enabled
    && transfersCapability === "active",
  );

  const payload = {
    stripe_account_id: account.id,
    stripe_onboarding_completed_at: onboardingComplete ? new Date().toISOString() : null,
  };

  const query = supabase.from("student_profiles").update(payload);
  const { error } = metadataUserId && isUuid(metadataUserId)
    ? await query.eq("user_id", metadataUserId)
    : await query.eq("stripe_account_id", account.id);

  if (error) {
    await failStripeProcessor({
      source: "stripe.event_processor.account_sync_failed",
      publicMessage: "Failed to sync Stripe account status.",
      error,
      context: {
        stripeAccountId: account.id,
        metadataUserId,
      },
    });
  }
}
