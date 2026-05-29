import fs from "node:fs";
import dns from "node:dns/promises";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const REQUIRED_STRIPE_EVENTS = [
  "checkout.session.completed",
  "checkout.session.expired",
  "account.updated",
  "charge.refunded",
  "refund.created",
];

function loadEnv(path) {
  const values = {};
  if (!fs.existsSync(path)) return values;

  for (const raw of fs.readFileSync(path, "utf8").split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("#") || !line.includes("=")) continue;
    const index = line.indexOf("=");
    const key = line.slice(0, index).trim();
    let value = line.slice(index + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    values[key] = value;
  }

  return values;
}

function argValue(name, fallback) {
  const prefix = `--${name}=`;
  const found = process.argv.find((arg) => arg.startsWith(prefix));
  return found ? found.slice(prefix.length) : fallback;
}

function fail(checks, name, details) {
  checks.push({ ok: false, name, details });
}

function pass(checks, name, details = "") {
  checks.push({ ok: true, name, details });
}

function requireEnv(env, checks, keys) {
  for (const key of keys) {
    if (!env[key]) fail(checks, `env:${key}`, "Brak wymaganej zmiennej.");
    else pass(checks, `env:${key}`);
  }
}

function assertKeyMode(env, checks, target) {
  const expectedSecretPrefix = target === "production" ? "sk_live_" : "sk_test_";
  const expectedPublicPrefix = target === "production" ? "pk_live_" : "pk_test_";

  if (env.STRIPE_SECRET_KEY?.startsWith(expectedSecretPrefix)) {
    pass(checks, "stripe:key-mode:secret", target);
  } else {
    fail(checks, "stripe:key-mode:secret", `STRIPE_SECRET_KEY musi zaczynac sie od ${expectedSecretPrefix}.`);
  }

  const publishableKey = env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || env.STRIPE_PUBLISHABLE_KEY;
  if (publishableKey?.startsWith(expectedPublicPrefix)) {
    pass(checks, "stripe:key-mode:publishable", target);
  } else {
    fail(checks, "stripe:key-mode:publishable", `Stripe publishable key musi zaczynac sie od ${expectedPublicPrefix}.`);
  }

  if (target === "production" && env.STRIPE_WEBHOOK_PROCESS_INLINE === "true") {
    fail(checks, "stripe:inline-processing", "Inline processing webhookow jest dozwolony tylko w sandbox/preview.");
  } else {
    pass(checks, "stripe:inline-processing");
  }

  if (target === "production" && env.STRIPE_PAYOUTS_ENABLED !== "true") {
    fail(checks, "stripe:payouts-enabled", "Produkcja wymaga STRIPE_PAYOUTS_ENABLED=true.");
  } else {
    pass(checks, "stripe:payouts-enabled", env.STRIPE_PAYOUTS_ENABLED || "");
  }
}

function assertAppUrl(env, checks, target) {
  const appUrl = env.NEXT_PUBLIC_APP_URL;
  if (!appUrl) {
    fail(checks, "app:url", "NEXT_PUBLIC_APP_URL jest wymagany przed produkcja.");
    return;
  }

  try {
    const parsed = new URL(appUrl);
    if (parsed.protocol !== "https:") {
      fail(checks, "app:url", "NEXT_PUBLIC_APP_URL musi uzywac HTTPS.");
      return;
    }

    if (target === "production" && parsed.hostname.endsWith(".vercel.app")) {
      fail(checks, "app:url", "Produkcja powinna wskazywac domena docelowa, nie roboczy adres vercel.app.");
      return;
    }

    pass(checks, "app:url", appUrl);
  } catch {
    fail(checks, "app:url", "NEXT_PUBLIC_APP_URL nie jest poprawnym URL.");
  }
}

async function checkProductionDns(env, checks, target) {
  if (target !== "production" || !env.NEXT_PUBLIC_APP_URL) return;

  try {
    const hostname = new URL(env.NEXT_PUBLIC_APP_URL).hostname;
    if (hostname.endsWith(".vercel.app")) return;

    const records = await dns.resolve4(hostname);
    if (records.includes("76.76.21.21")) {
      pass(checks, "dns:vercel", hostname);
    } else {
      fail(checks, "dns:vercel", `${hostname} nie wskazuje na Vercel A 76.76.21.21. Aktualne A: ${records.join(", ")}.`);
    }
  } catch (error) {
    fail(checks, "dns:vercel", error instanceof Error ? error.message : "Nie udalo sie sprawdzic DNS.");
  }
}

async function checkStripe(env, checks) {
  if (!env.STRIPE_SECRET_KEY || !env.NEXT_PUBLIC_APP_URL) return;

  const stripe = new Stripe(env.STRIPE_SECRET_KEY);
  const expectedWebhookUrl = `${env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "")}/api/stripe/webhook`;
  const endpoints = await stripe.webhookEndpoints.list({ limit: 100 });
  const endpoint = endpoints.data.find((item) => item.url === expectedWebhookUrl && item.status === "enabled");

  if (!endpoint) {
    fail(checks, "stripe:webhook", `Brak aktywnego webhooka Stripe dla ${expectedWebhookUrl}.`);
    return;
  }

  const missingEvents = REQUIRED_STRIPE_EVENTS.filter((eventName) => !endpoint.enabled_events.includes(eventName));
  if (missingEvents.length > 0) {
    fail(checks, "stripe:webhook-events", `Brak eventow: ${missingEvents.join(", ")}.`);
  } else {
    pass(checks, "stripe:webhook-events", endpoint.id);
  }

  pass(checks, "stripe:webhook", endpoint.id);
}

