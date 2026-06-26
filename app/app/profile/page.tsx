import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { Building, MapPin, User, Globe, Linkedin, Star, CheckCircle, Wallet, GraduationCap, Edit, Share2, FileText } from "lucide-react";
import { saveCompanyProfile, saveStudentProfile } from "./_actions";
import ExperienceSection from "./experience-section";
import ReviewsSection from "./reviews-section";
import EducationSection, { type EducationEntry } from "./education-section";
import SkillsInput from "./skills-input";
import { Progress } from "@/components/ui/progress";
import TaxDataSection from "./tax-data-section";
import { StripeOnboardingButton } from "./stripe-onboarding-button";
import { getRequestContext } from "@/lib/auth/request-context";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

type ProfilePageSearchParams = Record<string, string | string[] | undefined>;

type ProfileStats = {
  projectsCount?: number;
  reviewsCount?: number;
  avg?: number | null;
  published?: number;
  appsTotal?: number;
};

export default async function ProfilePage({
  searchParams,
}: {
  searchParams?: Promise<ProfilePageSearchParams>;
}) {
  const supabase = await createClient();
  const resolvedSearchParams = (await searchParams) ?? {};
  const savedParam = Array.isArray(resolvedSearchParams.saved)
    ? resolvedSearchParams.saved[0]
    : resolvedSearchParams.saved;
  const savedProfileType = savedParam === "student" || savedParam === "company" ? savedParam : null;

  const { user, role } = await getRequestContext();
  if (!user) redirect("/auth");

  if (!role) {
    return (
      <main className="space-y-4 p-8">
        <div className="bg-red-50 text-red-600 p-4 rounded-xl">Błąd profilu: Brak roli użytkownika.</div>
      </main>
    );
  }

  const metadata = user.user_metadata as { full_name?: unknown; name?: unknown };
  const displayName =
    (typeof metadata.full_name === "string" ? metadata.full_name : null) ||
    (typeof metadata.name === "string" ? metadata.name : null) ||
    user.email ||
    "Użytkownik";


  const student =
    role === "student"
      ? (
        await supabase
          .from("student_profiles")
          .select("public_name, kierunek, rok, sciezka, kompetencje, linki, bio, doswiadczenie, linkedin_url, portfolio_url, tax_residence_pl, birth_date, pesel, stripe_account_id, stripe_onboarding_completed_at")
          .eq("user_id", user.id)
          .maybeSingle()
      ).data
      : null;

  const company =
    role === "company"
      ? (
        await supabase
          .from("company_profiles")
          .select("nazwa, branza, osoba_kontaktowa, opis, website, linkedin_url, nip, city, address")
          .eq("user_id", user.id)
          .maybeSingle()
      ).data
      : null;
  const studentStripeAccountId =
    role === "student"
    && student
    && "stripe_account_id" in student
    && typeof student.stripe_account_id === "string"
      ? student.stripe_account_id
      : null;
  const studentStripeReady =
    role === "student"
    && student
    && "stripe_onboarding_completed_at" in student
    && typeof student.stripe_onboarding_completed_at === "string"
    && student.stripe_onboarding_completed_at.length > 0;
  const studentStripeState = studentStripeReady
    ? "ready"
    : studentStripeAccountId
      ? "pending"
      : "missing";
  const profileDisplayName = role === "company" ? company?.nazwa || displayName : displayName;

  // ===== STATYSTYKI & CALCULATIONS =====
  let stats: ProfileStats | null = null;
  let completionPercentage = 0;
  let educationEntries: EducationEntry[] = [];

  if (role === "student") {
    const [experienceResult, applicationsResult, ordersResult, educationResult, ratingsResult] = await Promise.all([
      supabase.from("experience_entries").select("id", { count: "exact", head: true }).eq("student_id", user.id),
      supabase.from("applications").select("id").eq("student_id", user.id),
      supabase.from("service_orders").select("id").eq("student_id", user.id),
      supabase.from("education_entries").select("*").eq("student_id", user.id).order("start_year", { ascending: false }),
      supabase.from("reviews").select("rating").eq("reviewer_role", "company").eq("reviewee_id", user.id),
    ]);

    const manualCount = experienceResult.count;
    const myApps = applicationsResult.data;
    const myOrders = ordersResult.data;
    educationEntries = educationResult.data ?? [];

    const myAppIds = (myApps || []).map(a => a.id);
    const myOrderIds = (myOrders || []).map(o => o.id);

    let verifiedCount = 0;

    const [applicationContractsResult, orderContractsResult] = await Promise.all([
      myAppIds.length > 0
        ? supabase.from("contracts").select("id", { count: "exact", head: true }).in("application_id", myAppIds).eq("status", "completed")
        : Promise.resolve({ count: 0 }),
      myOrderIds.length > 0
        ? supabase.from("contracts").select("id", { count: "exact", head: true }).in("service_order_id", myOrderIds).eq("status", "completed")
        : Promise.resolve({ count: 0 }),
    ]);
    verifiedCount = (applicationContractsResult.count ?? 0) + (orderContractsResult.count ?? 0);

    const totalProjects = (manualCount || 0) + verifiedCount;

    // 2. Completion Calc
    let points = 0;
    const totalPoints = 6; // Name, Bio, Skills, Education, Experience, Links

    if (student?.public_name) points++;
    if (student?.bio && student.bio.length > 50) points++;
    if (student?.kompetencje && student.kompetencje.length > 0) points++;

    if (educationEntries.length > 0) points++;

    if (totalProjects > 0) points++;

    if (student?.linkedin_url || student?.portfolio_url) points++;

    completionPercentage = Math.round((points / totalPoints) * 100);

    const ratingsRows = ratingsResult.data;

    const ratings = (ratingsRows ?? []).map((row: { rating: number | null }) => Number(row.rating) || 0).filter((rating) => rating > 0);
    const avg = ratings.length ? ratings.reduce((a, b) => a + b, 0) / ratings.length : null;

    stats = {
      projectsCount: totalProjects,
      reviewsCount: ratings.length,
      avg,
    };
  }

  // Company Logic
  if (role === "company") {
    // Completion Calc (Simpler for company)
    let points = 0;
    const totalPoints = 5;
    if (company?.nazwa) points++;
    if (company?.nip) points++;
    if (company?.address) points++;
    if (company?.osoba_kontaktowa) points++;
    if (company?.opis) points++;
    completionPercentage = Math.round((points / totalPoints) * 100);


    const [publishedResult, applicationsResult] = await Promise.all([
      supabase.from("offers").select("id", { count: "exact", head: true }).eq("company_id", user.id).eq("status", "published"),
      supabase.from("applications").select("id, offers!inner(company_id)", { count: "exact", head: true }).eq("offers.company_id", user.id),
    ]);
    const published = publishedResult.count;
    const appsTotal = applicationsResult.count;

    stats = {
      published: published ?? 0,
      appsTotal: appsTotal ?? 0,
    };
  }

  return (
    <div className="min-h-screen bg-[#f3f6fb] pb-20">
      {/* PREMIUM HEADER */}
      <div className={cn("relative overflow-hidden pb-20 pt-9 md:pb-24 md:pt-12", role === "company" ? "bg-[#10245f]" : "bg-[#35176f]")}>
        <div
          className={cn(
            "pointer-events-none absolute inset-0 bg-gradient-to-br",
            role === "company" ? "from-[#10245f] via-[#10245f] to-[#0b1b47]" : "from-[#4b2390] via-[#35176f] to-[#241156]",
          )}
        />

        <div className="relative z-10 mx-auto w-full max-w-[1380px] px-4 text-white sm:px-6 lg:px-8">
          <div className="flex flex-col items-start gap-5 md:flex-row md:items-end">
            {/* Avatar */}
            <div className="h-20 w-20 rounded-2xl bg-white/10 p-1.5 shadow-sm ring-1 ring-white/15 md:h-24 md:w-24">
              <div className={cn("flex h-full w-full items-center justify-center rounded-xl text-4xl font-black shadow-inner", role === "company" ? "bg-lime-300 text-[#10245f]" : "bg-[#8b68ff] text-white")}>
                {profileDisplayName.charAt(0)}
              </div>
            </div>

            <div className="mb-2 flex-1 space-y-2 text-left">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-black uppercase tracking-normal text-white/80 backdrop-blur-md">
                {role === "student" ? <GraduationCap className="w-3 h-3" /> : <Building className="w-3 h-3" />}
                {role === "student" ? "Twój Profil Studenta" : "Profil Firmowy"}
              </div>
              <h1 className="break-words text-3xl font-black tracking-normal md:text-4xl">{profileDisplayName}</h1>
              <p className="max-w-2xl text-sm font-semibold text-white/75 md:text-base">
                {role === "student" ? (student?.sciezka || "Nie zdefiniowano ścieżki kariery") : (company?.branza || "Branża nieznana")}
              </p>
            </div>

            {/* Progress Card */}
            <div className="hidden w-72 rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur-md md:block">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-bold uppercase tracking-wide text-white/70">Uzupełnienie Profilu</span>
                <span className="text-sm font-black text-lime-300">{completionPercentage}%</span>
              </div>
              <Progress value={completionPercentage} className="h-2.5 bg-white/10" indicatorClassName="bg-lime-300" />
              <p className="mt-2 text-[10px] leading-tight text-white/65">
                {completionPercentage < 100 ? "Uzupełnij brakujące dane, aby zwiększyć widoczność." : "Świetnie! Twój profil jest kompletny."}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="relative z-10 mx-auto -mt-10 w-full max-w-[1380px] px-4 pb-12 sm:px-6 lg:px-8">
        {savedProfileType && (
          <div className="mb-8 rounded-[2rem] border border-emerald-200 bg-emerald-50 px-6 py-5 text-emerald-900 shadow-lg shadow-emerald-500/10">
            <div className="flex items-start gap-4">
              <div className="rounded-2xl bg-white p-2 text-emerald-600 shadow-sm">
                <CheckCircle className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-600">
                  Zapisano pomyślnie
                </p>
                <h2 className="text-lg font-black text-emerald-950">
                  {savedProfileType === "student"
                    ? "Twój profil studenta został zaktualizowany."
                    : "Profil firmy został zaktualizowany."}
                </h2>
                <p className="text-sm font-medium text-emerald-800/80">
                  Zmiany są już widoczne w aplikacji. W razie potrzeby możesz od razu wrócić do edycji i dopracować kolejne sekcje.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Mobile Progress Bar (visible only on small screens) */}
        <div className="mb-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:hidden">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Poziom Profilu</span>
            <span className="text-sm font-black text-[#10245f]">{completionPercentage}%</span>
          </div>
          <Progress value={completionPercentage} className="h-3" indicatorClassName="bg-lime-300" />
        </div>


        <div className="grid items-start gap-5 lg:grid-cols-3">
          {/* LEWA KOLUMNA */}
          <div className="space-y-5 lg:sticky lg:top-20 lg:col-span-1">

            {/* KARTA DANYCH */}
            <Card className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="h-2 bg-[#8b68ff]" />
              <CardContent className="pt-8 px-6 pb-8 space-y-6">
                {role === "student" && (
                  <>
                    <div>
                      <Label className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-1 block">Imię i nazwisko (Publiczne)</Label>
                      <div className="font-bold text-lg text-slate-900">{student?.public_name || "—"}</div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100">
                        <div className="p-2 bg-white rounded-xl shadow-sm"><Globe className="w-4 h-4 text-[#10245f]" /></div>
                        <div className="min-w-0">
                          <div className="text-[10px] uppercase font-bold text-slate-400">Portfolio</div>
                          {student?.portfolio_url ? (
                            <a href={student.portfolio_url} rel="noopener noreferrer" target="_blank" className="block truncate text-sm font-bold text-[#10245f] hover:underline">Link do portfolio</a>
                          ) : <span className="text-sm text-slate-500 font-medium">Brak</span>}
                        </div>
                      </div>

                      <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100">
                        <div className="p-2 bg-white rounded-xl shadow-sm"><Linkedin className="w-4 h-4 text-blue-600" /></div>
                        <div className="min-w-0">
                          <div className="text-[10px] uppercase font-bold text-slate-400">LinkedIn</div>
                          {student?.linkedin_url ? (
                            <a href={student.linkedin_url} rel="noopener noreferrer" target="_blank" className="text-sm font-bold text-blue-700 hover:underline truncate block">Profil LinkedIn</a>
                          ) : <span className="text-sm text-slate-500 font-medium">Brak</span>}
                        </div>
                      </div>
                    </div>

                    <Separator />

                    <div>
                      <Label className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-3 block">Kompetencje</Label>
                      <div className="flex flex-wrap gap-2">
                        {(student?.kompetencje ?? []).slice(0, 12).map((k: string) => (
                          <Badge key={k} variant="secondary" className="rounded-lg border border-violet-100 bg-violet-50 px-2.5 py-1 text-violet-700 hover:bg-violet-50">
                            {k}
                          </Badge>
                        ))}
                        {!student?.kompetencje?.length && <span className="text-xs text-slate-400 italic">Brak. Dodaj w edycji.</span>}
                      </div>
                    </div>
                  </>
                )}

                {role === "company" && (
                  <div className="space-y-6">
                    <div>
                      <Label className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-1 block">Firma</Label>
                      <div className="font-bold text-xl text-slate-900">{company?.nazwa || "—"}</div>
                      <div className="text-sm text-slate-500 mt-1 font-medium">{company?.branza}</div>
                    </div>

                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-3">
                      <div className="flex items-center gap-3">
                        <MapPin className="w-4 h-4 text-slate-400" />
                        <span className="text-sm font-medium text-slate-600">{company?.city}, {company?.address}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <User className="w-4 h-4 text-slate-400" />
                        <span className="text-sm font-medium text-slate-600">{company?.osoba_kontaktowa || "—"}</span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      {company?.website && (
                        <a href={company.website} rel="noopener noreferrer" target="_blank" className="flex-1 btn bg-indigo-50 hover:bg-indigo-100 text-indigo-700 py-2 rounded-xl text-center text-sm font-bold transition-colors">
                          Strona WWW
                        </a>
                      )}
                      {company?.linkedin_url && (
                        <a href={company.linkedin_url} rel="noopener noreferrer" target="_blank" className="flex-1 btn bg-blue-50 hover:bg-blue-100 text-blue-700 py-2 rounded-xl text-center text-sm font-bold transition-colors">
                          LinkedIn
                        </a>
                      )}
                    </div>

                    <Link
                      href="/app/company/documents"
                      className="flex items-center justify-between rounded-2xl border border-indigo-100 bg-indigo-50 px-4 py-4 text-indigo-900 transition-all hover:border-indigo-200 hover:bg-indigo-100"
                    >
                      <div className="flex items-center gap-3">
                        <div className="rounded-xl bg-white p-2 text-indigo-600 shadow-sm">
                          <FileText className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="text-xs font-black uppercase tracking-widest text-indigo-500">
                            Dokumenty firmy
                          </div>
                          <div className="text-sm font-bold">
                            Umowy A i faktury do pobrania
                          </div>
                        </div>
                      </div>
                      <Share2 className="h-4 w-4 text-indigo-500" />
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* STATYSTYKI */}
            <Card className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <CardHeader className="bg-slate-50 border-b border-slate-100 pb-4 pt-5">
                <CardTitle className="text-xs font-black text-slate-400 uppercase tracking-widest">
                  Statystyki
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6 px-6 pb-6">
                {role === "student" ? (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100 text-center hover:bg-emerald-50 transition-colors">
                      <div className="text-3xl font-black text-emerald-600 mb-1">{stats?.projectsCount ?? 0}</div>
                      <div className="text-[10px] font-bold text-emerald-700/60 uppercase">Projekty</div>
                    </div>
                    <Link href="#reviews" className="bg-amber-50/50 p-4 rounded-2xl border border-amber-100 text-center hover:bg-amber-50 transition-colors block">
                      <div className="text-3xl font-black text-amber-500 mb-1 flex items-center justify-center gap-1">
                        {stats?.avg ? stats.avg.toFixed(1) : "-"} <Star className="w-4 h-4" />
                      </div>
                      <div className="text-[10px] font-bold text-amber-700/60 uppercase">Średnia Ocena</div>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl">
                      <span className="text-sm font-bold text-slate-600">Aktywne Oferty</span>
                      <Badge className="bg-indigo-600 text-white hover:bg-indigo-700">{stats?.published ?? 0}</Badge>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl">
                      <span className="text-sm font-bold text-slate-600">Otrzymane Zgłoszenia</span>
                      <Badge className="bg-emerald-600 text-white hover:bg-emerald-700">{stats?.appsTotal ?? 0}</Badge>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

          </div>

          {/* PRAWA KOLUMNA: EDYCJA */}
          <div className="space-y-5 lg:col-span-2">

            {role === "student" && (
              <div className="space-y-5">
                {/* EDUKACJA */}
                <EducationSection entries={educationEntries} />

                {/* DOSWIADCZENIE (PROJEKTY) */}
                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                  <ExperienceSection />
                </div>

                {/* EDIT FORM */}
                <Card className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                  <CardHeader className="bg-gradient-to-r from-slate-50 to-white border-b border-slate-100 py-6">
                    <CardTitle className="flex items-center gap-3 text-lg font-black text-slate-800">
                      <div className="p-2 bg-indigo-100 text-indigo-600 rounded-xl">
                        <Edit className="w-5 h-5" />
                      </div>
                      Edycja Twoich Danych
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-8">
                    <form action={saveStudentProfile} className="space-y-8">
                      <div className="grid md:grid-cols-2 gap-x-8 gap-y-6">
                        <div className="md:col-span-2">
                          <Label className="uppercase text-xs font-bold text-slate-400 tracking-wider mb-2 block">O mnie (Bio)</Label>
                          <Textarea
                            name="bio"
                            className="min-h-[120px] bg-slate-50 border-slate-200 focus:bg-white resize-none rounded-xl text-base p-4"
                            defaultValue={student?.bio ?? ""}
                            placeholder="Opisz krótko siebie, swoje cele i pasje (min. 50 znaków)..."
                          />
                          <div className="flex justify-between items-center mt-2">
                            {(student?.bio?.length ?? 0) < 50 && (
                              <p className="text-xs text-amber-600 font-medium">
                                ⚠ Min. 50 znaków dla punktu uzupełnienia profilu (masz {student?.bio?.length ?? 0})
                              </p>
                            )}
                            <p className="text-xs text-slate-400 ml-auto">To, co napiszesz, zobaczą pracodawcy.</p>
                          </div>
                        </div>

                        <div className="md:col-span-2">
                          <Label className="uppercase text-xs font-bold text-slate-400 tracking-wider mb-2 block">Inne Doświadczenie</Label>
                          <Textarea
                            name="doswiadczenie"
                            className="min-h-[100px] bg-slate-50 border-slate-200 focus:bg-white resize-none rounded-xl"
                            defaultValue={student?.doswiadczenie ?? ""}
                            placeholder="Staże, wolontariaty, koła naukowe..."
                          />
                        </div>

                        <div className="space-y-2">
                          <Label className="uppercase text-xs font-bold text-slate-400 tracking-wider">LinkedIn</Label>
                          <Input name="linkedin_url" defaultValue={student?.linkedin_url ?? ""} placeholder="https://linkedin.com/in/..." className="rounded-xl bg-slate-50 border-slate-200" />
                        </div>
                        <div className="space-y-2">
                          <Label className="uppercase text-xs font-bold text-slate-400 tracking-wider">Portfolio</Label>
                          <Input name="portfolio_url" defaultValue={student?.portfolio_url ?? ""} placeholder="https://..." className="rounded-xl bg-slate-50 border-slate-200" />
                        </div>

                        <div className="md:col-span-2 pt-2">
                          <Label className="uppercase text-xs font-bold text-slate-400 tracking-wider mb-3 block">Twoje Kompetencje (Skillset)</Label>
                          <div className="min-w-0 rounded-2xl border border-slate-200/60 bg-slate-50 p-3 sm:p-6">
                            <SkillsInput initial={student?.kompetencje ?? []} />
                          </div>
                        </div>
                      </div>
                      <div className="mobile-sticky-actions flex justify-end pt-4 border-t border-slate-100">
                        <Button type="submit" size="lg" className="h-12 rounded-xl border border-[#10245f] bg-[#10245f] px-8 font-bold text-white shadow-sm transition-all duration-300 hover:bg-[#0b1b47]">
                          Zapisz Zmiany
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>

                {/* DANE PODATKOWE */}
                <TaxDataSection
                  initialData={{
                    tax_residence_pl: student?.tax_residence_pl ?? null,
                    birth_date: student?.birth_date ?? null,
                    pesel: student?.pesel ?? null,
                  }}
                />

                <Card className="rounded-[2rem] border-none bg-white shadow-xl shadow-slate-200/40">
                  <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white py-6">
                    <CardTitle className="flex items-center gap-3 text-lg font-black text-slate-800">
                      <div className="rounded-xl bg-emerald-100 p-2 text-emerald-700">
                        <Wallet className="h-5 w-5" />
                      </div>
                      Wypłaty Stripe
                    </CardTitle>
                    <CardDescription>
                      Połącz konto Stripe, aby platforma mogła wypłacić wynagrodzenie po akceptacji etapu.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-4 p-8 md:flex-row md:items-center md:justify-between">
                    <div>
                      <Badge className={studentStripeReady ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}>
                        {studentStripeReady ? "Konto gotowe do wypłat" : studentStripeAccountId ? "Dokończ weryfikację" : "Wymagana konfiguracja"}
                      </Badge>
                      <p className="mt-2 max-w-xl text-sm font-medium leading-6 text-slate-500">
                        Stripe poprowadzi Cię przez bezpieczną weryfikację. Dane płatnicze nie są przechowywane w Student2Work.
                      </p>
                    </div>
                    <StripeOnboardingButton state={studentStripeState} />
                  </CardContent>
                </Card>

                <div id="reviews" className="scroll-mt-24">
                  <ReviewsSection />
                </div>
              </div>
            )}

            {role === "company" && (
              <Card className="rounded-[2rem] border-none shadow-xl shadow-slate-200/40 bg-white overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-slate-50 to-white border-b border-slate-100 py-6">
                  <CardTitle className="flex items-center gap-3 text-lg font-black text-slate-800">
                    <div className="p-2 bg-indigo-100 text-indigo-600 rounded-xl">
                      <Building className="w-5 h-5" />
                    </div>
                    Edycja Profilu Firmy
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-8">
                  <form action={saveCompanyProfile} className="space-y-8">
                    <div className="grid md:grid-cols-2 gap-x-8 gap-y-6">

                      <div className="md:col-span-2 font-black text-xs text-indigo-500 uppercase tracking-widest border-b border-indigo-100 pb-2">Informacje Główne</div>

                      <div className="md:col-span-2 space-y-2">
                        <Label className="font-bold">Nazwa Firmy</Label>
                        <Input name="nazwa" defaultValue={company?.nazwa ?? ""} className="h-12 text-lg rounded-xl bg-slate-50 border-slate-200" />
                      </div>

                      <div className="space-y-2">
                        <Label className="font-bold">NIP</Label>
                        <Input name="nip" defaultValue={company?.nip ?? ""} className="h-11 font-mono rounded-xl bg-slate-50 border-slate-200" />
                      </div>
                      <div className="space-y-2">
                        <Label className="font-bold">Branża</Label>
                        <Input name="branza" defaultValue={company?.branza ?? ""} className="h-11 rounded-xl bg-slate-50 border-slate-200" />
                      </div>

                      <div className="md:col-span-2 font-black text-xs text-indigo-500 uppercase tracking-widest border-b border-indigo-100 pb-2 mt-2">Dane Adresowe</div>

                      <div className="space-y-2">
                        <Label className="font-bold">Miasto</Label>
                        <Input name="city" defaultValue={company?.city ?? ""} className="h-11 rounded-xl bg-slate-50 border-slate-200" />
                      </div>
                      <div className="space-y-2">
                        <Label className="font-bold">Ulica i Numer</Label>
                        <Input name="address" defaultValue={company?.address ?? ""} className="h-11 rounded-xl bg-slate-50 border-slate-200" />
                      </div>

                      <div className="md:col-span-2 font-black text-xs text-indigo-500 uppercase tracking-widest border-b border-indigo-100 pb-2 mt-2">Prezentacja</div>

                      <div className="md:col-span-2 space-y-2">
                        <Label className="font-bold">Opis Firmy</Label>
                        <Textarea name="opis" rows={5} defaultValue={company?.opis ?? ""} className="bg-slate-50 border-slate-200 rounded-xl resize-none p-4" placeholder="Opisz swoją firmę..." />
                      </div>

                      <div className="space-y-2">
                        <Label className="font-bold">Osoba Kontaktowa</Label>
                        <Input name="osoba_kontaktowa" className="h-11 rounded-xl bg-slate-50 border-slate-200" defaultValue={company?.osoba_kontaktowa ?? ""} />
                      </div>
                      <div className="space-y-2">
                        <Label className="font-bold">Strona WWW</Label>
                        <Input name="website" className="h-11 rounded-xl bg-slate-50 border-slate-200" defaultValue={company?.website ?? ""} />
                      </div>
                      <div className="md:col-span-2 space-y-2">
                        <Label className="font-bold">LinkedIn</Label>
                        <Input
                          name="linkedin_url"
                          className="h-11 rounded-xl bg-slate-50 border-slate-200"
                          defaultValue={company?.linkedin_url ?? ""}
                          placeholder="https://linkedin.com/company/..."
                        />
                      </div>
                    </div>
                    <div className="mobile-sticky-actions flex justify-end pt-6 border-t border-slate-100">
                      <Button type="submit" size="lg" className="h-12 rounded-xl border border-[#10245f] bg-[#10245f] px-8 font-bold text-white shadow-sm transition-all duration-300 hover:bg-[#0b1b47]">Zapisz Zmiany</Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
