"use client";

import Link from "next/link";
import { useDeferredValue, useState } from "react";
import { format } from "date-fns";
import { pl } from "date-fns/locale";
import { FileText, ReceiptText, Search } from "lucide-react";
import { Input } from "@/components/ui/input";

export type InvoiceRow = {
  id: string;
  contract_id: string;
  invoice_number: string;
  invoice_type: "company" | "student";
  status: "draft" | "issued" | "paid" | "cancelled";
  amount_net: number | string;
  amount_gross: number | string;
  platform_fee: number | string;
  issuer_name: string;
  recipient_name: string;
  issued_at: string | null;
  created_at: string;
  paid_at: string | null;
  issuer_nip: string | null;
  recipient_nip: string | null;
  storage_path: string | null;
  download_url?: string | null;
};

type InvoiceStatusFilter = "all" | InvoiceRow["status"];
type InvoiceSortOption = "created_desc" | "paid_at_desc" | "amount_desc" | "amount_asc";

function formatMoneyPLN(value: number | string | null | undefined) {
  return Number(value || 0).toLocaleString("pl-PL", {
    style: "currency",
    currency: "PLN",
  });
}

function getStatusBadge(status: InvoiceRow["status"]) {
  switch (status) {
    case "paid":
      return "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20";
    case "issued":
      return "bg-indigo-500/10 text-indigo-300 border border-indigo-500/20";
    case "draft":
      return "bg-amber-500/10 text-amber-300 border border-amber-500/20";
    default:
      return "bg-rose-500/10 text-rose-300 border border-rose-500/20";
  }
}

function getTypeLabel(type: InvoiceRow["invoice_type"]) {
  return type === "company" ? "Firma" : "Student";
}

