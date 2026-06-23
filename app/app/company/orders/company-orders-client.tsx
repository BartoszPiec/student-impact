"use client";

import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import { Archive, ClipboardCheck, Search, SlidersHorizontal, Timer, Users } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import OfferCard, {
  resolveOfferCardModel,
  type CompanyOffer,
  type CompanyOfferStats,
} from "../offers/offer-card";
import { getCompanyOrderStatusOptions } from "./company-order-status";

type ServiceOrderRow = {
  id: string;
  created_at: string | null;
  status: string | null;
  amount: number | null;
  counter_amount: number | null;
  student_id: string | null;
  package:
    | {
        id?: string | null;
        title?: string | null;
      }
    | {
        id?: string | null;
        title?: string | null;
      }[]
    | null;
};

type StudentProfilePreview = {
  public_name: string | null;
};

type CompanyOrdersClientProps = {
  initialOrders: ServiceOrderRow[];
  studentData: Record<string, StudentProfilePreview>;
};

type FilterKey = "all" | "action" | "terms" | "delivery" | "closed";

type OrderListItem = {
  order: ServiceOrderRow;
  offer: CompanyOffer;
  stats: CompanyOfferStats;
  state: ReturnType<typeof resolveOfferCardModel>["workState"];
  stage: ReturnType<typeof resolveOfferCardModel>["stage"];
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
  { key: "all", label: "Wszystkie" },
  { key: "action", label: "Do decyzji" },
  { key: "terms", label: "Warunki" },
  { key: "delivery", label: "W realizacji" },
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
  tone: "indigo" | "amber" | "emerald" | "slate";
}) {
  const toneClass =
    tone === "indigo"
      ? "bg-indigo-100 text-indigo-700"
      : tone === "amber"
        ? "bg-amber-100 text-amber-700"
        : tone === "emerald"
          ? "bg-emerald-100 text-emerald-700"
          : "bg-slate-100 text-slate-600";

  return (
    <div className="rounded-2xl px-4 py-3 transition hover:bg-slate-50">
      <div className="flex items-center justify-between gap-3">
        <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl", toneClass)}>{icon}</div>
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
}: {
  title: string;
  description: string;
  items: OrderListItem[];
}) {
  if (items.length === 0) return null;

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-2 border-b border-slate-200 pb-3">
        <div>
          <h2 className="text-lg font-black text-slate-950">{title}</h2>
          <p className="mt-1 text-sm font-medium text-slate-500">{description}</p>
        </div>
        <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-black text-indigo-700">{items.length}</span>
      </div>
      <div className="space-y-3">
        {items.map((item) => (
          <OfferCard key={item.order.id} offer={item.offer} stats={item.stats} />
        ))}
      </div>
    </section>
  );
}

