"use server";

import { requireAdmin } from "@/lib/admin/auth";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
    isAllowedCommissionRate,
    parseCommissionRateInput,
    resolveCommissionRate,
} from "@/lib/commission";
import { assertCanAccessStorageRef, assertUploadedObjectExists } from "@/lib/security/storage";

type JsonObject = Record<string, unknown>;

function parsePositiveNumber(value: FormDataEntryValue | null): number | null {
    if (value == null) return null;
    const raw = String(value).trim().replace(",", ".");
    if (!raw) return null;
    const parsed = Number(raw);
    if (!Number.isFinite(parsed) || parsed <= 0) return null;
    return parsed;
}

function parseOptionalInt(value: FormDataEntryValue | null): number | null {
    if (value == null) return null;
    const raw = String(value).trim();
    if (!raw) return null;
    const parsed = Number.parseInt(raw, 10);
    if (!Number.isFinite(parsed) || parsed <= 0) return null;
    return parsed;
}

function normalizeVariantsFromForm(formData: FormData): JsonObject[] | null {
    const raw = String(formData.get("variants_json") ?? "").trim();
    if (!raw) return null;

    let parsed: unknown;
    try {
        parsed = JSON.parse(raw);
    } catch {
        throw new Error("Nieprawidlowy format wariantów.");
    }

    if (!Array.isArray(parsed)) {
        throw new Error("Warianty musza byc tablica.");
    }

    const normalized = parsed
        .filter((variant): variant is JsonObject => Boolean(variant && typeof variant === "object" && !Array.isArray(variant)))
        .map((variant) => {
            const name = typeof variant.name === "string" ? variant.name.trim() : "";
            const labelRaw = typeof variant.label === "string" ? variant.label.trim() : "";
            const label = labelRaw || name;
            const price = Number(variant.price);

            if (!name || !label || !Number.isFinite(price) || price <= 0) {
                return null;
            }

            const nextVariant: JsonObject = {
                ...variant,
                name,
                label,
                price: Number(price.toFixed(2)),
            };

            const delivery = Number(variant.delivery_time_days);
            if (Number.isFinite(delivery) && delivery > 0) {
                nextVariant.delivery_time_days = Math.round(delivery);
            } else {
                delete nextVariant.delivery_time_days;
            }

            if (typeof variant.is_recommended === "boolean") {
                nextVariant.is_recommended = variant.is_recommended;
            }

            return nextVariant;
        })
        .filter((variant): variant is JsonObject => Boolean(variant));

    if (normalized.length === 0) {
        throw new Error("Dodaj co najmniej jeden poprawny wariant.");
    }

    return normalized;
}

function resolvePriceBounds(variants: JsonObject[] | null, fallbackPrice: number | null) {
    if (!variants || variants.length === 0) {
        return {
            price: fallbackPrice,
            price_max: null as number | null,
        };
    }

    const prices = variants
        .map((variant) => Number(variant.price))
        .filter((price) => Number.isFinite(price) && price > 0);

    if (prices.length === 0) {
        throw new Error("Nie udało sie odczytać cen wariantów.");
    }

    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);

    return {
        price: Number(minPrice.toFixed(2)),
        price_max: maxPrice > minPrice ? Number(maxPrice.toFixed(2)) : null,
    };
}

async function validateLockedContentFiles(value: string | null, userId: string) {
    if (!value) return;

    const uploadedFilePrefix = "[ZALACZONY PLIK]:";
    const lines = value
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean);

    for (const line of lines) {
        if (!line.startsWith(uploadedFilePrefix)) continue;

        const ref = await assertCanAccessStorageRef(userId, line.slice(uploadedFilePrefix.length).trim());
        if (ref.bucket !== "offer_attachments") {
            throw new Error("Zalaczony plik ma nieprawidlowy bucket.");
        }
        await assertUploadedObjectExists(ref);
    }
}

