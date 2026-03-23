"use client";

import { useState } from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { pl } from "date-fns/locale";
import { Bell, MessageSquare, Briefcase, FileText, Inbox, Sparkles, Filter, CircleDollarSign, CheckCircle2, XCircle, Star, Ban } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { getNotificationTitle } from "./utils";

interface NotificationListProps {
    notifications: any[];
}

function NotificationIcon({ type }: { type: string }) {
    switch (type) {
        // Wiadomości
        case "message_new":
        case "MESSAGE":
        case "new_message":
            return (
                <div className="bg-indigo-100 text-indigo-600 p-2.5 rounded-xl group-hover:bg-indigo-600 group-hover:text-white transition-colors duration-300">
                    <MessageSquare className="w-5 h-5" />
                </div>
            );
        // Zgłoszenia / aplikacje
        case "application_status_change":
        case "application_new":
        case "application_sent":
        case "application_accepted":
        case "application_accepted_auto":
        case "application_countered":
        case "counter_offer":
        case "application_withdrawn":
        case "offer_closed":
        case "negotiation_proposed":
        case "counter_accepted":
        case "counter_rejected":
        case "terms_proposed":
        case "terms_updated":
        case "terms_agreed":
            return (
                <div className="bg-amber-100 text-amber-600 p-2.5 rounded-xl group-hover:bg-amber-500 group-hover:text-white transition-colors duration-300">
                    <Briefcase className="w-5 h-5" />
                </div>
            );
        // Finansowanie escrow
        case "escrow_funded":
        case "contract_funded":
            return (
                <div className="bg-emerald-100 text-emerald-600 p-2.5 rounded-xl group-hover:bg-emerald-500 group-hover:text-white transition-colors duration-300">
                    <CircleDollarSign className="w-5 h-5" />
                </div>
            );
        // Przesłanie pracy
        case "deliverable_new":
        case "deliverable_submitted":
        case "milestone_submitted":
        case "milestone_delivered":
            return (
                <div className="bg-blue-100 text-blue-600 p-2.5 rounded-xl group-hover:bg-blue-500 group-hover:text-white transition-colors duration-300">
                    <FileText className="w-5 h-5" />
                </div>
            );
        // Zaakceptowanie
        case "deliverable_accepted":
        case "milestone_accepted":
        case "job_approved":
            return (
                <div className="bg-emerald-100 text-emerald-600 p-2.5 rounded-xl group-hover:bg-emerald-500 group-hover:text-white transition-colors duration-300">
                    <CheckCircle2 className="w-5 h-5" />
                </div>
            );
        // Odrzucenie
        case "deliverable_rejected":
        case "milestone_rejected":
            return (
                <div className="bg-red-100 text-red-600 p-2.5 rounded-xl group-hover:bg-red-500 group-hover:text-white transition-colors duration-300">
                    <XCircle className="w-5 h-5" />
                </div>
            );
        // Oceny
        case "review_received":
        case "review_submitted":
            return (
                <div className="bg-purple-100 text-purple-600 p-2.5 rounded-xl group-hover:bg-purple-500 group-hover:text-white transition-colors duration-300">
                    <Star className="w-5 h-5" />
                </div>
            );
        // Anulowanie
        case "cooperation_cancelled":
            return (
                <div className="bg-red-100 text-red-500 p-2.5 rounded-xl group-hover:bg-red-500 group-hover:text-white transition-colors duration-300">
                    <Ban className="w-5 h-5" />
                </div>
            );
        default:
            return (
                <div className="bg-slate-100 text-slate-500 p-2.5 rounded-xl group-hover:bg-slate-600 group-hover:text-white transition-colors duration-300">
                    <Bell className="w-5 h-5" />
                </div>
            );
    }
}

function formatDateRelative(date: Date) {
    return formatDistanceToNow(date, { addSuffix: true, locale: pl });
}

