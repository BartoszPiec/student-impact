
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Zap, Plus, ArrowRight, DollarSign, Clock, LayoutTemplate } from "lucide-react";
import { redirect } from "next/navigation";
import { DeleteServiceButton } from "./delete-service-button";
import { PremiumPageHeader } from "@/components/ui/premium-page-header";

export const dynamic = "force-dynamic";

export default async function AdminSystemServicesPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) redirect("/auth");

    // Fetch System Services
    const { data: services, error } = await supabase
        .from("service_packages")
        .select("*")
        .eq("type", "platform_service")
        .order("created_at", { ascending: false });

    if (error) {
        return <div className="p-8 text-red-500">Błąd pobierania usług: {error.message}</div>;
    }

    return (
        <main className="container max-w-7xl mx-auto py-10 space-y-8">
            <PremiumPageHeader
                badge="Admin Panel"
                title="Usługi Systemowe"
                description="Zarządzaj ofertami Gwarantowanymi i mikrozleceniami w systemie."
                icon={<Zap className="w-10 h-10 text-amber-400 drop-shadow-lg" />}
                actions={
                    <Button asChild size="lg" className="bg-white text-indigo-900 hover:bg-amber-50 shadow-[0_0_20px_rgba(255,255,255,0.1)] transition-all hover:scale-105 active:scale-95 px-6 h-12 rounded-2xl font-bold">
                        <Link href="/app/admin/system-services/new">
                            <Plus className="w-5 h-5 mr-2" /> Dodaj Usługę
                        </Link>
                    </Button>
                }
            />

            {/* List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {(services || []).map((service) => (
                    <ServiceCard key={service.id} service={service} />
                ))}

                {/* Empty State */}
                {(!services || services.length === 0) && (
                    <div className="col-span-full py-20 text-center border-2 border-dashed border-slate-200 rounded-[2.5rem] bg-slate-50/50">
                        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100 shadow-sm">
                            <Zap className="w-8 h-8 text-slate-300" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-700">Brak usług systemowych</h3>
                        <p className="text-slate-400">Dodaj pierwszą usługę, aby pojawiła się na Giełdzie.</p>
                    </div>
                )}
            </div>
        </main>
    );
}

function ServiceCard({ service }: { service: any }) {
    return (
        <Card className="rounded-[2rem] border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group overflow-hidden">
            <CardHeader className="bg-gradient-to-br from-slate-50 to-white pb-4 border-b border-slate-100">
                <div className="flex justify-between items-start gap-4">
                    <Badge className="bg-amber-100 text-amber-700 border-amber-200 shadow-none font-bold uppercase tracking-wider text-[10px]">
                        Systemowe
                    </Badge>
                    <div className={`w-3 h-3 rounded-full ${service.status === 'active' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-slate-300'}`} title={service.status} />
                </div>
                <CardTitle className="text-xl font-bold text-slate-900 leading-tight pt-2">
                    {service.title}
                </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
                <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-2 text-slate-500 font-medium">
                            <DollarSign className="w-4 h-4 text-emerald-500" /> Stawka
                        </span>
                        <span className="font-bold text-slate-900 text-lg">{service.price} PLN</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-2 text-slate-500 font-medium">
                            <Clock className="w-4 h-4 text-indigo-500" /> Termin
                        </span>
                        <span className="font-semibold text-slate-700">{service.delivery_time_days || "?"} dni</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-2 text-slate-500 font-medium">
                            <LayoutTemplate className="w-4 h-4 text-purple-500" /> Kategoria
                        </span>
                        <span className="font-semibold text-slate-700 truncate max-w-[140px]" title={service.category}>
                            {service.category}
                        </span>
                    </div>
                </div>

                <div className="pt-2">
                    <Button asChild variant="outline" className="w-full rounded-xl border-slate-200 text-slate-600 font-bold group-hover:bg-slate-900 group-hover:text-white transition-colors">
                        <Link href={`/app/offers/${service.id}`}>
                            Podgląd Usługi
                        </Link>
                    </Button>
                    <div className="flex gap-2 mt-2">
                        <Button asChild variant="ghost" size="sm" className="flex-1 rounded-lg text-slate-400 hover:text-indigo-600">
                            <Link href={`/app/admin/system-services/${service.id}/edit`}>Edytuj</Link>
                        </Button>
                        <DeleteServiceButton serviceId={service.id} serviceTitle={service.title} />
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
