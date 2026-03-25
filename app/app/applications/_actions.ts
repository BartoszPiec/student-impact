"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

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

type SimpleConversationRow = {
  id: string;
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

function unwrapRelation<T>(value: RelationValue<T>): T | null {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
}

function getOffer(row: ApplicationRowWithOffer): OfferRecord {
  const offer = unwrapRelation(row.offers);
  if (!offer) {
    throw new Error("Missing related offer");
  }

  return offer;
}

function getCompanyId(offer: OfferRecord): string {
  if (!offer.company_id) {
    throw new Error("Missing offer company");
  }

  return offer.company_id;
}

function isMultiInstanceOffer(offer: OfferRecord): boolean {
  if (offer.is_platform_service === true) {
    return true;
  }

  const offerType = offer.typ?.toLowerCase() ?? "";
  return offerType.includes("micro") || offerType.includes("mikro");
}

async function notifyUser(
  supabase: AppSupabaseClient,
  userId: string,
  typ: string,
  payload: JsonPayload = {},
) {
  try {
    await supabase.rpc("create_notification", {
      p_user_id: userId,
      p_typ: typ,
      p_payload: payload,
    });
  } catch (err: unknown) {
    console.error("notifyUser error:", err);
  }
}

function toNumber(value: FormDataEntryValue | null): number | null {
  if (typeof value !== "string") return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return null;
  return parsed;
}

function toMinorUnits(value: number | null | undefined): number | null {
  if (value == null || !Number.isFinite(value)) return null;
  return Math.round(value * 100);
}

async function ensureConversationForApplication(
  supabase: AppSupabaseClient,
  args: ConversationArgs,
) {
  const { data: existingData } = await supabase
    .from("conversations")
    .select("id")
    .eq("application_id", args.application_id)
    .maybeSingle();

  const existing = existingData as SimpleConversationRow | null;
  if (existing?.id) return existing.id;

  const { data: createdData, error } = await supabase
    .from("conversations")
    .insert({
      application_id: args.application_id,
      company_id: args.company_id,
      student_id: args.student_id,
      offer_id: args.offer_id,
      type: "application",
    })
    .select("id")
    .maybeSingle();

  const created = createdData as SimpleConversationRow | null;
  if (error || !created?.id) {
    throw new Error(error?.message ?? "Nie udalo sie utworzyc rozmowy");
  }

  return created.id;
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

  if (error) throw new Error(error.message);
}

export async function acceptCounterAsStudent(applicationId: string) {
  const supabase = await createClient();

  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) redirect("/auth");

  const { data, error } = await supabase
    .from("applications")
    .select(
      "id, status, student_id, offer_id, counter_stawka, offers!inner(id, tytul, company_id, stawka, is_platform_service, typ)",
    )
    .eq("id", applicationId)
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
  const agreed = appRow.counter_stawka;

  const { error: updateError } = await supabase
    .from("applications")
    .update({
      status: "accepted",
      agreed_stawka: agreed,
      agreed_stawka_minor: toMinorUnits(agreed),
      decided_at: new Date().toISOString(),
    })
    .eq("id", applicationId);

  if (updateError) throw new Error(updateError.message);

  await supabase.rpc("ensure_contract_for_application", {
    p_application_id: applicationId,
  });

  if (!isMultiInstanceOffer(offer)) {
    const now = new Date().toISOString();
    await supabase
      .from("applications")
      .update({ status: "rejected", decided_at: now })
      .eq("offer_id", appRow.offer_id)
      .neq("id", applicationId)
      .in("status", ["sent", "countered"]);

    await supabase
      .from("offers")
      .update({ status: "in_progress" })
      .eq("id", appRow.offer_id);
  }

  try {
    const conversationId = await ensureConversationForApplication(supabase, {
      application_id: applicationId,
      offer_id: appRow.offer_id,
      company_id: companyId,
      student_id: appRow.student_id,
    });

    await insertChatMessage(
      supabase,
      conversationId,
      user.id,
      `Stawka ${agreed} zl zaakceptowana.`,
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
    application_id: applicationId,
    offer_id: appRow.offer_id,
    offer_title: offer.tytul,
    agreed_stawka: agreed,
    agreed_stawka_minor: toMinorUnits(agreed),
  });

  revalidatePath("/app/applications");
  revalidatePath("/app/company/offers");
  revalidatePath("/app/company/applications");
  revalidatePath(`/app/deliverables/${applicationId}`);
  revalidatePath("/app/notifications");
}

