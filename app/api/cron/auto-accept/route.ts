import { createAdminClient } from "@/lib/supabase/admin";
import { transferPayoutViaStripe } from "@/lib/stripe/payouts";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

type AutoAcceptResult = {
  payout_ids?: unknown;
};

type PayoutTransferSummary = {
  payoutId: string;
  status: string;
};

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
      console.error("[cron:auto-accept] rpc error:", error.message);
      return NextResponse.json({ ok: false, error: "Nie udało sie wykonac zadania cyklicznego." }, { status: 500 });
    }

    const payoutTransfers: PayoutTransferSummary[] = [];
    if (process.env.STRIPE_PAYOUTS_ENABLED === "true") {
      const payoutIds = extractPayoutIds(data);
      const concurrency = 5;

      for (let index = 0; index < payoutIds.length; index += concurrency) {
        const batch = payoutIds.slice(index, index + concurrency);
        const batchResults = await Promise.all(batch.map(async (payoutId) => {
          const transferResult = await transferPayoutViaStripe(payoutId);
          return { payoutId, status: transferResult.status };
        }));
        payoutTransfers.push(...batchResults);
      }
    }

    const { data: reconciliation, error: reconciliationError } = await supabase.rpc(
      "reconcile_contract_statuses_v1",
    );

    if (reconciliationError) {
      console.error("[cron:auto-accept] reconciliation error:", reconciliationError.message);
      return NextResponse.json({ ok: false, error: "Nie udało się uzgodnić statusów zleceń." }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      autoAccept: data,
      payoutTransfers,
      reconciliation,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("[cron:auto-accept] unexpected error:", msg);
    return NextResponse.json({ ok: false, error: "Nie udało sie wykonac zadania cyklicznego." }, { status: 500 });
  }
}
