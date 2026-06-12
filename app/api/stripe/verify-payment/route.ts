import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStripe } from "@/lib/stripe";
import { resolveCommissionRate } from "@/lib/commission";
import { trySendNotification } from "@/lib/notifications/server";
import { rejectCompetingApplicationsForOffer } from "@/lib/services/application-chat-closure";
import Stripe from "stripe";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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
    throw new Error("Sesja platnosci musi dotyczyc dokladnie jednego typu zlecenia");
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
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { session_id } = body;

    if (!session_id) {
      return NextResponse.json({ error: "Missing session_id" }, { status: 400 });
    }

    const session = await getStripe().checkout.sessions.retrieve(session_id);
    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    const contractId = session.metadata?.contract_id;
    let source: PaymentSource;
    try {
      source = resolvePaymentSource(session);
    } catch {
      return NextResponse.json({ error: "Invalid session metadata" }, { status: 400 });
    }
    const { applicationId, serviceOrderId, sourceType } = source;
    const milestoneIdsJson = session.metadata?.milestone_ids;

    if (!contractId) {
      return NextResponse.json({ error: "Invalid session metadata" }, { status: 400 });
    }

    if (
      !UUID_RE.test(contractId)
      || (applicationId && !UUID_RE.test(applicationId))
      || (serviceOrderId && !UUID_RE.test(serviceOrderId))
    ) {
      return NextResponse.json({ error: "Nieprawidlowe ID w metadanych sesji" }, { status: 400 });
    }

    const { data: contract } = await supabase
      .from("contracts")
      .select("id, company_id, status, commission_rate, source_type, application_id, service_order_id")
      .eq("id", contractId)
      .single();

    const typedContract = contract as PaymentContractRow | null;

    if (!typedContract || typedContract.company_id !== user.id) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    if (!sourceMatchesContract({ applicationId, serviceOrderId, sourceType }, typedContract)) {
      return NextResponse.json({ error: "Nieprawidlowe powiazanie sesji z kontraktem" }, { status: 400 });
    }

    if (typedContract.status === "active") {
      return NextResponse.json({
        status: "already_processed",
        message: "Payment already processed",
      });
    }

    if (session.payment_status !== "paid") {
      return NextResponse.json({
        status: "not_paid",
        payment_status: session.payment_status,
        message: "Payment not yet completed",
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
        throw new Error(targetApplicationError?.message ?? "Nie znaleziono aplikacji dla sesji płatności");
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
        milestoneIds = JSON.parse(milestoneIdsJson);
      } catch {
        console.error("[verify-payment] Failed to parse milestone_ids:", milestoneIdsJson);
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
      console.error("[verify-payment] RPC Error processing payment:", rpcError);
      throw new Error(`Failed to process payment atomically: ${rpcError.message}`);
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
        throw new Error(`Nie udalo sie zaktualizowac statusu zamowienia: ${serviceOrderSyncError.message}`);
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
      console.error("[verify-payment] Failed to send notification:", error);
    }

    return NextResponse.json({
      status: "success",
      message: "Payment verified and contract activated",
    });
  } catch (error: unknown) {
    console.error("[verify-payment] Error:", error);
    return NextResponse.json(
      { error: "Nie udalo sie zweryfikowac platnosci. Sprobuj ponownie za chwile." },
      { status: 500 },
    );
  }
}
