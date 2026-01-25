
"use client";

import { Button } from "@/components/ui/button";
import { Check, X, CalendarClock } from "lucide-react";
import { useState } from "react";
import { acceptDeadline, rejectDeadline } from "@/app/app/chat/_actions";
import { useTransition } from "react";

export function DeadlineCard({
    deadline,
    isMine,
    isLatest,
    conversationId,
    messageId,
    status = "pending"
}: {
    deadline: string;
    isMine: boolean;
    isLatest: boolean;
    conversationId: string;
    messageId: string;
    status?: "pending" | "accepted" | "rejected";
}) {
    const [pending, startTransition] = useTransition();

    const handleAccept = () => {
        startTransition(async () => {
            try {
                await acceptDeadline(conversationId, messageId, deadline);
            } catch (e) {
                alert("Błąd: " + e);
            }
        });
    };

    const handleReject = () => {
        startTransition(async () => {
            try {
                await rejectDeadline(conversationId, messageId, deadline);
            } catch (e) {
                alert("Błąd: " + e);
            }
        });
    };

    const isInteractive = isLatest && !isMine && status === "pending";

    return (
        <div className={`
      relative p-4 rounded-xl border shadow-sm w-full max-w-[320px] bg-white text-slate-800
      ${isMine ? "border-indigo-100" : "border-slate-200"}
      ${status === 'accepted' ? 'border-emerald-200 bg-emerald-50/30' : ''}
      ${status === 'rejected' ? 'border-red-200 bg-red-50/30 opacity-70' : ''}
    `}>
            <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-md">
                        <CalendarClock className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Propozycja terminu</p>
                        <p className="text-lg font-bold tracking-tight">{deadline}</p>
                    </div>
                </div>
            </div>

            {status === 'accepted' && (
                <div className="text-sm text-emerald-600 font-medium flex items-center gap-1.5 mb-1">
                    <Check className="w-4 h-4" /> Zaakceptowano
                </div>
            )}

            {status === 'rejected' && (
                <div className="text-sm text-red-600 font-medium flex items-center gap-1.5 mb-1">
                    <X className="w-4 h-4" /> Odrzucono
                </div>
            )}

            {isInteractive && (
                <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-slate-100">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleReject}
                        disabled={pending}
                        className="text-red-600 border-red-100 hover:bg-red-50 hover:text-red-700 h-8"
                    >
                        Odrzuć
                    </Button>
                    <Button
                        size="sm"
                        onClick={handleAccept}
                        disabled={pending}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-200 h-8"
                    >
                        {pending ? "..." : "Akceptuj"}
                    </Button>
                </div>
            )}

            {!isInteractive && status === 'pending' && !isMine && !isLatest && (
                <p className="text-xs text-slate-400 italic mt-2">Ta propozycja wygasła.</p>
            )}
            {!isInteractive && status === 'pending' && isMine && (
                <p className="text-xs text-slate-400 italic mt-2">Oczekiwanie na decyzję...</p>
            )}
        </div>
    );
}
