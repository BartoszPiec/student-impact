import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  BarChart3,
  Briefcase,
  ChevronRight,
  Clock3,
  FileText,
  ImageIcon,
  Megaphone,
  PenLine,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Users,
  Video,
} from "lucide-react";

import { CompanyLightHero, CompanyPanel, CompanyPill, CompanyStatCard } from "../_components/company-dashboard-ui";
import { PageContainer } from "@/components/ui/page-container";
import { getRequestContext } from "@/lib/auth/request-context";
import { isActiveSystemServicePackage } from "@/lib/services/system-services";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type ServicePackageRow = {
  id: string;
  title: string;
  description: string | null;
  price: number | null;
  delivery_time_days: number | null;
  student_id: string | null;
  type: string | null;
  category: string | null;
  created_at: string;
  student: { user_id: string; public_name: string | null } | { user_id: string; public_name: string | null }[] | null;
};

type StudentMetrics = {
  score: number;
  avgRating: number;
  completedProjects: number;
  tags: string[];
};

type RankedServicePackage = ServicePackageRow & StudentMetrics;

type SearchParams = {
  category?: string;
  success?: string;
  type?: string;
  search?: string;
  sort?: string;
  min?: string;
  max?: string;
};

const categories = [
  { id: "all", label: "Wszystkie" },
  { id: "grafika", label: "Grafika & Design" },
  { id: "video", label: "Video & Multimedia" },
  { id: "it", label: "IT & Programowanie" },
  { id: "content", label: "Content & Copywriting" },
  { id: "marketing", label: "Marketing & Social" },
  { id: "analiza", label: "Analiza danych" },
  { id: "tlumaczenia", label: "Tlumaczenia" },
];

const serviceVisuals = [
  {
    gradient: "from-violet-500 to-fuchsia-500",
    iconBg: "bg-white/18",
    icon: ImageIcon,
  },
  {
    gradient: "from-blue-500 to-indigo-500",
    iconBg: "bg-white/18",
    icon: BarChart3,
  },
  {
    gradient: "from-cyan-500 to-sky-500",
    iconBg: "bg-white/18",
    icon: PenLine,
  },
  {
    gradient: "from-pink-500 to-rose-500",
    iconBg: "bg-white/18",
    icon: Megaphone,
  },
  {
    gradient: "from-orange-500 to-amber-500",
    iconBg: "bg-white/18",
    icon: FileText,
  },
  {
    gradient: "from-teal-500 to-emerald-500",
    iconBg: "bg-white/18",
    icon: Video,
  },
];

