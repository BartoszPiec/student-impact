"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { trySendNotification } from "@/lib/notifications/server";
import { ensureConversationIdForApplication } from "@/lib/services/service-order-conversations";
import { closeRejectedApplicationConversation } from "@/lib/services/application-chat-closure";
import { logCriticalError } from "@/lib/observability/error-log";
import { uuidSchema } from "@/lib/security/validation";

interface OfferRow {
  id: string;
  company_id: string;
  stawka?: number | null;
  tytul: string | null;
  is_platform_service?: boolean | null;
  typ?: string | null;
}

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

type ApplicationWithOffer = {
  id: string;
  status: string;
  student_id: string;
  offer_id: string;
  proposed_stawka?: number | null;
  agreed_stawka?: number | null;
  agreed_stawka_minor?: number | null;
  counter_stawka?: number | null;
  offers: OfferRow | OfferRow[] | null;
};

function unwrapRelation<T>(value: T | T[] | null): T | null {
  return Array.isArray(value) ? value[0] ?? null : value;
}

function toMinorUnits(value: number | null | undefined): number | null {
  if (value == null || !Number.isFinite(value)) return null;
  return Math.round(value * 100);
}

function fromMinorUnits(value: number | null | undefined): number | null {
  if (value == null || !Number.isFinite(value)) return null;
  return value / 100;
}

function toNumber(v: FormDataEntryValue | null): number | null {
  if (typeof v !== "string") return null;
  const n = Number(v);
  if (!Number.isFinite(n)) return null;
  return n;
}

function isMultiInstanceOffer(offer: OfferRow): boolean {
  return offer.is_platform_service === true;
}

function parseApplicationId(applicationId: string) {
  const parsed = uuidSchema.safeParse(applicationId);
  if (!parsed.success) {
    throw new Error("Nieprawidlowy identyfikator zgloszenia.");
  }

  return parsed.data;
}

async function logCompanyApplicationActionError(input: {
  source: string;
  error: unknown;
  userId?: string | null;
  applicationId?: string | null;
  offerId?: string | null;
  conversationId?: string | null;
}) {
  await logCriticalError({
    source: input.source,
    error: input.error,
    userId: input.userId ?? null,
    context: {
      applicationId: input.applicationId ?? null,
      offerId: input.offerId ?? null,
      conversationId: input.conversationId ?? null,
    },
  });
}

async function hasAnotherLockedApplication(
  supabase: Awaited<ReturnType<typeof createClient>>,
  offerId: string,
  applicationId: string,
  userId?: string,
) {
  const { count, error } = await supabase
    .from("applications")
    .select("id", { count: "exact", head: true })
    .eq("offer_id", offerId)
    .neq("id", applicationId)
    .in("status", ["accepted", "in_progress", "completed"]);

  if (error) {
    await logCompanyApplicationActionError({
      source: "company.applications.locked_application_lookup",
      error,
      userId,
      applicationId,
      offerId,
    });
    throw new Error("Nie udalo sie sprawdzic statusu innych zgloszen.");
  }
  return (count ?? 0) > 0;
}

async function notifyUser(
  userId: string,
  typ: string,
  payload: Record<string, unknown> = {}
) {
  await trySendNotification(userId, typ, payload);
}

async function ensureConversationForApplication(
  supabase: SupabaseClient,
  args: {
    application_id: string;
    offer_id: string;
    company_id: string;
    student_id: string;
  }
) {
  return ensureConversationIdForApplication(supabase, {
    applicationId: args.application_id,
    offerId: args.offer_id,
    companyId: args.company_id,
    studentId: args.student_id,
  });
}

async function insertChatMessage(
  supabase: SupabaseClient,
  conversationId: string,
  senderId: string,
  content: string,
  event: string | null = null,
  payload: Record<string, unknown> | null = null
) {
  const b = (content ?? "").trim();
  if (!b) return;

  const { error } = await supabase.from("messages").insert({
    conversation_id: conversationId,
    sender_id: senderId,
    content: b,
    event: event,
    payload: payload
  });

  if (error) {
    await logCompanyApplicationActionError({
      source: "company.applications.chat_message_insert",
      error,
      userId: senderId,
      conversationId,
    });
    throw new Error("Nie udalo sie zapisac wiadomosci na czacie.");
  }
}