export async function acceptProposalAsStudent(applicationId: string) {
  const supabase = await createClient();

  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) redirect("/auth");

  const { data, error } = await supabase
    .from("applications")
    .select(
      "id, status, student_id, offer_id, proposed_stawka, offers!inner(id, tytul, company_id, stawka, is_platform_service, typ)",
    )
    .eq("id", applicationId)
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
  const agreed = appRow.proposed_stawka;

  const { error: updateError } = await supabase
    .from("applications")
    .update({
      status: "accepted",
      agreed_stawka: agreed,
      agreed_stawka_minor: toMinorUnits(agreed),
      decided_at: new Date().toISOString(),
    })
    .eq("id", applicationId);

  if (updateError) throw new Error(updateError.message);

  await supabase.rpc("ensure_contract_for_application", {
    p_application_id: applicationId,
  });

  if (!isMultiInstanceOffer(offer)) {
    const now = new Date().toISOString();
    await supabase
      .from("applications")
      .update({ status: "rejected", decided_at: now })
      .eq("offer_id", appRow.offer_id)
      .neq("id", applicationId)
      .in("status", ["sent", "countered"]);

    await supabase
      .from("offers")
      .update({ status: "in_progress" })
      .eq("id", appRow.offer_id);
  }

  try {
    const conversationId = await ensureConversationForApplication(supabase, {
      application_id: applicationId,
      offer_id: appRow.offer_id,
      company_id: companyId,
      student_id: appRow.student_id,
    });

    await insertChatMessage(
      supabase,
      conversationId,
      user.id,
      `Stawka ${agreed} zl zaakceptowana.`,
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
    application_id: applicationId,
    offer_id: appRow.offer_id,
    offer_title: offer.tytul,
    agreed_stawka: agreed,
    agreed_stawka_minor: toMinorUnits(agreed),
  });

  revalidatePath("/app/applications");
  revalidatePath("/app/company/offers");
  revalidatePath("/app/company/applications");
  revalidatePath(`/app/deliverables/${applicationId}`);
  revalidatePath("/app/notifications");
}

