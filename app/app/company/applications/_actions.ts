"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

interface OfferRow {
  id: string;
  company_id: string;
  stawka: number | null;
  tytul: string | null;
}

function toNumber(v: FormDataEntryValue | null): number | null {
  if (typeof v !== "string") return null;
  const n = Number(v);
  if (!Number.isFinite(n)) return null;
  return n;
}

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

async function ensureConversationForApplication(
  supabase: any,
  args: {
    application_id: string;
    offer_id: string;
    company_id: string;
    student_id: string;
  }
) {
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

export async function acceptApplication(applicationId: string) {
  const supabase = await createClient();

  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) redirect("/auth");

  const { data: appRow, error: appErr } = await supabase
    .from("applications")
    .select(
      "id, status, student_id, offer_id, proposed_stawka, agreed_stawka, offers!inner(id, tytul, stawka, company_id)"
    )
    .eq("id", applicationId)
    .single();

  if (appErr || !appRow) redirect("/app");

  const offer: OfferRow = Array.isArray((appRow as any).offers)
    ? (appRow as any).offers[0]
    : (appRow as any).offers;

  if (!offer || offer.company_id !== user.id) redirect("/app");

  if (appRow.status !== "sent") {
    revalidatePath("/app/company/applications");
    return;
  }

  const now = new Date().toISOString();
  // Safe Fallback: Prefer already agreed > proposed > offer default
  const agreed = (appRow as any).agreed_stawka ?? (appRow as any).proposed_stawka ?? offer.stawka ?? null;

  // ✅ zaakceptuj
  const { error: updErr } = await supabase
    .from("applications")
    .update({ status: "accepted", agreed_stawka: agreed, decided_at: now })
    .eq("id", applicationId);

  if (updErr) throw new Error(updErr.message);

  // ✅ [Realization Guard] Utwórz Kontrakt (Contract + Milestone)
  await supabase.rpc("ensure_contract_for_application", {
    p_application_id: applicationId,
  });

  // ✅ odrzuć inne aplikacje do tej samej oferty (sent/countered)
  const { data: others } = await supabase
    .from("applications")
    .select("id, student_id")
    .eq("offer_id", offer.id)
    .neq("id", applicationId)
    .in("status", ["sent", "countered"]);

  if ((others ?? []).length > 0) {
    await supabase
      .from("applications")
      .update({ status: "rejected", decided_at: now })
      .eq("offer_id", offer.id)
      .neq("id", applicationId)
      .in("status", ["sent", "countered"]);

    // powiadom pozostałych
    for (const o of others ?? []) {
      if (!o?.student_id) continue;
      await notifyUser(supabase as any, o.student_id, "offer_closed", {
        offer_id: offer.id,
        offer_title: offer.tytul ?? null,
        reason: "accepted_other",
      });
    }
  }

  // ✅ oferta znika z tablicy ofert (published -> in_progress)
  const { error: offerErr } = await supabase
    .from("offers")
    .update({ status: "in_progress" })
    .eq("id", offer.id);

  if (offerErr) throw new Error(offerErr.message);

  // ✅ wiadomość systemowa na czacie
  try {
    const conversationId = await ensureConversationForApplication(supabase as any, {
      application_id: applicationId,
      offer_id: offer.id,
      company_id: offer.company_id,
      student_id: appRow.student_id,
    });

    await insertChatMessage(
      supabase as any,
      conversationId,
      user.id,
      `Stawka ${agreed ?? offer.stawka ?? "-"} zł zaakceptowana.`,
      "application_accepted",
      { agreed_stawka: agreed }
    );
  } catch {
    // nie blokujemy flow
  }

  // ✅ powiadom zaakceptowanego studenta
  await notifyUser(supabase as any, appRow.student_id, "application_accepted", {
    application_id: applicationId,
    offer_id: offer.id,
    offer_title: offer.tytul ?? null,
    agreed_stawka: agreed,
  });

  // Revalidate chat page if conversation exists
  const { data: conv } = await supabase.from('conversations').select('id').eq('application_id', applicationId).single();
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

  const { data: appRow, error: appErr } = await supabase
    .from("applications")
    .select("id, status, student_id, offer_id, offers!inner(id, tytul, company_id)")
    .eq("id", applicationId)
    .single();

  if (appErr || !appRow) redirect("/app");

  const offer: any = Array.isArray((appRow as any).offers)
    ? (appRow as any).offers[0]
    : (appRow as any).offers;

  if (!offer || offer.company_id !== user.id) redirect("/app");

  if (appRow.status !== "sent" && appRow.status !== "countered") {
    revalidatePath("/app/company/applications");
    return;
  }

  const { error: updErr } = await supabase
    .from("applications")
    .update({ status: "rejected", decided_at: new Date().toISOString() })
    .eq("id", applicationId);

  if (updErr) throw new Error(updErr.message);

  await notifyUser(supabase as any, appRow.student_id, "application_rejected", {
    application_id: applicationId,
    offer_id: offer.id,
    offer_title: offer.tytul ?? null,
  });

  // ✅ message systemowy "Odrzucono" (opcjonalnie, ale w Vinted stylu warto)
  try {
    const conversationId = await ensureConversationForApplication(supabase as any, {
      application_id: applicationId,
      offer_id: offer.id,
      company_id: offer.company_id,
      student_id: appRow.student_id,
    });
    await insertChatMessage(
      supabase as any,
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

  const counter = toNumber(formData.get("counter_stawka"));
  if (counter == null || counter <= 0) {
    revalidatePath("/app/company/applications");
    return;
  }

  const { data: appRow, error: appErr } = await supabase
    .from("applications")
    .select("id, status, student_id, offer_id, offers!inner(id, tytul, company_id)")
    .eq("id", applicationId)
    .single();

  if (appErr || !appRow) redirect("/app");

  const offer: any = Array.isArray((appRow as any).offers)
    ? (appRow as any).offers[0]
    : (appRow as any).offers;

  if (!offer || offer.company_id !== user.id) redirect("/app");

  if (appRow.status !== "sent") {
    revalidatePath("/app/company/applications");
    return;
  }

  const { error: updErr } = await supabase
    .from("applications")
    .update({ status: "countered", counter_stawka: counter, decided_at: null, agreed_stawka: null })
    .eq("id", applicationId);

  if (updErr) throw new Error(updErr.message);

  // ✅ dopisz do czatu
  try {
    const conversationId = await ensureConversationForApplication(supabase as any, {
      application_id: applicationId,
      offer_id: offer.id,
      company_id: offer.company_id,
      student_id: appRow.student_id,
    });

    await insertChatMessage(
      supabase as any,
      conversationId,
      user.id,
      `Kontrpropozycja firmy: ${counter} zł.`,
      "counter_offer",
      { amount: counter, currency: "PLN" }
    );
  } catch {
    // nie blokujemy
  }

  await notifyUser(supabase as any, appRow.student_id, "application_countered", {
    application_id: applicationId,
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
