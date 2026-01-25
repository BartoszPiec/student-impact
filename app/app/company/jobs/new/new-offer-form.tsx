

"use client";

import { useState } from "react";
import { createOffer } from "./_actions";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Briefcase, Zap, ArrowRight, ArrowLeft, CheckCircle2,
  LayoutTemplate, DollarSign, FileText, Globe, Code2, ShieldAlert, UploadCloud, Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

// Categories list
const CATEGORIES = [
  "Administracja biurowa", "Badania i rozwój", "Bankowość", "BHP / Ochrona środowiska",
  "Budownictwo", "Call Center", "Doradztwo / Konsulting", "Edukacja / Szkolenia",
  "Energetyka", "Finanse / Ekonomia", "Franczyza / Własny biznes", "Grafika & Design",
  "Hotelarstwo / Gastronomia / Turystyka", "Human Resources / Zasoby ludzkie",
  "Internet / e-Commerce / Nowe media", "Inżynieria", "IT - Administracja",
  "IT - Rozwój oprogramowania", "Kontrola jakości", "Łańcuch dostaw", "Marketing",
  "Media / Sztuka / Rozrywka", "Nieruchomości", "Obsługa klienta", "Praca fizyczna",
  "Prawo", "Produkcja", "Public Relations", "Reklama / Grafika / Kreacja / Fotografia",
  "Sektor publiczny", "Sprzedaż", "Transport / Spedycja / Logistyka", "Ubezpieczenia",
  "Zakupy", "Zdrowie / Uroda / Rekreacja", "Inne"
];

