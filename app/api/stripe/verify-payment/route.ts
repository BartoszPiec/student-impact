import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStripe } from "@/lib/stripe";

/**
 * POST /api/stripe/verify-payment
 *
 * Fallback endpoint called after redirect from Stripe Checkout.
 * Verifies the payment status directly via Stripe API and updates
 * the database if the webhook hasn't processed yet.
 *
 * This is idempotent — safe to call multiple times.
 */
export async function POST(req: NextRequest) {
  try {
    // 1. Verify user is authenticated
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Get session_id from request body
    const body = await req.json();
    const { session_id } = body;

    if (!session_id) {
      return NextResponse.json({ error: "Missing session_id" }, { status: 400 });
    }

    // 3. Retrieve session from Stripe
    const session = await getStripe().checkout.sessions.retrieve(session_id);

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    const contractId = session.metadata?.contract_id;
    const applicationId = session.metadata?.application_id;
    const milestoneIdsJson = session.metadata?.milestone_ids;

    if (!contractId || !applicationId) {
      return NextResponse.json({ error: "Invalid session metadata" }, { status: 400 });
    }

    // 4. Verify user owns this contract
    const { data: contract } = await supabase
      .from("contracts")
      .select("id, company_id, status")
      .eq("id", contractId)
      .single();

    if (!contract || contract.company_id !== user.id) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    // 5. Check if already processed (idempotent)
    if (contract.status === "active") {
      return NextResponse.json({
        status: "already_processed",
        message: "Payment already processed"
      });
    }

    // 6. Check if payment was actually successful
    if (session.payment_status !== "paid") {
      return NextResponse.json({
        status: "not_paid",
        payment_status: session.payment_status,
        message: "Payment not yet completed"
      });
    }

    // 7. Payment confirmed! Update database using admin client (bypasses RLS)
    const admin = createAdminClient();

    console.log(`[verify-payment] Processing payment for contract ${contractId}`);

    // Update payment record
    const { error: paymentUpdateError } = await admin
      .from("payments")
      .update({
        status: "completed",
        stripe_payment_intent_id: session.payment_intent as string,
        completed_at: new Date().toISOString(),
      })
      .eq("stripe_session_id", session.id);

    if (paymentUpdateError) {
      console.error("[verify-payment] Failed to update payment:", paymentUpdateError);
    }

    // Parse milestone IDs
    let milestoneIds: string[] = [];
    if (milestoneIdsJson) {
      try {
        milestoneIds = JSON.parse(milestoneIdsJson);
      } catch {
        console.error("[verify-payment] Failed to parse milestone_ids:", milestoneIdsJson);
      }
    }

    // Update milestones to 'funded'
    if (milestoneIds.length > 0) {
      const { error: milestoneError } = await admin
        .from("milestones")
        .update({ status: "funded" })
        .in("id", milestoneIds)
        .eq("status", "awaiting_funding");

      if (milestoneError) {
        console.error("[verify-payment] Failed to update milestones:", milestoneError);
      }
    } else {
      // Fallback: update all awaiting_funding milestones for this contract
      const { error: milestoneError } = await admin
        .from("milestones")
        .update({ status: "funded" })
        .eq("contract_id", contractId)
        .eq("status", "awaiting_funding");

      if (milestoneError) {
        console.error("[verify-payment] Failed to update milestones (fallback):", milestoneError);
      }
    }

    // Update contract status to 'active'
    const { error: contractError } = await admin
      .from("contracts")
      .update({
        status: "active",
        funded_at: new Date().toISOString(),
      })
      .eq("id", contractId)
      .in("status", ["awaiting_funding", "draft"]);

    if (contractError) {
      console.error("[verify-payment] Failed to update contract:", contractError);
    }

    // Update application status to 'in_progress'
    const { error: appError } = await admin
      .from("applications")
      .update({
        status: "in_progress",
        realization_status: "in_progress"
      })
      .eq("id", applicationId)
      .in("status", ["accepted"]);

    if (appError) {
      console.error("[verify-payment] Failed to update application:", appError);
    }

    // Send notification to student (optional, don't fail)
    try {
      const { data: contractData } = await admin
        .from("contracts")
        .select("student_id")
        .eq("id", contractId)
        .single();

      if (contractData?.student_id) {
        await admin.rpc("create_notification", {
          p_user_id: contractData.student_id,
          p_typ: "contract_funded",
          p_payload: {
            contract_id: contractId,
            application_id: applicationId,
            amount: session.amount_total ? session.amount_total / 100 : 0,
          },
        });
      }
    } catch (e) {
      console.error("[verify-payment] Failed to send notification:", e);
    }

    console.log(`[verify-payment] Successfully processed payment for contract ${contractId}`);

    return NextResponse.json({
      status: "success",
      message: "Payment verified and contract activated"
    });

  } catch (error: any) {
    console.error("[verify-payment] Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to verify payment" },
      { status: 500 }
    );
  }
}
