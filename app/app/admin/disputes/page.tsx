import { createAdminClient } from "@/lib/supabase/admin";
import { DisputesTable } from "@/components/admin/disputes-table";
import { AlertTriangle } from "lucide-react";
import { ADMIN_PAGE_SIZE, getPageNumber, ServerPagination } from "@/components/admin/server-pagination";

export const dynamic = "force-dynamic";

function idleDaysSince(updatedAt: string, nowMs: number): number {
  return Math.max(0, Math.floor((nowMs - new Date(updatedAt).getTime()) / 86400000));
}

export default async function AdminDisputesPage({
  searchParams,
}: {
  searchParams?: Promise<{ page?: string | string[] }>;
}) {
  const currentPage = getPageNumber((await searchParams)?.page);
  const rangeStart = (currentPage - 1) * ADMIN_PAGE_SIZE;
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("contracts")
    .select(`
      id,
      created_at,
      updated_at,
      company_contract_accepted_at,
      student_contract_accepted_at,
      application_id,
      service_order_id,
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
    .in("status", ["disputed", "cancelled"])
    .order("updated_at", { ascending: true })
    .range(rangeStart, rangeStart + ADMIN_PAGE_SIZE);

  if (error) {
    console.error("[admin/disputes] failed to load disputes:", error.message);
    return (
      <div className="p-8 text-red-400">
        Nie udało sie pobrać listy sporów. Odśwież stronę lub spróbuj ponownie za chwile.
      </div>
    );
  }

  type DisputeContractRow = {
    id: string;
    created_at: string;
    updated_at: string;
    company_contract_accepted_at: string | null;
    student_contract_accepted_at: string | null;
    application_id: string | null;
    service_order_id: string | null;
    status: string | null;
    terms_status: string | null;
    total_amount: number | null;
    currency: string | null;
    commission_rate: number | null;
    source_type: string | null;
    company_id: string | null;
    student_id: string | null;
    student: { public_name: string | null } | { public_name: string | null }[] | null;
    company: { nazwa: string | null } | { nazwa: string | null }[] | null;
  };

  const unwrapRelation = <T,>(value: T | T[] | null): T | null =>
    Array.isArray(value) ? value[0] ?? null : value;

  const rows = (data || []) as DisputeContractRow[];
  const hasNextPage = rows.length > ADMIN_PAGE_SIZE;
  const disputes = rows.slice(0, ADMIN_PAGE_SIZE).map((row) => {
    const acceptedCandidates = [
      row.company_contract_accepted_at,
      row.student_contract_accepted_at,
    ].filter((value): value is string => Boolean(value));

    return {
      ...row,
      status: (row.status === "cancelled" ? "cancelled" : "disputed") as "disputed" | "cancelled",
      commission_rate: row.commission_rate ?? 0,
      student: unwrapRelation(row.student),
      company: unwrapRelation(row.company),
      accepted_at:
        acceptedCandidates.length > 0
          ? acceptedCandidates.sort(
              (left, right) => new Date(right).getTime() - new Date(left).getTime(),
            )[0]
          : null,
    };
  });
  const disputedCount = disputes.filter((row) => row.status === "disputed").length;
  const cancelledCount = disputes.filter((row) => row.status === "cancelled").length;
  const nowMs = new Date().getTime();
  const oldestIdleDays =
    disputes.length > 0
      ? Math.max(...disputes.map((row) => idleDaysSince(row.updated_at, nowMs)))
      : 0;

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 p-8 rounded-[2.5rem] bg-slate-900/50 border border-white/5 shadow-2xl overflow-hidden relative">
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-12 w-12 rounded-2xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
              <AlertTriangle className="h-6 w-6 text-amber-400" />
            </div>
            <span className="text-xs font-black text-amber-400/80 uppercase tracking-[0.2em]">
              Marketplace
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight leading-none mb-3">
            Spory i anulacje
          </h1>
          <p className="text-slate-400 max-w-xl font-medium leading-relaxed">
            Read-only panel triage dla kontraktów oznaczonych jako disputed lub
            cancelled.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-3xl border border-white/5 bg-slate-950/40 p-5">
          <div className="text-xs font-black uppercase tracking-widest text-slate-500">
            Spory
          </div>
          <div className="mt-2 text-3xl font-black text-white">{disputedCount}</div>
          <div className="mt-1 text-sm text-slate-400">Rekordy oznaczone jako disputed</div>
        </div>
        <div className="rounded-3xl border border-white/5 bg-slate-950/40 p-5">
          <div className="text-xs font-black uppercase tracking-widest text-slate-500">
            Anulacje
          </div>
          <div className="mt-2 text-3xl font-black text-white">{cancelledCount}</div>
          <div className="mt-1 text-sm text-slate-400">Rekordy oznaczone jako cancelled</div>
        </div>
        <div className="rounded-3xl border border-white/5 bg-slate-950/40 p-5">
          <div className="text-xs font-black uppercase tracking-widest text-slate-500">
            Najdluzej bez ruchu
          </div>
          <div className="mt-2 text-3xl font-black text-white">{oldestIdleDays} dni</div>
          <div className="mt-1 text-sm text-slate-400">Priorytet do sprawdzenia przez admina</div>
        </div>
      </div>

      <DisputesTable
        disputes={disputes}
        emptyMessage="Brak sporów ani anulowanych kontraktów."
      />
      <ServerPagination pathname="/app/admin/disputes" currentPage={currentPage} hasNextPage={hasNextPage} />
    </div>
  );
}
