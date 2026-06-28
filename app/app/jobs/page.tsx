import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { JobBoardView } from "./job-board-view";
import type { JobOffer } from "./job-card";
import { PageContainer } from "@/components/ui/page-container";
import { getRequestContext } from "@/lib/auth/request-context";

export const dynamic = "force-dynamic";
const JOBS_PAGE_SIZE = 24;

type OfferQueryRow = {
  id: string;
  tytul: string | null;
  typ: string | null;
  opis: string | null;
  stawka: number | null;
  status: string | null;
  created_at: string | null;
  kategoria: string | null;
  location: string | null;
  contract_type: string | null;
  technologies: string[] | null;
  is_remote: boolean | null;
  company_id: string | null;
  is_platform_service: boolean | null;
  salary_range_min: number | null;
  salary_range_max: number | null;
  obligations?: string | string[] | null;
};

type UserApplicationRow = {
  offer_id: string | null;
};

type LockedApplicationRow = {
  offer_id: string | null;
};

export default async function JobsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedSearchParams = await searchParams;
  const pageParam = Array.isArray(resolvedSearchParams.page)
    ? resolvedSearchParams.page[0]
    : resolvedSearchParams.page;
  const currentPage = Math.max(1, Number.parseInt(pageParam ?? "1", 10) || 1);

  const supabase = await createClient();
  const { user, role } = await getRequestContext();
  if (!user) redirect("/auth");

  if (role === "company") {
    redirect("/app/company/packages");
  }

  const pageStart = (currentPage - 1) * JOBS_PAGE_SIZE;
  const pageEnd = pageStart + JOBS_PAGE_SIZE - 1;

  const [offersCountResult, offersResult, userApplicationsResult] = await Promise.all([
    supabase
      .from("offers")
      .select("id", { count: "exact", head: true })
      .eq("status", "published"),
    supabase
      .from("offers")
      .select(`
        id, tytul, opis, typ, stawka, status, created_at, kategoria,
        location, contract_type, technologies, is_remote, company_id, is_platform_service,
        salary_range_min, salary_range_max, obligations
      `)
      .eq("status", "published")
      .order("created_at", { ascending: false })
      .range(pageStart, pageEnd),
    supabase
      .from("applications")
      .select("offer_id")
      .eq("student_id", user.id),
  ]);

  const totalOffersCount = offersCountResult.count;
  const { data: offersData, error } = offersResult;

  if (error) {
    console.error("Error fetching job offers:", error);
  }

  const offerRows = (offersData || []) as OfferQueryRow[];
  const companyIds = Array.from(new Set(offerRows.map((offer) => offer.company_id).filter((id): id is string => Boolean(id))));
  const offerIds = offerRows.map((offer) => offer.id);
  const [companyProfilesResult, lockedApplicationsResult] = await Promise.all([
    companyIds.length > 0
      ? supabase
        .from("company_public_profiles")
        .select("user_id, nazwa, logo_url")
        .in("user_id", companyIds)
      : Promise.resolve({ data: [] }),
    offerIds.length > 0
      ? supabase
        .from("applications")
        .select("offer_id")
        .in("offer_id", offerIds)
        .in("status", ["accepted", "in_progress", "completed"])
      : Promise.resolve({ data: [] }),
  ]);
  const companyProfiles = companyProfilesResult.data;
  const companyProfileMap = new Map(
    ((companyProfiles ?? []) as Array<{ user_id: string; nazwa?: string | null; logo_url?: string | null }>)
      .map((profile) => [profile.user_id, profile]),
  );
  const lockedOfferIds = new Set<string>();
  ((lockedApplicationsResult.data || []) as LockedApplicationRow[]).forEach((application) => {
    if (application.offer_id) lockedOfferIds.add(application.offer_id);
  });

  const userApps = userApplicationsResult.data;

  const appliedOfferIds = new Set(
    ((userApps || []) as UserApplicationRow[])
      .map((application) => application.offer_id)
      .filter((offerId): offerId is string => Boolean(offerId)),
  );

  const visibleOfferRows = offerRows.filter((offer) => {
    if (offer.is_platform_service === true) return true;
    return !lockedOfferIds.has(offer.id);
  });

  const visibleTotalOffersCount =
    totalOffersCount == null
      ? visibleOfferRows.length
      : Math.max(visibleOfferRows.length, totalOffersCount - lockedOfferIds.size);

  const offers: JobOffer[] = visibleOfferRows.map((offer) => {
    const companyProfile = offer.company_id ? companyProfileMap.get(offer.company_id) : null;

    return {
      id: offer.id,
      tytul: offer.tytul ?? "Oferta bez tytułu",
      company_id: offer.company_id ?? "",
      company_name: companyProfile?.nazwa || "Firma",
      company_logo: companyProfile?.logo_url ?? undefined,
      stawka: offer.stawka ?? undefined,
      salary_range_min: offer.salary_range_min ?? undefined,
      salary_range_max: offer.salary_range_max ?? undefined,
      opis: offer.opis ?? undefined,
      location: offer.location ?? undefined,
      is_remote: offer.is_remote ?? undefined,
      contract_type: offer.contract_type ?? undefined,
      technologies: offer.technologies ?? undefined,
      typ: offer.typ ?? "micro",
      category: offer.kategoria ?? undefined,
      created_at: offer.created_at ?? new Date(0).toISOString(),
      is_platform_service: offer.is_platform_service ?? undefined,
      obligations: Array.isArray(offer.obligations) ? offer.obligations.join(", ") : offer.obligations ?? undefined,
    };
  });

  return (
    <main className="pb-10">
      <div className="relative mb-7 overflow-hidden border-b border-[#243869] bg-[#10245f] pb-24 pt-8 text-white shadow-sm sm:mb-8 sm:py-14">
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(12,30,82,0.95),rgba(18,45,111,0.92))]" />

        <div className="relative z-10 mx-auto flex w-full max-w-[1380px] flex-col items-start justify-between gap-8 px-4 sm:px-6 md:flex-row md:items-center lg:px-8">
          <div className="max-w-2xl text-left">
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-extrabold uppercase tracking-normal text-indigo-100 backdrop-blur-md">
                Giełda zleceń i staży
              </span>
              <span className="rounded-full bg-lime-300 px-3 py-1 text-xs font-extrabold uppercase tracking-normal text-[#0b1b47]">
                {totalOffersCount ?? offers.length} aktywnych ofert
              </span>
            </div>
            <h1 className="mb-5 text-4xl font-black leading-[0.98] tracking-normal text-white sm:text-5xl md:text-6xl">
              Kształtuj swoją <br className="hidden md:block" /> karierę już dziś.
            </h1>
            <p className="max-w-[32rem] text-[13px] font-semibold leading-5 text-indigo-100/82 sm:text-base sm:leading-6">
              Odkrywaj mikrozlecenia, staże i projekty systemowe dopasowane do Twoich umiejętności.
              Zdobądź doświadczenie, którego szukają pracodawcy.
            </p>
          </div>

          <div className="hidden lg:block relative shrink-0">
            <div className="flex h-56 w-56 items-center justify-center overflow-hidden rounded-3xl border border-white/10 bg-white/10 shadow-sm backdrop-blur-3xl transition-transform duration-300 group hover:scale-[1.02]">
              <svg
                className="relative z-10 h-28 w-28 text-indigo-300"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
                />
              </svg>
            </div>
            <div className="absolute -left-4 -top-4 rounded-full bg-emerald-400 px-4 py-2 text-xs font-extrabold text-white shadow-sm">
              Nowe oferty!
            </div>
          </div>
        </div>

      </div>

      <PageContainer>
        <JobBoardView
          initialOffers={offers}
          appliedOfferIds={appliedOfferIds}
          totalOffersCount={visibleTotalOffersCount}
          currentPage={currentPage}
        />
      </PageContainer>
    </main>
  );
}