function stripMarkdown(text: string | null | undefined): string {
  if (!text) return "";
  return text
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/\*(.+?)\*/g, "$1")
    .replace(/`(.+?)`/g, "$1")
    .replace(/\[(.+?)\]\(.+?\)/g, "$1")
    .replace(/^[-*+]\s+/gm, "")
    .replace(/^>\s+/gm, "")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeText(value: string | null | undefined) {
  return (value ?? "")
    .toLocaleLowerCase("pl-PL")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function categoryMatches(pkg: ServicePackageRow, activeCategory: string) {
  if (activeCategory === "all") return true;

  const source = normalizeText(`${pkg.category ?? ""} ${pkg.title}`);
  if (activeCategory === "grafika") return source.includes("graf") || source.includes("design");
  if (activeCategory === "video") return source.includes("video") || source.includes("wideo") || source.includes("reels");
  if (activeCategory === "it") return source.includes("it") || source.includes("program") || source.includes("web") || source.includes("code");
  if (activeCategory === "content") return source.includes("copy") || source.includes("tekst") || source.includes("content");
  if (activeCategory === "marketing") return source.includes("market") || source.includes("social") || source.includes("reklam");
  if (activeCategory === "analiza") return source.includes("analiz") || source.includes("dane");
  if (activeCategory === "tlumaczenia") return source.includes("tlumacz") || source.includes("jezyk");

  return source.includes(activeCategory);
}

function formatPrice(value: number | null | undefined) {
  if (value == null || !Number.isFinite(value)) return "Do wyceny";
  return `${Number(value).toLocaleString("pl-PL")} zl`;
}

function getStudentName(pkg: ServicePackageRow) {
  const student = Array.isArray(pkg.student) ? pkg.student[0] : pkg.student;
  return student?.public_name || "Student2Work";
}

function buildHref(params: URLSearchParams, updates: Record<string, string | null>) {
  const next = new URLSearchParams(params);
  Object.entries(updates).forEach(([key, value]) => {
    if (!value || value === "all") {
      next.delete(key);
    } else {
      next.set(key, value);
    }
  });

  const query = next.toString();
  return query ? `/app/company/packages?${query}` : "/app/company/packages";
}

function sortPackages<T extends ServicePackageRow & Partial<StudentMetrics>>(items: T[], sort: string): T[] {
  return [...items].sort((a, b) => {
    if (sort === "price_asc") return Number(a.price ?? 0) - Number(b.price ?? 0);
    if (sort === "price_desc") return Number(b.price ?? 0) - Number(a.price ?? 0);
    if (sort === "newest") return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    return Number(b.score ?? 0) - Number(a.score ?? 0);
  });
}

function parsePrice(value: string | undefined) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

function ServiceCard({
  pkg,
  index,
  type,
}: {
  pkg: RankedServicePackage | ServicePackageRow;
  index: number;
  type: "platform" | "student";
}) {
  const visual = serviceVisuals[index % serviceVisuals.length];
  const Icon = visual.icon;
  const description = stripMarkdown(pkg.description).slice(0, 126);
  const href = type === "platform" ? `/app/company/packages/${pkg.id}` : `/app/orders/create/${pkg.id}`;
  const category = pkg.category || (type === "platform" ? "Systemowa" : "Student");

  return (
    <article className="group flex min-h-[260px] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-lg">
      <div className={cn("relative h-20 bg-gradient-to-br px-4 py-4 text-white", visual.gradient)}>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_85%_20%,rgba(255,255,255,0.24),transparent_32%)]" />
        <div className="relative flex items-start justify-between">
          <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl", visual.iconBg)}>
            <Icon className="h-5 w-5" />
          </div>
          <span className="rounded-full bg-white/20 px-2.5 py-1 text-[10px] font-extrabold uppercase text-white">
            {type === "platform" ? "Systemowa" : "Student"}
          </span>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <div className="mb-2 flex flex-wrap gap-1.5">
          <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-extrabold uppercase text-slate-600">
            {category}
          </span>
          {type === "student" && "avgRating" in pkg && pkg.avgRating > 0 ? (
            <span className="rounded-full bg-amber-50 px-2 py-1 text-[10px] font-extrabold text-amber-700">
              {pkg.avgRating.toFixed(1)} / 5
            </span>
          ) : null}
        </div>
        <h2 className="text-base font-extrabold leading-snug text-[#10245f]">
          <Link href={href} className="transition hover:text-indigo-700">
            {pkg.title}
          </Link>
        </h2>
        <p className="mt-2 line-clamp-2 text-sm font-medium leading-5 text-slate-500">
          {description || (type === "platform" ? "Gotowy pakiet uslugi z jasnym zakresem i stala cena." : "Oferta wykonawcy z katalogu studentow.")}
        </p>

        <div className="mt-auto flex items-end justify-between gap-3 pt-5">
          <div>
            <div className="text-[10px] font-extrabold uppercase text-slate-400">
              {type === "platform" ? "Stala cena" : getStudentName(pkg)}
            </div>
            <div className="mt-1 text-base font-extrabold text-[#10245f]">
              od {formatPrice(pkg.price)}
            </div>
          </div>
          <Link
            href={href}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-50 text-[#10245f] transition group-hover:bg-lime-200"
            aria-label={`Otworz ${pkg.title}`}
          >
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </article>
  );
}

