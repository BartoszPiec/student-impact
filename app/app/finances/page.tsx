import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import FinanceChart from "./FinanceChart";
import {
    Wallet, TrendingUp, ArrowUpRight,
    CheckCircle2, Clock, Medal, Sparkles
} from "lucide-react";
import { PremiumPageHeader } from "@/components/ui/premium-page-header";
import { PageContainer } from "@/components/ui/page-container";
import { parseDetailedReviewComment } from "@/lib/reviews";
import StudentDocumentsPanel from "./student-documents-panel";

export const dynamic = "force-dynamic";

type TitleRelation = { tytul?: string | null; title?: string | null };
type ApplicationTitleRow = { contract_id: string | null; offers: TitleRelation | TitleRelation[] | null };
type OrderTitleRow = { contract_id: string | null; packages: TitleRelation | TitleRelation[] | null };
type MilestoneRow = { id: string; title: string; amount: number | string; status: string; due_at: string | null };
type ContractRow = { id: string; status: string; created_at: string; milestones: MilestoneRow[] | null };
type LegacyApplicationRow = {
    id: string;
    created_at: string;
    offers: { tytul: string | null; price_min: number | null; budget: number | null } | null;
};
type ReviewRow = { id: string; rating: number; comment: string | null };
type HistoryItem = { id: string; title: string; amount: number; date: string; status: "paid" | "pending" };

function firstRelation<T>(relation: T | T[] | null): T | null {
    return Array.isArray(relation) ? relation[0] ?? null : relation;
}

function formatMoneyPLN(value: number | string | null | undefined) {
    const numeric = Number(value ?? 0);
    const safeValue = Number.isFinite(numeric) ? numeric : 0;
    const rounded = Math.round((safeValue + Number.EPSILON) * 100) / 100;

    return `${new Intl.NumberFormat("pl-PL", {
        maximumFractionDigits: rounded % 1 === 0 ? 0 : 2,
        minimumFractionDigits: 0,
    }).format(rounded)} PLN`;
}

