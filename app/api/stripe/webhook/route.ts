import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateCompanyInvoice } from "@/lib/pdf/generate-invoice";
import Stripe from "stripe";

export const dynamic = "force-dynamic";

async function getRawBody(req: NextRequest): Promise<Buffer> {
  const chunks: Uint8Array[] = [];
  const reader = req.body?.getReader();

  if (!reader) {
    throw new Error("No request body");
  }

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
  }

  return Buffer.concat(chunks);
}

export async function POST(req: NextRequest) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error("❌ STRIPE_WEBHOOK_SECRET is not set — webhook processing disabled");
    return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 });
  }

  let event: Stripe.Event;

  try {
    const rawBody = await getRawBody(req);
    const signature = req.headers.get("stripe-signature");

    if (!signature) {
      return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 });
    }

    event = getStripe().webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("Webhook signature verification failed:", msg);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  // Handle the event
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      await handleCheckoutCompleted(session);
      break;
    }

    case "checkout.session.expired": {
      const session = event.data.object as Stripe.Checkout.Session;
      await handleCheckoutExpired(session);
      break;
    }

    case "charge.refunded": {
      const charge = event.data.object as Stripe.Charge;
      await handleChargeRefunded(charge);
      break;
    }
    case "refund.created": {
      const refund = event.data.object as Stripe.Refund;
      await handleRefundCreated(refund);
      break;
    }

    case "payment_intent.payment_failed": {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      console.log("Payment failed:", paymentIntent.id);
      break;
    }

    default:
      console.log(`Unhandled event type: ${event.type}`);
  }

  return NextResponse.json({ received: true });
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const supabase = createAdminClient();

  const contractId = session.metadata?.contract_id;
  const applicationId = session.metadata?.application_id;
  const serviceOrderId = session.metadata?.service_order_id;
  const milestoneIdsJson = session.metadata?.milestone_ids;

  if (!contractId || (!applicationId && !serviceOrderId)) {
    console.error("Missing metadata in checkout session:", session.id);
    return;
  }

  if (!UUID_RE.test(contractId) || (applicationId && !UUID_RE.test(applicationId)) || (serviceOrderId && !UUID_RE.test(serviceOrderId))) {
    console.error("Invalid UUID in session metadata:", { contractId, applicationId, serviceOrderId });
    return;
  }

  // Idempotency: skip if already handled
  const { data: pay } = await supabase.from("payments").select("status").eq("stripe_session_id", session.id).maybeSingle();
  if (pay?.status === "completed") return;

  try {
    let milestoneIds: string[] = [];
    if (milestoneIdsJson) {
      try {
        milestoneIds = JSON.parse(milestoneIdsJson);
      } catch {
        console.error("Failed to parse milestone_ids:", milestoneIdsJson);
      }
    }

    // 1. Atomic Transaction via RPC (v4 with Accounting & Service Order support)
    const { error: rpcError } = await supabase.rpc("process_stripe_payment_v4", {
      p_session_id: session.id,
      p_payment_intent_id: session.payment_intent as string,
      p_contract_id: contractId,
      p_application_id: applicationId || null,
      p_service_order_id: serviceOrderId || null,
      p_amount_pln: session.amount_total ? session.amount_total / 100 : 0,
      p_fee_pln: session.metadata?.platform_fee ? Number(session.metadata.platform_fee) / 100 : 0,
      p_milestone_ids: milestoneIds,
      p_user_id: session.metadata?.user_id || null,
    });

    if (rpcError) {
      console.error("RPC Error processing payment:", rpcError);
      throw new Error("Failed to process payment atomically");
    }

    console.log(`✅ Atomic processing successful for contract ${contractId}`);

    // 2. Audit & Notifications (Non-blocking)
    try {
      await supabase.rpc("_audit", {
        p_entity: "contract",
        p_entity_id: contractId,
        p_action: "funded_via_stripe",
        p_payload: { session_id: session.id },
        p_actor: session.metadata?.user_id || null,
      });
    } catch {}

    const { data: contract } = await supabase
      .from("contracts")
      .select("student_id, applications!contracts_application_id_fkey(offers(tytul))")
      .eq("id", contractId)
      .single();

    const contractTyped = contract as unknown as { 
      student_id: string, 
      applications: { offers: { tytul: string } } 
    };

    if (contractTyped?.student_id) {
      const offerTitle = contractTyped.applications?.offers?.tytul || "Zlecenie";
      try {
        await supabase.rpc("create_notification", {
          p_user_id: contractTyped.student_id,
          p_typ: "contract_funded",
          p_payload: {
            contract_id: contractId,
            application_id: applicationId,
            offer_title: offerTitle,
          },
        });
      } catch {}
    }

    // 3. Invoice Generation
    try {
      const amountPLN = session.amount_total ? session.amount_total / 100 : 0;
      const feePLN = session.metadata?.platform_fee ? Number(session.metadata.platform_fee) / 100 : amountPLN * 0.05;
      await generateCompanyInvoice(contractId, amountPLN, feePLN, "Stripe");
    } catch (invoiceErr) {
      console.error("Invoice generation failed:", invoiceErr);
    }

  } catch (error) {
    console.error("Error processing checkout completion:", error);
    throw error;
  }
}

async function handleCheckoutExpired(session: Stripe.Checkout.Session) {
  const supabase = createAdminClient();
  await supabase.from("payments").update({ status: "expired" }).eq("stripe_session_id", session.id);
}

async function handleChargeRefunded(charge: Stripe.Charge) {
  const supabase = createAdminClient();
  const paymentIntentId = typeof charge.payment_intent === "string" ? charge.payment_intent : charge.payment_intent?.id;
  if (!paymentIntentId) return;

  // Znajdź powiązaną płatność
  const { data: payment } = await supabase.from("payments").select("contract_id").eq("stripe_payment_intent_id", paymentIntentId).maybeSingle();
  if (!payment) return;

  // Obsługa przez charge.refunded jest redundantna wobec refund.created, 
  // ale przydatna jako zabezpieczenie. RPC v3 zapewnia idempotencję po refundId.
  for (const refund of charge.refunds?.data || []) {
    await supabase.rpc("process_stripe_refund_v4", {
      p_payment_intent_id: paymentIntentId,
      p_charge_id: charge.id,
      p_refund_id: refund.id,
      p_refund_amount_delta_pln: refund.amount / 100,
      p_currency: (charge.currency || "PLN").toUpperCase(),
      p_reason: refund.reason || null,
    });
  }
}

async function handleRefundCreated(refund: Stripe.Refund) {
  const supabase = createAdminClient();
  const paymentIntentId = typeof refund.payment_intent === "string" ? refund.payment_intent : refund.payment_intent?.id;
  const chargeId = typeof refund.charge === "string" ? refund.charge : refund.charge?.id;
  
  if (!paymentIntentId || !chargeId) return;

  await supabase.rpc("process_stripe_refund_v4", {
    p_payment_intent_id: paymentIntentId,
    p_charge_id: chargeId,
    p_refund_id: refund.id,
    p_refund_amount_delta_pln: refund.amount / 100,
    p_currency: (refund.currency || "PLN").toUpperCase(),
    p_reason: refund.reason || null,
  });
}
