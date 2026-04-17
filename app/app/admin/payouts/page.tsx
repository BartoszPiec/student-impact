"use client";

import Link from "next/link";
import { useCallback, useDeferredValue, useEffect, useMemo, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ArrowRight,
  CheckCircle2,
  DollarSign,
  Loader2,
  RefreshCw,
  Search,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";
import { getPayouts, markPayoutPaid, markPayoutProcessing } from "./_actions";

type PayoutRow = {
  id: string;
  milestone_id: string;
  contract_id: string;
  amount_gross: number;
  platform_fee: number;
  amount_net: number;
  status: string;
  created_at: string;
  paid_at: string | null;
  studentName: string;
  offerTitle: string;
  milestoneTitle: string;
  milestoneIdx: number;
};

type PayoutStatusFilter = "all" | "pending" | "processing" | "paid";
type PayoutSortOption =
  | "created_desc"
  | "created_asc"
  | "net_desc"
  | "net_asc";

function formatMoney(value: number) {
  return Number(value || 0).toLocaleString("pl-PL", {
    style: "currency",
    currency: "PLN",
  });
}

function getStatusBadge(status: string) {
  if (status === "pending") {
    return "rounded-lg border border-amber-500/20 bg-amber-500/10 px-2 py-1 text-[10px] font-black uppercase tracking-wider text-amber-400";
  }

  if (status === "processing") {
    return "rounded-lg border border-blue-500/20 bg-blue-500/10 px-2 py-1 text-[10px] font-black uppercase tracking-wider text-blue-400";
  }

  if (status === "paid") {
    return "rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-2 py-1 text-[10px] font-black uppercase tracking-wider text-emerald-400";
  }

  return "rounded-lg border border-white/10 bg-slate-500/10 px-2 py-1 text-[10px] font-black uppercase tracking-wider text-slate-400";
}

function getStatusLabel(status: string) {
  if (status === "pending") return "Oczekuje";
  if (status === "processing") return "Przetwarzane";
  if (status === "paid") return "Wyplacone";
  return status;
}

export default function AdminPayoutsPage() {
  const [payouts, setPayouts] = useState<PayoutRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<PayoutStatusFilter>("all");
  const [sortBy, setSortBy] = useState<PayoutSortOption>("created_desc");
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search.trim().toLowerCase());
  const [isPending, startTransition] = useTransition();
  const [actionId, setActionId] = useState<string | null>(null);

  const loadPayouts = useCallback(async (statusFilter: PayoutStatusFilter) => {
    setLoading(true);
    try {
      const data = await getPayouts(statusFilter);
      setPayouts(Array.isArray(data) ? (data as PayoutRow[]) : []);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Blad ladowania wyplat";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPayouts(filter);
  }, [filter, loadPayouts]);

  const visiblePayouts = useMemo(() => {
    return [...payouts]
      .filter((payout) => {
        if (!deferredSearch) {
          return true;
        }

        const searchable = [
          payout.id,
          payout.contract_id,
          payout.studentName,
          payout.offerTitle,
          payout.milestoneTitle,
          payout.status,
        ]
          .join(" ")
          .toLowerCase();

        return searchable.includes(deferredSearch);
      })
      .sort((left, right) => {
        if (sortBy === "created_desc") {
          return new Date(right.created_at).getTime() - new Date(left.created_at).getTime();
        }

        if (sortBy === "created_asc") {
          return new Date(left.created_at).getTime() - new Date(right.created_at).getTime();
        }

        const leftNet = Number(left.amount_net || 0);
        const rightNet = Number(right.amount_net || 0);
        return sortBy === "net_asc" ? leftNet - rightNet : rightNet - leftNet;
      });
  }, [deferredSearch, payouts, sortBy]);

  const handleRefresh = () => {
    loadPayouts(filter);
  };

  const handleMarkProcessing = (payoutId: string) => {
    setActionId(payoutId);
    startTransition(async () => {
      try {
        await markPayoutProcessing(payoutId);
        toast.success("Oznaczono jako przetwarzane.");
        await loadPayouts(filter);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Blad aktualizacji statusu.";
        toast.error(message);
      } finally {
        setActionId(null);
      }
    });
  };

  const handleMarkPaid = (payoutId: string) => {
    if (!confirm("Potwierdzasz, ze srodki zostaly przelane do studenta?")) return;

    setActionId(payoutId);
    startTransition(async () => {
      try {
        await markPayoutPaid(payoutId);
        toast.success("Oznaczono jako wyplacone.");
        await loadPayouts(filter);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Blad zatwierdzenia wyplaty.";
        toast.error(message);
      } finally {
        setActionId(null);
      }
    });
  };

  const pendingCount = payouts.filter((payout) => payout.status === "pending").length;
  const pendingTotal = payouts
    .filter((payout) => payout.status === "pending")
    .reduce((sum, payout) => sum + Number(payout.amount_net || 0), 0);
  const processingCount = payouts.filter((payout) => payout.status === "processing").length;
  const paidTotal = payouts
    .filter((payout) => payout.status === "paid")
    .reduce((sum, payout) => sum + Number(payout.amount_net || 0), 0);
  const feeTotal = payouts.reduce((sum, payout) => sum + Number(payout.platform_fee || 0), 0);

  return (
    <div className="space-y-8 pb-12">
      <div className="relative overflow-hidden rounded-[2.5rem] border border-white/5 bg-slate-900/50 p-8 shadow-2xl">
        <div className="relative z-10 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-emerald-500/30 bg-emerald-500/20">
                <Wallet className="h-6 w-6 text-emerald-400" />
              </div>
              <span className="text-xs font-black uppercase tracking-[0.2em] text-emerald-400/80">
                Finance
              </span>
            </div>
            <h1 className="mb-3 text-4xl font-black leading-none tracking-tight text-white md:text-5xl">
              Wyplaty
            </h1>
            <p className="max-w-2xl font-medium leading-relaxed text-slate-400">
              Operacyjny panel wyplat dla studentow. Pozwala szybko wyszukiwac rekordy,
              filtrowac statusy i zamykac payout flow bez zmiany schemy.
            </p>
          </div>

          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={loading}
            className="gap-2 border-white/10 bg-white/5 text-slate-200 hover:bg-white/10 hover:text-white"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Odswiez
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <div className="rounded-3xl border border-white/5 bg-slate-950/40 p-5">
          <div className="text-xs font-black uppercase tracking-widest text-slate-500">
            Oczekujace
          </div>
          <div className="mt-2 text-3xl font-black text-white">{pendingCount}</div>
          <div className="mt-1 text-sm text-slate-400">{formatMoney(pendingTotal)}</div>
        </div>
        <div className="rounded-3xl border border-white/5 bg-slate-950/40 p-5">
          <div className="text-xs font-black uppercase tracking-widest text-slate-500">
            Przetwarzane
          </div>
          <div className="mt-2 text-3xl font-black text-white">{processingCount}</div>
          <div className="mt-1 text-sm text-slate-400">W toku po stronie operacyjnej</div>
        </div>
        <div className="rounded-3xl border border-white/5 bg-slate-950/40 p-5">
          <div className="text-xs font-black uppercase tracking-widest text-slate-500">
            Wyplacone
          </div>
          <div className="mt-2 text-3xl font-black text-white">{formatMoney(paidTotal)}</div>
          <div className="mt-1 text-sm text-slate-400">Kwota netto zamknietych payoutow</div>
        </div>
        <div className="rounded-3xl border border-white/5 bg-slate-950/40 p-5">
          <div className="text-xs font-black uppercase tracking-widest text-slate-500">
            Prowizje
          </div>
          <div className="mt-2 text-3xl font-black text-white">{formatMoney(feeTotal)}</div>
          <div className="mt-1 text-sm text-slate-400">Suma platform fee w widoku</div>
        </div>
      </div>

      <div className="overflow-hidden rounded-[2.5rem] border border-white/5 bg-slate-950/40 shadow-xl backdrop-blur-sm">
        <div className="border-b border-white/5 bg-white/5 p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-bold text-slate-400">
                Rekordow: {visiblePayouts.length} / {payouts.length}
              </span>
              {(["all", "pending", "processing", "paid"] as PayoutStatusFilter[]).map((value) => (
                <Button
                  key={value}
                  variant="outline"
                  size="sm"
                  onClick={() => setFilter(value)}
                  className={
                    filter === value
                      ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/15"
                      : "border-white/10 bg-transparent text-slate-400 hover:bg-white/5 hover:text-white"
                  }
                >
                  {value === "all" && "Wszystkie"}
                  {value === "pending" && "Oczekujace"}
                  {value === "processing" && "Przetwarzane"}
                  {value === "paid" && "Wyplacone"}
                </Button>
              ))}
            </div>

            <div className="flex flex-col gap-3 md:flex-row md:items-center">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <Input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Szukaj po studencie, zleceniu lub ID"
                  className="h-10 min-w-[260px] border-white/10 bg-slate-900/60 pl-9 text-white placeholder:text-slate-500"
                />
              </div>

              <select
                value={sortBy}
                onChange={(event) => setSortBy(event.target.value as PayoutSortOption)}
                className="h-10 rounded-xl border border-white/10 bg-slate-900/60 px-3 text-sm font-bold text-slate-200 outline-none"
              >
                <option value="created_desc">Najnowsze</option>
                <option value="created_asc">Najstarsze</option>
                <option value="net_desc">Najwyzsza kwota netto</option>
                <option value="net_asc">Najnizsza kwota netto</option>
              </select>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-white/5 bg-slate-950/20">
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">
                  Student
                </th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">
                  Zlecenie i etap
                </th>
                <th className="px-6 py-4 text-right text-[10px] font-black uppercase tracking-widest text-slate-500">
                  Brutto
                </th>
                <th className="px-6 py-4 text-right text-[10px] font-black uppercase tracking-widest text-slate-500">
                  Fee
                </th>
                <th className="px-6 py-4 text-right text-[10px] font-black uppercase tracking-widest text-slate-500">
                  Netto
                </th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">
                  Status
                </th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">
                  Data
                </th>
                <th className="px-6 py-4 text-right text-[10px] font-black uppercase tracking-widest text-slate-500">
                  Akcje
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-20 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <Loader2 className="h-8 w-8 animate-spin text-emerald-400" />
                      <p className="font-bold text-slate-500">Ladowanie wyplat...</p>
                    </div>
                  </td>
                </tr>
              ) : visiblePayouts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-20 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/5">
                        <Wallet className="h-8 w-8 text-slate-700" />
                      </div>
                      <p className="font-bold text-slate-500">
                        {search
                          ? "Brak wyplat pasujacych do wyszukiwania."
                          : "Brak wyplat do wyswietlenia."}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                visiblePayouts.map((payout) => (
                  <tr key={payout.id} className="transition-colors hover:bg-white/5">
                    <td className="px-6 py-4">
                      <div className="text-sm font-bold text-white">{payout.studentName}</div>
                      <div className="mt-0.5 font-mono text-[10px] text-slate-500">
                        ID: {payout.id.slice(0, 8)}...
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-bold text-white">{payout.offerTitle}</div>
                      <div className="mt-0.5 text-[10px] text-slate-500">
                        Etap {payout.milestoneIdx}: {payout.milestoneTitle}
                      </div>
                      <div className="mt-0.5 font-mono text-[10px] text-slate-500">
                        Kontrakt:{" "}
                        <Link
                          href={`/app/admin/contracts/${payout.contract_id}`}
                          className="transition-colors hover:text-emerald-300"
                        >
                          {payout.contract_id.slice(0, 8)}...
                        </Link>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium text-slate-300">
                      {formatMoney(Number(payout.amount_gross || 0))}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium text-rose-300">
                      {formatMoney(Number(payout.platform_fee || 0))}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-black text-emerald-300">
                      {formatMoney(Number(payout.amount_net || 0))}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="flex">
                        <span className={getStatusBadge(payout.status)}>
                          {getStatusLabel(payout.status)}
                        </span>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="text-sm font-bold text-slate-300">
                        {new Date(payout.created_at).toLocaleDateString("pl-PL", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </div>
                      <div className="mt-0.5 text-[10px] text-slate-500">
                        {payout.paid_at
                          ? `Wyplacono: ${new Date(payout.paid_at).toLocaleDateString("pl-PL")}`
                          : "Jeszcze niezamknieta"}
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {payout.status === "pending" ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleMarkProcessing(payout.id)}
                            disabled={isPending && actionId === payout.id}
                            className="border-blue-400/20 bg-blue-500/10 text-blue-300 hover:bg-blue-500/15 hover:text-white"
                          >
                            {isPending && actionId === payout.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <>
                                <ArrowRight className="mr-1 h-3.5 w-3.5" />
                                Przetwarzaj
                              </>
                            )}
                          </Button>
                        ) : null}

                        {(payout.status === "pending" || payout.status === "processing") && (
                          <Button
                            size="sm"
                            onClick={() => handleMarkPaid(payout.id)}
                            disabled={isPending && actionId === payout.id}
                            className="bg-emerald-600 text-white hover:bg-emerald-700"
                          >
                            {isPending && actionId === payout.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <>
                                <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
                                Wyplacone
                              </>
                            )}
                          </Button>
                        )}

                        {payout.status === "paid" ? (
                          <span className="text-xs font-medium text-slate-500">Zamkniete</span>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
