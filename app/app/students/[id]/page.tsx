import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MapPin, GraduationCap, Briefcase, Globe, Linkedin, Mail, Calendar, Sparkles, FolderGit2, Star, Award, BookOpen } from "lucide-react";
import BackButton from "@/components/back-button";
import { Stars, ReviewCard } from "@/components/ReviewCard";

export const dynamic = "force-dynamic";

// Stars now imported from ReviewCard

function fmtDate(ts?: string | null) {
  if (!ts) return "";
  try {
    return new Intl.DateTimeFormat("pl-PL", { dateStyle: "medium" }).format(new Date(ts));
  } catch {
    return ts;
  }
}

function StatBox({ label, value, icon: Icon }: { label: string; value: string; icon?: any }) {
  return (
    <div className="flex flex-col items-center justify-center p-4 rounded-xl bg-slate-50 border border-slate-100 hover:bg-white hover:shadow-md transition-all group">
      {Icon && <Icon className="h-5 w-5 text-indigo-500 mb-2 group-hover:scale-110 transition-transform" />}
      <div className="text-2xl font-bold text-slate-800">{value}</div>
      <div className="text-xs text-slate-500 uppercase tracking-wide font-medium">{label}</div>
    </div>
  );
}

export default async function StudentProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: studentId } = await params;

  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) redirect("/auth");

  // Fetch basic profile
  const { data: sp, error: spErr } = await supabase
    .from("student_profiles")
    .select(
      "user_id, public_name, kierunek, rok, sciezka, bio, doswiadczenie, linkedin_url, portfolio_url, kompetencje"
    )
    .eq("user_id", studentId)
    .maybeSingle();

  if (spErr || !sp) {
    return (
      <main className="container mx-auto max-w-5xl py-10 px-4">
        <div className="flex flex-col items-center justify-center min-h-[40vh] space-y-4 text-center">
          <div className="bg-slate-100 p-6 rounded-full">
            <Briefcase className="h-10 w-10 text-slate-400" />
          </div>
          <h2 className="text-xl font-semibold text-slate-800">Profil niedostępny</h2>
          <p className="text-muted-foreground">Nie udało się znaleźć profilu studenta lub nie został on jeszcze uzupełniony.</p>
          <Button asChild variant="outline">
            <Link href="/app/company/applications">Wróć do aplikacji</Link>
          </Button>
        </div>
      </main>
    );
  }

  // Fetch all related data in parallel
  const [projectsRes, reviewsRes, educationRes, completedContractsRes] = await Promise.all([
    supabase
      .from("experience_entries")
      .select("id, title, summary, link, created_at")
      .eq("student_id", studentId)
      .order("created_at", { ascending: false }),
    supabase
      .from("reviews")
      .select("id, rating, comment, created_at, company_id, application_id, service_order_id, offer_id, reviewer_id, reviewer_role")
      .or(`student_id.eq.${studentId},reviewee_id.eq.${studentId}`)
      .order("created_at", { ascending: false }),
    supabase
      .from("education_entries")
      .select("*")
      .eq("student_id", studentId)
      .order("start_year", { ascending: false }),
    supabase
      .from("contracts")
      .select(`
        id, created_at, status, service_order_id, application_id, company_id,
        application:applications!contracts_application_id_fkey(offers(tytul)), 
        service_order:service_orders!contracts_service_order_id_fkey(package:service_packages(title))
      `)
      .eq("student_id", studentId)
      .order("created_at", { ascending: false })
  ]);

  const manualProjects = projectsRes.data ?? [];
  const reviews = reviewsRes.data ?? [];
  const education = educationRes.data ?? [];
  const potentialContracts = completedContractsRes.data ?? [];

  // Normalize Contracts into Projects
  // Show if status is 'completed' OR if a review exists (implies completion)
  const normalizedProjects: any[] = [];

  potentialContracts.forEach((c: any) => {
    // Check if this contract has a review (Review implies completion)
    // Match by Application ID or Service Order ID
    const hasReview = reviews.some((r: any) =>
      (c.application_id && r.application_id === c.application_id) ||
      (c.service_order_id && r.service_order_id === c.service_order_id)
    );

    // Allow if implicitly reviewed OR explicitly completed/delivered
    const isExplicitlyCompleted = ['completed', 'delivered', 'accepted'].includes(c.status);

    if (isExplicitlyCompleted || hasReview) {
      let title = "Zrealizowany Projekt";
      // Check Application -> Offer Title
      if (c.application?.offers?.tytul) {
        title = c.application.offers.tytul;
      }
      // Check Service Order -> Package Title
      else if (c.service_order?.package?.title) {
        title = c.service_order.package.title;
      }

      normalizedProjects.push({
        id: c.id,
        title: title,
        summary: "Projekt zakończony sukcesem w ramach platformy Student2Work.",
        link: null,
        created_at: c.created_at,
        company_id: c.company_id
      });
    }
  });

  const projects = [...manualProjects, ...normalizedProjects]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const avg =
    reviews.length > 0
      ? reviews.reduce((s: number, r: any) => s + (Number(r.rating) || 0), 0) / reviews.length
      : null;

  const companyIds = Array.from(new Set(
    reviews.map((r: any) => r.company_id || (r.reviewer_role === 'company' ? r.reviewer_id : null)).filter(Boolean)
  ));
  const { data: companies } = companyIds.length
    ? await supabase.from("company_profiles").select("user_id, nazwa").in("user_id", companyIds)
    : { data: [] as any[] };
  const companyName = new Map((companies ?? []).map((c: any) => [c.user_id, c.nazwa]));

  const publicName = sp.public_name?.trim() || "Student";
  const kompetencje = Array.isArray(sp.kompetencje) ? sp.kompetencje : [];
  const initials = publicName.split(" ").map((n: string) => n[0]).join("").substring(0, 2).toUpperCase();

  return (
    <main className="min-h-screen bg-slate-50/50 pb-20">
      {/* Header Banner */}
      <div className="h-48 w-full bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-800 relative">
        <div className="absolute top-4 left-4">
          <BackButton label="← Wróć" variant="ghost" fallbackUrl="/app" />
        </div>
      </div>

      <div className="container mx-auto max-w-6xl px-4 sm:px-6 -mt-20 relative z-10">
        <div className="grid lg:grid-cols-12 gap-8">

          {/* LEFT SIDEBAR */}
          <div className="lg:col-span-4 space-y-6">
            {/* Profile Card */}
            <Card className="overflow-hidden shadow-lg border-none ring-1 ring-slate-200 bg-white">
              <CardContent className="pt-0 px-0 flex flex-col items-center">
                <div className="mt-6 mb-4 p-1 bg-white rounded-full">
                  <Avatar className="h-32 w-32 border-4 border-white shadow-xl">
                    <AvatarFallback className="bg-slate-100 text-slate-400 text-3xl font-bold">{initials}</AvatarFallback>
                  </Avatar>
                </div>

                <div className="text-center px-6 pb-6 w-full">
                  <h1 className="text-2xl font-bold text-slate-900">{publicName}</h1>
                  {sp.sciezka && (
                    <Badge variant="secondary" className="mt-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100">
                      {sp.sciezka}
                    </Badge>
                  )}

                  <div className="flex justify-center gap-3 mt-6">
                    {sp.linkedin_url && (
                      <Button asChild variant="outline" size="sm" className="rounded-full">
                        <a href={sp.linkedin_url} target="_blank" rel="noreferrer">
                          <Linkedin className="h-4 w-4 mr-2" />
                          LinkedIn
                        </a>
                      </Button>
                    )}
                    {sp.portfolio_url && (
                      <Button asChild variant="outline" size="sm" className="rounded-full">
                        <a href={sp.portfolio_url} target="_blank" rel="noreferrer">
                          <Globe className="h-4 w-4 mr-2" />
                          Portfolio
                        </a>
                      </Button>
                    )}
                  </div>
                </div>

                <Separator />

                <div className="grid grid-cols-3 w-full divide-x border-b">
                  <div className="p-4 text-center">
                    <div className="text-lg font-bold text-slate-800">{projects.length}</div>
                    <div className="text-[10px] text-slate-500 uppercase">Projekty</div>
                  </div>
                  <div className="p-4 text-center">
                    <div className="text-lg font-bold text-slate-800">{reviews.length}</div>
                    <div className="text-[10px] text-slate-500 uppercase">Oceny</div>
                  </div>
                  <div className="p-4 text-center">
                    <div className="text-lg font-bold text-emerald-600">{avg ? avg.toFixed(1) : "-"}</div>
                    <div className="text-[10px] text-slate-500 uppercase">Średnia</div>
                  </div>
                </div>

                <div className="w-full p-6 space-y-4 bg-slate-50/50">
                  <h3 className="font-semibold text-sm flex items-center gap-2 text-slate-700">
                    <Sparkles className="h-4 w-4 text-amber-500" />
                    Główne Kompetencje
                  </h3>
                  <div className="flex flex-wrap gap-1.5">
                    {kompetencje.length > 0 ? (
                      kompetencje.slice(0, 15).map((k: string) => (
                        <Badge key={k} variant="outline" className="bg-white text-slate-600 font-normal">
                          {k}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-sm text-muted-foreground italic">Brak dodanych kompetencji.</span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Education Card - Simplified / Timeline */}
            <Card className="shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <GraduationCap className="h-4 w-4 text-indigo-500" />
                  Edukacja
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Show database entries if available, otherwise fallback to simple fields */}
                {education.length > 0 ? (
                  <div className="space-y-4 relative pl-2">
                    <div className="absolute left-[3px] top-2 bottom-2 w-0.5 bg-slate-200"></div>
                    {education.map((edu: any) => (
                      <div key={edu.id} className="relative pl-5">
                        <div className="absolute left-[-2px] top-1.5 h-2.5 w-2.5 rounded-full bg-white border-2 border-indigo-400"></div>
                        <div className="text-sm font-semibold text-slate-800">{edu.school_name}</div>
                        <div className="text-xs text-slate-600">{edu.field_of_study} {edu.degree ? `(${edu.degree})` : ''}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          {edu.start_year} - {edu.is_current ? "Obecnie" : edu.end_year}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : sp.kierunek ? (
                  <div className="flex items-start gap-3">
                    <div className="h-8 w-8 rounded-lg bg-indigo-50 flex items-center justify-center flex-shrink-0">
                      <BookOpen className="h-4 w-4 text-indigo-600" />
                    </div>
                    <div>
                      <div className="font-medium text-sm text-slate-800">Uczelnia Wyższa</div>
                      <div className="text-sm text-slate-600">{sp.kierunek}</div>
                      {sp.rok && <Badge variant="secondary" className="mt-1 text-[10px] h-5">Rok {sp.rok}</Badge>}
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground italic">Brak informacji o edukacji.</div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* MAIN CONTENT */}
          <div className="lg:col-span-8 space-y-8">

            {/* Bio / About */}
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <span className="bg-indigo-600 w-1 h-6 rounded-full inline-block"></span>
                O mnie
              </h2>
              <Card className="shadow-sm bg-white">
                <CardContent className="p-6">
                  {sp.bio ? (
                    <p className="text-slate-600 leading-relaxed whitespace-pre-wrap">{sp.bio}</p>
                  ) : (
                    <p className="text-slate-400 italic">Student nie dodał jeszcze opisu "O mnie".</p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Experience / Projects */}
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <span className="bg-purple-600 w-1 h-6 rounded-full inline-block"></span>
                Doświadczenie i Projekty
              </h2>

              {/* Only show 'doswiadczenie' text if no structured projects? OR show both. styling text block first. */}
              {sp.doswiadczenie && (
                <Card className="shadow-sm mb-4 border-l-4 border-l-purple-500/20">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm uppercase tracking-wide text-slate-500 font-semibold">Opis doświadczenia</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-slate-600 whitespace-pre-wrap">{sp.doswiadczenie}</p>
                  </CardContent>
                </Card>
              )}

              {projects.length > 0 ? (
                <div className="grid md:grid-cols-2 gap-4">
                  {projects.map((p: any) => (
                    <Card key={p.id} className="group hover:border-indigo-300 transition-colors cursor-default">
                      <CardHeader className="pb-3">
                        <div className="flex justify-between items-start gap-2">
                          <CardTitle className="text-base font-semibold text-slate-800 line-clamp-2 group-hover:text-indigo-700 transition-colors">
                            {p.title || "Bez tytułu"}
                          </CardTitle>
                          <FolderGit2 className="h-5 w-5 text-slate-300 group-hover:text-indigo-400" />
                        </div>
                        <div className="text-xs text-slate-400">{fmtDate(p.created_at)}</div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <p className="text-sm text-slate-600 line-clamp-3 leading-relaxed">
                          {p.summary || "Brak opisu."}
                        </p>
                        {p.link && (
                          <Button asChild variant="link" className="px-0 h-auto text-indigo-600">
                            <a href={p.link} target="_blank" rel="noreferrer">
                              Zobacz projekt →
                            </a>
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  <Briefcase className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-slate-500">Brak zrealizowanych projektów w Student2Work.</p>
                </div>
              )}
            </div>

            {/* Reviews */}
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <span className="bg-amber-500 w-1 h-6 rounded-full inline-block"></span>
                Referencje
              </h2>

              {reviews.length > 0 ? (
                <div className="grid gap-4">
                  {reviews.map((r: any) => {
                    const cId = r.company_id || r.reviewer_id;
                    const cName = companyName.get(cId) || "Firma";
                    return (
                      <ReviewCard
                        key={r.id}
                        id={r.id}
                        rating={Number(r.rating) || 5}
                        comment={r.comment}
                        createdAt={r.created_at}
                        reviewerId={cId}
                        reviewerName={cName}
                        reviewerLink={`/app/companies/${cId}`}
                      />
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 bg-slate-50 rounded-xl">
                  <p className="text-slate-500">Ten student nie posiada jeszcze opinii.</p>
                </div>
              )}
            </div>

          </div>
        </div>
      </div>



    </main>
  );
}
