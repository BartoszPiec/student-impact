"use client";

import { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { CheckCircle2 } from "lucide-react";
import { MarkdownLite } from "@/components/markdown-lite";
import type { PackageVariant } from "@/lib/services/package-customization";

type Variant = PackageVariant;

interface ProcessTimelineProps {
    markdownContent: string;
    gradient: string;
    variants?: Variant[];
    fallbackSteps?: Step[];
}

interface Step {
    num: number;
    title: string;
    description: string;
}

export function ProcessTimeline({ markdownContent, gradient, variants, fallbackSteps }: ProcessTimelineProps) {
    const recommendedVariant = variants?.find((variant) => variant.is_recommended);
    const defaultVariant =
        recommendedVariant?.name
        || (variants && variants.length === 3 ? variants[1].name : (variants && variants.length > 0 ? variants[0].name : null));

    const [activeVariant, setActiveVariant] = useState<string | null>(defaultVariant);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isPaused, setIsPaused] = useState(false);

    useEffect(() => {
        const handleSelectVariant = (event: Event) => {
            const customEvent = event as CustomEvent;
            if (customEvent.detail) {
                setActiveVariant(customEvent.detail);
            }
        };

        window.addEventListener("selectVariant", handleSelectVariant);
        return () => window.removeEventListener("selectVariant", handleSelectVariant);
    }, []);

    const filterVariantText = (text: string) => {
        if (!activeVariant || !text) return text;

        let processedText = text;
        if (!processedText.includes("/")) return processedText;

        const parts = processedText.split(/\s*\/\s*/);
        const variantPartsCount = parts.filter((part) => /\([^)]+\)/.test(part)).length;

        if (variantPartsCount < 2) return processedText;

        const match = parts.find((part) => {
            const parenMatch = part.match(/\(([^)]+)\)/);
            if (!parenMatch) return false;
            const inside = parenMatch[1].split(",").map((value) => value.trim().toLowerCase());
            return inside.includes(activeVariant.toLowerCase());
        });

        if (!match) return processedText;

        let cleanedMatch = match.replace(/\([^)]+\)/g, "").trim();
        const firstPartClean = parts[0].replace(/\([^)]+\)/g, "").trim();
        const prefixMatch = firstPartClean.match(/^([^\d]+)/);

        if (prefixMatch && prefixMatch[1].trim().length > 0) {
            const prefix = prefixMatch[1];
            if (/^\d/.test(cleanedMatch)) {
                cleanedMatch = prefix + cleanedMatch;
            }
        }

        return cleanedMatch;
    };

    const activeVariantData = variants?.find((variant) => variant.name === activeVariant) || null;
    const milestoneSteps = (activeVariantData?.milestones || [])
        .filter((milestone) => milestone && typeof milestone.title === "string")
        .sort((a, b) => (a.idx || 0) - (b.idx || 0))
        .map((milestone, index) => ({
            num: milestone.idx || index + 1,
            title: milestone.title,
            description: `${milestone.acceptance_criteria || ""}${milestone.due_days ? `\nTermin: dzien ${milestone.due_days}` : ""}`.trim(),
        }));

    const lines = markdownContent.split("\n");
    const parsedSteps: Step[] = [];
    const beforeText: string[] = [];

    let currentStep: Partial<Step> | null = null;
    let stepCounter = 1;
    let foundSteps = false;

    for (const line of lines) {
        const trimmed = line.trim();

        const numberedListMatch = trimmed.match(/^(\d+)\.\s+(.*)/);
        const headerMatch = trimmed.match(/^###\s+(.*)/);
        const bulletMatch = trimmed.match(/^[\*\-]\s+(.*)/);

        if (numberedListMatch || headerMatch || bulletMatch) {
            foundSteps = true;
            if (currentStep && currentStep.title) {
                parsedSteps.push(currentStep as Step);
            }

            let rawContent = "";
            if (numberedListMatch) rawContent = numberedListMatch[2];
            else if (headerMatch) rawContent = headerMatch[1];
            else if (bulletMatch) rawContent = bulletMatch[1];

            const boldMatch = rawContent.match(/\*\*(.*?)\*\*(.*)/);

            let title = rawContent;
            let initialDesc = "";

            if (boldMatch) {
                title = boldMatch[1].trim();
                initialDesc = boldMatch[2].trim();
            } else if (rawContent.includes(":")) {
                const parts = rawContent.split(":");
                title = parts[0];
                initialDesc = parts.slice(1).join(":").trim();
            }

            if (initialDesc.startsWith("-")) initialDesc = initialDesc.substring(1).trim();

            currentStep = {
                num: numberedListMatch ? parseInt(numberedListMatch[1], 10) : stepCounter++,
                title: filterVariantText(title.replace(/\*\*/g, "")),
                description: initialDesc ? `${filterVariantText(initialDesc)}\n` : "",
            };
        } else if (foundSteps && currentStep) {
            if (trimmed !== "") {
                currentStep.description += `${filterVariantText(line)}\n`;
            }
        } else if (trimmed !== "") {
            beforeText.push(line);
        }
    }

    if (currentStep && currentStep.title) {
        parsedSteps.push(currentStep as Step);
    }

    const normalizedFallbackSteps = (fallbackSteps || [])
        .filter((step) => step && typeof step.title === "string" && step.title.trim().length > 0)
        .map((step, index) => ({
            num: step.num || index + 1,
            title: step.title,
            description: step.description || "",
        }));

    const preferredSteps = milestoneSteps.length > 0 ? milestoneSteps : parsedSteps;
    const steps = normalizedFallbackSteps.length > preferredSteps.length ? normalizedFallbackSteps : preferredSteps;

    const totalSteps = steps.length;
    const CARDS_TO_SHOW_DESKTOP = 3;
    const maxIndex = Math.max(0, totalSteps - CARDS_TO_SHOW_DESKTOP);

    const handleNext = useCallback(() => {
        setCurrentIndex((prev) => (prev >= maxIndex ? 0 : prev + 1));
    }, [maxIndex]);

    useEffect(() => {
        if (isPaused || totalSteps <= CARDS_TO_SHOW_DESKTOP) return;

        const timer = setInterval(() => {
            handleNext();
        }, 5000);

        return () => clearInterval(timer);
    }, [isPaused, totalSteps, handleNext]);

    if (steps.length === 0) {
        return <MarkdownLite content={markdownContent} />;
    }

    return (
        <div className="relative">
            {beforeText.length > 0 ? (
                <div className="mb-10 text-slate-600 prose-lg">
                    <MarkdownLite content={beforeText.join("\n")} />
                </div>
            ) : null}

            <div className="mt-8 relative mb-12">
                <div
                    className="overflow-hidden rounded-3xl -mx-4 px-4 py-6"
                    onMouseEnter={() => setIsPaused(true)}
                    onMouseLeave={() => setIsPaused(false)}
                >
                    <div
                        className="flex transition-transform duration-700 ease-in-out gap-6"
                        style={{ transform: `translateX(calc(-${currentIndex * (100 / CARDS_TO_SHOW_DESKTOP)}% - ${currentIndex * (1.5 / CARDS_TO_SHOW_DESKTOP)}rem))` }}
                    >
                        {steps.map((step, index) => {
                            const isLast = index === steps.length - 1;

                            return (
                                <div
                                    key={index}
                                    className="w-full shrink-0 sm:w-[calc(50%-0.75rem)] lg:w-[calc(100%/3-1rem)]"
                                >
                                    <div className="relative group h-full">
                                        {!isLast ? (
                                            <div className="hidden lg:block absolute top-[44px] left-[calc(4rem+24px)] w-[calc(100%+1.5rem)] h-[3px] bg-slate-100 z-0">
                                                <div className="w-0 h-full bg-gradient-to-r from-red-500 hover:w-full transition-all duration-700 delay-100" />
                                            </div>
                                        ) : null}

                                        <div className="bg-white rounded-[2rem] p-6 lg:p-8 border border-slate-100 shadow-xl shadow-slate-200/40 relative z-10 hover:-translate-y-2 transition-transform duration-500 hover:border-indigo-100 flex flex-col h-full">
                                            <div className="flex items-center gap-4 mb-6">
                                                <div
                                                    className={cn(
                                                        "w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black text-xl shrink-0 shadow-lg shadow-indigo-500/20",
                                                        `bg-gradient-to-br ${gradient}`,
                                                    )}
                                                >
                                                    {step.num}
                                                </div>
                                                <h4 className="text-lg font-bold text-slate-900 leading-tight">{step.title}</h4>
                                            </div>

                                            <div className="text-slate-600 text-sm leading-relaxed whitespace-pre-line flex-1">
                                                <FormatInline text={step.description.trim()} />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {totalSteps > CARDS_TO_SHOW_DESKTOP ? (
                    <div className="flex justify-center mt-4 gap-2">
                        {Array.from({ length: maxIndex + 1 }).map((_, index) => (
                            <button
                                key={index}
                                onClick={() => {
                                    setCurrentIndex(index);
                                    setIsPaused(true);
                                }}
                                className={cn(
                                    "h-2 rounded-full transition-all duration-300 shadow-[inset_0_1px_2px_rgba(0,0,0,0.1)]",
                                    currentIndex === index
                                        ? `w-8 bg-gradient-to-r ${gradient}`
                                        : "w-2 bg-slate-200 hover:bg-slate-300",
                                )}
                                aria-label={`Przejdz do strony ${index + 1}`}
                            />
                        ))}
                    </div>
                ) : null}
            </div>

            <div className="mt-8 flex justify-center">
                <div className="bg-emerald-50 text-emerald-600 border border-emerald-100 text-xs font-bold uppercase tracking-widest px-6 py-2.5 rounded-full flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    Gotowe dzielo
                </div>
            </div>
        </div>
    );
}

function FormatInline({ text }: { text: string }) {
    if (!text) return null;
    const cleanText = text.replace(/[✔✅✗✕]/g, "");
    const parts = cleanText.split(/(\*\*[^*]+\*\*)/g);

    return (
        <>
            {parts.map((part, idx) => {
                if (part.startsWith("**") && part.endsWith("**")) {
                    return (
                        <strong key={idx} className="text-slate-800 font-bold">
                            {part.slice(2, -2)}
                        </strong>
                    );
                }

                return <span key={idx}>{part}</span>;
            })}
        </>
    );
}
