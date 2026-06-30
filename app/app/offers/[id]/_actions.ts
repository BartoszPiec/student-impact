"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { trySendNotification } from "@/lib/notifications/server";
import { ensureConversationIdForApplication } from "@/lib/services/service-order-conversations";
import { assertCanAccessStorageRef, assertUploadedObjectExists } from "@/lib/security/storage";
import { logCriticalError } from "@/lib/observability/error-log";
import { uuidSchema } from "@/lib/security/validation";
import { z } from "zod";

type AppSupabaseClient = Awaited<ReturnType<typeof createClient>>;
type JsonPayload = Record<string, unknown>;

const APPLY_TO_OFFER_ERROR_MESSAGE = "Nie udało się wysłać aplikacji. Spróbuj ponownie za chwilę.";
const INVALID_OFFER_ID_MESSAGE = "Nieprawidłowy identyfikator oferty.";
const INVALID_APPLICATION_MESSAGE = "Wiadomość aplikacyjna jest za długa.";
const INVALID_PROPOSED_RATE_MESSAGE = "Podaj poprawną proponowaną stawkę w PLN.";
const INVALID_CV_REFERENCE_MESSAGE = "Nieprawidłowy plik CV.";

const proposedRateSchema = z.preprocess((value) => {
  if (value == null || value === "") {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : value;
}, z.number().positive().max(500_000).nullable());

const optionalStorageRefSchema = z.preprocess((value) => {
  if (value == null) {
    return null;
  }

  const normalized = String(value).trim();
  return normalized.length > 0 ? normalized : null;
}, z.string().max(1024).nullable());

const applyToOfferInputSchema = z.object({
  offerId: uuidSchema,
  message: z.string().trim().max(5000),
  proposedStawka: proposedRateSchema,
  cvUrl: optionalStorageRefSchema,
});

function readErrorCode(error: unknown): string | null {
  if (!error || typeof error !== "object" || !("code" in error)) {
    return null;
  }

  const code = (error as { code?: unknown }).code;
  return typeof code === "string" && code.trim() ? code.trim() : null;
}

async function logApplyToOfferError(input: {
  source: string;
  error?: unknown;
  userId?: string | null;
  offerId?: string | null;
  applicationId?: string | null;
  conversationId?: string | null;
  level?: "error" | "warning";
  message?: string;
  context?: Record<string, unknown>;
}) {
  await logCriticalError({
    source: input.source,
    error: input.error,
    message: input.message,
    level: input.level ?? "error",
    errorCode: readErrorCode(input.error),
    userId: input.userId ?? null,
    context: {
      offerId: input.offerId ?? null,
      applicationId: input.applicationId ?? null,
      conversationId: input.conversationId ?? null,
      ...(input.context ?? {}),
    },
  });
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

  if (error) {
    await logApplyToOfferError({
      source: "offers.apply.message_insert",
      error,
      userId: senderId,
      conversationId,
      context: {
        event,
      },
    });
    throw new Error("Nie udało się zapisać wiadomości w czacie.");
  }
}

// ...



export async function applyToOffer(
  offerId: string,
  message: string,
  proposedStawka?: number | null,
  cvUrl?: string | null
) {
  let actorUserId: string | null = null;

  try {
    const supabase = await createClient();

    const { data: userData, error: authError } = await supabase.auth.getUser();
    if (authError) {
      await logApplyToOfferError({
        source: "offers.apply.auth_lookup",
        error: authError,
        offerId,
      });
      redirect("/auth");
    }

    const user = userData.user;
    if (!user) {
      redirect("/auth");
    }
    actorUserId = user.id;

    const parsedInput = applyToOfferInputSchema.safeParse({
      offerId,
      message,
      proposedStawka,
      cvUrl,
    });

    if (!parsedInput.success) {
      const flattened = parsedInput.error.flatten().fieldErrors;
      if (flattened.offerId) {
        return { error: INVALID_OFFER_ID_MESSAGE };
      }
      if (flattened.message) {
        return { error: INVALID_APPLICATION_MESSAGE };
      }
      if (flattened.proposedStawka) {
        return { error: INVALID_PROPOSED_RATE_MESSAGE };
      }
      if (flattened.cvUrl) {
        return { error: INVALID_CV_REFERENCE_MESSAGE };
      }

      return { error: APPLY_TO_OFFER_ERROR_MESSAGE };
    }

    const {
      offerId: safeOfferId,
      message: safeMessage,
      proposedStawka: proposed,
      cvUrl: safeCvUrl,
    } = parsedInput.data;

    const { data: currentProfile, error: currentProfileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("user_id", user.id)
      .maybeSingle();

    if (currentProfileError) {
      await logApplyToOfferError({
        source: "offers.apply.profile_lookup",
        error: currentProfileError,
        userId: user.id,
        offerId: safeOfferId,
      });
      return { error: APPLY_TO_OFFER_ERROR_MESSAGE };
    }

    if (currentProfile?.role !== "student") {
      return { error: "Tylko konto studenta może aplikować na zadanie." };
    }

    // Pobierz ofertę (do walidacji + powiadomień)
    const { data: offer, error: offerErr } = await supabase
      .from("offers")
      .select("id, tytul, stawka, company_id, status, is_platform_service, typ")
      .eq("id", safeOfferId)
      .maybeSingle();

    if (offerErr || !offer) {
      if (offerErr) {
        await logApplyToOfferError({
          source: "offers.apply.offer_lookup",
          error: offerErr,
          userId: user.id,
          offerId: safeOfferId,
        });
      }
      return { error: "Nie znaleziono aktywnej oferty." };
    }

    // 1. NAJPIERW sprawdź czy student już aplikował
    const { data: existing, error: existingError } = await supabase
      .from("applications")
      .select("id, status") // Fetch status
      .eq("offer_id", safeOfferId)
      .eq("student_id", user.id)
      .maybeSingle();

    if (existingError) {
      await logApplyToOfferError({
        source: "offers.apply.existing_application_lookup",
        error: existingError,
        userId: user.id,
        offerId: safeOfferId,
      });
      return { error: APPLY_TO_OFFER_ERROR_MESSAGE };
    }


    // BLOKADA PO REZYGNACJI
    if (existing?.status === "cancelled") {
      return { error: "Zrezygnowałeś z tej oferty. Ponowne aplikowanie jest zablokowane." };
    }

    let applicationId = existing?.id;
    let verifiedCvRef: string | null = null;

    if (safeCvUrl) {
      const cvRef = await assertCanAccessStorageRef(user.id, safeCvUrl);
      if (cvRef.bucket !== "cvs") {
        return { error: INVALID_CV_REFERENCE_MESSAGE };
      }
      await assertUploadedObjectExists(cvRef);
      verifiedCvRef = cvRef.ref;
    }

    if (existing?.id) {
      // Heal Check
      const { data: conv, error: conversationLookupError } = await supabase
        .from("conversations")
        .select("id")
        .eq("application_id", existing.id)
        .maybeSingle();

      if (conversationLookupError) {
        await logApplyToOfferError({
          source: "offers.apply.conversation_lookup",
          error: conversationLookupError,
          userId: user.id,
          offerId: safeOfferId,
          applicationId: existing.id,
        });
        return { error: APPLY_TO_OFFER_ERROR_MESSAGE };
      }

      // Jeśli konwersacja istnieje i wszystko gra, to po prostu przekieruj
      if (conv?.id) {
        return { success: true, redirectUrl: "/app/applications" };
      }
      // Jeśli nie ma konwersacji, to lecimy dalej żeby ją utworzyć (Repair Mode)
    }

    // 2. Sprawdź status (z uwzględnieniem "robust" platform check)
    // SYSTEM Platform Service (Auto-Accept + Limit 2 + Simple UI)
    const isSystemPlatform = offer.is_platform_service === true;

    const isMultiInstance = isSystemPlatform;

    if ((offer.status === "closed" && !isMultiInstance) || (offer.status === "in_progress" && !isMultiInstance)) {
      return { error: "Oferta jest już nieaktualna albo została zajęta przez innego studenta." };
    }

    if (!isMultiInstance) {
      const { data: lockedApplication, error: lockedApplicationError } = await supabase
        .from("applications")
        .select("id, status")
        .eq("offer_id", safeOfferId)
        .in("status", ["accepted", "in_progress", "completed"])
        .limit(1)
        .maybeSingle();

      if (lockedApplicationError) {
        await logApplyToOfferError({
          source: "offers.apply.locked_application_lookup",
          error: lockedApplicationError,
          userId: user.id,
          offerId: safeOfferId,
        });
        return { error: APPLY_TO_OFFER_ERROR_MESSAGE };
      }

      if (lockedApplication?.id && lockedApplication.id !== applicationId) {
        return { error: "Oferta jest już zajęta albo zakończona." };
      }
    }


    const normalizedOfferType = offer.typ?.toLocaleLowerCase("pl-PL") ?? "";
    const isChallengeOffer =
      normalizedOfferType.includes("challenge") || normalizedOfferType.includes("wyzwan");

    if (isChallengeOffer && safeMessage.length < 20) {
      return {
        error: "Wyzwanie wymaga krotkiego pitcha: opisz pomysl, zakres i dlaczego ta wycena ma sens.",
      };
    }

    if (isChallengeOffer && (proposed == null || proposed <= 0)) {
      return {
        error: "Wyzwanie wymaga proponowanej wyceny w PLN.",
      };
    }

    const isNegotiation = proposed != null && (offer.stawka == null || Number(proposed) !== Number(offer.stawka));

    // ✅ Platform Service Auto-Accept Logic (ONLY FOR SYSTEM PLATFORM)
    let autoAccepted = false;
    if (!applicationId && isSystemPlatform && !isNegotiation) {
      const { count, error: platformCountError } = await supabase
        .from("applications")
        .select("id, offers!inner(is_platform_service)", { count: "exact", head: true })
        .eq("student_id", user.id)
        .in("status", ["accepted", "in_progress"])
        .eq("offers.is_platform_service", true);

      if (platformCountError) {
        await logApplyToOfferError({
          source: "offers.apply.platform_service_count",
          error: platformCountError,
          userId: user.id,
          offerId: safeOfferId,
        });
        return { error: APPLY_TO_OFFER_ERROR_MESSAGE };
      }

      if ((count || 0) >= 2) { // LIMIT: 2 active tasks for System Orders
        return { error: "Masz już 2 aktywne zgłoszenia systemowe. Ukończ jedno, aby dobrać kolejne." };
      }
      autoAccepted = true; // RE-ENABLED: Student starts immediately
    }

    if (!applicationId) {
      const { data: inserted, error } = await supabase
        .from("applications")
        .insert({
          offer_id: safeOfferId,
          student_id: user.id,
          message_to_company: safeMessage || null,
          status: autoAccepted ? "accepted" : "sent", // AUTO ACCEPT
          proposed_stawka: proposed,
          cv_url: verifiedCvRef
        })
        .select("id")
        .single();

      if (error) {
        await logApplyToOfferError({
          source: "offers.apply.application_insert",
          error,
          userId: user.id,
          offerId: safeOfferId,
        });
        throw new Error("Nie udało się zapisać aplikacji.");
      }
      if (!inserted?.id) throw new Error("Nie udało się potwierdzić aplikacji.");

      applicationId = inserted.id;

      if (autoAccepted) {
        // User request: "dopuścić większą liczbę zgłoszeń".
        // Więc NIE ZMIENIAMY statusu oferty na in_progress/closed. Pozostaje otwarta dla innych.
        /* await supabase.from("offers").update({ status: "in_progress" }).eq("id", offerId); */

        // ✅ Automatycznie utwórz kontrakt + milestone dla platform service
        const { error: contractErr } = await supabase.rpc("ensure_contract_for_application", {
          p_application_id: applicationId,
        });
        if (contractErr) {
          await logApplyToOfferError({
            source: "offers.apply.platform_contract_create",
            error: contractErr,
            userId: user.id,
            offerId: safeOfferId,
            applicationId,
            level: "warning",
          });
          // Nie rzucamy błędu — aplikacja już istnieje, kontrakt można stworzyć później
        }
      }
    }

    // ✅ od razu twórz czat po wysłaniu aplikacji (Repair or Create)

    let conversationId: string | undefined;

    try {
      conversationId = await ensureConversationForApplication(supabase, {
        application_id: applicationId!,
        offer_id: safeOfferId,
        company_id: offer.company_id,
        student_id: user.id,
      });

      // ✅ 1) wiadomość z aplikacji jako pierwsza w czacie
      let initialMsg = safeMessage;
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

      // ✅ 1b) Info o CV
      if (safeCvUrl) {
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
      await logApplyToOfferError({
        source: "offers.apply.conversation_flow",
        error: innerErr,
        userId: user.id,
        offerId: safeOfferId,
        applicationId,
        conversationId,
      });
      throw innerErr;
    }

    revalidatePath("/app/company/applications");
    revalidatePath("/app/notifications");
    if (conversationId) revalidatePath(`/app/chat/${conversationId}`);

    // Redirect instructions instead of throwing NEXT_REDIRECT
    return { success: true, redirectUrl: `/app/offers/${safeOfferId}` };

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Wystąpił nieoczekiwany błąd.";
    const digest = err && typeof err === "object" && "digest" in err ? String(err.digest) : null;
    if (message === "NEXT_REDIRECT" || digest?.includes("NEXT_REDIRECT")) {
      throw err;
    }
    await logApplyToOfferError({
      source: "offers.apply.unexpected",
      error: err,
      message: "Unexpected applyToOffer failure.",
      userId: actorUserId,
      offerId,
    });
    return { error: APPLY_TO_OFFER_ERROR_MESSAGE };
  }
}
