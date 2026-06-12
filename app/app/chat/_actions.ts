"use server";

import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { sendNotification, trySendNotification } from "@/lib/notifications/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { buildRateLimitKey, enforceRateLimit } from "@/lib/rate-limit";
import { ensureConversationForApplication } from "@/lib/services/service-order-conversations";
import { rejectCompetingApplicationsForOffer } from "@/lib/services/application-chat-closure";

// --- EXISTING FUNCTIONS (KEPT FOR ROUTING/INIT) ---

type OfferRelation = { company_id: string } | null;

type ApplicationForChat = {
  id: string;
  student_id: string;
  offer_id: string;
  status?: string | null;
  message_to_company: string | null;
  offers: OfferRelation | OfferRelation[];
};

async function ensureApplicationInitialMessage(
  supabase: Awaited<ReturnType<typeof createClient>>,
  params: {
    conversationId: string;
    studentId: string;
    companyId: string;
    applicationId: string;
    content: string;
  },
) {
  const content = params.content.trim();
  if (!content) return;

  const { count } = await supabase
    .from("messages")
    .select("id", { count: "exact", head: true })
    .eq("conversation_id", params.conversationId)
    .eq("sender_id", params.studentId)
    .eq("content", content);

  if ((count ?? 0) > 0) return;

  await supabase.from("messages").insert({
    conversation_id: params.conversationId,
    sender_id: params.studentId,
    content,
    event: "text.sent",
    payload: { source: "application" },
  });

  await sendNotification(params.companyId, "message_new", {
    conversation_id: params.conversationId,
    application_id: params.applicationId,
    snippet: content.slice(0, 80),
  });
}

export async function openChatForApplication(applicationId: string) {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) redirect("/auth");

  const { data: appRow, error: appErr } = await supabase
    .from("applications")
    .select("id, student_id, offer_id, status, message_to_company, offers(company_id)")
    .eq("id", applicationId)
    .single();

  if (appErr || !appRow) throw new Error(appErr?.message ?? "Brak aplikacji");

  const typedRow = appRow as ApplicationForChat;
  const offer = Array.isArray(typedRow.offers) ? typedRow.offers[0] : typedRow.offers;
  const companyId = offer?.company_id as string | undefined;
  const studentId = typedRow.student_id;
  const offerId = typedRow.offer_id;

  if (!companyId) throw new Error("Brak company_id w ofercie");

  const isParticipant = user.id === companyId || user.id === studentId;
  if (!isParticipant) redirect("/app");

  let firstMessage = String(typedRow.message_to_company ?? "").trim();
  if (!firstMessage) {
    firstMessage = "Zainteresowała mnie ta oferta, chciałbym zgłosić swoją kandydaturę.";
  }

  const { data: existing } = await supabase
    .from("conversations")
    .select("id")
    .eq("application_id", applicationId)
    .maybeSingle();

  if (existing?.id) {
    await ensureApplicationInitialMessage(supabase, {
      conversationId: existing.id,
      studentId,
      companyId,
      applicationId,
      content: firstMessage,
    });
    redirect(`/app/chat/${existing.id}`);
  }

  const created = await ensureConversationForApplication(supabase, {
    applicationId,
    companyId,
    studentId,
    offerId,
  });

  if (!created.created) {
    await ensureApplicationInitialMessage(supabase, {
      conversationId: created.id,
      studentId,
      companyId,
      applicationId,
      content: firstMessage,
    });
    redirect(`/app/chat/${created.id}`);
  }

  // Initial message from app
  let first = String(typedRow.message_to_company ?? "").trim();
  if (!first) {
    first = "Zainteresowała mnie ta oferta, chciałbym zgłosić swoją kandydaturę.";
  }

  if (first) {
    await supabase.from("messages").insert({
      conversation_id: created.id,
      sender_id: studentId,
      content: first,
      event: "text.sent",
      payload: { source: "application" },
    });

    await sendNotification(companyId, "message_new", {
      conversation_id: created.id,
      application_id: applicationId,
      snippet: first.slice(0, 80),
    });
  }

  redirect(`/app/chat/${created.id}`);
}

