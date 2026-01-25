import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { ServicePackage } from "@/lib/types/services";
import ServiceActionsMenu from "./service-actions-menu";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ShieldCheck, Plus, LayoutDashboard, Sparkles } from "lucide-react";

export default async function MyServicesPage() {
    const supabase = await createClient();
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
        <div className="space-y-12 pb-20">
            {/* PREMIUM HEADER BANNER */}
            <div className="relative overflow-hidden rounded-[2.5rem] bg-slate-900 px-8 py-12 md:px-12 md:py-16 text-white shadow-2xl">
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none"></div>
                <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent" />
                <div className="absolute -top-24 -right-24 w-96 h-96 bg-indigo-500/10 rounded-full blur-[100px]" />
                <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-purple-500/10 rounded-full blur-[80px]" />

                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                    <div className="text-center md:text-left space-y-4">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-[10px] font-black uppercase tracking-widest">
                            <Sparkles className="h-3 w-3" /> Twoja Oferta Usługowa
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black tracking-tight leading-none bg-gradient-to-r from-white via-indigo-100 to-indigo-300 bg-clip-text text-transparent">
                            Moje Pakiety Usług
                        </h1>
                        <p className="text-indigo-100/60 text-lg font-medium max-w-xl">
                            Zarządzaj swoimi usługami, edytuj cenniki i monitoruj zainteresowanie Twoją ofertą.
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-4 justify-center md:justify-end">
                        <Button asChild variant="outline" className="rounded-2xl border-white/10 bg-white/5 hover:bg-white/10 text-white font-bold h-12 px-6">
                            <Link href="/app/services/dashboard" className="flex items-center gap-2">
                                <LayoutDashboard className="h-4 w-4 text-indigo-400" /> Panel Zleceń
                            </Link>
                        </Button>
                        <Button asChild className="rounded-2xl bg-white text-slate-900 hover:bg-slate-100 font-black h-12 px-6 shadow-xl shadow-white/5">
                            <Link href="/app/services/new" className="flex items-center gap-2">
                                <Plus className="h-4 w-4" /> Dodaj nową usługę
                            </Link>
                        </Button>
                    </div>
                </div>
            </div>

            {/* SERVICES GRID */}
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {services?.map((service: ServicePackage) => (
                    <div
                        key={service.id}
                        className="group relative flex flex-col rounded-[2rem] bg-white border border-slate-100 p-8 shadow-xl shadow-slate-200/50 hover:shadow-2xl hover:shadow-indigo-500/10 transition-all duration-500 hover:-translate-y-1"
                    >
                        <div className="flex justify-between items-start mb-6">
                            <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors duration-500">
                                <ShieldCheck className="h-6 w-6" />
                            </div>
                            <div className="flex items-center gap-3">
                                <Badge
                                    className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest border border-transparent transition-all ${service.status === 'active'
                                            ? 'bg-emerald-50 text-emerald-600 border-emerald-100 group-hover:bg-emerald-500 group-hover:text-white'
                                            : 'bg-slate-100 text-slate-500 border-slate-200'
                                        }`}
                                >
                                    {service.status === 'active' ? 'Aktywny' : 'Ukryty'}
                                </Badge>
                                <ServiceActionsMenu serviceId={service.id} currentStatus={service.status} />
                            </div>
                        </div>

                        <div className="space-y-3 mb-8 flex-1">
                            <h3 className="font-black text-xl text-slate-900 leading-tight group-hover:text-indigo-600 transition-colors line-clamp-1" title={service.title}>
                                {service.title}
                            </h3>
                            <p className="text-slate-500 font-medium text-sm line-clamp-2 leading-relaxed">
                                {service.description || "Brak opisu"}
                            </p>
                        </div>

                        <div className="flex items-center justify-between pt-6 border-t border-slate-50">
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Cena netto</p>
                                <p className="font-black text-2xl text-slate-900 tabular-nums">
                                    {service.price} <span className="text-sm font-bold text-slate-400 ml-1">PLN</span>
                                </p>
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Czas dostawy</p>
                                <p className="font-bold text-slate-600">
                                    {service.delivery_time_days} dni
                                </p>
                            </div>
                        </div>
                    </div>
                ))}

                {(!services || services.length === 0) && (
                    <div className="col-span-full py-24 text-center">
                        <div className="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center mx-auto mb-6 border border-slate-100">
                            <Sparkles className="h-10 w-10 text-slate-300" />
                        </div>
                        <h3 className="text-xl font-black text-slate-900 mb-2">Brak pakietów usług</h3>
                        <p className="text-slate-500 font-medium max-w-sm mx-auto mb-8">
                            Nie masz jeszcze żadnych opublikowanych ofert. Dodaj pierwszą usługę, aby zacząć zarabiać.
                        </p>
                        <Button asChild variant="outline" className="rounded-2xl border-indigo-200 text-indigo-600 hover:bg-indigo-50 font-bold h-12">
                            <Link href="/app/services/new">+ Dodaj nową usługę</Link>
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}