export async function acceptApplication(applicationId: string) {
  const supabase = await createClient();

  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) redirect("/auth");
  const safeApplicationId = parseApplicationId(applicationId);

  const { data: appRow, error: appErr } = await supabase
    .from("applications")
    .select(
      "id, status, student_id, offer_id, proposed_stawka, agreed_stawka, agreed_stawka_minor, counter_stawka, offers!inner(id, tytul, stawka, company_id, is_platform_service, typ)"
    )
    .eq("id", safeApplicationId)
    .single();

  if (appErr) {
    await logCompanyApplicationActionError({
      source: "company.applications.accept.lookup",
      error: appErr,
      userId: user.id,
      applicationId: safeApplicationId,
    });
    redirect("/app");
  }
  if (!appRow) redirect("/app");

  const application = appRow as ApplicationWithOffer;
  const offer = unwrapRelation(application.offers);

  if (!offer || offer.company_id !== user.id) redirect("/app");

  if (appRow.status !== "sent") {
    revalidatePath("/app/company/applications");
    return;
  }

  if (!isMultiInstanceOffer(offer) && (await hasAnotherLockedApplication(supabase, offer.id, safeApplicationId, user.id))) {
    throw new Error("To zlecenie ma już zaakceptowanego wykonawce.");
  }

  const now = new Date().toISOString();
  const agreed = application.agreed_stawka
    ?? fromMinorUnits(application.agreed_stawka_minor)
    ?? application.proposed_stawka
    ?? offer.stawka
    ?? null;

  // ✅ zaakceptuj
  const { error: updErr } = await supabase
    .from("applications")
    .update({
      status: "accepted",
      agreed_stawka: agreed,
      agreed_stawka_minor: toMinorUnits(agreed),
      decided_at: now,
    })
    .eq("id", safeApplicationId);

  if (updErr) {
    await logCompanyApplicationActionError({
      source: "company.applications.accept.update",
      error: updErr,
      userId: user.id,
      applicationId: safeApplicationId,
      offerId: offer.id,
    });
    throw new Error("Nie udalo sie zaakceptowac zgloszenia. Odswiez strone i sprobuj ponownie.");
  }

  // ✅ [Realization Guard] Utwórz Kontrakt (Contract + Milestone)
  const { error: contractError } = await supabase.rpc("ensure_contract_for_application", {
    p_application_id: safeApplicationId,
  });

  if (contractError) {
    await logCompanyApplicationActionError({
      source: "company.applications.accept.contract_rpc",
      error: contractError,
      userId: user.id,
      applicationId: safeApplicationId,
      offerId: offer.id,
    });
    throw new Error("Zgloszenie zostalo zaakceptowane, ale nie udalo sie przygotowac kontraktu.");
  }

  // ✅ odrzuć inne aplikacje do tej samej oferty (sent/countered)
  if (!isMultiInstanceOffer(offer)) {
  const { data: others, error: othersError } = await supabase
    .from("applications")
    .select("id, student_id")
    .eq("offer_id", offer.id)
    .neq("id", safeApplicationId)
    .in("status", ["sent", "countered"]);

  if (othersError) {
    await logCompanyApplicationActionError({
      source: "company.applications.accept.competing_lookup",
      error: othersError,
      userId: user.id,
      applicationId: safeApplicationId,
      offerId: offer.id,
    });
    throw new Error("Nie udalo sie sprawdzic pozostalych zgloszen.");
  }

  if ((others ?? []).length > 0) {
    const { error: rejectOthersError } = await supabase
      .from("applications")
      .update({ status: "rejected", decided_at: now })
      .eq("offer_id", offer.id)
      .neq("id", safeApplicationId)
      .in("status", ["sent", "countered"]);

    if (rejectOthersError) {
      await logCompanyApplicationActionError({
        source: "company.applications.accept.competing_update",
        error: rejectOthersError,
        userId: user.id,
        applicationId: safeApplicationId,
        offerId: offer.id,
      });
      throw new Error("Nie udalo sie odrzucic pozostalych zgloszen.");
    }

    // powiadom pozostałych
    for (const o of others ?? []) {
      if (!o?.student_id) continue;
      await notifyUser(o.student_id, "offer_closed", {
        offer_id: offer.id,
        offer_title: offer.tytul ?? null,
        reason: "accepted_other",
      });
      const rejectedConversationId = await closeRejectedApplicationConversation(supabase, {
        applicationId: o.id,
        offerId: offer.id,
        companyId: offer.company_id,
        studentId: o.student_id,
        senderId: user.id,
        content: "Niestety tym razem firma wybrała kogoś innego.",
      });
      revalidatePath(`/app/chat/${rejectedConversationId}`);
    }
  }

  // ✅ oferta znika z tablicy ofert (published -> in_progress)
  const { error: offerErr } = await supabase
    .from("offers")
    .update({ status: "in_progress" })
    .eq("id", offer.id);

  if (offerErr) {
    await logCompanyApplicationActionError({
      source: "company.applications.accept.offer_update",
      error: offerErr,
      userId: user.id,
      applicationId: safeApplicationId,
      offerId: offer.id,
    });
    throw new Error("Nie udalo sie zaktualizowac statusu oferty.");
  }
  }

  // ✅ wiadomość systemowa na czacie
  try {
    const conversationId = await ensureConversationForApplication(supabase, {
      application_id: safeApplicationId,
      offer_id: offer.id,
      company_id: offer.company_id,
      student_id: appRow.student_id,
    });

    await insertChatMessage(
      supabase,
      conversationId,
      user.id,
      `Stawka ${agreed ?? offer.stawka ?? "-"} zł zaakceptowana.`,
      "application_accepted",
      {
        agreed_stawka: agreed,
        agreed_stawka_minor: toMinorUnits(agreed),
      }
    );
  } catch {
    // nie blokujemy flow
  }

  // ✅ powiadom zaakceptowanego studenta
  await notifyUser(appRow.student_id, "application_accepted", {
    application_id: safeApplicationId,
    offer_id: offer.id,
    offer_title: offer.tytul ?? null,
    agreed_stawka: agreed,
    agreed_stawka_minor: toMinorUnits(agreed),
  });

  // Revalidate chat page if conversation exists
  const { data: conv, error: conversationLookupError } = await supabase
    .from("conversations")
    .select("id")
    .eq("application_id", safeApplicationId)
    .maybeSingle();
  if (conversationLookupError) {
    await logCompanyApplicationActionError({
      source: "company.applications.accept.conversation_revalidate_lookup",
      error: conversationLookupError,
      userId: user.id,
      applicationId: safeApplicationId,
      offerId: offer.id,
    });
  }
  if (conv) {
    revalidatePath(`/app/chat/${conv.id}`);
  }

  revalidatePath("/app/company/applications");
  revalidatePath("/app/company/offers");
  revalidatePath("/app/applications");
  revalidatePath("/app");
  revalidatePath("/app/notifications");


  redirect("/app/company/offers");
}

