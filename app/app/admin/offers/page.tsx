import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { AdminOffersTable } from "./admin-offers-table";

export default async function AdminOffersPage() {
    const supabase = await createClient();

    // 1. Check Auth & Role
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        redirect("/login");
    }

    const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("user_id", user.id)
        .single();

    if (profile?.role !== "admin") {
        redirect("/app");
    }

    // 2. Fetch All Offers (Admin View)
    const { data: offers } = await supabase
        .from("offers")
        .select(`
      id,
      tytul,
      typ,
      status,
      created_at,
      company_id,
      company_profiles (nazwa)
    `)
        .order("created_at", { ascending: false });

    return (
        <div className="container mx-auto py-10">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Panel Administratora</h1>
                    <p className="text-slate-500">Zarządzanie wszystkimi ofertami w systemie (Mikrozlecenia, Praca, Staże).</p>
                </div>
            </div>

            <AdminOffersTable offers={offers || []} />
        </div>
    );
}
