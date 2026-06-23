import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PageContainer } from "@/components/ui/page-container";
import { PremiumPageHeader } from "@/components/ui/premium-page-header";
import { Inbox, LayoutGrid } from "lucide-react";
import DashboardClient from "./dashboard-client";
import type { CompanySummary, DashboardOrder } from "./dashboard-client";

export default async function ServiceDashboardPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect("/auth");
    }

    const { data: orderRows, error } = await supabase
        .from("service_orders")
        .select(`
            id,
            created_at,
            status,
            amount,
            counter_amount,
            requirements,
            request_snapshot,
            company_id,
            package:service_packages!service_orders_package_id_fkey(
                title
            )
        `)
        .eq("student_id", user.id)
        .neq("status", "rejected")
        .order("created_at", { ascending: false });

    const orders = (orderRows ?? []) as DashboardOrder[];
    const companyData: Record<string, CompanySummary> = {};
    if (orders && orders.length > 0) {
        const companyIds = Array.from(new Set(orders.map((order) => order.company_id)));
        const { data: companies } = await supabase
            .from("company_profiles")
            .select("user_id, nazwa")
            .in("user_id", companyIds);

        if (companies) {
            for (const company of companies) {
                companyData[company.user_id] = { nazwa: company.nazwa };
            }
        }
    }

    return (
        <main className="pb-20">
            <PremiumPageHeader
                badge="Panel Studenta"
                title="Pulpit Zleceń"
                description="Śledź przychodzące zapytania, negocjuj warunki i zarządzaj swoimi projektami."
                icon={<Inbox className="h-10 w-10 text-indigo-300 drop-shadow-[0_0_8px_rgba(165,180,252,0.5)]" />}
                actions={
                    <Button asChild variant="outline" className="h-12 rounded-2xl border-white/20 bg-white/10 px-6 font-bold text-white hover:bg-white/20 hover:text-white">
                        <Link href="/app/services/my">
                            <LayoutGrid className="mr-2 h-4 w-4" />
                            Moje Usługi
                        </Link>
                    </Button>
                }
            />

            <PageContainer className="space-y-8">
                {error && (
                    <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
                        Błąd pobierania danych: {String(error)}
                    </div>
                )}
                <DashboardClient initialOrders={orders} companyData={companyData} />
            </PageContainer>
        </main>
    );
}
