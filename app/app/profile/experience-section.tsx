import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { Briefcase } from "lucide-react";
import { CompletedProjectsList, type CompletedProject } from "./completed-projects-list";

export const dynamic = "force-dynamic";

type OfferSummary = { tytul: string | null; opis: string | null };
type ApplicationRow = {
  id: string;
  offer_id: string;
  offers: OfferSummary | OfferSummary[] | null;
};
type ServiceOrderRow = { id: string; title: string | null; requirements: string | null };
type ContractRow = {
  id: string;
  created_at: string;
  application_id?: string | null;
  service_order_id?: string | null;
};
type ProjectRow = CompletedProject;

function firstRelation<T>(relation: T | T[] | null): T | null {
  return Array.isArray(relation) ? relation[0] ?? null : relation;
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

  const { data: manualRows } = await supabase
    .from("experience_entries")
    .select("id, title, summary, link, created_at, offer_id")
    .eq("student_id", user.id)
    .order("created_at", { ascending: false });

  const { data: myApps } = await supabase
    .from("applications")
    .select("id, offer_id, offers(tytul, opis)")
    .eq("student_id", user.id);

  const { data: myOrders } = await supabase
    .from("service_orders")
    .select("id, title, requirements")
    .eq("student_id", user.id);

  const applicationRows = (myApps || []) as unknown as ApplicationRow[];
  const orderRows = (myOrders || []) as ServiceOrderRow[];
  const myAppIds = applicationRows.map((application) => application.id);
  const myOrderIds = orderRows.map((order) => order.id);

  let contractsFromApps: ContractRow[] = [];
  if (myAppIds.length > 0) {
    const { data } = await supabase
      .from("contracts")
      .select("id, created_at, status, application_id")
      .in("application_id", myAppIds)
      .eq("status", "completed");
    contractsFromApps = (data || []) as ContractRow[];
  }

  let contractsFromOrders: ContractRow[] = [];
  if (myOrderIds.length > 0) {
    const { data } = await supabase
      .from("contracts")
      .select("id, created_at, status, service_order_id")
      .in("service_order_id", myOrderIds)
      .eq("status", "completed");
    contractsFromOrders = (data || []) as ContractRow[];
  }

  const verifiedProjects: ProjectRow[] = [...contractsFromApps, ...contractsFromOrders].map((contract) => {
    let title = "Zrealizowany projekt";
    let summary = "";
    let offerId: string | null = null;

    if (contract.application_id) {
      const application = applicationRows.find((item) => item.id === contract.application_id);
      if (application) {
        const offer = firstRelation(application.offers);
        title = offer?.tytul || "Projekt z aplikacji";
        summary = offer?.opis || "";
        offerId = application.offer_id;
      }
    } else if (contract.service_order_id) {
      const order = orderRows.find((item) => item.id === contract.service_order_id);
      if (order) {
        title = order.title || "Zlecenie bezpośrednie";
        summary = order.requirements || "";
      }
    }

    return {
      id: contract.id,
      title,
      summary,
      link: null,
      created_at: contract.created_at,
      offer_id: offerId,
      isVerified: true,
    };
  });

  const manualProjects = (manualRows || []) as ProjectRow[];
  const allProjects = [...verifiedProjects, ...manualProjects].sort((a, b) =>
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );

  return (
    <div className="bg-white">
      <div className="border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white px-8 py-6">
        <h2 className="flex items-center gap-3 text-lg font-black text-slate-800">
          <div className="rounded-xl bg-indigo-100 p-2 text-indigo-600">
            <Briefcase className="h-5 w-5" />
          </div>
          Zrealizowane projekty
          <Badge variant="secondary" className="ml-auto border-none bg-emerald-100 font-bold text-emerald-700">
            {allProjects.length} realizacji
          </Badge>
        </h2>
      </div>

      <div className="space-y-4 p-8">
        {allProjects.length === 0 ? (
          <div className="rounded-3xl border-2 border-dashed border-slate-100 bg-slate-50/30 py-12 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-slate-300 shadow-sm">
              <Briefcase className="h-8 w-8" />
            </div>
            <p className="text-sm font-bold text-slate-500">Brak zrealizowanych projektów.</p>
            <p className="mx-auto mt-1 max-w-xs text-xs text-slate-400">
              Wykonuj zlecenia na platformie, aby automatycznie budować swoje portfolio.
            </p>
          </div>
        ) : (
          <CompletedProjectsList projects={allProjects} />
        )}
      </div>
    </div>
  );
}
