import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { resolveServerAppUrl } from "@/lib/app-url";
import { getStripe, calculatePlatformFee } from "@/lib/stripe";
import { checkPayoutAccountReadiness } from "@/lib/stripe/connect-readiness";
import { resolveCommissionRate } from "@/lib/commission";
import { buildRateLimitKey, enforceRateLimit, getRequestIp } from "@/lib/rate-limit";

export const maxDuration = 10;

type ContractRow = {
  id: string;
  company_id: string;
  application_id: string | null;
  service_order_id: string | null;
  source_type: "application" | "service_order" | null;
  student_id: string | null;
  total_amount: number | null;
  commission_rate: number | null;
  funding_mode?: "full" | "sequential" | null;
  status: string | null;
  terms_status: string | null;
  company_contract_accepted_at: string | null;
  student_contract_accepted_at: string | null;
  milestones: MilestoneRow[] | null;
};

type ExistingPaymentRow = {
  stripe_session_id: string;
};

type MilestoneRow = {
  id: string;
  title: string | null;
  amount: number | string | null;
  amount_minor?: number | string | null;
  status: string | null;
};

type ContractDocumentRow = {
  document_type: "contract_a" | "contract_b" | string;
  company_accepted_at: string | null;
  student_accepted_at: string | null;
};

type StudentPayoutReadinessRow = {
  stripe_account_id: string | null;
};

type ApplicationInfo = {
  offers: {
    tytul: string | null;
    is_platform_service: boolean | null;
    typ?: string | null;
    commission_rate?: number | null;
  } | null;
};

type ServiceOrderInfo = {
  title: string | null;
  package_id?: string | null;
};

type ServicePackageInfo = {
  commission_rate?: number | null;
};

