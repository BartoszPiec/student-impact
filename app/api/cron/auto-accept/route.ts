import { createAdminClient } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = createAdminClient();

    // 1. Auto-accept overdue milestones via RPC
    const { data, error } = await supabase.rpc("auto_accept_due_milestones_v2", {
      p_limit: 200,
    });

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    // 2. Sync: completed contracts → completed applications
    //    (fallback for any contracts that completed but applications.status wasn't updated)
    const { data: staleApps } = await supabase
      .from("contracts")
      .select("application_id")
      .eq("status", "completed")
      .not("application_id", "is", null);

    if (staleApps && staleApps.length > 0) {
      const appIds = staleApps.map((c: any) => c.application_id);
      await supabase
        .from("applications")
        .update({ status: "completed", realization_status: "completed" })
        .in("id", appIds)
        .in("status", ["accepted", "in_progress"]);
    }

    // 3. Sync: active contracts → in_progress applications
    const { data: activeContracts } = await supabase
      .from("contracts")
      .select("application_id")
      .eq("status", "active")
      .not("application_id", "is", null);

    if (activeContracts && activeContracts.length > 0) {
      const activeAppIds = activeContracts.map((c: any) => c.application_id);
      await supabase
        .from("applications")
        .update({ status: "in_progress" })
        .in("id", activeAppIds)
        .in("status", ["accepted"]);
    }

    // 4. Sync: accepted/in_progress applications → in_progress offers
    //    (fallback for offers that should be in_progress but aren't)
    const { data: acceptedApps } = await supabase
      .from("applications")
      .select("offer_id")
      .in("status", ["accepted", "in_progress"]);

    if (acceptedApps && acceptedApps.length > 0) {
      const offerIds = [...new Set(acceptedApps.map((a: any) => a.offer_id))];
      await supabase
        .from("offers")
        .update({ status: "in_progress" })
        .in("id", offerIds)
        .eq("status", "published");
    }

    // 5. Sync: completed contracts → closed offers
    const { data: completedContracts } = await supabase
      .from("contracts")
      .select("application_id, applications(offer_id)")
      .eq("status", "completed");

    if (completedContracts && completedContracts.length > 0) {
      const completedOfferIds = completedContracts
        .map((c: any) => (c.applications as any)?.offer_id)
        .filter(Boolean);
      if (completedOfferIds.length > 0) {
        await supabase
          .from("offers")
          .update({ status: "closed" })
          .in("id", completedOfferIds)
          .neq("status", "closed");
      }
    }

    return NextResponse.json({
      ok: true,
      autoAccept: data,
    });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
