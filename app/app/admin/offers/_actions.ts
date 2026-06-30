"use server";

import { requireAdmin } from "@/lib/admin/auth";
import { isAllowedCommissionRate, parseCommissionRateInput } from "@/lib/commission";
import { uuidSchema } from "@/lib/security/validation";
import { revalidatePath } from "next/cache";

const ADMIN_AUTH_ERROR_MESSAGE = "Brak uprawnień administratora.";
const INVALID_OFFER_ID_MESSAGE = "Nieprawidłowy identyfikator oferty.";
const DELETE_OFFER_ERROR_MESSAGE = "Nie udało się usunąć oferty.";
const CLOSE_OFFER_ERROR_MESSAGE = "Nie udało się zamknąć oferty.";
const UPDATE_COMMISSION_ERROR_MESSAGE = "Nie udało się zapisać prowizji oferty.";

async function getAdminSupabaseOrError() {
    try {
        const { supabase } = await requireAdmin();
        return { supabase };
    } catch (error) {
        console.error("Admin offers auth error:", error);
        return {
            error: ADMIN_AUTH_ERROR_MESSAGE,
        };
    }
}

function parseOfferId(offerId: string) {
    const parsed = uuidSchema.safeParse(offerId);
    if (!parsed.success) {
        return { error: INVALID_OFFER_ID_MESSAGE };
    }

    return { offerId: parsed.data };
}

function logMutationError(label: string, error: unknown, userMessage: string) {
    console.error(label, error);
    return { error: userMessage };
}

export async function deleteOfferAction(offerId: string) {
    const adminContext = await getAdminSupabaseOrError();
    if ("error" in adminContext) {
        return { error: adminContext.error };
    }

    const parsedOfferId = parseOfferId(offerId);
    if ("error" in parsedOfferId) {
        return { error: parsedOfferId.error };
    }

    const { supabase } = adminContext;
    const safeOfferId = parsedOfferId.offerId;

    const { data: apps, error: appsError } = await supabase
        .from("applications")
        .select("id")
        .eq("offer_id", safeOfferId);
    if (appsError) {
        return logMutationError("Delete Offer applications lookup error:", appsError, DELETE_OFFER_ERROR_MESSAGE);
    }

    if (apps && apps.length > 0) {
        const appIds = apps.map((app) => app.id);

        const { data: conversations, error: conversationsLookupError } = await supabase
            .from("conversations")
            .select("id")
            .in("application_id", appIds);
        if (conversationsLookupError) {
            return logMutationError(
                "Delete Offer conversations lookup error:",
                conversationsLookupError,
                DELETE_OFFER_ERROR_MESSAGE,
            );
        }

        if (conversations && conversations.length > 0) {
            const convIds = conversations.map((conversation) => conversation.id);
            const { error: messagesDeleteError } = await supabase
                .from("messages")
                .delete()
                .in("conversation_id", convIds);
            if (messagesDeleteError) {
                return logMutationError("Delete Offer messages error:", messagesDeleteError, DELETE_OFFER_ERROR_MESSAGE);
            }

            const { error: conversationsDeleteError } = await supabase
                .from("conversations")
                .delete()
                .in("id", convIds);
            if (conversationsDeleteError) {
                return logMutationError(
                    "Delete Offer conversations error:",
                    conversationsDeleteError,
                    DELETE_OFFER_ERROR_MESSAGE,
                );
            }
        }

        const { error: applicationsDeleteError } = await supabase
            .from("applications")
            .delete()
            .in("id", appIds);
        if (applicationsDeleteError) {
            return logMutationError("Delete Offer applications error:", applicationsDeleteError, DELETE_OFFER_ERROR_MESSAGE);
        }
    }

    const { error: directConversationsDeleteError } = await supabase
        .from("conversations")
        .delete()
        .eq("offer_id", safeOfferId);
    if (directConversationsDeleteError) {
        return logMutationError(
            "Delete Offer direct conversations error:",
            directConversationsDeleteError,
            DELETE_OFFER_ERROR_MESSAGE,
        );
    }

    const { error } = await supabase
        .from("offers")
        .delete()
        .eq("id", safeOfferId);

    if (error) {
        return logMutationError("Delete Offer Error:", error, DELETE_OFFER_ERROR_MESSAGE);
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

    const parsedOfferId = parseOfferId(offerId);
    if ("error" in parsedOfferId) {
        return { error: parsedOfferId.error };
    }

    const { supabase } = adminContext;
    const safeOfferId = parsedOfferId.offerId;

    const { error } = await supabase
        .from("offers")
        .update({ status: "closed" })
        .eq("id", safeOfferId);

    if (error) {
        return logMutationError("Close Offer Error:", error, CLOSE_OFFER_ERROR_MESSAGE);
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

    const parsedOfferId = parseOfferId(offerId);
    if ("error" in parsedOfferId) {
        return { error: parsedOfferId.error };
    }

    const { supabase } = adminContext;
    const safeOfferId = parsedOfferId.offerId;
    const commissionRate = parseCommissionRateInput(commissionRateInput);

    if (!isAllowedCommissionRate(commissionRate)) {
        return { error: "Dozwolone stawki to auto, 10%, 15%, 20% lub 25%." };
    }

    const { error } = await supabase
        .from("offers")
        .update({ commission_rate: commissionRate })
        .eq("id", safeOfferId);

    if (error) {
        return logMutationError("Update Offer Commission Error:", error, UPDATE_COMMISSION_ERROR_MESSAGE);
    }

    revalidatePath("/app/admin/offers");
    revalidatePath("/app/offers");
    revalidatePath("/app/jobs");

    return { success: true };
}
