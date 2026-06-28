"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";
import { trySendNotification } from "@/lib/notifications/server";
import { buildRateLimitKey, enforceRateLimit } from "@/lib/rate-limit";
import { logSavedOfferError } from "@/lib/observability/saved-offers";
import { UUID_RE } from "@/lib/security/validation";
import { ensureConversationIdForApplication } from "@/lib/services/service-order-conversations";
import {
  closeRejectedApplicationConversation,
  rejectCompetingApplicationsForOffer,
} from "@/lib/services/application-chat-closure";

type AppSupabaseClient = Awaited<ReturnType<typeof createClient>>;
type JsonPayload = Record<string, unknown>;
type RelationValue<T> = T | T[] | null;

type OfferRecord = {
  id: string;
  tytul: string | null;
  company_id?: string | null;
  stawka?: number | null;
  is_platform_service?: boolean | null;
  typ?: string | null;
};

type ApplicationRowBase = {
  id: string;
  status: string;
  student_id: string;
  offer_id: string;
};

type ApplicationRowWithOffer = ApplicationRowBase & {
  proposed_stawka?: number | null;
  counter_stawka?: number | null;
  offers: RelationValue<OfferRecord>;
};

type ConversationArgs = {
  application_id: string;
  offer_id: string;
  company_id: string;
  student_id: string;
};

type OfferNotificationRow = {
  company_id: string | null;
  tytul: string | null;
};

type ConversationOfferRecord = {
  tytul: string | null;
  company_id: string | null;
};

type ConversationRow = {
  id: string;
  company_id: string;
  student_id: string;
  offer_id: string;
  offers: RelationValue<ConversationOfferRecord>;
};

type IdRow = {
  id: string;
};

const uuidSchema = z.string().trim().regex(UUID_RE, "Nieprawidłowy identyfikator.");
const applicationIdSchema = uuidSchema;
const moneySchema = z.coerce
  .number()
  .finite("Podaj prawidłową stawkę.")
  .min(1, "Stawka musi być większa od zera.")
  .max(100_000, "Stawka przekracza limit dla oferty.")
  .transform((value) => Number(value.toFixed(2)));
const quoteProposalSchema = z.object({
  conversationId: uuidSchema,
  offerId: uuidSchema,
  price: moneySchema,
  message: z.string().trim().max(1_000, "Wiadomość jest zbyt długa.").default(""),
});

function parseOrThrow<T>(parsed: z.ZodSafeParseResult<T>): T {
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message || "Nieprawidłowe dane formularza.");
  }

  return parsed.data;
}

function unwrapRelation<T>(value: RelationValue<T>): T | null {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
}

function getOffer(row: ApplicationRowWithOffer): OfferRecord {
  const offer = unwrapRelation(row.offers);
  if (!offer) {
    throw new Error("Nie znaleziono powiązanej oferty.");
  }

  return offer;
}

function getCompanyId(offer: OfferRecord): string {
  if (!offer.company_id) {
    throw new Error("Nie znaleziono firmy przypisanej do oferty.");
  }

  return offer.company_id;
}

function isMultiInstanceOffer(offer: OfferRecord): boolean {
  return offer.is_platform_service === true;
}

async function hasAnotherLockedApplication(
  supabase: AppSupabaseClient,
  offerId: string,
  applicationId: string,
) {
  const { count, error } = await supabase
    .from("applications")
    .select("id", { count: "exact", head: true })
    .eq("offer_id", offerId)
    .neq("id", applicationId)
    .in("status", ["accepted", "in_progress", "completed"]);

  if (error) throw new Error("Nie udało się sprawdzić statusu innych zgłoszeń.");
  return (count ?? 0) > 0;
}

async function notifyUser(
  _supabase: AppSupabaseClient,
  userId: string,
  typ: string,
  payload: JsonPayload = {},
) {
  await trySendNotification(userId, typ, payload);
}

function toMinorUnits(value: number | null | undefined): number | null {
  if (value == null || !Number.isFinite(value)) return null;
  return Math.round(value * 100);
}

