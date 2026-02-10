import Stripe from 'stripe';

// Lazy initialization to avoid build-time errors
let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY is not set in environment variables');
    }
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2026-01-28.clover',
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

// Platform fee percentage (5%)
export const PLATFORM_FEE_PERCENT = Number(process.env.PLATFORM_FEE_PERCENT) || 5;

// Calculate platform fee in grosze
export function calculatePlatformFee(amountInGrosze: number): number {
  return Math.round(amountInGrosze * (PLATFORM_FEE_PERCENT / 100));
}
