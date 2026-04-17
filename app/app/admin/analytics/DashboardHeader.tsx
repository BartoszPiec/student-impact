"use client";

import { Activity, Calendar, Download, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DashboardHeaderProps {
  onRefresh: () => void;
  loading: boolean;
}

export function DashboardHeader({ onRefresh, loading }: DashboardHeaderProps) {
  return (
    <div className="relative overflow-hidden rounded-[2.5rem] border border-white/5 bg-slate-900/60 p-8 shadow-2xl shadow-black/20">
      <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
        <div>
          <div className="mb-2 flex items-center gap-3">
            <div className="rounded-2xl border border-indigo-500/30 bg-indigo-500/20 p-3 text-indigo-300">
              <Activity className="h-5 w-5" />
            </div>
            <h1 className="text-4xl font-black uppercase tracking-tight text-white">
              Platform <span className="text-indigo-300">Intelligence</span>
            </h1>
          </div>
          <p className="max-w-xl font-medium text-slate-300">
            Zaawansowana analityka biznesowa, lejek konwersji i audyt finansowy
            platformy Student2Work.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-bold text-slate-200">
            <Calendar className="h-4 w-4 text-indigo-300" />
            Ostatnie 30 dni
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={loading}
            className="h-10 gap-2 rounded-2xl border-white/10 bg-white/5 px-6 text-xs font-bold uppercase tracking-widest text-slate-200 hover:bg-white/10 hover:text-white"
          >
            <RefreshCcw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            Odswiez
          </Button>

          <Button
            variant="default"
            size="sm"
            className="h-10 gap-2 rounded-2xl bg-indigo-500 px-6 text-xs font-bold uppercase tracking-widest text-white shadow-lg shadow-indigo-500/20 hover:bg-indigo-400"
          >
            <Download className="h-3.5 w-3.5" />
            Eksportuj raport
          </Button>
        </div>
      </div>
    </div>
  );
}
