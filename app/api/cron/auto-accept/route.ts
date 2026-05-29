import { createAdminClient } from "@/lib/supabase/admin";
import { transferPayoutViaStripe } from "@/lib/stripe/payouts";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

type ContractApplicationRow = {
  application_id: string | null;
};

type ContractServiceOrderRow = {
  service_order_id: string | null;
};

type ContractOfferRelation = {
  application_id: string | null;
  applications: ApplicationOfferRelation | ApplicationOfferRelation[] | null;
};

type ApplicationOfferRelation = {
  offer_id: string | null;
  offers: OfferPlatformFlag | OfferPlatformFlag[] | null;
};

type OfferPlatformFlag = {
  id: string | null;
  is_platform_service: boolean | null;
};

type AutoAcceptResult = {
  payout_ids?: unknown;
};

type PayoutTransferSummary = {
  payoutId: string;
  status: string;
};

function unwrapRelation<T>(value: T | T[] | null): T | null {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
}

function extractPayoutIds(value: unknown): string[] {
  if (!value || typeof value !== "object" || !("payout_ids" in value)) {
    return [];
  }

  const payoutIds = (value as AutoAcceptResult).payout_ids;
  if (!Array.isArray(payoutIds)) {
    return [];
  }

  return payoutIds.filter((id): id is string => typeof id === "string" && id.length > 0);
}

function extractNonPlatformOfferId(value: ApplicationOfferRelation | ApplicationOfferRelation[] | null): string | null {
  const application = unwrapRelation(value);
  const offer = unwrapRelation(application?.offers ?? null);

  if (offer?.is_platform_service === true) {
    return null;
  }

  return application?.offer_id ?? offer?.id ?? null;
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

    const payoutTransfers: PayoutTransferSummary[] = [];
    if (process.env.STRIPE_PAYOUTS_ENABLED === "true") {
      for (const payoutId of extractPayoutIds(data)) {
        const transferResult = await transferPayoutViaStripe(payoutId);
        payoutTransfers.push({ payoutId, status: transferResult.status });
      }
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
    const { data: staleServiceOrders } = await supabase
      .from("contracts")
      .select("service_order_id")
      .eq("status", "completed")
      .not("service_order_id", "is", null);

    if (staleServiceOrders && staleServiceOrders.length > 0) {
      const serviceOrderIds = (staleServiceOrders as ContractServiceOrderRow[])
        .map((contract) => contract.service_order_id)
        .filter((id): id is string => Boolean(id));
      await supabase
        .from("service_orders")
        .update({ status: "completed" })
        .in("id", serviceOrderIds)
        .neq("status", "completed")
        .in("status", ["accepted", "active", "in_progress", "revision", "delivered"]);
    }

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
    const { data: activeServiceOrderContracts } = await supabase
      .from("contracts")
      .select("service_order_id")
      .eq("status", "active")
      .not("service_order_id", "is", null);

    if (activeServiceOrderContracts && activeServiceOrderContracts.length > 0) {
      const activeServiceOrderIds = (activeServiceOrderContracts as ContractServiceOrderRow[])
        .map((contract) => contract.service_order_id)
        .filter((id): id is string => Boolean(id));
      await supabase
        .from("service_orders")
        .update({ status: "active" })
        .in("id", activeServiceOrderIds)
        .in("status", ["accepted", "awaiting_funding"]);
    }

    const { data: acceptedApps } = await supabase
      .from("applications")
      .select("offer_id, offers(id, is_platform_service)")
      .in("status", ["accepted", "in_progress"]);

    if (acceptedApps && acceptedApps.length > 0) {
      const offerIds = [
        ...new Set(
          (acceptedApps as ApplicationOfferRelation[])
            .map((application) => extractNonPlatformOfferId(application))
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
      .select("application_id, applications(offer_id, offers(id, is_platform_service))")
      .eq("status", "completed");

    if (completedContracts && completedContracts.length > 0) {
      const completedOfferIds = (completedContracts as ContractOfferRelation[])
        .map((contract) => extractNonPlatformOfferId(contract.applications))
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
      payoutTransfers,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
