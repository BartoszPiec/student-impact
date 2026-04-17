"use client";

import { useState } from "react";
import { createOffer } from "./_actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  ArrowRight,
  Briefcase,
  CalendarDays,
  CheckCircle2,
  Code2,
  FileText,
  Globe,
  Info,
  Loader2,
  ShieldAlert,
  UploadCloud,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

const CATEGORIES = [
  "Administracja biurowa",
  "Badania i rozwoj",
  "Bankowosc",
  "BHP / Ochrona srodowiska",
  "Budownictwo",
  "Call Center",
  "Doradztwo / Konsulting",
  "Edukacja / Szkolenia",
  "Energetyka",
  "Finanse / Ekonomia",
  "Franczyza / Wlasny biznes",
  "Grafika & Design",
  "Hotelarstwo / Gastronomia / Turystyka",
  "Human Resources / Zasoby ludzkie",
  "Internet / e-Commerce / Nowe media",
  "Inzynieria",
  "IT - Administracja",
  "IT - Rozwoj oprogramowania",
  "Kontrola jakosci",
  "Lancuch dostaw",
  "Marketing",
  "Media / Sztuka / Rozrywka",
  "Nieruchomosci",
  "Obsluga klienta",
  "Praca fizyczna",
  "Prawo",
  "Produkcja",
  "Public Relations",
  "Reklama / Grafika / Kreacja / Fotografia",
  "Sektor publiczny",
  "Sprzedaz",
  "Transport / Spedycja / Logistyka",
  "Ubezpieczenia",
  "Zakupy",
  "Zdrowie / Uroda / Rekreacja",
  "Inne",
];

const STEP_NAMES = ["Rodzaj", "Informacje", "Szczegoly", "Podsumowanie"];

const fieldLabelClass = "ml-1 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500";
const inputClass =
  "h-14 rounded-2xl border-slate-200 bg-white px-5 text-base font-medium text-slate-900 placeholder:text-slate-400 focus-visible:ring-4";
const textareaClass =
  "min-h-[170px] rounded-[1.75rem] border-slate-200 bg-white px-5 py-4 text-base leading-7 text-slate-900 placeholder:text-slate-400 focus-visible:ring-4";

type OfferFormData = {
  typ: "micro" | "job";
  is_platform_service: boolean;
  tytul: string;
  kategoria: string;
  opis: string;
  technologies: string;
  cel_wspolpracy: string;
  oczekiwany_rezultat: string;
  kryteria_akceptacji: string;
  osoba_prowadzaca: string;
  stawka: string;
  salary_range_min: string;
  salary_range_max: string;
  contract_type: string;
  tryb_pracy: "remote" | "onsite" | "hybrid";
  location: string;
  is_remote: boolean;
  planowany_start: string;
  czas_typ: "days" | "date";
  czas_dni: string;
  czas_data: string;
  obligations: string;
  wymagania: string;
  benefits: string;
  wymagana_poufnosc: boolean;
  przeniesienie_praw_autorskich: boolean;
  portfolio_dozwolone: boolean;
  materialy_legalnie_udostepnione: boolean;
};