export async function openChatForOfferInquiry(offerId: string) {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) redirect("/auth");

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("user_id", user.id)
    .maybeSingle();

  if (profileError || profile?.role !== "student") {
    throw new Error("Tylko konto studenta moze rozpoczac rozmowe o ofercie.");
  }

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
  const { supabase, user } = await validateParticipant(conversationId);

  const { error } = await supabase.from("messages")
    .update({ read_at: new Date().toISOString() })
    .eq("conversation_id", conversationId)
    .neq("sender_id", user.id)
    .is("read_at", null);

  if (error) {
    throw new Error("Nie udalo sie oznaczyc wiadomosci jako przeczytanych.");
  }

  revalidatePath("/app/chat");
  revalidatePath(`/app/chat/${conversationId}`);
  revalidatePath("/app/chat", "layout");
}

export async function markConversationAsUnread(conversationId: string) {
  const { supabase, user } = await validateParticipant(conversationId);

  const { data: lastIncoming } = await supabase
    .from("messages")
    .select("id")
    .eq("conversation_id", conversationId)
    .neq("sender_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!lastIncoming?.id) return;

  const { error } = await supabase
    .from("messages")
    .update({ read_at: null })
    .eq("id", lastIncoming.id);

  if (error) {
    throw new Error("Nie udalo sie oznaczyc rozmowy jako nieprzeczytanej.");
  }

  revalidatePath("/app/chat");
  revalidatePath(`/app/chat/${conversationId}`);
  revalidatePath("/app/chat", "layout");
}

export async function toggleMessageFlag(conversationId: string, messageId: string) {
  const { supabase, user } = await validateParticipant(conversationId);

  const { data: message } = await supabase
    .from("messages")
    .select("id, flagged_by")
    .eq("id", messageId)
    .eq("conversation_id", conversationId)
    .maybeSingle();

  if (!message?.id) {
    throw new Error("Wiadomosc nie istnieje.");
  }

  const flaggedBy = Array.isArray(message.flagged_by)
    ? message.flagged_by.filter((id): id is string => typeof id === "string")
    : [];
  const nextFlaggedBy = flaggedBy.includes(user.id)
    ? flaggedBy.filter((id) => id !== user.id)
    : [...flaggedBy, user.id];

  const { error } = await supabase
    .from("messages")
    .update({ flagged_by: nextFlaggedBy })
    .eq("id", messageId)
    .eq("conversation_id", conversationId);

  if (error) {
    throw new Error("Nie udalo sie zaktualizowac flagi wiadomosci.");
  }

  revalidatePath(`/app/chat/${conversationId}`);
}

// --- NEW TRANSACTIONAL ACTIONS ---

async function validateParticipant(conversationId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data: conv } = await supabase
    .from("conversations")
    .select("id, company_id, student_id, application_id, service_order_id, package_id, status")
    .eq("id", conversationId)
    .single();

  if (!conv) throw new Error("Rozmowa nie istnieje");

  const isParticipant = user.id === conv.company_id || user.id === conv.student_id;
  if (!isParticipant) throw new Error("Brak dostępu");

  return { supabase, user, conv };
}

async function assertConversationIsOpen(
  supabase: Awaited<ReturnType<typeof createClient>>,
  conv: {
    id: string;
    status?: string | null;
    application_id?: string | null;
  },
) {
  if (conv.status === "inactive") {
    throw new Error("Niestety tym razem firma wybrała kogoś innego.");
  }

  if (!conv.application_id) return;

  const { data } = await supabase
    .from("applications")
    .select("status")
    .eq("id", conv.application_id)
    .maybeSingle();

  if (data?.status === "rejected" || data?.status === "cancelled") {
    throw new Error("Niestety tym razem firma wybrała kogoś innego.");
  }
}

