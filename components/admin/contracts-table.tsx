"use client";

import Link from "next/link";
import { useDeferredValue, useState } from "react";
import { format } from "date-fns";
import { pl } from "date-fns/locale";
import { FileText } from "lucide-react";
import { Input } from "@/components/ui/input";

type ContractRow = {
  id: string;
  created_at: string;
  status: string;
  terms_status: string | null;
  total_amount: number | string | null;
  currency: string | null;
  commission_rate: number | string;
  source_type: string | null;
  company_id: string | null;
  student_id: string | null;
  student?: { public_name?: string | null } | null;
  company?: { nazwa?: string | null } | null;
};

type StatusFilter =
  | "all"
  | "draft"
  | "awaiting_funding"
  | "active"
  | "delivered"
  | "completed"
  | "cancelled"
  | "disputed";
type SortOption = "created_desc" | "created_asc" | "amount_desc" | "amount_asc";

function formatCommission(value: number | string) {
  return `${Math.round(Number(value) * 100)}%`;
}

function renderStatusBadge(status: string) {
  if (status === "active") {
    return (
      <span className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-2 py-1 text-[10px] font-black uppercase tracking-wider text-emerald-400">
        Aktywna
      </span>
    );
  }

  if (status === "completed") {
    return (
      <span className="rounded-lg border border-blue-500/20 bg-blue-500/10 px-2 py-1 text-[10px] font-black uppercase tracking-wider text-blue-400">
        Zakonczona
      </span>
    );
  }

  if (status === "cancelled") {
    return (
      <span className="rounded-lg border border-red-500/20 bg-red-500/10 px-2 py-1 text-[10px] font-black uppercase tracking-wider text-red-500">
        Anulowana
      </span>
    );
  }

  if (status === "disputed") {
    return (
      <span className="rounded-lg border border-amber-500/20 bg-amber-500/10 px-2 py-1 text-[10px] font-black uppercase tracking-wider text-amber-400">
        Spor
      </span>
    );
  }

  return (
    <span className="rounded-lg border border-white/10 bg-slate-500/10 px-2 py-1 text-[10px] font-black uppercase tracking-wider text-slate-400">
      {status}
    </span>
  );
}

export function ContractsTable({
  contracts,
  emptyMessage,
}: {
  contracts: ContractRow[];
  emptyMessage: string;
}) {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sortBy, setSortBy] = useState<SortOption>("created_desc");
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search.trim().toLowerCase());

  const filteredContracts = contracts
    .filter((contract) => {
      if (statusFilter !== "all" && contract.status !== statusFilter) {
        return false;
      }

      if (!deferredSearch) {
        return true;
      }

      const companyName = contract.company?.nazwa || "";
      const studentName = contract.student?.public_name || "";
      const searchable = [
        contract.id,
        contract.status,
        contract.terms_status || "",
        contract.source_type || "",
        companyName,
        studentName,
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

      const leftAmount = Number(left.total_amount || 0);
      const rightAmount = Number(right.total_amount || 0);
      return sortBy === "amount_asc" ? leftAmount - rightAmount : rightAmount - leftAmount;
    });

  return (
    <div className="overflow-hidden rounded-[2.5rem] border border-white/5 bg-slate-950/40 shadow-xl backdrop-blur-sm">
      <div className="border-b border-white/5 bg-white/5 p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <span className="text-sm font-bold text-slate-400">
            Rekordow: {filteredContracts.length} / {contracts.length}
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
              onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}
              className="h-10 rounded-xl border border-white/10 bg-slate-900/60 px-3 text-sm font-bold text-slate-200 outline-none"
            >
              <option value="all">Wszystkie statusy</option>
              <option value="draft">Draft</option>
              <option value="awaiting_funding">Awaiting funding</option>
              <option value="active">Active</option>
              <option value="delivered">Delivered</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
              <option value="disputed">Disputed</option>
            </select>

            <select
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value as SortOption)}
              className="h-10 rounded-xl border border-white/10 bg-slate-900/60 px-3 text-sm font-bold text-slate-200 outline-none"
            >
              <option value="created_desc">Najnowsze</option>
              <option value="created_asc">Najstarsze</option>
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
                Data
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
                Zrodlo
              </th>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">
                Prowizja
              </th>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">
                Wartosc
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {filteredContracts.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-20 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/5">
                      <FileText className="h-8 w-8 text-slate-700" />
                    </div>
                    <p className="font-bold text-slate-500">
                      {statusFilter === "all" && !deferredSearch
                        ? emptyMessage
                        : "Brak kontraktow pasujacych do wybranych filtrow."}
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredContracts.map((contract) => {
                const studentName = contract.student?.public_name || "Brak danych";
                const companyName = contract.company?.nazwa || "Brak danych";

                return (
                  <tr key={contract.id} className="transition-colors hover:bg-white/5">
                    <td className="whitespace-nowrap px-6 py-4">
                      <span className="text-sm font-bold text-slate-300">
                        {format(new Date(contract.created_at), "d MMM yyyy", { locale: pl })}
                      </span>
                      <div className="mt-0.5 text-[10px] text-slate-500">
                        {format(new Date(contract.created_at), "HH:mm")}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Link
                        href={`/app/admin/contracts/${contract.id}`}
                        className="text-sm font-bold text-white transition-colors hover:text-indigo-300"
                      >
                        #{contract.id.slice(0, 8)}
                      </Link>
                      <div className="mt-0.5 text-[10px] text-slate-500">
                        Terms: {contract.terms_status || "brak"}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <span className="rounded bg-indigo-500/10 px-1.5 text-[10px] font-black uppercase text-indigo-400">
                            Firma
                          </span>
                          <span className="text-sm font-medium text-slate-300">
                            {companyName}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="rounded bg-emerald-500/10 px-1.5 text-[10px] font-black uppercase text-emerald-400">
                            Student
                          </span>
                          <span className="text-sm font-medium text-slate-300">
                            {studentName}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="flex">{renderStatusBadge(contract.status)}</div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                        {contract.source_type || "nieznane"}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <span className="text-sm font-black text-indigo-300">
                        {formatCommission(contract.commission_rate)}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="text-sm font-black text-white">
                        {Number(contract.total_amount || 0).toLocaleString("pl-PL", {
                          style: "currency",
                          currency: contract.currency || "PLN",
                        })}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
