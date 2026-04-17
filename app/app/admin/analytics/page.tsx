import { createClient } from "@/lib/supabase/server";
import { PageContainer } from "@/components/ui/page-container";
import { AnalyticsDashboard } from "./AnalyticsDashboard";
import { revalidatePath } from "next/cache";

export const dynamic = "force-dynamic";

export default async function AdminAnalyticsPage() {
  const supabase = await createClient();
  const { data: stats, error } = await supabase.rpc("get_admin_stats");

  if (error) {
    return (
      <PageContainer>
        <div className="rounded-[2.5rem] border border-red-500/20 bg-red-500/5 p-12 text-center shadow-xl shadow-black/20">
          <h2 className="mb-4 text-2xl font-black text-red-400">Analytics Error</h2>
          <p className="mb-8 italic text-slate-300">
            Nie udalo sie pobrac danych analitycznych. Upewnij sie, ze migracja RPC zostala zaaplikowana.
          </p>
          <pre className="mx-auto max-w-2xl overflow-auto rounded-2xl border border-white/10 bg-slate-950 p-6 text-left font-mono text-xs text-emerald-400">
            {JSON.stringify(error, null, 2)}
          </pre>
        </div>
      </PageContainer>
    );
  }

  async function refreshStats() {
    "use server";
    revalidatePath("/app/admin/analytics");
  }

  return (
    <main className="min-h-screen pb-24 pt-8">
      <PageContainer>
        <AnalyticsDashboard stats={stats} onRefresh={refreshStats} loading={false} />
      </PageContainer>
    </main>
  );
}
