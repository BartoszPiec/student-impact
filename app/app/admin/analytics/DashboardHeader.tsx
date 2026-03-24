"use client";

import { Activity, Calendar, Download, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DashboardHeaderProps {
  onRefresh: () => void;
  loading: boolean;
}

export function DashboardHeader({ onRefresh, loading }: DashboardHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
            <Activity className="w-5 h-5" />
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight italic uppercase">
            Platform <span className="text-indigo-600">Intelligence</span>
          </h1>
        </div>
        <p className="text-slate-500 font-medium max-w-xl">
          Zaawansowana analityka biznesowa, lejek konwersji i audyt finansowy platformy Student2Work.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-2xl border border-slate-200 shadow-sm text-sm font-bold text-slate-600">
          <Calendar className="w-4 h-4 text-indigo-500" />
          Ostatnie 30 dni
        </div>
        
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onRefresh}
          disabled={loading}
          className="rounded-2xl border-slate-200 hover:bg-slate-50 font-bold text-xs uppercase tracking-widest h-10 px-6 gap-2"
        >
          <RefreshCcw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Odśwież
        </Button>

        <Button 
          variant="default" 
          size="sm" 
          className="rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs uppercase tracking-widest h-10 px-6 gap-2 shadow-lg shadow-slate-200"
        >
          <Download className="w-3.5 h-3.5" />
          Eksportuj Raport
        </Button>
      </div>
    </div>
  );
}