function orderToOffer(order: ServiceOrderRow): CompanyOffer {
  const pkg = Array.isArray(order.package) ? order.package[0] ?? null : order.package;

  return {
    id: order.id,
    itemType: "service_order",
    itemLabel: "Usługa",
    tytul: pkg?.title || "Zamowienie usługi",
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

export default function CompanyOrdersClient({ initialOrders, studentData }: CompanyOrdersClientProps) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [sort, setSort] = useState("newest");
  const [filter, setFilter] = useState<FilterKey>("all");

  const allItems = useMemo<OrderListItem[]>(
    () =>
      initialOrders.map((order) => {
        const offer = orderToOffer(order);
        const preview = order.student_id ? studentData[order.student_id] : null;
        const stats: CompanyOfferStats = {
          ...emptyStats,
          acceptedStudentId: order.student_id,
          acceptedProfile: order.student_id
            ? {
                id: order.student_id,
                first_name: preview?.public_name || "Student",
                last_name: "",
              }
            : null,
        };
        const model = resolveOfferCardModel(offer, stats);
        return {
          order,
          offer,
          stats,
          state: model.workState,
          stage: model.stage,
          actionRequired: model.actionRequired,
        };
      }),
    [initialOrders, studentData],
  );

  const filteredItems = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    let result = [...allItems];

    if (normalizedQuery) {
      result = result.filter((item) => {
        const title = item.offer.tytul?.toLowerCase() ?? "";
        const performer = item.stats.acceptedProfile?.first_name.toLowerCase() ?? "";
        return title.includes(normalizedQuery) || performer.includes(normalizedQuery);
      });
    }

    if (status !== "all") {
      result = result.filter((item) => item.order.status === status);
    }

    result.sort((a, b) => {
      if (sort === "oldest") {
        return new Date(a.order.created_at ?? 0).getTime() - new Date(b.order.created_at ?? 0).getTime();
      }
      if (sort === "amount_desc") {
        return (b.order.counter_amount ?? b.order.amount ?? 0) - (a.order.counter_amount ?? a.order.amount ?? 0);
      }
      if (sort === "amount_asc") {
        return (a.order.counter_amount ?? a.order.amount ?? 0) - (b.order.counter_amount ?? b.order.amount ?? 0);
      }
      return new Date(b.order.created_at ?? 0).getTime() - new Date(a.order.created_at ?? 0).getTime();
    });

    return result;
  }, [allItems, query, sort, status]);

  const actionItems = filteredItems.filter((item) => item.actionRequired);
  const termsItems = filteredItems.filter((item) => item.stage === "terms");
  const deliveryItems = filteredItems.filter((item) => item.stage === "delivery");
  const closedItems = filteredItems.filter((item) => item.state === "closed");
  const inProgressItems = filteredItems.filter((item) => !item.actionRequired && item.state !== "closed");

  const visibleItems =
    filter === "action"
      ? actionItems
      : filter === "terms"
        ? termsItems
        : filter === "delivery"
          ? deliveryItems
          : filter === "closed"
            ? closedItems
            : filteredItems;

  return (
    <div className="space-y-7">
      <div className="rounded-[1.75rem] border border-slate-200 bg-white p-2 shadow-sm">
        <div className="grid gap-1 md:grid-cols-4">
          <SummaryTile icon={<Users className="h-4 w-4" />} label="Do decyzji" value={actionItems.length} tone="indigo" />
          <SummaryTile icon={<SlidersHorizontal className="h-4 w-4" />} label="Warunki" value={termsItems.length} tone="amber" />
          <SummaryTile icon={<Timer className="h-4 w-4" />} label="W realizacji" value={deliveryItems.length} tone="emerald" />
          <SummaryTile icon={<ClipboardCheck className="h-4 w-4" />} label="Archiwum" value={closedItems.length} tone="slate" />
        </div>
      </div>

      <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-2xl font-black tracking-tight text-slate-950">Moje zamowienia usług</h2>
            <p className="mt-1 text-sm font-medium text-slate-500">
              {actionItems.length > 0
                ? `${actionItems.length} pozycji czeka teraz na reakcje firmy.`
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

        <div className="mt-4 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-wrap gap-2">
            {filters.map((item) => {
              const count =
                item.key === "action"
                  ? actionItems.length
                  : item.key === "terms"
                    ? termsItems.length
                    : item.key === "delivery"
                      ? deliveryItems.length
                      : item.key === "closed"
                        ? closedItems.length
                        : filteredItems.length;

              const isActive = filter === item.key;

              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setFilter(item.key)}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-bold transition",
                    isActive
                      ? item.key === "action"
                        ? "border-indigo-200 bg-indigo-600 text-white"
                        : item.key === "terms"
                          ? "border-amber-200 bg-amber-50 text-amber-800"
                          : item.key === "delivery"
                            ? "border-emerald-200 bg-emerald-600 text-white"
                            : item.key === "closed"
                              ? "border-slate-300 bg-slate-700 text-white"
                              : "border-indigo-200 bg-indigo-600 text-white"
                      : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900",
                  )}
                >
                  {item.label}
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-xs",
                      isActive ? "bg-white/20 text-current" : "bg-slate-100 text-slate-500",
                    )}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="h-11 w-full rounded-2xl border-slate-200 bg-white font-bold text-slate-700 sm:w-[230px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                {getCompanyOrderStatusOptions().map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={sort} onValueChange={setSort}>
              <SelectTrigger className="h-11 w-full rounded-2xl border-slate-200 bg-white font-bold text-slate-700 sm:w-[190px]">
                <SelectValue placeholder="Sortowanie" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Najnowsze</SelectItem>
                <SelectItem value="oldest">Najstarsze</SelectItem>
                <SelectItem value="amount_desc">Kwota malejaco</SelectItem>
                <SelectItem value="amount_asc">Kwota rosnaco</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {filteredItems.length === 0 ? (
        <EmptyState
          title="Brak zamowien w tym widoku"
          description="Zmien filtr albo wpisz inna fraze w wyszukiwarce."
        />
      ) : filter === "all" ? (
        <div className="space-y-8">
          <Section
            title="Wymaga reakcji firmy"
            description="Wyceny, wybor wykonawcy i etapy, w których decyzja jest teraz po Twojej stronie."
            items={actionItems}
          />
          <Section
            title="W toku"
            description="Zamowienia po uzgodnieniach, które nie wymagaja teraz bezpośredniej reakcji firmy."
            items={inProgressItems}
          />
          {closedItems.length > 0 ? (
            <details className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <summary className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-slate-700">
                <Archive className="h-4 w-4" />
                Zakonczone elementy ({closedItems.length})
              </summary>
              <div className="mt-4 space-y-3">
                {closedItems.map((item) => (
                  <OfferCard key={item.order.id} offer={item.offer} stats={item.stats} compact />
                ))}
              </div>
            </details>
          ) : null}
        </div>
      ) : visibleItems.length === 0 ? (
        <EmptyState
          title="Brak elementow w tym widoku"
          description="Zmien filtr lub status, aby zobaczyc inne zamowienia."
        />
      ) : (
        <div className="space-y-3">
          {visibleItems.map((item) => (
            <OfferCard key={item.order.id} offer={item.offer} stats={item.stats} />
          ))}
        </div>
      )}
    </div>
  );
}
