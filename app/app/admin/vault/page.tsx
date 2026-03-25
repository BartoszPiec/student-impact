import { createAdminClient } from "@/lib/supabase/admin";
import { format } from "date-fns";
import { pl } from "date-fns/locale";
import { ShieldAlert, FileText, Search, DownloadCloud } from "lucide-react";
import { VaultRowActions } from "./_components/VaultRowActions";

export const dynamic = "force-dynamic";

export default async function LegalVaultPage() {
  const supabase = createAdminClient();

  // Fetch all contracts with related profiles and offer titles
  const { data: contracts, error } = await supabase
    .from("contracts")
    .select(`
      id,
      created_at,
      total_amount,
      currency,
      status,
      student_id,
      company_id,
      student:student_profiles(public_name),
      company:company_profiles(nazwa),
      applications!contracts_application_id_fkey(offers(tytul))
    `)
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-[400px] border border-red-500/20 bg-red-500/5 rounded-3xl">
        <ShieldAlert className="h-12 w-12 text-red-500 mb-4" />
        <h2 className="text-xl font-black text-white">Błąd bazy danych</h2>
        <p className="text-slate-400 mt-2">{error.message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 p-8 rounded-[2.5rem] bg-slate-900/50 border border-white/5 shadow-2xl overflow-hidden relative group">
        <div className="absolute top-0 right-0 p-12 opacity-5 group-hover:opacity-10 transition-opacity">
          <DownloadCloud className="h-32 w-32 text-indigo-400" />
        </div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-12 w-12 rounded-2xl bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30">
              <FileText className="h-6 w-6 text-indigo-400" />
            </div>
            <span className="text-xs font-black text-indigo-400/80 uppercase tracking-[0.2em]">Księgowość & Audyt</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight leading-none mb-3">
            Legal <span className="text-indigo-500">Vault</span>
          </h1>
          <p className="text-slate-400 max-w-xl font-medium leading-relaxed">
            Centralne repozytorium wszystkich zawartych umów. Pobieraj podpisane dokumenty PDF do celów księgowych i prawnych.
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="rounded-[2.5rem] bg-slate-950/40 border border-white/5 shadow-xl overflow-hidden backdrop-blur-sm">
        <div className="p-6 border-b border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/5">
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-slate-500" />
            <span className="text-sm font-bold text-slate-400">Wykaz wszystkich zawartych umów ({contracts?.length || 0})</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5 bg-slate-950/20">
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Data zawarcia</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Zlecenie / Przedmiot</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Strony umowy</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Status</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Wartość BRUTTO</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500 text-right">Akcje prawne</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {contracts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-20 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="h-16 w-16 rounded-full bg-white/5 flex items-center justify-center">
                        <FileText className="h-8 w-8 text-slate-700" />
                      </div>
                      <p className="text-slate-500 font-bold">Brak zawartych umów w systemie.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                contracts.map((contract) => {
                  const offerTitle = (contract.applications as any)?.offers?.tytul || "Zlecenie bezpośrednie";
                  const studentName = (contract.student as any)?.public_name || "Brak danych";
                  const companyName = (contract.company as any)?.nazwa || "Brak danych";
                  
                  return (
                    <tr key={contract.id} className="hover:bg-white/5 transition-colors group">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-bold text-slate-300">
                          {format(new Date(contract.created_at), "d MMM yyyy", { locale: pl })}
                        </span>
                        <div className="text-[10px] text-slate-500 mt-0.5">
                          {format(new Date(contract.created_at), "HH:mm")}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-bold text-white line-clamp-1">{offerTitle}</div>
                        <div className="text-[10px] text-slate-500 mt-0.5 font-mono">ID: {contract.id.slice(0, 8)}...</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black text-indigo-400 bg-indigo-500/10 px-1.5 rounded uppercase">Firma</span>
                            <span className="text-sm font-medium text-slate-300">{companyName}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black text-emerald-400 bg-emerald-500/10 px-1.5 rounded uppercase">Student</span>
                            <span className="text-sm font-medium text-slate-300">{studentName}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex">
                          {contract.status === "active" ? (
                            <span className="px-2 py-1 rounded-lg text-[10px] font-black bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase tracking-wider">Aktywna</span>
                          ) : contract.status === "completed" ? (
                            <span className="px-2 py-1 rounded-lg text-[10px] font-black bg-blue-500/10 text-blue-400 border border-blue-500/20 uppercase tracking-wider">Zakończona</span>
                          ) : contract.status === "cancelled" ? (
                             <span className="px-2 py-1 rounded-lg text-[10px] font-black bg-red-500/10 text-red-500 border border-red-500/20 uppercase tracking-wider">Anulowana</span>
                          ) : (
                            <span className="px-2 py-1 rounded-lg text-[10px] font-black bg-slate-500/10 text-slate-400 border border-white/10 uppercase tracking-wider">{contract.status}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-black text-white">
                          {Number(contract.total_amount).toLocaleString('pl-PL', { style: 'currency', currency: contract.currency || 'PLN' })}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <VaultRowActions contractId={contract.id} />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
