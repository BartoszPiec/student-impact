/* eslint-disable @typescript-eslint/no-explicit-any */
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BookOpen,
  Briefcase,
  Calendar,
  ExternalLink,
  FolderGit2,
  Globe,
  GraduationCap,
  Linkedin,
  MessageSquare,
  Sparkles,
} from "lucide-react";
import BackButton from "@/components/back-button";
import { ReviewCard } from "@/components/ReviewCard";
import { PremiumPageHeader } from "@/components/ui/premium-page-header";
import { PageContainer } from "@/components/ui/page-container";

export const dynamic = "force-dynamic";

function fmtDate(ts?: string | null) {
  if (!ts) return "";
  try {
    return new Intl.DateTimeFormat("pl-PL", { dateStyle: "medium" }).format(new Date(ts));
  } catch {
    return ts;
  }
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
        application:applications!contracts_application_id_fkey(offers(tytul, id)),
        service_order:service_orders!contracts_service_order_id_fkey(package:service_packages(title, id))
      `)
      .eq("student_id", studentId)
      .order("created_at", { ascending: false })
  ]);

  const manualProjects = projectsRes.data ?? [];
  const reviews = reviewsRes.data ?? [];
  const education = educationRes.data ?? [];
  const potentialContracts = completedContractsRes.data ?? [];

  const normalizedProjects: any[] = [];

  potentialContracts.forEach((c: any) => {
    const hasReview = reviews.some((r: any) =>
      (c.application_id && r.application_id === c.application_id) ||
      (c.service_order_id && r.service_order_id === c.service_order_id)
    );
    const isExplicitlyCompleted = ['completed', 'delivered', 'accepted'].includes(c.status);

    if (isExplicitlyCompleted || hasReview) {
      let link = null;
      let title = "Zrealizowany Projekt";

      const app = Array.isArray(c.application) ? c.application[0] : c.application;
      const so = Array.isArray(c.service_order) ? c.service_order[0] : c.service_order;
      const offer = app?.offers ? (Array.isArray(app.offers) ? app.offers[0] : app.offers) : null;
      const pkg = so?.package ? (Array.isArray(so.package) ? so.package[0] : so.package) : null;

      if (offer?.tytul) {
        title = offer.tytul;
        if (offer.id) link = `/app/offers/${offer.id}`;
      } else if (pkg?.title) {
        title = pkg.title;
        if (pkg.id) link = `/app/offers/${pkg.id}`;
      }
      if (!link && c.application_id) {
        link = `/app/deliverables/${c.application_id}`;
      }

      normalizedProjects.push({
        id: c.id,
        title,
        summary: "Projekt zakończony sukcesem w ramach platformy Student2Work.",
        link,
        created_at: c.created_at,
        company_id: c.company_id,
        isFromPlatform: true,
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
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_#f8f9ff_0%,_#f3f5ff_35%,_#edf2ff_100%)] pb-24">

      <PremiumPageHeader
        badge="Profil Studenta"
        title={publicName}
        description={sp.sciezka ? `${sp.sciezka}${sp.kierunek ? ` · ${sp.kierunek}` : ""}` : "Przeglądaj doświadczenie, projekty i opinie kandydata."}
        icon={
          <span className="text-3xl font-black text-indigo-300">{initials}</span>
        }
        actions={
          <BackButton label="Wróć" variant="secondary" fallbackUrl="/app" />
        }
      />

      <PageContainer className="max-w-6xl space-y-8">

        {/* QUICK STATS ROW */}
        <div className="grid grid-cols-3 gap-4 sm:grid-cols-6">
          {[
            { label: "Projekty", value: projects.length, accent: "text-indigo-600" },
            { label: "Opinie", value: reviews.length, accent: "text-slate-900" },
            { label: "Śr. ocena", value: avg ? avg.toFixed(1) : "—", accent: "text-emerald-600" },
          ].map((stat) => (
            <div
              key={stat.label}
              className="col-span-1 sm:col-span-2 rounded-[1.5rem] border border-slate-200/70 bg-white p-5 text-center shadow-sm"
            >
              <div className={`text-3xl font-black ${stat.accent}`}>{stat.value}</div>
              <div className="mt-1 text-xs font-bold uppercase tracking-widest text-slate-400">{stat.label}</div>
            </div>
          ))}
        </div>

        <div className="grid gap-8 lg:grid-cols-12">

          {/* LEFT SIDEBAR */}
          <div className="lg:col-span-4 space-y-6">

            {/* Profile Card */}
            <div className="overflow-hidden rounded-[2rem] border border-slate-200/70 bg-white shadow-[0_20px_60px_-30px_rgba(71,85,105,0.3)]">
              {/* Avatar header */}
              <div className="relative bg-gradient-to-br from-indigo-500 to-purple-600 px-6 pt-10 pb-12 text-center">
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(255,255,255,0.1),transparent_60%)]" />
              </div>
              <div className="relative -mt-8 flex justify-center">
                <div className="h-16 w-16 rounded-2xl border-4 border-white bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg flex items-center justify-center text-white text-xl font-black">
                  {initials}
                </div>
              </div>

              <div className="px-6 pb-6 pt-4 text-center space-y-3">
                <h2 className="text-xl font-extrabold text-slate-900">{publicName}</h2>
                {sp.sciezka && (
                  <Badge className="rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700">
                    {sp.sciezka}
                  </Badge>
                )}

                {/* External links */}
                <div className="flex justify-center gap-2 pt-1">
                  {sp.linkedin_url && (
                    <Button asChild variant="outline" size="sm" className="rounded-full border-slate-200 text-slate-600 hover:border-indigo-200 hover:text-indigo-600">
                      <a href={sp.linkedin_url} target="_blank" rel="noreferrer">
                        <Linkedin className="h-3.5 w-3.5 mr-1.5" />
                        LinkedIn
                      </a>
                    </Button>
                  )}
                  {sp.portfolio_url && (
                    <Button asChild variant="outline" size="sm" className="rounded-full border-slate-200 text-slate-600 hover:border-indigo-200 hover:text-indigo-600">
                      <a href={sp.portfolio_url} target="_blank" rel="noreferrer">
                        <Globe className="h-3.5 w-3.5 mr-1.5" />
                        Portfolio
                      </a>
                    </Button>
                  )}
                </div>

                {/* CTA */}
                <div className="pt-3">
                  <Button
                    asChild
                    className="w-full rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 font-bold text-white shadow-lg shadow-indigo-500/20 hover:opacity-95"
                  >
                    <Link href={`/app/chat?contact=${studentId}`}>
                      <MessageSquare className="mr-2 h-4 w-4" />
                      Wyślij wiadomość
                    </Link>
                  </Button>
                </div>
              </div>

              {/* Competencies */}
              {kompetencje.length > 0 && (
                <div className="border-t border-slate-50 bg-slate-50/50 px-6 py-5">
                  <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-700">
                    <Sparkles className="h-4 w-4 text-amber-500" />
                    Kompetencje
                  </h3>
                  <div className="flex flex-wrap gap-1.5">
                    {kompetencje.slice(0, 15).map((k: string) => (
                      <Badge
                        key={k}
                        className="rounded-full border border-indigo-100 bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-700"
                      >
                        {k}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Education Card */}
            <Card className="overflow-hidden rounded-[2rem] border border-slate-200/70 bg-white shadow-sm">
              <CardHeader className="border-b border-slate-50 pb-3">
                <CardTitle className="flex items-center gap-2 text-sm font-bold text-slate-700">
                  <GraduationCap className="h-4 w-4 text-indigo-500" />
                  Edukacja
                </CardTitle>
              </CardHeader>
              <CardContent className="p-5 space-y-4">
                {education.length > 0 ? (
                  <div className="relative space-y-5 pl-2 pt-2">
                    <div className="absolute left-[7px] top-3 bottom-3 w-0.5 bg-indigo-100" />
                    {education.map((edu: any) => (
                      <div key={edu.id} className="relative pl-8">
                        <div className="absolute left-0 top-1.5 h-4 w-4 rounded-full border-4 border-indigo-500 bg-white shadow-sm z-10" />
                        <div className="text-sm font-bold text-slate-800">{edu.school_name}</div>
                        <div className="text-xs text-indigo-600 font-medium mb-0.5">
                          {edu.field_of_study}{edu.degree ? ` (${edu.degree})` : ""}
                        </div>
                        <div className="flex items-center gap-1 text-[10px] text-slate-400 font-medium">
                          <Calendar className="h-3 w-3" />
                          {edu.start_year} – {edu.is_current ? "Obecnie" : edu.end_year}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : sp.kierunek ? (
                  <div className="flex items-start gap-3">
                    <div className="h-8 w-8 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0">
                      <BookOpen className="h-4 w-4 text-indigo-600" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-slate-800">Uczelnia wyższa</div>
                      <div className="text-sm text-slate-600">{sp.kierunek}</div>
                      {sp.rok && (
                        <Badge variant="secondary" className="mt-1 text-[10px] h-5">Rok {sp.rok}</Badge>
                      )}
                    </div>
                  </div>
                ) : (
                  <p className="text-sm italic text-slate-400">Brak informacji o edukacji.</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* MAIN CONTENT */}
          <div className="lg:col-span-8 space-y-8">

            {/* Bio */}
            <div className="overflow-hidden rounded-[2rem] border border-slate-200/70 bg-white p-8 shadow-[0_20px_60px_-30px_rgba(71,85,105,0.15)]">
              <h2 className="mb-5 flex items-center gap-2 text-xl font-extrabold text-slate-900">
                <span className="inline-block h-6 w-1 rounded-full bg-indigo-600" />
                O mnie
              </h2>
              {sp.bio ? (
                <p className="text-lg leading-relaxed text-slate-600 whitespace-pre-wrap">{sp.bio}</p>
              ) : (
                <p className="italic text-slate-400">Student nie dodał jeszcze opisu &quot;O mnie&quot;.</p>
              )}
            </div>

            {/* Experience */}
            {sp.doswiadczenie && (
              <div className="overflow-hidden rounded-[2rem] border border-slate-200/70 bg-white p-8 shadow-[0_20px_60px_-30px_rgba(71,85,105,0.15)]">
                <h2 className="mb-5 flex items-center gap-2 text-xl font-extrabold text-slate-900">
                  <span className="inline-block h-6 w-1 rounded-full bg-purple-600" />
                  Doświadczenie
                </h2>
                <div className="rounded-2xl border border-indigo-100 bg-indigo-50/30 p-5">
                  <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.15em] text-indigo-500">
                    <Briefcase className="h-3.5 w-3.5" />
                    Opis doświadczenia
                  </div>
                  <p className="text-base leading-relaxed text-slate-700 whitespace-pre-wrap">{sp.doswiadczenie}</p>
                </div>
              </div>
            )}

            {/* Projects / Portfolio */}
            {projects.length > 0 && (
              <div className="overflow-hidden rounded-[2rem] border border-slate-200/70 bg-white p-8 shadow-[0_20px_60px_-30px_rgba(71,85,105,0.15)]">
                <h2 className="mb-6 flex items-center gap-2 text-xl font-extrabold text-slate-900">
                  <span className="inline-block h-6 w-1 rounded-full bg-emerald-500" />
                  Portfolio i projekty
                  <span className="ml-2 rounded-full bg-slate-100 px-2.5 py-0.5 text-sm font-bold text-slate-500">
                    {projects.length}
                  </span>
                </h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  {projects.map((project: any) => (
                    <div
                      key={project.id}
                      className="group relative rounded-2xl border border-slate-100 bg-slate-50/80 p-5 transition-all hover:-translate-y-0.5 hover:border-indigo-100 hover:bg-white hover:shadow-md"
                    >
                      <div className="mb-3 flex items-start justify-between gap-2">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm border border-slate-100">
                          <FolderGit2 className="h-4 w-4 text-indigo-500" />
                        </div>
                        {project.isFromPlatform && (
                          <Badge className="rounded-full bg-emerald-50 border border-emerald-100 text-emerald-600 text-[9px] font-black uppercase tracking-widest px-2 py-0.5 shrink-0">
                            Platforma
                          </Badge>
                        )}
                      </div>
                      <h3 className="font-bold text-slate-900 leading-snug line-clamp-2 mb-2 group-hover:text-indigo-700 transition-colors">
                        {project.title}
                      </h3>
                      {project.summary && (
                        <p className="text-sm text-slate-500 line-clamp-2 leading-relaxed mb-3">
                          {project.summary}
                        </p>
                      )}
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-medium text-slate-400">
                          {fmtDate(project.created_at)}
                        </span>
                        {project.link && (
                          <a
                            href={project.link}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors"
                          >
                            Otwórz
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Reviews */}
            <div className="overflow-hidden rounded-[2rem] border border-slate-200/70 bg-white p-8 shadow-[0_20px_60px_-30px_rgba(71,85,105,0.15)]">
              <h2 className="mb-6 flex items-center gap-2 text-xl font-extrabold text-slate-900">
                <span className="inline-block h-6 w-1 rounded-full bg-amber-500" />
                Referencje
                {reviews.length > 0 && (
                  <span className="ml-2 rounded-full bg-slate-100 px-2.5 py-0.5 text-sm font-bold text-slate-500">
                    {reviews.length}
                  </span>
                )}
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
                <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 py-10 text-center">
                  <p className="text-sm font-medium text-slate-400">Ten student nie posiada jeszcze opinii.</p>
                </div>
              )}
            </div>

          </div>
        </div>
      </PageContainer>
    </main>
  );
}
