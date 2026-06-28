import type { ComponentType } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Banknote,
  Briefcase,
  Camera,
  Check,
  CheckCircle2,
  FileText,
  Handshake,
  LockKeyhole,
  MonitorPlay,
  Palette,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  WalletCards,
  X,
  Zap,
} from "lucide-react";

import { AnimateOnScroll } from "@/components/animate-on-scroll";
import { LandingNavbar } from "@/components/landing-navbar";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Dla studentów - Student2Work",
  description:
    "Zarabiaj na zleceniach dopasowanych do studiów. Student2Work pomaga studentom budować portfolio i otrzymywać wypłatę po akceptacji pracy.",
};

type IconComponent = ComponentType<{ className?: string }>;

type JobCard = {
  category: string;
  title: string;
  price: string;
  icon: IconComponent;
  tint: string;
};

type BenefitCard = {
  title: string;
  description: string;
  icon: IconComponent;
};

type Testimonial = {
  initials: string;
  name: string;
  text: string;
};

const jobs: JobCard[] = [
  {
    category: "Copywriting",
    title: "Wpis blogowy o marketingu",
    price: "150 zł",
    icon: FileText,
    tint: "bg-emerald-50 text-emerald-600",
  },
  {
    category: "Fotografia",
    title: "Fotograf na event firmowy",
    price: "600 zł",
    icon: Camera,
    tint: "bg-amber-50 text-amber-600",
  },
  {
    category: "Wideo",
    title: "Montaż Reels na social media",
    price: "350 zł",
    icon: MonitorPlay,
    tint: "bg-indigo-50 text-indigo-600",
  },
  {
    category: "Grafika",
    title: "Projekt logo dla startupu",
    price: "250 zł",
    icon: Palette,
    tint: "bg-pink-50 text-pink-600",
  },
  {
    category: "Marketing",
    title: "Research konkurencji",
    price: "220 zł",
    icon: Search,
    tint: "bg-blue-50 text-blue-600",
  },
  {
    category: "Administracja",
    title: "Porządkowanie bazy kontaktów",
    price: "180 zł",
    icon: Briefcase,
    tint: "bg-lime-50 text-lime-700",
  },
];

const benefits: BenefitCard[] = [
  {
    title: "Zarabiaj",
    description:
      "Dobieraj pracę wokół studiów, realizując zadania i projekty dla firm. Od drobnych zleceń na bieżące wydatki po większe projekty na wakacje.",
    icon: WalletCards,
  },
  {
    title: "Ucz się",
    description:
      "Zdobywaj realne doświadczenie u prawdziwych firm jako student-freelancer. Bierzesz zlecenia zgodne z Twoim kierunkiem.",
    icon: Sparkles,
  },
  {
    title: "Poznawaj",
    description:
      "Pracuj z markami, budujesz kontakty z managerami i właścicielami firm. Robisz wrażenie, zanim przyjdzie czas na etat.",
    icon: Handshake,
  },
];

const testimonials: Testimonial[] = [
  {
    initials: "MA",
    name: "Magda",
    text: "Świetne dla studentów. Pomogło mi przejść przez cały rok i naprawdę działa.",
  },
  {
    initials: "SA",
    name: "Sara",
    text: "Znalazłam tu beneficjalne zlecenia, od ustawiania zadań po ich realizację i zarobek. Łatwo się zarejestrować, a część zleceń jest krótka.",
  },
  {
    initials: "MK",
    name: "Marek",
    text: "Aplikacja, której nie znajdziesz nigdzie indziej. Świetna, żeby dorobić i znaleźć ludzi do zadań.",
  },
  {
    initials: "GR",
    name: "Grzegorz",
    text: "Naprawdę dobra apka dla studentów szukających dodatkowej gotówki. Zaufana dzięki sprawnym i bezpiecznym płatnościom.",
  },
  {
    initials: "OL",
    name: "Ola",
    text: "Uwielbiam tę platformę. Świetna dla studentów, gdy potrzebujesz szybkiej gotówki. Bardzo wygodna.",
  },
  {
    initials: "EW",
    name: "Ewa",
    text: "Student2Work bardzo pomaga studentom zarabiać w prosty sposób. Korzystałam i zarobiłam, naprawdę warto.",
  },
];

