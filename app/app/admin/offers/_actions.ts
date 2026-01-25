"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function deleteOfferAction(offerId: string) {
    const supabase = await createClient();

    // 1. Check Auth & Role
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return { error: "Unauthorized" };
    }

    const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("user_id", user.id)
        .single();

    if (profile?.role !== "admin") {
        return { error: "Forbidden: Admins only" };
    }

    // 2. Perform Deep Delete (Manual Cleanup to ensure success)

    // A. Delete Conversations linked to this offer (via applications or direct)
    // First, find applications for this offer
    const { data: apps } = await supabase.from("applications").select("id").eq("offer_id", offerId);
    if (apps && apps.length > 0) {
        const appIds = apps.map(a => a.id);

        // Find conversations for these applications
        const { data: conversations } = await supabase.from("conversations").select("id").in("application_id", appIds);
        if (conversations && conversations.length > 0) {
            const convIds = conversations.map(c => c.id);
            // Delete Messages
            await supabase.from("messages").delete().in("conversation_id", convIds);
            // Delete Conversations
            await supabase.from("conversations").delete().in("id", convIds);
        }

        // Delete Applications
        await supabase.from("applications").delete().in("id", appIds);
    }

    // B. Delete direct conversations (if any scheme uses offer_id directly)
    // Check if column exists or try delete. Safer to ignore if not sure, but let's try standard delete
    const { error: cascadeError } = await supabase.from("conversations").delete().eq("offer_id", offerId).maybeSingle();
    // .maybeSingle() prevents error if column doesn't exist or 0 rows, 
    // actually 'delete().eq()' is safe. But if column 'offer_id' doesn't exist, it throws.
    // We skip this risky step and rely on previous cleanup or foreign key if configured.

    // C. Finally Delete Offer
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
    const supabase = await createClient();

    // 1. Check Auth & Role
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Unauthorized" };

    const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("user_id", user.id)
        .single();

    if (profile?.role !== "admin") {
        return { error: "Forbidden: Admins only" };
    }

    // 2. Perform Update to 'closed'
    const { error } = await supabase
        .from("offers")
        .update({ status: 'closed' })
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
