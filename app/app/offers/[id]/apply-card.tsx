"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { applyToOffer } from "./_actions";
import { Loader2, CheckCircle2, AlertCircle, Banknote, UploadCloud, FileText, X, Zap, ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/browser";
import { ApplySheet } from "@/app/app/jobs/apply-sheet";
import { JobOffer } from "@/app/app/jobs/job-card";
import { cn } from "@/lib/utils";

export default function ApplyCard({
  offerId,
  offerStawka,
  offerTyp,
  formattedSalary,
  className,
  isPlatformService,
  offerTitle,
  obligations,
  offerDescription
}: {
  offerId: string;
  offerStawka?: number | null;
  offerTyp?: string;
  formattedSalary?: string;
  className?: string; // Added className
  isPlatformService?: boolean;
  offerTitle?: string;
  obligations?: string;
  offerDescription?: string;
}) {
  const [message, setMessage] = useState("");
  const [negotiating, setNegotiating] = useState(false);
  const [cvFile, setCvFile] = useState<File | null>(null);

  // Logic: Disable negotiation if it's a standard Job or Internship
  const isJobOrInternship = offerTyp && (offerTyp.toLowerCase().includes("job") || offerTyp.toLowerCase().includes("praca") || offerTyp.toLowerCase().includes("staż"));
  const canNegotiate = !isJobOrInternship && !isPlatformService;

  // Platform Service Logic
  const [agreed, setAgreed] = useState(false);

  if (isPlatformService) {
    // Mock JobOffer object for ApplySheet
    const mockOffer: JobOffer = {
      id: offerId,
      tytul: offerTitle || "Zlecenie",
      typ: offerTyp || "Mikrozlecenie",
      company_id: "", // Not needed for sheet
      created_at: new Date().toISOString(),
      obligations: obligations,
      opis: offerDescription,
      is_platform_service: true
    };

    return (
      <Card className={`border-amber-200 shadow-md ${className || ""}`}>
        <CardHeader className="bg-amber-50/50 pb-4 border-b border-amber-100">
          <CardTitle className="text-xl text-amber-900 flex items-center gap-2">
            <Zap className="h-5 w-5 text-amber-500" />
            Przyjmij to zlecenie
          </CardTitle>
          <CardDescription className="text-amber-800/80">
            To jest zlecenie systemowe. Stawka jest stała i nienegocjowalna.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          <div className="bg-white p-4 rounded-lg border border-amber-100 space-y-2">
            <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Gwarantowane Wynagrodzenie</Label>
            <div className="text-2xl font-bold text-slate-900">
              {formattedSalary ? formattedSalary : (offerStawka != null ? `${offerStawka} PLN` : "Stawka niepodana")}
            </div>
            <p className="text-xs text-slate-500">Stawka netto za wykonanie całości zlecenia.</p>
          </div>
        </CardContent>
        <CardFooter className="bg-amber-50/50 py-4 border-t border-amber-100 flex justify-end">
          <ApplySheet offer={mockOffer}>
            <Button
              className="w-full bg-amber-600 hover:bg-amber-700 text-white font-semibold shadow-sm"
            >
              Przyjmij to zlecenie
            </Button>
          </ApplySheet>
        </CardFooter>
      </Card>
    );
  }

  // --- STANADARD JOB APPLICATION LOGIC BELOW ---

  // gdy user kliknie "Negocjuj", startujemy od stawki z oferty (jeśli jest)
  const initialRate = useMemo(
    () => (offerStawka != null ? String(offerStawka) : ""),
    [offerStawka]
  );

  const [rate, setRate] = useState(initialRate);

  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function parseRate(v: string): number | null {
    const s = v.trim();
    if (!s) return null;
    const n = Number(s);
    if (!Number.isFinite(n) || n < 0) return null;
    return n;
  }

  // File Upload Helper
  const uploadCv = async (file: File): Promise<string> => {
    const supabase = createClient();
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError, data } = await supabase.storage
      .from('cvs')
      .upload(filePath, file);

    if (uploadError) {
      throw new Error(`Błąd przesyłania CV: ${uploadError.message}`);
    }

    // Get Public URL
    const { data: { publicUrl } } = supabase.storage
      .from('cvs')
      .getPublicUrl(filePath);

    return publicUrl;
  };

  const router = useRouter();

  const handleSubmit = () => {
    startTransition(async () => {
      setErr(null);
      setOk(null);

      try {
        let proposed: number | null = null;
        let cvUrl: string | null = null;

        // 1. Validate Negotiation
        if (negotiating) {
          proposed = parseRate(rate);
          if (proposed == null) {
            setErr("Podaj poprawną proponowaną stawkę (liczba ≥ 0).");
            return;
          }
        } else {
          proposed = null;
        }

        // 2. Upload CV if present
        if (cvFile) {
          try {
            cvUrl = await uploadCv(cvFile);
          } catch (uploadErr: any) {
            setErr(uploadErr.message);
            return;
          }
        }

        // 3. Submit Application
        const result = await applyToOffer(offerId, message.trim(), proposed, cvUrl);

        if (result?.error) throw new Error(result.error);
        if (result?.redirectUrl) {
          router.push(result.redirectUrl);
          return;
        }

        setOk("Twoja aplikacja została wysłana! 🚀");
        setMessage("");
        setCvFile(null);
      } catch (e: any) {
        setErr(e?.message ?? "Wystąpił błąd podczas wysyłania aplikacji.");
      }
    });
  };

  if (ok) {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardContent className="pt-6 flex flex-col items-center text-center space-y-4">
          <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center text-green-600">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <div>
            <h3 className="font-semibold text-green-900 text-lg">Aplikacja wysłana!</h3>
            <p className="text-green-700">Firma otrzymała Twoje zgłoszenie. Powodzenia!</p>
          </div>
          <Button variant="outline" className="border-green-200 text-green-700 hover:bg-green-100" onClick={() => setOk(null)}>
            Wyślij kolejne zgłoszenie (test)
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn(
      "border-none rounded-[2.5rem] overflow-hidden shadow-2xl bg-white ring-1 ring-slate-100",
      className
    )}>
      <CardHeader className="bg-slate-50/50 p-8 md:p-10 border-b border-slate-100">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Szybki proces</span>
        </div>
        <CardTitle className="text-2xl font-black text-slate-900 leading-none">Aplikuj teraz</CardTitle>
        <CardDescription className="text-slate-500 font-medium">
          Prześlij zgłoszenie bezpośrednio do rekrutera.
        </CardDescription>
      </CardHeader>

      <CardContent className="p-8 md:p-10 space-y-10">
        {/* WARUNKI FINANSOWE */}
        <div className="bg-slate-50 p-8 rounded-[2rem] border border-slate-100 space-y-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl -mr-16 -mt-16 group-hover:bg-indigo-500/10 transition-colors" />

          <div className="flex flex-col gap-1 relative z-10">
            <Label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Wynagrodzenie</Label>
            <div className="text-4xl font-black text-slate-900 tabular-nums">
              {formattedSalary ? formattedSalary : (offerStawka != null ? `${offerStawka} PLN` : "Stawka niepodana")}
            </div>
            {!negotiating && (
              <p className="text-xs font-bold text-indigo-500 uppercase tracking-widest mt-1">
                {canNegotiate ? "Możliwość negocjacji" : "Stawka sztywna"}
              </p>
            )}
          </div>

          {canNegotiate && (
            <div className="flex items-center space-x-3 pt-4 border-t border-slate-200 mt-2 relative z-10">
              <Checkbox
                id="negotiate"
                checked={negotiating}
                onCheckedChange={(checked) => {
                  setErr(null);
                  const isChecked = checked === true;
                  setNegotiating(isChecked);
                  if (isChecked && offerStawka != null) setRate(String(offerStawka));
                }}
                className="rounded-md border-slate-300"
              />
              <Label htmlFor="negotiate" className="cursor-pointer text-sm font-bold text-slate-600 hover:text-indigo-600 transition-colors">
                Chcę zaproponować inną stawkę
              </Label>
            </div>
          )}

          {negotiating && canNegotiate && (
            <div className="animate-in fade-in zoom-in-95 duration-300 pt-4 space-y-3 relative z-10">
              <Label htmlFor="rate" className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Twoja oferta (PLN)</Label>
              <div className="relative">
                <Input
                  id="rate"
                  value={rate}
                  onChange={(e) => setRate(e.target.value)}
                  placeholder="np. 4500"
                  inputMode="numeric"
                  className="pl-4 font-black text-2xl h-16 bg-white border-2 border-indigo-100 rounded-2xl focus-visible:ring-indigo-500 focus-visible:border-indigo-500 shadow-inner"
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 font-black text-slate-300">PLN</div>
              </div>
            </div>
          )}
        </div>

        {/* CV UPLOAD */}
        {isJobOrInternship && (
          <div className="space-y-4">
            <Label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Twoje CV (opcjonalnie)</Label>
            {!cvFile ? (
              <div className="group relative border-2 border-dashed border-slate-200 rounded-[2rem] p-10 hover:border-indigo-300 hover:bg-indigo-50/30 transition-all text-center cursor-pointer">
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  onChange={(e) => {
                    if (e.target.files?.[0]) setCvFile(e.target.files[0]);
                  }}
                />
                <div className="flex flex-col items-center gap-4 text-slate-400 group-hover:text-indigo-500 transition-colors">
                  <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center border border-slate-100 group-hover:bg-white group-hover:scale-110 group-hover:rotate-3 transition-all">
                    <UploadCloud className="h-8 w-8" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-black uppercase tracking-widest">Kliknij aby wgrać</p>
                    <p className="text-xs font-medium opacity-60">PDF lub DOCX (max 5MB)</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between p-5 bg-white border border-indigo-100 rounded-[1.5rem] shadow-lg shadow-indigo-500/5 animate-in zoom-in-95">
                <div className="flex items-center gap-4 overflow-hidden">
                  <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
                    <FileText className="h-6 w-6" />
                  </div>
                  <div className="truncate">
                    <p className="text-sm font-bold text-slate-900 truncate">{cvFile.name}</p>
                    <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">{(cvFile.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" className="h-10 w-10 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors" onClick={() => setCvFile(null)}>
                  <X className="h-5 w-5" />
                </Button>
              </div>
            )}
          </div>
        )}

        {/* WIADOMOŚĆ */}
        {!isPlatformService && (
          <div className="space-y-4">
            <Label htmlFor="message" className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Wiadomość (opcjonalnie)</Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Cześć! Chcę wziąć udział w tym projekcie..."
              className="min-h-[140px] resize-none rounded-[1.5rem] bg-slate-50 border-slate-100 p-6 focus:bg-white focus:border-indigo-200 transition-all font-medium text-slate-700"
            />
          </div>
        )}

        {/* BŁĘDY */}
        {err && (
          <Alert variant="destructive" className="rounded-2xl border-red-100 bg-red-50 text-red-900 shadow-lg shadow-red-500/5 animate-in shake-1">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <div>
              <AlertTitle className="font-black uppercase tracking-widest text-[10px] mb-1">Błąd aplikacji</AlertTitle>
              <AlertDescription className="font-medium">{err}</AlertDescription>
            </div>
          </Alert>
        )}
      </CardContent>

      <CardFooter className="p-8 md:p-10 pt-0 flex flex-col gap-4">
        <Button
          size="lg"
          className="w-full h-16 rounded-[1.5rem] gradient-primary text-white text-lg font-black shadow-2xl shadow-indigo-500/20 hover:scale-[1.02] active:scale-95 transition-all group"
          disabled={isPending}
          onClick={handleSubmit}
        >
          {isPending ? (
            <>
              <Loader2 className="mr-3 h-5 w-5 animate-spin" /> PRZETWARZANIE...
            </>
          ) : (
            <span className="flex items-center gap-2">
              WYŚLIJ APLIKACJĘ <ArrowLeft className="h-5 w-5 rotate-180 transition-transform group-hover:translate-x-1" />
            </span>
          )}
        </Button>
        <p className="text-[10px] text-center text-slate-400 font-bold uppercase tracking-widest px-8">
          Klikając przycisk akceptujesz regulamin platformy oraz warunki współpracy.
        </p>
      </CardFooter>
    </Card>
  );
}
