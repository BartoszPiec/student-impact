import type { ServiceOrderStatus } from "@/app/app/services/dashboard/service-order-status";

export type CompanyOrderBucket = "needs_company_action" | "waiting_for_student" | "active_history";

export type CompanyOrderStatusMeta = {
  label: string;
  badgeClass: string;
  bucket: CompanyOrderBucket;
  summaryLabel: string;
};

type BucketMeta = {
  title: string;
  description: string;
};

const STATUS_META: Record<ServiceOrderStatus, CompanyOrderStatusMeta> = {
  inquiry: {
    label: "Nowe zapytanie",
    badgeClass: "bg-sky-100 text-sky-700 border border-sky-200",
    bucket: "waiting_for_student",
    summaryLabel: "Student jeszcze nie odpowiedział na Twoje zapytanie.",
  },
  pending: {
    label: "Czeka na wycenę",
    badgeClass: "bg-amber-100 text-amber-700 border border-amber-200",
    bucket: "waiting_for_student",
    summaryLabel: "Czekasz na pierwszą wycenę od studenta.",
  },
  proposal_sent: {
    label: "Oferta od studenta",
    badgeClass: "bg-violet-100 text-violet-700 border border-violet-200",
    bucket: "needs_company_action",
    summaryLabel: "Student wysłał wycenę i czeka na Twoją decyzję.",
  },
  countered: {
    label: "Kontroferta wysłana",
    badgeClass: "bg-orange-100 text-orange-700 border border-orange-200",
    bucket: "waiting_for_student",
    summaryLabel: "Twoja kontroferta jest u studenta. Czekasz na odpowiedź.",
  },
  accepted: {
    label: "Zaakceptowane",
    badgeClass: "bg-emerald-100 text-emerald-700 border border-emerald-200",
    bucket: "active_history",
    summaryLabel: "Warunki są uzgodnione i zamówienie przechodzi dalej.",
  },
  in_progress: {
    label: "W realizacji",
    badgeClass: "bg-indigo-100 text-indigo-700 border border-indigo-200",
    bucket: "active_history",
    summaryLabel: "Projekt jest już w aktywnej realizacji.",
  },
  delivered: {
    label: "Dostarczone",
    badgeClass: "bg-cyan-100 text-cyan-700 border border-cyan-200",
    bucket: "active_history",
    summaryLabel: "Praca została dostarczona i czeka na dalszy ruch.",
  },
  completed: {
    label: "Zakończone",
    badgeClass: "bg-slate-100 text-slate-700 border border-slate-200",
    bucket: "active_history",
    summaryLabel: "To zamówienie zostało domknięte.",
  },
  rejected: {
    label: "Odrzucone",
    badgeClass: "bg-rose-100 text-rose-700 border border-rose-200",
    bucket: "active_history",
    summaryLabel: "Negocjacja zakończyła się bez współpracy.",
  },
  cancelled: {
    label: "Anulowane",
    badgeClass: "bg-slate-100 text-slate-700 border border-slate-200",
    bucket: "active_history",
    summaryLabel: "To zamówienie zostało anulowane.",
  },
};

export const COMPANY_ORDER_BUCKETS: Array<{ key: CompanyOrderBucket } & BucketMeta> = [
  {
    key: "needs_company_action",
    title: "Wymaga Twojej decyzji",
    description: "Wyceny od studentów, które możesz zaakceptować, skontrować albo zamknąć.",
  },
  {
    key: "waiting_for_student",
    title: "Czeka na studenta",
    description: "Zapytania i kontroferty, na które teraz odpowiada wykonawca.",
  },
  {
    key: "active_history",
    title: "Aktywne i historia",
    description: "Zaakceptowane zamówienia, realizacja i zamknięte negocjacje.",
  },
];

export function getCompanyOrderStatusMeta(status: string): CompanyOrderStatusMeta {
  return STATUS_META[(status as ServiceOrderStatus) ?? "pending"] ?? {
    label: status,
    badgeClass: "bg-slate-100 text-slate-700 border border-slate-200",
    bucket: "active_history",
    summaryLabel: "Ten status nie ma jeszcze opisu operacyjnego.",
  };
}

export function getCompanyOrderBucket(status: string): CompanyOrderBucket {
  return getCompanyOrderStatusMeta(status).bucket;
}

export function getCompanyOrderStatusOptions() {
  return [
    { value: "all", label: "Wszystkie statusy" },
    { value: "pending", label: STATUS_META.pending.label },
    { value: "proposal_sent", label: STATUS_META.proposal_sent.label },
    { value: "countered", label: STATUS_META.countered.label },
    { value: "accepted", label: STATUS_META.accepted.label },
    { value: "in_progress", label: STATUS_META.in_progress.label },
    { value: "completed", label: STATUS_META.completed.label },
  ];
}
