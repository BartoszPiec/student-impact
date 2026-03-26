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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

// --- Types ---
interface ServiceData {
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  stats: {
    price: string;
    time: string;
    projects: string;
    rating: string;
  };
  examples: string[];
  funFact: string;
}

const SERVICE_DATA: Record<string, ServiceData> = {
  'Serwisy internetowe': {
    icon: Globe,
    description: 'Profesjonalne strony internetowe i aplikacje webowe tworzone przez studentów IT i designu. Od landing page\'ów po złożone systemy e-commerce.',
    stats: { price: '500-5000 zł', time: '1-4 tygodnie', projects: '340+', rating: '4.8/5' },
    examples: ['Landing pages dla startupów', 'Strony wizytówki firm', 'Sklepy internetowe (e-commerce)', 'Systemy CMS i blogi', 'Aplikacje webowe SaaS'],
    funFact: 'Czy wiesz, że 67% naszych studentów IT tworzy strony w React i Vue.js? To te same technologie, których używają Google i Facebook!'
  },
  'Multimedia': {
    icon: Video,
    description: 'Montaż wideo, animacje, produkcja audio i grafika ruchoma. Studenci z kierunków multimedia tworzą profesjonalne treści wizualne i dźwiękowe.',
    stats: { price: '300-3000 zł', time: '3-14 dni', projects: '280+', rating: '4.9/5' },
    examples: ['Montaż filmów promocyjnych', 'Animacje 2D i 3D', 'Produkcja podcastów', 'Motion graphics', 'Obróbka zdjęć produktowych'],
    funFact: 'Studenci z naszej platformy zmontowali już ponad 500 godzin materiału wideo! To więcej niż cała seria Breaking Bad.'
  },
  'Programowanie i IT': {
    icon: Code,
    description: 'Od aplikacji mobilnych po systemy backendowe. Studenci informatyki tworzą rozwiązania w Python, Java, JavaScript, C# i wielu innych technologiach.',
    stats: { price: '1000-10000 zł', time: '2-8 tygodni', projects: '520+', rating: '4.7/5' },
    examples: ['Aplikacje mobilne (iOS/Android)', 'Systemy backendowe i API', 'Automatyzacja procesów', 'Integracje z systemami zewnętrznymi', 'Skrypty i narzędzia deweloperskie'],
    funFact: 'Najczęściej wybierany język? Python! 42% projektów programistycznych wykorzystuje właśnie ten język.'
  },
  'Marketing': {
    icon: BarChart,
    description: 'Kampanie w social media, SEO, content marketing i analityka. Studenci marketingu pomagają firmom dotrzeć do swojej grupy docelowej.',
    stats: { price: '400-4000 zł', time: '1-6 tygodni', projects: '390+', rating: '4.8/5' },
    examples: ['Kampanie w social media', 'Optymalizacja SEO', 'Email marketing', 'Analityka i raporty', 'Strategie content marketingu'],
    funFact: 'Nasze kampanie social media wygenerowały łącznie ponad 2 miliony wyświetleń! Studenci znają trendy lepiej niż ktokolwiek.'
  },
  'Design': {
    icon: Palette,
    description: 'UI/UX design, branding, identyfikacja wizualna i grafika użytkowa. Studenci ASP i projektowania tworzą estetyczne i funkcjonalne projekty.',
    stats: { price: '300-5000 zł', time: '1-4 tygodnie', projects: '450+', rating: '4.9/5' },
    examples: ['Projekty UI/UX aplikacji', 'Logo i identyfikacja wizualna', 'Materiały marketingowe', 'Projekty opakowań', 'Ilustracje i grafiki'],
    funFact: 'Portfolio studentów designu zawiera już ponad 2000 projektów! Średnio każdy designer ma 4-5 zrealizowanych projektów.'
  },
  'Tłumaczenia': {
    icon: Languages,
    description: 'Tłumaczenia pisemne i ustne w ponad 20 językach. Studenci filologii tłumaczą dokumenty biznesowe, strony www, materiały marketingowe i więcej.',
    stats: { price: '50-500 zł', time: '1-7 dni', projects: '670+', rating: '4.9/5' },
    examples: ['Tłumaczenia stron internetowych', 'Dokumenty biznesowe', 'Materiały marketingowe', 'Podtytuły do wideo', 'Lokalizacja aplikacji'],
    funFact: 'Najczęściej tłumaczone języki to angielski, niemiecki i hiszpański. Ale mamy też studentów znających norweski, japoński i hindi!'
  },
  'Prace biurowe': {
    icon: Clipboard,
    description: 'Wsparcie administracyjne, wprowadzanie danych, obsługa korespondencji i organizacja. Studenci pomagają w codziennych zadaniach biurowych.',
    stats: { price: '30-300 zł', time: '1-5 dni', projects: '540+', rating: '4.7/5' },
    examples: ['Wprowadzanie danych do systemów', 'Obsługa mailingu', 'Przygotowanie prezentacji', 'Transkrypcja nagrań', 'Zarządzanie kalendarzem'],
    funFact: 'Studenci wprowadzili już ponad 500,000 wpisów danych! To jak wypełnienie 10,000 arkuszy Excela.'
  },
  'Copywriting': {
    icon: PenTool,
    description: 'Tworzenie angażujących treści: artykuły blogowe, teksty sprzedażowe, opisy produktów. Studenci dziennikarstwa i marketingu piszą content, który sprzedaje.',
    stats: { price: '100-1000 zł', time: '2-10 dni', projects: '410+', rating: '4.8/5' },
    examples: ['Artykuły blogowe (SEO)', 'Opisy produktów e-commerce', 'Teksty landing pages', 'Posty w social media', 'Scenariusze video'],
    funFact: 'Nasi copywriterzy napisali już ponad 1 milion słów! To więcej niż trylogia Władcy Pierścieni i Harry Potter razem wzięte.'
  },
  'Usprawnienia AI': {
    icon: Bot,
    description: 'Implementacja AI w biznesie: chatboty, automatyzacja z GPT, analiza danych AI, ML models. Studenci AI pomagają firmom wejść w erę sztucznej inteligencji.',
    stats: { price: '800-8000 zł', time: '1-6 tygodni', projects: '180+', rating: '4.9/5' },
    examples: ['Chatboty i asystenci AI', 'Automatyzacja procesów z GPT', 'Analiza danych z ML', 'Systemy rekomendacji', 'Przetwarzanie języka naturalnego'],
    funFact: 'AI to najszybciej rosnąca kategoria! W 2025 liczba projektów wzrosła o 340% w porównaniu do 2024.'
  },
  'Prawo': {
    icon: Scale,
    description: 'Konsultacje prawne, przegląd umów, pomoc w rejestracji działalności. Studenci prawa pomagają małym firmom i startupom w kwestiach prawnych.',
    stats: { price: '200-2000 zł', time: '1-14 dni', projects: '150+', rating: '4.7/5' },
    examples: ['Przegląd umów handlowych', 'Regulaminy i polityki prywatności', 'Pomoc w rejestracji firmy', 'Konsultacje prawne', 'Drafting dokumentów'],
    funFact: 'Studenci prawa przejrzeli już ponad 800 umów! Średni czas odpowiedzi? Tylko 24 godziny.'
  },
  'Analiza danych': {
    icon: Database,
    description: 'Analiza biznesowa, wizualizacje danych, dashboardy, predykcje. Studenci data science przekształcają surowe dane w wartościowe insights.',
    stats: { price: '500-5000 zł', time: '1-4 tygodnie', projects: '230+', rating: '4.8/5' },
    examples: ['Dashboardy i raporty', 'Analiza sprzedaży', 'Segmentacja klientów', 'Modele predykcyjne', 'Wizualizacje danych'],
    funFact: 'Studenci przeanalizowali już ponad 50 milionów rekordów danych! Najczęściej używane narzędzia to Python, R i Power BI.'
  },
  'Inne prace': {
    icon: Sparkles,
    description: 'Nie znalazłeś swojej kategorii? Na platformie znajdziesz też: coaching, konsulting, research, event management i wiele więcej!',
    stats: { price: '100-3000 zł', time: '1-30 dni', projects: '320+', rating: '4.8/5' },
    examples: ['Research i ankiety', 'Konsulting biznesowy', 'Event management', 'Tutoring i edukacja', 'Wsparcie w projektach naukowych'],
    funFact: 'Ta kategoria to prawdziwa skarbnica! Od planowania eventów po pomoc w pisaniu prac naukowych - studenci mają różnorodne talenty.'
  }
};

