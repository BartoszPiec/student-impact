"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

// --- EXISTING FUNCTIONS (KEPT FOR ROUTING/INIT) ---

export async function openChatForApplication(applicationId: string) {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) redirect("/auth");

  const { data: appRow, error: appErr } = await supabase
    .from("applications")
    .select("id, student_id, offer_id, message_to_company, offers(company_id)")
    .eq("id", applicationId)
    .single();

  if (appErr || !appRow) throw new Error(appErr?.message ?? "Brak aplikacji");

  const offer = Array.isArray((appRow as any).offers) ? (appRow as any).offers[0] : (appRow as any).offers;
  const companyId = offer?.company_id as string | undefined;
  const studentId = appRow.student_id as string;
  const offerId = appRow.offer_id as string;

  if (!companyId) throw new Error("Brak company_id w ofercie");

  const isParticipant = user.id === companyId || user.id === studentId;
  if (!isParticipant) redirect("/app");

  const { data: existing } = await supabase
    .from("conversations")
    .select("id")
    .eq("application_id", applicationId)
    .maybeSingle();

  if (existing?.id) redirect(`/app/chat/${existing.id}`);

  const { data: created, error: createErr } = await supabase
    .from("conversations")
    .insert({
      application_id: applicationId,
      company_id: companyId,
      student_id: studentId,
      offer_id: offerId,
    })
    .select("id")
    .single();

  if (createErr || !created) throw new Error(createErr?.message ?? "Nie udało się utworzyć rozmowy");

  // Initial message from app
  let first = String((appRow as any).message_to_company ?? "").trim();
  if (!first) {
    first = "Zainteresowała mnie ta oferta, chciałbym zgłosić swoją kandydaturę.";
  }

  if (first) {
    await sendTextMessage(created.id, first);
    // await supabase.from("messages").insert({
    //   conversation_id: created.id,
    //   sender_id: studentId,
    //   content: first,
    // });
  }

  redirect(`/app/chat/${created.id}`);
}

export async function openChatForOfferInquiry(offerId: string) {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) redirect("/auth");

  const { data: offer } = await supabase
    .from("offers")
    .select("company_id")
    .eq("id", offerId)
    .single();

  if (!offer) throw new Error("Oferta nie istnieje");
  if (offer.company_id === user.id) {
    redirect(`/app/offers/${offerId}`);
  }

  const { data: existing } = await supabase
    .from("conversations")
    .select("id")
    .eq("offer_id", offerId)
    .eq("student_id", user.id)
    .eq("company_id", offer.company_id)
    .maybeSingle();

  if (existing?.id) {
    redirect(`/app/chat/${existing.id}`);
  }

  const { data: created, error } = await supabase
    .from("conversations")
    .insert({
      offer_id: offerId,
      student_id: user.id,
      company_id: offer.company_id,
    })
    .select("id")
    .single();

  if (error || !created) throw new Error("Nie udało się utworzyć rozmowy.");

  await sendTextMessage(created.id, "Dzień dobry, chciałbym dopytać o szczegóły tej oferty.");

  redirect(`/app/chat/${created.id}`);
}

export async function markMessagesAsRead(conversationId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from("messages")
    .update({ read_at: new Date().toISOString() })
    .eq("conversation_id", conversationId)
    .neq("sender_id", user.id)
    .is("read_at", null);

  revalidatePath("/app/chat", "layout");
}

// --- NEW TRANSACTIONAL ACTIONS ---

async function validateParticipant(conversationId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data: conv } = await supabase
    .from("conversations")
    .select("id, company_id, student_id, application_id, package_id")
    .eq("id", conversationId)
    .single();

  if (!conv) throw new Error("Rozmowa nie istnieje");

  const isParticipant = user.id === conv.company_id || user.id === conv.student_id;
  if (!isParticipant) throw new Error("Brak dostępu");

  return { supabase, user, conv };
}

export async function sendTextMessage(conversationId: string, content: string) {
  const { supabase, user, conv } = await validateParticipant(conversationId);
  if (!content.trim()) return;

  await supabase.from("messages").insert({
    conversation_id: conversationId,
    sender_id: user.id,
    content: content,
    event: "text.sent",
    payload: {}
  });

  // Notify
  const targetUserId = user.id === conv.company_id ? conv.student_id : conv.company_id;
  await supabase.rpc("create_notification", {
    p_user_id: targetUserId,
    p_typ: "message_new",
    p_payload: {
      conversation_id: conversationId,
      snippet: content.slice(0, 80)
    }
  });

  revalidatePath(`/app/chat/${conversationId}`);
}

export async function sendFileMessage(conversationId: string, fileName: string, fileUrl: string, fileType: string) {
  const { supabase, user, conv } = await validateParticipant(conversationId);

  // Backward compatibility: fill attachment_url/type cols, but also set event
  await supabase.from("messages").insert({
    conversation_id: conversationId,
    sender_id: user.id,
    content: fileName,
    attachment_url: fileUrl,
    attachment_type: fileType,
    event: "file.sent",
    payload: { name: fileName, url: fileUrl, type: fileType }
  });

  const targetUserId = user.id === conv.company_id ? conv.student_id : conv.company_id;
  await supabase.rpc("create_notification", {
    p_user_id: targetUserId,
    p_typ: "message_new",
    p_payload: {
      conversation_id: conversationId,
      snippet: "[Plik] " + fileName
    }
  });

  revalidatePath(`/app/chat/${conversationId}`);
}

