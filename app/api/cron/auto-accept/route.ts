import { createAdminClient } from "@/lib/supabase/admin";
import { jsonError, noStoreJson } from "@/lib/security/api-response";
import { transferPayoutViaStripe } from "@/lib/stripe/payouts";
import { logCriticalError } from "@/lib/observability/error-log";
import { NextRequest } from "next/server";

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
    await logCriticalError({
      source: "cron.auto_accept.missing_secret",
      message: "CRON_SECRET is not configured.",
    });
    return jsonError("Konfiguracja zadania cyklicznego jest niekompletna.", 500);
  }

  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${cronSecret}`) {
    return jsonError("Brak autoryzacji zadania cyklicznego.", 401);
  }

  try {
    const supabase = createAdminClient();

    // 1. Auto-accept overdue milestones via RPC
    const { data, error } = await supabase.rpc("auto_accept_due_milestones_v2", {
      p_limit: 200,
    });

    if (error) {
      await logCriticalError({
        source: "cron.auto_accept.rpc_failed",
        error,
        errorCode: error.code,
        message: "auto_accept_due_milestones_v2 failed.",
      });
      return noStoreJson({ ok: false, error: "Nie udało się wykonać zadania cyklicznego." }, { status: 500 });
    }

    const payoutTransfers: PayoutTransferSummary[] = [];
    if (process.env.STRIPE_PAYOUTS_ENABLED === "true") {
      const payoutIds = extractPayoutIds(data);
      const concurrency = 5;

      for (let index = 0; index < payoutIds.length; index += concurrency) {
        const batch = payoutIds.slice(index, index + concurrency);
        const batchResults = await Promise.all(batch.map(async (payoutId) => {
          try {
            const transferResult = await transferPayoutViaStripe(payoutId);
            return { payoutId, status: transferResult.status };
          } catch (transferError) {
            await logCriticalError({
              source: "cron.auto_accept.payout_transfer_failed",
              error: transferError,
              message: "Stripe payout transfer failed during auto-accept cron.",
              context: {
                payoutId,
              },
            });
            return { payoutId, status: "failed" };
          }
        }));
        payoutTransfers.push(...batchResults);
      }
    }

    const { data: reconciliation, error: reconciliationError } = await supabase.rpc(
      "reconcile_contract_statuses_v1",
    );

    if (reconciliationError) {
      await logCriticalError({
        source: "cron.auto_accept.reconciliation_failed",
        error: reconciliationError,
        errorCode: reconciliationError.code,
        message: "reconcile_contract_statuses_v1 failed after auto-accept.",
      });
      return noStoreJson({ ok: false, error: "Nie udało się uzgodnić statusów zleceń." }, { status: 500 });
    }

    return noStoreJson({
      ok: true,
      autoAccept: data,
      payoutTransfers,
      reconciliation,
    });
  } catch (err: unknown) {
    await logCriticalError({
      source: "cron.auto_accept.unexpected",
      error: err,
      message: "Unexpected auto-accept cron failure.",
    });
    return noStoreJson({ ok: false, error: "Nie udało się wykonać zadania cyklicznego." }, { status: 500 });
  }
}
