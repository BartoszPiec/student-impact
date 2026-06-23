import Link from "next/link";
import {
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
  Database,
  ArrowRight,
  Shield,
  Zap,
  Users,
  TrendingUp,
  Clock,
  BadgeCheck,
  Menu,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { HowItWorksSwitcher, ServiceDetailsModal } from "./landing-interactive";

// --- Types ---
interface ServiceData {
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  stats: { price: string; time: string; scope: string; mode: string };
  examples: string[];
  funFact: string;
}

// Task categories — 3 pillars: Growth / Ops / Admin
const SERVICE_DATA: Record<string, ServiceData> = {
  "Lead research": {
    icon: TrendingUp,
    description: "Budujesz pipeline, ale nie masz kto szukać kontaktów? Deleguj research leadów i wróć do sprzedaży.",
    stats: { price: "200-800 zł", time: "1-3 dni", scope: "bazy leadów", mode: "pilot" },
    examples: ["Listy firm wg ICP z LinkedIn", "Weryfikacja danych kontaktowych", "Research decydentów", "Budowanie baz w CRM", "Analiza konkurencji"],
    funFact: "Średnio 3 dni wystarczą na zbudowanie listy 200 kwalifikowanych leadów.",
  },
  "Prospecting i outreach": {
    icon: Users,
    description: "Przygotowanie materiałów do cold outreach, personalizacja wiadomości, sekwencje mailowe. Robota, której nikt nie lubi robić — ale musi być zrobiona.",
    stats: { price: "300-1200 zł", time: "2-5 dni", scope: "outreach", mode: "pilot" },
    examples: ["Personalizowane wiadomości cold mail", "Skrypty do cold calla", "Sekwencje follow-up", "Przygotowanie ofert handlowych", "Analiza odpowiedzi i optymalizacja"],
    funFact: "Dobrze przygotowany outreach otwiera 3× więcej rozmów niż szablonowe wiadomości.",
  },
  "Prezentacje i materiały": {
    icon: Palette,
    description: "Pitch deck, oferta handlowa, prezentacja dla zarządu. Masz treść, potrzebujesz kogoś kto to złoży profesjonalnie.",
    stats: { price: "300-1500 zł", time: "2-7 dni", scope: "prezentacje", mode: "pilot" },
    examples: ["Pitch deck dla inwestorów", "Prezentacje sprzedażowe", "Oferty handlowe PDF", "One-pagery produktowe", "Materiały onboardingowe"],
    funFact: "Profesjonalna prezentacja zwiększa szansę na zamknięcie deala o 35%.",
  },
  "Data entry i CRM": {
    icon: Database,
    description: "CRM zarasta, arkusze są chaotyczne, baza danych nieaktualna. To zadanie, które wraca do Ciebie co tydzień — i nie powinno.",
    stats: { price: "100-600 zł", time: "1-5 dni", scope: "CRM i dane", mode: "pilot" },
    examples: ["Czyszczenie i uzupełnianie CRM", "Import danych z arkuszy", "Deduplikacja bazy klientów", "Tagowanie i segmentacja", "Raportowanie z danych"],
    funFact: "Firmy tracą średnio 12h tygodniowo na ręczne zarządzanie danymi.",
  },
  "Content i social media": {
    icon: PenTool,
    description: "Potrzebujesz postów, artykułów, opisów. Regularny content — bez zatrudniania na etat.",
    stats: { price: "200-1000 zł", time: "2-10 dni", scope: "treści", mode: "pilot" },
    examples: ["Posty na LinkedIn / Instagram", "Artykuły blogowe SEO", "Newsletter firmowy", "Opisy produktów", "Skrypty do rolek i wideo"],
    funFact: "Firmy publikujące regularnie na LinkedIn generują 7× więcej zapytań.",
  },
  "Wsparcie operacyjne": {
    icon: Clipboard,
    description: "Zadania administracyjne, które blokują Twój czas. Wprowadź dane, odpisz na maile, przygotuj dokumenty — bez angażowania kluczowych ludzi.",
    stats: { price: "80-400 zł", time: "1-3 dni", scope: "operacje", mode: "pilot" },
    examples: ["Obsługa skrzynki mailowej", "Wprowadzanie danych i faktur", "Organizacja dokumentacji", "Transkrypcja i protokoły", "Zarządzanie kalendarzem"],
    funFact: "Właściciele firm odzyskują średnio 8h tygodniowo po delegowaniu zadań admin.",
  },
  "Strony i CMS": {
    icon: Globe,
    description: "Aktualizacje strony, uploady produktów, poprawki treści, nowe podstrony. Nie potrzebujesz agencji — potrzebujesz kogoś kto to ogarnie.",
    stats: { price: "200-1500 zł", time: "1-7 dni", scope: "CMS", mode: "pilot" },
    examples: ["Aktualizacje treści na stronie", "Upload produktów do sklepu", "Optymalizacja SEO on-page", "Tworzenie podstron w CMS", "Migracja treści"],
    funFact: "Strony aktualizowane co miesiąc generują 6× więcej ruchu organicznego.",
  },
  "Analiza i raporty": {
    icon: BarChart,
    description: "Masz dane, ale nikt ich nie czyta. Potrzebujesz dashboardu, raportu tygodniowego lub analizy rynku — bez angażowania analityka na etat.",
    stats: { price: "300-2000 zł", time: "2-7 dni", scope: "raporty", mode: "pilot" },
    examples: ["Dashboardy w Google Sheets / Excel", "Raporty sprzedażowe", "Analiza rynku i konkurencji", "Segmentacja klientów", "Wizualizacje danych"],
    funFact: "Firmy podejmujące decyzje na danych rosną 2× szybciej.",
  },
  "Wideo i multimedia": {
    icon: Video,
    description: "Masz nagrania, potrzebujesz efektu. Montaż, obróbka, reels, animacje — bez agencji kreatywnej.",
    stats: { price: "300-2000 zł", time: "3-10 dni", scope: "multimedia", mode: "pilot" },
    examples: ["Montaż wideo promocyjnych", "Reels i shorty na social", "Animacje prezentacji", "Obróbka zdjęć produktowych", "Napisy i subtitles"],
    funFact: "Posty wideo generują 49% więcej interakcji niż statyczne grafiki.",
  },
  "Programowanie i IT": {
    icon: Code,
    description: "Skrypt, integracja, automatyzacja, mały serwis. Zadania IT które nie uzasadniają zatrudniania dewelopera — ale muszą być zrobione.",
    stats: { price: "500-5000 zł", time: "3-14 dni", scope: "automatyzacje", mode: "pilot" },
    examples: ["Automatyzacja powtarzalnych procesów", "Integracje API / Zapier", "Skrypty w Python / Excel", "Małe aplikacje webowe", "Poprawki na stronie"],
    funFact: "Automatyzacja jednego powtarzalnego procesu oszczędza średnio 5h tygodniowo.",
  },
  "Tłumaczenia": {
    icon: Languages,
    description: "Materiały do wysyłki za granicę, umowy, strona w obcym języku. Szybko, bez agencji tłumaczeniowej.",
    stats: { price: "50-500 zł", time: "1-5 dni", scope: "lokalizacja", mode: "pilot" },
    examples: ["Tłumaczenia ofert i umów", "Lokalizacja strony www", "Materiały marketingowe EN/DE/ES", "Korespondencja handlowa", "Podtytuły do wideo"],
    funFact: "Materiały w języku klienta zwiększają konwersję o 70%.",
  },
  "Automatyzacje AI": {
    icon: Bot,
    description: "Chcesz wdrożyć AI ale nie wiesz od czego zacząć? Chatbot, automatyczny raport, asystent mailowy — konkretne wdrożenia, nie konsulting.",
    stats: { price: "500-3000 zł", time: "3-14 dni", scope: "AI w ops", mode: "pilot" },
    examples: ["Chatbot na stronie / w CRM", "Automatyzacja z GPT w procesach", "Asystent mailowy AI", "Generowanie raportów AI", "Skróty i automatyczne podsumowania"],
    funFact: "Firmy wdrażające AI w Ops oszczędzają średnio 15h/tydzień.",
  },
};

function RevealOnScroll({ children, className }: { children: React.ReactNode; className?: string; delay?: number }) {
  return (
    <div className={className}>
      {children}
    </div>
  );
}

export default function LandingPage() {
  const navLinks = [
    { label: "Jak to działa", href: "#jak-dziala" },
    { label: "Zadania", href: "#usługi" },
    { label: "Dla kogo", href: "#dla-firm" },
    { label: "Opinie", href: "#opinie" },
  ];

  return (
    <div className="min-h-screen bg-white font-sans text-[#1a1a2e] overflow-x-hidden">

      {/* ══════════════════════════════════════════
          NAVIGATION
      ══════════════════════════════════════════ */}
      <nav className="fixed top-0 z-50 w-full bg-[#0f2460]/95 backdrop-blur-xl border-b border-white/10">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 sm:py-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 text-lg font-extrabold text-white sm:text-xl">
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
              <Button className="rounded-full px-6 bg-[#5367d9] hover:bg-[#4658c7] text-white font-bold shadow-lg shadow-indigo-500/20 transition-all hover:scale-105">
                Deleguj pierwsze zadanie
              </Button>
            </Link>
          </div>

          {/* Mobile menu */}
          <details className="group md:hidden">
            <summary
              aria-controls="mobile-navigation"
              className="relative z-10 flex cursor-pointer list-none rounded-xl p-2 text-white hover:bg-white/10 [&::-webkit-details-marker]:hidden"
            >
              <span className="sr-only">Otwórz menu</span>
              <Menu className="h-6 w-6 group-open:hidden" />
              <X className="hidden h-6 w-6 group-open:block" />
            </summary>
            <div
              id="mobile-navigation"
              className="fixed left-0 right-0 top-[64px] z-50 space-y-4 border-t border-white/10 bg-[#0f2460] px-4 py-4 shadow-2xl sm:px-6 md:hidden"
            >
              {navLinks.map(link => (
                <a key={link.label} href={link.href} className="block text-white/80 font-semibold py-2">
                  {link.label}
                </a>
              ))}
              <div className="flex flex-col gap-3 pt-2">
                <Link href="/auth"><Button variant="outline" className="w-full border-white/20 text-white rounded-full">Zaloguj się</Button></Link>
                <Link href="/auth?role=company"><Button className="w-full bg-[#5367d9] text-white rounded-full font-bold">Zatrudnij studenta</Button></Link>
              </div>
            </div>
          </details>
        </div>
      </nav>

      <main>

      {/* ══════════════════════════════════════════
          HERO
      ══════════════════════════════════════════ */}
      <section className="relative flex overflow-hidden bg-[#0f2460] pt-16 md:min-h-[100svh] md:items-center md:pt-20">
        {/* Background decor */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[#7c8ef7]/10 rounded-full blur-[120px]" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-600/10 rounded-full blur-[100px]" />
          {/* Grid lines */}
          <div className="absolute inset-0 opacity-[0.04]"
            style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
        </div>

        <div className="relative z-10 mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 sm:py-24 lg:py-32">
          <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
            {/* Left: text */}
            <div>
              <RevealOnScroll>
                <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#7c8ef7]/30 bg-[#7c8ef7]/10 px-3 py-1.5 text-xs font-semibold text-[#a5b4fc] sm:mb-8 sm:px-4 sm:text-sm">
                  <Zap className="w-4 h-4" />
                  Dla właścicieli firm, founderów i managerów
                </div>
              </RevealOnScroll>

              <RevealOnScroll delay={100}>
                <h1 className="mb-5 text-[2.15rem] font-extrabold leading-[1.08] text-white sm:mb-6 sm:text-5xl lg:text-6xl">
                  Deleguj zadania,{" "}
                  tam gdzie nie opłaca się{" "}
                  <span className="relative inline-block">
                    <span className="text-[#7c8ef7]">zatrudniać.</span>
                    <span className="absolute -bottom-1 left-0 w-full h-1 bg-[#7c8ef7]/40 rounded-full" />
                  </span>
                </h1>
              </RevealOnScroll>

              <RevealOnScroll delay={200}>
                <p className="mb-7 max-w-xl text-base leading-7 text-white/70 sm:hidden">
                  Wrzucasz zadanie, student je realizuje, a płatność czeka bezpiecznie w Escrow do akceptacji efektu.
                </p>
                <p className="mb-7 hidden max-w-xl text-base leading-7 text-white/70 sm:mb-10 sm:block sm:text-lg sm:leading-relaxed">
                  Masz zadanie → wrzucasz → ktoś kompetentny robi.
                  Szybko, bez etatu, bez rekrutacji, bez chaosu.
                  Dodatkowe ręce do pracy wtedy, kiedy ich potrzebujesz.
                </p>
              </RevealOnScroll>

              <RevealOnScroll delay={300}>
                <div className="mb-8 flex flex-col gap-3 sm:mb-12 sm:flex-row sm:flex-wrap sm:gap-4">
                  <Link href="/auth?role=company" className="w-full sm:w-auto">
                    <Button className="h-12 w-full rounded-full bg-[#5367d9] px-6 text-base font-bold text-white shadow-xl shadow-indigo-500/30 transition-all hover:scale-105 hover:bg-[#4658c7] sm:h-14 sm:w-auto sm:px-8">
                      Deleguj pierwsze zadanie
                      <ArrowRight className="ml-2 w-5 h-5" />
                    </Button>
                  </Link>
                  <Link href="/auth?role=student" className="w-full sm:w-auto">
                    <Button variant="outline" className="h-12 w-full rounded-full border-white/20 bg-white/5 px-6 text-base font-bold text-white transition-all hover:bg-white/10 sm:h-14 sm:w-auto sm:px-8">
                      Zacznij jako student
                    </Button>
                  </Link>
                </div>
              </RevealOnScroll>

              <RevealOnScroll delay={400}>
                <div className="flex flex-col gap-3 text-sm text-white/50 sm:flex-row sm:flex-wrap sm:items-center sm:gap-6">
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
                <div className="mt-7 rounded-[1.5rem] border border-white/10 bg-white/10 p-4 shadow-2xl shadow-indigo-950/20 backdrop-blur-xl lg:hidden">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="rounded-full bg-[#7c8ef7]/20 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-[#c7d2fe]">
                      Przykład zadania
                    </span>
                    <span className="text-sm font-black text-white">450 zł</span>
                  </div>
                  <div className="text-sm font-black leading-snug text-white">
                    Research 80 firm do kampanii B2B
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-2 text-center text-[10px] font-bold text-white/60">
                    <div className="rounded-xl bg-white/5 px-2 py-2">24h start</div>
                    <div className="rounded-xl bg-white/5 px-2 py-2">Escrow</div>
                    <div className="rounded-xl bg-white/5 px-2 py-2">PDF umowy</div>
                  </div>
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
                  <BadgeCheck className="w-3.5 h-3.5 text-[#7c8ef7]" /> Umowy i płatność w jednym procesie
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

      </main>

      {/* ══════════════════════════════════════════
          TRUST BAR / STATS
      ══════════════════════════════════════════ */}
      <section className="bg-white py-16 px-6">
        <div className="mx-auto max-w-7xl">
          <p className="text-center text-sm font-bold text-slate-600 uppercase tracking-widest mb-10">
            Proces przygotowany pod pilotaż
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: "⚡", value: "Brief", label: "Jedno miejsce na zadanie", sub: "Firma opisuje zakres, budżet i oczekiwany efekt." },
              { icon: "🛡️", value: "Escrow", label: "Płatność pod kontrolą", sub: "Rozliczenie przechodzi przez proces akceptacji pracy." },
              { icon: "📄", value: "Umowy A/B", label: "Formalności w flow", sub: "Współpraca jest prowadzona przez Student Impact." },
            ].map((stat, i) => (
              <RevealOnScroll key={stat.label} delay={i * 80}
                className="text-center p-6 rounded-2xl border border-slate-100 bg-slate-50/50 hover:border-[#7c8ef7]/30 hover:shadow-lg transition-all">
                <div className="text-3xl mb-3">{stat.icon}</div>
                <div className="text-3xl font-extrabold text-[#0f2460] mb-1">{stat.value}</div>
                <div className="text-sm font-bold text-slate-700 mb-0.5">{stat.label}</div>
                <div className="text-xs text-slate-600">{stat.sub}</div>
              </RevealOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          FOR COMPANIES — VALUE PROPS
      ══════════════════════════════════════════ */}
      <section id="dla-firm" className="bg-slate-50 px-4 py-16 sm:px-6 sm:py-24">
        <div className="mx-auto max-w-7xl">
          <RevealOnScroll className="mb-10 text-center sm:mb-16">
            <p className="text-sm font-bold text-[#5367d9] uppercase tracking-widest mb-3">Dla kogo jest Student2Work?</p>
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

          <div className="grid gap-5 md:grid-cols-3 md:gap-8">
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
                desc: "Każdy wykonawca ma profil, opis kompetencji i zakres usług. Wybierasz osobę dopasowaną do zadania.",
              },
              {
                icon: TrendingUp,
                color: "bg-teal-50 text-teal-600",
                title: "Taniej niż agencja, szybciej niż etat",
                desc: "Projekty kosztują 40–70% mniej niż agencja. Bez briefingów, bez account managerów, bez czekania tygodniami.",
              },
            ].map((item, i) => (
              <RevealOnScroll key={item.title} delay={i * 80}
                className="group rounded-2xl border border-slate-100 bg-white p-5 transition-all hover:border-[#7c8ef7]/30 hover:shadow-xl sm:p-8">
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
      <section id="jak-dziala" className="bg-white px-4 py-16 sm:px-6 sm:py-24">
        <div className="mx-auto max-w-7xl">
          <RevealOnScroll className="mb-10 text-center sm:mb-12">
            <p className="text-sm font-bold text-[#5367d9] uppercase tracking-widest mb-3">Jak to działa</p>
            <h2 className="text-3xl md:text-5xl font-extrabold text-[#0f2460] mb-4">
              Prosto jak{" "}
              <span className="relative inline-block">
                powinno być.
                <span className="absolute -bottom-1 left-0 w-full h-1.5 bg-[#7c8ef7]/30 rounded-full" />
              </span>
            </h2>
            <p className="text-lg text-slate-500">Masz zadanie → wrzucasz → ktoś kompetentny robi. Wybierz model współpracy.</p>
          </RevealOnScroll>

          <HowItWorksSwitcher />
        </div>
      </section>

      {/* ══════════════════════════════════════════
          SERVICES
      ══════════════════════════════════════════ */}
      <section id="usługi" className="bg-slate-50 px-4 py-16 sm:px-6 sm:py-24">
        <div className="mx-auto max-w-7xl">
          <RevealOnScroll className="mb-10 text-center sm:mb-14">
            <p className="text-sm font-bold text-[#5367d9] uppercase tracking-widest mb-3">Katalog zadań</p>
            <h2 className="text-3xl md:text-5xl font-extrabold text-[#0f2460] mb-4">
              Co możesz{" "}
              <span className="relative inline-block">
                oddelegować?
                <span className="absolute -bottom-1 left-0 w-full h-1.5 bg-[#7c8ef7]/30 rounded-full" />
              </span>
            </h2>
            <p className="text-lg text-slate-500">Kliknij kategorię, żeby zobaczyć przykłady zadań i orientacyjne ceny</p>
          </RevealOnScroll>

          <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 md:gap-5 lg:grid-cols-4">
            {Object.entries(SERVICE_DATA).map(([name, data], index) => (
              <RevealOnScroll key={name} delay={index * 40}>
                <ServiceDetailsModal
                  name={name}
                  data={{
                    description: data.description,
                    stats: data.stats,
                    examples: data.examples,
                    funFact: data.funFact,
                  }}
                />
              </RevealOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          TESTIMONIALS
      ══════════════════════════════════════════ */}
      <section id="opinie" className="bg-white px-4 py-16 sm:px-6 sm:py-24">
        <div className="mx-auto max-w-7xl">
          <RevealOnScroll className="mb-10 text-center sm:mb-16">
            <p className="text-sm font-bold text-[#5367d9] uppercase tracking-widest mb-3">Opinie klientów</p>
            <h2 className="text-3xl md:text-5xl font-extrabold text-[#0f2460] mb-4">
              Firmy, które{" "}
              <span className="relative inline-block">
                odzyskały czas.
                <span className="absolute -bottom-1 left-0 w-full h-1.5 bg-[#7c8ef7]/30 rounded-full" />
              </span>
            </h2>
            <p className="text-lg text-slate-500">Właściciele firm i managerowie, którzy przestali robić wszystko sami.</p>
          </RevealOnScroll>

          <div className="grid gap-5 md:grid-cols-3 md:gap-8">
            {[
              { name: "Michał Nowak", role: "CEO · TechStart Sp. z o.o.", badge: "Founder", text: "Miałem backlog 20 zadań, które zalegały od miesięcy. Wrzuciłem je na Student2Work — połowa była gotowa w tydzień. Taniej niż agencja, szybciej niż rekrutacja." },
              { name: "Katarzyna Wiśniewska", role: "Operations Manager · 40-osobowa firma", badge: "Ops Manager", text: "Co tydzień wrzucam 3-4 zadania: research, aktualizacje CRM, prezentacje. Działa jak wewnętrzny team, bez kosztów etatu. Nie wyobrażam sobie powrotu do starego modelu." },
              { name: "Tomasz Lewandowski", role: "Head of Sales · SaaS B2B", badge: "Sales Lead", text: "Lead research był naszym bottleneckiem. Teraz mam kogoś kto buduje listy kontaktów — ja zamykam deale. ROI odczułem po pierwszym tygodniu." },
            ].map((t, i) => (
              <RevealOnScroll key={t.name} delay={i * 100}>
                <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl sm:p-8">
                  <div className="flex gap-1 mb-5">
                    {[1,2,3,4,5].map(s => <Star key={s} className="w-4 h-4 fill-amber-400 text-amber-400" />)}
                  </div>
                  <p className="mb-6 leading-relaxed text-slate-600 italic">&quot;{t.text}&quot;</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#0f2460] flex items-center justify-center text-white font-bold text-sm">
                        {t.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-bold text-sm text-[#0f2460]">{t.name}</div>
                        <div className="text-xs text-slate-600">{t.role}</div>
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
      <section className="relative overflow-hidden bg-[#0f2460] px-4 py-16 sm:px-6 sm:py-24">
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
            <div className="flex flex-col justify-center gap-3 sm:flex-row sm:flex-wrap sm:gap-4">
              <Link href="/auth?role=company" className="w-full sm:w-auto">
                <Button className="h-12 w-full rounded-full bg-[#5367d9] px-6 text-base font-bold text-white shadow-xl shadow-indigo-500/30 transition-all hover:scale-105 hover:bg-[#4658c7] sm:h-14 sm:w-auto sm:px-10">
                  Deleguj pierwsze zadanie
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Link href="/auth?role=student" className="w-full sm:w-auto">
                <Button variant="outline" className="h-12 w-full rounded-full border-white/20 bg-white/5 px-6 text-base font-bold text-white transition-all hover:bg-white/10 sm:h-14 sm:w-auto sm:px-10">
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
      <footer className="bg-[#081840] px-4 py-12 sm:px-6 sm:py-14">
        <div className="mx-auto max-w-7xl">
          <div className="mb-10 grid gap-8 md:mb-12 md:grid-cols-4 md:gap-10">
            <div className="md:col-span-2">
              <div className="text-xl font-extrabold text-white mb-3">
                🎓 Student<span className="text-[#7c8ef7]">2</span>Work
              </div>
              <p className="text-white/50 text-sm leading-relaxed max-w-sm">
                Operacyjne wsparcie dla małych firm i managerów. Deleguj zadania bez etatu, bez rekrutacji, bez chaosu.
              </p>
            </div>
            <div>
              <div className="text-xs font-bold text-white/60 uppercase tracking-widest mb-4">Platforma</div>
              <ul className="space-y-3">
                {["Jak to działa", "Katalog usług", "Dla firm", "Dla studentów"].map(l => (
                  <li key={l}><a href="#" className="text-white/50 text-sm hover:text-white transition-colors">{l}</a></li>
                ))}
              </ul>
            </div>
            <div>
              <div className="text-xs font-bold text-white/60 uppercase tracking-widest mb-4">Prawne</div>
              <ul className="space-y-3">
                {["Regulamin", "Polityka prywatności", "Kontakt"].map(l => (
                  <li key={l}><a href="#" className="text-white/50 text-sm hover:text-white transition-colors">{l}</a></li>
                ))}
              </ul>
            </div>
          </div>
          <div className="flex flex-col items-start justify-between gap-4 border-t border-white/10 pt-8 md:flex-row md:items-center">
            <div className="text-white/60 text-sm">© {new Date().getFullYear()} Student2Work. Wszelkie prawa zastrzeżone.</div>
            <div className="flex items-center gap-2 text-white/60 text-sm">
              <Shield className="w-4 h-4 text-green-400" />
              Płatności chronione systemem Escrow
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
