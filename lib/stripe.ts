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

// Default platform fee percentage (10% for user services)
export const PLATFORM_FEE_PERCENT = Number(process.env.PLATFORM_FEE_PERCENT) || 10;

// Commission rates
export const COMMISSION_RATE_SYSTEM = 0.25;  // 25% for platform/system services
export const COMMISSION_RATE_USER = 0.10;    // 10% for user-created services

// Calculate platform fee in grosze (uses default rate)
export function calculatePlatformFee(amountInGrosze: number): number {
  return Math.round(amountInGrosze * (PLATFORM_FEE_PERCENT / 100));
}

// Calculate platform fee with explicit commission rate (0.0 - 1.0)
export function calculatePlatformFeeWithRate(amountInGrosze: number, commissionRate: number): number {
  return Math.round(amountInGrosze * commissionRate);
}
