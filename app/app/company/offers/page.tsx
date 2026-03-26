import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { PremiumPageHeader } from "@/components/ui/premium-page-header";
import { PageContainer } from "@/components/ui/page-container";
import OffersTabs from "./offers-tabs";
import { CheckCircle2 } from "lucide-react";

export const dynamic = "force-dynamic";

type OfferRow = {
  id: string;
  tytul: string | null;
  typ: string | null;
  stawka: number | null;
  status: string | null;
  created_at: string | null;
  location: string | null;
  salary_range_min: number | null;
  salary_range_max: number | null;
  is_remote: boolean | null;
  contract_type: string | null;
  is_platform_service: boolean | null;
};

type ServiceOrderRow = {
  id: string;
  created_at: string | null;
  status: string | null;
  amount: number | null;
  package: unknown;
};

type ContractRelation = { terms_status: string | null } | { terms_status: string | null }[] | null;

type ApplicationRow = {
  id: string;
  offer_id: string;
  status: string;
  student_id: string | null;
  agreed_stawka: number | null;
  agreed_stawka_minor: number | null;
  contracts: ContractRelation;
};

type StudentProfileRow = {
  user_id: string;
  public_name: string | null;
};

type DeliverableRow = {
  application_id: string | null;
  status: string;
};

type AcceptedProfile = {
  first_name: string;
  last_name: string;
  id: string;
};

type OfferStats = {
  total: number;
  sent: number;
  accepted: number;
  hasApproved: boolean;
  hasDelivered: boolean;
  acceptedAppId: string | null;
  acceptedProfile: AcceptedProfile | null;
  acceptedStudentId: string | null;
  agreedStawka: number | null;
  contractStatus: string | null;
};

function fromMinorUnits(value: number | null | undefined) {
  if (value == null || !Number.isFinite(value)) return null;
  return value / 100;
}

