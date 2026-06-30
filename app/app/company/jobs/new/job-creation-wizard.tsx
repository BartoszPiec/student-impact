"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Briefcase, Zap, CheckCircle2, ArrowRight, Building2, ArrowLeft, SearchCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import dynamic from "next/dynamic";

const NewOfferForm = dynamic(() => import("./new-offer-form"), {
    loading: () => <div className="h-96 animate-pulse rounded-[2rem] bg-slate-100" />,
});

type OfferType = "job" | "micro" | null;

export default function JobCreationWizard() {
    const searchParams = useSearchParams();
    const isAppTour = searchParams.get("appTour") === "1";
    const tourOfferType = isAppTour ? searchParams.get("tourOfferType") : null;
    const isTourChoosingType = isAppTour && searchParams.get("tourOfferChoose") === "1";
    const [selectedOfferType, setSelectedOfferType] = useState<OfferType>(null);
    const tourSelectedOfferType: OfferType =
        tourOfferType === "micro" || tourOfferType === "job" ? tourOfferType : null;
    const offerType = isTourChoosingType ? null : tourSelectedOfferType ?? selectedOfferType;

    return (
        <div className="space-y-8">
            <div className={cn("grid gap-4 md:grid-cols-3 transition-all duration-300", offerType ? "pointer-events-none hidden scale-95 opacity-50 md:grid" : "opacity-100")}>
                <div
                    data-tour="company-offer-type-micro"
                    onClick={() => setSelectedOfferType("micro")}
                    className={cn(
                        "group relative cursor-pointer overflow-hidden rounded-2xl border bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-amber-300 hover:shadow-lg",
                        offerType === "micro"
                            ? "border-amber-300 bg-amber-50 ring-2 ring-amber-100"
                            : "border-slate-200"
                    )}
                >
                    <div className="relative z-10">
                        <div className="mb-5 flex items-start justify-between gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                                <Zap className="h-5 w-5" />
                            </div>
                            <Badge className="border-none bg-amber-100 px-2.5 py-1 text-[10px] font-black uppercase text-amber-700 hover:bg-amber-100">
                                Najszybsze
                            </Badge>
                        </div>

                        <div className="mb-4">
                            <h3 className="text-lg font-black tracking-tight text-[#10245f]">Mikrozlecenie</h3>
                        </div>

                        <p className="mb-5 text-sm font-medium leading-6 text-slate-600">
                            Krótkie, jasno wycenione zadanie z jednym konkretnym efektem.
                        </p>

                        <div className="mb-5">
                            <ul className="space-y-2">
                                <li className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                    <span>Prosty brief i szybka publikacja</span>
                                </li>
                                <li className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                    <span>Skoncentrowane na jednym rezultacie</span>
                                </li>
                            </ul>
                        </div>

                        <div className="flex items-center text-sm font-black text-[#10245f]">
                            Wybierz <ArrowRight className="ml-2 h-4 w-4" />
                        </div>
                    </div>
                </div>

                <div
                    data-tour="company-offer-type-job"
                    onClick={() => setSelectedOfferType("job")}
                    className={cn(
                        "group relative cursor-pointer overflow-hidden rounded-2xl border bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-300 hover:shadow-lg",
                        offerType === "job"
                            ? "border-indigo-300 bg-indigo-50 ring-2 ring-indigo-100"
                            : "border-slate-200"
                    )}
                >
                    <div className="relative z-10">
                        <div className="mb-5 flex items-start justify-between gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                                <Building2 className="h-5 w-5" />
                            </div>
                            <Badge className="border-none bg-indigo-100 px-2.5 py-1 text-[10px] font-black uppercase text-indigo-700 hover:bg-indigo-100">
                                Długofalowo
                            </Badge>
                        </div>

                        <div className="mb-4">
                            <h3 className="text-lg font-black tracking-tight text-[#10245f]">Praca / Staż</h3>
                        </div>

                        <p className="mb-5 text-sm font-medium leading-6 text-slate-600">
                            Dłuższa współpraca lub staż. Zbuduj zespół na zlecenie bez stałej rekrutacji.
                        </p>

                        <div className="mb-5">
                            <ul className="space-y-2">
                                <li className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                    <span>Cykliczne rozliczenia</span>
                                </li>
                                <li className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                    <span>Współpraca wieloetapowa</span>
                                </li>
                            </ul>
                        </div>

                        <div className="flex items-center text-sm font-black text-[#10245f]">
                            Wybierz <ArrowRight className="ml-2 h-4 w-4" />
                        </div>
                    </div>
                </div>

                <Link
                    href="/app/company/challenges/new"
                    className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-lg"
                >
                    <div className="relative z-10">
                        <div className="mb-5 flex items-start justify-between gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                                <SearchCheck className="h-5 w-5" />
                            </div>
                            <Badge className="border-none bg-emerald-100 px-2.5 py-1 text-[10px] font-black uppercase text-emerald-700 hover:bg-emerald-100">
                                Nietypowe
                            </Badge>
                        </div>

                        <div className="mb-4">
                            <h3 className="text-lg font-black tracking-tight text-[#10245f]">Wyzwanie</h3>
                        </div>

                        <p className="mb-5 text-sm font-medium leading-6 text-slate-600">
                            Nie wiesz, jak zdefiniować zadanie? Opisz problem, a my dobierzemy wykonawcę i przygotujemy wycenę.
                        </p>

                        <div className="mb-5">
                            <ul className="space-y-2">
                                <li className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                    <span>Minimum formularza, maksimum kontekstu</span>
                                </li>
                                <li className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                    <span>Pitch i wycena od studenta</span>
                                </li>
                            </ul>
                        </div>

                        <div className="flex items-center text-sm font-black text-[#10245f]">
                            Wybierz <ArrowRight className="ml-2 h-4 w-4" />
                        </div>
                    </div>
                </Link>
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
                                <p className="text-sm font-medium text-slate-500">Wypelnij formularz tak, aby kandydat od razu rozumial zakres, cel i warunki współpracy.</p>
                            </div>
                        </div>

                        <button
                            onClick={() => setSelectedOfferType(null)}
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
