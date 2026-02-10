import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import Stripe from "stripe";

export const dynamic = "force-dynamic";

// In Next.js App Router, body parsing is handled differently
// We read the raw body manually for Stripe signature verification

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

  // If no webhook secret, allow for local development (but log warning)
  if (!webhookSecret) {
    console.warn("⚠️ STRIPE_WEBHOOK_SECRET not set - webhook signature verification disabled");
  }

  let event: Stripe.Event;

  try {
    const rawBody = await getRawBody(req);
    const signature = req.headers.get("stripe-signature");

    if (webhookSecret && signature) {
      // Verify webhook signature
      event = getStripe().webhooks.constructEvent(rawBody, signature, webhookSecret);
    } else {
      // Development mode - parse without verification
      event = JSON.parse(rawBody.toString()) as Stripe.Event;
    }
  } catch (err: any) {
    console.error("Webhook signature verification failed:", err.message);
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

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const supabase = createAdminClient();

  const contractId = session.metadata?.contract_id;
  const applicationId = session.metadata?.application_id;
  const milestoneIdsJson = session.metadata?.milestone_ids;

  if (!contractId || !applicationId) {
    console.error("Missing metadata in checkout session:", session.id);
    return;
  }

  console.log(`Processing payment for contract ${contractId}, application ${applicationId}`);

  try {
    // Update payment record
    await supabase
      .from("payments")
      .update({
        status: "completed",
        stripe_payment_intent_id: session.payment_intent as string,
        completed_at: new Date().toISOString(),
      })
      .eq("stripe_session_id", session.id);

    // Parse milestone IDs
    let milestoneIds: string[] = [];
    if (milestoneIdsJson) {
      try {
        milestoneIds = JSON.parse(milestoneIdsJson);
      } catch {
        console.error("Failed to parse milestone_ids:", milestoneIdsJson);
      }
    }

    // Update milestones to 'funded'
    if (milestoneIds.length > 0) {
      const { error: milestoneError } = await supabase
        .from("milestones")
        .update({ status: "funded" })
        .in("id", milestoneIds)
        .eq("status", "awaiting_funding");

      if (milestoneError) {
        console.error("Failed to update milestones:", milestoneError);
      }
    } else {
      // Fallback: update all awaiting_funding milestones for this contract
      const { error: milestoneError } = await supabase
        .from("milestones")
        .update({ status: "funded" })
        .eq("contract_id", contractId)
        .eq("status", "awaiting_funding");

      if (milestoneError) {
        console.error("Failed to update milestones (fallback):", milestoneError);
      }
    }

    // Update contract status to 'active'
    const { error: contractError } = await supabase
      .from("contracts")
      .update({
        status: "active",
        funded_at: new Date().toISOString(),
      })
      .eq("id", contractId)
      .in("status", ["awaiting_funding", "draft"]);

    if (contractError) {
      console.error("Failed to update contract:", contractError);
    }

    // Update application status to 'in_progress'
    const { error: appError } = await supabase
      .from("applications")
      .update({ status: "in_progress" })
      .eq("id", applicationId)
      .in("status", ["accepted"]);

    if (appError) {
      console.error("Failed to update application:", appError);
    }

    // Create audit log (optional, don't fail if it doesn't work)
    try {
      await supabase.rpc("_audit", {
        p_entity: "contract",
        p_entity_id: contractId,
        p_action: "funded_via_stripe",
        p_payload: {
          session_id: session.id,
          payment_intent: session.payment_intent,
          amount_total: session.amount_total,
          application_id: applicationId,
        },
        p_actor: session.metadata?.user_id || null,
      });
    } catch {
      // Audit is optional
    }

    // Send notification to student
    const { data: contract } = await supabase
      .from("contracts")
      .select("student_id, applications!contracts_application_id_fkey(offers(tytul))")
      .eq("id", contractId)
      .single();

    if (contract?.student_id) {
      const offerTitle = (contract.applications as any)?.offers?.tytul || "Zlecenie";
      try {
        await supabase.rpc("create_notification", {
          p_user_id: contract.student_id,
          p_typ: "contract_funded",
          p_payload: {
            contract_id: contractId,
            application_id: applicationId,
            offer_title: offerTitle,
            amount: session.amount_total ? session.amount_total / 100 : 0,
          },
        });
      } catch (e) {
        console.error("Failed to send notification:", e);
      }
    }

    console.log(`✅ Successfully processed payment for contract ${contractId}`);
  } catch (error) {
    console.error("Error processing checkout completion:", error);
    throw error;
  }
}

async function handleCheckoutExpired(session: Stripe.Checkout.Session) {
  const supabase = createAdminClient();

  // Update payment record to expired
  await supabase
    .from("payments")
    .update({ status: "expired" })
    .eq("stripe_session_id", session.id);

  console.log(`Checkout session expired: ${session.id}`);
}