async function enforceApplicationsRateLimit(userId: string, action: string, targetId: string) {
  const headerStore = await headers();
  const forwarded = headerStore.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() || headerStore.get("x-real-ip") || "unknown";

  const rateKey = buildRateLimitKey(["applications", action, userId, ip, targetId]);
  const rateLimitResult = await enforceRateLimit("apply", rateKey);
  if (!rateLimitResult.success) {
    throw new Error("Zbyt wiele operacji na aplikacjach. Spróbuj ponownie za chwilę.");
  }
}

async function ensureConversationForApplication(
  supabase: AppSupabaseClient,
  args: ConversationArgs,
) {
  return ensureConversationIdForApplication(supabase, {
    applicationId: args.application_id,
    offerId: args.offer_id,
    companyId: args.company_id,
    studentId: args.student_id,
  });
}

async function insertChatMessage(
  supabase: AppSupabaseClient,
  conversationId: string,
  senderId: string,
  content: string,
  event: string | null = null,
  payload: JsonPayload | null = null,
) {
  const trimmedContent = content.trim();
  if (!trimmedContent) return;

  const { error } = await supabase.from("messages").insert({
    conversation_id: conversationId,
    sender_id: senderId,
    content: trimmedContent,
    event,
    payload,
  });

  if (error) throw new Error("Nie udało się zapisać wiadomości.");
}

async function acceptApplicationWithAgreedRate(
  supabase: AppSupabaseClient,
  params: {
    applicationId: string;
    studentId: string;
    fromStatuses: string[];
    agreed: number;
  },
) {
  const { data: updated, error } = await supabase
    .from("applications")
    .update({
      status: "accepted",
      agreed_stawka: params.agreed,
      agreed_stawka_minor: toMinorUnits(params.agreed),
      decided_at: new Date().toISOString(),
    })
    .eq("id", params.applicationId)
    .eq("student_id", params.studentId)
    .in("status", params.fromStatuses)
    .select("id")
    .single();

  if (error || !updated) {
    throw new Error("Nie udało się zaakceptować stawki. Odśwież stronę i spróbuj ponownie.");
  }
}