export async function createSystemService(formData: FormData) {
    const { supabase, user } = await requireAdmin();

    const title = String(formData.get("tytul") ?? "").trim();
    const description = String(formData.get("opis") ?? "").trim();
    const category = String(formData.get("kategoria") ?? "Inne");
    const delivery_time_days = parseOptionalInt(formData.get("czas"));
    const priceInput = parsePositiveNumber(formData.get("stawka"));
    const variants = normalizeVariantsFromForm(formData);
    const { price, price_max } = resolvePriceBounds(variants, priceInput);
    const locked_content = String(formData.get("obligations") ?? "").trim() || null;
    const commission_rate = resolveCommissionRate({
        explicitRate: parseCommissionRateInput(formData.get("commission_rate")),
        sourceType: "service_order",
        isPlatformService: true,
    });

    if (!title || !description) throw new Error("Tytul i opis są wymagane");
    if (title.length > 200) throw new Error("Tytul jest za dlugi (max 200 znakow)");
    if (description.length > 5000) throw new Error("Opis jest za dlugi (max 5000 znakow)");
    if (price !== null && (price <= 0 || price > 500000)) throw new Error("Nieprawidłowa cena");
    if (price === null) throw new Error("Podaj cene usługi lub ceny wariantów.");
    await validateLockedContentFiles(locked_content, user.id);

    const { error } = await supabase.from("service_packages").insert({
        title,
        description,
        category,
        delivery_time_days,
        price,
        price_max,
        variants,
        commission_rate,
        locked_content,
        is_system: true,
        type: "platform_service",
        status: "active",
    });

    if (error) throw new Error(error.message);

    revalidatePath("/app/admin/system-services");
    revalidatePath("/app/company/packages");
    redirect("/app/admin/system-services");
}

export async function updateSystemService(offerId: string, formData: FormData) {
    const { supabase, user } = await requireAdmin();

    const title = String(formData.get("tytul") ?? "").trim();
    const description = String(formData.get("opis") ?? "").trim();
    const category = String(formData.get("kategoria") ?? "Inne");
    const delivery_time_days = parseOptionalInt(formData.get("czas"));
    const priceInput = parsePositiveNumber(formData.get("stawka"));
    const variants = normalizeVariantsFromForm(formData);
    const { price, price_max } = resolvePriceBounds(variants, priceInput);
    const locked_content = String(formData.get("obligations") ?? "").trim() || null;
    const explicitCommissionRate = parseCommissionRateInput(formData.get("commission_rate"));

    if (!title || !description) throw new Error("Tytul i opis są wymagane");
    if (title.length > 200) throw new Error("Tytul jest za dlugi (max 200 znakow)");
    if (description.length > 5000) throw new Error("Opis jest za dlugi (max 5000 znakow)");
    if (price !== null && (price <= 0 || price > 500000)) throw new Error("Nieprawidłowa cena");
    if (price === null) throw new Error("Podaj cene usługi lub ceny wariantów.");
    await validateLockedContentFiles(locked_content, user.id);

    const updatePayload: JsonObject = {
        title,
        description,
        category,
        delivery_time_days,
        price,
        price_max,
        locked_content,
        is_system: true,
        type: "platform_service",
    };

    if (variants) {
        updatePayload.variants = variants;
    }

    if (explicitCommissionRate !== null) {
        updatePayload.commission_rate = resolveCommissionRate({
            explicitRate: explicitCommissionRate,
            sourceType: "service_order",
            isPlatformService: true,
        });
    }

    const { error } = await supabase
        .from("service_packages")
        .update(updatePayload)
        .eq("id", offerId);

    if (error) throw new Error(error.message);

    revalidatePath("/app/admin/system-services");
    revalidatePath("/app/company/packages");
    redirect("/app/admin/system-services");
}

export async function deleteSystemService(serviceId: string) {
    const { supabase } = await requireAdmin();

    const { error } = await supabase
        .from("service_packages")
        .delete()
        .eq("id", serviceId);

    if (error) throw new Error(error.message);

    revalidatePath("/app/admin/system-services");
    revalidatePath("/app/company/packages");
}

export async function updateSystemServiceCommission(serviceId: string, commissionRateInput: string) {
    const { supabase } = await requireAdmin();
    const commissionRate = parseCommissionRateInput(commissionRateInput);

    if (!isAllowedCommissionRate(commissionRate)) {
        return { error: "Dozwolone stawki to auto, 10%, 15% lub 20%." };
    }

    const { error } = await supabase
        .from("service_packages")
        .update({ commission_rate: commissionRate })
        .eq("id", serviceId)
        .eq("type", "platform_service");

    if (error) {
        return { error: error.message };
    }

    revalidatePath("/app/admin/system-services");
    revalidatePath("/app/company/packages");

    return { success: true };
}

export async function updateSystemServiceStatus(
    serviceId: string,
    nextStatus: "active" | "inactive",
) {
    const { supabase } = await requireAdmin();

    const { error } = await supabase
        .from("service_packages")
        .update({ status: nextStatus })
        .eq("id", serviceId)
        .eq("type", "platform_service");

    if (error) {
        return { error: error.message };
    }

    revalidatePath("/app/admin/system-services");
    revalidatePath("/app/company/packages");

    return { success: true };
}
