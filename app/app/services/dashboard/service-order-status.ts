export type ServiceOrderStatus =
  | "inquiry"
  | "pending"
  | "proposal_sent"
  | "countered"
  | "accepted"
  | "in_progress"
  | "delivered"
  | "completed"
  | "rejected"
  | "cancelled";

export type ServiceOrderBucket = "needs_action" | "waiting_for_company" | "active_history";

export type ServiceOrderStatusMeta = {
  label: string;
  badgeClass: string;
  bucket: ServiceOrderBucket;
  summaryLabel: string;
};

type BucketMeta = {
  title: string;
  description: string;
  emptyTitle: string;
  emptyDescription: string;
};

const STATUS_META: Record<ServiceOrderStatus, ServiceOrderStatusMeta> = {
  inquiry: {
    label: "Nowe zapytanie",
    badgeClass: "bg-sky-100 text-sky-700 border border-sky-200",
    bucket: "needs_action",
    summaryLabel: "Klient czeka na Twoją pierwszą odpowiedź.",
  },
  pending: {
    label: "Czeka na wycenę",
    badgeClass: "bg-amber-100 text-amber-700 border border-amber-200",
    bucket: "needs_action",
    summaryLabel: "To zapytanie nadal wymaga Twojej wyceny.",
  },
  countered: {
    label: "Kontroferta firmy",
    badgeClass: "bg-orange-100 text-orange-700 border border-orange-200",
    bucket: "needs_action",
    summaryLabel: "Firma wróciła z nową stawką i czeka na Twoją decyzję.",
  },
  proposal_sent: {
    label: "Oferta wysłana",
    badgeClass: "bg-violet-100 text-violet-700 border border-violet-200",
    bucket: "waiting_for_company",
    summaryLabel: "Twoja oferta jest u firmy. Czekasz na decyzję klienta.",
  },
  accepted: {
    label: "Zaakceptowane",
    badgeClass: "bg-emerald-100 text-emerald-700 border border-emerald-200",
    bucket: "active_history",
    summaryLabel: "Warunki są uzgodnione i zamówienie przeszło dalej.",
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
    summaryLabel: "Zamówienie zostało domknięte.",
  },
  rejected: {
    label: "Odrzucone",
    badgeClass: "bg-rose-100 text-rose-700 border border-rose-200",
    bucket: "active_history",
    summaryLabel: "To zapytanie zostało zakończone bez współpracy.",
  },
  cancelled: {
    label: "Anulowane",
    badgeClass: "bg-slate-100 text-slate-700 border border-slate-200",
    bucket: "active_history",
    summaryLabel: "Zamówienie zostało anulowane.",
  },
};

export const SERVICE_ORDER_BUCKETS: Array<{ key: ServiceOrderBucket } & BucketMeta> = [
  {
    key: "needs_action",
    title: "Wymaga reakcji",
    description: "Nowe zapytania, wyceny do przygotowania i kontroferty, na które musisz odpowiedzieć.",
    emptyTitle: "Nic nie wymaga teraz Twojej reakcji",
    emptyDescription: "Nowe zapytania i kontroferty od firm pokażą się tutaj.",
  },
  {
    key: "waiting_for_company",
    title: "Czeka na firmę",
    description: "Oferty wysłane do klienta, które czekają na jego decyzję.",
    emptyTitle: "Brak zleceń oczekujących na firmę",
    emptyDescription: "Kiedy wyślesz wycenę, znajdziesz ją w tej sekcji.",
  },
  {
    key: "active_history",
    title: "Aktywne i historia",
    description: "Zaakceptowane zlecenia, projekty w realizacji i domknięte sprawy.",
    emptyTitle: "Brak aktywnych lub zakończonych zleceń",
    emptyDescription: "Zaakceptowane projekty i historia współpracy pokażą się tutaj.",
  },
];

export function getServiceOrderStatusMeta(status: string): ServiceOrderStatusMeta {
  return STATUS_META[(status as ServiceOrderStatus) ?? "pending"] ?? {
    label: status,
    badgeClass: "bg-slate-100 text-slate-700 border border-slate-200",
    bucket: "active_history",
    summaryLabel: "Ten status nie ma jeszcze opisu operacyjnego.",
  };
}

export function getServiceOrderBucket(status: string): ServiceOrderBucket {
  return getServiceOrderStatusMeta(status).bucket;
}

export function getServiceOrderStatusOptions() {
  return [
    { value: "all", label: "Wszystkie statusy" },
    { value: "inquiry", label: STATUS_META.inquiry.label },
    { value: "pending", label: STATUS_META.pending.label },
    { value: "countered", label: STATUS_META.countered.label },
    { value: "proposal_sent", label: STATUS_META.proposal_sent.label },
    { value: "accepted", label: STATUS_META.accepted.label },
    { value: "in_progress", label: STATUS_META.in_progress.label },
    { value: "completed", label: STATUS_META.completed.label },
  ];
}