export async function acceptCounterAsStudent(applicationId: string) {
  const supabase = await createClient();

  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) redirect("/auth");
  const parsedApplicationId = parseOrThrow(applicationIdSchema.safeParse(applicationId));
  await enforceApplicationsRateLimit(user.id, "accept_counter", parsedApplicationId);

  const { data, error } = await supabase
    .from("applications")
    .select(
      "id, status, student_id, offer_id, counter_stawka, offers!inner(id, tytul, company_id, stawka, is_platform_service, typ)",
    )
    .eq("id", parsedApplicationId)
    .single();

  const appRow = data as ApplicationRowWithOffer | null;
  if (error || !appRow) return;
  if (appRow.student_id !== user.id) redirect("/app");

  if (appRow.status !== "countered" || appRow.counter_stawka == null) {
    revalidatePath("/app/applications");
    return;
  }

  const offer = getOffer(appRow);
  const companyId = getCompanyId(offer);
  if (!isMultiInstanceOffer(offer) && (await hasAnotherLockedApplication(supabase, appRow.offer_id, parsedApplicationId))) {
    await supabase
      .from("applications")
      .update({ status: "rejected", decided_at: new Date().toISOString() })
      .eq("id", parsedApplicationId)
      .in("status", ["sent", "countered"]);

    const conversationId = await closeRejectedApplicationConversation(supabase, {
      applicationId: parsedApplicationId,
      offerId: appRow.offer_id,
      companyId,
      studentId: appRow.student_id,
      senderId: companyId,
      content: "Niestety tym razem firma wybrała kogoś innego.",
    });

    revalidatePath(`/app/chat/${conversationId}`);
    revalidatePath("/app/applications");
    return;
  }
  const agreed = appRow.counter_stawka;

  await acceptApplicationWithAgreedRate(supabase, {
    applicationId: parsedApplicationId,
    studentId: user.id,
    fromStatuses: ["countered"],
    agreed,
  });

  const { error: contractError } = await supabase.rpc("ensure_contract_for_application", {
    p_application_id: parsedApplicationId,
  });
  if (contractError) throw new Error("Stawka została zaakceptowana, ale nie udało się przygotować kontraktu.");

  if (!isMultiInstanceOffer(offer)) {
    const rejectedApplications = await rejectCompetingApplicationsForOffer(supabase, {
      offerId: appRow.offer_id,
      acceptedApplicationId: parsedApplicationId,
      companyId,
      senderId: companyId,
      content: "Niestety tym razem firma wybrała kogoś innego.",
    });

    for (const rejectedApplication of rejectedApplications) {
      await notifyUser(supabase, rejectedApplication.studentId, "offer_closed", {
        offer_id: appRow.offer_id,
        offer_title: offer.tytul,
        reason: "accepted_other",
        conversation_id: rejectedApplication.conversationId,
      });
      revalidatePath(`/app/chat/${rejectedApplication.conversationId}`);
    }

    await supabase
      .from("offers")
      .update({ status: "in_progress" })
      .eq("id", appRow.offer_id);
  }

  try {
    const conversationId = await ensureConversationForApplication(supabase, {
      application_id: parsedApplicationId,
      offer_id: appRow.offer_id,
      company_id: companyId,
      student_id: appRow.student_id,
    });

    await insertChatMessage(
      supabase,
      conversationId,
      user.id,
      `Stawka ${agreed} zł zaakceptowana.`,
      "rate.accepted",
      {
        agreed_stawka: agreed,
        agreed_stawka_minor: toMinorUnits(agreed),
        agreed_rate: agreed,
      },
    );
  } catch {
    // Do not block the main flow if chat sync fails.
  }

  await notifyUser(supabase, companyId, "counter_accepted", {
    application_id: parsedApplicationId,
    offer_id: appRow.offer_id,
    offer_title: offer.tytul,
    agreed_stawka: agreed,
    agreed_stawka_minor: toMinorUnits(agreed),
  });

  revalidatePath("/app/applications");
  revalidatePath("/app/company/offers");
  revalidatePath("/app/company/applications");
  revalidatePath(`/app/deliverables/${parsedApplicationId}`);
  revalidatePath("/app/notifications");
}

