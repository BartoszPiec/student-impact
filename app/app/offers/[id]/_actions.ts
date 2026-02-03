"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

function toNumber(v: any): number | null {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
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
  } catch {
    // MVP: nie psujemy flow jeśli notif padnie
  }
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

async function insertChatMessage(supabase: any, conversationId: string, senderId: string, body: string, event: string | null = null, payload: any = null) {
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

    // Company/Legacy Micro (Manual Accept + Limit 1? Or No Limit? + Negotiation UI)
    // "Mikrozlecenie utworzone przez firmę" -> Student negotiates, Company accepts.
    const isMicroType = (offer.typ && (offer.typ.toLowerCase().includes("micro") || offer.typ.toLowerCase().includes("mikro")));

    // Logic: Treat as "Platform/System" ONLY if true system service. 
    // If it's just text "micro", treat as Standard Order.

    const isPlatform = isSystemPlatform;
    logs.push(`IsSystemPlatform: ${isSystemPlatform}, IsMicroType: ${isMicroType}`);

    // FIX: Allow Micro-type offers to be applied to even if "closed" or "in_progress"
    const isMultiInstance = isSystemPlatform || isMicroType;

    if ((offer.status === "closed" && !isMultiInstance) || (offer.status === "in_progress" && !isMultiInstance)) {
      logs.push("Offer is closed/in_progress -> redirect app");
      // Enhanced Error Message for Debugging
      return { error: `Oferta już nieaktualna (zajęta). [DEBUG: ${logs.join(' -> ')}]`, debug: logs };
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
        .eq("status", "in_progress")
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
          status: autoAccepted ? "in_progress" : "sent", // AUTO ACCEPT
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
      }
    }

    // ✅ od razu twórz czat po wysłaniu aplikacji (Repair or Create)
    logs.push("Ensuring Conversation...");

    let conversationId: string | undefined;

    try {
      conversationId = await ensureConversationForApplication(supabase as any, {
        application_id: applicationId!,
        offer_id: offerId,
        company_id: offer.company_id,
        student_id: user.id,
      });
      logs.push(`Conversation ID: ${conversationId}`);

      // ✅ 1) wiadomość z aplikacji jako pierwsza w czacie
      let initialMsg = (message ?? "").trim();
      let msgEvent: string | null = null; // Default: standard message

      if (isSystemPlatform && autoAccepted) {
        // Fetch Student Name for the System Message
        const { data: profile } = await supabase
          .from("profiles")
          .select("first_name, last_name, email")
          .eq("user_id", user.id)
          .single();

        const studentName = profile ? `${profile.first_name || ""} ${profile.last_name || ""}`.trim() || profile.email : "Student";

        initialMsg = `Zlecenie będzie realizował ${studentName} od teraz możecie się ze sobą komunikować.`;
        msgEvent = 'application_accepted'; // Renders as system badge
      } else {
        // Standard/Company Micro/Job
        // If empty, use default text
        if (!initialMsg) initialMsg = "Przesłano zgłoszenie aplikacyjne.";

        // Use inline check to avoid any scope confusion
        const isNegotiationCheck = proposed != null && (offer.stawka == null || Number(proposed) !== Number(offer.stawka));
        if (isNegotiationCheck) {
          msgEvent = 'negotiation_proposed';
        }
      }

      await insertChatMessage(
        supabase as any,
        conversationId,
        user.id,
        initialMsg,
        msgEvent as any
      );
      logs.push("Initial Msg Sent");

      // ✅ 1b) Info o CV
      if (cvUrl) {
        await insertChatMessage(supabase as any, conversationId, user.id, "Załączono CV do zgłoszenia.");
      }

      // ✅ 2) jeśli negocjuje, dopisz to też na czacie
      if (proposed != null && (offer.stawka == null || Number(proposed) !== Number(offer.stawka))) {
        // PASS 'negotiation_proposed' EVENT HERE to trigger In-Chat UI
        await insertChatMessage(
          supabase as any,
          conversationId,
          user.id,
          `Proponuję stawkę ${proposed} zł.`,
          'negotiation_proposed',
          { proposed_stawka: proposed }
        );
      }

      // ✅ powiadom firmę
      logs.push("Notifying...");
      const isNegotiation =
        proposed != null && (offer.stawka == null || Number(proposed) !== Number(offer.stawka));

      await notifyUser(
        supabase as any,
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
            supabase as any,
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
    } catch (innerErr: any) {
      logs.push(`Inner Logic Error: ${innerErr.message}`);
      console.error(innerErr);
      throw innerErr;
    }

    logs.push("Revalidating...");
    revalidatePath("/app/company/applications");
    revalidatePath("/app/notifications");
    if (conversationId) revalidatePath(`/app/chat/${conversationId}`);

    // Redirect instructions instead of throwing NEXT_REDIRECT
    return { success: true, redirectUrl: `/app/offers/${offerId}`, debug: logs };

  } catch (err: any) {
    console.error("applyToOffer error:", err);
    logs.push(`FATAL: ${err.message}`);
    if (err.message === "NEXT_REDIRECT" || err.digest?.includes("NEXT_REDIRECT")) {
      throw err;
    }
    return { error: err.message || "Wystąpił nieoczekiwany błąd.", debug: logs };
  }
}
