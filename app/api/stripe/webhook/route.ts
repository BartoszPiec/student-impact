import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { enqueueStripeEvent } from "@/lib/stripe/stripe-event-processor";
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
    return NextResponse.json({ received: true, status });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to enqueue Stripe event";
    console.error("[stripe-webhook] enqueue failed:", message);
    return NextResponse.json({ error: "Failed to enqueue webhook event" }, { status: 500 });
  }
}
