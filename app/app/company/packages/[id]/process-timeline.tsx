"use client";

import { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { CheckCircle2, ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import { MarkdownLite } from "@/components/markdown-lite";

interface Variant {
    name: string;
    label: string;
    price: number;
    delivery_time_days?: number;
    scope?: string;
}

interface ProcessTimelineProps {
    markdownContent: string;
    gradient: string;
    variants?: Variant[];
}

interface Step {
    num: number;
    title: string;
    description: string;
}

export function ProcessTimeline({ markdownContent, gradient, variants }: ProcessTimelineProps) {
    // Determine default variant (matches VariantPicker logic)
    const defaultVariant = variants && variants.length === 3 ? variants[1].name : (variants && variants.length > 0 ? variants[0].name : null);
    const [activeVariant, setActiveVariant] = useState<string | null>(defaultVariant);
    
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isPaused, setIsPaused] = useState(false);

    // Listen to "selectVariant" custom event to keep process timeline in sync with VariantPicker
    useEffect(() => {
        const handleSelectVariant = (e: Event) => {
            const customEvent = e as CustomEvent;
            if (customEvent.detail) {
                setActiveVariant(customEvent.detail);
            }
        };
        window.addEventListener("selectVariant", handleSelectVariant);
        return () => window.removeEventListener("selectVariant", handleSelectVariant);
    }, []);

    // Helper: Filter strings containing variant selections like "Dzień 3-5 (S) / 3-7 (M) / 3-10 (L)"
    const filterVariantText = (text: string) => {
        if (!activeVariant || !text) return text;
        
        let processedText = text;
        
        if (processedText.includes("/")) {
            const parts = processedText.split(/\s*\/\s*/);
            const variantPartsCount = parts.filter(p => /\([^)]+\)/.test(p)).length;
            
            // If the string seems to be split by variant markers (e.g. "(S)")
            if (variantPartsCount >= 2) {
                const match = parts.find(p => {
                    const parenMatch = p.match(/\(([^)]+)\)/);
                    if (!parenMatch) return false;
                    const inside = parenMatch[1].split(',').map(v => v.trim().toLowerCase());
                    return inside.includes(activeVariant.toLowerCase());
                });

                if (match) {
                    let cleanedMatch = match.replace(/\([^)]+\)/g, '').trim();
                    
                    // Recover prefix (e.g., "Dzień ") if dropped dynamically from later segments
                    const firstPartClean = parts[0].replace(/\([^)]+\)/g, '').trim();
                    const prefixMatch = firstPartClean.match(/^([^\d]+)/);
                    
                    if (prefixMatch && prefixMatch[1].trim().length > 0) {
                        const prefix = prefixMatch[1];
                        if (/^\d/.test(cleanedMatch)) { // If match starts with a digit, slap prefix on
                            cleanedMatch = prefix + cleanedMatch;
                        }
                    }
                    processedText = cleanedMatch;
                }
            }
        }
        
        return processedText;
    };

    // Basic parser for numbered lists or headers to extract process steps
    const lines = markdownContent.split("\n");
    const steps: Step[] = [];
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
                steps.push(currentStep as Step);
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
                num: numberedListMatch ? parseInt(numberedListMatch[1]) : stepCounter++,
                title: filterVariantText(title.replace(/\*\*/g, "")),
                description: initialDesc ? filterVariantText(initialDesc) + "\n" : ""
            };
        } else if (foundSteps && currentStep) {
            if (trimmed !== "") {
                currentStep.description += filterVariantText(line) + "\n";
            }
        } else {
            if (trimmed !== "") {
                beforeText.push(line);
            }
        }
    }

    if (currentStep && currentStep.title) {
        steps.push(currentStep as Step);
    }

    const totalSteps = steps.length;
    // How many items to move per click (1 item)
    const CARDS_TO_SHOW_DESKTOP = 3;
    // Calculate max index to avoid empty space at the end
    const maxIndex = Math.max(0, totalSteps - CARDS_TO_SHOW_DESKTOP);

    const handleNext = useCallback(() => {
        setCurrentIndex((prev) => (prev >= maxIndex ? 0 : prev + 1));
    }, [maxIndex]);

    const handlePrev = useCallback(() => {
        setCurrentIndex((prev) => (prev <= 0 ? maxIndex : prev - 1));
    }, [maxIndex]);

    // Auto-advance
    useEffect(() => {
         // Auto play is active if not paused, and if there are enough steps to scroll on desktop
        if (isPaused || totalSteps <= CARDS_TO_SHOW_DESKTOP) return;
        
        const timer = setInterval(() => {
            handleNext();
        }, 5000); // 5 seconds per slide
        
        return () => clearInterval(timer);
    }, [isPaused, totalSteps, handleNext, CARDS_TO_SHOW_DESKTOP]);

    if (steps.length === 0) {
        return <MarkdownLite content={markdownContent} />;
    }

    return (
        <div className="relative">
            {beforeText.length > 0 && (
                <div className="mb-10 text-slate-600 prose-lg">
                    <MarkdownLite content={beforeText.join("\n")} />
                </div>
            )}

            <div className="mt-8 relative mb-12">
                
                {/* Carousel Controls Container (Removed per user request) */}
                
                {/* Carousel Viewport */}
                <div className="overflow-hidden rounded-3xl -mx-4 px-4 py-6"
                     onMouseEnter={() => setIsPaused(true)}
                     onMouseLeave={() => setIsPaused(false)}
                >
                    <div 
                        className="flex transition-transform duration-700 ease-in-out gap-6"
                        // Calculate translation. We use percentage based on 100% / 3 (for desktop) per index, minus the gap adjusted mathematically.
                        // For pure responsiveness, CSS classes control the width of the inner elements.
                        style={{ transform: `translateX(calc(-${currentIndex * (100 / CARDS_TO_SHOW_DESKTOP)}% - ${currentIndex * (1.5 / CARDS_TO_SHOW_DESKTOP)}rem))` }}
                    >
                        {steps.map((step, index) => {
                            const isLast = index === steps.length - 1;
                            
                            return (
                                <div 
                                    key={index} 
                                    // Make exactly 3 visible per view by specifying width algebraically including gap
                                    // w = calc(100% / 3 - gap * 2/3)
                                    className="w-full shrink-0 sm:w-[calc(50%-0.75rem)] lg:w-[calc(100%/3-1rem)]"
                                >
                                    <div className="relative group h-full">
                                        {/* Connecting Line (Only draw if it's not the visually absolute last card) */}
                                        {!isLast && (
                                            <div className="hidden lg:block absolute top-[44px] left-[calc(4rem+24px)] w-[calc(100%+1.5rem)] h-[3px] bg-slate-100 z-0">
                                                <div className="w-0 h-full bg-gradient-to-r from-red-500 hover:w-full transition-all duration-700 delay-100" />
                                            </div>
                                        )}

                                        <div className="bg-white rounded-[2rem] p-6 lg:p-8 border border-slate-100 shadow-xl shadow-slate-200/40 relative z-10 hover:-translate-y-2 transition-transform duration-500 hover:border-indigo-100 flex flex-col h-full">
                                            <div className="flex items-center gap-4 mb-6">
                                                <div className={cn(
                                                    "w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black text-xl shrink-0 shadow-lg shadow-indigo-500/20",
                                                    `bg-gradient-to-br ${gradient}`
                                                )}>
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

                {/* Progress Indicators */}
                {totalSteps > CARDS_TO_SHOW_DESKTOP && (
                    <div className="flex justify-center mt-4 gap-2">
                        {Array.from({ length: maxIndex + 1 }).map((_, i) => (
                            <button
                                key={i}
                                onClick={() => { setCurrentIndex(i); setIsPaused(true); }}
                                className={cn(
                                    "h-2 rounded-full transition-all duration-300 shadow-[inset_0_1px_2px_rgba(0,0,0,0.1)]",
                                    currentIndex === i 
                                        ? `w-8 bg-gradient-to-r ${gradient}`
                                        : "w-2 bg-slate-200 hover:bg-slate-300"
                                )}
                                aria-label={`Przejdź do strony ${i + 1}`}
                            />
                        ))}
                    </div>
                )}
            </div>
            
            <div className="mt-8 flex justify-center">
                <div className="bg-emerald-50 text-emerald-600 border border-emerald-100 text-xs font-bold uppercase tracking-widest px-6 py-2.5 rounded-full flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    Gotowe dzieło
                </div>
            </div>
        </div>
    );
}

function FormatInline({ text }: { text: string }) {
    if (!text) return null;
    const cleanText = text.replace(/(✔|✓|✗|✕)/g, "");
    
    // Split bold text manually
    const parts = cleanText.split(/(\*\*[^*]+\*\*)/g);
    
    return (
        <>
            {parts.map((part, i) => {
                if (part.startsWith('**') && part.endsWith('**')) {
                    return <strong key={i} className="text-slate-800 font-bold">{part.slice(2, -2)}</strong>;
                }
                return <span key={i}>{part}</span>;
            })}
        </>
    );
}
