export type ServiceOrderStatus =
  | "inquiry"
  | "pending"
  | "pending_selection"
  | "pending_student_confirmation"
  | "pending_confirmation"
  | "proposal_sent"
  | "countered"
  | "accepted"
  | "active"
  | "in_progress"
  | "revision"
  | "delivered"
  | "completed"
  | "rejected"
  | "cancelled"
  | "disputed";

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
    summaryLabel: "Klient czeka na Twoja pierwsza odpowiedz.",
  },
  pending: {
    label: "Czeka na wycene",
    badgeClass: "bg-amber-100 text-amber-700 border border-amber-200",
    bucket: "needs_action",
    summaryLabel: "To zapytanie nadal wymaga Twojej wyceny.",
  },
  pending_selection: {
    label: "Firma wybiera studenta",
    badgeClass: "bg-indigo-100 text-indigo-700 border border-indigo-200",
    bucket: "waiting_for_company",
    summaryLabel: "Firma dopina wybor wykonawcy dla tego zamowienia.",
  },
  pending_student_confirmation: {
    label: "Potwierdz realizacje",
    badgeClass: "bg-orange-100 text-orange-700 border border-orange-200",
    bucket: "needs_action",
    summaryLabel: "Firma wybrala Cie do projektu. Potwierdz rozpoczecie realizacji.",
  },
  pending_confirmation: {
    label: "Potwierdz realizacje",
    badgeClass: "bg-orange-100 text-orange-700 border border-orange-200",
    bucket: "needs_action",
    summaryLabel: "Firma wybrala Cie do projektu. Potwierdz rozpoczecie realizacji.",
  },
  countered: {
    label: "Kontroferta firmy",
    badgeClass: "bg-orange-100 text-orange-700 border border-orange-200",
    bucket: "needs_action",
    summaryLabel: "Firma wrocila z nowa stawka i czeka na Twoja decyzje.",
  },
  proposal_sent: {
    label: "Oferta wyslana",
    badgeClass: "bg-violet-100 text-violet-700 border border-violet-200",
    bucket: "waiting_for_company",
    summaryLabel: "Twoja oferta jest u firmy. Czekasz na decyzje klienta.",
  },
  accepted: {
    label: "Zaakceptowane",
    badgeClass: "bg-emerald-100 text-emerald-700 border border-emerald-200",
    bucket: "active_history",
    summaryLabel: "Warunki sa uzgodnione i zamowienie przeszlo dalej.",
  },
  active: {
    label: "Aktywne",
    badgeClass: "bg-emerald-100 text-emerald-700 border border-emerald-200",
    bucket: "active_history",
    summaryLabel: "Projekt zostal potwierdzony i jest aktywny.",
  },
  in_progress: {
    label: "W realizacji",
    badgeClass: "bg-indigo-100 text-indigo-700 border border-indigo-200",
    bucket: "active_history",
    summaryLabel: "Projekt jest juz w aktywnej realizacji.",
  },
  revision: {
    label: "Poprawki",
    badgeClass: "bg-orange-100 text-orange-700 border border-orange-200",
    bucket: "needs_action",
    summaryLabel: "Firma zglosila poprawki do kolejnej iteracji.",
  },
  delivered: {
    label: "Dostarczone",
    badgeClass: "bg-cyan-100 text-cyan-700 border border-cyan-200",
    bucket: "active_history",
    summaryLabel: "Praca zostala dostarczona i czeka na dalszy ruch.",
  },
  completed: {
    label: "Zakonczone",
    badgeClass: "bg-slate-100 text-slate-700 border border-slate-200",
    bucket: "active_history",
    summaryLabel: "Zamowienie zostalo domkniete.",
  },
  rejected: {
    label: "Odrzucone",
    badgeClass: "bg-rose-100 text-rose-700 border border-rose-200",
    bucket: "active_history",
    summaryLabel: "To zapytanie zostalo zakonczone bez wspolpracy.",
  },
  cancelled: {
    label: "Anulowane",
    badgeClass: "bg-slate-100 text-slate-700 border border-slate-200",
    bucket: "active_history",
    summaryLabel: "Zamowienie zostalo anulowane.",
  },
  disputed: {
    label: "Spor",
    badgeClass: "bg-rose-100 text-rose-700 border border-rose-200",
    bucket: "needs_action",
    summaryLabel: "Zamowienie jest w sporze i wymaga uwagi.",
  },
};

export const SERVICE_ORDER_BUCKETS: Array<{ key: ServiceOrderBucket } & BucketMeta> = [
  {
    key: "needs_action",
    title: "Wymaga reakcji",
    description: "Nowe zapytania, kontroferty i etapy oczekujace na Twoja decyzje.",
    emptyTitle: "Nic nie wymaga teraz Twojej reakcji",
    emptyDescription: "Nowe zapytania i kontroferty od firm pojawia sie tutaj.",
  },
  {
    key: "waiting_for_company",
    title: "Czeka na firme",
    description: "Oferty wyslane do klienta i etapy, na ktore odpowiada teraz firma.",
    emptyTitle: "Brak zlecen oczekujacych na firme",
    emptyDescription: "Kiedy wyslesz wycene, znajdziesz ja w tej sekcji.",
  },
  {
    key: "active_history",
    title: "Aktywne i historia",
    description: "Potwierdzone zlecenia, realizacja i domkniete sprawy.",
    emptyTitle: "Brak aktywnych lub zakonczonych zlecen",
    emptyDescription: "Potwierdzone projekty i historia wspolpracy pojawia sie tutaj.",
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
    { value: "pending_student_confirmation", label: STATUS_META.pending_student_confirmation.label },
    { value: "countered", label: STATUS_META.countered.label },
    { value: "proposal_sent", label: STATUS_META.proposal_sent.label },
    { value: "active", label: STATUS_META.active.label },
    { value: "in_progress", label: STATUS_META.in_progress.label },
    { value: "completed", label: STATUS_META.completed.label },
  ];
}