export default async function CompanyPackagesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const { user, role } = await getRequestContext();

  if (!user) redirect("/auth");
  if (role !== "company") redirect("/app");

  const { data: servicePackages, error: packagesError } = await supabase
    .from("service_packages")
    .select(`
      *,
      student:student_profiles (
        user_id,
        public_name
      )
    `)
    .eq("status", "active")
    .order("created_at", { ascending: false });

  if (packagesError) {
    console.error("Error fetching packages:", packagesError);
  }

  const packages = (servicePackages ?? []) as ServicePackageRow[];
  const studentIds = Array.from(new Set(packages.map((pkg) => pkg.student_id).filter((id): id is string => Boolean(id))));

  const [reviewsResult, applicationsResult] = await Promise.all([
    studentIds.length > 0
      ? supabase.from("reviews").select("rating, reviewee_id").in("reviewee_id", studentIds)
      : Promise.resolve({ data: [] as Array<{ rating: number | null; reviewee_id: string | null }> }),
    studentIds.length > 0
      ? supabase.from("applications").select("student_id").in("student_id", studentIds).eq("status", "completed")
      : Promise.resolve({ data: [] as Array<{ student_id: string | null }> }),
  ]);

  const ratingsByStudent = new Map<string, { sum: number; count: number }>();
  for (const review of reviewsResult.data ?? []) {
    if (!review.reviewee_id) continue;
    const current = ratingsByStudent.get(review.reviewee_id) ?? { sum: 0, count: 0 };
    current.sum += Number(review.rating) || 0;
    current.count += 1;
    ratingsByStudent.set(review.reviewee_id, current);
  }

  const completedByStudent = new Map<string, number>();
  for (const application of applicationsResult.data ?? []) {
    if (!application.student_id) continue;
    completedByStudent.set(application.student_id, (completedByStudent.get(application.student_id) ?? 0) + 1);
  }

  const getStudentMetrics = (studentId: string | null): StudentMetrics => {
    if (!studentId) return { score: 0, avgRating: 0, completedProjects: 0, tags: [] };
    const ratings = ratingsByStudent.get(studentId);
    const completedProjects = completedByStudent.get(studentId) ?? 0;
    const avgRating = ratings?.count ? ratings.sum / ratings.count : 0;
    const tags: string[] = [];

    if (avgRating >= 4.5 && completedProjects >= 3) tags.push("Top Talent");
    if (completedProjects >= 1) tags.push("Szybki Start");

    return {
      score: completedProjects * 2 + avgRating,
      avgRating,
      completedProjects,
      tags,
    };
  };

  const activeType = params.type === "student" ? "student" : "platform";
  const activeCategory = params.category || "all";
  const searchQuery = normalizeText(params.search);
  const sortOrder = params.sort || "recommended";
  const minPrice = parsePrice(params.min);
  const maxPrice = parsePrice(params.max);

  const matchesFilters = (pkg: ServicePackageRow) => {
    const searchable = normalizeText(`${pkg.title} ${pkg.description ?? ""}`);
    const price = Number(pkg.price ?? 0);

    if (!categoryMatches(pkg, activeCategory)) return false;
    if (searchQuery && !searchable.includes(searchQuery)) return false;
    if (minPrice != null && price < minPrice) return false;
    if (maxPrice != null && price > maxPrice) return false;

    return true;
  };

  const allPlatformServices = packages.filter((pkg) => isActiveSystemServicePackage(pkg));
  const allStudentServices = packages.filter((pkg) => !isActiveSystemServicePackage(pkg));
  const platformServices = sortPackages(allPlatformServices.filter(matchesFilters), sortOrder);
  const studentServices = sortPackages(
    allStudentServices.filter(matchesFilters).map((pkg) => ({ ...pkg, ...getStudentMetrics(pkg.student_id) })),
    sortOrder,
  );

  const visibleServices = activeType === "platform" ? platformServices : studentServices;
  const shownCount = visibleServices.length;
  const urlParams = new URLSearchParams();
  if (activeType !== "platform") urlParams.set("type", activeType);
  if (activeCategory !== "all") urlParams.set("category", activeCategory);
  if (params.search) urlParams.set("search", params.search);
  if (sortOrder !== "recommended") urlParams.set("sort", sortOrder);
  if (params.min) urlParams.set("min", params.min);
  if (params.max) urlParams.set("max", params.max);

  return (
    <main className="min-h-screen bg-[#f3f6fb] pb-16">
      <CompanyLightHero
        title="Deleguj zadania i rozwijaj firme bez zatrudniania."
        description="Gotowe pakiety w stalej cenie, realizowane przez zweryfikowanych studentow pod kontrola jakosci. Placisz dopiero po akceptacji efektu."
      >
        <div className="mt-6 grid gap-3 sm:grid-cols-3 lg:max-w-xl">
          <CompanyStatCard icon={Briefcase} value={allPlatformServices.length} label="uslug systemowych" tone="lime" />
          <CompanyStatCard icon={Clock3} value="24 h" label="sredni start realizacji" tone="blue" />
          <CompanyStatCard icon={ShieldCheck} value="15%" label="prowizja platformy" tone="emerald" />
        </div>
      </CompanyLightHero>

      <PageContainer className="py-6">
        {params.success === "inquiry_sent" ? (
          <div className="mb-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
            Zapytanie zostalo wyslane. Status znajdziesz w zakladce Wiadomosci.
          </div>
        ) : null}

        <CompanyPanel className="mb-5 overflow-hidden bg-lime-50/70 p-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-lime-200 bg-white text-[#10245f]">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-sm font-extrabold text-[#10245f]">Gwarancja Jakosci Student2Work</h2>
                <span className="rounded-full bg-amber-100 px-2 py-1 text-[10px] font-extrabold uppercase text-amber-700">
                  Standard Pro
                </span>
              </div>
              <p className="mt-1 text-sm font-medium leading-5 text-slate-600">
                Cena stala i nienegocjowalna, proces ustandaryzowany, wykonawcy zweryfikowani. Ty zamawiasz efekt, my dbamy o reszte.
              </p>
            </div>
          </div>
        </CompanyPanel>

        <div className="grid gap-5 lg:grid-cols-[280px_minmax(0,1fr)]">
          <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
            <CompanyPanel className="p-3">
              <div className="mb-3 px-1 text-[10px] font-extrabold uppercase text-slate-500">Zrodlo ofert</div>
              <div className="space-y-2">
                <Link
                  href={buildHref(urlParams, { type: "platform" })}
                  className={cn(
                    "flex items-center gap-3 rounded-xl border px-3 py-3 text-sm font-extrabold transition",
                    activeType === "platform" ? "border-lime-300 bg-lime-200 text-[#10245f]" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50",
                  )}
                >
                  <ShieldCheck className="h-4 w-4" />
                  <span className="flex-1">Oferty systemowe</span>
                  <span className="text-xs">{allPlatformServices.length}</span>
                </Link>
                <Link
                  href={buildHref(urlParams, { type: "student" })}
                  className={cn(
                    "flex items-center gap-3 rounded-xl border px-3 py-3 text-sm font-extrabold transition",
                    activeType === "student" ? "border-lime-300 bg-lime-200 text-[#10245f]" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50",
                  )}
                >
                  <Users className="h-4 w-4" />
                  <span className="flex-1">Uslugi od studentow</span>
                  <span className="text-xs">{allStudentServices.length}</span>
                </Link>
              </div>
            </CompanyPanel>

            <CompanyPanel className="p-4">
              <div className="mb-4 flex items-center gap-2 text-[10px] font-extrabold uppercase text-slate-500">
                <SlidersHorizontal className="h-3.5 w-3.5" />
                Filtry
              </div>
              <form className="space-y-4" action="/app/company/packages">
                <input type="hidden" name="type" value={activeType} />
                <div>
                  <label className="mb-1 block text-[10px] font-extrabold uppercase text-slate-500" htmlFor="service-search">
                    Szukaj uslugi
                  </label>
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      id="service-search"
                      name="search"
                      defaultValue={params.search ?? ""}
                      placeholder="np. logo, montaz, social..."
                      className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-lime-300 focus:bg-white"
                    />
                  </div>
                </div>

                <div>
                  <div className="mb-2 text-[10px] font-extrabold uppercase text-slate-500">Kategoria</div>
                  <div className="space-y-1.5">
                    {categories.map((category) => (
                      <label key={category.id} className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-slate-600">
                        <input
                          type="radio"
                          name="category"
                          value={category.id}
                          defaultChecked={activeCategory === category.id}
                          className="h-3.5 w-3.5 accent-[#10245f]"
                        />
                        {category.label}
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="mb-2 text-[10px] font-extrabold uppercase text-slate-500">Cena (PLN)</div>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      name="min"
                      inputMode="numeric"
                      defaultValue={params.min ?? ""}
                      placeholder="Od"
                      className="h-10 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-semibold outline-none focus:border-lime-300 focus:bg-white"
                    />
                    <input
                      name="max"
                      inputMode="numeric"
                      defaultValue={params.max ?? ""}
                      placeholder="Do"
                      className="h-10 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-semibold outline-none focus:border-lime-300 focus:bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-[10px] font-extrabold uppercase text-slate-500" htmlFor="service-sort">
                    Sortowanie
                  </label>
                  <select
                    id="service-sort"
                    name="sort"
                    defaultValue={sortOrder}
                    className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-extrabold text-slate-700 outline-none focus:border-lime-300"
                  >
                    <option value="recommended">Polecane</option>
                    <option value="price_asc">Cena rosnaco</option>
                    <option value="price_desc">Cena malejaco</option>
                    <option value="newest">Najnowsze</option>
                  </select>
                </div>

                <button
                  type="submit"
                  className="flex h-10 w-full items-center justify-center rounded-xl bg-[#10245f] text-sm font-extrabold text-white transition hover:bg-[#0b1b47]"
                >
                  Zastosuj filtry
                </button>
                <Link
                  href={`/app/company/packages${activeType === "student" ? "?type=student" : ""}`}
                  className="flex h-10 w-full items-center justify-center rounded-xl border border-slate-200 bg-white text-sm font-extrabold text-slate-600 transition hover:bg-slate-50"
                >
                  Wyczysc filtry
                </Link>
              </form>
            </CompanyPanel>
          </aside>

          <section className="min-w-0 space-y-4">
            <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap items-center gap-2">
                <CompanyPill active tone="lime">
                  {activeType === "platform" ? "Oferty systemowe" : "Uslugi studentow"}
                </CompanyPill>
                <span className="text-xs font-bold text-slate-500">
                  Pokazano {shownCount} z {activeType === "platform" ? allPlatformServices.length : allStudentServices.length} uslug
                </span>
              </div>
              <span className="text-[10px] font-extrabold uppercase text-slate-500">
                Sortowanie: {sortOrder === "recommended" ? "Polecane" : sortOrder.replace("_", " ")}
              </span>
            </div>

            {visibleServices.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {visibleServices.map((pkg, index) => (
                  <ServiceCard key={pkg.id} pkg={pkg} index={index} type={activeType} />
                ))}
              </div>
            ) : (
              <CompanyPanel className="p-8 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-lime-100 text-[#10245f]">
                  <Search className="h-7 w-7" />
                </div>
                <h2 className="mt-4 text-lg font-extrabold text-[#10245f]">Brak uslug w tym widoku</h2>
                <p className="mx-auto mt-2 max-w-md text-sm font-medium leading-6 text-slate-500">
                  Zmien filtry albo wyczysc wyszukiwanie, aby zobaczyc inne pakiety.
                </p>
              </CompanyPanel>
            )}

            <CompanyPanel className="overflow-hidden bg-[#10245f] p-4 text-white">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-lime-300 text-[#10245f]">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="font-extrabold">Masz nietypowe zadanie?</h2>
                    <p className="mt-1 text-sm font-semibold text-white/70">
                      Opisz wyzwanie, dobierzemy wykonawce i przygotujemy wycene.
                    </p>
                  </div>
                </div>
                <Link
                  href="/app/company/challenges/new"
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-lime-300 px-4 text-sm font-extrabold text-[#10245f] transition hover:bg-lime-200"
                >
                  Zglos wyzwanie
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </div>
            </CompanyPanel>
          </section>
        </div>
      </PageContainer>
    </main>
  );
}
