"use client";

import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import { AlertTriangle, Archive, ClipboardCheck, Search, SlidersHorizontal, Timer, Users } from "lucide-react";

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
  { key: "delivery", label: "W realizacji" },
  { key: "action", label: "Do decyzji" },
  { key: "candidates", label: "Kandydaci" },
  { key: "terms", label: "Warunki" },
  { key: "review", label: "Do odbioru" },
  { key: "closed", label: "Archiwum" },
];

function SummaryTile({
  icon,
  label,
  value,
  tone,
  highlight = false,
}: {
  icon: ReactNode;
  label: string;
  value: number;
  tone: "amber" | "emerald" | "blue" | "red" | "slate";
  highlight?: boolean;
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

  const highlightClass =
    tone === "blue"
      ? "border-indigo-200 bg-indigo-50/80 ring-1 ring-indigo-100"
      : tone === "emerald"
        ? "border-emerald-200 bg-emerald-50/80 ring-1 ring-emerald-100"
        : tone === "amber"
          ? "border-amber-200 bg-amber-50/80 ring-1 ring-amber-100"
          : "border-slate-200 bg-slate-50";

  return (
    <div className={cn("rounded-2xl border border-transparent px-4 py-3 transition hover:bg-slate-50", highlight && highlightClass)}>
      <div className="flex items-center gap-3">
        <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl", iconClass)}>{icon}</div>
        <div className="min-w-0">
          <span className="block text-2xl font-black leading-none text-slate-950">{value}</span>
          <p className="mt-1 text-sm font-bold leading-tight text-slate-600">{label}</p>
        </div>
      </div>
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
  highlight = false,
}: {
  title: string;
  description: string;
  items: OfferWithModel[];
  compact?: boolean;
  highlight?: boolean;
}) {
  if (items.length === 0) return null;

  return (
    <section className={cn("space-y-4", highlight && "rounded-[2rem] border border-emerald-200 bg-emerald-50/45 p-4 shadow-sm")}>
      <div className={cn("flex flex-wrap items-end justify-between gap-2 border-b pb-3", highlight ? "border-emerald-200" : "border-slate-200")}>
        <div>
          <h2 className="text-lg font-black text-slate-950">{title}</h2>
          <p className="mt-1 text-sm font-medium text-slate-500">{description}</p>
        </div>
        <span className={cn("rounded-full px-3 py-1 text-xs font-black", highlight ? "bg-emerald-100 text-emerald-700" : "bg-indigo-50 text-indigo-700")}>
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
  const normalizedType = offer.typ?.toLocaleLowerCase("pl-PL") ?? "";
  const isChallenge = normalizedType.includes("challenge") || normalizedType.includes("wyzwan");

  if (isChallenge) {
    return {
      ...offer,
      itemType: "offer",
      itemLabel: "Wyzwanie",
    };
  }

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
      <div className="rounded-[1.75rem] border border-slate-200 bg-white p-2 shadow-sm">
        <div className="grid gap-1 md:grid-cols-4">
          <SummaryTile icon={<AlertTriangle className="h-4 w-4" />} label="Do decyzji" value={actionItems.length} tone="amber" />
          <SummaryTile icon={<Timer className="h-4 w-4" />} label="W realizacji" value={deliveryItems.length} tone="blue" highlight />
          <SummaryTile icon={<Users className="h-4 w-4" />} label="Kandydaci" value={candidatesItems.length} tone="emerald" />
          <SummaryTile icon={<ClipboardCheck className="h-4 w-4" />} label="Do odbioru" value={reviewItems.length} tone="red" />
        </div>
      </div>

      <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-2xl font-black tracking-tight text-slate-950">Moje ogloszenia i usługi</h2>
            <p className="mt-1 text-sm font-medium text-slate-500">
              {actionItems.length > 0
                ? `${actionItems.length} elementow czeka teraz na decyzje firmy.`
                : "Brak pozycji wymagajacych natychmiastowej reakcji."}
            </p>
          </div>

          <label className="relative block w-full lg:w-[320px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Szukaj po tytule lub studencie"
              className="h-11 rounded-2xl border-slate-200 bg-white pl-9 font-medium shadow-inner"
            />
          </label>
        </div>

        <div className="mt-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-2">
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

              const isActive = filter === item.key;
              const isActionTab = item.key === "action";
              const isDeliveryTab = item.key === "delivery";

              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setFilter(item.key)}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-bold transition",
                    isActive
                      ? isActionTab
                        ? "border-amber-200 bg-amber-50 text-amber-800"
                        : isDeliveryTab
                          ? "border-emerald-200 bg-emerald-600 text-white shadow-sm shadow-emerald-100"
                        : "border-indigo-200 bg-indigo-600 text-white"
                      : isActionTab
                        ? "border-amber-200 bg-white text-amber-700 hover:bg-amber-50"
                        : isDeliveryTab
                          ? "border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
                        : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900",
                  )}
                >
                  {isActionTab ? <span className="h-2 w-2 rounded-full bg-amber-400" /> : null}
                  {isDeliveryTab ? <span className="h-2 w-2 rounded-full bg-emerald-400" /> : null}
                  {item.label}
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-xs",
                      isActive
                        ? isActionTab
                          ? "bg-amber-100 text-amber-800"
                          : isDeliveryTab
                            ? "bg-white/20 text-white"
                          : "bg-white/20 text-white"
                        : isDeliveryTab
                          ? "bg-white text-emerald-700"
                          : "bg-slate-100 text-slate-500",
                    )}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600">
            <SlidersHorizontal className="h-4 w-4 text-slate-400" />
            Widok operacyjny firmy
          </div>
        </div>
      </div>

      {filter === "active" ? (
        <div className="space-y-8">
          <Section
            title="W realizacji"
            description="Prace po wyborze wykonawcy, które czekają na dostarczenie efektu."
            items={deliveryItems.filter((item) => !item.actionRequired)}
            highlight
          />
          <Section
            title="Do decyzji"
            description="Tu trafia wszystko, co wymaga reakcji firmy: wyboru, akceptacji albo sprawdzenia."
            items={actionItems}
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
