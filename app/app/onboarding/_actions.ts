"use server";

import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { vatWhiteListClient } from "@/lib/gus/whitelist-client";
import { buildRateLimitKey, enforceRateLimit } from "@/lib/rate-limit";
import { logCriticalError } from "@/lib/observability/error-log";
import { z } from "zod";

const ONBOARDING_SAVE_ERROR_MESSAGE = "Nie udało się zapisać profilu.";
const VAT_LOOKUP_ERROR_MESSAGE = "Nie udało się pobrać danych firmy z Białej Listy VAT.";
const VAT_RATE_LIMIT_ERROR_MESSAGE = "Przekroczono limit zapytań do Białej Listy VAT. Spróbuj później.";

const companyOnboardingSchema = z.object({
    role: z.literal("company"),
    companyName: z.string().trim().min(2, "Nazwa firmy jest wymagana.").max(200),
    nip: z.string().trim().regex(/^\d{10}$/, "NIP musi składać się z 10 cyfr.").or(z.literal("")),
    address: z.string().trim().max(250),
    city: z.string().trim().max(120),
});

const studentOnboardingSchema = z.object({
    role: z.literal("student"),
    publicName: z.string().trim().min(2, "Nazwa publiczna jest wymagana.").max(120),
    kierunek: z.string().trim().min(2, "Kierunek studiów jest wymagany.").max(160),
    rok: z.coerce.number().int().min(1).max(8),
    bio: z.string().trim().max(2000),
});

const onboardingSchema = z.discriminatedUnion("role", [companyOnboardingSchema, studentOnboardingSchema]);

export type OnboardingInput = z.input<typeof onboardingSchema>;

function readErrorCode(error: unknown): string | null {
    if (!error || typeof error !== "object" || !("code" in error)) {
        return null;
    }

    const code = (error as { code?: unknown }).code;
    return typeof code === "string" && code.trim() ? code.trim() : null;
}

async function logOnboardingError(input: {
    source: string;
    error?: unknown;
    message?: string;
    userId?: string | null;
    level?: "error" | "warning";
    context?: Record<string, unknown>;
}) {
    await logCriticalError({
        source: input.source,
        error: input.error,
        message: input.message,
        level: input.level ?? "error",
        errorCode: readErrorCode(input.error),
        userId: input.userId ?? null,
        context: input.context,
    });
}

export async function saveOnboardingProfile(input: OnboardingInput) {
    const parsed = onboardingSchema.safeParse(input);
    if (!parsed.success) {
        return { success: false as const, error: parsed.error.issues[0]?.message ?? "Nieprawidłowe dane formularza." };
    }

    const supabase = await createClient();
    const { data: userData, error: authError } = await supabase.auth.getUser();
    if (authError) {
        await logOnboardingError({
            source: "onboarding.save.auth_lookup",
            error: authError,
        });
        return { success: false as const, error: "Sesja wygasła. Zaloguj się ponownie." };
    }

    const user = userData.user;
    if (!user) return { success: false as const, error: "Sesja wygasła. Zaloguj się ponownie." };

    const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role")
        .eq("user_id", user.id)
        .maybeSingle();

    if (profileError) {
        await logOnboardingError({
            source: "onboarding.save.profile_lookup",
            error: profileError,
            userId: user.id,
            context: {
                requestedRole: parsed.data.role,
            },
        });
        return { success: false as const, error: "Nie udało się zweryfikować roli konta." };
    }

    if (profile?.role !== parsed.data.role) {
        return { success: false as const, error: "Rola konta nie zgadza się z formularzem." };
    }

    const result = parsed.data.role === "company"
        ? await supabase
            .from("company_profiles")
            .update({
                nazwa: parsed.data.companyName,
                nip: parsed.data.nip || null,
                address: parsed.data.address || null,
                city: parsed.data.city || null,
            })
            .eq("user_id", user.id)
            .select("user_id")
            .maybeSingle()
        : await supabase
            .from("student_profiles")
            .update({
                public_name: parsed.data.publicName,
                kierunek: parsed.data.kierunek,
                rok: parsed.data.rok,
                bio: parsed.data.bio || null,
            })
            .eq("user_id", user.id)
            .select("user_id")
            .maybeSingle();

    if (result.error) {
        await logOnboardingError({
            source: "onboarding.save.profile_update",
            error: result.error,
            userId: user.id,
            context: {
                role: parsed.data.role,
            },
        });
        return { success: false as const, error: ONBOARDING_SAVE_ERROR_MESSAGE };
    }

    if (!result.data) {
        await logOnboardingError({
            source: "onboarding.save.profile_missing",
            message: "Profile update affected no rows.",
            userId: user.id,
            context: {
                role: parsed.data.role,
            },
        });
        return { success: false as const, error: ONBOARDING_SAVE_ERROR_MESSAGE };
    }

    return { success: true as const };
}

export async function fetchCeidgData(nip: string) {
    if (!nip) return { error: "Podaj numer NIP" };

    const cleanNip = nip.replace(/[^0-9]/g, "");

    if (cleanNip.length !== 10) {
        return { error: "NIP musi składać się z 10 cyfr" };
    }

    const headerStore = await headers();
    const forwarded = headerStore.get("x-forwarded-for");
    const ip = forwarded?.split(",")[0]?.trim() || headerStore.get("x-real-ip") || "unknown";

    const supabase = await createClient();
    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError) {
        await logOnboardingError({
            source: "onboarding.vat.auth_lookup",
            error: authError,
        });
        return { error: "Sesja wygasła. Zaloguj się ponownie." };
    }

    const user = authData.user;
    if (!user) {
        return { error: "Sesja wygasła. Zaloguj się ponownie." };
    }

    const rateKey = buildRateLimitKey(["ceidg", user.id, ip, cleanNip]);
    const rateLimitResult = await enforceRateLimit("ceidg", rateKey);
    if (!rateLimitResult.success) {
        return { error: "Za dużo zapytań do Białej Listy VAT. Spróbuj ponownie za chwilę." };
    }

    try {
        const data = await vatWhiteListClient.getCompanyByNip(cleanNip);

        if (!data) {
            return { error: "Nie znaleziono firmy na Białej Liście VAT (lub nie jest płatnikiem VAT)." };
        }

        return {
            data: {
                name: data.name,
                address: {
                    street: data.address,
                    city: data.city,
                    postCode: data.postCode,
                },
            },
        };
    } catch (err: unknown) {
        await logOnboardingError({
            source: "onboarding.vat.lookup",
            error: err,
            userId: user.id,
            context: {
                identifierSuffix: cleanNip.slice(-4),
            },
        });

        if (err instanceof Error && err.message === VAT_RATE_LIMIT_ERROR_MESSAGE) {
            return { error: VAT_RATE_LIMIT_ERROR_MESSAGE };
        }

        return { error: VAT_LOOKUP_ERROR_MESSAGE };
    }
}
