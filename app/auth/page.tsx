"use client";

import { useMemo, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/browser";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateEmail(e: string) {
  if (!e.trim()) return "Email jest wymagany.";
  if (!EMAIL_RE.test(e)) return "Podaj prawidłowy adres email.";
  return null;
}

function validatePassword(p: string, isRegister: boolean) {
  if (!p) return "Hasło jest wymagane.";
  if (isRegister && p.length < 8) return "Hasło musi mieć co najmniej 8 znaków.";
  return null;
}

export default function AuthPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [role, setRole] = useState<"student" | "company">("student");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  // RODO consent states
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);
  const [acceptedMarketing, setAcceptedMarketing] = useState(false);

  // Rotator tekstów
  const [textIndex, setTextIndex] = useState(0);
  const texts = [
    { t1: "Połącz ambicję", t2: "z możliwościami.", desc: "Student2Work to platforma nowej generacji, która redefiniuje sposób, w jaki firmy odkrywają młode talenty." },
    { t1: "Zarabiaj", t2: "realizując projekty.", desc: "Wykorzystaj swoje umiejętności w praktyce i buduj profesjonalne portfolio jeszcze na studiach." },
    { t1: "Rozwijaj firmę", t2: "dając szansę na rozwój.", desc: "Zyskaj świeże spojrzenie i wsparcie ambitnych studentów w swoich projektach biznesowych." },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setTextIndex((prev) => (prev + 1) % texts.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  async function handlePasswordReset() {
    const emailErr = validateEmail(email);
    if (emailErr) { setInfo(emailErr); return; }
    setLoading(true);
    setInfo(null);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/app/reset-password`,
    });
    setLoading(false);
    if (error) return setInfo(error.message);
    setResetSent(true);
    setInfo("Link do resetowania hasła został wysłany na podany adres email.");
  }

  async function signUp(e: React.FormEvent) {
    e.preventDefault();
    const emailErr = validateEmail(email);
    if (emailErr) { setInfo(emailErr); return; }
    const passErr = validatePassword(password, true);
    if (passErr) { setInfo(passErr); return; }
    if (!acceptedTerms || !acceptedPrivacy) {
      setInfo("Musisz zaakceptować regulamin oraz zgodę RODO, aby założyć konto.");
      return;
    }
    setLoading(true);
    setInfo(null);

    const { data: signUpData, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          role,
          accepted_terms: true,
          accepted_privacy: true,
          accepted_marketing: acceptedMarketing,
        },
      },
    });

    setLoading(false);
    if (error) return setInfo(error.message);

    // Zapisz timestamps RODO do tabeli profiles (trigger DB tworzy wiersz synchronicznie)
    if (signUpData.user?.id) {
      const now = new Date().toISOString();
      await supabase
        .from("profiles")
        .update({
          accepted_terms_at: now,
          accepted_privacy_at: now,
          accepted_marketing: acceptedMarketing,
        })
        .eq("user_id", signUpData.user.id);
      // Jeśli update nie trafi (profile jeszcze nie istnieje) — dane są już w user_metadata powyżej
    }

    setInfo("Konto utworzone. Zaloguj się (lub potwierdź email, jeśli masz włączone).");
  }

  async function signIn(e: React.FormEvent) {
    e.preventDefault();
    const emailErr = validateEmail(email);
    if (emailErr) { setInfo(emailErr); return; }
    const passErr = validatePassword(password, false);
    if (passErr) { setInfo(passErr); return; }
    setLoading(true);
    setInfo(null);

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    setLoading(false);
    if (error) return setInfo(error.message);
    router.push("/app");
  }

  return (
    <main className="min-h-screen grid lg:grid-cols-2">
      {/* Left: Branding & Testimonials */}
      <div className="hidden lg:flex flex-col relative bg-gradient-to-br from-[#667eea] to-[#764ba2] text-white overflow-hidden p-12 select-none cursor-default">
        {/* Logo (Top Left) */}
        <div className="z-10 absolute top-12 left-12 bg-white/10 w-fit p-3 rounded-xl backdrop-blur-sm">
          <img src="/logo.png" alt="Student2Work" className="h-14 w-auto brightness-0 invert" />
        </div>

        {/* Floating shapes */}
        <div className="absolute top-[15%] left-[10%] w-20 h-20 border-[3px] border-white/10 rounded-2xl animate-[spin_20s_linear_infinite]" />
        <div className="absolute bottom-[20%] right-[15%] w-16 h-16 bg-white/10 rounded-full animate-pulse" />
        <div className="absolute top-[60%] left-[5%] w-24 h-24 border-[3px] border-white/10 rounded-full animate-[spin_25s_linear_infinite_reverse]" />

        {/* Centered Text Content */}
        <div className="flex-1 flex flex-col justify-center max-w-lg mx-auto z-10 space-y-6">
          <div key={textIndex} className="animate-in fade-in slide-in-from-bottom-4 duration-700 space-y-6">
            <h2 className="text-5xl font-extrabold tracking-tight leading-tight">
              {texts[textIndex].t1} <br />
              <span className="bg-gradient-to-r from-[#a5b4fc] to-[#c4b5fd] bg-clip-text text-transparent">{texts[textIndex].t2}</span>
            </h2>
            <p className="text-xl text-white/80 leading-relaxed">
              {texts[textIndex].desc}
            </p>
          </div>

          {/* Indicators */}
          <div className="flex gap-2 pt-4">
            {texts.map((_, i) => (
              <div key={i} className={`h-1.5 rounded-full transition-all duration-500 ${i === textIndex ? "w-10 bg-white" : "w-6 bg-white/30"}`} />
            ))}
          </div>
        </div>

        {/* Bottom Bar: Stats & Copyright */}
        <div className="z-10 mt-auto flex flex-col gap-8">
          <div className="flex gap-8 p-6 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10 w-fit">
            <div className="text-center">
              <div className="text-2xl font-bold">2,500+</div>
              <div className="text-sm text-white/70">Studentów</div>
            </div>
            <div className="h-10 w-px bg-white/20 my-auto" />
            <div className="text-center">
              <div className="text-2xl font-bold">850+</div>
              <div className="text-sm text-white/70">Firm</div>
            </div>
            <div className="h-10 w-px bg-white/20 my-auto" />
            <div className="text-center">
              <div className="text-2xl font-bold">4,200+</div>
              <div className="text-sm text-white/70">Projektów</div>
            </div>
          </div>

          <p className="text-sm text-white/50">© {new Date().getFullYear()} Student2Work. All rights reserved.</p>
        </div>

        {/* Background Gradients */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-white/5 blur-[120px] rounded-full pointer-events-none" />
      </div>

      {/* Right: Auth Form */}
      <div className="flex items-center justify-center p-8 bg-gradient-to-br from-[#f5f7fa] to-[#e5e7eb]">
        <div className="w-full max-w-md space-y-8 bg-white p-8 rounded-3xl shadow-xl border border-gray-100 relative overflow-hidden">
          {/* Top gradient line */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#667eea] to-[#764ba2]" />

          <div className="space-y-2 text-center">
            <h1 className="text-2xl font-bold tracking-tight text-[#1a1a2e]">Witaj ponownie</h1>
            <p className="text-sm text-[#5a5a7a]">Zaloguj się lub utwórz konto, aby rozpocząć.</p>
          </div>

          <Tabs defaultValue="login" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2 h-12 p-1 bg-gray-100/80 rounded-xl">
              <TabsTrigger value="login" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-[#667eea] font-semibold transition-all">Logowanie</TabsTrigger>
              <TabsTrigger value="register" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-[#667eea] font-semibold transition-all">Rejestracja</TabsTrigger>
            </TabsList>

            <TabsContent value="login" className="space-y-4">
              <form onSubmit={signIn} className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-[#1a1a2e] font-semibold">Email</Label>
                  <Input value={email} onChange={(e) => setEmail(e.target.value)} className="h-12 bg-gray-50 border-2 border-gray-200 focus:bg-white focus:border-[#667eea] transition-all rounded-xl" placeholder="name@example.com" />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-[#1a1a2e] font-semibold">Hasło</Label>
                    <button
                      type="button"
                      onClick={handlePasswordReset}
                      disabled={loading || resetSent}
                      className="text-sm text-[#667eea] hover:underline font-medium disabled:opacity-50"
                    >
                      {resetSent ? "Wysłano email" : "Zapomniałeś hasła?"}
                    </button>
                  </div>
                  <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="h-12 bg-gray-50 border-2 border-gray-200 focus:bg-white focus:border-[#667eea] transition-all rounded-xl" />
                </div>
                <Button className="w-full h-12 bg-gradient-to-r from-[#667eea] to-[#764ba2] hover:shadow-[0_6px_25px_rgba(102,126,234,0.5)] text-white font-semibold shadow-[0_4px_15px_rgba(102,126,234,0.4)] rounded-xl transition-all hover:-translate-y-0.5" disabled={loading}>
                  {loading ? "Logowanie..." : "Zaloguj się"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="register" className="space-y-4">
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div
                  onClick={() => setRole("student")}
                  className={`cursor-pointer rounded-xl border-2 p-4 text-center transition-all ${role === 'student' ? 'border-[#667eea] bg-[#667eea]/5 text-[#667eea]' : 'border-gray-200 bg-gray-50 hover:bg-gray-100 hover:border-gray-300'}`}
                >
                  <div className="text-2xl mb-1">🎓</div>
                  <div className="font-semibold">Student</div>
                  <div className="text-xs opacity-70 mt-1">Szukam zleceń</div>
                </div>
                <div
                  onClick={() => setRole("company")}
                  className={`cursor-pointer rounded-xl border-2 p-4 text-center transition-all ${role === 'company' ? 'border-[#764ba2] bg-[#764ba2]/5 text-[#764ba2]' : 'border-gray-200 bg-gray-50 hover:bg-gray-100 hover:border-gray-300'}`}
                >
                  <div className="text-2xl mb-1">🏢</div>
                  <div className="font-semibold">Firma</div>
                  <div className="text-xs opacity-70 mt-1">Chcę zatrudniać</div>
                </div>
              </div>

              <form onSubmit={signUp} className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-[#1a1a2e] font-semibold">Email</Label>
                  <Input value={email} onChange={(e) => setEmail(e.target.value)} className="h-12 bg-gray-50 border-2 border-gray-200 focus:bg-white focus:border-[#667eea] transition-all rounded-xl" placeholder="name@company.com" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[#1a1a2e] font-semibold">Hasło</Label>
                  <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="h-12 bg-gray-50 border-2 border-gray-200 focus:bg-white focus:border-[#667eea] transition-all rounded-xl" />
                </div>

                {/* RODO Consent Checkboxes */}
                <div className="space-y-3 pt-2 border-t border-gray-100">
                  <div className="flex items-start gap-3">
                    <Checkbox
                      id="terms"
                      checked={acceptedTerms}
                      onCheckedChange={(v) => setAcceptedTerms(v === true)}
                      className="mt-0.5 border-gray-300 data-[state=checked]:bg-[#667eea] data-[state=checked]:border-[#667eea]"
                    />
                    <label htmlFor="terms" className="text-xs text-gray-600 leading-relaxed cursor-pointer select-none">
                      Akceptuję <a href="/regulamin" rel="noopener noreferrer" target="_blank" className="text-[#667eea] underline hover:text-[#764ba2]">regulamin</a> i <a href="/polityka-prywatnosci" rel="noopener noreferrer" target="_blank" className="text-[#667eea] underline hover:text-[#764ba2]">politykę prywatności</a> serwisu Student2Work. <span className="text-red-500">*</span>
                    </label>
                  </div>
                  <div className="flex items-start gap-3">
                    <Checkbox
                      id="privacy"
                      checked={acceptedPrivacy}
                      onCheckedChange={(v) => setAcceptedPrivacy(v === true)}
                      className="mt-0.5 border-gray-300 data-[state=checked]:bg-[#667eea] data-[state=checked]:border-[#667eea]"
                    />
                    <label htmlFor="privacy" className="text-xs text-gray-600 leading-relaxed cursor-pointer select-none">
                      Wyrażam zgodę na przetwarzanie moich danych osobowych w celu realizacji usług serwisu (RODO). <span className="text-red-500">*</span>
                    </label>
                  </div>
                  <div className="flex items-start gap-3">
                    <Checkbox
                      id="marketing"
                      checked={acceptedMarketing}
                      onCheckedChange={(v) => setAcceptedMarketing(v === true)}
                      className="mt-0.5 border-gray-300 data-[state=checked]:bg-[#667eea] data-[state=checked]:border-[#667eea]"
                    />
                    <label htmlFor="marketing" className="text-xs text-gray-600 leading-relaxed cursor-pointer select-none">
                      Chcę otrzymywać informacje o nowych ofertach i promocjach.
                    </label>
                  </div>
                </div>

                <Button className="w-full h-12 bg-gradient-to-r from-[#667eea] to-[#764ba2] hover:shadow-[0_6px_25px_rgba(102,126,234,0.5)] text-white font-semibold shadow-[0_4px_15px_rgba(102,126,234,0.4)] rounded-xl transition-all hover:-translate-y-0.5" disabled={loading || !acceptedTerms || !acceptedPrivacy}>
                  {loading ? "Rejestracja..." : "Załóż darmowe konto"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          {info && (
            <div className={`text-sm p-4 rounded-xl flex items-center gap-2 ${(info.startsWith("Konto") || info.startsWith("Link")) ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
              {info}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
