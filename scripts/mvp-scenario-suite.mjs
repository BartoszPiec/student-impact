import fs from "node:fs";
import path from "node:path";
import puppeteer from "puppeteer";
import { createClient } from "@supabase/supabase-js";

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

function requireValue(env, name) {
  if (!env[name]) throw new Error(`Missing required env ${name}`);
  return env[name];
}

async function assertHttp(checks, baseUrl, path, expectedStatus, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, { redirect: "manual", ...options });
  const ok = Array.isArray(expectedStatus)
    ? expectedStatus.includes(response.status)
    : response.status === expectedStatus;

  checks.push({
    ok,
    name: `http ${options.method || "GET"} ${path}`,
    details: `status ${response.status}`,
  });
}

async function assertCronProtected(checks, baseUrl, path) {
  await assertHttp(checks, baseUrl, path, 401);
}

async function login(page, baseUrl, email, password) {
  await page.goto(`${baseUrl}/auth`, { waitUntil: "networkidle2" });
  await page.waitForSelector('input[placeholder="name@example.com"], input[placeholder="kontakt@firma.pl"]', { timeout: 15_000 });
  await page.evaluate(() => {
    for (const input of document.querySelectorAll("input")) {
      input.value = "";
      input.dispatchEvent(new Event("input", { bubbles: true }));
    }
  });
  await page.type('input[placeholder="name@example.com"], input[placeholder="kontakt@firma.pl"]', email);
  await page.type('input[type="password"]', password);
  await Promise.allSettled([
    page.waitForNavigation({ waitUntil: "networkidle2", timeout: 15_000 }),
    page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll("button"));
      const submit = buttons.find((button) => /zaloguj/i.test(button.textContent || ""));
      submit?.click();
    }),
  ]);
  await page.waitForFunction(() => window.location.pathname.startsWith("/app"), { timeout: 20_000 });
}

async function assertPageUsable(checks, page, url, requiredText) {
  await page.goto(url, { waitUntil: "networkidle2" });
  const bodyText = await page.evaluate(() => document.body.innerText);
  const hasRequiredText = requiredText ? bodyText.toLowerCase().includes(requiredText.toLowerCase()) : true;
  const hasTechnicalError = /(Unhandled Runtime Error|TypeError:|ReferenceError:|SyntaxError:|stack trace|Supabase error|StripeError)/i.test(bodyText);
  const hasMojibake = /�|Ã³|Å‚|Ä™|Ä…|Å¼|Å›|Ä‡|Å„|Åº/.test(bodyText);

  checks.push({
    ok: hasRequiredText && !hasTechnicalError && !hasMojibake,
    name: `ui ${new URL(url).pathname}`,
    details: hasTechnicalError ? "technical error visible" : hasMojibake ? "mojibake / uszkodzone znaki PL" : requiredText || "loaded",
  });
}

async function assertAdminBlocked(checks, page, baseUrl, label) {
  await page.goto(`${baseUrl}/app/admin/payouts`, { waitUntil: "networkidle2" });
  const bodyText = await page.evaluate(() => document.body.innerText);
  const exposedAdminPanel = /Operacyjny panel wyplat|Wyplaty\s+Odswiez|Prowizje/i.test(bodyText);

  checks.push({
    ok: !exposedAdminPanel,
    name: `rbac admin payouts blocked for ${label}`,
    details: exposedAdminPanel ? "admin panel visible" : "blocked",
  });
}

async function assertNoForeignDocumentDownload(checks, page, baseUrl, documentId, label) {
  const response = await page.goto(`${baseUrl}/api/documents/download?documentId=${documentId}`, {
    waitUntil: "networkidle2",
  });
  const status = response?.status() ?? 0;

  checks.push({
    ok: [403, 404].includes(status),
    name: `documents foreign access blocked for ${label}`,
    details: `status ${status}`,
  });
}

async function checkSupabaseEvidence(checks, env) {
  const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

  const { data: readiness, error: readinessError } = await supabase.rpc("production_readiness_report_v1");
  checks.push({
    ok: !readinessError
      && Array.isArray(readiness?.rls_issues)
      && readiness.rls_issues.length === 0
      && Array.isArray(readiness?.missing_functions)
      && readiness.missing_functions.length === 0,
    name: "db readiness rpc",
    details: readinessError?.message || "rls/functions ok",
  });

  const { data: packageRow, error: packageError } = await supabase
    .from("service_packages")
    .select("id, title, status")
    .ilike("title", "%Pilot Sandbox%")
    .eq("status", "active")
    .limit(1)
    .maybeSingle();

  checks.push({
    ok: !packageError && Boolean(packageRow?.id),
    name: "db pilot quick task package",
    details: packageError?.message || packageRow?.title || "missing",
  });

  const { data: completedContract, error: contractError } = await supabase
    .from("contracts")
    .select("id, status, company_id, student_id, payments(status), payouts(status)")
    .eq("status", "completed")
    .not("service_order_id", "is", null)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  checks.push({
    ok: !contractError && Boolean(completedContract?.id),
    name: "db completed service-order contract evidence",
    details: contractError?.message || completedContract?.id || "missing",
  });

  const { data: contractADocument, error: documentError } = completedContract?.id
    ? await supabase
        .from("contract_documents")
        .select("id")
        .eq("contract_id", completedContract.id)
        .eq("document_type", "contract_a")
        .limit(1)
        .maybeSingle()
    : { data: null, error: null };

  checks.push({
    ok: !documentError && Boolean(contractADocument?.id),
    name: "db contract document evidence",
    details: documentError?.message || contractADocument?.id || "missing",
  });

  const { data: contractBDocument } = completedContract?.id
    ? await supabase
        .from("contract_documents")
        .select("id")
        .eq("contract_id", completedContract.id)
        .eq("document_type", "contract_b")
        .limit(1)
        .maybeSingle()
    : { data: null };

  return {
    completedContract,
    contractADocument,
    contractBDocument,
  };
}

