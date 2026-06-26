import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PageContainer } from "@/components/ui/page-container";
import { PremiumPageHeader } from "@/components/ui/premium-page-header";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Check,
  ChevronRight,
  ClipboardList,
  Clock,
  FileText,
  MessageCircle,
  Star,
  X,
} from "lucide-react";

import { acceptApplication, counterOffer, rejectApplication } from "./_actions";
import { openChatForApplication } from "@/app/app/chat/_actions";
import { CompanyMetricTile, CompanyStatePill } from "../_components/company-card-theme";
import { storageDownloadUrl } from "@/lib/security/storage-url";

export const dynamic = "force-dynamic";

type OfferRef = {
  id: string;
  tytul: string | null;
  stawka: number | null;
  company_id: string | null;
  typ: string | null;
  is_platform_service?: boolean | null;
};

type MilestoneRef = {
  id: string;
  status: string | null;
  auto_accept_at: string | null;
  title: string | null;
};

type ContractRef = {
  id: string;
  status: string | null;
  milestones?: MilestoneRef[] | null;
};

type ApplicationRow = {
  id: string;
  status: string | null;
  message_to_company: string | null;
  cv_url: string | null;
  created_at: string | null;
  student_id: string | null;
  offer_id: string | null;
  proposed_stawka: number | null;
  counter_stawka: number | null;
  agreed_stawka: number | null;
  agreed_stawka_minor: number | null;
  offers: OfferRef | OfferRef[] | null;
  contracts: ContractRef | ContractRef[] | null;
};

function unwrapRelation<T>(value: T | T[] | null | undefined): T | null {
  return Array.isArray(value) ? value[0] ?? null : value ?? null;
}

function money(value: number | null | undefined) {
  if (value == null || !Number.isFinite(value)) return "-";
  return `${value.toLocaleString("pl-PL")} zl`;
}

function fromMinorUnits(value: number | null | undefined) {
  if (value == null || !Number.isFinite(value)) return null;
  return value / 100;
}

