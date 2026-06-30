"use server";

import { createClient } from "@/lib/supabase/server";
import { uuidSchema } from "@/lib/security/validation";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { logSavedOfferError } from "@/lib/observability/saved-offers";

const INVALID_OFFER_ID_MESSAGE = "Nieprawidłowy identyfikator oferty.";
const REMOVE_SAVED_OFFER_ERROR_MESSAGE = "Nie udało się usunąć oferty z zapisanych.";

function parseOfferId(offerId: string) {
  const parsed = uuidSchema.safeParse(offerId);
  if (!parsed.success) {
    throw new Error(INVALID_OFFER_ID_MESSAGE);
  }

  return parsed.data;
}

export async function removeSavedOffer(offerId: string) {
  const supabase = await createClient();
  const safeOfferId = parseOfferId(offerId);

  const { data, error: authError } = await supabase.auth.getUser();
  if (authError) {
    await logSavedOfferError({
      source: "saved_offers.saved_page.auth_lookup",
      error: authError,
      offerId: safeOfferId,
    });
    redirect("/auth");
  }

  const user = data.user;
  if (!user) redirect("/auth");

  // RLS i tak pilnuje, ale doprecyzowujemy warunek
  const { error } = await supabase
    .from("saved_offers")
    .delete()
    .eq("student_id", user.id)
    .eq("offer_id", safeOfferId);

  if (error) {
    await logSavedOfferError({
      source: "saved_offers.saved_page.delete",
      error,
      userId: user.id,
      offerId: safeOfferId,
    });
    throw new Error(REMOVE_SAVED_OFFER_ERROR_MESSAGE);
  }

  revalidatePath("/app/saved");
}
