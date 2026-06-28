"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { logCriticalError } from "@/lib/observability/error-log";
import { uuidSchema } from "@/lib/security/validation";

const offerStatusSchema = z.enum(["published", "in_progress", "closed"]);
const MAX_OFFER_AMOUNT = 500_000;

function getString(formData: FormData, key: string) {
  const v = formData.get(key);
  return typeof v === "string" ? v.trim() : "";
}

function getNumber(formData: FormData, key: string) {
  const v = formData.get(key);
  if (typeof v !== "string") return null;
  const normalized = v.trim().replace(",", ".");
  if (!normalized) return null;
  const n = Number(normalized);
  if (Number.isNaN(n)) return null;
  return n;
}

function parseOfferId(offerId: string) {
  const parsed = uuidSchema.safeParse(offerId);
  if (!parsed.success) {
    throw new Error("Nieprawidlowy identyfikator oferty.");
  }

  return parsed.data;
}

function parseOfferStatus(status: string) {
  const parsed = offerStatusSchema.safeParse(status);
  if (!parsed.success) {
    throw new Error("Nieprawidlowy status oferty.");
  }

  return parsed.data;
}

function parseOfferAmount(formData: FormData, key: string) {
  const amount = getNumber(formData, key);
  if (amount == null) return null;
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error("Podaj poprawna stawke oferty.");
  }
  if (amount > MAX_OFFER_AMOUNT) {
    throw new Error(`Stawka oferty jest za wysoka (max ${MAX_OFFER_AMOUNT} PLN).`);
  }

  return Math.round(amount * 100) / 100;
}

async function logOfferMutationError(input: {
  source: string;
  error: unknown;
  userId: string;
  offerId: string;
  status?: string | null;
}) {
  await logCriticalError({
    source: input.source,
    error: input.error,
    userId: input.userId,
    context: {
      offerId: input.offerId,
      status: input.status ?? null,
    },
  });
}

export async function setOfferStatus(
  offerId: string,
  status: "published" | "in_progress" | "closed"
) {
  const supabase = await createClient();
  const safeOfferId = parseOfferId(offerId);
  const safeStatus = parseOfferStatus(status);

  const { data } = await supabase.auth.getUser();
  const user = data.user;
  if (!user) redirect("/auth");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("user_id", user.id)
    .single();

  if (profile?.role !== "company") redirect("/app");

  // zabezpieczenia: nie otwieraj ponownie, jeśli:
  // - jest accepted (w trakcie)
  // - albo było approved (ukończone)
  if (safeStatus === "published") {
    const { data: accepted, error: acceptedError } = await supabase
      .from("applications")
      .select("id")
      .eq("offer_id", safeOfferId)
      .in("status", ["accepted", "in_progress", "completed"])
      .limit(1)
      .maybeSingle();

    if (acceptedError) {
      await logOfferMutationError({
        source: "company.offers.status.accepted_lookup",
        error: acceptedError,
        userId: user.id,
        offerId: safeOfferId,
        status: safeStatus,
      });
      throw new Error("Nie udalo sie sprawdzic statusu oferty. Sprobuj ponownie.");
    }

    if (accepted?.id) {
      redirect("/app/company/offers");
    }

    const { data: appIds, error: appIdsError } = await supabase
      .from("applications")
      .select("id")
      .eq("offer_id", safeOfferId);

    if (appIdsError) {
      await logOfferMutationError({
        source: "company.offers.status.applications_lookup",
        error: appIdsError,
        userId: user.id,
        offerId: safeOfferId,
        status: safeStatus,
      });
      throw new Error("Nie udalo sie sprawdzic aplikacji oferty. Sprobuj ponownie.");
    }

    const ids = (appIds ?? []).map((application) => application.id);
    if (ids.length > 0) {
      const { data: approved, error: approvedError } = await supabase
        .from("deliverables")
        .select("id")
        .in("application_id", ids)
        .in("status", ["accepted", "approved"])
        .limit(1)
        .maybeSingle();

      if (approvedError) {
        await logOfferMutationError({
          source: "company.offers.status.deliverables_lookup",
          error: approvedError,
          userId: user.id,
          offerId: safeOfferId,
          status: safeStatus,
        });
        throw new Error("Nie udalo sie sprawdzic realizacji oferty. Sprobuj ponownie.");
      }

      if (approved?.id) {
        redirect("/app/company/offers");
      }
    }
  }

  const { data: updated, error } = await supabase
    .from("offers")
    .update({ status: safeStatus })
    .eq("id", safeOfferId)
    .eq("company_id", user.id)
    .select("id")
    .maybeSingle();

  if (error) {
    await logOfferMutationError({
      source: "company.offers.status.update",
      error,
      userId: user.id,
      offerId: safeOfferId,
      status: safeStatus,
    });
    throw new Error("Nie udalo sie zaktualizowac statusu oferty. Sprobuj ponownie.");
  }
  if (!updated?.id) {
    redirect("/app/company/offers");
  }

  revalidatePath("/app/company/offers");
  revalidatePath("/app/company/applications");
  revalidatePath("/app");
  revalidatePath(`/app/offers/${safeOfferId}`);
}

