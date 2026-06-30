import { jsonError, noStoreJson } from "@/lib/security/api-response";
import { isUuid, uuidSchema } from "@/lib/security/validation";
import { NextRequest } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStripe } from "@/lib/stripe";
import { resolveCommissionRate } from "@/lib/commission";
import { trySendNotification } from "@/lib/notifications/server";
import { rejectCompetingApplicationsForOffer } from "@/lib/services/application-chat-closure";
import { rejectCrossSiteRequest } from "@/lib/security/request-origin";
import { logCriticalError } from "@/lib/observability/error-log";
import Stripe from "stripe";

const verifyPaymentRequestSchema = z.object({
  session_id: z.string().trim().min(1).max(255),
});
const milestoneIdsSchema = z.array(uuidSchema).max(100);

type PaymentSource = {
  applicationId: string | null;
  serviceOrderId: string | null;
  sourceType: "application" | "service_order";
};

type PaymentContractRow = {
  id: string;
  company_id: string;
  status: string | null;
  commission_rate: number | null;
  source_type: "application" | "service_order" | null;
  application_id: string | null;
  service_order_id: string | null;
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

function normalizeMetadataId(value: string | null | undefined): string | null {
  return value && value.trim().length > 0 ? value.trim() : null;
}

function resolvePaymentSource(session: Stripe.Checkout.Session): PaymentSource {
  const applicationId = normalizeMetadataId(session.metadata?.application_id);
  const serviceOrderId = normalizeMetadataId(session.metadata?.service_order_id);
  const selectedSourceCount = Number(Boolean(applicationId)) + Number(Boolean(serviceOrderId));

  if (selectedSourceCount !== 1) {
    throw new Error("Sesja płatności musi dotyczyć dokładnie jednego typu zlecenia.");
  }

  return {
    applicationId,
    serviceOrderId,
    sourceType: applicationId ? "application" : "service_order",
  };
}

function sourceMatchesContract(source: PaymentSource, contract: PaymentContractRow): boolean {
  const contractSourceType = contract.source_type ?? (contract.service_order_id ? "service_order" : "application");

  if (source.sourceType === "application") {
    return contractSourceType === "application"
      && contract.application_id === source.applicationId
      && contract.service_order_id === null;
  }

  return contractSourceType === "service_order"
    && contract.service_order_id === source.serviceOrderId
    && contract.application_id === null;
}

function resolveFeePln(
  session: Stripe.Checkout.Session,
  commissionRate: number,
): number {
  if (session.metadata?.platform_fee) {
    return Number(session.metadata.platform_fee) / 100;
  }

  const grossAmount = session.amount_total ? session.amount_total / 100 : 0;
  return Math.round(grossAmount * commissionRate * 100) / 100;
}

export async function POST(req: NextRequest) {
  let actorUserId: string | null = null;
  let currentContractId: string | null = null;
  let currentSessionId: string | null = null;
  let criticalErrorLogged = false;

  try {
    const crossSiteResponse = rejectCrossSiteRequest(req);
    if (crossSiteResponse) return crossSiteResponse;

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return jsonError("Musisz być zalogowany.", 401);
    }

    actorUserId = user.id;

    const rawBody = await req.json().catch(() => null);
    const parsedBody = verifyPaymentRequestSchema.safeParse(rawBody);
    if (!parsedBody.success) {
      return jsonError("Brak poprawnego identyfikatora sesji płatności.", 400);
    }

    const { session_id } = parsedBody.data;
    currentSessionId = session_id;
    const session = await getStripe().checkout.sessions.retrieve(session_id);
    if (!session) {
      return jsonError("Nie znaleziono sesji płatności.", 404);
    }

    const contractId = session.metadata?.contract_id;
    currentContractId = contractId ?? null;
    let source: PaymentSource;
    try {
      source = resolvePaymentSource(session);
    } catch {
      return jsonError("Nieprawidłowe dane sesji płatności.", 400);
    }
    const { applicationId, serviceOrderId, sourceType } = source;
    const milestoneIdsJson = session.metadata?.milestone_ids;

    if (!contractId) {
      return jsonError("Nieprawidłowe dane sesji płatności.", 400);
    }

    if (
      !isUuid(contractId)
      || (applicationId && !isUuid(applicationId))
      || (serviceOrderId && !isUuid(serviceOrderId))
    ) {
      return jsonError("Nieprawidłowe ID w metadanych sesji.", 400);
    }

    const { data: contract, error: contractLookupError } = await supabase
      .from("contracts")
      .select("id, company_id, status, commission_rate, source_type, application_id, service_order_id")
      .eq("id", contractId)
      .single();

    if (contractLookupError) {
      criticalErrorLogged = true;
      await logCriticalError({
        source: "stripe.verify_payment.contract_lookup_failed",
        error: contractLookupError,
        errorCode: contractLookupError.code,
        message: "Contract lookup failed while verifying Stripe Checkout payment.",
        contractId,
        stripeSessionId: session.id,
        userId: user.id,
      });
      throw new Error("Nie udało się sprawdzić kontraktu płatności.");
    }

    const typedContract = contract as PaymentContractRow | null;

    if (!typedContract || typedContract.company_id !== user.id) {
      return jsonError("Brak dostępu do tej płatności.", 403);
    }

    if (!sourceMatchesContract({ applicationId, serviceOrderId, sourceType }, typedContract)) {
      return jsonError("Nieprawidłowe powiązanie sesji z kontraktem.", 400);
    }

    if (typedContract.status === "active") {
      return noStoreJson({
        status: "already_processed",
        message: "Płatność została już przetworzona.",
      });
    }

    if (session.payment_status !== "paid") {
      return noStoreJson({
        status: "not_paid",
        payment_status: session.payment_status,
        message: "Płatność nie została jeszcze zakończona.",
      });
    }

    const admin = createAdminClient();

    if (applicationId) {
      const { data: targetApplicationData, error: targetApplicationError } = await admin
        .from("applications")
        .select("id, offer_id, offers!inner(tytul)")
        .eq("id", applicationId)
        .single();

      if (targetApplicationError || !targetApplicationData) {
        criticalErrorLogged = true;
        await logCriticalError({
          source: "stripe.verify_payment.application_lookup_failed",
          error: targetApplicationError ?? new Error("Missing application for Stripe payment session."),
          errorCode: targetApplicationError?.code,
          message: "Application lookup failed while verifying Stripe Checkout payment.",
          contractId,
          stripeSessionId: session.id,
          userId: user.id,
          context: {
            applicationId,
          },
        });
        throw new Error("Nie udało się sprawdzić aplikacji dla sesji płatności.");
      }

      const targetApplication = targetApplicationData as TargetApplicationRow;
      const offerDetails = Array.isArray(targetApplication.offers)
        ? targetApplication.offers[0]
        : targetApplication.offers;

      const rejectedApplications = await rejectCompetingApplicationsForOffer(admin, {
        offerId: targetApplication.offer_id,
        acceptedApplicationId: applicationId,
        companyId: typedContract.company_id,
        senderId: user.id,
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
      explicitRate: typedContract.commission_rate ?? (session.metadata?.commission_rate ? Number(session.metadata.commission_rate) : null),
      sourceType,
      isPlatformService: Boolean(serviceOrderId),
    });
    const resolvedFeePln = resolveFeePln(session, commissionRate);

    let milestoneIds: string[] = [];
    if (milestoneIdsJson) {
      try {
        const parsedMilestoneIds = milestoneIdsSchema.safeParse(JSON.parse(milestoneIdsJson));
        if (!parsedMilestoneIds.success) {
          return noStoreJson(
            { error: "Nieprawidłowe dane etapów w sesji płatności." },
            { status: 400 },
          );
        }

        milestoneIds = parsedMilestoneIds.data;
      } catch {
        return noStoreJson(
          { error: "Nieprawidłowe dane etapów w sesji płatności." },
          { status: 400 },
        );
      }
    }

    const { error: rpcError } = await admin.rpc("process_stripe_payment_v4", {
      p_session_id: session.id,
      p_payment_intent_id: session.payment_intent as string,
      p_contract_id: contractId,
      p_application_id: applicationId || null,
      p_service_order_id: serviceOrderId || null,
      p_amount_pln: session.amount_total ? session.amount_total / 100 : 0,
      p_fee_pln: resolvedFeePln,
      p_milestone_ids: milestoneIds,
      p_user_id: user.id,
    });

    if (rpcError) {
      criticalErrorLogged = true;
      await logCriticalError({
        source: "stripe.verify_payment.rpc_failed",
        error: rpcError,
        errorCode: rpcError.code,
        message: "process_stripe_payment_v4 failed while verifying Stripe Checkout payment.",
        contractId,
        stripeSessionId: session.id,
        userId: user.id,
        context: {
          sourceType,
          applicationId,
          serviceOrderId,
          amountMinor: session.amount_total ?? null,
        },
      });
      throw new Error("Nie udało się przetworzyć płatności atomowo.");
    }

    if (serviceOrderId) {
      const { error: serviceOrderSyncError } = await admin
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
        criticalErrorLogged = true;
        await logCriticalError({
          source: "stripe.verify_payment.service_order_sync_failed",
          error: serviceOrderSyncError,
          errorCode: serviceOrderSyncError.code,
          message: "Service order status sync failed after payment processing.",
          contractId,
          stripeSessionId: session.id,
          userId: user.id,
          context: {
            serviceOrderId,
          },
        });
        throw new Error("Nie udało się zaktualizować statusu zamówienia po płatności.");
      }
    }

    try {
      const { data: contractData } = await admin
        .from("contracts")
        .select("student_id")
        .eq("id", contractId)
        .single();

      if (contractData?.student_id) {
        await trySendNotification(contractData.student_id, "contract_funded", {
          contract_id: contractId,
          application_id: applicationId || null,
          service_order_id: serviceOrderId || null,
          amount: session.amount_total ? session.amount_total / 100 : 0,
        });
      }
    } catch (error) {
      await logCriticalError({
        source: "stripe.verify_payment.notification_failed",
        level: "warning",
        error,
        message: "Contract funded notification failed after payment verification.",
        contractId,
        stripeSessionId: session.id,
        userId: user.id,
      });
    }

    return noStoreJson({
      status: "success",
      message: "Płatność została potwierdzona, a kontrakt aktywowany.",
    });
  } catch (error: unknown) {
    if (!criticalErrorLogged) {
      await logCriticalError({
        source: "stripe.verify_payment.unexpected",
        error,
        message: "Unexpected error while verifying Stripe Checkout payment.",
        contractId: currentContractId,
        stripeSessionId: currentSessionId,
        userId: actorUserId,
      });
    }
    return noStoreJson(
      { error: "Nie udało się zweryfikować płatności. Spróbuj ponownie za chwilę." },
      { status: 500 },
    );
  }
}
