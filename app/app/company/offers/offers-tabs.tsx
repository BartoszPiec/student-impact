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
      <JobsTab offers={[...jobs, ...systemServices]} serviceOrders={studentServices} statsMap={statsMap} />
    </div>
  );
}