export async function rejectProposalAsStudent(applicationId: string) {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  const user = authData.user;
  if (!user) redirect("/auth");

  const { data, error } = await supabase
    .from("applications")
    .select("id, status, student_id, offer_id, offers!inner(id, tytul, company_id)")
    .eq("id", applicationId)
    .single();

  const appRow = data as ApplicationRowWithOffer | null;
  if (error || !appRow || appRow.student_id !== user.id) redirect("/app");

  if (appRow.status !== "sent") {
    revalidatePath("/app/applications");
    return;
  }

  const offer = getOffer(appRow);
  const companyId = getCompanyId(offer);

  const { error: updateError } = await supabase
    .from("applications")
    .update({ status: "rejected", decided_at: new Date().toISOString() })
    .eq("id", applicationId);

  if (updateError) throw new Error(updateError.message);

  try {
    const conversationId = await ensureConversationForApplication(supabase, {
      application_id: applicationId,
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
    application_id: applicationId,
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

  const { data, error } = await supabase
    .from("applications")
    .select("id, status, student_id, offer_id, offers!inner(id, tytul, company_id)")
    .eq("id", applicationId)
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

  const { error: updateError } = await supabase
    .from("applications")
    .update({ status: "rejected", decided_at: new Date().toISOString() })
    .eq("id", applicationId);

  if (updateError) throw new Error(updateError.message);

  await notifyUser(supabase, companyId, "counter_rejected", {
    application_id: applicationId,
    offer_id: appRow.offer_id,
    offer_title: offer.tytul,
  });

  try {
    const conversationId = await ensureConversationForApplication(supabase, {
      application_id: applicationId,
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

  const proposed = toNumber(formData.get("proposed_stawka"));
  if (proposed == null || proposed <= 0) {
    revalidatePath("/app/applications");
    return;
  }

  const { data, error } = await supabase
    .from("applications")
    .select(
      "id, status, student_id, offer_id, offers!inner(id, tytul, company_id, stawka)",
    )
    .eq("id", applicationId)
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

  const { error: updateError } = await supabase
    .from("applications")
    .update({
      status: "sent",
      proposed_stawka: proposed,
      counter_stawka: null,
      decided_at: null,
      agreed_stawka: null,
      agreed_stawka_minor: null,
    })
    .eq("id", applicationId);

  if (updateError) throw new Error(updateError.message);

  try {
    const conversationId = await ensureConversationForApplication(supabase, {
      application_id: applicationId,
      offer_id: appRow.offer_id,
      company_id: companyId,
      student_id: appRow.student_id,
    });

    await insertChatMessage(
      supabase,
      conversationId,
      user.id,
      `Proponuje stawke ${proposed} zl.`,
      "rate.proposed",
      { proposed_stawka: proposed },
    );

    await notifyUser(supabase, companyId, "negotiation_proposed", {
      application_id: applicationId,
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

  const { data, error } = await supabase
    .from("applications")
    .select("id, student_id, status, offer_id")
    .eq("id", applicationId)
    .single();

  const appRow = data as ApplicationRowBase | null;
  if (error || !appRow) {
    revalidatePath("/app/applications");
    return { error: "Nie znaleziono zgloszenia." };
  }

  if (appRow.student_id !== user.id) {
    return { error: "Brak dostepu do zgloszenia." };
  }

  if (appRow.status !== "sent" && appRow.status !== "countered") {
    revalidatePath("/app/applications");
    return { error: `Nie mozna usunac zgloszenia o statusie: ${appRow.status}` };
  }

  const { error: updateError } = await supabase
    .from("applications")
    .update({
      status: "cancelled",
      cancelled_at: new Date().toISOString(),
    })
    .eq("id", applicationId);

  if (updateError) {
    console.error("Error cancelling application:", updateError);
    return { error: updateError.message };
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
        application_id: applicationId,
        offer_id: appRow.offer_id,
        offer_title: offer.tytul,
        snippet: `Kandydat wycofal zgloszenie do oferty "${offer.tytul ?? "oferta"}".`,
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
  const { data: authData } = await supabase.auth.getUser();
  const user = authData.user;
  if (!user) return;

  await supabase
    .from("saved_offers")
    .delete()
    .eq("offer_id", offerId)
    .eq("student_id", user.id);

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
  if (!user) throw new Error("Musisz byc zalogowany.");

  const { data } = await supabase
    .from("conversations")
    .select("id, company_id, student_id, offer_id, offers(tytul, company_id)")
    .eq("id", conversationId)
    .single();

  const conversation = data as ConversationRow | null;
  if (!conversation || conversation.student_id !== user.id) {
    throw new Error("Brak dostepu do rozmowy.");
  }

  const { data: existingAppData } = await supabase
    .from("applications")
    .select("id")
    .eq("offer_id", offerId)
    .eq("student_id", user.id)
    .maybeSingle();

  const existingApp = existingAppData as IdRow | null;
  let appId = existingApp?.id ?? null;

  if (existingApp) {
    await supabase
      .from("applications")
      .update({
        status: "sent",
        proposed_stawka: price,
        message_to_company: message,
      })
      .eq("id", existingApp.id);
  } else {
    const { data: newAppData, error } = await supabase
      .from("applications")
      .insert({
        offer_id: offerId,
        student_id: user.id,
        status: "sent",
        proposed_stawka: price,
        message_to_company: message,
      })
      .select("id")
      .maybeSingle();

    const newApp = newAppData as IdRow | null;
    if (error || !newApp) {
      throw new Error(error?.message || "Nie udalo sie zlozyc oferty.");
    }

    appId = newApp.id;
  }

  await supabase
    .from("conversations")
    .update({ application_id: appId })
    .eq("id", conversationId);

  const content = `Zlozylem oferte realizacji: ${price} zl.\n${message}`;

  try {
    await insertChatMessage(supabase, conversationId, user.id, content, "negotiation_proposed", {
      proposed_stawka: price,
      initiator: "student",
    });

    const offerTitle = unwrapRelation(conversation.offers)?.tytul || "Zapytanie";
    await notifyUser(supabase, conversation.company_id, "negotiation_proposed", {
      conversation_id: conversationId,
      offer_id: offerId,
      offer_title: offerTitle,
      proposed_stawka: price,
      snippet: `Otrzymales oferte od studenta: ${price} zl`,
    });
  } catch (err: unknown) {
    console.error("Error sending message/notify:", err);
    return {
      error: err instanceof Error ? err.message : "Nie udalo sie wyslac wiadomosci.",
    };
  }

  revalidatePath(`/app/chat/${conversationId}`);
  return { success: true };
}
