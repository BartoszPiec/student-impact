import type { Metadata, ResolvingMetadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import ApplyCard from "./apply-card";
import SaveButton from "./save-button";
import { openChatForApplication, openChatForOfferInquiry } from "@/app/app/chat/_actions";
import { Clock, MapPin, Building2, Banknote, Briefcase, GraduationCap, ArrowLeft, CheckCircle2, MessageSquare, Lock, HelpCircle, Star, Zap } from "lucide-react";
import { PageContainer } from "@/components/ui/page-container";

export const dynamic = "force-dynamic";

function AppStatusLabel(status: string) {
  if (status === "accepted") return <span className="text-emerald-600 font-bold">Zaakceptowana</span>;
  if (status === "rejected") return <span className="text-red-500 font-bold">Odrzucona</span>;
  if (status === "countered") return <span className="text-amber-500 font-bold">Negocjacje</span>;
  return <span className="text-blue-500 font-bold">Wysłana</span>;
}

export async function generateMetadata(
  { params }: { params: Promise<{ id: string }> },
  parent: ResolvingMetadata
): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();
  const { data: offer } = await supabase
    .from("offers")
    .select("tytul, opis, company_profiles(nazwa)")
    .eq("id", id)
    .maybeSingle();
 
  if (!offer) {
    return {
      title: "Oferta nie znaleziona | Student2Work",
    };
  }

  const companyName = (offer as any).company_profiles?.nazwa || "Firma";
  const desc = offer.opis ? offer.opis.substring(0, 160).trim() + (offer.opis.length > 160 ? "..." : "") : "Sprawdź tę ofertę na platformie Student2Work!";
 
  return {
    title: `${offer.tytul} | ${companyName} - Student2Work`,
    description: desc,
    openGraph: {
      title: `${offer.tytul} | ${companyName}`,
      description: desc,
      type: "website",
      siteName: "Student2Work",
    },
    twitter: {
      card: "summary_large_image",
      title: `${offer.tytul} | ${companyName}`,
      description: desc,
    },
  };
}