type CheckoutRequestBody = {
  contractId?: unknown;
  applicationId?: unknown;
  serviceOrderId?: unknown;
};

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function optionalStringId(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function milestoneAmountMinor(milestone: MilestoneRow): number | null {
  if (milestone.amount_minor != null) {
    const amountMinor = Number(milestone.amount_minor);
    return Number.isFinite(amountMinor) && amountMinor > 0 ? Math.round(amountMinor) : null;
  }

  const amount = Number(milestone.amount);
  return Number.isFinite(amount) && amount > 0 ? Math.round(amount * 100) : null;
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const ip = getRequestIp(req);
    const limitResult = await enforceRateLimit(
      "checkout",
      buildRateLimitKey(["checkout", user.id, ip]),
    );
    if (!limitResult.success) {
      return NextResponse.json(
        { error: "Zbyt wiele prob utworzenia platnosci. Sprobuj ponownie za chwile." },
        {
          status: 429,
          headers: {
            "Retry-After": String(Math.max(Math.ceil((limitResult.reset - Date.now()) / 1000), 1)),
          },
        },
      );
    }

    const body = await req.json() as CheckoutRequestBody;
    const contractId = optionalStringId(body.contractId);
    const applicationId = optionalStringId(body.applicationId);
    const serviceOrderId = optionalStringId(body.serviceOrderId);

    const selectedSourceCount = Number(Boolean(applicationId)) + Number(Boolean(serviceOrderId));
    if (!contractId || selectedSourceCount !== 1) {
      return NextResponse.json(
        { error: "Platnosc musi dotyczyc dokladnie jednego typu zlecenia" },
        { status: 400 },
      );
    }

    if (
      !UUID_RE.test(contractId)
      || (applicationId && !UUID_RE.test(applicationId))
      || (serviceOrderId && !UUID_RE.test(serviceOrderId))
    ) {
      return NextResponse.json({ error: "Nieprawidlowe ID" }, { status: 400 });
    }

    const { data: contractData, error: contractError } = await supabase
      .from("contracts")
      .select("id, company_id, student_id, application_id, service_order_id, source_type, total_amount, commission_rate, funding_mode, status, terms_status, company_contract_accepted_at, student_contract_accepted_at, milestones(id, title, amount, amount_minor, status)")
      .eq("id", contractId)
      .single();
    const contract = contractData as ContractRow | null;

    if (contractError || !contract) {
      return NextResponse.json({ error: "Nie znaleziono umowy." }, { status: 404 });
    }

    if (contract.company_id !== user.id) {
      return NextResponse.json({ error: "Nie masz uprawnien do tej platnosci." }, { status: 403 });
    }

    const contractSourceType = contract.source_type ?? (contract.service_order_id ? "service_order" : "application");

    if (applicationId && (
      contractSourceType !== "application"
      || contract.application_id !== applicationId
      || contract.service_order_id !== null
    )) {
      return NextResponse.json(
        { error: "Nieprawidlowe powiazanie aplikacji z kontraktem" },
        { status: 400 },
      );
    }

    if (serviceOrderId && (
      contractSourceType !== "service_order"
      || contract.service_order_id !== serviceOrderId
      || contract.application_id !== null
    )) {
      return NextResponse.json(
        { error: "Nieprawidlowe powiazanie Service Order z kontraktem" },
        { status: 400 },
      );
    }

    if (serviceOrderId) {
      const { data: serviceOrder } = await supabase
        .from("service_orders")
        .select("id, contract_id, company_id")
        .eq("id", serviceOrderId)
        .single();

      if (!serviceOrder || serviceOrder.contract_id !== contractId || serviceOrder.company_id !== user.id) {
        return NextResponse.json(
          { error: "Nieprawidlowe powiazanie Service Order z kontraktem" },
          { status: 400 },
        );
      }
    }

    if (contract.terms_status !== "agreed") {
      return NextResponse.json({ error: "Najpierw zaakceptujcie zakres i etapy zlecenia." }, { status: 400 });
    }

    let offerTitle = "Zlecenie";
    let isPlatformService = false;
    let offerType: string | null = null;
    let sourceCommissionRate: number | null = null;

    if (applicationId) {
      const { data: application } = await supabase
        .from("applications")
        .select("offers(tytul, is_platform_service, typ, commission_rate)")
        .eq("id", applicationId)
        .single();
      const applicationTyped = application as ApplicationInfo | null;

      offerTitle = applicationTyped?.offers?.tytul || "Zlecenie";
      isPlatformService = applicationTyped?.offers?.is_platform_service === true;
      offerType = applicationTyped?.offers?.typ ?? null;
      sourceCommissionRate = applicationTyped?.offers?.commission_rate ?? null;
    } else if (serviceOrderId) {
      const { data: serviceOrderData } = await supabase
        .from("service_orders")
        .select("title, package_id")
        .eq("id", serviceOrderId)
        .single();
      const serviceOrder = serviceOrderData as ServiceOrderInfo | null;

      offerTitle = serviceOrder?.title || "Usluga serwisowa";
      isPlatformService = true;

      if (serviceOrder?.package_id) {
        const { data: servicePackageData } = await supabase
          .from("service_packages")
          .select("commission_rate")
          .eq("id", serviceOrder.package_id)
          .maybeSingle();
        const servicePackage = servicePackageData as ServicePackageInfo | null;
        sourceCommissionRate = servicePackage?.commission_rate ?? null;
      }
    }

    const milestones = (contract.milestones || []) as MilestoneRow[];
    if (milestones.length === 0) {
      return NextResponse.json(
        { error: "Nie mozna zasilic depozytu przed ustaleniem etapow." },
        { status: 400 },
      );
    }

    if (!contract.company_contract_accepted_at || !contract.student_contract_accepted_at) {
      return NextResponse.json(
        { error: "Obie strony musza zaakceptowac umowe przed platnoscia" },
        { status: 400 },
      );
    }

    const { data: contractDocumentsData, error: contractDocumentsError } = await supabase
      .from("contract_documents")
      .select("document_type, company_accepted_at, student_accepted_at")
      .eq("contract_id", contractId)
      .in("document_type", ["contract_a", "contract_b"]);

    if (contractDocumentsError) {
      return NextResponse.json(
        { error: "Nie udalo sie sprawdzic akceptacji umow." },
        { status: 500 },
      );
    }

    const contractDocuments = (contractDocumentsData ?? []) as ContractDocumentRow[];
    const contractA = contractDocuments.find((document) => document.document_type === "contract_a");
    const contractB = contractDocuments.find((document) => document.document_type === "contract_b");

    if (!contractA?.company_accepted_at || !contractB?.student_accepted_at) {
      return NextResponse.json(
        { error: "Najpierw wygenerujcie i zaakceptujcie wlasciwe umowy." },
        { status: 400 },
      );
    }

    if (process.env.STRIPE_PAYOUTS_ENABLED === "true") {
      if (!contract.student_id) {
        return NextResponse.json(
          { error: "Nie mozna uruchomic platnosci bez przypisanego studenta." },
          { status: 409 },
        );
      }

      const admin = createAdminClient();
      const { data: studentPayoutProfile, error: studentPayoutError } = await admin
        .from("student_profiles")
        .select("stripe_account_id")
        .eq("user_id", contract.student_id)
        .maybeSingle();

      if (studentPayoutError) {
        return NextResponse.json(
          { error: "Nie udalo sie sprawdzic gotowosci konta wyplat studenta." },
          { status: 500 },
        );
      }

      const payoutProfile = studentPayoutProfile as StudentPayoutReadinessRow | null;
      if (!payoutProfile?.stripe_account_id) {
        return NextResponse.json(
          { error: "Student musi dokonczyc konto wyplat Stripe przed rozpoczeciem platnosci." },
          { status: 409 },
        );
      }

      const payoutReadiness = await checkPayoutAccountReadiness(payoutProfile.stripe_account_id);
      await admin
        .from("student_profiles")
        .update({
          stripe_onboarding_completed_at: payoutReadiness.ready ? new Date().toISOString() : null,
        })
        .eq("user_id", contract.student_id);

      if (!payoutReadiness.ready) {
        return NextResponse.json(
          { error: "Student musi dokonczyc konto wyplat Stripe przed rozpoczeciem platnosci." },
          { status: 409 },
        );
      }
    }

    const fundingMode = contract.funding_mode === "sequential" ? "sequential" : "full";
    const allowedStatuses = fundingMode === "sequential"
      ? ["awaiting_funding", "draft", "active"]
      : ["awaiting_funding", "draft"];
    if (!allowedStatuses.includes(contract.status as string)) {
      return NextResponse.json({ error: "Ta platnosc nie jest juz dostepna dla tego zlecenia." }, { status: 400 });
    }

    const { data: existingPaymentData, error: existingPaymentError } = await supabase
      .from("payments")
      .select("stripe_session_id")
      .eq("contract_id", contractId)
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    const existingPayment = existingPaymentData as ExistingPaymentRow | null;

    if (!existingPaymentError && existingPayment) {
      try {
        const existingSession = await getStripe().checkout.sessions.retrieve(existingPayment.stripe_session_id);
        if (existingSession && existingSession.status === "open") {
          return NextResponse.json({
            url: existingSession.url,
            sessionId: existingSession.id,
            reused: true,
          });
        }
      } catch (error) {
        console.warn("[checkout] Could not reuse existing session:", error);
      }
    }

    const parsedAmount = Number(contract.total_amount);
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      return NextResponse.json({ error: "Nieprawidlowa kwota kontraktu w bazie" }, { status: 400 });
    }

    const awaitingMilestones = milestones.filter((milestone) =>
      ["awaiting_funding", "draft"].includes(String(milestone.status)),
    );
    const payableMilestones = fundingMode === "sequential"
      ? awaitingMilestones.slice(0, 1)
      : (awaitingMilestones.length > 0 ? awaitingMilestones : milestones);

    if (payableMilestones.length === 0) {
      return NextResponse.json(
        { error: "Nie ma etapu, ktory mozna teraz zasilic depozytem." },
        { status: 400 },
      );
    }

    const milestoneIds = payableMilestones.map((milestone) => milestone.id);
    const milestoneTitles = payableMilestones.map((milestone) => milestone.title || "Etap").join(", ");
    const payableAmountInGrosze = fundingMode === "sequential"
      ? milestoneAmountMinor(payableMilestones[0])
      : Math.round(parsedAmount * 100);

    if (!payableAmountInGrosze || payableAmountInGrosze <= 0) {
      return NextResponse.json({ error: "Nieprawidlowa kwota etapu w bazie" }, { status: 400 });
    }

    const payableAmount = payableAmountInGrosze / 100;
    if (payableAmount > 500_000) {
      return NextResponse.json({ error: "Kwota kontraktu przekracza dozwolony limit" }, { status: 400 });
    }

    const commissionRate = resolveCommissionRate({
      explicitRate: contract.commission_rate ?? sourceCommissionRate,
      sourceType: serviceOrderId ? "service_order" : "application",
      offerType,
      isPlatformService,
    });
    const platformFee = calculatePlatformFee(payableAmountInGrosze, commissionRate);

    const baseUrl = resolveServerAppUrl(req);

    if (!baseUrl) {
      console.error("Could not determine base URL");
      return NextResponse.json({ error: "Konfiguracja aplikacji jest niekompletna." }, { status: 500 });
    }

    const sourceId = applicationId ?? serviceOrderId;
    const successUrl = `${baseUrl}/app/deliverables/${sourceId}?payment=success&session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${baseUrl}/app/deliverables/${sourceId}?payment=cancelled`;

    const session = await getStripe().checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "pln",
            product_data: {
              name: `Depozyt: ${offerTitle}`,
              description: milestoneTitles ? `Etapy: ${milestoneTitles}` : "Bezpieczna platnosc za zlecenie",
            },
            unit_amount: payableAmountInGrosze,
          },
          quantity: 1,
        },
      ],
      metadata: {
        contract_id: contractId,
        application_id: applicationId || "",
        service_order_id: serviceOrderId || "",
        milestone_ids: JSON.stringify(milestoneIds),
        platform_fee: platformFee.toString(),
        commission_rate: commissionRate.toString(),
        funding_mode: fundingMode,
        user_id: user.id,
      },
      success_url: successUrl,
      cancel_url: cancelUrl,
      locale: "pl",
      billing_address_collection: "auto",
      expires_at: Math.floor(Date.now() / 1000) + 30 * 60,
    });

    const { error: paymentError } = await supabase.from("payments").insert({
      contract_id: contractId,
      stripe_session_id: session.id,
      amount_total: payableAmountInGrosze,
      platform_fee: platformFee,
      status: "pending",
    });

    if (paymentError) {
      console.error("Failed to create payment record:", paymentError);
    }

    return NextResponse.json({
      url: session.url,
      sessionId: session.id,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Nie udalo sie przygotowac platnosci.";
    console.error("Stripe checkout error:", error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