export async function rejectApplication(applicationId: string) {
  const supabase = await createClient();

  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) redirect("/auth");
  const safeApplicationId = parseApplicationId(applicationId);

  const { data: appRow, error: appErr } = await supabase
    .from("applications")
    .select("id, status, student_id, offer_id, offers!inner(id, tytul, company_id)")
    .eq("id", safeApplicationId)
    .single();

  if (appErr) {
    await logCompanyApplicationActionError({
      source: "company.applications.reject.lookup",
      error: appErr,
      userId: user.id,
      applicationId: safeApplicationId,
    });
    redirect("/app");
  }
  if (!appRow) redirect("/app");

  const application = appRow as ApplicationWithOffer;
  const offer = unwrapRelation(application.offers);

  if (!offer || offer.company_id !== user.id) redirect("/app");

  if (appRow.status !== "sent") {
    revalidatePath("/app/company/applications");
    return;
  }

  const { error: updErr } = await supabase
    .from("applications")
    .update({ status: "rejected", decided_at: new Date().toISOString() })
    .eq("id", safeApplicationId);

  if (updErr) {
    await logCompanyApplicationActionError({
      source: "company.applications.reject.update",
      error: updErr,
      userId: user.id,
      applicationId: safeApplicationId,
      offerId: offer.id,
    });
    throw new Error("Nie udalo sie odrzucic zgloszenia. Odswiez strone i sprobuj ponownie.");
  }

  await notifyUser(appRow.student_id, "application_rejected", {
    application_id: safeApplicationId,
    offer_id: offer.id,
    offer_title: offer.tytul ?? null,
  });

  // ✅ message systemowy "Odrzucono" (opcjonalnie, ale w Vinted stylu warto)
  try {
    const conversationId = await ensureConversationForApplication(supabase, {
      application_id: safeApplicationId,
      offer_id: offer.id,
      company_id: offer.company_id,
      student_id: appRow.student_id,
    });
    await insertChatMessage(
      supabase,
      conversationId,
      user.id,
      "Aplikacja została odrzucona.",
      "application_rejected",
      {}
    );
  } catch { }

  revalidatePath("/app/company/applications");
  revalidatePath("/app/applications");
  revalidatePath("/app/notifications");
}