export function InvoicesTable({ invoices }: { invoices: InvoiceRow[] }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<InvoiceStatusFilter>("all");
  const [sortBy, setSortBy] = useState<InvoiceSortOption>("created_desc");
  const deferredSearch = useDeferredValue(search.trim().toLowerCase());

  const filteredInvoices = invoices
    .filter((invoice) => {
      if (statusFilter !== "all" && invoice.status !== statusFilter) {
        return false;
      }

      if (!deferredSearch) {
        return true;
      }

      const searchable = [
        invoice.id,
        invoice.invoice_number,
        invoice.recipient_name,
        invoice.issuer_name,
        invoice.status,
      ]
        .join(" ")
        .toLowerCase();

      return searchable.includes(deferredSearch);
    })
    .sort((left, right) => {
      if (sortBy === "created_desc") {
        return new Date(right.created_at).getTime() - new Date(left.created_at).getTime();
      }

      if (sortBy === "paid_at_desc") {
        return new Date(right.paid_at || 0).getTime() - new Date(left.paid_at || 0).getTime();
      }

      const leftAmount = Number(left.amount_gross || 0);
      const rightAmount = Number(right.amount_gross || 0);
      return sortBy === "amount_asc" ? leftAmount - rightAmount : rightAmount - leftAmount;
    });

  return (
    <div className="overflow-hidden rounded-[2.5rem] border border-white/5 bg-slate-950/40 shadow-xl backdrop-blur-sm">
      <div className="border-b border-white/5 bg-white/5 p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-2">
            <ReceiptText className="h-4 w-4 text-slate-500" />
            <span className="text-sm font-bold text-slate-400">
              Rejestr faktur ({filteredInvoices.length} / {invoices.length})
            </span>
          </div>

          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Szukaj po numerze, odbiorcy lub ID"
                className="h-10 min-w-[260px] border-white/10 bg-slate-900/60 pl-9 text-white placeholder:text-slate-500"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as InvoiceStatusFilter)}
              className="h-10 rounded-xl border border-white/10 bg-slate-900/60 px-3 text-sm font-bold text-slate-200 outline-none"
            >
              <option value="all">Wszystkie statusy</option>
              <option value="paid">Oplacone</option>
              <option value="issued">Wystawione</option>
              <option value="draft">Robocze</option>
              <option value="cancelled">Anulowane</option>
            </select>

            <select
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value as InvoiceSortOption)}
              className="h-10 rounded-xl border border-white/10 bg-slate-900/60 px-3 text-sm font-bold text-slate-200 outline-none"
            >
              <option value="created_desc">Najnowsze</option>
              <option value="paid_at_desc">Ostatnio oplacone</option>
              <option value="amount_desc">Najwyzsza kwota</option>
              <option value="amount_asc">Najnizsza kwota</option>
            </select>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-white/5 bg-slate-950/20">
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">
                Numer
              </th>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">
                Typ
              </th>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">
                Status
              </th>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">
                Odbiorca
              </th>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">
                Kwoty
              </th>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">
                Wystawiona
              </th>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">
                Platnosc
              </th>
              <th className="px-6 py-4 text-right text-[10px] font-black uppercase tracking-widest text-slate-500">
                Dokument
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {filteredInvoices.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-20 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/5">
                      <FileText className="h-8 w-8 text-slate-700" />
                    </div>
                    <p className="font-bold text-slate-500">
                      {deferredSearch || statusFilter !== "all"
                        ? "Brak faktur pasujacych do wybranych filtrow."
                        : "Brak faktur do wyswietlenia."}
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredInvoices.map((invoice) => (
                <tr key={invoice.id} className="transition-colors hover:bg-white/5">
                  <td className="px-6 py-4">
                    <Link
                      href={`/app/admin/contracts/${invoice.contract_id}`}
                      className="inline-flex flex-col transition-colors hover:text-emerald-300"
                    >
                      <span className="text-sm font-bold text-white">
                        {invoice.invoice_number}
                      </span>
                      <span className="mt-0.5 font-mono text-[10px] text-slate-500">
                        {invoice.id.slice(0, 8)}
                      </span>
                    </Link>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-bold text-white">
                      {getTypeLabel(invoice.invoice_type)}
                    </div>
                    <div className="mt-0.5 text-[10px] uppercase tracking-wider text-slate-500">
                      {invoice.invoice_type}
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <span
                      className={`rounded-lg px-2 py-1 text-[10px] font-black uppercase tracking-wider ${getStatusBadge(invoice.status)}`}
                    >
                      {invoice.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-bold text-white">
                      {invoice.recipient_name}
                    </div>
                    <div className="mt-0.5 text-[10px] text-slate-500">
                      {invoice.recipient_nip || "Brak NIP"} | {invoice.issuer_name}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-black text-white">
                      {formatMoneyPLN(invoice.amount_gross)}
                    </div>
                    <div className="mt-0.5 text-[10px] text-slate-500">
                      Netto: {formatMoneyPLN(invoice.amount_net)} | Fee:{" "}
                      {formatMoneyPLN(invoice.platform_fee)}
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="text-sm font-bold text-slate-300">
                      {invoice.issued_at
                        ? format(new Date(invoice.issued_at), "d MMM yyyy", { locale: pl })
                        : "Brak"}
                    </div>
                    <div className="mt-0.5 text-[10px] text-slate-500">
                      Utworzona: {format(new Date(invoice.created_at), "d MMM yyyy", { locale: pl })}
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="text-sm font-bold text-slate-300">
                      {invoice.paid_at
                        ? format(new Date(invoice.paid_at), "d MMM yyyy", { locale: pl })
                        : "Nieoplacona"}
                    </div>
                    <div className="mt-0.5 text-[10px] text-slate-500">
                      {invoice.storage_path ? "PDF zapisany" : "Brak pliku"}
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-right">
                    {invoice.download_url ? (
                      <a
                        href={invoice.download_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-bold text-slate-200 transition-all hover:border-indigo-400/30 hover:bg-indigo-500/10 hover:text-white"
                      >
                        Pobierz PDF
                      </a>
                    ) : (
                      <span className="text-xs text-slate-500">Brak PDF</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