export default async function OfferDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  if (!id || id === "undefined") redirect("/app");

  // Fetch Offer
  const { data: offer, error } = await supabase
    .from("offers")
    .select(
      "*, company_profiles(nazwa, logo_url)"
    )
    .eq("id", id)
    .maybeSingle();

  if (error || !offer) redirect("/app");

  // User Context
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;

  let role: string | null = null;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("user_id", user.id)
      .single();
    role = profile?.role ?? null;
  }

  // Check if owner
  const isOwner = user && user.id === offer.company_id;
  const canApply = role === "student";

  // Check Saved Status
  let isSaved = false;
  if (user && role === "student") {
    const { data: saved } = await supabase
      .from("saved_offers")
      .select("offer_id")
      .eq("student_id", user.id)
      .eq("offer_id", offer.id)
      .maybeSingle();
    isSaved = !!saved;
  }

  // Check Application Status
  let myApplication: { id: string; status: string } | null = null;
  if (user && role === "student") {
    const { data: app } = await supabase
      .from("applications")
      .select("id, status")
      .eq("offer_id", offer.id)
      .eq("student_id", user.id)
      .maybeSingle();

    if (app?.id) myApplication = { id: app.id, status: app.status ?? "sent" };
  }

  // Fetch Review if Completed
  let myReview: any = null;
  if (myApplication?.status === 'completed' && user) {
    const { data: rev } = await supabase
      .from("reviews")
      .select("rating, comment")
      .eq("application_id", myApplication.id)
      .eq("reviewer_role", "company")
      .maybeSingle();
    myReview = rev;
  }

  // Check if offer is editable (not in progress)
  let isEditable = isOwner && (offer.status ?? "published") === "published";
  if (isEditable) {
    const { count } = await supabase.from("applications").select("*", { count: 'exact', head: true }).eq("offer_id", offer.id).eq("status", "accepted");
    if (count && count > 0) isEditable = false;
  }

  const openChatAction = myApplication ? openChatForApplication.bind(null, myApplication.id) : null;
  const askQuestionAction = openChatForOfferInquiry.bind(null, offer.id);

  // Format Helpers
  let salaryDisplay = "";
  if (offer.salary_range_min && offer.salary_range_max) {
    salaryDisplay = `${offer.salary_range_min} - ${offer.salary_range_max} PLN`;
  } else if (offer.salary_range_min) {
    salaryDisplay = `od ${offer.salary_range_min} PLN`;
  } else if (offer.stawka) {
    salaryDisplay = `${offer.stawka} PLN`;
  } else {
    salaryDisplay = "-";
  }

  const companyName = (offer as any).company_profiles?.nazwa || "Firma";
  const isJob = (offer.typ === "job" || offer.typ === "Praca" || offer.typ === "praca");
  const periodLabel = offer.salary_period === "hourly" ? "godz." : (isJob ? "mies." : "projekt");

  // --- PARSING DESCRIPTION FOR SYSTEM SERVICES ---
  const separator = "--- SZCZEGÓŁY ZAMÓWIENIA ---";
  const hasDetails = offer.opis && offer.opis.includes(separator);

  let descriptionMain = offer.opis;
  let customDetails: Array<{ label: string, value: string }> = [];

  if (hasDetails) {
    const parts = offer.opis.split(separator);
    descriptionMain = parts[0]; 
    const detailsBlock = parts[1];
    const lines = detailsBlock.split("\n").filter((l: string) => l.trim().length > 0);
    lines.forEach((line: string) => {
      if (line.includes(":")) {
        const [rawKey, ...valParts] = line.split(":");
        const val = valParts.join(":").trim();
        if (val && !rawKey.includes("LINK DO MATERIAŁÓW") && !rawKey.includes("Dodatkowe uwagi") && !rawKey.includes("Preferowany termin")) {
          customDetails.push({ label: rawKey.trim(), value: val });
        }
      }
    });
  }

  const isPlatformService = (offer as any).is_platform_service || false;
  const gradient = isPlatformService ? "from-amber-600 to-orange-600" 
    : isJob ? "from-blue-600 to-indigo-700" 
    : "from-violet-600 to-purple-700";
  const briefSections = [
    {
      label: "Cel wspolpracy",
      value: (offer as any).cel_wspolpracy,
      tone: "bg-blue-50 border-blue-100 text-blue-700",
    },
    {
      label: "Oczekiwany rezultat",
      value: (offer as any).oczekiwany_rezultat,
      tone: "bg-emerald-50 border-emerald-100 text-emerald-700",
    },
    {
      label: "Kryteria akceptacji",
      value: (offer as any).kryteria_akceptacji,
      tone: "bg-amber-50 border-amber-100 text-amber-700",
    },
  ].filter((item) => Boolean(item.value));
  const collaborationMeta = [
    (offer as any).osoba_prowadzaca
      ? { label: "Osoba prowadzaca", value: (offer as any).osoba_prowadzaca }
      : null,
    (offer as any).planowany_start
      ? {
          label: "Planowany start",
          value: new Date((offer as any).planowany_start).toLocaleDateString("pl-PL"),
        }
      : null,
    offer.czas ? { label: "Czas realizacji", value: offer.czas } : null,
    (offer as any).tryb_pracy
      ? {
          label: "Tryb pracy",
          value:
            (offer as any).tryb_pracy === "remote"
              ? "Remote"
              : (offer as any).tryb_pracy === "hybrid"
                ? "Hybrydowo"
                : "Na miejscu",
        }
      : null,
  ].filter(Boolean);
  const formalSignals = [
    (offer as any).wymagana_poufnosc ? "Poufnosc wymagana" : null,
    (offer as any).przeniesienie_praw_autorskich ? "Przeniesienie praw autorskich" : null,
    (offer as any).portfolio_dozwolone ? "Portfolio dozwolone" : "Portfolio wymaga uzgodnienia",
    (offer as any).materialy_legalnie_udostepnione ? "Materialy firmy zweryfikowane" : null,
  ].filter(Boolean);

  return (
    <main className="min-h-screen bg-slate-50/50 pb-20 font-sans">
      {/* ═══ PREMIUM DARK HERO ═══ */}
      <div className="relative overflow-hidden bg-[#0a0f1c] pb-32 pt-16">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className={`absolute top-[-20%] left-[-10%] w-[50%] h-[80%] rounded-full opacity-20 blur-[120px] bg-gradient-to-br ${gradient}`} />
            <div className={`absolute bottom-[-20%] right-[-10%] w-[40%] h-[60%] rounded-full opacity-20 blur-[100px] bg-gradient-to-tl ${gradient}`} />
            <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-[0.03] bg-repeat" />
        </div>

        <PageContainer className="relative z-10">
          <Link href="/app/jobs" className="inline-flex items-center text-sm font-medium text-slate-300 hover:text-white mb-10 transition-colors group bg-white/5 backdrop-blur-md px-5 py-2.5 rounded-full border border-white/10 hover:bg-white/10">
            <ArrowLeft className="h-4 w-4 mr-2 transition-transform group-hover:-translate-x-1" /> 
            Wróć do listy ofert
          </Link>

          <div className="flex flex-col lg:flex-row items-start justify-between gap-10">
            <div className="flex flex-col md:flex-row items-start gap-8 flex-1">
              <div className="h-20 w-20 md:h-28 md:w-28 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0 shadow-2xl backdrop-blur-xl group hover:scale-105 transition-transform duration-500">
                <Building2 className={`h-10 w-10 ${isPlatformService ? 'text-amber-400' : 'text-indigo-400'} drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]`} />
              </div>
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-3">
                  <Badge className="bg-white/10 backdrop-blur-md border border-white/10 text-white text-sm font-medium px-4 py-1.5 rounded-full shadow-[0_0_20px_rgba(255,255,255,0.05)]">
                    <Briefcase className="w-4 h-4 mr-1.5 opacity-80" />
                    {isJob ? "Praca & Staż" : "Mikrozlecenie"}
                  </Badge>
                  {isPlatformService && (
                    <Badge className="bg-amber-500/20 backdrop-blur-md border border-amber-400/20 text-amber-100 text-sm font-medium px-4 py-1.5 rounded-full pb-1 pt-1.5">
                      <Zap className="h-4 w-4 mr-1" />
                      Systemowe
                    </Badge>
                  )}
                </div>
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-br from-white to-white/70 tracking-tight leading-tight">
                  {offer.tytul}
                </h1>
                <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-slate-300 font-medium text-sm md:text-base mt-4">
                  <span className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 opacity-70" />
                    <Link href={`/app/companies/${offer.company_id}`} className="hover:text-white transition-colors border-b border-transparent hover:border-white/50 pb-0.5">
                      {companyName}
                    </Link>
                  </span>
                  <span className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 opacity-70" />
                    {offer.is_remote ? (offer.location ? `Remote • ${offer.location}` : "Praca zdalna") : offer.location}
                  </span>
                  <span className="flex items-center gap-2">
                    <Clock className="h-4 w-4 opacity-70" />
                    Dodano: {new Date(offer.created_at).toLocaleDateString("pl-PL")}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-4 relative z-20 mt-4 lg:mt-0">
              {isEditable && (
                <Button asChild variant="outline" className="rounded-2xl border-white/10 bg-white/5 hover:bg-white/10 text-white font-bold h-12 px-6">
                  <Link href={`/app/company/offers/${offer.id}/edit`}>Edytuj ofertę</Link>
                </Button>
              )}
              {role === "student" && !isOwner && !myApplication && (
                <form action={askQuestionAction}>
                  <Button variant="secondary" className="h-12 px-6 rounded-2xl bg-white text-slate-900 hover:bg-slate-100 font-bold shadow-xl">
                    <HelpCircle className="mr-2 h-4 w-4 text-indigo-500" /> Dopytaj o ofertę
                  </Button>
                </form>
              )}
              {role === "student" && (
                <SaveButton offerId={offer.id} isSaved={isSaved} />
              )}
            </div>
          </div>
        </PageContainer>
      </div>

      {/* ═══ MAIN CONTENT GRID ═══ */}
      <PageContainer className="-mt-16 relative z-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10">

          <div className="lg:col-span-8 space-y-8">
            {/* Description - General */}
            <section className="bg-white rounded-[2rem] p-8 md:p-12 shadow-xl shadow-slate-200/50 border border-slate-100">
              <h3 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em] mb-8 flex items-center gap-3">
                <span className="w-8 h-1 bg-indigo-500 rounded-full"></span>
                Opis oferty
              </h3>
              <div className="prose prose-slate max-w-none leading-relaxed text-slate-600 text-lg whitespace-pre-line font-medium">
                {descriptionMain}
              </div>
            </section>

            {(briefSections.length > 0 || collaborationMeta.length > 0 || formalSignals.length > 0) && (
              <section className="bg-white/80 backdrop-blur-xl rounded-[2rem] p-8 md:p-12 border border-white shadow-xl shadow-slate-200/20">
                <h3 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em] mb-10 flex items-center gap-3">
                  <span className="w-8 h-1 bg-blue-500 rounded-full"></span>
                  Brief wspolpracy
                </h3>

                {briefSections.length > 0 && (
                  <div className="grid gap-6">
                    {briefSections.map((section) => (
                      <div key={section.label} className="rounded-[1.75rem] border border-slate-100 bg-white p-6 shadow-sm">
                        <div className={`inline-flex rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] ${section.tone}`}>
                          {section.label}
                        </div>
                        <p className="mt-4 whitespace-pre-line text-base font-medium leading-8 text-slate-700">
                          {section.value}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                {(collaborationMeta.length > 0 || formalSignals.length > 0) && (
                  <div className="mt-8 grid gap-6 md:grid-cols-2">
                    {collaborationMeta.length > 0 && (
                      <div className="rounded-[1.75rem] border border-slate-100 bg-slate-50 p-6">
                        <p className="mb-4 text-xs font-black uppercase tracking-widest text-slate-400">Ustalenia operacyjne</p>
                        <div className="grid gap-3">
                          {collaborationMeta.map((item: any) => (
                            <div key={item.label} className="rounded-2xl border border-white bg-white px-4 py-4 shadow-sm">
                              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{item.label}</p>
                              <p className="mt-2 text-sm font-bold text-slate-900">{item.value}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {formalSignals.length > 0 && (
                      <div className="rounded-[1.75rem] border border-slate-100 bg-slate-50 p-6">
                        <p className="mb-4 text-xs font-black uppercase tracking-widest text-slate-400">Sygaly formalne</p>
                        <div className="flex flex-wrap gap-3">
                          {formalSignals.map((signal) => (
                            <Badge
                              key={signal}
                              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-black uppercase tracking-wider text-slate-700 shadow-sm"
                            >
                              {signal}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </section>
            )}

            {/* Custom Details for System Offers */}
            {customDetails.length > 0 && (
              <section className="bg-white/70 backdrop-blur-xl rounded-[2rem] p-8 md:p-12 border border-white shadow-xl shadow-slate-200/20">
                <h3 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em] mb-10 flex items-center gap-3">
                  <span className="w-8 h-1 bg-purple-500 rounded-full"></span>
                  Szczegóły zlecenia
                </h3>
                <div className="grid sm:grid-cols-2 gap-6">
                  {customDetails.map((detail, idx) => (
                    <div key={idx} className="bg-slate-50/50 p-6 rounded-3xl border border-slate-100 hover:border-purple-200 transition-colors group">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 group-hover:text-purple-500 transition-colors">
                        {detail.label.replace(/[\u{1F300}-\u{1F9FF}]/gu, '')}
                      </p>
                      <p className="font-bold text-slate-900 text-lg">{detail.value}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Technologies / Skills */}
            {offer.technologies && offer.technologies.length > 0 && (
              <section className="bg-white/70 backdrop-blur-xl rounded-[2rem] p-8 md:p-12 border border-white shadow-xl shadow-slate-200/20">
                <h3 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em] mb-8 flex items-center gap-3">
                  <span className="w-8 h-1 bg-emerald-500 rounded-full"></span>
                  Wymagane umiejętności
                </h3>
                <div className="flex flex-wrap gap-3">
                  {offer.technologies.map((tech: string) => (
                    <div key={tech} className="px-5 py-3 bg-white border border-slate-100 rounded-[1rem] text-slate-700 font-bold text-sm flex items-center gap-3 shadow-sm hover:shadow-md hover:border-emerald-200 transition-all cursor-default">
                      <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]"></div>
                      {tech}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Additional Requirements & Time */}
            {isPlatformService ? (
              <section className="bg-indigo-900 rounded-[2.5rem] p-8 md:p-12 shadow-2xl text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-[80px] -mr-32 -mt-32"></div>
                <h3 className="relative z-10 text-sm font-black text-indigo-300 uppercase tracking-[0.2em] mb-10 flex items-center gap-3">
                  <span className="w-8 h-1 bg-amber-400 rounded-full"></span>
                  Zakres Obowiązków
                </h3>
                <div className="relative z-10 space-y-6">
                  {((offer as any).obligations || offer.wymagania) ? (
                    <div className="grid gap-4">
                      {((offer as any).obligations || offer.wymagania)
                        .split(/\n|- |• /)
                        .map((line: string) => line.trim())
                        .filter((line: string) => line.length > 1 && line !== "()")
                        .map((line: string, i: number) => (
                          <div key={i} className="flex items-start gap-4 p-5 bg-white/5 rounded-3xl border border-white/10 hover:bg-white/10 transition-colors">
                            <div className="w-6 h-6 rounded-full bg-amber-400/20 flex items-center justify-center shrink-0 mt-0.5 border border-amber-400/30">
                              <CheckCircle2 className="h-3.5 w-3.5 text-amber-400" />
                            </div>
                            <span className="text-lg font-medium text-indigo-50">{line}</span>
                          </div>
                        ))
                      }
                    </div>
                  ) : (
                    <p className="text-indigo-300 italic font-medium">Brak szczegółowych wytycznych.</p>
                  )}
                </div>
              </section>
            ) : (
              (offer.wymagania || offer.czas) && (
                <section className="bg-white/70 backdrop-blur-xl rounded-[2rem] p-8 md:p-12 border border-white shadow-xl shadow-slate-200/20">
                  <h3 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em] mb-10 flex items-center gap-3">
                    <span className="w-8 h-1 bg-amber-500 rounded-full"></span>
                    Szczegóły współpracy
                  </h3>
                  <div className="grid md:grid-cols-2 gap-10">
                    {offer.wymagania && offer.wymagania !== "()" && (
                      <div className="space-y-3">
                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Dodatkowe wymagania</p>
                        <p className="text-slate-700 font-bold text-lg leading-relaxed">{offer.wymagania}</p>
                      </div>
                    )}
                    {offer.czas && (
                      <div className="space-y-3 p-6 bg-slate-50 rounded-3xl border border-slate-100">
                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Wymiar czasu / Czas trwania</p>
                        <p className="text-indigo-900 font-black text-xl">{offer.czas}</p>
                      </div>
                    )}
                  </div>
                </section>
              )
            )}
          </div>

          {/* RIGHT COLUMN - SIDEBAR */}
          <div className="lg:col-span-4 space-y-8">
            {/* Application Section */}
            <div className="space-y-8">
              {canApply ? (
                myApplication ? (
                  myApplication.status === 'completed' ? (
                    <Card className="border-none rounded-[2.5rem] overflow-hidden shadow-2xl bg-white ring-1 ring-slate-100">
                      <div className="bg-slate-900 px-8 py-10 text-center relative overflow-hidden">
                        <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/5 rounded-full blur-3xl" />
                        <div className="relative z-10 inline-flex w-16 h-16 bg-white/10 border border-white/10 rounded-3xl items-center justify-center text-emerald-400 shadow-xl mb-6 backdrop-blur-md">
                          <CheckCircle2 className="h-8 w-8" />
                        </div>
                        <h4 className="relative z-10 text-2xl font-black text-white mb-2">Zlecenie Zakończone!</h4>
                        <p className="relative z-10 text-slate-400 font-medium text-sm">Gratulacje, proces realizacji dobiegł końca.</p>
                      </div>
                      <CardContent className="p-8 space-y-6">
                        {myReview ? (
                          <div className="space-y-4">
                            <div className="text-center">
                              <div className="flex justify-center gap-1 mb-2">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <Star key={star} className={`w-6 h-6 ${star <= myReview.rating ? "fill-amber-400 text-amber-400" : "text-slate-200"}`} />
                                  ))}
                              </div>
                              <div className="font-bold text-slate-900">Ocena Klienta: {myReview.rating}/5</div>
                            </div>
                            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-sm text-slate-600 italic text-center">
                              "{myReview.comment}"
                            </div>
                          </div>
                        ) : (
                          <div className="text-center text-slate-500 text-sm italic">
                            Klient nie wystawił jeszcze opinii.
                          </div>
                        )}

                        <div className="grid grid-cols-1 gap-4 pt-4">
                          {openChatAction && (
                            <form action={openChatAction}>
                              <Button size="lg" className="w-full bg-slate-900 hover:bg-black text-white font-bold rounded-2xl h-14 shadow-xl">
                                Archiwum wiadomości <MessageSquare className="ml-2 h-5 w-5" />
                              </Button>
                            </form>
                          )}
                          <Button asChild variant="outline" size="lg" className="w-full border-slate-200 text-slate-700 font-bold rounded-2xl h-14 hover:bg-slate-50">
                            <Link href="/app/applications">Moje Aplikacje</Link>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ) : (
                    <Card className="border-none rounded-[2.5rem] overflow-hidden shadow-2xl bg-white ring-1 ring-slate-100">
                      <div className="bg-emerald-500 px-8 py-10 text-center relative overflow-hidden">
                        <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
                        <div className="relative z-10 inline-flex w-16 h-16 bg-white rounded-3xl items-center justify-center text-emerald-600 shadow-xl mb-6">
                          <CheckCircle2 className="h-8 w-8" />
                        </div>
                        <h4 className="relative z-10 text-2xl font-black text-white mb-2">Aplikacja wysłana!</h4>
                        <div className="relative z-10 inline-block px-4 py-1.5 bg-white/20 rounded-full border border-white/20">
                          <span className="text-xs font-black text-white uppercase tracking-widest">
                            Status: {AppStatusLabel(myApplication.status)}
                          </span>
                        </div>
                      </div>
                      <CardContent className="p-8 space-y-6">
                        <p className="text-slate-500 font-medium text-center leading-relaxed">
                          Twoje zgłoszenie trafiło do rekrutera. Możesz śledzić status w panelu lub zadać pytanie przez czat.
                        </p>
                        <div className="grid grid-cols-1 gap-4 pt-4">
                          {openChatAction && (
                            <form action={openChatAction}>
                              <Button size="lg" className="w-full bg-slate-900 hover:bg-black text-white font-bold rounded-2xl h-14 shadow-xl">
                                Otwórz Czat <MessageSquare className="ml-2 h-5 w-5" />
                              </Button>
                            </form>
                          )}
                          <Button asChild variant="outline" size="lg" className="w-full border-slate-200 text-slate-700 font-bold rounded-2xl h-14 hover:bg-slate-50">
                            <Link href="/app/applications">Moje Aplikacje</Link>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )
                ) : (
                  <ApplyCard
                    offerId={offer.id}
                    offerStawka={offer.stawka}
                    offerTyp={offer.typ}
                    formattedSalary={salaryDisplay}
                    className="w-full"
                    isPlatformService={(offer as any).is_platform_service}
                    offerTitle={offer.tytul}
                    offerDescription={offer.opis}
                    obligations={(offer as any).obligations}
                  />
                )
              ) : (
                <Card className="border-none rounded-[2.5rem] bg-slate-50 p-8 text-center border border-dashed border-slate-200">
                  <p className="text-sm font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
                    {isOwner ? "To jest Twoja oferta." : "Zaloguj się jako student, aby aplikować do tego projektu."}
                  </p>
                </Card>
              )}
            </div>

            {/* Quick Summary Card */}
            <Card className="border border-white bg-white/90 backdrop-blur-2xl rounded-[2.5rem] overflow-hidden shadow-[0_8px_40px_rgba(0,0,0,0.06)] relative">
              <div className={`absolute top-0 inset-x-0 h-2 bg-gradient-to-r ${gradient}`} />
              <CardHeader className="p-8 pb-0 relative z-10">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-2 h-2 rounded-full bg-indigo-500" />
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Szybkie informacje</span>
                </div>
              </CardHeader>
              <CardContent className="p-8 pt-6 space-y-8">
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">WYNAGRODZENIE</span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-black text-slate-900 tabular-nums">{salaryDisplay}</span>
                  </div>
                  <span className="text-xs font-bold text-indigo-500 uppercase tracking-wider">Brutto / {periodLabel}</span>
                </div>

                <div className="h-px bg-slate-100" />

                <ul className="space-y-6">
                  <li className="flex items-center justify-between group">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-slate-50 rounded-xl text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-500 transition-colors">
                        <Briefcase className="h-4 w-4" />
                      </div>
                      <span className="text-sm font-bold text-slate-500">Typ oferty</span>
                    </div>
                    <span className="text-sm font-black text-slate-900 uppercase tracking-wider">{offer.typ}</span>
                  </li>
                  <li className="flex items-center justify-between group">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-slate-50 rounded-xl text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-500 transition-colors">
                        <Clock className="h-4 w-4" />
                      </div>
                      <span className="text-sm font-bold text-slate-500">Umowa</span>
                    </div>
                    <span className="text-sm font-black text-slate-900">{offer.contract_type || "-"}</span>
                  </li>
                  <li className="flex items-center justify-between group">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-slate-50 rounded-xl text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-500 transition-colors">
                        <GraduationCap className="h-4 w-4" />
                      </div>
                      <span className="text-sm font-bold text-slate-500">Poziom</span>
                    </div>
                    <span className="text-sm font-black text-slate-900 capitalize">{offer.experience_level === 'intern' ? 'Staż' : (offer.experience_level || "-")}</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </PageContainer>
    </main>
  );
}
