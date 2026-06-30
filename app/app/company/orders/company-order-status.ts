import type { ServiceOrderStatus } from "@/app/app/services/dashboard/service-order-status";

export type CompanyOrderBucket = "needs_company_action" | "waiting_for_student" | "active_history";

export type CompanyOrderStatusMeta = {
  label: string;
  badgeClass: string;
  bucket: CompanyOrderBucket;
  summaryLabel: string;
  nextActionLabel: string;
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
    nextActionLabel: "Czekaj na wycene",
  },
  pending: {
    label: "Czeka na wycene",
    badgeClass: "bg-amber-100 text-amber-700 border border-amber-200",
    bucket: "waiting_for_student",
    summaryLabel: "Czekasz na pierwsza wycene od studenta.",
    nextActionLabel: "Czekaj na wycene",
  },
  pending_selection: {
    label: "Czeka na zgłoszenia",
    badgeClass: "bg-indigo-100 text-indigo-700 border border-indigo-200",
    bucket: "waiting_for_student",
    summaryLabel: "Brief jest zapisany. Kandydat pojawi się po realnym zgłoszeniu albo przypisaniu przez platformę.",
    nextActionLabel: "Czekaj na zgłoszenia",
  },
  pending_student_confirmation: {
    label: "Czeka na potwierdzenie",
    badgeClass: "bg-orange-100 text-orange-700 border border-orange-200",
    bucket: "waiting_for_student",
    summaryLabel: "Student został wybrany i czekasz na jego potwierdzenie.",
    nextActionLabel: "Czekaj na potwierdzenie",
  },
  pending_confirmation: {
    label: "Czeka na potwierdzenie",
    badgeClass: "bg-orange-100 text-orange-700 border border-orange-200",
    bucket: "waiting_for_student",
    summaryLabel: "Student został wybrany i czekasz na jego potwierdzenie.",
    nextActionLabel: "Czekaj na potwierdzenie",
  },
  proposal_sent: {
    label: "Oferta od studenta",
    badgeClass: "bg-violet-100 text-violet-700 border border-violet-200",
    bucket: "needs_company_action",
    summaryLabel: "Student wyslal wycene i czeka na Twoja decyzje.",
    nextActionLabel: "Zaakceptuj albo negocjuj",
  },
  countered: {
    label: "Kontroferta wysłana",
    badgeClass: "bg-orange-100 text-orange-700 border border-orange-200",
    bucket: "waiting_for_student",
    summaryLabel: "Twoja kontroferta jest u studenta. Czekasz na odpowiedz.",
    nextActionLabel: "Czekaj na decyzje studenta",
  },
  accepted: {
    label: "Zaakceptowane",
    badgeClass: "bg-emerald-100 text-emerald-700 border border-emerald-200",
    bucket: "active_history",
    summaryLabel: "Warunki są uzgodnione i zamowienie przeszlo dalej.",
    nextActionLabel: "Przejdz do umów i płatności",
  },
  active: {
    label: "Aktywne",
    badgeClass: "bg-emerald-100 text-emerald-700 border border-emerald-200",
    bucket: "active_history",
    summaryLabel: "Student potwierdzil realizacje i projekt trwa.",
    nextActionLabel: "Przejdz do umów i płatności",
  },
  in_progress: {
    label: "W realizacji",
    badgeClass: "bg-indigo-100 text-indigo-700 border border-indigo-200",
    bucket: "active_history",
    summaryLabel: "Projekt jest już w aktywnej realizacji.",
    nextActionLabel: "Sledz realizacje",
  },
  revision: {
    label: "Poprawki",
    badgeClass: "bg-orange-100 text-orange-700 border border-orange-200",
    bucket: "waiting_for_student",
    summaryLabel: "Zgloszono poprawki i czekasz na kolejna wersje.",
    nextActionLabel: "Czekaj na poprawki",
  },
  delivered: {
    label: "Dostarczone",
    badgeClass: "bg-cyan-100 text-cyan-700 border border-cyan-200",
    bucket: "active_history",
    summaryLabel: "Praca została dostarczona i czeka na finalna decyzje.",
    nextActionLabel: "Sprawdz i zaakceptuj",
  },
  completed: {
    label: "Zakonczone",
    badgeClass: "bg-slate-100 text-slate-700 border border-slate-200",
    bucket: "active_history",
    summaryLabel: "To zamowienie zostało domkniete.",
    nextActionLabel: "Wystaw opinie",
  },
  rejected: {
    label: "Odrzucone",
    badgeClass: "bg-rose-100 text-rose-700 border border-rose-200",
    bucket: "active_history",
    summaryLabel: "Negocjacja zakonczyla sie bez współpracy.",
    nextActionLabel: "Brak akcji",
  },
  cancelled: {
    label: "Anulowane",
    badgeClass: "bg-slate-100 text-slate-700 border border-slate-200",
    bucket: "active_history",
    summaryLabel: "To zamowienie zostało anulowane.",
    nextActionLabel: "Brak akcji",
  },
  disputed: {
    label: "Spor",
    badgeClass: "bg-rose-100 text-rose-700 border border-rose-200",
    bucket: "needs_company_action",
    summaryLabel: "Sprawa jest w sporze i może wymagac Twojej reakcji.",
    nextActionLabel: "Sprawdz spor",
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
    description: "Zapytania i etapy, na które teraz odpowiada wykonawca.",
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
    nextActionLabel: "Sprawdz szczegoly",
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
