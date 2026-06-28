import { jsonError, noStoreJson } from "@/lib/security/api-response";
import { NextRequest } from "next/server";
import { resolveServerAppUrl } from "@/lib/app-url";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { getStripe } from "@/lib/stripe";
import { isPayoutAccountReady } from "@/lib/stripe/connect-readiness";
import { buildRateLimitKey, enforceRateLimit, getRequestIp } from "@/lib/rate-limit";
import { rejectCrossSiteRequest } from "@/lib/security/request-origin";
import { logCriticalError } from "@/lib/observability/error-log";

export const maxDuration = 10;

type StudentStripeRow = {
  stripe_account_id: string | null;
};

const CONNECT_ONBOARDING_ERROR_MESSAGE =
  "Nie udało się przygotować konta wypłat Stripe. Spróbuj ponownie za chwilę.";

function readErrorCode(error: unknown): string | null {
  if (!error || typeof error !== "object" || !("code" in error)) {
    return null;
  }

  const code = (error as { code?: unknown }).code;
  return typeof code === "string" && code.trim() ? code.trim() : null;
}

async function logStripeConnectOnboardingError(input: {
  source: string;
  error?: unknown;
  message?: string;
  userId?: string | null;
  stripeAccountId?: string | null;
  level?: "error" | "warning";
}) {
  await logCriticalError({
    source: input.source,
    error: input.error,
    message: input.message,
    level: input.level ?? "error",
    errorCode: readErrorCode(input.error),
    userId: input.userId ?? null,
    context: {
      stripeAccountId: input.stripeAccountId ?? null,
    },
  });
}

export async function POST(req: NextRequest) {
  try {
    const crossSiteResponse = rejectCrossSiteRequest(req);
    if (crossSiteResponse) return crossSiteResponse;

    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError) {
      await logStripeConnectOnboardingError({
        source: "stripe.connect.onboarding.auth_lookup",
        error: authError,
      });
      return jsonError("Nie udało się zweryfikować sesji użytkownika.", 401);
    }

    if (!user) {
      return jsonError("Musisz być zalogowany.", 401);
    }

    const ip = getRequestIp(req);
    const limitResult = await enforceRateLimit(
      "checkout",
      buildRateLimitKey(["stripe-connect-onboarding", user.id, ip]),
    );
    if (!limitResult.success) {
      return jsonError("Zbyt wiele prób. Spróbuj ponownie za chwilę.", 429);
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("user_id", user.id)
      .maybeSingle();

    if (profileError) {
      await logStripeConnectOnboardingError({
        source: "stripe.connect.onboarding.profile_lookup",
        error: profileError,
        userId: user.id,
      });
      return jsonError("Nie udało się zweryfikować uprawnień użytkownika.", 500);
    }

    if (profile?.role !== "student") {
      return jsonError("Konto Stripe do wypłat jest dostępne tylko dla studentów.", 403);
    }

    const admin = createAdminClient();
    const { data: studentProfile, error: studentProfileError } = await admin
      .from("student_profiles")
      .select("stripe_account_id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (studentProfileError) {
      await logStripeConnectOnboardingError({
        source: "stripe.connect.onboarding.student_profile_lookup",
        error: studentProfileError,
        userId: user.id,
      });
      return jsonError("Nie udało się pobrać profilu studenta.", 500);
    }

    let stripeAccountId = (studentProfile as StudentStripeRow | null)?.stripe_account_id ?? null;
    let accountReady = false;
    const stripe = getStripe();

    if (!stripeAccountId) {
      // Pilot compatibility path. Production live payouts require the Connect ADR gate.
      try {
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
      } catch (error) {
        await logStripeConnectOnboardingError({
          source: "stripe.connect.onboarding.account_create",
          error,
          userId: user.id,
        });
        return jsonError(CONNECT_ONBOARDING_ERROR_MESSAGE, 500);
      }

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
        await logStripeConnectOnboardingError({
          source: "stripe.connect.onboarding.student_profile_upsert",
          error: updateError,
          userId: user.id,
          stripeAccountId,
        });
        return jsonError("Nie udało się zapisać konta Stripe studenta.", 500);
      }
    } else {
      try {
        const account = await stripe.accounts.retrieve(stripeAccountId);
        accountReady = isPayoutAccountReady(account);
      } catch (error) {
        await logStripeConnectOnboardingError({
          source: "stripe.connect.onboarding.account_retrieve",
          error,
          userId: user.id,
          stripeAccountId,
        });
        return jsonError("Nie udało się potwierdzić statusu konta Stripe.", 500);
      }

      const { error: onboardingUpdateError } = await admin
        .from("student_profiles")
        .update({
          stripe_onboarding_completed_at: accountReady ? new Date().toISOString() : null,
        })
        .eq("user_id", user.id);

      if (onboardingUpdateError) {
        await logStripeConnectOnboardingError({
          source: "stripe.connect.onboarding.status_update",
          error: onboardingUpdateError,
          userId: user.id,
          stripeAccountId,
          level: "warning",
        });
      }
    }

    const baseUrl = resolveServerAppUrl(req);
    if (!baseUrl) {
      await logStripeConnectOnboardingError({
        source: "stripe.connect.onboarding.app_url",
        message: "Missing application base URL for Stripe Connect onboarding.",
        userId: user.id,
        stripeAccountId,
      });
      return jsonError("Konfiguracja aplikacji jest niekompletna.", 500);
    }
    if (accountReady) {
      try {
        const loginLink = await stripe.accounts.createLoginLink(stripeAccountId);
        return noStoreJson({ url: loginLink.url });
      } catch (error) {
        await logStripeConnectOnboardingError({
          source: "stripe.connect.onboarding.login_link_create",
          error,
          userId: user.id,
          stripeAccountId,
        });
        return jsonError(CONNECT_ONBOARDING_ERROR_MESSAGE, 500);
      }
    }

    try {
      const accountLink = await stripe.accountLinks.create({
        account: stripeAccountId,
        refresh_url: `${baseUrl}/app/profile?stripe=refresh`,
        return_url: `${baseUrl}/app/profile?stripe=connected`,
        type: "account_onboarding",
      });
      return noStoreJson({ url: accountLink.url });
    } catch (error) {
      await logStripeConnectOnboardingError({
        source: "stripe.connect.onboarding.account_link_create",
        error,
        userId: user.id,
        stripeAccountId,
      });
      return jsonError(CONNECT_ONBOARDING_ERROR_MESSAGE, 500);
    }
  } catch (error) {
    await logStripeConnectOnboardingError({
      source: "stripe.connect.onboarding.unhandled",
      error,
    });
    return jsonError(CONNECT_ONBOARDING_ERROR_MESSAGE, 500);
  }
}