export async function acceptProposalAsStudent(applicationId: string) {
  const supabase = await createClient();

  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) redirect("/auth");
  const parsedApplicationId = parseOrThrow(applicationIdSchema.safeParse(applicationId));
  await enforceApplicationsRateLimit(user.id, "accept_proposal", parsedApplicationId);

  const { data, error } = await supabase
    .from("applications")
    .select(
      "id, status, student_id, offer_id, proposed_stawka, offers!inner(id, tytul, company_id, stawka, is_platform_service, typ)",
    )
    .eq("id", parsedApplicationId)
    .single();

  const appRow = data as ApplicationRowWithOffer | null;
  if (error || !appRow) return;
  if (appRow.student_id !== user.id) redirect("/app");

  if (appRow.status !== "sent" || appRow.proposed_stawka == null) {
    revalidatePath("/app/applications");
    return;
  }

  const offer = getOffer(appRow);
  const companyId = getCompanyId(offer);
  if (!isMultiInstanceOffer(offer) && (await hasAnotherLockedApplication(supabase, appRow.offer_id, parsedApplicationId))) {
    await supabase
      .from("applications")
      .update({ status: "rejected", decided_at: new Date().toISOString() })
      .eq("id", parsedApplicationId)
      .in("status", ["sent", "countered"]);

    const conversationId = await closeRejectedApplicationConversation(supabase, {
      applicationId: parsedApplicationId,
      offerId: appRow.offer_id,
      companyId,
      studentId: appRow.student_id,
      senderId: companyId,
      content: "Niestety tym razem firma wybrała kogoś innego.",
    });

    revalidatePath(`/app/chat/${conversationId}`);
    revalidatePath("/app/applications");
    return;
  }
  const agreed = appRow.proposed_stawka;

  await acceptApplicationWithAgreedRate(supabase, {
    applicationId: parsedApplicationId,
    studentId: user.id,
    fromStatuses: ["sent"],
    agreed,
  });

  const { error: contractError } = await supabase.rpc("ensure_contract_for_application", {
    p_application_id: parsedApplicationId,
  });
  if (contractError) throw new Error("Propozycja została zaakceptowana, ale nie udało się przygotować kontraktu.");

  if (!isMultiInstanceOffer(offer)) {
    const rejectedApplications = await rejectCompetingApplicationsForOffer(supabase, {
      offerId: appRow.offer_id,
      acceptedApplicationId: parsedApplicationId,
      companyId,
      senderId: companyId,
      content: "Niestety tym razem firma wybrała kogoś innego.",
    });

    for (const rejectedApplication of rejectedApplications) {
      await notifyUser(supabase, rejectedApplication.studentId, "offer_closed", {
        offer_id: appRow.offer_id,
        offer_title: offer.tytul,
        reason: "accepted_other",
        conversation_id: rejectedApplication.conversationId,
      });
      revalidatePath(`/app/chat/${rejectedApplication.conversationId}`);
    }

    await supabase
      .from("offers")
      .update({ status: "in_progress" })
      .eq("id", appRow.offer_id);
  }

  try {
    const conversationId = await ensureConversationForApplication(supabase, {
      application_id: parsedApplicationId,
      offer_id: appRow.offer_id,
      company_id: companyId,
      student_id: appRow.student_id,
    });

    await insertChatMessage(
      supabase,
      conversationId,
      user.id,
      `Stawka ${agreed} zł zaakceptowana.`,
      "application_accepted",
      {
        agreed_stawka: agreed,
        agreed_stawka_minor: toMinorUnits(agreed),
      },
    );
  } catch {
    // Do not block the main flow if chat sync fails.
  }

  await notifyUser(supabase, companyId, "application_accepted", {
    application_id: parsedApplicationId,
    offer_id: appRow.offer_id,
    offer_title: offer.tytul,
    agreed_stawka: agreed,
    agreed_stawka_minor: toMinorUnits(agreed),
  });

  revalidatePath("/app/applications");
  revalidatePath("/app/company/offers");
  revalidatePath("/app/company/applications");
  revalidatePath(`/app/deliverables/${parsedApplicationId}`);
  revalidatePath("/app/notifications");
}

export async function rejectProposalAsStudent(applicationId: string) {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  const user = authData.user;
  if (!user) redirect("/auth");
  const parsedApplicationId = parseOrThrow(applicationIdSchema.safeParse(applicationId));
  await enforceApplicationsRateLimit(user.id, "reject_proposal", parsedApplicationId);

  const { data, error } = await supabase
    .from("applications")
    .select("id, status, student_id, offer_id, offers!inner(id, tytul, company_id)")
    .eq("id", parsedApplicationId)
    .single();

  const appRow = data as ApplicationRowWithOffer | null;
  if (error || !appRow || appRow.student_id !== user.id) redirect("/app");

  if (appRow.status !== "sent") {
    revalidatePath("/app/applications");
    return;
  }

  const offer = getOffer(appRow);
  const companyId = getCompanyId(offer);

  const { data: updatedApplication, error: updateError } = await supabase
    .from("applications")
    .update({ status: "rejected", decided_at: new Date().toISOString() })
    .eq("id", parsedApplicationId)
    .eq("student_id", user.id)
    .in("status", ["sent"])
    .select("id")
    .single();

  if (updateError || !updatedApplication) throw new Error("Nie udało się odrzucić propozycji. Odśwież stronę i spróbuj ponownie.");

  try {
    const conversationId = await ensureConversationForApplication(supabase, {
      application_id: parsedApplicationId,
      offer_id: appRow.offer_id,
      company_id: companyId,
      student_id: appRow.student_id,
    });
    await insertChatMessage(
      supabase,
      conversationId,
      user.id,
      "Propozycja odrzucona.",
      "application_rejected",
      {},
    );
  } catch {
    // Do not block the main flow if chat sync fails.
  }

  await notifyUser(supabase, companyId, "application_rejected", {
    application_id: parsedApplicationId,
    offer_id: appRow.offer_id,
    offer_title: offer.tytul,
  });

  revalidatePath("/app/applications");
  revalidatePath("/app/company/applications");
  revalidatePath("/app/notifications");
}

