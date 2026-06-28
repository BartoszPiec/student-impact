import { noStoreJson, jsonError } from "@/lib/security/api-response";
import { NextRequest } from "next/server";
import { processPendingStripeEvents } from "@/lib/stripe/stripe-event-processor";
import { logCriticalError } from "@/lib/observability/error-log";

export const dynamic = "force-dynamic";
export const maxDuration = 10;

export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    await logCriticalError({
      source: "cron.process_stripe_events.missing_secret",
      message: "CRON_SECRET is not configured.",
    });
    return jsonError("Konfiguracja zadania cyklicznego jest niekompletna.", 500);
  }

  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${cronSecret}`) {
    return jsonError("Brak autoryzacji zadania cyklicznego.", 401);
  }

  try {
    const result = await processPendingStripeEvents(10);
    return noStoreJson({ ok: true, ...result });
  } catch (error) {
    await logCriticalError({
      source: "cron.process_stripe_events.unexpected",
      error,
      message: "Unexpected Stripe event processing cron failure.",
    });
    return noStoreJson({ ok: false, error: "Nie udało się wykonać zadania cyklicznego." }, { status: 500 });
  }
}
