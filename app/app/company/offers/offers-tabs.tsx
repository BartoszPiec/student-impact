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
      <div className="rounded-3xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
        <p className="text-sm font-medium text-slate-600">
          Jedna lista pokazuje ogłoszenia, zamówione usługi i ich aktualny stan pracy.
        </p>
      </div>

      <JobsTab
        offers={[...jobs, ...systemServices]}
        serviceOrders={studentServices}
        statsMap={statsMap}
      />
    </div>
  );
}
