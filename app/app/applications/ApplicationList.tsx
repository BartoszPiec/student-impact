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
  const agreedMoney = app.agreed_stawka ?? fromMinorUnits(app.agreed_stawka_minor);
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

          <div className="flex flex-col md:flex-row flex-1 p-6 justify-between gap-6 items-start md:items-center">
            <div className="space-y-4 flex-1 w-full">
              <div className="flex items-center gap-3 flex-wrap">
                <h3 className="font-extrabold text-xl text-slate-900 leading-tight">
                  {offer?.tytul ?? "Nieznana oferta"}
                </h3>
                <StatusBadge status={app.status} stage={stage} />
              </div>

              <div className="flex flex-wrap items-center gap-y-2 gap-x-6 text-sm">
                <div className="flex items-center gap-2 text-slate-500 font-medium bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
                  <Clock className="w-4 h-4 text-indigo-500" />
                  <span>Zlozono: {formatDate(app.created_at)}</span>
                </div>

                <div className="flex items-center gap-2 text-slate-400 font-bold bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
                  <span className="uppercase tracking-tight text-[10px]">ID: {app.id.slice(0, 8)}</span>
                </div>

                {offer?.typ ? (
                  <Badge
                    variant="outline"
                    className="text-[10px] font-black uppercase tracking-widest bg-slate-50 border-slate-200 rounded-lg px-2 py-1"
                  >
                    {offer.typ}
                  </Badge>
                ) : null}
              </div>

              {app.message_to_company ? (
                <div className="relative p-4 bg-indigo-50/10 border border-indigo-100/30 rounded-2xl text-sm italic text-slate-600 leading-relaxed max-w-2xl">
                  <MessageSquare className="absolute -top-3 -right-3 h-8 w-8 text-indigo-100 opacity-50" />
                  <span className="font-bold text-indigo-900 not-italic block text-[10px] uppercase tracking-widest mb-1">
                    Twoja notatka:
                  </span>
                  &quot;{app.message_to_company}&quot;
                </div>
              ) : null}
            </div>

            <div className="flex flex-col md:items-end items-start gap-4">
              <div className="flex flex-col md:items-end">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">
                  Stawka / Budzet
                </span>
                <div className="font-black text-2xl text-slate-900 flex flex-col md:items-end gap-1">
                  {agreedMoney ? (
                    <span className="text-emerald-600">{formatMoney(agreedMoney)}</span>
                  ) : app.counter_stawka ? (
                    <span className="text-amber-600">{formatMoney(app.counter_stawka)}</span>
                  ) : app.proposed_stawka ? (
                    <span className="text-indigo-600">{formatMoney(app.proposed_stawka)}</span>
                  ) : (
                    <span>{formatMoney(offer?.stawka)}</span>
                  )}
                  {isCountered && app.counter_stawka ? (
                    <span className="text-[10px] text-slate-400 font-medium">
                      Propozycja firmy
                    </span>
                  ) : null}
                </div>
              </div>

              <div className="flex items-center gap-2 w-full md:w-auto mt-2">
                {isInProgress ? (
                  <>
                    <Button
                      asChild
                      className="h-10 rounded-xl bg-gradient-to-r from-slate-800 to-slate-900 hover:from-slate-700 hover:to-slate-800 text-white px-5 font-bold shadow-lg shadow-slate-200 border border-slate-700/50 transition-all duration-300"
                    >
                      <Link href={`/app/deliverables/${app.id}`}>Zarzadzaj</Link>
                    </Button>
                    <form action={openChatForApplication.bind(null, app.id)}>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-10 w-10 rounded-xl border-slate-200 text-slate-600 hover:bg-slate-50 transition-all"
                      >
                        <MessageSquare className="w-4.5 h-4.5" />
                      </Button>
                    </form>
                  </>
                ) : isCountered ? (
                  <div className="flex flex-col md:items-end gap-2.5 w-full md:w-auto">
                    <div className="flex items-center gap-2">
                      <form action={acceptCounterAsStudent.bind(null, app.id)}>
                        <Button className="h-10 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-400 hover:from-emerald-400 hover:to-emerald-300 text-white px-5 font-bold shadow-lg shadow-emerald-200/50 border border-emerald-400/30 transition-all duration-300">
                          Akceptuj
                        </Button>
                      </form>
                      <form action={rejectCounterAsStudent.bind(null, app.id)}>
                        <Button
                          variant="ghost"
                          className="h-10 rounded-xl text-slate-500 hover:text-red-600 hover:bg-red-50/50 px-4 font-bold transition-all duration-300"
                        >
                          Odrzuc
                        </Button>
                      </form>
                      <form action={openChatForApplication.bind(null, app.id)}>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-10 w-10 rounded-xl border-slate-200 text-slate-600 hover:bg-slate-50 transition-all"
                        >
                          <MessageSquare className="w-4.5 h-4.5" />
                        </Button>
                      </form>
                    </div>
                    <form
                      action={proposeNewPriceAsStudent.bind(null, app.id)}
                      className="flex items-center gap-1.5 bg-slate-50/80 rounded-xl px-2 py-1 border border-slate-100"
                    >
                      <Input
                        name="proposed_stawka"
                        type="number"
                        placeholder="Kwota..."
                        className="h-8 w-24 rounded-lg border-none bg-white shadow-sm text-sm placeholder:text-slate-300 focus-visible:ring-indigo-200"
                      />
                      <Button
                        variant="ghost"
                        type="submit"
                        size="sm"
                        className="h-8 rounded-lg bg-gradient-to-r from-indigo-50 to-indigo-100/50 text-indigo-700 hover:bg-indigo-100 hover:text-indigo-800 font-bold text-xs px-3 shadow-sm shadow-indigo-100 border border-indigo-200/50 transition-all duration-300"
                      >
                        Zaproponuj
                      </Button>
                    </form>
                    <WithdrawApplicationButton applicationId={app.id} />
                  </div>
                ) : stage === "sent" ? (
                  <>
                    <Button
                      asChild
                      variant="outline"
                      className="h-10 rounded-xl border-indigo-200 bg-white hover:bg-indigo-50 text-indigo-700 font-bold shadow-sm shadow-indigo-100 transition-all duration-300 px-6"
                    >
                      <Link href={`/app/offers/${offer?.id}`}>Szczegoly</Link>
                    </Button>
                    <form action={openChatForApplication.bind(null, app.id)}>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-10 w-10 rounded-xl border-slate-200 text-slate-600 hover:bg-slate-50"
                      >
                        <MessageSquare className="w-4.5 h-4.5" />
                      </Button>
                    </form>
                  </>
                ) : (
                  <Button
                    asChild
                    variant="outline"
                    className="h-10 rounded-xl border-slate-200 bg-white hover:bg-slate-50 text-slate-600 font-bold shadow-sm transition-all duration-300 px-6"
                  >
                    <Link href={`/app/offers/${offer?.id}`}>Szczegoly</Link>
                  </Button>
                )}
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

          <div className="flex flex-col md:flex-row flex-1 p-6 justify-between gap-6 items-start md:items-center">
            <div className="space-y-3 flex-1 w-full">
              <div className="flex items-center gap-3 flex-wrap">
                <h3 className="font-extrabold text-xl text-slate-900 leading-tight">
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

            <div className="flex flex-col md:items-end items-start gap-4">
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
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-white/50 backdrop-blur-sm border border-slate-200 rounded-3xl shadow-sm">
        <div className="flex items-center gap-3 ml-2">
          <div className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse" />
          <span className="text-xs font-black uppercase text-slate-400 tracking-widest">
            Filtruj zestawienie
          </span>
        </div>

        <div className="flex bg-slate-100/80 p-1.5 rounded-2xl border border-slate-200/50">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setFilter("all")}
            className={cn(
              "text-xs px-5 h-9 rounded-xl font-bold transition-all duration-300",
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
              "text-xs px-5 h-9 rounded-xl font-bold gap-2 transition-all duration-300",
              filter === "standard"
                ? "bg-white text-indigo-700 shadow-md ring-1 ring-slate-200"
                : "text-slate-500 hover:text-slate-700",
            )}
          >
            <Briefcase className="w-3.5 h-3.5" /> Praca ({standard.length})
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setFilter("micro")}
            className={cn(
              "text-xs px-5 h-9 rounded-xl font-bold gap-2 transition-all duration-300",
              filter === "micro"
                ? "bg-white text-indigo-700 shadow-md ring-1 ring-slate-200"
                : "text-slate-500 hover:text-slate-700",
            )}
          >
            <Zap className="w-3.5 h-3.5" /> Mikrozlecenia ({micro.length})
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
            Sprobuj zmienic parametry filtrowania lub wrocic do widoku wszystkich
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
