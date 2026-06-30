"use server";

import { createClient } from "@/lib/supabase/server";
import { uuidSchema } from "@/lib/security/validation";
import { revalidatePath } from "next/cache";
import { logSavedOfferError } from "@/lib/observability/saved-offers";

const INVALID_OFFER_ID_MESSAGE = "Nieprawidłowy identyfikator oferty.";
const SAVE_OFFER_ERROR_MESSAGE = "Nie udało się zaktualizować zapisanej oferty.";
const OFFER_NOT_AVAILABLE_MESSAGE = "Nie można zapisać tej oferty.";

function parseOfferId(offerId: string) {
  const parsed = uuidSchema.safeParse(offerId);
  if (!parsed.success) {
    throw new Error(INVALID_OFFER_ID_MESSAGE);
  }

  return parsed.data;
}

export async function toggleSavedOffer(offerId: string) {
  const supabase = await createClient();
  const safeOfferId = parseOfferId(offerId);
  const { data, error: authError } = await supabase.auth.getUser();
  if (authError) {
    await logSavedOfferError({
      source: "saved_offers.toggle.auth_lookup",
      error: authError,
      offerId: safeOfferId,
    });
    throw new Error("Brak sesji");
  }

  const user = data.user;

  if (!user) throw new Error("Brak sesji");

  const studentId = user.id;

  const { data: offer, error: offerError } = await supabase
    .from("offers")
    .select("id, status")
    .eq("id", safeOfferId)
    .maybeSingle();

  if (offerError) {
    await logSavedOfferError({
      source: "saved_offers.toggle.offer_lookup",
      error: offerError,
      userId: studentId,
      offerId: safeOfferId,
    });
    throw new Error(SAVE_OFFER_ERROR_MESSAGE);
  }

  if (!offer || offer.status !== "published") {
    throw new Error(OFFER_NOT_AVAILABLE_MESSAGE);
  }

  const { data: existing, error: existingError } = await supabase
    .from("saved_offers")
    .select("offer_id")
    .eq("student_id", studentId)
    .eq("offer_id", safeOfferId)
    .maybeSingle();

  if (existingError) {
    await logSavedOfferError({
      source: "saved_offers.toggle.existing_lookup",
      error: existingError,
      userId: studentId,
      offerId: safeOfferId,
    });
    throw new Error(SAVE_OFFER_ERROR_MESSAGE);
  }

  if (existing) {
    const { error } = await supabase
      .from("saved_offers")
      .delete()
      .eq("student_id", studentId)
      .eq("offer_id", safeOfferId);

    if (error) {
      await logSavedOfferError({
        source: "saved_offers.toggle.delete",
        error,
        userId: studentId,
        offerId: safeOfferId,
      });
      throw new Error(SAVE_OFFER_ERROR_MESSAGE);
    }
  } else {
    const { error } = await supabase.from("saved_offers").upsert({
      student_id: studentId,
      offer_id: safeOfferId,
    }, { onConflict: "student_id,offer_id", ignoreDuplicates: true });

    if (error) {
      await logSavedOfferError({
        source: "saved_offers.toggle.upsert",
        error,
        userId: studentId,
        offerId: safeOfferId,
      });
      throw new Error(SAVE_OFFER_ERROR_MESSAGE);
    }
  }

  revalidatePath(`/app/offers/${safeOfferId}`);
  revalidatePath(`/app/saved`);
}
