"use client";

import JobsTab, { type ServiceOrderForList } from "./jobs-tab";
import type { CompanyOffer, CompanyOfferStats } from "./offer-card";

type OffersTabsProps = {
  jobs: CompanyOffer[];
  systemServices: CompanyOffer[];
  studentServices: ServiceOrderForList[];
  statsMap: Record<string, CompanyOfferStats | undefined>;
};

export default function OffersTabs({ jobs, systemServices, studentServices, statsMap }: OffersTabsProps) {
  return (
    <div className="space-y-5">
      <div className="rounded-[2rem] border border-slate-200 bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 px-6 py-5 text-white shadow-xl">
        <p className="text-xs font-black uppercase tracking-[0.22em] text-indigo-300">Panel firmy</p>
        <h2 className="mt-2 text-2xl font-black tracking-tight">Lista pracy z systemem wymaganej akcji</h2>
        <p className="mt-2 max-w-3xl text-sm font-medium text-indigo-100/75">
          Ogloszenia, zamowione uslugi i realizacje sa zebrane w jednym widoku. Karty wymagajace decyzji
          dostaja mocniejszy sygnal, a stany spokojne schodza do tla.
        </p>
      </div>

      <JobsTab offers={[...jobs, ...systemServices]} serviceOrders={studentServices} statsMap={statsMap} />
    </div>
  );
}
