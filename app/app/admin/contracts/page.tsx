import { createAdminClient } from "@/lib/supabase/admin";
import { ContractsTable } from "@/components/admin/contracts-table";
import { BriefcaseBusiness } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminContractsPage() {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("contracts")
    .select(`
      id,
      created_at,
      status,
      terms_status,
      total_amount,
      currency,
      commission_rate,
      source_type,
      company_id,
      student_id,
      student:student_profiles(public_name),
      company:company_profiles(nazwa)
    `)
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <div className="p-8 text-red-500">Blad pobierania kontraktow: {error.message}</div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 p-8 rounded-[2.5rem] bg-slate-900/50 border border-white/5 shadow-2xl overflow-hidden relative">
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-12 w-12 rounded-2xl bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30">
              <BriefcaseBusiness className="h-6 w-6 text-indigo-400" />
            </div>
            <span className="text-xs font-black text-indigo-400/80 uppercase tracking-[0.2em]">
              Marketplace
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight leading-none mb-3">
            Kontrakty
          </h1>
          <p className="text-slate-400 max-w-xl font-medium leading-relaxed">
            Administracyjny przeglad wszystkich kontraktow wraz ze statusem, zrodlem i
            prowizja.
          </p>
        </div>
      </div>

      <ContractsTable
        contracts={(data || []) as any[]}
        emptyMessage="Brak kontraktow do wyswietlenia."
      />
    </div>
  );
}
