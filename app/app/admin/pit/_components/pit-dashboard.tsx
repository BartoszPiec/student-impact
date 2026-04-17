"use client";

import Link from "next/link";
import { useDeferredValue, useMemo, useState, useTransition } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Calendar,
  CheckCircle2,
  Clock,
  Receipt,
  Search,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { markPitBatchPaid, markPitPaid } from "../_actions";

interface PitWithholding {
  id: string;
  contract_id: string;
  milestone_id: string;
  student_id: string;
  student_name: string;
  amount_gross: number;
  kup_rate: number;
  taxable_base: number;
  pit_rate: number;
  pit_amount: number;
  amount_net: number;
  status: string;
  paid_to_us_at: string | null;
  tax_period: string | null;
  created_at: string;
}

interface Props {
  withholdings: PitWithholding[];
}

type PitFilter = "all" | "pending" | "paid";

function formatMoney(value: number) {
  return Number(value || 0).toLocaleString("pl-PL", {
    style: "currency",
    currency: "PLN",
  });
}

export default function PitDashboard({ withholdings }: Props) {
  const [filter, setFilter] = useState<PitFilter>("all");
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search.trim().toLowerCase());
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isPending, startTransition] = useTransition();

  const filteredWithholdings = useMemo(() => {
    return withholdings.filter((withholding) => {
      if (filter === "pending" && withholding.status !== "pending") {
        return false;
      }

      if (filter === "paid" && withholding.status !== "paid") {
        return false;
      }

      if (!deferredSearch) {
        return true;
      }

      const searchable = [
        withholding.student_name,
        withholding.contract_id,
        withholding.tax_period || "",
        withholding.status,
      ]
        .join(" ")
        .toLowerCase();

      return searchable.includes(deferredSearch);
    });
  }, [deferredSearch, filter, withholdings]);

  const grouped = useMemo(() => {
    const groups: Record<string, PitWithholding[]> = {};

    filteredWithholdings.forEach((withholding) => {
      const period = withholding.tax_period || "Brak okresu";
      if (!groups[period]) groups[period] = [];
      groups[period].push(withholding);
    });

    return Object.entries(groups).sort((left, right) => right[0].localeCompare(left[0]));
  }, [filteredWithholdings]);

  const visiblePendingIds = filteredWithholdings
    .filter((withholding) => withholding.status === "pending")
    .map((withholding) => withholding.id);

  const totalPending = withholdings
    .filter((withholding) => withholding.status === "pending")
    .reduce((sum, withholding) => sum + Number(withholding.pit_amount || 0), 0);
  const totalPaid = withholdings
    .filter((withholding) => withholding.status === "paid")
    .reduce((sum, withholding) => sum + Number(withholding.pit_amount || 0), 0);
  const pendingCount = withholdings.filter((withholding) => withholding.status === "pending").length;
  const uniqueStudents = new Set(withholdings.map((withholding) => withholding.student_id)).size;

  const toggleSelect = (id: string) => {
    setSelectedIds((previous) => {
      const next = new Set(previous);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAllPending = () => {
    if (visiblePendingIds.length === 0) {
      setSelectedIds(new Set());
      return;
    }

    const allVisiblePendingSelected = visiblePendingIds.every((id) => selectedIds.has(id));

    if (allVisiblePendingSelected) {
      setSelectedIds((previous) => {
        const next = new Set(previous);
        visiblePendingIds.forEach((id) => next.delete(id));
        return next;
      });
      return;
    }

    setSelectedIds((previous) => {
      const next = new Set(previous);
      visiblePendingIds.forEach((id) => next.add(id));
      return next;
    });
  };

  const handleMarkPaid = (id: string) => {
    startTransition(async () => {
      try {
        await markPitPaid(id);
        setSelectedIds((previous) => {
          const next = new Set(previous);
          next.delete(id);
          return next;
        });
        toast.success("Oznaczono jako oplacone.");
      } catch (error) {
        const message = error instanceof Error ? error.message : "Nieznany blad";
        toast.error(`Blad: ${message}`);
      }
    });
  };

  const handleBatchPaid = () => {
    if (selectedIds.size === 0) return;

    startTransition(async () => {
      try {
        await markPitBatchPaid(Array.from(selectedIds));
        const count = selectedIds.size;
        setSelectedIds(new Set());
        toast.success(`Oznaczono ${count} pozycji jako oplacone.`);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Nieznany blad";
        toast.error(`Blad: ${message}`);
      }
    });
  };

  return (
    <div className="space-y-8 pb-12">
      <div className="relative overflow-hidden rounded-[2.5rem] border border-white/5 bg-slate-900/50 p-8 shadow-2xl">
        <div className="relative z-10 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-amber-500/30 bg-amber-500/20">
                <Receipt className="h-6 w-6 text-amber-400" />
              </div>
              <span className="text-xs font-black uppercase tracking-[0.2em] text-amber-400/80">
                Finance
              </span>
            </div>
            <h1 className="mb-3 text-4xl font-black leading-none tracking-tight text-white md:text-5xl">
              Zaliczki PIT
            </h1>
            <p className="max-w-2xl font-medium leading-relaxed text-slate-400">
              Operacyjny panel zaliczek podatkowych. Pozwala wyszukiwac studentow,
              grupowac rekordy po okresie i zamykac platnosci do urzedu bez nowych migracji.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <div className="rounded-3xl border border-white/5 bg-slate-950/40 p-5">
          <div className="text-xs font-black uppercase tracking-widest text-slate-500">
            Do zaplaty
          </div>
          <div className="mt-2 text-3xl font-black text-white">{formatMoney(totalPending)}</div>
          <div className="mt-1 text-sm text-slate-400">Suma oczekujacych zaliczek</div>
        </div>
        <div className="rounded-3xl border border-white/5 bg-slate-950/40 p-5">
          <div className="text-xs font-black uppercase tracking-widest text-slate-500">
            Oplacone
          </div>
          <div className="mt-2 text-3xl font-black text-white">{formatMoney(totalPaid)}</div>
          <div className="mt-1 text-sm text-slate-400">Suma zamknietych zaliczek</div>
        </div>
        <div className="rounded-3xl border border-white/5 bg-slate-950/40 p-5">
          <div className="text-xs font-black uppercase tracking-widest text-slate-500">
            Oczekujace
          </div>
          <div className="mt-2 text-3xl font-black text-white">{pendingCount}</div>
          <div className="mt-1 text-sm text-slate-400">Pozycje gotowe do rozliczenia</div>
        </div>
        <div className="rounded-3xl border border-white/5 bg-slate-950/40 p-5">
          <div className="text-xs font-black uppercase tracking-widest text-slate-500">
            Studentow
          </div>
          <div className="mt-2 text-3xl font-black text-white">{uniqueStudents}</div>
          <div className="mt-1 text-sm text-slate-400">Unikalne osoby w widoku PIT</div>
        </div>
      </div>

      <div className="overflow-hidden rounded-[2.5rem] border border-white/5 bg-slate-950/40 shadow-xl backdrop-blur-sm">
        <div className="border-b border-white/5 bg-white/5 p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-bold text-slate-400">
                Rekordow: {filteredWithholdings.length} / {withholdings.length}
              </span>
              {(["all", "pending", "paid"] as const).map((value) => (
                <Button
                  key={value}
                  variant="outline"
                  size="sm"
                  onClick={() => setFilter(value)}
                  className={
                    filter === value
                      ? "border-amber-400/30 bg-amber-500/10 text-amber-300 hover:bg-amber-500/15"
                      : "border-white/10 bg-transparent text-slate-400 hover:bg-white/5 hover:text-white"
                  }
                >
                  {value === "all" && "Wszystkie"}
                  {value === "pending" && "Oczekujace"}
                  {value === "paid" && "Oplacone"}
                </Button>
              ))}
            </div>

            <div className="flex flex-col gap-3 md:flex-row md:items-center">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <Input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Szukaj po studencie, kontrakcie lub okresie"
                  className="h-10 min-w-[280px] border-white/10 bg-slate-900/60 pl-9 text-white placeholder:text-slate-500"
                />
              </div>

              {selectedIds.size > 0 ? (
                <Button
                  onClick={handleBatchPaid}
                  disabled={isPending}
                  className="bg-emerald-600 text-white hover:bg-emerald-700"
                >
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Oznacz {selectedIds.size} jako oplacone
                </Button>
              ) : null}

              {visiblePendingIds.length > 0 ? (
                <Button
                  variant="outline"
                  onClick={selectAllPending}
                  className="border-white/10 bg-transparent text-slate-300 hover:bg-white/5 hover:text-white"
                >
                  {visiblePendingIds.every((id) => selectedIds.has(id))
                    ? "Odznacz widoczne"
                    : "Zaznacz widoczne oczekujace"}
                </Button>
              ) : null}
            </div>
          </div>
        </div>

        {grouped.length === 0 ? (
          <div className="py-20 text-center">
            <div className="flex flex-col items-center gap-3">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/5">
                <Receipt className="h-8 w-8 text-slate-700" />
              </div>
              <p className="font-bold text-slate-500">
                {deferredSearch
                  ? "Brak zaliczek PIT pasujacych do wyszukiwania."
                  : "Brak zaliczek PIT do wyswietlenia."}
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-8 p-6">
            {grouped.map(([period, items]) => {
              const periodTotal = items.reduce(
                (sum, withholding) => sum + Number(withholding.pit_amount || 0),
                0,
              );
              const pendingInPeriod = items.filter((withholding) => withholding.status === "pending").length;

              return (
                <div
                  key={period}
                  className="overflow-hidden rounded-[2rem] border border-white/5 bg-slate-900/40"
                >
                  <div className="border-b border-white/5 bg-slate-950/20 px-6 py-4">
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div className="flex items-center gap-3 text-sm font-black text-slate-200">
                        <Calendar className="h-4 w-4 text-amber-400" />
                        <span>Okres: {period}</span>
                      </div>

                      <div className="flex items-center gap-3">
                        {pendingInPeriod > 0 ? (
                          <Badge className="border border-amber-500/20 bg-amber-500/10 text-amber-300 hover:bg-amber-500/10">
                            <Clock className="mr-1 h-3 w-3" />
                            {pendingInPeriod} oczekujace
                          </Badge>
                        ) : (
                          <Badge className="border border-emerald-500/20 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/10">
                            <CheckCircle2 className="mr-1 h-3 w-3" />
                            Okres zamkniety
                          </Badge>
                        )}

                        <Badge className="border border-white/10 bg-slate-950/40 font-mono text-slate-300 hover:bg-slate-950/40">
                          Suma PIT: {formatMoney(periodTotal)}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-left">
                      <thead>
                        <tr className="border-b border-white/5 bg-slate-950/10">
                          <th className="w-10 px-3 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-slate-500"></th>
                          <th className="px-3 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-slate-500">
                            Student
                          </th>
                          <th className="px-3 py-3 text-right text-[10px] font-bold uppercase tracking-wider text-slate-500">
                            Brutto
                          </th>
                          <th className="px-3 py-3 text-right text-[10px] font-bold uppercase tracking-wider text-slate-500">
                            KUP
                          </th>
                          <th className="px-3 py-3 text-right text-[10px] font-bold uppercase tracking-wider text-slate-500">
                            Podstawa
                          </th>
                          <th className="px-3 py-3 text-right text-[10px] font-bold uppercase tracking-wider text-slate-500">
                            Stawka
                          </th>
                          <th className="px-3 py-3 text-right text-[10px] font-bold uppercase tracking-wider text-slate-500">
                            PIT
                          </th>
                          <th className="px-3 py-3 text-right text-[10px] font-bold uppercase tracking-wider text-slate-500">
                            Netto
                          </th>
                          <th className="px-3 py-3 text-center text-[10px] font-bold uppercase tracking-wider text-slate-500">
                            Status
                          </th>
                          <th className="px-3 py-3 text-center text-[10px] font-bold uppercase tracking-wider text-slate-500">
                            Akcja
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {items.map((withholding) => (
                          <tr
                            key={withholding.id}
                            className={
                              selectedIds.has(withholding.id)
                                ? "bg-emerald-500/5 transition-colors"
                                : "transition-colors hover:bg-white/5"
                            }
                          >
                            <td className="px-3 py-3 text-center">
                              {withholding.status === "pending" ? (
                                <Checkbox
                                  checked={selectedIds.has(withholding.id)}
                                  onCheckedChange={() => toggleSelect(withholding.id)}
                                  className="border-white/20 data-[state=checked]:border-emerald-500 data-[state=checked]:bg-emerald-500"
                                />
                              ) : null}
                            </td>
                            <td className="px-3 py-3">
                              <div className="text-sm font-semibold text-slate-200">
                                {withholding.student_name}
                              </div>
                              <div className="font-mono text-[10px] text-slate-500">
                                <Link
                                  href={`/app/admin/contracts/${withholding.contract_id}`}
                                  className="transition-colors hover:text-emerald-300"
                                >
                                  {withholding.contract_id.slice(0, 8)}...
                                </Link>
                              </div>
                            </td>
                            <td className="px-3 py-3 text-right font-mono text-sm text-slate-300">
                              {Number(withholding.amount_gross || 0).toFixed(2)}
                            </td>
                            <td className="px-3 py-3 text-right font-mono text-sm text-slate-400">
                              {(Number(withholding.kup_rate || 0) * 100).toFixed(0)}%
                            </td>
                            <td className="px-3 py-3 text-right font-mono text-sm text-slate-300">
                              {Number(withholding.taxable_base || 0).toFixed(2)}
                            </td>
                            <td className="px-3 py-3 text-right font-mono text-sm text-slate-400">
                              {(Number(withholding.pit_rate || 0) * 100).toFixed(0)}%
                            </td>
                            <td className="px-3 py-3 text-right font-mono text-sm font-bold text-white">
                              {Number(withholding.pit_amount || 0).toFixed(2)}
                            </td>
                            <td className="px-3 py-3 text-right font-mono text-sm text-slate-300">
                              {Number(withholding.amount_net || 0).toFixed(2)}
                            </td>
                            <td className="px-3 py-3 text-center">
                              {withholding.status === "paid" ? (
                                <Badge className="border border-emerald-500/20 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/10">
                                  <CheckCircle2 className="mr-1 h-3 w-3" />
                                  Oplacone
                                </Badge>
                              ) : (
                                <Badge className="border border-amber-500/20 bg-amber-500/10 text-amber-300 hover:bg-amber-500/10">
                                  <Clock className="mr-1 h-3 w-3" />
                                  Oczekujace
                                </Badge>
                              )}
                            </td>
                            <td className="px-3 py-3 text-center">
                              {withholding.status === "pending" ? (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="border-emerald-400/20 bg-emerald-500/10 text-xs text-emerald-300 hover:bg-emerald-500/15 hover:text-white"
                                  onClick={() => handleMarkPaid(withholding.id)}
                                  disabled={isPending}
                                >
                                  Oplac
                                </Button>
                              ) : null}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
