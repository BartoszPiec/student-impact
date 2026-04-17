"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
  ALLOWED_COMMISSION_RATE_OPTIONS,
  formatCommissionRateLabel,
  resolveDefaultCommissionRate,
} from "@/lib/commission";
import { updateSystemServiceCommission } from "./_actions";

export function ServiceCommissionEditor({
  serviceId,
  initialRate,
}: {
  serviceId: string;
  initialRate: number | null;
}) {
  const [value, setValue] = useState(initialRate == null ? "auto" : String(initialRate));
  const [isPending, startTransition] = useTransition();
  const autoLabel = formatCommissionRateLabel(
    resolveDefaultCommissionRate({ sourceType: "service_order", isPlatformService: true }),
  );

  const handleSave = () => {
    startTransition(async () => {
      const result = await updateSystemServiceCommission(
        serviceId,
        value === "auto" ? "" : value,
      );

      if (result?.error) {
        toast.error(`Blad zapisu prowizji: ${result.error}`);
        return;
      }

      toast.success("Prowizja uslugi zostala zaktualizowana.");
    });
  };

  return (
    <div className="space-y-2 rounded-2xl border border-white/5 bg-white/5 p-4">
      <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">
        Prowizja
      </div>
      <div className="flex items-center gap-2">
        <select
          value={value}
          onChange={(event) => setValue(event.target.value)}
          className="h-10 flex-1 rounded-xl border border-white/10 bg-slate-900/70 px-3 text-sm font-bold text-slate-200 outline-none"
          disabled={isPending}
        >
          <option value="auto">Auto ({autoLabel})</option>
          {ALLOWED_COMMISSION_RATE_OPTIONS.map((rate) => (
            <option key={rate} value={String(rate)}>
              {formatCommissionRateLabel(rate)}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={handleSave}
          disabled={isPending}
          className="h-10 rounded-xl bg-amber-500 px-4 text-xs font-black uppercase tracking-widest text-slate-950 transition-colors hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Zapisz
        </button>
      </div>
    </div>
  );
}
