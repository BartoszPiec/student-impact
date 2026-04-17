import { createAdminClient } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

type ContractApplicationRow = {
  application_id: string | null;
};

type ApplicationOfferRow = {
  offer_id: string | null;
};

type ContractOfferRelation = {
  application_id: string | null;
  applications: ApplicationOfferRow | ApplicationOfferRow[] | null;
};

function extractOfferId(value: ApplicationOfferRow | ApplicationOfferRow[] | null): string | null {
  if (Array.isArray(value)) {
    return value[0]?.offer_id ?? null;
  }

  return value?.offer_id ?? null;
}

export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    console.error("CRON_SECRET environment variable is not set");
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
  }

  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${cronSecret}`) {
    console.warn("Unauthorized cron attempt from:", req.headers.get("x-forwarded-for") || "unknown");
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
      const appIds = (staleApps as ContractApplicationRow[])
        .map((contract) => contract.application_id)
        .filter((id): id is string => Boolean(id));
      await supabase
        .from("applications")
        .update({ status: "completed", realization_status: "completed" })
        .in("id", appIds)
        .neq("status", "completed")
        .in("status", ["accepted", "in_progress", "delivered"]);
    }

    // 3. Sync: active contracts → in_progress applications
    const { data: activeContracts } = await supabase
      .from("contracts")
      .select("application_id")
      .eq("status", "active")
      .not("application_id", "is", null);

    if (activeContracts && activeContracts.length > 0) {
      const activeAppIds = (activeContracts as ContractApplicationRow[])
        .map((contract) => contract.application_id)
        .filter((id): id is string => Boolean(id));
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
      const offerIds = [
        ...new Set(
          (acceptedApps as ApplicationOfferRow[])
            .map((application) => application.offer_id)
            .filter((id): id is string => Boolean(id)),
        ),
      ];
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
      const completedOfferIds = (completedContracts as ContractOfferRelation[])
        .map((contract) => extractOfferId(contract.applications))
        .filter((id): id is string => Boolean(id));
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
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