// --- Components ---

function AnimatedCounter({ value }: { value: string }) {
  const isDecimal = value.includes('.');
  const numericValue = parseFloat(value.replace(/[^0-9.]/g, ''));
  const suffix = value.replace(/[0-9.]/g, '');

  return (
    <span className="stat-number">
      {isDecimal ? numericValue.toFixed(1) : Math.floor(numericValue).toLocaleString('pl-PL')}
      {suffix}
    </span>
  );
}

function RevealOnScroll({ children, className }: { children: React.ReactNode, className?: string }) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsVisible(true);
        observer.unobserve(entry.target);
      }
    }, { threshold: 0.15 });

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className={cn("transition-all duration-1000", isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12", className)}>
      {children}
    </div>
  );
}

export default function LandingPage() {
  const [activeModel, setActiveModel] = useState<"standard" | "longterm" | "services">("standard");
  const collaborationModels: Array<{
    id: string;
    label: string;
    value: "standard" | "longterm" | "services";
  }> = [
    { id: "standard", label: "📋 Zlecenie jednorazowe", value: "standard" },
    { id: "longterm", label: "🤝 Współpraca długoterminowa", value: "longterm" },
    { id: "services", label: "💼 Usługi studentów", value: "services" },
  ];

  return (
    <div className="min-h-screen bg-white font-sans text-[#1a1a2e] overflow-x-hidden">

      {/* --- NAVIGATION --- */}
      <nav className="fixed top-0 z-50 w-full border-b border-slate-200/60 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-[2000px] items-center justify-between px-[5%] py-4">
          <div className="text-xl font-bold gradient-text md:text-2xl">
            <Link href="/">🎓 Student2Work</Link>
          </div>
          <div className="flex gap-2 md:gap-4">
            <Link href="/auth">
              <Button variant="outline" className="rounded-full border-[#667eea]/40 bg-white/80 px-4 text-[#667eea] transition-all hover:bg-[#667eea] hover:text-white md:px-6">
                Logowanie
              </Button>
            </Link>
            <Link href="/auth?role=student">
              <Button className="rounded-full px-4 text-white shadow-primary transition-all hover:shadow-primary-lg md:px-6 gradient-primary">
                Dołącz teraz
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* --- HERO SECTION --- */}
      <section className="relative min-h-[90vh] flex items-center bg-gradient-to-br from-[#f5f7fa] to-[#c3cfe2] px-[5%] py-24 overflow-hidden">
        {/* Floating Shapes */}
        <div className="absolute top-[10%] left-[5%] w-24 h-24 opacity-10 pointer-events-none animate-rotate-slow">
          <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
            <path fill="#667eea" d="M44.7,-76.4C58.8,-69.2,71.8,-59.1,79.6,-45.8C87.4,-32.6,90,-16.3,88.5,-0.9C87,14.6,81.4,29.2,73.1,42.8C64.8,56.4,53.8,69,40.1,76.3C26.4,83.6,10,85.6,-6.1,85.1C-22.2,84.6,-38.1,81.6,-52.4,74.8C-66.7,68,-79.4,57.4,-86.8,43.8C-94.2,30.2,-96.3,13.6,-94.1,-2.3C-91.9,-18.2,-85.4,-33.4,-76.2,-46.8C-67,-60.2,-55.1,-71.8,-41.3,-79.2C-27.5,-86.6,-12.1,-89.8,2.4,-93.9C16.9,-98,30.6,-83.6,44.7,-76.4Z" transform="translate(100 100)" />
          </svg>
        </div>
        <div className="absolute top-[60%] right-[8%] w-36 h-36 opacity-10 pointer-events-none animate-rotate-slow-reverse">
          <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
            <path fill="#764ba2" d="M39.5,-65.6C51.4,-58.3,61.4,-47.5,68.5,-35.1C75.6,-22.7,79.8,-8.7,79.3,5.1C78.8,18.9,73.6,32.5,65.4,44.3C57.2,56.1,46,66.1,33.2,71.8C20.4,77.5,6,78.9,-8.7,78.1C-23.4,77.3,-38.4,74.3,-51.2,67.5C-64,60.7,-74.6,50.1,-80.8,37.4C-87,24.7,-88.8,10,-85.9,-3.7C-83,-17.4,-75.4,-30.1,-66.4,-41.3C-57.4,-52.5,-47,-62.2,-34.8,-69.3C-22.6,-76.4,-8.8,-80.9,3.5,-86.7C15.8,-92.5,27.6,-72.9,39.5,-65.6Z" transform="translate(100 100)" />
          </svg>
        </div>

        <div className="relative z-10 mx-auto w-full max-w-[2000px] text-center">
          <RevealOnScroll className="mb-8 inline-block rounded-full border border-white/70 bg-white/90 px-6 py-2 text-sm font-bold text-[#667eea] shadow-soft">
            <span className="text-[#667eea] mr-2">●</span> Nowa era pracy dla studentów
          </RevealOnScroll>

          <RevealOnScroll className="mx-auto max-w-5xl">
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold leading-[1.1] mb-6">
              Połącz ambicję<br />
              <span className="gradient-text">z realnym biznesem</span>
            </h1>
            <p className="mx-auto mb-10 max-w-3xl text-lg leading-relaxed text-[#4f5b77] md:text-xl">
              Platforma, która zmienia zasady gry. Studenci zdobywają doświadczenie w komercyjnych projektach,
              a firmy zyskują dostęp do świeżych talentów.
            </p>
          </RevealOnScroll>

          <RevealOnScroll className="flex flex-wrap justify-center gap-4">
            <Link href="/auth?role=student">
              <Button className="h-14 rounded-full px-10 text-lg font-bold text-white shadow-primary animate-in zoom-in-50 duration-500 gradient-primary">
                Zacznij jako Student →
              </Button>
            </Link>
            <Link href="/auth?role=company">
              <Button variant="outline" className="h-14 rounded-full border-[#667eea]/30 bg-white/90 px-10 text-lg font-bold text-[#667eea] hover:bg-white">
                Zatrudnij Studenta
              </Button>
            </Link>
          </RevealOnScroll>
        </div>

        {/* Decorative Gradients */}
        <div className="absolute -top-20 -right-20 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[100px] animate-pulse" />
        <div className="absolute -bottom-20 -left-20 w-[300px] h-[300px] bg-purple-500/10 rounded-full blur-[80px] animate-pulse delay-1000" />
      </section>

      {/* --- STATS SECTION --- */}
      <section className="bg-white px-[5%] py-20">
        <div className="mx-auto grid w-full max-w-[2000px] grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard icon="🎓" label="Aktywnych studentów" sublabel="+234 w tym miesiącu" value="2847" />
          <StatCard icon="🏢" label="Firm partnerskich" sublabel="Z różnych branż" value="512" />
          <StatCard icon="✅" label="Zrealizowanych projektów" sublabel="Wartość 2.4M PLN" value="1429" />
          <StatCard icon="⭐" label="Średnia ocena" sublabel="Ponad 800 opinii" value="4.9" />
        </div>
      </section>

      {/* --- JOURNEY SECTION --- */}
      <section className="py-24 px-[5%] bg-white border-t border-slate-100">
        <div className="w-full max-w-[2000px] mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">Jak działa <span className="gradient-text">współpraca?</span></h2>
            <p className="text-lg text-[#5a5a7a]">Wybierz model współpracy dopasowany do Twoich potrzeb</p>
          </div>

          {/* Model Switcher */}
          <div className="mb-16 flex flex-wrap justify-center gap-4 rounded-full bg-slate-50/80 p-2 shadow-inner">
            {collaborationModels.map((m) => (
              <button
                key={m.id}
                onClick={() => setActiveModel(m.value)}
                className={cn(
                  "rounded-full border-2 px-6 py-3 text-sm font-bold transition-all",
                  activeModel === m.value
                    ? "border-transparent text-white shadow-md gradient-primary"
                    : "border-transparent bg-transparent text-[#5a5a7a] hover:bg-white hover:text-[#667eea]"
                )}
              >
                {m.label}
              </button>
            ))}
          </div>

          {/* Timeline Content */}
          <div className="relative">
            {/* Central Line (Desktop) */}
            <div className="absolute bottom-0 left-1/2 top-0 z-0 hidden w-1 -translate-x-[-50%] bg-gradient-to-b from-[#667eea] to-[#764ba2] lg:block" />

            {activeModel === 'standard' && (
              <div className="space-y-24">
                <TimelineStep
                  number={1}
                  label="START"
                  title="Firma tworzy zlecenie"
                  desc="Firma publikuje szczegółowy opis projektu, określa budżet, wymagane umiejętności i deadline. System automatycznie dopasowuje zlecenie do odpowiednich studentów."
                  visual={<CreateOrderVisual />}
                />
                <TimelineStep
                  number={2}
                  label="REKRUTACJA"
                  title="Student aplikuje, firma wybiera"
                  desc="Zainteresowani studenci składają aplikacje z portfolio i propozycją realizacji. Firma przegląda kandydatury i wybiera najlepszego studenta do współpracy."
                  visual={<ApplicationsVisual />}
                  reverse
                />
                <TimelineStep
                  number={3}
                  label="PLANOWANIE"
                  title="Ustalanie kamieni milowych"
                  desc="Po akceptacji, student wraz z firmą ustala szczegółowy plan pracy - definiują milestony, terminy i kryteria akceptacji każdego etapu projektu."
                  visual={<MilestonesVisual />}
                />
                <TimelineStep
                  number={4}
                  label="REALIZACJA"
                  title="Wykonanie i zatwierdzanie etapów"
                  desc="Student wykonuje zlecenie etapami. Po zakończeniu każdego milestone'a, firma weryfikuje i zatwierdza pracę, co uruchamia wypłatę środków za dany etap."
                  visual={<ProgressVisual />}
                  reverse
                />
                <TimelineStep
                  number={5}
                  label="FINALIZACJA"
                  title="Ocena i zakończenie"
                  desc="Po zakończeniu projektu firma wystawia studentowi ocenę, która pojawia się w jego profilu. Dobra opinia to klucz do kolejnych zleceń i budowania reputacji!"
                  visual={<RatingVisual />}
                />
              </div>
            )}

            {activeModel === 'longterm' && (
              <div className="space-y-24">
                <TimelineStep
                  number={1}
                  label="START"
                  title="Firma publikuje ofertę"
                  desc="Firma określa zakres obowiązków, wymagane umiejętności, stawkę godzinową i minimalny wymiar czasu. Może to być praca zdalna lub hybrydowa."
                  visual={<CreateOrderVisual />}
                />
                <TimelineStep
                  number={2}
                  label="REKRUTACJA"
                  title="Proces rekrutacji i okres próbny"
                  desc="Studenci aplikują, firma przeprowadza rozmowy i wybiera kandydata. Współpraca może rozpocząć się od krótkiego okresu próbnego."
                  visual={<ApplicationsVisual />}
                  reverse
                />
                <TimelineStep
                  number={3}
                  label="WSPÓŁPRACA"
                  title="Regularna praca i rozliczanie"
                  desc="Student pracuje regularnie według ustalonego harmonogramu. System śledzi godziny pracy, które są rozliczane w cyklach tygodniowych."
                  visual={<ProgressVisual />}
                />
                <TimelineStep
                  number={4}
                  label="OCENA"
                  title="Okresowy feedback"
                  desc="Co miesiąc firma i student omawiają postępy, wyznaczają nowe cele i dostosowują zakres obowiązków. Budowanie długoterminowej relacji!"
                  visual={<RatingVisual />}
                  reverse
                />
              </div>
            )}

            {activeModel === 'services' && (
              <div className="space-y-24">
                <TimelineStep
                  number={1}
                  label="PRZEGLĄDAJ"
                  title="Wyszukaj usługę"
                  desc="Przeglądaj portfolio studentów oferujących gotowe usługi - od designu po programowanie. Każdy profil zawiera oceny i realne realizacje."
                  visual={<ApplicationsVisual />}
                />
                <TimelineStep
                  number={2}
                  label="WYCENA"
                  title="Poproś o wycenę"
                  desc="Po wybraniu studenta, opisz swoje potrzeby. Student przygotuje ofertę z szacowanym czasem realizacji i kosztem."
                  visual={<CreateOrderVisual />}
                  reverse
                />
                <TimelineStep
                  number={3}
                  label="PLANOWANIE"
                  title="Uzgodnij milestony"
                  desc="Razem ze studentem ustalacie kamienie milowe projektu. System zabezpiecza obie strony na każdym etapie płatności."
                  visual={<MilestonesVisual />}
                />
                <TimelineStep
                  number={4}
                  label="REALIZACJA"
                  title="Realizacja i poprawki"
                  desc="Student dostarcza pracę etapami. Akceptujesz wyniki lub prosisz o poprawki w ramach ustalonych rund."
                  visual={<ProgressVisual />}
                  reverse
                />
                <TimelineStep
                  number={5}
                  label="FINALIZACJA"
                  title="Finalizacja i ocena"
                  desc="Po zakończeniu projektu wystawiasz ocenę. Zadowolony z rezultatu? Zbuduj stałą relację ze studentem!"
                  visual={<RatingVisual />}
                />
              </div>
            )}
          </div>
        </div>
      </section>

      {/* --- SERVICES SECTION --- */}
      <section className="bg-[linear-gradient(180deg,#ffffff_0%,#f8faff_100%)] px-[5%] py-24">
        <div className="w-full max-w-[2000px] mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">Jakie <span className="gradient-text">usługi</span> znajdziesz?</h2>
            <p className="text-lg text-[#5a5a7a]">Szeroki wybór usług oferowanych przez utalentowanych studentów</p>
          </div>

          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-6 lg:grid-cols-4">
            {Object.keys(SERVICE_DATA).map(name => (
              <ServiceDetailsModal key={name} name={name} />
            ))}
          </div>
        </div>
      </section>

      {/* --- TESTIMONIALS SECTION --- */}
      <section className="bg-slate-50 px-[5%] py-24">
        <div className="w-full max-w-[2000px] mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">Co mówią <span className="gradient-text">nasi użytkownicy?</span></h2>
            <p className="text-lg text-[#5a5a7a]">Zaufało nam już tysiące studentów i firm z całej Polski.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <TestimonialCard
              name="Anna Kowalska"
              role="Studentka IT · PW"
              text="Dzięki Student2Work zrealizowałam swój pierwszy komercyjny projekt jeszcze na 2. roku studiów. To doświadczenie było bezcenne."
              badge="Student"
            />
            <TestimonialCard
              name="Michał Nowak"
              role="CEO · TechStart"
              text="Szukaliśmy kogoś do redesignu aplikacji. Student wykonał świetną robotę w połowie ceny rynkowej agencji. Polecam!"
              badge="Firma"
            />
            <TestimonialCard
              name="Piotr Wiśniewski"
              role="Student Informatyki · AGH"
              text="System milestone'ów świetnie chroni obie strony. Zbudowałem już portfolio z 8 projektów i zyskałem zaufanie klientów."
              badge="Student"
            />
          </div>
        </div>
      </section>

      {/* --- CTA SECTION --- */}
      <section className="bg-[#1a1a2e] px-[5%] py-24 text-center text-white">
        <div className="mx-auto max-w-5xl rounded-[2.5rem] border border-white/10 bg-white/[0.04] px-8 py-14 shadow-[0_30px_80px_rgba(0,0,0,0.18)] md:px-12">
          <h2 className="mb-6 text-3xl font-bold md:text-5xl">Gotowy na start?</h2>
          <p className="mx-auto mb-10 max-w-3xl text-lg text-white/80">Dołącz do społeczności, która łączy edukację z biznesem na nowych zasadach.</p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/auth?role=student">
              <Button className="h-16 rounded-full px-12 text-xl font-bold shadow-2xl transition-all hover:scale-105 gradient-primary">
                Dołącz jako student
              </Button>
            </Link>
            <Link href="/auth?role=company">
              <Button variant="outline" className="h-16 px-12 rounded-full border-white/20 bg-transparent text-xl font-bold text-white hover:bg-white/10">
                Dołącz jako firma
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* --- FOOTER --- */}
      <footer className="border-t border-white/5 bg-[#1a1a2e] px-[5%] py-10 text-white/50">
        <div className="mx-auto flex w-full max-w-[2000px] flex-col items-center justify-between gap-6 md:flex-row">
          <div className="text-xl font-bold text-white">🎓 Student2Work</div>
          <div className="text-sm">© {new Date().getFullYear()} Student2Work. All rights reserved.</div>
        </div>
      </footer>
    </div>
  );
}

