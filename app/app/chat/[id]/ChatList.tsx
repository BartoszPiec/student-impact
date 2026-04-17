
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { markMessagesAsRead } from "../_actions";
import { normalizeMessage } from "@/app/lib/chat/chatEventUtils";
import { TextBubble } from "../_components/TextBubble";
import { FileBubble } from "../_components/FileBubble";
import { RateCard } from "../_components/RateCard";
import { DeadlineCard } from "../_components/DeadlineCard";
import { SystemEventRow } from "../_components/SystemEventRow";
import { InquiryCard } from "../_components/InquiryCard";
import { format } from "date-fns";
import { pl } from "date-fns/locale";
import { createClient } from "@/lib/supabase/client";

type ChatMessageRecord = {
    id: string;
    sender_id: string;
    content: string | null;
    created_at: string;
    read_at?: string | null;
    attachment_url?: string | null;
    attachment_type?: string | null;
    event?: string | null;
    payload?: Record<string, unknown> | null;
};

function getPayloadString(
    payload: Record<string, unknown>,
    key: string
): string | undefined {
    const value = payload[key];
    return typeof value === "string" ? value : undefined;
}

function getPayloadNumber(
    payload: Record<string, unknown>,
    key: string
): number | undefined {
    const value = payload[key];
    return typeof value === "number" ? value : undefined;
}

