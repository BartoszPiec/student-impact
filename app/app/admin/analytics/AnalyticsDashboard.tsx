"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Clock3,
  FolderKanban,
  History,
  Target,
  TrendingDown,
  TrendingUp,
  Trophy,
  Users,
  Wallet,
} from "lucide-react";
import { DashboardHeader } from "./DashboardHeader";
import { FunnelChart } from "./FunnelChart";

type AnalyticsSeriesPoint = {
  month: string;
  amount: number;
};

type LeaderboardRow = {
  email?: string | null;
  total_volume?: number | null;
  contracts_count?: number | null;
};

type CategoryRow = {
  category?: string | null;
  count?: number | null;
  volume?: number | null;
};

type RecentRow = {
  id?: string | null;
  created_at?: string | null;
  status?: string | null;
  company_name?: string | null;
};

type AnalyticsStats = {
  financials?: {
    total_volume_pln?: number;
    total_revenue_pln?: number;
    escrow_active_pln?: number;
    student_payable_pln?: number;
    tax_payable_pln?: number;
    paid_out_pln?: number;
    refunded_pln?: number;
  };
  metrics?: {
    avg_completion_days?: number;
  };
  users?: {
    students?: number;
    companies?: number;
  };
  contracts?: {
    completed?: number;
    total?: number;
  };
  revenue_history?: AnalyticsSeriesPoint[];
  volume_history?: AnalyticsSeriesPoint[];
  leaderboard?: {
    top_companies?: LeaderboardRow[];
    top_students?: LeaderboardRow[];
  };
  funnel?: {
    offers?: number;
    applications?: number;
    accepted?: number;
    contracts?: number;
  };
  categories?: CategoryRow[];
  recent?: RecentRow[];
};

interface AnalyticsDashboardProps {
  stats: AnalyticsStats;
  onRefresh: () => void;
  loading: boolean;
}

