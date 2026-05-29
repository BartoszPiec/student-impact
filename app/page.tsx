"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  Star,
  Globe,
  Video,
  Code,
  BarChart,
  Palette,
  Languages,
  Clipboard,
  PenTool,
  Bot,
  Scale,
  Database,
  Sparkles,
  ArrowRight,
  Shield,
  Zap,
  Users,
  TrendingUp,
  Clock,
  BadgeCheck,
  ChevronRight,
  Menu,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

// --- Types ---
interface ServiceData {
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  stats: { price: string; time: string; projects: string; rating: string };
  examples: string[];
  funFact: string;
}

// Task categories — 3 pillars: Growth / Ops / Admin
const SERVICE_DATA: Record<string, ServiceData> = {
  "Lead research": {
    icon: TrendingUp,
    description: "Budujesz pipeline, ale nie masz kto szukać kontaktów? Deleguj research leadów i wróć do sprzedaży.",
    stats: { price: "200-800 zł", time: "1-3 dni", projects: "310+", rating: "4.8/5" },
    examples: ["Listy firm wg ICP z LinkedIn", "Weryfikacja danych kontaktowych", "Research decydentów", "Budowanie baz w CRM", "Analiza konkurencji"],
    funFact: "Średnio 3 dni wystarczą na zbudowanie listy 200 kwalifikowanych leadów.",
  },
  "Prospecting i outreach": {
    icon: Users,
    description: "Przygotowanie materiałów do cold outreach, personalizacja wiadomości, sekwencje mailowe. Robota, której nikt nie lubi robić — ale musi być zrobiona.",
    stats: { price: "300-1200 zł", time: "2-5 dni", projects: "180+", rating: "4.7/5" },
    examples: ["Personalizowane wiadomości cold mail", "Skrypty do cold calla", "Sekwencje follow-up", "Przygotowanie ofert handlowych", "Analiza odpowiedzi i optymalizacja"],
    funFact: "Dobrze przygotowany outreach otwiera 3× więcej rozmów niż szablonowe wiadomości.",
  },
  "Prezentacje i materiały": {
    icon: Palette,
    description: "Pitch deck, oferta handlowa, prezentacja dla zarządu. Masz treść, potrzebujesz kogoś kto to złoży profesjonalnie.",
    stats: { price: "300-1500 zł", time: "2-7 dni", projects: "450+", rating: "4.9/5" },
    examples: ["Pitch deck dla inwestorów", "Prezentacje sprzedażowe", "Oferty handlowe PDF", "One-pagery produktowe", "Materiały onboardingowe"],
    funFact: "Profesjonalna prezentacja zwiększa szansę na zamknięcie deala o 35%.",
  },
  "Data entry i CRM": {
    icon: Database,
    description: "CRM zarasta, arkusze są chaotyczne, baza danych nieaktualna. To zadanie, które wraca do Ciebie co tydzień — i nie powinno.",
    stats: { price: "100-600 zł", time: "1-5 dni", projects: "540+", rating: "4.7/5" },
    examples: ["Czyszczenie i uzupełnianie CRM", "Import danych z arkuszy", "Deduplikacja bazy klientów", "Tagowanie i segmentacja", "Raportowanie z danych"],
    funFact: "Firmy tracą średnio 12h tygodniowo na ręczne zarządzanie danymi.",
  },
  "Content i social media": {
    icon: PenTool,
    description: "Potrzebujesz postów, artykułów, opisów. Regularny content — bez zatrudniania na etat.",
    stats: { price: "200-1000 zł", time: "2-10 dni", projects: "410+", rating: "4.8/5" },
    examples: ["Posty na LinkedIn / Instagram", "Artykuły blogowe SEO", "Newsletter firmowy", "Opisy produktów", "Skrypty do rolek i wideo"],
    funFact: "Firmy publikujące regularnie na LinkedIn generują 7× więcej zapytań.",
  },
  "Wsparcie operacyjne": {
    icon: Clipboard,
    description: "Zadania administracyjne, które blokują Twój czas. Wprowadź dane, odpisz na maile, przygotuj dokumenty — bez angażowania kluczowych ludzi.",
    stats: { price: "80-400 zł", time: "1-3 dni", projects: "540+", rating: "4.7/5" },
    examples: ["Obsługa skrzynki mailowej", "Wprowadzanie danych i faktur", "Organizacja dokumentacji", "Transkrypcja i protokoły", "Zarządzanie kalendarzem"],
    funFact: "Właściciele firm odzyskują średnio 8h tygodniowo po delegowaniu zadań admin.",
  },
  "Strony i CMS": {
    icon: Globe,
    description: "Aktualizacje strony, uploady produktów, poprawki treści, nowe podstrony. Nie potrzebujesz agencji — potrzebujesz kogoś kto to ogarnie.",
    stats: { price: "200-1500 zł", time: "1-7 dni", projects: "340+", rating: "4.8/5" },
    examples: ["Aktualizacje treści na stronie", "Upload produktów do sklepu", "Optymalizacja SEO on-page", "Tworzenie podstron w CMS", "Migracja treści"],
    funFact: "Strony aktualizowane co miesiąc generują 6× więcej ruchu organicznego.",
  },
  "Analiza i raporty": {
    icon: BarChart,
    description: "Masz dane, ale nikt ich nie czyta. Potrzebujesz dashboardu, raportu tygodniowego lub analizy rynku — bez angażowania analityka na etat.",
    stats: { price: "300-2000 zł", time: "2-7 dni", projects: "230+", rating: "4.8/5" },
    examples: ["Dashboardy w Google Sheets / Excel", "Raporty sprzedażowe", "Analiza rynku i konkurencji", "Segmentacja klientów", "Wizualizacje danych"],
    funFact: "Firmy podejmujące decyzje na danych rosną 2× szybciej.",
  },
  "Wideo i multimedia": {
    icon: Video,
    description: "Masz nagrania, potrzebujesz efektu. Montaż, obróbka, reels, animacje — bez agencji kreatywnej.",
    stats: { price: "300-2000 zł", time: "3-10 dni", projects: "280+", rating: "4.9/5" },
    examples: ["Montaż wideo promocyjnych", "Reels i shorty na social", "Animacje prezentacji", "Obróbka zdjęć produktowych", "Napisy i subtitles"],
    funFact: "Posty wideo generują 49% więcej interakcji niż statyczne grafiki.",
  },
  "Programowanie i IT": {
    icon: Code,
    description: "Skrypt, integracja, automatyzacja, mały serwis. Zadania IT które nie uzasadniają zatrudniania dewelopera — ale muszą być zrobione.",
    stats: { price: "500-5000 zł", time: "3-14 dni", projects: "520+", rating: "4.7/5" },
    examples: ["Automatyzacja powtarzalnych procesów", "Integracje API / Zapier", "Skrypty w Python / Excel", "Małe aplikacje webowe", "Poprawki na stronie"],
    funFact: "Automatyzacja jednego powtarzalnego procesu oszczędza średnio 5h tygodniowo.",
  },
  "Tłumaczenia": {
    icon: Languages,
    description: "Materiały do wysyłki za granicę, umowy, strona w obcym języku. Szybko, bez agencji tłumaczeniowej.",
    stats: { price: "50-500 zł", time: "1-5 dni", projects: "670+", rating: "4.9/5" },
    examples: ["Tłumaczenia ofert i umów", "Lokalizacja strony www", "Materiały marketingowe EN/DE/ES", "Korespondencja handlowa", "Podtytuły do wideo"],
    funFact: "Materiały w języku klienta zwiększają konwersję o 70%.",
  },
  "Automatyzacje AI": {
    icon: Bot,
    description: "Chcesz wdrożyć AI ale nie wiesz od czego zacząć? Chatbot, automatyczny raport, asystent mailowy — konkretne wdrożenia, nie konsulting.",
    stats: { price: "500-3000 zł", time: "3-14 dni", projects: "180+", rating: "4.9/5" },
    examples: ["Chatbot na stronie / w CRM", "Automatyzacja z GPT w procesach", "Asystent mailowy AI", "Generowanie raportów AI", "Skróty i automatyczne podsumowania"],
    funFact: "Firmy wdrażające AI w Ops oszczędzają średnio 15h/tydzień.",
  },
};

