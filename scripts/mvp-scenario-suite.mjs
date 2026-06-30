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
    .select("id, status, company_id, student_id, total_amount")
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

  const contractId = completedContract?.id;
  const { data: payments, error: paymentsError } = contractId
    ? await supabase
        .from("payments")
        .select("id, status, stripe_session_id, stripe_payment_intent_id, amount_total, platform_fee")
        .eq("contract_id", contractId)
    : { data: [], error: null };
  const completedPayment = payments?.find((payment) => payment.status === "completed");

  checks.push({
    ok: !paymentsError
      && Boolean(completedPayment?.stripe_session_id)
      && Boolean(completedPayment?.stripe_payment_intent_id)
      && Number(completedPayment?.amount_total) > 0
      && Number(completedPayment?.platform_fee) >= 0
      && Number(completedPayment?.platform_fee) < Number(completedPayment?.amount_total),
    name: "db completed Stripe payment evidence",
    details: paymentsError?.message || completedPayment?.id || "missing or inconsistent",
  });

  const { data: milestones, error: milestonesError } = contractId
    ? await supabase
        .from("milestones")
        .select("id, status, amount, accepted_at")
        .eq("contract_id", contractId)
    : { data: [], error: null };
  checks.push({
    ok: !milestonesError
      && Boolean(milestones?.length)
      && milestones.every((milestone) => milestone.status === "released" && milestone.accepted_at),
    name: "db released milestones evidence",
    details: milestonesError?.message || `${milestones?.length ?? 0} milestone(s)`,
  });

  const { data: payouts, error: payoutsError } = contractId
    ? await supabase
        .from("payouts")
        .select("id, status, amount_gross, platform_fee, amount_net, stripe_transfer_id, stripe_transfer_error")
        .eq("contract_id", contractId)
    : { data: [], error: null };
  const paidPayouts = payouts?.filter((payout) => payout.status === "paid") ?? [];
  const payoutAmountsConsistent = paidPayouts.every((payout) =>
    Math.abs(
      Number(payout.amount_gross) - Number(payout.platform_fee) - Number(payout.amount_net),
    ) < 0.01,
  );
  checks.push({
    ok: !payoutsError
      && paidPayouts.length > 0
      && paidPayouts.every((payout) => payout.stripe_transfer_id)
      && payoutAmountsConsistent,
    name: "db paid Stripe payout evidence",
    details: payoutsError?.message || (payouts?.length
      ? payouts.map((payout) => `${payout.status}:${payout.stripe_transfer_error || "no-error"}`).join(", ")
      : "no payouts"),
  });

  const { data: documents, error: documentsError } = contractId
    ? await supabase
        .from("contract_documents")
        .select("id, document_type, storage_path")
        .eq("contract_id", contractId)
        .in("document_type", ["contract_a", "contract_b"])
    : { data: [], error: null };
  const contractADocument = documents?.find((document) => document.document_type === "contract_a");
  const contractBDocument = documents?.find((document) => document.document_type === "contract_b");
  checks.push({
    ok: !documentsError
      && Boolean(contractADocument?.id && contractADocument.storage_path)
      && Boolean(contractBDocument?.id && contractBDocument.storage_path),
    name: "db both contract documents evidence",
    details: documentsError?.message || `${documents?.length ?? 0} document(s)`,
  });

  const { data: invoices, error: invoicesError } = contractId
    ? await supabase
        .from("invoices")
        .select("id, status, invoice_type, storage_path")
        .eq("contract_id", contractId)
    : { data: [], error: null };
  const companyInvoice = invoices?.find((invoice) => invoice.invoice_type === "company");
  const { data: ksefInvoices, error: ksefInvoicesError } = contractId
    ? await supabase
        .from("ksef_invoices")
        .select("id, invoice_status, invoice_type")
        .eq("contract_id", contractId)
    : { data: [], error: null };
  const originalKsefInvoice = ksefInvoices?.find((invoice) => invoice.invoice_type === "ORIGINAL");
  checks.push({
    ok: !invoicesError
      && !ksefInvoicesError
      && (
        (Boolean(companyInvoice?.id && companyInvoice.storage_path) && ["issued", "paid"].includes(companyInvoice?.status))
        || Boolean(originalKsefInvoice?.id && originalKsefInvoice.invoice_status)
      ),
    name: "db company final invoice evidence",
    details: invoicesError?.message
      || ksefInvoicesError?.message
      || originalKsefInvoice?.id
      || companyInvoice?.id
      || "missing",
  });

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
  await assertHttp(checks, baseUrl, "/api/stripe/create-checkout", [401, 403], { method: "POST" });
  await assertHttp(checks, baseUrl, "/api/stripe/connect/onboarding", [401, 403], { method: "POST" });
  await assertHttp(checks, baseUrl, "/api/stripe/verify-payment", [401, 403], { method: "POST" });
  await assertHttp(checks, baseUrl, "/api/stripe/webhook", 400, { method: "POST" });
  await assertHttp(checks, baseUrl, "/api/documents/download", 400);
  await assertHttp(checks, baseUrl, "/api/storage/download", 400);
  await assertHttp(checks, baseUrl, "/api/storage/upload", [401, 403], { method: "POST" });
  await assertHttp(checks, baseUrl, "/api/auth/verify-turnstile", [200, 400, 403, 500], { method: "POST" });
  await assertHttp(checks, baseUrl, "/api/webhooks/notifications", 401, { method: "POST" });
  await assertHttp(checks, baseUrl, "/api/security/csp-report", 400, {
    method: "POST",
    headers: { "content-type": "application/csp-report" },
    body: "{bad-json",
  });
  await assertHttp(checks, baseUrl, "/api/security/csp-report", 202, {
    method: "POST",
    headers: { "content-type": "application/csp-report" },
    body: JSON.stringify({
      "csp-report": {
        "document-uri": `${baseUrl}/app?token=redacted`,
        "violated-directive": "script-src",
        "blocked-uri": "inline",
        "source-file": `${baseUrl}/app?secret=redacted`,
        "line-number": 1,
      },
    }),
  });
  await assertHttp(checks, baseUrl, "/api/admin/export/invoices-zip", 401);
  await assertHttp(checks, baseUrl, "/api/admin/export/pit-csv", 401);
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
      await assertPageUsable(checks, companyPage, `${baseUrl}/app/company/orders`, "Zamowienia");
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