async function main() {
  const envPath = argValue("env-file", ".env.local");
  const env = { ...loadEnv(envPath), ...process.env };
  const baseUrl = (argValue("base-url", env.E2E_BASE_URL || env.NEXT_PUBLIC_APP_URL) || "").replace(/\/$/, "");
  if (!baseUrl) throw new Error("Missing --base-url or E2E_BASE_URL");

  requireValue(env, "NEXT_PUBLIC_SUPABASE_URL");
  requireValue(env, "SUPABASE_SERVICE_ROLE_KEY");

  const checks = [];

  await assertHttp(checks, baseUrl, "/", 200);
  await assertHttp(checks, baseUrl, "/auth", 200);
  await assertHttp(checks, baseUrl, "/app/profile", [302, 303, 307, 308]);
  await assertHttp(checks, baseUrl, "/api/stripe/create-checkout", 401, { method: "POST" });
  await assertHttp(checks, baseUrl, "/api/stripe/connect/onboarding", 401, { method: "POST" });
  await assertHttp(checks, baseUrl, "/api/stripe/webhook", 400, { method: "POST" });
  await assertHttp(checks, baseUrl, "/api/documents/download", 400);
  await assertCronProtected(checks, baseUrl, "/api/cron/process-stripe-events");
  await assertCronProtected(checks, baseUrl, "/api/cron/auto-accept");
  await assertCronProtected(checks, baseUrl, "/api/cron/cleanup-expired-sessions");

  const evidence = await checkSupabaseEvidence(checks, env);

  const companyEmail = env.TEST_COMPANY_EMAIL;
  const companyPassword = env.TEST_COMPANY_PASSWORD;
  const studentEmail = env.TEST_STUDENT_EMAIL;
  const studentPassword = env.TEST_STUDENT_PASSWORD;

  if (companyEmail && companyPassword && studentEmail && studentPassword) {
    const browser = await puppeteer.launch({ headless: true, args: ["--no-sandbox"] });
    try {
      const companyContext = await browser.createBrowserContext();
      const companyPage = await companyContext.newPage();
      await login(companyPage, baseUrl, companyEmail, companyPassword);
      await assertPageUsable(checks, companyPage, `${baseUrl}/app/company/packages`, "Pilot Sandbox");
      await assertPageUsable(checks, companyPage, `${baseUrl}/app/company/orders`, "Zlecen");
      await assertPageUsable(checks, companyPage, `${baseUrl}/app/company/applications`, null);
      await assertPageUsable(checks, companyPage, `${baseUrl}/app/company/offers`, null);
      await assertAdminBlocked(checks, companyPage, baseUrl, "company");

      if (evidence.contractBDocument?.id) {
        await assertNoForeignDocumentDownload(checks, companyPage, baseUrl, evidence.contractBDocument.id, "company contract_b");
      }

      const studentContext = await browser.createBrowserContext();
      const studentPage = await studentContext.newPage();
      await login(studentPage, baseUrl, studentEmail, studentPassword);
      await assertPageUsable(checks, studentPage, `${baseUrl}/app/profile`, "Stripe");
      await assertPageUsable(checks, studentPage, `${baseUrl}/app/finances`, "Finanse");
      await assertPageUsable(checks, studentPage, `${baseUrl}/app/jobs`, null);
      await assertPageUsable(checks, studentPage, `${baseUrl}/app/applications`, null);
      await assertAdminBlocked(checks, studentPage, baseUrl, "student");

      if (evidence.contractADocument?.id) {
        await assertNoForeignDocumentDownload(checks, studentPage, baseUrl, evidence.contractADocument.id, "student");
      }
    } finally {
      await browser.close();
    }
  } else {
    checks.push({
      ok: false,
      name: "ui authenticated role scenarios",
      details: "Brak TEST_COMPANY_EMAIL/PASSWORD lub TEST_STUDENT_EMAIL/PASSWORD.",
    });
  }

  for (const check of checks) {
    console.log(`${check.ok ? "[OK]" : "[FAIL]"} ${check.name} - ${check.details}`);
  }

  const failed = checks.filter((check) => !check.ok);
  const reportPath = argValue("report", env.E2E_REPORT_PATH || "test-results/mvp-scenario-suite.json");
  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(
    reportPath,
    JSON.stringify({
      baseUrl,
      checkedAt: new Date().toISOString(),
      total: checks.length,
      failed: failed.length,
      checks,
    }, null, 2),
  );
  console.log(`\nReport written to ${reportPath}`);

  if (failed.length > 0) {
    console.error(`\nMVP scenario suite failed: ${failed.length} check(s).`);
    process.exit(1);
  }

  console.log("\nMVP scenario suite passed.");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
