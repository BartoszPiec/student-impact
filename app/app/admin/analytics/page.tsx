import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { PageContainer } from "@/components/ui/page-container";
import { AnalyticsDashboard } from "./AnalyticsDashboard";
import { revalidatePath } from "next/cache";

export const dynamic = "force-dynamic";

export default async function AdminAnalyticsPage() {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;

  if (!user) redirect("/auth");

  // Verify Admin Role
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("user_id", user.id)
    .single();

  if (profile?.role !== "admin") {
    redirect("/app");
  }

  // Fetch Stats via RPC
  const { data: stats, error } = await supabase.rpc("get_admin_stats");

  if (error) {
    return (
      <PageContainer>
        <div className="p-12 text-center bg-white rounded-[2rem] border border-red-100 shadow-xl shadow-red-500/5">
          <h2 className="text-2xl font-black text-red-600 mb-4">Analytics Error</h2>
          <p className="text-slate-600 mb-8 italic">Nie udało się pobrać danych analitycznych. Upewnij się, że migracja RPC została zaaplikowana.</p>
          <pre className="p-6 bg-slate-900 text-emerald-400 rounded-2xl text-xs text-left overflow-auto max-w-2xl mx-auto font-mono">
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
    <main className="pb-24 pt-8 bg-slate-50/50 min-h-screen">
      <PageContainer>
        <AnalyticsDashboard stats={stats} onRefresh={refreshStats} loading={false} />
      </PageContainer>
    </main>
  );
}
