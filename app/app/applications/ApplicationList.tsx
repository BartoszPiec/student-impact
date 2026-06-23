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
      <Badge className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-200 px-3 py-1 rounded-full font-bold gap-1.5">
        <CheckCircle2 className="w-3.5 h-3.5" /> Zakonczone
      </Badge>
    );
  }

  if (stage === "in_progress") {
    return (
      <Badge className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border-indigo-200 px-3 py-1 rounded-full font-bold gap-1.5 animate-pulse">
        <Clock className="w-3.5 h-3.5" /> W realizacji
      </Badge>
    );
  }

  if (status === "countered") {
    return (
      <Badge className="bg-amber-50 text-amber-700 hover:bg-amber-100 border-amber-200 px-3 py-1 rounded-full font-bold gap-1.5">
        <AlertCircle className="w-3.5 h-3.5" /> Negocjacje
      </Badge>
    );
  }

  if (status === "rejected") {
    return (
      <Badge
        variant="outline"
        className="text-slate-500 border-slate-200 px-3 py-1 rounded-full font-bold gap-1.5 bg-slate-50"
      >
        <XCircle className="w-3.5 h-3.5" /> Odrzucone
      </Badge>
    );
  }

  if (stage === "cancelled") {
    return (
      <Badge
        variant="outline"
        className="text-slate-400 border-slate-200 px-3 py-1 rounded-full font-bold gap-1.5 bg-slate-50/50 italic opacity-60"
      >
        <XCircle className="w-3.5 h-3.5" /> Anulowane
      </Badge>
    );
  }

  return (
    <Badge
      variant="outline"
      className="text-indigo-600 border-indigo-100 px-3 py-1 rounded-full gap-1.5 bg-indigo-50/30 font-medium"
    >
      <FileText className="w-3.5 h-3.5" /> Wyslane
    </Badge>
  );
}

