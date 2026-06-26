import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import ApplyCard from "./apply-card";
import SaveButton from "./save-button";
import { openChatForApplication, openChatForOfferInquiry } from "@/app/app/chat/_actions";
import { Clock, MapPin, Building2, Briefcase, GraduationCap, ArrowLeft, CheckCircle2, MessageSquare, Lock, HelpCircle, Star, Zap } from "lucide-react";
import { PageContainer } from "@/components/ui/page-container";
import { ReviewBreakdown } from "@/components/reviews/ReviewBreakdown";
import { parsePackageBriefDescription } from "@/lib/services/package-customization";
import { parseDetailedReviewComment } from "@/lib/reviews";
import { cache } from "react";
import { getRequestContext } from "@/lib/auth/request-context";

export const dynamic = "force-dynamic";

type DetailItem = {
  label: string;
  value: string;
};

type CompanyPublicProfile = {
  user_id?: string | null;
  nazwa?: string | null;
  logo_url?: string | null;
} | null;

type OfferDetails = {
  is_platform_service?: boolean | null;
  cel_wspolpracy?: string | null;
  oczekiwany_rezultat?: string | null;
  kryteria_akceptacji?: string | null;
  osoba_prowadzaca?: string | null;
  planowany_start?: string | null;
  tryb_pracy?: string | null;
  wymagana_poufnosc?: boolean | null;
  przeniesienie_praw_autorskich?: boolean | null;
  portfolio_dozwolone?: boolean | null;
  materialy_legalnie_udostepnione?: boolean | null;
  obligations?: string | string[] | null;
  realization_mode?: "student_defined" | "company_defined" | null;
  company_milestones?: unknown;
};

type ReviewSummary = {
  rating: number;
  comment: string | null;
};

type MetaItem = {
  label: string;
  value: string;
};

type CompanyMilestoneTemplate = {
  title: string;
  acceptance_criteria: string;
};

function getCompanyName(profile: CompanyPublicProfile) {
  return profile?.nazwa || "Firma";
}

const getOfferPageData = cache(async (id: string) => {
  const supabase = await createClient();
  const offerResult = await supabase
    .from("offers")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!offerResult.data) {
    return { offer: null, companyProfile: null, error: offerResult.error };
  }

  const companyResult = offerResult.data.company_id
    ? await supabase
      .from("company_public_profiles")
      .select("user_id, nazwa, logo_url")
      .eq("user_id", offerResult.data.company_id)
      .maybeSingle()
    : { data: null };

  return {
    offer: offerResult.data,
    companyProfile: companyResult.data as CompanyPublicProfile,
    error: offerResult.error,
  };
});

function isMeaningfulText(value: unknown) {
  if (typeof value !== "string") return false;
  const normalized = value.trim();
  return normalized.length > 0 && !["()", "[]", "{}", "-", "—"].includes(normalized);
}

function cleanDetailLabel(label: string) {
  return label.replace(/[\u{1F300}-\u{1FAFF}]/gu, "").trim();
}

function formatDetailValue(label: string, value: string) {
  const normalized = value.trim();
  const lower = normalized.toLowerCase();

  if (lower === "no_logo") return "Logo nie zostało przekazane.";
  if (lower === "platform") return "Kontakt przez platformę Student2Work.";
  if (lower === "brak") return "Brak wskazanych preferencji.";

  if (label.toLowerCase().includes("termin")) {
    const date = new Date(normalized);
    if (!Number.isNaN(date.getTime())) return date.toLocaleDateString("pl-PL");
  }

  return normalized;
}

function buildDetailItems(answersByLabel: Record<string, string>, deadline: string, notes: string): DetailItem[] {
  const items = Object.entries(answersByLabel)
    .filter(([, value]) => isMeaningfulText(value))
    .map(([label, value]) => ({
      label: cleanDetailLabel(label),
      value: formatDetailValue(label, value),
    }));

  if (isMeaningfulText(deadline)) {
    items.push({
      label: "Preferowany termin",
      value: formatDetailValue("Preferowany termin", deadline),
    });
  }

  if (isMeaningfulText(notes)) {
    items.push({
      label: "Dodatkowe uwagi",
      value: notes.trim(),
    });
  }

  return items;
}

