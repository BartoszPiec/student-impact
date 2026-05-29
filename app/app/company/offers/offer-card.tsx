"use client";

import Link from "next/link";
import { AlertTriangle, CalendarClock, CheckCircle2, MessageSquare, Users, Zap } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { openChatForApplication } from "../../chat/_actions";

export type CompanyOffer = {
  id: string;
  itemType?: "offer" | "service_order";
  itemLabel?: string;
  tytul: string | null;
  typ: string | null;
  stawka: number | null;
  status: string | null;
  created_at: string | null;
  location: string | null;
  salary_range_min: number | null;
  salary_range_max: number | null;
  is_remote: boolean | null;
  contract_type: string | null;
  is_platform_service: boolean | null;
};

export type CompanyOfferStats = {
  total: number;
  sent: number;
  accepted: number;
  hasApproved: boolean;
  hasDelivered: boolean;
  acceptedAppId: string | null;
  acceptedProfile: { first_name: string; last_name: string; id: string } | null;
  acceptedStudentId: string | null;
  agreedStawka: number | null;
  contractStatus: string | null;
};

export type OfferWorkState = "action" | "collecting" | "in_progress" | "closed";
export type OfferStage = "candidates" | "terms" | "delivery" | "review" | "done";

export type OfferCardModel = {
  workState: OfferWorkState;
  stage: OfferStage;
  stageLabel: string;
  label: string;
  tone: "red" | "amber" | "blue" | "emerald" | "slate";
  actionRequired: boolean;
  actionLabel: string;
  actionHref: string;
  note: string;
};

function formatDate(value?: string | null) {
  if (!value) return "Brak daty";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Brak daty";
  return date.toLocaleDateString("pl-PL", { year: "numeric", month: "long", day: "numeric" });
}

function formatMoney(value: number | null | undefined) {
  if (value == null || !Number.isFinite(value)) return "Do ustalenia";
  return `${value.toLocaleString("pl-PL")} PLN`;
}

function getBudgetLabel(offer: CompanyOffer, stats: CompanyOfferStats, isInProgress: boolean) {
  if (isInProgress && stats.agreedStawka) return formatMoney(stats.agreedStawka);
  if (offer.salary_range_min && offer.salary_range_min > 0) {
    const max = offer.salary_range_max && offer.salary_range_max > offer.salary_range_min
      ? ` - ${offer.salary_range_max.toLocaleString("pl-PL")}`
      : "+";
    return `${offer.salary_range_min.toLocaleString("pl-PL")}${max} PLN`;
  }
  return formatMoney(offer.stawka);
}

function getDetailHref(offer: CompanyOffer) {
  return offer.itemType === "service_order"
    ? `/app/company/orders/${offer.id}`
    : `/app/company/offers/${offer.id}`;
}

function resolveServiceOrderCardModel(offer: CompanyOffer): OfferCardModel {
  const detailHref = getDetailHref(offer);
  const status = offer.status ?? "pending";

  if (["completed", "closed", "cancelled"].includes(status)) {
    return {
      workState: "closed",
      stage: "done",
      stageLabel: "Archiwum",
      label: "Zakończone",
      tone: "slate",
      actionRequired: false,
      actionLabel: "Podgląd",
      actionHref: detailHref,
      note: "Zakończone zamówienie usługi.",
    };
  }

  if (["pending_selection", "pending"].includes(status)) {
    return {
      workState: "action",
      stage: "candidates",
      stageLabel: "Wybór wykonawcy",
      label: "Wymaga wyboru",
      tone: "amber",
      actionRequired: true,
      actionLabel: "Wybierz studenta",
      actionHref: detailHref,
      note: "Wybierz wykonawcę, aby uruchomić realizację.",
    };
  }

  if (["countered", "proposal_sent", "inquiry"].includes(status)) {
    return {
      workState: "action",
      stage: "terms",
      stageLabel: "Warunki",
      label: "Wymaga decyzji",
      tone: "amber",
      actionRequired: true,
      actionLabel: "Sprawdź warunki",
      actionHref: detailHref,
      note: "Zamówienie czeka na decyzję lub uzgodnienie warunków.",
    };
  }

  if (["delivered", "pending_review"].includes(status)) {
    return {
      workState: "action",
      stage: "review",
      stageLabel: "Odbiór pracy",
      label: "Wymaga sprawdzenia",
      tone: "red",
      actionRequired: true,
      actionLabel: "Sprawdź pracę",
      actionHref: detailHref,
      note: "Student dostarczył materiał do akceptacji.",
    };
  }

  if (["pending_student_confirmation", "pending_confirmation"].includes(status)) {
    return {
      workState: "in_progress",
      stage: "terms",
      stageLabel: "Potwierdzenie",
      label: "Czeka na studenta",
      tone: "amber",
      actionRequired: false,
      actionLabel: "Podgląd",
      actionHref: detailHref,
      note: "Student potwierdza przyjęcie realizacji.",
    };
  }

  return {
    workState: "in_progress",
    stage: "delivery",
    stageLabel: "Realizacja",
    label: "W realizacji",
    tone: "blue",
    actionRequired: false,
    actionLabel: "Panel realizacji",
    actionHref: detailHref,
    note: "Zamówienie usługi jest aktywne.",
  };
}

