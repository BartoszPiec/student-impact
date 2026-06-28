const vercelEnv = process.env.VERCEL_ENV;
const isVercelProduction = vercelEnv === "production";
const allowTestStripeInProduction = process.env.ALLOW_TEST_STRIPE_IN_PRODUCTION === "true";

function fail(message) {
  console.error(`[deploy-env] ${message}`);
  process.exitCode = 1;
}

function requireValue(name) {
  if (!process.env[name]) {
    fail(`Missing required production env: ${name}`);
  }
}

function requireNonPlaceholderValue(name, placeholders = []) {
  const value = process.env[name]?.trim();
  if (!value) {
    fail(`Missing required production env: ${name}`);
    return;
  }

  if (placeholders.includes(value)) {
    fail(`Production env ${name} still contains a placeholder value.`);
  }
}

if (isVercelProduction) {
  requireValue("NEXT_PUBLIC_SUPABASE_URL");
  requireValue("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  requireValue("SUPABASE_SERVICE_ROLE_KEY");
  requireValue("STRIPE_SECRET_KEY");
  requireValue("STRIPE_WEBHOOK_SECRET");
  requireValue("CRON_SECRET");
  requireValue("NEXT_PUBLIC_APP_URL");
  requireValue("RESEND_API_KEY");
  requireValue("RESEND_FROM_EMAIL");
  requireNonPlaceholderValue("PLATFORM_LEGAL_NAME");
  requireNonPlaceholderValue("PLATFORM_LEGAL_NIP", ["0000000000"]);
  requireNonPlaceholderValue("PLATFORM_LEGAL_ADDRESS", ["ul. Przykładowa 1", "ul. Przykladowa 1"]);
  requireNonPlaceholderValue("PLATFORM_LEGAL_CITY", ["00-000 Warszawa"]);
  requireNonPlaceholderValue("PLATFORM_LEGAL_KRS", ["0000000000"]);
  requireNonPlaceholderValue("PLATFORM_LEGAL_REPRESENTED_BY", ["Zarząd Spółki", "Zarzad Spolki"]);
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    console.warn(
      "[deploy-env] UPSTASH Redis env is not configured. Production rate-limited actions will fail closed until Redis is configured.",
    );
  }
  if (!allowTestStripeInProduction) {
    requireValue("SENTRY_DSN");
  }

  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  const stripeSecretKeyAllowed =
    stripeSecretKey?.startsWith("sk_live_") ||
    (allowTestStripeInProduction && stripeSecretKey?.startsWith("sk_test_"));

  if (!stripeSecretKeyAllowed) {
    fail(
      "Production deploy requires STRIPE_SECRET_KEY to use a live Stripe key, or ALLOW_TEST_STRIPE_IN_PRODUCTION=true with a test key for pilot deployments.",
    );
  }

  const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || process.env.STRIPE_PUBLISHABLE_KEY;
  const publishableKeyAllowed =
    publishableKey?.startsWith("pk_live_") ||
    (allowTestStripeInProduction && publishableKey?.startsWith("pk_test_"));

  if (!publishableKeyAllowed) {
    fail(
      "Production deploy requires a live Stripe publishable key, or ALLOW_TEST_STRIPE_IN_PRODUCTION=true with a test key for pilot deployments.",
    );
  }

  if (process.env.STRIPE_WEBHOOK_PROCESS_INLINE === "true") {
    fail("STRIPE_WEBHOOK_PROCESS_INLINE must not be enabled in production.");
  }

  if (process.env.STRIPE_PAYOUTS_ENABLED !== "true") {
    fail("Production deploy requires STRIPE_PAYOUTS_ENABLED=true.");
  }

  if (process.env.STRIPE_CONNECT_MODEL_APPROVED !== "true") {
    fail("Production deploy requires STRIPE_CONNECT_MODEL_APPROVED=true after approving ADR_STRIPE_CONNECT_ACCOUNT_MODEL_2026-06-27.md.");
  }

  try {
    const appUrl = new URL(process.env.NEXT_PUBLIC_APP_URL);
    if (appUrl.protocol !== "https:") {
      fail("NEXT_PUBLIC_APP_URL must use HTTPS in production.");
    }
  } catch {
    fail("NEXT_PUBLIC_APP_URL must be a valid URL in production.");
  }
}

if (process.exitCode) {
  process.exit(process.exitCode);
}