export async function updateOffer(offerId: string, formData: FormData) {
  const supabase = await createClient();
  const safeOfferId = parseOfferId(offerId);

  const { data } = await supabase.auth.getUser();
  const user = data.user;
  if (!user) redirect("/auth");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("user_id", user.id)
    .single();

  if (profile?.role !== "company") redirect("/app");

  // blokada edycji po rozpoczeciu albo zakończeniu realizacji
  const { data: accepted, error: acceptedError } = await supabase
    .from("applications")
    .select("id")
    .eq("offer_id", safeOfferId)
    .in("status", ["accepted", "in_progress", "completed"])
    .limit(1)
    .maybeSingle();

  if (acceptedError) {
    await logOfferMutationError({
      source: "company.offers.update.accepted_lookup",
      error: acceptedError,
      userId: user.id,
      offerId: safeOfferId,
    });
    throw new Error("Nie udalo sie sprawdzic statusu oferty. Sprobuj ponownie.");
  }

  if (accepted?.id) {
    redirect("/app/company/offers");
  }

  // dodatkowo: edytować można tylko published
  const { data: offerRow, error: offerError } = await supabase
    .from("offers")
    .select("id, status, company_id")
    .eq("id", safeOfferId)
    .maybeSingle();

  if (offerError) {
    await logOfferMutationError({
      source: "company.offers.update.offer_lookup",
      error: offerError,
      userId: user.id,
      offerId: safeOfferId,
    });
    throw new Error("Nie udalo sie pobrac oferty. Sprobuj ponownie.");
  }

  if (!offerRow || offerRow.company_id !== user.id) redirect("/app/company/offers");
  if (offerRow.status !== "published") redirect("/app/company/offers");

  const tytul = getString(formData, "tytul");
  const opis = getString(formData, "opis");
  const typ = getString(formData, "typ");
  const czas = getString(formData, "czas");
  const wymagania = getString(formData, "wymagania");
  const stawka = parseOfferAmount(formData, "stawka");

  const allowed = ["micro", "projekt", "praktyka"];
  if (!allowed.includes(typ)) redirect("/app/company/offers");
  if (!tytul || !opis) redirect("/app/company/offers");

  const { data: updated, error } = await supabase
    .from("offers")
    .update({
      tytul,
      opis,
      typ,
      czas: czas || null,
      wymagania: wymagania || null,
      stawka: stawka ?? null,
    })
    .eq("id", safeOfferId)
    .eq("company_id", user.id)
    .eq("status", "published")
    .select("id")
    .maybeSingle();

  if (error) {
    await logOfferMutationError({
      source: "company.offers.update.save",
      error,
      userId: user.id,
      offerId: safeOfferId,
    });
    throw new Error("Nie udalo sie zapisac zmian oferty. Sprobuj ponownie.");
  }
  if (!updated?.id) {
    redirect("/app/company/offers");
  }

  revalidatePath("/app/company/offers");
  revalidatePath("/app");
  revalidatePath(`/app/offers/${safeOfferId}`);

  redirect("/app/company/offers");
}
