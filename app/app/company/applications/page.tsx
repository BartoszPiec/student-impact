import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Check, X, MessageCircle, FileText, Clock, Star, ChevronRight } from "lucide-react";

import { acceptApplication, rejectApplication, counterOffer } from "./_actions";
import { openChatForApplication } from "@/app/app/chat/_actions";

export const dynamic = "force-dynamic";

function StatusBadge({ status }: { status: string | null }) {
  if (status === "accepted") return <Badge className="bg-emerald-100 text-emerald-700 border-none hover:bg-emerald-200">zaakceptowano</Badge>;
  if (status === "rejected") return <Badge variant="secondary">odrzucono</Badge>;
  if (status === "countered") return <Badge variant="secondary" className="bg-amber-100 text-amber-700 border-none hover:bg-amber-200">negocjacje</Badge>;
  if (status === "sent") return <Badge variant="outline" className="text-indigo-600 border-indigo-200 bg-indigo-50">nowe zgłoszenie</Badge>;
  if (status === "in_progress") return <Badge variant="secondary" className="bg-blue-100 text-blue-700 hover:bg-blue-200">w trakcie</Badge>;
  if (status === "completed") return <Badge className="bg-emerald-100 text-emerald-700 border-none">zakończone</Badge>;
  if (status === "cancelled") return <Badge variant="secondary" className="bg-slate-100 text-slate-500">anulowano</Badge>;
  return <Badge variant="outline" className="text-red-500 border-red-200">status: {status ?? "brak"}</Badge>;
}

function ContractStatusBadge({ status }: { status: string | null }) {
  if (status === "awaiting_funding") return <Badge variant="outline" className="text-amber-600 border-amber-200 bg-amber-50">Oczekuje na escrow</Badge>;
  if (status === "active") return <Badge variant="outline" className="text-blue-600 border-blue-200 bg-blue-50">Aktywny</Badge>;
  if (status === "delivered") return <Badge variant="outline" className="text-purple-600 border-purple-200 bg-purple-50">Czeka na akceptację</Badge>;
  if (status === "completed") return <Badge className="bg-emerald-100 text-emerald-700 border-none">Zakończony</Badge>;
  return null;
}

function money(v: number | null | undefined) {
  if (v == null) return "—";
  return `${v} zł`;
}

