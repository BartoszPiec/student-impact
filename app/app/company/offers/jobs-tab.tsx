"use client";

import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import { AlertTriangle, Archive, ClipboardCheck, Search, Timer, Users } from "lucide-react";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import OfferCard, {
  resolveOfferCardModel,
  type CompanyOffer,
  type CompanyOfferStats,
  type OfferStage,
  type OfferWorkState,
} from "./offer-card";

type JobsTabProps = {
  offers: CompanyOffer[];
  serviceOrders: ServiceOrderForList[];
  statsMap: Record<string, CompanyOfferStats | undefined>;
};

export type ServiceOrderForList = {
  id: string;
  created_at: string | null;
  status: string | null;
  amount: number | null;
  counter_amount?: number | null;
  package?: {
    title?: string | null;
  } | null;
};

type FilterKey = "active" | "action" | "candidates" | "terms" | "delivery" | "review" | "closed";

type OfferWithModel = {
  offer: CompanyOffer;
  stats: CompanyOfferStats;
  state: OfferWorkState;
  stage: OfferStage;
  actionRequired: boolean;
};

const emptyStats: CompanyOfferStats = {
  total: 0,
  sent: 0,
  accepted: 0,
  hasApproved: false,
  hasDelivered: false,
  acceptedAppId: null,
  acceptedProfile: null,
  acceptedStudentId: null,
  agreedStawka: null,
  contractStatus: null,
};

const filters: Array<{ key: FilterKey; label: string }> = [
  { key: "active", label: "Aktywne" },
  { key: "action", label: "Do decyzji" },
  { key: "candidates", label: "Kandydaci" },
  { key: "terms", label: "Warunki" },
  { key: "delivery", label: "Realizacja" },
  { key: "review", label: "Do odbioru" },
  { key: "closed", label: "Archiwum" },
];

function SummaryTile({
  icon,
  label,
  value,
  tone,
}: {
  icon: ReactNode;
  label: string;
  value: number;
  tone: "amber" | "emerald" | "blue" | "red" | "slate";
}) {
  const iconClass =
    tone === "amber"
      ? "bg-amber-100 text-amber-700"
      : tone === "emerald"
        ? "bg-emerald-100 text-emerald-700"
        : tone === "blue"
          ? "bg-indigo-100 text-indigo-700"
          : tone === "red"
            ? "bg-rose-100 text-rose-700"
            : "bg-slate-100 text-slate-600";

  return (
    <div className="rounded-2xl px-4 py-3 transition hover:bg-slate-50">
      <div className="flex items-center justify-between gap-3">
        <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl", iconClass)}>{icon}</div>
        <span className="text-2xl font-black text-slate-950">{value}</span>
      </div>
      <p className="mt-3 text-sm font-bold text-slate-600">{label}</p>
    </div>
  );
}

function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-3xl border border-dashed border-slate-300 bg-white/70 px-5 py-10 text-center shadow-sm">
      <p className="font-semibold text-slate-900">{title}</p>
      <p className="mt-1 text-sm text-slate-500">{description}</p>
    </div>
  );
}

function Section({
  title,
  description,
  items,
  compact = false,
}: {
  title: string;
  description: string;
  items: OfferWithModel[];
  compact?: boolean;
}) {
  if (items.length === 0) return null;

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-2 border-b border-slate-200 pb-3">
        <div>
          <h2 className="text-lg font-black text-slate-950">{title}</h2>
          <p className="mt-1 text-sm font-medium text-slate-500">{description}</p>
        </div>
        <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-black text-indigo-700">
          {items.length}
        </span>
      </div>
      <div className="space-y-3">
        {items.map((item) => (
          <OfferCard key={`${item.offer.itemType}:${item.offer.id}`} offer={item.offer} stats={item.stats} compact={compact} />
        ))}
      </div>
    </section>
  );
}

function serviceOrderToOffer(order: ServiceOrderForList): CompanyOffer {
  return {
    id: order.id,
    itemType: "service_order",
    itemLabel: "Usługa",
    tytul: order.package?.title || "Zamówienie usługi",
    typ: "service_order",
    stawka: order.amount,
    status: order.status,
    created_at: order.created_at,
    location: null,
    salary_range_min: null,
    salary_range_max: null,
    is_remote: null,
    contract_type: null,
    is_platform_service: true,
  };
}

function offerWithLabel(offer: CompanyOffer): CompanyOffer {
  return {
    ...offer,
    itemType: "offer",
    itemLabel: offer.is_platform_service ? "Usługa" : "Ogłoszenie",
  };
}

