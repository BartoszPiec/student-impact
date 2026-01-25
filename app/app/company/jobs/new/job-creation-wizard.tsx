"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Briefcase, Zap, CheckCircle2, ArrowRight, Sparkles, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";

import NewOfferForm from "./new-offer-form";

type OfferType = "job" | "micro" | null;

export default function JobCreationWizard() {
    const [offerType, setOfferType] = useState<OfferType>(null);

    return (
        <div className="space-y-8">
            {/* Selection Stage */}
            <div className={cn("grid md:grid-cols-2 gap-8 transition-all duration-500", offerType ? "opacity-50 scale-95 pointer-events-none hidden md:grid" : "opacity-100")}>
                {/* Micro-task Card */}
                <div
                    onClick={() => setOfferType("micro")}
                    className={cn(
                        "group relative cursor-pointer overflow-hidden rounded-[2.5rem] border-2 bg-white p-8 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl",
                        offerType === "micro"
                            ? "border-amber-500 bg-amber-50/50 ring-4 ring-amber-500/20"
                            : "border-slate-100 hover:border-amber-200 hover:shadow-amber-500/10"
                    )}
                >
                    <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Zap className="w-32 h-32 text-amber-500 -rotate-12 transform translate-x-8 -translate-y-8" />
                    </div>

                    <div className="relative z-10">
                        <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-100 text-amber-600 shadow-lg shadow-amber-500/20 group-hover:scale-110 transition-transform">
                            <Zap className="h-8 w-8" />
                        </div>

                        <div className="mb-4">
                            <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-200 border-none mb-3">Rapid Work</Badge>
                            <h3 className="text-2xl font-bold text-slate-900 group-hover:text-amber-600 transition-colors">Dodaj Mikrozlecenie</h3>
                        </div>

                        <p className="text-slate-500 leading-relaxed mb-6">
                            Krótkie zadania, projekty "na już", jednorazowe zlecenia. Idealne do szybkich realizacji (np. poprawki graficzne, research).
                        </p>

                        <div className="bg-white/60 rounded-xl p-4 backdrop-blur-sm border border-slate-100 mb-8">
                            <ul className="space-y-3">
                                <li className="flex items-center text-sm text-slate-600">
                                    <CheckCircle2 className="mr-3 h-5 w-5 text-emerald-500" />
                                    <span>Proste formularze</span>
                                </li>
                                <li className="flex items-center text-sm text-slate-600">
                                    <CheckCircle2 className="mr-3 h-5 w-5 text-emerald-500" />
                                    <span>Realizacja w <span className="font-semibold text-slate-900">24-72h</span></span>
                                </li>
                            </ul>
                        </div>

                        <div className="flex items-center text-base font-bold text-amber-600 group-hover:translate-x-2 transition-transform">
                            Wybierz ten typ <ArrowRight className="ml-2 h-5 w-5" />
                        </div>
                    </div>
                </div>

                {/* Job Offer Card */}
                <div
                    onClick={() => setOfferType("job")}
                    className={cn(
                        "group relative cursor-pointer overflow-hidden rounded-[2.5rem] border-2 bg-white p-8 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl",
                        offerType === "job"
                            ? "border-indigo-500 bg-indigo-50/50 ring-4 ring-indigo-500/20"
                            : "border-slate-100 hover:border-indigo-200 hover:shadow-indigo-500/10"
                    )}
                >
                    <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Briefcase className="w-32 h-32 text-indigo-500 -rotate-12 transform translate-x-8 -translate-y-8" />
                    </div>

                    <div className="relative z-10">
                        <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-600 shadow-lg shadow-indigo-500/20 group-hover:scale-110 transition-transform">
                            <Building2 className="h-8 w-8" />
                        </div>

                        <div className="mb-4">
                            <Badge className="bg-indigo-100 text-indigo-700 hover:bg-indigo-200 border-none mb-3">Long Term</Badge>
                            <h3 className="text-2xl font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">Oferta Pracy / Stażu</h3>
                        </div>

                        <p className="text-slate-500 leading-relaxed mb-6">
                            Dłuższa współpraca, staże, praktyki, B2B. Znajdź stałego członka zespołu lub stażystę do przyuczenia.
                        </p>

                        <div className="bg-white/60 rounded-xl p-4 backdrop-blur-sm border border-slate-100 mb-8">
                            <ul className="space-y-3">
                                <li className="flex items-center text-sm text-slate-600">
                                    <CheckCircle2 className="mr-3 h-5 w-5 text-emerald-500" />
                                    <span>Pełny profil kandydata</span>
                                </li>
                                <li className="flex items-center text-sm text-slate-600">
                                    <CheckCircle2 className="mr-3 h-5 w-5 text-emerald-500" />
                                    <span>Dostęp do bazy <span className="font-semibold text-slate-900">Talent Pool</span></span>
                                </li>
                            </ul>
                        </div>

                        <div className="flex items-center text-base font-bold text-indigo-600 group-hover:translate-x-2 transition-transform">
                            Wybierz ten typ <ArrowRight className="ml-2 h-5 w-5" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Selected Form Area */}
            {offerType && (
                <div className="animate-in fade-in slide-in-from-bottom-8 duration-700">
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-3">
                            <div className={cn(
                                "flex h-12 w-12 items-center justify-center rounded-xl",
                                offerType === "micro" ? "bg-amber-100 text-amber-600" : "bg-indigo-100 text-indigo-600"
                            )}>
                                {offerType === "micro" ? <Zap className="h-6 w-6" /> : <Briefcase className="h-6 w-6" />}
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-slate-900">
                                    {offerType === "micro" ? "Szczegóły Mikrozlecenia" : "Szczegóły Ogłoszenia"}
                                </h2>
                                <p className="text-slate-500 text-sm">Wypełnij formularz poniżej, aby opublikować ofertę</p>
                            </div>
                        </div>

                        <button
                            onClick={() => setOfferType(null)}
                            className="text-sm font-medium text-slate-500 hover:text-indigo-600 hover:underline transition-colors bg-white px-4 py-2 rounded-lg border border-slate-200 shadow-sm hover:shadow-md"
                        >
                            Zmień typ ogłoszenia
                        </button>
                    </div>

                    <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden">
                        <div className={cn(
                            "h-2 w-full bg-gradient-to-r",
                            offerType === "micro" ? "from-amber-400 to-orange-500" : "from-indigo-500 to-violet-600"
                        )} />
                        <div className="p-8 md:p-10">
                            {offerType === "micro" ? (
                                <NewOfferForm defaultType="micro" />
                            ) : (
                                <NewOfferForm defaultType="job" />
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
