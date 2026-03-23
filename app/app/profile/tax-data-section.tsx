"use client";

import { useState, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Shield, Eye, EyeOff, CalendarDays, CheckCircle2 } from "lucide-react";
import { saveStudentTaxData } from "./_actions";
import { toast } from "sonner";

interface TaxDataSectionProps {
  initialData: {
    tax_residence_pl: boolean | null;
    birth_date: string | null;
    pesel: string | null;
  };
}

export default function TaxDataSection({ initialData }: TaxDataSectionProps) {
  const [taxResidencePl, setTaxResidencePl] = useState(initialData.tax_residence_pl ?? true);
  const [birthDate, setBirthDate] = useState(initialData.birth_date ?? "");
  const [pesel, setPesel] = useState(initialData.pesel ?? "");
  const [showPesel, setShowPesel] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData();
    formData.set("tax_residence_pl", String(taxResidencePl));
    formData.set("birth_date", birthDate);
    formData.set("pesel", pesel);

    startTransition(async () => {
      try {
        await saveStudentTaxData(formData);
        toast.success("Dane podatkowe zapisane pomyślnie!");
      } catch (err: any) {
        toast.error("Błąd: " + (err?.message || "Nieznany błąd"));
      }
    });
  };

  // Mask PESEL for display (show only last 4 digits)
  const maskedPesel = pesel ? "•••••••" + pesel.slice(-4) : "";

  return (
    <Card className="rounded-[2rem] border-none shadow-xl shadow-slate-200/40 bg-white overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-emerald-50 to-white border-b border-emerald-100 py-6">
        <CardTitle className="flex items-center gap-3 text-lg font-black text-slate-800">
          <div className="p-2 bg-emerald-100 text-emerald-600 rounded-xl">
            <Shield className="w-5 h-5" />
          </div>
          Dane do Rozliczeń Podatkowych
        </CardTitle>
        <p className="text-sm text-slate-500 mt-1 ml-12">
          Wymagane do prawidłowego wystawiania umów i rozliczeń PIT.
        </p>
      </CardHeader>
      <CardContent className="p-8">
        <form onSubmit={handleSave} className="space-y-8">
          {/* Tax Residence */}
          <div className="space-y-3">
            <Label className="uppercase text-xs font-bold text-slate-400 tracking-wider block">
              Rezydencja Podatkowa
            </Label>
            <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-200/60">
              <Switch
                checked={taxResidencePl}
                onCheckedChange={setTaxResidencePl}
                className="data-[state=checked]:bg-emerald-500"
              />
              <div>
                <div className="font-semibold text-slate-700 text-sm">
                  {taxResidencePl ? "🇵🇱 Polska" : "🌍 Inna"}
                </div>
                <div className="text-xs text-slate-400">
                  {taxResidencePl
                    ? "Podlegam opodatkowaniu w Polsce."
                    : "Moja rezydencja podatkowa jest poza Polską."}
                </div>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-x-8 gap-y-6">
            {/* Birth Date */}
            <div className="space-y-2">
              <Label className="uppercase text-xs font-bold text-slate-400 tracking-wider flex items-center gap-2">
                <CalendarDays className="w-3.5 h-3.5" />
                Data Urodzenia
              </Label>
              <Input
                type="date"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                className="h-12 bg-slate-50 border-slate-200 focus:bg-white rounded-xl font-mono"
              />
            </div>

            {/* PESEL */}
            <div className="space-y-2">
              <Label className="uppercase text-xs font-bold text-slate-400 tracking-wider flex items-center gap-2">
                <Shield className="w-3.5 h-3.5" />
                Numer PESEL
              </Label>
              <div className="relative">
                <Input
                  type={showPesel ? "text" : "password"}
                  value={pesel}
                  onChange={(e) => setPesel(e.target.value.replace(/\D/g, "").slice(0, 11))}
                  className="h-12 bg-slate-50 border-slate-200 focus:bg-white rounded-xl font-mono pr-12"
                  placeholder="•••••••••••"
                  maxLength={11}
                />
                <button
                  type="button"
                  onClick={() => setShowPesel(!showPesel)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-600 transition-colors rounded-lg hover:bg-slate-100"
                >
                  {showPesel ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[10px] text-slate-400">
                Twój PESEL jest bezpieczny — wyświetlamy go w formie zamaskowanej.
              </p>
            </div>
          </div>

          {/* Save button */}
          <div className="flex justify-end pt-4 border-t border-slate-100">
            <Button
              type="submit"
              size="lg"
              disabled={isPending}
              className="px-8 h-12 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-400 hover:from-emerald-400 hover:to-emerald-300 text-white font-bold shadow-lg shadow-emerald-200/50 border border-emerald-400/30 transition-all duration-300 hover:-translate-y-0.5"
            >
              {isPending ? (
                "Zapisywanie..."
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Zapisz Dane Podatkowe
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
