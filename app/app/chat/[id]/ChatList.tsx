
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { markConversationAsUnread, markMessagesAsRead, toggleMessageFlag } from "../_actions";
import { useRouter } from "next/navigation";
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
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Flag, MailOpen, MoreHorizontal } from "lucide-react";

type ChatMessageRecord = {
    id: string;
    sender_id: string;
    content: string | null;
    created_at: string;
    read_at?: string | null;
    attachment_url?: string | null;
    attachment_type?: string | null;
    flagged_by?: string[] | null;
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
    const router = useRouter();
    const bottomRef = useRef<HTMLDivElement>(null);
    const suppressAutoReadRef = useRef(false);
    const [liveMessages, setLiveMessages] = useState<ChatMessageRecord[]>(messages);
    const [pendingActionId, setPendingActionId] = useState<string | null>(null);

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
            const manualUnreadAt = Number(window.localStorage.getItem(`chat:manual-unread:${conversationId}`) || 0);
            const shouldSuppressAutoRead = manualUnreadAt > 0 && Date.now() - manualUnreadAt < 30000;
            if (suppressAutoReadRef.current && shouldSuppressAutoRead) {
                return;
            }
            if (shouldSuppressAutoRead) {
                suppressAutoReadRef.current = true;
                return;
            }
            suppressAutoReadRef.current = false;

            const readAt = new Date().toISOString();
            setLiveMessages((previous) =>
                previous.map((message) =>
                    message.sender_id !== userId && !message.read_at
                        ? { ...message, read_at: readAt }
                        : message,
                ),
            );
            markMessagesAsRead(conversationId)
                .then(() => router.refresh())
                .catch(console.error);
        }
    }, [conversationId, liveMessages, router, userId]);

    if (normalizedMessages.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-2">
                <p>Brak wiadomości.</p>
            </div>
        );
    }

    const handleToggleFlag = async (messageId: string) => {
        setPendingActionId(messageId);
        try {
            await toggleMessageFlag(conversationId, messageId);
            setLiveMessages((previous) =>
                previous.map((message) => {
                    if (message.id !== messageId) return message;
                    const flaggedBy = Array.isArray(message.flagged_by) ? message.flagged_by : [];
                    const nextFlaggedBy = flaggedBy.includes(userId)
                        ? flaggedBy.filter((id) => id !== userId)
                        : [...flaggedBy, userId];
                    return { ...message, flagged_by: nextFlaggedBy };
                }),
            );
        } finally {
            setPendingActionId(null);
        }
    };

    const handleMarkUnread = async () => {
        window.localStorage.setItem(`chat:manual-unread:${conversationId}`, String(Date.now()));
        await markConversationAsUnread(conversationId);
        suppressAutoReadRef.current = true;
        setLiveMessages((previous) => {
            const next = [...previous];
            for (let index = next.length - 1; index >= 0; index -= 1) {
                if (next[index].sender_id !== userId) {
                    next[index] = { ...next[index], read_at: null };
                    break;
                }
            }
            return next;
        });
        router.refresh();
    };

    return (
        <div className="flex flex-col gap-6 py-6 pb-4">
            {normalizedMessages.map((msg, index) => {
                const rawMessage = liveMessages.find((message) => message.id === msg.id);
                const isFlagged = Array.isArray(rawMessage?.flagged_by) && rawMessage.flagged_by.includes(userId);
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

                        <div className={`group/message flex flex-col ${msg.event.includes('system') || msg.event.includes('accepted') || msg.event.includes('rejected') ? 'items-center' : (msg.is_mine ? "items-end" : "items-start")} gap-1`}>
                            <div className={`flex items-center gap-2 ${msg.is_mine ? "flex-row-reverse" : "flex-row"}`}>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="h-7 w-7 rounded-full text-slate-300 opacity-0 transition-opacity hover:text-slate-700 group-hover/message:opacity-100"
                                            disabled={pendingActionId === msg.id}
                                        >
                                            <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align={msg.is_mine ? "end" : "start"} className="w-56">
                                        <DropdownMenuItem onClick={() => handleToggleFlag(msg.id)} className="gap-2">
                                            <Flag className="h-4 w-4" />
                                            {isFlagged ? "Usuń flagę" : "Oflaguj wiadomość"}
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={handleMarkUnread} className="gap-2">
                                            <MailOpen className="h-4 w-4" />
                                            Oznacz rozmowę jako nieprzeczytaną
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>

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
                            </div>

                            {isFlagged ? (
                                <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-700">
                                    <Flag className="h-3 w-3" />
                                    Oflagowana
                                </span>
                            ) : null}


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