function ApplicationCard({ app }: { app: ApplicationItem }) {
  const { offer, stage } = app;
  const isCountered = stage === "countered";
  const isInProgress = stage === "in_progress";
  const isDone = stage === "done";
  const agreedMoney = app.agreed_stawka ?? fromMinorUnits(app.agreed_stawka_minor);
  const isJobOffer =
    offer?.typ === "job" || offer?.typ === "Praca" || offer?.typ === "praca";

  return (
    <Card
      className={cn(
        "transition-all duration-500 border-transparent bg-white group rounded-3xl overflow-hidden shadow-sm hover:-translate-y-1",
        isCountered
          ? "ring-2 ring-amber-300 shadow-amber-100/60 hover:shadow-xl hover:shadow-amber-200/40"
          : "hover:shadow-xl hover:border-indigo-100/50",
      )}
    >
      <CardContent className="p-0">
        <div className="flex flex-col md:flex-row gap-0">
          <div
            className={cn(
              "w-full md:w-2 md:h-initial h-2 shrink-0 transition-colors duration-500",
              isCountered
                ? "bg-amber-400 group-hover:bg-amber-500"
                : isJobOffer
                  ? "bg-indigo-500 group-hover:bg-indigo-600"
                  : "bg-amber-500 group-hover:bg-amber-600",
            )}
          />

          <div className="flex min-w-0 flex-1 flex-col gap-0">
            {/* Negotiation alert banner */}
            {isCountered && app.counter_stawka && (
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-amber-100 bg-amber-50 px-6 py-3">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
                  <span className="text-sm font-bold text-amber-900">
                    Firma zaproponowała kontrofertę:{" "}
                    <span className="text-amber-700">{formatMoney(app.counter_stawka)}</span>
                  </span>
                  {app.proposed_stawka && app.counter_stawka !== app.proposed_stawka && (
                    <span className="text-xs text-amber-600">
                      (Twoja poprzednia: {formatMoney(app.proposed_stawka)})
                    </span>
                  )}
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-amber-600 bg-amber-100 rounded-full px-3 py-1 border border-amber-200">
                  Wymagana decyzja
                </span>
              </div>
            )}

            <div className="flex flex-1 flex-col items-start justify-between gap-5 p-5 sm:p-6 md:flex-row md:items-center">
              <div className="space-y-3 flex-1 w-full">
                <div className="flex items-center gap-3 flex-wrap">
                  <h3 className="break-words text-lg font-extrabold leading-tight text-slate-900 sm:text-xl">
                    {offer?.tytul ?? "Nieznana oferta"}
                  </h3>
                  <StatusBadge status={app.status} stage={stage} />
                </div>

                <div className="flex flex-wrap items-center gap-y-2 gap-x-4 text-sm">
                  <div className="flex items-center gap-2 text-slate-500 font-medium bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
                    <Clock className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Złożono: {formatDate(app.created_at)}</span>
                  </div>

                  {offer?.typ && (
                    <Badge
                      variant="outline"
                      className="text-[10px] font-black uppercase tracking-widest bg-slate-50 border-slate-200 rounded-lg px-2 py-1"
                    >
                      {offer.typ}
                    </Badge>
                  )}
                </div>

                {app.message_to_company && (
                  <div className="relative max-w-2xl break-words rounded-2xl border border-slate-100 bg-slate-50/80 p-4 text-sm italic leading-relaxed text-slate-600">
                    <span className="font-bold text-slate-500 not-italic block text-[10px] uppercase tracking-widest mb-1">
                      Twoja notatka:
                    </span>
                    &quot;{app.message_to_company}&quot;
                  </div>
                )}

                {stage === "cancelled" && app.cancel_reason && (
                  <div className="relative max-w-2xl break-words rounded-2xl border border-red-100 bg-red-50/70 p-4 text-sm leading-relaxed text-red-700">
                    <span className="font-bold text-red-600 not-italic block text-[10px] uppercase tracking-widest mb-1">
                      Powód anulowania:
                    </span>
                    {app.cancel_reason}
                  </div>
                )}
              </div>

              <div className="flex w-full flex-col items-start gap-4 md:w-auto md:items-end">
                <div className="flex flex-col md:items-end">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">
                    Stawka / Budżet
                  </span>
                  <div className="flex flex-col gap-0.5 text-xl font-black text-slate-900 sm:text-2xl md:items-end">
                    {agreedMoney ? (
                      <span className="text-emerald-600">{formatMoney(agreedMoney)}</span>
                    ) : isCountered && app.counter_stawka ? (
                      <span className="text-amber-600">{formatMoney(app.counter_stawka)}</span>
                    ) : app.proposed_stawka ? (
                      <span className="text-indigo-600">{formatMoney(app.proposed_stawka)}</span>
                    ) : (
                      <span>{formatMoney(offer?.stawka)}</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full md:w-auto">
                  {isInProgress ? (
                    <>
                      <Button
                        asChild
                        className="h-10 rounded-xl bg-slate-900 text-white px-5 font-bold hover:bg-indigo-600 transition-all duration-300"
                      >
                        <Link href={`/app/deliverables/${app.id}`}>Zarządzaj</Link>
                      </Button>
                      <form action={openChatForApplication.bind(null, app.id)}>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-10 w-10 rounded-xl border-slate-200 text-slate-600 hover:bg-slate-50 transition-all"
                        >
                          <MessageSquare className="w-4 h-4" />
                        </Button>
                      </form>
                    </>
                  ) : isCountered ? (
                    <div className="flex flex-col md:items-end gap-3 w-full md:w-auto">
                      <div className="flex flex-wrap items-center gap-2">
                        <form action={acceptCounterAsStudent.bind(null, app.id)}>
                          <Button className="h-10 rounded-xl bg-emerald-600 text-white px-5 font-bold hover:bg-emerald-700 shadow-lg shadow-emerald-200/50 transition-all duration-300">
                            Akceptuj {formatMoney(app.counter_stawka)}
                          </Button>
                        </form>
                        <form action={openChatForApplication.bind(null, app.id)}>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-10 w-10 rounded-xl border-slate-200 text-slate-600 hover:bg-slate-50 transition-all"
                          >
                            <MessageSquare className="w-4 h-4" />
                          </Button>
                        </form>
                        <form action={rejectCounterAsStudent.bind(null, app.id)}>
                          <Button
                            variant="ghost"
                            className="h-10 rounded-xl text-slate-500 hover:text-red-600 hover:bg-red-50 px-4 font-bold transition-all"
                          >
                            Odrzuć
                          </Button>
                        </form>
                      </div>
                      <form
                        action={proposeNewPriceAsStudent.bind(null, app.id)}
                        className="flex items-center gap-1.5 rounded-2xl border border-slate-200 bg-slate-50/80 px-3 py-1.5"
                      >
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 whitespace-nowrap">
                          Kontra:
                        </span>
                        <Input
                          name="proposed_stawka"
                          type="number"
                          placeholder="Kwota PLN"
                          className="h-8 w-28 rounded-xl border-none bg-white shadow-sm text-sm placeholder:text-slate-300 focus-visible:ring-indigo-200"
                        />
                        <Button
                          type="submit"
                          size="sm"
                          className="h-8 rounded-xl bg-indigo-600 text-white font-bold text-xs px-3 hover:bg-indigo-700 transition-all"
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
                        className="h-10 rounded-xl bg-slate-900 text-white px-5 font-bold hover:bg-indigo-600 transition-all duration-300"
                      >
                        <Link href={`/app/review/${app.id}`}>
                          <Star className="mr-2 h-4 w-4" />
                          Wystaw opinię
                        </Link>
                      </Button>
                      <Button
                        asChild
                        variant="outline"
                        className="h-10 rounded-xl border-slate-200 bg-white text-slate-600 font-bold hover:bg-slate-50 transition-all px-6"
                      >
                        <Link href={`/app/deliverables/${app.id}`}>Szczegóły</Link>
                      </Button>
                    </>
                  ) : stage === "sent" ? (
                    <>
                      <Button
                        asChild
                        variant="outline"
                        className="h-10 rounded-xl border-indigo-200 bg-white text-indigo-700 font-bold hover:bg-indigo-50 transition-all px-6"
                      >
                        <Link href={`/app/offers/${offer?.id}`}>Szczegóły</Link>
                      </Button>
                      <form action={openChatForApplication.bind(null, app.id)}>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-10 w-10 rounded-xl border-slate-200 text-slate-600 hover:bg-slate-50"
                        >
                          <MessageSquare className="w-4 h-4" />
                        </Button>
                      </form>
                    </>
                  ) : (
                    <Button
                      asChild
                      variant="outline"
                      className="h-10 rounded-xl border-slate-200 bg-white text-slate-600 font-bold hover:bg-slate-50 transition-all px-6"
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
    <Card className="hover:shadow-xl transition-all duration-500 border-transparent bg-white group rounded-3xl overflow-hidden shadow-sm hover:border-indigo-100/50 hover:-translate-y-1">
      <CardContent className="p-0">
        <div className="flex flex-col md:flex-row gap-0">
          <div
            className={cn(
              "w-full md:w-2 md:h-initial h-2 shrink-0 transition-colors duration-500",
              isJobOffer
                ? "bg-indigo-500 group-hover:bg-indigo-600"
                : "bg-amber-500 group-hover:bg-amber-600",
            )}
          />

          <div className="flex min-w-0 flex-1 flex-col items-start justify-between gap-5 p-5 sm:p-6 md:flex-row md:items-center">
            <div className="space-y-3 flex-1 w-full">
              <div className="flex items-center gap-3 flex-wrap">
                <h3 className="break-words text-lg font-extrabold leading-tight text-slate-900 sm:text-xl">
                  {offer?.tytul ?? "Nieznana oferta"}
                </h3>
                <Badge className="bg-amber-50 text-amber-600 border-amber-100 rounded-full px-3 py-1 font-bold gap-1.5 shrink-0 shadow-sm shadow-amber-50">
                  <Bookmark className="w-3.5 h-3.5" /> Zapisane
                </Badge>
              </div>
              <p className="text-sm text-slate-500 line-clamp-1 leading-relaxed font-medium max-w-2xl">
                {offer?.opis}
              </p>

              {offer?.typ ? (
                <Badge
                  variant="outline"
                  className="text-[10px] font-black uppercase tracking-widest bg-slate-50 border-slate-200 rounded-lg px-2"
                >
                  {offer.typ}
                </Badge>
              ) : null}
            </div>

            <div className="flex w-full flex-col items-start gap-4 md:w-auto md:items-end">
              <div className="flex flex-col md:items-end">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">
                  Stawka
                </span>
                <div className="font-black text-2xl text-slate-900">
                  {formatMoney(offer?.stawka)}
                </div>
              </div>

              <div className="flex items-center gap-2 w-full md:w-auto mt-2">
                <Button
                  asChild
                  variant="outline"
                  className="h-10 rounded-xl border-indigo-100 text-indigo-700 font-bold hover:bg-indigo-50/50 hover:border-indigo-200 transition-all px-6"
                >
                  <Link href={`/app/offers/${offer?.id}`}>Pokaz oferte</Link>
                </Button>
                <form action={removeSavedOffer.bind(null, offer?.id ?? "")}>
                  <Button
                    variant="ghost"
                    className="h-10 rounded-xl text-red-500 hover:bg-red-50 hover:text-red-600 font-bold px-4"
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
    <div className="space-y-6 animate-in fade-in duration-500 sm:space-y-8">
      <div className="flex flex-col gap-4 rounded-[1.75rem] border border-slate-200 bg-white/50 p-3 shadow-sm backdrop-blur-sm sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:rounded-3xl sm:p-4">
        <div className="flex items-center gap-3 sm:ml-2">
          <div className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse" />
          <span className="text-xs font-black uppercase text-slate-400 tracking-widest">
            Filtruj zestawienie
          </span>
        </div>

        <div className="grid w-full grid-cols-3 gap-1.5 rounded-2xl border border-slate-200/50 bg-slate-100/80 p-1.5 sm:w-auto sm:flex">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setFilter("all")}
            className={cn(
              "h-9 justify-center rounded-xl px-2 text-[11px] font-bold transition-all duration-300 sm:px-5 sm:text-xs",
              filter === "all"
                ? "bg-white text-indigo-700 shadow-md ring-1 ring-slate-200"
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
              "h-9 justify-center gap-1.5 rounded-xl px-2 text-[11px] font-bold transition-all duration-300 sm:gap-2 sm:px-5 sm:text-xs",
              filter === "standard"
                ? "bg-white text-indigo-700 shadow-md ring-1 ring-slate-200"
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
              "h-9 justify-center gap-1.5 rounded-xl px-2 text-[11px] font-bold transition-all duration-300 sm:gap-2 sm:px-5 sm:text-xs",
              filter === "micro"
                ? "bg-white text-indigo-700 shadow-md ring-1 ring-slate-200"
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
        <div className="flex flex-col items-center justify-center py-24 bg-slate-50/50 border-2 border-dashed border-slate-200 rounded-[2.5rem] text-center">
          <div className="h-16 w-16 bg-white rounded-2xl flex items-center justify-center border border-slate-100 shadow-xl mb-6">
            <FileText className="h-8 w-8 text-slate-300" />
          </div>
          <h4 className="text-lg font-bold text-slate-800 mb-2">Brak wynikow</h4>
          <p className="text-slate-400 text-sm max-w-xs mx-auto">
            Spróbuj zmienić parametry filtrowania lub wrócić do widoku wszystkich
            aktywnosci.
          </p>
        </div>
      ) : (
        <div className="grid gap-6">
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