export async function counterOffer(applicationId: string, formData: FormData) {
  const supabase = await createClient();

  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) redirect("/auth");
  const safeApplicationId = parseApplicationId(applicationId);

  const counter = toNumber(formData.get("counter_stawka"));
  if (counter == null || counter <= 0 || counter > 500000) {
    revalidatePath("/app/company/applications");
    return;
  }

  const { data: appRow, error: appErr } = await supabase
    .from("applications")
    .select("id, status, student_id, offer_id, offers!inner(id, tytul, company_id)")
    .eq("id", safeApplicationId)
    .single();

  if (appErr) {
    await logCompanyApplicationActionError({
      source: "company.applications.counter.lookup",
      error: appErr,
      userId: user.id,
      applicationId: safeApplicationId,
    });
    redirect("/app");
  }
  if (!appRow) redirect("/app");

  const application = appRow as ApplicationWithOffer;
  const offer = unwrapRelation(application.offers);

  if (!offer || offer.company_id !== user.id) redirect("/app");

  if (appRow.status !== "sent") {
    revalidatePath("/app/company/applications");
    return;
  }

  if (!isMultiInstanceOffer(offer as OfferRow) && (await hasAnotherLockedApplication(supabase, offer.id, safeApplicationId, user.id))) {
    throw new Error("To zlecenie ma już zaakceptowanego wykonawce.");
  }

  const { error: updErr } = await supabase
    .from("applications")
    .update({
      status: "countered",
      counter_stawka: counter,
      decided_at: null,
      agreed_stawka: null,
      agreed_stawka_minor: null,
    })
    .eq("id", safeApplicationId);

  if (updErr) {
    await logCompanyApplicationActionError({
      source: "company.applications.counter.update",
      error: updErr,
      userId: user.id,
      applicationId: safeApplicationId,
      offerId: offer.id,
    });
    throw new Error("Nie udalo sie zapisac kontroferty. Odswiez strone i sprobuj ponownie.");
  }

  // ✅ dopisz do czatu
  try {
    const conversationId = await ensureConversationForApplication(supabase, {
      application_id: safeApplicationId,
      offer_id: offer.id,
      company_id: offer.company_id,
      student_id: appRow.student_id,
    });

    await insertChatMessage(
      supabase,
      conversationId,
      user.id,
      `Kontrpropozycja firmy: ${counter} zł.`,
      "rate.proposed",
      { proposed_stawka: counter, currency: "PLN" }
    );
  } catch {
    // nie blokujemy
  }

  await notifyUser(appRow.student_id, "application_countered", {
    application_id: safeApplicationId,
    offer_id: offer.id,
    offer_title: offer.tytul ?? null,
    counter_stawka: counter,
  });

  revalidatePath("/app/company/applications");
  revalidatePath("/app/applications");
  revalidatePath("/app/notifications");
}

/** ✅ alias pod to co Ci krzyczało w imporcie */
export async function proposeCounter(applicationId: string, formData: FormData) {
  return counterOffer(applicationId, formData);
}