function splitTaskLines(value: unknown) {
  const text = Array.isArray(value)
    ? value.filter((entry): entry is string => typeof entry === "string").join("\n")
    : typeof value === "string"
      ? value
      : "";

  return text
    .split(/\r?\n|•|(?:^|\s)-\s+/)
    .map((line) => line.trim())
    .filter((line) => isMeaningfulText(line) && !/^https?:\/\//i.test(line));
}

function parseCompanyMilestones(value: unknown): CompanyMilestoneTemplate[] {
  if (!Array.isArray(value)) return [];

  return value
    .map((entry) => {
      if (!entry || typeof entry !== "object") return null;

      const title = String((entry as { title?: unknown }).title ?? "").trim();
      const acceptance_criteria = String(
        (entry as { acceptance_criteria?: unknown }).acceptance_criteria ?? "",
      ).trim();

      if (!title) return null;

      return { title, acceptance_criteria };
    })
    .filter((entry): entry is CompanyMilestoneTemplate => Boolean(entry));
}

function InlineText({ text }: { text: string }) {
  const parts = text.split(/(\*\*.*?\*\*)/);

  return (
    <>
      {parts.map((part, index) => {
        if (part.startsWith("**") && part.endsWith("**")) {
          return (
            <strong key={`${part}-${index}`} className="font-black text-slate-950">
              {part.slice(2, -2)}
            </strong>
          );
        }

        return <span key={`${part}-${index}`}>{part}</span>;
      })}
    </>
  );
}

function OfferDescription({ content }: { content: string }) {
  const blocks: Array<{ type: "heading" | "paragraph" | "list"; text?: string; items?: string[] }> = [];
  const lines = content.split(/\r?\n/);
  let paragraph: string[] = [];
  let listItems: string[] = [];

  const flushParagraph = () => {
    if (paragraph.length > 0) {
      blocks.push({ type: "paragraph", text: paragraph.join(" ") });
      paragraph = [];
    }
  };

  const flushList = () => {
    if (listItems.length > 0) {
      blocks.push({ type: "list", items: listItems });
      listItems = [];
    }
  };

  lines.forEach((rawLine) => {
    const line = rawLine.trim();

    if (!line) {
      flushParagraph();
      flushList();
      return;
    }

    const headingMatch = line.match(/^#{1,4}\s+(.+)$/);
    if (headingMatch) {
      flushParagraph();
      flushList();
      blocks.push({ type: "heading", text: headingMatch[1] });
      return;
    }

    const bulletMatch = line.match(/^[-*]\s+(.+)$/);
    if (bulletMatch) {
      flushParagraph();
      listItems.push(bulletMatch[1]);
      return;
    }

    flushList();
    paragraph.push(line);
  });

  flushParagraph();
  flushList();

  if (blocks.length === 0) {
    return <p className="text-base font-medium leading-8 text-slate-600">Brak opisu oferty.</p>;
  }

  return (
    <div className="space-y-7">
      {blocks.map((block, index) => {
        if (block.type === "heading") {
          return (
            <h4 key={`heading-${index}`} className="text-xl font-black leading-tight text-slate-950">
              {block.text}
            </h4>
          );
        }

        if (block.type === "list") {
          return (
            <ul key={`list-${index}`} className="grid gap-3">
              {(block.items || []).map((item) => (
                <li key={item} className="flex items-start gap-3 rounded-2xl border border-slate-100 bg-slate-50/70 p-4 text-base font-semibold leading-7 text-slate-700">
                  <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-indigo-500" />
                  <span><InlineText text={item} /></span>
                </li>
              ))}
            </ul>
          );
        }

        return (
          <p key={`paragraph-${index}`} className="text-base font-medium leading-8 text-slate-600 md:text-lg">
            <InlineText text={block.text || ""} />
          </p>
        );
      })}
    </div>
  );
}

function AppStatusLabel(status: string) {
  if (status === "accepted") return <span className="text-emerald-600 font-bold">Zaakceptowana</span>;
  if (status === "rejected") return <span className="text-red-500 font-bold">Odrzucona</span>;
  if (status === "countered") return <span className="text-amber-500 font-bold">Negocjacje</span>;
  return <span className="text-blue-500 font-bold">Wysłana</span>;
}

export async function generateMetadata(
  { params }: { params: Promise<{ id: string }> },
): Promise<Metadata> {
  const { id } = await params;
  const { offer, companyProfile } = await getOfferPageData(id);
 
  if (!offer) {
    return {
      title: "Oferta nie znaleziona | Student2Work",
    };
  }

  const companyName = getCompanyName(companyProfile);
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

  const { offer, companyProfile, error } = await getOfferPageData(id);

  if (error || !offer) redirect("/app");
  const offerRow = offer as OfferDetails;

  const { user, role } = await getRequestContext();

  // Check if owner
  const isOwner = user && user.id === offer.company_id;
  const canApply = role === "student";
  const backHref = isOwner ? "/app/company/offers" : role === "company" ? "/app/company/packages" : "/app/jobs";
  const backLabel = isOwner ? "Wróć do moich ofert" : role === "company" ? "Wróć do katalogu usług" : "Wróć do listy ofert";

  const [savedResult, applicationResult, lockedResult] = await Promise.all([
    user && role === "student"
      ? supabase.from("saved_offers").select("offer_id").eq("student_id", user.id).eq("offer_id", offer.id).maybeSingle()
      : Promise.resolve({ data: null }),
    user && role === "student"
      ? supabase.from("applications").select("id, status").eq("offer_id", offer.id).eq("student_id", user.id).maybeSingle()
      : Promise.resolve({ data: null }),
    !offerRow.is_platform_service || isOwner
      ? supabase
        .from("applications")
        .select("id", { count: "exact", head: true })
        .eq("offer_id", offer.id)
        .in("status", ["accepted", "in_progress", "completed"])
      : Promise.resolve({ count: 0 }),
  ]);

  const isSaved = Boolean(savedResult.data);
  const application = applicationResult.data;
  const myApplication = application?.id
    ? { id: application.id, status: application.status ?? "sent" }
    : null;

  // Fetch Review if Completed
  let myReview: ReviewSummary | null = null;
  if (myApplication?.status === 'completed' && user) {
    const { data: rev } = await supabase
      .from("reviews")
      .select("rating, comment")
      .eq("application_id", myApplication.id)
      .eq("reviewer_role", "company")
      .maybeSingle();
    myReview = rev as ReviewSummary | null;
  }
  const parsedMyReview = myReview ? parseDetailedReviewComment(myReview.comment) : null;

  const lockedApplicationsCount = lockedResult.count ?? 0;
  const isLockedForNewApplications = !offerRow.is_platform_service && lockedApplicationsCount > 0;

  const canStartNewApplication =
    (offer.status ?? "published") === "published" &&
    (offerRow.is_platform_service || !isLockedForNewApplications);

  // Check if offer is editable (not in progress)
  const isEditable = Boolean(isOwner) && (offer.status ?? "published") === "published" && lockedApplicationsCount === 0;

  const openChatAction = myApplication ? openChatForApplication.bind(null, myApplication.id) : null;
  const askQuestionAction = openChatForOfferInquiry.bind(null, offer.id);

  // Format Helpers
  let salaryDisplay = "";
  if (offer.salary_range_min && offer.salary_range_max) {
    salaryDisplay = `${offer.salary_range_min} - ${offer.salary_range_max} PLN`;
  } else if (offer.salary_range_min) {
    salaryDisplay = `od ${offer.salary_range_min} PLN`;
  } else if (offer.salary_range_max) {
    salaryDisplay = `do ${offer.salary_range_max} PLN`;
  } else if (offer.stawka) {
    salaryDisplay = `${offer.stawka} PLN`;
  } else {
    salaryDisplay = "-";
  }

  const companyName = getCompanyName(companyProfile);
  const normalizedOfferType = String(offer.typ ?? "").toLocaleLowerCase("pl-PL");
  const isChallenge = normalizedOfferType.includes("challenge") || normalizedOfferType.includes("wyzwan");
  if (isChallenge && salaryDisplay === "-") {
    salaryDisplay = "Do wyceny";
  }
  const isJob = (offer.typ === "job" || offer.typ === "Praca" || offer.typ === "praca");
  const periodLabel = offer.salary_period === "hourly" ? "godz." : isJob ? "mies." : isChallenge ? "wycena" : "projekt";

  // --- PARSING DESCRIPTION FOR SYSTEM SERVICES ---
  const separator = "--- SZCZEGÓŁY ZAMÓWIENIA ---";
  const hasDetails = offer.opis && offer.opis.includes(separator);

  let descriptionMain = offer.opis;
  const customDetails: Array<{ label: string, value: string }> = [];

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

  const parsedBrief = parsePackageBriefDescription(offer.opis);
  descriptionMain = parsedBrief.baseDescription || offer.opis || "";
  const companyRequestDetails = buildDetailItems(
    parsedBrief.answersByLabel,
    parsedBrief.deadline,
    parsedBrief.notes,
  );

  const isPlatformService = offerRow.is_platform_service || false;
  const gradient = isPlatformService ? "from-amber-600 to-orange-600" 
    : isJob ? "from-blue-600 to-indigo-700" 
    : "from-violet-600 to-purple-700";
  const briefSections = [
    {
      label: "Cel współpracy",
      value: offerRow.cel_wspolpracy,
      tone: "bg-blue-50 border-blue-100 text-blue-700",
    },
    {
      label: "Oczekiwany rezultat",
      value: offerRow.oczekiwany_rezultat,
      tone: "bg-emerald-50 border-emerald-100 text-emerald-700",
    },
    {
      label: "Kryteria akceptacji",
      value: offerRow.kryteria_akceptacji,
      tone: "bg-amber-50 border-amber-100 text-amber-700",
    },
  ].filter((item) => Boolean(item.value));
  const collaborationMeta: MetaItem[] = [
    offerRow.osoba_prowadzaca
      ? { label: "Osoba prowadzaca", value: offerRow.osoba_prowadzaca }
      : null,
    offerRow.planowany_start
      ? {
          label: "Planowany start",
          value: new Date(offerRow.planowany_start).toLocaleDateString("pl-PL"),
        }
      : null,
    offer.czas ? { label: "Czas realizacji", value: offer.czas } : null,
    offerRow.tryb_pracy
      ? {
          label: "Tryb pracy",
          value:
            offerRow.tryb_pracy === "remote"
              ? "Remote"
              : offerRow.tryb_pracy === "hybrid"
                ? "Hybrydowo"
                : "Na miejscu",
        }
      : null,
  ].filter((item): item is MetaItem => Boolean(item));
  const formalSignals: string[] = [
    offerRow.wymagana_poufnosc ? "Poufnosc wymagana" : null,
    offerRow.przeniesienie_praw_autorskich ? "Przeniesienie praw autorskich" : null,
    offerRow.portfolio_dozwolone ? "Portfolio dozwolone" : "Portfolio wymaga uzgodnienia",
    offerRow.materialy_legalnie_udostepnione ? "Materialy firmy zweryfikowane" : null,
  ].filter((signal): signal is string => Boolean(signal));
  const responsibilityLines = splitTaskLines(offerRow.obligations || offer.wymagania);
  const companyMilestones = parseCompanyMilestones(offerRow.company_milestones);
  const hasCompanyDefinedMilestones =
    offerRow.realization_mode === "company_defined" && companyMilestones.length > 0;
  const obligationsForApplyCard = Array.isArray(offerRow.obligations)
    ? offerRow.obligations.join("\n")
    : offerRow.obligations ?? undefined;

  return (
    <main className="min-h-screen bg-slate-50/50 pb-20 font-sans">
      {/* ═══ PREMIUM DARK HERO ═══ */}
      <div className="relative overflow-hidden bg-[#0a0f1c] pb-20 pt-10 sm:pb-32 sm:pt-16">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className={`absolute top-[-20%] left-[-10%] w-[50%] h-[80%] rounded-full opacity-20 blur-[120px] bg-gradient-to-br ${gradient}`} />
            <div className={`absolute bottom-[-20%] right-[-10%] w-[40%] h-[60%] rounded-full opacity-20 blur-[100px] bg-gradient-to-tl ${gradient}`} />
            <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-[0.03] bg-repeat" />
        </div>

        <PageContainer className="relative z-10">
          <Link href={backHref} className="group mb-6 inline-flex items-center rounded-full border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-slate-300 backdrop-blur-md transition-colors hover:bg-white/10 hover:text-white sm:mb-10 sm:px-5">
            <ArrowLeft className="h-4 w-4 mr-2 transition-transform group-hover:-translate-x-1" /> 
            {backLabel}
          </Link>

          <div className="flex flex-col items-start justify-between gap-8 lg:flex-row lg:gap-10">
            <div className="flex flex-1 flex-col items-start gap-5 md:flex-row md:gap-8">
              <div className="group flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-3xl border border-white/10 bg-white/5 shadow-2xl backdrop-blur-xl transition-transform duration-500 hover:scale-105 md:h-28 md:w-28">
                <Building2 className={`h-10 w-10 ${isPlatformService ? 'text-amber-400' : 'text-indigo-400'} drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]`} />
              </div>
              <div className="min-w-0 space-y-4">
                <div className="flex flex-wrap items-center gap-3">
                  <Badge className="bg-white/10 backdrop-blur-md border border-white/10 text-white text-sm font-medium px-4 py-1.5 rounded-full shadow-[0_0_20px_rgba(255,255,255,0.05)]">
                    <Briefcase className="w-4 h-4 mr-1.5 opacity-80" />
                    {isChallenge ? "Wyzwanie do wyceny" : (
                      <>
                    {isJob ? "Praca & Staż" : "Mikrozlecenie"}
                      </>
                    )}
                  </Badge>
                  {isPlatformService && (
                    <Badge className="bg-amber-500/20 backdrop-blur-md border border-amber-400/20 text-amber-100 text-sm font-medium px-4 py-1.5 rounded-full pb-1 pt-1.5">
                      <Zap className="h-4 w-4 mr-1" />
                      Systemowe
                    </Badge>
                  )}
                </div>
                <h1 className="bg-gradient-to-br from-white to-white/70 bg-clip-text text-3xl font-extrabold leading-tight tracking-tight text-transparent sm:text-4xl md:text-5xl lg:text-6xl">
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

            <div className="relative z-20 mt-2 flex w-full flex-col gap-3 sm:flex-row sm:flex-wrap sm:gap-4 lg:mt-0 lg:w-auto">
              {isEditable && (
                <Button asChild variant="outline" className="h-12 w-full rounded-2xl border-white/10 bg-white/5 px-6 font-bold text-white hover:bg-white/10 sm:w-auto">
                  <Link href={`/app/company/offers/${offer.id}/edit`}>Edytuj ofertę</Link>
                </Button>
              )}
              {role === "student" && !isOwner && !myApplication && (
                <form action={askQuestionAction} className="w-full sm:w-auto">
                  <Button variant="secondary" className="h-12 w-full rounded-2xl bg-white px-6 font-bold text-slate-900 shadow-xl hover:bg-slate-100 sm:w-auto">
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
      <PageContainer className="relative z-20 -mt-10 sm:-mt-16">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-10">

          <div className="space-y-6 sm:space-y-8 lg:col-span-8">
            {/* Description - General */}
            <section className="rounded-[2rem] border border-slate-100 bg-white p-5 shadow-xl shadow-slate-200/50 sm:p-8 md:p-12">
              <h3 className="mb-5 flex items-center gap-3 text-xs font-black uppercase tracking-[0.16em] text-slate-400 sm:mb-8 sm:text-sm sm:tracking-[0.2em]">
                <span className="w-8 h-1 bg-indigo-500 rounded-full"></span>
                Opis oferty
              </h3>
              <OfferDescription content={descriptionMain} />
            </section>

            {briefSections.length > 0 && (
              <section className="rounded-[2rem] border border-white bg-white/80 p-5 shadow-xl shadow-slate-200/20 backdrop-blur-xl sm:p-8 md:p-12">
                <h3 className="mb-6 flex items-center gap-3 text-xs font-black uppercase tracking-[0.16em] text-slate-400 sm:mb-10 sm:text-sm sm:tracking-[0.2em]">
                  <span className="w-8 h-1 bg-blue-500 rounded-full"></span>
                  Brief współpracy
                </h3>

                <div className="grid gap-6">
                  {briefSections.map((section) => (
                    <div key={section.label} className="rounded-[1.75rem] border border-slate-100 bg-white p-5 shadow-sm sm:p-6">
                      <div className={`inline-flex rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] ${section.tone}`}>
                        {section.label}
                      </div>
                      <p className="mt-4 whitespace-pre-line text-base font-medium leading-8 text-slate-700">
                        {section.value}
                      </p>
                    </div>
                  ))}
                </div>

                {(collaborationMeta.length > 0 || formalSignals.length > 0) && (
                  <div className="mt-8 grid gap-6 md:grid-cols-2">
                    {collaborationMeta.length > 0 && (
                      <div className="rounded-[1.75rem] border border-slate-100 bg-slate-50 p-5 sm:p-6">
                        <p className="mb-4 text-xs font-black uppercase tracking-widest text-slate-400">Ustalenia operacyjne</p>
                        <div className="grid gap-3">
                          {collaborationMeta.map((item) => (
                            <div key={item.label} className="rounded-2xl border border-white bg-white px-4 py-4 shadow-sm">
                              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{item.label}</p>
                              <p className="mt-2 text-sm font-bold text-slate-900">{item.value}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {formalSignals.length > 0 && (
                      <div className="rounded-[1.75rem] border border-slate-100 bg-slate-50 p-5 sm:p-6">
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
            {companyRequestDetails.length > 0 && (
              <section className="rounded-[2rem] border border-slate-100 bg-white p-5 shadow-xl shadow-slate-200/30 sm:p-8 md:p-12">
                <h3 className="mb-6 flex items-center gap-3 text-xs font-black uppercase tracking-[0.16em] text-slate-400 sm:mb-10 sm:text-sm sm:tracking-[0.2em]">
                  <span className="w-8 h-1 bg-purple-500 rounded-full"></span>
                  Informacje przesłane przez firmę
                </h3>
                <div className="mb-8 rounded-2xl border border-purple-100 bg-purple-50/50 p-5">
                  <p className="text-sm font-semibold leading-7 text-purple-950">
                    To są odpowiedzi firmy z formularza zamówienia. Traktuj je jako kontekst do realizacji, oddzielony od ogólnego opisu pakietu.
                  </p>
                </div>
                <div className="grid gap-4 sm:grid-cols-2 sm:gap-5">
                  {companyRequestDetails.map((detail) => (
                    <div key={detail.label} className="group rounded-3xl border border-slate-100 bg-slate-50/80 p-5 transition-colors hover:border-purple-200 sm:p-6">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 group-hover:text-purple-500 transition-colors">
                        {detail.label}
                      </p>
                      <p className="whitespace-pre-line break-words font-bold text-slate-900 text-base leading-7">{detail.value}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {briefSections.length === 0 && (collaborationMeta.length > 0 || formalSignals.length > 0) && (
              <section className="rounded-[2rem] border border-white bg-white/80 p-5 shadow-xl shadow-slate-200/20 backdrop-blur-xl sm:p-8 md:p-12">
                <h3 className="mb-5 flex items-center gap-3 text-xs font-black uppercase tracking-[0.16em] text-slate-400 sm:mb-8 sm:text-sm sm:tracking-[0.2em]">
                  <span className="w-8 h-1 bg-blue-500 rounded-full"></span>
                  Warunki realizacji
                </h3>
                <div className="grid gap-5 md:grid-cols-2">
                  {collaborationMeta.map((item) => (
                    <div key={item.label} className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{item.label}</p>
                      <p className="mt-2 text-base font-black text-slate-900">{item.value}</p>
                    </div>
                  ))}
                  {formalSignals.length > 0 && (
                    <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm md:col-span-2">
                      <p className="mb-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Sygnały formalne</p>
                      <div className="flex flex-wrap gap-3">
                        {formalSignals.map((signal) => (
                          <Badge
                            key={signal}
                            className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-black uppercase tracking-wider text-slate-700 shadow-sm"
                          >
                            {signal}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </section>
            )}

            {hasCompanyDefinedMilestones && (
              <section className="rounded-[2rem] border border-indigo-100 bg-white p-5 shadow-xl shadow-slate-200/30 sm:p-8 md:p-12">
                <h3 className="mb-5 flex items-center gap-3 text-xs font-black uppercase tracking-[0.16em] text-slate-400 sm:mb-8 sm:text-sm sm:tracking-[0.2em]">
                  <span className="w-8 h-1 bg-indigo-500 rounded-full"></span>
                  Etapy realizacji ustalone przez firme
                </h3>

                <div className="mb-8 rounded-[1.75rem] border border-indigo-100 bg-indigo-50/70 p-5">
                  <p className="text-sm font-semibold leading-7 text-slate-700">
                    Firma publikujac to mikrozlecenie od razu ustalila plan pracy. Po akceptacji kandydata te etapy
                    przejda do kontraktu bez dodatkowej negocjacji, a rozliczenie calej kwoty nastapi po odbiorze
                    finalnego etapu.
                  </p>
                </div>

                <div className="space-y-4">
                  {companyMilestones.map((milestone, index) => (
                    <div key={`${milestone.title}-${index}`} className="rounded-[1.75rem] border border-slate-100 bg-slate-50/80 p-5 sm:p-6">
                      <div className="flex flex-wrap items-center gap-3">
                        <Badge className="rounded-full bg-indigo-600 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-white">
                          Etap {index + 1}
                        </Badge>
                        <p className="text-lg font-black text-slate-900">{milestone.title}</p>
                      </div>
                      {milestone.acceptance_criteria ? (
                        <p className="mt-4 whitespace-pre-line text-base font-medium leading-8 text-slate-600">
                          {milestone.acceptance_criteria}
                        </p>
                      ) : (
                        <p className="mt-4 text-sm font-medium text-slate-500">
                          Szczegolowe kryteria tego etapu zostana doprecyzowane w realizacji.
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Technologies / Skills */}
            {offer.technologies && offer.technologies.length > 0 && (
              <section className="rounded-[2rem] border border-white bg-white/70 p-5 shadow-xl shadow-slate-200/20 backdrop-blur-xl sm:p-8 md:p-12">
                <h3 className="mb-5 flex items-center gap-3 text-xs font-black uppercase tracking-[0.16em] text-slate-400 sm:mb-8 sm:text-sm sm:tracking-[0.2em]">
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
              responsibilityLines.length > 0 && (
              <section className="relative overflow-hidden rounded-[2.5rem] bg-indigo-900 p-5 text-white shadow-2xl sm:p-8 md:p-12">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-[80px] -mr-32 -mt-32"></div>
                <h3 className="relative z-10 mb-6 flex items-center gap-3 text-xs font-black uppercase tracking-[0.16em] text-indigo-300 sm:mb-10 sm:text-sm sm:tracking-[0.2em]">
                  <span className="w-8 h-1 bg-amber-400 rounded-full"></span>
                  Zakres Obowiązków
                </h3>
                <div className="relative z-10 space-y-6">
                  {responsibilityLines.length > 0 ? (
                    <div className="grid gap-4">
                      {responsibilityLines
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
              )
            ) : (
              (offer.wymagania || offer.czas) && (
              <section className="rounded-[2rem] border border-white bg-white/70 p-5 shadow-xl shadow-slate-200/20 backdrop-blur-xl sm:p-8 md:p-12">
                  <h3 className="mb-6 flex items-center gap-3 text-xs font-black uppercase tracking-[0.16em] text-slate-400 sm:mb-10 sm:text-sm sm:tracking-[0.2em]">
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
          <div className="space-y-6 sm:space-y-8 lg:col-span-4">
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
                              <div className="space-y-3">
                                <ReviewBreakdown ratings={parsedMyReview?.categories ?? {}} compact />
                                <div>
                                  {parsedMyReview?.displayComment ? `“${parsedMyReview.displayComment}”` : "Bez dodatkowego komentarza."}
                                </div>
                              </div>
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
                ) : canStartNewApplication ? (
                  <ApplyCard
                    offerId={offer.id}
                    offerStawka={offer.stawka}
                    offerTyp={offer.typ}
                    formattedSalary={salaryDisplay}
                    className="w-full"
                    isPlatformService={isPlatformService}
                    offerTitle={offer.tytul}
                    offerDescription={offer.opis}
                    obligations={obligationsForApplyCard}
                    realizationMode={offerRow.realization_mode}
                    companyMilestones={companyMilestones}
                  />
                ) : (
                  <Card className="border-none rounded-[2.5rem] bg-slate-50 p-8 text-center border border-dashed border-slate-200">
                    <Lock className="mx-auto mb-4 h-8 w-8 text-slate-400" />
                    <p className="text-sm font-bold text-slate-500 uppercase tracking-widest leading-relaxed">
                      Oferta jest już zajęta albo zakończona.
                    </p>
                  </Card>
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
                    <span className="text-sm font-black text-slate-900 uppercase tracking-wider">
                      {isChallenge ? "Wyzwanie do wyceny" : offer.typ}
                    </span>
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