export function resolveOfferCardModel(offer: CompanyOffer, stats: CompanyOfferStats): OfferCardModel {
  if (offer.itemType === "service_order") {
    return resolveServiceOrderCardModel(offer);
  }

  const isClosed = offer.status === "closed" || stats.hasApproved;
  const hasAccepted = stats.accepted > 0;
  const detailHref = getDetailHref(offer);
  const acceptedHref = stats.acceptedAppId ? `/app/deliverables/${stats.acceptedAppId}` : detailHref;

  if (isClosed) {
    return {
      workState: "closed",
      stage: "done",
      stageLabel: "Archiwum",
      label: "Zakończone",
      tone: "slate",
      actionRequired: false,
      actionLabel: "Podgląd",
      actionHref: detailHref,
      note: "Archiwalne ogłoszenie.",
    };
  }

  if (stats.hasDelivered) {
    return {
      workState: "action",
      stage: "review",
      stageLabel: "Odbiór pracy",
      label: "Wymaga sprawdzenia",
      tone: "red",
      actionRequired: true,
      actionLabel: "Sprawdź pracę",
      actionHref: acceptedHref,
      note: "Student dostarczył materiał do akceptacji.",
    };
  }

  if (hasAccepted && stats.contractStatus === "draft") {
    return {
      workState: "action",
      stage: "terms",
      stageLabel: "Warunki",
      label: "Wymaga decyzji",
      tone: "amber",
      actionRequired: true,
      actionLabel: "Uzgodnij warunki",
      actionHref: acceptedHref,
      note: "Warunki są jeszcze w negocjacji.",
    };
  }

  if (!hasAccepted && stats.sent > 0) {
    return {
      workState: "action",
      stage: "candidates",
      stageLabel: "Kandydaci",
      label: "Nowe aplikacje",
      tone: "amber",
      actionRequired: true,
      actionLabel: "Przejrzyj kandydatów",
      actionHref: detailHref,
      note: `${stats.sent} kandydatów czeka na decyzję.`,
    };
  }

  if (offer.status === "in_progress" || hasAccepted) {
    return {
      workState: "in_progress",
      stage: "delivery",
      stageLabel: "Realizacja",
      label: "W realizacji",
      tone: "blue",
      actionRequired: false,
      actionLabel: "Panel realizacji",
      actionHref: acceptedHref,
      note: stats.acceptedProfile
        ? `Realizuje: ${stats.acceptedProfile.first_name}`
        : "Realizacja jest aktywna.",
    };
  }

  return {
    workState: "collecting",
    stage: "candidates",
    stageLabel: "Kandydaci",
    label: "Zbiera kandydatów",
    tone: "emerald",
    actionRequired: false,
    actionLabel: "Szczegóły",
    actionHref: detailHref,
    note: stats.total > 0 ? `${stats.total} aplikacji łącznie.` : "Ogłoszenie jest widoczne dla studentów.",
  };
}

function statusClasses(tone: OfferCardModel["tone"]) {
  if (tone === "red") return "border-red-200 bg-red-50 text-red-700";
  if (tone === "amber") return "border-amber-200 bg-amber-50 text-amber-800";
  if (tone === "blue") return "border-blue-200 bg-blue-50 text-blue-700";
  if (tone === "emerald") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  return "border-slate-200 bg-slate-50 text-slate-600";
}

function stripClasses(tone: OfferCardModel["tone"]) {
  if (tone === "red") return "bg-red-500";
  if (tone === "amber") return "bg-amber-500";
  if (tone === "blue") return "bg-blue-500";
  if (tone === "emerald") return "bg-emerald-500";
  return "bg-slate-300";
}

