"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

async function notifyUser(
  supabase: any,
  userId: string,
  typ: string,
  payload: Record<string, any> = {}
) {
  try {
    await supabase.rpc("create_notification", {
      p_user_id: userId,
      p_typ: typ,
      p_payload: payload,
    });
  } catch (err) {
    console.error("notifyUser error:", err);
  }
}

function toNumber(v: FormDataEntryValue | null): number | null {
  if (typeof v !== "string") return null;
  const n = Number(v);
  if (!Number.isFinite(n)) return null;
  return n;
}

async function ensureConversationForApplication(supabase: any, args: {
  application_id: string;
  offer_id: string;
  company_id: string;
  student_id: string;
}) {
  const { data: existing } = await supabase
    .from("conversations")
    .select("id")
    .eq("application_id", args.application_id)
    .maybeSingle();

  if (existing?.id) return existing.id as string;

  const { data: created, error } = await supabase
    .from("conversations")
    .insert({
      application_id: args.application_id,
      company_id: args.company_id,
      student_id: args.student_id,
      offer_id: args.offer_id,
      type: 'application',
    })
    .select("id")
    .single();

  if (error || !created?.id) throw new Error(error?.message ?? "Nie udało się utworzyć rozmowy");
  return created.id as string;
}

async function insertChatMessage(
  supabase: any,
  conversationId: string,
  senderId: string,
  content: string,
  event: string | null = null,
  payload: Record<string, any> | null = null
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

  if (error) throw new Error(error.message);
}

