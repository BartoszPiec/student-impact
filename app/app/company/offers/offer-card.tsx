"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Briefcase, Zap, MapPin, Users, CalendarClock, MessageSquare } from "lucide-react";
import CopyOfferLinkButton from "@/components/copy-offer-link-button";
import { cn } from "@/lib/utils";
import { setOfferStatus } from "./_actions";
import { openChatForApplication } from "../../chat/_actions";

function StatusBadge({ status, hasDelivered }: { status: string; hasDelivered?: boolean }) {
    if (hasDelivered)
        return (
            <Badge className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border-indigo-200 px-3 py-1 rounded-full font-bold transition-colors">
                Weryfikacja
            </Badge>
        );
    if (status === "negotiation")
        return (
            <Badge className="bg-orange-50 text-orange-700 hover:bg-orange-100 border-orange-200 px-3 py-1 rounded-full font-bold transition-colors">
                Negocjacje
            </Badge>
        );
    if (status === "published")
        return (
            <Badge
                variant="secondary"
                className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-100 px-3 py-1 rounded-full font-bold transition-colors"
            >
                Opublikowane
            </Badge>
        );
    if (status === "in_progress")
        return (
            <Badge
                variant="secondary"
                className="bg-amber-50 text-amber-700 hover:bg-amber-100 border-amber-100 animate-pulse px-3 py-1 rounded-full font-bold"
            >
                W realizacji
            </Badge>
        );
    if (status === "closed")
        return (
            <Badge
                variant="secondary"
                className="bg-slate-50 text-slate-500 hover:bg-slate-100 border-slate-200 px-3 py-1 rounded-full font-bold transition-colors"
            >
                Zakończone
            </Badge>
        );
    return <Badge variant="outline" className="rounded-full px-3 py-1">{status}</Badge>;
}

function formatDate(value?: string | null) {
    if (!value) return "";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "";
    return d.toLocaleDateString("pl-PL", { year: "numeric", month: "long", day: "numeric" });
}

