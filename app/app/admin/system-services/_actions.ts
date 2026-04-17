"use server";

import { requireAdmin } from "@/lib/admin/auth";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
    isAllowedCommissionRate,
    parseCommissionRateInput,
    resolveCommissionRate,
} from "@/lib/commission";

export async function createSystemService(formData: FormData) {
    const { supabase } = await requireAdmin();

    const title = String(formData.get("tytul") ?? "").trim();
    const description = String(formData.get("opis") ?? "").trim();
    const category = String(formData.get("kategoria") ?? "Inne");
    const delivery_time_days = String(formData.get("czas") ?? "").trim() || null;
    const priceRaw = String(formData.get("stawka") ?? "").trim();
    const price = priceRaw ? Number(priceRaw) : null;
    const locked_content = String(formData.get("obligations") ?? "").trim() || null;
    const commission_rate = resolveCommissionRate({
        explicitRate: parseCommissionRateInput(formData.get("commission_rate")),
        sourceType: "service_order",
        isPlatformService: true,
    });

    if (!title || !description) throw new Error("Tytul i opis sa wymagane");
    if (title.length > 200) throw new Error("Tytul jest za dlugi (max 200 znakow)");
    if (description.length > 5000) throw new Error("Opis jest za dlugi (max 5000 znakow)");
    if (price !== null && (price <= 0 || price > 500000)) throw new Error("Nieprawidlowa cena");

    const { error } = await supabase.from("service_packages").insert({
        title,
        description,
        category,
        delivery_time_days: delivery_time_days ? parseInt(delivery_time_days) : null,
        price,
        commission_rate,
        locked_content,
        type: "platform_service",
        status: "active",
    });

    if (error) throw new Error(error.message);

    revalidatePath("/app/admin/system-services");
    revalidatePath("/app/company/packages");
    redirect("/app/admin/system-services");
}

export async function updateSystemService(offerId: string, formData: FormData) {
    const { supabase } = await requireAdmin();

    const title = String(formData.get("tytul") ?? "").trim();
    const description = String(formData.get("opis") ?? "").trim();
    const category = String(formData.get("kategoria") ?? "Inne");
    const delivery_time_days = String(formData.get("czas") ?? "").trim() || null;
    const priceRaw = String(formData.get("stawka") ?? "").trim();
    const price = priceRaw ? Number(priceRaw) : null;
    const locked_content = String(formData.get("obligations") ?? "").trim() || null;
    const commission_rate = resolveCommissionRate({
        explicitRate: parseCommissionRateInput(formData.get("commission_rate")),
        sourceType: "service_order",
        isPlatformService: true,
    });

    if (!title || !description) throw new Error("Tytul i opis sa wymagane");
    if (title.length > 200) throw new Error("Tytul jest za dlugi (max 200 znakow)");
    if (description.length > 5000) throw new Error("Opis jest za dlugi (max 5000 znakow)");
    if (price !== null && (price <= 0 || price > 500000)) throw new Error("Nieprawidlowa cena");

    const { error } = await supabase
        .from("service_packages")
        .update({
            title,
            description,
            category,
            delivery_time_days: delivery_time_days ? parseInt(delivery_time_days) : null,
            price,
            commission_rate,
            locked_content,
        })
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