export default function OfferCard({
  offer,
  stats,
  compact = false,
}: {
  offer: CompanyOffer;
  stats: CompanyOfferStats;
  compact?: boolean;
}) {
  const model = resolveOfferCardModel(offer, stats);
  const isInProgress = model.workState === "in_progress" || model.workState === "action";
  const chatAction = stats.acceptedAppId ? openChatForApplication.bind(null, stats.acceptedAppId) : null;
  const detailHref = getDetailHref(offer);
  const isServiceOrder = offer.itemType === "service_order";
  const itemLabel = offer.itemLabel || (isServiceOrder ? "Usluga" : "Ogloszenie");
  const performerFallback = isServiceOrder && ["pending_selection", "pending"].includes(offer.status ?? "")
    ? "Do wyboru wykonawcy"
    : isServiceOrder
      ? "Szczegóły w zamówieniu"
      : "Bez wykonawcy";

  return (
    <article className="group overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md">
      <div className="flex">
        <div className={cn("w-1.5 shrink-0 transition group-hover:w-2", stripClasses(model.tone))} />
        <div className={cn("grid flex-1 gap-5 p-6 lg:grid-cols-[minmax(0,1fr)_auto]", compact && "p-5")}>
          <div className="min-w-0 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              {model.actionRequired ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-black text-amber-900 ring-1 ring-amber-200">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  Akcja
                </span>
              ) : null}
              <Badge variant="outline" className={cn("rounded-full px-3 py-1 font-bold", statusClasses(model.tone))}>
                {model.label}
              </Badge>
              <Badge variant="outline" className="rounded-full border-indigo-100 bg-indigo-50/70 px-3 py-1 font-bold text-indigo-700">
                Etap: {model.stageLabel}
              </Badge>
              <Badge variant="outline" className="rounded-full border-slate-200 bg-white px-3 py-1 font-bold text-slate-500">
                {itemLabel}
              </Badge>
            </div>

            <div>
              <Link
                href={detailHref}
                className="block truncate text-xl font-black leading-tight text-slate-950 transition hover:text-indigo-700"
              >
                {offer.tytul || (isServiceOrder ? "Zamówienie usługi" : "Ogłoszenie bez tytułu")}
              </Link>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                <span className="font-semibold text-slate-700">Następny krok:</span> {model.note}
              </p>
            </div>

            <div className="flex flex-wrap gap-2 text-sm text-slate-600">
              <span className="inline-flex items-center gap-1.5 rounded-xl bg-slate-50 px-3 py-1.5 font-medium ring-1 ring-slate-200">
                <CalendarClock className="h-4 w-4 text-slate-400" />
                {formatDate(offer.created_at)}
              </span>
              {isServiceOrder ? null : (
                <span className="inline-flex items-center gap-1.5 rounded-xl bg-slate-50 px-3 py-1.5 font-medium ring-1 ring-slate-200">
                  <Zap className="h-4 w-4 text-amber-500" />
                  {stats.total} aplikacji
                </span>
              )}
              {stats.acceptedProfile ? (
                <Link
                  href={`/app/students/${stats.acceptedProfile.id}`}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-50 px-3 py-1.5 font-bold text-indigo-700 ring-1 ring-indigo-100 hover:bg-indigo-100"
                >
                  <Users className="h-4 w-4" />
                  {stats.acceptedProfile.first_name}
                </Link>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-xl bg-slate-50 px-3 py-1.5 font-medium text-slate-500 ring-1 ring-slate-200">
                  <Users className="h-4 w-4" />
                  {performerFallback}
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-col justify-between gap-4 lg:min-w-[220px] lg:items-end">
            <div className="lg:text-right">
              <p className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-400">
                {isInProgress && stats.agreedStawka ? "Uzgodniona stawka" : "Budżet"}
              </p>
              <p className="mt-1 text-2xl font-black text-slate-950">{getBudgetLabel(offer, stats, isInProgress)}</p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button asChild className="h-11 rounded-xl bg-slate-950 px-5 font-bold text-white shadow-lg shadow-slate-200 transition hover:bg-indigo-700 hover:shadow-indigo-200">
                <Link href={model.actionHref}>
                  {model.actionRequired ? (
                    <AlertTriangle className="mr-2 h-4 w-4" />
                  ) : model.workState === "closed" ? (
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                  ) : null}
                  {model.actionLabel}
                </Link>
              </Button>
              {chatAction ? (
                <form action={chatAction}>
                  <Button type="submit" variant="outline" size="icon" className="h-11 w-11 rounded-xl border-slate-200 bg-white hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700">
                    <MessageSquare className="h-4 w-4" />
                  </Button>
                </form>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
