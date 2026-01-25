
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
            case "rate.proposed":
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
                    event = "system.notice";
                }
                break;

            case "counter_offer":
                event = "rate.proposed";
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