// --- Sub-components ---

function StatCard({ icon, value, label, sublabel }: { icon: string, value: string, label: string, sublabel: string }) {
  return (
    <RevealOnScroll className="group cursor-default rounded-3xl border border-slate-200/60 bg-gradient-to-b from-slate-50 to-white p-8 text-center transition-all hover:-translate-y-2 hover:border-[#667eea]/20 hover:shadow-2xl">
      <div className="text-4xl mb-4 transition-transform group-hover:scale-125 group-hover:rotate-12 duration-300">{icon}</div>
      <div className="text-4xl md:text-5xl font-extrabold gradient-text mb-2 transition-all">
        <AnimatedCounter value={value} />
      </div>
      <div className="font-bold text-[#1a1a2e] mb-1">{label}</div>
      <div className="text-xs text-[#9ca3af]">{sublabel}</div>
    </RevealOnScroll>
  );
}

function TimelineStep({ number, label, title, desc, visual, reverse, className }: {
  number: number,
  label: string,
  title: string,
  desc: string,
  visual: React.ReactNode,
  reverse?: boolean,
  className?: string
}) {
  return (
    <div className={cn("relative z-10", className)}>
      {/* Circle with Number */}
      <div className="absolute left-1/2 top-1/2 z-20 hidden h-16 w-16 -translate-y-1/2 -translate-x-1/2 items-center justify-center rounded-full text-2xl font-bold text-white shadow-primary lg:flex gradient-primary">
        {number}
      </div>

      <div className={cn("flex flex-col lg:flex-row items-center gap-16 xl:gap-24", reverse ? "lg:flex-row-reverse" : "")}>
        {/* Text */}
        <RevealOnScroll className={cn("flex-1 text-center", reverse ? "lg:text-left lg:pl-16" : "lg:text-right lg:pr-16")}>
          <div className="mb-4 inline-block rounded-full bg-[#667eea]/10 px-4 py-1 text-xs font-bold text-[#667eea]">
            {label}
          </div>
          <h3 className="text-2xl font-bold mb-4 text-[#1a1a2e] leading-tight">{title}</h3>
          <p className="text-[#5a5a7a] leading-relaxed">{desc}</p>
        </RevealOnScroll>

        {/* Visual */}
        <RevealOnScroll className="flex-1 flex justify-center">
          <div className="w-full max-w-sm rounded-3xl border border-slate-100 bg-white p-8 shadow-[0_20px_50px_rgba(15,23,42,0.08)]">
            {visual}
          </div>
        </RevealOnScroll>
      </div>
    </div>
  );
}

