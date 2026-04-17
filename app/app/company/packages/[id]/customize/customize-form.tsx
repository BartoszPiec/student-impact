"use client";

import type { ReactNode } from "react";
import { useMemo, useState, useTransition } from "react";
import { createCustomizedOffer, updateCustomizedOffer } from "../../_actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ArrowRight, ClipboardList, Clock3, Loader2, Package2, Save, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  groupPackageFormSchemaBySection,
  type PackageFormField,
  type PackageVariant,
} from "@/lib/services/package-customization";
import { LOGO_PACKAGE_ID } from "@/lib/services/logo-student-selection";

type Props = {
  packageId: string;
  packageTitle: string;
  packageCategory: string;
  initialData?: Record<string, string>;
  offerId?: string;
  gradient?: string;
  formSchema?: PackageFormField[];
  selectedVariant?: PackageVariant | null;
};

function DynamicField({
  field,
  value,
  onValueChange,
}: {
  field: PackageFormField;
  value: string;
  onValueChange: (fieldId: string, nextValue: string) => void;
}) {
  return (
    <div key={field.id} className={field.type === "textarea" ? "space-y-3 md:col-span-2" : "space-y-3"}>
      <Label htmlFor={field.id} className="font-medium text-slate-700">
        {field.label}
        {field.required ? <span className="ml-1 text-rose-500">*</span> : null}
      </Label>
      {field.hint ? <p className="text-xs leading-5 text-slate-500">{field.hint}</p> : null}

      {field.type === "select" ? (
        <Select name={`q_${field.id}`} value={value} onValueChange={(nextValue) => onValueChange(field.id, nextValue)}>
          <SelectTrigger className="h-11 border-slate-200 bg-white">
            <SelectValue placeholder="Wybierz odpowiedz..." />
          </SelectTrigger>
          <SelectContent>
            {(field.options || []).map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : field.type === "radio" ? (
        <div className="space-y-2 rounded-xl border border-slate-200 bg-white p-4">
          {(field.options || []).map((option) => {
            const optionId = `${field.id}-${option.value}`;
            return (
              <label key={optionId} htmlFor={optionId} className="flex items-start gap-2 text-sm text-slate-700">
                <input
                  id={optionId}
                  type="radio"
                  name={`q_${field.id}`}
                  value={option.value}
                  checked={value ? value === option.value : false}
                  onChange={(event) => onValueChange(field.id, event.target.value)}
                  required={field.required}
                  className="mt-1 h-4 w-4 border-slate-300 text-indigo-600"
                />
                <span>{option.label}</span>
              </label>
            );
          })}
        </div>
      ) : field.type === "file" ? (
        <Input
          id={field.id}
          name={`q_${field.id}`}
          type="file"
          accept={field.accept || undefined}
          className="h-11 border-slate-200 bg-white"
          required={field.required}
        />
      ) : field.type === "textarea" ? (
        <Textarea
          id={field.id}
          name={`q_${field.id}`}
          value={value}
          onChange={(event) => onValueChange(field.id, event.target.value)}
          placeholder={field.placeholder || "Wpisz odpowiedz..."}
          className="min-h-[120px] border-slate-200 bg-white text-base"
          required={field.required}
          maxLength={field.maxLength ?? undefined}
        />
      ) : (
        <Input
          id={field.id}
          name={`q_${field.id}`}
          type={field.inputType || "text"}
          value={value}
          onChange={(event) => onValueChange(field.id, event.target.value)}
          placeholder={field.placeholder || "Wpisz odpowiedz..."}
          className="h-11 border-slate-200 bg-white"
          required={field.required}
          maxLength={field.maxLength ?? undefined}
        />
      )}
    </div>
  );
}

function DynamicBriefSection({
  formSchema,
  initialData,
}: {
  formSchema: PackageFormField[];
  initialData: Record<string, string>;
}) {
  const [answers, setAnswers] = useState<Record<string, string>>(() => {
    const normalized = { ...initialData };
    formSchema.forEach((field) => {
      if (typeof normalized[field.id] !== "string") {
        normalized[field.id] = "";
      }
    });
    return normalized;
  });

  const visibleFields = useMemo(
    () =>
      formSchema.filter((field) => {
        if (!field.showIf) return true;
        const selectedValue = answers[field.showIf.field] || "";
        return field.showIf.value.includes(selectedValue);
      }),
    [answers, formSchema],
  );

  const sections = groupPackageFormSchemaBySection(visibleFields);

  const handleValueChange = (fieldId: string, nextValue: string) => {
    setAnswers((prev) => ({
      ...prev,
      [fieldId]: nextValue,
    }));
  };

  return (
    <Card className="overflow-hidden rounded-[2rem] border-indigo-100 bg-white/80 shadow-xl shadow-indigo-500/10 backdrop-blur-2xl">
      <CardHeader className="border-b border-indigo-50 bg-gradient-to-r from-indigo-50 to-white">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-indigo-100 p-2 text-indigo-600">
            <ClipboardList className="h-5 w-5" />
          </div>
          <div>
            <CardTitle className="text-xl text-indigo-950">Brief do przygotowania</CardTitle>
            <CardDescription>Im bardziej szczegolowe odpowiedzi, tym szybsza realizacja.</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6 p-6 md:p-8">
        {sections.map((section, sectionIdx) => (
          <section key={`${section.title}-${sectionIdx}`} className="rounded-[1.5rem] border border-slate-100 bg-slate-50/70 p-5 md:p-6">
            <div className="mb-5 space-y-1">
              <h3 className="text-lg font-bold text-slate-900">{section.title}</h3>
              <p className="text-sm text-slate-500">Wypelnij wszystkie wymagane pola, aby student mogl od razu ruszyc.</p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              {section.questions.map((field) => (
                <DynamicField
                  key={field.id}
                  field={field}
                  value={answers[field.id] || ""}
                  onValueChange={handleValueChange}
                />
              ))}
            </div>
          </section>
        ))}
      </CardContent>
    </Card>
  );
}

function VariantSummary({
  selectedVariant,
  gradient,
}: {
  selectedVariant: PackageVariant;
  gradient: string;
}) {
  return (
    <Card className="overflow-hidden rounded-[2rem] border-indigo-100 bg-white/80 shadow-xl shadow-indigo-500/10 backdrop-blur-2xl">
      <CardHeader className="border-b border-indigo-50 bg-gradient-to-r from-indigo-50 to-white">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-indigo-100 p-2 text-indigo-600">
            <Package2 className="h-5 w-5" />
          </div>
          <div>
            <CardTitle className="text-xl text-indigo-950">Wybrany wariant</CardTitle>
            <CardDescription>Brief zapisze sie dla wybranego wariantu.</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="grid gap-4 p-6 md:grid-cols-3 md:p-8">
        <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Wariant</p>
          <div className="mt-3 flex items-center gap-3">
            <Badge className={`border-0 bg-gradient-to-r ${gradient} px-3 py-1.5 text-white`}>{selectedVariant.name}</Badge>
            <span className="font-bold text-slate-900">{selectedVariant.label}</span>
          </div>
        </div>
        <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Cena</p>
          <p className="mt-3 text-2xl font-extrabold text-slate-900">{selectedVariant.price} PLN</p>
        </div>
        <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Realizacja</p>
          <p className="mt-3 flex items-center gap-2 text-lg font-bold text-slate-900">
            <Clock3 className="h-4 w-4 text-slate-400" />
            {selectedVariant.delivery_time_days ? `${selectedVariant.delivery_time_days} dni` : "wg pakietu"}
          </p>
        </div>
        {selectedVariant.scope ? (
          <div className="rounded-2xl border border-indigo-100 bg-indigo-50/70 px-5 py-4 text-sm font-medium leading-7 text-indigo-950 md:col-span-3">
            {selectedVariant.scope}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

function LegacySection({
  title,
  description,
  icon,
  tone,
  children,
}: {
  title: string;
  description: string;
  icon: ReactNode;
  tone: string;
  children: ReactNode;
}) {
  return (
    <Card className={`overflow-hidden rounded-[2rem] bg-white/80 shadow-xl backdrop-blur-2xl ${tone}`}>
      <CardHeader className="border-b bg-gradient-to-r from-white to-white/60">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-white/80 p-2">{icon}</div>
          <div>
            <CardTitle className="text-xl text-slate-950">{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6 p-6 md:p-8">{children}</CardContent>
    </Card>
  );
}

export default function CustomizePackageForm({
  packageId,
  packageTitle,
  packageCategory,
  initialData = {},
  offerId,
  gradient = "from-indigo-600 to-purple-600",
  formSchema = [],
  selectedVariant = null,
}: Props) {
  const [isPending, startTransition] = useTransition();

  const title = packageTitle.toLowerCase();
  const category = packageCategory.toLowerCase();
  const useDynamicBrief = formSchema.length > 0;
  const isVideo = title.includes("wideo") || title.includes("video") || title.includes("rolk") || title.includes("film") || category.includes("video");
  const isLogo = title.includes("logo") || title.includes("grafik") || title.includes("identyfikacja") || category.includes("design");
  const isMarketing = title.includes("marketing") || title.includes("kampania") || title.includes("ads") || category.includes("marketing");
  const isAutomation = title.includes("auto") || title.includes("skrzynk") || category.includes("it");
  const showStudentSelectionMode = packageId === LOGO_PACKAGE_ID && !offerId;

  const targetGroups = [
    "Mlodziez (Gen Z)",
    "Dorosli (25-45 lat)",
    "Seniorzy",
    "Klienci Biznesowi (B2B)",
    "Klienci Indywidualni (B2C)",
    "Inna",
  ];

  const handleSubmit = (formData: FormData) => {
    startTransition(async () => {
      try {
        if (offerId) {
          await updateCustomizedOffer(offerId, formData);
        } else {
          await createCustomizedOffer(packageId, formData);
        }
      } catch (error: any) {
        if (error.message === "NEXT_REDIRECT" || error.message?.includes("NEXT_REDIRECT")) return;
        alert("Blad: " + (error.message || "Wystapil nieznany blad."));
      }
    });
  };

  return (
    <form action={handleSubmit} className="animate-in fade-in space-y-8 duration-700">
      {selectedVariant ? <input type="hidden" name="variantName" value={selectedVariant.name} /> : null}
      {selectedVariant ? <VariantSummary selectedVariant={selectedVariant} gradient={gradient} /> : null}

      {showStudentSelectionMode ? (
        <Card className="overflow-hidden rounded-[2rem] border-indigo-100 bg-white/80 shadow-xl shadow-indigo-500/10 backdrop-blur-2xl">
          <CardHeader className="border-b border-indigo-50 bg-gradient-to-r from-indigo-50 to-white">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-indigo-100 p-2 text-indigo-600">
                <Zap className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-xl text-indigo-950">Jak chcesz wybrac studenta?</CardTitle>
                <CardDescription>Domyslnie mozesz samodzielnie wybrac styl i portfolio wykonawcy.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 p-6 md:p-8">
            <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4">
              <input
                type="radio"
                name="studentSelectionMode"
                value="company_choice"
                defaultChecked
                className="mt-1 h-4 w-4 border-slate-300 text-indigo-600"
              />
              <span className="space-y-1">
                <span className="block font-bold text-slate-900">Wybieram studenta sam</span>
                <span className="block text-sm text-slate-600">
                  Po zapisaniu briefu zobaczysz liste studentow z portfolio i wybierzesz wykonawce.
                </span>
              </span>
            </label>

            <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4">
              <input
                type="radio"
                name="studentSelectionMode"
                value="auto_assign"
                className="mt-1 h-4 w-4 border-slate-300 text-indigo-600"
              />
              <span className="space-y-1">
                <span className="block font-bold text-slate-900">Przydziel automatycznie</span>
                <span className="block text-sm text-slate-600">
                  Platforma przypisze pierwszego dostepnego studenta z kategorii Design.
                </span>
              </span>
            </label>
          </CardContent>
        </Card>
      ) : null}

      {useDynamicBrief ? <DynamicBriefSection formSchema={formSchema} initialData={initialData} /> : null}

      {!useDynamicBrief && isVideo ? (
        <LegacySection
          title="Scenariusz wideo"
          description="Krotki brief pod montaz i format materialu."
          icon={<Zap className="h-5 w-5 text-indigo-600" />}
          tone="border-indigo-100 shadow-indigo-500/10"
        >
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-3">
              <Label htmlFor="videoGoal">Cel wideo</Label>
              <Input id="videoGoal" name="videoGoal" defaultValue={initialData.videoGoal} className="h-11 border-slate-200 bg-white" />
            </div>
            <div className="space-y-3">
              <Label htmlFor="targetGroup">Grupa docelowa</Label>
              <Select name="targetGroup" defaultValue={initialData.targetGroup || ""}>
                <SelectTrigger className="h-11 border-slate-200 bg-white">
                  <SelectValue placeholder="Wybierz grupe..." />
                </SelectTrigger>
                <SelectContent>
                  {targetGroups.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </LegacySection>
      ) : null}

      {!useDynamicBrief && isLogo ? (
        <LegacySection
          title="Wizja graficzna"
          description="Podstawy potrzebne do przygotowania projektu."
          icon={<Zap className="h-5 w-5 text-violet-600" />}
          tone="border-violet-100 shadow-violet-500/10"
        >
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-3">
              <Label htmlFor="brandName">Nazwa marki / firmy</Label>
              <Input id="brandName" name="brandName" defaultValue={initialData.brandName} className="h-11 border-slate-200 bg-white" />
            </div>
            <div className="space-y-3">
              <Label htmlFor="industry">Branza</Label>
              <Input id="industry" name="industry" defaultValue={initialData.industry} className="h-11 border-slate-200 bg-white" />
            </div>
          </div>
        </LegacySection>
      ) : null}

      {!useDynamicBrief && isMarketing ? (
        <LegacySection
          title="Cele kampanii"
          description="Brief pod materialy i oczekiwany efekt."
          icon={<Zap className="h-5 w-5 text-pink-600" />}
          tone="border-pink-100 shadow-pink-500/10"
        >
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-3">
              <Label htmlFor="campaignGoal">Cel kampanii</Label>
              <Input id="campaignGoal" name="campaignGoal" defaultValue={initialData.campaignGoal} className="h-11 border-slate-200 bg-white" />
            </div>
            <div className="space-y-3">
              <Label htmlFor="platforms">Platformy</Label>
              <Input id="platforms" name="platforms" defaultValue={initialData.platforms} className="h-11 border-slate-200 bg-white" />
            </div>
          </div>
        </LegacySection>
      ) : null}

      {!useDynamicBrief && isAutomation ? (
        <LegacySection
          title="Scenariusz automatyzacji"
          description="Opisz co dzieje sie recznie i jaki ma byc efekt."
          icon={<Zap className="h-5 w-5 text-blue-600" />}
          tone="border-blue-100 shadow-blue-500/10"
        >
          <div className="space-y-6">
            <div className="space-y-3">
              <Label htmlFor="processDesc">Obecny proces</Label>
              <Textarea id="processDesc" name="processDesc" defaultValue={initialData.processDesc} className="min-h-[110px] border-slate-200 bg-white" />
            </div>
            <div className="space-y-3">
              <Label htmlFor="expectedEffect">Oczekiwany efekt</Label>
              <Textarea id="expectedEffect" name="expectedEffect" defaultValue={initialData.expectedEffect} className="min-h-[110px] border-slate-200 bg-white" />
            </div>
          </div>
        </LegacySection>
      ) : null}

      <Card className="rounded-[2.5rem] border-white bg-white/80 shadow-2xl shadow-slate-200/50 backdrop-blur-2xl">
        <CardContent className="space-y-8 p-8 md:p-12">
          <div className="space-y-3">
            <Label htmlFor="notes" className="text-lg font-medium text-slate-700">
              Dodatkowe uwagi
            </Label>
            <Textarea
              id="notes"
              name="notes"
              defaultValue={initialData.notes}
              placeholder="Wszelkie inne informacje, ktore moga byc przydatne..."
              className="min-h-[120px] border-slate-200 bg-white text-base"
            />
          </div>

          <div className="grid gap-8 md:grid-cols-2">
            <div className="space-y-3">
              <Label htmlFor="deadline" className="font-medium text-slate-700">
                Preferowany termin (opcjonalnie)
              </Label>
              <Input
                id="deadline"
                name="deadline"
                type="date"
                defaultValue={initialData.deadline}
                className="h-11 border-slate-200 bg-white"
              />
              <p className="text-xs text-slate-400">Standardowy czas realizacji zalezy od pakietu.</p>
            </div>

            <div className="flex items-end justify-end">
              <Button
                type="submit"
                size="lg"
                disabled={isPending}
                className={`h-14 min-w-[220px] w-full rounded-xl bg-gradient-to-r ${gradient} text-lg font-bold text-white shadow-xl shadow-indigo-500/20 transition-all hover:-translate-y-1 hover:shadow-indigo-500/40 md:w-auto`}
              >
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Przetwarzanie...
                  </>
                ) : offerId ? (
                  <>
                    <Save className="mr-2 h-5 w-5" />
                    Zapisz zmiany
                  </>
                ) : (
                  <>
                    Zatwierdz i przejdz dalej
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
