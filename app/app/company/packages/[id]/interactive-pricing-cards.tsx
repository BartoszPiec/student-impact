"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { CheckCircle2, XCircle, ArrowRight, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

interface InteractivePricingCardsProps {
    markdownContent: string;
    gradient: string;
}

export function InteractivePricingCards({ markdownContent, gradient }: InteractivePricingCardsProps) {
    // Parse markdown table
    const lines = markdownContent.split("\n");
    let tableLines: string[] = [];
    let inTable = false;

    for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith("|") && trimmed.endsWith("|")) {
            tableLines.push(trimmed);
            inTable = true;
        } else if (inTable) {
            break; // End of table
        }
    }

    if (tableLines.length < 3) {
        return null; // Not a valid table
    }

    const headers = tableLines[0]
        .split("|")
        .filter((_, idx, arr) => idx > 0 && idx < arr.length - 1)
        .map(cell => cell.trim());

    // Skip separator line (index 1)
    const rows: string[][] = [];
    let dataStartIdx = 1;
    if (/^\|[\s\-:|]+\|$/.test(tableLines[1])) {
        dataStartIdx = 2;
    }

    for (let r = dataStartIdx; r < tableLines.length; r++) {
        const cells = tableLines[r]
            .split("|")
            .filter((_, idx, arr) => idx > 0 && idx < arr.length - 1)
            .map(cell => cell.trim());
        rows.push(cells);
    }

    // Now, transpose the data to create cards
    // headers[0] is usually empty (corner), headers[1] is S, headers[2] is M, headers[3] is L
    const columnsCount = headers.length;
    if (columnsCount < 2) return null;

    const cards = [];
    for (let c = 1; c < columnsCount; c++) {
        const titleParts = headers[c].split("—").map(p => p.trim());
        const variantName = titleParts[0].replace(/\*\*/g, "");
        const variantLabel = titleParts[1] ? titleParts[1].replace(/\*\*/g, "") : "";
        
        let price = "";
        const features: { name: string; value: string }[] = [];

        for (const row of rows) {
            const rowLabel = row[0].replace(/\*\*/g, "");
            const rowValue = row[c] || "";
            
            if (rowLabel.toLowerCase().includes("cena")) {
                price = rowValue.replace(/\*\*/g, "");
            } else {
                features.push({ name: rowLabel, value: rowValue });
            }
        }

        cards.push({
            name: variantName,
            label: variantLabel,
            price,
            features
        });
    }

    const handleSelect = (variantName: string) => {
        // Dispatch custom event that VariantPicker will listen to
        const event = new CustomEvent("selectVariant", { detail: variantName });
        window.dispatchEvent(event);

        // Scroll gracefully to the Variant Picker (top right)
        window.scrollTo({ top: 100, behavior: "smooth" });
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-4">
            {cards.map((card, i) => {
                const isPopular = cards.length === 3 && i === 1; // Middle card if 3 cards
                
                return (
                    <div 
                        key={i} 
                        className={cn(
                            "relative bg-white rounded-3xl p-5 md:p-6 lg:p-7 xl:p-8 flex flex-col transition-all duration-300 border hover:-translate-y-1 hover:shadow-xl",
                            isPopular 
                                ? "border-indigo-200 shadow-xl shadow-indigo-500/10 scale-[1.02] z-10" 
                                : "border-slate-200 shadow-md shadow-slate-200/50 z-0"
                        )}
                    >
                        {isPopular && (
                            <div className={`absolute top-0 inset-x-0 h-2 bg-gradient-to-r ${gradient} rounded-t-3xl`} />
                        )}
                        
                        {isPopular && (
                            <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
                                <span className={cn(
                                    "text-xs flex items-center gap-1.5 font-bold text-white px-3 py-1 rounded-full uppercase tracking-widest shadow-sm ring-4 ring-white",
                                    `bg-gradient-to-r ${gradient}`
                                )}>
                                    <Zap className="w-3 h-3 fill-current" />
                                    Najlepszy wybór
                                </span>
                            </div>
                        )}

                        <div className={cn("text-center mb-6", isPopular ? "mt-4" : "")}>
                            <h3 className="text-2xl font-black text-slate-900 mb-1">{card.name}</h3>
                            <p className="text-sm font-semibold text-slate-500 uppercase tracking-widest">{card.label}</p>
                            
                            <div className="mt-6 mb-2">
                                <span className="text-4xl font-extrabold text-slate-900">{card.price.replace("PLN", "").trim()}</span>
                                {card.price.includes("PLN") && <span className="text-lg font-bold text-slate-400 ml-1">PLN</span>}
                            </div>
                        </div>

                        <Button 
                            onClick={() => handleSelect(card.name)}
                            className={cn(
                                "w-full py-6 rounded-xl font-bold text-base mb-8 transition-all hover:scale-[1.02]",
                                isPopular 
                                    ? `bg-gradient-to-r ${gradient} text-white shadow-md shadow-indigo-500/25` 
                                    : "bg-slate-100 text-slate-800 hover:bg-slate-200"
                            )}
                        >
                            Wybieram {card.name}
                            <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>

                        <div className="flex-1 space-y-4">
                            {card.features.map((feature, idx) => (
                                <div key={idx} className="flex items-start gap-3">
                                    <FeatureIcon value={feature.value} />
                                    <div className="text-sm">
                                        <span className="font-semibold text-slate-700 block mb-0.5">{feature.name}</span>
                                        <span className="text-slate-600 leading-snug">
                                            <FormatInline text={feature.value} />
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

// Helper to determine the best icon for the feature
function FeatureIcon({ value }: { value: string }) {
    if (value === "—" || value === "-" || value.toLowerCase().includes("brak") || value.includes("✗") || value.includes("✕")) {
        return <XCircle className="w-5 h-5 text-slate-300 shrink-0 mt-0.5" />;
    }
    
    if (value.includes("✔") || value.includes("✓")) {
        return <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />;
    }

    return <CheckCircle2 className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />; // Default tick
}

function FormatInline({ text }: { text: string }) {
    // Strip bold markers and checks since we use custom styling
    const cleanText = text.replace(/\*\*/g, "").replace(/(✔|✓|✗|✕)/g, "").trim();
    if (cleanText === "—" || cleanText === "-") return <span className="text-slate-400 italic">Brak w tym pakiecie</span>;
    return <>{cleanText}</>;
}
