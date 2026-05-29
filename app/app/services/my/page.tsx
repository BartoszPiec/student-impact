import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { ServicePackage } from "@/lib/types/services";
import ServiceActionsMenu from "./service-actions-menu";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageContainer } from "@/components/ui/page-container";
import { PremiumPageHeader } from "@/components/ui/premium-page-header";
import {
    CheckCircle2,
    Inbox,
    LayoutGrid,
    Plus,
    ShieldCheck,
    Sparkles,
    Timer,
} from "lucide-react";

export default async function MyServicesPage({
    searchParams,
}: {
    searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
    const supabase = await createClient();
    const resolvedSearchParams = (await searchParams) ?? {};
    const savedParam = Array.isArray(resolvedSearchParams.saved)
        ? resolvedSearchParams.saved[0]
        : resolvedSearchParams.saved;
    const savedState = savedParam === "created" || savedParam === "updated" ? savedParam : null;
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return <div className="p-8 text-center text-slate-500 font-medium">Musisz być zalogowany.</div>;
    }

    const { data: services } = await supabase
        .from("service_packages")
        .select("*")
        .eq("student_id", user.id)
        .order("created_at", { ascending: false });

    return (
        <main className="pb-20">
            <PremiumPageHeader
                badge="Panel Studenta"
                title="Moje Pakiety Usług"
                description="Zarządzaj swoimi usługami, edytuj cenniki i monitoruj zainteresowanie Twoją ofertą."
                icon={<LayoutGrid className="h-10 w-10 text-indigo-300 drop-shadow-[0_0_8px_rgba(165,180,252,0.5)]" />}
                actions={
                    <div className="flex items-center gap-3">
                        <Button asChild variant="outline" className="h-12 rounded-2xl border-white/20 bg-white/10 px-6 font-bold text-white hover:bg-white/20 hover:text-white">
                            <Link href="/app/services/dashboard">
                                <Inbox className="mr-2 h-4 w-4" />
                                Panel Zleceń
                            </Link>
                        </Button>
                        <Button asChild className="h-12 rounded-2xl bg-white px-6 font-black text-slate-900 shadow-xl hover:bg-slate-100">
                            <Link href="/app/services/new">
                                <Plus className="mr-2 h-4 w-4" />
                                Dodaj usługę
                            </Link>
                        </Button>
                    </div>
                }
            />

            <PageContainer className="space-y-8">
                {savedState && (
                    <div className="rounded-[2rem] border border-emerald-200 bg-emerald-50 px-6 py-5 text-emerald-950 shadow-lg shadow-emerald-500/10">
                        <div className="flex items-start gap-4">
                            <div className="rounded-2xl bg-white p-2 text-emerald-600 shadow-sm">
                                <CheckCircle2 className="h-5 w-5" />
                            </div>
                            <div className="space-y-1">
                                <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-600">
                                    Zapisano pomyślnie
                                </p>
                                <h2 className="text-lg font-black">
                                    {savedState === "created"
                                        ? "Twoja usługa została utworzona."
                                        : "Zmiany w usłudze zostały zapisane."}
                                </h2>
                                <p className="text-sm font-medium text-emerald-800/80">
                                    Pakiet jest już widoczny na liście i możesz od razu wrócić do dalszej edycji lub dodać kolejną usługę.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* SERVICES GRID */}
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {services?.map((service: ServicePackage) => (
                        <div
                            key={service.id}
                            className="group relative flex flex-col rounded-[2rem] border border-slate-100 bg-white p-8 shadow-xl shadow-slate-200/50 transition-all duration-500 hover:-translate-y-1 hover:shadow-2xl hover:shadow-indigo-500/10"
                        >
                            <div className="mb-6 flex items-start justify-between">
                                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 transition-colors duration-500 group-hover:bg-indigo-600 group-hover:text-white">
                                    <ShieldCheck className="h-6 w-6" />
                                </div>
                                <div className="flex items-center gap-3">
                                    <Badge
                                        className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-widest transition-all ${
                                            service.status === "active"
                                                ? "border-emerald-100 bg-emerald-50 text-emerald-600 group-hover:border-emerald-400 group-hover:bg-emerald-500 group-hover:text-white"
                                                : "border-slate-200 bg-slate-100 text-slate-500"
                                        }`}
                                    >
                                        {service.status === "active" ? "Aktywny" : "Ukryty"}
                                    </Badge>
                                    <ServiceActionsMenu serviceId={service.id} currentStatus={service.status} />
                                </div>
                            </div>

                            <div className="mb-8 flex-1 space-y-3">
                                <h3
                                    className="line-clamp-1 text-xl font-black leading-tight text-slate-900 transition-colors group-hover:text-indigo-600"
                                    title={service.title}
                                >
                                    {service.title}
                                </h3>
                                <p className="line-clamp-2 text-sm font-medium leading-relaxed text-slate-500">
                                    {service.description || "Brak opisu"}
                                </p>
                            </div>

                            <div className="flex items-center justify-between border-t border-slate-50 pt-6">
                                <div>
                                    <p className="mb-1 text-[10px] font-black uppercase tracking-widest text-slate-400">
                                        Cena netto
                                    </p>
                                    <p className="tabular-nums text-2xl font-black text-slate-900">
                                        {service.price}{" "}
                                        <span className="ml-1 text-sm font-bold text-slate-400">PLN</span>
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="mb-1 text-[10px] font-black uppercase tracking-widest text-slate-400">
                                        Realizacja
                                    </p>
                                    <div className="flex items-center gap-1 font-bold text-slate-600 justify-end">
                                        <Timer className="h-3.5 w-3.5 text-slate-400" />
                                        {service.delivery_time_days} dni
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}

                    {(!services || services.length === 0) && (
                        <div className="col-span-full py-24 text-center">
                            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-[2rem] border border-slate-100 bg-slate-50">
                                <Sparkles className="h-10 w-10 text-slate-300" />
                            </div>
                            <h3 className="mb-2 text-xl font-black text-slate-900">Brak pakietów usług</h3>
                            <p className="mx-auto mb-8 max-w-sm font-medium text-slate-500">
                                Nie masz jeszcze żadnych opublikowanych ofert. Dodaj pierwszą usługę, aby zacząć zarabiać.
                            </p>
                            <Button asChild className="rounded-2xl bg-indigo-600 px-6 font-bold text-white hover:bg-indigo-700 h-12">
                                <Link href="/app/services/new">
                                    <Plus className="mr-2 h-4 w-4" />
                                    Dodaj nową usługę
                                </Link>
                            </Button>
                        </div>
                    )}
                </div>
            </PageContainer>
        </main>
    );
}
