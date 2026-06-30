"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import {
  BarChart,
  Bot,
  ChevronRight,
  Clipboard,
  Code,
  Database,
  Globe,
  Languages,
  Palette,
  PenTool,
  TrendingUp,
  Video,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

const LandingServiceDialog = dynamic(
  () => import("./landing-service-dialog").then((module) => module.LandingServiceDialog),
  { ssr: false },
);

export type ServiceDetails = {
  description: string;
  stats: { price: string; time: string; scope: string; mode: string };
  examples: string[];
  funFact: string;
};

const SERVICE_ICONS: Record<string, LucideIcon> = {
  "Lead research": TrendingUp,
  "Prospecting i outreach": TrendingUp,
  "Prezentacje i materiały": Palette,
  "Data entry i CRM": Database,
  "Content i social media": PenTool,
  "Wsparcie operacyjne": Clipboard,
  "Strony i CMS": Globe,
  "Analiza i raporty": BarChart,
  "Wideo i multimedia": Video,
  "Programowanie i IT": Code,
  "Tłumaczenia": Languages,
  "Automatyzacje AI": Bot,
};

const MODELS = [
  { id: "standard", label: "Zlecenie jednorazowe" },
  { id: "longterm", label: "Współpraca długoterminowa" },
  { id: "services", label: "Usługi studentów" },
] as const;

const STEPS = {
  standard: [
    { n: "01", title: "Opisujesz zadanie", desc: "Wrzucasz opis, budżet, termin i zakres. Zajmuje to mniej niż 5 minut.", icon: "📋" },
    { n: "02", title: "Dostajesz oferty", desc: "Otrzymujesz aplikacje zweryfikowanych wykonawców i wybierasz najlepszego.", icon: "🔎" },
    { n: "03", title: "Praca rusza", desc: "Ustalasz etapy i terminy. Wykonawca raportuje postępy.", icon: "⚡" },
    { n: "04", title: "Płacisz po akceptacji", desc: "Po akceptacji efektu środki z depozytu trafiają do wykonawcy.", icon: "✅" },
  ],
  longterm: [
    { n: "01", title: "Określasz potrzeby", desc: "Opisujesz stałe obowiązki, wymiar czasu, stawkę i tryb pracy.", icon: "📋" },
    { n: "02", title: "Wybierasz osobę", desc: "Przeglądasz profile i rozmawiasz przez czat.", icon: "🤝" },
    { n: "03", title: "Stała współpraca", desc: "Wybrana osoba regularnie realizuje ustalony zakres.", icon: "📅" },
    { n: "04", title: "Skalujesz lub kończysz", desc: "Elastycznie zwiększasz zespół albo zamykasz zakończony projekt.", icon: "📈" },
  ],
  services: [
    { n: "01", title: "Wybierasz kategorię", desc: "Przeglądasz katalog konkretnych zadań Growth, Ops i Admin.", icon: "🛒" },
    { n: "02", title: "Zamawiasz pakiet", desc: "Wybierasz gotowy pakiet z określoną ceną i terminem.", icon: "📦" },
    { n: "03", title: "Dostajesz efekt", desc: "Sprawdzasz rezultat, akceptujesz go lub prosisz o poprawkę.", icon: "🔄" },
    { n: "04", title: "Wracasz po kolejne", desc: "Kolejne zadanie zamawiasz bez ponownego onboardingu.", icon: "⭐" },
  ],
} as const;

export function HowItWorksSwitcher() {
  const [activeModel, setActiveModel] = useState<keyof typeof STEPS>("standard");

  return (
    <>
      <div className="mb-10 flex flex-col gap-2 sm:mb-14 sm:flex-row sm:flex-wrap sm:justify-center">
        {MODELS.map((model) => (
          <button
            key={model.id}
            type="button"
            onClick={() => setActiveModel(model.id)}
            className={cn(
              "w-full rounded-full border px-5 py-3 text-sm font-bold transition-all sm:w-auto sm:px-6",
              activeModel === model.id
                ? "border-[#0f2460] bg-[#0f2460] text-white shadow-lg"
                : "border-slate-200 bg-white text-slate-500 hover:border-[#7c8ef7] hover:text-[#7c8ef7]",
            )}
          >
            {model.label}
          </button>
        ))}
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
        {STEPS[activeModel].map((step, index) => (
          <div key={step.n} className="group relative rounded-2xl border border-slate-100 bg-slate-50 p-5 transition-all hover:border-[#7c8ef7]/40 hover:bg-white hover:shadow-xl sm:p-7">
            <div className="mb-5 text-3xl">{step.icon}</div>
            <div aria-hidden="true" className="absolute right-6 top-6 select-none text-5xl font-extrabold leading-none text-slate-500 transition-colors group-hover:text-[#5367d9]">
              {step.n}
            </div>
            <h3 className="mb-2 text-base font-bold text-[#0f2460]">{step.title}</h3>
            <p className="text-sm leading-relaxed text-slate-500">{step.desc}</p>
            {index < 3 ? (
              <div className="absolute -right-3 top-1/2 z-10 hidden h-6 w-6 items-center justify-center rounded-full border border-slate-200 bg-white shadow-sm lg:flex">
                <ChevronRight className="h-3 w-3 text-[#7c8ef7]" />
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </>
  );
}

export function ServiceDetailsModal({ name, data }: { name: string; data: ServiceDetails }) {
  const [open, setOpen] = useState(false);
  const Icon = SERVICE_ICONS[name] ?? Clipboard;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="group w-full cursor-pointer rounded-2xl border border-slate-200/70 bg-white p-6 text-center shadow-sm transition-all hover:-translate-y-1 hover:border-[#7c8ef7]/40 hover:shadow-xl"
      >
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[#0f2460]/5 transition-colors group-hover:bg-[#7c8ef7]/10">
          <Icon className="h-6 w-6 text-[#0f2460] transition-colors group-hover:text-[#5367d9]" />
        </div>
        <div className="text-sm font-bold leading-tight text-[#0f2460] transition-colors group-hover:text-[#5367d9]">{name}</div>
        <div className="mt-2 text-[10px] font-medium text-slate-600">Zakres: {data.stats.scope}</div>
      </button>
      {open ? <LandingServiceDialog name={name} data={data} onClose={() => setOpen(false)} /> : null}
    </>
  );
}