async function checkSupabase(env, checks) {
  if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) return;

  const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

  const { data: report, error: reportError } = await supabase.rpc("production_readiness_report_v1");
  if (reportError) {
    fail(checks, "supabase:readiness-rpc", reportError.message);
  } else {
    pass(checks, "supabase:readiness-rpc");
    if (Array.isArray(report?.missing_tables) && report.missing_tables.length > 0) {
      fail(checks, "supabase:critical-tables", JSON.stringify(report.missing_tables));
    } else {
      pass(checks, "supabase:critical-tables");
    }

    if (Array.isArray(report?.rls_issues) && report.rls_issues.length > 0) {
      fail(checks, "supabase:rls", JSON.stringify(report.rls_issues));
    } else {
      pass(checks, "supabase:rls");
    }

    if (Array.isArray(report?.missing_functions) && report.missing_functions.length > 0) {
      fail(checks, "supabase:functions", JSON.stringify(report.missing_functions));
    } else {
      pass(checks, "supabase:functions");
    }
  }

  const { data: bucket, error: bucketError } = await supabase.storage.getBucket("deliverables");
  if (bucketError || !bucket) {
    fail(checks, "supabase:storage:deliverables", bucketError?.message || "Brak bucketu deliverables.");
  } else if (bucket.public) {
    fail(checks, "supabase:storage:deliverables", "Bucket deliverables nie moze byc publiczny.");
  } else {
    pass(checks, "supabase:storage:deliverables");
  }
}

async function checkHttp(env, checks) {
  if (!env.NEXT_PUBLIC_APP_URL) return;
  const baseUrl = env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");

  async function request(path, options = {}) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10_000);
    try {
      return await fetch(`${baseUrl}${path}`, {
        redirect: "manual",
        ...options,
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeout);
    }
  }

  for (const path of ["/", "/auth"]) {
    try {
      const response = await request(path);
      if (response.status >= 200 && response.status < 400) {
        pass(checks, `http:${path}`, String(response.status));
      } else {
        fail(checks, `http:${path}`, `Status ${response.status}.`);
      }
    } catch (error) {
      fail(checks, `http:${path}`, error instanceof Error ? error.message : "Blad polaczenia.");
    }
  }

  for (const path of ["/api/stripe/create-checkout", "/api/stripe/connect/onboarding"]) {
    try {
      const response = await request(path, { method: "POST" });
      if (response.status === 401) {
        pass(checks, `http:${path}:unauthenticated`, "401");
      } else {
        fail(checks, `http:${path}:unauthenticated`, `Oczekiwano 401, jest ${response.status}.`);
      }
    } catch (error) {
      fail(checks, `http:${path}:unauthenticated`, error instanceof Error ? error.message : "Blad polaczenia.");
    }
  }

  try {
    const webhookResponse = await request("/api/stripe/webhook", { method: "POST" });
    if (webhookResponse.status === 400) {
      pass(checks, "http:/api/stripe/webhook:unsigned", "400");
    } else {
      fail(checks, "http:/api/stripe/webhook:unsigned", `Oczekiwano 400, jest ${webhookResponse.status}.`);
    }
  } catch (error) {
    fail(checks, "http:/api/stripe/webhook:unsigned", error instanceof Error ? error.message : "Blad polaczenia.");
  }
}

async function main() {
  const envPath = argValue("env-file", ".env.local");
  const target = argValue("target", "preview");
  const env = { ...loadEnv(envPath), ...process.env };
  const checks = [];

  requireEnv(env, checks, [
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "SUPABASE_SERVICE_ROLE_KEY",
    "STRIPE_SECRET_KEY",
    "STRIPE_WEBHOOK_SECRET",
    "CRON_SECRET",
    "NEXT_PUBLIC_APP_URL",
  ]);

  if (target === "production") {
    requireEnv(env, checks, ["UPSTASH_REDIS_REST_URL", "UPSTASH_REDIS_REST_TOKEN", "SENTRY_DSN"]);
  }

  assertKeyMode(env, checks, target);
  assertAppUrl(env, checks, target);
  await checkProductionDns(env, checks, target);
  await checkStripe(env, checks);
  await checkSupabase(env, checks);
  await checkHttp(env, checks);

  for (const check of checks) {
    const prefix = check.ok ? "[OK]" : "[FAIL]";
    console.log(`${prefix} ${check.name}${check.details ? ` - ${check.details}` : ""}`);
  }

  const failed = checks.filter((check) => !check.ok);
  if (failed.length > 0) {
    console.error(`\nProduction readiness failed: ${failed.length} check(s).`);
    process.exit(1);
  }

  console.log("\nProduction readiness checks passed.");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