async function assertCanSendMessage(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  conv: {
    id: string;
    company_id: string;
    student_id: string;
    application_id?: string | null;
    service_order_id?: string | null;
    status?: string | null;
  },
) {
  await assertConversationIsOpen(supabase, conv);

  if (userId !== conv.student_id) return;

  let businessStatus: string | null = null;
  let applicationInitialMessage: string | null = null;
  if (conv.application_id) {
    const { data } = await supabase
      .from("applications")
      .select("status, message_to_company")
      .eq("id", conv.application_id)
      .maybeSingle();
    businessStatus = data?.status ?? null;
    applicationInitialMessage = String(data?.message_to_company ?? "").trim() || null;
  } else if (conv.service_order_id) {
    const { data } = await supabase
      .from("service_orders")
      .select("status")
      .eq("id", conv.service_order_id)
      .maybeSingle();
    businessStatus = data?.status ?? null;
  }

  const allowedStatuses = new Set([
    "countered",
    "accepted",
    "active",
    "in_progress",
    "revision",
    "delivered",
    "completed",
    "disputed",
  ]);

  if (businessStatus && allowedStatuses.has(businessStatus)) return;

  const { count: companyMessagesCount } = await supabase
    .from("messages")
    .select("id", { count: "exact", head: true })
    .eq("conversation_id", conv.id)
    .eq("sender_id", conv.company_id);

  if ((companyMessagesCount ?? 0) > 0) return;

  const { data: studentMessages } = await supabase
    .from("messages")
    .select("id, content, payload")
    .eq("conversation_id", conv.id)
    .eq("sender_id", conv.student_id);

  const blockingStudentMessagesCount = (studentMessages ?? []).filter((message) => {
    const payload = message.payload && typeof message.payload === "object" && !Array.isArray(message.payload)
      ? message.payload as Record<string, unknown>
      : {};
    const content = String(message.content ?? "").trim();
    const normalizedContent = content.toLowerCase();

    if (payload.source === "application") return false;
    if (applicationInitialMessage && content === applicationInitialMessage) return false;
    if (
      normalizedContent.includes("zainteresowa") &&
      normalizedContent.includes("kandydatur")
    ) return false;
    if (
      normalizedContent.includes("przes") &&
      normalizedContent.includes("zg") &&
      normalizedContent.includes("aplikacyj")
    ) return false;
    return true;
  }).length;

  if (blockingStudentMessagesCount > 0) {
    throw new Error("Poczekaj na odpowiedz firmy, zanim wyslesz kolejna wiadomosc.");
  }
}

async function enforceMessageRateLimit(userId: string, action: string, conversationId: string) {
  const headerStore = await headers();
  const forwarded = headerStore.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() || headerStore.get("x-real-ip") || "unknown";

  const rateKey = buildRateLimitKey(["chat", action, userId, ip, conversationId]);
  const rateLimitResult = await enforceRateLimit("message", rateKey);
  if (!rateLimitResult.success) {
    throw new Error("Zbyt wiele wiadomosci. Sprobuj ponownie za chwile.");
  }
}

export async function sendTextMessage(conversationId: string, content: string) {
  const { supabase, user, conv } = await validateParticipant(conversationId);
  await enforceMessageRateLimit(user.id, "text", conversationId);
  if (!content.trim()) return;
  if (content.length > 10000) throw new Error("Wiadomość jest za długa (max 10 000 znaków)");
  await assertCanSendMessage(supabase, user.id, conv);

  await supabase.from("messages").insert({
    conversation_id: conversationId,
    sender_id: user.id,
    content: content,
    event: "text.sent",
    payload: {}
  });

  // Notify
  const targetUserId = user.id === conv.company_id ? conv.student_id : conv.company_id;
  await sendNotification(targetUserId, "message_new", {
    conversation_id: conversationId,
    snippet: content.slice(0, 80)
  });

  revalidatePath(`/app/chat/${conversationId}`);
}

export async function sendFileMessage(conversationId: string, fileName: string, fileUrl: string, fileType: string) {
  const { supabase, user, conv } = await validateParticipant(conversationId);
  await enforceMessageRateLimit(user.id, "file", conversationId);
  await assertCanSendMessage(supabase, user.id, conv);

  // Walidacja URL pliku — musi być ścieżką Supabase Storage (relatywna) lub https://
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const isValidFileUrl = fileUrl.startsWith(SUPABASE_URL) || fileUrl.startsWith("/") || (!fileUrl.startsWith("javascript:") && !fileUrl.startsWith("data:") && fileUrl.startsWith("https://"));
  if (!isValidFileUrl) throw new Error("Nieprawidłowy URL pliku");

  // Walidacja nazwy pliku
  if (!fileName || fileName.length > 255) throw new Error("Nieprawidłowa nazwa pliku");
  if (fileType && fileType.length > 100) throw new Error("Nieprawidłowy typ pliku");

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
  await sendNotification(targetUserId, "message_new", {
    conversation_id: conversationId,
    snippet: "[Plik] " + fileName
  });

  revalidatePath(`/app/chat/${conversationId}`);
}

