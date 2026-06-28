"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, FileBadge2, FileText, RefreshCw, ShieldCheck } from "lucide-react";
import { DocumentCard } from "@/components/documents/document-card";
import { useStudentDocuments } from "@/hooks/use-student-documents";
import { getContractStatusLabel } from "@/types/documents";

type DocumentKindFilter = "all" | "contract" | "invoice";
const DOCUMENT_GROUPS_PAGE_SIZE = 10;

export default function StudentDocumentsPanel() {
  const { groups, isLoading, error, reload } = useStudentDocuments();
  const [kindFilter, setKindFilter] = useState<DocumentKindFilter>("all");
  const [currentPage, setCurrentPage] = useState(1);

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
  const totalPages = Math.max(1, Math.ceil(visibleGroups.length / DOCUMENT_GROUPS_PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const pageStart = (safePage - 1) * DOCUMENT_GROUPS_PAGE_SIZE;
  const pageEnd = pageStart + DOCUMENT_GROUPS_PAGE_SIZE;
  const pagedGroups = visibleGroups.slice(pageStart, pageEnd);
  const displayedStart = visibleGroups.length > 0 ? pageStart + 1 : 0;
  const displayedEnd = Math.min(pageEnd, visibleGroups.length);

  const handleKindFilterChange = (filter: DocumentKindFilter) => {
    setKindFilter(filter);
    setCurrentPage(1);
  };

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
      <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-lime-200 bg-lime-100 px-3 py-1 text-[11px] font-black uppercase tracking-normal text-[#0b1b47]">
            <FileText className="h-3.5 w-3.5" />
            Dokumenty
          </div>
          <div>
            <h2 className="break-words text-2xl font-black tracking-tight text-slate-900">
              Twoje umowy i rachunki
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              Wszystkie umowy i rachunki powiązane z Twoimi zleceniami w jednym miejscu.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => void reload()}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-black uppercase tracking-wider text-slate-700 transition hover:border-lime-200 hover:bg-lime-50 hover:text-[#10245f] sm:w-auto sm:self-start"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Odśwież dokumenty
        </button>
      </div>

      <div className="mt-6 grid gap-3 md:grid-cols-3">
        <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-4">
          <div className="text-xs font-black uppercase tracking-widest text-slate-500">
            Kontrakty
          </div>
          <div className="mt-2 text-3xl font-black text-slate-900">{totalContracts}</div>
          <div className="mt-1 text-sm text-slate-500">Grupy dokumentów w widoku</div>
        </div>
        <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-4">
          <div className="text-xs font-black uppercase tracking-widest text-slate-500">
            Umowy
          </div>
          <div className="mt-2 text-3xl font-black text-slate-900">{totalAgreements}</div>
          <div className="mt-1 text-sm text-slate-500">Wersje kontraktu dla studenta</div>
        </div>
        <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-4">
          <div className="text-xs font-black uppercase tracking-widest text-slate-500">
            Rachunki
          </div>
          <div className="mt-2 text-3xl font-black text-slate-900">{totalInvoices}</div>
          <div className="mt-1 text-sm text-slate-500">Dokumenty rozliczeniowe po odbiorze etapu</div>
        </div>
      </div>

      <div className="scrollbar-hide mt-6 flex gap-2 overflow-x-auto">
        {[
          { id: "all" as const, label: `Wszystkie (${totalDocuments})` },
          { id: "contract" as const, label: `Umowy (${totalAgreements})` },
          { id: "invoice" as const, label: `Rachunki (${totalInvoices})` },
        ].map((option) => {
          const isActive = kindFilter === option.id;
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => handleKindFilterChange(option.id)}
              className={
                isActive
                  ? "shrink-0 rounded-full border border-lime-200 bg-lime-200 px-4 py-2 text-xs font-black uppercase tracking-normal text-[#0b1b47] shadow-sm"
                  : "shrink-0 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-black uppercase tracking-normal text-slate-600 transition hover:border-lime-200 hover:text-[#10245f]"
              }
            >
              {option.label}
            </button>
          );
        })}
      </div>

      {isLoading ? (
        <div className="mt-8 rounded-[2rem] border border-slate-100 bg-slate-50/80 p-8 text-sm font-medium text-slate-500">
          Ładowanie dokumentów...
        </div>
      ) : null}

      {!isLoading && error ? (
        <div className="mt-8 rounded-[2rem] border border-red-100 bg-red-50 p-6 text-sm text-red-700">
          Nie udało się pobrać dokumentów. Odśwież widok albo wróć za chwilę.
        </div>
      ) : null}

      {!isLoading && !error && visibleGroups.length === 0 ? (
        <div className="mt-8 rounded-[2rem] border border-dashed border-slate-200 bg-slate-50/70 p-10 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-slate-300 shadow-sm">
            <ShieldCheck className="h-8 w-8" />
          </div>
          <h3 className="mt-4 text-lg font-black text-slate-900">Brak dokumentów do pokazania</h3>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Dokumenty pojawią się tutaj po wygenerowaniu umowy lub rachunku dla Twojego kontraktu.
          </p>
        </div>
      ) : null}

      {!isLoading && !error && visibleGroups.length > 0 ? (
        <div className="mt-8 space-y-6">
          <div className="flex flex-col gap-3 rounded-[1.5rem] border border-slate-100 bg-slate-50/70 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm font-bold text-slate-500">
              Pokazano{" "}
              <span className="text-slate-900">{displayedStart}-{displayedEnd}</span>{" "}
              z <span className="text-slate-900">{visibleGroups.length}</span> grup dokumentów
            </p>
            {totalPages > 1 ? (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                  disabled={safePage === 1}
                  className="inline-flex h-9 items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 text-xs font-black text-slate-600 transition hover:border-lime-200 hover:text-[#10245f] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                  Poprzednie
                </button>
                <span className="min-w-16 text-center text-xs font-black uppercase tracking-wider text-slate-400">
                  {safePage}/{totalPages}
                </span>
                <button
                  type="button"
                  onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                  disabled={safePage === totalPages}
                  className="inline-flex h-9 items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 text-xs font-black text-slate-600 transition hover:border-lime-200 hover:text-[#10245f] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Następne
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : null}
          </div>

          {pagedGroups.map((group) => (
            <div
              key={group.contractId}
              className="rounded-[1.5rem] border border-slate-100 bg-slate-50/70 p-4 sm:rounded-[2rem] sm:p-5"
            >
              <div className="mb-4 flex flex-col gap-3 border-b border-slate-200/70 pb-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <h3 className="break-words text-lg font-black text-slate-900">{group.title}</h3>
                  <div className="mt-2 flex flex-wrap items-center gap-3 text-xs font-bold uppercase tracking-wider text-slate-500">
                    <span>Firma: {group.counterpartName}</span>
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

          {totalPages > 1 ? (
            <div className="flex flex-col items-center justify-between gap-3 rounded-[1.5rem] border border-slate-100 bg-white px-4 py-4 sm:flex-row">
              <p className="text-sm font-semibold text-slate-500">
                Strona <span className="font-black text-slate-900">{safePage}</span> z{" "}
                <span className="font-black text-slate-900">{totalPages}</span>
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                  disabled={safePage === 1}
                  className="h-10 rounded-full border border-slate-200 px-4 text-xs font-black text-slate-600 transition hover:border-lime-200 hover:text-[#10245f] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Poprzednia
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                  disabled={safePage === totalPages}
                  className="h-10 rounded-full bg-[#10245f] px-4 text-xs font-black text-white transition hover:bg-[#0b1b47] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Następna
                </button>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
