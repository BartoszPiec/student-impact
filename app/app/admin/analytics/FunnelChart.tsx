"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowDown, Briefcase, CheckCircle2, DollarSign, FileText } from "lucide-react";

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
    { label: "Oferty", value: data.offers, icon: Briefcase, color: "bg-slate-500/10 text-slate-300" },
    { label: "Aplikacje", value: data.applications, icon: FileText, color: "bg-blue-500/10 text-blue-300" },
    { label: "Zaakceptowane", value: data.accepted, icon: CheckCircle2, color: "bg-indigo-500/10 text-indigo-300" },
    { label: "Zrealizowane", value: data.contracts, icon: DollarSign, color: "bg-emerald-500/10 text-emerald-300" },
  ];

  return (
    <Card className="overflow-hidden rounded-[2.5rem] border border-white/5 bg-slate-950/50 shadow-xl shadow-black/20">
      <CardHeader className="pb-2">
        <CardTitle className="text-xl font-black tracking-tight text-white">
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
                <div className="group relative">
                  <div className="flex items-center gap-6 rounded-3xl border border-white/5 bg-white/5 p-4 transition-all duration-300 hover:bg-white/10">
                    <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${step.color} shadow-sm shadow-black/5`}>
                      <step.icon className="h-7 w-7" />
                    </div>

                    <div className="flex-1">
                      <div className="mb-1 text-xs font-black uppercase tracking-widest text-slate-500">
                        {step.label}
                      </div>
                      <div className="text-3xl font-black tabular-nums text-white">
                        {step.value}
                      </div>
                    </div>

                    {idx === 0 ? (
                      <div className="text-right">
                        <div className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                          Baseline
                        </div>
                        <div className="text-sm font-bold text-slate-300">100%</div>
                      </div>
                    ) : null}

                    {dropoff !== null ? (
                      <div className="text-right">
                        <div className="text-[10px] font-black uppercase tracking-widest text-indigo-300">
                          Konwersja
                        </div>
                        <div className="text-xl font-black text-indigo-300">{dropoff}%</div>
                      </div>
                    ) : null}
                  </div>
                </div>

                {idx < steps.length - 1 ? (
                  <div className="relative z-10 -my-2 flex justify-center">
                    <div className="rounded-full border border-white/10 bg-slate-900 p-1.5 shadow-sm">
                      <ArrowDown className="h-4 w-4 animate-bounce text-slate-500" />
                    </div>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>

        <div className="mt-8 rounded-3xl border border-indigo-500/20 bg-indigo-500/10 p-6">
          <h4 className="mb-2 text-xs font-black uppercase tracking-widest text-indigo-200">
            Globalna skutecznosc
          </h4>
          <div className="flex items-center gap-4">
            <div className="text-4xl font-black text-indigo-300">
              {data.offers > 0 ? Math.round((data.contracts / data.offers) * 100) : 0}%
            </div>
            <p className="text-sm font-medium leading-relaxed text-indigo-100/80">
              Taki procent ofert konczy sie pomyslnie zawartym i zrealizowanym kontraktem.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
