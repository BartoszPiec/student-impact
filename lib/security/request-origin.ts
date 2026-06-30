import { NextRequest, NextResponse } from "next/server";
import { jsonError } from "@/lib/security/api-response";

function normalizeOrigin(value: string | null | undefined): string | null {
  if (!value) return null;

  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
}

function getConfiguredOrigins(req: NextRequest): Set<string> {
  const origins = new Set<string>();

  const configuredAppUrl = normalizeOrigin(process.env.NEXT_PUBLIC_APP_URL);
  if (configuredAppUrl) origins.add(configuredAppUrl);

  if (process.env.VERCEL_URL) {
    origins.add(`https://${process.env.VERCEL_URL}`);
  }

  if (process.env.NODE_ENV !== "production") {
    const requestOrigin = normalizeOrigin(req.nextUrl.origin);
    if (requestOrigin) origins.add(requestOrigin);
  }

  const extraOrigins = process.env.APP_ALLOWED_ORIGINS
    ?.split(",")
    .map((origin) => normalizeOrigin(origin.trim()))
    .filter((origin): origin is string => Boolean(origin));

  extraOrigins?.forEach((origin) => origins.add(origin));

  if (process.env.NODE_ENV !== "production") {
    origins.add("http://localhost:3000");
    origins.add("http://127.0.0.1:3000");
  }

  return origins;
}

export function rejectCrossSiteRequest(req: NextRequest): NextResponse | null {
  const origin = normalizeOrigin(req.headers.get("origin"));
  const allowedOrigins = getConfiguredOrigins(req);

  if (origin) {
    if (allowedOrigins.has(origin)) return null;

    return jsonError("Nieprawidłowe pochodzenie żądania.", 403);
  }

  const fetchSite = req.headers.get("sec-fetch-site");
  if (fetchSite && !["same-origin", "same-site", "none"].includes(fetchSite)) {
    return jsonError("Nieprawidłowe pochodzenie żądania.", 403);
  }

  if (process.env.NODE_ENV === "production") {
    return jsonError("Brak nagłówka Origin dla operacji wymagającej ochrony.", 403);
  }

  return null;
}