export default function JobsTab({ offers, serviceOrders, statsMap }: JobsTabProps) {
  const [filter, setFilter] = useState<FilterKey>("active");
  const [query, setQuery] = useState("");

  const allItems = useMemo<OfferWithModel[]>(
    () =>
      [...offers.map(offerWithLabel), ...serviceOrders.map(serviceOrderToOffer)].map((offer) => {
        const stats = offer.itemType === "service_order" ? emptyStats : statsMap[offer.id] ?? emptyStats;
        const model = resolveOfferCardModel(offer, stats);
        return {
          offer,
          stats,
          state: model.workState,
          stage: model.stage,
          actionRequired: model.actionRequired,
        };
      }),
    [offers, serviceOrders, statsMap],
  );

  const searchedItems = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return allItems;
    return allItems.filter((item) => {
      const title = item.offer.tytul?.toLowerCase() ?? "";
      const student = item.stats.acceptedProfile?.first_name.toLowerCase() ?? "";
      const type = item.offer.itemLabel?.toLowerCase() ?? "";
      return title.includes(normalizedQuery) || student.includes(normalizedQuery) || type.includes(normalizedQuery);
    });
  }, [allItems, query]);

  const actionItems = searchedItems.filter((item) => item.actionRequired);
  const candidatesItems = searchedItems.filter((item) => item.stage === "candidates");
  const termsItems = searchedItems.filter((item) => item.stage === "terms");
  const deliveryItems = searchedItems.filter((item) => item.stage === "delivery");
  const reviewItems = searchedItems.filter((item) => item.stage === "review");
  const closedItems = searchedItems.filter((item) => item.state === "closed");
  const activeItems = searchedItems.filter((item) => item.state !== "closed");

  const visibleItems =
    filter === "action"
      ? actionItems
      : filter === "candidates"
        ? candidatesItems
        : filter === "terms"
          ? termsItems
          : filter === "delivery"
            ? deliveryItems
            : filter === "review"
              ? reviewItems
              : filter === "closed"
                ? closedItems
                : activeItems;

  return (
    <div className="space-y-7">
      <div className="rounded-[1.5rem] border border-slate-200 bg-white p-2 shadow-sm">
        <div className="grid gap-1 md:grid-cols-4">
          <SummaryTile icon={<AlertTriangle className="h-4 w-4" />} label="Do decyzji" value={actionItems.length} tone="amber" />
          <SummaryTile icon={<Users className="h-4 w-4" />} label="Kandydaci" value={candidatesItems.length} tone="emerald" />
          <SummaryTile icon={<Timer className="h-4 w-4" />} label="W realizacji" value={deliveryItems.length} tone="blue" />
          <SummaryTile icon={<ClipboardCheck className="h-4 w-4" />} label="Do odbioru" value={reviewItems.length} tone="red" />
        </div>
      </div>

      <div className="flex flex-col gap-4 rounded-[1.5rem] border border-slate-200 bg-white p-3 shadow-sm lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-1.5 rounded-2xl bg-slate-100/80 p-1.5">
          {filters.map((item) => {
            const count =
              item.key === "action"
                ? actionItems.length
                : item.key === "candidates"
                  ? candidatesItems.length
                  : item.key === "terms"
                    ? termsItems.length
                    : item.key === "delivery"
                      ? deliveryItems.length
                      : item.key === "review"
                        ? reviewItems.length
                        : item.key === "closed"
                          ? closedItems.length
                          : activeItems.length;

            return (
              <button
                key={item.key}
                type="button"
                onClick={() => setFilter(item.key)}
                className={cn(
                  "rounded-xl px-3 py-2 text-sm font-bold transition",
                  filter === item.key
                    ? "bg-white text-indigo-700 shadow-md shadow-slate-200/70"
                    : "text-slate-600 hover:bg-white/60 hover:text-slate-900",
                )}
              >
                {item.label}
                <span className={cn("ml-2 rounded-full px-1.5 py-0.5 text-xs", filter === item.key ? "bg-white/15" : "bg-slate-100")}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        <label className="relative block w-full lg:w-[340px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Szukaj po tytule lub studencie"
            className="h-11 rounded-2xl border-slate-200 bg-white pl-9 font-medium shadow-inner"
          />
        </label>
      </div>

      {filter === "active" ? (
        <div className="space-y-8">
          <Section
            title="Do decyzji"
            description="Tu trafia wszystko, co wymaga reakcji firmy: wyboru, akceptacji albo sprawdzenia."
            items={actionItems}
          />
          <Section
            title="W realizacji"
            description="Prace, które są już po wyborze wykonawcy i czekają na dostarczenie."
            items={deliveryItems.filter((item) => !item.actionRequired)}
          />
          <Section
            title="Uzgadnianie warunków"
            description="Elementy, w których trwa potwierdzanie warunków albo akceptacja wykonawcy."
            items={termsItems.filter((item) => !item.actionRequired)}
            compact
          />
          <Section
            title="Nabór i wybór wykonawcy"
            description="Ogłoszenia zbierające aplikacje oraz usługi czekające na wskazanie studenta."
            items={candidatesItems.filter((item) => !item.actionRequired)}
            compact
          />
          {activeItems.length === 0 ? (
            <EmptyState title="Brak aktywnych elementów" description="Dodane ogłoszenia i usługi pojawią się tutaj po utworzeniu." />
          ) : null}
        </div>
      ) : visibleItems.length === 0 ? (
        <EmptyState
          title="Brak elementów w tym widoku"
          description="Zmień filtr albo wpisz inną frazę w wyszukiwarce."
        />
      ) : (
        <div className="space-y-3">
          {visibleItems.map((item) => (
            <OfferCard key={`${item.offer.itemType}:${item.offer.id}`} offer={item.offer} stats={item.stats} />
          ))}
        </div>
      )}

      {filter === "active" && closedItems.length > 0 ? (
        <details className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <summary className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-slate-700">
            <Archive className="h-4 w-4" />
            Zakończone elementy ({closedItems.length})
          </summary>
          <div className="mt-4 space-y-3">
            {closedItems.map((item) => (
              <OfferCard key={`${item.offer.itemType}:${item.offer.id}`} offer={item.offer} stats={item.stats} compact />
            ))}
          </div>
        </details>
      ) : null}
    </div>
  );
}