function daysUntil(dateStr: string): number {
  const diff = new Date(dateStr).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

export default async function CompanyApplicationsPage({
  searchParams,
}: {
  searchParams: Promise<{ offerId?: string }>;
}) {
  const { offerId } = await searchParams;

  const supabase = await createClient();

  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) redirect("/auth");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("user_id", user.id)
    .single();

  if (profile?.role !== "company") redirect("/app");

  // Rozszerzone query z contracts i milestones
  // Używamy LEFT JOIN (offers bez !inner) żeby nie tracić aplikacji przy problemach z ofertą
  let q = supabase
    .from("applications")
    .select(`
      id, status, message_to_company, cv_url, created_at, student_id, offer_id,
      proposed_stawka, counter_stawka, agreed_stawka,
      offers(id, tytul, stawka, company_id, typ, is_platform_service),
      contracts!contracts_application_id_fkey(id, status, milestones(id, status, auto_accept_at, title))
    `)
    .order("created_at", { ascending: false });

  if (offerId) q = q.eq("offer_id", offerId);

  const { data: allRows, error } = await q;

  // Filtruj tylko aplikacje do ofert tej firmy
  const rows = (allRows ?? []).filter((a: any) => {
    const offer = Array.isArray(a.offers) ? a.offers[0] : a.offers;
    return offer?.company_id === user.id;
  });

  // Pobierz reviews żeby wiedzieć które aplikacje zostały ocenione
  const { data: reviews } = await supabase
    .from("reviews")
    .select("application_id")
    .eq("reviewer_id", user.id);
  const reviewedAppIds = new Set((reviews ?? []).map((r: any) => r.application_id));

  // Fetch student names
  const studentIds = Array.from(new Set((rows ?? []).map((r: any) => r.student_id).filter(Boolean)));
  const { data: students } = studentIds.length > 0
    ? await supabase.from("student_profiles").select("user_id, public_name").in("user_id", studentIds)
    : { data: [] };

  const studentMap = new Map((students ?? []).map((s: any) => [s.user_id, s.public_name]));

  // Grupowanie aplikacji
  const nowe = (rows ?? []).filter((a: any) => a.status === "sent" || a.status === "countered");
  const wRealizacji = (rows ?? []).filter((a: any) => a.status === "accepted" || a.status === "in_progress");
  const zakonczone = (rows ?? []).filter((a: any) => a.status === "completed" || a.status === "rejected" || a.status === "cancelled");

  const defaultTab = wRealizacji.length > 0 ? "realizacja" : nowe.length > 0 ? "nowe" : "zakonczone";

  // Render kart dla różnych typów
  const renderNowaCard = (a: any) => {
    const offer = Array.isArray(a.offers) ? a.offers[0] : a.offers;
    const acceptAction = acceptApplication.bind(null, a.id);
    const rejectAction = rejectApplication.bind(null, a.id);
    const counterAction = counterOffer.bind(null, a.id);
    const openChatAction = openChatForApplication.bind(null, a.id);

    const offerStawka: number | null = offer?.stawka ?? null;
    const proposed: number | null = a.proposed_stawka ?? null;
    const counter: number | null = a.counter_stawka ?? null;

    const typLower = offer?.typ?.toLowerCase() || "";
    const isRecruitment =
      typLower === 'job' ||
      typLower === 'internship' ||
      typLower === 'praca' ||
      typLower === 'staż' ||
      offer?.is_platform_service;

    if (isRecruitment) {
      return (
        <Card key={a.id} className="border-l-4 border-l-indigo-500">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <CardTitle className="text-base">{offer?.tytul ?? "Rekrutacja"}</CardTitle>
                <div className="text-sm text-muted-foreground mt-1 flex items-center gap-2">
                  <span>Aplikacja od:</span>
                  <Button asChild variant="link" className="h-auto p-0 font-medium">
                    <Link href={`/app/students/${a.student_id}`}>
                      {studentMap.get(a.student_id) || "Nieznany student"}
                    </Link>
                  </Button>
                  <span className="text-xs text-slate-300">•</span>
                  <span className="text-xs text-slate-400">
                    {new Date(a.created_at).toLocaleDateString('pl-PL')}
                  </span>
                </div>
              </div>
              <StatusBadge status={a.status ?? null} />
            </div>
          </CardHeader>

          <CardContent className="grid md:grid-cols-4 gap-6">
            <div className="md:col-span-3 space-y-4">
              {a.message_to_company && (
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 text-sm text-slate-700 whitespace-pre-wrap">
                  <span className="font-semibold text-slate-900 block mb-1">Wiadomość od kandydata:</span>
                  {a.message_to_company}
                </div>
              )}

              {a.cv_url ? (
                <div className="flex items-center gap-4 p-4 border border-indigo-100 bg-indigo-50/50 rounded-lg">
                  <div className="h-10 w-10 bg-white rounded-lg flex items-center justify-center text-indigo-600 shadow-sm border border-indigo-100">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="font-medium text-indigo-900">Załączone CV</div>
                    <div className="text-xs text-indigo-600/70">Kliknij, aby pobrać dokument</div>
                  </div>
                  <Button asChild className="ml-auto bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm">
                    <a href={a.cv_url} target="_blank" rel="noopener noreferrer">
                      Pobierz plik
                    </a>
                  </Button>
                </div>
              ) : (
                <div className="text-sm text-slate-400 italic p-2">Brak załączonego CV</div>
              )}
            </div>

            <div className="md:col-span-1 flex flex-col gap-3">
              <form action={openChatAction}>
                <Button variant="outline" className="w-full justify-start border-slate-200">
                  <MessageCircle className="mr-2 h-4 w-4 text-slate-500" />
                  Czat z kandydatem
                </Button>
              </form>

              <div className="h-px bg-slate-100 my-1"></div>

              {a.status !== 'rejected' && a.status !== 'accepted' && (
                <>
                  <form action={rejectAction}>
                    <Button variant="ghost" size="sm" className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 px-2">
                      <X className="mr-2 h-4 w-4" />
                      Odrzuć kandydaturę
                    </Button>
                  </form>
                  <form action={acceptAction}>
                    <Button variant="ghost" size="sm" className="w-full justify-start text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 px-2">
                      <Check className="mr-2 h-4 w-4" />
                      Zaakceptuj / Zatrudnij
                    </Button>
                  </form>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      );
    }

    // Mikrozlecenie z negocjacjami
    return (
      <Card key={a.id}>
        <CardHeader className="space-y-2">
          <div className="flex items-start justify-between gap-3">
            <CardTitle className="text-base">{offer?.tytul ?? "Oferta"}</CardTitle>
            <StatusBadge status={a.status ?? null} />
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="text-xs text-muted-foreground">
              Student: <span className="font-medium text-slate-700">{studentMap.get(a.student_id) || a.student_id}</span>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link href={`/app/students/${a.student_id}`}>Profil studenta</Link>
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="rounded-xl border bg-slate-50 p-6 shadow-sm">
            <div className="grid gap-6 md:grid-cols-3 items-start">
              <div className="space-y-1 md:border-r md:pr-4 border-slate-200">
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Budżet oferty</div>
                <div className="text-3xl font-bold text-slate-700">{money(offerStawka)}</div>
                <div className="text-xs text-slate-400">Kwota bazowa</div>
              </div>

              <div className="space-y-1 md:border-r md:pr-4 border-slate-200">
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Propozycja studenta</div>
                {proposed == null ? (
                  <div className="flex flex-col">
                    <span className="text-slate-300 font-light text-3xl">—</span>
                    <span className="text-xs text-slate-400">Akceptuje stawkę z oferty</span>
                  </div>
                ) : (
                  <div className="flex flex-col">
                    <span className="text-indigo-600 font-bold text-3xl">{money(proposed)}</span>
                    <Badge variant="secondary" className="w-fit mt-1 bg-indigo-100 text-indigo-700 hover:bg-indigo-200 border-none">
                      Nowa propozycja
                    </Badge>
                  </div>
                )}
              </div>

              <div className="rounded-xl bg-white p-4 border border-slate-200 shadow-sm relative">
                {a.status === "sent" && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="text-xs font-semibold text-slate-900">Twoja decyzja:</div>
                      <div className="flex gap-2 w-full">
                        <form action={acceptAction} className="flex-1">
                          <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm h-10">
                            <Check className="mr-2 h-4 w-4" />
                            Akceptuj
                          </Button>
                        </form>
                        <form action={rejectAction} className="flex-1">
                          <Button variant="destructive" className="w-full h-10 bg-red-50 text-red-600 hover:bg-red-100 border-red-200 border shadow-sm">
                            <X className="mr-2 h-4 w-4" />
                            Odrzuć
                          </Button>
                        </form>
                      </div>
                    </div>

                    {!((proposed == null) || (offerStawka != null && Number(proposed) === Number(offerStawka))) && (
                      <>
                        <div className="relative flex items-center gap-2 py-2">
                          <div className="h-px bg-slate-100 flex-1"></div>
                          <span className="text-[10px] text-slate-400 uppercase font-medium">Lub</span>
                          <div className="h-px bg-slate-100 flex-1"></div>
                        </div>

                        <div className="space-y-2">
                          <div className="text-xs font-semibold text-slate-900">Negocjuj / Zapytaj:</div>
                          <form action={counterAction} className="flex gap-2">
                            <Input
                              name="counter_stawka"
                              placeholder="Kwota..."
                              className="h-9 flex-1"
                              type="number"
                            />
                            <Button variant="outline" type="submit" size="sm" className="h-9 border-indigo-200 text-indigo-700 hover:bg-indigo-50 hover:text-indigo-800">
                              Zaproponuj
                            </Button>
                          </form>

                          <form action={openChatAction}>
                            <Button variant="ghost" className="w-full h-9 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50/50 justify-start px-2">
                              <MessageCircle className="mr-2 h-4 w-4" />
                              Wyślij wiadomość do studenta
                            </Button>
                          </form>
                        </div>
                      </>
                    )}
                  </div>
                )}

                {a.status === "countered" && (
                  <div className="space-y-3 py-2">
                    <div className="text-center space-y-1">
                      <Badge variant="outline" className="border-amber-200 text-amber-700 bg-amber-50">Twoja oferta: {money(counter)}</Badge>
                      <p className="text-xs text-muted-foreground">Negocjacje w toku</p>
                    </div>

                    <div className="flex gap-2 w-full">
                      <form action={acceptAction} className="flex-1">
                        <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm h-9 text-xs">
                          <Check className="mr-1 h-3 w-3" />
                          Akceptuj
                        </Button>
                      </form>
                      <form action={rejectAction} className="flex-1">
                        <Button variant="destructive" className="w-full h-9 text-xs bg-red-50 text-red-600 hover:bg-red-100 border-red-200 border shadow-sm">
                          <X className="mr-1 h-3 w-3" />
                          Odrzuć
                        </Button>
                      </form>
                    </div>

                    <div className="relative flex items-center gap-2 py-1">
                      <div className="h-px bg-slate-100 flex-1"></div>
                      <span className="text-[10px] text-slate-400 uppercase font-medium">Lub</span>
                      <div className="h-px bg-slate-100 flex-1"></div>
                    </div>

                    <form action={counterAction} className="flex gap-2">
                      <Input
                        name="counter_stawka"
                        placeholder="Nowa kwota..."
                        className="h-9 flex-1"
                        type="number"
                      />
                      <Button variant="outline" type="submit" size="sm" className="h-9 border-indigo-200 text-indigo-700 hover:bg-indigo-50 hover:text-indigo-800">
                        Zmień
                      </Button>
                    </form>

                    <form action={openChatAction}>
                      <Button variant="ghost" className="w-full h-9 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50/50 justify-start px-2 text-xs">
                        <MessageCircle className="mr-2 h-3 w-3" /> Czat ze studentem
                      </Button>
                    </form>
                  </div>
                )}
              </div>
            </div>
          </div>

          {a.message_to_company ? (
            <div className="text-sm whitespace-pre-wrap rounded-md border p-3 bg-white/50">{a.message_to_company}</div>
          ) : (
            <div className="text-sm text-muted-foreground">Brak wiadomości.</div>
          )}

          {a.cv_url && (
            <div className="mt-2 flex items-center gap-2">
              <Button asChild variant="outline" size="sm" className="bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100">
                <a href={a.cv_url} target="_blank" rel="noopener noreferrer">
                  <FileText className="mr-2 h-4 w-4" />
                  Pobierz CV kandydata
                </a>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  const renderRealizacjaCard = (a: any) => {
    const offer = Array.isArray(a.offers) ? a.offers[0] : a.offers;
    const openChatAction = openChatForApplication.bind(null, a.id);
    const offerStawka: number | null = offer?.stawka ?? null;
    const agreed: number | null = a.agreed_stawka ?? null;

    // Dane kontraktu i milestones
    const contract = Array.isArray(a.contracts) ? a.contracts[0] : a.contracts;
    const milestones = contract?.milestones ?? [];
    const completedMs = milestones.filter((m: any) => ['released', 'accepted', 'completed'].includes(m.status)).length;
    const totalMs = milestones.length;
    const deliveredMs = milestones.find((m: any) => m.status === 'delivered');
    const progressPercent = totalMs > 0 ? (completedMs / totalMs) * 100 : 0;

    return (
      <Card key={a.id} className="border-l-4 border-l-blue-500">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <CardTitle className="text-base">{offer?.tytul ?? "Zlecenie"}</CardTitle>
              <div className="text-sm text-muted-foreground mt-1 flex items-center gap-2">
                <span>Realizacja:</span>
                <Button asChild variant="link" className="h-auto p-0 font-medium">
                  <Link href={`/app/students/${a.student_id}`}>
                    {studentMap.get(a.student_id) || "Student"}
                  </Link>
                </Button>
                <span className="text-xs text-slate-300">•</span>
                <span className="text-xs font-medium text-slate-600">{money(agreed ?? offerStawka)}</span>
              </div>
            </div>
            <div className="flex flex-col items-end gap-1">
              <StatusBadge status={a.status ?? null} />
              {contract && <ContractStatusBadge status={contract.status} />}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Postęp milestones */}
          {totalMs > 0 && (
            <div className="rounded-lg border bg-slate-50 p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-slate-700">Postęp realizacji</span>
                <span className="text-sm font-bold text-slate-900">{completedMs}/{totalMs} etapów</span>
              </div>
              <Progress value={progressPercent} className="h-2" />

              {/* Auto-accept countdown */}
              {deliveredMs?.auto_accept_at && (
                <div className="mt-3 flex items-center gap-2 text-amber-600">
                  <Clock className="h-4 w-4" />
                  <span className="text-sm">
                    Auto-akceptacja za <strong>{daysUntil(deliveredMs.auto_accept_at)}</strong> dni
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Akcje */}
          <div className="flex gap-2">
            {contract?.status === 'awaiting_funding' ? (
              <Button asChild className="flex-1 bg-amber-600 hover:bg-amber-700 text-white">
                <Link href={`/app/deliverables/${a.id}`}>
                  Zasil escrow
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            ) : (
              <Button asChild className="flex-1 bg-slate-900 hover:bg-slate-800 text-white">
                <Link href={`/app/deliverables/${a.id}`}>
                  Zobacz realizację
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
      </Card>
    );
  };

  const renderZakonczonaCard = (a: any) => {
    const offer = Array.isArray(a.offers) ? a.offers[0] : a.offers;
    const openChatAction = openChatForApplication.bind(null, a.id);
    const offerStawka: number | null = offer?.stawka ?? null;
    const agreed: number | null = a.agreed_stawka ?? null;
    const isReviewed = reviewedAppIds.has(a.id);

    return (
      <Card key={a.id} className={`border-l-4 ${a.status === 'completed' ? 'border-l-emerald-500' : 'border-l-slate-300'}`}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardTitle className="text-base">{offer?.tytul ?? "Zlecenie"}</CardTitle>
              <div className="text-sm text-muted-foreground mt-1 flex items-center gap-2">
                <Button asChild variant="link" className="h-auto p-0 font-medium">
                  <Link href={`/app/students/${a.student_id}`}>
                    {studentMap.get(a.student_id) || "Student"}
                  </Link>
                </Button>
                <span className="text-xs text-slate-300">•</span>
                <span className="text-xs text-slate-400">
                  {new Date(a.created_at).toLocaleDateString('pl-PL')}
                </span>
                {a.status === 'completed' && (
                  <>
                    <span className="text-xs text-slate-300">•</span>
                    <span className="text-xs font-medium text-emerald-600">{money(agreed ?? offerStawka)}</span>
                  </>
                )}
              </div>
            </div>
            <StatusBadge status={a.status ?? null} />
          </div>
        </CardHeader>

        <CardContent>
          <div className="flex gap-2">
            {a.status === 'completed' && (
              isReviewed ? (
                <Badge className="bg-emerald-100 text-emerald-700 border-none">
                  <Star className="mr-1 h-3 w-3 fill-current" />
                  Oceniono
                </Badge>
              ) : (
                <Button asChild variant="outline" className="border-amber-200 text-amber-700 hover:bg-amber-50">
                  <Link href={`/app/company/review/${a.id}`}>
                    <Star className="mr-2 h-4 w-4" />
                    Oceń studenta
                  </Link>
                </Button>
              )
            )}

            <Button asChild variant="outline" size="sm">
              <Link href={`/app/deliverables/${a.id}`}>Szczegóły</Link>
            </Button>

            <form action={openChatAction}>
              <Button variant="ghost" size="icon" className="h-9 w-9">
                <MessageCircle className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <main className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Aplikacje do moich ofert</h1>
          <p className="text-sm text-muted-foreground">
            Przegląd zgłoszeń studentów, realizacji i historii.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/app/company/offers">Moje oferty</Link>
        </Button>
      </div>

      {error && (
        <pre className="rounded-md border p-4 text-sm overflow-auto">
          {JSON.stringify(error, null, 2)}
        </pre>
      )}

      <Tabs defaultValue={defaultTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="nowe" className="data-[state=active]:bg-indigo-100 data-[state=active]:text-indigo-700">
            Nowe ({nowe.length})
          </TabsTrigger>
          <TabsTrigger value="realizacja" className="data-[state=active]:bg-blue-100 data-[state=active]:text-blue-700">
            W realizacji ({wRealizacji.length})
          </TabsTrigger>
          <TabsTrigger value="zakonczone" className="data-[state=active]:bg-slate-100 data-[state=active]:text-slate-700">
            Zakończone ({zakonczone.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="nowe" className="space-y-4">
          {nowe.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center border rounded-xl bg-gray-50 border-dashed">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-4 text-2xl">📭</div>
              <h3 className="text-lg font-semibold text-gray-900">Brak nowych zgłoszeń</h3>
              <p className="text-sm text-gray-500 max-w-sm mt-1">
                Na razie nikt nie aplikował na Twoje oferty.
              </p>
            </div>
          ) : (
            nowe.map(renderNowaCard)
          )}
        </TabsContent>

        <TabsContent value="realizacja" className="space-y-4">
          {wRealizacji.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center border rounded-xl bg-gray-50 border-dashed">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-4 text-2xl">🚀</div>
              <h3 className="text-lg font-semibold text-gray-900">Brak aktywnych realizacji</h3>
              <p className="text-sm text-gray-500 max-w-sm mt-1">
                Zaakceptuj zgłoszenie, aby rozpocząć współpracę.
              </p>
            </div>
          ) : (
            wRealizacji.map(renderRealizacjaCard)
          )}
        </TabsContent>

        <TabsContent value="zakonczone" className="space-y-4">
          {zakonczone.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center border rounded-xl bg-gray-50 border-dashed">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-4 text-2xl">📋</div>
              <h3 className="text-lg font-semibold text-gray-900">Brak zakończonych zleceń</h3>
              <p className="text-sm text-gray-500 max-w-sm mt-1">
                Tutaj pojawią się zakończone i odrzucone zgłoszenia.
              </p>
            </div>
          ) : (
            zakonczone.map(renderZakonczonaCard)
          )}
        </TabsContent>
      </Tabs>
    </main>
  );
}
