"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Briefcase, Zap, CheckCircle2, ArrowRight, Building2, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

import NewOfferForm from "./new-offer-form";

type OfferType = "job" | "micro" | null;

export default function JobCreationWizard() {
    const [offerType, setOfferType] = useState<OfferType>(null);

    return (
        <div className="space-y-8">
            <div className={cn("grid gap-8 md:grid-cols-2 transition-all duration-700", offerType ? "pointer-events-none hidden scale-95 opacity-50 md:grid" : "opacity-100")}>
                <div
                    onClick={() => setOfferType("micro")}
                    className={cn(
                        "group relative cursor-pointer overflow-hidden rounded-[3rem] border-2 bg-white/80 p-8 shadow-xl shadow-slate-200/50 backdrop-blur-md transition-all duration-500 hover:-translate-y-2 hover:border-amber-400/50 hover:shadow-[0_20px_50px_rgba(245,158,11,0.15)]",
                        offerType === "micro"
                            ? "border-amber-500 bg-amber-50/50 ring-4 ring-amber-500/10"
                            : "border-slate-100"
                    )}
                >
                    <div className="absolute right-0 top-0 p-8 opacity-[0.03] transition-opacity duration-700 group-hover:opacity-[0.08]">
                        <Zap className="h-48 w-48 -translate-y-12 translate-x-12 -rotate-12 transform text-amber-600" />
                    </div>

                    <div className="relative z-10">
                        <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-lg shadow-amber-500/30 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3">
                            <Zap className="h-8 w-8" />
                        </div>

                        <div className="mb-4">
                            <Badge className="mb-3 border-none bg-amber-100 px-3 py-1 font-bold text-amber-700 hover:bg-amber-200">Rapid Work</Badge>
                            <h3 className="text-2xl font-black tracking-tight text-slate-900 transition-colors group-hover:text-amber-600">Dodaj mikrozlecenie</h3>
                        </div>

                        <p className="mb-6 text-base font-medium leading-relaxed text-slate-600">
                            Krotkie zadania, jednorazowe realizacje i projekty z konkretnym efektem. Dobre do szybkiego dowiezienia jednego celu.
                        </p>

                        <div className="mb-8 rounded-2xl border border-slate-100 bg-white/40 p-5 backdrop-blur-sm transition-colors group-hover:bg-amber-50/30">
                            <ul className="space-y-4">
                                <li className="flex items-center text-sm font-semibold text-slate-700">
                                    <div className="mr-3 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                                        <CheckCircle2 className="h-4 w-4" />
                                    </div>
                                    <span>Prosty brief i szybka publikacja</span>
                                </li>
                                <li className="flex items-center text-sm font-semibold text-slate-700">
                                    <div className="mr-3 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                                        <CheckCircle2 className="h-4 w-4" />
                                    </div>
                                    <span>Skoncentrowane na jednym rezultacie</span>
                                </li>
                            </ul>
                        </div>

                        <div className="flex items-center text-base font-black text-amber-600 transition-transform duration-500 group-hover:translate-x-3">
                            Wybierz ten typ <ArrowRight className="ml-2 h-5 w-5" />
                        </div>
                    </div>
                </div>

                <div
                    onClick={() => setOfferType("job")}
                    className={cn(
                        "group relative cursor-pointer overflow-hidden rounded-[3rem] border-2 bg-white/80 p-8 shadow-xl shadow-slate-200/50 backdrop-blur-md transition-all duration-500 hover:-translate-y-2 hover:border-indigo-400/50 hover:shadow-[0_20px_50px_rgba(79,70,229,0.15)]",
                        offerType === "job"
                            ? "border-indigo-500 bg-indigo-50/50 ring-4 ring-indigo-500/10"
                            : "border-slate-100"
                    )}
                >
                    <div className="absolute right-0 top-0 p-8 opacity-[0.03] transition-opacity duration-700 group-hover:opacity-[0.08]">
                        <Briefcase className="h-48 w-48 -translate-y-12 translate-x-12 -rotate-12 transform text-indigo-600" />
                    </div>

                    <div className="relative z-10">
                        <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-500/30 transition-transform duration-500 group-hover:scale-110 group-hover:-rotate-3">
                            <Building2 className="h-8 w-8" />
                        </div>

                        <div className="mb-4">
                            <Badge className="mb-3 border-none bg-indigo-100 px-3 py-1 font-bold text-indigo-700 hover:bg-indigo-200">Long Term</Badge>
                            <h3 className="text-2xl font-black tracking-tight text-slate-900 transition-colors group-hover:text-indigo-600">Oferta pracy lub stazu</h3>
                        </div>

                        <p className="mb-6 text-base font-medium leading-relaxed text-slate-600">
                            Dluzsza wspolpraca, staz, praktyka lub rola projektowa. Dobre, gdy szukasz osoby do stalej odpowiedzialnosci lub rozwoju.
                        </p>

                        <div className="mb-8 rounded-2xl border border-slate-100 bg-white/40 p-5 backdrop-blur-sm transition-colors group-hover:bg-indigo-50/30">
                            <ul className="space-y-4">
                                <li className="flex items-center text-sm font-semibold text-slate-700">
                                    <div className="mr-3 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                                        <CheckCircle2 className="h-4 w-4" />
                                    </div>
                                    <span>Pelniejszy profil kandydata</span>
                                </li>
                                <li className="flex items-center text-sm font-semibold text-slate-700">
                                    <div className="mr-3 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                                        <CheckCircle2 className="h-4 w-4" />
                                    </div>
                                    <span>Lepszy kontekst dla wspolpracy dlugiej</span>
                                </li>
                            </ul>
                        </div>

                        <div className="flex items-center text-base font-black text-indigo-600 transition-transform duration-500 group-hover:translate-x-3">
                            Wybierz ten typ <ArrowRight className="ml-2 h-5 w-5" />
                        </div>
                    </div>
                </div>
            </div>

            {offerType && (
                <div className="animate-in fade-in slide-in-from-bottom-8 duration-700">
                    <div className="mb-8 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className={cn(
                                "flex h-12 w-12 items-center justify-center rounded-xl shadow-lg",
                                offerType === "micro" ? "bg-amber-100 text-amber-600 shadow-amber-500/10" : "bg-indigo-100 text-indigo-600 shadow-indigo-500/10"
                            )}>
                                {offerType === "micro" ? <Zap className="h-6 w-6" /> : <Briefcase className="h-6 w-6" />}
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold tracking-tight text-slate-900">
                                    {offerType === "micro" ? "Szczegoly mikrozlecenia" : "Szczegoly ogloszenia"}
                                </h2>
                                <p className="text-sm font-medium text-slate-500">Wypelnij formularz tak, aby kandydat od razu rozumial zakres, cel i warunki wspolpracy.</p>
                            </div>
                        </div>

                        <button
                            onClick={() => setOfferType(null)}
                            className="group flex items-center gap-2 rounded-2xl border border-slate-200 bg-white/80 px-5 py-2.5 text-sm font-bold text-slate-500 shadow-sm backdrop-blur-sm transition-all hover:border-indigo-200 hover:text-indigo-600 hover:shadow-lg"
                        >
                            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
                            <span>Zmien typ ogloszenia</span>
                        </button>
                    </div>

                    <div className="overflow-hidden rounded-[3rem] border border-slate-100 bg-white/90 shadow-2xl shadow-slate-200/60 backdrop-blur-md">
                        <div className={cn(
                            "h-2 w-full bg-gradient-to-r",
                            offerType === "micro" ? "from-amber-400 to-orange-500" : "from-indigo-500 to-violet-600"
                        )} />
                        <div className="p-8 md:p-12">
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
