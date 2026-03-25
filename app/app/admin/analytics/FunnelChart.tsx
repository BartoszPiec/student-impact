"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowDown, Briefcase, FileText, CheckCircle2, DollarSign } from "lucide-react";

interface FunnelData {
  offers: number;
  applications: number;
  accepted: number;
  contracts: number;
}

interface FunnelChartProps {
  data: FunnelData;
}

export function FunnelChart({ data }: FunnelChartProps) {
  const steps = [
    { label: 'Oferty', value: data.offers, icon: Briefcase, color: 'bg-slate-100 text-slate-600' },
    { label: 'Aplikacje', value: data.applications, icon: FileText, color: 'bg-blue-100 text-blue-600' },
    { label: 'Zaakceptowane', value: data.accepted, icon: CheckCircle2, color: 'bg-indigo-100 text-indigo-600' },
    { label: 'Zrealizowane', value: data.contracts, icon: DollarSign, color: 'bg-emerald-100 text-emerald-600' },
  ];

  return (
    <Card className="border-none shadow-xl shadow-slate-200/50 bg-white rounded-[2.5rem] overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="text-xl font-black text-slate-900 tracking-tight italic">
          Lejek Konwersji
        </CardTitle>
      </CardHeader>
      <CardContent className="p-8 pt-4">
        <div className="space-y-4">
          {steps.map((step, idx) => {
            const nextStep = steps[idx + 1];
            const dropoff = nextStep ? Math.round((nextStep.value / (step.value || 1)) * 100) : null;
            
            return (
              <div key={step.label}>
                <div className="relative group">
                  <div className="flex items-center gap-6 p-4 rounded-3xl border border-slate-50 hover:bg-slate-50 transition-all duration-300">
                    <div className={`h-14 w-14 rounded-2xl ${step.color} flex items-center justify-center shrink-0 shadow-sm shadow-black/5`}>
                      <step.icon className="w-7 h-7" />
                    </div>
                    
                    <div className="flex-1">
                      <div className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">{step.label}</div>
                      <div className="text-3xl font-black text-slate-900 tabular-nums">
                        {step.value}
                      </div>
                    </div>

                    {idx === 0 && (
                        <div className="text-right">
                            <div className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Baseline</div>
                            <div className="text-sm font-bold text-slate-400">100%</div>
                        </div>
                    )}
                    
                    {dropoff !== null && (
                      <div className="text-right">
                        <div className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Konwersja</div>
                        <div className="text-xl font-black text-indigo-600">{dropoff}%</div>
                      </div>
                    )}
                  </div>
                </div>

                {idx < steps.length - 1 && (
                  <div className="flex justify-center -my-2 relative z-10">
                    <div className="bg-white p-1.5 rounded-full border border-slate-100 shadow-sm">
                      <ArrowDown className="w-4 h-4 text-slate-300 animate-bounce" />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-8 p-6 bg-indigo-50/50 rounded-3xl border border-indigo-100/30">
            <h4 className="text-xs font-black text-indigo-900 uppercase tracking-widest mb-2 italic">Globalna Skuteczność</h4>
            <div className="flex items-center gap-4">
                <div className="text-4xl font-black text-indigo-600">
                    {data.offers > 0 ? Math.round((data.contracts / data.offers) * 100) : 0}%
                </div>
                <p className="text-sm font-medium text-indigo-600/70 leading-relaxed">
                    Taki procent ofert kończy się pomyślnie zawartym i zrealizowanym kontraktem.
                </p>
            </div>
        </div>
      </CardContent>
    </Card>
  );
}