export default function OfferCard({
    o,
    stats
}: {
    o: any,
    stats: { total: number, sent: number, accepted: number, hasApproved: boolean, hasDelivered?: boolean, acceptedAppId: string | null, acceptedProfile?: { first_name: string, last_name: string, id: string } | null, acceptedStudentId?: string | null, agreedStawka?: number | null, contractStatus?: string | null }
}) {
    const { total, sent, accepted, hasApproved, hasDelivered, acceptedAppId, acceptedProfile, acceptedStudentId, agreedStawka } = stats;

    const isJobOffer = o.typ === "job" || o.typ === "Praca" || o.typ === "praca";
    const isClosed = o.status === "closed";
    const isInProgress = (o.status === "in_progress" || accepted > 0) && !isClosed;

    // Oblicz efektywny status na podstawie stanu aplikacji (nie tylko offers.status z bazy)
    const effectiveStatus = isClosed
        ? "closed"
        : (accepted > 0 && stats.contractStatus === 'draft')
            ? "negotiation"
            : accepted > 0
                ? "in_progress"
                : (o.status ?? "published");

    const chatAction = acceptedAppId ? openChatForApplication.bind(null, acceptedAppId) : null;

    return (
        <Card className="hover:shadow-xl transition-all duration-500 border-transparent bg-white group rounded-3xl overflow-hidden shadow-sm hover:border-indigo-100/50 hover:-translate-y-1">
            <CardContent className="p-0">
                <div className="flex flex-col md:flex-row gap-0">
                    {/* Left Color Strip based on type */}
                    <div className={cn(
                        "w-full md:w-2 md:h-initial h-2 shrink-0 transition-colors duration-500",
                        isJobOffer ? "bg-indigo-500 group-hover:bg-indigo-600" : "bg-amber-500 group-hover:bg-amber-600"
                    )} />

                    <div className="flex flex-col md:flex-row flex-1 p-6 justify-between gap-6 items-start md:items-center">
                        {/* Title & Info */}
                        <div className="space-y-4 flex-1 w-full">
                            <div className="flex items-center gap-3 flex-wrap">
                                <Link
                                    href={`/app/company/offers/${o.id}`}
                                    className="font-extrabold text-xl text-slate-900 hover:text-indigo-600 transition-colors line-clamp-2 leading-tight"
                                >
                                    {o.tytul}
                                </Link>
                                <StatusBadge status={effectiveStatus} hasDelivered={hasDelivered} />
                            </div>

                            <div className="flex flex-wrap items-center gap-y-2 gap-x-6 text-sm">
                                <div className="flex items-center gap-2 text-slate-500 font-medium bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
                                    <CalendarClock className="w-4 h-4 text-indigo-500" />
                                    <span>{formatDate(o.created_at)}</span>
                                </div>

                                {acceptedProfile ? (
                                    <Link
                                        href={`/app/students/${acceptedProfile.id}`}
                                        className="flex items-center gap-2 text-indigo-700 font-bold bg-indigo-50/50 px-3 py-1.5 rounded-xl border border-indigo-100/50 hover:bg-indigo-100 transition-all"
                                    >
                                        <Users className="w-4 h-4 text-indigo-600" />
                                        <span>{acceptedProfile.first_name}</span>
                                    </Link>
                                ) : (
                                    <div className="flex items-center gap-2 text-slate-400 font-medium bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100 italic">
                                        <Users className="w-4 h-4" />
                                        <span>Czeka na studenta</span>
                                    </div>
                                )}

                                <div className="flex items-center gap-2 text-slate-600 font-bold">
                                    <Zap className="w-4 h-4 text-amber-500" />
                                    <span>{total} <span className="font-medium text-slate-400">aplikacji</span></span>
                                </div>
                            </div>
                        </div>

                        {/* Price & Actions */}
                        <div className="flex flex-col md:items-end items-start gap-4">
                            <div className="flex flex-col md:items-end">
                                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">
                                    {isInProgress && agreedStawka ? "Uzgodniona stawka" : "Budżet / Wynagrodzenie"}
                                </span>
                                <div className="font-black text-2xl text-slate-900">
                                    {/* Show agreed rate when in progress, otherwise show original offer rate */}
                                    {isInProgress && agreedStawka ? (
                                        <span>{agreedStawka} <span className="text-sm font-bold text-slate-400">PLN</span></span>
                                    ) : isJobOffer ? (
                                        (o.salary_range_min && o.salary_range_min > 0) ? (
                                            <span className="flex items-baseline gap-1">
                                                {o.salary_range_min}
                                                <span className="text-sm font-bold text-slate-400">{o.salary_range_max ? `- ${o.salary_range_max}` : "+"} PLN</span>
                                            </span>
                                        ) : (o.stawka && o.stawka > 0) ? (
                                            <span>{o.stawka} <span className="text-sm font-bold text-slate-400">PLN</span></span>
                                        ) : <span className="text-slate-300">N/A</span>
                                    ) : (
                                        o.stawka ? (
                                            <span>{o.stawka} <span className="text-sm font-bold text-slate-400">PLN</span></span>
                                        ) : <span className="text-slate-300">N/A</span>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center gap-2 w-full md:w-auto mt-2">
                                {isInProgress && acceptedAppId ? (
                                    <>
                                        <Button asChild className="h-10 rounded-xl bg-slate-900 hover:bg-black text-white px-5 font-bold shadow-lg shadow-slate-200">
                                            <Link href={`/app/deliverables/${acceptedAppId}`}>Zarządzaj</Link>
                                        </Button>
                                        <form action={chatAction!}>
                                            <Button variant="outline" size="icon" className="h-10 w-10 rounded-xl border-slate-200 text-slate-600 hover:bg-slate-50 transition-all">
                                                <MessageSquare className="w-4.5 h-4.5" />
                                            </Button>
                                        </form>
                                    </>
                                ) : (
                                    <Button asChild variant="outline" className="h-10 rounded-xl border-indigo-100 text-indigo-700 font-bold hover:bg-indigo-50/50 hover:border-indigo-200 transition-all px-6">
                                        <Link href={`/app/company/offers/${o.id}`}>Szczegóły</Link>
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
