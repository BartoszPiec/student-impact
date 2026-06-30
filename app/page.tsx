import type { ComponentType } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Banknote,
  BarChart3,
  BriefcaseBusiness,
  Check,
  CheckCircle2,
  ClipboardCheck,
  FileCheck2,
  LockKeyhole,
  MessageSquare,
  PenLine,
  Plus,
  ShieldCheck,
  Sparkles,
  Star,
  Users,
  Video,
  WandSparkles,
  Zap,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { LandingFaqAccordion } from "@/components/landing-faq-accordion";
import { LandingNavbar } from "@/components/landing-navbar";

type IconComponent = ComponentType<{ className?: string }>;

type PackageCard = {
  title: string;
  description: string;
  price: string;
  label: string;
  icon: IconComponent;
  color: string;
};

type PricingCard = {
  label: string;
  value: string;
  sub: string;
  points: string[];
  featured?: boolean;
};

const trustPills = [
  { label: "Depozyt Student2Work", icon: ShieldCheck },
  { label: "Umowy A/B online", icon: FileCheck2 },
  { label: "Kontrola jakosci", icon: Users },
  { label: "Faktura VAT + PIT", icon: ClipboardCheck },
  { label: "Tryb sporu", icon: MessageSquare },
  { label: "Platnosci: Stripe", icon: LockKeyhole },
];

const safetyCards = [
  {
    title: "Depozyt Student2Work",
    description: "Platnosc zablokowana do czasu, az zaakceptujesz efekt. Zero placenia w ciemno.",
    icon: ShieldCheck,
  },
  {
    title: "Zweryfikowani studenci",
    description: "Zadanie probne, portfolio i wlasciwy kierunek studiow. Wykonawca nie jest przypadkowy.",
    icon: Users,
  },
  {
    title: "Dwie umowy A/B",
    description: "Firma i student akceptuja umowy online, zanim w ogole ruszy platnosc.",
    icon: FileCheck2,
  },
  {
    title: "Kontrola jakosci",
    description: "Operator sprawdza prace checklista jakosci, zanim trafi do Ciebie. Nie loteria.",
    icon: Sparkles,
  },
  {
    title: "Placic za efekt",
    description: "Akceptujesz kazdy etap. Auto-akceptacja po terminie chroni tez wykonawce.",
    icon: Banknote,
  },
  {
    title: "Spor i oceny",
    description: "Zglos problem do panelu admina. Po zleceniu publiczne oceny obu stron.",
    icon: MessageSquare,
  },
];

const steps = [
  {
    number: "1",
    title: "Wybierasz pakiet lub wystawiasz zlecenie",
    description: "Gotowy pakiet ze stala cena, jasnym zakresem i terminem. Albo opisujesz wlasne zadanie w 5 minut.",
    icon: PenLine,
  },
  {
    number: "2",
    title: "Student realizuje pod kontrola jakosci",
    description: "Przydzielamy zweryfikowanego wykonawce wlasciwego kierunku. Praca idzie przez czat i modul dostaw.",
    icon: Users,
  },
  {
    number: "3",
    title: "Akceptujesz efekt - platnosc z depozytu",
    description: "Zadowolony? Srodki trafiaja do studenta. Fakture, rachunek i PIT rozliczamy my.",
    icon: Check,
  },
];

const packages: PackageCard[] = [
  {
    title: "Grafiki social media (komplet)",
    description: "Spojny zestaw postow i stories pod Twoja marke.",
    price: "od 299 zl",
    label: "Grafika",
    icon: WandSparkles,
    color: "from-violet-500 to-purple-500",
  },
  {
    title: "Prezentacja / pitch deck (PPT)",
    description: "Profesjonalne slajdy gotowe na spotkanie albo inwestora.",
    price: "od 399 zl",
    label: "Prezentacje",
    icon: BarChart3,
    color: "from-blue-500 to-indigo-500",
  },
  {
    title: "Montaz Reels / krotkie wideo",
    description: "Dynamiczny montaz pod social media - ciecia i napisy.",
    price: "od 349 zl",
    label: "Wideo",
    icon: Video,
    color: "from-cyan-500 to-sky-500",
  },
  {
    title: "Retusz zdjec produktowych",
    description: "Czyste tlo, rowne kolory - sklepowy standard.",
    price: "od 199 zl",
    label: "Grafika",
    icon: Sparkles,
    color: "from-pink-500 to-rose-500",
  },
  {
    title: "Wizytowka Google (Business Profile)",
    description: "Pelny setup, zeby klienci znalezli Cie w mapach.",
    price: "od 249 zl",
    label: "Marketing",
    icon: BriefcaseBusiness,
    color: "from-amber-500 to-orange-500",
  },
  {
    title: "Korekta i redakcja tekstu (PL)",
    description: "Tekst bez literowek i kalek - strona, oferta, regulamin.",
    price: "od 149 zl",
    label: "Copywriting",
    icon: PenLine,
    color: "from-teal-600 to-emerald-500",
  },
];

