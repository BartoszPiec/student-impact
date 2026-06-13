import { NextRequest, NextResponse } from "next/server";

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

  const requestOrigin = normalizeOrigin(req.nextUrl.origin);
  if (requestOrigin) origins.add(requestOrigin);

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

    return NextResponse.json(
      { error: "Nieprawidlowe pochodzenie zadania." },
      { status: 403 },
    );
  }

  const fetchSite = req.headers.get("sec-fetch-site");
  if (fetchSite && !["same-origin", "same-site", "none"].includes(fetchSite)) {
    return NextResponse.json(
      { error: "Nieprawidlowe pochodzenie zadania." },
      { status: 403 },
    );
  }

  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { error: "Brak naglowka Origin dla operacji wymagajacej ochrony." },
      { status: 403 },
    );
  }

  return null;
}
