"use client";

import { useState } from "react";
import { TrendingUp } from "lucide-react";

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

function formatChartValue(value: number) {
    return new Intl.NumberFormat("pl-PL", {
        notation: value >= 10000 ? "compact" : "standard",
        maximumFractionDigits: 1,
    }).format(value);
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
            <div className="mb-6 flex flex-col items-start justify-between gap-4 sm:mb-8 sm:flex-row sm:items-center">
                <div>
                    <h3 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-indigo-500" />
                        Przychody
                    </h3>
                    <p className="text-slate-500 font-medium text-sm mt-1">Ostatnie 6 miesięcy</p>
                </div>

                <div className="grid w-full grid-cols-2 gap-1.5 rounded-xl bg-slate-100 p-1.5 sm:w-auto sm:flex sm:items-center sm:gap-3">
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

            <div className="relative h-[240px] w-full sm:h-[300px]">
                {/* Y-Axis Grid */}
                <div className="pointer-events-none absolute inset-0 flex select-none flex-col justify-between pl-8 text-[10px] font-bold text-slate-300 sm:pl-10">
                    {[100, 75, 50, 25, 0].map((pct) => (
                        <div key={pct} className="w-full border-t border-dashed border-slate-100 relative group">
                            <span className="absolute -left-8 -top-3 w-7 text-left transition-colors group-hover:text-indigo-300 sm:-left-10 sm:w-9">
                                {formatChartValue(Math.round(yAxisMax * (pct / 100)))}
                            </span>
                        </div>
                    ))}
                </div>

                {/* Bars Container */}
                <div className="absolute inset-y-0 left-8 right-0 flex items-end justify-between gap-2 pl-1 sm:left-10 sm:gap-6">
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
                                            <span className="font-mono font-bold">{formatChartValue(item.pending)}</span>
                                        </div>
                                    )}
                                    {showPaid && (
                                        <div className="flex justify-between items-center gap-4 mb-2">
                                            <span className="text-emerald-400 flex items-center gap-1.5 font-medium"><div className="w-1.5 h-1.5 bg-emerald-400 rounded-full" /> Wypłacone</span>
                                            <span className="font-mono font-bold">{formatChartValue(item.paid)}</span>
                                        </div>
                                    )}

                                    <div className="border-t border-white/10 pt-2 mt-2 flex justify-between items-center font-black text-white">
                                        <span>RAZEM</span>
                                        <span>{formatChartValue(item.total)} PLN</span>
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
                                        <div className="absolute inset-0 bg-gradient-to-br from-white/25 to-transparent" />
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