function daysUntil(dateStr: string) {
  const diff = new Date(dateStr).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

function StatusBadge({ status }: { status: string | null }) {
  if (status === "accepted" || status === "in_progress") {
    return <Badge className="border-none bg-emerald-100 text-emerald-700">w realizacji</Badge>;
  }
  if (status === "rejected") {
    return <Badge variant="secondary">odrzucono</Badge>;
  }
  if (status === "countered") {
    return <Badge variant="secondary" className="border-none bg-amber-100 text-amber-700">negocjacje</Badge>;
  }
  if (status === "sent") {
    return <Badge variant="outline" className="border-indigo-200 bg-indigo-50 text-indigo-600">nowe zgłoszenie</Badge>;
  }
  if (status === "completed") {
    return <Badge className="border-none bg-slate-100 text-slate-700">zakonczone</Badge>;
  }
  if (status === "cancelled") {
    return <Badge variant="secondary" className="bg-slate-100 text-slate-500">anulowano</Badge>;
  }
  return <Badge variant="outline">status: {status ?? "brak"}</Badge>;
}

function ContractStatusBadge({ status }: { status: string | null }) {
  if (status === "awaiting_funding") {
    return <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-700">oczekuje na escrow</Badge>;
  }
  if (status === "active") {
    return <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700">aktywny</Badge>;
  }
  if (status === "delivered") {
    return <Badge variant="outline" className="border-indigo-200 bg-indigo-50 text-indigo-700">czeka na akceptacje</Badge>;
  }
  if (status === "completed") {
    return <Badge className="border-none bg-slate-100 text-slate-700">zakonczony</Badge>;
  }
  return null;
}

export default async function CompanyApplicationsPage({
  searchParams,
  embedded = false,
}: {
  searchParams: Promise<{ offerId?: string }>;
  embedded?: boolean;
}) {
  const { offerId } = await searchParams;
  const supabase = await createClient();

  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) redirect("/auth");

  const { data: profile } = await supabase.from("profiles").select("role").eq("user_id", user.id).single();
  if (profile?.role !== "company") redirect("/app");

  let query = supabase
    .from("applications")
    .select(`
      id, status, message_to_company, cv_url, created_at, student_id, offer_id,
      proposed_stawka, counter_stawka, agreed_stawka, agreed_stawka_minor,
      offers(id, tytul, stawka, company_id, typ, is_platform_service),
      contracts!contracts_application_id_fkey(id, status, milestones(id, status, auto_accept_at, title))
    `)
    .order("created_at", { ascending: false });

  if (offerId) query = query.eq("offer_id", offerId);

  const { data: rawRows, error } = await query;
  const rows = ((rawRows ?? []) as ApplicationRow[]).filter((row) => {
    const offer = unwrapRelation(row.offers);
    return offer?.company_id === user.id;
  });

  const { data: reviews } = await supabase.from("reviews").select("application_id").eq("reviewer_id", user.id);
  const reviewedAppIds = new Set((reviews ?? []).map((review: { application_id: string | null }) => review.application_id));

  const studentIds = Array.from(new Set(rows.map((row) => row.student_id).filter((value): value is string => Boolean(value))));
  const { data: students } =
    studentIds.length > 0
      ? await supabase.from("student_profiles").select("user_id, public_name").in("user_id", studentIds)
      : { data: [] };

  const studentMap = new Map((students ?? []).map((student: { user_id: string; public_name: string | null }) => [student.user_id, student.public_name]));

  const nowe = rows.filter((row) => row.status === "sent" || row.status === "countered");
  const wRealizacji = rows.filter((row) => row.status === "accepted" || row.status === "in_progress");
  const zakonczone = rows.filter((row) => row.status === "completed" || row.status === "rejected" || row.status === "cancelled");
  const defaultTab = nowe.length > 0 ? "nowe" : wRealizacji.length > 0 ? "realizacja" : "zakonczone";

  const renderNewCard = (row: ApplicationRow) => {
    const offer = unwrapRelation(row.offers);
    const acceptAction = acceptApplication.bind(null, row.id);
    const rejectAction = rejectApplication.bind(null, row.id);
    const counterAction = counterOffer.bind(null, row.id);
    const openChatAction = openChatForApplication.bind(null, row.id);

    const offerStawka = offer?.stawka ?? null;
    const proposed = row.proposed_stawka ?? null;
    const counter = row.counter_stawka ?? null;
    const showNegotiate = proposed != null && (offerStawka == null || Number(proposed) !== Number(offerStawka));
    const isCountered = row.status === "countered";

    return (
      <Card
        key={row.id}
        className="overflow-hidden border-slate-200 bg-white shadow-sm"
        style={{
          borderRadius: 28,
          boxShadow: isCountered
            ? "0 0 0 2px rgba(245,158,11,0.18), 0 18px 50px -12px rgba(245,158,11,0.14), 0 4px 12px rgba(15,36,96,0.04)"
            : "0 0 0 2px rgba(102,126,234,0.14), 0 18px 50px -12px rgba(102,126,234,0.12), 0 4px 12px rgba(15,36,96,0.04)",
        }}
      >
        <div className="flex">
          <div
            className="w-2 shrink-0"
            style={{
              background: isCountered
                ? "linear-gradient(180deg,#fbbf24,#f59e0b)"
                : "linear-gradient(180deg,#7c8ef7,#667eea)",
            }}
          />

          <div className="flex-1 p-6">
            <div
              className="mb-5 flex items-center gap-3 rounded-2xl px-4 py-3"
              style={{
                background: isCountered ? "#fffbeb" : "#eef2ff",
                border: isCountered ? "1px solid rgba(245,158,11,0.28)" : "1px solid rgba(102,126,234,0.22)",
              }}
            >
              <div
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-white"
                style={{ color: isCountered ? "#f59e0b" : "#667eea" }}
              >
                {isCountered ? <Clock className="h-4 w-4" /> : <MessageCircle className="h-4 w-4" />}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-[13.5px] font-extrabold text-slate-900">
                  {isCountered ? `Trwa negocjacja - Twoja kontroferta: ${money(counter)}` : "Nowe zgłoszenie - rozpatrz kandydata"}
                </div>
                <div className="mt-0.5 text-xs font-semibold" style={{ color: isCountered ? "#b45309" : "#4f46e5" }}>
                  {isCountered ? "Czekasz na odpowiedz studenta." : "Student czeka na Twoja decyzje."}
                </div>
              </div>
              <CompanyStatePill tone={isCountered ? "amber" : "indigo"} solid>
                {isCountered ? "Oczekuje na studenta" : "Wymagana akcja"}
              </CompanyStatePill>
            </div>

            <div className="flex flex-col gap-5 xl:flex-row">
              <div className="min-w-0 flex-1">
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <StatusBadge status={row.status ?? null} />
                  <CompanyStatePill tone={isCountered ? "amber" : "indigo"}>{offer?.typ || "Aplikacja"}</CompanyStatePill>
                </div>

                <CardTitle className="text-xl font-black tracking-tight text-slate-950">
                  {offer?.tytul ?? "Oferta"}
                </CardTitle>

                <div className="mt-3 flex flex-wrap gap-3 text-[11.5px] font-semibold text-slate-400">
                  <span>{studentMap.get(row.student_id ?? "") || "Student"}</span>
                  <span>{row.created_at ? new Date(row.created_at).toLocaleDateString("pl-PL") : "Brak daty"}</span>
                </div>

                {row.message_to_company ? (
                  <div
                    className="mt-4 rounded-r-xl border-l-[3px] bg-slate-50 px-4 py-3 text-sm italic leading-6 text-slate-600"
                    style={{ borderLeftColor: isCountered ? "#f59e0b" : "#667eea" }}
                  >
                    {row.message_to_company}
                  </div>
                ) : null}

                <div className="mt-4 flex flex-wrap gap-2">
                  {row.cv_url ? (
                    <Button asChild variant="outline" className="h-9 rounded-xl border-slate-200 bg-white px-3 text-xs font-bold text-slate-600">
                      <a href={storageDownloadUrl(row.cv_url)} target="_blank" rel="noopener noreferrer">
                        <FileText className="mr-2 h-4 w-4" />
                        CV.pdf
                      </a>
                    </Button>
                  ) : null}

                  <form action={openChatAction}>
                    <Button type="submit" variant="outline" className="h-9 rounded-xl border-slate-200 bg-white px-3 text-xs font-bold text-slate-600">
                      <MessageCircle className="mr-2 h-4 w-4" />
                      Napisz
                    </Button>
                  </form>
                </div>
              </div>

              <div className="flex w-full flex-col gap-3 xl:w-[280px] xl:shrink-0">
                <div className="flex gap-2">
                  <CompanyMetricTile label="Budzet oferty" value={money(offerStawka)} sub="Kwota bazowa" />
                  <CompanyMetricTile
                    label={isCountered ? "Twoja kontroferta" : proposed == null ? "Stawka uzgodniona" : "Propozycja studenta"}
                    value={money(isCountered ? counter : proposed ?? offerStawka)}
                    sub={isCountered ? "Czeka na decyzje studenta" : proposed == null ? "Zgodna z oferta" : "Wymaga porownania"}
                    tone={isCountered ? "amber" : "indigo"}
                    emphasize
                  />
                </div>

                {row.status === "sent" ? (
                  <>
                    <form action={acceptAction}>
                      <Button className="h-11 w-full rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 font-extrabold text-white hover:from-emerald-600 hover:to-teal-600">
                        <Check className="mr-2 h-4 w-4" />
                        Akceptuj i rozpocznij
                      </Button>
                    </form>

                    {showNegotiate ? (
                      <form action={counterAction} className="flex items-center gap-2 rounded-2xl border border-indigo-200 bg-white p-2">
                        <Input name="counter_stawka" placeholder="Kontra..." type="number" className="h-9 border-0 shadow-none" />
                        <Button type="submit" className="h-9 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 font-bold text-white">
                          Wyslij
                        </Button>
                      </form>
                    ) : null}

                    <form action={rejectAction}>
                      <Button variant="outline" className="h-11 w-full rounded-2xl border-red-200 bg-white font-bold text-red-600 hover:bg-red-50">
                        <X className="mr-2 h-4 w-4" />
                        Odrzuc
                      </Button>
                    </form>
                  </>
                ) : (
                  <div className="rounded-2xl bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
                    Student może zaakceptować, odrzucic albo wysłać wlasna propozycje.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </Card>
    );
  };

  const renderProgressCard = (row: ApplicationRow) => {
    const offer = unwrapRelation(row.offers);
    const contract = unwrapRelation(row.contracts);
    const milestones = contract?.milestones ?? [];
    const completed = milestones.filter((item) => ["released", "accepted", "completed"].includes(item.status ?? "")).length;
    const total = milestones.length;
    const delivered = milestones.find((item) => item.status === "delivered");
    const progress = total > 0 ? (completed / total) * 100 : 0;
    const openChatAction = openChatForApplication.bind(null, row.id);
    const agreed = row.agreed_stawka ?? fromMinorUnits(row.agreed_stawka_minor);

    return (
      <Card key={row.id} className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
        <div className="flex">
          <div className="w-2 shrink-0 bg-gradient-to-b from-emerald-400 to-emerald-500" />
          <div className="flex-1 p-6">
            <CardHeader className="p-0 pb-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <CardTitle className="text-xl font-black tracking-tight text-slate-950">{offer?.tytul ?? "Zlecenie"}</CardTitle>
                  <div className="mt-2 flex flex-wrap gap-3 text-[11.5px] font-semibold text-slate-400">
                    <span>{studentMap.get(row.student_id ?? "") || "Student"}</span>
                    <span>{money(agreed ?? offer?.stawka)}</span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <StatusBadge status={row.status ?? null} />
                  <ContractStatusBadge status={contract?.status ?? null} />
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4 p-0">
              {total > 0 ? (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-700">Postep realizacji</span>
                    <span className="text-sm font-bold text-slate-900">{completed}/{total} etapów</span>
                  </div>
                  <Progress value={progress} className="h-2" />

                  {delivered?.auto_accept_at ? (
                    <div className="mt-3 flex items-center gap-2 text-amber-600">
                      <Clock className="h-4 w-4" />
                      <span className="text-sm">
                        Auto-akceptacja za <strong>{daysUntil(delivered.auto_accept_at)}</strong> dni
                      </span>
                    </div>
                  ) : null}
                </div>
              ) : null}

              <div className="flex gap-2">
                {contract?.status === "awaiting_funding" ? (
                  <Button asChild className="flex-1 bg-amber-600 text-white hover:bg-amber-700">
                    <Link href={`/app/deliverables/${row.id}`}>
                      Zasil escrow
                      <ChevronRight className="ml-1 h-4 w-4" />
                    </Link>
                  </Button>
                ) : (
                  <Button asChild className="flex-1 bg-slate-950 text-white hover:bg-slate-800">
                    <Link href={`/app/deliverables/${row.id}`}>
                      Zobacz realizacje
                      <ChevronRight className="ml-1 h-4 w-4" />
                    </Link>
                  </Button>
                )}
                <form action={openChatAction}>
                  <Button variant="outline" size="icon" className="h-10 w-10">
                    <MessageCircle className="h-4 w-4" />
                  </Button>
                </form>
              </div>
            </CardContent>
          </div>
        </div>
      </Card>
    );
  };

  const renderClosedCard = (row: ApplicationRow) => {
    const offer = unwrapRelation(row.offers);
    const openChatAction = openChatForApplication.bind(null, row.id);
    const agreed = row.agreed_stawka ?? fromMinorUnits(row.agreed_stawka_minor);
    const isReviewed = reviewedAppIds.has(row.id);

    return (
      <Card key={row.id} className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
        <div className="flex">
          <div className="w-2 shrink-0 bg-gradient-to-b from-slate-300 to-slate-400" />
          <div className="flex-1 p-6">
            <CardHeader className="p-0 pb-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <CardTitle className="text-xl font-black tracking-tight text-slate-950">{offer?.tytul ?? "Zlecenie"}</CardTitle>
                  <div className="mt-2 flex flex-wrap gap-3 text-[11.5px] font-semibold text-slate-400">
                    <span>{studentMap.get(row.student_id ?? "") || "Student"}</span>
                    {row.created_at ? <span>{new Date(row.created_at).toLocaleDateString("pl-PL")}</span> : null}
                    {row.status === "completed" ? <span className="text-emerald-600">{money(agreed ?? offer?.stawka)}</span> : null}
                  </div>
                </div>
                <StatusBadge status={row.status ?? null} />
              </div>
            </CardHeader>

            <CardContent className="flex flex-wrap gap-2 p-0">
              {row.status === "completed" ? (
                isReviewed ? (
                  <Badge className="border-none bg-emerald-100 text-emerald-700">
                    <Star className="mr-1 h-3 w-3 fill-current" />
                    Oceniono
                  </Badge>
                ) : (
                  <Button asChild variant="outline" className="border-amber-200 text-amber-700 hover:bg-amber-50">
                    <Link href={`/app/company/review/${row.id}`}>
                      <Star className="mr-2 h-4 w-4" />
                      Ocen studenta
                    </Link>
                  </Button>
                )
              ) : null}

              <Button asChild variant="outline" size="sm">
                <Link href={`/app/deliverables/${row.id}`}>Szczegoly</Link>
              </Button>

              <form action={openChatAction}>
                <Button variant="ghost" size="icon" className="h-9 w-9">
                  <MessageCircle className="h-4 w-4" />
                </Button>
              </form>
            </CardContent>
          </div>
        </div>
      </Card>
    );
  };

  return (
    <main className={embedded ? "" : "pb-12"}>
      {!embedded ? (
        <PremiumPageHeader
          badge="Panel Pracodawcy"
          title="Aplikacje do moich ofert"
          description="Przeglad zgloszen studentow, negocjacji, realizacji i historii."
          icon={<ClipboardList className="h-10 w-10 text-indigo-300" />}
          actions={
            <Button asChild variant="outline" className="border-white/20 bg-white/10 text-white hover:bg-white/20 hover:text-white">
              <Link href="/app/company/offers">Moje oferty</Link>
            </Button>
          }
        />
      ) : null}

      <PageContainer className={embedded ? "mt-8 px-0 sm:px-0 lg:px-0 xl:px-0" : "mt-8"}>
        {error ? (
          <div className="mb-6 rounded-2xl border border-red-100 bg-red-50 px-5 py-4 text-sm font-medium text-red-700">
            Nie udało sie pobrać listy aplikacji. Odśwież stronę albo wróć za chwile.
          </div>
        ) : null}

        <div className="mb-6 rounded-[2rem] border border-slate-200 bg-white px-5 py-5 shadow-sm sm:px-6">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <h2 className="text-2xl font-black tracking-tight text-slate-950">
                {embedded ? "Zgloszenia do tej oferty" : "Aplikacje do moich ofert"}
              </h2>
              <p className="mt-1 text-sm font-semibold text-slate-500">
                {nowe.length > 0
                  ? `${nowe.length} zgloszen czeka na decyzje firmy`
                  : "Najpilniejsze decyzje sa sortowane nad spokojniejszymi stanami."}
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="flex flex-wrap gap-2">
                <CompanyStatePill tone="slate">Wszystkie {rows.length}</CompanyStatePill>
                <CompanyStatePill tone="amber">Wymagaja akcji {nowe.length}</CompanyStatePill>
                <CompanyStatePill tone="emerald">W realizacji {wRealizacji.length}</CompanyStatePill>
                <CompanyStatePill tone="slate">Zakonczone {zakonczone.length}</CompanyStatePill>
              </div>
              <div className="rounded-full bg-indigo-600 px-4 py-2 text-xs font-black uppercase tracking-[0.12em] text-white shadow-sm">
                Sortuj: wymagajace akcji
              </div>
            </div>
          </div>
        </div>

        {embedded && !embedded ? (
          <div className="mb-6 rounded-[2rem] border border-slate-200 bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 px-6 py-5 text-white shadow-xl">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-indigo-300">Wymagana akcja</p>
            <h2 className="mt-2 text-2xl font-black tracking-tight">Karty aplikacji z sygnalem decyzji po stronie firmy</h2>
            <p className="mt-2 max-w-3xl text-sm font-medium text-indigo-100/75">
              Nowe zgłoszenia i negocjacje maja mocniejszy sygnal wizualny. Realizacje i archiwum pozostaja
              spokojniejsze, ale dalej czytelne operacyjnie.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <CompanyStatePill tone="indigo">Nowe zgłoszenia</CompanyStatePill>
              <CompanyStatePill tone="amber">Negocjacje</CompanyStatePill>
              <CompanyStatePill tone="emerald">W realizacji</CompanyStatePill>
              <CompanyStatePill tone="slate">Archiwum</CompanyStatePill>
            </div>
          </div>
        ) : null}

        <Tabs defaultValue={defaultTab} className="w-full">
          <TabsList className="mb-8 grid h-auto w-full grid-cols-3 gap-2 rounded-[2rem] border border-slate-200 bg-white p-2 shadow-sm">
            <TabsTrigger value="nowe" className="h-12 rounded-full border border-transparent font-bold data-[state=active]:border-indigo-200 data-[state=active]:bg-indigo-600 data-[state=active]:text-white">
              Wymagaja akcji ({nowe.length})
            </TabsTrigger>
            <TabsTrigger value="realizacja" className="h-12 rounded-full border border-transparent font-bold data-[state=active]:border-emerald-200 data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
              W realizacji ({wRealizacji.length})
            </TabsTrigger>
            <TabsTrigger value="zakonczone" className="h-12 rounded-full border border-transparent font-bold data-[state=active]:border-slate-300 data-[state=active]:bg-slate-700 data-[state=active]:text-white">
              Zakonczone ({zakonczone.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="nowe" className="space-y-6 outline-none">
            {nowe.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-slate-200 bg-slate-50/50 py-24 text-center">
                <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-white text-3xl shadow-sm">-</div>
                <h3 className="text-xl font-bold text-slate-900">Brak nowych zgloszen</h3>
                <p className="mx-auto mt-2 max-w-xs text-slate-500">Na razie nikt nie aplikowal na Twoje oferty.</p>
              </div>
            ) : (
              nowe.map(renderNewCard)
            )}
          </TabsContent>

          <TabsContent value="realizacja" className="space-y-6 outline-none">
            {wRealizacji.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-slate-200 bg-slate-50/50 py-24 text-center">
                <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-white text-3xl shadow-sm">-</div>
                <h3 className="text-xl font-bold text-slate-900">Brak aktywnych realizacji</h3>
                <p className="mx-auto mt-2 max-w-xs text-slate-500">Zaakceptuj zgłoszenie, aby rozpoczac współpracę.</p>
              </div>
            ) : (
              wRealizacji.map(renderProgressCard)
            )}
          </TabsContent>

          <TabsContent value="zakonczone" className="space-y-6 outline-none">
            {zakonczone.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-slate-200 bg-slate-50/50 py-24 text-center">
                <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-white text-3xl shadow-sm">-</div>
                <h3 className="text-xl font-bold text-slate-900">Brak zakonczonych zlecen</h3>
                <p className="mx-auto mt-2 max-w-xs text-slate-500">Tutaj pojawia sie zakonczone i odrzucone zgłoszenia.</p>
              </div>
            ) : (
              zakonczone.map(renderClosedCard)
            )}
          </TabsContent>
        </Tabs>
      </PageContainer>
    </main>
  );
}
