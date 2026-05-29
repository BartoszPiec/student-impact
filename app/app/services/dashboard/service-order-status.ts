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

export type ServiceOrderBucket =
  | "awaiting_quote"
  | "quote_sent"
  | "negotiation"
  | "ready_to_start"
  | "in_delivery"
  | "awaiting_acceptance"
  | "closed";

export type ServiceOrderStatusMeta = {
  label: string;
  badgeClass: string;
  bucket: ServiceOrderBucket;
  summaryLabel: string;
  nextActionLabel: string;
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
    bucket: "awaiting_quote",
    summaryLabel: "Klient czeka na Twoja pierwsza odpowiedz.",
    nextActionLabel: "Zloz wycene",
  },
  pending: {
    label: "Czeka na wycene",
    badgeClass: "bg-amber-100 text-amber-700 border border-amber-200",
    bucket: "awaiting_quote",
    summaryLabel: "To zapytanie nadal wymaga Twojej wyceny.",
    nextActionLabel: "Zloz wycene",
  },
  pending_selection: {
    label: "Firma wybiera studenta",
    badgeClass: "bg-indigo-100 text-indigo-700 border border-indigo-200",
    bucket: "quote_sent",
    summaryLabel: "Firma dopina wybor wykonawcy dla tego zamowienia.",
    nextActionLabel: "Czekaj na wybor firmy",
  },
  pending_student_confirmation: {
    label: "Potwierdz realizacje",
    badgeClass: "bg-orange-100 text-orange-700 border border-orange-200",
    bucket: "ready_to_start",
    summaryLabel: "Firma wybrala Cie do projektu. Potwierdz rozpoczecie realizacji.",
    nextActionLabel: "Potwierdz realizacje",
  },
  pending_confirmation: {
    label: "Potwierdz realizacje",
    badgeClass: "bg-orange-100 text-orange-700 border border-orange-200",
    bucket: "ready_to_start",
    summaryLabel: "Firma wybrala Cie do projektu. Potwierdz rozpoczecie realizacji.",
    nextActionLabel: "Potwierdz realizacje",
  },
  countered: {
    label: "Kontroferta firmy",
    badgeClass: "bg-orange-100 text-orange-700 border border-orange-200",
    bucket: "negotiation",
    summaryLabel: "Firma wrocila z nowa stawka i czeka na Twoja decyzje.",
    nextActionLabel: "Odpowiedz na kontroferte",
  },
  proposal_sent: {
    label: "Oferta wyslana",
    badgeClass: "bg-violet-100 text-violet-700 border border-violet-200",
    bucket: "quote_sent",
    summaryLabel: "Twoja oferta jest u firmy. Czekasz na decyzje klienta.",
    nextActionLabel: "Czekaj na decyzje firmy",
  },
  accepted: {
    label: "Zaakceptowane",
    badgeClass: "bg-emerald-100 text-emerald-700 border border-emerald-200",
    bucket: "ready_to_start",
    summaryLabel: "Warunki sa uzgodnione i zamowienie przeszlo dalej.",
    nextActionLabel: "Przejdz do panelu realizacji",
  },
  active: {
    label: "Aktywne",
    badgeClass: "bg-emerald-100 text-emerald-700 border border-emerald-200",
    bucket: "ready_to_start",
    summaryLabel: "Projekt zostal potwierdzony i jest aktywny.",
    nextActionLabel: "Przejdz do panelu realizacji",
  },
  in_progress: {
    label: "W realizacji",
    badgeClass: "bg-indigo-100 text-indigo-700 border border-indigo-200",
    bucket: "in_delivery",
    summaryLabel: "Projekt jest juz w aktywnej realizacji.",
    nextActionLabel: "Przeslij efekt pracy",
  },
  revision: {
    label: "Poprawki",
    badgeClass: "bg-orange-100 text-orange-700 border border-orange-200",
    bucket: "in_delivery",
    summaryLabel: "Firma zglosila poprawki do kolejnej iteracji.",
    nextActionLabel: "Wprowadz poprawki",
  },
  delivered: {
    label: "Dostarczone",
    badgeClass: "bg-cyan-100 text-cyan-700 border border-cyan-200",
    bucket: "awaiting_acceptance",
    summaryLabel: "Praca zostala dostarczona i czeka na dalszy ruch.",
    nextActionLabel: "Czekaj na odbior",
  },
  completed: {
    label: "Zakonczone",
    badgeClass: "bg-slate-100 text-slate-700 border border-slate-200",
    bucket: "closed",
    summaryLabel: "Zamowienie zostalo domkniete.",
    nextActionLabel: "Wystaw opinie",
  },
  rejected: {
    label: "Odrzucone",
    badgeClass: "bg-rose-100 text-rose-700 border border-rose-200",
    bucket: "closed",
    summaryLabel: "To zapytanie zostalo zakonczone bez wspolpracy.",
    nextActionLabel: "Brak akcji",
  },
  cancelled: {
    label: "Anulowane",
    badgeClass: "bg-slate-100 text-slate-700 border border-slate-200",
    bucket: "closed",
    summaryLabel: "Zamowienie zostalo anulowane.",
    nextActionLabel: "Brak akcji",
  },
  disputed: {
    label: "Spor",
    badgeClass: "bg-rose-100 text-rose-700 border border-rose-200",
    bucket: "awaiting_acceptance",
    summaryLabel: "Zamowienie jest w sporze i wymaga uwagi.",
    nextActionLabel: "Czekaj na mediacje",
  },
};

