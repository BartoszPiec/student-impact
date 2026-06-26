"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Banknote,
  CheckCircle2,
  Loader2,
  SearchCheck,
  Sparkles,
} from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { createChallengeOffer } from "./_actions";

type BudgetRange = "lt_500" | "500_1500" | "1500_3000" | "estimate";

const budgetOptions: Array<{
  value: BudgetRange;
  label: string;
  description: string;
}> = [
  {
    value: "lt_500",
    label: "< 500 PLN",
    description: "Drobny fix, szybka diagnoza albo jedna mala poprawka.",
  },
  {
    value: "500_1500",
    label: "500-1500 PLN",
    description: "Najczestszy zakres dla analizy, poprawek lub prostego wdrozenia.",
  },
  {
    value: "1500_3000",
    label: "1500-3000 PLN",
    description: "Wiekszy problem, kilka wariantow albo mocniejszy zakres.",
  },
  {
    value: "estimate",
    label: "Darmowa estymacja",
    description: "Nie znasz budzetu, chcesz najpierw zobaczyc propozycje.",
  },
];

export function ChallengeForm() {
  const router = useRouter();
  const [budgetRange, setBudgetRange] = useState<BudgetRange>("500_1500");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const selectedBudget = useMemo(
    () => budgetOptions.find((option) => option.value === budgetRange) ?? budgetOptions[1],
    [budgetRange],
  );

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const formData = new FormData(event.currentTarget);
    formData.set("budgetRange", budgetRange);

    startTransition(async () => {
      const result = await createChallengeOffer(formData);

      if (!result.success) {
        setError(result.error);
        return;
      }

      router.push(result.redirectUrl);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
      <Card className="overflow-hidden rounded-[2rem] border-slate-200 bg-white shadow-xl shadow-slate-200/60">
        <CardContent className="flex flex-col gap-8 p-5 sm:p-8">
          {error ? (
            <Alert variant="destructive" className="rounded-2xl">
              <SearchCheck className="h-4 w-4" />
              <AlertTitle>Nie mozna opublikowac wyzwania</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}

          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="rounded-full bg-amber-100 px-3 py-1 text-xs font-black uppercase tracking-[0.16em] text-amber-700 hover:bg-amber-100">
                Formularz wyzwania
              </Badge>
              <Badge variant="outline" className="rounded-full border-slate-200 px-3 py-1 text-xs font-bold text-slate-500">
                Publikacja na gieldzie wycen
              </Badge>
            </div>
            <h2 className="text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
              Opisz jedno zalegle zadanie, ktore ma dostac szybkie kontroferty.
            </h2>
            <p className="max-w-2xl text-sm font-medium leading-6 text-slate-500">
              Nie wybierasz kategorii ani pakietu. Wystarczy problem, miejsce problemu i orientacyjny budzet.
              Studenci zobacza brief i odpowiedza pitchem z wycena.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <Label htmlFor="problem" className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
              Co chcesz zrobic / jaki masz problem?
            </Label>
            <Textarea
              id="problem"
              name="problem"
              required
              minLength={20}
              maxLength={5000}
              placeholder='np. Nasza strona slabo wyswietla sie na telefonach i nikt przez nia nie kupuje.'
              className="min-h-[220px] resize-none rounded-[1.5rem] border-slate-200 bg-slate-50 px-5 py-4 text-base font-medium leading-7 text-slate-900 placeholder:text-slate-400 focus-visible:bg-white focus-visible:ring-4 focus-visible:ring-amber-100"
            />
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div className="flex flex-col gap-3">
              <Label htmlFor="problemLocation" className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
                Gdzie lezy problem?
              </Label>
              <Input
                id="problemLocation"
                name="problemLocation"
                maxLength={600}
                placeholder="Link do strony, sklepu, social mediow lub pliku"
                className="h-14 rounded-2xl border-slate-200 bg-white px-5 font-semibold text-slate-900 focus-visible:ring-4 focus-visible:ring-amber-100"
              />
            </div>

            <div className="flex flex-col gap-3">
              <Label htmlFor="contactPerson" className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
                Osoba kontaktowa
              </Label>
              <Input
                id="contactPerson"
                name="contactPerson"
                required
                maxLength={120}
                placeholder="np. Piotr, marketing / e-commerce"
                className="h-14 rounded-2xl border-slate-200 bg-white px-5 font-semibold text-slate-900 focus-visible:ring-4 focus-visible:ring-amber-100"
              />
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between gap-4">
              <Label className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
                Orientacyjny budzet
              </Label>
              <span className="hidden text-xs font-bold text-amber-700 sm:inline">
                {selectedBudget.description}
              </span>
            </div>
            <input type="hidden" name="budgetRange" value={budgetRange} />
            <div className="grid gap-3 md:grid-cols-2">
              {budgetOptions.map((option) => {
                const selected = budgetRange === option.value;

                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setBudgetRange(option.value)}
                    className={cn(
                      "min-h-[112px] rounded-[1.5rem] border p-4 text-left transition-all",
                      selected
                        ? "border-amber-300 bg-amber-50 shadow-lg shadow-amber-100/80 ring-2 ring-amber-100"
                        : "border-slate-200 bg-white hover:border-amber-200 hover:bg-amber-50/40",
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-base font-black text-slate-950">{option.label}</p>
                        <p className="mt-2 text-sm font-medium leading-5 text-slate-500">{option.description}</p>
                      </div>
                      {selected ? (
                        <span className="rounded-full bg-amber-500 p-1.5 text-white">
                          <CheckCircle2 className="h-4 w-4" />
                        </span>
                      ) : null}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <Label htmlFor="extraContext" className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
              Dodatkowy kontekst (opcjonalnie)
            </Label>
            <Textarea
              id="extraContext"
              name="extraContext"
              maxLength={1200}
              placeholder="Co juz probowaliscie? Jak szybko potrzebujecie odpowiedzi? Co bedzie sukcesem?"
              className="min-h-[130px] resize-none rounded-[1.5rem] border-slate-200 bg-white px-5 py-4 text-base font-medium leading-7 text-slate-900 placeholder:text-slate-400 focus-visible:ring-4 focus-visible:ring-amber-100"
            />
          </div>

          <div className="flex flex-col gap-3 border-t border-slate-100 pt-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm font-semibold leading-6 text-slate-500">
              Po publikacji wyzwanie trafi do gieldy, a studenci beda mogli wyslac pitch i cene.
            </div>
            <Button
              type="submit"
              disabled={isPending}
              className="h-14 rounded-[1.25rem] bg-slate-950 px-6 text-sm font-black text-white shadow-xl shadow-slate-300 transition-all hover:bg-amber-600"
            >
              {isPending ? (
                <>
                  <Loader2 data-icon="inline-start" className="animate-spin" />
                  Publikowanie
                </>
              ) : (
                <>
                  Opublikuj wyzwanie
                  <ArrowRight data-icon="inline-end" />
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      <aside className="flex flex-col gap-4">
        <div className="rounded-[2rem] border border-slate-200 bg-slate-950 p-6 text-white shadow-xl shadow-slate-300/50">
          <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-400 text-slate-950 shadow-lg shadow-amber-500/30">
            <Sparkles className="h-6 w-6" />
          </div>
          <h3 className="text-xl font-black leading-tight">Co stanie sie dalej?</h3>
          <div className="mt-5 flex flex-col gap-4">
            {[
              "Studenci lub zespoly widza wyzwanie na gieldzie.",
              "Robia szybki research i skladaja pitch z wycena.",
              "Firma wybiera najlepsza kontroferta i dopiero wtedy przechodzi do umow oraz platnosci.",
            ].map((item, index) => (
              <div key={item} className="flex gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/10 text-xs font-black text-amber-200">
                  {index + 1}
                </span>
                <p className="text-sm font-semibold leading-6 text-slate-200">{item}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[2rem] border border-amber-200 bg-amber-50 p-6">
          <div className="mb-3 flex items-center gap-2 text-sm font-black text-amber-800">
            <Banknote className="h-4 w-4" />
            Bez platnosci na tym etapie
          </div>
          <p className="text-sm font-semibold leading-6 text-amber-900/80">
            Ten formularz tworzy brief do wyceny. Escrow Stripe, umowy i capture startuja dopiero po wyborze
            konkretnej propozycji, zgodnie z glownym flow platformy.
          </p>
        </div>
      </aside>
    </form>
  );
}
