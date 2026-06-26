"use client";

import { useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  Bookmark,
  Briefcase,
  CheckCircle2,
  Clock,
  FileText,
  MessageSquare,
  Star,
  XCircle,
  Zap,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { openChatForApplication } from "@/app/app/chat/_actions";
import {
  acceptCounterAsStudent,
  proposeNewPriceAsStudent,
  rejectCounterAsStudent,
  removeSavedOffer,
} from "./_actions";
import { WithdrawApplicationButton } from "./withdraw-button";
import { cn } from "@/lib/utils";

type OfferSummary = {
  id: string;
  tytul: string | null;
  opis?: string | null;
  typ: string | null;
  stawka: number | null;
  status?: string | null;
  is_platform_service?: boolean | null;
};

type ApplicationStage =
  | "sent"
  | "countered"
  | "in_progress"
  | "done"
  | "rejected"
  | "cancelled";

type ApplicationItem = {
  id: string;
  status: string;
  stage: ApplicationStage;
  created_at: string | null;
  message_to_company: string | null;
  cancel_reason?: string | null;
  proposed_stawka: number | null;
  counter_stawka: number | null;
  agreed_stawka: number | null;
  agreed_stawka_minor?: number | null;
  offer: OfferSummary | null;
};

type SavedOfferItem = {
  saved_at?: string | null;
  offer: OfferSummary | null;
};

type FilterItem = ApplicationItem | SavedOfferItem;

function formatMoney(value?: number | null) {
  if (value == null) return "-";
  return `${value} PLN`;
}

function fromMinorUnits(value?: number | null) {
  if (value == null || !Number.isFinite(value)) return null;
  return value / 100;
}

function formatDate(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("pl-PL", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function StatusBadge({ status, stage }: { status: string; stage: ApplicationStage }) {
  if (stage === "done") {
    return (
      <Badge className="gap-1 rounded-full border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700 hover:bg-emerald-100">
        <CheckCircle2 className="h-3 w-3" /> Zakonczone
      </Badge>
    );
  }

  if (stage === "in_progress") {
    return (
      <Badge className="gap-1 rounded-full border-blue-100 bg-blue-50 px-2 py-0.5 text-[11px] font-bold text-[#10245f] hover:bg-blue-100">
        <Clock className="h-3 w-3" /> W realizacji
      </Badge>
    );
  }

  if (status === "countered") {
    return (
      <Badge className="gap-1 rounded-full border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-bold text-amber-700 hover:bg-amber-100">
        <AlertCircle className="h-3 w-3" /> Negocjacje
      </Badge>
    );
  }

  if (status === "rejected") {
    return (
      <Badge
        variant="outline"
        className="gap-1 rounded-full border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-bold text-slate-500"
      >
        <XCircle className="h-3 w-3" /> Odrzucone
      </Badge>
    );
  }

  if (stage === "cancelled") {
    return (
      <Badge
        variant="outline"
        className="gap-1 rounded-full border-slate-200 bg-slate-50/50 px-2 py-0.5 text-[11px] font-bold italic text-slate-400 opacity-60"
      >
        <XCircle className="h-3 w-3" /> Anulowane
      </Badge>
    );
  }

  return (
    <Badge
      variant="outline"
      className="gap-1 rounded-full border-blue-100 bg-blue-50/60 px-2 py-0.5 text-[11px] font-medium text-[#10245f]"
    >
      <FileText className="h-3 w-3" /> Wyslane
    </Badge>
  );
}

function ApplicationCard({ app }: { app: ApplicationItem }) {
  const { offer, stage } = app;
  const isCountered = stage === "countered";
  const isInProgress = stage === "in_progress";
  const isDone = stage === "done";
  const isSent = stage === "sent";
  const agreedMoney = app.agreed_stawka ?? fromMinorUnits(app.agreed_stawka_minor);
  const isJobOffer =
    offer?.typ === "job" || offer?.typ === "Praca" || offer?.typ === "praca";

  return (
    <Card
      className={cn(
        "group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-0.5",
        isCountered
          ? "ring-1 ring-amber-300 shadow-amber-100/50 hover:shadow-lg hover:shadow-amber-200/30"
          : isInProgress
            ? "border-emerald-200 ring-1 ring-emerald-100 hover:shadow-lg hover:shadow-emerald-100/50"
            : isSent
              ? "border-blue-100 ring-1 ring-blue-50 hover:shadow-lg hover:shadow-blue-100/40"
              : "hover:border-lime-100/80 hover:shadow-lg",
      )}
    >
      <CardContent className="p-0">
        <div className="flex flex-col gap-0 md:flex-row md:items-stretch">
          <div
            className={cn(
              "h-1.5 w-full shrink-0 transition-colors duration-300 md:h-auto md:w-1.5 md:self-stretch",
              isCountered
                ? "bg-amber-400 group-hover:bg-amber-500"
                : isInProgress
                  ? "bg-emerald-500 group-hover:bg-emerald-600"
                  : isDone
                    ? "bg-slate-300 group-hover:bg-slate-400"
                : isJobOffer
                  ? "bg-[#10245f] group-hover:bg-[#0b1b47]"
                  : "bg-amber-500 group-hover:bg-amber-600",
            )}
          />

          <div className="flex min-w-0 flex-1 flex-col gap-0">
            {/* Negotiation alert banner */}
            {isCountered && app.counter_stawka && (
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-amber-100 bg-amber-50 px-4 py-2.5">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
                  <span className="text-xs font-bold text-amber-900">
                    Firma zaproponowała kontrofertę:{" "}
                    <span className="text-amber-700">{formatMoney(app.counter_stawka)}</span>
                  </span>
                  {app.proposed_stawka && app.counter_stawka !== app.proposed_stawka && (
                    <span className="text-[11px] text-amber-600">
                      (Twoja poprzednia: {formatMoney(app.proposed_stawka)})
                    </span>
                  )}
                </div>
                <span className="rounded-full border border-amber-200 bg-amber-100 px-2.5 py-0.5 text-[9px] font-black uppercase tracking-widest text-amber-600">
                  Wymagana decyzja
                </span>
              </div>
            )}

            {isInProgress && (
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-emerald-100 bg-emerald-50 px-4 py-2.5">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
                  <span className="text-xs font-bold text-emerald-950">
                    Realizacja aktywna - przejdź do workspace, gdy chcesz dodać pliki lub sprawdzić status.
                  </span>
                </div>
                <span className="rounded-full border border-emerald-200 bg-white px-2.5 py-0.5 text-[9px] font-black uppercase tracking-widest text-emerald-700">
                  W realizacji
                </span>
              </div>
            )}

            {stage === "sent" && (
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-blue-100 bg-blue-50 px-4 py-2.5">
                <div className="flex items-center gap-2">
                  <FileText className="h-3.5 w-3.5 shrink-0 text-[#10245f]" />
                  <span className="text-xs font-bold text-[#10245f]">
                    Zgłoszenie wysłane - czekasz na decyzję firmy.
                  </span>
                </div>
                <span className="rounded-full border border-blue-200 bg-white px-2.5 py-0.5 text-[9px] font-black uppercase tracking-widest text-[#10245f]">
                  Czeka na firmę
                </span>
              </div>
            )}

            <div className="flex flex-1 flex-col items-start justify-between gap-4 p-4 sm:p-5 lg:flex-row lg:items-center">
              <div className="w-full flex-1 space-y-2.5">
                <div className="flex flex-wrap items-center gap-2.5">
                  <h3 className="break-words text-base font-extrabold leading-tight text-slate-900 sm:text-lg">
                    {offer?.tytul ?? "Nieznana oferta"}
                  </h3>
                  <StatusBadge status={app.status} stage={stage} />
                </div>

                <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5 text-xs">
                  <div className="flex items-center gap-1.5 rounded-lg border border-slate-100 bg-slate-50 px-2.5 py-1 font-medium text-slate-500">
                    <Clock className="h-3.5 w-3.5 text-[#10245f]" />
                    <span>Złożono: {formatDate(app.created_at)}</span>
                  </div>

                  {offer?.typ && (
                    <Badge
                      variant="outline"
                      className="rounded-md border-slate-200 bg-slate-50 px-2 py-0.5 text-[9px] font-black uppercase tracking-widest"
                    >
                      {offer.typ}
                    </Badge>
                  )}
                </div>

                {app.message_to_company && (
                  <div className="relative max-w-xl break-words rounded-xl border border-slate-100 bg-slate-50/80 p-3 text-xs italic leading-relaxed text-slate-600">
                    <span className="mb-1 block text-[9px] font-bold uppercase tracking-widest text-slate-500 not-italic">
                      Twoja notatka:
                    </span>
                    &quot;{app.message_to_company}&quot;
                  </div>
                )}

                {stage === "cancelled" && app.cancel_reason && (
                  <div className="relative max-w-xl break-words rounded-xl border border-red-100 bg-red-50/70 p-3 text-xs leading-relaxed text-red-700">
                    <span className="mb-1 block text-[9px] font-bold uppercase tracking-widest text-red-600 not-italic">
                      Powód anulowania:
                    </span>
                    {app.cancel_reason}
                  </div>
                )}
              </div>

              <div className="flex w-full flex-col gap-2.5 lg:w-[220px] lg:shrink-0">
                <div
                  className={cn(
                    "rounded-xl border p-3 lg:text-right",
                    isCountered
                      ? "border-amber-200 bg-amber-50"
                      : isInProgress
                        ? "border-emerald-200 bg-emerald-50"
                        : isDone
                          ? "border-slate-200 bg-slate-50"
                          : "border-blue-100 bg-blue-50",
                  )}
                >
                  <span className="mb-0.5 text-[9px] font-bold uppercase tracking-widest text-slate-400">
                    Stawka / Budżet
                  </span>
                  <div className="flex flex-col gap-0.5 text-2xl font-black text-slate-900 lg:items-end">
                    {agreedMoney ? (
                      <span className="text-emerald-600">{formatMoney(agreedMoney)}</span>
                    ) : isCountered && app.counter_stawka ? (
                      <span className="text-amber-600">{formatMoney(app.counter_stawka)}</span>
                    ) : app.proposed_stawka ? (
                      <span className="text-[#10245f]">{formatMoney(app.proposed_stawka)}</span>
                    ) : (
                      <span>{formatMoney(offer?.stawka)}</span>
                    )}
                  </div>
                </div>

                <div className="flex w-full flex-col gap-2">
                  {isInProgress ? (
                    <>
                      <Button
                        asChild
                        className="h-10 w-full rounded-xl bg-slate-950 px-4 text-sm font-bold text-white transition-all duration-300 hover:bg-emerald-700"
                      >
                        <Link href={`/app/deliverables/${app.id}`}>Zarządzaj</Link>
                      </Button>
                      <form action={openChatForApplication.bind(null, app.id)}>
                        <Button
                          variant="outline"
                          className="h-10 w-full rounded-xl border-slate-200 bg-white text-sm font-bold text-slate-600 transition-all hover:bg-slate-50"
                        >
                          <MessageSquare className="mr-2 h-3.5 w-3.5" />
                          Czat
                        </Button>
                      </form>
                    </>
                  ) : isCountered ? (
                    <div className="flex w-full flex-col gap-3">
                      <div className="grid gap-2">
                        <form action={acceptCounterAsStudent.bind(null, app.id)}>
                          <Button className="h-10 w-full rounded-xl bg-emerald-600 px-4 text-sm font-bold text-white shadow-md shadow-emerald-200/50 transition-all duration-300 hover:bg-emerald-700">
                            Akceptuj {formatMoney(app.counter_stawka)}
                          </Button>
                        </form>
                        <form action={openChatForApplication.bind(null, app.id)}>
                          <Button
                            variant="outline"
                            className="h-9 w-full rounded-xl border-slate-200 text-sm text-slate-600 transition-all hover:bg-slate-50"
                          >
                            <MessageSquare className="mr-2 h-3.5 w-3.5" />
                            Czat
                          </Button>
                        </form>
                        <form action={rejectCounterAsStudent.bind(null, app.id)}>
                          <Button
                            variant="ghost"
                            className="h-9 w-full rounded-xl px-4 text-sm font-bold text-slate-500 transition-all hover:bg-red-50 hover:text-red-600"
                          >
                            Odrzuć
                          </Button>
                        </form>
                      </div>
                      <form
                        action={proposeNewPriceAsStudent.bind(null, app.id)}
                        className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50/80 px-2.5 py-1.5"
                      >
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 whitespace-nowrap">
                          Kontra:
                        </span>
                        <Input
                          name="proposed_stawka"
                          type="number"
                          placeholder="Kwota PLN"
                          className="h-8 w-24 rounded-lg border-none bg-white text-xs shadow-sm placeholder:text-slate-300 focus-visible:ring-lime-200"
                        />
                        <Button
                          type="submit"
                          size="sm"
                          className="h-8 rounded-lg bg-[#10245f] px-3 text-xs font-bold text-white transition-all hover:bg-[#0b1b47]"
                        >
                          Wyślij
                        </Button>
                      </form>
                      <WithdrawApplicationButton applicationId={app.id} />
                    </div>
                  ) : isDone ? (
                    <>
                      <Button
                        asChild
                        className="h-10 w-full rounded-xl bg-slate-900 px-4 text-sm font-bold text-white transition-all duration-300 hover:bg-[#10245f]"
                      >
                        <Link href={`/app/review/${app.id}`}>
                          <Star className="mr-2 h-3.5 w-3.5" />
                          Wystaw opinię
                        </Link>
                      </Button>
                      <Button
                        asChild
                        variant="outline"
                        className="h-10 w-full rounded-xl border-slate-200 bg-white px-4 text-sm font-bold text-slate-600 transition-all hover:bg-slate-50"
                      >
                        <Link href={`/app/deliverables/${app.id}`}>Szczegóły</Link>
                      </Button>
                    </>
                  ) : stage === "sent" ? (
                    <>
                      <Button
                        asChild
                        variant="outline"
                        className="h-10 w-full rounded-xl border-blue-200 bg-white px-4 text-sm font-bold text-[#10245f] transition-all hover:bg-blue-50"
                      >
                        <Link href={`/app/offers/${offer?.id}`}>Szczegóły</Link>
                      </Button>
                      <form action={openChatForApplication.bind(null, app.id)}>
                        <Button
                          variant="outline"
                          className="h-10 w-full rounded-xl border-slate-200 text-sm text-slate-600 hover:bg-slate-50"
                        >
                          <MessageSquare className="mr-2 h-3.5 w-3.5" />
                          Czat
                        </Button>
                      </form>
                    </>
                  ) : (
                    <Button
                      asChild
                      variant="outline"
                      className="h-10 w-full rounded-xl border-slate-200 bg-white px-4 text-sm font-bold text-slate-600 transition-all hover:bg-slate-50"
                    >
                      <Link href={`/app/offers/${offer?.id}`}>Szczegóły</Link>
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function SavedOfferCard({ offer }: { offer: OfferSummary | null }) {
  const isJobOffer =
    offer?.typ === "job" || offer?.typ === "Praca" || offer?.typ === "praca";

  return (
    <Card className="group overflow-hidden rounded-2xl border-transparent bg-white shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-lime-100/80 hover:shadow-lg">
      <CardContent className="p-0">
        <div className="flex flex-col gap-0 md:flex-row md:items-stretch">
          <div
            className={cn(
              "h-1.5 w-full shrink-0 transition-colors duration-300 md:h-auto md:w-1.5 md:self-stretch",
              isJobOffer
                ? "bg-[#10245f] group-hover:bg-[#0b1b47]"
                : "bg-amber-500 group-hover:bg-amber-600",
            )}
          />

          <div className="flex min-w-0 flex-1 flex-col items-start justify-between gap-4 p-4 sm:p-5 md:flex-row md:items-center">
            <div className="w-full flex-1 space-y-2.5">
              <div className="flex flex-wrap items-center gap-2.5">
                <h3 className="break-words text-base font-extrabold leading-tight text-slate-900 sm:text-lg">
                  {offer?.tytul ?? "Nieznana oferta"}
                </h3>
                <Badge className="shrink-0 gap-1 rounded-full border-amber-100 bg-amber-50 px-2 py-0.5 text-[11px] font-bold text-amber-600 shadow-sm shadow-amber-50">
                  <Bookmark className="h-3 w-3" /> Zapisane
                </Badge>
              </div>
              <p className="line-clamp-1 max-w-2xl text-xs font-medium leading-relaxed text-slate-500">
                {offer?.opis}
              </p>

              {offer?.typ ? (
                <Badge
                  variant="outline"
                  className="rounded-md border-slate-200 bg-slate-50 px-2 py-0.5 text-[9px] font-black uppercase tracking-widest"
                >
                  {offer.typ}
                </Badge>
              ) : null}
            </div>

            <div className="flex w-full flex-col items-start gap-3 md:w-auto md:items-end">
              <div className="flex flex-col md:items-end">
                <span className="mb-0.5 text-[9px] font-bold uppercase tracking-widest text-slate-400">
                  Stawka
                </span>
                <div className="text-xl font-black text-slate-900">
                  {formatMoney(offer?.stawka)}
                </div>
              </div>

              <div className="mt-1 flex w-full items-center gap-2 md:w-auto">
                <Button
                  asChild
                  variant="outline"
                  className="h-9 rounded-xl border-blue-100 px-4 text-sm font-bold text-[#10245f] transition-all hover:border-blue-200 hover:bg-blue-50/50"
                >
                  <Link href={`/app/offers/${offer?.id}`}>Pokaz oferte</Link>
                </Button>
                <form action={removeSavedOffer.bind(null, offer?.id ?? "")}>
                  <Button
                    variant="ghost"
                    className="h-9 rounded-xl px-3 text-sm font-bold text-red-500 hover:bg-red-50 hover:text-red-600"
                  >
                    Usun
                  </Button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function getOffer(item: FilterItem): OfferSummary | null {
  return item.offer;
}

function isSavedOfferItem(item: FilterItem): item is SavedOfferItem {
  return !("id" in item);
}

function isApplicationItem(item: FilterItem): item is ApplicationItem {
  return "id" in item;
}

function ClientApplicationFilter({
  items,
  type,
}: {
  items: FilterItem[];
  type: "application" | "saved";
}) {
  const [filter, setFilter] = useState<"all" | "micro" | "standard">("all");

  const isMicroOffer = (offer: OfferSummary | null) => {
    const offerType = (offer?.typ || "").toLowerCase();
    return (
      offer?.is_platform_service === true ||
      offerType.includes("micro") ||
      offerType.includes("mikro") ||
      offerType.includes("projekt")
    );
  };

  const micro = items.filter((item) => isMicroOffer(getOffer(item)));
  const standard = items.filter((item) => !isMicroOffer(getOffer(item)));
  const displayed = filter === "all" ? items : filter === "micro" ? micro : standard;

  return (
    <div className="animate-in space-y-4 fade-in duration-500">
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-2.5 shadow-sm sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:p-3">
        <div className="flex items-center gap-2 sm:ml-1">
          <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-lime-300" />
          <span className="text-[11px] font-black uppercase tracking-widest text-slate-400">
            Filtruj zestawienie
          </span>
        </div>

        <div className="scrollbar-hide flex w-full gap-1 overflow-x-auto rounded-xl border border-slate-200 bg-white p-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:w-auto">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setFilter("all")}
            className={cn(
              "h-8 shrink-0 justify-center rounded-full px-3 text-[11px] font-bold transition-all duration-300 sm:px-4",
              filter === "all"
                ? "bg-[#10245f] text-white shadow-sm"
                : "text-slate-500 hover:text-slate-700",
            )}
          >
            Wszystkie ({items.length})
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setFilter("standard")}
            className={cn(
              "h-8 shrink-0 justify-center gap-1.5 rounded-full px-3 text-[11px] font-bold transition-all duration-300 sm:px-4",
              filter === "standard"
                ? "bg-[#10245f] text-white shadow-sm"
                : "text-slate-500 hover:text-slate-700",
            )}
          >
            <Briefcase className="h-3.5 w-3.5" /> Praca ({standard.length})
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setFilter("micro")}
            className={cn(
              "h-8 shrink-0 justify-center gap-1.5 rounded-full px-3 text-[11px] font-bold transition-all duration-300 sm:px-4",
              filter === "micro"
                ? "bg-lime-300 text-[#0b1b47] shadow-sm"
                : "text-slate-500 hover:text-slate-700",
            )}
          >
            <Zap className="h-3.5 w-3.5" />
            <span className="sm:hidden">Mikro ({micro.length})</span>
            <span className="hidden sm:inline">Mikrozlecenia ({micro.length})</span>
          </Button>
        </div>
      </div>

      {displayed.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 py-16 text-center">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-slate-100 bg-white shadow-sm">
            <FileText className="h-6 w-6 text-slate-300" />
          </div>
          <h4 className="mb-1 text-base font-bold text-slate-800">Brak wynikow</h4>
          <p className="mx-auto max-w-xs text-sm text-slate-400">
            Spróbuj zmienić parametry filtrowania lub wrócić do widoku wszystkich
            aktywnosci.
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {displayed.map((item) => {
            if (type === "saved" && isSavedOfferItem(item)) {
              return (
                <SavedOfferCard
                  key={`${item.offer?.id ?? "saved-offer"}-${item.saved_at ?? "unknown"}`}
                  offer={item.offer}
                />
              );
            }

            if (isApplicationItem(item)) {
              return <ApplicationCard key={item.id} app={item} />;
            }

            return null;
          })}
        </div>
      )}
    </div>
  );
}

export function ApplicationList({ items }: { items: ApplicationItem[] }) {
  return <ClientApplicationFilter items={items} type="application" />;
}

export function SavedList({ items }: { items: SavedOfferItem[] }) {
  return <ClientApplicationFilter items={items} type="saved" />;
}
