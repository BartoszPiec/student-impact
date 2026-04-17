"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, ShieldCheck, Timer, Coins, Shield, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PackageVariant } from "@/lib/services/package-customization";

type Variant = PackageVariant;

interface VariantPickerProps {
    variants: Variant[];
    baseDeliveryDays: number;
    gradient: string;
    packageId: string;
}

export function VariantPicker({ variants, baseDeliveryDays, gradient, packageId }: VariantPickerProps) {
    const recommendedIdx = variants.findIndex((variant) => variant.is_recommended);
    const standardIdx = variants.findIndex((variant) => variant.name.toLowerCase() === "standard");
    const defaultIndex = recommendedIdx >= 0 ? recommendedIdx : (standardIdx >= 0 ? standardIdx : (variants.length === 3 ? 1 : 0));
    const [selectedIdx, setSelectedIdx] = useState(defaultIndex);
    const selected = variants[selectedIdx];

    useEffect(() => {
        const handleSelectVariant = (e: Event) => {
            const customEvent = e as CustomEvent;
            const index = variants.findIndex((variant) => variant.name === customEvent.detail);
            if (index !== -1) {
                setSelectedIdx(index);
            }
        };

        window.addEventListener("selectVariant", handleSelectVariant);
        return () => window.removeEventListener("selectVariant", handleSelectVariant);
    }, [variants]);

    const deliveryDays = selected.delivery_time_days || baseDeliveryDays;
    const deliveryLabel =
        baseDeliveryDays > 0 && deliveryDays > baseDeliveryDays
            ? `${baseDeliveryDays}-${deliveryDays} dni`
            : `${deliveryDays} dni`;

    return (
        <div className="bg-white rounded-[2rem] border border-slate-200 p-8 shadow-2xl shadow-indigo-500/10 backdrop-blur-xl relative overflow-hidden">
            <div className={`absolute top-0 inset-x-0 h-2 bg-gradient-to-r ${gradient}`} />

            <div className="mb-6 pt-2">
                <div className="flex rounded-2xl bg-slate-100/80 p-1.5 gap-1">
                    {variants.map((variant, idx) => {
                        const isPopular = Boolean(variant.is_recommended) || (variants.length === 3 && idx === 1);

                        return (
                            <button
                                key={variant.name}
                                onClick={() => setSelectedIdx(idx)}
                                className={cn(
                                    "flex-1 relative rounded-xl pt-4 pb-2 px-1 text-center transition-all duration-300 cursor-pointer flex flex-col items-center justify-center",
                                    selectedIdx === idx
                                        ? "bg-white shadow-md shadow-slate-200/50 scale-[1.02] z-10"
                                        : "hover:bg-white/50 text-slate-500 hover:text-slate-700 z-0",
                                )}
                            >
                                {isPopular ? (
                                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-20">
                                        <span className="text-[9px] flex items-center gap-1 font-bold bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-2.5 py-0.5 rounded-full uppercase tracking-widest whitespace-nowrap shadow-sm ring-2 ring-white">
                                            <Zap className="w-2.5 h-2.5 fill-current" />
                                            Popularny
                                        </span>
                                    </div>
                                ) : null}

                                <div
                                    className={cn(
                                        "font-bold text-sm transition-colors",
                                        selectedIdx === idx ? "text-slate-900" : "text-inherit",
                                    )}
                                >
                                    {variant.name}
                                </div>
                                <div
                                    className={cn(
                                        "text-[11px] mt-0.5 transition-colors font-medium",
                                        selectedIdx === idx ? "text-slate-500" : "text-slate-400",
                                    )}
                                >
                                    {variant.price} PLN
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>

            <div className="mb-6 text-center">
                <div className="text-sm text-slate-500 font-medium mb-1 uppercase tracking-wide">{selected.label}</div>
                <div className="flex items-baseline justify-center gap-2">
                    <span className="text-5xl font-extrabold text-slate-900 tracking-tight transition-all duration-300">{selected.price}</span>
                    <span className="text-xl font-medium text-slate-400">PLN</span>
                </div>
                {selected.scope ? <div className="mt-2 text-sm text-slate-500">{selected.scope}</div> : null}
                <div className="mt-4 flex items-center justify-center gap-2 text-sm font-semibold text-emerald-700 bg-emerald-50 rounded-full px-4 py-2 w-fit mx-auto border border-emerald-100">
                    <ShieldCheck className="w-4 h-4" />
                    Gwarancja satysfakcji
                </div>
            </div>

            <div className="space-y-4 mb-8">
                <div className="flex justify-between items-center py-3 border-b border-slate-100">
                    <span className="text-slate-500 flex items-center gap-3 font-medium">
                        <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400">
                            <Timer className="w-4 h-4" />
                        </div>
                        Czas realizacji
                    </span>
                    <span className="font-bold text-slate-900 transition-all duration-300">{deliveryLabel}</span>
                </div>

                <div className="flex justify-between items-center py-3 border-b border-slate-100">
                    <span className="text-slate-500 flex items-center gap-3 font-medium">
                        <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400">
                            <Coins className="w-4 h-4" />
                        </div>
                        Platnosc
                    </span>
                    <span className="font-bold text-slate-900">Po akceptacji</span>
                </div>

                <div className="flex justify-between items-center py-3">
                    <span className="text-slate-500 flex items-center gap-3 font-medium">
                        <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400">
                            <Shield className="w-4 h-4" />
                        </div>
                        Bezpieczenstwo
                    </span>
                    <span className="font-bold text-slate-900">Escrow</span>
                </div>
            </div>

            <Button asChild className={`w-full h-auto py-4 text-lg bg-gradient-to-r ${gradient} hover:shadow-xl hover:shadow-indigo-500/30 hover:scale-[1.02] transition-all duration-300 rounded-xl`}>
                <Link
                    href={{
                        pathname: `/app/company/packages/${packageId}/customize`,
                        query: { variant: selected.name },
                    }}
                >
                    Zamawiam {selected.label}
                    <ArrowRight className="ml-2 w-5 h-5" />
                </Link>
            </Button>

            <div className="mt-6 text-center">
                <p className="text-xs text-slate-400 leading-tight">
                    Klikajac przycisk, przejdziesz do konfiguracji szczegolow zamowienia.
                </p>
            </div>
        </div>
    );
}
