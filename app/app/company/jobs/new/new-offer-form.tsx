"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
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
  Plus,
  ShieldAlert,
  Trash2,
  UploadCloud,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { uploadPrivateFile } from "@/lib/security/client-upload";
import { JOB_CATEGORIES } from "@/lib/constants";

const STEP_NAMES = ["Rodzaj", "Informacje", "Szczegoly", "Podsumowanie"];

const fieldLabelClass = "ml-1 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500";
const inputClass =
  "h-14 rounded-2xl border-slate-200 bg-white px-5 text-base font-medium text-slate-900 placeholder:text-slate-400 focus-visible:ring-4";
const textareaClass =
  "min-h-[170px] rounded-[1.75rem] border-slate-200 bg-white px-5 py-4 text-base leading-7 text-slate-900 placeholder:text-slate-400 focus-visible:ring-4";

type RealizationMode = "student_defined" | "company_defined";

type CompanyMilestoneDraft = {
  title: string;
  acceptance_criteria: string;
};

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
  realization_mode: RealizationMode;
  company_milestones: CompanyMilestoneDraft[];
};

function createExampleOfferData(type: OfferFormData["typ"]): OfferFormData {
  if (type === "job") {
    return {
      typ: "job",
      is_platform_service: false,
      tytul: "Junior React Developer do projektu SaaS",
      kategoria: "Strony internetowe i CMS",
      opis:
        "Szukamy studenta lub absolwenta do wsparcia zespolu przy rozwoju panelu klienta w aplikacji SaaS. Zakres obejmuje wdrazanie widokow w React, poprawki UI, podlaczenie prostych integracji API i wspolprace z designerem.",
      technologies: "React, TypeScript, Tailwind CSS, Git",
      cel_wspolpracy:
        "Odciazyc zespol produktowy przy backlogu frontendowym i sprawdzic potencjal do dluzszej wspolpracy.",
      oczekiwany_rezultat:
        "Regularnie dostarczane komponenty i poprawki UI zgodne z makietami oraz opisem zadan w backlogu.",
      kryteria_akceptacji:
        "- kod przechodzi review\n- widoki sa responsywne\n- brak bledow w konsoli\n- zadania sa opisane w pull requestach",
      osoba_prowadzaca: "Marta Nowak, Product Manager",
      stawka: "",
      salary_range_min: "3500",
      salary_range_max: "5500",
      contract_type: "UZ",
      tryb_pracy: "remote",
      location: "Zdalnie / Polska / CET",
      is_remote: true,
      planowany_start: "",
      czas_typ: "days",
      czas_dni: "30",
      czas_data: "",
      obligations: "Dostep do repozytorium, makiety Figma i lista zadan w Linear/Jira.",
      wymagania: "- podstawowe doswiadczenie z React\n- znajomosc TypeScript\n- komunikatywnosc i samodzielnosc",
      benefits: "- feedback od senior developera\n- elastyczne godziny\n- mozliwosc przedluzenia wspolpracy",
      wymagana_poufnosc: true,
      przeniesienie_praw_autorskich: true,
      portfolio_dozwolone: false,
      materialy_legalnie_udostepnione: true,
      realization_mode: "student_defined",
      company_milestones: [],
    };
  }

  return {
    typ: "micro",
    is_platform_service: false,
    tytul: "Landing page do kampanii rekrutacyjnej",
    kategoria: "Strony internetowe i CMS",
    opis:
      "Potrzebujemy prostego landing page'a promujacego program stazowy. Mamy logo, podstawowe teksty i brandbook. Student ma przygotowac strone z czytelnym CTA, sekcja benefitow i formularzem kontaktowym.",
    technologies: "Figma, Webflow lub Next.js, Google Analytics",
    cel_wspolpracy:
      "Zebrac zapisy studentow zainteresowanych programem stazowym i szybko przetestowac komunikat kampanii.",
    oczekiwany_rezultat:
      "Gotowy landing page z wersja desktop i mobile, podpietym formularzem oraz kompletem plikow zrodlowych.",
    kryteria_akceptacji:
      "- strona zawiera hero, benefity, harmonogram, FAQ i CTA\n- formularz wysyla dane do wskazanego arkusza lub narzedzia\n- widok jest poprawny na mobile i desktop\n- firma otrzymuje link produkcyjny oraz pliki robocze",
    osoba_prowadzaca: "Anna Kowalska, Marketing Manager",
    stawka: "1200",
    salary_range_min: "",
    salary_range_max: "",
    contract_type: "B2B",
    tryb_pracy: "remote",
    location: "Zdalnie / Polska / CET",
    is_remote: true,
    planowany_start: "",
    czas_typ: "days",
    czas_dni: "10",
    czas_data: "",
    obligations: "Link do brandbooka, folderu Google Drive z materialami i przykładowych landing page'y.",
    wymagania: "",
    benefits: "",
    wymagana_poufnosc: false,
    przeniesienie_praw_autorskich: true,
    portfolio_dozwolone: true,
    materialy_legalnie_udostepnione: true,
    realization_mode: "company_defined",
    company_milestones: [
      {
        title: "Struktura i copy landing page",
        acceptance_criteria:
          "- propozycja ukladu sekcji\n- dopracowane naglowki i CTA\n- lista brakujacych materialow po stronie firmy",
      },
      {
        title: "Projekt i wdrozenie strony",
        acceptance_criteria:
          "- responsywna strona gotowa do publikacji\n- podpiety formularz\n- przekazane pliki zrodlowe lub dostep do projektu",
      },
    ],
  };
}

