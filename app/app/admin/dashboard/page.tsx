"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Briefcase, TrendingUp, Wallet, ArrowUpRight, Activity } from "lucide-react";

export default function AdminDashboardPage() {
    const supabase = createClient();
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const [errorObj, setErrorObj] = useState<any>(null);

    useEffect(() => {
        async function load() {
            const { data, error } = await supabase.rpc('get_admin_stats');
            if (error) {
                console.error("Admin Stats Error:", error);
                setErrorObj(error);
            }
            if (data) setStats(data);
            setLoading(false);
        }
        load();
    }, []);

    if (loading) return (
        <div className="flex items-center justify-center min-h-screen text-indigo-600 animate-pulse">
            Wczytywanie Centrum Dowodzenia...
        </div>
    );

    if (errorObj || !stats) return (
        <div className="p-10 text-center">
            <h2 className="text-xl font-bold text-red-600 mb-2">Błąd pobierania danych</h2>
            <p className="text-slate-600 mb-4">Sprawdź czy uruchomiłeś plik <code>20260124_admin_stats.sql</code> w bazie danych.</p>
            <div className="bg-slate-100 p-4 rounded text-left font-mono text-xs overflow-auto max-w-2xl mx-auto border border-slate-300">
                {JSON.stringify(errorObj, null, 2)}
            </div>
        </div>
    );

    const { users, contracts, financials, recent } = stats;

    return (
        <div className="min-h-screen bg-slate-50 p-6 md:p-12 space-y-12">

            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight">Super User Dashboard</h1>
                    <p className="text-slate-500 font-medium mt-2">Centrum analityczne platformy Student Impact.</p>
                </div>
                <div className="bg-white px-4 py-2 rounded-full border border-slate-200 shadow-sm flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-xs font-bold uppercase tracking-widest text-slate-600">System Online</span>
                </div>
            </div>

            {/* Main Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

                {/* Active Contracts */}
                <Card className="bg-white border-slate-100 shadow-xl shadow-indigo-100/50 rounded-3xl overflow-hidden relative">
                    <div className="absolute top-0 right-0 p-4 opacity-5">
                        <Briefcase className="w-24 h-24" />
                    </div>
                    <CardContent className="p-6">
                        <div className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Aktywne Zlecenia</div>
                        <div className="text-4xl font-black text-indigo-600 mb-1">{contracts.active}</div>
                        <div className="text-sm text-slate-500 font-medium">/{contracts.total} wszystkich zleceń</div>
                        <div className="mt-4 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${(contracts.active / (contracts.total || 1)) * 100}%` }} />
                        </div>
                    </CardContent>
                </Card>

                {/* Revenue Flow */}
                <Card className="bg-gradient-to-br from-indigo-600 to-purple-700 text-white border-0 shadow-xl shadow-indigo-500/30 rounded-3xl relative overflow-hidden">
                    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
                    <CardContent className="p-6 relative z-10">
                        <div className="text-sm font-bold text-indigo-200 uppercase tracking-wider mb-2 flex items-center gap-2">
                            <Wallet className="w-4 h-4" /> Wolumen (PLN)
                        </div>
                        <div className="text-3xl font-black text-white mb-1">
                            {financials.total_volume_pln?.toLocaleString()} PLN
                        </div>
                        <div className="text-sm text-indigo-100 font-medium flex items-center gap-1 mt-1">
                            <div className="bg-white/20 px-1.5 py-0.5 rounded text-[10px]">ESCROW</div>
                            {financials.escrow_active_pln?.toLocaleString()} PLN zablokowane
                        </div>
                    </CardContent>
                </Card>

                {/* Users: Students */}
                <Card className="bg-white border-slate-100 shadow-lg rounded-3xl">
                    <CardContent className="p-6 flex items-center gap-4">
                        <div className="h-14 w-14 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
                            <Users className="w-7 h-7" />
                        </div>
                        <div>
                            <div className="text-3xl font-black text-slate-900">{users.students}</div>
                            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">Studentów</div>
                        </div>
                    </CardContent>
                </Card>

                {/* Users: Companies */}
                <Card className="bg-white border-slate-100 shadow-lg rounded-3xl">
                    <CardContent className="p-6 flex items-center gap-4">
                        <div className="h-14 w-14 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                            <Briefcase className="w-7 h-7" />
                        </div>
                        <div>
                            <div className="text-3xl font-black text-slate-900">{users.companies}</div>
                            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">Firm</div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Charts & Details Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Activity Feed */}
                <div className="lg:col-span-2 space-y-6">
                    <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                        <Activity className="w-5 h-5 text-indigo-600" />
                        Ostatnia Aktywność (Realizacje)
                    </h3>

                    <div className="bg-white rounded-3xl border border-slate-100 shadow-xl overflow-hidden">
                        {recent.length === 0 ? (
                            <div className="p-8 text-center text-slate-400">Brak aktywności</div>
                        ) : (
                            <div className="divide-y divide-slate-100">
                                {recent.map((item: any, idx: number) => (
                                    <div key={idx} className="p-5 flex items-center justify-between hover:bg-slate-50 transition-colors">
                                        <div className="flex items-center gap-4">
                                            <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-500 text-xs">
                                                ID
                                            </div>
                                            <div>
                                                <div className="font-bold text-slate-800 text-sm">Kontrakt #{item.id.slice(0, 8)}</div>
                                                <div className="text-xs text-slate-500">
                                                    Utworzono: {new Date(item.created_at).toLocaleDateString('pl-PL')}
                                                </div>
                                            </div>
                                        </div>
                                        <Badge variant={item.status === 'completed' ? 'secondary' : 'default'} className={
                                            item.status === 'active' ? 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200' :
                                                item.status === 'completed' ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' : ''
                                        }>
                                            {item.status}
                                        </Badge>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* TOP CATEGORIES SECTION */}
                    {stats.categories && stats.categories.length > 0 && (
                        <div className="mt-8">
                            <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2 mb-4">
                                <TrendingUp className="w-5 h-5 text-purple-600" />
                                Najpopularniejsze Kategorie
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {stats.categories.map((cat: any, idx: number) => (
                                    <div key={idx} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between hover:shadow-md transition-all">
                                        <div>
                                            <div className="font-bold text-slate-700">{cat.category}</div>
                                            <div className="text-xs text-slate-500 font-medium">{cat.count} zleceń</div>
                                        </div>
                                        <div className="text-right">
                                            <div className="font-black text-indigo-600">{Number(cat.volume).toLocaleString()} PLN</div>
                                            <div className="text-[10px] uppercase font-bold text-slate-400">Obrotu</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Advanced Analytics / KPIs */}
                <div className="space-y-6">
                    <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-emerald-600" />
                        Efektywność Platformy
                    </h3>

                    <div className="space-y-4">
                        {/* KPI 1: Completion Time */}
                        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                            <div className="text-xs font-bold text-slate-400 uppercase mb-1">Śr. Czas Realizacji</div>
                            <div className="text-2xl font-black text-slate-800">
                                {stats.metrics?.avg_completion_days} <span className="text-sm font-medium text-slate-400">dni</span>
                            </div>
                            <div className="mt-2 text-xs text-slate-500">Czas od startu do akceptacji</div>
                        </div>

                        {/* KPI 2: Conversion */}
                        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                            <div className="text-xs font-bold text-slate-400 uppercase mb-1">Konwersja Aplikacji</div>
                            <div className="text-2xl font-black text-indigo-600">
                                {stats.applications?.total > 0 ? Math.round((contracts.total / stats.applications.total) * 100) : 0}%
                            </div>
                            <div className="mt-2 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${(contracts.total > 0 ? (contracts.total / stats.applications.total) * 100 : 0)}%` }} />
                            </div>
                        </div>

                        {/* KPI 3: Health (Cancellation) */}
                        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                            <div className="text-xs font-bold text-slate-400 uppercase mb-1">Zdrowie (Anulowane)</div>
                            <div className="text-2xl font-black text-red-500">
                                {contracts.total > 0 ? Math.round((contracts.cancelled / contracts.total) * 100) : 0}%
                            </div>
                            <div className="mt-2 text-xs text-slate-500">{contracts.cancelled} anulowanych zleceń</div>
                        </div>
                    </div>

                    {/* LEADERBOARDS */}
                    {stats.leaderboard && (
                        <div className="mt-8">
                            <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2 mb-4">
                                <Users className="w-5 h-5 text-amber-500" />
                                Liderzy
                            </h3>
                            <div className="space-y-4">
                                {/* Top Companies */}
                                <div className="bg-slate-800 text-slate-200 p-4 rounded-2xl">
                                    <div className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">Top Inwestorzy (Firmy)</div>
                                    <div className="space-y-3">
                                        {stats.leaderboard.top_companies.map((c: any, i: number) => (
                                            <div key={i} className="flex justify-between items-center text-sm">
                                                <div className="truncate max-w-[120px]">{c.email?.split('@')[0]}...</div>
                                                <div className="font-bold text-emerald-400">{Number(c.total_volume).toLocaleString()} PLN</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Top Students */}
                                <div className="bg-white border border-slate-200 p-4 rounded-2xl">
                                    <div className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">Top Wykonawcy (Studenci)</div>
                                    <div className="space-y-3">
                                        {stats.leaderboard.top_students.map((s: any, i: number) => (
                                            <div key={i} className="flex justify-between items-center text-sm">
                                                <div className="truncate max-w-[120px] text-slate-700">{s.email?.split('@')[0]}...</div>
                                                <div className="font-bold text-indigo-600">{Number(s.total_volume).toLocaleString()} PLN</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
