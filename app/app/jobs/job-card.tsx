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
    const offerType = offer.typ.toLocaleLowerCase("pl-PL");
    const isJob = offerType.includes("job") || offerType.includes("praca") || offerType.includes("staż") || offerType.includes("staż");
    const isMicro = !isJob;

    return (
        <Card className={cn(
            "group overflow-hidden rounded-2xl border-none transition-all duration-300 sm:rounded-[2rem]",
            isApplied
                ? "bg-emerald-50/30 ring-1 ring-emerald-100 shadow-sm"
                : "bg-white shadow-sm ring-1 ring-slate-200/70 hover:shadow-xl hover:shadow-indigo-500/5 hover:ring-indigo-100/50 sm:shadow-none"
        )}>
            <CardContent className="flex flex-col items-start gap-3 p-4 sm:gap-6 sm:p-6 md:flex-row">
                {/* LOGO SECTION */}
                <div className="flex w-full items-start justify-between gap-3 md:block md:w-auto">
                  <div className="relative">
                    <div className={cn(
                        "flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl border transition-transform duration-300 group-hover:scale-105 sm:h-14 sm:w-14 sm:rounded-2xl",
                        isApplied ? "bg-white border-emerald-100" : "bg-slate-50 border-slate-100 group-hover:border-indigo-100"
                    )}>
                        <Building2 className={cn("h-5 w-5 sm:h-7 sm:w-7", isApplied ? "text-emerald-500" : "text-slate-400 group-hover:text-indigo-500")} />
                    </div>
                    {isApplied && (
                        <div className="absolute -top-2 -right-2 bg-emerald-500 text-white rounded-full p-1 shadow-lg border-2 border-white">
                            <CheckCircle2 className="h-3 w-3" />
                        </div>
                    )}
                  </div>
                  <div className={cn(
                    "rounded-xl px-2.5 py-1.5 text-right md:hidden",
                    isMicro ? "bg-amber-50 text-amber-700" : "bg-indigo-50 text-indigo-700"
                  )}>
                    <div className="flex items-center justify-end gap-1 text-[9px] font-black uppercase tracking-wider opacity-70 sm:text-[10px]">
                      <Banknote className="h-3 w-3" />
                      {isJob ? "Stawka" : "Budżet"}
                    </div>
                    <div className="mt-0.5 max-w-[8rem] truncate text-xs font-black tabular-nums sm:max-w-[9.5rem] sm:text-sm">
                      {salary(offer)}
                    </div>
                  </div>
                </div>

                {/* CONTENT SECTION */}
                <div className="min-w-0 flex-1 space-y-2.5 sm:space-y-3">
                    <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                            {isMicro && <Badge variant="secondary" className="h-5 border-none bg-amber-50 px-2 text-[9px] font-bold uppercase tracking-wider text-amber-600 tabular-nums hover:bg-amber-100 sm:text-[10px]"><Zap className="mr-1 h-3 w-3 fill-amber-500" /> Mikrozlecenie</Badge>}
                            {isJob && <Badge variant="secondary" className="h-5 border-none bg-indigo-50 px-2 text-[9px] font-bold uppercase tracking-wider text-indigo-600 tabular-nums hover:bg-indigo-100 sm:text-[10px]"><Briefcase className="mr-1 h-3 w-3 fill-indigo-500" /> Praca</Badge>}
                            {offer.category && <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400 sm:text-[10px]">{offer.category}</span>}
                        </div>

                        <h3 className="line-clamp-2 text-base font-bold leading-snug text-slate-900 transition-colors group-hover:text-indigo-600 sm:text-xl md:line-clamp-1">
                            {offer.tytul}
                        </h3>

                        <div className="flex flex-wrap items-center gap-1.5 text-xs font-semibold text-slate-500 sm:text-sm">
                            <span className="text-slate-900">{offer.company_name || "Firma"}</span>
                            <span className="text-slate-300">•</span>
                            <span className="flex items-center gap-1">
                                <Clock className="h-3.5 w-3.5 text-slate-400" />
                                {timeAgo(offer.created_at)}
                            </span>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-x-3 gap-y-1.5 pt-0.5 sm:gap-x-6 sm:gap-y-2 sm:pt-1">
                        {(offer.location || offer.is_remote) && (
                            <div className="flex items-center gap-1.5 rounded-full border border-slate-100 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600 sm:px-3 sm:text-sm">
                                <MapPin className="h-3.5 w-3.5 text-indigo-500 sm:h-4 sm:w-4" />
                                {offer.is_remote ? (offer.location ? `Remote • ${offer.location}` : "Remote") : offer.location}
                            </div>
                        )}
                        {offer.contract_type && (
                            <div className="flex items-center gap-1.5 rounded-full border border-slate-100 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600 sm:px-3 sm:text-sm">
                                <Clock className="h-3.5 w-3.5 text-indigo-500 sm:h-4 sm:w-4" />
                                {offer.contract_type}
                            </div>
                        )}
                    </div>

                    {/* TAGS */}
                    {offer.technologies && offer.technologies.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-0.5 sm:gap-2 sm:pt-1">
                            {offer.technologies.slice(0, 5).map(tech => (
                                <span key={tech} className="rounded-md border border-slate-100 bg-white px-2 py-0.5 text-[10px] font-bold text-slate-600 shadow-sm transition-colors hover:border-indigo-200 sm:rounded-lg sm:px-2.5 sm:py-1 sm:text-[11px]">
                                    {tech}
                                </span>
                            ))}
                        </div>
                    )}
                </div>

                {/* ACTION SECTION */}
                <div className="flex w-full flex-shrink-0 flex-col gap-2.5 sm:gap-4 md:w-auto md:min-w-[180px] md:items-end">
                    <div className="hidden text-left md:block md:text-right">
                        <div className="text-xl font-extrabold text-slate-900 tabular-nums">
                            {salary(offer)}
                        </div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            {isJob ? "Wynagrodzenie m-c" : "Budżet zlecenia"}
                        </div>
                    </div>

                    <div className="flex flex-col gap-2 w-full">
                        {isApplied ? (
                            <Button asChild className="h-10 w-full rounded-xl border border-emerald-100 bg-white font-bold text-emerald-600 shadow-md transition-all hover:bg-emerald-50 sm:h-11">
                                <Link href={`/app/offers/${offer.id}`}>
                                    Zobacz zgłoszenie
                                </Link>
                            </Button>
                        ) : (
                            <Button asChild className={cn(
                                "h-10 w-full rounded-xl border-none text-sm font-bold shadow-lg transition-all sm:h-11 sm:text-base",
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
