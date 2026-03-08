"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

async function requireAdmin(supabase: any, userId: string) {
    const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("user_id", userId)
        .single();
    if (profile?.role !== "admin") {
        throw new Error("Brak uprawnień administratora");
    }
}

const ALLOWED_COMMISSION_RATES = [0.10, 0.15, 0.20, 0.25];

function parseCommissionRate(raw: string): number {
    const rate = Number(raw);
    if (!ALLOWED_COMMISSION_RATES.includes(rate)) return 0.25;
    return rate;
}

function parseVariants(raw: string): any[] | null {
    if (!raw) return null;
    try {
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) return null;
        // Validate each variant has required fields
        return parsed.filter(
            (v: any) => typeof v.name === 'string' && typeof v.label === 'string' && typeof v.price === 'number' && v.price > 0
        );
    } catch {
        return null;
    }
}

export async function createSystemService(formData: FormData) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error("Brak autoryzacji");
    await requireAdmin(supabase, user.id);

    const title = String(formData.get("tytul") ?? "").trim();
    const description = String(formData.get("opis") ?? "").trim();
    const category = String(formData.get("kategoria") ?? "Inne");
    const delivery_time_days = String(formData.get("czas") ?? "").trim() || null;
    const priceRaw = String(formData.get("stawka") ?? "").trim();
    const price = priceRaw ? Number(priceRaw) : null;
    const priceMaxRaw = String(formData.get("stawka_max") ?? "").trim();
    const price_max = priceMaxRaw ? Number(priceMaxRaw) : null;
    const locked_content = String(formData.get("obligations") ?? "").trim() || null;
    const requires_nda = formData.get("requires_nda") === "true";
    const commission_rate = parseCommissionRate(String(formData.get("commission_rate") ?? "0.25").trim());
    const variants = parseVariants(String(formData.get("variants") ?? "").trim());

    if (!title || !description) throw new Error("Tytuł i opis są wymagane");

    const { error } = await supabase.from("service_packages").insert({
        title,
        description,
        category,
        delivery_time_days: delivery_time_days ? parseInt(delivery_time_days) : null,
        price,
        price_max,
        locked_content,
        requires_nda,
        commission_rate,
        variants,
        type: 'platform_service',
        status: 'active',
        is_system: true,
    });

    if (error) throw new Error(error.message);

    revalidatePath("/app/admin/system-services");
    revalidatePath("/app/company/packages");
    redirect("/app/admin/system-services");
}

export async function updateSystemService(offerId: string, formData: FormData) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error("Brak autoryzacji");
    await requireAdmin(supabase, user.id);

    const title = String(formData.get("tytul") ?? "").trim();
    const description = String(formData.get("opis") ?? "").trim();
    const category = String(formData.get("kategoria") ?? "Inne");
    const delivery_time_days = String(formData.get("czas") ?? "").trim() || null;
    const priceRaw = String(formData.get("stawka") ?? "").trim();
    const price = priceRaw ? Number(priceRaw) : null;
    const priceMaxRaw = String(formData.get("stawka_max") ?? "").trim();
    const price_max = priceMaxRaw ? Number(priceMaxRaw) : null;
    const locked_content = String(formData.get("obligations") ?? "").trim() || null;
    const requires_nda = formData.get("requires_nda") === "true";
    const commission_rate = parseCommissionRate(String(formData.get("commission_rate") ?? "0.25").trim());
    const variants = parseVariants(String(formData.get("variants") ?? "").trim());

    if (!title || !description) throw new Error("Tytuł i opis są wymagane");

    const { error } = await supabase
        .from("service_packages")
        .update({
            title,
            description,
            category,
            delivery_time_days: delivery_time_days ? parseInt(delivery_time_days) : null,
            price,
            price_max,
            locked_content,
            requires_nda,
            commission_rate,
            variants,
        })
        .eq("id", offerId);

    if (error) throw new Error(error.message);

    revalidatePath("/app/admin/system-services");
    revalidatePath("/app/company/packages");

    redirect("/app/admin/system-services");
}

export async function deleteSystemService(serviceId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error("Brak autoryzacji");
    await requireAdmin(supabase, user.id);

    const { error } = await supabase
        .from("service_packages")
        .delete()
        .eq("id", serviceId);

    if (error) throw new Error(error.message);

    revalidatePath("/app/admin/system-services");
    revalidatePath("/app/company/packages");
}
