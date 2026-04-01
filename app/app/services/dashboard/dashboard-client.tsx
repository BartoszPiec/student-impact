"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { pl } from "date-fns/locale";
import {
  ArrowRight,
  Briefcase,
  Calendar,
  Inbox,
  Search,
  SlidersHorizontal,
  Sparkles,
  Wallet,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getRequestSnapshotPreview, isRequestSnapshot } from "@/lib/services/service-order-snapshots";

import {
  getServiceOrderBucket,
  getServiceOrderStatusMeta,
  getServiceOrderStatusOptions,
  SERVICE_ORDER_BUCKETS,
} from "./service-order-status";

function getOrderPreview(order: any) {
  const snapshot = isRequestSnapshot(order.request_snapshot) ? order.request_snapshot : null;

  if (snapshot?.source === "student_private_proposal") {
    return [snapshot.proposal_goal, snapshot.expected_result, snapshot.message]
      .filter(Boolean)
      .join(" • ");
  }

  return getRequestSnapshotPreview(snapshot, order.requirements);
}

interface DashboardClientProps {
  initialOrders: any[];
  companyData: Record<string, any>;
}

export default function DashboardClient({ initialOrders, companyData }: DashboardClientProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [status, setStatus] = useState("all");
  const [sort, setSort] = useState("newest");

  const filteredOrders = useMemo(() => {
    let result = [...initialOrders];

    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      result = result.filter((order) => {
        const title = order.package?.title?.toLowerCase() || "";
        const companyName = companyData[order.company_id]?.nazwa?.toLowerCase() || "";
        return title.includes(lowerSearch) || companyName.includes(lowerSearch);
      });
    }

    if (status !== "all") {
      result = result.filter((order) => order.status === status);
    }

    result.sort((a, b) => {
      if (sort === "newest") return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      if (sort === "oldest") return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      if (sort === "amount_desc") return b.amount - a.amount;
      if (sort === "amount_asc") return a.amount - b.amount;
      return 0;
    });

    return result;
  }, [companyData, initialOrders, searchTerm, sort, status]);

  const sectionedOrders = useMemo(
    () =>
      SERVICE_ORDER_BUCKETS.map((bucket) => ({
        ...bucket,
        orders: filteredOrders.filter((order) => getServiceOrderBucket(order.status) === bucket.key),
      })),
    [filteredOrders],
  );

  const clearFilters = () => {
    setSearchTerm("");
    setStatus("all");
    setSort("newest");
  };

  return (
    <div className="space-y-8">
      <div className="animate-in fade-in slide-in-from-top-4 rounded-3xl border border-slate-100 bg-white p-4 shadow-xl shadow-slate-200/50">
        <div className="flex flex-col gap-4 md:flex-row md:items-center">
          <div className="relative w-full md:flex-1">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Szukaj po nazwie firmy lub usługi..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-12 rounded-2xl border-slate-200 bg-slate-50 pl-12 font-medium transition-all focus:border-indigo-300 focus:bg-white focus:ring-2 focus:ring-indigo-100"
            />
          </div>

          <div className="no-scrollbar flex w-full gap-3 overflow-x-auto pb-2 md:w-auto md:pb-0">
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="h-12 w-[210px] rounded-2xl border-slate-200 bg-white font-bold text-slate-700 focus:ring-2 focus:ring-indigo-100">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="h-4 w-4 text-slate-400" />
                  <SelectValue placeholder="Status" />
                </div>
              </SelectTrigger>
              <SelectContent>
                {getServiceOrderStatusOptions().map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={sort} onValueChange={setSort}>
              <SelectTrigger className="h-12 w-[180px] rounded-2xl border-slate-200 bg-white font-bold text-slate-700 focus:ring-2 focus:ring-indigo-100">
                <SelectValue placeholder="Sortowanie" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Najnowsze</SelectItem>
                <SelectItem value="oldest">Najstarsze</SelectItem>
                <SelectItem value="amount_desc">Kwota: najwyższa</SelectItem>
                <SelectItem value="amount_asc">Kwota: najniższa</SelectItem>
              </SelectContent>
            </Select>

            {(status !== "all" || sort !== "newest" || searchTerm) && (
              <Button
                onClick={clearFilters}
                variant="ghost"
                size="icon"
                className="h-12 w-12 shrink-0 rounded-2xl text-slate-400 hover:bg-red-50 hover:text-red-500"
                title="Wyczyść filtry"
              >
                <X className="h-5 w-5" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {filteredOrders.length === 0 ? (
        <div className="py-24 text-center">
          <div className="mx-auto mb-8 flex h-24 w-24 items-center justify-center rounded-[2.5rem] border border-slate-100 bg-slate-50">
            <Sparkles className="h-10 w-10 text-slate-200" />
          </div>
          <h3 className="mb-2 text-2xl font-black text-slate-900">
            {searchTerm || status !== "all" ? "Brak wyników wyszukiwania" : "Pusto tu..."}
          </h3>
          <p className="mx-auto mb-10 max-w-sm font-medium text-slate-500">
            {searchTerm || status !== "all"
              ? "Spróbuj zmienić kryteria wyszukiwania lub zresetuj filtry."
              : "Obecnie nie masz żadnych nowych zapytań ani aktywnych zleceń."}
          </p>
          <Link href="/app/services/my">
            <Button className="gradient-primary h-14 rounded-2xl px-10 font-black text-white shadow-xl shadow-indigo-500/20">
              ZARZĄDZAJ USŁUGAMI
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-10">
          {sectionedOrders.map((section) => {
            if (section.orders.length === 0) {
              return null;
            }

            return (
              <section key={section.key} className="space-y-4">
                <div className="flex flex-col gap-3 rounded-[2rem] border border-slate-100 bg-white p-6 shadow-lg shadow-slate-200/30 md:flex-row md:items-end md:justify-between">
                  <div className="space-y-2">
                    <div className="inline-flex w-fit items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                      <Inbox className="h-3.5 w-3.5" />
                      {section.title}
                    </div>
                    <h2 className="text-2xl font-black text-slate-900">{section.title}</h2>
                    <p className="max-w-3xl text-sm font-medium leading-relaxed text-slate-500">{section.description}</p>
                  </div>
                  <div className="inline-flex h-12 min-w-[88px] items-center justify-center rounded-2xl bg-slate-900 px-4 text-xl font-black text-white">
                    {section.orders.length}
                  </div>
                </div>

                <div className="grid gap-6">
                  {section.orders.map((order: any) => {
                    const statusMeta = getServiceOrderStatusMeta(order.status);
                    const companyName = companyData[order.company_id]?.nazwa || "Firma partnerska";
                    const amountLabel = order.status === "countered" && order.counter_amount ? order.counter_amount : order.amount;

                    return (
                      <Card
                        key={order.id}
                        className="group relative overflow-hidden rounded-[2rem] border-none bg-white shadow-xl shadow-slate-200/50 ring-1 ring-slate-100 transition-all duration-500 hover:shadow-2xl hover:shadow-indigo-500/10"
                      >
                        <CardContent className="p-0">
                          <div className="flex flex-col lg:flex-row">
                            <div className="flex flex-col justify-between gap-6 border-r border-slate-100 bg-slate-50 p-8 transition-colors group-hover:bg-indigo-50/30 lg:w-72">
                              <div className="space-y-4">
                                <span className={`inline-flex rounded-full px-4 py-1.5 text-[10px] font-black uppercase tracking-widest ${statusMeta.badgeClass}`}>
                                  {statusMeta.label}
                                </span>

                                <div className="flex flex-col gap-1">
                                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                    {order.status === "countered" ? "KONTROFERTA FIRMY" : "WYNAGRODZENIE"}
                                  </p>
                                  <div className="flex items-center gap-2 text-2xl font-black tabular-nums text-slate-900">
                                    <Wallet className="h-5 w-5 text-indigo-500" />
                                    {amountLabel}
                                    <span className="text-xs font-bold text-slate-400">PLN</span>
                                  </div>
                                  {order.status === "countered" && typeof order.amount === "number" && order.amount !== order.counter_amount ? (
                                    <p className="text-xs font-medium text-slate-500">Poprzednia propozycja: {order.amount} PLN</p>
                                  ) : null}
                                </div>
                              </div>

                              <div className="space-y-3">
                                <p className="text-sm font-semibold leading-relaxed text-slate-600">{statusMeta.summaryLabel}</p>
                                <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
                                  <Calendar className="h-3.5 w-3.5" />
                                  {format(new Date(order.created_at), "d MMM yyyy", { locale: pl }).toUpperCase()}
                                </div>
                              </div>
                            </div>

                            <div className="flex flex-1 flex-col p-8">
                              <div className="flex-1 space-y-6">
                                <div className="space-y-2">
                                  <p className="mb-1 text-[10px] font-black uppercase tracking-[0.2em] text-indigo-500">WYBRANA USŁUGA</p>
                                  <Link href={`/app/services/dashboard/${order.id}`} className="block">
                                    <h3 className="line-clamp-1 text-2xl font-black text-slate-900 transition-colors group-hover:text-indigo-600">
                                      {order.package?.title || "Usługa archiwalna"}
                                    </h3>
                                  </Link>
                                </div>

                                <div className="flex items-center gap-3">
                                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-400 transition-all group-hover:bg-white group-hover:shadow-md">
                                    <Briefcase className="h-5 w-5" />
                                  </div>
                                  <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">KLIENT</p>
                                    <p className="font-bold text-slate-700">{companyName}</p>
                                  </div>
                                </div>

                                <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-6 transition-all group-hover:border-indigo-100 group-hover:bg-white">
                                  <p className="mb-3 text-[10px] font-black uppercase tracking-widest text-slate-400">WYMAGANIA I OPIS</p>
                                  <p className="line-clamp-2 text-sm font-medium leading-relaxed text-slate-600">
                                    {getOrderPreview(order)}
                                  </p>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center justify-center p-8 lg:border-l lg:border-slate-50">
                              <Link href={`/app/services/dashboard/${order.id}`} className="w-full lg:w-auto">
                                <Button className="group/btn flex h-14 w-full items-center gap-3 rounded-2xl border-none bg-slate-900 px-8 font-black text-white shadow-xl transition-all hover:bg-indigo-600 lg:w-auto">
                                  SZCZEGÓŁY
                                  <ArrowRight className="h-5 w-5 transition-transform group-hover/btn:translate-x-1" />
                                </Button>
                              </Link>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
