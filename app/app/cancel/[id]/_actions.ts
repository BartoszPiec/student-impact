"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { trySendNotification } from "@/lib/notifications/server";
import { ensureConversationForApplication } from "@/lib/services/service-order-conversations";

export async function cancelCooperation(applicationId: string, formData: FormData) {
  const supabase = await createClient();

  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) redirect("/auth");

  const reason = String(formData.get("reason") ?? "").trim();
  if (!reason) {
    throw new Error("Powód anulowania jest wymagany.");
  }

  const { error } = await supabase.rpc("cancel_application", {
    p_application_id: applicationId,
    p_reason: reason,
  });
  if (error) {
    throw new Error(`cancel_application failed: ${error.message}`);
  }

  let redirectPath = "/app";

  try {
    const { data: appRow } = await supabase
      .from("applications")
      .select("id, student_id, offer_id, message_to_company")
      .eq("id", applicationId)
      .maybeSingle();

    if (appRow) {
      const { data: offer } = await supabase
        .from("offers")
        .select("id, company_id, tytul")
        .eq("id", appRow.offer_id)
        .maybeSingle();

      const companyId = offer?.company_id ?? null;
      const studentId = appRow.student_id ?? null;
      const isCompanyCancelling = user.id === companyId;
      redirectPath = isCompanyCancelling ? "/app/company/offers" : "/app/applications";

      if (companyId && studentId) {
        const ensuredConversation = await ensureConversationForApplication(supabase, {
          applicationId,
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
        const systemBody = `Zlecenie anulowane przez ${cancelledBy}. Powód anulowania: ${reason}`;

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
            application_id: applicationId,
          },
        });

        const recipientId = isCompanyCancelling ? studentId : companyId;
        const recipientRedirectPath = isCompanyCancelling ? "/app/applications" : "/app/company/offers";

        if (recipientId) {
          await trySendNotification(recipientId, "cooperation_cancelled", {
            application_id: applicationId,
            offer_title: offer?.tytul ?? null,
            cancelled_by: cancelledBy,
            cancel_reason: reason,
            redirect_path: recipientRedirectPath,
            snippet: `Zlecenie "${offer?.tytul ?? "zlecenie"}" zostało anulowane przez ${cancelledBy}. Powód anulowania: ${reason}`,
          });
        }
      }
    }
  } catch {
    // Anulowanie ma się udać nawet jeśli historia rozmowy albo notyfikacja nie zapiszą się poprawnie.
  }

  revalidatePath(`/app/deliverables/${applicationId}`);
  revalidatePath("/app/chat");
  revalidatePath("/app/notifications");
  revalidatePath("/app/applications");
  revalidatePath("/app/company/applications");
  revalidatePath("/app/company/offers");
  revalidatePath("/app");

  redirect(redirectPath);
}
