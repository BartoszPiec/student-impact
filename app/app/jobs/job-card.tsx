"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Building2, Banknote, Clock, Briefcase, Zap, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface JobOffer {
    id: string;
    tytul: string;
    company_id: string;
    company_name?: string;
    company_logo?: string;
    stawka?: string | number;
    salary_range_min?: number;
    salary_range_max?: number;
    location?: string;
    is_remote?: boolean;
    contract_type?: string;
    technologies?: string[];
    typ: string; // "job", "micro", etc.
    category?: string;
    created_at: string;
    is_platform_service?: boolean; // Added
    opis?: string;
    obligations?: string;
}

function money(val: string | number | undefined) {
    if (!val) return null;
    return `${val} zł`;
}

function salary(o: JobOffer) {
    if (o.is_platform_service && o.stawka) return `${o.stawka} zł`; // Exact price for platform services

    // Check if range exists and is valid
    const hasMin = o.salary_range_min != null && o.salary_range_min > 0;
    const hasMax = o.salary_range_max != null && o.salary_range_max > 0;

    if (hasMin && hasMax) {
        if (o.salary_range_min === o.salary_range_max) return `${o.salary_range_min} zł`;
        return `${o.salary_range_min} - ${o.salary_range_max} zł`;
    }

    if (hasMin) return `od ${o.salary_range_min} zł`;
    if (hasMax) return `do ${o.salary_range_max} zł`;

    if (o.stawka) return `${o.stawka} zł`;

    return "Stawka niepodana";
}

function timeAgo(date: string) {
    const d = new Date(date);
    const now = new Date();

    // Compare dates only (reset time to midnight)
    const dDate = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const nDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const diffTime = nDate.getTime() - dDate.getTime();
    const days = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (days === 0) return "Dzisiaj";
    if (days === 1) return "Wczoraj";
    return `${days} dni temu`;
}

export function JobCard({ offer, isApplied }: { offer: JobOffer, isApplied?: boolean }) {
    const isJob = offer.typ === "job" || offer.typ === "Praca" || offer.typ === "praca";
    const isMicro = !isJob;

    return (
        <Card className={cn(
            "transition-all duration-300 group border-none rounded-[2rem] overflow-hidden",
            isApplied
                ? "bg-emerald-50/30 ring-1 ring-emerald-100 shadow-sm"
                : "bg-white hover:shadow-xl hover:shadow-indigo-500/5 ring-1 ring-slate-200/60 hover:ring-indigo-100/50"
        )}>
            <CardContent className="p-6 flex flex-col md:flex-row gap-6 items-start">
                {/* LOGO SECTION */}
                <div className="relative">
                    <div className={cn(
                        "h-14 w-14 rounded-2xl flex items-center justify-center flex-shrink-0 border transition-transform group-hover:scale-105 duration-300",
                        isApplied ? "bg-white border-emerald-100" : "bg-slate-50 border-slate-100 group-hover:border-indigo-100"
                    )}>
                        <Building2 className={cn("h-7 w-7", isApplied ? "text-emerald-500" : "text-slate-400 group-hover:text-indigo-500")} />
                    </div>
                    {isApplied && (
                        <div className="absolute -top-2 -right-2 bg-emerald-500 text-white rounded-full p-1 shadow-lg border-2 border-white">
                            <CheckCircle2 className="h-3 w-3" />
                        </div>
                    )}
                </div>

                {/* CONTENT SECTION */}
                <div className="flex-1 min-w-0 space-y-3">
                    <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                            {isMicro && <Badge variant="secondary" className="text-[10px] h-5 bg-amber-50 text-amber-600 hover:bg-amber-100 border-none px-2 font-bold uppercase tracking-wider tabular-nums"><Zap className="h-3 w-3 mr-1 fill-amber-500" /> Mikrozlecenie</Badge>}
                            {isJob && <Badge variant="secondary" className="text-[10px] h-5 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 border-none px-2 font-bold uppercase tracking-wider tabular-nums"><Briefcase className="h-3 w-3 mr-1 fill-indigo-500" /> Praca</Badge>}
                            {offer.category && <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{offer.category}</span>}
                        </div>

                        <h3 className="font-bold text-xl text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1 leading-tight">
                            {offer.tytul}
                        </h3>

                        <div className="text-sm text-slate-500 font-semibold flex items-center gap-1.5">
                            <span className="text-slate-900">{offer.company_name || "Firma"}</span>
                            <span className="text-slate-300">•</span>
                            <span className="flex items-center gap-1">
                                <Clock className="h-3.5 w-3.5 text-slate-400" />
                                {timeAgo(offer.created_at)}
                            </span>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-x-6 gap-y-2 pt-1">
                        {(offer.location || offer.is_remote) && (
                            <div className="flex items-center gap-1.5 text-sm font-medium text-slate-600 bg-slate-50 px-3 py-1 rounded-full border border-slate-100">
                                <MapPin className="h-4 w-4 text-indigo-500" />
                                {offer.is_remote ? (offer.location ? `Remote • ${offer.location}` : "Remote") : offer.location}
                            </div>
                        )}
                        {offer.contract_type && (
                            <div className="flex items-center gap-1.5 text-sm font-medium text-slate-600 bg-slate-50 px-3 py-1 rounded-full border border-slate-100">
                                <Clock className="h-4 w-4 text-indigo-500" />
                                {offer.contract_type}
                            </div>
                        )}
                    </div>

                    {/* TAGS */}
                    {offer.technologies && offer.technologies.length > 0 && (
                        <div className="flex flex-wrap gap-2 pt-1">
                            {offer.technologies.slice(0, 5).map(tech => (
                                <span key={tech} className="text-[11px] bg-white text-slate-600 px-2.5 py-1 rounded-lg font-bold border border-slate-100 shadow-sm transition-colors hover:border-indigo-200">
                                    {tech}
                                </span>
                            ))}
                        </div>
                    )}
                </div>

                {/* ACTION SECTION */}
                <div className="flex flex-col gap-4 md:items-end flex-shrink-0 w-full md:w-auto md:min-w-[180px]">
                    <div className="text-right">
                        <div className="text-xl font-extrabold text-slate-900 tabular-nums">
                            {salary(offer)}
                        </div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            {isJob ? "Wynagrodzenie m-c" : "Budżet zlecenia"}
                        </div>
                    </div>

                    <div className="flex flex-col gap-2 w-full">
                        {isApplied ? (
                            <Button asChild className="w-full font-bold shadow-md transition-all bg-white text-emerald-600 hover:bg-emerald-50 border border-emerald-100 rounded-xl h-11">
                                <Link href={`/app/offers/${offer.id}`}>
                                    Zobacz zgłoszenie
                                </Link>
                            </Button>
                        ) : (
                            <Button asChild className={cn(
                                "w-full font-bold shadow-lg transition-all rounded-xl h-11 border-none",
                                isMicro
                                    ? "bg-amber-500 hover:bg-amber-600 text-white shadow-amber-200"
                                    : "gradient-primary text-white shadow-indigo-200"
                            )}>
                                <Link href={`/app/offers/${offer.id}`}>
                                    Aplikuj teraz →
                                </Link>
                            </Button>
                        )}
                        {isApplied && (
                            <div className="flex items-center justify-center gap-1.5 text-[11px] text-emerald-600 font-bold bg-emerald-50 py-1 rounded-lg">
                                <CheckCircle2 className="h-3 w-3" /> Już aplikowałeś
                            </div>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
