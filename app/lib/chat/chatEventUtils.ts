export type ChatEventType =
  | "text.sent"
  | "file.sent"
  | "rate.proposed"
  | "rate.accepted"
  | "rate.rejected"
  | "deadline.proposed"
  | "deadline.accepted"
  | "deadline.rejected"
  | "system.notice"
  | "inquiry.details";

export type ChatMessagePayload = Record<string, unknown>;

export interface ChatMessageRecord {
  id: string;
  sender_id: string;
  conversation_id?: string;
  created_at: string;
  event?: string | null;
  content: string | null;
  payload?: ChatMessagePayload | null;
  attachment_url?: string | null;
  attachment_type?: string | null;
}

export interface NormalizedMessage {
  id: string;
  sender_id: string;
  conversation_id: string;
  created_at: string;
  event: ChatEventType;
  content: string | null;
  payload: ChatMessagePayload;
  is_mine: boolean;
}

function isRecord(value: unknown): value is ChatMessagePayload {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getNumericContentValue(content: string | null): number | null {
  if (!content) {
    return null;
  }

  const match = content.match(/(\d+)/);
  return match?.[1] ? parseInt(match[1], 10) : null;
}

export function normalizeMessage(
  message: ChatMessageRecord,
  currentUserId: string
): NormalizedMessage {
  const isMine = message.sender_id === currentUserId;
  let event: ChatEventType = "text.sent";
  let payload: ChatMessagePayload = isRecord(message.payload) ? message.payload : {};

  if (message.event) {
    switch (message.event) {
      case "text.sent":
      case "file.sent":
        event = message.event;
        break;
      case "rate.proposed": {
        event = "rate.proposed";
        const proposedRate = payload.proposed_stawka;
        const fallbackAmount = payload.amount;
        const contentAmount = getNumericContentValue(message.content);

        if (proposedRate == null && fallbackAmount != null) {
          payload = { ...payload, proposed_stawka: fallbackAmount };
        }

        if (proposedRate == null && fallbackAmount == null && contentAmount != null) {
          payload = { ...payload, proposed_stawka: contentAmount };
        }
        break;
      }
      case "rate.accepted":
      case "rate.rejected":
      case "deadline.proposed":
      case "deadline.accepted":
      case "deadline.rejected":
      case "system.notice":
        event = message.event;
        break;
      case "inquiry_details":
        event = "inquiry.details";
        break;
      case "negotiation_proposed": {
        if (payload.proposed_stawka != null) {
          event = "rate.proposed";
          break;
        }

        const contentAmount = getNumericContentValue(message.content);
        if (contentAmount != null) {
          event = "rate.proposed";
          payload = { ...payload, proposed_stawka: contentAmount };
        } else {
          event = "system.notice";
        }
        break;
      }
      case "counter_offer":
        event = "rate.proposed";
        if (payload.amount != null && payload.proposed_stawka == null) {
          payload = { ...payload, proposed_stawka: payload.amount };
        }
        break;
      case "counter_accepted":
        event = "rate.accepted";
        break;
      case "counter_rejected":
        event = "rate.rejected";
        break;
      case "application_sent":
      case "offer_closed":
      default:
        event = "system.notice";
        break;
    }
  } else if (message.attachment_url) {
    event = "file.sent";
    payload = {
      url: message.attachment_url,
      type: message.attachment_type,
      name: message.content,
    };
  } else if (message.content) {
    event = "text.sent";
  }

  return {
    id: message.id,
    sender_id: message.sender_id,
    conversation_id: message.conversation_id ?? "",
    created_at: message.created_at,
    event,
    content: message.content,
    payload,
    is_mine: isMine,
  };
}
