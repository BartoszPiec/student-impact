"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { fetchCeidgData, saveOnboardingProfile } from "./_actions";
import {
  Sparkles,
  ArrowRight,
  Building,
  User as UserIcon,
  Briefcase,
  GraduationCap,
  MapPin,
  Search,
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

type OnboardingInitialData = {
  companyName?: string | null;
  nip?: string | null;
  address?: string | null;
  city?: string | null;
  publicName?: string | null;
  kierunek?: string | null;
  rok?: number | null;
  bio?: string | null;
};

export default function OnboardingClient({
  role,
  initialData,
}: {
  role: "student" | "company";
  initialData: OnboardingInitialData;
}) {
  const [saving, setSaving] = useState(false);
  const [fetchingCompanyData, setFetchingCompanyData] = useState(false);
  const [formMessage, setFormMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);

  const [nip, setNip] = useState(initialData.nip ?? "");
  const [companyName, setCompanyName] = useState(initialData.companyName ?? "");
  const [address, setAddress] = useState(initialData.address ?? "");
  const [city, setCity] = useState(initialData.city ?? "");

  const [publicName, setPublicName] = useState(initialData.publicName ?? "");
  const [kierunek, setKierunek] = useState(initialData.kierunek ?? "");
  const [rok, setRok] = useState(initialData.rok ? String(initialData.rok) : "");
  const [bio, setBio] = useState(initialData.bio ?? "");

  const fetchGusData = async () => {
    if (!nip) return;

    setFetchingCompanyData(true);
    setFormMessage(null);

    try {
      const res = await fetchCeidgData(nip);

      if (res.error) {
        setFormMessage({ type: "error", text: res.error });
        return;
      }

      if (res.data) {
        setCompanyName(res.data.name || "");

        if (res.data.address) {
          setCity(res.data.address.city || "");
          setAddress(res.data.address.street || "");
        }

        setFormMessage({ type: "success", text: "Dane firmy zostały uzupełnione." });
      }
    } catch {
      setFormMessage({ type: "error", text: "Nie udało się pobrać danych firmy." });
    } finally {
      setFetchingCompanyData(false);
    }
  };

  const overrideNip = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/g, "");
    setNip(value);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFormMessage(null);

    try {
      if (role === "company") {
        const result = await saveOnboardingProfile({ role, companyName, nip, address, city });
        if (!result.success) throw new Error(result.error);
      } else {
        const result = await saveOnboardingProfile({ role, publicName, kierunek, rok, bio });
        if (!result.success) throw new Error(result.error);
      }

      const startPath = role === "company" ? "/app/company/packages" : "/app/jobs";
      window.location.replace(startPath);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Nieznany błąd.";
      setFormMessage({ type: "error", text: `Nie udało się zapisać zmian. ${message}` });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 relative overflow-hidden bg-slate-900">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.18),transparent_55%)]" />
      <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-indigo-500/20 to-purple-500/0 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-2/3 h-2/3 bg-gradient-to-tl from-emerald-500/10 to-transparent rounded-full blur-[100px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-xl animate-in fade-in zoom-in-95 duration-500">
        <div className="text-center mb-8 space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-xl shadow-indigo-500/20 mb-4 text-white">
            <Sparkles className="w-6 h-6" />
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">Witaj w Student Impact!</h1>
          <p className="text-indigo-200/80 text-lg">
            Uzupełnij profil, abyśmy mogli dopasować najlepsze oferty.
          </p>
        </div>

        <Card className="border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl shadow-black/20 text-white overflow-hidden rounded-[2rem]">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-500" />
          <CardContent className="p-8">
            <form onSubmit={handleSave} className="space-y-6">
              {role === "company" ? (
                <div className="space-y-6">
                  <div className="p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex gap-4 items-start">
                    <div className="p-2 bg-indigo-500/20 rounded-lg text-indigo-300">
                      <Search className="h-5 w-5" />
                    </div>
                    <div className="space-y-2 flex-1">
                      <Label className="text-indigo-200">Pobierz dane z GUS (opcjonalnie)</Label>
                      <div className="flex gap-2">
                        <Input
                          placeholder="Wpisz NIP..."
                          value={nip}
                          onChange={overrideNip}
                          className="bg-black/20 border-white/10 text-white placeholder:text-white/30 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all rounded-xl"
                        />
                        <Button
                          type="button"
                          onClick={fetchGusData}
                          disabled={fetchingCompanyData}
                          className="bg-white/10 hover:bg-white/20 text-white border border-white/10 rounded-xl"
                        >
                          {fetchingCompanyData ? "Pobieranie..." : "Pobierz"}
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-white/80 font-medium ml-1">Nazwa firmy *</Label>
                    <div className="relative">
                      <Building className="absolute left-3 top-3 h-5 w-5 text-indigo-300/50" />
                      <Input
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        required
                        className="pl-10 bg-black/20 border-white/10 text-white placeholder:text-white/30 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl h-11"
                        placeholder="Pełna nazwa firmy"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-white/80 font-medium ml-1">Miasto</Label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-3 h-5 w-5 text-indigo-300/50" />
                        <Input
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          className="pl-10 bg-black/20 border-white/10 text-white focus:border-indigo-500 rounded-xl h-11"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-white/80 font-medium ml-1">Ulica i nr</Label>
                      <Input
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        className="bg-black/20 border-white/10 text-white focus:border-indigo-500 rounded-xl h-11"
                      />
                    </div>
                  </div>
                </div>
              ) : null}

              {role === "student" ? (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label className="text-white/80 font-medium ml-1">Nazwa publiczna (widoczna w profilu) *</Label>
                    <div className="relative">
                      <UserIcon className="absolute left-3 top-3 h-5 w-5 text-indigo-300/50" />
                      <Input
                        value={publicName}
                        onChange={(e) => setPublicName(e.target.value)}
                        placeholder="Imię i nazwisko"
                        required
                        className="pl-10 bg-black/20 border-white/10 text-white placeholder:text-white/30 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl h-11 transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-white/80 font-medium ml-1">Kierunek studiów *</Label>
                    <div className="relative">
                      <Briefcase className="absolute left-3 top-3 h-5 w-5 text-indigo-300/50" />
                      <Input
                        value={kierunek}
                        onChange={(e) => setKierunek(e.target.value)}
                        placeholder="np. Informatyka"
                        required
                        className="pl-10 bg-black/20 border-white/10 text-white placeholder:text-white/30 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl h-11 transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-white/80 font-medium ml-1">Rok studiów *</Label>
                    <div className="relative">
                      <GraduationCap className="absolute left-3 top-3 h-5 w-5 text-indigo-300/50 z-10" />
                      <Select value={rok} onValueChange={setRok} required>
                        <SelectTrigger className="pl-10 w-full bg-black/20 border-white/10 text-white rounded-xl h-11 hover:bg-white/10 transition-colors">
                          <SelectValue placeholder="Wybierz rok..." />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-900 border-slate-700 text-white">
                          <SelectItem value="1">1 rok (licencjat/inż.)</SelectItem>
                          <SelectItem value="2">2 rok (licencjat/inż.)</SelectItem>
                          <SelectItem value="3">3 rok (licencjat/inż.)</SelectItem>
                          <SelectItem value="4">4 rok (inż. / 1 mgr)</SelectItem>
                          <SelectItem value="5">5 rok (2 mgr)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-white/80 font-medium ml-1">Bio (opcjonalnie)</Label>
                    <Textarea
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder="Napisz krótko o sobie..."
                      className="bg-black/20 border-white/10 text-white placeholder:text-white/30 focus:border-indigo-500 rounded-xl min-h-[100px]"
                    />
                  </div>
                </div>
              ) : null}

              {formMessage ? (
                <div
                  className={cn(
                    "rounded-xl border px-4 py-3 text-sm",
                    formMessage.type === "error"
                      ? "border-red-500/30 bg-red-500/10 text-red-100"
                      : "border-emerald-500/30 bg-emerald-500/10 text-emerald-100",
                  )}
                >
                  {formMessage.text}
                </div>
              ) : null}

              <div className="pt-4">
                <Button
                  type="submit"
                  className="w-full h-12 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/25 transition-all hover:scale-[1.02]"
                  disabled={saving}
                >
                  {saving ? (
                    "Zapisywanie..."
                  ) : (
                    <span className="flex items-center gap-2">
                      Rozpocznij <ArrowRight className="w-4 h-4" />
                    </span>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
