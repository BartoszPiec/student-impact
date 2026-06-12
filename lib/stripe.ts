import Stripe from 'stripe';
import { DEFAULT_JOB_COMMISSION_RATE, normalizeCommissionRate } from "@/lib/commission";

// Lazy initialization to avoid build-time errors
let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY is not set in environment variables');
    }
    // Pilot mode nie może użyć kluczy live (CODEX_WYTYCZNE P0-1).
    if (
      process.env.NEXT_PUBLIC_PILOT_MODE === 'true'
      && process.env.STRIPE_SECRET_KEY.startsWith('sk_live_')
    ) {
      throw new Error('PILOT_MODE wymaga kluczy testowych Stripe (sk_test_), wykryto sk_live_');
    }
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2026-02-25.clover' as Stripe.LatestApiVersion,
      typescript: true,
    });
  }
  return _stripe;
}

// For backwards compatibility - use getStripe() in new code
export const stripe = {
  get webhooks() { return getStripe().webhooks; },
  get checkout() { return getStripe().checkout; },
};

// Legacy env fallback for flows that still do not pass an explicit commission rate.
export const PLATFORM_FEE_PERCENT = Number(process.env.PLATFORM_FEE_PERCENT) || (DEFAULT_JOB_COMMISSION_RATE * 100);

// Calculate platform fee in grosze using a decimal commission rate (e.g. 0.15 = 15%).
export function calculatePlatformFee(amountInGrosze: number, commissionRate?: number | null): number {
  const normalizedRate = normalizeCommissionRate(commissionRate) ?? (PLATFORM_FEE_PERCENT / 100);
  return Math.round(amountInGrosze * normalizedRate);
}
