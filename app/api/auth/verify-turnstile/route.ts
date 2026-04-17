import { NextRequest, NextResponse } from "next/server";

type TurnstileResponse = {
  success: boolean;
  "error-codes"?: string[];
};

export async function POST(req: NextRequest) {
  try {
    const secret = process.env.TURNSTILE_SECRET_KEY;
    if (!secret) {
      if (process.env.NODE_ENV !== "production") {
        return NextResponse.json({ success: true, skipped: true });
      }

      return NextResponse.json(
        { success: false, error: "Brak konfiguracji CAPTCHA po stronie serwera." },
        { status: 500 },
      );
    }

    const body = await req.json().catch(() => null) as { token?: string } | null;
    const token = body?.token?.trim();

    if (!token) {
      return NextResponse.json({ success: false, error: "Brak tokenu CAPTCHA." }, { status: 400 });
    }

    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || undefined;

    const formData = new URLSearchParams({
      secret,
      response: token,
    });
    if (ip) {
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
      return NextResponse.json(
        { success: false, error: "Nie udało się zweryfikować CAPTCHA." },
        { status: 502 },
      );
    }

    const verification = await verifyRes.json() as TurnstileResponse;
    if (!verification.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Weryfikacja CAPTCHA nie powiodła się.",
          codes: verification["error-codes"] ?? [],
        },
        { status: 400 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