export default async function FinancesPage() {
    const supabase = await createClient();
    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;
    if (!user) redirect("/auth");

    // 1. Fetch Contract IDs via Applications and Service Orders
    const { data: myApps } = await supabase
        .from("applications")
        .select("contract_id, offers(tytul)")
        .eq("student_id", user.id)
        .not("contract_id", "is", null);

    const { data: myOrders } = await supabase
        .from("service_orders")
        .select("contract_id, packages(title)")
        .eq("student_id", user.id)
        .not("contract_id", "is", null);

    // Map contractId -> Title for display
    const titlesByContractId = new Map<string, string>();
    ((myApps || []) as unknown as ApplicationTitleRow[]).forEach((application) => {
        const offer = firstRelation(application.offers);
        if (application.contract_id) titlesByContractId.set(application.contract_id, offer?.tytul || "Zlecenie");
    });
    ((myOrders || []) as unknown as OrderTitleRow[]).forEach((order) => {
        const packageData = firstRelation(order.packages);
        if (order.contract_id) titlesByContractId.set(order.contract_id, packageData?.title || "Usługa");
    });

    // 2. Fetch Contracts & Milestones directly by student_id
    // This allows picking up contracts that might have missing application/service_order links
    const { data: contractsData } = await supabase
        .from("contracts")
        .select("id, status, created_at, milestones(id, title, amount, status, due_at)")
        .eq("student_id", user.id)
        .order("created_at", { ascending: false });

    // contractIds are still useful for other lookups if needed, but we use the direct data
    const contracts = (contractsData || []) as unknown as ContractRow[];

    // 3. Fetch High Ratings (Successes)
    const { data: reviews } = await supabase
        .from("reviews")
        .select("id, rating, comment")
        .eq("reviewee_id", user.id)
        .gte("rating", 4)
        .order("created_at", { ascending: false })
        .limit(3);

    // 4. Fetch Legacy/Test Applications (No Contract but Accepted)
    // This allows showing earnings for older test data or flows without full contract cycle
    const { data: legacyApps } = await supabase
        .from("applications")
        .select("id, created_at, offers(tytul, price_min, budget)")
        .eq("student_id", user.id)
        .eq("status", "accepted")
        .is("contract_id", null);

    // --- DATA PROCESSING ---

    let totalEarnings = 0;
    let pendingEarnings = 0;
    let completedProjects = 0;

    // Monthly Earnings Map: "YYYY-MM" -> { paid: number, pending: number }
    const monthlyEarnings = new Map<string, { paid: number, pending: number }>();

    // Helper to add earnings
    const addEarnings = (dateRaw: string, amount: number, type: 'paid' | 'pending') => {
        const date = new Date(dateRaw);
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        const current = monthlyEarnings.get(key) || { paid: 0, pending: 0 };

        if (type === 'paid') current.paid += amount;
        else current.pending += amount;

        monthlyEarnings.set(key, current);
    };

    // History List
    const historyItems: HistoryItem[] = [];

    // Process Legacy Apps first
    ((legacyApps ?? []) as unknown as LegacyApplicationRow[]).forEach((app) => {
        const amount = Number(app.offers?.budget || app.offers?.price_min || 0);
        if (amount > 0) {
            totalEarnings += amount;
            completedProjects++;

            const dateRaw = app.created_at;
            addEarnings(dateRaw, amount, 'paid');

            historyItems.push({
                id: app.id,
                title: `${app.offers?.tytul || "Zlecenie"} (Legacy)`,
                amount: amount,
                date: dateRaw,
                status: 'paid'
            });
        }
    });

    contracts.forEach((c) => {
        const title = titlesByContractId.get(c.id) || "Realizacja";
        const isCompletedContract = c.status === 'completed';

        if (isCompletedContract) completedProjects++;

        (c.milestones ?? []).forEach((m) => {
            const amount = Number(m.amount || 0);
            const isPaid = m.status === 'released' || m.status === 'completed' || m.status === 'paid' || m.status === 'accepted';
            const isPending = m.status === 'funded' || m.status === 'delivered';

            if (isPaid) {
                totalEarnings += amount;
                const dateRaw = m.due_at || c.created_at;
                addEarnings(dateRaw, amount, 'paid');

                historyItems.push({
                    id: m.id,
                    title: `${title} - ${m.title}`,
                    amount,
                    date: dateRaw,
                    status: 'paid'
                });
            } else if (isPending) {
                pendingEarnings += amount;
                const dateRaw = m.due_at || c.created_at;
                addEarnings(dateRaw, amount, 'pending');

                historyItems.push({
                    id: m.id,
                    title: `${title} - ${m.title}`,
                    amount,
                    date: dateRaw,
                    status: 'pending'
                });
            }
        });
    });

    // Prepare Chart Data (Last 6 months)
    const chartData = [];
    const today = new Date();
    for (let i = 5; i >= 0; i--) {
        const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        const label = d.toLocaleString('pl-PL', { month: 'short' });
        const data = monthlyEarnings.get(key) || { paid: 0, pending: 0 };
        chartData.push({ key, label, paid: data.paid, pending: data.pending, total: data.paid + data.pending });
    }

    return (
        <main className="pb-20">
            <PremiumPageHeader
                badge="Twoje Finanse"
                title="Podsumowanie Zarobków"
                description="Śledź przychody, analizuj sukcesy i planuj kolejne realizacje w jednym, przejrzystym widoku."
                icon={<Wallet className="h-10 w-10 text-indigo-300 drop-shadow-[0_0_8px_rgba(165,180,252,0.5)]" />}
            />

            <PageContainer className="space-y-12">


            <div className="grid gap-8 lg:grid-cols-3">
                {/* LEFT COL: STATS & CHART */}
                <div className="lg:col-span-2 space-y-8">
                    {/* KEY METRICS */}
                    <div className="grid gap-4 sm:grid-cols-3 sm:gap-6">
                        <Card className="border-none shadow-xl shadow-emerald-500/5 bg-white rounded-[1.75rem] sm:rounded-[2rem] overflow-hidden group hover:-translate-y-1 transition-transform duration-300">
                            <CardContent className="relative p-5 sm:p-6">
                                <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50 rounded-bl-[2rem] -mr-4 -mt-4 transition-transform group-hover:scale-110" />
                                <div className="relative z-10">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="p-3 bg-emerald-100 text-emerald-600 rounded-2xl">
                                            <TrendingUp className="w-6 h-6" />
                                        </div>
                                    </div>
                                    <div className="max-w-full break-words text-[clamp(1.75rem,8vw,2.25rem)] font-black leading-none tracking-tight text-slate-900">
                                        {formatMoneyPLN(totalEarnings)}
                                    </div>
                                    <div className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mt-2">Wypłacone</div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-none shadow-xl shadow-amber-500/5 bg-white rounded-[1.75rem] sm:rounded-[2rem] overflow-hidden group hover:-translate-y-1 transition-transform duration-300">
                            <CardContent className="relative p-5 sm:p-6">
                                <div className="absolute top-0 right-0 w-24 h-24 bg-amber-50 rounded-bl-[2rem] -mr-4 -mt-4 transition-transform group-hover:scale-110" />
                                <div className="relative z-10">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="p-3 bg-amber-100 text-amber-600 rounded-2xl">
                                            <Clock className="w-6 h-6" />
                                        </div>
                                    </div>
                                    <div className="max-w-full break-words text-[clamp(1.75rem,8vw,2.25rem)] font-black leading-none tracking-tight text-slate-900">
                                        {formatMoneyPLN(pendingEarnings)}
                                    </div>
                                    <div className="text-[10px] font-black text-amber-600 uppercase tracking-widest mt-2">W toku</div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-none shadow-xl shadow-indigo-500/5 bg-white rounded-[1.75rem] sm:rounded-[2rem] overflow-hidden group hover:-translate-y-1 transition-transform duration-300">
                            <CardContent className="relative p-5 sm:p-6">
                                <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50 rounded-bl-[2rem] -mr-4 -mt-4 transition-transform group-hover:scale-110" />
                                <div className="relative z-10">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="p-3 bg-indigo-100 text-indigo-600 rounded-2xl">
                                            <CheckCircle2 className="w-6 h-6" />
                                        </div>
                                    </div>
                                    <div className="text-3xl font-black text-slate-900 tracking-tight">{completedProjects}</div>
                                    <div className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mt-2">Ukończone</div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* CHART SECTION (Client Component) */}
                    <div className="overflow-hidden rounded-[1.75rem] border border-slate-100 bg-white p-4 shadow-xl shadow-slate-200/50 sm:rounded-[2.5rem] sm:p-8">
                        <FinanceChart data={chartData} />
                    </div>

                    {/* HISTORY LIST */}
                    <div className="space-y-6">
                        <div className="flex items-center justify-between px-2">
                            <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                                <Clock className="w-5 h-5 text-indigo-500" />
                                Ostatnie Transakcje
                            </h2>
                        </div>

                        {historyItems.length > 0 ? (
                            <div className="space-y-3">
                                {historyItems.slice(0, 5).map((item) => (
                                    <div key={item.id} className="group flex flex-col gap-4 rounded-3xl border border-slate-100 bg-white p-5 shadow-sm transition-all hover:border-indigo-100 hover:shadow-md sm:flex-row sm:items-center sm:justify-between">
                                        <div className="flex min-w-0 items-center gap-4 sm:gap-5">
                                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${item.status === 'paid'
                                                ? 'bg-emerald-100 text-emerald-600 group-hover:bg-emerald-500 group-hover:text-white'
                                                : 'bg-amber-100 text-amber-600 group-hover:bg-amber-500 group-hover:text-white'
                                                }`}>
                                                {item.status === 'paid' ? <ArrowUpRight className="w-6 h-6" /> : <Clock className="w-6 h-6" />}
                                            </div>
                                            <div className="min-w-0">
                                                <div className="break-words font-bold text-slate-900 transition-colors group-hover:text-indigo-600">{item.title}</div>
                                                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-1">
                                                    {new Date(item.date).toLocaleDateString('pl-PL')}
                                                </div>
                                            </div>
                                        </div>
                                        <div className={`shrink-0 text-lg font-black tabular-nums sm:text-right ${item.status === 'paid' ? 'text-emerald-600' : 'text-slate-300'
                                            }`}>
                                            {item.status === 'paid' ? '+' : ''}{formatMoneyPLN(item.amount)}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-20 bg-white rounded-[2.5rem] border border-dashed border-slate-200">
                                <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                    <Sparkles className="h-8 w-8 text-slate-300" />
                                </div>
                                <div className="font-bold text-slate-900">Brak historii transakcji</div>
                                <div className="text-sm text-slate-500 mt-1">Zrealizuj pierwsze zlecenie, aby zobaczyć historię.</div>
                            </div>
                        )}
                    </div>
                </div>

                {/* RIGHT COL: SUCCESSES */}
                <div className="space-y-6">
                    <Card className="rounded-[2.5rem] bg-gradient-to-br from-indigo-600 to-purple-700 text-white border-none shadow-2xl overflow-hidden relative group">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-32 -mt-32 transition-transform duration-700 group-hover:scale-110"></div>
                        <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-500/30 rounded-full blur-2xl -ml-16 -mb-16"></div>

                        <CardHeader className="relative z-10 pb-2">
                            <CardTitle className="flex items-center gap-3 text-2xl font-black">
                                <Medal className="w-8 h-8 text-yellow-300 drop-shadow-lg" />
                                Sukcesy
                            </CardTitle>
                            <CardDescription className="text-indigo-100 font-medium">
                                Wyróżnienia od Twoich klientów
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="relative z-10 space-y-4 pt-4">
                            {reviews && reviews.length > 0 ? (
                                <div className="space-y-3">
                                    {(reviews as ReviewRow[]).map((r) => (
                                        <div key={r.id} className="bg-white/10 backdrop-blur-md px-4 py-3 rounded-2xl border border-white/10 hover:bg-white/20 transition-colors">
                                            <div className="flex text-yellow-300 mb-1 text-xs gap-0.5 shadow-sm">
                                                {"★".repeat(r.rating)}
                                            </div>
                                            <p className="text-sm font-medium italic text-indigo-50 line-clamp-2 leading-relaxed">&ldquo;{parseDetailedReviewComment(r.comment).displayComment || "Bez dodatkowego komentarza."}&rdquo;</p>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8 text-indigo-100/60 font-medium text-sm bg-white/5 rounded-2xl border border-white/5">
                                    Brak wyróżnień.<br />Wykonaj zlecenia na 5 gwiazdek!
                                </div>
                            )}

                            <div className="pt-6 border-t border-white/10 mt-2">
                                <div className="text-[10px] font-black uppercase tracking-widest text-indigo-300 mb-3">Twoje Supermoce</div>
                                <div className="flex flex-wrap gap-2">
                                    <Badge className="bg-white/20 hover:bg-white/30 text-white border-0 px-3 py-1.5 rounded-xl transition-all">Terminowość</Badge>
                                    <Badge className="bg-white/20 hover:bg-white/30 text-white border-0 px-3 py-1.5 rounded-xl transition-all">Kreatywność</Badge>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="rounded-[2.5rem] border-white shadow-xl shadow-slate-200/50 bg-white overflow-hidden">
                        <CardHeader className="bg-slate-50/50">
                            <CardTitle className="text-lg font-black text-slate-800 flex items-center gap-2">
                                <Sparkles className="w-5 h-5 text-amber-500" /> Wskazówki
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 pt-6">
                            <div className="flex gap-4 items-start group">
                                <div className="w-2 h-2 rounded-full bg-indigo-500 mt-2 flex-shrink-0 group-hover:scale-150 transition-transform" />
                                <p className="text-sm font-medium text-slate-600 leading-relaxed">
                                    Realizuj zlecenia <span className="text-indigo-600 font-bold">przed terminem</span>, aby zwiększyć szansę na napiwki i dobre opinie.
                                </p>
                            </div>
                            <div className="flex gap-4 items-start group">
                                <div className="w-2 h-2 rounded-full bg-indigo-500 mt-2 flex-shrink-0 group-hover:scale-150 transition-transform" />
                                <p className="text-sm font-medium text-slate-600 leading-relaxed">
                                    Uzupełnij profil o <span className="text-indigo-600 font-bold">portfolio</span> - klienci chętniej wybierają zweryfikowanych studentów.
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            <StudentDocumentsPanel />
            </PageContainer>
        </main>
    );
}
