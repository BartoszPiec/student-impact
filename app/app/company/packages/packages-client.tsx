"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

type PackageId = "facebook" | "inbox" | "graphic" | "copy";

type Pkg = {
  id: PackageId;
  title: string;
  priceFrom: number;
  short: string;
  tags: string[];
  questions: { label: string; name: string; placeholder?: string; multiline?: boolean }[];
};

const PACKAGES: Pkg[] = [
  {
    id: "facebook",
    title: "Mała kampania na Facebooku",
    priceFrom: 600,
    short: "Start kampanii + 3 kreacje + podstawowa optymalizacja",
    tags: ["ads", "social", "performance"],
    questions: [
      { label: "Cel kampanii", name: "goal", placeholder: "np. leady, ruch na stronę, sprzedaż" },
      { label: "Budżet dzienny / całkowity", name: "budget", placeholder: "np. 50 zł/dzień przez 14 dni" },
      { label: "Grupa docelowa", name: "audience", placeholder: "kto jest Twoim klientem?" },
      { label: "Link / produkt", name: "link", placeholder: "strona / landing / sklep" },
      { label: "Dodatkowe informacje", name: "notes", placeholder: "cokolwiek co pomoże", multiline: true },
    ],
  },
  {
    id: "inbox",
    title: "Sortowanie i porządek w skrzynce",
    priceFrom: 400,
    short: "Reguły, etykiety, automatyzacje i krótkie wdrożenie",
    tags: ["productivity", "process"],
    questions: [
      { label: "Z jakiej poczty korzystasz?", name: "mail", placeholder: "Gmail / Outlook / inne" },
      { label: "Ile wiadomości dziennie?", name: "volume", placeholder: "np. 30-50" },
      { label: "Największe problemy", name: "pain", placeholder: "np. brak priorytetów, chaos w wątkach", multiline: true },
      { label: "Dodatkowe wymagania", name: "notes", placeholder: "np. integracje, filtry, automaty", multiline: true },
    ],
  },
  {
    id: "graphic",
    title: "Grafika (social / baner / mini-landing)",
    priceFrom: 350,
    short: "Szybka grafika do komunikacji - 2 iteracje poprawek",
    tags: ["design", "branding"],
    questions: [
      { label: "Format", name: "format", placeholder: "np. post 1080x1080, baner 1200x628" },
      { label: "Styl / inspiracje", name: "style", placeholder: "linki, przykłady", multiline: true },
      { label: "Treść", name: "content", placeholder: "co ma się znaleźć na grafice?", multiline: true },
      { label: "Branding", name: "branding", placeholder: "logo, kolory, fonty (link do plików)" },
    ],
  },
  {
    id: "copy",
    title: "Copywriting (tekst / opis / strona)",
    priceFrom: 450,
    short: "Tekst dopasowany do odbiorcy + 2 rundy poprawek",
    tags: ["copy", "content"],
    questions: [
      { label: "Rodzaj tekstu", name: "type", placeholder: "np. opis produktu, landing, post" },
      { label: "Odbiorca", name: "audience", placeholder: "dla kogo piszemy?" },
      { label: "Ton", name: "tone", placeholder: "np. formalny, luźny, ekspercki" },
      { label: "Główne punkty", name: "points", placeholder: "co koniecznie musi być zawarte?", multiline: true },
      { label: "Linki / materiały", name: "materials", placeholder: "strona, konkurencja, dokumenty", multiline: true },
    ],
  },
];

export default function PackagesClient() {
  const [selected, setSelected] = useState<PackageId>("facebook");

  const pkg = useMemo(() => PACKAGES.find((p) => p.id === selected)!, [selected]);

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
      <div className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          {PACKAGES.map((p) => {
            const active = p.id === selected;
            return (
              <button
                key={p.id}
                onClick={() => setSelected(p.id)}
                className={[
                  "text-left rounded-xl border p-4 transition",
                  active ? "border-primary" : "hover:bg-muted/30",
                ].join(" ")}
                type="button"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="font-medium">{p.title}</div>
                    <div className="text-sm text-muted-foreground">{p.short}</div>
                  </div>
                  <div className="text-sm font-semibold">od {p.priceFrom} zł</div>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  {p.tags.map((t) => (
                    <Badge key={t} variant="secondary">
                      {t}
                    </Badge>
                  ))}
                </div>
              </button>
            );
          })}
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Co dalej</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <div>
              To jest nowy widok dla firm (zamiast publicznych ofert). W następnym kroku podepniemy:
            </div>
            <ul className="list-disc pl-5 space-y-1">
              <li>zapis briefu w bazie</li>
              <li>automatyczne tworzenie oferty + wyceny</li>
              <li>podpinanie studentów i czatu</li>
            </ul>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="space-y-1">
          <CardTitle className="text-base">Brief: {pkg.title}</CardTitle>
          <div className="text-sm text-muted-foreground">Cena orientacyjna: od {pkg.priceFrom} zł</div>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="grid gap-3">
            {pkg.questions.map((q) => (
              <div key={q.name} className="grid gap-1">
                <div className="text-sm">{q.label}</div>
                {q.multiline ? (
                  <Textarea name={q.name} placeholder={q.placeholder} />
                ) : (
                  <Input name={q.name} placeholder={q.placeholder} />
                )}
              </div>
            ))}
          </div>

          <Button type="button" disabled className="w-full">
            Wyślij zapytanie (wkrótce)
          </Button>

          <div className="text-xs text-muted-foreground">
            Na razie to tylko UI - nic nie zapisuje. Gdy zaczniemy rozbudowę pakietów, podepniemy zapis w Supabase.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