function TestimonialCard({ name, role, text, badge }: { name: string, role: string, text: string, badge: string }) {
  return (
    <RevealOnScroll className="group relative rounded-3xl border border-slate-100 bg-white p-8 shadow-lg transition-all hover:-translate-y-2 hover:shadow-2xl">
      <div className="mb-4 text-xl text-[#fbbf24] group-hover:animate-star-bounce">★★★★★</div>
      <p className="text-[#5a5a7a] leading-relaxed mb-6 italic overflow-hidden line-clamp-4">
        &ldquo;{text}&rdquo;
      </p>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full gradient-primary flex items-center justify-center text-white font-bold">
            {name.charAt(0)}
          </div>
          <div>
            <div className="font-bold text-sm text-[#1a1a2e]">{name}</div>
            <div className="text-xs text-[#9ca3af]">{role}</div>
          </div>
        </div>
        <div className="rounded-full bg-[#667eea]/10 px-3 py-1 text-[10px] font-bold uppercase text-[#667eea]">
          {badge}
        </div>
      </div>
    </RevealOnScroll>
  );
}

// --- Visual Sub-components ---

function CreateOrderVisual() {
  return (
    <div className="space-y-4">
      <div className="h-3 bg-slate-100 rounded-full w-[80%] overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-r from-[#667eea] to-[#764ba2] animate-form-fill" />
      </div>
      <div className="h-3 bg-slate-100 rounded-full w-[60%] overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-r from-[#667eea] to-[#764ba2] animate-form-fill delay-150" />
      </div>
      <div className="h-3 bg-slate-100 rounded-full w-[90%] overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-r from-[#667eea] to-[#764ba2] animate-form-fill delay-300" />
      </div>
      <div className="h-3 bg-slate-100 rounded-full w-[40%] overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-r from-[#667eea] to-[#764ba2] animate-form-fill delay-500" />
      </div>
    </div>
  );
}