const pricingCards: PricingCard[] = [
  {
    label: "Koszt startu",
    value: "0 zl",
    sub: "abonamentu i oplat za samo konto",
    points: ["Dostep do katalogu bez oplaty", "Brief i wycena bez zobowiazan", "Placisz dopiero przy realnym zleceniu"],
  },
  {
    label: "Formalnosci",
    value: "1 faktura",
    sub: "dla firmy, reszta po naszej stronie",
    points: ["My prowadzimy umowy i akceptacje online", "Ty dostajesz fakture VAT do rozliczenia", "Student rozlicza sie z platforma, nie z firma"],
  },
  {
    label: "Kontrola zlecenia",
    value: "5 etapow",
    sub: "od briefu do bezpiecznej wyplaty",
    points: ["Brief i dopasowanie wykonawcy", "Umowy oraz depozyt przed startem", "Odbior, poprawki albo tryb sporu"],
    featured: true,
  },
];

const testimonials = [
  {
    name: "Marek K.",
    role: "wlasciciel sklepu e-commerce",
    initials: "MK",
    text: "Wrzucilem zalegly backlog grafik na social media - komplet dostalem w cztery dni i bez sciagania kogokolwiek na etat.",
  },
  {
    name: "Anna B.",
    role: "biuro rachunkowe, 6 osob",
    initials: "AB",
    text: "Najbardziej przekonalo mnie, ze place dopiero po akceptacji. Pierwszy raz zlecilam cos online zupelnie bez stresu.",
  },
  {
    name: "Tomasz L.",
    role: "founder, startup B2B",
    initials: "TL",
    text: "Prezentacja dla inwestorow gotowa w trzy dni i w stalej cenie. Kontrola jakosci wylapala literowki, ktorych nie zauwazylem.",
  },
];

const faqs = [
  {
    question: "Czy wspolpraca jest legalna i bezpieczna?",
    answer:
      "Tak. Kazde zlecenie obejmuja dwie umowy, ktore obie strony akceptuja online. Wystawiamy fakture VAT firmie, rachunek studentowi, a podatek PIT rozliczamy po naszej stronie. Platnosci obsluguje Stripe.",
  },
  {
    question: "Kiedy faktycznie place za zlecenie?",
    answer: "Srodki trafiaja do depozytu Student2Work przed startem, ale student otrzymuje wyplate dopiero po akceptacji efektu lub po auto-akceptacji po terminie.",
  },
  {
    question: "Co, jesli student nie dowiezie albo efekt jest slaby?",
    answer: "Mozesz poprosic o poprawki albo zglosic spor. Do czasu rozstrzygniecia platnosc pozostaje zablokowana.",
  },
  {
    question: "Jak weryfikujecie studentow?",
    answer: "Sprawdzamy profil, kierunek, portfolio, jakosc komunikacji i dopasowanie do kategorii zadania.",
  },
  {
    question: "Czy dostane fakture VAT?",
    answer: "Tak. Firma rozlicza sie z platforma, a formalnosci po stronie studenta przejmuje Student Impact.",
  },
  {
    question: "Ile to kosztuje?",
    answer: "Pakiety maja stale ceny, a wlasne zlecenia dzialaja prowizyjnie. Nie ma abonamentu za samo konto.",
  },
];

