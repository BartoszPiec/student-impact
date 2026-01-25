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
import { Building, MapPin, Briefcase, User, Globe, Linkedin, Star, CheckCircle, Wallet, Trophy, Clock, GraduationCap, Edit, Share2, Sparkles, Percent } from "lucide-react";
import { saveCompanyProfile, saveStudentProfile } from "./_actions";
import ExperienceSection from "./experience-section";
import ReviewsSection from "./reviews-section";
import EducationSection from "./education-section";
import SkillsInput from "./skills-input";
import { Progress } from "@/components/ui/progress";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const supabase = await createClient();

  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) redirect("/auth");

  const { data: prof, error: profErr } = await supabase
    .from("profiles")
    .select("role")
    .eq("user_id", user.id)
    .maybeSingle();

  if (profErr) {
    return (
      <main className="space-y-4">
        <pre className="rounded-md border p-4 text-sm overflow-auto">
          {JSON.stringify({ profErr }, null, 2)}
        </pre>
      </main>
    );
  }

  let role = prof?.role ?? null;

  if (!role) {
    const fallbackRole = (user.user_metadata as any)?.role ?? null;
    if (fallbackRole) {
      await supabase.from("profiles").insert({ user_id: user.id, role: fallbackRole });
      const { data: prof2 } = await supabase.from("profiles").select("role").eq("user_id", user.id).maybeSingle();
      role = prof2?.role ?? null;
    }
  }

  if (!role) {
    return (
      <main className="space-y-4 p-8">
        <div className="bg-red-50 text-red-600 p-4 rounded-xl">Błąd profilu: Brak roli użytkownika.</div>
      </main>
    );
  }

  const displayName =
    (user.user_metadata as any)?.full_name ||
    (user.user_metadata as any)?.name ||
    user.email ||
    "Użytkownik";


  const student =
    role === "student"
      ? (
        await supabase
          .from("student_profiles")
          .select("public_name, kierunek, rok, sciezka, kompetencje, linki, bio, doswiadczenie, linkedin_url, portfolio_url")
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

  // ===== STATYSTYKI & CALCULATIONS =====
  let stats: any = null;
  let completionPercentage = 0;

  if (role === "student") {
    // 1. PROJECT COUNT CALCULATION
    const { count: manualCount } = await supabase.from("experience_entries").select("*", { count: 'exact', head: true }).eq("student_id", user.id);

    // Fetch verified contracts count
    // Need to find contracts where student is owner (via app or service_order)
    const { data: myApps } = await supabase.from("applications").select("id").eq("student_id", user.id);
    const { data: myOrders } = await supabase.from("service_orders").select("id").eq("student_id", user.id);

    const myAppIds = (myApps || []).map(a => a.id);
    const myOrderIds = (myOrders || []).map(o => o.id);

    let verifiedCount = 0;

    // Split queries to be safe
    if (myAppIds.length > 0) {
      const { count } = await supabase.from("contracts").select("id", { count: 'exact', head: true }).in("application_id", myAppIds).eq("status", "completed");
      verifiedCount += (count || 0);
    }
    if (myOrderIds.length > 0) {
      const { count } = await supabase.from("contracts").select("id", { count: 'exact', head: true }).in("service_order_id", myOrderIds).eq("status", "completed");
      verifiedCount += (count || 0);
    }

    const totalProjects = (manualCount || 0) + verifiedCount;

    // 2. Completion Calc
    let points = 0;
    let totalPoints = 6; // Name, Bio, Skills, Education, Experience, Links

    if (student?.public_name) points++;
    if (student?.bio && student.bio.length > 50) points++;
    if (student?.kompetencje && student.kompetencje.length > 0) points++;

    // Check if education exists
    const { count: eduCount } = await supabase.from("education_entries").select("*", { count: 'exact', head: true }).eq("student_id", user.id);
    if (eduCount && eduCount > 0) points++;

    if (totalProjects > 0) points++;

    if (student?.linkedin_url || student?.portfolio_url) points++;

    completionPercentage = Math.round((points / totalPoints) * 100);

    // 3. Stats (Reviews)
    const { data: ratingsRows } = await supabase
      .from("reviews")
      .select("rating")
      .eq("reviewer_role", "company")
      .eq("reviewee_id", user.id);

    const ratings = (ratingsRows ?? []).map((r: any) => Number(r.rating) || 0).filter((n) => n > 0);
    const avg = ratings.length ? ratings.reduce((a, b) => a + b, 0) / ratings.length : null;

    stats = {
      projectsCount: totalProjects,
      reviewsCount: ratings.length,
      avg,
    };
  }

  // Education Fetch
  let educationEntries: any[] = [];
  if (role === "student") {
    const { data: edu } = await supabase
      .from("education_entries")
      .select("*")
      .eq("student_id", user.id)
      .order("start_year", { ascending: false });
    educationEntries = edu ?? [];
  }

  // Company Logic
  if (role === "company") {
    // Completion Calc (Simpler for company)
    let points = 0;
    let totalPoints = 5;
    if (company?.nazwa) points++;
    if (company?.nip) points++;
    if (company?.address) points++;
    if (company?.osoba_kontaktowa) points++;
    if (company?.opis) points++;
    completionPercentage = Math.round((points / totalPoints) * 100);


    const { count: published } = await supabase.from("offers").select("id", { count: "exact", head: true }).eq("company_id", user.id).eq("status", "published");
    const { count: appsTotal } = await supabase.from("applications").select("id, offers!inner(company_id)", { count: "exact", head: true }).eq("offers.company_id", user.id);

    stats = {
      published: published ?? 0,
      appsTotal: appsTotal ?? 0,
    };
  }

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20">
      {/* PREMIUM HEADER */}
      <div className="relative overflow-hidden bg-slate-900 pb-24 pt-12 md:pb-32 md:pt-16">
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none"></div>
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-indigo-500/20 rounded-full blur-[100px]" />
        <div className="absolute top-1/2 left-1/4 w-64 h-64 bg-purple-500/20 rounded-full blur-[80px]" />

        <div className="container max-w-7xl mx-auto px-4 sm:px-6 relative z-10 text-white">
          <div className="flex flex-col md:flex-row items-center md:items-end gap-8">
            {/* Avatar */}
            <div className="h-32 w-32 md:h-40 md:w-40 rounded-[2.5rem] bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-md p-2 shadow-2xl ring-1 ring-white/20">
              <div className="h-full w-full rounded-[2rem] bg-indigo-500 flex items-center justify-center text-5xl font-black text-white shadow-inner">
                {displayName.charAt(0)}
              </div>
            </div>

            <div className="flex-1 text-center md:text-left space-y-2 mb-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-200 text-[11px] font-black uppercase tracking-widest backdrop-blur-md">
                {role === "student" ? <GraduationCap className="w-3 h-3" /> : <Building className="w-3 h-3" />}
                {role === "student" ? "Twój Profil Studenta" : "Profil Firmowy"}
              </div>
              <h1 className="text-4xl md:text-5xl font-black tracking-tight">{displayName}</h1>
              <p className="text-lg text-indigo-200/80 font-medium max-w-2xl">
                {role === "student" ? ((student as any)?.sciezka || "Nie zdefiniowano ścieżki kariery") : ((company as any)?.branza || "Branża nieznana")}
              </p>
            </div>

            {/* Progress Card */}
            <div className="hidden md:block w-72 bg-white/5 backdrop-blur-md border border-white/10 p-5 rounded-3xl">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-bold text-indigo-200 uppercase tracking-wide">Uzupełnienie Profilu</span>
                <span className="text-sm font-black text-white">{completionPercentage}%</span>
              </div>
              <Progress value={completionPercentage} className="h-2.5 bg-white/10" indicatorClassName="bg-gradient-to-r from-indigo-400 to-purple-400" />
              <p className="text-[10px] text-indigo-300 mt-2 leading-tight">
                {completionPercentage < 100 ? "Uzupełnij brakujące dane, aby zwiększyć widoczność." : "Świetnie! Twój profil jest kompletny."}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="container max-w-7xl mx-auto px-4 sm:px-6 -mt-12 relative z-10 pb-12">
        {/* Mobile Progress Bar (visible only on small screens) */}
        <div className="md:hidden mb-8 bg-white p-5 rounded-3xl shadow-lg shadow-indigo-500/10 border border-indigo-50">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Poziom Profilu</span>
            <span className="text-sm font-black text-indigo-600">{completionPercentage}%</span>
          </div>
          <Progress value={completionPercentage} className="h-3" />
        </div>


        <div className="grid gap-8 lg:grid-cols-3 items-start">
          {/* LEWA KOLUMNA */}
          <div className="space-y-6 lg:col-span-1 lg:sticky lg:top-8">

            {/* KARTA DANYCH */}
            <Card className="border-none shadow-xl shadow-slate-200/40 bg-white rounded-[2rem] overflow-hidden">
              <div className="h-2 bg-gradient-to-r from-indigo-500 to-purple-600" />
              <CardContent className="pt-8 px-6 pb-8 space-y-6">
                {role === "student" && (
                  <>
                    <div>
                      <Label className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-1 block">Imię i nazwisko (Publiczne)</Label>
                      <div className="font-bold text-lg text-slate-900">{(student as any)?.public_name || "—"}</div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100">
                        <div className="p-2 bg-white rounded-xl shadow-sm"><Globe className="w-4 h-4 text-indigo-500" /></div>
                        <div className="min-w-0">
                          <div className="text-[10px] uppercase font-bold text-slate-400">Portfolio</div>
                          {(student as any)?.portfolio_url ? (
                            <a href={(student as any).portfolio_url} target="_blank" className="text-sm font-bold text-indigo-600 hover:underline truncate block">Link do portfolio</a>
                          ) : <span className="text-sm text-slate-500 font-medium">Brak</span>}
                        </div>
                      </div>

                      <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100">
                        <div className="p-2 bg-white rounded-xl shadow-sm"><Linkedin className="w-4 h-4 text-blue-600" /></div>
                        <div className="min-w-0">
                          <div className="text-[10px] uppercase font-bold text-slate-400">LinkedIn</div>
                          {(student as any)?.linkedin_url ? (
                            <a href={(student as any).linkedin_url} target="_blank" className="text-sm font-bold text-blue-700 hover:underline truncate block">Profil LinkedIn</a>
                          ) : <span className="text-sm text-slate-500 font-medium">Brak</span>}
                        </div>
                      </div>
                    </div>

                    <Separator />

                    <div>
                      <Label className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-3 block">Kompetencje</Label>
                      <div className="flex flex-wrap gap-2">
                        {((student as any)?.kompetencje ?? []).slice(0, 12).map((k: string) => (
                          <Badge key={k} variant="secondary" className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-100 rounded-lg px-2.5 py-1">
                            {k}
                          </Badge>
                        ))}
                        {!((student as any)?.kompetencje?.length) && <span className="text-xs text-slate-400 italic">Brak. Dodaj w edycji.</span>}
                      </div>
                    </div>
                  </>
                )}

                {role === "company" && (
                  <div className="space-y-6">
                    <div>
                      <Label className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-1 block">Firma</Label>
                      <div className="font-bold text-xl text-slate-900">{(company as any)?.nazwa || "—"}</div>
                      <div className="text-sm text-slate-500 mt-1 font-medium">{(company as any)?.branza}</div>
                    </div>

                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-3">
                      <div className="flex items-center gap-3">
                        <MapPin className="w-4 h-4 text-slate-400" />
                        <span className="text-sm font-medium text-slate-600">{(company as any)?.city}, {(company as any)?.address}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <User className="w-4 h-4 text-slate-400" />
                        <span className="text-sm font-medium text-slate-600">{(company as any)?.osoba_kontaktowa || "—"}</span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      {(company as any)?.website && (
                        <a href={(company as any).website} target="_blank" className="flex-1 btn bg-indigo-50 hover:bg-indigo-100 text-indigo-700 py-2 rounded-xl text-center text-sm font-bold transition-colors">
                          Strona WWW
                        </a>
                      )}
                      {(company as any)?.linkedin_url && (
                        <a href={(company as any).linkedin_url} target="_blank" className="flex-1 btn bg-blue-50 hover:bg-blue-100 text-blue-700 py-2 rounded-xl text-center text-sm font-bold transition-colors">
                          LinkedIn
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* STATYSTYKI */}
            <Card className="border-none shadow-xl shadow-slate-200/40 bg-white rounded-[2rem] overflow-hidden">
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
          <div className="space-y-8 lg:col-span-2">

            {role === "student" && (
              <div className="space-y-8">
                {/* EDUKACJA */}
                <EducationSection entries={educationEntries} />

                {/* DOSWIADCZENIE (PROJEKTY) */}
                <div className="rounded-[2rem] bg-white shadow-xl shadow-slate-200/40 overflow-hidden border border-slate-100">
                  <ExperienceSection />
                </div>

                {/* EDIT FORM */}
                <Card className="rounded-[2rem] border-none shadow-xl shadow-slate-200/40 bg-white overflow-hidden">
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
                            defaultValue={(student as any)?.bio ?? ""}
                            placeholder="Opisz krótko siebie, swoje cele i pasje..."
                          />
                          <p className="text-xs text-slate-400 mt-2 text-right">To, co napiszesz, zobaczą pracodawcy.</p>
                        </div>

                        <div className="md:col-span-2">
                          <Label className="uppercase text-xs font-bold text-slate-400 tracking-wider mb-2 block">Inne Doświadczenie</Label>
                          <Textarea
                            name="doswiadczenie"
                            className="min-h-[100px] bg-slate-50 border-slate-200 focus:bg-white resize-none rounded-xl"
                            defaultValue={(student as any)?.doswiadczenie ?? ""}
                            placeholder="Staże, wolontariaty, koła naukowe..."
                          />
                        </div>

                        <div className="space-y-2">
                          <Label className="uppercase text-xs font-bold text-slate-400 tracking-wider">LinkedIn</Label>
                          <Input name="linkedin_url" defaultValue={(student as any)?.linkedin_url ?? ""} placeholder="https://linkedin.com/in/..." className="rounded-xl bg-slate-50 border-slate-200" />
                        </div>
                        <div className="space-y-2">
                          <Label className="uppercase text-xs font-bold text-slate-400 tracking-wider">Portfolio</Label>
                          <Input name="portfolio_url" defaultValue={(student as any)?.portfolio_url ?? ""} placeholder="https://..." className="rounded-xl bg-slate-50 border-slate-200" />
                        </div>

                        <div className="md:col-span-2 pt-2">
                          <Label className="uppercase text-xs font-bold text-slate-400 tracking-wider mb-3 block">Twoje Kompetencje (Skillset)</Label>
                          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200/60">
                            <SkillsInput initial={(student as any)?.kompetencje ?? []} />
                          </div>
                        </div>
                      </div>
                      <div className="flex justify-end pt-4 border-t border-slate-100">
                        <Button type="submit" size="lg" className="px-8 h-12 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-lg shadow-indigo-500/20 transition-all hover:-translate-y-0.5">
                          Zapisz Zmiany
                        </Button>
                      </div>
                    </form>
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
                        <Input name="nazwa" defaultValue={(company as any)?.nazwa ?? ""} className="h-12 text-lg rounded-xl bg-slate-50 border-slate-200" />
                      </div>

                      <div className="space-y-2">
                        <Label className="font-bold">NIP</Label>
                        <Input name="nip" defaultValue={(company as any)?.nip ?? ""} className="h-11 font-mono rounded-xl bg-slate-50 border-slate-200" />
                      </div>
                      <div className="space-y-2">
                        <Label className="font-bold">Branża</Label>
                        <Input name="branza" defaultValue={(company as any)?.branza ?? ""} className="h-11 rounded-xl bg-slate-50 border-slate-200" />
                      </div>

                      <div className="md:col-span-2 font-black text-xs text-indigo-500 uppercase tracking-widest border-b border-indigo-100 pb-2 mt-2">Dane Adresowe</div>

                      <div className="space-y-2">
                        <Label className="font-bold">Miasto</Label>
                        <Input name="city" defaultValue={(company as any)?.city ?? ""} className="h-11 rounded-xl bg-slate-50 border-slate-200" />
                      </div>
                      <div className="space-y-2">
                        <Label className="font-bold">Ulica i Numer</Label>
                        <Input name="address" defaultValue={(company as any)?.address ?? ""} className="h-11 rounded-xl bg-slate-50 border-slate-200" />
                      </div>

                      <div className="md:col-span-2 font-black text-xs text-indigo-500 uppercase tracking-widest border-b border-indigo-100 pb-2 mt-2">Prezentacja</div>

                      <div className="md:col-span-2 space-y-2">
                        <Label className="font-bold">Opis Firmy</Label>
                        <Textarea name="opis" rows={5} defaultValue={(company as any)?.opis ?? ""} className="bg-slate-50 border-slate-200 rounded-xl resize-none p-4" placeholder="Opisz swoją firmę..." />
                      </div>

                      <div className="space-y-2">
                        <Label className="font-bold">Osoba Kontaktowa</Label>
                        <Input name="osoba_kontaktowa" className="h-11 rounded-xl bg-slate-50 border-slate-200" defaultValue={(company as any)?.osoba_kontaktowa ?? ""} />
                      </div>
                      <div className="space-y-2">
                        <Label className="font-bold">Strona WWW</Label>
                        <Input name="website" className="h-11 rounded-xl bg-slate-50 border-slate-200" defaultValue={(company as any)?.website ?? ""} />
                      </div>
                    </div>
                    <div className="flex justify-end pt-6 border-t border-slate-100">
                      <Button type="submit" size="lg" className="px-8 h-12 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-lg shadow-indigo-500/20">Zapisz Zmiany</Button>
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