function ApplicationsVisual() {
  return (
    <div className="grid grid-cols-2 gap-3">
      {['Anna K.', 'Marcin B.', 'Kasia W.', 'Tomek N.'].map(name => (
        <div key={name} className="group cursor-pointer rounded-2xl border border-transparent bg-slate-50 p-3 text-center transition-all hover:border-[#667eea] hover:bg-slate-100">
          <div className="w-10 h-10 rounded-full gradient-primary mx-auto mb-2 shadow-inner group-hover:scale-110 transition-transform" />
          <div className="text-[10px] font-bold truncate">{name}</div>
        </div>
      ))}
    </div>
  );
}

function MilestonesVisual() {
  return (
    <div className="space-y-3">
      {['Projekt UI/UX', 'Frontend', 'Testy'].map((t, i) => (
        <div key={t} className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl border-l-4 border-[#667eea]">
          <div className={cn("w-5 h-5 rounded-md border-2 border-[#667eea] flex items-center justify-center", i === 0 ? "bg-[#667eea] text-white" : "text-transparent")}>
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div className="text-xs font-medium text-[#5a5a7a]">{t}</div>
        </div>
      ))}
    </div>
  );
}

function ProgressVisual() {
  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <div className="flex justify-between text-[10px] font-bold"><span>Design</span><span>100%</span></div>
        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
          <div className="h-full gradient-primary" style={{ width: '100%' }} />
        </div>
      </div>
      <div className="space-y-1">
        <div className="flex justify-between text-[10px] font-bold"><span>Dev</span><span>65%</span></div>
        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
          <div className="h-full gradient-primary relative" style={{ width: '65%' }}>
            <div className="absolute inset-x-0 h-full bg-white/20 animate-pulse" />
          </div>
        </div>
      </div>
      <div className="space-y-1">
        <div className="flex justify-between text-[10px] font-bold"><span>Testy</span><span>0%</span></div>
        <div className="h-2 bg-slate-100 rounded-full" />
      </div>
    </div>
  );
}