function RevealOnScroll({ children, className, delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setIsVisible(true); observer.unobserve(entry.target); }
    }, { threshold: 0.12 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={cn("transition-all duration-700", isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8", className)}
    >
      {children}
    </div>
  );
}

export default function LandingPage() {
  const [activeModel, setActiveModel] = useState<"standard" | "longterm" | "services">("standard");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { label: "Jak to działa", href: "#jak-dziala" },
    { label: "Zadania", href: "#uslugi" },
    { label: "Dla kogo", href: "#dla-firm" },
    { label: "Opinie", href: "#opinie" },
  ];

  const collaborationModels = [
    { id: "standard", label: "Zlecenie jednorazowe", value: "standard" as const },
    { id: "longterm", label: "Współpraca długoterminowa", value: "longterm" as const },
    { id: "services", label: "Usługi studentów", value: "services" as const },
  ];

  return (
    <div className="min-h-screen bg-white font-sans text-[#1a1a2e] overflow-x-hidden">

      {/* ══════════════════════════════════════════
          NAVIGATION
      ══════════════════════════════════════════ */}
      <nav className="fixed top-0 z-50 w-full bg-[#0f2460]/95 backdrop-blur-xl border-b border-white/10">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 text-white font-extrabold text-xl">
            <span className="text-2xl">🎓</span>
            <span>Student<span className="text-[#7c8ef7]">2</span>Work</span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map(link => (
              <a key={link.label} href={link.href} className="text-sm font-semibold text-white/70 hover:text-white transition-colors">
                {link.label}
              </a>
            ))}
          </div>

          {/* CTA buttons */}
          <div className="hidden md:flex items-center gap-3">
            <Link href="/auth">
              <Button variant="ghost" className="text-white/80 hover:text-white hover:bg-white/10 rounded-full px-5 font-semibold">
                Zaloguj się
              </Button>
            </Link>
            <Link href="/auth?role=company">
              <Button className="rounded-full px-6 bg-[#7c8ef7] hover:bg-[#6b7ff0] text-white font-bold shadow-lg shadow-indigo-500/20 transition-all hover:scale-105">
                Deleguj pierwsze zadanie
              </Button>
            </Link>
          </div>

          {/* Mobile menu toggle */}
          <button className="md:hidden text-white p-2" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-[#0f2460] border-t border-white/10 px-6 py-4 space-y-4">
            {navLinks.map(link => (
              <a key={link.label} href={link.href} className="block text-white/80 font-semibold py-2" onClick={() => setMobileMenuOpen(false)}>
                {link.label}
              </a>
            ))}
            <div className="flex flex-col gap-3 pt-2">
              <Link href="/auth"><Button variant="outline" className="w-full border-white/20 text-white rounded-full">Zaloguj się</Button></Link>
              <Link href="/auth?role=company"><Button className="w-full bg-[#7c8ef7] text-white rounded-full font-bold">Zatrudnij studenta</Button></Link>
            </div>
          </div>
        )}
      </nav>

      {/* ══════════════════════════════════════════
          HERO
      ══════════════════════════════════════════ */}
      <section className="relative min-h-screen flex items-center bg-[#0f2460] overflow-hidden pt-20">
        {/* Background decor */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[#7c8ef7]/10 rounded-full blur-[120px]" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-600/10 rounded-full blur-[100px]" />
          {/* Grid lines */}
          <div className="absolute inset-0 opacity-[0.04]"
            style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
        </div>

        <div className="relative z-10 mx-auto w-full max-w-7xl px-6 py-24 lg:py-32">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left: text */}
            <div>
              <RevealOnScroll>
                <div className="inline-flex items-center gap-2 rounded-full border border-[#7c8ef7]/30 bg-[#7c8ef7]/10 px-4 py-1.5 text-sm font-semibold text-[#a5b4fc] mb-8">
                  <Zap className="w-4 h-4" />
                  Dla właścicieli firm, founderów i managerów
                </div>
              </RevealOnScroll>

              <RevealOnScroll delay={100}>
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-[1.1] mb-6">
                  Deleguj zadania,{" "}
                  tam gdzie nie opłaca się{" "}
                  <span className="relative inline-block">
                    <span className="text-[#7c8ef7]">zatrudniać.</span>
                    <span className="absolute -bottom-1 left-0 w-full h-1 bg-[#7c8ef7]/40 rounded-full" />
                  </span>
                </h1>
              </RevealOnScroll>

              <RevealOnScroll delay={200}>
                <p className="text-lg text-white/70 leading-relaxed mb-10 max-w-xl">
                  Masz zadanie → wrzucasz → ktoś kompetentny robi.
                  Szybko, bez etatu, bez rekrutacji, bez chaosu.
                  Dodatkowe ręce do pracy wtedy, kiedy ich potrzebujesz.
                </p>
              </RevealOnScroll>

              <RevealOnScroll delay={300}>
                <div className="flex flex-wrap gap-4 mb-12">
                  <Link href="/auth?role=company">
                    <Button className="h-14 rounded-full px-8 text-base font-bold bg-[#7c8ef7] hover:bg-[#6b7ff0] text-white shadow-xl shadow-indigo-500/30 transition-all hover:scale-105">
                      Deleguj pierwsze zadanie
                      <ArrowRight className="ml-2 w-5 h-5" />
                    </Button>
                  </Link>
                  <Link href="/auth?role=student">
                    <Button variant="outline" className="h-14 rounded-full px-8 text-base font-bold border-white/20 text-white bg-white/5 hover:bg-white/10 transition-all">
                      Zacznij jako student
                    </Button>
                  </Link>
                </div>
              </RevealOnScroll>

              <RevealOnScroll delay={400}>
                <div className="flex flex-wrap items-center gap-6 text-white/50 text-sm">
                  {[
                    { icon: Clock, text: "Start w 24h" },
                    { icon: Shield, text: "Płatności Escrow" },
                    { icon: BadgeCheck, text: "Bez etatu i rekrutacji" },
                  ].map(({ icon: Icon, text }) => (
                    <div key={text} className="flex items-center gap-2">
                      <Icon className="w-4 h-4 text-[#7c8ef7]" />
                      <span>{text}</span>
                    </div>
                  ))}
                </div>
              </RevealOnScroll>
            </div>

            {/* Right: visual dashboard mockup */}
            <RevealOnScroll delay={200} className="hidden lg:block">
              <div className="relative">
                <div className="rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm p-6 space-y-4 shadow-2xl">
                  {/* Header bar */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="text-white font-bold text-sm">Nowe zlecenie</div>
                    <div className="flex gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-red-400/50" />
                      <div className="w-3 h-3 rounded-full bg-yellow-400/50" />
                      <div className="w-3 h-3 rounded-full bg-green-400/50" />
                    </div>
                  </div>

                  {/* Fake form fields */}
                  {["Tytuł projektu", "Kategoria usługi", "Budżet"].map((label, i) => (
                    <div key={label} className="space-y-1.5">
                      <div className="text-xs text-white/40 font-semibold uppercase tracking-wider">{label}</div>
                      <div className="h-10 rounded-xl bg-white/5 border border-white/10 px-4 flex items-center">
                        <div className={cn("h-2 rounded-full bg-[#7c8ef7]/40", i === 0 ? "w-3/4" : i === 1 ? "w-1/2" : "w-1/3")} />
                      </div>
                    </div>
                  ))}

                  {/* Applicants */}
                  <div className="pt-4 border-t border-white/10">
                    <div className="text-xs text-white/40 font-semibold uppercase tracking-wider mb-3">Kandydaci (4)</div>
                    <div className="grid grid-cols-4 gap-2">
                      {["AK", "MB", "PW", "KN"].map((initials, i) => (
                        <div key={initials} className={cn("rounded-xl p-3 text-center border", i === 0 ? "bg-[#7c8ef7]/20 border-[#7c8ef7]/40" : "bg-white/5 border-white/10")}>
                          <div className={cn("w-8 h-8 rounded-full mx-auto mb-1 flex items-center justify-center text-xs font-bold", i === 0 ? "bg-[#7c8ef7] text-white" : "bg-white/10 text-white/60")}>
                            {initials}
                          </div>
                          <div className="flex justify-center gap-0.5">
                            {[1,2,3,4,5].map(s => <div key={s} className={cn("w-1 h-1 rounded-full", s <= 4 ? "bg-amber-400" : "bg-white/10")} />)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Progress */}
                  <div className="pt-4 border-t border-white/10 space-y-3">
                    {[{ label: "Design", pct: 100 }, { label: "Frontend", pct: 65 }, { label: "Testy", pct: 20 }].map(({ label, pct }) => (
                      <div key={label} className="space-y-1">
                        <div className="flex justify-between text-xs text-white/50">
                          <span>{label}</span><span>{pct}%</span>
                        </div>
                        <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-[#7c8ef7] to-[#a5b4fc] rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Floating badge */}
                <div className="absolute -top-4 -right-4 bg-green-500 text-white text-xs font-bold px-4 py-2 rounded-full shadow-lg shadow-green-500/30 flex items-center gap-1.5">
                  <BadgeCheck className="w-3.5 h-3.5" /> Escrow aktywne
                </div>
                <div className="absolute -bottom-4 -left-4 bg-white text-[#0f2460] text-xs font-bold px-4 py-2 rounded-full shadow-xl flex items-center gap-2">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" /> 4.9/5 — 800+ opinii
                </div>
              </div>
            </RevealOnScroll>
          </div>
        </div>

        {/* Bottom wave */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 60" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 60L1440 60L1440 20C1200 60 960 0 720 20C480 40 240 0 0 20L0 60Z" fill="white" />
          </svg>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          TRUST BAR / STATS
      ══════════════════════════════════════════ */}
      <section className="bg-white py-16 px-6">
        <div className="mx-auto max-w-7xl">
          <p className="text-center text-sm font-bold text-slate-400 uppercase tracking-widest mb-10">
            Zaufały nam firmy z całej Polski
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { icon: "⚡", value: "24h", label: "Średni czas startu", sub: "Od zlecenia do wykonawcy" },
              { icon: "✅", value: "1 429", label: "Zadań zrealizowanych", sub: "Wartość 2,4M PLN" },
              { icon: "🏢", value: "512", label: "Firm korzysta z platformy", sub: "MŚP i korporacje" },
              { icon: "⭐", value: "4,9/5", label: "Średnia ocena", sub: "Ponad 800 opinii" },
            ].map((stat, i) => (
              <RevealOnScroll key={stat.label} delay={i * 80}
                className="text-center p-6 rounded-2xl border border-slate-100 bg-slate-50/50 hover:border-[#7c8ef7]/30 hover:shadow-lg transition-all">
                <div className="text-3xl mb-3">{stat.icon}</div>
                <div className="text-3xl font-extrabold text-[#0f2460] mb-1">{stat.value}</div>
                <div className="text-sm font-bold text-slate-700 mb-0.5">{stat.label}</div>
                <div className="text-xs text-slate-400">{stat.sub}</div>
              </RevealOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          FOR COMPANIES — VALUE PROPS
      ══════════════════════════════════════════ */}
      <section id="dla-firm" className="bg-slate-50 py-24 px-6">
        <div className="mx-auto max-w-7xl">
          <RevealOnScroll className="text-center mb-16">
            <p className="text-sm font-bold text-[#7c8ef7] uppercase tracking-widest mb-3">Dla kogo jest Student2Work?</p>
            <h2 className="text-3xl md:text-5xl font-extrabold text-[#0f2460] mb-4">
              Znasz to{" "}
              <span className="relative inline-block">
                uczucie?
                <span className="absolute -bottom-1 left-0 w-full h-1.5 bg-[#7c8ef7]/30 rounded-full" />
              </span>
            </h2>
            <p className="text-lg text-slate-500 max-w-2xl mx-auto">
              Masz backlog zadań, które nie uzasadniają etatu — ale zalegają tygodniami i wracają do Ciebie.
              To właśnie rozwiązujemy.
            </p>
          </RevealOnScroll>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Clock,
                color: "bg-blue-50 text-blue-600",
                title: "Nie mam kto tego zrobić",
                desc: "Research leadów, aktualizacja CRM, przygotowanie prezentacji — zadania, które wracają do Ciebie, bo nie masz kto oddelegować.",
              },
              {
                icon: Users,
                color: "bg-amber-50 text-amber-600",
                title: "Nie opłaca się zatrudniać",
                desc: "Za małe, żeby rekrutować. Za duże, żeby ignorować. Student2Work to dodatkowe ręce na żądanie — bez etatu i bez umowy o pracę.",
              },
              {
                icon: Zap,
                color: "bg-green-50 text-green-600",
                title: "Potrzebuję kogoś teraz",
                desc: "Nie za 3 tygodnie po procesie rekrutacyjnym. Teraz. Wrzucasz zadanie, start w 24h — ktoś kompetentny je ogarnia.",
              },
              {
                icon: Shield,
                color: "bg-purple-50 text-purple-600",
                title: "Płatność po akceptacji",
                desc: "System Escrow chroni Twoje środki. Płacisz dopiero kiedy zatwierdzisz efekt. Zero ryzyka finansowego.",
              },
              {
                icon: BadgeCheck,
                color: "bg-rose-50 text-rose-600",
                title: "Zweryfikowani wykonawcy",
                desc: "Każdy wykonawca ma oceny, historię projektów i potwierdzony profil akademicki. Wybierasz kogoś sprawdzonego.",
              },
              {
                icon: TrendingUp,
                color: "bg-teal-50 text-teal-600",
                title: "Taniej niż agencja, szybciej niż etat",
                desc: "Projekty kosztują 40–70% mniej niż agencja. Bez briefingów, bez account managerów, bez czekania tygodniami.",
              },
            ].map((item, i) => (
              <RevealOnScroll key={item.title} delay={i * 80}
                className="bg-white rounded-2xl p-8 border border-slate-100 hover:border-[#7c8ef7]/30 hover:shadow-xl transition-all group">
                <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center mb-5 transition-transform group-hover:scale-110", item.color)}>
                  <item.icon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-[#0f2460] mb-2">{item.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{item.desc}</p>
              </RevealOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          HOW IT WORKS
      ══════════════════════════════════════════ */}
      <section id="jak-dziala" className="bg-white py-24 px-6">
        <div className="mx-auto max-w-7xl">
          <RevealOnScroll className="text-center mb-12">
            <p className="text-sm font-bold text-[#7c8ef7] uppercase tracking-widest mb-3">Jak to działa</p>
            <h2 className="text-3xl md:text-5xl font-extrabold text-[#0f2460] mb-4">
              Prosto jak{" "}
              <span className="relative inline-block">
                powinno być.
                <span className="absolute -bottom-1 left-0 w-full h-1.5 bg-[#7c8ef7]/30 rounded-full" />
              </span>
            </h2>
            <p className="text-lg text-slate-500">Masz zadanie → wrzucasz → ktoś kompetentny robi. Wybierz model współpracy.</p>
          </RevealOnScroll>

          {/* Model tabs */}
          <div className="flex flex-wrap justify-center gap-2 mb-14">
            {collaborationModels.map((m) => (
              <button key={m.id} onClick={() => setActiveModel(m.value)}
                className={cn(
                  "px-6 py-3 rounded-full text-sm font-bold transition-all border",
                  activeModel === m.value
                    ? "bg-[#0f2460] text-white border-[#0f2460] shadow-lg"
                    : "bg-white text-slate-500 border-slate-200 hover:border-[#7c8ef7] hover:text-[#7c8ef7]"
                )}>
                {m.label}
              </button>
            ))}
          </div>

          {/* Steps */}
          {(() => {
            const steps = {
              standard: [
                { n: "01", title: "Opisujesz zadanie", desc: "Wrzucasz opis tego, co potrzebujesz. Budżet, deadline, zakres. Zajmuje to mniej niż 5 minut.", icon: "📋" },
                { n: "02", title: "Dostajesz oferty", desc: "W ciągu 24h otrzymujesz aplikacje od zweryfikowanych wykonawców. Przeglądasz portfolio, wybierasz najlepszego.", icon: "🔍" },
                { n: "03", title: "Praca rusza", desc: "Ustalasz etapy i terminy. Wykonawca raportuje postępy. Ty akceptujesz lub prosisz o poprawki.", icon: "⚡" },
                { n: "04", title: "Płacisz po akceptacji", desc: "Zadowolony z efektu? Akceptujesz, środki z Escrow trafiają do wykonawcy. Koniec, bez fakturowania.", icon: "✅" },
              ],
              longterm: [
                { n: "01", title: "Określasz potrzeby", desc: "Opisujesz zakres stałych obowiązków, oczekiwany wymiar czasu i stawkę. Zdalnie lub hybrydowo.", icon: "📋" },
                { n: "02", title: "Wybierasz osobę", desc: "Przeglądasz profile, rozmawiasz przez czat. Decydujesz kto wchodzi do Twojego operacyjnego stacku.", icon: "🤝" },
                { n: "03", title: "Stała współpraca", desc: "Osoba pracuje regularnie. Ty masz dedykowane ręce bez kosztów rekrutacji i HR.", icon: "📆" },
                { n: "04", title: "Skalujesz lub kończysz", desc: "Potrzebujesz więcej? Dodajesz kolejną osobę. Projekt się skończył? Kończysz bez wypowiedzenia.", icon: "📈" },
              ],
              services: [
                { n: "01", title: "Wybierasz kategorię zadania", desc: "Przeglądasz katalog: Growth, Ops, Admin. Każda kategoria to konkretne typy zadań, nie ogólniki.", icon: "🛍️" },
                { n: "02", title: "Zamawiasz pakiet", desc: "Gotowe pakiety z ceną i terminem — bez negocjacji, bez briefingu. Klikasz i potwierdzasz.", icon: "📦" },
                { n: "03", title: "Dostajesz efekt", desc: "Wykonawca dostarcza w ustalonym czasie. Sprawdzasz, akceptujesz lub prosisz o poprawkę.", icon: "🔄" },
                { n: "04", title: "Wracasz po kolejne", desc: "Zadanie zrobione, firma działa sprawniej. Wróć kiedy chcesz — bez onboardingu od zera.", icon: "⭐" },
              ],
            };
            return (
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {steps[activeModel].map((step, i) => (
                  <RevealOnScroll key={step.n} delay={i * 80}
                    className="relative bg-slate-50 rounded-2xl p-7 border border-slate-100 hover:border-[#7c8ef7]/40 hover:bg-white hover:shadow-xl transition-all group">
                    <div className="text-3xl mb-5">{step.icon}</div>
                    <div className="absolute top-6 right-6 text-5xl font-extrabold text-slate-100 group-hover:text-[#7c8ef7]/10 transition-colors leading-none select-none">
                      {step.n}
                    </div>
                    <h3 className="text-base font-bold text-[#0f2460] mb-2">{step.title}</h3>
                    <p className="text-sm text-slate-500 leading-relaxed">{step.desc}</p>
                    {i < 3 && (
                      <div className="hidden lg:block absolute top-1/2 -right-3 z-10 w-6 h-6 bg-white border border-slate-200 rounded-full flex items-center justify-center shadow-sm">
                        <ChevronRight className="w-3 h-3 text-[#7c8ef7]" />
                      </div>
                    )}
                  </RevealOnScroll>
                ))}
              </div>
            );
          })()}
        </div>
      </section>

      {/* ══════════════════════════════════════════
          SERVICES
      ══════════════════════════════════════════ */}
      <section id="uslugi" className="bg-slate-50 py-24 px-6">
        <div className="mx-auto max-w-7xl">
          <RevealOnScroll className="text-center mb-14">
            <p className="text-sm font-bold text-[#7c8ef7] uppercase tracking-widest mb-3">Katalog zadań</p>
            <h2 className="text-3xl md:text-5xl font-extrabold text-[#0f2460] mb-4">
              Co możesz{" "}
              <span className="relative inline-block">
                oddelegować?
                <span className="absolute -bottom-1 left-0 w-full h-1.5 bg-[#7c8ef7]/30 rounded-full" />
              </span>
            </h2>
            <p className="text-lg text-slate-500">Kliknij kategorię, żeby zobaczyć przykłady zadań i orientacyjne ceny</p>
          </RevealOnScroll>

          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-5 lg:grid-cols-4">
            {Object.keys(SERVICE_DATA).map((name, i) => (
              <RevealOnScroll key={name} delay={i * 40}>
                <ServiceDetailsModal name={name} />
              </RevealOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          TESTIMONIALS
      ══════════════════════════════════════════ */}
      <section id="opinie" className="bg-white py-24 px-6">
        <div className="mx-auto max-w-7xl">
          <RevealOnScroll className="text-center mb-16">
            <p className="text-sm font-bold text-[#7c8ef7] uppercase tracking-widest mb-3">Opinie klientów</p>
            <h2 className="text-3xl md:text-5xl font-extrabold text-[#0f2460] mb-4">
              Firmy, które{" "}
              <span className="relative inline-block">
                odzyskały czas.
                <span className="absolute -bottom-1 left-0 w-full h-1.5 bg-[#7c8ef7]/30 rounded-full" />
              </span>
            </h2>
            <p className="text-lg text-slate-500">Właściciele firm i managerowie, którzy przestali robić wszystko sami.</p>
          </RevealOnScroll>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { name: "Michał Nowak", role: "CEO · TechStart Sp. z o.o.", badge: "Founder", text: "Miałem backlog 20 zadań, które zalegały od miesięcy. Wrzuciłem je na Student2Work — połowa była gotowa w tydzień. Taniej niż agencja, szybciej niż rekrutacja." },
              { name: "Katarzyna Wiśniewska", role: "Operations Manager · 40-osobowa firma", badge: "Ops Manager", text: "Co tydzień wrzucam 3-4 zadania: research, aktualizacje CRM, prezentacje. Działa jak wewnętrzny team, bez kosztów etatu. Nie wyobrażam sobie powrotu do starego modelu." },
              { name: "Tomasz Lewandowski", role: "Head of Sales · SaaS B2B", badge: "Sales Lead", text: "Lead research był naszym bottleneckiem. Teraz mam kogoś kto buduje listy kontaktów — ja zamykam deale. ROI odczułem po pierwszym tygodniu." },
            ].map((t, i) => (
              <RevealOnScroll key={t.name} delay={i * 100}>
                <div className="bg-white rounded-2xl border border-slate-100 p-8 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all">
                  <div className="flex gap-1 mb-5">
                    {[1,2,3,4,5].map(s => <Star key={s} className="w-4 h-4 fill-amber-400 text-amber-400" />)}
                  </div>
                  <p className="text-slate-600 leading-relaxed mb-6 italic">"{t.text}"</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#0f2460] flex items-center justify-center text-white font-bold text-sm">
                        {t.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-bold text-sm text-[#0f2460]">{t.name}</div>
                        <div className="text-xs text-slate-400">{t.role}</div>
                      </div>
                    </div>
                    <span className={cn(
                      "text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full",
                      t.badge === "Firma" ? "bg-blue-50 text-blue-600" : "bg-purple-50 text-purple-600"
                    )}>
                      {t.badge}
                    </span>
                  </div>
                </div>
              </RevealOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          CTA
      ══════════════════════════════════════════ */}
      <section className="bg-[#0f2460] py-24 px-6 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#7c8ef7]/10 rounded-full blur-[120px]" />
          <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-blue-600/10 rounded-full blur-[80px]" />
        </div>
        <div className="relative z-10 mx-auto max-w-3xl text-center">
          <RevealOnScroll>
            <h2 className="text-3xl md:text-5xl font-extrabold text-white mb-6">
              Ogarniemy Twój chaos operacyjny.<br />
              <span className="text-[#7c8ef7]">W 24 godziny.</span>
            </h2>
            <p className="text-lg text-white/70 mb-10 max-w-xl mx-auto">
              Jedno zadanie. Bez rekrutacji, bez etatu, bez chaosu.
              Zacznij teraz — rejestracja zajmuje 2 minuty.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/auth?role=company">
                <Button className="h-14 rounded-full px-10 text-base font-bold bg-[#7c8ef7] hover:bg-[#6b7ff0] text-white shadow-xl shadow-indigo-500/30 transition-all hover:scale-105">
                  Deleguj pierwsze zadanie
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Link href="/auth?role=student">
                <Button variant="outline" className="h-14 rounded-full px-10 text-base font-bold border-white/20 text-white bg-white/5 hover:bg-white/10 transition-all">
                  Zacznij jako wykonawca
                </Button>
              </Link>
            </div>
            <p className="mt-8 text-white/40 text-sm">
              Bezpłatna rejestracja · Płatność dopiero po akceptacji · Bez ukrytych opłat
            </p>
          </RevealOnScroll>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          FOOTER
      ══════════════════════════════════════════ */}
      <footer className="bg-[#081840] px-6 py-14">
        <div className="mx-auto max-w-7xl">
          <div className="grid md:grid-cols-4 gap-10 mb-12">
            <div className="md:col-span-2">
              <div className="text-xl font-extrabold text-white mb-3">
                🎓 Student<span className="text-[#7c8ef7]">2</span>Work
              </div>
              <p className="text-white/50 text-sm leading-relaxed max-w-sm">
                Operacyjne wsparcie dla małych firm i managerów. Deleguj zadania bez etatu, bez rekrutacji, bez chaosu.
              </p>
            </div>
            <div>
              <div className="text-xs font-bold text-white/30 uppercase tracking-widest mb-4">Platforma</div>
              <ul className="space-y-3">
                {["Jak to działa", "Katalog usług", "Dla firm", "Dla studentów"].map(l => (
                  <li key={l}><a href="#" className="text-white/50 text-sm hover:text-white transition-colors">{l}</a></li>
                ))}
              </ul>
            </div>
            <div>
              <div className="text-xs font-bold text-white/30 uppercase tracking-widest mb-4">Prawne</div>
              <ul className="space-y-3">
                {["Regulamin", "Polityka prywatności", "Kontakt"].map(l => (
                  <li key={l}><a href="#" className="text-white/50 text-sm hover:text-white transition-colors">{l}</a></li>
                ))}
              </ul>
            </div>
          </div>
          <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-white/30 text-sm">© {new Date().getFullYear()} Student2Work. Wszelkie prawa zastrzeżone.</div>
            <div className="flex items-center gap-2 text-white/30 text-sm">
              <Shield className="w-4 h-4 text-green-400" />
              Płatności chronione systemem Escrow
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

// ── Service Modal ───────────────────────────────────────────────
function ServiceDetailsModal({ name }: { name: string }) {
  const data = SERVICE_DATA[name];
  const Icon = data.icon;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <div className="group cursor-pointer rounded-2xl border border-slate-200/70 bg-white p-6 text-center shadow-sm transition-all hover:-translate-y-1 hover:border-[#7c8ef7]/40 hover:shadow-xl">
          <div className="w-12 h-12 rounded-xl bg-[#0f2460]/5 flex items-center justify-center mx-auto mb-4 group-hover:bg-[#7c8ef7]/10 transition-colors">
            <Icon className="w-6 h-6 text-[#0f2460] group-hover:text-[#7c8ef7] transition-colors" />
          </div>
          <div className="font-bold text-sm text-[#0f2460] group-hover:text-[#7c8ef7] transition-colors leading-tight">{name}</div>
          <div className="mt-2 text-[10px] text-slate-400 font-medium">{data.stats.projects} projektów</div>
        </div>
      </DialogTrigger>
      <DialogContent className="max-w-2xl rounded-[2rem] border-none p-0 overflow-hidden">
        <div className="bg-[#0f2460] p-8 pb-6">
          <DialogHeader>
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center text-white">
                <Icon className="w-8 h-8" />
              </div>
              <div>
                <DialogTitle className="text-2xl font-extrabold text-white">{name}</DialogTitle>
                <div className="flex gap-1 mt-1">
                  {[1,2,3,4,5].map(s => <Star key={s} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />)}
                  <span className="text-white/60 text-xs ml-1">{data.stats.rating}</span>
                </div>
              </div>
            </div>
          </DialogHeader>
        </div>

        <div className="p-8 bg-white space-y-6">
          <p className="text-slate-600 leading-relaxed">{data.description}</p>

          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {[
              { label: "Cena", value: data.stats.price },
              { label: "Czas realizacji", value: data.stats.time },
              { label: "Projektów", value: data.stats.projects },
              { label: "Ocena", value: data.stats.rating },
            ].map(s => (
              <div key={s.label} className="bg-slate-50 rounded-xl p-4 text-center border border-slate-100">
                <div className="text-sm font-extrabold text-[#0f2460] mb-1">{s.value}</div>
                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{s.label}</div>
              </div>
            ))}
          </div>

          <div>
            <h4 className="font-bold text-[#0f2460] mb-3">Przykładowe projekty</h4>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {data.examples.map(ex => (
                <li key={ex} className="flex items-center gap-3 rounded-xl bg-slate-50 p-3 text-sm text-slate-600 hover:bg-[#7c8ef7]/5 transition-colors border border-transparent hover:border-[#7c8ef7]/20">
                  <CheckCircle2 className="w-4 h-4 text-[#7c8ef7] shrink-0" />
                  {ex}
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-xl border-l-4 border-[#7c8ef7] bg-[#7c8ef7]/5 p-5">
            <div className="font-bold text-[#0f2460] mb-1 text-sm">💡 Ciekawostka</div>
            <p className="text-sm text-slate-500">{data.funFact}</p>
          </div>

          <Link href="/auth?role=company">
            <Button className="w-full h-12 rounded-full bg-[#0f2460] hover:bg-[#1a3a8f] text-white font-bold shadow-lg transition-all hover:scale-[1.02]">
              Znajdź eksperta w tej kategorii
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </Link>
        </div>
      </DialogContent>
    </Dialog>
  );
}
