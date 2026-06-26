"use client";

import { useState } from "react";
import { FileBadge2, RefreshCw, Search, ShieldCheck } from "lucide-react";
import { DocumentCard } from "@/components/documents/document-card";
import { useCompanyDocuments } from "@/hooks/use-company-documents";
import { getContractStatusLabel } from "@/types/documents";

type DocumentKindFilter = "all" | "contract" | "invoice";

export function CompanyDocumentsPanel() {
  const { groups, isLoading, error, reload } = useCompanyDocuments();
  const [kindFilter, setKindFilter] = useState<DocumentKindFilter>("all");
  const [query, setQuery] = useState("");

  const normalizedQuery = query.trim().toLowerCase();
  const visibleGroups = groups
    .map((group) => ({
      ...group,
      documents:
        kindFilter === "all"
          ? group.documents
          : group.documents.filter((document) => document.kind === kindFilter),
    }))
    .filter((group) => {
      if (group.documents.length === 0) return false;
      if (!normalizedQuery) return true;

      const haystack = [
        group.title,
        group.counterpartName,
        group.contractStatus,
        ...group.documents.flatMap((document) => [document.fileName, document.title]),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(normalizedQuery);
    });

  const totalDocuments = groups.reduce((sum, group) => sum + group.documents.length, 0);
  const totalContracts = groups.length;
  const totalInvoices = groups.reduce(
    (sum, group) => sum + group.documents.filter((document) => document.kind === "invoice").length,
    0,
  );
  const totalAgreements = groups.reduce(
    (sum, group) => sum + group.documents.filter((document) => document.kind === "contract").length,
    0,
  );

  return (
    <section className="space-y-5">
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-[10px] font-black uppercase text-slate-500">Zlecenia z dokumentami</div>
          <div className="mt-2 text-3xl font-black text-slate-900">{totalContracts}</div>
          <div className="mt-1 text-sm font-medium text-slate-500">Grupy dokumentów w widoku</div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-[10px] font-black uppercase text-slate-500">Umowy</div>
          <div className="mt-2 text-3xl font-black text-slate-900">{totalAgreements}</div>
          <div className="mt-1 text-sm font-medium text-slate-500">Umowy platforma - firma</div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-[10px] font-black uppercase text-slate-500">Faktury VAT</div>
          <div className="mt-2 text-3xl font-black text-slate-900">{totalInvoices}</div>
          <div className="mt-1 text-sm font-medium text-slate-500">Dokumenty rozliczeniowe</div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <label className="relative block w-full lg:max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Szukaj po nazwie zlecenia lub numerze FV..."
              className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm font-semibold outline-none transition focus:border-lime-300 focus:bg-white"
            />
          </label>

          <button
            type="button"
            onClick={() => void reload()}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-extrabold text-[#10245f] transition hover:bg-slate-50"
          >
            <RefreshCw className="h-4 w-4" />
            Pobierz zestawienie
          </button>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {[
            { id: "all" as const, label: `Wszystkie ${totalDocuments}` },
            { id: "contract" as const, label: `Umowy ${totalAgreements}` },
            { id: "invoice" as const, label: `Faktury ${totalInvoices}` },
          ].map((option) => {
            const isActive = kindFilter === option.id;
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => setKindFilter(option.id)}
                className={
                  isActive
                    ? "rounded-full border border-[#10245f] bg-[#10245f] px-4 py-2 text-xs font-black text-white"
                    : "rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-black text-slate-600 transition hover:bg-slate-50"
                }
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </div>

      {isLoading ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-sm font-medium text-slate-500">
          Ładowanie dokumentów firmy...
        </div>
      ) : null}

      {!isLoading && error ? (
        <div className="rounded-2xl border border-red-100 bg-red-50 p-6 text-sm text-red-700">
          Nie udało się pobrać dokumentów firmy. Odśwież widok albo wróć za chwilę.
        </div>
      ) : null}

      {!isLoading && !error && visibleGroups.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-10 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-slate-300 shadow-sm">
            <ShieldCheck className="h-8 w-8" />
          </div>
          <h3 className="mt-4 text-lg font-black text-slate-900">Brak dokumentów firmy</h3>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Dokumenty pojawią się tutaj po wygenerowaniu umowy A lub faktury dla Twoich kontraktów.
          </p>
        </div>
      ) : null}

      {!isLoading && !error && visibleGroups.length > 0 ? (
        <div className="space-y-4">
          {visibleGroups.map((group) => (
            <div
              key={group.contractId}
              className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5"
            >
              <div className="mb-4 flex flex-col gap-3 border-b border-slate-200/70 pb-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <h3 className="break-words text-lg font-black text-slate-900">{group.title}</h3>
                  <div className="mt-2 flex flex-wrap items-center gap-3 text-xs font-bold uppercase tracking-wider text-slate-500">
                    <span>Student: {group.counterpartName}</span>
                    <span>Status: {getContractStatusLabel(group.contractStatus)}</span>
                  </div>
                </div>
                <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-black uppercase tracking-wider text-slate-600">
                  <FileBadge2 className="h-3.5 w-3.5" />
                  {group.documents.length} dokumentów
                </div>
              </div>

              <div className="space-y-4">
                {group.documents.map((document) => (
                  <DocumentCard key={document.id} document={document} />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </section>
  );
}
