"use client";

import Image from "next/image";
import Script from "next/script";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const AUTH_TEXTS = [
  {
    title: "Połącz ambicję z możliwościami.",
    description: "Student2Work porządkuje współpracę między firmami i studentami od pierwszej aplikacji aż po rozliczenie.",
  },
  {
    title: "Zarabiaj, realizując prawdziwe projekty.",
    description: "Buduj portfolio na realnych zleceniach, zamiast czekać na pierwszą szansę po studiach.",
  },
  {
    title: "Zatrudniaj szybciej bez chaosu.",
    description: "Publikuj oferty, wybieraj kandydatów i prowadź współpracę w jednym miejscu.",
  },
];

function validateEmail(email: string) {
  if (!email.trim()) return "Email jest wymagany.";
  if (!EMAIL_RE.test(email)) return "Podaj prawidłowy adres email.";
  return null;
}

function validatePassword(password: string, isRegister: boolean) {
  if (!password) return "Hasło jest wymagane.";
  if (isRegister && password.length < 8) {
    return "Hasło musi mieć co najmniej 8 znaków.";
  }

  return null;
}

function getRequestedRole(): "student" | "company" | null {
  if (typeof window === "undefined") return null;

  const requestedRole = new URLSearchParams(window.location.search).get("role");
  return requestedRole === "student" || requestedRole === "company" ? requestedRole : null;
}

