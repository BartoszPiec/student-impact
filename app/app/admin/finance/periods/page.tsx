import { createAdminClient } from "@/lib/supabase/admin";
import { format } from "date-fns";
import { pl } from "date-fns/locale";
import { CalendarRange, ReceiptText } from "lucide-react";

export const dynamic = "force-dynamic";

type PeriodLine = {
  month_bucket: string | null;
  amount_minor: number | string;
  balance_effect_minor: number | string;
  reference_type: string | null;
  account_code: string | null;
  direction: string | null;
};

type PitPeriodRow = {
  tax_period: string;
  pit_amount: number | string;
  amount_gross: number | string;
};

type PeriodSummary = {
  monthBucket: string;
  lineCount: number;
  referenceTypes: Set<string>;
  volumeMinor: number;
  revenueMinor: number;
  balanceMinor: number;
};

type PitPeriodSummary = {
  taxPeriod: string;
  withholdingCount: number;
  pitAmount: number;
  grossAmount: number;
};

function formatMoneyFromMinor(value: number | string | null | undefined) {
  return (Number(value || 0) / 100).toLocaleString("pl-PL", {
    style: "currency",
    currency: "PLN",
  });
}

function formatMoneyPLN(value: number | string | null | undefined) {
  return Number(value || 0).toLocaleString("pl-PL", {
    style: "currency",
    currency: "PLN",
  });
}

