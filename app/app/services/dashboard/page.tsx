import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Inbox } from "lucide-react";
import DashboardClient from "./dashboard-client";

export default async function ServiceDashboardPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect("/auth");
    }

    // Fetch ALL orders (Client-side filtering will handle constraints)
    const { data: orders, error } = await supabase
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
                title
            )
        `)
        .eq("student_id", user.id)
        .neq("status", "rejected")
        .order("created_at", { ascending: false });

    // Manual Join for Company Profiles
    let companyData: Record<string, any> = {};
    if (orders && orders.length > 0) {
        const companyIds = Array.from(new Set(orders.map((o: any) => o.company_id).filter(Boolean)));
        const { data: companies } = await supabase
            .from("company_profiles")
            .select("*")
            .in("user_id", companyIds);

        if (companies) {
            companies.forEach((c: any) => {
                companyData[c.user_id] = c;
            });
        }
    }

    return (
        <div className="space-y-12 pb-20">
            {/* PREMIUM HEADER BANNER */}
            <div className="relative overflow-hidden rounded-[2.5rem] bg-slate-900 px-8 py-12 md:px-12 md:py-16 text-white shadow-2xl">
                <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent" />
                <div className="absolute -top-24 -right-24 w-96 h-96 bg-indigo-500/10 rounded-full blur-[100px]" />
                <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-purple-500/10 rounded-full blur-[80px]" />

                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                    <div className="text-center md:text-left space-y-4">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-[10px] font-black uppercase tracking-widest">
                            <Inbox className="h-3 w-3" /> Centrum Operacyjne
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black tracking-tight leading-none bg-gradient-to-r from-white via-indigo-100 to-indigo-300 bg-clip-text text-transparent">
                            Pulpit Zleceń
                        </h1>
                        <p className="text-indigo-100/60 text-lg font-medium max-w-xl">
                            Śledź przychodzące zapytania, negocjuj warunki i zarządzaj swoimi projektami w jednym miejscu.
                        </p>
                    </div>

                    <Link href="/app/services/my">
                        <Button variant="outline" className="rounded-2xl border-white/10 bg-white/5 hover:bg-white/10 text-white font-bold h-12 px-6 shadow-xl">
                            <ArrowLeft className="mr-2 h-4 w-4" /> Moje Usługi
                        </Button>
                    </Link>
                </div>
            </div>

            {/* CLIENT SIDE FILTERING & GRID */}
            <DashboardClient initialOrders={orders || []} companyData={companyData} />
        </div>
    );
}