export async function sendEventMessage(conversationId: string, event: string, payload: any, content: string = "") {
  const { supabase, user, conv } = await validateParticipant(conversationId);

  await supabase.from("messages").insert({
    conversation_id: conversationId,
    sender_id: user.id,
    content: content,
    event: event,
    payload: payload
  });

  const targetUserId = user.id === conv.company_id ? conv.student_id : conv.company_id;
  await supabase.rpc("create_notification", {
    p_user_id: targetUserId,
    p_typ: "message_new",
    p_payload: {
      conversation_id: conversationId,
      snippet: content || "[Wydarzenie]"
    }
  });

  revalidatePath(`/app/chat/${conversationId}`);
}


export async function acceptRate(conversationId: string, refMessageId: string, rate: number) {
  const { supabase, user, conv } = await validateParticipant(conversationId);

  // 1. Update Application OR Service Order
  if (conv.application_id) {
    const { error } = await supabase
      .from("applications")
      .update({
        agreed_stawka: rate,
        proposed_stawka: null,
        status: 'accepted',        // ✅ Fix: Sync status
        decided_at: new Date().toISOString()
      })
      .eq("id", conv.application_id);
    if (error) throw new Error("Błąd aktualizacji stawki aplikacji");

    // ✅ Create Contract (Mirror dashboard logic)
    await supabase.rpc("ensure_contract_for_application", {
      p_application_id: conv.application_id,
    });
  } else {
    // Try finding related service order
    const effectivePackageId = conv.package_id;

    if (effectivePackageId) {
      // FIX: Find the SPECIFIC latest active order to avoid updating old ones or crashing on duplicates
      const { data: targetOrder } = await supabase
        .from("service_orders")
        .select("id")
        .eq("package_id", effectivePackageId)
        .eq("student_id", conv.student_id)
        .eq("company_id", conv.company_id)
        .neq("status", "completed")
        .neq("status", "cancelled")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!targetOrder) {
        console.warn("Nie znaleziono aktywnego zlecenia dla tej oferty/pakietu chat.");
        // Fallback or throw? For now just throw to match user expectations of "Action Failed" if no context
        throw new Error("Nie znaleziono aktywnego zlecenia do aktualizacji.");
      }

      const { data: updatedOrder, error } = await supabase
        .from("service_orders")
        .update({ amount: rate, status: 'accepted' })
        .eq("id", targetOrder.id)
        .select("id")
        .single();

      if (error) throw new Error("Błąd aktualizacji stawki zlecenia");

      if (updatedOrder) {
        // Initialize Realization (Contract)
        await supabase.rpc("ensure_contract_for_service_order", {
          p_service_order_id: updatedOrder.id
        });
      }
    } else {
      console.warn("No application or package linked to negotiation.");
    }
  }


  // 2. Send Acceptance Message
  await supabase.from("messages").insert({
    conversation_id: conversationId,
    sender_id: user.id,
    content: `Zaakceptowano stawkę: ${rate} zł`,
    event: "rate.accepted",
    payload: {
      ref_message_id: refMessageId,
      agreed_rate: rate
    }
  });

  revalidatePath(`/app/chat/${conversationId}`);
}

export async function rejectRate(conversationId: string, refMessageId: string, rate: number) {
  const { supabase, user } = await validateParticipant(conversationId);

  await supabase.from("messages").insert({
    conversation_id: conversationId,
    sender_id: user.id,
    content: `Odrzucono propozycję stawki: ${rate} zł`,
    event: "rate.rejected",
    payload: {
      ref_message_id: refMessageId,
      rejected_rate: rate
    }
  });
  revalidatePath(`/app/chat/${conversationId}`);
}

export async function acceptDeadline(conversationId: string, refMessageId: string, deadline: string) {
  const { supabase, user, conv } = await validateParticipant(conversationId);

  if (conv.application_id) {
    // 1. Update Application
    const { error } = await supabase
      .from("applications")
      .update({ deadline: deadline })
      .eq("id", conv.application_id);

    if (error) throw new Error("Błąd aktualizacji terminu");
  } else {
    // System Order Context - Service orders might not have a deadline column yet,
    // or it might be stored only in messages. 
    // For now, allow the action to proceed (sending the message) so the UI updates,
    // without failing on missing application_id.
  }

  // 2. Send Acceptance Message
  await supabase.from("messages").insert({
    conversation_id: conversationId,
    sender_id: user.id,
    content: `Zaakceptowano termin: ${deadline}`,
    event: "deadline.accepted",
    payload: {
      ref_message_id: refMessageId,
      agreed_deadline: deadline
    }
  });
  revalidatePath(`/app/chat/${conversationId}`);
}

export async function rejectDeadline(conversationId: string, refMessageId: string, deadline: string) {
  const { supabase, user } = await validateParticipant(conversationId);

  await supabase.from("messages").insert({
    conversation_id: conversationId,
    sender_id: user.id,
    content: `Odrzucono propozycję terminu: ${deadline}`,
    event: "deadline.rejected",
    payload: {
      ref_message_id: refMessageId,
      rejected_deadline: deadline
    }
  });
  revalidatePath(`/app/chat/${conversationId}`);
}

// Keep legacy-compat wrapper if needed, but UI calls should use new specific functions
export async function sendMessage(conversationId: string, formData: FormData) {
  const body = String(formData.get("body") ?? "").trim();
  const attachmentUrl = String(formData.get("attachmentUrl") ?? "").trim() || null;
  const attachmentType = String(formData.get("attachmentType") ?? "").trim() || null;

  if (attachmentUrl && attachmentType) {
    // Filename hack: extract from FormData or fallback
    const name = "Plik"; // Simplified for this wrapper
    await sendFileMessage(conversationId, name, attachmentUrl, attachmentType);
  } else if (body) {
    await sendTextMessage(conversationId, body);
  }
}
