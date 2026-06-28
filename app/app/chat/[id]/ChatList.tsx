
"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getOlderMessages, markConversationAsUnread, markMessagesAsRead, toggleMessageFlag } from "../_actions";
import { useRouter } from "next/navigation";
import { normalizeMessage, type NormalizedMessage } from "@/app/lib/chat/chatEventUtils";
import { TextBubble } from "../_components/TextBubble";
import { FileBubble } from "../_components/FileBubble";
import { RateCard } from "../_components/RateCard";
import { DeadlineCard } from "../_components/DeadlineCard";
import { SystemEventRow } from "../_components/SystemEventRow";
import { InquiryCard } from "../_components/InquiryCard";
import { format } from "date-fns";
import { pl } from "date-fns/locale";
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
    applicationStatus,
    conversationStatus,
    initialHasMore,
}: {
    messages: ChatMessageRecord[];
    userId: string;
    conversationId: string;
    applicationStatus?: string | null;
    conversationStatus?: string | null;
    initialHasMore?: boolean;
}) {
    const router = useRouter();
    const bottomRef = useRef<HTMLDivElement>(null);
    const suppressAutoReadRef = useRef(false);
    const [liveMessages, setLiveMessages] = useState<ChatMessageRecord[]>(messages);
    const [pendingActionId, setPendingActionId] = useState<string | null>(null);
    const [hasMore, setHasMore] = useState(initialHasMore ?? false);
    const [isLoadingOlder, setIsLoadingOlder] = useState(false);

    const mergeMessage = useCallback((message: ChatMessageRecord) => {
        setLiveMessages((previous) => {
            const existingIndex = previous.findIndex((item) => item.id === message.id);
            const next = existingIndex >= 0 ? [...previous] : [...previous, message];

            if (existingIndex >= 0) {
                next[existingIndex] = { ...next[existingIndex], ...message };
            }

            next.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
            return next;
        });
    }, []);

    useEffect(() => {
        setLiveMessages((previous) => {
            const merged = new Map(previous.map((message) => [message.id, message]));
            for (const message of messages) merged.set(message.id, message);
            return Array.from(merged.values()).sort(
                (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
            );
        });
    }, [messages]);

    useEffect(() => {
        let active = true;
        let removeChannel: (() => void) | undefined;

        void import("@/lib/supabase/client").then(({ createClient }) => {
            if (!active) return;

            const supabase = createClient();
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
                        mergeMessage(payload.new as ChatMessageRecord);
                    },
                )
                .on(
                    "postgres_changes",
                    {
                        event: "UPDATE",
                        schema: "public",
                        table: "messages",
                        filter: `conversation_id=eq.${conversationId}`,
                    },
                    (payload) => {
                        mergeMessage(payload.new as ChatMessageRecord);
                    },
                )
                .subscribe();

            removeChannel = () => {
                void supabase.removeChannel(channel);
            };
        });

        return () => {
            active = false;
            removeChannel?.();
        };
    }, [conversationId, mergeMessage]);

    const {
        normalizedMessages,
        rawMessagesById,
        statusMap,
        latestRateProposalId,
        latestDeadlineProposalId,
    } = useMemo(() => {
        const normalized: NormalizedMessage[] = [];
        const rawById = new Map<string, ChatMessageRecord>();
        const statuses = new Map<string, "accepted" | "rejected">();
        let latestRateId: string | null = null;
        let latestDeadlineId: string | null = null;

        for (const rawMessage of liveMessages) {
            rawById.set(rawMessage.id, rawMessage);
            const message = normalizeMessage(rawMessage, userId);
            normalized.push(message);

            if (message.event === "rate.proposed") latestRateId = message.id;
            if (message.event === "deadline.proposed") latestDeadlineId = message.id;

            const refMessageId = getPayloadString(message.payload, "ref_message_id");
            if (!refMessageId) continue;
            if (message.event === "rate.accepted" || message.event === "deadline.accepted") {
                statuses.set(refMessageId, "accepted");
            } else if (message.event === "rate.rejected" || message.event === "deadline.rejected") {
                statuses.set(refMessageId, "rejected");
            }
        }

        return {
            normalizedMessages: normalized,
            rawMessagesById: rawById,
            statusMap: statuses,
            latestRateProposalId: latestRateId,
            latestDeadlineProposalId: latestDeadlineId,
        };
    }, [liveMessages, userId]);

    const isConversationLocked =
        conversationStatus === "inactive" ||
        applicationStatus === "rejected" ||
        applicationStatus === "cancelled";


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

    const handleLoadOlder = async () => {
        const firstMessage = liveMessages[0];
        if (!firstMessage || isLoadingOlder) return;

        setIsLoadingOlder(true);
        try {
            const olderMessages = await getOlderMessages(conversationId, firstMessage.created_at, 100);
            setLiveMessages((previous) => {
                const merged = new Map(previous.map((message) => [message.id, message]));
                for (const message of olderMessages) merged.set(message.id, message);
                return Array.from(merged.values()).sort(
                    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
                );
            });
            setHasMore(olderMessages.length === 100);
        } finally {
            setIsLoadingOlder(false);
        }
    };

    return (
        <div className="flex flex-col gap-4 py-3 pb-4 sm:gap-6 sm:py-6">
            {hasMore ? (
                <div className="flex justify-center">
                    <Button type="button" variant="outline" onClick={handleLoadOlder} disabled={isLoadingOlder} className="rounded-full">
                        {isLoadingOlder ? "Ładowanie…" : "Pokaż starsze wiadomości"}
                    </Button>
                </div>
            ) : null}
            {normalizedMessages.map((msg, index) => {
                const rawMessage = rawMessagesById.get(msg.id);
                const isFlagged = Array.isArray(rawMessage?.flagged_by) && rawMessage.flagged_by.includes(userId);
                const isTimelineEvent = msg.event.includes("system") || msg.event.includes("accepted") || msg.event.includes("rejected");
                const dateKey = new Date(msg.created_at).toDateString();
                const previousMessage = normalizedMessages[index - 1];
                const previousDateKey = previousMessage
                    ? new Date(previousMessage.created_at).toDateString()
                    : null;
                const showDate = dateKey !== previousDateKey;

                return (
                    <div key={msg.id} className="w-full">
                        {showDate && (
                            <div className="mb-4 flex justify-center sm:mb-6">
                                <span className="text-xs font-medium text-slate-400 bg-slate-100/50 px-3 py-1 rounded-full">
                                    {format(new Date(msg.created_at), "d MMMM", { locale: pl })}
                                </span>
                            </div>
                        )}

                        <div className={`group/message flex min-w-0 flex-col ${isTimelineEvent ? 'items-center' : (msg.is_mine ? "items-end" : "items-start")} gap-1`}>
                            <div className={`flex w-full max-w-full items-start gap-1 sm:gap-2 ${msg.is_mine ? "flex-row-reverse" : "flex-row"}`}>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="h-7 w-7 shrink-0 rounded-full text-slate-300 opacity-0 transition-opacity hover:text-slate-700 group-hover/message:opacity-100 max-sm:hidden"
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
                                const rateValue = getPayloadNumber(msg.payload, "proposed_stawka")
                                    ?? getPayloadNumber(msg.payload, "amount")
                                    ?? (msg.content ? parseFloat(msg.content.replace(/[^\d.]/g, '')) : undefined);
                                
                                const safeRateValue =
                                    typeof rateValue === "number" && !isNaN(rateValue) ? rateValue : 0;

                                return (
                                    <RateCard
                                        rate={safeRateValue}
                                        isMine={msg.is_mine}
                                        isLatest={msg.id === latestRateProposalId}
                                        conversationId={conversationId}
                                        messageId={msg.id}
                                        status={isConversationLocked ? "rejected" : (statusMap.get(msg.id) || "pending")}
                                        locked={isConversationLocked}
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
                                    status={isConversationLocked ? "rejected" : (statusMap.get(msg.id) || "pending")}
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


                            {!isTimelineEvent && (
                                <span className="flex items-center gap-1 px-1 text-[10px] text-slate-400 opacity-70">
                                    <span>{format(new Date(msg.created_at), "HH:mm")}</span>
                                    {msg.is_mine ? (
                                        <>
                                            <span aria-hidden="true">•</span>
                                            <span>{rawMessage?.read_at ? "Przeczytano" : "Wysłano"}</span>
                                        </>
                                    ) : null}
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
