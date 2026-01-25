"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export async function createSystemService(formData: FormData) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error("Brak autoryzacji");

    const title = String(formData.get("tytul") ?? "").trim();
    const description = String(formData.get("opis") ?? "").trim();
    const category = String(formData.get("kategoria") ?? "Inne");
    const delivery_time_days = String(formData.get("czas") ?? "").trim() || null;
    const priceRaw = String(formData.get("stawka") ?? "").trim();
    const price = priceRaw ? Number(priceRaw) : null;
    const locked_content = String(formData.get("obligations") ?? "").trim() || null; // Use locked_content

    if (!title || !description) throw new Error("Tytuł i opis są wymagane");

    const { error } = await supabase.from("service_packages").insert({
        // company_id: user.id, // Removed as column doesn't exist
        title,
        description,
        category,
        delivery_time_days: delivery_time_days ? parseInt(delivery_time_days) : null,
        price,
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
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error("Brak autoryzacji");

    const title = String(formData.get("tytul") ?? "").trim();
    const description = String(formData.get("opis") ?? "").trim();
    const category = String(formData.get("kategoria") ?? "Inne");
    const delivery_time_days = String(formData.get("czas") ?? "").trim() || null;
    const priceRaw = String(formData.get("stawka") ?? "").trim();
    const price = priceRaw ? Number(priceRaw) : null;
    const locked_content = String(formData.get("obligations") ?? "").trim() || null;

    if (!title || !description) throw new Error("Tytuł i opis są wymagane");

    const { error } = await supabase
        .from("service_packages")
        .update({
            title,
            description,
            category,
            delivery_time_days: delivery_time_days ? parseInt(delivery_time_days) : null,
            price,
            locked_content,
        })
        .eq("id", offerId);

    if (error) throw new Error(error.message);

    revalidatePath("/app/admin/system-services");
    revalidatePath("/app/company/packages");

    redirect("/app/admin/system-services");
}
