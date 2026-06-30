"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar, Download, FileSpreadsheet, FileText } from "lucide-react";
import { toast } from "sonner";

type DownloadSetter = (value: boolean) => void;

async function readErrorMessage(response: Response) {
  const contentType = response.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    const payload = await response.json().catch(() => null);
    return payload?.message || payload?.error || "Błąd pobierania pliku.";
  }

  const text = await response.text().catch(() => "");
  return text.trim() || "Błąd pobierania pliku.";
}

export default function AdminExportsPage() {
  const currentMonth = new Date().toISOString().slice(0, 7);
  const [month, setMonth] = useState(currentMonth);
  const [loadingPit, setLoadingPit] = useState(false);
  const [loadingInvoices, setLoadingInvoices] = useState(false);

  async function downloadFile(url: string, filename: string, setLoading: DownloadSetter) {
    setLoading(true);

    try {
      const response = await fetch(url);

      if (!response.ok) {
        toast.error(await readErrorMessage(response));
        return;
      }

      const blob = await response.blob();
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = filename;
      link.click();
      URL.revokeObjectURL(link.href);
      toast.success(`Pobrano ${filename}.`);
    } catch {
      toast.error("Nie udało się pobrać pliku. Spróbuj ponownie.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-8 pb-12">
      <div className="relative overflow-hidden rounded-[2.5rem] border border-white/5 bg-slate-900/50 p-8 shadow-2xl">
        <div className="relative z-10 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-indigo-500/30 bg-indigo-500/20">
                <FileSpreadsheet className="h-6 w-6 text-indigo-400" />
              </div>
              <span className="text-xs font-black uppercase tracking-[0.2em] text-indigo-400/80">
                Finance
              </span>
            </div>
            <h1 className="mb-3 text-4xl font-black leading-none tracking-tight text-white md:text-5xl">
              Eksporty
            </h1>
            <p className="max-w-2xl font-medium leading-relaxed text-slate-400">
              Pobieraj gotowe eksporty dla rozliczeń podatkowych i księgowości.
              Panel pokazuje tylko formaty, które są obecnie obsługiwane w systemie.
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-[2.5rem] border border-white/5 bg-slate-950/40 p-6 shadow-xl backdrop-blur-sm">
        <div className="mb-4 flex items-center gap-2 text-sm font-bold text-slate-300">
          <Calendar className="h-4 w-4 text-slate-500" />
          <span>Wybierz okres rozliczeniowy</span>
        </div>

        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <input
            type="month"
            value={month}
            onChange={(event) => setMonth(event.target.value)}
            className="h-11 rounded-xl border border-white/10 bg-slate-900/60 px-4 text-sm font-bold text-white outline-none focus:border-indigo-400/40"
          />
          <p className="text-sm text-slate-500">
            Eksporty obejmują dane tylko z wybranego miesiąca.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="rounded-[2.5rem] border border-white/5 bg-slate-950/40 p-6 shadow-xl backdrop-blur-sm">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-emerald-500/20 bg-emerald-500/10">
              <FileSpreadsheet className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white">PIT-11 CSV</h2>
              <p className="text-sm text-slate-400">Eksport danych do rozliczeń podatkowych studentów.</p>
            </div>
          </div>

          <p className="text-sm leading-relaxed text-slate-400">
            Plik zawiera dane osobowe i podatkowe potrzebne do przygotowania zestawienia PIT-11:
            brutto, zaliczkę PIT, netto oraz identyfikator kontraktu.
          </p>

          <ul className="mt-4 space-y-1 text-xs text-slate-500">
            <li>Imię i nazwisko, PESEL, data urodzenia</li>
            <li>Rezydencja podatkowa PL i zwolnienie PIT u26</li>
            <li>Kwota brutto, zaliczka PIT i kwota netto</li>
            <li>ID kontraktu dla łatwego powiązania z operacjami</li>
          </ul>

          <Button
            onClick={() =>
              downloadFile(`/api/admin/export/pit-csv?month=${month}`, `pit11_${month}.csv`, setLoadingPit)
            }
            disabled={loadingPit}
            className="mt-6 w-full bg-emerald-600 text-white hover:bg-emerald-700"
          >
            <Download className="mr-2 h-4 w-4" />
            {loadingPit ? "Pobieranie..." : `Pobierz PIT-11 CSV - ${month}`}
          </Button>
        </div>

        <div className="rounded-[2.5rem] border border-white/5 bg-slate-950/40 p-6 shadow-xl backdrop-blur-sm">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-indigo-500/20 bg-indigo-500/10">
              <FileText className="h-5 w-5 text-indigo-300" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white">Faktury ZIP</h2>
              <p className="text-sm text-slate-400">Paczka PDF z manifestem CSV dla księgowości.</p>
            </div>
          </div>

          <p className="text-sm leading-relaxed text-slate-400">
            Ten eksport zwraca plik ZIP z PDF-ami faktur i rachunków za wybrany miesiąc oraz
            manifest CSV ułatwiający kontrolę dokumentów.
          </p>

          <ul className="mt-4 space-y-1 text-xs text-slate-500">
            <li>PDF-y faktur firm i rachunków studentów</li>
            <li>Manifest CSV z numerem, statusem i kwotami</li>
            <li>Dane wystawcy i odbiorcy dokumentu</li>
            <li>ID kontraktu oraz etapu dla kontroli księgowej</li>
          </ul>

          <Button
            onClick={() =>
              downloadFile(
                `/api/admin/export/invoices-zip?month=${month}`,
                `faktury_${month}.zip`,
                setLoadingInvoices,
              )
            }
            disabled={loadingInvoices}
            className="mt-6 w-full bg-indigo-600 text-white hover:bg-indigo-700"
          >
            <Download className="mr-2 h-4 w-4" />
            {loadingInvoices ? "Pobieranie..." : `Pobierz faktury ZIP - ${month}`}
          </Button>
        </div>
      </div>

      <div className="rounded-[2.5rem] border border-amber-500/15 bg-amber-500/5 p-6">
        <p className="text-sm font-medium leading-relaxed text-amber-200">
          Uwaga: eksporty korzystają z aktualnych danych finansowych zapisanych w bazie i webhookach Stripe.
          Jeśli dane miesiąca wyglądają niepełnie, najpierw sprawdź przepływ webhooków i wpisy w panelach finansowych.
        </p>
      </div>
    </div>
  );
}