function RatingVisual() {
  return (
    <div className="text-center space-y-4">
      <div className="text-3xl text-[#fbbf24] flex justify-center gap-1 animate-star-bounce">
        <Star className="fill-current" /><Star className="fill-current" /><Star className="fill-current" /><Star className="fill-current" /><Star className="fill-current" />
      </div>
      <div className="font-bold text-[#1a1a2e]">Doskonała współpraca!</div>
    </div>
  );
}

function ServiceDetailsModal({ name }: { name: string }) {
  const data = SERVICE_DATA[name];
  const Icon = data.icon;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <div className="group cursor-pointer rounded-3xl border border-slate-200/70 bg-white/70 p-6 text-center shadow-[0_12px_30px_rgba(15,23,42,0.04)] transition-all hover:-translate-y-2 hover:border-[#667eea] hover:bg-white hover:shadow-[0_18px_40px_rgba(15,23,42,0.08)]">
          <div className="text-3xl mb-3 transition-transform group-hover:scale-125 group-hover:rotate-6 duration-300">
            <Icon className="w-8 h-8 mx-auto text-[#667eea]" />
          </div>
          <div className="font-bold text-sm md:text-base text-[#1a1a2e] group-hover:text-[#667eea] transition-colors">{name}</div>
        </div>
      </DialogTrigger>
      <DialogContent className="max-w-2xl overflow-hidden rounded-[2rem] border-none p-0 transition-all">
        <div className="relative p-8 md:p-12 bg-white">
          <DialogHeader className="mb-8">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-[#667eea]/10 flex items-center justify-center text-[#667eea]">
                <Icon className="w-10 h-10" />
              </div>
              <DialogTitle className="text-3xl font-extrabold text-[#1a1a2e]">{name}</DialogTitle>
            </div>
          </DialogHeader>

          <div className="space-y-8">
            <p className="text-lg text-[#5a5a7a] leading-relaxed italic">
              &ldquo;{data.description}&rdquo;
            </p>

            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <StatDetail label="Średnia cena" value={data.stats.price} />
              <StatDetail label="Czas realizacji" value={data.stats.time} />
              <StatDetail label="Projektów" value={data.stats.projects} />
              <StatDetail label="Ocena" value={data.stats.rating} />
            </div>

            <div className="space-y-4">
              <h4 className="font-extrabold text-[#1a1a2e]">Przykładowe projekty:</h4>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {data.examples.map(ex => (
                  <li key={ex} className="flex items-center gap-3 rounded-xl bg-slate-50 p-3 text-sm text-[#5a5a7a] transition-colors hover:bg-[#667eea]/5">
                    <CheckCircle2 className="w-4 h-4 text-[#667eea]" />
                    {ex}
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-2xl border-l-4 border-[#667eea] bg-[#667eea]/10 p-6">
              <div className="font-bold text-[#667eea] mb-1">💡 Ciekawostka</div>
              <p className="text-sm text-[#5a5a7a]">{data.funFact}</p>
            </div>

            <Link href="/auth?role=company">
              <Button className="w-full h-14 rounded-full gradient-primary text-white font-bold text-lg shadow-primary mt-4">
                Znajdź eksperta w tej kategorii →
              </Button>
            </Link>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function StatDetail({ label, value }: { label: string, value: string }) {
  return (
    <div className="p-4 bg-slate-50 rounded-2xl text-center">
      <div className="text-sm font-extrabold gradient-text mb-1 truncate">{value}</div>
      <div className="text-[10px] text-[#9ca3af] font-bold uppercase tracking-wider">{label}</div>
    </div>
  );
}
