import { jsonError, noStoreJson } from "@/lib/security/api-response";
import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { logCriticalError } from "@/lib/observability/error-log";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    await logCriticalError({
      source: "cron.cleanup_expired_sessions.missing_secret",
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
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const { data, error } = await supabase
      .from("payments")
      .update({ status: "expired" })
      .eq("status", "pending")
      .lt("created_at", cutoff)
      .select("id");

    if (error) {
      await logCriticalError({
        source: "cron.cleanup_expired_sessions.update_failed",
        error,
        errorCode: error.code,
        message: "Expired pending payment cleanup failed.",
      });
      return noStoreJson({ ok: false, error: "Nie udało się wykonać zadania cyklicznego." }, { status: 500 });
    }

    return noStoreJson({
      ok: true,
      expiredCount: data?.length ?? 0,
    });
  } catch (error) {
    await logCriticalError({
      source: "cron.cleanup_expired_sessions.unexpected",
      error,
      message: "Unexpected expired session cleanup cron failure.",
    });
    return noStoreJson({ ok: false, error: "Nie udało się wykonać zadania cyklicznego." }, { status: 500 });
  }
}
