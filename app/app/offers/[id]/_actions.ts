"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { trySendNotification } from "@/lib/notifications/server";
import { ensureConversationIdForApplication } from "@/lib/services/service-order-conversations";

type AppSupabaseClient = Awaited<ReturnType<typeof createClient>>;
type JsonPayload = Record<string, unknown>;

function toNumber(v: unknown): number | null {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

async function notifyUser(
  userId: string,
  typ: string,
  payload: JsonPayload = {}
) {
  try {
    await trySendNotification(userId, typ, payload);
  } catch {
    // MVP: nie psujemy flow jeśli notif padnie
  }
}

async function ensureConversationForApplication(supabase: AppSupabaseClient, args: {
  application_id: string;
  offer_id: string;
  company_id: string;
  student_id: string;
}) {
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
  body: string,
  event: string | null = "text.sent",
  payload: JsonPayload | null = null
) {
  const b = (body ?? "").trim();
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

// ... 



export async function applyToOffer(
  offerId: string,
  message: string,
  proposedStawka?: number | null,
  cvUrl?: string | null
) {
  const logs: string[] = [];
  logs.push("DEBUG START");

  try {
    const supabase = await createClient();

    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;
    if (!user) {
      logs.push("No Auth User");
      redirect("/auth");
    }
    logs.push(`User: ${user.id}`);

    const { data: currentProfile, error: currentProfileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("user_id", user.id)
      .maybeSingle();

    if (currentProfileError || currentProfile?.role !== "student") {
      logs.push(`Role guard failed: ${currentProfileError?.message ?? currentProfile?.role ?? "missing"}`);
      return { error: "Tylko konto studenta moze aplikowac na zadanie.", debug: logs };
    }

    // Pobierz ofertę (do walidacji + powiadomień)
    const { data: offer, error: offerErr } = await supabase
      .from("offers")
      .select("id, tytul, stawka, company_id, status, is_platform_service, typ")
      .eq("id", offerId)
      .single();

    if (offerErr || !offer) {
      logs.push(`Offer Error: ${offerErr?.message}`);
      throw new Error(offerErr?.message ?? "Offer not found");
    }
    logs.push(`Offer: ${offer.id} (Status: ${offer.status}, IsPlatform: ${offer.is_platform_service})`);

    // 1. NAJPIERW sprawdź czy student już aplikował
    const { data: existing } = await supabase
      .from("applications")
      .select("id, status") // Fetch status
      .eq("offer_id", offerId)
      .eq("student_id", user.id)
      .maybeSingle();

    logs.push(`Existing App: ${existing?.id || "None"}`);

    // BLOKADA PO REZYGNACJI
    if (existing?.status === "cancelled") {
      return { error: "Zrezygnowałeś z tej oferty. Ponowne aplikowanie jest zablokowane.", debug: logs };
    }

    let applicationId = existing?.id;

    if (existing?.id) {
      // Heal Check
      const { data: conv } = await supabase.from("conversations").select("id").eq("application_id", existing.id).maybeSingle();
      logs.push(`Healing Check: ConvID=${conv?.id || "NULL"}`);

      // Jeśli konwersacja istnieje i wszystko gra, to po prostu przekieruj
      if (conv?.id) {
        logs.push("Already valid -> Success Redirect");
        return { success: true, redirectUrl: `/app/applications`, debug: logs };
      }
      // Jeśli nie ma konwersacji, to lecimy dalej żeby ją utworzyć (Repair Mode)
      logs.push("Healing Mode Activated");
    }

    // 2. Sprawdź status (z uwzględnieniem "robust" platform check)
    // SYSTEM Platform Service (Auto-Accept + Limit 2 + Simple UI)
    const isSystemPlatform = offer.is_platform_service === true;

    // Company-created micro offers are single-instance. Only true system services can stay open for many students.
    const isMicroType = (offer.typ && (offer.typ.toLowerCase().includes("micro") || offer.typ.toLowerCase().includes("mikro")));
    logs.push(`IsSystemPlatform: ${isSystemPlatform}, IsMicroType: ${isMicroType}`);

    const isMultiInstance = isSystemPlatform;

    if ((offer.status === "closed" && !isMultiInstance) || (offer.status === "in_progress" && !isMultiInstance)) {
      logs.push("Offer is closed/in_progress -> redirect app");
      return { error: "Oferta jest już nieaktualna albo została zajęta przez innego studenta.", debug: logs };
    }

    if (!isMultiInstance) {
      const { data: lockedApplication } = await supabase
        .from("applications")
        .select("id, status")
        .eq("offer_id", offerId)
        .in("status", ["accepted", "in_progress", "completed"])
        .limit(1)
        .maybeSingle();

      if (lockedApplication?.id && lockedApplication.id !== applicationId) {
        logs.push(`Offer locked by application ${lockedApplication.id}:${lockedApplication.status}`);
        return { error: "Oferta jest już zajęta albo zakończona.", debug: logs };
      }
    }


    const proposed = proposedStawka == null ? null : toNumber(proposedStawka);

    const isNegotiation = proposed != null && (offer.stawka == null || Number(proposed) !== Number(offer.stawka));

    // ✅ Platform Service Auto-Accept Logic (ONLY FOR SYSTEM PLATFORM)
    let autoAccepted = false;
    if (!applicationId && isSystemPlatform && !isNegotiation) {
      const { count } = await supabase
        .from("applications")
        .select("id, offers!inner(is_platform_service)", { count: "exact", head: true })
        .eq("student_id", user.id)
        .in("status", ["accepted", "in_progress"])
        .eq("offers.is_platform_service", true);

      logs.push(`Platform Count: ${count}`);

      if ((count || 0) >= 2) { // LIMIT: 2 active tasks for System Orders
        logs.push("Platform limit reached (ERROR)");
        return { error: "Masz już 2 aktywne zgłoszenia systemowe. Ukończ jedno, aby dobrać kolejne.", debug: logs };
      }
      autoAccepted = true; // RE-ENABLED: Student starts immediately
      logs.push("Auto-Accept: TRUE (System Order)");
    }

    if (!applicationId) {
      logs.push("Inserting Application...");
      const { data: inserted, error } = await supabase
        .from("applications")
        .insert({
          offer_id: offerId,
          student_id: user.id,
          message_to_company: (message ?? "").trim() || null,
          status: autoAccepted ? "accepted" : "sent", // AUTO ACCEPT
          proposed_stawka: proposed,
          cv_url: cvUrl || null
        })
        .select("id")
        .single();

      if (error) {
        logs.push(`Insert Error: ${error.message} (Code: ${error.code})`);
        throw new Error(error.message);
      }
      if (!inserted?.id) throw new Error("No ID returned from insert");

      applicationId = inserted.id;
      logs.push(`New App ID: ${applicationId}`);

      if (autoAccepted) {
        // User request: "dopuścić większą liczbę zgłoszeń".
        // Więc NIE ZMIENIAMY statusu oferty na in_progress/closed. Pozostaje otwarta dla innych.
        /* await supabase.from("offers").update({ status: "in_progress" }).eq("id", offerId); */
        logs.push("Offer status update SKIPPED (Allow multi-candidate)");

        // ✅ Automatycznie utwórz kontrakt + milestone dla platform service
        const { error: contractErr } = await supabase.rpc("ensure_contract_for_application", {
          p_application_id: applicationId,
        });
        if (contractErr) {
          logs.push(`Contract creation warning: ${contractErr.message}`);
          // Nie rzucamy błędu — aplikacja już istnieje, kontrakt można stworzyć później
        } else {
          logs.push("Contract auto-created for platform service");
        }
      }
    }

    // ✅ od razu twórz czat po wysłaniu aplikacji (Repair or Create)
    logs.push("Ensuring Conversation...");

    let conversationId: string | undefined;

    try {
      conversationId = await ensureConversationForApplication(supabase, {
        application_id: applicationId!,
        offer_id: offerId,
        company_id: offer.company_id,
        student_id: user.id,
      });
      logs.push(`Conversation ID: ${conversationId}`);

      // ✅ 1) wiadomość z aplikacji jako pierwsza w czacie
      let initialMsg = (message ?? "").trim();
      let msgEvent: string | null = "text.sent";

      if (isSystemPlatform && autoAccepted) {
        const studentName = user.email ?? "Student";

        initialMsg = `Zlecenie będzie realizował ${studentName} od teraz możecie się ze sobą komunikować.`;
        msgEvent = 'system.notice'; // Renders as system badge
      } else {
        // Standard/Company Micro/Job
        // If empty, use default text
        if (!initialMsg) initialMsg = "Przesłano zgłoszenie aplikacyjne.";

      }

      await insertChatMessage(
        supabase,
        conversationId,
        user.id,
        initialMsg,
        msgEvent,
        msgEvent === "text.sent" ? { source: "application" } : null
      );
      logs.push("Initial Msg Sent");

      // ✅ 1b) Info o CV
      if (cvUrl) {
        await insertChatMessage(supabase, conversationId, user.id, "Załączono CV do zgłoszenia.");
      }

      // ✅ 2) jeśli negocjuje, dopisz to też na czacie
      if (isNegotiation) {
        await insertChatMessage(
          supabase,
          conversationId,
          user.id,
          `Proponuję stawkę ${proposed} zł.`,
          'rate.proposed',
          { proposed_stawka: proposed }
        );
      }

      // ✅ powiadom firmę
      logs.push("Notifying...");

      await notifyUser(
        offer.company_id,
        autoAccepted ? "application_accepted_auto" : (isNegotiation ? "negotiation_proposed" : "application_sent"),
        {
          offer_id: offer.id,
          offer_title: offer.tytul ?? null,
          application_id: applicationId,
          offer_stawka: offer.stawka ?? null,
          proposed_stawka: proposed,
          conversation_id: conversationId,
        }
      );

      if (autoAccepted) {
        // Notify student as well - REMOVED per user request
        /*
        await notifyUser(
            supabase,
            user.id,
            "application_accepted",
            {
                offer_id: offer.id,
                offer_title: offer.tytul ?? null,
                application_id: applicationId,
            }
        );
        */
      }
    } catch (innerErr: unknown) {
      const message = innerErr instanceof Error ? innerErr.message : "Nieznany blad";
      logs.push(`Inner Logic Error: ${message}`);
      console.error(innerErr);
      throw innerErr;
    }

    logs.push("Revalidating...");
    revalidatePath("/app/company/applications");
    revalidatePath("/app/notifications");
    if (conversationId) revalidatePath(`/app/chat/${conversationId}`);

    // Redirect instructions instead of throwing NEXT_REDIRECT
    return { success: true, redirectUrl: `/app/offers/${offerId}`, debug: logs };

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Wystapil nieoczekiwany blad.";
    const digest = err && typeof err === "object" && "digest" in err ? String(err.digest) : null;
    console.error("applyToOffer error:", err);
    logs.push(`FATAL: ${message}`);
    if (message === "NEXT_REDIRECT" || digest?.includes("NEXT_REDIRECT")) {
      throw err;
    }
    return { error: message, debug: logs };
  }
}
