import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { pl } from "date-fns/locale";
import { ArrowLeft, Building2, Globe, MapPin, Calendar, CreditCard, Package2 } from "lucide-react";
import OrderDetailActions from "../order-detail-actions";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

interface Props {
    params: Promise<{ id: string }>;
}

export default async function ServiceOrderDetailPage(props: Props) {
    const params = await props.params;
    const { id } = params;

    // Validate if ID is provided
    if (!id) {
        return <div className="p-8 text-center text-red-500">Brak identyfikatora zlecenia.</div>;
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect("/auth");
    }

    // 1. Fetch Order Details
    const { data: order, error } = await supabase
        .from("service_orders")
        .select(`
            id,
            created_at,
            status,
            amount,
            requirements,
            company_id,
            package:service_packages!service_orders_package_id_fkey(
                id,
                title,
                description,
                price
            )
        `)
        .eq("id", id)
        .eq("student_id", user.id) // Ensure ownership
        .single();

    if (error || !order) {
        return (
            <div className="container py-12 text-center">
                <h1 className="text-2xl font-bold mb-4">Nie znaleziono zlecenia</h1>
                <p className="text-slate-500 mb-6">Prawdopodobnie zostało usunięte lub nie masz do niego dostępu.</p>
                <Link href="/app/services/dashboard">
                    <Button>Wróć do pulpitu</Button>
                </Link>
            </div>
        );
    }

    // 2. Fetch Company Profile
    const { data: company } = await supabase
        .from("company_profiles")
        .select("*")
        .eq("user_id", order.company_id)
        .single();

    // 3. Find Conversation for Chat Link
    const { data: conv } = await supabase
        .from("conversations")
        .select("id")
        .eq("package_id", (order.package as any)?.id)
        .eq("company_id", order.company_id)
        .eq("student_id", user.id)
        .eq("type", "inquiry")
        .limit(1)
        .maybeSingle();

    const chatLink = conv ? `/app/chat/${conv.id}` : `/app/chat`;


    // Helpers
    const statusMap: Record<string, { label: string, color: string }> = {
        'inquiry': { label: 'Nowe Zapytanie', color: 'bg-blue-100 text-blue-800' },
        'pending': { label: 'Oczekujące', color: 'bg-yellow-100 text-yellow-800' },
        'proposal_sent': { label: 'Wysłano Ofertę', color: 'bg-green-100 text-green-800' },
        'rejected': { label: 'Odrzucone', color: 'bg-red-100 text-red-800' },
        'accepted': { label: 'W trakcie', color: 'bg-emerald-100 text-emerald-800' },
        'in_progress': { label: 'W trakcie', color: 'bg-emerald-100 text-emerald-800' },
        'completed': { label: 'Zakończone', color: 'bg-slate-100 text-slate-800' },
    };
    const statusInfo = statusMap[order.status] || { label: order.status, color: 'bg-slate-100' };

    return (
        <div className="container max-w-5xl py-8 space-y-8">
            {/* Header / Breadcrumb */}
            <div className="flex flex-col gap-4">
                <Link href="/app/services/dashboard" className="text-sm text-slate-500 hover:text-slate-900 flex items-center gap-1 w-fit">
                    <ArrowLeft className="w-4 h-4" />
                    Wróć do listy zleceń
                </Link>

                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <h1 className="text-3xl font-bold text-slate-900">
                                {(order.package as any)?.title || "Usunięta usługa"}
                            </h1>
                            <Badge className={`${statusInfo.color} border-0`}>
                                {statusInfo.label}
                            </Badge>
                        </div>
                        <p className="text-slate-500 flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            Otrzymano: {format(new Date(order.created_at), "d MMMM yyyy, HH:mm", { locale: pl })}
                        </p>
                    </div>

                    {/* Actions Toolbar */}
                    <OrderDetailActions order={order} chatLink={chatLink} />
                </div>
            </div>

            <Separator />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Order Details */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Requirements Card */}
                    <Card>
                        <CardContent className="p-6 space-y-4">
                            <h2 className="text-lg font-semibold flex items-center gap-2">
                                <Package2 className="w-5 h-5 text-indigo-600" />
                                Szczegóły Zlecenia
                            </h2>
                            <div className="bg-slate-50 p-4 rounded-lg border text-sm text-slate-700 whitespace-pre-wrap leading-relaxed font-mono">
                                {order.requirements || "Brak dodatkowych wymagań od klienta."}
                            </div>

                            <div className="flex items-center gap-2 text-sm text-slate-500 mt-2">
                                <CreditCard className="w-4 h-4" />
                                <span>Budżet / Wycena: </span>
                                <span className="font-semibold text-slate-900">
                                    {order.amount ? `${order.amount} PLN` : "Nie ustalono (zależne od wyceny)"}
                                </span>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Package Info (Context) */}
                    {order.package && (
                        <div className="bg-white border rounded-lg p-6 text-sm text-slate-600">
                            <h3 className="font-semibold text-slate-900 mb-2">Dotyczy Twojej usługi:</h3>
                            <p className="italic text-slate-500">{(order.package as any).description || "Brak opisu usługi."}</p>
                            <p className="mt-2 font-medium">Cena bazowa w katalogu: {(order.package as any).price} PLN</p>
                        </div>
                    )}
                </div>

                {/* Right Column: Company Profile */}
                <div className="space-y-6">
                    <Card className="border-sky-100 shadow-sm bg-sky-50">
                        <CardContent className="p-6 space-y-6">
                            <div>
                                <h3 className="text-sm font-semibold text-slate-900 mb-4 flex items-center gap-2">
                                    <Building2 className="w-4 h-4 text-indigo-600" />
                                    Zleceniodawca
                                </h3>

                                <div className="mb-4">
                                    <Link href={`/app/companies/${order.company_id}`} className="group block">
                                        <div className="text-lg font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                                            {company?.nazwa || "Nieznana firma"}
                                        </div>
                                        <div className="text-xs text-slate-500 group-hover:underline">
                                            Zobacz profil firmy →
                                        </div>
                                    </Link>
                                    <div className="text-sm text-slate-600 mt-1">{company?.branza || "Brak branży"}</div>
                                </div>

                                <div className="space-y-3 text-sm">
                                    <div className="flex items-start gap-2">
                                        <MapPin className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                                        <span>
                                            {company?.city || "Brak miasta"}
                                            {company?.address && `, ${company.address}`}
                                        </span>
                                    </div>
                                    {company?.website && (
                                        <div className="flex items-center gap-2">
                                            <Globe className="w-4 h-4 text-slate-400 shrink-0" />
                                            <a href={company.website} target="_blank" className="text-indigo-600 hover:underline truncate">
                                                {company.website.replace(/^https?:\/\//, '')}
                                            </a>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <Separator className="bg-indigo-100" />

                            <div>
                                <p className="text-xs text-slate-500 mb-2 font-semibold uppercase">O firmie</p>
                                <p className="text-sm text-slate-600 line-clamp-6 leading-relaxed">
                                    {company?.opis || "Brak opisu firmy."}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