export default function AuthPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  const [role, setRole] = useState<"student" | "company">(() => getRequestedRole() ?? "student");
  const [tab, setTab] = useState<"login" | "register">(() => (getRequestedRole() ? "register" : "login"));
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);
  const [acceptedMarketing, setAcceptedMarketing] = useState(false);
  const [textIndex, setTextIndex] = useState(0);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setTextIndex((prev) => (prev + 1) % AUTH_TEXTS.length);
    }, 5000);

    return () => window.clearInterval(interval);
  }, []);

  async function verifyTurnstile(token: string): Promise<string | null> {
    if (!turnstileSiteKey) {
      return null;
    }

    if (!token) {
      return "Potwierdź, że nie jesteś botem.";
    }

    const response = await fetch("/api/auth/verify-turnstile", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ token }),
    });

    const payload = await response.json().catch(() => null) as { success?: boolean; error?: string } | null;
    if (!response.ok || payload?.success !== true) {
      return payload?.error || "Weryfikacja CAPTCHA nie powiodła się.";
    }

    return null;
  }

  async function handlePasswordReset() {
    const emailErr = validateEmail(email);
    if (emailErr) {
      setInfo(emailErr);
      return;
    }

    setLoading(true);
    setInfo(null);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/app/reset-password`,
    });

    setLoading(false);

    if (error) {
      setInfo(error.message);
      return;
    }

    setResetSent(true);
    setInfo("Link do resetowania hasła został wysłany na podany adres email.");
  }

  async function signUp(e: React.FormEvent) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget as HTMLFormElement);
    const turnstileToken = String(formData.get("cf-turnstile-response") ?? "");

    const turnstileError = await verifyTurnstile(turnstileToken);
    if (turnstileError) {
      setInfo(turnstileError);
      return;
    }

    const emailErr = validateEmail(email);
    if (emailErr) {
      setInfo(emailErr);
      return;
    }

    const passErr = validatePassword(password, true);
    if (passErr) {
      setInfo(passErr);
      return;
    }

    if (!acceptedTerms || !acceptedPrivacy) {
      setInfo("Musisz zaakceptować regulamin oraz politykę prywatności, aby założyć konto.");
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

    if (error) {
      setInfo(error.message);
      return;
    }

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
    }

    setInfo("Konto zostało utworzone. Zaloguj się lub potwierdź email, jeśli ta opcja jest włączona.");
  }

  async function signIn(e: React.FormEvent) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget as HTMLFormElement);
    const turnstileToken = String(formData.get("cf-turnstile-response") ?? "");

    const turnstileError = await verifyTurnstile(turnstileToken);
    if (turnstileError) {
      setInfo(turnstileError);
      return;
    }

    const emailErr = validateEmail(email);
    if (emailErr) {
      setInfo(emailErr);
      return;
    }

    const passErr = validatePassword(password, false);
    if (passErr) {
      setInfo(passErr);
      return;
    }

    setLoading(true);
    setInfo(null);

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    setLoading(false);

    if (error) {
      setInfo(error.message);
      return;
    }

    router.push("/app");
  }

  return (
    <main className="grid min-h-screen lg:grid-cols-2">
      {turnstileSiteKey ? (
        <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" strategy="afterInteractive" />
      ) : null}

      <div className="relative hidden overflow-hidden bg-[#14213d] p-12 text-white lg:flex lg:flex-col">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(242,95,92,0.24),_transparent_30%),radial-gradient(circle_at_bottom_right,_rgba(77,124,255,0.3),_transparent_35%),linear-gradient(135deg,_#14213d_0%,_#0d1730_100%)]" />
        <div className="absolute left-[10%] top-[15%] h-20 w-20 rounded-[1.5rem] border-2 border-white/10 animate-[spin_20s_linear_infinite]" />
        <div className="absolute bottom-[18%] right-[15%] h-16 w-16 rounded-full bg-white/10 animate-pulse" />
        <div className="absolute left-[7%] top-[60%] h-24 w-24 rounded-full border-2 border-white/10 animate-[spin_25s_linear_infinite_reverse]" />

        <div className="relative z-10">
          <div className="inline-flex items-center gap-3 rounded-2xl bg-white/10 px-4 py-3 backdrop-blur-sm">
            <Image src="/logo.png" alt="Student2Work" width={44} height={44} className="h-11 w-auto brightness-0 invert" />
            <div>
              <div className="text-sm font-black uppercase tracking-[0.2em] text-[#ffe066]">Student2Work</div>
              <div className="text-xs text-white/65">ambicja spotyka realną pracę</div>
            </div>
          </div>
        </div>

        <div className="relative z-10 mx-auto flex max-w-lg flex-1 flex-col justify-center space-y-6">
          <div key={textIndex} className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/8 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-white/75">
              wejście do platformy
            </div>
            <h2 className="text-5xl font-black leading-tight tracking-[-0.04em]">
              {AUTH_TEXTS[textIndex].title}
            </h2>
            <p className="text-xl leading-relaxed text-white/80">{AUTH_TEXTS[textIndex].description}</p>
          </div>

          <div className="flex gap-2 pt-4">
            {AUTH_TEXTS.map((item, index) => (
              <div
                key={item.title}
                className={`h-1.5 rounded-full transition-all duration-500 ${
                  index === textIndex ? "w-10 bg-white" : "w-6 bg-white/30"
                }`}
              />
            ))}
          </div>
        </div>

        <div className="relative z-10 mt-auto">
          <div className="flex w-fit gap-8 rounded-[1.75rem] border border-white/10 bg-white/10 p-6 backdrop-blur-md">
            <div className="text-center">
              <div className="text-2xl font-bold">2 500+</div>
              <div className="text-sm text-white/70">studentów</div>
            </div>
            <div className="my-auto h-10 w-px bg-white/20" />
            <div className="text-center">
              <div className="text-2xl font-bold">850+</div>
              <div className="text-sm text-white/70">firm</div>
            </div>
            <div className="my-auto h-10 w-px bg-white/20" />
            <div className="text-center">
              <div className="text-2xl font-bold">4 200+</div>
              <div className="text-sm text-white/70">projektów</div>
            </div>
          </div>

          <p className="mt-8 text-sm text-white/45">© {new Date().getFullYear()} Student2Work. Wszelkie prawa zastrzeżone.</p>
        </div>
      </div>

      <div className="flex items-center justify-center bg-gradient-to-br from-[#f5f7fa] to-[#e5e7eb] p-4 sm:p-8">
        <div className="relative w-full max-w-md overflow-hidden rounded-[1.5rem] sm:rounded-[2rem] border border-gray-100 bg-white p-5 sm:p-8 shadow-xl">
          <div className="absolute left-0 right-0 top-0 h-1 bg-gradient-to-r from-[#f25f5c] via-[#f7b267] to-[#4d7cff]" />

          <div className="space-y-2 text-center">
            <h1 className="text-2xl font-bold tracking-tight text-[#1a1a2e]">
              {tab === "login" ? "Witaj ponownie" : "Załóż konto"}
            </h1>
            <p className="text-sm text-[#5a5a7a]">
              {tab === "login"
                ? "Zaloguj się, aby wrócić do rozmów, ofert i workspace'ów."
                : "Wybierz rolę i rozpocznij pracę po swojej stronie platformy."}
            </p>
          </div>

          <Tabs value={tab} onValueChange={(value) => setTab(value as "login" | "register")} className="mt-8 space-y-6">
            <TabsList className="grid h-12 w-full grid-cols-2 rounded-xl bg-gray-100/80 p-1">
              <TabsTrigger
                value="login"
                className="rounded-lg font-semibold transition-all data-[state=active]:bg-white data-[state=active]:text-[#667eea] data-[state=active]:shadow-sm"
              >
                Logowanie
              </TabsTrigger>
              <TabsTrigger
                value="register"
                className="rounded-lg font-semibold transition-all data-[state=active]:bg-white data-[state=active]:text-[#667eea] data-[state=active]:shadow-sm"
              >
                Rejestracja
              </TabsTrigger>
            </TabsList>

            <TabsContent value="login" className="space-y-4">
              <form onSubmit={signIn} className="space-y-4">
                <div className="space-y-2">
                  <Label className="font-semibold text-[#1a1a2e]">Email</Label>
                  <Input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-12 rounded-xl border-2 border-gray-200 bg-gray-50 transition-all focus:border-[#667eea] focus:bg-white"
                    placeholder="name@example.com"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="font-semibold text-[#1a1a2e]">Hasło</Label>
                    <button
                      type="button"
                      onClick={handlePasswordReset}
                      disabled={loading || resetSent}
                      className="text-sm font-medium text-[#667eea] hover:underline disabled:opacity-50"
                    >
                      {resetSent ? "Wysłano email" : "Zapomniałeś hasła?"}
                    </button>
                  </div>
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-12 rounded-xl border-2 border-gray-200 bg-gray-50 transition-all focus:border-[#667eea] focus:bg-white"
                  />
                </div>

                <Button
                  className="h-12 w-full rounded-xl bg-gradient-to-r from-[#667eea] to-[#764ba2] font-semibold text-white shadow-[0_4px_15px_rgba(102,126,234,0.4)] transition-all hover:-translate-y-0.5 hover:shadow-[0_6px_25px_rgba(102,126,234,0.5)]"
                  disabled={loading}
                >
                  {loading ? "Logowanie..." : "Zaloguj się"}
                </Button>

                {turnstileSiteKey ? (
                  <div className="cf-turnstile" data-sitekey={turnstileSiteKey} data-theme="light" />
                ) : null}
              </form>
            </TabsContent>

            <TabsContent value="register" className="space-y-4">
              <div className="mb-4 grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRole("student")}
                  className={`rounded-xl border-2 p-4 text-center transition-all ${
                    role === "student"
                      ? "border-[#667eea] bg-[#667eea]/5 text-[#667eea]"
                      : "border-gray-200 bg-gray-50 hover:border-gray-300 hover:bg-gray-100"
                  }`}
                >
                  <div className="text-lg font-bold">Student</div>
                  <div className="mt-1 text-xs opacity-70">Szukam zleceń i projektów</div>
                </button>

                <button
                  type="button"
                  onClick={() => setRole("company")}
                  className={`rounded-xl border-2 p-4 text-center transition-all ${
                    role === "company"
                      ? "border-[#764ba2] bg-[#764ba2]/5 text-[#764ba2]"
                      : "border-gray-200 bg-gray-50 hover:border-gray-300 hover:bg-gray-100"
                  }`}
                >
                  <div className="text-lg font-bold">Firma</div>
                  <div className="mt-1 text-xs opacity-70">Chcę publikować oferty</div>
                </button>
              </div>

              <form onSubmit={signUp} className="space-y-4">
                <div className="space-y-2">
                  <Label className="font-semibold text-[#1a1a2e]">Email</Label>
                  <Input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-12 rounded-xl border-2 border-gray-200 bg-gray-50 transition-all focus:border-[#667eea] focus:bg-white"
                    placeholder={role === "company" ? "kontakt@firma.pl" : "name@example.com"}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="font-semibold text-[#1a1a2e]">Hasło</Label>
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-12 rounded-xl border-2 border-gray-200 bg-gray-50 transition-all focus:border-[#667eea] focus:bg-white"
                  />
                </div>

                <div className="space-y-3 border-t border-gray-100 pt-2">
                  <div className="flex items-start gap-3">
                    <Checkbox
                      id="terms"
                      checked={acceptedTerms}
                      onCheckedChange={(value) => setAcceptedTerms(value === true)}
                      className="mt-0.5 border-gray-300 data-[state=checked]:border-[#667eea] data-[state=checked]:bg-[#667eea]"
                    />
                    <label htmlFor="terms" className="cursor-pointer select-none text-xs leading-relaxed text-gray-600">
                      Akceptuję{" "}
                      <a
                        href="/regulamin"
                        rel="noopener noreferrer"
                        target="_blank"
                        className="text-[#667eea] underline hover:text-[#764ba2]"
                      >
                        regulamin
                      </a>{" "}
                      i{" "}
                      <a
                        href="/polityka-prywatnosci"
                        rel="noopener noreferrer"
                        target="_blank"
                        className="text-[#667eea] underline hover:text-[#764ba2]"
                      >
                        politykę prywatności
                      </a>{" "}
                      serwisu Student2Work. <span className="text-red-500">*</span>
                    </label>
                  </div>

                  <div className="flex items-start gap-3">
                    <Checkbox
                      id="privacy"
                      checked={acceptedPrivacy}
                      onCheckedChange={(value) => setAcceptedPrivacy(value === true)}
                      className="mt-0.5 border-gray-300 data-[state=checked]:border-[#667eea] data-[state=checked]:bg-[#667eea]"
                    />
                    <label htmlFor="privacy" className="cursor-pointer select-none text-xs leading-relaxed text-gray-600">
                      Wyrażam zgodę na przetwarzanie moich danych osobowych w celu realizacji usług serwisu.{" "}
                      <span className="text-red-500">*</span>
                    </label>
                  </div>

                  <div className="flex items-start gap-3">
                    <Checkbox
                      id="marketing"
                      checked={acceptedMarketing}
                      onCheckedChange={(value) => setAcceptedMarketing(value === true)}
                      className="mt-0.5 border-gray-300 data-[state=checked]:border-[#667eea] data-[state=checked]:bg-[#667eea]"
                    />
                    <label htmlFor="marketing" className="cursor-pointer select-none text-xs leading-relaxed text-gray-600">
                      Chcę otrzymywać informacje o nowych ofertach i produktowych aktualizacjach.
                    </label>
                  </div>
                </div>

                <Button
                  className="h-12 w-full rounded-xl bg-gradient-to-r from-[#667eea] to-[#764ba2] font-semibold text-white shadow-[0_4px_15px_rgba(102,126,234,0.4)] transition-all hover:-translate-y-0.5 hover:shadow-[0_6px_25px_rgba(102,126,234,0.5)]"
                  disabled={loading || !acceptedTerms || !acceptedPrivacy}
                >
                  {loading ? "Rejestracja..." : "Załóż darmowe konto"}
                </Button>

                {turnstileSiteKey ? (
                  <div className="cf-turnstile" data-sitekey={turnstileSiteKey} data-theme="light" />
                ) : null}
              </form>
            </TabsContent>
          </Tabs>

          {info ? (
            <div
              className={`mt-6 rounded-xl border p-4 text-sm ${
                info.startsWith("Konto") || info.startsWith("Link")
                  ? "border-green-200 bg-green-50 text-green-700"
                  : "border-red-200 bg-red-50 text-red-700"
              }`}
            >
              {info}
            </div>
          ) : null}
        </div>
      </div>
    </main>
  );
}