function LogoMark({ dark = false }: { dark?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0f2460] shadow-sm ring-1 ring-white/15">
        <span className="text-sm font-black text-[#c5fb37]">S2</span>
      </div>
      <span className={`text-xl font-black tracking-tight ${dark ? "text-white" : "text-[#0f2460]"}`}>
        Student<span className="text-[#25d49f]">2</span>Work
      </span>
    </div>
  );
}

function SectionBadge({ children, dark = false }: { children: string; dark?: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-black ${
        dark ? "border-lime-300/20 bg-lime-300/10 text-lime-200" : "border-slate-200 bg-white text-[#0f2460]"
      }`}
    >
      <Zap className="h-3.5 w-3.5" />
      {children}
    </span>
  );
}

function HomeNav() {
  return <LandingNavbar audience="company" />;
}

function HeroMockup() {
  const candidates = ["AK", "MB", "PW", "KN"];

  return (
    <div className="relative">
      <div className="landing-subtle-pulse absolute -right-5 -top-5 rounded-full bg-emerald-500 px-5 py-2 text-xs font-black text-white shadow-xl shadow-emerald-200">
        Platnosc po akceptacji
      </div>
      <div className="rounded-[1.65rem] border border-slate-100 bg-white p-6 shadow-[0_28px_80px_-44px_rgba(15,36,96,0.75)]">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <p className="text-sm font-black text-[#0f2460]">Nowe zlecenie - #4821</p>
          </div>
          <div className="flex gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-rose-300" />
            <span className="h-2.5 w-2.5 rounded-full bg-amber-300" />
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-300" />
          </div>
        </div>

        <div className="space-y-4">
          {[
            ["Tytul projektu", "w-4/5"],
            ["Kategoria uslugi", "w-1/2"],
            ["Budzet (PLN)", "w-1/3"],
          ].map(([label, width]) => (
            <div key={label}>
              <p className="mb-2 text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">{label}</p>
              <div className="rounded-xl bg-[#f4f7ef] p-3">
                <div className={`h-2.5 rounded-full bg-slate-300 ${width}`} />
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 border-t border-slate-100 pt-5">
          <p className="mb-3 text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
            Kandydaci - 4 zweryfikowanych
          </p>
          <div className="grid grid-cols-4 gap-3">
            {candidates.map((candidate, index) => (
              <div key={candidate} className={`rounded-xl border p-3 text-center ${index === 0 ? "border-lime-200 bg-lime-100" : "border-slate-100 bg-white"}`}>
                <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-full bg-[#0f2460] text-xs font-black text-white">
                  {candidate}
                </div>
                <p className="mt-2 text-xs font-black text-amber-500">★ 4,{9 - index}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-4 rounded-xl border border-emerald-100 bg-emerald-50 p-4">
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-0.5 h-5 w-5 text-emerald-500" />
            <div>
              <p className="text-sm font-black text-[#0f2460]">Depozyt aktywny - umowy A/B podpisane</p>
              <p className="mt-1 text-xs font-bold text-slate-500">2 400 PLN zablokowane do akceptacji</p>
            </div>
          </div>
        </div>
      </div>

      <div className="landing-subtle-pulse absolute -bottom-5 -left-5 rounded-full border border-slate-100 bg-white px-4 py-2 text-xs font-black text-[#0f2460] shadow-xl">
        ★ 4,9 - kontrola jakosci
      </div>
    </div>
  );
}

function HomeHero() {
  return (
    <section className="relative overflow-hidden bg-[linear-gradient(105deg,#ffffff_0%,#ffffff_57%,#f3ffd6_100%)]">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(15,36,96,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(15,36,96,0.025)_1px,transparent_1px)] bg-[size:52px_52px]" />
      <div className="relative mx-auto grid min-h-[580px] max-w-7xl items-center gap-12 px-4 pb-10 pt-28 sm:px-6 lg:grid-cols-[1.08fr_0.92fr] lg:px-8 lg:pb-12 lg:pt-32">
        <div>
          <div className="landing-enter-up mb-7 inline-flex max-w-full items-center gap-2 rounded-full bg-[#eaffae] px-4 py-2 text-sm font-black text-[#0f2460] max-[390px]:text-xs">
            <Zap className="h-4 w-4" />
            Dla malych i srednich firm w Polsce
          </div>
          <h1 className="landing-enter-up max-w-3xl text-[clamp(2.45rem,12vw,3.25rem)] font-black leading-[1.04] text-[#0f2460] sm:text-6xl lg:text-[4.25rem]" style={{ animationDelay: "100ms" }}>
            Deleguj zadania tam, gdzie nie oplaca sie{" "}
            <span className="relative inline-block">
              <span className="relative z-10">zatrudniac.</span>
              <span className="absolute bottom-1 left-0 right-0 z-0 h-5 bg-[#c5fb37]" />
            </span>
          </h1>
          <p className="landing-enter-up mt-6 max-w-2xl text-base font-semibold leading-7 text-slate-600 sm:text-lg sm:leading-8" style={{ animationDelay: "200ms" }}>
            Wybierasz gotowy pakiet w stalej cenie, zweryfikowany student realizuje go pod kontrola jakosci, a Ty placisz dopiero po akceptacji efektu. Umowy, fakture i podatki bierzemy na siebie.
          </p>
          <div className="landing-enter-up mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap" style={{ animationDelay: "300ms" }}>
            <Button asChild className="landing-hover-lift h-14 rounded-full bg-[#c5fb37] px-7 text-base font-black text-[#0f2460] shadow-xl shadow-lime-200/70 hover:bg-[#b7f22b]">
              <Link href="/auth?role=company">
                Deleguj pierwsze zadanie
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button asChild variant="outline" className="landing-hover-lift h-14 rounded-full border-slate-200 bg-white px-7 text-base font-black text-[#0f2460] hover:bg-slate-50">
              <a href="#bezpieczenstwo">
                <ShieldCheck className="mr-2 h-5 w-5" />
                Jak chronimy Twoje pieniadze
              </a>
            </Button>
          </div>
          <div className="landing-enter-up mt-7 grid gap-3 text-sm font-black text-slate-500 sm:grid-cols-2" style={{ animationDelay: "400ms" }}>
            {["Platnosc dopiero po akceptacji", "Zweryfikowani studenci", "Start w 24 godziny"].map((item) => (
              <div key={item} className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                {item}
              </div>
            ))}
          </div>
        </div>

        <div className="landing-enter-right hidden lg:block" style={{ animationDelay: "480ms" }}>
          <div className="landing-float-slow">
            <HeroMockup />
          </div>
        </div>
      </div>
    </section>
  );
}

function TrustStrip() {
  return (
    <section className="border-y border-slate-100 bg-white px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 lg:flex-row lg:items-center">
        <p className="max-w-[14rem] text-xs font-black uppercase tracking-[0.2em] text-slate-500">
          Bezpieczenstwo wbudowane w kazde zlecenie
        </p>
        <div className="grid w-full grid-cols-2 gap-3 sm:flex sm:w-auto sm:flex-wrap">
          {trustPills.map(({ label, icon: Icon }) => (
            <span key={label} className="inline-flex min-w-0 items-center justify-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-center text-[12px] font-black leading-4 text-[#0f2460] sm:justify-start sm:px-4 sm:text-sm">
              <Icon className="h-4 w-4 shrink-0 text-slate-500" />
              <span className="min-w-0 break-words">{label}</span>
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

function MarketSection() {
  const pains = [
    { value: "24,9%", label: "Jakosc pracy" },
    { value: "22,8%", label: "Terminowosc" },
    { value: "21,8%", label: "Kompetencje wykonawcy" },
  ];

  return (
    <section className="bg-[#f4f7ef] px-3 py-16 sm:px-6 sm:py-20 lg:px-8">
      <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
        <div>
          <SectionBadge>Rynek freelancingu 2025</SectionBadge>
          <h2 className="mt-7 max-w-xl text-3xl font-black leading-tight text-[#0f2460] sm:text-5xl">
            Polskie firmy juz zlecaja na zewnatrz. Trzy rzeczy je powstrzymuja.
          </h2>
          <div className="mt-6 flex flex-col gap-2 min-[380px]:flex-row min-[380px]:items-end min-[380px]:gap-3">
            <span className="text-5xl font-black leading-none text-[#0f2460] sm:text-7xl">56%</span>
            <span className="mb-2 max-w-[14rem] text-sm font-bold leading-5 text-slate-500">
              firm zleca freelancerom co najmniej raz w miesiacu
            </span>
          </div>
          <p className="mt-8 max-w-lg text-lg font-semibold leading-8 text-slate-600">
            A 74% z nich utrzyma lub zwiekszy skale wspolpracy. Pytanie nie brzmi juz czy zlecac - tylko komu zaufac.
          </p>
          <p className="mt-6 text-sm font-bold text-slate-400">Dane: Useme - raport o rynku freelancingu w Polsce, 2025.</p>
        </div>

        <div className="space-y-4 sm:space-y-5">
          {pains.map((pain) => (
            <div key={pain.label} className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm sm:p-6">
              <div className="grid min-w-0 grid-cols-[minmax(5.6rem,auto)_1fr] gap-x-4 gap-y-3 sm:flex sm:items-center sm:gap-5">
                <span className="self-center whitespace-nowrap text-[clamp(2.15rem,10vw,3.1rem)] font-black leading-none text-[#0f2460] sm:min-w-[7rem] sm:text-4xl">{pain.value}</span>
                <div className="min-w-0">
                  <p className="mb-2 break-normal text-lg font-black leading-tight text-[#0f2460] [overflow-wrap:normal] sm:text-lg">{pain.label}</p>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full w-[86%] rounded-full bg-[#2e49a3]" />
                  </div>
                </div>
                <span className="col-span-2 justify-self-start rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-black text-emerald-600 sm:bg-transparent sm:px-0 sm:py-0 sm:text-sm">rozwiazujemy</span>
              </div>
            </div>
          ))}
          <div className="rounded-2xl bg-[#0f2460] p-6 text-white shadow-xl shadow-slate-300">
            <div className="flex gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-lime-300/15 text-[#c5fb37]">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <p className="font-bold leading-7 text-white/86">
                To dokladnie te trzy bole rozwiazujemy - kuracja wykonawcow, kontrola jakosci i platnosc po akceptacji. Lider rynku ich nie dotyka.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function SafetySection() {
  return (
    <section id="bezpieczenstwo" className="bg-[linear-gradient(135deg,#071739_0%,#10286a_100%)] px-4 py-20 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto max-w-3xl text-center">
          <SectionBadge dark>Bezpieczenstwo</SectionBadge>
          <h2 className="mt-6 text-4xl font-black leading-tight sm:text-5xl">
            Twoje pieniadze sa pod kontrola na kazdym kroku.
          </h2>
          <p className="mt-5 text-lg font-semibold leading-8 text-white/70">
            Nie placisz w ciemno, student nie pracuje na slowo, a platforma sprawdza jakosc, zanim cokolwiek do Ciebie trafi.
          </p>
        </div>

        <div className="mt-14 grid gap-6 lg:grid-cols-[1fr_1.2fr]">
          <div className="rounded-[1.65rem] border border-white/10 bg-white/[0.06] p-7 shadow-2xl shadow-slate-950/20">
            <div className="mb-8 flex items-center justify-between">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-white/45">Depozyt - #DEP-4821</p>
              <span className="rounded-full bg-emerald-400/20 px-4 py-1.5 text-xs font-black text-emerald-200">Aktywne</span>
            </div>
            <div className="text-5xl font-black">2 400 <span className="text-xl text-white/45">PLN</span></div>
            <p className="mt-3 text-sm font-bold text-white/45">Zablokowane - uwolnienie po akceptacji</p>

            <div className="mt-8 grid grid-cols-3 overflow-hidden rounded-xl bg-white/8 text-center">
              {[
                ["Firma", "TechStart"],
                ["Depozyt", "2 400 zl"],
                ["Student", "Aleksandra K."],
              ].map(([label, value]) => (
                <div key={label} className="border-r border-white/10 px-3 py-4 last:border-r-0">
                  <p className="text-[10px] font-black uppercase tracking-[0.16em] text-white/35">{label}</p>
                  <p className="mt-1 text-sm font-black">{value}</p>
                </div>
              ))}
            </div>

            <div className="mt-8 space-y-5 text-sm font-bold">
              {["Srodki zablokowane", "Prace w toku", "Kontrola jakosci - akceptacja", "Wyplata do studenta"].map((item, index) => (
                <div key={item} className={`flex items-center justify-between ${index > 1 ? "text-white/35" : "text-white"}`}>
                  <span className="inline-flex items-center gap-3">
                    <span className={`h-3 w-3 rounded-full ${index === 0 ? "bg-emerald-400" : index === 1 ? "bg-[#c5fb37]" : "bg-white/10"}`} />
                    {item}
                  </span>
                  <span className="text-xs text-white/35">{index === 0 ? "12 kwi" : index === 1 ? "teraz" : index === 2 ? "prognoza 20 kwi" : "auto po akceptacji"}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {safetyCards.map(({ title, description, icon: Icon }) => (
              <div key={title} className="rounded-2xl border border-white/10 bg-white/[0.06] p-6">
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-lime-300/12 text-[#c5fb37]">
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-black">{title}</h3>
                <p className="mt-3 text-sm font-semibold leading-6 text-white/60">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function StepsSection() {
  return (
    <section id="jak-dziala" className="bg-white px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto max-w-3xl text-center">
          <SectionBadge>Jak to dziala</SectionBadge>
          <h2 className="mt-6 text-4xl font-black leading-tight text-[#0f2460] sm:text-5xl">
            Trzy kroki. Zero formalnosci po Twojej stronie.
          </h2>
          <p className="mt-5 text-lg font-semibold leading-8 text-slate-600">
            Tak jak na gieldzie zlecen - tylko z kuracja wykonawcy, kontrola jakosci i bezpieczna platnoscia.
          </p>
        </div>

        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {steps.map(({ number, title, description, icon: Icon }) => (
            <div key={number} className="rounded-[1.35rem] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-7 flex items-center justify-between">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#c5fb37] text-sm font-black text-[#0f2460]">{number}</span>
                <Icon className="h-7 w-7 text-slate-300" />
              </div>
              <h3 className="text-xl font-black leading-snug text-[#0f2460]">{title}</h3>
              <p className="mt-4 text-sm font-semibold leading-6 text-slate-500">{description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function PackagesSection() {
  return (
    <section id="pakiety" className="bg-[#f4f7ef] px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto max-w-3xl text-center">
          <SectionBadge>Katalog pakietow</SectionBadge>
          <h2 className="mt-6 text-4xl font-black leading-tight text-[#0f2460] sm:text-5xl">
            Gotowe pakiety w stalej cenie.
          </h2>
          <p className="mt-5 text-lg font-semibold leading-8 text-slate-600">
            Wybierasz efekt, my dobieramy zweryfikowanego wykonawce. Bez negocjacji, bez niespodzianek.
          </p>
        </div>

        <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {packages.map(({ title, description, price, label, icon: Icon, color }) => (
            <Link key={title} href="/app/company/packages" className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
              <div className={`h-20 bg-gradient-to-r ${color} p-5`}>
                <div className="flex items-center justify-between">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/20 text-white">
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="rounded-full bg-white/25 px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-white">
                    {label}
                  </span>
                </div>
              </div>
              <div className="p-6">
                <h3 className="text-lg font-black leading-tight text-[#0f2460]">{title}</h3>
                <p className="mt-3 min-h-12 text-sm font-semibold leading-6 text-slate-500">{description}</p>
                <div className="mt-7 flex items-center justify-between border-t border-slate-100 pt-5">
                  <span className="text-xl font-black text-[#0f2460]">{price} <span className="text-xs font-bold text-slate-400">brutto</span></span>
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-50 text-[#0f2460] transition group-hover:bg-[#c5fb37]">
                    <ArrowRight className="h-5 w-5" />
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-6 rounded-2xl bg-[#0f2460] p-6 text-white shadow-xl shadow-slate-300">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-white/10 text-[#c5fb37]">
                <Plus className="h-7 w-7" />
              </div>
              <div>
                <h3 className="text-xl font-black">Nie ma Twojego zadania?</h3>
                <p className="mt-1 text-sm font-semibold text-white/60">Opisz, czego szukasz - studenci zloza Ci dopasowane oferty na gieldzie.</p>
              </div>
            </div>
            <Button asChild className="h-14 rounded-full bg-[#c5fb37] px-8 font-black text-[#0f2460] hover:bg-[#b7f22b]">
              <Link href="/app/company/jobs/new">Wystaw wlasne zlecenie</Link>
            </Button>
          </div>
        </div>

        <div className="mt-8 text-center">
          <Button asChild variant="outline" className="h-12 rounded-full border-slate-200 bg-white px-7 font-black text-[#0f2460]">
            <Link href="/app/company/packages">
              Zobacz caly katalog pakietow
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

function PricingSection() {
  return (
    <section id="cennik" className="bg-white px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto max-w-3xl text-center">
          <SectionBadge>Rozliczenia</SectionBadge>
          <h2 className="mt-6 text-4xl font-black leading-tight text-[#0f2460] sm:text-5xl">
            Najwazniejsze zasady wspolpracy.
          </h2>
          <p className="mt-5 text-lg font-semibold leading-8 text-slate-600">
            Firma wie, kiedy placi, student wie, kiedy otrzyma wyplate, a platforma pilnuje umow, depozytu, jakosci i odbioru pracy.
          </p>
        </div>

        <div className="mt-12 grid gap-5 lg:grid-cols-3">
          {pricingCards.map((card) => (
            <div key={card.label} className={`rounded-2xl border p-7 shadow-sm ${card.featured ? "border-[#0f2460] bg-[#0f2460] text-white shadow-2xl shadow-slate-300" : "border-slate-200 bg-white text-[#0f2460]"}`}>
              <div className="mb-5 flex items-center justify-between">
                <p className={`text-xs font-black uppercase tracking-[0.16em] ${card.featured ? "text-[#c5fb37]" : "text-slate-500"}`}>{card.label}</p>
                {card.featured ? (
                  <span className="rounded-full bg-[#c5fb37] px-3 py-1 text-[10px] font-black uppercase text-[#0f2460]">Kontrola procesu</span>
                ) : null}
              </div>
              <p className="text-5xl font-black">{card.value}</p>
              <p className={`mt-1 text-sm font-semibold ${card.featured ? "text-white/55" : "text-slate-500"}`}>{card.sub}</p>
              <ul className="mt-7 space-y-4">
                {card.points.map((point) => (
                  <li key={point} className="flex gap-3 text-sm font-semibold">
                    <Check className={`mt-0.5 h-4 w-4 shrink-0 ${card.featured ? "text-[#c5fb37]" : "text-emerald-500"}`} />
                    <span className={card.featured ? "text-white/80" : "text-slate-600"}>{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function TestimonialsSection() {
  return (
    <section className="bg-slate-100/70 px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto max-w-3xl text-center">
          <SectionBadge>Opinie</SectionBadge>
          <h2 className="mt-6 text-4xl font-black leading-tight text-[#0f2460] sm:text-5xl">
            Mniej chaosu. Wiecej zrobionych rzeczy.
          </h2>
          <p className="mt-5 text-lg font-semibold leading-8 text-slate-600">
            Tak firmy i studenci opisuja dobrze poprowadzona wspolprace projektowa.
          </p>
        </div>

        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {testimonials.map((item) => (
            <div key={item.name} className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">
              <div className="mb-6 flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star key={star} className="h-4 w-4 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <p className="min-h-28 text-base font-semibold leading-7 text-[#0f2460]">&quot;{item.text}&quot;</p>
              <div className="mt-6 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#0f2460] text-sm font-black text-white">{item.initials}</div>
                <div>
                  <p className="font-black text-[#0f2460]">{item.name}</p>
                  <p className="text-sm font-semibold text-slate-400">{item.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FAQSection() {
  return (
    <section id="faq" className="bg-white px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <div className="text-center">
          <SectionBadge>FAQ</SectionBadge>
          <h2 className="mt-6 text-4xl font-black leading-tight text-[#0f2460] sm:text-5xl">
            Pytania, ktore zadaja firmy.
          </h2>
        </div>

        <LandingFaqAccordion items={faqs} />
      </div>
    </section>
  );
}

function FinalCTA() {
  return (
    <section className="relative overflow-hidden bg-[#c5fb37] px-4 py-24 sm:px-6 lg:px-8">
      <div className="absolute -left-24 -top-36 h-80 w-80 rounded-full border border-[#0f2460]/10" />
      <div className="absolute -bottom-24 -right-24 h-80 w-80 rounded-full border border-[#0f2460]/10" />
      <div className="relative mx-auto max-w-5xl text-center">
        <h2 className="text-4xl font-black leading-tight text-[#0f2460] sm:text-6xl">
          Deleguj pierwsze zadanie. Zaplac dopiero za efekt.
        </h2>
        <p className="mx-auto mt-7 max-w-3xl text-xl font-semibold leading-8 text-[#0f2460]/75">
          Rejestracja zajmuje 2 minuty. Bez abonamentu, bez zobowiazan, bez ryzyka.
        </p>
        <div className="mt-9 flex flex-col justify-center gap-4 sm:flex-row">
          <Button asChild className="h-14 rounded-full bg-[#0f2460] px-9 text-base font-black text-white hover:bg-[#071739]">
            <Link href="/auth?role=company">
              Deleguj zadanie
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
          <Button asChild variant="outline" className="h-14 rounded-full border-[#0f2460] bg-transparent px-9 text-base font-black text-[#0f2460] hover:bg-[#0f2460]/5">
            <Link href="/dla-studentow">Zacznij jako student</Link>
          </Button>
        </div>
        <p className="mt-8 text-base font-black text-[#0f2460]/55">
          Bezplatna rejestracja · Platnosc po akceptacji · Faktura i PIT po naszej stronie
        </p>
      </div>
    </section>
  );
}

function HomeFooter() {
  return (
    <footer className="bg-[#071739] px-4 py-16 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-12 lg:grid-cols-[1.2fr_2fr]">
          <div>
            <LogoMark dark />
            <p className="mt-7 max-w-sm text-lg font-semibold leading-8 text-white/62">
              Operacyjne wsparcie dla malych i srednich firm. Deleguj zadania zweryfikowanym studentom - bez etatu, bez rekrutacji, z platnoscia po akceptacji.
            </p>
          </div>

          <div className="grid gap-8 sm:grid-cols-3">
            {[
              { title: "Platforma", links: [["Jak to dziala", "#jak-dziala"], ["Bezpieczenstwo", "#bezpieczenstwo"], ["Katalog pakietow", "#pakiety"], ["Rozliczenia", "#cennik"]] },
              { title: "Dla firm", links: [["Deleguj zadanie", "/auth?role=company"], ["Jak dziala depozyt", "#bezpieczenstwo"], ["Wystaw ogloszenie", "/app/company/jobs/new"]] },
              { title: "Dla studentów", links: [["Gielda zlecen", "/dla-studentow#zlecenia"], ["Jak zaczac", "/dla-studentow#jak-zaczac"], ["Wyplaty i PIT", "/dla-studentow#wyplata"]] },
            ].map((group) => (
              <div key={group.title}>
                <p className="mb-6 text-sm font-black uppercase tracking-[0.22em] text-white/35">{group.title}</p>
                <div className="grid gap-4">
                  {group.links.map(([label, href]) => (
                    <Link key={label} href={href} className="text-lg font-semibold text-white/65 hover:text-white">
                      {label}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-16 grid gap-8 border-t border-white/10 pt-8 text-sm font-semibold text-white/55 md:grid-cols-[1fr_auto] md:items-center">
          <div className="grid gap-4 sm:grid-cols-3 sm:max-w-md">
            <Link href="/regulamin" className="hover:text-white">Regulamin</Link>
            <Link href="/polityka-prywatnosci" className="hover:text-white">Polityka prywatnosci</Link>
            <Link href="/polityka-prywatnosci" className="hover:text-white">RODO</Link>
          </div>
          <div className="flex flex-col gap-3 md:items-end">
            <p>© 2026 Student2Work. Wszelkie prawa zastrzezone.</p>
            <p className="inline-flex items-center gap-2 text-emerald-300">
              <ShieldCheck className="h-4 w-4" />
              Platnosci chronione przez depozyt Student2Work i Stripe
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default function LandingPage() {
  return (
    <div className="landing-page min-h-screen overflow-x-clip bg-white font-sans text-slate-950">
      <HomeNav />
      <main>
        <HomeHero />
        <TrustStrip />
        <MarketSection />
        <SafetySection />
        <StepsSection />
        <PackagesSection />
        <PricingSection />
        <TestimonialsSection />
        <FAQSection />
        <FinalCTA />
      </main>
      <HomeFooter />
    </div>
  );
}
