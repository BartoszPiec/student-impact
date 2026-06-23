"use client";

import Link from "next/link";
import {
  Briefcase,
  CalendarClock,
  CheckCircle2,
  Clock3,
  Eye,
  HandCoins,
  MessageSquare,
  ShieldCheck,
  Sparkles,
  Users,
  Zap,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { openChatForApplication } from "../../chat/_actions";
import {
  COMPANY_CARD_TOKENS,
  CompanyMetricTile,
  CompanyStatePill,
  type CompanyCardTone,
} from "../_components/company-card-theme";

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
  tone: CompanyCardTone;
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
    const max =
      offer.salary_range_max && offer.salary_range_max > offer.salary_range_min
        ? ` - ${offer.salary_range_max.toLocaleString("pl-PL")}`
        : "+";
    return `${offer.salary_range_min.toLocaleString("pl-PL")}${max} PLN`;
  }
  return formatMoney(offer.stawka);
}

function getDetailHref(offer: CompanyOffer) {
  return offer.itemType === "service_order" ? `/app/company/orders/${offer.id}` : `/app/company/offers/${offer.id}`;
}

function resolveServiceOrderCardModel(offer: CompanyOffer): OfferCardModel {
  const detailHref = getDetailHref(offer);
  const status = offer.status ?? "pending";

  if (["completed", "closed", "cancelled"].includes(status)) {
    return {
      workState: "closed",
      stage: "done",
      stageLabel: "Archiwum",
      label: "Zakonczone",
      tone: "slate",
      actionRequired: false,
      actionLabel: "Podglad",
      actionHref: detailHref,
      note: "Zakonczone zamowienie usługi.",
    };
  }

  if (["pending_selection", "pending"].includes(status)) {
    return {
      workState: "action",
      stage: "candidates",
      stageLabel: "Wybor wykonawcy",
      label: "Wymaga decyzji",
      tone: "indigo",
      actionRequired: true,
      actionLabel: "Wybierz studenta",
      actionHref: detailHref,
      note: "Wybierz wykonawce, aby uruchomic realizacje.",
    };
  }

  if (["countered", "proposal_sent", "inquiry"].includes(status)) {
    return {
      workState: "action",
      stage: "terms",
      stageLabel: "Warunki",
      label: "Negocjacje",
      tone: "amber",
      actionRequired: true,
      actionLabel: "Sprawdz warunki",
      actionHref: detailHref,
      note: "Zamowienie czeka na decyzje lub uzgodnienie warunków.",
    };
  }

  if (["delivered", "pending_review"].includes(status)) {
    return {
      workState: "action",
      stage: "review",
      stageLabel: "Odbior pracy",
      label: "Do sprawdzenia",
      tone: "red",
      actionRequired: true,
      actionLabel: "Sprawdz prace",
      actionHref: detailHref,
      note: "Student dostarczyl material do akceptacji.",
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
      actionLabel: "Podglad",
      actionHref: detailHref,
      note: "Student potwierdza przyjecie realizacji.",
    };
  }

  return {
    workState: "in_progress",
    stage: "delivery",
    stageLabel: "Realizacja",
    label: "W realizacji",
    tone: "emerald",
    actionRequired: false,
    actionLabel: "Panel realizacji",
    actionHref: detailHref,
    note: "Zamowienie usługi jest aktywne.",
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
      label: "Zakonczone",
      tone: "slate",
      actionRequired: false,
      actionLabel: "Podglad",
      actionHref: detailHref,
      note: "Archiwalne ogloszenie.",
    };
  }

  if (stats.hasDelivered) {
    return {
      workState: "action",
      stage: "review",
      stageLabel: "Odbior pracy",
      label: "Do sprawdzenia",
      tone: "red",
      actionRequired: true,
      actionLabel: "Sprawdz prace",
      actionHref: acceptedHref,
      note: "Student dostarczyl material do akceptacji.",
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
      label: "Nowe zgłoszenia",
      tone: "indigo",
      actionRequired: true,
      actionLabel: "Przejrzyj kandydatow",
      actionHref: detailHref,
      note: `${stats.sent} kandydatow czeka na decyzje.`,
    };
  }

  if (offer.status === "in_progress" || hasAccepted) {
    return {
      workState: "in_progress",
      stage: "delivery",
      stageLabel: "Realizacja",
      label: "W realizacji",
      tone: "emerald",
      actionRequired: false,
      actionLabel: "Panel realizacji",
      actionHref: acceptedHref,
      note: stats.acceptedProfile ? `Realizuje: ${stats.acceptedProfile.first_name}` : "Realizacja jest aktywna.",
    };
  }

  return {
    workState: "collecting",
    stage: "candidates",
    stageLabel: "Kandydaci",
    label: "Zbiera kandydatow",
    tone: "slate",
    actionRequired: false,
    actionLabel: "Szczegoly",
    actionHref: detailHref,
    note: stats.total > 0 ? `${stats.total} aplikacji lacznie.` : "Ogloszenie jest widoczne dla studentow.",
  };
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
  const itemLabel = offer.itemLabel || (isServiceOrder ? "Usługa" : "Ogloszenie");
  const performerFallback =
    isServiceOrder && ["pending_selection", "pending"].includes(offer.status ?? "")
      ? "Do wyboru wykonawcy"
      : isServiceOrder
        ? "Szczegoly w zamowieniu"
        : "Bez wykonawcy";
  const tone = COMPANY_CARD_TOKENS[model.tone];

  const banner =
    model.stage === "review"
      ? {
          icon: <ShieldCheck className="h-4 w-4" />,
          title: "Praca czeka na Twoj odbior",
          sub: model.note,
          pill: "Wymagana akcja",
        }
      : model.stage === "terms"
        ? {
            icon: <HandCoins className="h-4 w-4" />,
            title: model.actionRequired ? "Trwa uzgadnianie warunków" : "Czekamy na finalne potwierdzenie",
            sub: model.note,
            pill: model.actionRequired ? "Wymagana akcja" : "Czeka na studenta",
            pillIcon: model.actionRequired ? null : <Clock3 className="h-3 w-3" />,
          }
        : model.stage === "candidates"
          ? {
              icon: <Users className="h-4 w-4" />,
              title: model.actionRequired ? "Nowe zgłoszenia do przejrzenia" : "Ogloszenie zbiera kandydatow",
              sub: model.note,
              pill: model.actionRequired ? "Wymagana akcja" : "Nowe zgłoszenia",
              pillIcon: model.actionRequired ? null : <Sparkles className="h-3 w-3" />,
            }
          : model.stage === "delivery"
            ? {
                icon: <Zap className="h-4 w-4" />,
                title: "Projekt jest w realizacji",
                sub: model.note,
                pill: "W realizacji",
                pillIcon: <Sparkles className="h-3 w-3" />,
              }
            : model.stage === "done"
              ? {
                  icon: <CheckCircle2 className="h-4 w-4" />,
                  title: "Element zakonczony lub archiwalny",
                  sub: model.note,
                  pill: "Zakonczone",
                  pillIcon: <CheckCircle2 className="h-3 w-3" />,
                }
              : null;

  return (
    <article
      className="relative overflow-hidden bg-white"
      style={{
        borderRadius: compact ? 24 : 28,
        border: "1px solid #eef0f4",
        boxShadow: model.actionRequired
          ? `0 0 0 2px ${tone.ring}, 0 18px 50px -12px ${tone.glow}, 0 4px 12px rgba(15,36,96,0.04)`
          : "0 4px 18px rgba(15,36,96,0.05)",
      }}
    >
      <div className="flex">
        <div className="w-2 shrink-0" style={{ background: tone.barGrad }} />

        <div className={`flex-1 ${compact ? "p-5" : "p-6"}`}>
          {banner ? (
            <div
              className="mb-5 flex items-center gap-3 rounded-2xl px-4 py-3"
              style={{ background: tone.bannerBg, border: `1px solid ${tone.bannerBorder}` }}
            >
              <div
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-white"
                style={{ color: tone.bar, boxShadow: `0 2px 8px ${tone.glow}` }}
              >
                {banner.icon}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-[13.5px] font-extrabold text-slate-900">{banner.title}</div>
                <div className="mt-0.5 text-xs font-semibold" style={{ color: tone.text }}>
                  {banner.sub}
                </div>
              </div>
              <CompanyStatePill tone={model.tone} solid icon={banner.pillIcon}>
                {banner.pill}
              </CompanyStatePill>
            </div>
          ) : null}

          <div className="flex flex-col gap-5 xl:flex-row">
            <div className="min-w-0 flex-1">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <CompanyStatePill tone={model.tone}>{model.label}</CompanyStatePill>
                <CompanyStatePill tone={model.tone}>{model.stageLabel}</CompanyStatePill>
                <CompanyStatePill tone="slate">{itemLabel}</CompanyStatePill>
              </div>

              <Link href={detailHref} className="block text-xl font-black leading-tight text-slate-950 transition hover:text-indigo-700">
                {offer.tytul || (isServiceOrder ? "Zamowienie usługi" : "Ogloszenie bez tytulu")}
              </Link>

              <div className="mb-3 mt-3 flex flex-wrap gap-3 text-[11.5px] font-semibold text-slate-400">
                <span className="inline-flex items-center gap-1.5">
                  <CalendarClock className="h-3.5 w-3.5" />
                  {formatDate(offer.created_at)}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Briefcase className="h-3.5 w-3.5" />
                  {isServiceOrder ? "Usługa systemowa" : offer.typ || "Ogloszenie"}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Eye className="h-3.5 w-3.5" />
                  {isServiceOrder ? "Panel firmy" : `${stats.total} aplikacji`}
                </span>
              </div>

              <div className="mb-4 rounded-r-xl border-l-[3px] bg-slate-50 px-4 py-3 text-sm italic leading-6 text-slate-600" style={{ borderLeftColor: tone.bar }}>
                {model.note}
              </div>

              <div className="flex flex-wrap gap-2">
                {stats.acceptedProfile ? (
                  <Link
                    href={`/app/students/${stats.acceptedProfile.id}`}
                    className="inline-flex items-center gap-2 rounded-xl border border-indigo-100 bg-indigo-50 px-3 py-2 text-xs font-bold text-indigo-700 hover:bg-indigo-100"
                  >
                    <Users className="h-4 w-4" />
                    {stats.acceptedProfile.first_name}
                  </Link>
                ) : (
                  <span className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-500">
                    <Users className="h-4 w-4" />
                    {performerFallback}
                  </span>
                )}

                {chatAction ? (
                  <form action={chatAction}>
                    <Button type="submit" variant="outline" className="h-9 rounded-xl border-slate-200 bg-white px-3 text-xs font-bold text-slate-600 hover:bg-slate-50">
                      <MessageSquare className="mr-2 h-4 w-4" />
                      Czat
                    </Button>
                  </form>
                ) : null}
              </div>
            </div>

            <div className="flex w-full flex-col gap-3 xl:w-[248px] xl:shrink-0">
              <div className="flex gap-2">
                <CompanyMetricTile
                  label={isInProgress && stats.agreedStawka ? "Stawka uzgodniona" : "Budzet"}
                  value={getBudgetLabel(offer, stats, isInProgress)}
                  sub={isServiceOrder ? "Zamowienie firmy" : "Kwota oferty"}
                  noWrapValue
                />
                {model.actionRequired ? (
                  <CompanyMetricTile label="Status" value={model.stageLabel} sub={model.label} tone={model.tone} emphasize />
                ) : null}
              </div>

              <Button asChild className="h-11 rounded-2xl bg-gradient-to-r from-slate-950 to-slate-800 font-extrabold text-white hover:from-indigo-700 hover:to-indigo-600">
                <Link href={model.actionHref}>
                  {model.actionLabel}
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
