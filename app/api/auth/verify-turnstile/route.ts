import { noStoreJson } from "@/lib/security/api-response";
import { NextRequest } from "next/server";
import { rejectCrossSiteRequest } from "@/lib/security/request-origin";
import { buildRateLimitKey, enforceRateLimit, getRequestIp } from "@/lib/rate-limit";
import { logCriticalError } from "@/lib/observability/error-log";
import { z } from "zod";

const turnstileRequestSchema = z.object({
  token: z.string().trim().min(1).max(4096),
});

const turnstileResponseSchema = z.object({
  success: z.boolean(),
  "error-codes": z.array(z.string()).optional(),
});

const TURNSTILE_ERROR_MESSAGE = "Nie udało się zweryfikować CAPTCHA.";

function readErrorCode(error: unknown): string | null {
  if (!error || typeof error !== "object" || !("code" in error)) {
    return null;
  }

  const code = (error as { code?: unknown }).code;
  return typeof code === "string" && code.trim() ? code.trim() : null;
}

async function logTurnstileError(input: {
  source: string;
  error?: unknown;
  message?: string;
  level?: "error" | "warning";
  context?: Record<string, unknown>;
}) {
  await logCriticalError({
    source: input.source,
    error: input.error,
    message: input.message,
    level: input.level ?? "error",
    errorCode: readErrorCode(input.error),
    context: input.context,
  });
}

export async function POST(req: NextRequest) {
  try {
    const crossSiteResponse = rejectCrossSiteRequest(req);
    if (crossSiteResponse) return crossSiteResponse;

    const ip = getRequestIp(req);
    const limitResult = await enforceRateLimit(
      "auth",
      buildRateLimitKey(["verify-turnstile", ip]),
    );
    if (!limitResult.success) {
      return noStoreJson(
        { success: false, error: "Zbyt wiele prób. Spróbuj ponownie za chwilę." },
        { status: 429 },
      );
    }

    const secret = process.env.TURNSTILE_SECRET_KEY;
    if (!secret) {
      if (process.env.NODE_ENV !== "production") {
        return noStoreJson({ success: true, skipped: true });
      }

      await logTurnstileError({
        source: "auth.turnstile.missing_secret",
        message: "TURNSTILE_SECRET_KEY is not configured.",
      });
      return noStoreJson(
        { success: false, error: "Brak konfiguracji CAPTCHA po stronie serwera." },
        { status: 500 },
      );
    }

    const rawBody = await req.json().catch(() => null);
    const parsedBody = turnstileRequestSchema.safeParse(rawBody);

    if (!parsedBody.success) {
      return noStoreJson({ success: false, error: "Brak tokenu CAPTCHA." }, { status: 400 });
    }
    const { token } = parsedBody.data;

    const formData = new URLSearchParams({
      secret,
      response: token,
    });
    if (ip !== "unknown") {
      formData.append("remoteip", ip);
    }

    const verifyRes = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formData.toString(),
      cache: "no-store",
    });

    if (!verifyRes.ok) {
      await logTurnstileError({
        source: "auth.turnstile.cloudflare_http",
        message: "Cloudflare Turnstile verification returned non-OK status.",
        context: {
          status: verifyRes.status,
          statusText: verifyRes.statusText,
        },
      });
      return noStoreJson(
        { success: false, error: TURNSTILE_ERROR_MESSAGE },
        { status: 502 },
      );
    }

    const verificationPayload = await verifyRes.json().catch(async (error: unknown) => {
      await logTurnstileError({
        source: "auth.turnstile.cloudflare_json",
        error,
      });
      return null;
    });

    const parsedVerification = turnstileResponseSchema.safeParse(verificationPayload);
    if (!parsedVerification.success) {
      await logTurnstileError({
        source: "auth.turnstile.cloudflare_schema",
        error: parsedVerification.error,
      });
      return noStoreJson(
        { success: false, error: TURNSTILE_ERROR_MESSAGE },
        { status: 502 },
      );
    }

    const verification = parsedVerification.data;
    if (!verification.success) {
      return noStoreJson(
        {
          success: false,
          error: "Weryfikacja CAPTCHA nie powiodła się.",
          codes: verification["error-codes"] ?? [],
        },
        { status: 400 },
      );
    }

    return noStoreJson({ success: true });
  } catch (error) {
    await logTurnstileError({
      source: "auth.turnstile.unhandled",
      error,
    });
    return noStoreJson(
      { success: false, error: TURNSTILE_ERROR_MESSAGE },
      { status: 500 },
    );
  }
}
