import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getStripe, calculatePlatformFee } from "@/lib/stripe";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();

    // Verify user is authenticated
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { contractId, applicationId, serviceOrderId } = body;

    if (!contractId || (!applicationId && !serviceOrderId)) {
      return NextResponse.json(
        { error: "Missing required fields: contractId, and either applicationId or serviceOrderId" },
        { status: 400 }
      );
    }

    // Walidacja UUID
    const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!UUID_RE.test(contractId) || (applicationId && !UUID_RE.test(applicationId)) || (serviceOrderId && !UUID_RE.test(serviceOrderId))) {
      return NextResponse.json({ error: "Nieprawidłowe ID" }, { status: 400 });
    }

    // Verify contract exists and user is the company
    const { data: contract, error: contractError } = await supabase
      .from("contracts")
      .select("id, company_id, student_id, application_id, total_amount, status, terms_status, company_contract_accepted_at, student_contract_accepted_at, milestones(id, title, amount, status)")
      .eq("id", contractId)
      .single();

    if (contractError || !contract) {
      return NextResponse.json({ error: "Contract not found" }, { status: 404 });
    }

    if (contract.company_id !== user.id) {
      return NextResponse.json({ error: "Not authorized to fund this contract" }, { status: 403 });
    }

    // P1: Twarda walidacja powiązania aplikacji lub service_order z kontraktem
    if (applicationId && contract.application_id !== applicationId) {
      return NextResponse.json({ error: "Nieprawidłowe powiązanie aplikacji z kontraktem" }, { status: 400 });
    }

    if (serviceOrderId) {
      const { data: serviceOrder } = await supabase
        .from("service_orders")
        .select("id, contract_id")
        .eq("id", serviceOrderId)
        .single();
      
      if (!serviceOrder || serviceOrder.contract_id !== contractId) {
        return NextResponse.json({ error: "Nieprawidłowe powiązanie Service Order z kontraktem" }, { status: 400 });
      }
    }

    if (contract.terms_status !== "agreed") {
      return NextResponse.json({ error: "Contract terms not yet agreed" }, { status: 400 });
    }

    // Get service/application info for description + platform service check
    let offerTitle = "Zlecenie";
    let isPlatformService = false;

    if (applicationId) {
      const { data: application } = await supabase
        .from("applications")
        .select("offers(tytul, is_platform_service)")
        .eq("id", applicationId)
        .single();
      const applicationTyped = application as unknown as { offers: { tytul: string, is_platform_service: boolean } };
      offerTitle = applicationTyped?.offers?.tytul || "Zlecenie";
      isPlatformService = applicationTyped?.offers?.is_platform_service === true;
    } else if (serviceOrderId) {
      const { data: serviceOrder } = await supabase
        .from("service_orders")
        .select("title")
        .eq("id", serviceOrderId)
        .single();
      offerTitle = serviceOrder?.title || "Usługa serwisowa";
      isPlatformService = true; // Service orders are treated as platform services (pre-funded/pre-agreed)
    }

    // Require both parties to accept contract documents before payment
    // Exception: platform services skip the signing step (contract is auto-agreed)
    if (!isPlatformService && (!contract.company_contract_accepted_at || !contract.student_contract_accepted_at)) {
      return NextResponse.json({ error: "Obie strony muszą zaakceptować umowę przed płatnością" }, { status: 400 });
    }

    const allowedStatuses = ["awaiting_funding", "draft"];
    if (!allowedStatuses.includes(contract.status as string)) {
      return NextResponse.json({ error: "Contract already funded or in invalid state" }, { status: 400 });
    }

    // Get milestone titles for description
    const milestones = (contract.milestones || []) as { id: string, title: string }[];
    const milestoneIds = milestones.map(m => m.id);
    const milestoneTitles = milestones.map(m => m.title).join(", ");

    // Kwota pochodzi wyłącznie z bazy — nigdy z żądania klienta (zabezpieczenie przed payment bypass)
    const parsedAmount = Number(contract.total_amount);
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      return NextResponse.json({ error: "Nieprawidłowa kwota kontraktu w bazie" }, { status: 400 });
    }
    if (parsedAmount > 500_000) {
      return NextResponse.json({ error: "Kwota kontraktu przekracza dozwolony limit" }, { status: 400 });
    }

    // Amount in grosze (PLN smallest unit)
    const amountInGrosze = Math.round(parsedAmount * 100);
    const platformFee = calculatePlatformFee(amountInGrosze);

    // Build success and cancel URLs
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL
      || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null)
      || `${req.nextUrl.protocol}//${req.headers.get('host')}`;
    if (!baseUrl) {
      console.error("Could not determine base URL");
      return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
    }
    const successUrl = `${baseUrl}/app/deliverables/${applicationId || serviceOrderId}?payment=success&session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${baseUrl}/app/deliverables/${applicationId || serviceOrderId}?payment=cancelled`;

    // Create Stripe Checkout Session
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
        user_id: user.id,
      },
      success_url: successUrl,
      cancel_url: cancelUrl,
      locale: "pl",
      // Optional: collect billing address for invoicing
      billing_address_collection: "auto",
      // Expiry after 30 minutes
      expires_at: Math.floor(Date.now() / 1000) + 30 * 60,
    });

    // Create pending payment record
    const { error: paymentError } = await supabase.from("payments").insert({
      contract_id: contractId,
      stripe_session_id: session.id,
      amount_total: amountInGrosze,
      platform_fee: platformFee,
      status: "pending",
    });

    if (paymentError) {
      console.error("Failed to create payment record:", paymentError);
      // Continue anyway - Stripe session was already created
      // The webhook will still process the payment
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
