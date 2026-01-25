import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Check, X, MessageCircle, FileText } from "lucide-react";

import { acceptApplication, rejectApplication, counterOffer } from "./_actions";
import { openChatForApplication } from "@/app/app/chat/_actions";

export const dynamic = "force-dynamic";

function StatusBadge({ status }: { status: string | null }) {
  if (status === "accepted") return <Badge className="bg-emerald-100 text-emerald-700 border-none hover:bg-emerald-200">zaakceptowano</Badge>;
  if (status === "rejected") return <Badge variant="secondary">odrzucono</Badge>;
  if (status === "countered") return <Badge variant="secondary" className="bg-amber-100 text-amber-700 border-none hover:bg-amber-200">negocjacje</Badge>;
  if (status === "sent") return <Badge variant="outline" className="text-indigo-600 border-indigo-200 bg-indigo-50">nowe zgłoszenie</Badge>;
  if (status === "in_progress") return <Badge variant="secondary" className="bg-blue-100 text-blue-700 hover:bg-blue-200">w trakcie</Badge>;
  if (status === "cancelled") return <Badge variant="secondary" className="bg-slate-100 text-slate-500">zrezygnował</Badge>;
  return <Badge variant="outline" className="text-red-500 border-red-200">status: {status ?? "brak"}</Badge>;
}