export async function sendEventMessage(
  conversationId: string,
  event: string,
  payload: Record<string, unknown>,
  content: string = "",
) {
  const { supabase, user, conv } = await validateParticipant(conversationId);
  await enforceMessageRateLimit(user.id, "event", conversationId);
  await assertCanSendMessage(supabase, user.id, conv);

  await supabase.from("messages").insert({
    conversation_id: conversationId,
    sender_id: user.id,
    content: content,
    event: event,
    payload: payload
  });

  const targetUserId = user.id === conv.company_id ? conv.student_id : conv.company_id;
  await sendNotification(targetUserId, "message_new", {
    conversation_id: conversationId,
    snippet: content || "[Wydarzenie]"
  });

  revalidatePath(`/app/chat/${conversationId}`);
}

function toMinorUnits(value: number | null | undefined): number | null {
  if (value == null || !Number.isFinite(value)) return null;
  return Math.round(value * 100);
}


export async function acceptRate(conversationId: string, refMessageId: string, rate: number) {
  const { supabase, user, conv } = await validateParticipant(conversationId);
  await assertConversationIsOpen(supabase, conv);

  // Nie można akceptować własnej propozycji (Self-Acceptance Bypass fix)
  const { data: refMsg } = await supabase.from("messages").select("sender_id").eq("id", refMessageId).maybeSingle();
  if (refMsg && refMsg.sender_id === user.id) throw new Error("Nie możesz zaakceptować własnej propozycji stawki");

  // 1. Update Application OR Service Order
  if (conv.application_id) {
    const { error } = await supabase
      .from("applications")
      .update({
        agreed_stawka: rate,
        agreed_stawka_minor: toMinorUnits(rate),
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

    // ✅ Reject competing applications + update offer status (mirror acceptApplication logic)
    const { data: appData } = await supabase
      .from("applications")
      .select("offer_id, offers!inner(id, tytul, company_id, is_platform_service, typ)")
      .eq("id", conv.application_id)
      .single();

    if (appData) {
      const offerRow = (Array.isArray(appData.offers) ? appData.offers[0] : appData.offers) as {
        is_platform_service?: boolean;
        typ?: string | null;
      };
      const isMultiInstance = offerRow.is_platform_service === true;

      if (!isMultiInstance) {
        const offerDetails = Array.isArray(appData.offers) ? appData.offers[0] : appData.offers;
        const rejectedApplications = await rejectCompetingApplicationsForOffer(supabase, {
          offerId: appData.offer_id,
          acceptedApplicationId: conv.application_id,
          companyId: conv.company_id,
          senderId: user.id,
          content: "Niestety tym razem firma wybrała kogoś innego.",
        });

        for (const rejectedApplication of rejectedApplications) {
          await sendNotification(rejectedApplication.studentId, "offer_closed", {
            offer_id: appData.offer_id,
            offer_title: offerDetails?.tytul ?? "Oferta",
            reason: "accepted_other",
            conversation_id: rejectedApplication.conversationId,
          });
          revalidatePath(`/app/chat/${rejectedApplication.conversationId}`);
        }

        // Update offer status to in_progress
        await supabase
          .from("offers")
          .update({ status: "in_progress" })
          .eq("id", appData.offer_id);
      }
    }
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
      agreed_rate: rate,
      agreed_rate_minor: toMinorUnits(rate)
    }
  });

  revalidatePath(`/app/chat/${conversationId}`);
}