export async function acceptCounterAsStudent(applicationId: string) {
  const supabase = await createClient();

  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) redirect("/auth");

  const { data: appRow, error } = await supabase
    .from("applications")
    .select(
      "id, status, student_id, offer_id, counter_stawka, offers!inner(id, tytul, company_id, stawka, is_platform_service, typ)"
    )
    .eq("id", applicationId)
    .single();

  if (error || !appRow) return;
  if (appRow.student_id !== user.id) redirect("/app");

  if (appRow.status !== "countered" || (appRow as any).counter_stawka == null) {
    revalidatePath("/app/applications");
    return;
  }

  const offer: any = Array.isArray((appRow as any).offers)
    ? (appRow as any).offers[0]
    : (appRow as any).offers;

  const agreed = (appRow as any).counter_stawka as number;

  const { error: updErr } = await supabase
    .from("applications")
    .update({
      status: "accepted",
      agreed_stawka: agreed,
      decided_at: new Date().toISOString(),
    })
    .eq("id", applicationId);

  if (updErr) throw new Error(updErr.message);

  // ✅ Utwórz kontrakt
  await supabase.rpc("ensure_contract_for_application", {
    p_application_id: applicationId,
  });

  // ✅ Odrzuć inne aplikacje + zmień status oferty
  const isMultiInstance = offer.is_platform_service === true ||
    (offer.typ && (offer.typ.toLowerCase().includes("micro") || offer.typ.toLowerCase().includes("mikro")));

  if (!isMultiInstance) {
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

  // ✅ wiadomość systemowa na czacie
  try {
    const conversationId = await ensureConversationForApplication(supabase as any, {
      application_id: applicationId,
      offer_id: appRow.offer_id,
      company_id: offer.company_id,
      student_id: appRow.student_id,
    });

    await insertChatMessage(
      supabase as any,
      conversationId,
      user.id,
      `Stawka ${agreed} zł zaakceptowana.`,
      "rate.accepted",
      { agreed_stawka: agreed, agreed_rate: agreed }
    );
  } catch {
    // nie blokujemy
  }

  // ✅ powiadom firmę
  await notifyUser(supabase as any, offer.company_id, "counter_accepted", {
    application_id: applicationId,
    offer_id: appRow.offer_id,
    offer_title: offer.tytul ?? null,
    agreed_stawka: agreed,
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

  const { data: appRow, error } = await supabase
    .from("applications")
    .select(
      "id, status, student_id, offer_id, proposed_stawka, offers!inner(id, tytul, company_id, stawka)"
    )
    .eq("id", applicationId)
    .single();

  if (error || !appRow) return;
  if (appRow.student_id !== user.id) redirect("/app");

  if (appRow.status !== "sent") {
    revalidatePath("/app/applications");
    return;
  }

  const offer: any = Array.isArray((appRow as any).offers)
    ? (appRow as any).offers[0]
    : (appRow as any).offers;

  const agreed = (appRow as any).proposed_stawka as number;

  const { error: updErr } = await supabase
    .from("applications")
    .update({
      status: "accepted",
      agreed_stawka: agreed,
      decided_at: new Date().toISOString(),
    })
    .eq("id", applicationId);

  if (updErr) throw new Error(updErr.message);

  // ✅ [Realization Guard]
  await supabase.rpc("ensure_contract_for_application", {
    p_application_id: applicationId,
  });

  // ✅ wiadomość systemowa na czacie
  try {
    const conversationId = await ensureConversationForApplication(supabase as any, {
      application_id: applicationId,
      offer_id: appRow.offer_id,
      company_id: offer.company_id,
      student_id: appRow.student_id,
    });

    await insertChatMessage(
      supabase as any,
      conversationId,
      user.id,
      `Stawka ${agreed} zł zaakceptowana.`,
      "application_accepted", // Reusing system event
      { agreed_stawka: agreed }
    );
  } catch { }

  // ✅ powiadom firmę
  await notifyUser(supabase as any, offer.company_id, "application_accepted", {
    application_id: applicationId,
    offer_id: appRow.offer_id,
    offer_title: offer.tytul ?? null,
    agreed_stawka: agreed,
  });

  revalidatePath("/app/applications");
  revalidatePath("/app/company/offers");
  revalidatePath("/app/company/applications");
  revalidatePath(`/app/deliverables/${applicationId}`);
  revalidatePath("/app/notifications");
}

export async function rejectProposalAsStudent(applicationId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth");

  const { data: appRow, error } = await supabase.from("applications").select("id, status, student_id, offer_id, offers!inner(id, tytul, company_id)").eq("id", applicationId).single();
  if (error || !appRow || appRow.student_id !== user.id) redirect("/app");

  if (appRow.status !== "sent") {
    revalidatePath("/app/applications");
    return;
  }

  const offer: any = Array.isArray((appRow as any).offers) ? (appRow as any).offers[0] : (appRow as any).offers;

  const { error: updErr } = await supabase.from("applications").update({ status: "rejected", decided_at: new Date().toISOString() }).eq("id", applicationId);
  if (updErr) throw new Error(updErr.message);

  try {
    const conversationId = await ensureConversationForApplication(supabase, { application_id: applicationId, offer_id: appRow.offer_id, company_id: offer.company_id, student_id: appRow.student_id });
    await insertChatMessage(supabase, conversationId, user.id, "Propozycja odrzucona.", "application_rejected", {});
  } catch { }

  await notifyUser(supabase, offer.company_id, "application_rejected", { application_id: applicationId, offer_id: appRow.offer_id, offer_title: offer.tytul ?? null });

  revalidatePath("/app/applications");
  revalidatePath("/app/company/applications");
  revalidatePath("/app/notifications");
}

export async function rejectCounterAsStudent(applicationId: string) {
  const supabase = await createClient();

  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) redirect("/auth");

  const { data: appRow, error: appErr } = await supabase
    .from("applications")
    .select("id, status, student_id, offer_id, offers!inner(id, tytul, company_id)")
    .eq("id", applicationId)
    .single();

  if (appErr || !appRow) redirect("/app");
  if (appRow.student_id !== user.id) redirect("/app");

  if (appRow.status !== "countered") {
    revalidatePath("/app/applications");
    return;
  }

  const offer: any = Array.isArray((appRow as any).offers)
    ? (appRow as any).offers[0]
    : (appRow as any).offers;

  const { error: updErr } = await supabase
    .from("applications")
    .update({ status: "rejected", decided_at: new Date().toISOString() })
    .eq("id", applicationId);

  if (updErr) throw new Error(updErr.message);

  await notifyUser(supabase as any, offer.company_id, "counter_rejected", {
    application_id: applicationId,
    offer_id: appRow.offer_id,
    offer_title: offer.tytul ?? null,
  });

  // ✅ wiadomość systemowa
  try {
    const conversationId = await ensureConversationForApplication(supabase as any, {
      application_id: applicationId,
      offer_id: appRow.offer_id,
      company_id: offer.company_id,
      student_id: appRow.student_id,
    });
    await insertChatMessage(
      supabase as any,
      conversationId,
      user.id,
      "Kontra odrzucona.",
      "rate.rejected",
      {}
    );
  } catch { }

  revalidatePath("/app/applications");
  revalidatePath("/app/company/applications");
  revalidatePath("/app/notifications");
}

export async function proposeNewPriceAsStudent(applicationId: string, formData: FormData) {
  const supabase = await createClient();

  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) redirect("/auth");

  const proposed = toNumber(formData.get("proposed_stawka"));
  if (proposed == null || proposed <= 0) {
    revalidatePath("/app/applications");
    return;
  }

  const { data: appRow, error: appErr } = await supabase
    .from("applications")
    .select(
      "id, status, student_id, offer_id, offers!inner(id, tytul, company_id, stawka)"
    )
    .eq("id", applicationId)
    .single();

  if (appErr || !appRow) redirect("/app");
  if (appRow.student_id !== user.id) redirect("/app");

  // ✅ student może proponować nową stawkę dopiero po kontrze firmy
  if (appRow.status !== "countered") {
    revalidatePath("/app/applications");
    return;
  }

  const offer: any = Array.isArray((appRow as any).offers)
    ? (appRow as any).offers[0]
    : (appRow as any).offers;

  const { error: updErr } = await supabase
    .from("applications")
    .update({
      status: "sent",
      proposed_stawka: proposed,
      counter_stawka: null,
      decided_at: null,
      agreed_stawka: null,
    })
    .eq("id", applicationId);

  if (updErr) throw new Error(updErr.message);

  // ✅ dopisz do czatu
  try {
    const conversationId = await ensureConversationForApplication(supabase as any, {
      application_id: applicationId,
      offer_id: appRow.offer_id,
      company_id: offer.company_id,
      student_id: appRow.student_id,
    });

    await insertChatMessage(
      supabase as any,
      conversationId,
      user.id,
      `Proponuję stawkę ${proposed} zł.`,
      "rate.proposed",
      { proposed_stawka: proposed }
    );

    // powiadom firmę o nowej wiadomości / propozycji
    await notifyUser(supabase as any, offer.company_id, "negotiation_proposed", {
      application_id: applicationId,
      offer_id: appRow.offer_id,
      offer_title: offer.tytul ?? null,
      proposed_stawka: proposed,
      conversation_id: conversationId,
    });
  } catch {
    // nie blokujemy
  }

  revalidatePath("/app/applications");
  revalidatePath("/app/company/applications");
  revalidatePath("/app/notifications");
}

