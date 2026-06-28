import { jsonError, noStoreJson } from "@/lib/security/api-response";
import { NextRequest } from "next/server";
import { getStripe } from "@/lib/stripe";
import { enqueueStripeEvent, processPendingStripeEvents } from "@/lib/stripe/stripe-event-processor";
import { logCriticalError } from "@/lib/observability/error-log";
import Stripe from "stripe";

export const dynamic = "force-dynamic";
export const maxDuration = 10;

async function getRawBody(req: NextRequest): Promise<Buffer> {
  const chunks: Uint8Array[] = [];
  const reader = req.body?.getReader();

  if (!reader) {
    throw new Error("Brak treści żądania.");
  }

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
  }

  return Buffer.concat(chunks);
}

function shouldProcessInline() {
  if (process.env.STRIPE_WEBHOOK_PROCESS_INLINE !== "true") {
    return false;
  }

  const isStripeTestMode = process.env.STRIPE_SECRET_KEY?.startsWith("sk_test_") === true;
  const isPreviewLike =
    process.env.VERCEL_ENV === "preview"
    || process.env.NODE_ENV !== "production";

  return isStripeTestMode && isPreviewLike;
}

export async function POST(req: NextRequest) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    await logCriticalError({
      source: "stripe.webhook.missing_secret",
      message: "STRIPE_WEBHOOK_SECRET is not configured.",
    });
    return jsonError("Webhook Stripe nie jest skonfigurowany.", 500);
  }

  let event: Stripe.Event;

  try {
    const rawBody = await getRawBody(req);
    const signature = req.headers.get("stripe-signature");

    if (!signature) {
      return jsonError("Brak podpisu webhooka Stripe.", 400);
    }

    event = getStripe().webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch {
    return jsonError("Nieprawidłowy podpis webhooka Stripe.", 400);
  }

  try {
    const status = await enqueueStripeEvent(event);
    if (!shouldProcessInline()) {
      return noStoreJson({ received: true, status });
    }

    try {
      const inlineProcessing = await processPendingStripeEvents(3);
      return noStoreJson({ received: true, status, inlineProcessing });
    } catch (processingError) {
      await logCriticalError({
        source: "stripe.webhook.inline_processing_failed",
        level: "warning",
        error: processingError,
        message: "Inline Stripe event processing failed after enqueue.",
        stripeEventId: event.id,
        context: {
          eventType: event.type,
        },
      });
      return noStoreJson({ received: true, status, inlineProcessing: { failed: true } });
    }
  } catch (error) {
    await logCriticalError({
      source: "stripe.webhook.enqueue_failed",
      error,
      message: "Failed to enqueue Stripe event.",
      stripeEventId: event.id,
      context: {
        eventType: event.type,
      },
    });
    return jsonError("Nie udało się zapisać zdarzenia Stripe.", 500);
  }
}
