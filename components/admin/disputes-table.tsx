"use client";

import Link from "next/link";
import { useDeferredValue, useState } from "react";
import { format } from "date-fns";
import { pl } from "date-fns/locale";
import { ArrowUpRight, FileText } from "lucide-react";
import { Input } from "@/components/ui/input";

type DisputeRow = {
  id: string;
  created_at: string;
  updated_at: string;
  accepted_at?: string | null;
  application_id?: string | null;
  service_order_id?: string | null;
  status: "disputed" | "cancelled";
  terms_status: string | null;
  total_amount: number | string | null;
  currency: string | null;
  commission_rate: number | string;
  source_type: string | null;
  student?: { public_name?: string | null } | null;
  company?: { nazwa?: string | null } | null;
};

type DisputeStatusFilter = "all" | "disputed" | "cancelled";
type DisputeSortOption =
  | "updated_asc"
  | "updated_desc"
  | "amount_desc"
  | "amount_asc";

function getIdleDays(updatedAt: string) {
  const diffMs = Date.now() - new Date(updatedAt).getTime();
  return Math.max(0, Math.floor(diffMs / 86400000));
}

function formatCommission(value: number | string) {
  return `${Math.round(Number(value) * 100)}%`;
}

function getStatusBadge(status: DisputeRow["status"]) {
  if (status === "disputed") {
    return "rounded-lg border border-amber-500/20 bg-amber-500/10 px-2 py-1 text-[10px] font-black uppercase tracking-wider text-amber-400";
  }

  return "rounded-lg border border-red-500/20 bg-red-500/10 px-2 py-1 text-[10px] font-black uppercase tracking-wider text-red-500";
}

function getStatusLabel(status: DisputeRow["status"]) {
  return status === "disputed" ? "Spor" : "Anulacja";
}

function getIdleBadge(idleDays: number) {
  if (idleDays > 30) {
    return "rounded-lg border border-red-500/20 bg-red-500/10 px-2 py-1 text-[10px] font-black uppercase tracking-wider text-red-400";
  }

  if (idleDays > 14) {
    return "rounded-lg border border-amber-500/20 bg-amber-500/10 px-2 py-1 text-[10px] font-black uppercase tracking-wider text-amber-400";
  }

  return "rounded-lg border border-white/10 bg-slate-500/10 px-2 py-1 text-[10px] font-black uppercase tracking-wider text-slate-400";
}

function getIdleLabel(idleDays: number) {
  if (idleDays > 30) return "Pilne";
  if (idleDays > 14) return "Do sprawdzenia";
  return "Swieze";
}

function getWorkspaceId(dispute: DisputeRow) {
  return dispute.application_id || dispute.service_order_id || null;
}

