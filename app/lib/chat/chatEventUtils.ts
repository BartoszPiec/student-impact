
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

export interface NormalizedMessage {
    id: string;
    sender_id: string;
    conversation_id: string;
    created_at: string;
    event: ChatEventType;
    content: string | null;
    payload: any;
    is_mine: boolean;
}

export function normalizeMessage(msg: any, currentUserId: string): NormalizedMessage {
    const isMine = msg.sender_id === currentUserId;
    let event: ChatEventType = "text.sent";
    let payload: any = msg.payload || {};

    // 1. New standard events (Explicit)
    if (msg.event) {
        // Map known logical events to our standard types if they differ, or pass through
        switch (msg.event) {
            case "text.sent":
            case "file.sent":
                event = msg.event;
                break;
            case "rate.proposed":
                event = "rate.proposed";
                // Ensure proposed_stawka exists (fallback from amount or content)
                if (!payload?.proposed_stawka && payload?.amount) {
                    payload = { ...payload, proposed_stawka: payload.amount };
                }
                if (!payload?.proposed_stawka && msg.content) {
                    const numMatch = msg.content.match(/(\d+)/);
                    if (numMatch) payload = { ...payload, proposed_stawka: parseInt(numMatch[1]) };
                }
                break;
            case "rate.accepted":
            case "rate.rejected":
            case "deadline.proposed":
            case "deadline.accepted":
            case "deadline.rejected":
            case "system.notice":
                event = msg.event;
                break;

            case "inquiry_details":
                event = "inquiry.details";
                break;

            // Legacy mapping
            case "negotiation_proposed":
                // If it has proposed_stawka, it's a rate proposal
                if (payload?.proposed_stawka) {
                    event = "rate.proposed";
                } else {
                    // Fallback for legacy messages where payload might be missing
                    const match = msg.content?.match(/Proponuję stawkę (\d+)/);
                    if (match && match[1]) {
                        event = "rate.proposed";
                        payload = { ...payload, proposed_stawka: parseInt(match[1]) };
                    } else {
                        event = "system.notice";
                    }
                }
                break;

            case "counter_offer":
                event = "rate.proposed";
                // Legacy counter_offer used { amount } instead of { proposed_stawka }
                if (payload?.amount && !payload?.proposed_stawka) {
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
                event = "system.notice";
                break;

            default:
                // Unknown event -> treat as system notice or fallback text
                event = "system.notice";
                break;
        }
    }
    // 2. Legacy implicit text/file
    else {
        if (msg.attachment_url) {
            event = "file.sent";
            payload = {
                url: msg.attachment_url,
                type: msg.attachment_type,
                name: msg.content // often filename was stored in content or just "File"
            };
        } else if (msg.content) {
            event = "text.sent";
        }
    }

    return {
        id: msg.id,
        sender_id: msg.sender_id,
        conversation_id: msg.conversation_id,
        created_at: msg.created_at,
        event,
        content: msg.content,
        payload,
        is_mine: isMine
    };
}