export default function NotificationList({ notifications }: NotificationListProps) {
    const [filter, setFilter] = useState<"all" | "unread" | "messages" | "orders">("all");

    const MESSAGE_TYPES = ["message_new", "MESSAGE", "new_message"];
    const ORDER_TYPES = [
        "application_status_change", "application_new", "application_sent",
        "application_accepted", "application_accepted_auto", "application_rejected",
        "application_countered", "application_withdrawn", "counter_offer",
        "counter_accepted", "counter_rejected", "negotiation_proposed",
        "offer_closed", "terms_proposed", "terms_updated", "terms_agreed",
        "escrow_funded", "contract_funded", "deliverable_new", "deliverable_submitted",
        "deliverable_accepted", "deliverable_rejected",
        "milestone_submitted", "milestone_delivered", "milestone_accepted", "milestone_rejected",
        "review_received", "review_submitted", "cooperation_cancelled", "JOB_COMPLETED", "job_approved",
    ];

    const filteredList = notifications.filter((n) => {
        if (filter === "unread") return !n.read_at;
        if (filter === "messages") return MESSAGE_TYPES.includes(n.typ);
        if (filter === "orders") return ORDER_TYPES.includes(n.typ);
        return true;
    });

    const unreadCount = notifications.filter(n => !n.read_at).length;
    const messageCount = notifications.filter(n => MESSAGE_TYPES.includes(n.typ)).length;
    const ordersCount = notifications.filter(n => ORDER_TYPES.includes(n.typ)).length;

    return (
        <div className="space-y-6">
            {/* FILTERS */}
            <div className="flex flex-wrap gap-2">
                <button
                    onClick={() => setFilter("all")}
                    className={cn(
                        "px-4 py-2 rounded-xl text-sm font-bold transition-all border",
                        filter === "all"
                            ? "bg-slate-900 text-white border-slate-900 shadow-lg shadow-slate-900/20"
                            : "bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                    )}
                >
                    Wszystkie <span className="ml-1 opacity-60 text-xs">{notifications.length}</span>
                </button>
                <button
                    onClick={() => setFilter("unread")}
                    className={cn(
                        "px-4 py-2 rounded-xl text-sm font-bold transition-all border",
                        filter === "unread"
                            ? "bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-600/20"
                            : "bg-white text-slate-600 border-slate-200 hover:border-indigo-200 hover:text-indigo-600 hover:bg-indigo-50"
                    )}
                >
                    Nieprzeczytane <span className="ml-1 opacity-60 text-xs">{unreadCount}</span>
                </button>
                <button
                    onClick={() => setFilter("messages")}
                    className={cn(
                        "px-4 py-2 rounded-xl text-sm font-bold transition-all border",
                        filter === "messages"
                            ? "bg-indigo-500 text-white border-indigo-500 shadow-lg shadow-indigo-500/20"
                            : "bg-white text-slate-600 border-slate-200 hover:border-indigo-200 hover:text-indigo-600 hover:bg-indigo-50"
                    )}
                >
                    Wiadomości <span className="ml-1 opacity-60 text-xs">{messageCount}</span>
                </button>
                <button
                    onClick={() => setFilter("orders")}
                    className={cn(
                        "px-4 py-2 rounded-xl text-sm font-bold transition-all border",
                        filter === "orders"
                            ? "bg-emerald-600 text-white border-emerald-600 shadow-lg shadow-emerald-600/20"
                            : "bg-white text-slate-600 border-slate-200 hover:border-emerald-200 hover:text-emerald-600 hover:bg-emerald-50"
                    )}
                >
                    Zlecenia <span className="ml-1 opacity-60 text-xs">{ordersCount}</span>
                </button>
            </div>

            {/* LIST */}
            {filteredList.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 bg-white rounded-[2.5rem] border border-dashed border-slate-200 text-center animate-in fade-in zoom-in-95 duration-300">
                    <div className="w-16 h-16 bg-slate-50 rounded-[1.5rem] flex items-center justify-center mb-4 border border-slate-100">
                        <Filter className="w-8 h-8 text-slate-300" />
                    </div>
                    <h3 className="text-lg font-black text-slate-900 mb-1">Brak powiadomień</h3>
                    <p className="text-slate-500 font-medium text-sm">
                        Brak wyników dla wybranego filtra.
                    </p>
                </div>
            ) : (
                <div className="grid gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="flex items-center gap-2 mb-1 px-2">
                        <Sparkles className="w-4 h-4 text-slate-400" />
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                            {filter === 'all' ? 'Wszystkie powiadomienia' :
                                filter === 'unread' ? 'Nieprzeczytane' :
                                    filter === 'messages' ? 'Wiadomości' : 'Statusy Zleceń'}
                        </span>
                    </div>
                    {filteredList.map((notification) => {
                        const isRead = !!notification.read_at;
                        const created = new Date(notification.created_at);

                        // Link logic:
                        let href = "/app/notifications"; // Fallback
                        if (notification.payload?.conversation_id) href = `/app/chat/${notification.payload.conversation_id}`;
                        else if (notification.payload?.application_id) href = `/app/deliverables/${notification.payload.application_id}`;
                        else if (notification.payload?.contract_id) href = `/app/deliverables/${notification.payload.contract_id}`;

                        return (
                            <Link
                                key={notification.id}
                                href={href}
                                className={`group block p-5 rounded-[1.5rem] bg-white border transition-all duration-300 overflow-hidden relative ${!isRead
                                        ? "border-indigo-100 shadow-lg shadow-indigo-100/20 ring-1 ring-indigo-50 z-10"
                                        : "border-slate-100 shadow-sm hover:shadow-md hover:border-indigo-100 hover:z-10"
                                    }`}
                            >
                                <div className="flex gap-5 items-start relative z-10">
                                    <div className="shrink-0">
                                        <NotificationIcon type={notification.typ} />
                                    </div>
                                    <div className="flex-1 min-w-0 pt-1">
                                        <div className="flex justify-between items-start gap-4">
                                            <h4 className={`text-sm leading-tight transition-colors ${!isRead ? "font-black text-slate-900" : "font-bold text-slate-700 group-hover:text-indigo-900"}`}>
                                                {getNotificationTitle(notification)}
                                            </h4>
                                            <div className="flex flex-col items-end gap-1.5 shrink-0">
                                                {!isRead && (
                                                    <span className="relative flex h-2.5 w-2.5">
                                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                                                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-indigo-500"></span>
                                                    </span>
                                                )}
                                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                                                    {formatDateRelative(created)}
                                                </div>
                                            </div>
                                        </div>
                                        <p className={`text-sm mt-1.5 line-clamp-2 leading-relaxed ${!isRead ? "text-slate-600 font-medium" : "text-slate-500"}`}>
                                            {notification.payload?.snippet || "Kliknij, aby zobaczyć szczegóły powiadomienia."}
                                        </p>
                                    </div>
                                </div>
                                <div className="absolute inset-0 bg-gradient-to-r from-indigo-50/0 via-indigo-50/0 to-indigo-50/30 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                            </Link>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
