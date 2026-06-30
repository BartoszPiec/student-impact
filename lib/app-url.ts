import type { NextRequest } from "next/server";

export function resolveServerAppUrl(req?: NextRequest): string | null {
  const vercelUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null;

  if (process.env.VERCEL_ENV === "preview" && vercelUrl) {
    return vercelUrl;
  }

  const configuredUrl = process.env.NEXT_PUBLIC_APP_URL || vercelUrl;
  if (configuredUrl) {
    return configuredUrl;
  }

  if (process.env.NODE_ENV === "production") {
    return null;
  }

  return req ? `${req.nextUrl.protocol}//${req.headers.get("host")}` : null;
}
