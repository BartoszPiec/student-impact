"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { logCriticalError } from "@/lib/observability/error-log";
import { trySendNotification } from "@/lib/notifications/server";
import { createClient } from "@/lib/supabase/server";
import { ensureConversationForApplication } from "@/lib/services/service-order-conversations";
import { UUID_RE } from "@/lib/security/validation";

const cancelCooperationSchema = z.object({
  applicationId: z.string().trim().regex(UUID_RE, "Nieprawidlowy identyfikator wspolpracy."),
  reason: z
    .string()
    .trim()
    .min(10, "Powod anulowania musi miec co najmniej 10 znakow.")
    .max(1000, "Powod anulowania jest zbyt dlugi."),
});

function readFormString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

export async function cancelCooperation(applicationId: string, formData: FormData) {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) redirect("/auth");

  const parsed = cancelCooperationSchema.safeParse({
    applicationId,
    reason: readFormString(formData, "reason"),
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Nieprawidlowe dane anulowania.");
  }

  const { applicationId: safeApplicationId, reason } = parsed.data;
  const { data: appRow } = await supabase
    .from("applications")
    .select("id, status, student_id, offer_id, message_to_company")
    .eq("id", safeApplicationId)
    .maybeSingle();

  if (!appRow) {
    throw new Error("Nie znaleziono wspolpracy do anulowania.");
  }

  const { data: offer } = await supabase
    .from("offers")
    .select("id, company_id, tytul")
    .eq("id", appRow.offer_id)
    .maybeSingle();

  if (!offer) {
    throw new Error("Nie znaleziono oferty powiazanej ze wspolpraca.");
  }

  const companyId = offer.company_id ?? null;
  const studentId = appRow.student_id ?? null;
  const isCompanyCancelling = user.id === companyId;
  const isStudentCancelling = user.id === studentId;

  if (!isCompanyCancelling && !isStudentCancelling) {
    throw new Error("Nie masz uprawnien do anulowania tej wspolpracy.");
  }

  if (appRow.status !== "accepted") {
    throw new Error("Mozna anulowac tylko aktywna wspolprace.");
  }

  const { error } = await supabase.rpc("cancel_application", {
    p_application_id: safeApplicationId,
    p_reason: reason,
  });

  if (error) {
    await logCriticalError({
      source: "cancel:cooperation",
      message: "Nie udalo sie anulowac wspolpracy przez RPC.",
      error,
      errorCode: error.code,
      context: {
        applicationId: safeApplicationId,
        offerId: appRow.offer_id,
        actorType: isCompanyCancelling ? "company" : "student",
      },
      userId: user.id,
    });
    throw new Error("Nie udalo sie anulowac wspolpracy. Sprobuj ponownie za chwile.");
  }

  const redirectPath = isCompanyCancelling ? "/app/company/offers" : "/app/applications";

  try {
    if (companyId && studentId) {
      const ensuredConversation = await ensureConversationForApplication(supabase, {
        applicationId: safeApplicationId,
        companyId,
        studentId,
        offerId: appRow.offer_id,
      });

      const conversationId = ensuredConversation.id;

      if (ensuredConversation.created) {
        const firstMessage = String(appRow.message_to_company ?? "").trim();
        if (firstMessage) {
          await supabase.from("messages").insert({
            conversation_id: conversationId,
            sender_id: studentId,
            content: firstMessage,
            event: "text.sent",
            payload: { source: "application" },
          });
        }
      }

      const cancelledBy = isCompanyCancelling ? "firma" : "student";
      const systemBody = `Wspolpraca anulowana przez ${cancelledBy}. Powod anulowania: ${reason}`;

      await supabase
        .from("conversations")
        .update({ status: "inactive" })
        .eq("id", conversationId);

      await supabase.from("messages").insert({
        conversation_id: conversationId,
        sender_id: user.id,
        content: systemBody,
        event: "cooperation_cancelled",
        payload: {
          reason,
          cancelled_by: cancelledBy,
          application_id: safeApplicationId,
        },
      });

      const recipientId = isCompanyCancelling ? studentId : companyId;
      const recipientRedirectPath = isCompanyCancelling ? "/app/applications" : "/app/company/offers";

      if (recipientId) {
        await trySendNotification(recipientId, "cooperation_cancelled", {
          application_id: safeApplicationId,
          offer_title: offer.tytul ?? null,
          cancelled_by: cancelledBy,
          cancel_reason: reason,
          redirect_path: recipientRedirectPath,
          snippet: `Wspolpraca "${offer.tytul ?? "zlecenie"}" zostala anulowana przez ${cancelledBy}.`,
        });
      }
    }
  } catch (historyError) {
    await logCriticalError({
      source: "cancel:cooperation:history",
      message: "Anulowano wspolprace, ale nie udalo sie zapisac historii lub notyfikacji.",
      error: historyError,
      context: {
        applicationId: safeApplicationId,
        offerId: appRow.offer_id,
        actorType: isCompanyCancelling ? "company" : "student",
      },
      userId: user.id,
      level: "warning",
    });
  }

  revalidatePath(`/app/deliverables/${safeApplicationId}`);
  revalidatePath("/app/chat");
  revalidatePath("/app/notifications");
  revalidatePath("/app/applications");
  revalidatePath("/app/company/applications");
  revalidatePath("/app/company/offers");
  revalidatePath("/app");

  redirect(redirectPath);
}
