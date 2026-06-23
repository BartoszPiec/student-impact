"use server";

import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { vatWhiteListClient } from "@/lib/gus/whitelist-client";
import { buildRateLimitKey, enforceRateLimit } from "@/lib/rate-limit";
import { z } from "zod";

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

export async function saveOnboardingProfile(input: OnboardingInput) {
    const parsed = onboardingSchema.safeParse(input);
    if (!parsed.success) {
        return { success: false as const, error: parsed.error.issues[0]?.message ?? "Nieprawidłowe dane formularza." };
    }

    const supabase = await createClient();
    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;
    if (!user) return { success: false as const, error: "Sesja wygasła. Zaloguj się ponownie." };

    const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("user_id", user.id)
        .maybeSingle();

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
        : await supabase
            .from("student_profiles")
            .update({
                public_name: parsed.data.publicName,
                kierunek: parsed.data.kierunek,
                rok: parsed.data.rok,
                bio: parsed.data.bio || null,
            })
            .eq("user_id", user.id);

    if (result.error) {
        console.error("[onboarding] profile update failed:", result.error.message);
        return { success: false as const, error: "Nie udało się zapisać profilu." };
    }

    return { success: true as const };
}

export async function fetchCeidgData(nip: string) {
    if (!nip) return { error: "Podaj numer NIP" };

    const cleanNip = nip.replace(/[^0-9]/g, "");

    if (cleanNip.length !== 10) {
        return { error: "NIP musi skladac sie z 10 cyfr" };
    }

    const headerStore = await headers();
    const forwarded = headerStore.get("x-forwarded-for");
    const ip = forwarded?.split(",")[0]?.trim() || headerStore.get("x-real-ip") || "unknown";

    const supabase = await createClient();
    const { data: authData } = await supabase.auth.getUser();
    const rateKey = buildRateLimitKey(["ceidg", authData.user?.id ?? "anon", ip, cleanNip]);
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
        return { error: err instanceof Error ? err.message : "Nie udało się pobrać danych firmy" };
    }
}
