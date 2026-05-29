import Stripe from "stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateCompanyInvoice } from "@/lib/pdf/generate-invoice";
import { resolveCommissionRate } from "@/lib/commission";
import { trySendNotification } from "@/lib/notifications/server";

type StripeEventRow = {
  id: string;
  stripe_event_id: string;
  event_type: string;
  payload: Stripe.Event;
  retry_count: number;
};

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type PaymentSource = {
  applicationId: string | null;
  serviceOrderId: string | null;
  sourceType: "application" | "service_order";
};

type PaymentContractRow = {
  source_type?: "application" | "service_order" | null;
  application_id?: string | null;
  service_order_id?: string | null;
  commission_rate?: number | null;
  student_id?: string | null;
  applications?: { offers?: { tytul?: string | null } | null } | { offers?: { tytul?: string | null } | null }[] | null;
};

function normalizeMetadataId(value: string | null | undefined): string | null {
  return value && value.trim().length > 0 ? value.trim() : null;
}

function resolvePaymentSource(session: Stripe.Checkout.Session): PaymentSource {
  const applicationId = normalizeMetadataId(session.metadata?.application_id);
  const serviceOrderId = normalizeMetadataId(session.metadata?.service_order_id);
  const selectedSourceCount = Number(Boolean(applicationId)) + Number(Boolean(serviceOrderId));

  if (selectedSourceCount !== 1) {
    throw new Error(`Checkout session ${session.id} must reference exactly one payment source`);
  }

  return {
    applicationId,
    serviceOrderId,
    sourceType: applicationId ? "application" : "service_order",
  };
}

function assertSourceMatchesContract(sessionId: string, source: PaymentSource, contract: PaymentContractRow | null): void {
  if (!contract) {
    throw new Error(`Contract not found for checkout session ${sessionId}`);
  }

  const contractSourceType = contract.source_type ?? (contract.service_order_id ? "service_order" : "application");
  if (source.sourceType === "application") {
    if (
      contractSourceType !== "application"
      || contract.application_id !== source.applicationId
      || contract.service_order_id !== null
    ) {
      throw new Error(`Checkout session ${sessionId} application metadata does not match contract source`);
    }
    return;
  }

  if (
    contractSourceType !== "service_order"
    || contract.service_order_id !== source.serviceOrderId
    || contract.application_id !== null
  ) {
    throw new Error(`Checkout session ${sessionId} service order metadata does not match contract source`);
  }
}

function resolveFeePln(session: Stripe.Checkout.Session): number {
  const raw = session.metadata?.platform_fee;
  if (!raw) {
    throw new Error(`Missing platform_fee metadata for session ${session.id}`);
  }

  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new Error(`Invalid platform_fee metadata for session ${session.id}: ${raw}`);
  }

  return parsed / 100;
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

  throw new Error(`Failed to enqueue stripe event ${event.id}: ${error.message}`);
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
    throw new Error(`Failed to load stripe event queue: ${error.message}`);
  }

  const rows = (data ?? []) as StripeEventRow[];

  let processed = 0;
  let failed = 0;
  let skipped = 0;

  for (const row of rows) {
    const payload = row.payload;
    if (!payload || typeof payload !== "object" || typeof payload.type !== "string") {
      skipped += 1;
      await supabase
        .from("stripe_events")
        .update({
          retry_count: row.retry_count + 1,
          processing_error: "Invalid event payload",
          last_attempt_at: new Date().toISOString(),
        })
        .eq("id", row.id);
      continue;
    }

    try {
      await processStripeEvent(payload);
      processed += 1;

      await supabase
        .from("stripe_events")
        .update({
          processed_at: new Date().toISOString(),
          processing_error: null,
          last_attempt_at: new Date().toISOString(),
        })
        .eq("id", row.id);
    } catch (error) {
      failed += 1;
      const message = error instanceof Error ? error.message : "Unknown processing error";

      await supabase
        .from("stripe_events")
        .update({
          retry_count: row.retry_count + 1,
          processing_error: message,
          last_attempt_at: new Date().toISOString(),
        })
        .eq("id", row.id);
    }
  }

  return { processed, failed, skipped };
}

async function processStripeEvent(event: Stripe.Event) {
  switch (event.type) {
    case "checkout.session.completed":
      await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
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
  const supabase = createAdminClient();

  const contractId = session.metadata?.contract_id;
  const { applicationId, serviceOrderId, sourceType } = resolvePaymentSource(session);
  const milestoneIdsJson = session.metadata?.milestone_ids;

  if (!contractId) {
    throw new Error(`Missing metadata in checkout session: ${session.id}`);
  }

  if (
    !UUID_RE.test(contractId)
    || (applicationId && !UUID_RE.test(applicationId))
    || (serviceOrderId && !UUID_RE.test(serviceOrderId))
  ) {
    throw new Error(`Invalid UUID in session metadata for session ${session.id}`);
  }

  const { data: pay, error: paymentStatusError } = await supabase
    .from("payments")
    .select("status")
    .eq("stripe_session_id", session.id)
    .maybeSingle();

  if (paymentStatusError) {
    throw new Error(`Failed to load payment state for session ${session.id}: ${paymentStatusError.message}`);
  }

  if (pay?.status === "completed") {
    return;
  }

  const { data: contractData, error: contractError } = await supabase
    .from("contracts")
    .select("source_type, application_id, service_order_id, commission_rate, student_id, applications!contracts_application_id_fkey(offers(tytul))")
    .eq("id", contractId)
    .maybeSingle();

  if (contractError) {
    throw new Error(`Failed to load contract ${contractId}: ${contractError.message}`);
  }

  const contract = contractData as PaymentContractRow | null;
  assertSourceMatchesContract(session.id, { applicationId, serviceOrderId, sourceType }, contract);

  const commissionRate = resolveCommissionRate({
    explicitRate: contract?.commission_rate ?? (session.metadata?.commission_rate ? Number(session.metadata.commission_rate) : null),
    sourceType,
    isPlatformService: Boolean(serviceOrderId),
  });
  const resolvedFeePln = resolveFeePln(session);

  let milestoneIds: string[] = [];
  if (milestoneIdsJson) {
    try {
      milestoneIds = JSON.parse(milestoneIdsJson);
    } catch {
      milestoneIds = [];
    }
  }

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
    throw new Error(`RPC process_stripe_payment_v4 failed: ${rpcError.message}`);
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
      throw new Error(`Failed to sync service order after payment: ${serviceOrderSyncError.message}`);
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

  try {
    const amountPLN = session.amount_total ? session.amount_total / 100 : 0;
    await generateCompanyInvoice(contractId, amountPLN, resolvedFeePln, "Stripe");
  } catch (error) {
    console.error("Invoice generation failed:", error);
  }
}

async function handleCheckoutExpired(session: Stripe.Checkout.Session) {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("payments")
    .update({ status: "expired" })
    .eq("stripe_session_id", session.id);

  if (error) {
    throw new Error(`Failed to mark payment as expired (${session.id}): ${error.message}`);
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
    throw new Error(`Failed to find payment for charge ${charge.id}: ${paymentError.message}`);
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
      throw new Error(`Failed to process charge refund ${refund.id}: ${refundError.message}`);
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
    throw new Error(`Failed to process refund ${refund.id}: ${error.message}`);
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
  const { error } = metadataUserId && UUID_RE.test(metadataUserId)
    ? await query.eq("user_id", metadataUserId)
    : await query.eq("stripe_account_id", account.id);

  if (error) {
    throw new Error(`Failed to sync Stripe account ${account.id}: ${error.message}`);
  }
}
