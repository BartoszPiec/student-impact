
"use client";

import { useEffect, useRef, useMemo } from "react";
import { markMessagesAsRead } from "../_actions";
import { normalizeMessage, NormalizedMessage } from "@/app/lib/chat/chatEventUtils";
import { TextBubble } from "../_components/TextBubble";
import { FileBubble } from "../_components/FileBubble";
import { RateCard } from "../_components/RateCard";
import { DeadlineCard } from "../_components/DeadlineCard";
import { SystemEventRow } from "../_components/SystemEventRow";
import { InquiryCard } from "../_components/InquiryCard";
import { format } from "date-fns";
import { pl } from "date-fns/locale";

export function ChatList({
    messages,
    userId,
    conversationId,
}: {
    messages: any[];
    userId: string;
    conversationId: string;
}) {
    const bottomRef = useRef<HTMLDivElement>(null);

    // 1. Normalize messages
    const normalizedMessages = useMemo(() => {
        return messages.map(m => normalizeMessage(m, userId));
    }, [messages, userId]);

    // 2. Identify Latest Proposals
    const statusMap = useMemo(() => {
        const map = new Map<string, "accepted" | "rejected">();
        normalizedMessages.forEach(m => {
            if (m.event === "rate.accepted" || m.event === "deadline.accepted") {
                if (m.payload?.ref_message_id) map.set(m.payload.ref_message_id, "accepted");
            }
            if (m.event === "rate.rejected" || m.event === "deadline.rejected") {
                if (m.payload?.ref_message_id) map.set(m.payload.ref_message_id, "rejected");
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


    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    }, [messages]);

    useEffect(() => {
        const hasUnread = messages.some((m) => !m.read_at && m.sender_id !== userId);
        if (conversationId && hasUnread) {
            markMessagesAsRead(conversationId).catch(console.error);
        }
    }, [conversationId, messages, userId]);

    if (normalizedMessages.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-2">
                <p>Brak wiadomości.</p>
            </div>
        );
    }

    let lastDate = "";

    return (
        <div className="flex flex-col gap-6 py-6 pb-4">
            {normalizedMessages.map((msg, index) => {
                const dateKey = new Date(msg.created_at).toDateString();
                const showDate = dateKey !== lastDate;
                lastDate = dateKey;

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
                                    name={msg.payload.name}
                                    url={msg.payload.url}
                                    type={msg.payload.type}
                                    isMine={msg.is_mine}
                                />
                            )}

                            {msg.event === "rate.proposed" && (
                                <RateCard
                                    rate={msg.payload.proposed_stawka}
                                    isMine={msg.is_mine}
                                    isLatest={msg.id === latestRateProposalId}
                                    conversationId={conversationId}
                                    messageId={msg.id}
                                    status={statusMap.get(msg.id) || "pending"}
                                />
                            )}

                            {msg.event === "deadline.proposed" && (
                                <DeadlineCard
                                    deadline={msg.payload.proposed_deadline}
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
