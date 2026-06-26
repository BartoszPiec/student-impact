"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Banknote,
  Briefcase,
  Building2,
  CheckCircle2,
  Clock,
  MapPin,
  SearchCheck,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface JobOffer {
  id: string;
  tytul: string;
  company_id: string;
  company_name?: string;
  company_logo?: string;
  stawka?: string | number;
  salary_range_min?: number;
  salary_range_max?: number;
  location?: string;
  is_remote?: boolean;
  contract_type?: string;
  technologies?: string[];
  typ: string;
  category?: string;
  created_at: string;
  is_platform_service?: boolean;
  opis?: string;
  obligations?: string;
}

function normalizeLabel(value: string) {
  return value
    .toLocaleLowerCase("pl-PL")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function formatSalary(offer: JobOffer) {
  const offerType = normalizeLabel(offer.typ);
  const isChallenge = offerType.includes("challenge") || offerType.includes("wyzwan");

  if (offer.is_platform_service && offer.stawka) return `${offer.stawka} PLN`;

  const hasMin = offer.salary_range_min != null && offer.salary_range_min > 0;
  const hasMax = offer.salary_range_max != null && offer.salary_range_max > 0;

  if (hasMin && hasMax) {
    if (offer.salary_range_min === offer.salary_range_max) return `${offer.salary_range_min} PLN`;
    return `${offer.salary_range_min} - ${offer.salary_range_max} PLN`;
  }

  if (hasMin) return `od ${offer.salary_range_min} PLN`;
  if (hasMax) return `do ${offer.salary_range_max} PLN`;
  if (offer.stawka) return `${offer.stawka} PLN`;
  if (isChallenge) return "Do wyceny";

  return "Stawka niepodana";
}

function timeAgo(date: string) {
  const d = new Date(date);
  const now = new Date();

  const dDate = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const nDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diffTime = nDate.getTime() - dDate.getTime();
  const days = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (days === 0) return "Dzisiaj";
  if (days === 1) return "Wczoraj";
  return `${days} dni temu`;
}

export function JobCard({ offer, isApplied }: { offer: JobOffer; isApplied?: boolean }) {
  const offerType = normalizeLabel(offer.typ);
  const isChallenge = offerType.includes("challenge") || offerType.includes("wyzwan");
  const isJob = offerType.includes("job") || offerType.includes("praca") || offerType.includes("staz");
  const isMicro = !isJob;
  const budgetLabel = isChallenge ? "Budzet orientacyjny" : isJob ? "Wynagrodzenie m-c" : "Budzet zlecenia";

  return (
    <Card
      className={cn(
        "group overflow-hidden rounded-2xl border transition-all duration-300",
        isApplied
          ? "border-emerald-100 bg-emerald-50/30 shadow-sm"
          : "border-slate-200 bg-white shadow-sm hover:border-indigo-100 hover:shadow-md",
      )}
    >
      <CardContent className="flex flex-col items-start gap-3 p-4 sm:gap-5 sm:p-5 md:flex-row">
        <div className="flex w-full items-start justify-between gap-3 md:block md:w-auto">
          <div className="relative">
            <div
              className={cn(
                "flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl border transition-transform duration-300 group-hover:scale-105 sm:h-14 sm:w-14 sm:rounded-2xl",
                isApplied ? "bg-white border-emerald-100" : "bg-slate-50 border-slate-100 group-hover:border-indigo-100",
              )}
            >
              <Building2
                className={cn(
                  "h-5 w-5 sm:h-7 sm:w-7",
                  isApplied ? "text-emerald-500" : "text-slate-400 group-hover:text-indigo-500",
                )}
              />
            </div>
            {isApplied ? (
              <div className="absolute -right-2 -top-2 rounded-full border-2 border-white bg-emerald-500 p-1 text-white shadow-lg">
                <CheckCircle2 className="h-3 w-3" />
              </div>
            ) : null}
          </div>

          <div
            className={cn(
              "hidden rounded-xl px-2.5 py-1.5 text-right",
              isChallenge ? "bg-emerald-50 text-emerald-700" : isMicro ? "bg-amber-50 text-amber-700" : "bg-indigo-50 text-indigo-700",
            )}
          >
            <div className="flex items-center justify-end gap-1 text-[9px] font-black uppercase tracking-wider opacity-70 sm:text-[10px]">
              <Banknote className="h-3 w-3" />
              {isJob ? "Stawka" : "Budzet"}
            </div>
            <div className="mt-0.5 max-w-[8rem] truncate text-xs font-black tabular-nums sm:max-w-[9.5rem] sm:text-sm">
              {formatSalary(offer)}
            </div>
          </div>
        </div>

        <div className="min-w-0 flex-1 space-y-2.5 sm:space-y-3">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              {isChallenge ? (
                <Badge
                  variant="secondary"
                  className="h-5 border-none bg-emerald-50 px-2 text-[9px] font-bold uppercase tracking-wider text-emerald-700 tabular-nums hover:bg-emerald-100 sm:text-[10px]"
                >
                  <SearchCheck className="mr-1 h-3 w-3" />
                  Wyzwanie do wyceny
                </Badge>
              ) : null}
              {isMicro && !isChallenge ? (
                <Badge
                  variant="secondary"
              className="h-5 border-none bg-orange-50 px-2 text-[9px] font-bold uppercase tracking-normal text-orange-600 tabular-nums hover:bg-orange-100 sm:text-[10px]"
                >
                  <Zap className="mr-1 h-3 w-3 fill-amber-500" />
                  Mikrozlecenie
                </Badge>
              ) : null}
              {isJob ? (
                <Badge
                  variant="secondary"
                  className="h-5 border-none bg-indigo-50 px-2 text-[9px] font-bold uppercase tracking-wider text-indigo-600 tabular-nums hover:bg-indigo-100 sm:text-[10px]"
                >
                  <Briefcase className="mr-1 h-3 w-3 fill-indigo-500" />
                  Praca
                </Badge>
              ) : null}
              {offer.category ? (
                <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400 sm:text-[10px]">
                  {offer.category}
                </span>
              ) : null}
            </div>

            <h3 className="line-clamp-2 text-base font-bold leading-snug text-slate-900 transition-colors group-hover:text-indigo-600 sm:text-xl md:line-clamp-1">
              {offer.tytul}
            </h3>

            <div className="flex flex-wrap items-center gap-1.5 text-xs font-semibold text-slate-500 sm:text-sm">
              <span className="text-slate-900">{offer.company_name || "Firma"}</span>
              <span className="text-slate-300">-</span>
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5 text-slate-400" />
                {timeAgo(offer.created_at)}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap gap-x-3 gap-y-1.5 pt-0.5 sm:gap-x-6 sm:gap-y-2 sm:pt-1">
            {(offer.location || offer.is_remote) ? (
              <div className="flex items-center gap-1.5 rounded-full border border-slate-100 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600 sm:px-3 sm:text-sm">
                <MapPin className="h-3.5 w-3.5 text-indigo-500 sm:h-4 sm:w-4" />
                {offer.is_remote ? (offer.location ? `Remote - ${offer.location}` : "Remote") : offer.location}
              </div>
            ) : null}
            {offer.contract_type ? (
              <div className="flex items-center gap-1.5 rounded-full border border-slate-100 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600 sm:px-3 sm:text-sm">
                <Clock className="h-3.5 w-3.5 text-indigo-500 sm:h-4 sm:w-4" />
                {offer.contract_type}
              </div>
            ) : null}
          </div>

          {offer.technologies && offer.technologies.length > 0 ? (
            <div className="flex flex-wrap gap-1.5 pt-0.5 sm:gap-2 sm:pt-1">
              {offer.technologies.slice(0, 5).map((tech) => (
                <span
                  key={tech}
                  className="rounded-md border border-slate-100 bg-white px-2 py-0.5 text-[10px] font-bold text-slate-600 shadow-sm transition-colors hover:border-indigo-200 sm:rounded-lg sm:px-2.5 sm:py-1 sm:text-[11px]"
                >
                  {tech}
                </span>
              ))}
            </div>
          ) : null}
        </div>

        <div className="flex w-full flex-shrink-0 flex-col gap-2.5 sm:gap-4 md:w-auto md:min-w-[180px] md:items-end">
          <div className="text-left md:text-right">
            <div className="text-2xl font-black text-[#10245f] tabular-nums md:text-xl">{formatSalary(offer)}</div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{budgetLabel}</div>
          </div>

          <div className="flex w-full flex-col gap-2">
            <Button
              asChild
              className={cn(
                "h-10 w-full rounded-xl text-sm font-bold transition-all sm:h-11 sm:text-base",
                isApplied
                  ? "border border-emerald-100 bg-white text-emerald-600 shadow-md hover:bg-emerald-50"
                  : isChallenge
                    ? "border-none bg-emerald-600 text-white shadow-lg shadow-emerald-200 hover:bg-emerald-700"
                    : isMicro
                      ? "border-none bg-lime-300 text-[#0b1b47] shadow-lg shadow-lime-100 hover:bg-lime-200"
                      : "border-none bg-lime-300 text-[#0b1b47] shadow-lg shadow-lime-100 hover:bg-lime-200",
              )}
            >
              <Link href={`/app/offers/${offer.id}`}>
                {isApplied ? "Zobacz zgloszenie" : isChallenge ? "Zloz pitch ->" : "Aplikuj teraz ->"}
              </Link>
            </Button>
            {isApplied ? (
              <div className="flex items-center justify-center gap-1.5 rounded-lg bg-emerald-50 py-1 text-[11px] font-bold text-emerald-600">
                <CheckCircle2 className="h-3 w-3" />
                Juz aplikowales
              </div>
            ) : null}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
