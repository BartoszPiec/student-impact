import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import OffersTabs from "./offers-tabs";

export const dynamic = "force-dynamic";

export default async function CompanyOffersPage() {
  const supabase = await createClient();

  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) redirect("/auth");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("user_id", user.id)
    .single();

  if (profile?.role !== "company") redirect("/app");

  // 1. Fetch Offers (include is_platform_service to distinguish)
  const { data: allOffers, error } = await supabase
    .from("offers")
    .select("id, tytul, typ, stawka, status, created_at, location, salary_range_min, salary_range_max, is_remote, contract_type, is_platform_service")
    .eq("company_id", user.id)
    .order("created_at", { ascending: false });

  // 2. Fetch Service Orders (Student Services)
  const { data: serviceOrders } = await supabase
    .from("service_orders")
    .select(`
        id, 
        created_at, 
        status, 
        amount, 
        package:service_packages(*)
    `)
    .eq("company_id", user.id)
    .order("created_at", { ascending: false });

  const offers = allOffers ?? [];

  // 3. Split Offers into Jobs and System Services
  const jobs = offers.filter((o: any) => o.is_platform_service !== true);
  const systemServices = offers.filter((o: any) => o.is_platform_service === true);
  const studentServices = serviceOrders ?? [];

  const offerIds = offers.map((o: any) => o.id);

  // --- Statistics Logic (Copied from previous implementation) ---
  const totalByOffer = new Map<string, number>();
  const sentByOffer = new Map<string, number>();
  const acceptedByOffer = new Map<string, number>();
  const acceptedProfileByOffer = new Map<string, { first_name: string, last_name: string, id: string }>();
  const acceptedAppIdByOffer = new Map<string, string>();
  const acceptedStudentIdByOffer = new Map<string, string>();

  const agreedStawkaByOffer = new Map<string, number | null>();
  const contractStatusByOffer = new Map<string, string | null>();
  const appIdToOfferId = new Map<string, string>();
  const appIds: string[] = [];
  const studentIds: string[] = [];
  const approvedOfferIds = new Set<string>();
  const deliveredOfferIds = new Set<string>();

  if (offerIds.length > 0) {
    const { data: apps } = await supabase
      .from("applications")
      .select("id, offer_id, status, student_id, agreed_stawka, contracts:contracts!application_id(terms_status)")
      .in("offer_id", offerIds);

    (apps ?? []).forEach((a: any) => {
      if ((a.status === "accepted" || a.status === "in_progress") && a.student_id) {
        studentIds.push(a.student_id);
      }
    });

    let profilesMap = new Map<string, any>();
    if (studentIds.length > 0) {
      const { data: profiles } = await supabase
        .from("student_profiles")
        .select("user_id, public_name")
        .in("user_id", studentIds);

      (profiles ?? []).forEach((p: any) => {
        profilesMap.set(p.user_id, {
          id: p.user_id,
          first_name: p.public_name,
          last_name: ""
        });
      });
    }

    (apps ?? []).forEach((a: any) => {
      appIds.push(a.id);
      appIdToOfferId.set(a.id, a.offer_id);

      totalByOffer.set(a.offer_id, (totalByOffer.get(a.offer_id) ?? 0) + 1);
      if (a.status === "sent") sentByOffer.set(a.offer_id, (sentByOffer.get(a.offer_id) ?? 0) + 1);

      if (a.status === "accepted" || a.status === "in_progress") {
        acceptedByOffer.set(a.offer_id, (acceptedByOffer.get(a.offer_id) ?? 0) + 1);
        if (!acceptedAppIdByOffer.has(a.offer_id)) {
          acceptedAppIdByOffer.set(a.offer_id, a.id);
          agreedStawkaByOffer.set(a.offer_id, a.agreed_stawka ?? null);

          // Extract contract status if available
          const contract = Array.isArray(a.contracts) ? a.contracts[0] : a.contracts;
          if (contract) {
            contractStatusByOffer.set(a.offer_id, contract.terms_status);
          }

          if (a.student_id) {
            acceptedStudentIdByOffer.set(a.offer_id, a.student_id);
          }
          if (a.student_id && profilesMap.has(a.student_id)) {
            acceptedProfileByOffer.set(a.offer_id, profilesMap.get(a.student_id));
          }
        }
      }
    });

    if (appIds.length > 0) {
      const { data: delivs } = await supabase
        .from("deliverables")
        .select("application_id, status")
        .in("application_id", appIds)
        .in("status", ["approved", "delivered", "pending"]);

      (delivs ?? []).forEach((d: any) => {
        const offerId = appIdToOfferId.get(d.application_id);
        if (offerId) {
          if (d.status === "approved") approvedOfferIds.add(offerId);
          if (d.status === "pending") deliveredOfferIds.add(offerId);
        }
      });
    }
  }

  const statsMap: any = {};
  offers.forEach((o: any) => {
    statsMap[o.id] = {
      total: totalByOffer.get(o.id) ?? 0,
      sent: sentByOffer.get(o.id) ?? 0,
      accepted: acceptedByOffer.get(o.id) ?? 0,
      hasApproved: approvedOfferIds.has(o.id),
      hasDelivered: deliveredOfferIds.has(o.id),
      acceptedAppId: acceptedAppIdByOffer.get(o.id) ?? null,
      acceptedProfile: acceptedProfileByOffer.get(o.id) ?? null,
      acceptedStudentId: acceptedStudentIdByOffer.get(o.id) ?? null,
      agreedStawka: agreedStawkaByOffer.get(o.id) ?? null,
      contractStatus: contractStatusByOffer.get(o.id) ?? null
    };
  });

  return (
    <main className="space-y-8 pb-12">
      {/* Header Section */}
      <div className="relative rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 px-8 py-12 text-white shadow-xl overflow-hidden mb-8">
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>

        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex flex-col md:flex-row items-center gap-6 text-center md:text-left">
            <div className="h-20 w-20 bg-white/10 backdrop-blur-xl rounded-2xl flex items-center justify-center border border-white/20 shadow-2xl group hover:scale-105 transition-transform duration-500">
              <svg className="h-10 w-10 text-indigo-300 drop-shadow-[0_0_8px_rgba(165,180,252,0.5)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              </svg>
            </div>
            <div>
              <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
                <span className="px-3 py-1 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-full text-xs font-bold uppercase tracking-wider backdrop-blur-md">
                  Panel Pracodawcy
                </span>
              </div>
              <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-white via-indigo-100 to-indigo-300 bg-clip-text text-transparent">
                Moje Ogłoszenia
              </h1>
              <p className="text-indigo-100/70 mt-2 max-w-xl text-lg font-medium">
                Zarządzaj swoimi ofertami pracy i projektami z jednego, eleganckiego miejsca.
              </p>
            </div>
          </div>

          <Button asChild size="lg" className="bg-white text-indigo-900 hover:bg-indigo-50 shadow-[0_0_20px_rgba(255,255,255,0.1)] transition-all hover:scale-105 active:scale-95 px-8 h-14 rounded-2xl font-bold">
            <Link href="/app/company/jobs/new">
              <span className="mr-2 text-xl">+</span> Dodaj Ogłoszenie
            </Link>
          </Button>
        </div>

        {/* Decorative elements */}
        <div className="absolute right-0 top-0 -mt-20 -mr-20 h-80 w-80 rounded-full bg-indigo-500/10 blur-[100px] pointer-events-none"></div>
        <div className="absolute left-1/4 bottom-0 -mb-20 h-60 w-60 rounded-full bg-violet-500/10 blur-[80px] pointer-events-none"></div>
      </div>

      {error && (
        <pre className="rounded-md border p-4 text-sm overflow-auto">
          {JSON.stringify(error, null, 2)}
        </pre>
      )}

      <OffersTabs
        jobs={jobs}
        systemServices={systemServices}
        studentServices={studentServices}
        statsMap={statsMap}
      />
    </main>
  );
}