export function ChatList({
    messages,
    userId,
    conversationId,
}: {
    messages: ChatMessageRecord[];
    userId: string;
    conversationId: string;
}) {
    const supabase = useMemo(() => createClient(), []);
    const bottomRef = useRef<HTMLDivElement>(null);
    const [liveMessages, setLiveMessages] = useState<ChatMessageRecord[]>(messages);

    useEffect(() => {
        setLiveMessages(messages);
    }, [messages]);

    useEffect(() => {
        const channel = supabase
            .channel(`messages:${conversationId}`)
            .on(
                "postgres_changes",
                {
                    event: "INSERT",
                    schema: "public",
                    table: "messages",
                    filter: `conversation_id=eq.${conversationId}`,
                },
                (payload) => {
                    const incoming = payload.new as ChatMessageRecord;
                    const normalized = normalizeMessage(incoming, userId);

                    setLiveMessages((previous) => {
                        if (previous.some((message) => message.id === normalized.id)) {
                            return previous;
                        }

                        const next = [...previous, incoming];
                        next.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
                        return next;
                    });
                },
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [conversationId, userId, supabase]);

    // 1. Normalize messages
    const normalizedMessages = useMemo(() => {
        return liveMessages.map((message) => normalizeMessage(message, userId));
    }, [liveMessages, userId]);

    // 2. Identify Latest Proposals
    const statusMap = useMemo(() => {
        const map = new Map<string, "accepted" | "rejected">();
        normalizedMessages.forEach(m => {
            const refMessageId = getPayloadString(m.payload, "ref_message_id");
            if (m.event === "rate.accepted" || m.event === "deadline.accepted") {
                if (refMessageId) map.set(refMessageId, "accepted");
            }
            if (m.event === "rate.rejected" || m.event === "deadline.rejected") {
                if (refMessageId) map.set(refMessageId, "rejected");
            }
        });
        return map;
    }, [normalizedMessages]);

    const latestRateProposalId = useMemo(() => {
        for (let i = normalizedMessages.length - 1; i >= 0; i--) {
            if (normalizedMessages[i].event === "rate.proposed") {
                return normalizedMessages[i].id;
            }
        }
        return null;
    }, [normalizedMessages]);

    const latestDeadlineProposalId = useMemo(() => {
        for (let i = normalizedMessages.length - 1; i >= 0; i--) {
            if (normalizedMessages[i].event === "deadline.proposed") {
                return normalizedMessages[i].id;
            }
        }
        return null;
    }, [normalizedMessages]);


    const lastMessageId = liveMessages.length > 0 ? liveMessages[liveMessages.length - 1].id : null;

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    }, [lastMessageId]);

    useEffect(() => {
        const hasUnread = liveMessages.some((message) => !message.read_at && message.sender_id !== userId);
        if (conversationId && hasUnread) {
            markMessagesAsRead(conversationId).catch(console.error);
        }
    }, [conversationId, liveMessages, userId]);

    if (normalizedMessages.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-2">
                <p>Brak wiadomości.</p>
            </div>
        );
    }
    return (
        <div className="flex flex-col gap-6 py-6 pb-4">
            {normalizedMessages.map((msg, index) => {
                const dateKey = new Date(msg.created_at).toDateString();
                const previousMessage = normalizedMessages[index - 1];
                const previousDateKey = previousMessage
                    ? new Date(previousMessage.created_at).toDateString()
                    : null;
                const showDate = dateKey !== previousDateKey;

                return (
                    <div key={msg.id} className="w-full">
                        {showDate && (
                            <div className="flex justify-center mb-6">
                                <span className="text-xs font-medium text-slate-400 bg-slate-100/50 px-3 py-1 rounded-full">
                                    {format(new Date(msg.created_at), "d MMMM", { locale: pl })}
                                </span>
                            </div>
                        )}

                        <div className={`flex flex-col ${msg.event.includes('system') || msg.event.includes('accepted') || msg.event.includes('rejected') ? 'items-center' : (msg.is_mine ? "items-end" : "items-start")} gap-1`}>

                            {msg.event === "text.sent" && (
                                <>
                                    {(msg.content || "").includes("=== DANE KONTAKTOWE ===") ? (
                                        <div className="w-full flex justify-center">
                                            <InquiryCard content={msg.content || ""} />
                                        </div>
                                    ) : (
                                        <TextBubble content={msg.content || ""} isMine={msg.is_mine} />
                                    )}
                                </>
                            )}

                            {msg.event === "inquiry.details" && (
                                <div className="w-full flex justify-center">
                                    <InquiryCard content={msg.content || ""} />
                                </div>
                            )}

                            {msg.event === "file.sent" && (
                                <FileBubble
                                    name={getPayloadString(msg.payload, "name") ?? "Plik"}
                                    url={getPayloadString(msg.payload, "url") ?? ""}
                                    type={getPayloadString(msg.payload, "type") ?? "file"}
                                    isMine={msg.is_mine}
                                />
                            )}

                            {msg.event === "rate.proposed" && (() => {
                                // Extract rate from payload with multiple fallbacks
                                const rateValue = getPayloadNumber(msg.payload, "proposed_stawka")
                                    ?? getPayloadNumber(msg.payload, "amount")
                                    ?? (msg.content ? parseFloat(msg.content.replace(/[^\d.]/g, '')) : undefined);
                                
                                // Defensive check
                                const safeRateValue =
                                    typeof rateValue === "number" && !isNaN(rateValue) ? rateValue : 0;

                                return (
                                    <RateCard
                                        rate={safeRateValue}
                                        isMine={msg.is_mine}
                                        isLatest={msg.id === latestRateProposalId}
                                        conversationId={conversationId}
                                        messageId={msg.id}
                                        status={statusMap.get(msg.id) || "pending"}
                                    />
                                );
                            })()}

                            {msg.event === "deadline.proposed" && (
                                <DeadlineCard
                                    deadline={getPayloadString(msg.payload, "proposed_deadline") ?? ""}
                                    isMine={msg.is_mine}
                                    isLatest={msg.id === latestDeadlineProposalId}
                                    conversationId={conversationId}
                                    messageId={msg.id}
                                    status={statusMap.get(msg.id) || "pending"}
                                />
                            )}

                            {(msg.event === "rate.accepted" || msg.event === "rate.rejected" || msg.event === "deadline.accepted" || msg.event === "deadline.rejected" || msg.event === "system.notice") && (
                                <SystemEventRow content={msg.content || ""} type={msg.event} />
                            )}


                            {/* Timestamp */}
                            {!msg.event.includes('system') && !msg.event.includes('accepted') && !msg.event.includes('rejected') && (
                                <span className="text-[10px] text-slate-400 px-1 opacity-70">
                                    {format(new Date(msg.created_at), "HH:mm")}
                                </span>
                            )}
                        </div>
                    </div>
                );
            })}
            <div ref={bottomRef} className="h-px" />
        </div>
    );
}
