"use server";

import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { vatWhiteListClient } from "@/lib/gus/whitelist-client";
import { buildRateLimitKey, enforceRateLimit } from "@/lib/rate-limit";

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
        return { error: "Za duzo zapytan do Bialej Listy VAT. Sprobuj ponownie za chwile." };
    }

    try {
        const data = await vatWhiteListClient.getCompanyByNip(cleanNip);

        if (!data) {
            return { error: "Nie znaleziono firmy na Bialej Liscie VAT (lub nie jest platnikiem VAT)." };
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
        return { error: err instanceof Error ? err.message : "Nie udalo sie pobrac danych firmy" };
    }
}
