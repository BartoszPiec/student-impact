import "server-only";

import { getCurrentUser } from "@/lib/auth/request-context";
import { createClient } from "@/lib/supabase/server";
import type { ChatPreview } from "./chat-preview-types";

type PreviewMessage = {
  content?: string | null;
  created_at: string;
  read_at?: string | null;
  sender_id: string;
  event?: string | null;
  payload?: Record<string, unknown> | null;
  attachment_type?: string | null;
};

type ChatPreviewRow = {
  id: string;
  created_at: string;
  updated_at: string | null;
  conversation_type: string | null;
  student_id: string;
  company_id: string;
  offer_title: string | null;
  package_title: string | null;
  application_offer_title: string | null;
  last_message: PreviewMessage | null;
  unread_count: number | string | null;
  student_name: string | null;
  company_name: string | null;
};

function payloadString(payload: Record<string, unknown> | null | undefined, key: string) {
  const value = payload?.[key];
  return typeof value === "string" ? value : "";
}

function payloadNumber(payload: Record<string, unknown> | null | undefined, key: string) {
  const value = payload?.[key];
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function buildLastMessagePreview(message?: PreviewMessage | null) {
  if (!message) return "";

  const content = String(message.content || "").trim();
  if (content) return content;

  switch (message.event) {
    case "file.sent":
      return `[Plik] ${payloadString(message.payload, "name") || "Załącznik"}`;
    case "rate.proposed": {
      const amount = payloadNumber(message.payload, "proposed_stawka") ?? payloadNumber(message.payload, "amount");
      return amount ? `Propozycja stawki: ${amount} PLN` : "Nowa propozycja stawki";
    }
    case "rate.accepted":
      return "Stawka zaakceptowana";
    case "rate.rejected":
      return "Stawka odrzucona";
    case "deadline.proposed":
      return `Propozycja terminu: ${payloadString(message.payload, "proposed_deadline") || "nowy termin"}`;
    case "deadline.accepted":
      return "Termin zaakceptowany";
    case "deadline.rejected":
      return "Termin odrzucony";
    case "inquiry.details":
    case "inquiry_details":
      return "Szczegóły zapytania";
    case "system.notice":
      return "Aktualizacja rozmowy";
    default:
      return message.event ? "Nowe zdarzenie w rozmowie" : "";
  }
}

function resolveConversationType(row: ChatPreviewRow): ChatPreview["type"] {
  if (row.conversation_type === "inquiry") return "inquiry";
  if (row.package_title) return "order";
  if (row.application_offer_title) return "application";
  if (row.conversation_type === "direct") return "direct";
  return "inquiry";
}

export async function getChatPreviews() {
  const supabase = await createClient();
  const user = await getCurrentUser();

  if (!user) return { conversations: [] as ChatPreview[], userId: "" };

  const { data, error } = await supabase.rpc("get_my_chat_previews", { p_limit: 50 });

  if (error) {
    console.error("Nie udało się pobrać listy rozmów:", error);
    return { conversations: [] as ChatPreview[], userId: user.id };
  }

  const conversations = ((data ?? []) as ChatPreviewRow[]).map((row): ChatPreview => {
    const isStudent = user.id === row.student_id;
    const unreadCount = Number(row.unread_count ?? 0);

    return {
      id: row.id,
      created_at: row.created_at,
      active_at: row.updated_at ?? row.created_at,
      type: resolveConversationType(row),
      unread_count: Number.isFinite(unreadCount) ? unreadCount : 0,
      last_message: buildLastMessagePreview(row.last_message),
      other_user: isStudent
        ? { id: row.company_id, email: "Firma", nazwa: row.company_name ?? undefined, role: "company" }
        : { id: row.student_id, email: "Student", public_name: row.student_name ?? undefined, role: "student" },
      offer: row.offer_title ? { tytul: row.offer_title } : undefined,
      package: row.package_title ? { title: row.package_title } : undefined,
      application: row.application_offer_title ? { offer: { tytul: row.application_offer_title } } : undefined,
    };
  });

  return { conversations, userId: user.id };
}