export async function rejectCounterAsStudent(applicationId: string) {
  const supabase = await createClient();

  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) redirect("/auth");
  const parsedApplicationId = parseOrThrow(applicationIdSchema.safeParse(applicationId));
  await enforceApplicationsRateLimit(user.id, "reject_counter", parsedApplicationId);

  const { data, error } = await supabase
    .from("applications")
    .select("id, status, student_id, offer_id, offers!inner(id, tytul, company_id)")
    .eq("id", parsedApplicationId)
    .single();

  const appRow = data as ApplicationRowWithOffer | null;
  if (error || !appRow) redirect("/app");
  if (appRow.student_id !== user.id) redirect("/app");

  if (appRow.status !== "countered") {
    revalidatePath("/app/applications");
    return;
  }

  const offer = getOffer(appRow);
  const companyId = getCompanyId(offer);

  const { data: updatedApplication, error: updateError } = await supabase
    .from("applications")
    .update({ status: "rejected", decided_at: new Date().toISOString() })
    .eq("id", parsedApplicationId)
    .eq("student_id", user.id)
    .in("status", ["countered"])
    .select("id")
    .single();

  if (updateError || !updatedApplication) throw new Error("Nie udało się odrzucić kontroferty. Odśwież stronę i spróbuj ponownie.");

  await notifyUser(supabase, companyId, "counter_rejected", {
    application_id: parsedApplicationId,
    offer_id: appRow.offer_id,
    offer_title: offer.tytul,
  });

  try {
    const conversationId = await ensureConversationForApplication(supabase, {
      application_id: parsedApplicationId,
      offer_id: appRow.offer_id,
      company_id: companyId,
      student_id: appRow.student_id,
    });
    await insertChatMessage(
      supabase,
      conversationId,
      user.id,
      "Kontra odrzucona.",
      "rate.rejected",
      {},
    );
  } catch {
    // Do not block the main flow if chat sync fails.
  }

  revalidatePath("/app/applications");
  revalidatePath("/app/company/applications");
  revalidatePath("/app/notifications");
}

export async function proposeNewPriceAsStudent(
  applicationId: string,
  formData: FormData,
) {
  const supabase = await createClient();

  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) redirect("/auth");
  const parsedApplicationId = parseOrThrow(applicationIdSchema.safeParse(applicationId));
  await enforceApplicationsRateLimit(user.id, "propose_new_price", parsedApplicationId);

  const proposed = parseOrThrow(moneySchema.safeParse(formData.get("proposed_stawka")));

  const { data, error } = await supabase
    .from("applications")
    .select(
      "id, status, student_id, offer_id, offers!inner(id, tytul, company_id, stawka)",
    )
    .eq("id", parsedApplicationId)
    .single();

  const appRow = data as ApplicationRowWithOffer | null;
  if (error || !appRow) redirect("/app");
  if (appRow.student_id !== user.id) redirect("/app");

  if (appRow.status !== "countered") {
    revalidatePath("/app/applications");
    return;
  }

  const offer = getOffer(appRow);
  const companyId = getCompanyId(offer);

  const { data: updatedApplication, error: updateError } = await supabase
    .from("applications")
    .update({
      status: "sent",
      proposed_stawka: proposed,
      counter_stawka: null,
      decided_at: null,
      agreed_stawka: null,
      agreed_stawka_minor: null,
    })
    .eq("id", parsedApplicationId)
    .eq("student_id", user.id)
    .in("status", ["countered"])
    .select("id")
    .single();

  if (updateError || !updatedApplication) throw new Error("Nie udało się zapisać nowej stawki. Odśwież stronę i spróbuj ponownie.");

  try {
    const conversationId = await ensureConversationForApplication(supabase, {
      application_id: parsedApplicationId,
      offer_id: appRow.offer_id,
      company_id: companyId,
      student_id: appRow.student_id,
    });

    await insertChatMessage(
      supabase,
      conversationId,
      user.id,
      `Proponuję stawkę ${proposed} zł.`,
      "rate.proposed",
      { proposed_stawka: proposed },
    );

    await notifyUser(supabase, companyId, "negotiation_proposed", {
      application_id: parsedApplicationId,
      offer_id: appRow.offer_id,
      offer_title: offer.tytul,
      proposed_stawka: proposed,
      conversation_id: conversationId,
    });
  } catch {
    // Do not block the main flow if chat sync fails.
  }

  revalidatePath("/app/applications");
  revalidatePath("/app/company/applications");
  revalidatePath("/app/notifications");
}

