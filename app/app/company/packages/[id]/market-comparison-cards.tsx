"use client";

import { cn } from "@/lib/utils";
import { TrendingDown, Trophy, Scale, Building2 } from "lucide-react";
import { MarkdownLite } from "@/components/markdown-lite";

interface MarketComparisonCardsProps {
    markdownContent: string;
    gradient: string;
}

export function MarketComparisonCards({ markdownContent, gradient }: MarketComparisonCardsProps) {
    const lines = markdownContent.split("\n");
    const tableLines: string[] = [];
    const paragraphsBeforeTable: string[] = [];
    let inTable = false;

    for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith("|") && trimmed.endsWith("|")) {
            tableLines.push(trimmed);
            inTable = true;
        } else if (inTable) {
            if (trimmed !== "") break; 
        } else {
            if (trimmed) paragraphsBeforeTable.push(trimmed);
        }
    }

    if (tableLines.length < 3) {
        return <MarkdownLite content={markdownContent} />;
    }

    const headers = tableLines[0]
        .split("|")
        .filter((_, idx, arr) => idx > 0 && idx < arr.length - 1)
        .map(cell => cell.trim().replace(/\*\*/g, ""));

    let dataStartIdx = 1;
    if (/^\|[\s\-:|]+\|$/.test(tableLines[1])) {
        dataStartIdx = 2;
    }

    const marketOptions = [];
    let studentOption = null;

    for (let r = dataStartIdx; r < tableLines.length; r++) {
        const cells = tableLines[r]
            .split("|")
            .filter((_, idx, arr) => idx > 0 && idx < arr.length - 1)
            .map(cell => cell.trim());

        if (cells.length === 0) continue;

        const isOurs = cells[0].includes("**") || cells[0].toLowerCase().includes("ja") || cells[0].toLowerCase().includes("student") || cells[0].toLowerCase().includes("twój");
        
        const cleanCells = cells.map(c => c.replace(/\*\*/g, "").trim());

        const option = {
            provider: cleanCells[0] || "",
            deliverables: cleanCells[1] || "",
            price: cleanCells[2] || ""
        };

        if (isOurs) {
            studentOption = option;
        } else {
            marketOptions.push(option);
        }
    }

    if (!studentOption && marketOptions.length > 0) {
        studentOption = marketOptions.pop();
    }

    if (!studentOption || marketOptions.length === 0) {
        return <MarkdownLite content={markdownContent} />;
    }

    return (
        <div className="mt-4">
            {paragraphsBeforeTable.length > 0 && (
                <div className="mb-10 text-slate-600 prose-lg">
                    <MarkdownLite content={paragraphsBeforeTable.join("\n")} />
                </div>
            )}

            <div className="relative mt-8">
                <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center border border-slate-200/50">
                        <Building2 className="w-5 h-5 text-slate-500" />
                    </div>
                    Dostępne na rynku opcje
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-12">
                    {marketOptions.map((opt, i) => (
                        <div key={i} className="bg-white/50 border border-slate-200/60 rounded-3xl p-6 relative overflow-hidden group hover:bg-white hover:shadow-xl hover:shadow-slate-200/50 hover:border-slate-300 transition-all duration-500">
                            <div className="absolute -top-6 -right-6 p-4 opacity-[0.03] group-hover:opacity-10 transition-opacity group-hover:scale-110 duration-500 pointer-events-none">
                                <Scale className="w-40 h-40 text-slate-900" />
                            </div>
                            
                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">{headers[0]}</div>
                            <div className="text-xl font-bold text-slate-800 mb-6">{opt.provider}</div>
                            
                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">{headers[1]}</div>
                            <div className="text-sm text-slate-600 mb-6 leading-relaxed line-clamp-3">{opt.deliverables}</div>
                            
                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">{headers[2]}</div>
                            <div className="text-2xl font-black text-slate-700">{opt.price}</div>
                        </div>
                    ))}
                </div>

                {/* The Winner / Our Option */}
                <div className="relative mb-6 pt-6"> {/* Added pt-6 here to give space above the card for the badge */}
                    <div className="absolute left-1/2 -ml-[1px] -top-2 w-[2px] h-8 bg-gradient-to-b from-transparent to-slate-200" />
                    <div className="absolute left-1/2 -translate-x-1/2 -top-2 z-10 w-8 h-8 rounded-full bg-slate-50 border-2 border-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-400 uppercase tracking-widest shadow-sm">
                        VS
                    </div>

                    <div className="bg-white rounded-[2.5rem] border border-indigo-100 shadow-2xl shadow-indigo-500/10 overflow-hidden relative group transition-transform duration-700 hover:-translate-y-2 mt-4">
                        <div className={`absolute top-0 inset-x-0 h-3 bg-gradient-to-r ${gradient}`} />
                        <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-[0.02] group-hover:opacity-[0.04] transition-opacity duration-700 pointer-events-none`} />
                        
                        <div className="p-8 md:p-12">
                            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-10 relative z-10">
                                <div className="flex-1">
                                    <div className="flex items-center gap-4 mb-3">
                                        <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg shadow-indigo-500/30 text-white shrink-0`}>
                                            <Trophy className="w-7 h-7" />
                                        </div>
                                        <div>
                                            <div className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-1">Twój optymalny wybór</div>
                                            <div className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight leading-none">{studentOption.provider}</div>
                                        </div>
                                    </div>
                                    
                                    <div className="mt-10">
                                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2.5">{headers[1]}</div>
                                        <p className="text-lg text-slate-700 font-medium leading-relaxed bg-white/80 backdrop-blur rounded-2xl p-6 border border-slate-100 shadow-sm">
                                            {studentOption.deliverables}
                                        </p>
                                    </div>
                                </div>

                                <div className="xl:w-[350px] shrink-0 bg-slate-900 rounded-[2rem] p-8 text-white relative overflow-hidden shadow-2xl transition-transform duration-500 group-hover:scale-[1.02]">
                                    <div className={`absolute -right-16 -top-16 w-48 h-48 bg-gradient-to-br ${gradient} opacity-40 blur-3xl rounded-full pointer-events-none transition-all duration-700 group-hover:opacity-60 group-hover:scale-110`} />
                                    
                                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 relative z-10 opacity-80">{headers[2]}</div>
                                    <div className="text-4xl md:text-5xl font-black text-white relative z-10 mb-2 leading-none">
                                        {studentOption.price.replace("PLN", "").trim()} 
                                        <span className="text-2xl text-slate-400 font-bold ml-2">PLN</span>
                                    </div>
                                    
                                    <div className="flex items-center gap-2 text-emerald-400 font-bold mt-6 text-sm relative z-10 bg-emerald-400/10 px-4 py-2 rounded-full w-fit border border-emerald-400/20 backdrop-blur-sm">
                                        <TrendingDown className="w-4 h-4" />
                                        Zoptymalizowany budżet
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
