import { NextRequest } from "next/server";
import { logCriticalError } from "@/lib/observability/error-log";
import { jsonError, noStoreJson } from "@/lib/security/api-response";
import { buildRateLimitKey, enforceRateLimit, getRequestIp } from "@/lib/rate-limit";

export const maxDuration = 5;

const MAX_BODY_LENGTH = 20_000;
const MAX_REPORTS_PER_REQUEST = 5;
const MAX_VALUE_LENGTH = 500;

type CspReportContext = {
  documentUrl?: string;
  blockedUrl?: string;
  effectiveDirective?: string;
  violatedDirective?: string;
  sourceFile?: string;
  lineNumber?: number;
  statusCode?: number;
  disposition?: string;
  reportType?: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readRecord(value: unknown, key: string): Record<string, unknown> | null {
  if (!isRecord(value)) return null;
  const nested = value[key];
  return isRecord(nested) ? nested : null;
}

function readString(value: unknown, key: string): string | undefined {
  if (!isRecord(value)) return undefined;
  const raw = value[key];
  return typeof raw === "string" && raw.trim() ? raw.trim() : undefined;
}

function readNumber(value: unknown, key: string): number | undefined {
  if (!isRecord(value)) return undefined;
  const raw = value[key];
  return typeof raw === "number" && Number.isFinite(raw) ? raw : undefined;
}

function stripUrl(value: string | undefined): string | undefined {
  if (!value) return undefined;

  const trimmed = value.trim();
  if (!trimmed || trimmed === "inline" || trimmed === "eval") {
    return trimmed;
  }

  try {
    const parsed = new URL(trimmed);
    parsed.search = "";
    parsed.hash = "";
    return parsed.toString().slice(0, MAX_VALUE_LENGTH);
  } catch {
    return trimmed.split(/[?#]/, 1)[0]?.slice(0, MAX_VALUE_LENGTH);
  }
}

function normalizeReport(rawReport: unknown): CspReportContext | null {
  const legacyReport = readRecord(rawReport, "csp-report");
  const reportEnvelopeBody = readRecord(rawReport, "body");
  const report = legacyReport ?? reportEnvelopeBody ?? (isRecord(rawReport) ? rawReport : null);
  if (!report) return null;

  return {
    reportType: readString(rawReport, "type"),
    documentUrl: stripUrl(readString(report, "document-uri") ?? readString(report, "documentURL")),
    blockedUrl: stripUrl(readString(report, "blocked-uri") ?? readString(report, "blockedURL")),
    effectiveDirective: readString(report, "effective-directive") ?? readString(report, "effectiveDirective"),
    violatedDirective: readString(report, "violated-directive") ?? readString(report, "violatedDirective"),
    sourceFile: stripUrl(readString(report, "source-file") ?? readString(report, "sourceFile")),
    lineNumber: readNumber(report, "line-number") ?? readNumber(report, "lineNumber"),
    statusCode: readNumber(report, "status-code") ?? readNumber(report, "statusCode"),
    disposition: readString(report, "disposition"),
  };
}

function extractReports(payload: unknown): CspReportContext[] {
  const rawReports = Array.isArray(payload) ? payload : [payload];
  return rawReports
    .map(normalizeReport)
    .filter((report): report is CspReportContext => report !== null)
    .slice(0, MAX_REPORTS_PER_REQUEST);
}

export async function POST(req: NextRequest) {
  const ip = getRequestIp(req);
  const limit = await enforceRateLimit("csp", buildRateLimitKey(["csp-report", ip]));
  if (!limit.success) {
    return jsonError("Zbyt wiele raportow CSP. Sprobuj ponownie za chwile.", 429);
  }

  const rawBody = await req.text();
  if (rawBody.length > MAX_BODY_LENGTH) {
    return jsonError("Raport CSP jest zbyt duzy.", 413);
  }

  if (!rawBody.trim()) {
    return noStoreJson({ ok: true }, { status: 202 });
  }

  let payload: unknown;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return jsonError("Nieprawidlowy raport CSP.", 400);
  }

  const reports = extractReports(payload);
  if (reports.length === 0) {
    return noStoreJson({ ok: true }, { status: 202 });
  }

  await Promise.all(
    reports.map((report) =>
      logCriticalError({
        source: "security:csp-report",
        level: "warning",
        message: "CSP report-only violation.",
        context: report,
      }),
    ),
  );

  return noStoreJson({ ok: true }, { status: 202 });
}