export async function rejectRate(conversationId: string, refMessageId: string, rate: number) {
  const { supabase, user, conv } = await validateParticipant(conversationId);
  await assertConversationIsOpen(supabase, conv);

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
  await assertConversationIsOpen(supabase, conv);

  // Nie można akceptować własnej propozycji (Self-Acceptance Bypass fix)
  const { data: refMsg } = await supabase.from("messages").select("sender_id").eq("id", refMessageId).maybeSingle();
  if (refMsg && refMsg.sender_id === user.id) throw new Error("Nie możesz zaakceptować własnej propozycji terminu");

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
  const { supabase, user, conv } = await validateParticipant(conversationId);
  await assertConversationIsOpen(supabase, conv);

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

/**
 * Zgłoszenie problemu / otwarcie sporu przez stronę rozmowy.
 *
 * Bezpieczeństwo: `validateParticipant` gwarantuje, że tylko firma albo student
 * z danej rozmowy może wywołać akcję. Kontrakt jest dodatkowo dopasowywany po
 * `company_id` + `student_id`, więc nawet operując kluczem service-role dotykamy
 * wyłącznie kontraktu należącego do obu stron tej rozmowy.
 *
 * Efekty:
 *  - neutralna notatka systemowa w rozmowie (ślad audytowy, best-effort),
 *  - powiązany kontrakt (jeśli istnieje i nie jest w stanie terminalnym) → `disputed`,
 *  - powiadomienie wszystkich administratorów (kanał eskalacji do wsparcia/ops).
 */
export async function reportProblem(conversationId: string, reasonRaw: string) {
  const { supabase, user, conv } = await validateParticipant(conversationId);
  await enforceMessageRateLimit(user.id, "report", conversationId);

  const reason = String(reasonRaw ?? "").trim();
  if (!reason) {
    throw new Error("Opisz krótko, na czym polega problem.");
  }
  if (reason.length > 2000) {
    throw new Error("Opis problemu jest za długi (max 2000 znaków).");
  }

  const reportedBy = user.id === conv.company_id ? "firma" : "student";
  const reportedByLabel = reportedBy === "firma" ? "firmę" : "studenta";

  // 1. Ślad w rozmowie — obie strony widzą, że sprawa trafiła do administracji.
  //    Best-effort: zgłoszenie ma się powieść nawet jeśli zapis notatki zawiedzie.
  try {
    await supabase.from("messages").insert({
      conversation_id: conversationId,
      sender_id: user.id,
      content:
        "Zgłoszono problem do administracji platformy. Zespół wsparcia przeanalizuje sprawę i skontaktuje się ze stronami.",
      event: "system.notice",
      payload: { kind: "problem_reported", reason, reported_by: reportedBy },
    });
  } catch (error) {
    console.error("Nie udało się zapisać notatki o zgłoszeniu problemu:", error);
  }

  // 2. Eskalacja do administracji — service role (kontrakty/profile poza zasięgiem RLS użytkownika).
  const admin = createAdminClient();

  // 2a. Oznacz powiązany kontrakt jako sporny (jeśli istnieje i nie jest już zamknięty/sporny).
  let contractId: string | null = null;
  let previousStatus: string | null = null;
  try {
    if (conv.application_id || conv.service_order_id) {
      let contractQuery = admin
        .from("contracts")
        .select("id, status")
        .eq("company_id", conv.company_id)
        .eq("student_id", conv.student_id);

      contractQuery = conv.application_id
        ? contractQuery.eq("application_id", conv.application_id)
        : contractQuery.eq("service_order_id", conv.service_order_id);

      const { data: contract } = await contractQuery.maybeSingle();

      if (contract?.id) {
        contractId = contract.id;
        previousStatus = contract.status ?? null;

        if (contract.status !== "disputed" && contract.status !== "cancelled") {
          await admin
            .from("contracts")
            .update({ status: "disputed", updated_at: new Date().toISOString() })
            .eq("id", contract.id);
        }
      }
    }
  } catch (error) {
    console.error("Nie udało się oznaczyć kontraktu jako spornego:", error);
  }

  // 2b. Powiadom wszystkich administratorów.
  const { data: adminProfiles } = await admin
    .from("profiles")
    .select("user_id")
    .eq("role", "admin");

  const adminIds = (adminProfiles ?? [])
    .map((row) => row.user_id as string | null)
    .filter((id): id is string => Boolean(id));

  if (adminIds.length === 0) {
    console.error("reportProblem: brak konta administratora do powiadomienia o sporze.");
  }

  const redirectPath = contractId
    ? `/app/admin/contracts/${contractId}`
    : "/app/admin/disputes";
  const snippet = `Problem zgłoszony przez ${reportedByLabel}: ${reason.slice(0, 180)}`;

  for (const adminId of adminIds) {
    await trySendNotification(adminId, "problem_reported", {
      conversation_id: conversationId,
      contract_id: contractId,
      application_id: conv.application_id ?? null,
      service_order_id: conv.service_order_id ?? null,
      reported_by: reportedBy,
      reason,
      previous_contract_status: previousStatus,
      redirect_path: redirectPath,
      snippet,
    });
  }

  revalidatePath(`/app/chat/${conversationId}`);
  revalidatePath("/app/admin/disputes");
  if (contractId) {
    revalidatePath(`/app/admin/contracts/${contractId}`);
  }

  return { ok: true as const };
}