export function DisputesTable({
  disputes,
  emptyMessage,
}: {
  disputes: DisputeRow[];
  emptyMessage: string;
}) {
  const [statusFilter, setStatusFilter] = useState<DisputeStatusFilter>("all");
  const [sortBy, setSortBy] = useState<DisputeSortOption>("updated_asc");
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search.trim().toLowerCase());

  const filteredDisputes = disputes
    .filter((dispute) => {
      if (statusFilter !== "all" && dispute.status !== statusFilter) {
        return false;
      }

      if (!deferredSearch) {
        return true;
      }

      const searchable = [
        dispute.id,
        dispute.status,
        dispute.terms_status || "",
        dispute.source_type || "",
        dispute.company?.nazwa || "",
        dispute.student?.public_name || "",
      ]
        .join(" ")
        .toLowerCase();

      return searchable.includes(deferredSearch);
    })
    .sort((left, right) => {
      if (sortBy === "updated_asc") {
        return new Date(left.updated_at).getTime() - new Date(right.updated_at).getTime();
      }

      if (sortBy === "updated_desc") {
        return new Date(right.updated_at).getTime() - new Date(left.updated_at).getTime();
      }

      const leftAmount = Number(left.total_amount || 0);
      const rightAmount = Number(right.total_amount || 0);
      return sortBy === "amount_asc" ? leftAmount - rightAmount : rightAmount - leftAmount;
    });

  return (
    <div className="overflow-hidden rounded-[2.5rem] border border-white/5 bg-slate-950/40 shadow-xl backdrop-blur-sm">
      <div className="border-b border-white/5 bg-white/5 p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <span className="text-sm font-bold text-slate-400">
            Rekordow: {filteredDisputes.length} / {disputes.length}
          </span>

          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Szukaj po stronach, ID lub statusie"
              className="h-10 min-w-[240px] border-white/10 bg-slate-900/60 text-white placeholder:text-slate-500"
            />

            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as DisputeStatusFilter)}
              className="h-10 rounded-xl border border-white/10 bg-slate-900/60 px-3 text-sm font-bold text-slate-200 outline-none"
            >
              <option value="all">Wszystkie</option>
              <option value="disputed">Spory</option>
              <option value="cancelled">Anulacje</option>
            </select>

            <select
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value as DisputeSortOption)}
              className="h-10 rounded-xl border border-white/10 bg-slate-900/60 px-3 text-sm font-bold text-slate-200 outline-none"
            >
              <option value="updated_asc">Najdluzej bez ruchu</option>
              <option value="updated_desc">Ostatnio zaktualizowane</option>
              <option value="amount_desc">Najwyzsza wartosc</option>
              <option value="amount_asc">Najnizsza wartosc</option>
            </select>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-white/5 bg-slate-950/20">
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">
                Bez ruchu
              </th>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">
                Ostatni ruch
              </th>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">
                Kontrakt
              </th>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">
                Strony
              </th>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">
                Status
              </th>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">
                Zrodlo i prowizja
              </th>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">
                Wartosc
              </th>
              <th className="px-6 py-4 text-right text-[10px] font-black uppercase tracking-widest text-slate-500">
                Akcja
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {filteredDisputes.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-20 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/5">
                      <FileText className="h-8 w-8 text-slate-700" />
                    </div>
                    <p className="font-bold text-slate-500">
                      {statusFilter === "all" && !deferredSearch
                        ? emptyMessage
                        : "Brak sporow pasujacych do wybranych filtrow."}
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredDisputes.map((dispute) => {
                const idleDays = getIdleDays(dispute.updated_at);
                const companyName = dispute.company?.nazwa || "Brak danych";
                const studentName = dispute.student?.public_name || "Brak danych";
                const workspaceId = getWorkspaceId(dispute);

                return (
                  <tr key={dispute.id} className="transition-colors hover:bg-white/5">
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="flex flex-col gap-2">
                        <div className="flex">
                          <span className={getIdleBadge(idleDays)}>{getIdleLabel(idleDays)}</span>
                        </div>
                        <div className="text-sm font-black text-white">{idleDays} dni</div>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <span className="text-sm font-bold text-slate-300">
                        {format(new Date(dispute.updated_at), "d MMM yyyy", { locale: pl })}
                      </span>
                      <div className="mt-0.5 text-[10px] text-slate-500">
                        {format(new Date(dispute.updated_at), "HH:mm")}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-bold text-white">#{dispute.id.slice(0, 8)}</div>
                      <div className="mt-0.5 text-[10px] text-slate-500">
                        Terms: {dispute.terms_status || "brak"}
                      </div>
                      <div className="mt-0.5 text-[10px] text-slate-500">
                        Utworzono: {format(new Date(dispute.created_at), "d MMM yyyy", { locale: pl })}
                      </div>
                      <div className="mt-0.5 text-[10px] text-slate-500">
                        {dispute.accepted_at
                          ? `Akceptacja: ${format(new Date(dispute.accepted_at), "d MMM yyyy", { locale: pl })}`
                          : "Bez pelnej akceptacji"}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <span className="rounded bg-indigo-500/10 px-1.5 text-[10px] font-black uppercase text-indigo-400">
                            Firma
                          </span>
                          <span className="text-sm font-medium text-slate-300">{companyName}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="rounded bg-emerald-500/10 px-1.5 text-[10px] font-black uppercase text-emerald-400">
                            Student
                          </span>
                          <span className="text-sm font-medium text-slate-300">{studentName}</span>
                        </div>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="flex">
                        <span className={getStatusBadge(dispute.status)}>
                          {getStatusLabel(dispute.status)}
                        </span>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="text-xs font-bold uppercase tracking-wider text-slate-300">
                        {dispute.source_type || "nieznane"}
                      </div>
                      <div className="mt-0.5 text-[10px] text-slate-500">
                        Prowizja: {formatCommission(dispute.commission_rate)}
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="text-sm font-black text-white">
                        {Number(dispute.total_amount || 0).toLocaleString("pl-PL", {
                          style: "currency",
                          currency: dispute.currency || "PLN",
                        })}
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/app/admin/contracts/${dispute.id}`}
                          className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-bold text-slate-200 transition-all hover:border-emerald-400/30 hover:bg-emerald-500/10 hover:text-white"
                        >
                          <span>Szczegoly</span>
                          <ArrowUpRight className="h-3.5 w-3.5 text-emerald-300" />
                        </Link>

                        {workspaceId ? (
                          <Link
                            href={`/app/deliverables/${workspaceId}`}
                            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-bold text-slate-200 transition-all hover:border-indigo-400/30 hover:bg-indigo-500/10 hover:text-white"
                          >
                            <span>Otworz workspace</span>
                            <ArrowUpRight className="h-3.5 w-3.5 text-indigo-300" />
                          </Link>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {filteredDisputes.length > 0 ? (
        <div className="border-t border-white/5 bg-slate-950/20 px-6 py-4 text-[11px] text-slate-500">
          Triage priorytetyzuje rekordy wedlug czasu bez ruchu, a nie daty utworzenia kontraktu.
        </div>
      ) : null}
    </div>
  );
}
