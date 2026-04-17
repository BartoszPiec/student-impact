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
    summaryLabel: "Student jeszcze nie odpowiedzial na Twoje zapytanie.",
  },
  pending: {
    label: "Czeka na wycene",
    badgeClass: "bg-amber-100 text-amber-700 border border-amber-200",
    bucket: "waiting_for_student",
    summaryLabel: "Czekasz na pierwsza wycene od studenta.",
  },
  pending_selection: {
    label: "Wybierz studenta",
    badgeClass: "bg-indigo-100 text-indigo-700 border border-indigo-200",
    bucket: "needs_company_action",
    summaryLabel: "Brief jest gotowy. Wybierz wykonawce z listy kandydatow.",
  },
  pending_student_confirmation: {
    label: "Czeka na potwierdzenie",
    badgeClass: "bg-orange-100 text-orange-700 border border-orange-200",
    bucket: "waiting_for_student",
    summaryLabel: "Student zostal wybrany i czekasz na jego potwierdzenie.",
  },
  pending_confirmation: {
    label: "Czeka na potwierdzenie",
    badgeClass: "bg-orange-100 text-orange-700 border border-orange-200",
    bucket: "waiting_for_student",
    summaryLabel: "Student zostal wybrany i czekasz na jego potwierdzenie.",
  },
  proposal_sent: {
    label: "Oferta od studenta",
    badgeClass: "bg-violet-100 text-violet-700 border border-violet-200",
    bucket: "needs_company_action",
    summaryLabel: "Student wyslal wycene i czeka na Twoja decyzje.",
  },
  countered: {
    label: "Kontroferta wyslana",
    badgeClass: "bg-orange-100 text-orange-700 border border-orange-200",
    bucket: "waiting_for_student",
    summaryLabel: "Twoja kontroferta jest u studenta. Czekasz na odpowiedz.",
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
    summaryLabel: "Student potwierdzil realizacje i projekt trwa.",
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
    bucket: "waiting_for_student",
    summaryLabel: "Zgloszono poprawki i czekasz na kolejna wersje.",
  },
  delivered: {
    label: "Dostarczone",
    badgeClass: "bg-cyan-100 text-cyan-700 border border-cyan-200",
    bucket: "active_history",
    summaryLabel: "Praca zostala dostarczona i czeka na finalna decyzje.",
  },
  completed: {
    label: "Zakonczone",
    badgeClass: "bg-slate-100 text-slate-700 border border-slate-200",
    bucket: "active_history",
    summaryLabel: "To zamowienie zostalo domkniete.",
  },
  rejected: {
    label: "Odrzucone",
    badgeClass: "bg-rose-100 text-rose-700 border border-rose-200",
    bucket: "active_history",
    summaryLabel: "Negocjacja zakonczyla sie bez wspolpracy.",
  },
  cancelled: {
    label: "Anulowane",
    badgeClass: "bg-slate-100 text-slate-700 border border-slate-200",
    bucket: "active_history",
    summaryLabel: "To zamowienie zostalo anulowane.",
  },
  disputed: {
    label: "Spor",
    badgeClass: "bg-rose-100 text-rose-700 border border-rose-200",
    bucket: "needs_company_action",
    summaryLabel: "Sprawa jest w sporze i moze wymagac Twojej reakcji.",
  },
};

export const COMPANY_ORDER_BUCKETS: Array<{ key: CompanyOrderBucket } & BucketMeta> = [
  {
    key: "needs_company_action",
    title: "Wymaga Twojej decyzji",
    description: "Wyceny, wybor wykonawcy i sytuacje wymagajace reakcji po stronie firmy.",
  },
  {
    key: "waiting_for_student",
    title: "Czeka na studenta",
    description: "Zapytania i etapy, na ktore teraz odpowiada wykonawca.",
  },
  {
    key: "active_history",
    title: "Aktywne i historia",
    description: "Projekty w realizacji, dostarczone i zakonczone zamowienia.",
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
    { value: "pending_selection", label: STATUS_META.pending_selection.label },
    { value: "pending_student_confirmation", label: STATUS_META.pending_student_confirmation.label },
    { value: "pending", label: STATUS_META.pending.label },
    { value: "proposal_sent", label: STATUS_META.proposal_sent.label },
    { value: "countered", label: STATUS_META.countered.label },
    { value: "active", label: STATUS_META.active.label },
    { value: "in_progress", label: STATUS_META.in_progress.label },
    { value: "completed", label: STATUS_META.completed.label },
  ];
}