function money(v: number | null | undefined) {
  if (v == null) return "—";
  return `${v} zł`;
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

  let q = supabase
    .from("applications")
    // ❌ USUNIĘTE: conversation_id (bo tej kolumny nie masz)
    .select(
      "id, status, message_to_company, cv_url, created_at, student_id, offer_id, proposed_stawka, counter_stawka, agreed_stawka, offers (id, tytul, stawka, company_id, typ)"
    )
    .order("created_at", { ascending: false });

  if (offerId) q = q.eq("offer_id", offerId);

  const { data: rows, error } = await q;

  // Fetch student names
  const studentIds = Array.from(new Set((rows ?? []).map((r: any) => r.student_id).filter(Boolean)));
  const { data: students } = studentIds.length > 0
    ? await supabase.from("student_profiles").select("user_id, public_name").in("user_id", studentIds)
    : { data: [] };

  const studentMap = new Map((students ?? []).map((s: any) => [s.user_id, s.public_name]));

  return (
    <main className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Aplikacje do moich ofert</h1>
          <p className="text-sm text-muted-foreground">
            Przegląd zgłoszeń studentów + negocjacja stawek.
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

      <div className="grid gap-4">
        {(rows ?? []).map((a: any) => {
          const offer = Array.isArray(a.offers) ? a.offers[0] : a.offers;

          const acceptAction = acceptApplication.bind(null, a.id);
          const rejectAction = rejectApplication.bind(null, a.id);
          const counterAction = counterOffer.bind(null, a.id);

          // ✅ zawsze otwieramy czat przez server action (bez conversation_id)
          const openChatAction = openChatForApplication.bind(null, a.id);

          const offerStawka: number | null = offer?.stawka ?? null;
          const proposed: number | null = a.proposed_stawka ?? null;
          const counter: number | null = a.counter_stawka ?? null;
          const agreed: number | null = a.agreed_stawka ?? null;

          const studentLabel =
            proposed == null
              ? "Brak propozycji (student akceptuje stawkę z oferty)"
              : "Propozycja studenta";

          const typLower = offer?.typ?.toLowerCase() || "";

          // Uproszczony widok (Rekrutacja / Systemowe)
          // Jeśli to "mikrozlecenie firmowe" (typ=micro, ale nie is_platform_service), to chcemy negocjacje (False here).
          const isRecruitment =
            typLower === 'job' ||
            typLower === 'internship' ||
            typLower === 'praca' ||
            typLower === 'staż' ||
            offer?.is_platform_service; // ONLY System Platforms use simple view

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

                    {a.status !== 'rejected' && (
                      <form action={rejectApplication.bind(null, a.id)}>
                        <Button variant="ghost" size="sm" className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 px-2">
                          <X className="mr-2 h-4 w-4" />
                          Odrzuć kandydaturę
                        </Button>
                      </form>
                    )}
                    {a.status !== 'accepted' && (
                      <form action={acceptApplication.bind(null, a.id)}>
                        <Button variant="ghost" size="sm" className="w-full justify-start text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 px-2">
                          <Check className="mr-2 h-4 w-4" />
                          Zaakceptuj / Zatrudnij
                        </Button>
                      </form>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          }

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
                {/* CENNIK / NEGOCJACJE */}
                <div className="rounded-xl border bg-slate-50 p-6 shadow-sm">
                  <div className="grid gap-6 md:grid-cols-3 items-start">
                    {/* 1. Stawka w ofercie */}
                    <div className="space-y-1 md:border-r md:pr-4 border-slate-200">
                      <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Budżet oferty</div>
                      <div className="text-3xl font-bold text-slate-700">{money(offerStawka)}</div>
                      <div className="text-xs text-slate-400">Kwota bazowa</div>
                    </div>

                    {/* 2. Propozycja studenta */}
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

                    {/* 3. Decyzja */}
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
                        <div className="text-center py-2 space-y-2">
                          <Badge variant="outline" className="border-indigo-200 text-indigo-700 bg-indigo-50">Zaproponowałeś: {money(counter)}</Badge>
                          <p className="text-xs text-muted-foreground">Oczekiwanie na odpowiedź studenta</p>
                          <form action={openChatAction}>
                            <Button variant="outline" size="sm" className="w-full">
                              <MessageCircle className="mr-2 h-3 w-3" /> Czat
                            </Button>
                          </form>
                        </div>
                      )}

                      {a.status === "in_progress" && (
                        <div className="text-center py-2 space-y-3">
                          <div className="inline-flex flex-col items-center">
                            <div className="h-8 w-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mb-1">
                              <Check className="h-5 w-5" />
                            </div>
                            <span className="text-sm font-bold text-blue-800">W Realizacji</span>
                            <span className="text-xs text-blue-600">{money(agreed ?? offerStawka)}</span>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <Button asChild size="sm" className="w-full bg-slate-900 text-white hover:bg-slate-800">
                              <Link href={`/app/deliverables/${a.id}`}>Realizacja</Link>
                            </Button>
                            <form action={openChatAction} className="w-full">
                              <Button size="sm" variant="outline" className="w-full">Czat</Button>
                            </form>
                          </div>
                        </div>
                      )}

                      {a.status === "accepted" && (
                        <div className="text-center py-2 space-y-3">
                          <div className="inline-flex flex-col items-center">
                            <div className="h-8 w-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mb-1">
                              <Check className="h-5 w-5" />
                            </div>
                            <span className="text-sm font-bold text-emerald-800">Zaakceptowano</span>
                            <span className="text-xs text-emerald-600">{money(agreed ?? offerStawka)}</span>
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <Button asChild size="sm" className="w-full bg-slate-900 text-white hover:bg-slate-800">
                              <Link href={`/app/deliverables/${a.id}`}>Realizacja</Link>
                            </Button>
                            <form action={openChatAction} className="w-full">
                              <Button size="sm" variant="outline" className="w-full">Czat</Button>
                            </form>
                          </div>
                        </div>
                      )}

                      {a.status === "rejected" && (
                        <div className="text-center py-4 text-slate-400">
                          <X className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <span className="text-sm">Zgłoszenie odrzucone</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* wiadomość */}
                {a.message_to_company ? (
                  <div className="text-sm whitespace-pre-wrap rounded-md border p-3 bg-white/50">{a.message_to_company}</div>
                ) : (
                  <div className="text-sm text-muted-foreground">Brak wiadomości.</div>
                )}

                {/* CV LINK */}
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
        })}
      </div>

      {
        !error && (rows?.length ?? 0) === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center border rounded-xl bg-gray-50 border-dashed">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-4 text-2xl">📭</div>
            <h3 className="text-lg font-semibold text-gray-900">Brak zgłoszeń</h3>
            <p className="text-sm text-gray-500 max-w-sm mt-1">
              Na razie nikt nie aplikował na Twoje oferty. <br />
              Upewnij się, że opisy są zachęcające!
            </p>
          </div>
        )
      }
    </main >
  );
}
