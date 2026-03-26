"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Users, Wallet, Trophy, Target } from "lucide-react";
import { FunnelChart } from "./FunnelChart";
import { DashboardHeader } from "./DashboardHeader";

type AnalyticsSeriesPoint = {
  month: string;
  amount: number;
};

type LeaderboardRow = {
  email?: string | null;
  total_volume?: number | null;
  contracts_count?: number | null;
};

type AnalyticsStats = {
  financials?: {
    total_volume_pln?: number;
    total_revenue_pln?: number;
    escrow_active_pln?: number;
    student_payable_pln?: number;
    tax_payable_pln?: number;
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
};

interface AnalyticsDashboardProps {
  stats: AnalyticsStats;
  onRefresh: () => void;
  loading: boolean;
}

export function AnalyticsDashboard({ stats, onRefresh, loading }: AnalyticsDashboardProps) {
  const [activeSeries, setActiveSeries] = useState<'revenue' | 'volume'>('revenue');
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
  const topCompanies = Array.isArray(stats?.leaderboard?.top_companies) ? stats.leaderboard.top_companies : [];
  const topStudents = Array.isArray(stats?.leaderboard?.top_students) ? stats.leaderboard.top_students : [];
  const funnelData = {
    offers: stats?.funnel?.offers ?? 0,
    applications: stats?.funnel?.applications ?? 0,
    accepted: stats?.funnel?.accepted ?? 0,
    contracts: stats?.funnel?.contracts ?? 0,
  };

  // Multi-series chart data
  const chartData = activeSeries === 'revenue' ? revenueHistory : volumeHistory;
  const maxVal = Math.max(...chartData.map((point) => point.amount), 100);
  const yAxisMax = Math.ceil(maxVal / 1000) * 1000;
  const revenueValue = financials.total_revenue_pln ?? 0;

  return (
    <div className="space-y-12">
      <DashboardHeader onRefresh={onRefresh} loading={loading} />

      {/* Primary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-white border-none shadow-xl shadow-slate-200/50 rounded-[2rem] overflow-hidden group">
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-emerald-100 text-emerald-600 rounded-2xl group-hover:scale-110 transition-transform">
                <Wallet className="w-6 h-6" />
              </div>
              <div className="px-2 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-black rounded-lg">LIVE</div>
            </div>
            <div className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-1">Całkowity Obrót</div>
            <div className="text-3xl font-black text-slate-900 tracking-tight">
              {financials.total_volume_pln?.toLocaleString()} <span className="text-sm text-slate-400">PLN</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-none shadow-xl shadow-slate-200/50 rounded-[2rem] overflow-hidden group">
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-indigo-100 text-indigo-600 rounded-2xl group-hover:scale-110 transition-transform">
                <TrendingUp className="w-6 h-6" />
              </div>
              <div className="px-2 py-1 bg-indigo-50 text-indigo-600 text-[10px] font-black rounded-lg">LEDGER</div>
            </div>
            <div className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-1">Przychód (Prowizja)</div>
            <div className="text-3xl font-black text-slate-900 tracking-tight">
              {revenueValue?.toLocaleString()} <span className="text-sm text-slate-400">PLN</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-none shadow-xl shadow-slate-200/50 rounded-[2rem] overflow-hidden group">
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-amber-100 text-amber-600 rounded-2xl group-hover:scale-110 transition-transform">
                <Users className="w-6 h-6" />
              </div>
            </div>
            <div className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-1">Użytkownicy</div>
            <div className="text-3xl font-black text-slate-900 tracking-tight">
              {users.students + users.companies}
            </div>
            <div className="flex gap-2 mt-2">
                <span className="text-[10px] font-bold text-slate-400 italic">{users.students}S</span>
                <span className="text-[10px] font-bold text-slate-400 italic">{users.companies}F</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-none shadow-xl shadow-slate-200/50 rounded-[2rem] overflow-hidden group">
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-purple-100 text-purple-600 rounded-2xl group-hover:scale-110 transition-transform">
                <Target className="w-6 h-6" />
              </div>
            </div>
            <div className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-1">Skuteczność</div>
            <div className="text-3xl font-black text-slate-900 tracking-tight">
              {Math.round((contracts.completed / (contracts.total || 1)) * 100)}%
            </div>
            <div className="text-[10px] font-bold text-purple-400 uppercase mt-2">Conversion to success</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-white border-none shadow-xl shadow-slate-200/40 rounded-[2rem] overflow-hidden">
          <CardContent className="p-6">
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Escrow liability</div>
            <div className="text-2xl font-black text-slate-900">
              {financials.escrow_active_pln?.toLocaleString()} <span className="text-sm text-slate-400">PLN</span>
            </div>
            <p className="mt-2 text-sm font-medium text-slate-500">
              Środki firm, które są już zasilone i czekają na release do kolejnych etapów.
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white border-none shadow-xl shadow-slate-200/40 rounded-[2rem] overflow-hidden">
          <CardContent className="p-6">
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Student payable</div>
            <div className="text-2xl font-black text-slate-900">
              {financials.student_payable_pln?.toLocaleString()} <span className="text-sm text-slate-400">PLN</span>
            </div>
            <p className="mt-2 text-sm font-medium text-slate-500">
              Kwota już należna studentom, ale jeszcze niewypłacona z banku.
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white border-none shadow-xl shadow-slate-200/40 rounded-[2rem] overflow-hidden">
          <CardContent className="p-6">
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Tax payable</div>
            <div className="text-2xl font-black text-slate-900">
              {financials.tax_payable_pln?.toLocaleString()} <span className="text-sm text-slate-400">PLN</span>
            </div>
            <p className="mt-2 text-sm font-medium text-slate-500">
              Zobowiązania PIT wynikające z zaakceptowanych milestone&apos;ów.
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Chart Section */}
        <Card className="lg:col-span-2 border-none shadow-xl shadow-slate-200/50 bg-white rounded-[2.5rem] overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between pb-8">
            <div>
              <CardTitle className="text-xl font-black text-slate-900 tracking-tight italic">
                Dynamika Platformy
              </CardTitle>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Growth & Revenue</p>
            </div>
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
              <button 
                onClick={() => setActiveSeries('revenue')}
                className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeSeries === 'revenue' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
              >
                Revenue
              </button>
              <button 
                onClick={() => setActiveSeries('volume')}
                className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeSeries === 'volume' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
              >
                Volume
              </button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="relative h-[300px] w-full px-4">
              {/* Y-Axis Grid */}
              <div className="absolute inset-x-4 inset-y-0 flex flex-col justify-between text-[10px] font-bold text-slate-200 select-none pointer-events-none">
                {[100, 75, 50, 25, 0].map((pct) => (
                  <div key={pct} className="w-full border-t border-slate-100 relative">
                    <span className="absolute -top-3 left-0 bg-white pr-2">
                      {Math.round(yAxisMax * (pct / 100))}
                    </span>
                  </div>
                ))}
              </div>

              {/* Bars */}
              <div className="absolute inset-x-12 inset-y-0 flex items-end justify-around gap-4">
                {chartData.length > 0 ? chartData.map((d) => {
                  const height = (d.amount / yAxisMax) * 100;
                  return (
                    <div key={d.month} className="relative w-full h-full flex flex-col justify-end group cursor-pointer">
                      <div 
                        className={`w-full ${activeSeries === 'revenue' ? 'bg-indigo-500 shadow-indigo-200' : 'bg-slate-800 shadow-slate-200'} rounded-t-lg transition-all duration-500 hover:scale-x-110 shadow-lg`}
                        style={{ height: `${height}%` }}
                      >
                         {/* Tooltip */}
                         <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white text-[10px] font-black px-3 py-1.5 rounded-lg whitespace-nowrap z-10">
                            {d.amount.toLocaleString()} PLN
                         </div>
                      </div>
                      <div className="text-[9px] font-bold text-slate-300 uppercase tracking-tighter mt-4 text-center">
                        {d.month.split('-')[1]}
                      </div>
                    </div>
                  );
                }) : (
                    <div className="flex-1 flex items-center justify-center text-slate-300 italic text-sm mb-12">
                        Brak historycznych danych. Rozpocznij pierwsze transakcje!
                    </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Funnel Chart */}
        <FunnelChart data={funnelData} />
      </div>

      {/* Hall of Fame */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="border-none shadow-xl shadow-slate-200/50 bg-white rounded-[2.5rem] overflow-hidden">
             <CardHeader className="flex flex-row items-center justify-between border-b border-slate-50 pb-6 px-8 py-6 bg-slate-50/50">
                <CardTitle className="text-lg font-black text-slate-800 flex items-center gap-3 italic">
                    <Trophy className="w-5 h-5 text-amber-500" /> TOP Inwestorzy (Firmy)
                </CardTitle>
                <div className="h-2 w-2 rounded-full bg-emerald-500" />
            </CardHeader>
            <CardContent className="p-0">
                <div className="divide-y divide-slate-50">
                    {topCompanies.map((c, idx: number) => (
                        <div key={idx} className="p-6 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                            <div className="flex items-center gap-4">
                                <span className="text-xl font-black text-slate-200 w-6">#{idx+1}</span>
                                <div>
                                    <div className="font-bold text-slate-900">{c.email?.split('@')[0]}</div>
                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{c.contracts_count} kontraktów</div>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-lg font-black text-indigo-600">{Number(c.total_volume).toLocaleString()} PLN</div>
                                <div className="text-[10px] font-bold text-slate-400 uppercase">Volume</div>
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>

        <Card className="border-none shadow-xl shadow-slate-200/50 bg-white rounded-[2.5rem] overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between border-b border-slate-50 pb-6 px-8 py-6 bg-slate-50/50">
                <CardTitle className="text-lg font-black text-slate-800 flex items-center gap-3 italic">
                    <Trophy className="w-5 h-5 text-indigo-500" /> TOP Wykonawcy (Studenci)
                </CardTitle>
                <Badge variant="outline" className="text-indigo-600 border-indigo-100 font-black text-[10px]">VERIFIED</Badge>
            </CardHeader>
            <CardContent className="p-0">
                <div className="divide-y divide-slate-50">
                    {topStudents.map((s, idx: number) => (
                         <div key={idx} className="p-6 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                            <div className="flex items-center gap-4">
                                <span className="text-xl font-black text-slate-200 w-6">#{idx+1}</span>
                                <div>
                                    <div className="font-bold text-slate-900">{s.email?.split('@')[0]}</div>
                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{s.contracts_count} kontraktów</div>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-lg font-black text-emerald-600">{Number(s.total_volume).toLocaleString()} PLN</div>
                                <div className="text-[10px] font-bold text-slate-400 uppercase">Earnings</div>
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