export async function withdrawApplication(
  applicationId: string,
  formData?: FormData,
) {
  void formData;

  const supabase = await createClient();

  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) redirect("/auth");
  const parsedApplicationId = parseOrThrow(applicationIdSchema.safeParse(applicationId));
  await enforceApplicationsRateLimit(user.id, "withdraw", parsedApplicationId);

  const { data, error } = await supabase
    .from("applications")
    .select("id, student_id, status, offer_id")
    .eq("id", parsedApplicationId)
    .single();

  const appRow = data as ApplicationRowBase | null;
  if (error || !appRow) {
    revalidatePath("/app/applications");
    return { error: "Nie znaleziono zgłoszenia." };
  }

  if (appRow.student_id !== user.id) {
    return { error: "Brak dostępu do zgłoszenia." };
  }

  if (appRow.status !== "sent" && appRow.status !== "countered") {
    revalidatePath("/app/applications");
    return { error: `Nie można usunąć zgłoszenia o statusie: ${appRow.status}` };
  }

  const { data: updatedApplication, error: updateError } = await supabase
    .from("applications")
    .update({
      status: "cancelled",
      cancelled_at: new Date().toISOString(),
    })
    .eq("id", parsedApplicationId)
    .eq("student_id", user.id)
    .in("status", ["sent", "countered"])
    .select("id")
    .single();

  if (updateError || !updatedApplication) {
    return { error: "Nie udało się wycofać zgłoszenia. Odśwież stronę i spróbuj ponownie." };
  }

  try {
    const { data: offerData } = await supabase
      .from("offers")
      .select("company_id, tytul")
      .eq("id", appRow.offer_id)
      .maybeSingle();

    const offer = offerData as OfferNotificationRow | null;
    if (offer?.company_id) {
      await notifyUser(supabase, offer.company_id, "application_withdrawn", {
        application_id: parsedApplicationId,
        offer_id: appRow.offer_id,
        offer_title: offer.tytul,
        snippet: `Kandydat wycofał zgłoszenie do oferty "${offer.tytul ?? "oferta"}".`,
      });
    }
  } catch {
    // Do not block the main flow if notifications fail.
  }

  revalidatePath("/app");
  revalidatePath("/app/applications");
  if (appRow.offer_id) revalidatePath(`/app/offers/${appRow.offer_id}`);

  return { success: true };
}

export async function removeSavedOffer(offerId: string) {
  const supabase = await createClient();
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError) {
    await logSavedOfferError({
      source: "saved_offers.applications.auth_lookup",
      error: authError,
      offerId,
    });
    return;
  }

  const user = authData.user;
  if (!user) return;
  const parsedOfferId = parseOrThrow(uuidSchema.safeParse(offerId));

  const { error } = await supabase
    .from("saved_offers")
    .delete()
    .eq("offer_id", parsedOfferId)
    .eq("student_id", user.id);

  if (error) {
    await logSavedOfferError({
      source: "saved_offers.applications.delete",
      error,
      userId: user.id,
      offerId: parsedOfferId,
    });
    return;
  }

  revalidatePath("/app/applications");
}

