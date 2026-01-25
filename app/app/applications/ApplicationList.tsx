"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Briefcase, Zap, CheckCircle2, Clock, AlertCircle, XCircle, FileText, MessageSquare, Bookmark } from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { openChatForApplication } from "@/app/app/chat/_actions";
import { acceptCounterAsStudent, withdrawApplication, removeSavedOffer } from "./_actions";
import { WithdrawApplicationButton } from "./withdraw-button";

import { cn } from "@/lib/utils";

// Helpers
function formatMoney(v?: number | null) {
    if (v == null) return "—";
    return `${v} PLN`;
}

function formatDate(value?: string | null) {
    if (!value) return "";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "";
    return d.toLocaleDateString("pl-PL", { day: 'numeric', month: 'long', year: 'numeric' });
}

function StatusBadge({ status, stage }: { status: string, stage: string }) {
    if (stage === "done")
        return <Badge className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-200 px-3 py-1 rounded-full font-bold gap-1.5"><CheckCircle2 className="w-3.5 h-3.5" /> Zakończone</Badge>;
    if (stage === "in_progress")
        return <Badge className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border-indigo-200 px-3 py-1 rounded-full font-bold gap-1.5 animate-pulse"><Clock className="w-3.5 h-3.5" /> W realizacji</Badge>;
    if (status === "countered")
        return <Badge className="bg-amber-50 text-amber-700 hover:bg-amber-100 border-amber-200 px-3 py-1 rounded-full font-bold gap-1.5"><AlertCircle className="w-3.5 h-3.5" /> Negocjacje</Badge>;
    if (status === "rejected")
        return <Badge variant="outline" className="text-slate-500 border-slate-200 px-3 py-1 rounded-full font-bold gap-1.5 bg-slate-50"><XCircle className="w-3.5 h-3.5" /> Odrzucone</Badge>;
    if (stage === "cancelled")
        return <Badge variant="outline" className="text-slate-400 border-slate-200 px-3 py-1 rounded-full font-bold gap-1.5 bg-slate-50/50 italic opacity-60"><XCircle className="w-3.5 h-3.5" /> Anulowane</Badge>;

    return <Badge variant="outline" className="text-indigo-600 border-indigo-100 px-3 py-1 rounded-full font-bold gap-1.5 bg-indigo-50/30 font-medium"><FileText className="w-3.5 h-3.5" /> Wysłane</Badge>;
}

