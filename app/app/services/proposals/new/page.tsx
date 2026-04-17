import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, BriefcaseBusiness, Building2, SendHorizonal, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { listEligibleCompaniesForStudent } from "@/lib/services/private-proposals";

import { createPrivateProposalAction } from "../../_actions";

interface PageProps {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

export default async function NewPrivateProposalPage({ searchParams }: PageProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth");
  }

  const resolvedSearchParams = (await searchParams) ?? {};
  const packageId = Array.isArray(resolvedSearchParams.packageId)
    ? resolvedSearchParams.packageId[0]
    : resolvedSearchParams.packageId;

  if (!packageId) {
    return (
      <div className="container max-w-4xl space-y-8 py-10">
        <Link href="/app/services/my" className="flex w-fit items-center gap-2 text-sm text-slate-500 hover:text-slate-900">
          <ArrowLeft className="h-4 w-4" />
          Wroc do moich uslug
        </Link>

        <Card className="rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/40">
          <CardHeader>
            <CardTitle>Nie wybrano uslugi do propozycji</CardTitle>
            <CardDescription>
              Wejdz do listy swoich uslug i wybierz pakiet, z ktorego chcesz wyslac prywatna propozycje firmie.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="rounded-2xl bg-slate-900 px-6 text-white hover:bg-indigo-600">
              <Link href="/app/services/my">Przejdz do moich uslug</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { data: servicePackage } = await supabase
    .from("service_packages")
    .select("id, title, description, price, delivery_time_days, student_id")
    .eq("id", packageId)
    .eq("student_id", user.id)
    .maybeSingle();

  if (!servicePackage) {
    return (
      <div className="container max-w-4xl space-y-8 py-10">
        <Link href="/app/services/my" className="flex w-fit items-center gap-2 text-sm text-slate-500 hover:text-slate-900">
          <ArrowLeft className="h-4 w-4" />
          Wroc do moich uslug
        </Link>

        <Card className="rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/40">
          <CardHeader>
            <CardTitle>Nie znaleziono uslugi</CardTitle>
            <CardDescription>
              Ten pakiet nie nalezy do Ciebie albo nie jest juz dostepny do wysylania propozycji.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const eligibleCompanies = await listEligibleCompaniesForStudent(supabase, user.id);

  return (
    <div className="space-y-10 pb-20">
      <div className="relative overflow-hidden rounded-[2.5rem] bg-slate-900 px-8 py-12 text-white shadow-2xl md:px-12 md:py-16">
        <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-indigo-500/10 blur-[100px]" />
        <div className="absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-purple-500/10 blur-[80px]" />

        <div className="relative z-10 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/20 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-indigo-300">
              <Sparkles className="h-3 w-3" />
              Prywatna propozycja
            </div>
            <div className="space-y-2">
              <h1 className="text-4xl font-black tracking-tight md:text-5xl">Zaproponuj wspolprace firmie</h1>
              <p className="max-w-2xl text-lg font-medium text-indigo-100/70">
                Wysylasz prywatna propozycje z juz istniejacego pakietu uslug. Po akceptacji wszystko wpada do tego samego
                flow: negocjacja, kontrakt, escrow i realizacja.
              </p>
            </div>
          </div>

          <Link href="/app/services/my">
            <Button variant="outline" className="h-12 rounded-2xl border-white/10 bg-white/5 px-6 font-bold text-white hover:bg-white/10">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Wroc do moich uslug
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1.4fr_0.9fr]">
        <Card className="rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/40">
          <CardHeader className="space-y-2">
            <CardTitle>Nowa prywatna propozycja</CardTitle>
            <CardDescription>
              Ta wiadomosc pojawi sie firmie w jej panelu zamowien uslug. Guard po stronie serwera pozwala wysylac
              propozycje tylko do firm, z ktorymi masz juz potwierdzona wspolprace.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {eligibleCompanies.length === 0 ? (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">
                Nie masz jeszcze firmy, do ktorej mozna wyslac prywatna propozycje. Ta opcja odblokowuje sie dopiero po
                co najmniej jednej dotychczasowej wspolpracy.
              </div>
            ) : (
              <form action={createPrivateProposalAction} className="space-y-6">
                <input type="hidden" name="packageId" value={servicePackage.id} />

                <div className="space-y-2">
                  <label htmlFor="companyId" className="text-sm font-semibold text-slate-700">
                    Firma docelowa
                  </label>
                  <select
                    id="companyId"
                    name="companyId"
                    required
                    defaultValue=""
                    className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
                  >
                    <option value="" disabled>
                      Wybierz firme z historii wspolpracy
                    </option>
                    {eligibleCompanies.map((company) => (
                      <option key={company.user_id} value={company.user_id}>
                        {company.nazwa}
                        {company.city ? ` - ${company.city}` : ""}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <label htmlFor="proposal_goal" className="text-sm font-semibold text-slate-700">
                      Cel wspolpracy
                    </label>
                    <textarea
                      id="proposal_goal"
                      name="proposal_goal"
                      required
                      rows={4}
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
                      placeholder="Po co ta wspolpraca ma powstac i jaki problem rozwiazuje po stronie firmy?"
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="expected_result" className="text-sm font-semibold text-slate-700">
                      Oczekiwany rezultat
                    </label>
                    <textarea
                      id="expected_result"
                      name="expected_result"
                      required
                      rows={4}
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
                      placeholder="Co firma konkretnie dostanie, jesli zaakceptuje propozycje?"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="scope_summary" className="text-sm font-semibold text-slate-700">
                    Zakres i plan realizacji
                  </label>
                  <textarea
                    id="scope_summary"
                    name="scope_summary"
                    required
                    rows={5}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
                    placeholder="Opisz zakres, etapy, ograniczenia i to, jak chcesz poprowadzic realizacje."
                  />
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <label htmlFor="estimated_timeline_days" className="text-sm font-semibold text-slate-700">
                      Szacowany czas realizacji (dni)
                    </label>
                    <input
                      id="estimated_timeline_days"
                      name="estimated_timeline_days"
                      type="number"
                      min={1}
                      defaultValue={servicePackage.delivery_time_days ?? ""}
                      className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="proposed_amount" className="text-sm font-semibold text-slate-700">
                      Proponowana kwota (PLN)
                    </label>
                    <input
                      id="proposed_amount"
                      name="proposed_amount"
                      type="number"
                      min={1}
                      step="1"
                      required
                      defaultValue={servicePackage.price}
                      className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="message" className="text-sm font-semibold text-slate-700">
                    Wiadomosc do firmy
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    rows={4}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
                    placeholder="Napisz, dlaczego wracasz z ta propozycja teraz i jak najlepiej wejsc w rozmowe."
                  />
                </div>

                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <Button type="submit" className="h-12 rounded-2xl bg-slate-900 px-6 font-black text-white hover:bg-indigo-600">
                    <SendHorizonal className="mr-2 h-4 w-4" />
                    Wyslij prywatna propozycje
                  </Button>
                  <p className="text-sm font-medium text-slate-500">
                    Po zapisaniu propozycja od razu pojawi sie w panelu firmy jako nowe zamowienie uslugi.
                  </p>
                </div>
              </form>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="rounded-[2rem] border border-slate-100 shadow-lg shadow-slate-200/30">
            <CardHeader>
              <CardTitle>Wybrana usluga</CardTitle>
              <CardDescription>To z tego pakietu tworzysz prywatna propozycje.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-slate-600">
              <div className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-indigo-600">
                <BriefcaseBusiness className="h-3.5 w-3.5" />
                Pakiet bazowy
              </div>
              <div>
                <h2 className="text-xl font-black text-slate-900">{servicePackage.title}</h2>
                <p className="mt-2 leading-relaxed">{servicePackage.description || "Brak opisu uslugi."}</p>
              </div>
              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Cena bazowa</p>
                <p className="mt-1 text-2xl font-black text-slate-900">{servicePackage.price} PLN</p>
                <p className="mt-3 text-[10px] font-black uppercase tracking-widest text-slate-400">Czas dostawy</p>
                <p className="mt-1 font-semibold text-slate-700">{servicePackage.delivery_time_days} dni</p>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[2rem] border border-slate-100 shadow-lg shadow-slate-200/30">
            <CardHeader>
              <CardTitle>Firmy, do ktorych mozesz napisac</CardTitle>
              <CardDescription>
                Lista jest budowana na podstawie zakonczonych lub aktywnych kontraktow z Twojej historii.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {eligibleCompanies.length === 0 ? (
                <p className="text-sm font-medium text-slate-500">Brak odblokowanych firm na tym etapie.</p>
              ) : (
                eligibleCompanies.map((company) => (
                  <div key={company.user_id} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 rounded-xl bg-white p-2 text-indigo-600 shadow-sm">
                        <Building2 className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-slate-900">{company.nazwa}</p>
                        <p className="text-sm text-slate-500">
                          {company.city || "Brak miasta"}
                          {company.website ? ` • ${company.website.replace(/^https?:\/\//, "")}` : ""}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
