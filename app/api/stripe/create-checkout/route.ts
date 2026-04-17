import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getStripe, calculatePlatformFee } from "@/lib/stripe";
import { resolveCommissionRate } from "@/lib/commission";
import { buildRateLimitKey, enforceRateLimit, getRequestIp } from "@/lib/rate-limit";

export const maxDuration = 10;

type ContractRow = {
  id: string;
  company_id: string;
  application_id: string | null;
  total_amount: number | null;
  commission_rate: number | null;
  status: string | null;
  terms_status: string | null;
  company_contract_accepted_at: string | null;
  student_contract_accepted_at: string | null;
  milestones: { id: string; title: string }[] | null;
};

type ExistingPaymentRow = {
  stripe_session_id: string;
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

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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

    const body = await req.json();
    const { contractId, applicationId, serviceOrderId } = body;

    if (!contractId || (!applicationId && !serviceOrderId)) {
      return NextResponse.json(
        { error: "Missing required fields: contractId, and either applicationId or serviceOrderId" },
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
      .select("id, company_id, application_id, total_amount, commission_rate, status, terms_status, company_contract_accepted_at, student_contract_accepted_at, milestones(id, title, amount, status)")
      .eq("id", contractId)
      .single();
    const contract = contractData as ContractRow | null;

    if (contractError || !contract) {
      return NextResponse.json({ error: "Contract not found" }, { status: 404 });
    }

    if (contract.company_id !== user.id) {
      return NextResponse.json({ error: "Not authorized to fund this contract" }, { status: 403 });
    }

    if (applicationId && contract.application_id && contract.application_id !== applicationId) {
      return NextResponse.json(
        { error: "Nieprawidlowe powiazanie aplikacji z kontraktem" },
        { status: 400 },
      );
    }

    if (serviceOrderId) {
      const { data: serviceOrder } = await supabase
        .from("service_orders")
        .select("id, contract_id")
        .eq("id", serviceOrderId)
        .single();

      if (!serviceOrder || serviceOrder.contract_id !== contractId) {
        return NextResponse.json(
          { error: "Nieprawidlowe powiazanie Service Order z kontraktem" },
          { status: 400 },
        );
      }
    }

    if (contract.terms_status !== "agreed") {
      return NextResponse.json({ error: "Contract terms not yet agreed" }, { status: 400 });
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

    if (!isPlatformService && (!contract.company_contract_accepted_at || !contract.student_contract_accepted_at)) {
      return NextResponse.json(
        { error: "Obie strony musza zaakceptowac umowe przed platnoscia" },
        { status: 400 },
      );
    }

    const allowedStatuses = ["awaiting_funding", "draft"];
    if (!allowedStatuses.includes(contract.status as string)) {
      return NextResponse.json({ error: "Contract already funded or in invalid state" }, { status: 400 });
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

    const milestones = (contract.milestones || []) as { id: string; title: string }[];
    const milestoneIds = milestones.map((milestone) => milestone.id);
    const milestoneTitles = milestones.map((milestone) => milestone.title).join(", ");

    const parsedAmount = Number(contract.total_amount);
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      return NextResponse.json({ error: "Nieprawidlowa kwota kontraktu w bazie" }, { status: 400 });
    }

    if (parsedAmount > 500_000) {
      return NextResponse.json({ error: "Kwota kontraktu przekracza dozwolony limit" }, { status: 400 });
    }

    const amountInGrosze = Math.round(parsedAmount * 100);
    const commissionRate = resolveCommissionRate({
      explicitRate: contract.commission_rate ?? sourceCommissionRate,
      sourceType: serviceOrderId ? "service_order" : "application",
      offerType,
      isPlatformService,
    });
    const platformFee = calculatePlatformFee(amountInGrosze, commissionRate);

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL
      || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null)
      || `${req.nextUrl.protocol}//${req.headers.get("host")}`;

    if (!baseUrl) {
      console.error("Could not determine base URL");
      return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
    }

    const successUrl = `${baseUrl}/app/deliverables/${applicationId || serviceOrderId}?payment=success&session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${baseUrl}/app/deliverables/${applicationId || serviceOrderId}?payment=cancelled`;

    const session = await getStripe().checkout.sessions.create({
      payment_method_types: ["card", "p24", "blik"],
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "pln",
            product_data: {
              name: `Escrow: ${offerTitle}`,
              description: milestoneTitles ? `Etapy: ${milestoneTitles}` : "Zasilenie depozytu",
            },
            unit_amount: amountInGrosze,
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
      amount_total: amountInGrosze,
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
    const msg = error instanceof Error ? error.message : "Failed to create checkout session";
    console.error("Stripe checkout error:", error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
