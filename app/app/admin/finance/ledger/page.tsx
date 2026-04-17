import { createAdminClient } from "@/lib/supabase/admin";
import { format } from "date-fns";
import { pl } from "date-fns/locale";
import { BookOpenText, ReceiptText } from "lucide-react";

export const dynamic = "force-dynamic";

type LedgerLine = {
  entry_id: string;
  posted_at: string;
  month_bucket: string;
  journal_name: string | null;
  reference_type: string | null;
  reference_id: string | null;
  account_code: string;
  account_name: string;
  account_type: string;
  direction: string;
  amount_minor: number | string;
  balance_effect_minor: number | string;
};

function formatMoneyFromMinor(value: number | string | null | undefined) {
  return (Number(value || 0) / 100).toLocaleString("pl-PL", {
    style: "currency",
    currency: "PLN",
  });
}

function getDirectionBadge(direction: string) {
  if (direction === "debit") {
    return "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20";
  }

  return "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20";
}

export default async function AdminFinanceLedgerPage() {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("accounting_book_lines_v1")
    .select(`
      entry_id,
      posted_at,
      month_bucket,
      journal_name,
      reference_type,
      reference_id,
      account_code,
      account_name,
      account_type,
      direction,
      amount_minor,
      balance_effect_minor
    `)
    .order("posted_at", { ascending: false })
    .limit(200);

  if (error) {
    return <div className="p-8 text-red-500">Blad pobierania ksiegi: {error.message}</div>;
  }

  const lines = (data || []) as LedgerLine[];
  const totalAmountMinor = lines.reduce((sum, line) => sum + Number(line.amount_minor || 0), 0);
  const totalBalanceEffectMinor = lines.reduce(
    (sum, line) => sum + Number(line.balance_effect_minor || 0),
    0,
  );
  const latestMonth = lines[0]?.month_bucket || null;

  return (
    <div className="space-y-8 pb-12">
      <div className="relative overflow-hidden rounded-[2.5rem] border border-white/5 bg-slate-900/50 p-8 shadow-2xl">
        <div className="relative z-10 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-indigo-500/30 bg-indigo-500/20">
                <BookOpenText className="h-6 w-6 text-indigo-400" />
              </div>
              <span className="text-xs font-black uppercase tracking-[0.2em] text-indigo-400/80">
                Finance
              </span>
            </div>
            <h1 className="mb-3 text-4xl font-black leading-none tracking-tight text-white md:text-5xl">
              Ksiega finansowa
            </h1>
            <p className="max-w-2xl font-medium leading-relaxed text-slate-400">
              Read-only explorer oparty o{" "}
              <code className="text-slate-300">accounting_book_lines_v1</code>. Pokazuje
              ostatnie linie ksiegowe z perspektywy dziennika, kont i efektu bilansowego.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-3xl border border-white/5 bg-slate-950/40 p-5">
          <div className="text-xs font-black uppercase tracking-widest text-slate-500">Linie</div>
          <div className="mt-2 text-3xl font-black text-white">{lines.length}</div>
          <div className="mt-1 text-sm text-slate-400">Ostatnie rekordy z widoku ksiegi</div>
        </div>
        <div className="rounded-3xl border border-white/5 bg-slate-950/40 p-5">
          <div className="text-xs font-black uppercase tracking-widest text-slate-500">
            Kwota linii
          </div>
          <div className="mt-2 text-3xl font-black text-white">
            {formatMoneyFromMinor(totalAmountMinor)}
          </div>
          <div className="mt-1 text-sm text-slate-400">
            Suma amount_minor dla widocznego wycinka
          </div>
        </div>
        <div className="rounded-3xl border border-white/5 bg-slate-950/40 p-5">
          <div className="text-xs font-black uppercase tracking-widest text-slate-500">
            Efekt bilansowy
          </div>
          <div className="mt-2 text-3xl font-black text-white">
            {formatMoneyFromMinor(totalBalanceEffectMinor)}
          </div>
          <div className="mt-1 text-sm text-slate-400">
            {latestMonth ? `Najnowszy bucket: ${latestMonth}` : "Brak bucketu"}
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-[2.5rem] border border-white/5 bg-slate-950/40 shadow-xl backdrop-blur-sm">
        <div className="flex items-center justify-between gap-4 border-b border-white/5 bg-white/5 p-6">
          <div className="flex items-center gap-2">
            <ReceiptText className="h-4 w-4 text-slate-500" />
            <span className="text-sm font-bold text-slate-400">
              Ostatnie linie ksiegowe ({lines.length})
            </span>
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
                  Entry
                </th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">
                  Journal
                </th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">
                  Konto
                </th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">
                  Ref
                </th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">
                  Direction
                </th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">
                  Kwota
                </th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">
                  Efekt
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {lines.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-20 text-center font-bold text-slate-500">
                    Brak linii ksiegowych do wyswietlenia.
                  </td>
                </tr>
              ) : (
                lines.map((line) => (
                  <tr
                    key={`${line.entry_id}-${line.account_code}-${line.direction}`}
                    className="transition-colors hover:bg-white/5"
                  >
                    <td className="whitespace-nowrap px-6 py-4">
                      <span className="text-sm font-bold text-slate-300">
                        {format(new Date(line.posted_at), "d MMM yyyy", { locale: pl })}
                      </span>
                      <div className="mt-0.5 text-[10px] text-slate-500">
                        {format(new Date(line.posted_at), "HH:mm")}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-bold text-white">
                        {line.entry_id.slice(0, 8)}
                      </div>
                      <div className="mt-0.5 text-[10px] text-slate-500">{line.month_bucket}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-300">
                      {line.journal_name || "Brak"}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-bold text-white">{line.account_code}</div>
                      <div className="mt-0.5 text-[10px] text-slate-500">
                        {line.account_name} | {line.account_type}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-xs font-bold uppercase tracking-wider text-slate-300">
                        {line.reference_type || "brak"}
                      </div>
                      <div className="mt-0.5 font-mono text-[10px] text-slate-500">
                        {line.reference_id ? line.reference_id.slice(0, 8) : "-"}
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <span
                        className={`rounded-lg px-2 py-1 text-[10px] font-black uppercase tracking-wider ${getDirectionBadge(line.direction)}`}
                      >
                        {line.direction}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-black text-white">
                      {formatMoneyFromMinor(line.amount_minor)}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-black text-indigo-300">
                      {formatMoneyFromMinor(line.balance_effect_minor)}
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
