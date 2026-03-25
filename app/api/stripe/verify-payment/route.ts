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
    const serviceOrderId = session.metadata?.service_order_id;
    const milestoneIdsJson = session.metadata?.milestone_ids;

    if (!contractId || (!applicationId && !serviceOrderId)) {
      return NextResponse.json({ error: "Invalid session metadata" }, { status: 400 });
    }

    const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!UUID_RE.test(contractId) || (applicationId && !UUID_RE.test(applicationId)) || (serviceOrderId && !UUID_RE.test(serviceOrderId))) {
      return NextResponse.json({ error: "Nieprawidłowe ID w metadanych sesji" }, { status: 400 });
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

    // 7. Payment confirmed! Update database using atomic RPC via admin client
    const admin = createAdminClient();

    console.log(`[verify-payment] Processing payment for contract ${contractId}`);

    // Parse milestone IDs from metadata
    let milestoneIds: string[] = [];
    if (milestoneIdsJson) {
      try {
        milestoneIds = JSON.parse(milestoneIdsJson);
      } catch {
        console.error("[verify-payment] Failed to parse milestone_ids:", milestoneIdsJson);
      }
    }

    // Use atomic RPC for all updates (v4 with Accounting & Service Order support)
    const { error: rpcError } = await admin.rpc("process_stripe_payment_v4", {
      p_session_id: session.id,
      p_payment_intent_id: session.payment_intent as string,
      p_contract_id: contractId,
      p_application_id: applicationId || null,
      p_service_order_id: serviceOrderId || null,
      p_amount_pln: session.amount_total ? session.amount_total / 100 : 0,
      p_fee_pln: session.metadata?.platform_fee ? Number(session.metadata.platform_fee) / 100 : 0,
      p_milestone_ids: milestoneIds,
      p_user_id: user.id,
    });

    if (rpcError) {
      console.error("[verify-payment] RPC Error processing payment:", rpcError);
      throw new Error(`Failed to process payment atomically: ${rpcError.message}`);
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
            application_id: applicationId || null,
            service_order_id: serviceOrderId || null,
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

  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to verify payment";
    console.error("[verify-payment] Error:", error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
