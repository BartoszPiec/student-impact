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
    const { contractId, applicationId, amount } = body;

    if (!contractId || !applicationId || !amount) {
      return NextResponse.json(
        { error: "Missing required fields: contractId, applicationId, amount" },
        { status: 400 }
      );
    }

    // Verify contract exists and user is the company
    const { data: contract, error: contractError } = await supabase
      .from("contracts")
      .select("id, company_id, student_id, total_amount, status, terms_status, milestones(id, title, amount, status)")
      .eq("id", contractId)
      .single();

    if (contractError || !contract) {
      return NextResponse.json({ error: "Contract not found" }, { status: 404 });
    }

    if (contract.company_id !== user.id) {
      return NextResponse.json({ error: "Not authorized to fund this contract" }, { status: 403 });
    }

    if (contract.terms_status !== "agreed") {
      return NextResponse.json({ error: "Contract terms not yet agreed" }, { status: 400 });
    }

    if (contract.status !== "awaiting_funding" && contract.status !== "draft") {
      return NextResponse.json({ error: "Contract already funded or in invalid state" }, { status: 400 });
    }

    // Get milestone titles for description
    const milestones = contract.milestones || [];
    const milestoneIds = milestones.map((m: any) => m.id);
    const milestoneTitles = milestones.map((m: any) => m.title).join(", ");

    // Amount in grosze (PLN smallest unit)
    const amountInGrosze = Math.round(amount * 100);
    const platformFee = calculatePlatformFee(amountInGrosze);

    // Get application info for better description
    const { data: application } = await supabase
      .from("applications")
      .select("offers(tytul)")
      .eq("id", applicationId)
      .single();

    const offerTitle = (application?.offers as any)?.tytul || "Zlecenie";

    // Build success and cancel URLs
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const successUrl = `${baseUrl}/app/deliverables/${applicationId}?payment=success&session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${baseUrl}/app/deliverables/${applicationId}?payment=cancelled`;

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
        application_id: applicationId,
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
    await supabase.from("payments").insert({
      contract_id: contractId,
      stripe_session_id: session.id,
      amount_total: amountInGrosze,
      platform_fee: platformFee,
      status: "pending",
    });

    return NextResponse.json({
      url: session.url,
      sessionId: session.id,
    });
  } catch (error: any) {
    console.error("Stripe checkout error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
