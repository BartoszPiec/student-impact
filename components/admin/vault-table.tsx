"use client";

import Link from "next/link";
import { useDeferredValue, useState } from "react";
import { format } from "date-fns";
import { pl } from "date-fns/locale";
import { FileText, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { VaultRowActions } from "@/app/app/admin/vault/_components/VaultRowActions";

type VaultRow = {
  id: string;
  created_at: string;
  total_amount: number | string | null;
  currency: string | null;
  status: string;
  documents_generated_at?: string | null;
  company_contract_accepted_at?: string | null;
  student_contract_accepted_at?: string | null;
  document_count?: number;
  invoice_count?: number;
  paid_invoice_count?: number;
  legal_documents?: Array<{ id: string; name: string; type: string; url: string | null }>;
  student?: { public_name?: string | null } | null;
  company?: { nazwa?: string | null } | null;
  applications?:
    | { offers?: { tytul?: string | null } | Array<{ tytul?: string | null }> | null }
    | Array<{ offers?: { tytul?: string | null } | Array<{ tytul?: string | null }> | null }>
    | null;
};

type VaultStatusFilter = "all" | "active" | "completed" | "cancelled" | "disputed" | "other";
type VaultSortOption = "created_desc" | "created_asc" | "amount_desc" | "amount_asc";

function getOfferTitle(row: VaultRow) {
  const appNode = Array.isArray(row.applications) ? row.applications[0] : row.applications;
  const offerNode = Array.isArray(appNode?.offers) ? appNode?.offers[0] : appNode?.offers;
  return offerNode?.tytul || "Zlecenie bezposrednie";
}

function getStatusLabel(status: string) {
  if (status === "active") return "Aktywna";
  if (status === "completed") return "Zakonczona";
  if (status === "cancelled") return "Anulowana";
  if (status === "disputed") return "Sporna";
  return status;
}

function getStatusBadgeClass(status: string) {
  if (status === "active") {
    return "rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-2 py-1 text-[10px] font-black uppercase tracking-wider text-emerald-400";
  }

  if (status === "completed") {
    return "rounded-lg border border-blue-500/20 bg-blue-500/10 px-2 py-1 text-[10px] font-black uppercase tracking-wider text-blue-400";
  }

  if (status === "cancelled") {
    return "rounded-lg border border-red-500/20 bg-red-500/10 px-2 py-1 text-[10px] font-black uppercase tracking-wider text-red-500";
  }

  if (status === "disputed") {
    return "rounded-lg border border-amber-500/20 bg-amber-500/10 px-2 py-1 text-[10px] font-black uppercase tracking-wider text-amber-400";
  }

  return "rounded-lg border border-white/10 bg-slate-500/10 px-2 py-1 text-[10px] font-black uppercase tracking-wider text-slate-400";
}

function getDocumentState(contract: VaultRow) {
  const documentCount = contract.document_count || 0;
  const companyAccepted = Boolean(contract.company_contract_accepted_at);
  const studentAccepted = Boolean(contract.student_contract_accepted_at);

  if (companyAccepted && studentAccepted) {
    return {
      label: "Akceptacja kompletna",
      meta: `${documentCount} PDF`,
      className:
        "rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-2 py-1 text-[10px] font-black uppercase tracking-wider text-emerald-400",
    };
  }

  if (documentCount > 0) {
    return {
      label: "Czeka na akceptacje",
      meta: `${Number(companyAccepted) + Number(studentAccepted)}/2 stron`,
      className:
        "rounded-lg border border-amber-500/20 bg-amber-500/10 px-2 py-1 text-[10px] font-black uppercase tracking-wider text-amber-400",
    };
  }

  if (contract.status === "draft" || contract.status === "awaiting_funding") {
    return {
      label: "Brak PDF",
      meta: "Status: ustalanie kontraktu",
      className:
        "rounded-lg border border-sky-500/20 bg-sky-500/10 px-2 py-1 text-[10px] font-black uppercase tracking-wider text-sky-300",
    };
  }

  return {
    label: "Brak PDF",
    meta: "0 dokumentow",
    className:
      "rounded-lg border border-white/10 bg-slate-500/10 px-2 py-1 text-[10px] font-black uppercase tracking-wider text-slate-400",
  };
}

export function VaultTable({ contracts }: { contracts: VaultRow[] }) {
  const [statusFilter, setStatusFilter] = useState<VaultStatusFilter>("all");
  const [sortBy, setSortBy] = useState<VaultSortOption>("created_desc");
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search.trim().toLowerCase());

  const filteredContracts = contracts
    .filter((contract) => {
      const normalizedStatus =
        contract.status === "active" ||
        contract.status === "completed" ||
        contract.status === "cancelled" ||
        contract.status === "disputed"
          ? contract.status
          : "other";

      if (statusFilter !== "all" && normalizedStatus !== statusFilter) {
        return false;
      }

      if (!deferredSearch) {
        return true;
      }

      const offerTitle = getOfferTitle(contract);
      const companyName = contract.company?.nazwa || "";
      const studentName = contract.student?.public_name || "";
      const searchable = [contract.id, contract.status, offerTitle, companyName, studentName]
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
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-slate-500" />
            <span className="text-sm font-bold text-slate-400">
              Wykaz wszystkich zawartych umow ({filteredContracts.length} / {contracts.length})
            </span>
          </div>

          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Szukaj po zleceniu, stronach lub ID"
              className="h-10 min-w-[240px] border-white/10 bg-slate-900/60 text-white placeholder:text-slate-500"
            />

            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as VaultStatusFilter)}
              className="h-10 rounded-xl border border-white/10 bg-slate-900/60 px-3 text-sm font-bold text-slate-200 outline-none"
            >
              <option value="all">Wszystkie statusy</option>
              <option value="active">Aktywne</option>
              <option value="completed">Zakonczone</option>
              <option value="cancelled">Anulowane</option>
              <option value="disputed">Sporne</option>
              <option value="other">Pozostale</option>
            </select>

            <select
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value as VaultSortOption)}
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
                Data zawarcia
              </th>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">
                Zlecenie / Przedmiot
              </th>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">
                Strony umowy
              </th>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">
                Status
              </th>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">
                Dokumenty i faktury
              </th>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">
                Wartosc brutto
              </th>
              <th className="px-6 py-4 text-right text-[10px] font-black uppercase tracking-widest text-slate-500">
                Akcje prawne
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
                      Brak umow pasujacych do wybranych filtrow.
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredContracts.map((contract) => {
                const offerTitle = getOfferTitle(contract);
                const studentName = contract.student?.public_name || "Brak danych";
                const companyName = contract.company?.nazwa || "Brak danych";
                const documentState = getDocumentState(contract);
                const documentCount = contract.document_count || 0;
                const invoiceCount = contract.invoice_count || 0;
                const paidInvoiceCount = contract.paid_invoice_count || 0;

                return (
                  <tr key={contract.id} className="group transition-colors hover:bg-white/5">
                    <td className="whitespace-nowrap px-6 py-4">
                      <span className="text-sm font-bold text-slate-300">
                        {format(new Date(contract.created_at), "d MMM yyyy", { locale: pl })}
                      </span>
                      <div className="mt-0.5 text-[10px] text-slate-500">
                        {format(new Date(contract.created_at), "HH:mm")}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="line-clamp-1 text-sm font-bold text-white">{offerTitle}</div>
                      <Link
                        href={`/app/admin/contracts/${contract.id}`}
                        className="mt-0.5 inline-flex font-mono text-[10px] text-slate-400 transition-colors hover:text-emerald-300"
                      >
                        ID: {contract.id.slice(0, 8)}...
                      </Link>
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
                        <span className={getStatusBadgeClass(contract.status)}>
                          {getStatusLabel(contract.status)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-2">
                        <div className="flex">
                          <span className={documentState.className}>{documentState.label}</span>
                        </div>
                        <div className="text-[11px] font-medium text-slate-400">
                          {documentState.meta}
                        </div>
                        <div className="text-[11px] font-medium text-slate-500">
                          Dokumenty: {documentCount} | Faktury: {invoiceCount}
                          {invoiceCount > 0 ? ` | Oplacone: ${paidInvoiceCount}` : ""}
                        </div>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="text-sm font-black text-white">
                        {Number(contract.total_amount || 0).toLocaleString("pl-PL", {
                          style: "currency",
                          currency: contract.currency || "PLN",
                        })}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <VaultRowActions contractId={contract.id} documents={contract.legal_documents || []} />
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
