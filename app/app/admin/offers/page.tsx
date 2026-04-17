import { BriefcaseBusiness } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { AdminOffersTable } from "./admin-offers-table";

export const dynamic = "force-dynamic";

export default async function AdminOffersPage() {
  const supabase = await createClient();

  const { data: offers } = await supabase
    .from("offers")
    .select(`
      id,
      tytul,
      typ,
      commission_rate,
      status,
      created_at,
      company_id,
      company_profiles (nazwa)
    `)
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-8 pb-12">
      <div className="relative overflow-hidden rounded-[2.5rem] border border-white/5 bg-slate-900/50 p-8 shadow-2xl">
        <div className="relative z-10 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-indigo-500/30 bg-indigo-500/20">
                <BriefcaseBusiness className="h-6 w-6 text-indigo-400" />
              </div>
              <span className="text-xs font-black uppercase tracking-[0.2em] text-indigo-400/80">
                Marketplace
              </span>
            </div>
            <h1 className="mb-3 text-4xl font-black leading-none tracking-tight text-white md:text-5xl">
              Oferty
            </h1>
            <p className="max-w-2xl font-medium leading-relaxed text-slate-300">
              Panel administracyjny ofert. Pozwala przegladac wpisy, korygowac
              prowizje oraz wejsc w szczegoly pojedynczej oferty.
            </p>
          </div>
        </div>
      </div>

      <AdminOffersTable offers={offers || []} />
    </div>
  );
}