function LogoMark({ dark = false }: { dark?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#0f2460] shadow-sm ring-1 ring-white/15">
        <span className="text-xs font-black text-[#c5fb37]">S2</span>
      </div>
      <span className={`text-lg font-black tracking-tight ${dark ? "text-white" : "text-[#0f2460]"}`}>
        Student<span className="text-[#25d49f]">2</span>Work
      </span>
    </div>
  );
}

function SectionBadge({ children, dark = false }: { children: string; dark?: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-black ${
        dark ? "border-lime-300/25 bg-lime-300/10 text-lime-200" : "border-slate-200 bg-white text-[#0f2460]"
      }`}
    >
      <Zap className="h-3.5 w-3.5" />
      {children}
    </span>
  );
}

function StudentNav() {
  return <LandingNavbar audience="student" />;
}

function PhoneMockup() {
  const feed = [
    { title: "Zdjęcia zespołu do strony", meta: "Fotografia", price: "450 zł", status: "Aplikowano" },
    { title: "Manager social media", meta: "Marketing", price: "320 zł", status: "Zlecenie" },
    { title: "Opis produktu do sklepu", meta: "Copywriting", price: "180 zł", status: "Nowe" },
  ];

  return (
    <div className="relative mx-auto w-full max-w-[310px]">
      <div className="landing-subtle-pulse absolute -left-8 top-10 z-20 rounded-full bg-[#c5fb37] px-4 py-2 text-xs font-black text-[#0f2460] shadow-xl shadow-lime-900/20">
        <WalletCards className="mr-1 inline h-4 w-4" />
        Wypłata po akceptacji
      </div>
      <div className="rounded-[2rem] border border-white/10 bg-[#10245d] p-4 shadow-[0_35px_90px_-35px_rgba(4,12,35,0.95)]">
        <div className="mx-auto mb-4 h-1.5 w-20 rounded-full bg-white/18" />
        <div className="overflow-hidden rounded-[1.35rem] border border-white/10 bg-[#1d316b] p-4">
          <div className="mb-5 rounded-xl border border-white/10 bg-white/5 p-3">
            <div className="mb-3 flex gap-2">
              {["Zlecenia", "Staże", "Część etatu"].map((item, index) => (
                <span key={item} className={`rounded-full px-3 py-1 text-[10px] font-black ${index === 0 ? "bg-[#c5fb37] text-[#0f2460]" : "bg-white/8 text-white/60"}`}>
                  {item}
                </span>
              ))}
            </div>
          </div>
          <div className="space-y-3">
            {feed.map((item, index) => (
              <div key={item.title} className="rounded-xl border border-white/10 bg-white/6 p-3">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-[10px] font-black text-white/45">{item.meta}</span>
                  <span className={`rounded-full px-2 py-0.5 text-[9px] font-black ${index === 0 ? "bg-emerald-400/20 text-emerald-200" : "bg-white/10 text-white/60"}`}>
                    {item.status}
                  </span>
                </div>
                <p className="text-sm font-black leading-tight text-white">{item.title}</p>
                <div className="mt-3 flex items-center justify-between border-t border-white/10 pt-3">
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-white/55">
                    <Zap className="h-3.5 w-3.5 text-[#c5fb37]" />
                    Zdalnie
                  </span>
                  <span className="font-black text-white">{item.price}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="landing-subtle-pulse absolute -bottom-4 right-0 rounded-full bg-white px-4 py-2 text-xs font-black text-[#0f2460] shadow-xl">
        <Star className="mr-1 inline h-4 w-4 fill-amber-400 text-amber-400" />
        4,9 średnia ocena
      </div>
    </div>
  );
}

function StudentHero() {
  return (
    <section className="overflow-hidden bg-[radial-gradient(circle_at_72%_20%,rgba(77,129,142,0.34),transparent_28%),linear-gradient(135deg,#071739_0%,#132d70_100%)] px-4 pb-16 pt-28 text-white sm:px-6 lg:px-8 lg:pb-20 lg:pt-32">
      <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[1fr_0.9fr]">
        <div>
          <div className="landing-enter-up">
            <SectionBadge dark>Dla studentów</SectionBadge>
          </div>
          <h1 className="landing-enter-up mt-7 max-w-2xl text-5xl font-black leading-[1.08] text-white sm:text-6xl" style={{ animationDelay: "100ms" }}>
            Zarabiaj wokół swoich studiów
          </h1>
          <div className="landing-enter-up mt-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#c5fb37]/15 text-[#c5fb37]" style={{ animationDelay: "180ms" }}>
            <Banknote className="h-8 w-8" />
          </div>
          <p className="landing-enter-up mt-6 max-w-xl text-lg font-semibold leading-8 text-white/70" style={{ animationDelay: "260ms" }}>
            Realizuj płatne zlecenia od zweryfikowanych firm, w swoim rytmie, między zajęciami. Buduj portfolio i doświadczenie, którego szukają pracodawcy.
          </p>
          <div className="landing-enter-up mt-8 flex flex-col gap-3 sm:flex-row" style={{ animationDelay: "360ms" }}>
            <Button asChild className="landing-hover-lift h-14 rounded-full bg-[#c5fb37] px-7 text-base font-black text-[#0f2460] shadow-xl shadow-lime-950/20 hover:bg-[#b7f22b]">
              <Link href="/auth?role=student">
                Załóż konto studenta
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button asChild variant="outline" className="landing-hover-lift h-14 rounded-full border-white/18 bg-white/8 px-7 text-base font-black text-white hover:bg-white/12">
              <Link href="#zlecenia">
                <Search className="mr-2 h-5 w-5" />
                Przeglądaj zlecenia
              </Link>
            </Button>
          </div>
          <div className="landing-enter-up mt-7 flex flex-wrap gap-x-7 gap-y-3 text-sm font-black text-white/65" style={{ animationDelay: "460ms" }}>
            {["Dołącz do tysięcy studentów", "Wypłata po akceptacji", "Bez abonamentu"].map((item) => (
              <span key={item} className="inline-flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-[#c5fb37]" />
                {item}
              </span>
            ))}
          </div>
        </div>

        <div className="landing-enter-right hidden lg:block" style={{ animationDelay: "520ms" }}>
          <div className="landing-float-slow">
            <PhoneMockup />
          </div>
        </div>
      </div>
    </section>
  );
}

function JobsMarquee() {
  const repeatedJobs = [...jobs, ...jobs];

  return (
    <section id="zlecenia" className="bg-[#f4f7ef] px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto max-w-3xl text-center">
          <SectionBadge>Setki zleceń miesięcznie</SectionBadge>
          <h2 className="mt-6 text-4xl font-black leading-tight text-[#0f2460] sm:text-5xl">
            Setki zleceń każdego miesiąca.
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-lg font-semibold leading-8 text-slate-600">
            Zdalnie i na miejscu, od szybkich mikrozadań po dłuższe projekty.
          </p>
        </div>

        <div className="student-marquee student-marquee-mask mt-14 overflow-hidden py-2">
          <div className="student-marquee-track flex w-max gap-5 pr-5">
            {repeatedJobs.map(({ category, title, price, icon: Icon, tint }, index) => (
              <Link
                key={`${title}-${index}`}
                href="/auth?role=student"
                className="landing-hover-lift flex h-44 w-60 shrink-0 flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-xl"
              >
                <div>
                  <div className="mb-5 flex items-center gap-3">
                    <span className={`flex h-8 w-8 items-center justify-center rounded-xl ${tint}`}>
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="text-xs font-black text-[#0f2460]">{category}</span>
                  </div>
                  <p className="text-base font-black leading-snug text-slate-700">{title}</p>
                </div>
                <p className="text-2xl font-black text-[#0f2460]">{price}</p>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function ComparisonSection() {
  const rows = [
    "Gwarancja wypłaty z depozytu",
    "Umowa, rachunek i PIT po naszej stronie",
    "Kontrola jakości i feedback do pracy",
    "Tylko zweryfikowane firmy",
    "Tryb sporu i publiczne oceny",
  ];

  return (
    <section id="jak-zaczac" className="bg-white px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
        <AnimateOnScroll direction="left">
          <SectionBadge>Co nas wyróżnia</SectionBadge>
          <h2 className="mt-6 max-w-xl text-4xl font-black leading-tight text-[#0f2460] sm:text-5xl">
            To nie kolejna giełda zleceń. To bezpieczna praca.
          </h2>
          <p className="mt-6 max-w-lg text-lg font-semibold leading-8 text-slate-600">
            Na zwykłych platformach sam pilnujesz wypłaty, umowy i podatków. U nas chroni Cię ten sam system, co firmy: depozyt, umowy i kontrola jakości.
          </p>
          <div className="mt-8 space-y-5">
            {[
              ["Pieniądze czekają, zanim zaczniesz", "Firma zasila depozyt na starcie. Realizujesz spokojnie, a wypłata jest przygotowana do uruchomienia po akceptacji."],
              ["Legalnie i bez papierologii", "Umowę, rachunek i rozliczenie PIT bierzemy na siebie. Ty robisz to, co umiesz najlepiej."],
              ["Budujesz realne, zweryfikowane portfolio", "Każde ukończone zlecenie ląduje w Twoim profilu z pieczęcią Student2Work."],
            ].map(([title, text], index) => (
              <AnimateOnScroll key={title} delay={index * 100}>
                <div className="flex gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#eaffae] text-[#0f2460]">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-black text-[#0f2460]">{title}</h3>
                    <p className="mt-1 text-sm font-semibold leading-6 text-slate-500">{text}</p>
                  </div>
                </div>
              </AnimateOnScroll>
            ))}
          </div>
        </AnimateOnScroll>

        <AnimateOnScroll direction="right" className="min-w-0">
          <div className="overflow-hidden rounded-[1.4rem] border border-slate-200 bg-white shadow-[0_28px_80px_-45px_rgba(15,36,96,0.55)]">
            <div className="grid grid-cols-[1.02fr_0.94fr_0.74fr] border-b border-slate-100 text-center sm:grid-cols-[1.15fr_0.8fr_0.8fr]">
              <div className="p-3 text-left text-[10px] font-black uppercase leading-5 tracking-[0.14em] text-slate-400 sm:p-5 sm:text-xs">Co dostajesz</div>
              <div className="bg-[#0f2460] p-3 text-[12px] font-black leading-tight text-white sm:p-5 sm:text-sm">
                <span className="mb-1 inline-flex rounded-full bg-[#c5fb37] px-2 py-0.5 text-[9px] text-[#0f2460] sm:text-[10px]">MY</span>
                <br />
                <span className="break-normal [overflow-wrap:normal]">Student2Work</span>
              </div>
              <div className="p-3 text-[12px] font-black leading-tight text-slate-500 sm:p-5 sm:text-sm">Zwykłe giełdy</div>
            </div>
            {rows.map((row, index) => (
              <div key={row} className="grid grid-cols-[1.02fr_0.94fr_0.74fr] border-b border-slate-100 last:border-b-0 sm:grid-cols-[1.15fr_0.8fr_0.8fr]">
                <div className="p-3 text-[13px] font-black leading-snug text-[#0f2460] sm:p-5 sm:text-sm">{row}</div>
                <div className="flex items-center justify-center bg-slate-50/60 p-3 sm:p-5">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-100 text-emerald-600" style={{ transitionDelay: `${index * 60}ms` }}>
                    <Check className="h-4 w-4" />
                  </span>
                </div>
                <div className="flex items-center justify-center p-3 sm:p-5">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                    <X className="h-4 w-4" />
                  </span>
                </div>
              </div>
            ))}
            <div className="flex items-start gap-3 bg-emerald-50 p-5 text-sm font-black text-emerald-700">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" />
              Średnio 0 dni czekania na potwierdzenie wypłaty. Środki są już zablokowane, zanim zaczniesz pracę.
            </div>
          </div>
        </AnimateOnScroll>
      </div>
    </section>
  );
}

function BenefitsSection() {
  return (
    <section className="bg-[linear-gradient(135deg,#071739_0%,#132d70_100%)] px-4 py-20 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto max-w-3xl text-center">
          <SectionBadge dark>Dlaczego Student2Work</SectionBadge>
          <h2 className="mt-6 text-4xl font-black leading-tight sm:text-5xl">
            Zdobywaj doświadczenie, zarabiaj i buduj przyszłość.
          </h2>
          <p className="mx-auto mt-5 max-w-3xl text-lg font-semibold leading-8 text-white/65">
            Pomagamy studentom znaleźć pracę dopasowaną do studiów i zdobyć realne doświadczenie zawodowe.
          </p>
        </div>

        <div className="mt-14 grid gap-5 md:grid-cols-3">
          {benefits.map(({ title, description, icon: Icon }, index) => (
            <AnimateOnScroll key={title} delay={index * 140}>
              <div className="landing-hover-lift h-full rounded-2xl border border-white/10 bg-white/[0.06] p-7 hover:border-lime-300/35 hover:shadow-2xl hover:shadow-slate-950/20">
                <div className="mb-7 flex h-14 w-14 items-center justify-center rounded-xl bg-lime-300/12 text-[#c5fb37]">
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-black">{title}</h3>
                <p className="mt-4 text-sm font-semibold leading-7 text-white/62">{description}</p>
              </div>
            </AnimateOnScroll>
          ))}
        </div>
      </div>
    </section>
  );
}

function PayoutSection() {
  const points = [
    "Aplikujesz w kilka sekund",
    "Czat bezpośrednio z firmą",
    "Szybkie wsparcie platformy",
    "Nieograniczona liczba zleceń",
    "Bezpieczne płatności przez depozyt",
    "Bez opłat - prowizja po wypłacie",
  ];

  return (
    <section id="wyplata" className="bg-white px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <AnimateOnScroll>
          <div className="grid gap-8 rounded-[1.65rem] bg-[linear-gradient(135deg,#10286a_0%,#173783_100%)] p-8 text-white shadow-[0_35px_90px_-45px_rgba(15,36,96,0.75)] lg:grid-cols-[0.8fr_1.2fr] lg:p-10">
            <div className="flex min-h-56 items-center justify-center rounded-2xl bg-white/8">
              <div className="landing-subtle-pulse flex h-24 w-24 items-center justify-center rounded-3xl bg-[#c5fb37]/15 text-[#c5fb37]">
                <Banknote className="h-12 w-12" />
              </div>
            </div>
            <div>
              <h2 className="text-4xl font-black leading-tight sm:text-5xl">Wypłata zaraz po akceptacji</h2>
              <p className="mt-5 text-lg font-semibold leading-8 text-white/65">
                Nie czekasz do końca miesiąca. Środki są zabezpieczone w depozycie już od startu, a po akceptacji efektu trafiają prosto na Twoje konto.
              </p>
              <div className="mt-7 grid gap-4 sm:grid-cols-2">
                {points.map((point, index) => (
                  <AnimateOnScroll key={point} delay={index * 80}>
                    <div className="flex items-center gap-3 text-sm font-black text-white/80">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-lime-300/16 text-[#c5fb37]">
                        <Check className="h-3.5 w-3.5" />
                      </span>
                      {point}
                    </div>
                  </AnimateOnScroll>
                ))}
              </div>
            </div>
          </div>
        </AnimateOnScroll>
      </div>
    </section>
  );
}

function TestimonialsSection() {
  return (
    <section id="opinie" className="bg-slate-100 px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto max-w-3xl text-center">
          <SectionBadge>Opinie</SectionBadge>
          <h2 className="mt-6 text-4xl font-black leading-tight text-[#0f2460] sm:text-5xl">
            Możliwości dla tysięcy studentów.
          </h2>
          <p className="mt-5 text-lg font-semibold leading-8 text-slate-600">
            Tak studenci opisują pracę przez Student2Work.
          </p>
        </div>

        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {testimonials.map((item, index) => (
            <AnimateOnScroll key={item.name} delay={index * 90}>
              <div className="landing-hover-lift rounded-2xl border border-slate-200 bg-white p-7 shadow-sm hover:shadow-xl">
                <div className="mb-6 flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star key={star} className="h-4 w-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="min-h-28 text-base font-semibold leading-7 text-slate-700">&quot;{item.text}&quot;</p>
                <div className="mt-6 flex items-center gap-3 border-t border-slate-100 pt-5">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#0f2460] text-sm font-black text-white">
                    {item.initials}
                  </div>
                  <div>
                    <p className="font-black text-[#0f2460]">{item.name}</p>
                    <p className="text-sm font-semibold text-slate-400">Student na Student2Work</p>
                  </div>
                </div>
              </div>
            </AnimateOnScroll>
          ))}
        </div>
      </div>
    </section>
  );
}

function FinalCTA() {
  return (
    <section className="relative overflow-hidden bg-[#c5fb37] px-4 py-20 sm:px-6 lg:px-8">
      <div className="absolute -left-24 -top-36 h-80 w-80 rounded-full border border-[#0f2460]/10" />
      <div className="absolute -bottom-24 -right-24 h-80 w-80 rounded-full border border-[#0f2460]/10" />
      <AnimateOnScroll>
        <div className="relative mx-auto max-w-5xl text-center">
          <h2 className="text-4xl font-black leading-tight text-[#0f2460] sm:text-6xl">Zacznij zarabiać już dziś.</h2>
          <p className="mx-auto mt-6 max-w-3xl text-lg font-semibold leading-8 text-[#0f2460]/75">
            Rejestracja zajmuje 2 minuty. Załóż konto i aplikuj na pierwsze zlecenie.
          </p>
          <div className="mt-9 flex flex-col justify-center gap-4 sm:flex-row">
            <Button asChild className="landing-hover-lift h-14 rounded-full bg-[#0f2460] px-9 text-base font-black text-white hover:bg-[#071739]">
              <Link href="/auth?role=student">
                Załóż konto studenta
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button asChild variant="outline" className="landing-hover-lift h-14 rounded-full border-[#0f2460] bg-transparent px-9 text-base font-black text-[#0f2460] hover:bg-[#0f2460]/5">
              <Link href="#zlecenia">Zobacz zlecenia</Link>
            </Button>
          </div>
          <p className="mt-8 text-sm font-black text-[#0f2460]/55">
            Bezpłatna rejestracja · Zweryfikowane firmy · Wypłata po akceptacji
          </p>
        </div>
      </AnimateOnScroll>
    </section>
  );
}

function StudentFooter() {
  return (
    <footer className="bg-[#071739] px-4 py-16 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-12 lg:grid-cols-[1.2fr_2fr]">
          <div>
            <LogoMark dark />
            <p className="mt-7 max-w-sm text-lg font-semibold leading-8 text-white/62">
              Operacyjne wsparcie dla małych i średnich firm oraz bezpieczne zlecenia dla studentów.
            </p>
          </div>

          <div className="grid gap-8 sm:grid-cols-3">
            {[
              { title: "Platforma", links: [["Jak to działa", "#jak-zaczac"], ["Kategorie zleceń", "#zlecenia"], ["Opinie", "#opinie"]] },
              { title: "Dla firm", links: [["Deleguj zadanie", "/"], ["Jak działa depozyt", "/#bezpieczenstwo"], ["Cennik", "/#cennik"]] },
              { title: "Dla studentów", links: [["Giełda zleceń", "#zlecenia"], ["Jak zacząć", "#jak-zaczac"], ["Wypłaty i PIT", "#wyplata"]] },
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
            <Link href="/polityka-prywatnosci" className="hover:text-white">Polityka prywatności</Link>
            <Link href="/polityka-prywatnosci" className="hover:text-white">RODO</Link>
          </div>
          <p className="inline-flex items-center gap-2 text-emerald-300">
            <LockKeyhole className="h-4 w-4" />
            Płatności chronione przez depozyt Student2Work i Stripe
          </p>
        </div>
      </div>
    </footer>
  );
}

export default function StudentLandingPage() {
  return (
    <div className="landing-page min-h-screen overflow-x-clip bg-white font-sans text-slate-950">
      <StudentNav />
      <main>
        <StudentHero />
        <JobsMarquee />
        <ComparisonSection />
        <BenefitsSection />
        <PayoutSection />
        <TestimonialsSection />
        <FinalCTA />
      </main>
      <StudentFooter />
    </div>
  );
}
