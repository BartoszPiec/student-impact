"use client";

import { useState } from "react";
import { Building2, FileBadge2, RefreshCw, ShieldCheck } from "lucide-react";
import { DocumentCard } from "@/components/documents/document-card";
import { useCompanyDocuments } from "@/hooks/use-company-documents";

type DocumentKindFilter = "all" | "contract" | "invoice";

export function CompanyDocumentsPanel() {
  const { groups, isLoading, error, reload } = useCompanyDocuments();
  const [kindFilter, setKindFilter] = useState<DocumentKindFilter>("all");

  const visibleGroups = groups
    .map((group) => ({
      ...group,
      documents:
        kindFilter === "all"
          ? group.documents
          : group.documents.filter((document) => document.kind === kindFilter),
    }))
    .filter((group) => group.documents.length > 0);

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
    <section className="rounded-[2.5rem] border border-slate-100 bg-white p-8 shadow-xl shadow-slate-200/40">
      <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1 text-[11px] font-black uppercase tracking-[0.2em] text-indigo-600">
            <Building2 className="h-3.5 w-3.5" />
            Dokumenty firmy
          </div>
          <div>
            <h2 className="text-2xl font-black tracking-tight text-slate-900">
              Faktury i umowy do rozliczen
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              Widok dokumentow firmy oparty o <code className="text-slate-700">contract_documents</code>.
              Pokazuje umowy A i faktury firmowe zapisane przy kontraktach.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => void reload()}
          className="inline-flex items-center gap-2 self-start rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-black uppercase tracking-wider text-slate-700 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Odswiez dokumenty
        </button>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        <div className="rounded-3xl border border-slate-100 bg-slate-50/80 p-5">
          <div className="text-xs font-black uppercase tracking-widest text-slate-500">Kontrakty</div>
          <div className="mt-2 text-3xl font-black text-slate-900">{totalContracts}</div>
          <div className="mt-1 text-sm text-slate-500">Kontrakty z dokumentami firmy</div>
        </div>
        <div className="rounded-3xl border border-slate-100 bg-slate-50/80 p-5">
          <div className="text-xs font-black uppercase tracking-widest text-slate-500">Umowy A</div>
          <div className="mt-2 text-3xl font-black text-slate-900">{totalAgreements}</div>
          <div className="mt-1 text-sm text-slate-500">Wersje firmy do archiwum</div>
        </div>
        <div className="rounded-3xl border border-slate-100 bg-slate-50/80 p-5">
          <div className="text-xs font-black uppercase tracking-widest text-slate-500">Faktury FV</div>
          <div className="mt-2 text-3xl font-black text-slate-900">{totalInvoices}</div>
          <div className="mt-1 text-sm text-slate-500">Dokumenty finansowe firmy</div>
        </div>
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        {[
          { id: "all" as const, label: `Wszystkie (${totalDocuments})` },
          { id: "contract" as const, label: `Umowy (${totalAgreements})` },
          { id: "invoice" as const, label: `Faktury (${totalInvoices})` },
        ].map((option) => {
          const isActive = kindFilter === option.id;
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => setKindFilter(option.id)}
              className={
                isActive
                  ? "rounded-full border border-indigo-200 bg-indigo-600 px-4 py-2 text-xs font-black uppercase tracking-wider text-white shadow-lg shadow-indigo-200/40"
                  : "rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-black uppercase tracking-wider text-slate-600 transition hover:border-indigo-200 hover:text-indigo-700"
              }
            >
              {option.label}
            </button>
          );
        })}
      </div>

      {isLoading ? (
        <div className="mt-8 rounded-[2rem] border border-slate-100 bg-slate-50/80 p-8 text-sm font-medium text-slate-500">
          Ladowanie dokumentow firmy...
        </div>
      ) : null}

      {!isLoading && error ? (
        <div className="mt-8 rounded-[2rem] border border-red-100 bg-red-50 p-6 text-sm text-red-700">
          Blad pobierania dokumentow firmy: {error}
        </div>
      ) : null}

      {!isLoading && !error && visibleGroups.length === 0 ? (
        <div className="mt-8 rounded-[2rem] border border-dashed border-slate-200 bg-slate-50/70 p-10 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-slate-300 shadow-sm">
            <ShieldCheck className="h-8 w-8" />
          </div>
          <h3 className="mt-4 text-lg font-black text-slate-900">Brak dokumentow firmy</h3>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Dokumenty pojawia sie tutaj po wygenerowaniu umowy A lub faktury dla Twoich kontraktow.
          </p>
        </div>
      ) : null}

      {!isLoading && !error && visibleGroups.length > 0 ? (
        <div className="mt-8 space-y-6">
          {visibleGroups.map((group) => (
            <div
              key={group.contractId}
              className="rounded-[2rem] border border-slate-100 bg-slate-50/70 p-5"
            >
              <div className="mb-4 flex flex-col gap-3 border-b border-slate-200/70 pb-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <h3 className="text-lg font-black text-slate-900">{group.title}</h3>
                  <div className="mt-2 flex flex-wrap items-center gap-3 text-xs font-bold uppercase tracking-wider text-slate-500">
                    <span>Student: {group.counterpartName}</span>
                    <span>Kontrakt: {group.contractId.slice(0, 8)}...</span>
                    <span>Status: {group.contractStatus}</span>
                  </div>
                </div>
                <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-black uppercase tracking-wider text-slate-600">
                  <FileBadge2 className="h-3.5 w-3.5" />
                  {group.documents.length} dokumentow
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
