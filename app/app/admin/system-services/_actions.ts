"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { parseCommissionRateInput, resolveCommissionRate } from "@/lib/commission";

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Nieautoryzowany");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("user_id", user.id)
    .single();

  if (profile?.role !== "admin") throw new Error("Brak uprawnień administratora");
  return { supabase, user };
}

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

    if (!title || !description) throw new Error("Tytuł i opis są wymagane");
    if (title.length > 200) throw new Error("Tytuł jest za długi (max 200 znaków)");
    if (description.length > 5000) throw new Error("Opis jest za długi (max 5000 znaków)");
    if (price !== null && (price <= 0 || price > 500000)) throw new Error("Nieprawidłowa cena");

    const { error } = await supabase.from("service_packages").insert({
        title,
        description,
        category,
        delivery_time_days: delivery_time_days ? parseInt(delivery_time_days) : null,
        price,
        commission_rate,
        locked_content,
        type: 'platform_service',
        status: 'active'
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

    if (!title || !description) throw new Error("Tytuł i opis są wymagane");
    if (title.length > 200) throw new Error("Tytuł jest za długi (max 200 znaków)");
    if (description.length > 5000) throw new Error("Opis jest za długi (max 5000 znaków)");
    if (price !== null && (price <= 0 || price > 500000)) throw new Error("Nieprawidłowa cena");

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