export default function NewOfferForm({
  defaultType,
}: {
  defaultType?: "micro" | "job" | null;
}) {
  const searchParams = useSearchParams();
  const isAppTour = searchParams.get("appTour") === "1";
  const tourOfferStep = isAppTour ? searchParams.get("tourOfferStep") : null;
  const [step, setStep] = useState(defaultType ? 2 : 1);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadedFileUrl, setUploadedFileUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const wizardTopRef = useRef<HTMLDivElement | null>(null);
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
    realization_mode: "student_defined",
    company_milestones: [],
  });

  const isJob = formData.typ === "job";
  const showEmploymentWarning =
    isJob && (formData.contract_type === "UoP" || formData.contract_type === "Staz");

  const applyExampleData = useCallback(() => {
    setFormData(createExampleOfferData(formData.typ));
    setUploadedFileUrl(null);
    setError(null);
    setStep(2);

    window.requestAnimationFrame(() => {
      wizardTopRef.current?.scrollIntoView({ block: "start", behavior: "smooth" });
    });
  }, [formData.typ]);

  useEffect(() => {
    if (!tourOfferStep) return;

    const nextStep = Number(tourOfferStep);
    if (!Number.isInteger(nextStep) || nextStep < 2 || nextStep > 4) return;

    setStep(nextStep);
  }, [tourOfferStep]);

  useEffect(() => {
    const handleTourAction = (event: Event) => {
      const customEvent = event as CustomEvent<{ actionId?: string }>;
      if (customEvent.detail?.actionId === "fill-company-offer-example") {
        applyExampleData();
      }
    };

    window.addEventListener("student2work:tour-action", handleTourAction);
    return () => window.removeEventListener("student2work:tour-action", handleTourAction);
  }, [applyExampleData]);

  useEffect(() => {
    if (step < 3) return;

    const node = wizardTopRef.current;
    if (!node) return;

    const top = node.getBoundingClientRect().top + window.scrollY - 96;
    window.scrollTo({
      top: Math.max(0, top),
      behavior: "smooth",
    });
  }, [step]);

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

  const handleOfferTypeChange = (value: OfferFormData["typ"]) => {
    setFormData((prev) => ({
      ...prev,
      typ: value,
      realization_mode: value === "micro" ? prev.realization_mode : "student_defined",
      company_milestones: value === "micro" ? prev.company_milestones : [],
    }));
  };

  const handleRealizationModeChange = (value: RealizationMode) => {
    setFormData((prev) => ({
      ...prev,
      realization_mode: value,
      company_milestones:
        value === "company_defined"
          ? prev.company_milestones.length > 0
            ? prev.company_milestones
            : [{ title: "", acceptance_criteria: "" }]
          : [],
    }));
  };

  const addCompanyMilestone = () => {
    setFormData((prev) => ({
      ...prev,
      company_milestones: [...prev.company_milestones, { title: "", acceptance_criteria: "" }],
    }));
  };

  const updateCompanyMilestone = (
    index: number,
    field: keyof CompanyMilestoneDraft,
    value: string,
  ) => {
    setFormData((prev) => ({
      ...prev,
      company_milestones: prev.company_milestones.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: value } : item,
      ),
    }));
  };

  const removeCompanyMilestone = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      company_milestones: prev.company_milestones.filter((_, itemIndex) => itemIndex !== index),
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

      const uploaded = await uploadPrivateFile({ file, purpose: "offer_attachment" });
      setUploadedFileUrl(uploaded.ref);
    } catch (uploadError: unknown) {
      const message = uploadError instanceof Error ? uploadError.message : "Nieznany błąd";
      console.error(uploadError);
      setError(`Błąd przesyłania pliku: ${message}`);
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
          "Uzupelnij tytul, opis, kategorie, cel współpracy, oczekiwany rezultat, kryteria akceptacji i osobe prowadzaca.";
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
        } else if (formData.realization_mode === "company_defined") {
          const cleanedMilestones = formData.company_milestones.filter(
            (milestone) => milestone.title.trim().length > 0 || milestone.acceptance_criteria.trim().length > 0,
          );

          if (cleanedMilestones.length === 0) {
            validationError = "Dodaj przynajmniej jeden etap realizacji ustalany przez firme.";
          } else if (cleanedMilestones.some((milestone) => milestone.title.trim().length === 0)) {
            validationError = "Kazdy etap ustalany przez firme musi miec nazwe.";
          }
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
      if (key === "company_milestones") return;

      if (typeof value === "boolean") {
        if (value) payload.append(key, "on");
        return;
      }

      if (typeof value === "string") {
        payload.append(key, value);
      }
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

    const companyMilestones =
      formData.typ === "micro" && formData.realization_mode === "company_defined"
        ? formData.company_milestones
            .map((milestone) => ({
              title: milestone.title.trim(),
              acceptance_criteria: milestone.acceptance_criteria.trim(),
            }))
            .filter((milestone) => milestone.title.length > 0 || milestone.acceptance_criteria.length > 0)
        : [];

    payload.set("realization_mode", formData.typ === "micro" ? formData.realization_mode : "student_defined");
    payload.set("company_milestones", JSON.stringify(companyMilestones));

    if (uploadedFileUrl) {
      const currentMaterials = String(payload.get("obligations") || "");
      const nextMaterials = currentMaterials
        ? `${currentMaterials}\n\n[ZALACZONY PLIK]: ${uploadedFileUrl}`
        : `[ZALACZONY PLIK]: ${uploadedFileUrl}`;
      payload.set("obligations", nextMaterials);
    }

    try {
      await createOffer(payload);
    } catch (submitError: unknown) {
      setError(submitError instanceof Error ? submitError.message : "Nie udało sie utworzyc oferty.");
      setIsLoading(false);
    }
  };

  const renderStep1 = () => (
    <div className="animate-in slide-in-from-right-4 space-y-6 duration-300">
      <div className="space-y-2 text-center">
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">Jaki rodzaj oferty chcesz dodac?</h2>
        <p className="mx-auto max-w-2xl text-sm leading-6 text-slate-500">
          Wybierz format współpracy, który najlepiej pasuje do tego, jak chcesz pracowac z wykonawca.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <button
          type="button"
          onClick={() => handleOfferTypeChange("micro")}
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
          onClick={() => handleOfferTypeChange("job")}
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
            Dluzsza wspolpraca, staż albo rola projektowa. Dobre, gdy chcesz opisac szerszy zakres i oczekiwania.
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
              <Label className={fieldLabelClass}>Preferowany model współpracy</Label>
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
              Model współpracy jest dzis przede wszystkim informacja dla kandydata.
            </div>
            Obecny workflow platformy najpewniej najlepiej pokrywa B2B i umowę zlecenie. Jesli wybierasz UoP lub staż,
            potraktuj to jako preferencje do dalszego ustalenia, a nie gotowy workflow platformowy.
          </div>

          {showEmploymentWarning && (
            <div className="rounded-[1.5rem] border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
              <div className="mb-2 flex items-center gap-2 font-semibold">
                <ShieldAlert className="h-4 w-4 text-amber-600" />
                Uwaga dla UoP i stazu
              </div>
              Ten wybor komunikuje preferowany model współpracy, ale nie oznacza jeszcze, ze cala logika formalna i
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
- mozliwosc dluzszej współpracy`}
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
                  Te odpowiedzi pomagaja przygotowac współpracę i wychwycic ryzyka przed umowa. Nie uruchamiaja jeszcze
                  automatycznej obsługi prawnej.
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
                "Czy wykonawca może pokazac efekt w portfolio?",
                "To upraszcza rozmowe o publikacji projektu po wdrozeniu lub premierze.",
                formData.portfolio_dozwolone,
                (nextValue) => handleChange("portfolio_dozwolone", nextValue),
                "indigo",
              )}
              {renderDecisionField(
                "Czy materialy firmy są legalnie udostepnione?",
                "Dotyczy np. licencji do fontow, zdjec, assetow, dostępów i plikow przekazywanych wykonawcy.",
                formData.materialy_legalnie_udostepnione,
                (nextValue) => handleChange("materialy_legalnie_udostepnione", nextValue),
                "indigo",
              )}
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-600">
            <div className="mb-2 flex items-center gap-2 font-semibold text-slate-900">
              <Info className="h-4 w-4 text-indigo-500" />
              Dane formalne stron pobierzemy później z profili i dokumentów.
            </div>
            Dane identyfikacyjne firmy, dane do faktur i dane osobowe stron nie są duplikowane w ogloszeniu. Te
            informacje pozostaja w profilach i snapshotach kontraktu.
          </div>
        </div>
      );
    }

    return (
      <div className="animate-in slide-in-from-right-8 space-y-8 duration-500">
        <div data-tour="company-offer-budget-time" className={cn("grid gap-6", formData.czas_typ === "date" ? "md:grid-cols-2" : "md:grid-cols-1")}>
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

        <div data-tour="company-offer-materials" className="rounded-[2rem] border border-amber-200 bg-gradient-to-br from-amber-50 via-orange-50/70 to-white p-6 shadow-sm">
          <div className="mb-4 flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-600">
              <FileText className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Materialy i zasoby od firmy</h3>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                To miejsce na linki, briefy, dostępy i pliki, które firma przekaze po akceptacji zgłoszenia. To nie
                jest lista obowiazkow wykonawcy.
              </p>
            </div>
          </div>

          <Input
            placeholder="Link do materiałów (Google Drive, Dropbox, Figma, Notion...)"
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

        <div data-tour="company-offer-plan" className="rounded-[1.75rem] border border-indigo-200 bg-indigo-50/70 p-6">
          <div className="mb-4 flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-600">
              <FileText className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Plan realizacji po akceptacji</h3>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                Wybierz, kto ustala etapy. Jesli firma ma gotowy plan wykonania, student zobaczy go jeszcze przed
                aplikowaniem, a po akceptacji etap uzgodnienia bedzie od razu zamkniety.
              </p>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <button
              type="button"
              onClick={() => handleRealizationModeChange("student_defined")}
              className={cn(
                "rounded-[1.5rem] border p-5 text-left transition-colors",
                formData.realization_mode === "student_defined"
                  ? "border-slate-900 bg-slate-900 text-white shadow-lg"
                  : "border-slate-200 bg-white text-slate-700 hover:border-indigo-200 hover:bg-indigo-50/40",
              )}
            >
              <p className="text-sm font-bold">Student ustala etapy po akceptacji</p>
              <p
                className={cn(
                  "mt-2 text-xs leading-6",
                  formData.realization_mode === "student_defined" ? "text-slate-200" : "text-slate-500",
                )}
              >
                Obecny standard platformy. Student rozpisuje milestone&apos;y, a firma je zatwierdza przed finansowaniem.
              </p>
            </button>

            <button
              type="button"
              onClick={() => handleRealizationModeChange("company_defined")}
              className={cn(
                "rounded-[1.5rem] border p-5 text-left transition-colors",
                formData.realization_mode === "company_defined"
                  ? "border-indigo-300 bg-white text-slate-900 shadow-lg shadow-indigo-100"
                  : "border-slate-200 bg-white text-slate-700 hover:border-indigo-200 hover:bg-indigo-50/40",
              )}
            >
              <p className="text-sm font-bold">Firma ustala etapy z gory</p>
              <p className="mt-2 text-xs leading-6 text-slate-500">
                Dobre dla zadań z gotowym harmonogramem. Etapy będą widoczne dla studenta przed aplikacja, a wypłata
                nastapi po odbiorze calego zadania.
              </p>
            </button>
          </div>

          {formData.realization_mode === "company_defined" && (
            <div className="mt-6 space-y-4">
              <div className="rounded-2xl border border-indigo-200 bg-white px-4 py-3 text-sm leading-6 text-slate-600">
                System utworzy te etapy automatycznie po akceptacji studenta. W v1 wczesniejsze etapy sluza jako plan
                pracy, a rozliczenie calej kwoty zostanie przypisane do finalnego etapu.
              </div>

              <div className="space-y-4">
                {formData.company_milestones.map((milestone, index) => (
                  <div key={`company-milestone-${index}`} className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="mb-4 flex items-center justify-between gap-4">
                      <div>
                        <p className="text-xs font-black uppercase tracking-[0.14em] text-indigo-500">
                          Etap {index + 1}
                        </p>
                        <p className="mt-1 text-sm font-medium text-slate-500">
                          Student zobaczy ten etap na ofercie i w kontrakcie po akceptacji.
                        </p>
                      </div>
                      {formData.company_milestones.length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          className="rounded-2xl border-slate-200 text-slate-600"
                          onClick={() => removeCompanyMilestone(index)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Usun
                        </Button>
                      )}
                    </div>

                    <div className="grid gap-4">
                      <div className="space-y-2">
                        <Label className={fieldLabelClass}>
                          Nazwa etapu <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          className={cn(inputClass, "h-14 focus-visible:ring-indigo-100")}
                          value={milestone.title}
                          onChange={(e) => updateCompanyMilestone(index, "title", e.target.value)}
                          placeholder="np. Makiety i akceptacja kierunku"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className={fieldLabelClass}>
                          Co ma byc gotowe po tym etapie
                          <span className="normal-case tracking-normal text-slate-400"> (opcjonalnie)</span>
                        </Label>
                        <Textarea
                          className={cn("min-h-[120px]", textareaClass, "focus-visible:ring-indigo-100")}
                          value={milestone.acceptance_criteria}
                          onChange={(e) => updateCompanyMilestone(index, "acceptance_criteria", e.target.value)}
                          placeholder={`np.
- zaakceptowany kierunek wizualny
- komplet plikow roboczych
- lista uwag po stronie firmy`}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <Button
                type="button"
                variant="outline"
                onClick={addCompanyMilestone}
                className="rounded-2xl border-indigo-200 bg-white text-indigo-700 hover:bg-indigo-50"
              >
                <Plus className="mr-2 h-4 w-4" />
                Dodaj kolejny etap
              </Button>
            </div>
          )}
        </div>

        <div className="rounded-[1.75rem] border border-amber-200 bg-amber-50/70 p-6">
          <div className="mb-4 flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-600">
              <ShieldAlert className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Informacje formalne i do umowy</h3>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                Te odpowiedzi pomagaja ulozyc współpracę i zweryfikowac ryzyka jeszcze przed umowa. Nie wlaczaja same
                z siebie automatycznej obsługi prawnej.
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
              "Czy wykonawca może pokazac efekt w portfolio?",
              "To upraszcza rozmowe o publikacji projektu po wdrozeniu lub premierze.",
              formData.portfolio_dozwolone,
              (nextValue) => handleChange("portfolio_dozwolone", nextValue),
              "amber",
            )}
            {renderDecisionField(
              "Czy materialy firmy są legalnie udostepnione?",
              "Dotyczy np. licencji do fontow, zdjec, assetow, dostępów i plikow przekazywanych wykonawcy.",
              formData.materialy_legalnie_udostepnione,
              (nextValue) => handleChange("materialy_legalnie_udostepnione", nextValue),
              "amber",
            )}
          </div>
        </div>

        <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-600">
          <div className="mb-2 flex items-center gap-2 font-semibold text-slate-900">
            <Info className="h-4 w-4 text-amber-500" />
            Dane formalne stron pobierzemy później z profili i dokumentów.
          </div>
          Dane identyfikacyjne firmy, dane do faktur i dane osobowe stron nie są duplikowane w ogloszeniu. Te
          informacje pozostaja w profilach i snapshotach kontraktu.
        </div>
      </div>
    );
  };

  const renderStep4 = () => (
    <div className="animate-in slide-in-from-right-4 space-y-6 duration-300">
      <div data-tour="company-offer-summary" className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
        <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="border-slate-200 bg-slate-50 text-slate-600">
                {isJob ? "Oferta pracy / staż" : "Mikrozlecenie"}
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
                  Model współpracy
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
              <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4 md:col-span-2">
                <div className="mb-1 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Plan realizacji</div>
                <div className="text-sm font-semibold text-slate-900">
                  {formData.realization_mode === "company_defined"
                    ? "Firma ustala etapy z gory"
                    : "Student ustala etapy po akceptacji"}
                </div>
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
            <div className="mb-1 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Cel współpracy</div>
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
              To jest preferowany model współpracy
            </div>
            UoP i staż nie oznaczaja jeszcze pelnej automatyzacji calej logiki formalnej. Potraktuj to jako sygnal dla
            kandydata i temat do dalszego ustalenia.
          </div>
        )}

        {formData.is_platform_service && (
          <div className="mt-6 rounded-[1.5rem] border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
            <div className="mb-2 flex items-center gap-2 font-semibold">
              <Zap className="h-4 w-4 text-amber-600" />
              Oferta platform service
            </div>
            To ustawienie zmienia logike rozliczenia po stronie platformy. Upewnij sie, ze brief i materialy są jasne
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

        {!isJob && formData.realization_mode === "company_defined" && formData.company_milestones.length > 0 && (
          <div className="mt-6 rounded-[1.5rem] border border-indigo-200 bg-indigo-50/60 p-5">
            <div className="mb-4 text-xs font-semibold uppercase tracking-[0.14em] text-indigo-600">
              Etapy widoczne dla studenta
            </div>
            <div className="space-y-3">
              {formData.company_milestones
                .filter((milestone) => milestone.title.trim().length > 0 || milestone.acceptance_criteria.trim().length > 0)
                .map((milestone, index) => (
                  <div key={`preview-milestone-${index}`} className="rounded-2xl border border-indigo-100 bg-white p-4">
                    <p className="text-sm font-bold text-slate-900">
                      {index + 1}. {milestone.title || "Etap bez nazwy"}
                    </p>
                    {milestone.acceptance_criteria.trim() && (
                      <p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-600">
                        {milestone.acceptance_criteria}
                      </p>
                    )}
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div ref={wizardTopRef} className="mx-auto max-w-4xl">
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
            <div data-tour="company-offer-example" className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-600">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="mb-2 flex items-center gap-2 font-semibold text-slate-900">
                    <Info className={cn("h-4 w-4", isJob ? "text-indigo-500" : "text-amber-500")} />
                    Zadbaj o czytelny brief
                  </div>
                  Opisz zadanie tak, aby kandydat rozumial kontekst, efekt i oczekiwany zakres jeszcze przed pierwsza
                  rozmowa. To oszczedza czas po obu stronach.
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={applyExampleData}
                  className={cn(
                    "shrink-0 rounded-2xl bg-white px-5 font-semibold shadow-sm",
                    isJob
                      ? "border-indigo-200 text-indigo-700 hover:bg-indigo-50"
                      : "border-amber-200 text-amber-700 hover:bg-amber-50",
                  )}
                >
                  <Zap className="mr-2 h-4 w-4" />
                  Wypełnij przykładem
                </Button>
              </div>
            </div>

            <div data-tour="company-offer-basics" className="space-y-6">
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
                    {JOB_CATEGORIES.map((category) => (
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
            </div>

            <div data-tour="company-offer-description" className="space-y-2">
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

            <div data-tour="company-offer-outcome" className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label className={fieldLabelClass}>
                  Cel współpracy <span className="text-red-500">*</span>
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
                  placeholder="Co konkretnie ma zostac dostarczone na koncu współpracy?"
                  className={cn(textareaClass, "min-h-[150px]", isJob ? "focus-visible:ring-indigo-100" : "focus-visible:ring-amber-100")}
                />
              </div>
            </div>

            <div data-tour="company-offer-acceptance" className="space-y-2">
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

            <div data-tour="company-offer-contact" className="space-y-2">
              <Label className={fieldLabelClass}>
                Osoba prowadzaca po stronie firmy <span className="text-red-500">*</span>
              </Label>
              <Input
                value={formData.osoba_prowadzaca}
                onChange={(e) => handleChange("osoba_prowadzaca", e.target.value)}
                placeholder="Imię i rola osoby, która doprecyzowuje brief i odbiera rezultat"
                className={cn(inputClass, isJob ? "focus-visible:ring-indigo-100" : "focus-visible:ring-amber-100")}
              />
            </div>
          </div>
        )}

        {step === 3 && renderStep3()}
        {step === 4 && renderStep4()}

        <div className="mobile-sticky-actions mt-10 flex items-center justify-between gap-3 border-t border-slate-200 pt-8">
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
                "h-14 rounded-[1.5rem] px-8 text-sm font-semibold shadow-lg transition-transform hover:-translate-y-0.5 text-white",
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