export default async function CompanyOffersPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const supabase = await createClient();
  const resolvedSearchParams = (await searchParams) ?? {};
  const createdParam = Array.isArray(resolvedSearchParams.created)
    ? resolvedSearchParams.created[0]
    : resolvedSearchParams.created;
  const offerCreated = createdParam === "1";

  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) redirect("/auth");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("user_id", user.id)
    .single();

  if (profile?.role !== "company") redirect("/app");

  const { data: allOffers, error } = await supabase
    .from("offers")
    .select("id, tytul, typ, stawka, status, created_at, location, salary_range_min, salary_range_max, is_remote, contract_type, is_platform_service")
    .eq("company_id", user.id)
    .order("created_at", { ascending: false });

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

  const offers = (allOffers ?? []) as OfferRow[];
  const jobs = offers.filter((offer) => offer.is_platform_service !== true);
  const systemServices = offers.filter((offer) => offer.is_platform_service === true);
  const studentServices = (serviceOrders ?? []) as ServiceOrderRow[];

  const offerIds = offers.map((offer) => offer.id);

  const totalByOffer = new Map<string, number>();
  const sentByOffer = new Map<string, number>();
  const acceptedByOffer = new Map<string, number>();
  const acceptedProfileByOffer = new Map<string, { first_name: string; last_name: string; id: string }>();
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
      .select("id, offer_id, status, student_id, agreed_stawka, agreed_stawka_minor, contracts:contracts!application_id(terms_status)")
      .in("offer_id", offerIds);

    const applicationRows = (apps ?? []) as ApplicationRow[];

    applicationRows.forEach((application) => {
      if ((application.status === "accepted" || application.status === "in_progress") && application.student_id) {
        studentIds.push(application.student_id);
      }
    });

    const profilesMap = new Map<string, AcceptedProfile>();
    if (studentIds.length > 0) {
      const { data: profiles } = await supabase
        .from("student_profiles")
        .select("user_id, public_name")
        .in("user_id", studentIds);

      ((profiles ?? []) as StudentProfileRow[]).forEach((profileRow) => {
        profilesMap.set(profileRow.user_id, {
          id: profileRow.user_id,
          first_name: profileRow.public_name ?? "Użytkownik",
          last_name: "",
        });
      });
    }

    applicationRows.forEach((application) => {
      appIds.push(application.id);
      appIdToOfferId.set(application.id, application.offer_id);

      totalByOffer.set(application.offer_id, (totalByOffer.get(application.offer_id) ?? 0) + 1);
      if (application.status === "sent") {
        sentByOffer.set(application.offer_id, (sentByOffer.get(application.offer_id) ?? 0) + 1);
      }

      if (application.status === "accepted" || application.status === "in_progress") {
        acceptedByOffer.set(application.offer_id, (acceptedByOffer.get(application.offer_id) ?? 0) + 1);
        if (!acceptedAppIdByOffer.has(application.offer_id)) {
          acceptedAppIdByOffer.set(application.offer_id, application.id);
          agreedStawkaByOffer.set(
            application.offer_id,
            application.agreed_stawka ?? fromMinorUnits(application.agreed_stawka_minor),
          );

          const contract = Array.isArray(application.contracts) ? application.contracts[0] : application.contracts;
          if (contract) {
            contractStatusByOffer.set(application.offer_id, contract.terms_status);
          }

          if (application.student_id) {
            acceptedStudentIdByOffer.set(application.offer_id, application.student_id);
          }
          if (application.student_id && profilesMap.has(application.student_id)) {
            const acceptedProfile = profilesMap.get(application.student_id);
            if (acceptedProfile) {
              acceptedProfileByOffer.set(application.offer_id, acceptedProfile);
            }
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

      ((delivs ?? []) as DeliverableRow[]).forEach((deliverable) => {
        const offerId = appIdToOfferId.get(deliverable.application_id ?? "");
        if (offerId) {
          if (deliverable.status === "approved") approvedOfferIds.add(offerId);
          if (deliverable.status === "pending") deliveredOfferIds.add(offerId);
        }
      });
    }
  }

  const statsMap: Record<string, OfferStats> = {};
  offers.forEach((offer) => {
    statsMap[offer.id] = {
      total: totalByOffer.get(offer.id) ?? 0,
      sent: sentByOffer.get(offer.id) ?? 0,
      accepted: acceptedByOffer.get(offer.id) ?? 0,
      hasApproved: approvedOfferIds.has(offer.id),
      hasDelivered: deliveredOfferIds.has(offer.id),
      acceptedAppId: acceptedAppIdByOffer.get(offer.id) ?? null,
      acceptedProfile: acceptedProfileByOffer.get(offer.id) ?? null,
      acceptedStudentId: acceptedStudentIdByOffer.get(offer.id) ?? null,
      agreedStawka: agreedStawkaByOffer.get(offer.id) ?? null,
      contractStatus: contractStatusByOffer.get(offer.id) ?? null,
    };
  });

  return (
    <main className="space-y-8 pb-12">
      <PremiumPageHeader
        badge="Panel Pracodawcy"
        title="Moje ogłoszenia"
        description="Zarządzaj swoimi ofertami pracy i projektami z jednego, eleganckiego miejsca."
        icon={
          <svg className="h-10 w-10 text-indigo-300 drop-shadow-[0_0_8px_rgba(165,180,252,0.5)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
          </svg>
        }
        actions={
          <Button asChild size="lg" className="bg-white text-indigo-900 hover:bg-indigo-50 shadow-[0_0_20px_rgba(255,255,255,0.1)] transition-all hover:scale-105 active:scale-95 px-8 h-14 rounded-2xl font-bold">
            <Link href="/app/company/jobs/new">
              <span className="mr-2 text-xl">+</span> Dodaj ogłoszenie
            </Link>
          </Button>
        }
      />

      <PageContainer className="pb-12">
        {offerCreated ? (
          <div className="mb-8 rounded-[2rem] border border-emerald-200 bg-emerald-50 px-6 py-5 text-emerald-950 shadow-lg shadow-emerald-500/10">
            <div className="flex items-start gap-4">
              <div className="rounded-2xl bg-white p-2 text-emerald-600 shadow-sm">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-600">
                  Oferta opublikowana
                </p>
                <h2 className="text-lg font-black">Nowe ogłoszenie jest już widoczne na Twojej liście.</h2>
                <p className="text-sm font-medium text-emerald-800/80">
                  Możesz teraz przejrzeć zgłoszenia, edytować ofertę albo dodać kolejne ogłoszenie.
                </p>
              </div>
            </div>
          </div>
        ) : null}

        {error ? (
          <pre className="rounded-md border p-4 text-sm overflow-auto mb-8 bg-white/50 backdrop-blur-sm border-white/20 shadow-inner">
            {JSON.stringify(error, null, 2)}
          </pre>
        ) : null}

        <OffersTabs
          jobs={jobs}
          systemServices={systemServices}
          studentServices={studentServices}
          statsMap={statsMap}
        />
      </PageContainer>
    </main>
  );
}