function formatMoneyPLN(value: number | null | undefined) {
  return Number(value || 0).toLocaleString("pl-PL", {
    style: "currency",
    currency: "PLN",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

function formatCompactNumber(value: number | null | undefined) {
  return Number(value || 0).toLocaleString("pl-PL");
}

function getRecentStatusBadge(status: string | null | undefined) {
  switch (status) {
    case "payment":
      return "bg-emerald-500/10 text-emerald-300 border-emerald-400/20";
    case "refund":
      return "bg-rose-500/10 text-rose-300 border-rose-400/20";
    case "student_payout":
      return "bg-indigo-500/10 text-indigo-300 border-indigo-400/20";
    case "milestone_release":
      return "bg-amber-500/10 text-amber-300 border-amber-400/20";
    default:
      return "bg-slate-500/10 text-slate-300 border-white/10";
  }
}

export function AnalyticsDashboard({
  stats,
  onRefresh,
  loading,
}: AnalyticsDashboardProps) {
  const [activeSeries, setActiveSeries] = useState<"revenue" | "volume">("revenue");

  const financials = stats?.financials ?? {};
  const users = {
    students: stats?.users?.students ?? 0,
    companies: stats?.users?.companies ?? 0,
  };
  const contracts = {
    completed: stats?.contracts?.completed ?? 0,
    total: stats?.contracts?.total ?? 0,
  };
  const revenueHistory = Array.isArray(stats?.revenue_history) ? stats.revenue_history : [];
  const volumeHistory = Array.isArray(stats?.volume_history) ? stats.volume_history : [];
  const topCompanies = Array.isArray(stats?.leaderboard?.top_companies)
    ? stats.leaderboard.top_companies
    : [];
  const topStudents = Array.isArray(stats?.leaderboard?.top_students)
    ? stats.leaderboard.top_students
    : [];
  const categories = Array.isArray(stats?.categories) ? stats.categories : [];
  const recent = Array.isArray(stats?.recent) ? stats.recent : [];
  const funnelData = {
    offers: stats?.funnel?.offers ?? 0,
    applications: stats?.funnel?.applications ?? 0,
    accepted: stats?.funnel?.accepted ?? 0,
    contracts: stats?.funnel?.contracts ?? 0,
  };

  const chartData = activeSeries === "revenue" ? revenueHistory : volumeHistory;
  const maxVal = Math.max(...chartData.map((point) => point.amount), 100);
  const yAxisMax = Math.ceil(maxVal / 1000) * 1000;
  const conversionRate = Math.round((contracts.completed / (contracts.total || 1)) * 100);
  const avgCompletionDays = stats?.metrics?.avg_completion_days ?? 0;

  return (
    <div className="space-y-12">
      <DashboardHeader onRefresh={onRefresh} loading={loading} />

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
        <Card className="group overflow-hidden rounded-[2rem] border border-white/5 bg-slate-950/40 shadow-xl shadow-black/20">
          <CardContent className="p-6">
            <div className="mb-4 flex items-start justify-between">
              <div className="rounded-2xl bg-emerald-100 p-3 text-emerald-600 transition-transform group-hover:scale-110">
                <Wallet className="h-6 w-6" />
              </div>
              <div className="rounded-lg bg-emerald-50 px-2 py-1 text-[10px] font-black text-emerald-600">
                LIVE
              </div>
            </div>
            <div className="mb-1 text-sm font-bold uppercase tracking-widest text-slate-500">
              Calkowity obrot
            </div>
            <div className="text-3xl font-black tracking-tight text-white">
              {formatMoneyPLN(financials.total_volume_pln)}
            </div>
          </CardContent>
        </Card>

        <Card className="group overflow-hidden rounded-[2rem] border border-white/5 bg-slate-950/40 shadow-xl shadow-black/20">
          <CardContent className="p-6">
            <div className="mb-4 flex items-start justify-between">
              <div className="rounded-2xl bg-indigo-100 p-3 text-indigo-600 transition-transform group-hover:scale-110">
                <TrendingUp className="h-6 w-6" />
              </div>
              <div className="rounded-lg bg-indigo-50 px-2 py-1 text-[10px] font-black text-indigo-600">
                LEDGER
              </div>
            </div>
            <div className="mb-1 text-sm font-bold uppercase tracking-widest text-slate-500">
              Przychod
            </div>
            <div className="text-3xl font-black tracking-tight text-white">
              {formatMoneyPLN(financials.total_revenue_pln)}
            </div>
          </CardContent>
        </Card>

        <Card className="group overflow-hidden rounded-[2rem] border border-white/5 bg-slate-950/40 shadow-xl shadow-black/20">
          <CardContent className="p-6">
            <div className="mb-4 flex items-start justify-between">
              <div className="rounded-2xl bg-amber-100 p-3 text-amber-600 transition-transform group-hover:scale-110">
                <Users className="h-6 w-6" />
              </div>
            </div>
            <div className="mb-1 text-sm font-bold uppercase tracking-widest text-slate-500">
              Uzytkownicy
            </div>
            <div className="text-3xl font-black tracking-tight text-white">
              {formatCompactNumber(users.students + users.companies)}
            </div>
            <div className="mt-2 flex gap-2">
              <span className="text-[10px] font-bold italic text-slate-500">
                {users.students} S
              </span>
              <span className="text-[10px] font-bold italic text-slate-500">
                {users.companies} F
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="group overflow-hidden rounded-[2rem] border border-white/5 bg-slate-950/40 shadow-xl shadow-black/20">
          <CardContent className="p-6">
            <div className="mb-4 flex items-start justify-between">
              <div className="rounded-2xl bg-purple-100 p-3 text-purple-600 transition-transform group-hover:scale-110">
                <Target className="h-6 w-6" />
              </div>
            </div>
            <div className="mb-1 text-sm font-bold uppercase tracking-widest text-slate-500">
              Skutecznosc
            </div>
            <div className="text-3xl font-black tracking-tight text-white">
              {conversionRate}%
            </div>
            <div className="mt-2 text-[10px] font-bold uppercase text-purple-400">
              Conversion to success
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
        <Card className="overflow-hidden rounded-[2rem] border border-white/5 bg-slate-950/40 shadow-xl shadow-black/20">
          <CardContent className="p-6">
            <div className="mb-2 text-[10px] font-black uppercase tracking-widest text-slate-500">
              Escrow liability
            </div>
            <div className="text-2xl font-black text-white">
              {formatMoneyPLN(financials.escrow_active_pln)}
            </div>
            <p className="mt-2 text-sm font-medium text-slate-400">
              Srodki firm juz zasilone i czekajace na kolejne rozliczenia.
            </p>
          </CardContent>
        </Card>

        <Card className="overflow-hidden rounded-[2rem] border border-white/5 bg-slate-950/40 shadow-xl shadow-black/20">
          <CardContent className="p-6">
            <div className="mb-2 text-[10px] font-black uppercase tracking-widest text-slate-500">
              Student payable
            </div>
            <div className="text-2xl font-black text-white">
              {formatMoneyPLN(financials.student_payable_pln)}
            </div>
            <p className="mt-2 text-sm font-medium text-slate-400">
              Kwota nalezna studentom, ale jeszcze niewyplacona z banku.
            </p>
          </CardContent>
        </Card>

        <Card className="overflow-hidden rounded-[2rem] border border-white/5 bg-slate-950/40 shadow-xl shadow-black/20">
          <CardContent className="p-6">
            <div className="mb-2 text-[10px] font-black uppercase tracking-widest text-slate-500">
              Tax payable
            </div>
            <div className="text-2xl font-black text-white">
              {formatMoneyPLN(financials.tax_payable_pln)}
            </div>
            <p className="mt-2 text-sm font-medium text-slate-400">
              Zobowiazania PIT wynikajace z zaakceptowanych milestone'ow.
            </p>
          </CardContent>
        </Card>

        <Card className="overflow-hidden rounded-[2rem] border border-white/5 bg-slate-950/40 shadow-xl shadow-black/20">
          <CardContent className="p-6">
            <div className="mb-2 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
              <Clock3 className="h-3.5 w-3.5 text-slate-300" />
              Avg completion
            </div>
            <div className="text-2xl font-black text-white">
              {avgCompletionDays.toLocaleString("pl-PL", {
                minimumFractionDigits: 0,
                maximumFractionDigits: 1,
              })}{" "}
              <span className="text-sm text-slate-500">dni</span>
            </div>
            <p className="mt-2 text-sm font-medium text-slate-400">
              Sredni czas od utworzenia do zakonczonego kontraktu.
            </p>
          </CardContent>
        </Card>

        <Card className="overflow-hidden rounded-[2rem] border border-white/5 bg-slate-950/40 shadow-xl shadow-black/20">
          <CardContent className="p-6">
            <div className="mb-2 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
              <Wallet className="h-3.5 w-3.5 text-emerald-400" />
              Paid out
            </div>
            <div className="text-2xl font-black text-white">
              {formatMoneyPLN(financials.paid_out_pln)}
            </div>
            <p className="mt-2 text-sm font-medium text-slate-400">
              Laczna wartosc juz wyplacona studentom z warstwy ksiegowej.
            </p>
          </CardContent>
        </Card>

        <Card className="overflow-hidden rounded-[2rem] border border-white/5 bg-slate-950/40 shadow-xl shadow-black/20">
          <CardContent className="p-6">
            <div className="mb-2 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
              <TrendingDown className="h-3.5 w-3.5 text-rose-400" />
              Refunded
            </div>
            <div className="text-2xl font-black text-white">
              {formatMoneyPLN(financials.refunded_pln)}
            </div>
            <p className="mt-2 text-sm font-medium text-slate-400">
              Kwota zwrocona z warstwy escrow na podstawie ledger entries.
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <Card className="overflow-hidden rounded-[2.5rem] border border-white/5 bg-slate-950/40 shadow-xl shadow-black/20 lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-8">
            <div>
              <CardTitle className="text-xl font-black italic tracking-tight text-white">
                Dynamika platformy
              </CardTitle>
              <p className="mt-1 text-xs font-bold uppercase tracking-widest text-slate-500">
                Growth and revenue
              </p>
            </div>
            <div className="flex items-center gap-1 rounded-xl border border-white/5 bg-white/5 p-1">
              <button
                onClick={() => setActiveSeries("revenue")}
                className={`rounded-lg px-4 py-1.5 text-[10px] font-black uppercase tracking-widest transition-all ${
                  activeSeries === "revenue"
                    ? "bg-indigo-500 text-white shadow-sm"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Revenue
              </button>
              <button
                onClick={() => setActiveSeries("volume")}
                className={`rounded-lg px-4 py-1.5 text-[10px] font-black uppercase tracking-widest transition-all ${
                  activeSeries === "volume"
                    ? "bg-indigo-500 text-white shadow-sm"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Volume
              </button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="relative h-[300px] w-full px-4">
              <div className="pointer-events-none absolute inset-x-4 inset-y-0 flex select-none flex-col justify-between text-[10px] font-bold text-slate-600">
                {[100, 75, 50, 25, 0].map((pct) => (
                  <div key={pct} className="relative w-full border-t border-white/5">
                    <span className="absolute -top-3 left-0 bg-slate-950 pr-2">
                      {Math.round(yAxisMax * (pct / 100))}
                    </span>
                  </div>
                ))}
              </div>

              <div className="absolute inset-x-12 inset-y-0 flex items-end justify-around gap-4">
                {chartData.length > 0 ? (
                  chartData.map((point) => {
                    const height = (point.amount / yAxisMax) * 100;

                    return (
                      <div
                        key={point.month}
                        className="group relative flex h-full w-full cursor-pointer flex-col justify-end"
                      >
                        <div
                          className={`w-full rounded-t-lg shadow-lg transition-all duration-500 hover:scale-x-110 ${
                            activeSeries === "revenue"
                              ? "bg-indigo-500 shadow-indigo-200"
                              : "bg-slate-700 shadow-black/20"
                          }`}
                          style={{ height: `${height}%` }}
                        >
                          <div className="absolute bottom-full left-1/2 z-10 mb-2 -translate-x-1/2 rounded-lg bg-slate-900 px-3 py-1.5 text-[10px] font-black whitespace-nowrap text-white opacity-0 transition-opacity group-hover:opacity-100">
                            {formatMoneyPLN(point.amount)}
                          </div>
                        </div>
                        <div className="mt-4 text-center text-[9px] font-bold uppercase tracking-tighter text-slate-500">
                          {point.month.split("-")[1]}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="mb-12 flex flex-1 items-center justify-center text-sm italic text-slate-500">
                    Brak historycznych danych. Rozpocznij pierwsze transakcje.
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <FunnelChart data={funnelData} />
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <Card className="overflow-hidden rounded-[2.5rem] border border-white/5 bg-slate-950/40 shadow-xl shadow-black/20">
          <CardHeader className="flex flex-row items-center justify-between border-b border-white/5 bg-white/5 px-8 py-6 pb-6">
            <CardTitle className="flex items-center gap-3 text-lg font-black italic text-white">
              <Trophy className="h-5 w-5 text-amber-500" /> TOP Inwestorzy (Firmy)
            </CardTitle>
            <div className="h-2 w-2 rounded-full bg-emerald-500" />
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-white/5">
              {topCompanies.map((company, idx) => (
                <div
                  key={`${company.email}-${idx}`}
                  className="flex items-center justify-between p-6 transition-colors hover:bg-white/5"
                >
                  <div className="flex items-center gap-4">
                    <span className="w-6 text-xl font-black text-slate-600">#{idx + 1}</span>
                    <div>
                      <div className="font-bold text-white">
                        {company.email?.split("@")[0] || "firma"}
                      </div>
                      <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                        {company.contracts_count ?? 0} kontraktow
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-black text-indigo-600">
                      {formatMoneyPLN(company.total_volume ?? 0)}
                    </div>
                    <div className="text-[10px] font-bold uppercase text-slate-500">
                      Volume
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden rounded-[2.5rem] border border-white/5 bg-slate-950/40 shadow-xl shadow-black/20">
          <CardHeader className="flex flex-row items-center justify-between border-b border-white/5 bg-white/5 px-8 py-6 pb-6">
            <CardTitle className="flex items-center gap-3 text-lg font-black italic text-white">
              <Trophy className="h-5 w-5 text-indigo-500" /> TOP Wykonawcy (Studenci)
            </CardTitle>
            <Badge variant="outline" className="border-indigo-400/20 text-[10px] font-black text-indigo-300">
              VERIFIED
            </Badge>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-white/5">
              {topStudents.map((student, idx) => (
                <div
                  key={`${student.email}-${idx}`}
                  className="flex items-center justify-between p-6 transition-colors hover:bg-white/5"
                >
                  <div className="flex items-center gap-4">
                    <span className="w-6 text-xl font-black text-slate-600">#{idx + 1}</span>
                    <div>
                      <div className="font-bold text-white">
                        {student.email?.split("@")[0] || "student"}
                      </div>
                      <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                        {student.contracts_count ?? 0} kontraktow
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-black text-emerald-600">
                      {formatMoneyPLN(student.total_volume ?? 0)}
                    </div>
                    <div className="text-[10px] font-bold uppercase text-slate-500">
                      Earnings
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-8 xl:grid-cols-2">
        <Card className="overflow-hidden rounded-[2.5rem] border border-white/5 bg-slate-950/40 shadow-xl shadow-black/20">
          <CardHeader className="flex flex-row items-center justify-between border-b border-white/5 bg-white/5 px-8 py-6 pb-6">
            <CardTitle className="flex items-center gap-3 text-lg font-black italic text-white">
              <FolderKanban className="h-5 w-5 text-indigo-500" /> Top kategorie
            </CardTitle>
            <Badge variant="outline" className="border-white/10 text-[10px] font-black uppercase text-slate-400">
              RPC ready
            </Badge>
          </CardHeader>
          <CardContent className="p-0">
            {categories.length === 0 ? (
              <div className="p-8 text-sm font-medium italic text-slate-500">
                Brak kategorii do wyswietlenia.
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {categories.map((category, idx) => (
                  <div
                    key={`${category.category}-${idx}`}
                    className="flex items-center justify-between gap-4 p-6 transition-colors hover:bg-white/5"
                  >
                    <div className="min-w-0">
                      <div className="font-bold text-white">
                        {category.category || "Bez kategorii"}
                      </div>
                      <div className="mt-1 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                        {category.count ?? 0} kontraktow
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-black text-indigo-600">
                        {formatMoneyPLN(category.volume ?? 0)}
                      </div>
                      <div className="text-[10px] font-bold uppercase text-slate-500">
                        Volume
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="overflow-hidden rounded-[2.5rem] border border-white/5 bg-slate-950/40 shadow-xl shadow-black/20">
          <CardHeader className="flex flex-row items-center justify-between border-b border-white/5 bg-white/5 px-8 py-6 pb-6">
            <CardTitle className="flex items-center gap-3 text-lg font-black italic text-white">
              <History className="h-5 w-5 text-emerald-500" /> Ostatnia aktywnosc
            </CardTitle>
            <Badge variant="outline" className="border-white/10 text-[10px] font-black uppercase text-slate-400">
              5 wpisow
            </Badge>
          </CardHeader>
          <CardContent className="p-0">
            {recent.length === 0 ? (
              <div className="p-8 text-sm font-medium italic text-slate-500">
                Brak ostatniej aktywnosci do wyswietlenia.
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {recent.map((entry, idx) => (
                  <div
                    key={`${entry.id}-${idx}`}
                    className="flex items-start justify-between gap-4 p-6 transition-colors hover:bg-white/5"
                  >
                    <div className="min-w-0">
                      <div className="mb-2 flex items-center gap-2">
                        <Badge
                          variant="outline"
                          className={`border text-[10px] font-black uppercase ${getRecentStatusBadge(entry.status)}`}
                        >
                          {entry.status || "event"}
                        </Badge>
                      </div>
                      <div className="font-bold text-white">
                        {entry.company_name || "system"}
                      </div>
                      <div className="mt-1 font-mono text-[10px] text-slate-500">
                        {entry.id ? entry.id.slice(0, 8) : "brak-id"}
                      </div>
                    </div>
                    <div className="text-right text-sm font-medium text-slate-400">
                      {entry.created_at
                        ? new Date(entry.created_at).toLocaleString("pl-PL")
                        : "Brak daty"}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
