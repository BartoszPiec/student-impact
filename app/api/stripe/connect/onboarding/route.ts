import { NextRequest, NextResponse } from "next/server";
import { resolveServerAppUrl } from "@/lib/app-url";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { getStripe } from "@/lib/stripe";
import { isPayoutAccountReady } from "@/lib/stripe/connect-readiness";
import { buildRateLimitKey, enforceRateLimit, getRequestIp } from "@/lib/rate-limit";
import { rejectCrossSiteRequest } from "@/lib/security/request-origin";

export const maxDuration = 10;

type StudentStripeRow = {
  stripe_account_id: string | null;
};

export async function POST(req: NextRequest) {
  try {
    const crossSiteResponse = rejectCrossSiteRequest(req);
    if (crossSiteResponse) return crossSiteResponse;

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Musisz być zalogowany." }, { status: 401 });
    }

    const ip = getRequestIp(req);
    const limitResult = await enforceRateLimit(
      "checkout",
      buildRateLimitKey(["stripe-connect-onboarding", user.id, ip]),
    );
    if (!limitResult.success) {
      return NextResponse.json(
        { error: "Zbyt wiele prób. Spróbuj ponownie za chwilę." },
        { status: 429 },
      );
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("user_id", user.id)
      .maybeSingle();

    if (profile?.role !== "student") {
      return NextResponse.json({ error: "Konto Stripe do wypłat jest dostępne tylko dla studentów." }, { status: 403 });
    }

    const admin = createAdminClient();
    const { data: studentProfile } = await admin
      .from("student_profiles")
      .select("stripe_account_id")
      .eq("user_id", user.id)
      .maybeSingle();

    let stripeAccountId = (studentProfile as StudentStripeRow | null)?.stripe_account_id ?? null;
    let accountReady = false;
    const stripe = getStripe();

    if (!stripeAccountId) {
      const account = await stripe.accounts.create({
        type: "express",
        country: "PL",
        email: user.email ?? undefined,
        capabilities: {
          transfers: { requested: true },
        },
        metadata: {
          user_id: user.id,
          product: "student2work",
        },
      });

      stripeAccountId = account.id;

      const { error: updateError } = await admin
        .from("student_profiles")
        .upsert(
          {
            user_id: user.id,
            stripe_account_id: stripeAccountId,
            stripe_onboarding_completed_at: null,
          },
          { onConflict: "user_id" },
        );

      if (updateError) {
        return NextResponse.json(
          { error: "Nie udało się zapisać konta Stripe studenta." },
          { status: 500 },
        );
      }
    } else {
      const account = await stripe.accounts.retrieve(stripeAccountId);
      accountReady = isPayoutAccountReady(account);

      await admin
        .from("student_profiles")
        .update({
          stripe_onboarding_completed_at: accountReady ? new Date().toISOString() : null,
        })
        .eq("user_id", user.id);
    }

    const baseUrl = resolveServerAppUrl(req);
    if (!baseUrl) {
      return NextResponse.json(
        { error: "Konfiguracja aplikacji jest niekompletna." },
        { status: 500 },
      );
    }
    if (accountReady) {
      const loginLink = await stripe.accounts.createLoginLink(stripeAccountId);
      return NextResponse.json({ url: loginLink.url });
    }

    const accountLink = await stripe.accountLinks.create({
      account: stripeAccountId,
      refresh_url: `${baseUrl}/app/profile?stripe=refresh`,
      return_url: `${baseUrl}/app/profile?stripe=connected`,
      type: "account_onboarding",
    });

    return NextResponse.json({ url: accountLink.url });
  } catch (error) {
    console.error("[stripe-connect-onboarding]", error);
    return NextResponse.json(
      { error: "Nie udało się przygotować konta wypłat Stripe. Spróbuj ponownie za chwilę." },
      { status: 500 },
    );
  }
}
