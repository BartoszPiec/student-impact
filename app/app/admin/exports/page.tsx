"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Download, FileSpreadsheet, Calendar } from "lucide-react";

export default function AdminExportsPage() {
  const currentMonth = new Date().toISOString().slice(0, 7); // "2026-03"
  const [month, setMonth] = useState(currentMonth);
  const [loadingPit, setLoadingPit] = useState(false);
  const [loadingInvoices, setLoadingInvoices] = useState(false);

  async function downloadFile(url: string, filename: string, setLoading: (v: boolean) => void) {
    setLoading(true);
    try {
      const res = await fetch(url);
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Błąd pobierania pliku" }));
        alert(err.message ?? err.error ?? "Błąd pobierania pliku");
        return;
      }
      const blob = await res.blob();
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = filename;
      link.click();
      URL.revokeObjectURL(link.href);
    } catch (e: any) {
      alert("Błąd: " + e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-12 space-y-8">
      <div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Eksporty Księgowe</h1>
        <p className="text-slate-500 mt-1">Pobierz dane finansowe do rozliczeń podatkowych i księgowości.</p>
      </div>

      {/* Month Picker */}
      <Card className="bg-white rounded-2xl border-slate-100 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2 text-slate-700">
            <Calendar className="w-4 h-4" /> Wybierz okres rozliczeniowy
          </CardTitle>
        </CardHeader>
        <CardContent>
          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="border border-slate-200 rounded-lg px-3 py-2 text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
          <p className="text-xs text-slate-400 mt-2">Eksporty obejmą wszystkie transakcje z wybranego miesiąca.</p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* PIT-11 CSV */}
        <Card className="bg-white rounded-2xl border-slate-100 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2 text-slate-800">
              <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
              CSV dla PIT-11
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-slate-500">
              Zestawienie wypłat studentów z podziałem na kwotę brutto, prowizję platformy i kwotę netto.
              Gotowe do importu do Optimy lub przekazania księgowej.
            </p>
            <ul className="text-xs text-slate-400 space-y-1 list-disc list-inside">
              <li>Imię i nazwisko, PESEL, data urodzenia</li>
              <li>Rezydencja podatkowa PL, zwolnienie PIT u26</li>
              <li>Kwota brutto / prowizja / netto (PLN)</li>
              <li>ID kontraktu</li>
            </ul>
            <Button
              onClick={() =>
                downloadFile(
                  `/api/admin/export/pit-csv?month=${month}`,
                  `pit11_${month}.csv`,
                  setLoadingPit
                )
              }
              disabled={loadingPit}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <Download className="w-4 h-4 mr-2" />
              {loadingPit ? "Pobieranie..." : `Pobierz PIT-11 CSV — ${month}`}
            </Button>
          </CardContent>
        </Card>

        {/* Faktury CSV */}
        <Card className="bg-white rounded-2xl border-slate-100 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2 text-slate-800">
              <FileText className="w-5 h-5 text-indigo-600" />
              Rejestr Faktur (CSV)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-slate-500">
              Zestawienie wszystkich płatności Stripe i prowizji platformy za wybrany miesiąc.
              Numer faktury, dane firmy, kwota, ID transakcji Stripe.
            </p>
            <ul className="text-xs text-slate-400 space-y-1 list-disc list-inside">
              <li>Numer faktury FV/YYYY-MM/NNNN</li>
              <li>Firma — nazwa, NIP, adres</li>
              <li>Stripe Session ID, Payment Intent ID</li>
              <li>Kwota, typ (płatność / prowizja)</li>
            </ul>
            <Button
              onClick={() =>
                downloadFile(
                  `/api/admin/export/invoices-zip?month=${month}`,
                  `faktury_${month}.csv`,
                  setLoadingInvoices
                )
              }
              disabled={loadingInvoices}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              <Download className="w-4 h-4 mr-2" />
              {loadingInvoices ? "Pobieranie..." : `Pobierz Rejestr Faktur — ${month}`}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Info box */}
      <Card className="bg-amber-50 border-amber-200 rounded-2xl">
        <CardContent className="p-5">
          <p className="text-sm text-amber-800 font-medium">
            📌 <strong>Uwaga:</strong> Eksport CSV zawiera dane z tabeli{" "}
            <code className="bg-amber-100 px-1 rounded text-xs">financial_ledger</code>.
            Upewnij się, że webhook Stripe jest aktywny i wszystkie transakcje zostały zarejestrowane.
            Faktury PDF (ZIP) zostaną dodane w Sprint #2.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