export default async function AdminFinancePeriodsPage() {
  const supabase = createAdminClient();

  const [{ data: accountingData, error: accountingError }, { data: pitData, error: pitError }] =
    await Promise.all([
      supabase
        .from("accounting_book_lines_v1")
        .select(`
          month_bucket,
          amount_minor,
          balance_effect_minor,
          reference_type,
          account_code,
          direction
        `)
        .not("month_bucket", "is", null)
        .order("month_bucket", { ascending: false }),
      supabase
        .from("pit_withholdings")
        .select(`
          tax_period,
          pit_amount,
          amount_gross
        `)
        .not("tax_period", "is", null)
        .order("tax_period", { ascending: false }),
    ]);

  if (accountingError) {
    return (
      <div className="p-8 text-red-500">
        Blad pobierania okresow ksiegowych: {accountingError.message}
      </div>
    );
  }

  if (pitError) {
    return (
      <div className="p-8 text-red-500">
        Blad pobierania okresow PIT: {pitError.message}
      </div>
    );
  }

  const lines = (accountingData || []) as PeriodLine[];
  const pitRows = (pitData || []) as PitPeriodRow[];

  const summariesMap = new Map<string, PeriodSummary>();
  for (const line of lines) {
    if (!line.month_bucket) {
      continue;
    }

    const key = line.month_bucket;
    const summary =
      summariesMap.get(key) ||
      {
        monthBucket: key,
        lineCount: 0,
        referenceTypes: new Set<string>(),
        volumeMinor: 0,
        revenueMinor: 0,
        balanceMinor: 0,
      };

    summary.lineCount += 1;
    summary.balanceMinor += Number(line.balance_effect_minor || 0);

    if (line.reference_type) {
      summary.referenceTypes.add(line.reference_type);
    }

    if (
      line.reference_type === "payment" &&
      line.account_code === "2010" &&
      line.direction === "credit"
    ) {
      summary.volumeMinor += Number(line.amount_minor || 0);
    }

    if (line.account_code === "4010" && line.direction === "credit") {
      summary.revenueMinor += Number(line.amount_minor || 0);
    }

    summariesMap.set(key, summary);
  }

  const pitSummariesMap = new Map<string, PitPeriodSummary>();
  for (const row of pitRows) {
    if (!row.tax_period) {
      continue;
    }

    const key = row.tax_period;
    const summary =
      pitSummariesMap.get(key) ||
      {
        taxPeriod: key,
        withholdingCount: 0,
        pitAmount: 0,
        grossAmount: 0,
      };

    summary.withholdingCount += 1;
    summary.pitAmount += Number(row.pit_amount || 0);
    summary.grossAmount += Number(row.amount_gross || 0);

    pitSummariesMap.set(key, summary);
  }

  const periods = Array.from(summariesMap.values()).sort((a, b) =>
    a.monthBucket < b.monthBucket ? 1 : -1,
  );
  const pitPeriods = Array.from(pitSummariesMap.values()).sort((a, b) =>
    a.taxPeriod < b.taxPeriod ? 1 : -1,
  );

  const totalLines = periods.reduce((sum, period) => sum + period.lineCount, 0);
  const totalVolumeMinor = periods.reduce((sum, period) => sum + period.volumeMinor, 0);
  const totalRevenueMinor = periods.reduce((sum, period) => sum + period.revenueMinor, 0);
  const totalPitGross = pitPeriods.reduce((sum, period) => sum + period.grossAmount, 0);
  const totalPitAmount = pitPeriods.reduce((sum, period) => sum + period.pitAmount, 0);
  const totalWithholdings = pitPeriods.reduce(
    (sum, period) => sum + period.withholdingCount,
    0,
  );

  return (
    <div className="space-y-8 pb-12">
      <div className="relative overflow-hidden rounded-[2.5rem] border border-white/5 bg-slate-900/50 p-8 shadow-2xl">
        <div className="relative z-10 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-indigo-500/30 bg-indigo-500/20">
                <CalendarRange className="h-6 w-6 text-indigo-400" />
              </div>
              <span className="text-xs font-black uppercase tracking-[0.2em] text-indigo-400/80">
                Finance
              </span>
            </div>
            <h1 className="mb-3 text-4xl font-black leading-none tracking-tight text-white md:text-5xl">
              Okresy finansowe
            </h1>
            <p className="max-w-2xl font-medium leading-relaxed text-slate-400">
              Read-only przeglad dwoch warstw: bucketow ksiegowych po{" "}
              <code className="text-slate-300">month_bucket</code> oraz okresow PIT po{" "}
              <code className="text-slate-300">tax_period</code>. Obie sekcje sa celowo
              oddzielone, bo operuja na innych typach i innym znaczeniu biznesowym.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-3xl border border-white/5 bg-slate-950/40 p-5">
          <div className="text-xs font-black uppercase tracking-widest text-slate-500">
            Okresy ksiegowe
          </div>
          <div className="mt-2 text-3xl font-black text-white">{periods.length}</div>
          <div className="mt-1 text-sm text-slate-400">Bucket miesieczny z ksiegi</div>
        </div>
        <div className="rounded-3xl border border-white/5 bg-slate-950/40 p-5">
          <div className="text-xs font-black uppercase tracking-widest text-slate-500">
            Wolumen platnosci
          </div>
          <div className="mt-2 text-3xl font-black text-white">
            {formatMoneyFromMinor(totalVolumeMinor)}
          </div>
          <div className="mt-1 text-sm text-slate-400">
            Suma payment credit dla konta 2010
          </div>
        </div>
        <div className="rounded-3xl border border-white/5 bg-slate-950/40 p-5">
          <div className="text-xs font-black uppercase tracking-widest text-slate-500">
            Przychod ksiegowy
          </div>
          <div className="mt-2 text-3xl font-black text-white">
            {formatMoneyFromMinor(totalRevenueMinor)}
          </div>
          <div className="mt-1 text-sm text-slate-400">Linie: {totalLines}</div>
        </div>
      </div>

      <div className="overflow-hidden rounded-[2.5rem] border border-white/5 bg-slate-950/40 shadow-xl backdrop-blur-sm">
        <div className="flex items-center justify-between gap-4 border-b border-white/5 bg-white/5 p-6">
          <div className="flex items-center gap-2">
            <ReceiptText className="h-4 w-4 text-slate-500" />
            <span className="text-sm font-bold text-slate-400">
              Buckety ksiegowe ({periods.length})
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-white/5 bg-slate-950/20">
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">
                  Okres
                </th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">
                  Linie
                </th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">
                  Typy referencji
                </th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">
                  Wolumen
                </th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">
                  Przychod
                </th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">
                  Efekt bilansowy
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {periods.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-20 text-center font-bold text-slate-500">
                    Brak bucketow ksiegowych do wyswietlenia.
                  </td>
                </tr>
              ) : (
                periods.map((period) => (
                  <tr key={period.monthBucket} className="transition-colors hover:bg-white/5">
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="text-sm font-bold text-white">
                        {format(new Date(period.monthBucket), "LLLL yyyy", { locale: pl })}
                      </div>
                      <div className="mt-0.5 text-[10px] text-slate-500">
                        {period.monthBucket}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-black text-white">
                      {period.lineCount}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-bold text-slate-300">
                        {period.referenceTypes.size}
                      </div>
                      <div className="mt-0.5 text-[10px] text-slate-500">
                        {Array.from(period.referenceTypes).sort().join(", ") || "brak"}
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-black text-white">
                      {formatMoneyFromMinor(period.volumeMinor)}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-black text-white">
                      {formatMoneyFromMinor(period.revenueMinor)}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-black text-indigo-300">
                      {formatMoneyFromMinor(period.balanceMinor)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-3xl border border-white/5 bg-slate-950/40 p-5">
          <div className="text-xs font-black uppercase tracking-widest text-slate-500">
            Okresy PIT
          </div>
          <div className="mt-2 text-3xl font-black text-white">{pitPeriods.length}</div>
          <div className="mt-1 text-sm text-slate-400">Distinct `tax_period`</div>
        </div>
        <div className="rounded-3xl border border-white/5 bg-slate-950/40 p-5">
          <div className="text-xs font-black uppercase tracking-widest text-slate-500">
            Gross PIT
          </div>
          <div className="mt-2 text-3xl font-black text-white">
            {formatMoneyPLN(totalPitGross)}
          </div>
          <div className="mt-1 text-sm text-slate-400">
            Rekordy: {totalWithholdings}
          </div>
        </div>
        <div className="rounded-3xl border border-white/5 bg-slate-950/40 p-5">
          <div className="text-xs font-black uppercase tracking-widest text-slate-500">
            PIT do zaplaty
          </div>
          <div className="mt-2 text-3xl font-black text-white">
            {formatMoneyPLN(totalPitAmount)}
          </div>
          <div className="mt-1 text-sm text-slate-400">
            Numeric PLN, bez minor units
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-[2.5rem] border border-white/5 bg-slate-950/40 shadow-xl backdrop-blur-sm">
        <div className="flex items-center justify-between gap-4 border-b border-white/5 bg-white/5 p-6">
          <div className="flex items-center gap-2">
            <ReceiptText className="h-4 w-4 text-slate-500" />
            <span className="text-sm font-bold text-slate-400">
              Okresy PIT ({pitPeriods.length})
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-white/5 bg-slate-950/20">
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">
                  Tax period
                </th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">
                  Rekordy
                </th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">
                  Gross
                </th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">
                  PIT
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {pitPeriods.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-20 text-center font-bold text-slate-500">
                    Brak okresow PIT do wyswietlenia.
                  </td>
                </tr>
              ) : (
                pitPeriods.map((period) => (
                  <tr key={period.taxPeriod} className="transition-colors hover:bg-white/5">
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-bold text-white">
                      {period.taxPeriod}
                    </td>
                    <td className="px-6 py-4 text-sm font-black text-white">
                      {period.withholdingCount}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-black text-white">
                      {formatMoneyPLN(period.grossAmount)}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-black text-indigo-300">
                      {formatMoneyPLN(period.pitAmount)}
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
