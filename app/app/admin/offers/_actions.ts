"use server";

import { requireAdmin } from "@/lib/admin/auth";
import { isAllowedCommissionRate, parseCommissionRateInput } from "@/lib/commission";
import { revalidatePath } from "next/cache";

async function getAdminSupabaseOrError() {
    try {
        const { supabase } = await requireAdmin();
        return { supabase };
    } catch (error) {
        return {
            error: error instanceof Error ? error.message : "Brak uprawnien administratora",
        };
    }
}

export async function deleteOfferAction(offerId: string) {
    const adminContext = await getAdminSupabaseOrError();
    if ("error" in adminContext) {
        return { error: adminContext.error };
    }

    const { supabase } = adminContext;

    const { data: apps } = await supabase.from("applications").select("id").eq("offer_id", offerId);
    if (apps && apps.length > 0) {
        const appIds = apps.map((app) => app.id);

        const { data: conversations } = await supabase
            .from("conversations")
            .select("id")
            .in("application_id", appIds);

        if (conversations && conversations.length > 0) {
            const convIds = conversations.map((conversation) => conversation.id);
            await supabase.from("messages").delete().in("conversation_id", convIds);
            await supabase.from("conversations").delete().in("id", convIds);
        }

        await supabase.from("applications").delete().in("id", appIds);
    }

    await supabase.from("conversations").delete().eq("offer_id", offerId).maybeSingle();

    const { error } = await supabase
        .from("offers")
        .delete()
        .eq("id", offerId);

    if (error) {
        console.error("Delete Offer Error:", error);
        return { error: error.message };
    }

    revalidatePath("/app/admin/offers");
    revalidatePath("/app/offers");
    revalidatePath("/app/jobs");

    return { success: true };
}

export async function closeOfferAction(offerId: string) {
    const adminContext = await getAdminSupabaseOrError();
    if ("error" in adminContext) {
        return { error: adminContext.error };
    }

    const { supabase } = adminContext;

    const { error } = await supabase
        .from("offers")
        .update({ status: "closed" })
        .eq("id", offerId);

    if (error) {
        console.error("Close Offer Error:", error);
        return { error: error.message };
    }

    revalidatePath("/app/admin/offers");
    revalidatePath("/app/offers");
    revalidatePath("/app/jobs");

    return { success: true };
}

export async function updateOfferCommissionAction(offerId: string, commissionRateInput: string) {
    const adminContext = await getAdminSupabaseOrError();
    if ("error" in adminContext) {
        return { error: adminContext.error };
    }

    const { supabase } = adminContext;
    const commissionRate = parseCommissionRateInput(commissionRateInput);

    if (!isAllowedCommissionRate(commissionRate)) {
        return { error: "Dozwolone stawki to auto, 10%, 15% lub 20%." };
    }

    const { error } = await supabase
        .from("offers")
        .update({ commission_rate: commissionRate })
        .eq("id", offerId);

    if (error) {
        console.error("Update Offer Commission Error:", error);
        return { error: error.message };
    }

    revalidatePath("/app/admin/offers");
    revalidatePath("/app/offers");
    revalidatePath("/app/jobs");

    return { success: true };
}