export async function withdrawApplication(applicationId: string, _formData?: FormData) {
  const supabase = await createClient();

  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) redirect("/auth");

  const { data: appRow, error: appErr } = await supabase
    .from("applications")
    .select("id, student_id, status, offer_id")
    .eq("id", applicationId)
    .single();

  if (appErr || !appRow) {
    revalidatePath("/app/applications");
    return { error: "Nie znaleziono zgłoszenia." };
  }

  if (appRow.student_id !== user.id) return { error: "Brak dostępu do zgłoszenia." };

  // wycofanie tylko przed accepted (czyli sent/countered)
  if (appRow.status !== "sent" && appRow.status !== "countered") {
    revalidatePath("/app/applications");
    return { error: `Nie można usunąć zgłoszenia o statusie: ${appRow.status}` };
  }

  // Soft delete (Archive) instead of hard delete
  const { error: updateError } = await supabase
    .from("applications")
    .update({
      status: "cancelled",
      cancelled_at: new Date().toISOString()
    })
    .eq("id", applicationId);

  if (updateError) {
    console.error("Error cancelling application:", updateError);
    return { error: updateError.message };
  }

  // Notify company? Optional.
  // await notifyUser...

  revalidatePath("/app");
  revalidatePath("/app/applications");
  if (appRow.offer_id) revalidatePath(`/app/offers/${appRow.offer_id}`);

  return { success: true };
}

export async function removeSavedOffer(offerId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from("saved_offers").delete().eq("offer_id", offerId).eq("student_id", user.id);
  revalidatePath("/app/applications");
}
export async function submitQuoteProposal(conversationId: string, offerId: string, price: number, message: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Musisz być zalogowany.");

  // 1. Check conversation and offer
  const { data: conv } = await supabase
    .from("conversations")
    .select("id, company_id, student_id, offer_id, offers(tytul, company_id)")
    .eq("id", conversationId)
    .single();

  if (!conv || conv.student_id !== user.id) throw new Error("Brak dostępu do rozmowy.");

  // 2. Create Application (Proposal)
  // Check if application already exists? Likely not if button is shown.
  // Or if exists, update it?
  const { data: existingApp } = await supabase.from("applications").select("id").eq("offer_id", offerId).eq("student_id", user.id).maybeSingle();

  let appId = existingApp?.id;

  if (existingApp) {
    // Update existing
    await supabase.from("applications").update({
      status: "sent",
      proposed_stawka: price,
      message_to_company: message,
    }).eq("id", existingApp.id);
  } else {
    // Create new
    const { data: newApp, error } = await supabase.from("applications").insert({
      offer_id: offerId,
      student_id: user.id,
      status: "sent", // Standard proposal status
      proposed_stawka: price,
      message_to_company: message,
    }).select("id").single();

    if (error) throw new Error(error.message);
    appId = newApp.id;
  }

  // 3. Link Application to Conversation
  await supabase.from("conversations").update({ application_id: appId }).eq("id", conversationId);

  // 4. Send Message & Notify
  const content = `Złożyłem ofertę realizacji: ${price} zł.\n${message}`;

  try {
    await insertChatMessage(supabase, conversationId, user.id, content, "negotiation_proposed", {
      proposed_stawka: price,
      initiator: "student"
    });

    const offerTitle = (conv as any).offers?.tytul || "Zapytanie";
    await notifyUser(supabase, conv.company_id, "negotiation_proposed", {
      conversation_id: conversationId,
      offer_id: offerId,
      offer_title: offerTitle,
      proposed_stawka: price,
      snippet: `Otrzymałeś ofertę od studenta: ${price} zł`
    });
  } catch (err: any) {
    console.error("Error sending message/notify:", err);
    // Return error but maybe success? No, if msg fails, it's bad.
    return { error: err.message };
  }

  revalidatePath(`/app/chat/${conversationId}`);
  return { success: true };
}
