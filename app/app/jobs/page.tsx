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
  obligations?: string[] | null;
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
      location: offer.location ?? undefined,
      is_remote: offer.is_remote ?? undefined,
      contract_type: offer.contract_type ?? undefined,
      technologies: offer.technologies ?? undefined,
      typ: offer.typ ?? "micro",
      category: offer.kategoria ?? undefined,
      created_at: offer.created_at ?? new Date(0).toISOString(),
      is_platform_service: offer.is_platform_service ?? undefined,
      obligations: Array.isArray(offer.obligations) ? offer.obligations.join(", ") : undefined,
    };
  });

  return (
    <main className="pb-10">
      <div className="relative bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 py-16 text-white shadow-xl overflow-hidden border-b border-white/10 mb-12">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.18),transparent_55%)]" />

        <div className="relative z-10 mx-auto w-full max-w-[2000px] px-4 sm:px-6 lg:px-8 xl:px-12 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="max-w-3xl text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-2 mb-4">
              <span className="px-3 py-1 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-full text-xs font-bold uppercase tracking-wider backdrop-blur-md">
                Giełda zleceń i staży
              </span>
              <span className="px-3 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-full text-xs font-bold uppercase tracking-wider backdrop-blur-md">
                {totalOffersCount ?? offers.length} aktywnych ofert
              </span>
            </div>
            <h1 className="text-4xl md:text-6xl font-black mb-6 tracking-tight leading-none bg-gradient-to-r from-white via-indigo-100 to-indigo-300 bg-clip-text text-transparent">
              Kształtuj swoją <br className="hidden md:block" /> karierę już dziś.
            </h1>
            <p className="text-indigo-100/70 text-lg md:text-xl font-medium max-w-2xl leading-relaxed">
              Odkrywaj mikrozlecenia, staże i projekty systemowe dopasowane do Twoich umiejętności.
              Zdobądź doświadczenie, którego szukają pracodawcy.
            </p>
          </div>

          <div className="hidden lg:block relative shrink-0">
            <div className="w-64 h-64 bg-white/5 backdrop-blur-3xl rounded-3xl border border-white/10 shadow-2xl flex items-center justify-center group hover:scale-105 transition-transform duration-500 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 opacity-50" />
              <svg
                className="h-32 w-32 text-indigo-400 drop-shadow-[0_0_15px_rgba(165,180,252,0.4)] relative z-10"
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
            <div className="absolute -top-4 -left-4 bg-emerald-500/90 backdrop-blur-md text-white px-4 py-2 rounded-xl text-xs font-bold shadow-xl animate-bounce">
              Nowe oferty!
            </div>
          </div>
        </div>

        <div className="absolute right-0 top-0 -mt-20 -mr-20 h-[500px] w-[500px] rounded-full bg-indigo-500/10 blur-[120px] pointer-events-none" />
        <div className="absolute left-1/4 bottom-0 -mb-20 h-64 w-64 rounded-full bg-violet-600/10 blur-[100px] pointer-events-none" />
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