export default function NewOfferForm({ defaultType }: { defaultType?: "micro" | "job" | null }) {
  // Start at Step 2 if type is pre-selected, otherwise Step 1
  const [step, setStep] = useState(defaultType ? 2 : 1);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // File Upload State
  const [uploadedFileUrl, setUploadedFileUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      const supabase = createClient();
      const filename = `${Date.now()}-${file.name.replace(/\s/g, '_')}`;

      const { data, error } = await supabase.storage
        .from('offer_attachments')
        .upload(`${filename}`, file);

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('offer_attachments')
        .getPublicUrl(data.path);

      setUploadedFileUrl(publicUrl);
    } catch (err: any) {
      console.error(err);
      setError("Błąd przesyłania pliku: " + err.message);
    } finally {
      setIsUploading(false);
    }
  };

  // Form State
  const [formData, setFormData] = useState({
    typ: defaultType || "micro", // micro | job
    is_platform_service: false,
    tytul: "",
    kategoria: "IT - Rozwój oprogramowania",
    opis: "",
    technologies: "",
    stawka: "",
    salary_range_min: "",
    salary_range_max: "",
    contract_type: "B2B",
    location: "",
    is_remote: false,
    czas: "", // micro deadline / job duration
    obligations: "", // micro tasks list
    wymagania: "", // job requirements
    benefits: ""   // job benefits
  });

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const isJob = formData.typ === "job";

  const nextStep = () => {
    let isValid = true;
    let newError = null;

    // Step 2 Validation (Basic Info)
    if (step === 2) {
      if (!formData.tytul?.trim() || !formData.opis?.trim()) {
        newError = "Uzupełnij tytuł i opis główny (oznaczone gwiazdką).";
        isValid = false;
      }
    }

    // Step 3 Validation (Details)
    if (step === 3) {
      if (isJob) {
        // Job validation if needed
      } else {
        // Micro Validation
        if (!formData.stawka || Number(formData.stawka) <= 0) {
          newError = "Podaj poprawny budżet zlecenia (Stawka).";
          isValid = false;
        }
      }
    }

    setError(newError);
    if (isValid) {
      setStep(p => Math.min(p + 1, 4));
    }
  };
  // If defaultType is set, prevent going back to step 1 (Type Selection)
  const prevStep = () => setStep(p => Math.max(p - 1, defaultType ? 2 : 1));

  // STEP 1: TYPE SELECTION (Only if no defaultType)
  const renderStep1 = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="text-center space-y-2 mb-8">
        <h2 className="text-2xl font-bold text-slate-900">Jaki rodzaj oferty chcesz dodać?</h2>
        <p className="text-slate-500">Wybierz format współpracy, który najlepiej pasuje do Twoich potrzeb.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div
          onClick={() => handleChange("typ", "micro")}
          className={cn(
            "cursor-pointer border-2 rounded-xl p-6 transition-all hover:border-indigo-300 hover:bg-indigo-50/50",
            formData.typ === "micro" ? "border-indigo-600 bg-indigo-50 ring-2 ring-indigo-200 ring-offset-2" : "border-slate-200"
          )}
        >
          <div className="h-12 w-12 bg-amber-100 rounded-lg flex items-center justify-center text-amber-600 mb-4">
            <Zap className="h-6 w-6" />
          </div>
          <h3 className="font-bold text-lg text-slate-900">Mikrozlecenie</h3>
          <p className="text-sm text-slate-500 mt-2">
            Krótkie zadanie z konkretnym efektem. Idealne do szybkich realizacji (np. logo, poprawki, artykuł).
          </p>
        </div>

        <div
          onClick={() => handleChange("typ", "job")}
          className={cn(
            "cursor-pointer border-2 rounded-xl p-6 transition-all hover:border-blue-300 hover:bg-blue-50/50",
            formData.typ === "job" ? "border-blue-600 bg-blue-50 ring-2 ring-blue-200 ring-offset-2" : "border-slate-200"
          )}
        >
          <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 mb-4">
            <Briefcase className="h-6 w-6" />
          </div>
          <h3 className="font-bold text-lg text-slate-900">Praca / Staż</h3>
          <p className="text-sm text-slate-500 mt-2">
            Dłuższa współpraca, rekrutacja na stanowisko lub płatny staż.
          </p>
        </div>
      </div>
    </div>
  );



  // STEP 3: DETAILS
  const renderStep3 = () => (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
      {isJob ? (
        // JOB SPECIFIC
        <div className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="font-semibold text-slate-700">Lokalizacja</Label>
              <div className="relative">
                <Globe className="absolute left-4 top-4 h-5 w-5 text-slate-400" />
                <Input className="pl-12 h-12 rounded-xl border-slate-200" value={formData.location} onChange={e => handleChange("location", e.target.value)} placeholder="Warszawa / Remote" />
              </div>
            </div>
            <div className="flex items-center space-x-3 pt-9 px-2">
              <Checkbox id="remote" className="w-5 h-5 rounded-md border-slate-300" checked={formData.is_remote} onCheckedChange={c => handleChange("is_remote", c === true)} />
              <Label htmlFor="remote" className="text-base font-medium text-slate-700 cursor-pointer">Praca Zdalna</Label>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label className="font-semibold text-slate-700">Min. Wynagrodzenie</Label>
              <Input className="h-12 rounded-xl border-slate-200" type="number" value={formData.salary_range_min} onChange={e => handleChange("salary_range_min", e.target.value)} placeholder="3000" />
            </div>
            <div className="space-y-2">
              <Label className="font-semibold text-slate-700">Max. Wynagrodzenie</Label>
              <Input className="h-12 rounded-xl border-slate-200" type="number" value={formData.salary_range_max} onChange={e => handleChange("salary_range_max", e.target.value)} placeholder="5000" />
            </div>
            <div className="space-y-2">
              <Label className="font-semibold text-slate-700">Rodzaj umowy</Label>
              <select
                className="flex h-12 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus-visible:ring-4 focus-visible:ring-indigo-500/10 focus-visible:border-indigo-500"
                value={formData.contract_type}
                onChange={e => handleChange("contract_type", e.target.value)}
              >
                <option value="B2B">B2B</option>
                <option value="UoP">Umowa o Pracę</option>
                <option value="UZ">Umowa Zlecenie</option>
                <option value="Staż">Staż / Praktyka</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="font-semibold text-slate-700">Wymagania (Lista)</Label>
            <Textarea className="min-h-[120px] rounded-xl border-slate-200 p-4" placeholder="- Doświadczenie..." value={formData.wymagania} onChange={e => handleChange("wymagania", e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label className="font-semibold text-slate-700">Oferujemy / Benefity</Label>
            <Textarea className="min-h-[120px] rounded-xl border-slate-200 p-4" placeholder="- Owocowe czwartki..." value={formData.benefits} onChange={e => handleChange("benefits", e.target.value)} />
          </div>
        </div>
      ) : (
        // MICRO SPECIFIC
        <div className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="font-semibold text-slate-700">Budżet (Stawka za całość) <span className="text-red-500">*</span></Label>
              <div className="relative">
                <DollarSign className="absolute left-4 top-3.5 h-5 w-5 text-slate-400" />
                <Input type="number" className="pl-12 h-12 rounded-xl border-slate-200 font-bold text-slate-800" value={formData.stawka} onChange={e => handleChange("stawka", e.target.value)} placeholder="500" />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="font-semibold text-slate-700">Czas realizacji (Deadline)</Label>
              <Input className="h-12 rounded-xl border-slate-200" value={formData.czas} onChange={e => handleChange("czas", e.target.value)} placeholder="np. 7 dni" />
            </div>
          </div>

          <div className="p-6 bg-amber-50 border border-amber-100 rounded-2xl">
            <div className="flex items-center gap-2 text-amber-800 font-bold mb-3 text-lg">
              <ShieldAlert className="h-6 w-6" />
              Materiały do zlecenia
            </div>
            <p className="text-sm text-amber-700/80 mb-6 leading-relaxed">
              Materiały będą widoczne dla studenta <strong>dopiero po akceptacji</strong> jego zgłoszenia.
              Możesz wkleić link lub wgrać plik.
            </p>

            <Input
              placeholder="Link do materiałów (Google Drive, Dropbox...)"
              value={formData.obligations}
              onChange={e => handleChange("obligations", e.target.value)}
              className="bg-white mb-4 h-12 rounded-xl border-amber-200 focus:border-amber-400 focus:ring-amber-400/20"
            />

            <div className="flex items-center gap-4">
              <Label htmlFor="file-upload" className="cursor-pointer inline-flex items-center gap-2 bg-white border border-amber-200 px-6 py-3 rounded-xl hover:bg-amber-100 transition-colors text-sm font-semibold text-amber-800 shadow-sm">
                {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-5 w-5" />}
                {isUploading ? "Przesyłanie..." : "Wgraj plik"}
              </Label>
              <Input
                id="file-upload"
                type="file"
                className="hidden"
                onChange={handleFileUpload}
                disabled={isUploading}
              />
              {uploadedFileUrl && (
                <div className="text-sm text-green-600 font-extrabold flex items-center gap-2 animate-in fade-in slide-in-from-left-2 bg-white px-3 py-1.5 rounded-lg border border-green-100 shadow-sm">
                  <CheckCircle2 className="h-4 w-4" /> Plik wgrany!
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // STEP 4: SUMMARY
  const renderStep4 = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="bg-white p-8 rounded-[1.5rem] border border-slate-100 shadow-sm space-y-6">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-bold text-2xl text-slate-900 leading-tight">{formData.tytul || "(Brak tytułu)"}</h3>
            <div className="flex gap-2 text-sm text-slate-500 mt-2 font-medium">
              <Badge variant="outline" className="text-slate-500 border-slate-200">{formData.typ === "job" ? "PRACA / STAŻ" : "MIKROZLECENIE"}</Badge>
              <Badge variant="outline" className="text-indigo-600 border-indigo-100 bg-indigo-50">{formData.kategoria}</Badge>
            </div>
          </div>
          <div className="text-right">
            <div className="font-extrabold text-2xl text-emerald-600 bg-emerald-50 px-4 py-1 rounded-lg inline-block">
              {isJob
                ? `${formData.salary_range_min || 0} - ${formData.salary_range_max || 0} PLN`
                : `${formData.stawka || 0} PLN`
              }
            </div>
            <div className="text-xs text-slate-400 font-medium mt-1">
              {isJob ? "miesięcznie" : "za całość"}
            </div>
          </div>
        </div>

        <div className="h-px bg-slate-100" />

        <div className="text-base text-slate-600 whitespace-pre-line leading-relaxed">
          {formData.opis || "(Brak opisu)"}
        </div>

        {(formData.is_platform_service) && (
          <div className="mt-4 bg-amber-50 p-4 rounded-xl border border-amber-100 text-amber-800 text-sm font-medium flex items-center gap-3">
            <Zap className="h-5 w-5 text-amber-500" />
            <span>Zlecenie Systemowe z Blokadą Materiałów</span>
          </div>
        )}
      </div>

    </div>
  );

  // SUBMIT HANDLER
  const handleSubmit = async () => {
    setIsLoading(true);
    setError(null);

    // Convert state to FormData for the server action
    const fd = new FormData();
    Object.entries(formData).forEach(([key, val]) => {
      // Handle boolean
      if (typeof val === "boolean") {
        if (val) fd.append(key, "on");
      } else {
        fd.append(key, String(val));
      }
    });

    if (uploadedFileUrl) {
      // Append to obligations (used as locked content)
      const currentObligations = fd.get("obligations") || "";
      fd.set("obligations", currentObligations + `\n\n[ZAŁĄCZONY PLIK]: ${uploadedFileUrl}`);
    }

    try {
      await createOffer(fd);
    } catch (e: any) {
      setError(e.message);
      setIsLoading(false);
    }
  };

  // STEP Names
  const STEP_NAMES = ["Rodzaj", "Informacje", "Szczegóły", "Podsumowanie"];

  return (
    <div className="max-w-4xl mx-auto">
      {/* STEPS INDICATOR */}
      <div className="mb-12 px-4">
        <div className="flex items-center justify-between relative">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-slate-100 -z-10 rounded-full" />
          <div className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-indigo-600 -z-10 rounded-full transition-all duration-500" style={{ width: `${((step - 1) / 3) * 100}%` }} />

          {[1, 2, 3, 4].map((s, i) => (
            <div key={s} className="flex flex-col items-center gap-3 bg-white px-2">
              <div className={cn(
                "w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-base transition-all border-4 shadow-sm",
                step >= s
                  ? "border-indigo-600 bg-indigo-600 text-white shadow-indigo-200 shadow-lg scale-110"
                  : "border-slate-100 bg-white text-slate-300"
              )}>
                {step > s ? <CheckCircle2 className="h-6 w-6" /> : s}
              </div>
              <span className={cn(
                "text-xs font-bold uppercase tracking-wider",
                step >= s ? "text-indigo-600" : "text-slate-300"
              )}>
                {STEP_NAMES[i]}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="min-h-[400px] flex flex-col">
        {error && (
          <div className="w-full bg-red-50 border border-red-100 rounded-xl p-4 mb-6 animate-in slide-in-from-top-2 flex items-center gap-3 text-red-800">
            <ShieldAlert className="h-5 w-5 shrink-0 text-red-600" />
            <span className="font-semibold">{error}</span>
          </div>
        )}

        <div className="flex-1 space-y-8">
          {step === 1 && !defaultType && renderStep1()}

          {step === 2 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-base font-semibold text-slate-700">Tytuł ogłoszenia <span className="text-red-500">*</span></Label>
                  <Input
                    value={formData.tytul}
                    onChange={e => handleChange("tytul", e.target.value)}
                    placeholder={isJob ? "np. Junior React Developer" : "np. Wykonanie prostej grafiki"}
                    className="h-14 text-lg rounded-xl border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all font-medium"
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="font-semibold text-slate-700">Kategoria</Label>
                    <select
                      className="flex h-12 w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-500/10 focus-visible:border-indigo-500 disabled:cursor-not-allowed disabled:opacity-50 transition-all"
                      value={formData.kategoria}
                      onChange={e => handleChange("kategoria", e.target.value)}
                    >
                      {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label className="font-semibold text-slate-700">Technologie (po przecinku)</Label>
                    <Input
                      value={formData.technologies}
                      onChange={e => handleChange("technologies", e.target.value)}
                      placeholder="React, TypeScript, Figma"
                      className="h-12 rounded-xl border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="font-semibold text-slate-700">Opis główny <span className="text-red-500">*</span></Label>
                  <Textarea
                    value={formData.opis}
                    onChange={e => handleChange("opis", e.target.value)}
                    placeholder="Opisz co jest treścią tego zlecenia."
                    className="min-h-[200px] rounded-xl border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all text-base leading-relaxed p-4"
                  />
                </div>
              </div>
            </div>
          )}

          {step === 3 && renderStep3()}
          {step === 4 && renderStep4()}
        </div>

        <div className="border-t border-slate-100 pt-8 mt-8 flex justify-between items-center bg-white">
          <Button
            variant="ghost"
            onClick={prevStep}
            disabled={step === (defaultType ? 2 : 1) || isLoading}
            className="h-12 px-6 rounded-xl hover:bg-slate-50 text-slate-600 font-medium"
          >
            <ArrowLeft className="mr-2 h-5 w-5" /> Wstecz
          </Button>

          {step < 4 ? (
            <Button onClick={nextStep} className="h-12 px-8 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-lg shadow-indigo-200 transition-all hover:-translate-y-0.5">
              Dalej <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={isLoading}
              className="h-14 px-8 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white font-bold shadow-lg shadow-emerald-200 hover:shadow-xl transition-all hover:-translate-y-0.5 text-lg"
            >
              {isLoading ? "Publikowanie..." : (
                <>Publikuj Ofertę <FileText className="ml-2 h-5 w-5" /></>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