export default function NewOfferForm({
  defaultType,
}: {
  defaultType?: "micro" | "job" | null;
}) {
  const [step, setStep] = useState(defaultType ? 2 : 1);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadedFileUrl, setUploadedFileUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [formData, setFormData] = useState<OfferFormData>({
    typ: defaultType || "micro",
    is_platform_service: false,
    tytul: "",
    kategoria: "",
    opis: "",
    technologies: "",
    cel_wspolpracy: "",
    oczekiwany_rezultat: "",
    kryteria_akceptacji: "",
    osoba_prowadzaca: "",
    stawka: "",
    salary_range_min: "",
    salary_range_max: "",
    contract_type: "B2B",
    tryb_pracy: "remote",
    location: "",
    is_remote: true,
    planowany_start: "",
    czas_typ: "days",
    czas_dni: "",
    czas_data: "",
    obligations: "",
    wymagania: "",
    benefits: "",
    wymagana_poufnosc: false,
    przeniesienie_praw_autorskich: false,
    portfolio_dozwolone: true,
    materialy_legalnie_udostepnione: false,
  });

  const isJob = formData.typ === "job";
  const showEmploymentWarning =
    isJob && (formData.contract_type === "UoP" || formData.contract_type === "Staz");
  const buildTimeSummary = () => {
    if (formData.czas_typ === "date" && formData.czas_data) {
      return `Do ${formData.czas_data}`;
    }

    if (formData.czas_typ === "days" && formData.czas_dni) {
      return `Oczekiwane ok. ${formData.czas_dni} dni na wykonanie`;
    }

    return "";
  };

  const handleChange = <K extends keyof OfferFormData>(field: K, value: OfferFormData[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleWorkModeChange = (value: OfferFormData["tryb_pracy"]) => {
    setFormData((prev) => ({
      ...prev,
      tryb_pracy: value,
      is_remote: value === "remote",
    }));
  };

  const handleTimeModeChange = (value: OfferFormData["czas_typ"]) => {
    setFormData((prev) => ({
      ...prev,
      czas_typ: value,
    }));
  };

  const renderDecisionField = (
    label: string,
    description: string,
    value: boolean,
    onChange: (nextValue: boolean) => void,
    tone: "indigo" | "amber",
  ) => {
    const activeClass =
      tone === "indigo"
        ? "border-indigo-300 bg-indigo-50 text-indigo-700"
        : "border-amber-300 bg-amber-50 text-amber-700";

    return (
      <div className="rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm">
        <div className="pr-2">
          <p className="text-sm font-semibold text-slate-900">{label}</p>
          <p className="mt-1 text-xs leading-5 text-slate-500">{description}</p>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => onChange(true)}
            className={cn(
              "rounded-2xl border px-4 py-3 text-sm font-semibold transition-colors",
              value ? activeClass : "border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300",
            )}
          >
            Tak
          </button>
          <button
            type="button"
            onClick={() => onChange(false)}
            className={cn(
              "rounded-2xl border px-4 py-3 text-sm font-semibold transition-colors",
              !value
                ? "border-slate-300 bg-slate-900 text-white"
                : "border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300",
            )}
          >
            Nie
          </button>
        </div>
      </div>
    );
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      setError(null);

      const supabase = createClient();
      const filename = `${Date.now()}-${file.name.replace(/\s/g, "_")}`;

      const { data, error: uploadError } = await supabase.storage
        .from("offer_attachments")
        .upload(filename, file);

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from("offer_attachments").getPublicUrl(data.path);

      setUploadedFileUrl(publicUrl);
    } catch (uploadError: any) {
      console.error(uploadError);
      setError(`Blad przesylania pliku: ${uploadError.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  const nextStep = () => {
    let validationError: string | null = null;

    if (step === 2) {
      if (
        !formData.tytul.trim() ||
        !formData.opis.trim() ||
        !formData.kategoria ||
        !formData.cel_wspolpracy.trim() ||
        !formData.oczekiwany_rezultat.trim() ||
        !formData.kryteria_akceptacji.trim() ||
        !formData.osoba_prowadzaca.trim()
      ) {
        validationError =
          "Uzupelnij tytul, opis, kategorie, cel wspolpracy, oczekiwany rezultat, kryteria akceptacji i osobe prowadzaca.";
      }
    }

    if (step === 3) {
      if (formData.czas_typ === "days" && (!formData.czas_dni || Number(formData.czas_dni) <= 0)) {
        validationError = "Podaj oczekiwana liczbe dni na wykonanie zlecenia.";
      } else if (formData.czas_typ === "date" && !formData.czas_data) {
        validationError = "Wybierz konkretna date graniczna.";
      } else if (!isJob) {
        const budget = Number(formData.stawka);
        if (!Number.isFinite(budget) || budget <= 0) {
          validationError = "Podaj poprawny budzet zlecenia.";
        }
      }
    }

    setError(validationError);
    if (!validationError) {
      setStep((current) => Math.min(current + 1, 4));
    }
  };

  const prevStep = () => {
    setStep((current) => Math.max(current - 1, defaultType ? 2 : 1));
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    setError(null);

    const payload = new FormData();

    Object.entries(formData).forEach(([key, value]) => {
      if (typeof value === "boolean") {
        if (value) payload.append(key, "on");
        return;
      }

      payload.append(key, value);
    });

    payload.set("czas", buildTimeSummary());
    payload.delete("is_remote");
    if (formData.tryb_pracy === "remote") {
      payload.append("is_remote", "on");
    }

    if (formData.czas_typ === "days") {
      payload.set("planowany_start", "");
      payload.set("czas_data", "");
    } else {
      payload.set("czas_dni", "");
    }

    if (uploadedFileUrl) {
      const currentMaterials = String(payload.get("obligations") || "");
      const nextMaterials = currentMaterials
        ? `${currentMaterials}\n\n[ZALACZONY PLIK]: ${uploadedFileUrl}`
        : `[ZALACZONY PLIK]: ${uploadedFileUrl}`;
      payload.set("obligations", nextMaterials);
    }

    try {
      await createOffer(payload);
    } catch (submitError: any) {
      setError(submitError.message);
      setIsLoading(false);
    }
  };

  const renderStep1 = () => (
    <div className="animate-in slide-in-from-right-4 space-y-6 duration-300">
      <div className="space-y-2 text-center">
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">Jaki rodzaj oferty chcesz dodac?</h2>
        <p className="mx-auto max-w-2xl text-sm leading-6 text-slate-500">
          Wybierz format wspolpracy, ktory najlepiej pasuje do tego, jak chcesz pracowac z wykonawca.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <button
          type="button"
          onClick={() => handleChange("typ", "micro")}
          className={cn(
            "rounded-[2rem] border p-6 text-left transition-all hover:-translate-y-1",
            formData.typ === "micro"
              ? "border-amber-300 bg-amber-50 shadow-lg shadow-amber-100/80"
              : "border-slate-200 bg-white hover:border-amber-200 hover:bg-amber-50/40",
          )}
        >
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-600">
            <Zap className="h-6 w-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">Mikrozlecenie</h3>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Krotkie zadanie z jednym, jasno zdefiniowanym efektem. Dobre do szybkich realizacji i prostych rozliczen.
          </p>
        </button>

        <button
          type="button"
          onClick={() => handleChange("typ", "job")}
          className={cn(
            "rounded-[2rem] border p-6 text-left transition-all hover:-translate-y-1",
            formData.typ === "job"
              ? "border-indigo-300 bg-indigo-50 shadow-lg shadow-indigo-100/80"
              : "border-slate-200 bg-white hover:border-indigo-200 hover:bg-indigo-50/40",
          )}
        >
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-600">
            <Briefcase className="h-6 w-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">Oferta pracy lub stazu</h3>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Dluzsza wspolpraca, staz albo rola projektowa. Dobre, gdy chcesz opisac szerszy zakres i oczekiwania.
          </p>
        </button>
      </div>
    </div>
  );

  const renderStep3 = () => {
    if (isJob) {
      return (
        <div className="animate-in slide-in-from-right-8 space-y-8 duration-500">
          <div className={cn("grid gap-6", formData.czas_typ === "date" ? "md:grid-cols-3" : "md:grid-cols-2")}>
            <div className="space-y-2">
              <Label className={fieldLabelClass}>Tryb pracy</Label>
              <div className="relative rounded-2xl border border-slate-200 bg-white shadow-sm">
                <select
                  className="h-14 w-full appearance-none rounded-2xl bg-transparent px-5 pr-12 text-base font-medium text-slate-900 outline-none"
                  value={formData.tryb_pracy}
                  onChange={(e) => handleWorkModeChange(e.target.value as OfferFormData["tryb_pracy"])}
                >
                  <option value="remote">Remote</option>
                  <option value="hybrid">Hybrydowo</option>
                  <option value="onsite">Na miejscu</option>
                </select>
                <ArrowRight className="pointer-events-none absolute right-5 top-1/2 h-4 w-4 -translate-y-1/2 rotate-90 text-slate-400" />
              </div>
            </div>

            <div className="space-y-2">
              <Label className={fieldLabelClass}>Okno czasowe <span className="text-red-500">*</span></Label>
              <div className="relative rounded-2xl border border-slate-200 bg-white shadow-sm">
                <select
                  className="h-14 w-full appearance-none rounded-2xl bg-transparent px-5 pr-12 text-base font-medium text-slate-900 outline-none"
                  value={formData.czas_typ}
                  onChange={(e) => handleTimeModeChange(e.target.value as OfferFormData["czas_typ"])}
                >
                  <option value="days">Oczekiwana liczba dni</option>
                  <option value="date">Konkretna data</option>
                </select>
                <ArrowRight className="pointer-events-none absolute right-5 top-1/2 h-4 w-4 -translate-y-1/2 rotate-90 text-slate-400" />
              </div>
            </div>

            {formData.czas_typ === "date" && (
              <div className="space-y-2">
                <Label className={fieldLabelClass}>Planowany start <span className="normal-case tracking-normal text-slate-400">(opcjonalnie)</span></Label>
                <div className="relative">
                  <CalendarDays className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                  <Input
                    type="date"
                    className={cn(inputClass, "pl-12 focus-visible:ring-indigo-100")}
                    value={formData.planowany_start}
                    onChange={(e) => handleChange("planowany_start", e.target.value)}
                  />
                </div>
              </div>
            )}
          </div>

          <div className={cn("grid gap-6", formData.czas_typ === "date" ? "md:grid-cols-3" : "md:grid-cols-2")}>
            <div className="space-y-2">
              <Label className={fieldLabelClass}>Lokalizacja / strefa pracy</Label>
              <div className="relative">
                <Globe className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                <Input
                  className={cn(inputClass, "pl-12 focus-visible:ring-indigo-100")}
                  value={formData.location}
                  onChange={(e) => handleChange("location", e.target.value)}
                  placeholder={
                    formData.tryb_pracy === "remote"
                      ? "np. Polska / CET / preferowana strefa"
                      : "np. Warszawa / Krakow / biuro klienta"
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className={fieldLabelClass}>
                {formData.czas_typ === "days" ? "Oczekiwana liczba dni na wykonanie zlecenia" : "Data graniczna"}{" "}
                <span className="text-red-500">*</span>
              </Label>
              {formData.czas_typ === "days" ? (
                <Input
                  type="number"
                  min="1"
                  className={cn(inputClass, "focus-visible:ring-indigo-100")}
                  value={formData.czas_dni}
                  onChange={(e) => handleChange("czas_dni", e.target.value)}
                  placeholder="np. 14"
                />
              ) : (
                <Input
                  type="date"
                  className={cn(inputClass, "focus-visible:ring-indigo-100")}
                  value={formData.czas_data}
                  onChange={(e) => handleChange("czas_data", e.target.value)}
                />
              )}
            </div>

          </div>

          <div className="grid gap-6 md:grid-cols-3">
            <div className="space-y-2">
              <Label className={fieldLabelClass}>Min. wynagrodzenie</Label>
              <Input
                type="number"
                className={cn(inputClass, "focus-visible:ring-indigo-100")}
                value={formData.salary_range_min}
                onChange={(e) => handleChange("salary_range_min", e.target.value)}
                placeholder="3000"
              />
            </div>

            <div className="space-y-2">
              <Label className={fieldLabelClass}>Max. wynagrodzenie</Label>
              <Input
                type="number"
                className={cn(inputClass, "focus-visible:ring-indigo-100")}
                value={formData.salary_range_max}
                onChange={(e) => handleChange("salary_range_max", e.target.value)}
                placeholder="5000"
              />
            </div>

            <div className="space-y-2">
              <Label className={fieldLabelClass}>Preferowany model wspolpracy</Label>
              <select
                className={cn(
                  inputClass,
                  "w-full appearance-none pr-12 focus-visible:ring-indigo-100",
                  !formData.contract_type && "text-slate-400",
                )}
                value={formData.contract_type}
                onChange={(e) => handleChange("contract_type", e.target.value)}
              >
                <option value="B2B">B2B</option>
                <option value="UoP">Umowa o prace</option>
                <option value="UZ">Umowa zlecenie</option>
                <option value="Staz">Staz / praktyka</option>
              </select>
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-600">
            <div className="mb-2 flex items-center gap-2 font-semibold text-slate-900">
              <Info className="h-4 w-4 text-indigo-500" />
              Model wspolpracy jest dzis przede wszystkim informacja dla kandydata.
            </div>
            Obecny workflow platformy najpewniej najlepiej pokrywa B2B i umowe zlecenie. Jesli wybierasz UoP lub staz,
            potraktuj to jako preferencje do dalszego ustalenia, a nie gotowy workflow platformowy.
          </div>

          {showEmploymentWarning && (
            <div className="rounded-[1.5rem] border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
              <div className="mb-2 flex items-center gap-2 font-semibold">
                <ShieldAlert className="h-4 w-4 text-amber-600" />
                Uwaga dla UoP i stazu
              </div>
              Ten wybor komunikuje preferowany model wspolpracy, ale nie oznacza jeszcze, ze cala logika formalna i
              dokumentowa jest obslugiwana automatycznie przez platforme.
            </div>
          )}

          <div className="space-y-2">
            <Label className={fieldLabelClass}>Wymagania</Label>
            <Textarea
              className={cn(textareaClass, "focus-visible:ring-indigo-100")}
              value={formData.wymagania}
              onChange={(e) => handleChange("wymagania", e.target.value)}
              placeholder={`- doswiadczenie z Reactem
- znajomosc Figma
- samodzielna komunikacja z klientem`}
            />
          </div>

          <div className="space-y-2">
            <Label className={fieldLabelClass}>Co oferujesz</Label>
            <Textarea
              className={cn(textareaClass, "focus-visible:ring-indigo-100")}
              value={formData.benefits}
              onChange={(e) => handleChange("benefits", e.target.value)}
              placeholder={`- elastyczne godziny
- onboarding i feedback
- mozliwosc dluzszej wspolpracy`}
            />
          </div>

          <div className="rounded-[1.75rem] border border-indigo-200 bg-indigo-50/60 p-6">
            <div className="mb-4 flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-600">
                <ShieldAlert className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Informacje formalne i do umowy</h3>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  Te odpowiedzi pomagaja przygotowac wspolprace i wychwycic ryzyka przed umowa. Nie uruchamiaja jeszcze
                  automatycznej obslugi prawnej.
                </p>
              </div>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {renderDecisionField(
                "Czy brief i materialy wymagaja poufnosci?",
                "Przydatne, gdy zadanie dotyczy danych wewnetrznych lub publikacja powinna byc ograniczona.",
                formData.wymagana_poufnosc,
                (nextValue) => handleChange("wymagana_poufnosc", nextValue),
                "indigo",
              )}
              {renderDecisionField(
                "Czy firma oczekuje przeniesienia praw autorskich?",
                "Pomaga od razu zaznaczyc, czy finalny rezultat ma przejsc na firme po odbiorze.",
                formData.przeniesienie_praw_autorskich,
                (nextValue) => handleChange("przeniesienie_praw_autorskich", nextValue),
                "indigo",
              )}
              {renderDecisionField(
                "Czy wykonawca moze pokazac efekt w portfolio?",
                "To upraszcza rozmowe o publikacji projektu po wdrozeniu lub premierze.",
                formData.portfolio_dozwolone,
                (nextValue) => handleChange("portfolio_dozwolone", nextValue),
                "indigo",
              )}
              {renderDecisionField(
                "Czy materialy firmy sa legalnie udostepnione?",
                "Dotyczy np. licencji do fontow, zdjec, assetow, dostepow i plikow przekazywanych wykonawcy.",
                formData.materialy_legalnie_udostepnione,
                (nextValue) => handleChange("materialy_legalnie_udostepnione", nextValue),
                "indigo",
              )}
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-600">
            <div className="mb-2 flex items-center gap-2 font-semibold text-slate-900">
              <Info className="h-4 w-4 text-indigo-500" />
              Dane formalne stron pobierzemy pozniej z profili i dokumentow.
            </div>
            Dane identyfikacyjne firmy, dane do faktur i dane osobowe stron nie sa duplikowane w ogloszeniu. Te
            informacje pozostaja w profilach i snapshotach kontraktu.
          </div>
        </div>
      );
    }

    return (
      <div className="animate-in slide-in-from-right-8 space-y-8 duration-500">
        <div className={cn("grid gap-6", formData.czas_typ === "date" ? "md:grid-cols-2" : "md:grid-cols-1")}>
          <div className="space-y-2">
            <Label className={fieldLabelClass}>
              Budzet za calosc <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 rounded-xl bg-amber-100 px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-amber-700">
                PLN
              </div>
              <Input
                type="number"
                className={cn(inputClass, "h-16 pl-20 text-xl font-semibold focus-visible:ring-amber-100")}
                value={formData.stawka}
                onChange={(e) => handleChange("stawka", e.target.value)}
                placeholder="np. 500"
              />
            </div>
          </div>

          {formData.czas_typ === "date" && (
            <div className="space-y-2">
              <Label className={fieldLabelClass}>Planowany start <span className="normal-case tracking-normal text-slate-400">(opcjonalnie)</span></Label>
              <div className="relative">
                <CalendarDays className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                <Input
                  type="date"
                  className={cn(inputClass, "h-16 pl-12 text-lg focus-visible:ring-amber-100")}
                  value={formData.planowany_start}
                  onChange={(e) => handleChange("planowany_start", e.target.value)}
                />
              </div>
            </div>
          )}
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <Label className={fieldLabelClass}>Czas realizacji <span className="text-red-500">*</span></Label>
            <div className="relative rounded-2xl border border-slate-200 bg-white shadow-sm">
              <select
                className="h-14 w-full appearance-none rounded-2xl bg-transparent px-5 pr-12 text-base font-medium text-slate-900 outline-none"
                value={formData.czas_typ}
                onChange={(e) => handleTimeModeChange(e.target.value as OfferFormData["czas_typ"])}
              >
                <option value="days">Oczekiwana liczba dni</option>
                <option value="date">Konkretna data</option>
              </select>
              <ArrowRight className="pointer-events-none absolute right-5 top-1/2 h-4 w-4 -translate-y-1/2 rotate-90 text-slate-400" />
            </div>
          </div>

          <div className="space-y-2">
            <Label className={fieldLabelClass}>
                {formData.czas_typ === "days" ? "Oczekiwana liczba dni na wykonanie zlecenia" : "Data graniczna"}{" "}
                <span className="text-red-500">*</span>
              </Label>
            {formData.czas_typ === "days" ? (
              <Input
                type="number"
                min="1"
                className={cn(inputClass, "h-16 text-lg focus-visible:ring-amber-100")}
                value={formData.czas_dni}
                onChange={(e) => handleChange("czas_dni", e.target.value)}
                placeholder="np. 7"
              />
            ) : (
              <Input
                type="date"
                className={cn(inputClass, "h-16 text-lg focus-visible:ring-amber-100")}
                value={formData.czas_data}
                onChange={(e) => handleChange("czas_data", e.target.value)}
              />
            )}
          </div>
        </div>

        <div className="rounded-[2rem] border border-amber-200 bg-gradient-to-br from-amber-50 via-orange-50/70 to-white p-6 shadow-sm">
          <div className="mb-4 flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-600">
              <FileText className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Materialy i zasoby od firmy</h3>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                To miejsce na linki, briefy, dostepy i pliki, ktore firma przekaze po akceptacji zgloszenia. To nie
                jest lista obowiazkow wykonawcy.
              </p>
            </div>
          </div>

          <Input
            placeholder="Link do materialow (Google Drive, Dropbox, Figma, Notion...)"
            value={formData.obligations}
            onChange={(e) => handleChange("obligations", e.target.value)}
            className="mb-4 h-14 rounded-2xl border-amber-200 bg-white text-slate-900 placeholder:text-slate-400 focus-visible:ring-amber-100"
          />

          <div className="flex flex-wrap items-center gap-4">
            <Label
              htmlFor="file-upload"
              className="inline-flex cursor-pointer items-center gap-3 rounded-2xl bg-amber-500 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-amber-600"
            >
              {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-5 w-5" />}
              {isUploading ? "Przesylanie..." : "Dodaj plik"}
            </Label>

            <Input
              id="file-upload"
              type="file"
              className="hidden"
              onChange={handleFileUpload}
              disabled={isUploading}
            />

            {uploadedFileUrl && (
              <div className="inline-flex items-center gap-2 rounded-2xl border border-emerald-200 bg-white px-4 py-3 text-sm font-semibold text-emerald-700">
                <CheckCircle2 className="h-4 w-4" />
                Plik jest gotowy do dolaczenia.
              </div>
            )}
          </div>
        </div>

        <div className="rounded-[1.75rem] border border-amber-200 bg-amber-50/70 p-6">
          <div className="mb-4 flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-600">
              <ShieldAlert className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Informacje formalne i do umowy</h3>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                Te odpowiedzi pomagaja ulozyc wspolprace i zweryfikowac ryzyka jeszcze przed umowa. Nie wlaczaja same
                z siebie automatycznej obslugi prawnej.
              </p>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            {renderDecisionField(
              "Czy brief i materialy wymagaja poufnosci?",
              "Przydatne, gdy zadanie dotyczy danych wewnetrznych lub publikacja powinna byc ograniczona.",
              formData.wymagana_poufnosc,
              (nextValue) => handleChange("wymagana_poufnosc", nextValue),
              "amber",
            )}
            {renderDecisionField(
              "Czy firma oczekuje przeniesienia praw autorskich?",
              "Pomaga od razu zaznaczyc, czy finalny rezultat ma przejsc na firme po odbiorze.",
              formData.przeniesienie_praw_autorskich,
              (nextValue) => handleChange("przeniesienie_praw_autorskich", nextValue),
              "amber",
            )}
            {renderDecisionField(
              "Czy wykonawca moze pokazac efekt w portfolio?",
              "To upraszcza rozmowe o publikacji projektu po wdrozeniu lub premierze.",
              formData.portfolio_dozwolone,
              (nextValue) => handleChange("portfolio_dozwolone", nextValue),
              "amber",
            )}
            {renderDecisionField(
              "Czy materialy firmy sa legalnie udostepnione?",
              "Dotyczy np. licencji do fontow, zdjec, assetow, dostepow i plikow przekazywanych wykonawcy.",
              formData.materialy_legalnie_udostepnione,
              (nextValue) => handleChange("materialy_legalnie_udostepnione", nextValue),
              "amber",
            )}
          </div>
        </div>

        <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-600">
          <div className="mb-2 flex items-center gap-2 font-semibold text-slate-900">
            <Info className="h-4 w-4 text-amber-500" />
            Dane formalne stron pobierzemy pozniej z profili i dokumentow.
          </div>
          Dane identyfikacyjne firmy, dane do faktur i dane osobowe stron nie sa duplikowane w ogloszeniu. Te
          informacje pozostaja w profilach i snapshotach kontraktu.
        </div>
      </div>
    );
  };

  const renderStep4 = () => (
    <div className="animate-in slide-in-from-right-4 space-y-6 duration-300">
      <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
        <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="border-slate-200 bg-slate-50 text-slate-600">
                {isJob ? "Oferta pracy / staz" : "Mikrozlecenie"}
              </Badge>
              {formData.kategoria && (
                <Badge variant="outline" className="border-indigo-200 bg-indigo-50 text-indigo-700">
                  {formData.kategoria}
                </Badge>
              )}
            </div>
            <div>
              <h3 className="text-2xl font-bold tracking-tight text-slate-900">{formData.tytul || "Brak tytulu"}</h3>
              <p className="mt-2 max-w-2xl whitespace-pre-line text-sm leading-7 text-slate-600">
                {formData.opis || "Brak opisu"}
              </p>
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-emerald-200 bg-emerald-50 px-5 py-4 text-right">
            <div className="text-2xl font-bold text-emerald-700">
              {isJob
                ? `${formData.salary_range_min || 0} - ${formData.salary_range_max || 0} PLN`
                : `${formData.stawka || 0} PLN`}
            </div>
            <div className="mt-1 text-xs font-medium uppercase tracking-[0.14em] text-emerald-700/70">
              {isJob ? "zakres miesieczny" : "za calosc"}
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {isJob ? (
            <>
              <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4">
                <div className="mb-1 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Lokalizacja</div>
                <div className="text-sm font-semibold text-slate-900">{formData.location || "Do ustalenia"}</div>
              </div>
              <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4">
                <div className="mb-1 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                  Model wspolpracy
                </div>
                <div className="text-sm font-semibold text-slate-900">{formData.contract_type || "Do ustalenia"}</div>
              </div>
              <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4">
                <div className="mb-1 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Tryb pracy</div>
                <div className="text-sm font-semibold text-slate-900">
                  {formData.tryb_pracy === "remote"
                    ? "Remote"
                    : formData.tryb_pracy === "hybrid"
                      ? "Hybrydowo"
                      : "Na miejscu"}
                </div>
              </div>
              {formData.czas_typ === "date" && formData.planowany_start && (
                <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4">
                  <div className="mb-1 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Planowany start</div>
                  <div className="text-sm font-semibold text-slate-900">{formData.planowany_start}</div>
                </div>
              )}
              <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4 md:col-span-2">
                <div className="mb-1 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Okno czasowe</div>
                <div className="text-sm font-semibold text-slate-900">{buildTimeSummary() || "Do ustalenia"}</div>
              </div>
            </>
          ) : (
            <>
              {formData.czas_typ === "date" && formData.planowany_start && (
                <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4">
                  <div className="mb-1 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Planowany start</div>
                  <div className="text-sm font-semibold text-slate-900">{formData.planowany_start}</div>
                </div>
              )}
              <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4">
                <div className="mb-1 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Czas realizacji</div>
                <div className="text-sm font-semibold text-slate-900">{buildTimeSummary() || "Do ustalenia"}</div>
              </div>
            </>
          )}

          <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4 md:col-span-2">
            <div className="mb-1 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
              Technologie i narzedzia
            </div>
            <div className="text-sm font-semibold text-slate-900">
              {formData.technologies || "Nie podano technologii"}
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4">
            <div className="mb-1 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Cel wspolpracy</div>
            <div className="text-sm font-semibold text-slate-900">{formData.cel_wspolpracy || "Do ustalenia"}</div>
          </div>
          <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4">
            <div className="mb-1 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Oczekiwany rezultat</div>
            <div className="text-sm font-semibold text-slate-900">{formData.oczekiwany_rezultat || "Do ustalenia"}</div>
          </div>
          <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4 md:col-span-2">
            <div className="mb-1 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Kryteria akceptacji</div>
            <div className="text-sm font-semibold text-slate-900">{formData.kryteria_akceptacji || "Do ustalenia"}</div>
          </div>
          <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4 md:col-span-2">
            <div className="mb-1 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
              Osoba prowadzaca po stronie firmy
            </div>
            <div className="text-sm font-semibold text-slate-900">{formData.osoba_prowadzaca || "Do ustalenia"}</div>
          </div>
        </div>

        {showEmploymentWarning && (
          <div className="mt-6 rounded-[1.5rem] border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
            <div className="mb-2 flex items-center gap-2 font-semibold">
              <ShieldAlert className="h-4 w-4 text-amber-600" />
              To jest preferowany model wspolpracy
            </div>
            UoP i staz nie oznaczaja jeszcze pelnej automatyzacji calej logiki formalnej. Potraktuj to jako sygnal dla
            kandydata i temat do dalszego ustalenia.
          </div>
        )}

        {formData.is_platform_service && (
          <div className="mt-6 rounded-[1.5rem] border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
            <div className="mb-2 flex items-center gap-2 font-semibold">
              <Zap className="h-4 w-4 text-amber-600" />
              Oferta platform service
            </div>
            To ustawienie zmienia logike rozliczenia po stronie platformy. Upewnij sie, ze brief i materialy sa jasne
            jeszcze przed publikacja.
          </div>
        )}

        <div className="mt-6 rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4">
          <div className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Sygaly formalne</div>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className={cn("border-slate-200 bg-white text-slate-700", formData.wymagana_poufnosc && "border-indigo-200 bg-indigo-50 text-indigo-700")}>
              {formData.wymagana_poufnosc ? "Poufnosc wymagana" : "Bez dodatkowej poufnosci"}
            </Badge>
            <Badge variant="outline" className={cn("border-slate-200 bg-white text-slate-700", formData.przeniesienie_praw_autorskich && "border-indigo-200 bg-indigo-50 text-indigo-700")}>
              {formData.przeniesienie_praw_autorskich ? "Przeniesienie praw autorskich" : "Prawa autorskie do ustalenia"}
            </Badge>
            <Badge variant="outline" className={cn("border-slate-200 bg-white text-slate-700", formData.portfolio_dozwolone && "border-emerald-200 bg-emerald-50 text-emerald-700")}>
              {formData.portfolio_dozwolone ? "Portfolio dozwolone" : "Portfolio wymaga zgody"}
            </Badge>
            <Badge variant="outline" className={cn("border-slate-200 bg-white text-slate-700", formData.materialy_legalnie_udostepnione && "border-emerald-200 bg-emerald-50 text-emerald-700")}>
              {formData.materialy_legalnie_udostepnione ? "Materialy legalnie udostepnione" : "Materialy wymagaja weryfikacji"}
            </Badge>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-12 px-4">
        <div className="relative mx-auto flex max-w-3xl items-center justify-between">
          <div className="absolute left-0 top-[24px] h-[4px] w-full rounded-full bg-slate-200" />
          <div
            className={cn(
              "absolute left-0 top-[24px] h-[4px] rounded-full transition-all duration-700",
              isJob ? "bg-gradient-to-r from-indigo-500 to-violet-600" : "bg-gradient-to-r from-amber-400 to-orange-500",
            )}
            style={{ width: `${((step - 1) / 3) * 100}%` }}
          />

          {[1, 2, 3, 4].map((visibleStep, index) => (
            <div key={visibleStep} className="relative z-10 flex flex-col items-center gap-3 bg-white px-2">
              <div
                className={cn(
                  "flex h-12 w-12 items-center justify-center rounded-2xl border-2 text-sm font-bold transition-all",
                  step === visibleStep
                    ? isJob
                      ? "border-indigo-600 bg-white text-indigo-600 shadow-lg shadow-indigo-100"
                      : "border-amber-500 bg-white text-amber-600 shadow-lg shadow-amber-100"
                    : step > visibleStep
                      ? isJob
                        ? "border-indigo-600 bg-indigo-600 text-white"
                        : "border-amber-500 bg-amber-500 text-white"
                      : "border-slate-200 bg-white text-slate-400",
                )}
              >
                {step > visibleStep ? <CheckCircle2 className="h-5 w-5" /> : visibleStep}
              </div>
              <span
                className={cn(
                  "text-[11px] font-semibold uppercase tracking-[0.14em]",
                  step === visibleStep
                    ? "text-slate-900"
                    : step > visibleStep
                      ? isJob
                        ? "text-indigo-600"
                        : "text-amber-600"
                      : "text-slate-400",
                )}
              >
                {STEP_NAMES[index]}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="min-h-[420px]">
        {error && (
          <div className="mb-6 flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-800">
            <ShieldAlert className="h-5 w-5 shrink-0 text-red-600" />
            <span>{error}</span>
          </div>
        )}

        {step === 1 && !defaultType && renderStep1()}

        {step === 2 && (
          <div className="animate-in slide-in-from-right-8 space-y-8 duration-500">
            <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-600">
              <div className="mb-2 flex items-center gap-2 font-semibold text-slate-900">
                <Info className={cn("h-4 w-4", isJob ? "text-indigo-500" : "text-amber-500")} />
                Zadbaj o czytelny brief
              </div>
              Opisz zadanie tak, aby kandydat rozumial kontekst, efekt i oczekiwany zakres jeszcze przed pierwsza
              rozmowa. To oszczedza czas po obu stronach.
            </div>

            <div className="space-y-2">
              <Label className={fieldLabelClass}>
                Tytul ogloszenia <span className="text-red-500">*</span>
              </Label>
              <Input
                value={formData.tytul}
                onChange={(e) => handleChange("tytul", e.target.value)}
                placeholder={isJob ? "np. Junior React Developer do projektu SaaS" : "np. Landing page do kampanii reklamowej"}
                className={cn(inputClass, "h-16 text-lg font-semibold", isJob ? "focus-visible:ring-indigo-100" : "focus-visible:ring-amber-100")}
              />
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label className={fieldLabelClass}>
                  Kategoria <span className="text-red-500">*</span>
                </Label>
                <div className="relative rounded-2xl border border-slate-200 bg-white shadow-sm">
                  <select
                    className={cn(
                      "h-14 w-full appearance-none rounded-2xl bg-transparent px-5 pr-12 text-base font-medium text-slate-900 outline-none",
                      !formData.kategoria && "text-slate-400",
                    )}
                    value={formData.kategoria}
                    onChange={(e) => handleChange("kategoria", e.target.value)}
                  >
                    <option value="" disabled>
                      Wybierz kategorie
                    </option>
                    {CATEGORIES.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                  <ArrowRight className="pointer-events-none absolute right-5 top-1/2 h-4 w-4 -translate-y-1/2 rotate-90 text-slate-400" />
                </div>
              </div>

              <div className="space-y-2">
                <Label className={fieldLabelClass}>Technologie i narzedzia</Label>
                <div className="relative">
                  <Code2 className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                  <Input
                    value={formData.technologies}
                    onChange={(e) => handleChange("technologies", e.target.value)}
                    placeholder="React, TypeScript, Figma"
                    className={cn(inputClass, "pl-12", isJob ? "focus-visible:ring-indigo-100" : "focus-visible:ring-amber-100")}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label className={fieldLabelClass}>
                Opis glowny <span className="text-red-500">*</span>
              </Label>
              <Textarea
                value={formData.opis}
                onChange={(e) => handleChange("opis", e.target.value)}
                placeholder={
                  isJob
                    ? "Opisz role, glowny kontekst biznesowy, obszar odpowiedzialnosci i to, po czym poznasz, ze wspolpraca idzie dobrze."
                    : "Opisz zadanie, materialy startowe, oczekiwany rezultat i wszystko, co pomoze wykonawcy szybko zrozumiec zlecenie."
                }
                className={cn(textareaClass, "min-h-[260px]", isJob ? "focus-visible:ring-indigo-100" : "focus-visible:ring-amber-100")}
              />
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label className={fieldLabelClass}>
                  Cel wspolpracy <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  value={formData.cel_wspolpracy}
                  onChange={(e) => handleChange("cel_wspolpracy", e.target.value)}
                  placeholder="Po co firma zleca to zadanie i jaki efekt biznesowy chce osiagnac?"
                  className={cn(textareaClass, "min-h-[150px]", isJob ? "focus-visible:ring-indigo-100" : "focus-visible:ring-amber-100")}
                />
              </div>

              <div className="space-y-2">
                <Label className={fieldLabelClass}>
                  Oczekiwany rezultat <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  value={formData.oczekiwany_rezultat}
                  onChange={(e) => handleChange("oczekiwany_rezultat", e.target.value)}
                  placeholder="Co konkretnie ma zostac dostarczone na koncu wspolpracy?"
                  className={cn(textareaClass, "min-h-[150px]", isJob ? "focus-visible:ring-indigo-100" : "focus-visible:ring-amber-100")}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className={fieldLabelClass}>
                Kryteria akceptacji <span className="text-red-500">*</span>
              </Label>
              <Textarea
                value={formData.kryteria_akceptacji}
                onChange={(e) => handleChange("kryteria_akceptacji", e.target.value)}
                placeholder="Po czym uznacie, ze praca jest wykonana poprawnie? Opisz zakres, warunki odbioru i mierniki sukcesu."
                className={cn(textareaClass, "min-h-[160px]", isJob ? "focus-visible:ring-indigo-100" : "focus-visible:ring-amber-100")}
              />
            </div>

            <div className="space-y-2">
              <Label className={fieldLabelClass}>
                Osoba prowadzaca po stronie firmy <span className="text-red-500">*</span>
              </Label>
              <Input
                value={formData.osoba_prowadzaca}
                onChange={(e) => handleChange("osoba_prowadzaca", e.target.value)}
                placeholder="Imie i rola osoby, ktora doprecyzowuje brief i odbiera rezultat"
                className={cn(inputClass, isJob ? "focus-visible:ring-indigo-100" : "focus-visible:ring-amber-100")}
              />
            </div>
          </div>
        )}

        {step === 3 && renderStep3()}
        {step === 4 && renderStep4()}

        <div className="mt-10 flex items-center justify-between border-t border-slate-200 pt-8">
          <Button
            variant="ghost"
            onClick={prevStep}
            disabled={step === (defaultType ? 2 : 1) || isLoading}
            className="h-12 rounded-2xl px-5 text-sm font-semibold text-slate-600 hover:bg-slate-100"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Wstecz
          </Button>

          {step < 4 ? (
            <Button
              onClick={nextStep}
              className={cn(
                "h-14 rounded-[1.5rem] px-8 text-sm font-semibold shadow-lg transition-transform hover:-translate-y-0.5",
                isJob ? "bg-indigo-600 hover:bg-indigo-700" : "bg-amber-500 hover:bg-amber-600",
              )}
            >
              Dalej
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={isLoading}
              className={cn(
                "h-14 rounded-[1.5rem] px-8 text-sm font-semibold shadow-lg transition-transform hover:-translate-y-0.5",
                isJob ? "bg-indigo-600 hover:bg-indigo-700" : "bg-emerald-600 hover:bg-emerald-700",
              )}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Publikowanie...
                </>
              ) : (
                <>
                  Publikuj oferte
                  <CheckCircle2 className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
