import type { SupabaseClient } from "@supabase/supabase-js";
import { logCriticalError } from "@/lib/observability/error-log";
import { ensureConversationIdForApplication } from "@/lib/services/service-order-conversations";

type RejectedApplicationRow = {
  id: string;
  student_id: string | null;
  contract_id?: string | null;
};

type CloseConversationParams = {
  applicationId: string;
  offerId: string;
  companyId: string;
  studentId: string;
  senderId: string;
  content?: string;
};

const DEFAULT_CLOSURE_MESSAGE = "Niestety tym razem firma wybrała kogoś innego.";

async function logApplicationChatClosureError(
  operation: string,
  error: unknown,
  context: Record<string, unknown>,
) {
  await logCriticalError({
    source: `application-chat-closure.${operation}`,
    error,
    context,
  });
}

export async function closeRejectedApplicationConversation(
  supabase: SupabaseClient,
  params: CloseConversationParams,
) {
  const conversationId = await ensureConversationIdForApplication(supabase, {
    applicationId: params.applicationId,
    offerId: params.offerId,
    companyId: params.companyId,
    studentId: params.studentId,
  });

  const { error: conversationUpdateError } = await supabase
    .from("conversations")
    .update({ status: "inactive" })
    .eq("id", conversationId);

  if (conversationUpdateError) {
    await logApplicationChatClosureError("closeRejectedApplicationConversation.updateConversation", conversationUpdateError, {
      applicationId: params.applicationId,
      offerId: params.offerId,
      conversationId,
    });
    throw new Error("Nie udało się zamknąć rozmowy aplikacji.");
  }

  const { count, error: countError } = await supabase
    .from("messages")
    .select("id", { count: "exact", head: true })
    .eq("conversation_id", conversationId)
    .eq("event", "offer_closed");

  if (countError) {
    await logApplicationChatClosureError("closeRejectedApplicationConversation.countClosureMessages", countError, {
      applicationId: params.applicationId,
      offerId: params.offerId,
      conversationId,
    });
    throw new Error("Nie udało się sprawdzić wiadomości zamykającej rozmowę.");
  }

  if ((count ?? 0) === 0) {
    const { error: messageInsertError } = await supabase.from("messages").insert({
      conversation_id: conversationId,
      sender_id: params.senderId,
      content: params.content ?? DEFAULT_CLOSURE_MESSAGE,
      event: "offer_closed",
      payload: {
        reason: "accepted_other",
        application_id: params.applicationId,
        offer_id: params.offerId,
      },
    });

    if (messageInsertError) {
      await logApplicationChatClosureError("closeRejectedApplicationConversation.insertClosureMessage", messageInsertError, {
        applicationId: params.applicationId,
        offerId: params.offerId,
        conversationId,
      });
      throw new Error("Nie udało się zapisać wiadomości o zamknięciu rozmowy.");
    }
  }

  return conversationId;
}

type RejectCompetingApplicationsParams = {
  offerId: string;
  acceptedApplicationId: string;
  companyId: string;
  senderId: string;
  content?: string;
  statuses?: string[];
  cancelContracts?: boolean;
};

type RejectedApplicationResult = {
  applicationId: string;
  studentId: string;
  conversationId: string;
};

export async function rejectCompetingApplicationsForOffer(
  supabase: SupabaseClient,
  params: RejectCompetingApplicationsParams,
): Promise<RejectedApplicationResult[]> {
  const now = new Date().toISOString();
  const statuses = params.statuses?.length
    ? params.statuses
    : ["sent", "countered"];

  const { data: others, error } = await supabase
    .from("applications")
    .select("id, student_id, contract_id")
    .eq("offer_id", params.offerId)
    .neq("id", params.acceptedApplicationId)
    .in("status", statuses);

  if (error) {
    await logApplicationChatClosureError("rejectCompetingApplicationsForOffer.lookupApplications", error, {
      offerId: params.offerId,
      acceptedApplicationId: params.acceptedApplicationId,
      statuses,
    });
    throw new Error("Nie udało się sprawdzić konkurencyjnych zgłoszeń.");
  }

  const rejectedRows = (others ?? []) as RejectedApplicationRow[];
  if (rejectedRows.length === 0) return [];

  const { error: updateError } = await supabase
    .from("applications")
    .update({ status: "rejected", decided_at: now })
    .eq("offer_id", params.offerId)
    .neq("id", params.acceptedApplicationId)
    .in("status", statuses);

  if (updateError) {
    await logApplicationChatClosureError("rejectCompetingApplicationsForOffer.updateApplications", updateError, {
      offerId: params.offerId,
      acceptedApplicationId: params.acceptedApplicationId,
      statuses,
    });
    throw new Error("Nie udało się odrzucić pozostałych zgłoszeń.");
  }

  const contractIdsToCancel = params.cancelContracts
    ? rejectedRows
      .map((row) => row.contract_id)
      .filter((contractId): contractId is string => typeof contractId === "string" && contractId.length > 0)
    : [];

  if (contractIdsToCancel.length > 0) {
    const { error: contractCancelError } = await supabase
      .from("contracts")
      .update({ status: "cancelled" })
      .in("id", contractIdsToCancel)
      .in("status", ["draft", "awaiting_funding"]);

    if (contractCancelError) {
      await logApplicationChatClosureError("rejectCompetingApplicationsForOffer.cancelContracts", contractCancelError, {
        offerId: params.offerId,
        acceptedApplicationId: params.acceptedApplicationId,
        contractCount: contractIdsToCancel.length,
      });
      throw new Error("Nie udało się anulować powiązanych kontraktów.");
    }
  }

  const results: RejectedApplicationResult[] = [];

  for (const row of rejectedRows) {
    if (!row.student_id) continue;
    const conversationId = await closeRejectedApplicationConversation(supabase, {
      applicationId: row.id,
      offerId: params.offerId,
      companyId: params.companyId,
      studentId: row.student_id,
      senderId: params.senderId,
      content: params.content,
    });

    results.push({
      applicationId: row.id,
      studentId: row.student_id,
      conversationId,
    });
  }

  return results;
}
