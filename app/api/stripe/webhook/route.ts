import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { enqueueStripeEvent, processPendingStripeEvents } from "@/lib/stripe/stripe-event-processor";
import Stripe from "stripe";

export const dynamic = "force-dynamic";
export const maxDuration = 10;

async function getRawBody(req: NextRequest): Promise<Buffer> {
  const chunks: Uint8Array[] = [];
  const reader = req.body?.getReader();

  if (!reader) {
    throw new Error("No request body");
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
    console.error("STRIPE_WEBHOOK_SECRET is not set");
    return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 });
  }

  let event: Stripe.Event;

  try {
    const rawBody = await getRawBody(req);
    const signature = req.headers.get("stripe-signature");

    if (!signature) {
      return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 });
    }

    event = getStripe().webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    console.error("Webhook signature verification failed:", msg);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    const status = await enqueueStripeEvent(event);
    if (!shouldProcessInline()) {
      return NextResponse.json({ received: true, status });
    }

    try {
      const inlineProcessing = await processPendingStripeEvents(3);
      return NextResponse.json({ received: true, status, inlineProcessing });
    } catch (processingError) {
      const message = processingError instanceof Error ? processingError.message : "Inline Stripe processing failed";
      console.error("[stripe-webhook] inline processing failed:", message);
      return NextResponse.json({ received: true, status, inlineProcessing: { failed: true } });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to enqueue Stripe event";
    console.error("[stripe-webhook] enqueue failed:", message);
    return NextResponse.json({ error: "Failed to enqueue webhook event" }, { status: 500 });
  }
}
