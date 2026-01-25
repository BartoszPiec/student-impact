"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Package, Briefcase } from "lucide-react";
import { format } from "date-fns";
import { pl } from "date-fns/locale";
import { openChatForApplication } from "../../chat/_actions";

interface ServicesTabProps {
    systemServices: any[];
    studentServices: any[];
    statsMap: any;
}

export default function ServicesTab({ systemServices, studentServices, statsMap }: ServicesTabProps) {
    if (systemServices.length === 0 && studentServices.length === 0) {
        return (
            <div className="text-sm text-muted-foreground p-12 text-center border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                Nie masz jeszcze zleconych usług.
            </div>
        );
    }

    return (
        <div className="space-y-10">
            {/* System Services Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                <h2 className="text-xl font-bold text-slate-800">Twoje Zlecane Usługi</h2>
            </div>

            {/* System Services List (is_platform_service=true) */}
            {systemServices.length > 0 && (
                <div className="space-y-6">
                    <h3 className="text-xl font-bold text-slate-800 flex items-center gap-3">
                        <div className="p-2 bg-indigo-100 rounded-xl text-indigo-600">
                            <Package className="w-5 h-5" />
                        </div>
                        Usługi Systemowe
                    </h3>
                    <div className="grid grid-cols-1 gap-4">
                        {systemServices.map(offer => {
                            const stats = statsMap[offer.id] || {};
                            const { accepted, acceptedAppId } = stats;
                            const isInProgress = offer.status === "in_progress" || accepted > 0;
                            const chatAction = acceptedAppId ? openChatForApplication.bind(null, acceptedAppId) : null;

                            return (
                                <div key={offer.id} className="group relative bg-white hover:bg-slate-50/50 rounded-3xl border border-slate-200 hover:border-indigo-200 p-1 shadow-sm hover:shadow-lg transition-all duration-300">
                                    <div className="flex flex-col md:flex-row gap-6 p-5 items-center">
                                        {/* Icon/Image Placeholder */}
                                        <div className="h-16 w-16 md:h-20 md:w-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-200 shrink-0">
                                            <Package className="w-8 h-8 md:w-10 md:h-10 opacity-90" />
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 text-center md:text-left space-y-2">
                                            <div className="flex flex-col md:flex-row md:items-center gap-2 justify-center md:justify-start">
                                                <h3 className="font-bold text-xl text-slate-900 group-hover:text-indigo-700 transition-colors">
                                                    {offer.tytul}
                                                </h3>
                                                <Badge className="w-fit mx-auto md:mx-0 bg-indigo-100 text-indigo-700 hover:bg-indigo-200 border-0 uppercase text-[10px] tracking-widest font-bold px-2 py-0.5 rounded-full">
                                                    SYSTEM
                                                </Badge>
                                            </div>

                                            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-sm text-slate-500 font-medium">
                                                <span className="flex items-center gap-1.5 bg-slate-100 px-2 py-1 rounded-lg">
                                                    📅 {format(new Date(offer.created_at), "d MMM yyyy", { locale: pl })}
                                                </span>
                                                <Badge variant="outline" className={offer.status === 'published' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-slate-50 text-slate-600'}>
                                                    {offer.status === 'published' ? 'W Realizacji' : (offer.status === 'closed' ? 'Zakończone' : 'Aktywne')}
                                                </Badge>
                                            </div>
                                        </div>

                                        {/* Right Side Actions */}
                                        <div className="flex flex-col items-center md:items-end gap-3 min-w-[140px]">
                                            <div className="text-right">
                                                <div className="text-2xl font-black text-slate-900 tracking-tight">
                                                    {offer.stawka}<span className="text-sm font-bold text-slate-400 ml-1">PLN</span>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                {isInProgress && acceptedAppId ? (
                                                    <>
                                                        <Button asChild className="h-10 px-6 rounded-xl bg-slate-900 text-white hover:bg-indigo-600 hover:shadow-indigo-200 shadow-lg transition-all font-bold">
                                                            <Link href={`/app/deliverables/${acceptedAppId}`}>
                                                                Panel Realizacji
                                                            </Link>
                                                        </Button>
                                                        {chatAction && (
                                                            <form action={chatAction}>
                                                                <Button variant="outline" size="icon" className="h-10 w-10 rounded-xl border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-600">
                                                                    <Briefcase className="w-4 h-4" />
                                                                </Button>
                                                            </form>
                                                        )}
                                                    </>
                                                ) : (
                                                    <Button asChild variant="outline" className="h-10 px-6 rounded-xl border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 text-slate-600 hover:text-indigo-700 font-bold">
                                                        <Link href={`/app/company/offers/${offer.id}`}>Szczegóły</Link>
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Student Services List */}
            {studentServices.length > 0 && (
                <div className="space-y-6">
                    <h3 className="text-xl font-bold text-slate-800 flex items-center gap-3">
                        <div className="p-2 bg-amber-100 rounded-xl text-amber-600">
                            <Briefcase className="w-5 h-5" />
                        </div>
                        Usługi Zlecone (Studenci)
                    </h3>
                    <div className="grid grid-cols-1 gap-4">
                        {studentServices.map(order => (
                            <div key={order.id} className="group relative bg-white hover:bg-slate-50/50 rounded-3xl border border-slate-200 hover:border-amber-200 p-1 shadow-sm hover:shadow-lg transition-all duration-300">
                                <div className="flex flex-col md:flex-row gap-6 p-5 items-center">
                                    {/* Icon/Image Placeholder */}
                                    <div className="h-16 w-16 md:h-20 md:w-20 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white shadow-lg shadow-amber-200 shrink-0">
                                        <Briefcase className="w-8 h-8 md:w-10 md:h-10 opacity-90" />
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 text-center md:text-left space-y-2">
                                        <div className="flex flex-col md:flex-row md:items-center gap-2 justify-center md:justify-start">
                                            <h3 className="font-bold text-xl text-slate-900 group-hover:text-amber-700 transition-colors">
                                                {order.package?.title || "Zlecenie Indywidualne"}
                                            </h3>
                                            <Badge className="w-fit mx-auto md:mx-0 bg-amber-100 text-amber-700 hover:bg-amber-200 border-0 uppercase text-[10px] tracking-widest font-bold px-2 py-0.5 rounded-full">
                                                STUDENT
                                            </Badge>
                                        </div>

                                        <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-sm text-slate-500 font-medium">
                                            <span className="flex items-center gap-1.5 bg-slate-100 px-2 py-1 rounded-lg">
                                                📅 {format(new Date(order.created_at), "d MMM yyyy", { locale: pl })}
                                            </span>
                                            <Badge variant="outline" className={
                                                ['in_progress', 'accepted'].includes(order.status) ? 'border-emerald-200 bg-emerald-50 text-emerald-700' :
                                                    order.status === 'proposal_sent' ? 'border-indigo-200 bg-indigo-50 text-indigo-700' :
                                                        'border-slate-200 bg-slate-50 text-slate-600'
                                            }>
                                                {order.status === 'in_progress' ? 'W trakcie' : (order.status === 'accepted' ? 'Zaakceptowano' : (order.status === 'proposal_sent' ? 'Negocjacje' : 'Czeka na akceptację'))}
                                            </Badge>
                                        </div>
                                    </div>

                                    {/* Right Side Actions */}
                                    <div className="flex flex-col items-center md:items-end gap-3 min-w-[140px]">
                                        <div className="text-right">
                                            <div className="text-2xl font-black text-slate-900 tracking-tight">
                                                {order.amount ? order.amount : "—"}<span className="text-sm font-bold text-slate-400 ml-1">PLN</span>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <Button asChild className={`h-10 px-6 rounded-xl font-bold shadow-lg transition-all hover:-translate-y-0.5
                                                ${['inquiry', 'proposal_sent'].includes(order.status)
                                                    ? "bg-slate-800 text-white hover:bg-slate-700 hover:shadow-slate-200"
                                                    : "bg-amber-600 hover:bg-amber-700 text-white hover:shadow-amber-200"
                                                }
                                            `}>
                                                <Link href={`/app/deliverables/${order.id}`}>
                                                    {['inquiry', 'proposal_sent'].includes(order.status) ? "Szczegóły" : "Panel Realizacji"}
                                                </Link>
                                            </Button>

                                            <Button asChild variant="ghost" size="icon" className="h-10 w-10 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-xl">
                                                <Link href={`/app/deliverables/${order.id}?tab=chat`}><Briefcase className="w-5 h-5" /></Link>
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
