"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Calendar, TrendingUp } from "lucide-react";

interface ChartData {
    key: string;
    label: string;
    paid: number;
    pending: number;
    total: number;
}

interface FinanceChartProps {
    data: ChartData[];
}

export default function FinanceChart({ data }: FinanceChartProps) {
    const [showPaid, setShowPaid] = useState(true);
    const [showPending, setShowPending] = useState(true);

    // Calculate max value based on visible series
    const maxVal = Math.max(
        ...data.map(d => {
            let sum = 0;
            if (showPaid) sum += d.paid;
            if (showPending) sum += d.pending;
            return sum;
        }),
        100 // Minimum scale
    );

    // Smooth max value
    const yAxisMax = Math.ceil(maxVal / 100) * 100;

    return (
        <div className="flex flex-col h-full w-full">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
                <div>
                    <h3 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-indigo-500" />
                        Przychody
                    </h3>
                    <p className="text-slate-500 font-medium text-sm mt-1">Ostatnie 6 miesięcy</p>
                </div>

                <div className="flex items-center gap-3 p-1.5 bg-slate-100 rounded-xl">
                    <button
                        onClick={() => setShowPaid(!showPaid)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wide transition-all ${showPaid ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'
                            }`}
                    >
                        Wypłacone
                    </button>
                    <button
                        onClick={() => setShowPending(!showPending)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wide transition-all ${showPending ? 'bg-white text-amber-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'
                            }`}
                    >
                        W toku
                    </button>
                </div>
            </div>

            <div className="relative h-[300px] w-full">
                {/* Y-Axis Grid */}
                <div className="absolute inset-0 flex flex-col justify-between text-[10px] font-bold text-slate-300 select-none pointer-events-none">
                    {[100, 75, 50, 25, 0].map((pct) => (
                        <div key={pct} className="w-full border-t border-dashed border-slate-100 relative group">
                            <span className="absolute -top-3 right-full pr-4 w-12 text-right group-hover:text-indigo-300 transition-colors">
                                {Math.round(yAxisMax * (pct / 100))}
                            </span>
                        </div>
                    ))}
                </div>

                {/* Bars Container */}
                <div className="absolute inset-0 flex items-end justify-between gap-2 sm:gap-6 pl-2">
                    {data.map((item) => {
                        const valPaid = showPaid ? item.paid : 0;
                        const valPending = showPending ? item.pending : 0;
                        const heightPaid = (valPaid / yAxisMax) * 100;
                        const heightPending = (valPending / yAxisMax) * 100;

                        return (
                            <div key={item.key} className="relative flex-1 h-full flex flex-col justify-end group">
                                {/* Tooltip */}
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 opacity-0 scale-90 group-hover:opacity-100 group-hover:scale-100 transition-all duration-300 bg-slate-900/90 backdrop-blur text-white text-xs p-4 rounded-2xl shadow-2xl pointer-events-none whitespace-nowrap z-50 min-w-[140px]">
                                    <div className="font-bold mb-3 text-slate-200 uppercase tracking-widest text-[10px] border-b border-white/10 pb-2">{item.label}</div>

                                    {showPending && (
                                        <div className="flex justify-between items-center gap-4 mb-2">
                                            <span className="text-amber-400 flex items-center gap-1.5 font-medium"><div className="w-1.5 h-1.5 bg-amber-400 rounded-full" /> W toku</span>
                                            <span className="font-mono font-bold">{item.pending}</span>
                                        </div>
                                    )}
                                    {showPaid && (
                                        <div className="flex justify-between items-center gap-4 mb-2">
                                            <span className="text-emerald-400 flex items-center gap-1.5 font-medium"><div className="w-1.5 h-1.5 bg-emerald-400 rounded-full" /> Wypłacone</span>
                                            <span className="font-mono font-bold">{item.paid}</span>
                                        </div>
                                    )}

                                    <div className="border-t border-white/10 pt-2 mt-2 flex justify-between items-center font-black text-white">
                                        <span>RAZEM</span>
                                        <span>{Number(item.total).toFixed(0)} PLN</span>
                                    </div>

                                    {/* Tooltip arrow */}
                                    <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-2 border-8 border-transparent border-t-slate-900/90"></div>
                                </div>

                                {/* Stacked Bars */}
                                <div className="w-full flex-1 flex flex-col justify-end relative rounded-t-xl overflow-hidden shadow-lg group-hover:shadow-indigo-500/20 transition-all duration-300 scale-y-100 group-hover:scale-y-[1.02] origin-bottom">
                                    {/* Suspended "Pending" Block */}
                                    <div
                                        className="w-full bg-amber-400 relative transition-all duration-500 ease-out"
                                        style={{ height: `${heightPending}%` }}
                                    >
                                        <div className="absolute inset-0 opacity-20 bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>
                                    </div>

                                    {/* Base "Paid" Block */}
                                    <div
                                        className="w-full bg-emerald-500 transition-all duration-500 ease-out"
                                        style={{ height: `${heightPaid}%` }}
                                    />
                                </div>

                                {/* X-Axis Label */}
                                <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-[10px] font-black text-slate-400 uppercase tracking-widest group-hover:text-indigo-600 transition-colors">
                                    {item.label}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