export const SERVICE_ORDER_BUCKETS: Array<{ key: ServiceOrderBucket } & BucketMeta> = [
  {
    key: "awaiting_quote",
    title: "Czeka na wycene",
    description: "Nowe zapytania od firm, ktore wymagaja pierwszej wyceny.",
    emptyTitle: "Brak zapytan do wyceny",
    emptyDescription: "Nowe zapytania od firm pojawia sie tutaj.",
  },
  {
    key: "quote_sent",
    title: "Wyslana wycena",
    description: "Propozycje wyslane do klienta i wybor wykonawcy po stronie firmy.",
    emptyTitle: "Brak wyslanych wycen",
    emptyDescription: "Kiedy wyslesz wycene, znajdziesz ja w tej sekcji.",
  },
  {
    key: "negotiation",
    title: "W trakcie ustalen",
    description: "Kontroferty i dopinanie warunkow przed etapami oraz umowami.",
    emptyTitle: "Brak aktywnych ustalen",
    emptyDescription: "Kontroferty i negocjacje pojawia sie tutaj.",
  },
  {
    key: "ready_to_start",
    title: "Do realizacji",
    description: "Zlecenia zaakceptowane, ktore czekaja na kolejne formalne kroki.",
    emptyTitle: "Brak zlecen do startu",
    emptyDescription: "Potwierdzone projekty pojawia sie tutaj.",
  },
  {
    key: "in_delivery",
    title: "W realizacji",
    description: "Aktywne prace i poprawki w toku.",
    emptyTitle: "Brak prac w realizacji",
    emptyDescription: "Aktywna realizacja pojawi sie tutaj.",
  },
  {
    key: "awaiting_acceptance",
    title: "Czeka na akceptacje",
    description: "Oddane prace, spor lub etap odbioru po stronie firmy.",
    emptyTitle: "Nic nie czeka na odbior",
    emptyDescription: "Dostarczone etapy pojawia sie tutaj.",
  },
  {
    key: "closed",
    title: "Zakonczone",
    description: "Zamkniete, odrzucone i anulowane sprawy.",
    emptyTitle: "Brak historii",
    emptyDescription: "Zakonczone sprawy pojawia sie tutaj.",
  },
];

export function getServiceOrderStatusMeta(status: string): ServiceOrderStatusMeta {
  return STATUS_META[(status as ServiceOrderStatus) ?? "pending"] ?? {
    label: status,
    badgeClass: "bg-slate-100 text-slate-700 border border-slate-200",
    bucket: "closed",
    summaryLabel: "Ten status nie ma jeszcze opisu operacyjnego.",
    nextActionLabel: "Sprawdz szczegoly",
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
