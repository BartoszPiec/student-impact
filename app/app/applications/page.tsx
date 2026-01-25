import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText } from "lucide-react";
import { ApplicationList, SavedList } from "./ApplicationList";

export const dynamic = "force-dynamic";

// --- HELPER COMPONENTS ---

function EmptyState({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 border-2 border-dashed rounded-xl border-slate-200 bg-slate-50/50">
      <div className="bg-white p-3 rounded-full shadow-sm mb-3">
        <FileText className="w-6 h-6 text-slate-300" />
      </div>
      <p className="text-slate-500 font-medium">{label}</p>
    </div>
  )
}

export default async function StudentApplicationsPage() {
  const supabase = await createClient();

  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) redirect("/auth");

  // Check Profile Role
  const { data: profile } = await supabase.from("profiles").select("role").eq("user_id", user.id).single();
  if (profile?.role !== "student") redirect("/app");

  // Fetch Applications
  const { data: rows, error } = await supabase
    .from("applications")
    .select(`
      id, status, message_to_company, created_at, offer_id, 
      proposed_stawka, counter_stawka, agreed_stawka, 
      offers (id, tytul, typ, stawka, status, is_platform_service)
    `)
    .eq("student_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    return <div className="p-8 text-red-500">Błąd pobierania danych: {error.message}</div>;
  }

  // Fetch Deliverables Statuses
  const appIds = (rows ?? []).map((r: any) => r.id);
  const deliverableByAppId = new Map<string, string>();
  if (appIds.length > 0) {
    const { data: delivs } = await supabase.from("deliverables").select("application_id, status").in("application_id", appIds);
    delivs?.forEach((d: any) => {
      if (d.application_id) deliverableByAppId.set(d.application_id, d.status);
    });
  }

  // Normalize Data
  const applications = (rows ?? []).map((a: any) => {
    const offer = Array.isArray(a.offers) ? a.offers[0] : a.offers;
    const deliverableStatus = deliverableByAppId.get(a.id);

    // Filter Logic
    let stage = "sent";
    if (a.status === "completed") stage = "done";
    else if (a.status === "rejected") stage = "rejected";
    else if (a.status === "cancelled") stage = "cancelled"; // NEW STAGE
    else if (a.status === "countered") stage = "countered";
    else if (a.status === "in_progress") stage = "in_progress";
    else if (a.status === "accepted") {
      // If accepted, it's either in_progress or done
      if (deliverableStatus === "approved" || deliverableStatus === "completed") stage = "done";
      else stage = "in_progress";
    }

    return { ...a, offer, stage, deliverableStatus };
  });

  // Fetch Saved Offers
  const { data: savedRows } = await supabase
    .from("saved_offers")
    .select("created_at, offers(id, tytul, opis, typ, stawka, status, created_at)")
    .eq("student_id", user.id)
    .order("created_at", { ascending: false });

  // Normalize Saved
  const savedOffers = (savedRows ?? [])
    .map((r: any) => {
      const offer = Array.isArray(r.offers) ? r.offers[0] : r.offers;
      return { saved_at: r.created_at, offer };
    })
    .filter((x: any) => x.offer && x.offer.status === "published");


  // Groups - Modified
  const wTrakcie = applications.filter((a: any) => a.stage === "in_progress");

  // Wysłane teraz zawiera też negocjacje (countered)
  const wyslane = applications.filter((a: any) => a.stage === "sent" || a.stage === "countered");

  // Archiwum zawiera odrzucone, zakończone i ANULOWANE
  const archiwum = applications.filter((a: any) => a.stage === "rejected" || a.stage === "done" || a.stage === "cancelled");

  const defaultTab =
    wTrakcie.length > 0 ? "in_progress" :
      wyslane.length > 0 ? "sent" :
        savedOffers.length > 0 ? "saved" :
          "archive";

  return (
    <main className="container max-w-5xl mx-auto py-8 space-y-8">


      {/* Premium Header */}
      <div className="relative rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 px-8 py-12 text-white shadow-xl overflow-hidden mb-8">
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>

        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex flex-col md:flex-row items-center gap-6 text-center md:text-left">
            <div className="h-20 w-20 bg-white/10 backdrop-blur-xl rounded-2xl flex items-center justify-center border border-white/20 shadow-2xl group hover:scale-105 transition-transform duration-500">
              <FileText className="h-10 w-10 text-indigo-300 drop-shadow-[0_0_8px_rgba(165,180,252,0.5)]" />
            </div>
            <div>
              <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
                <span className="px-3 py-1 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-full text-xs font-bold uppercase tracking-wider backdrop-blur-md">
                  Panel Studenta
                </span>
                <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full text-xs font-bold uppercase tracking-wider backdrop-blur-md">
                  {applications.length} aktywności
                </span>
              </div>
              <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-white via-indigo-100 to-indigo-300 bg-clip-text text-transparent">
                Moje Aplikacje
              </h1>
              <p className="text-indigo-100/70 mt-2 max-w-xl text-lg font-medium leading-relaxed">
                Śledź swoje zgłoszenia, zarządzaj realizacjami i przeglądaj zapisane okazje.
              </p>
            </div>
          </div>

          <div className="hidden lg:block relative shrink-0">
            <div className="absolute inset-0 bg-indigo-500/20 blur-[40px] rounded-full"></div>
            <div className="relative bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-4 shadow-2xl">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-indigo-500 flex items-center justify-center font-bold text-white">
                  {applications.filter(a => a.stage === 'in_progress').length}
                </div>
                <div className="text-xs">
                  <p className="font-bold text-white">Zlecenia w toku</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Decorative elements */}
        <div className="absolute right-0 top-0 -mt-20 -mr-20 h-80 w-80 rounded-full bg-indigo-500/10 blur-[100px] pointer-events-none"></div>
        <div className="absolute left-1/4 bottom-0 -mb-20 h-60 w-60 rounded-full bg-violet-500/10 blur-[80px] pointer-events-none"></div>
      </div>

      <Tabs key={defaultTab} defaultValue={defaultTab} className="w-full">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 md:w-auto h-auto p-1.5 bg-slate-100/80 backdrop-blur-sm rounded-2xl border border-slate-200/50 shadow-inner">
            <TabsTrigger value="in_progress" className="rounded-xl py-3 px-6 data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:text-indigo-600 font-bold transition-all duration-300">
              W trakcie {wTrakcie.length > 0 && <Badge variant="secondary" className="ml-2 bg-indigo-100 text-indigo-700 border-indigo-200">{wTrakcie.length}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="sent" className="rounded-xl py-3 px-6 data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:text-indigo-600 font-bold transition-all duration-300">
              Wysłane <span className="ml-2 text-slate-400 font-medium tracking-tighter">({wyslane.length})</span>
            </TabsTrigger>
            <TabsTrigger value="saved" className="rounded-xl py-3 px-6 data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:text-indigo-600 font-bold transition-all duration-300">
              Zapisane {savedOffers.length > 0 && <Badge variant="secondary" className="ml-2 bg-amber-100 text-amber-700 border-amber-200">{savedOffers.length}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="archive" className="rounded-xl py-3 px-6 data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:text-indigo-600 font-bold transition-all duration-300">
              Archiwum
            </TabsTrigger>
          </TabsList>

          <div className="px-5 py-2.5 bg-indigo-50 rounded-full border border-indigo-100/50 hidden md:block">
            <p className="text-sm font-bold text-indigo-700">
              Filtr: <span className="text-indigo-900 ml-1">{defaultTab === 'in_progress' ? 'Aktywne zlecenia' : 'Widok ogólny'}</span>
            </p>
          </div>
        </div>

        <TabsContent value="in_progress" className="space-y-4">
          {wTrakcie.length === 0 ? <EmptyState label="Nie masz obecnie żadnych zleceń w trakcie." /> : <ApplicationList items={wTrakcie} />}
        </TabsContent>
        <TabsContent value="sent" className="space-y-4">
          {wyslane.length === 0 ? <EmptyState label="Brak oczekujących zgłoszeń." /> : <ApplicationList items={wyslane} />}
        </TabsContent>
        <TabsContent value="saved" className="space-y-4">
          {savedOffers.length === 0 ? <EmptyState label="Brak zapisanych ofert." /> : <SavedList items={savedOffers} />}
        </TabsContent>
        <TabsContent value="archive" className="space-y-4">
          {archiwum.length === 0 ? <EmptyState label="Pusto w archiwum." /> : <ApplicationList items={archiwum} />}
        </TabsContent>
      </Tabs>

    </main>
  );
}