function ApplicationCard({ app }: { app: any }) {
    const { offer, stage } = app;
    const isCountered = stage === "countered";
    const isInProgress = stage === "in_progress";

    // Updated type check for consistent coloring
    const isJobOffer = offer?.typ === "job" || offer?.typ === "Praca" || offer?.typ === "praca";

    return (
        <Card className="hover:shadow-xl transition-all duration-500 border-transparent bg-white group rounded-3xl overflow-hidden shadow-sm hover:border-indigo-100/50 hover:-translate-y-1">
            <CardContent className="p-0">
                <div className="flex flex-col md:flex-row gap-0">
                    {/* Visual indicator strip */}
                    <div className={cn(
                        "w-full md:w-2 md:h-initial h-2 shrink-0 transition-colors duration-500",
                        isJobOffer ? "bg-indigo-500 group-hover:bg-indigo-600" : "bg-amber-500 group-hover:bg-amber-600"
                    )} />

                    <div className="flex flex-col md:flex-row flex-1 p-6 justify-between gap-6 items-start md:items-center">
                        {/* Title & Info */}
                        <div className="space-y-4 flex-1 w-full">
                            <div className="flex items-center gap-3 flex-wrap">
                                <h3 className="font-extrabold text-xl text-slate-900 leading-tight">
                                    {offer?.tytul ?? "Nieznana Oferta"}
                                </h3>
                                <StatusBadge status={app.status} stage={stage} />
                            </div>

                            <div className="flex flex-wrap items-center gap-y-2 gap-x-6 text-sm">
                                <div className="flex items-center gap-2 text-slate-500 font-medium bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
                                    <Clock className="w-4 h-4 text-indigo-500" />
                                    <span>Złożono: {formatDate(app.created_at)}</span>
                                </div>

                                <div className="flex items-center gap-2 text-slate-400 font-bold bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
                                    <span className="uppercase tracking-tight text-[10px]">ID: {app.id.slice(0, 8)}</span>
                                </div>

                                {offer?.typ && (
                                    <Badge variant="outline" className="text-[10px] font-black uppercase tracking-widest bg-slate-50 border-slate-200 rounded-lg px-2 py-1">
                                        {offer.typ}
                                    </Badge>
                                )}
                            </div>

                            {app.message_to_company && (
                                <div className="relative p-4 bg-indigo-50/10 border border-indigo-100/30 rounded-2xl text-sm italic text-slate-600 leading-relaxed max-w-2xl">
                                    <MessageSquare className="absolute -top-3 -right-3 h-8 w-8 text-indigo-100 opacity-50" />
                                    <span className="font-bold text-indigo-900 not-italic block text-[10px] uppercase tracking-widest mb-1">Twoja notatka:</span>
                                    "{app.message_to_company}"
                                </div>
                            )}
                        </div>

                        {/* Price & Actions */}
                        <div className="flex flex-col md:items-end items-start gap-4">
                            <div className="flex flex-col md:items-end">
                                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Stawka / Budżet</span>
                                <div className="font-black text-2xl text-slate-900 flex flex-col md:items-end gap-1">
                                    {app.agreed_stawka ? (
                                        <span className="text-emerald-600">{formatMoney(app.agreed_stawka)}</span>
                                    ) : app.counter_stawka ? (
                                        <span className="text-amber-600">{formatMoney(app.counter_stawka)}</span>
                                    ) : app.proposed_stawka ? (
                                        <span className="text-indigo-600">{formatMoney(app.proposed_stawka)}</span>
                                    ) : (
                                        <span>{formatMoney(offer?.stawka)}</span>
                                    )}
                                    {isCountered && app.counter_stawka && (
                                        <span className="text-[10px] text-slate-400 font-medium">Propozycja firmy</span>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center gap-2 w-full md:w-auto mt-2">
                                {isInProgress ? (
                                    <>
                                        <Button asChild className="h-10 rounded-xl bg-slate-900 hover:bg-black text-white px-5 font-bold shadow-lg shadow-slate-200">
                                            <Link href={`/app/deliverables/${app.id}`}>Zarządzaj</Link>
                                        </Button>
                                        <form action={openChatForApplication.bind(null, app.id)}>
                                            <Button variant="outline" size="icon" className="h-10 w-10 rounded-xl border-slate-200 text-slate-600 hover:bg-slate-50 transition-all">
                                                <MessageSquare className="w-4.5 h-4.5" />
                                            </Button>
                                        </form>
                                    </>
                                ) : isCountered ? (
                                    <div className="flex flex-col md:items-end gap-2 w-full md:w-auto">
                                        <div className="flex items-center gap-2">
                                            <form action={acceptCounterAsStudent.bind(null, app.id)}>
                                                <Button className="h-10 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-4 font-bold shadow-lg shadow-emerald-100">
                                                    Akceptuj
                                                </Button>
                                            </form>
                                            <form action={openChatForApplication.bind(null, app.id)}>
                                                <Button variant="outline" size="icon" className="h-10 w-10 rounded-xl border-slate-200 text-slate-600 hover:bg-slate-50 transition-all">
                                                    <MessageSquare className="w-4.5 h-4.5" />
                                                </Button>
                                            </form>
                                        </div>
                                        <div className="w-full md:w-auto">
                                            <WithdrawApplicationButton applicationId={app.id} />
                                        </div>
                                    </div>
                                ) : stage === "sent" ? (
                                    <>
                                        <Button asChild variant="outline" className="h-10 rounded-xl border-indigo-100 text-indigo-700 font-bold hover:bg-indigo-50/50 hover:border-indigo-200 transition-all px-6">
                                            <Link href={`/app/offers/${offer?.id}`}>Szczegóły</Link>
                                        </Button>
                                        <form action={openChatForApplication.bind(null, app.id)}>
                                            <Button variant="outline" size="icon" className="h-10 w-10 rounded-xl border-slate-200 text-slate-600 hover:bg-slate-50">
                                                <MessageSquare className="w-4.5 h-4.5" />
                                            </Button>
                                        </form>
                                    </>
                                ) : (
                                    <Button asChild variant="outline" className="h-10 rounded-xl border-slate-200 text-slate-600 font-bold hover:bg-slate-50 px-6">
                                        <Link href={`/app/offers/${offer?.id}`}>Szczegóły</Link>
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

function SavedOfferCard({ offer }: { offer: any }) {
    const isJobOffer = offer?.typ === "job" || offer?.typ === "Praca" || offer?.typ === "praca";

    return (
        <Card className="hover:shadow-xl transition-all duration-500 border-transparent bg-white group rounded-3xl overflow-hidden shadow-sm hover:border-indigo-100/50 hover:-translate-y-1">
            <CardContent className="p-0">
                <div className="flex flex-col md:flex-row gap-0">
                    {/* Visual indicator strip */}
                    <div className={cn(
                        "w-full md:w-2 md:h-initial h-2 shrink-0 transition-colors duration-500",
                        isJobOffer ? "bg-indigo-500 group-hover:bg-indigo-600" : "bg-amber-500 group-hover:bg-amber-600"
                    )} />

                    <div className="flex flex-col md:flex-row flex-1 p-6 justify-between gap-6 items-start md:items-center">
                        {/* Title & Info */}
                        <div className="space-y-3 flex-1 w-full">
                            <div className="flex items-center gap-3 flex-wrap">
                                <h3 className="font-extrabold text-xl text-slate-900 leading-tight">
                                    {offer?.tytul ?? "Nieznana Oferta"}
                                </h3>
                                <Badge className="bg-amber-50 text-amber-600 border-amber-100 rounded-full px-3 py-1 font-bold gap-1.5 shrink-0 shadow-sm shadow-amber-50">
                                    <Bookmark className="w-3.5 h-3.5" /> Zapisane
                                </Badge>
                            </div>
                            <p className="text-sm text-slate-500 line-clamp-1 leading-relaxed font-medium max-w-2xl">{offer?.opis}</p>

                            {offer?.typ && (
                                <Badge variant="outline" className="text-[10px] font-black uppercase tracking-widest bg-slate-50 border-slate-200 rounded-lg px-2">
                                    {offer.typ}
                                </Badge>
                            )}
                        </div>

                        {/* Price & Actions */}
                        <div className="flex flex-col md:items-end items-start gap-4">
                            <div className="flex flex-col md:items-end">
                                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Stawka</span>
                                <div className="font-black text-2xl text-slate-900">
                                    {formatMoney(offer?.stawka)}
                                </div>
                            </div>

                            <div className="flex items-center gap-2 w-full md:w-auto mt-2">
                                <Button asChild variant="outline" className="h-10 rounded-xl border-indigo-100 text-indigo-700 font-bold hover:bg-indigo-50/50 hover:border-indigo-200 transition-all px-6">
                                    <Link href={`/app/offers/${offer?.id}`}>Pokaż ofertę</Link>
                                </Button>
                                <form action={removeSavedOffer.bind(null, offer?.id)}>
                                    <Button variant="ghost" className="h-10 rounded-xl text-red-500 hover:bg-red-50 hover:text-red-600 font-bold px-4">
                                        Usuń
                                    </Button>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

// Internal reusable filter component
function ClientApplicationFilter({ items, type }: { items: any[], type: 'application' | 'saved' }) {
    const [filter, setFilter] = useState<'all' | 'micro' | 'standard'>('all');

    const getOffer = (item: any) => type === 'saved' ? item.offer : item.offer;

    const isMicroOffer = (offer: any) => {
        const t = (offer?.typ || "").toLowerCase();
        return offer?.is_platform_service || t.includes('micro') || t.includes('mikro') || t.includes('projekt');
    };

    const micro = items.filter(a => isMicroOffer(getOffer(a)));
    const standard = items.filter(a => !isMicroOffer(getOffer(a)));

    const displayed = filter === 'all' ? items : filter === 'micro' ? micro : standard;

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-white/50 backdrop-blur-sm border border-slate-200 rounded-3xl shadow-sm">
                <div className="flex items-center gap-3 ml-2">
                    <div className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse" />
                    <span className="text-xs font-black uppercase text-slate-400 tracking-widest">Filtruj zestawienie</span>
                </div>

                <div className="flex bg-slate-100/80 p-1.5 rounded-2xl border border-slate-200/50">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setFilter('all')}
                        className={cn(
                            "text-xs px-5 h-9 rounded-xl font-bold transition-all duration-300",
                            filter === 'all' ? "bg-white text-indigo-700 shadow-md ring-1 ring-slate-200" : "text-slate-500 hover:text-slate-700"
                        )}
                    >
                        Wszystkie ({items.length})
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setFilter('standard')}
                        className={cn(
                            "text-xs px-5 h-9 rounded-xl font-bold gap-2 transition-all duration-300",
                            filter === 'standard' ? "bg-white text-indigo-700 shadow-md ring-1 ring-slate-200" : "text-slate-500 hover:text-slate-700"
                        )}
                    >
                        <Briefcase className="w-3.5 h-3.5" /> Praca ({standard.length})
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setFilter('micro')}
                        className={cn(
                            "text-xs px-5 h-9 rounded-xl font-bold gap-2 transition-all duration-300",
                            filter === 'micro' ? "bg-white text-indigo-700 shadow-md ring-1 ring-slate-200" : "text-slate-500 hover:text-slate-700"
                        )}
                    >
                        <Zap className="w-3.5 h-3.5" /> Mikrozlecenia ({micro.length})
                    </Button>
                </div>
            </div>

            {displayed.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 bg-slate-50/50 border-2 border-dashed border-slate-200 rounded-[2.5rem] text-center">
                    <div className="h-16 w-16 bg-white rounded-2xl flex items-center justify-center border border-slate-100 shadow-xl mb-6">
                        <FileText className="h-8 w-8 text-slate-300" />
                    </div>
                    <h4 className="text-lg font-bold text-slate-800 mb-2">Brak wyników</h4>
                    <p className="text-slate-400 text-sm max-w-xs mx-auto">Spróbuj zmienić parametry filtrowania lub powróć do widoku wszystkich aktywności.</p>
                </div>
            ) : (
                <div className="grid gap-6">
                    {displayed.map((item) => (
                        type === 'saved'
                            ? <SavedOfferCard key={item.offer?.id || Math.random()} offer={item.offer} />
                            : <ApplicationCard key={item.id} app={item} />
                    ))}
                </div>
            )}
        </div>
    );
}

export function ApplicationList({ items }: { items: any[] }) {
    return <ClientApplicationFilter items={items} type="application" />;
}

export function SavedList({ items }: { items: any[] }) {
    return <ClientApplicationFilter items={items} type="saved" />;
}
