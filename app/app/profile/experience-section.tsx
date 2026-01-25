import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Briefcase, Calendar, ArrowUpRight, CheckCircle2 } from "lucide-react";

export const dynamic = "force-dynamic";

function formatDate(ts?: string | null) {
  if (!ts) return "";
  return new Intl.DateTimeFormat("pl-PL", { dateStyle: "medium" }).format(new Date(ts));
}

export default async function ExperienceSection() {
  const supabase = await createClient();

  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) redirect("/auth");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("user_id", user.id)
    .single();

  if (profile?.role !== "student") return null;

  // 1. Fetch Manual Entries
  const { data: manualRows } = await supabase
    .from("experience_entries")
    .select("id, title, summary, link, created_at, offer_id")
    .eq("student_id", user.id)
    .order("created_at", { ascending: false });

  // 2. Fetch User's Applications & Service Orders IDs
  const { data: myApps } = await supabase
    .from("applications")
    .select("id, offer_id, offers(tytul, opis)")
    .eq("student_id", user.id);

  const { data: myOrders } = await supabase
    .from("service_orders")
    .select("id, title, requirements")
    .eq("student_id", user.id);

  const myAppIds = (myApps || []).map(a => a.id);
  const myOrderIds = (myOrders || []).map(o => o.id);

  // 3. Fetch Completed Contracts (Split Queries for Safety)
  let contractsFromApps: any[] = [];
  if (myAppIds.length > 0) {
    const { data } = await supabase
      .from("contracts")
      .select("id, created_at, status, application_id")
      .in("application_id", myAppIds)
      .eq("status", "completed");
    contractsFromApps = data || [];
  }

  let contractsFromOrders: any[] = [];
  if (myOrderIds.length > 0) {
    const { data } = await supabase
      .from("contracts")
      .select("id, created_at, status, service_order_id")
      .in("service_order_id", myOrderIds)
      .eq("status", "completed");
    contractsFromOrders = data || [];
  }

  // 4. Transform & Merge
  const verifiedProjects = [...contractsFromApps, ...contractsFromOrders].map((c: any) => {
    let title = "Zrealizowany Projekt";
    let summary = "";
    let offerId = null;

    if (c.application_id) {
      const app = myApps?.find(a => a.id === c.application_id);
      if (app) {
        title = (app.offers as any)?.tytul || "Projekt z Aplikacji";
        summary = (app.offers as any)?.opis || "";
        offerId = app.offer_id;
      }
    } else if (c.service_order_id) {
      const order = myOrders?.find(o => o.id === c.service_order_id);
      if (order) {
        title = order.title || "Zlecenie Bezpośrednie";
        summary = order.requirements || "";
      }
    }

    return {
      id: c.id,
      title,
      summary,
      link: null,
      created_at: c.created_at,
      offer_id: offerId,
      isVerified: true
    };
  });

  // Merge and Sort
  const allProjects = [...verifiedProjects, ...(manualRows || [])].sort((a: any, b: any) =>
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  return (
    <div className="bg-white">
      <div className="bg-gradient-to-r from-slate-50 to-white border-b border-slate-100 py-6 px-8">
        <h2 className="flex items-center gap-3 text-lg font-black text-slate-800">
          <div className="p-2 bg-indigo-100 text-indigo-600 rounded-xl">
            <Briefcase className="w-5 h-5" />
          </div>
          Zrealizowane Projekty
          <Badge variant="secondary" className="ml-auto bg-emerald-100 text-emerald-700 font-bold border-none">
            {allProjects.length} Realizacji
          </Badge>
        </h2>
      </div>

      <div className="p-8 space-y-4">
        {allProjects.length === 0 && (
          <div className="text-center py-12 border-2 border-dashed border-slate-100 rounded-3xl bg-slate-50/30">
            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm text-slate-300">
              <Briefcase className="w-8 h-8" />
            </div>
            <p className="text-sm font-bold text-slate-500">Brak zrealizowanych projektów.</p>
            <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">Wykonuj zlecenia na platformie, aby automatycznie budować swoje portfolio.</p>
          </div>
        )}

        <div className="grid gap-6 md:grid-cols-2">
          {allProjects.map((e: any) => (
            <div key={e.id} className="group flex flex-col justify-between bg-white border border-slate-100 rounded-3xl p-6 hover:shadow-xl hover:shadow-slate-200/50 hover:border-indigo-100 transition-all duration-300 relative overflow-hidden">
              {e.isVerified && (
                <div className="absolute top-0 right-0 p-4 opacity-50"><CheckCircle2 className="w-12 h-12 text-emerald-100 group-hover:text-emerald-200 transition-colors" /></div>
              )}

              <div className="relative z-10">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="space-y-1">
                    <h3 className="text-base font-black text-slate-800 line-clamp-2 leading-tight group-hover:text-indigo-700 transition-colors">{e.title}</h3>
                    {e.isVerified && (
                      <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-100 font-bold uppercase tracking-wide">
                        Zweryfikowane przez Student2Work
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="text-xs font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1.5 mb-4">
                  <Calendar className="w-3.5 h-3.5" />
                  {formatDate(e.created_at)}
                </div>

                <div className="min-h-[3rem]">
                  {e.summary ? (
                    <p className="text-sm text-slate-600 line-clamp-3 leading-relaxed">{e.summary}</p>
                  ) : (
                    <span className="text-sm text-slate-400 italic">Brak dodatkowego opisu.</span>
                  )}
                </div>
              </div>

              <div className="relative z-10 mt-6 pt-4 border-t border-slate-50 flex items-center justify-between gap-3">
                {e.link ? (
                  <a href={e.link} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors">
                    Otwórz Projekt <ArrowUpRight className="w-3.5 h-3.5" />
                  </a>
                ) : <span />}

                {e.offer_id && (
                  <Link href={`/app/offers/${e.offer_id}`}>
                    <Button variant="ghost" size="sm" className="h-8 rounded-lg text-xs font-bold text-slate-500 hover:text-slate-800 bg-slate-50 hover:bg-slate-100">
                      Oferta
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