export async function submitQuoteProposal(
  conversationId: string,
  offerId: string,
  price: number,
  message: string,
) {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  const user = authData.user;
  if (!user) throw new Error("Musisz być zalogowany.");

  const input = parseOrThrow(quoteProposalSchema.safeParse({
    conversationId,
    offerId,
    price,
    message,
  }));
  await enforceApplicationsRateLimit(user.id, "submit_quote", input.offerId);

  const { data, error: conversationError } = await supabase
    .from("conversations")
    .select("id, company_id, student_id, offer_id, offers(tytul, company_id)")
    .eq("id", input.conversationId)
    .single();

  const conversation = data as ConversationRow | null;
  if (conversationError || !conversation || conversation.student_id !== user.id) {
    throw new Error("Brak dostępu do rozmowy.");
  }

  if (conversation.offer_id !== input.offerId) {
    throw new Error("Rozmowa nie dotyczy wskazanej oferty.");
  }

  const { data: existingAppData, error: existingAppError } = await supabase
    .from("applications")
    .select("id, status")
    .eq("offer_id", input.offerId)
    .eq("student_id", user.id)
    .maybeSingle();
  if (existingAppError) throw new Error("Nie udało się sprawdzić istniejącego zgłoszenia.");

  const existingApp = existingAppData as (IdRow & { status: string }) | null;
  let appId = existingApp?.id ?? null;

  if (existingApp) {
    if (!["sent", "countered"].includes(existingApp.status)) {
      throw new Error("Nie można zmienić propozycji dla tego statusu zgłoszenia.");
    }

    const { data: updatedApplication, error: updateError } = await supabase
      .from("applications")
      .update({
        status: "sent",
        proposed_stawka: input.price,
        message_to_company: input.message,
      })
      .eq("id", existingApp.id)
      .eq("student_id", user.id)
      .in("status", ["sent", "countered"])
      .select("id")
      .single();

    if (updateError || !updatedApplication) {
      throw new Error("Nie udało się zaktualizować propozycji. Odśwież stronę i spróbuj ponownie.");
    }

    appId = updatedApplication.id;
  } else {
    const { data: newAppData, error } = await supabase
      .from("applications")
      .insert({
        offer_id: input.offerId,
        student_id: user.id,
        status: "sent",
        proposed_stawka: input.price,
        message_to_company: input.message,
      })
      .select("id")
      .single();

    const newApp = newAppData as IdRow | null;
    if (error || !newApp) {
      throw new Error("Nie udało się złożyć oferty. Odśwież stronę i spróbuj ponownie.");
    }

    appId = newApp.id;
  }

  const { data: linkedConversation, error: linkError } = await supabase
    .from("conversations")
    .update({ application_id: appId })
    .eq("id", input.conversationId)
    .eq("student_id", user.id)
    .eq("offer_id", input.offerId)
    .select("id")
    .single();

  if (linkError || !linkedConversation) throw new Error("Nie udało się powiązać propozycji z rozmową.");

  const content = `Złożyłem ofertę realizacji: ${input.price} zł.\n${input.message}`;

  try {
    await insertChatMessage(supabase, input.conversationId, user.id, content, "negotiation_proposed", {
      proposed_stawka: input.price,
      initiator: "student",
    });

    const offerTitle = unwrapRelation(conversation.offers)?.tytul || "Zapytanie";
    await notifyUser(supabase, conversation.company_id, "negotiation_proposed", {
      conversation_id: input.conversationId,
      offer_id: input.offerId,
      offer_title: offerTitle,
      proposed_stawka: input.price,
      snippet: `Otrzymałeś ofertę od studenta: ${input.price} zł`,
    });
  } catch {
    return {
      error: "Propozycja została zapisana, ale nie udało się wysłać wiadomości.",
    };
  }

  revalidatePath(`/app/chat/${input.conversationId}`);
  return { success: true };
}
