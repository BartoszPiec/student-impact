"use client";

import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Search, SlidersHorizontal, X, Inbox, ArrowLeft, Wallet, Calendar, Briefcase, ArrowRight, Sparkles } from "lucide-react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { pl } from "date-fns/locale";
import { useState, useMemo } from "react";

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

        // 1. Search (Title or Company)
        if (searchTerm) {
            const lowerSearch = searchTerm.toLowerCase();
            result = result.filter(order => {
                const title = order.package?.title?.toLowerCase() || "";
                const companyName = companyData[order.company_id]?.nazwa?.toLowerCase() || "";
                return title.includes(lowerSearch) || companyName.includes(lowerSearch);
            });
        }

        // 2. Status
        if (status !== "all") {
            result = result.filter(order => order.status === status);
        }

        // 3. Sort
        result.sort((a, b) => {
            if (sort === "newest") return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
            if (sort === "oldest") return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
            if (sort === "amount_desc") return b.amount - a.amount;
            if (sort === "amount_asc") return a.amount - b.amount;
            return 0;
        });

        return result;
    }, [initialOrders, searchTerm, status, sort, companyData]);

    const clearFilters = () => {
        setSearchTerm("");
        setStatus("all");
        setSort("newest");
    };

    return (
        <div className="space-y-8">
            {/* FILTERS UI */}
            <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50 flex flex-col md:flex-row gap-4 items-center animate-in fade-in slide-in-from-top-4">
                {/* Search */}
                <div className="relative w-full md:flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                    <Input
                        placeholder="Szukaj po nazwie firmy lub usługi..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-12 h-12 rounded-2xl border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300 transition-all font-medium"
                    />
                </div>

                {/* Filters Group */}
                <div className="flex w-full md:w-auto gap-3 overflow-x-auto pb-2 md:pb-0 no-scrollbar">

                    {/* Status Filter */}
                    <Select value={status} onValueChange={setStatus}>
                        <SelectTrigger className="w-[180px] h-12 rounded-2xl border-slate-200 bg-white font-bold text-slate-700 focus:ring-2 focus:ring-indigo-100">
                            <div className="flex items-center gap-2">
                                <SlidersHorizontal className="h-4 w-4 text-slate-400" />
                                <SelectValue placeholder="Status" />
                            </div>
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Wszystkie statusy</SelectItem>
                            <SelectItem value="inquiry">Nowe Zapytania</SelectItem>
                            <SelectItem value="pending">Oczekujące</SelectItem>
                            <SelectItem value="proposal_sent">Oferta Wysłana</SelectItem>
                            <SelectItem value="completed">Zakończone</SelectItem>
                        </SelectContent>
                    </Select>

                    {/* Sort Filter */}
                    <Select value={sort} onValueChange={setSort}>
                        <SelectTrigger className="w-[180px] h-12 rounded-2xl border-slate-200 bg-white font-bold text-slate-700 focus:ring-2 focus:ring-indigo-100">
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
                            className="h-12 w-12 rounded-2xl text-slate-400 hover:text-red-500 hover:bg-red-50 shrink-0"
                            title="Wyczyść filtry"
                        >
                            <X className="h-5 w-5" />
                        </Button>
                    )}
                </div>
            </div>

            {/* RESULTS GRID */}
            <div className="grid gap-6">
                {filteredOrders.map((order: any) => (
                    <Card key={order.id} className="group relative border-none rounded-[2rem] overflow-hidden shadow-xl shadow-slate-200/50 bg-white ring-1 ring-slate-100 hover:shadow-2xl hover:shadow-indigo-500/10 transition-all duration-500 animate-in fade-in zoom-in-95 duration-300">
                        <CardContent className="p-0">
                            <div className="flex flex-col lg:flex-row">
                                {/* Left Section: Status & Highlights */}
                                <div className="p-8 lg:w-64 bg-slate-50 border-r border-slate-100 flex flex-col justify-between gap-6 group-hover:bg-indigo-50/30 transition-colors">
                                    <div className="space-y-4">
                                        <Badge className={`rounded-full px-4 py-1.5 text-[10px] font-black uppercase tracking-widest transition-all ${order.status === 'inquiry' || order.status === 'pending'
                                            ? 'bg-amber-100 text-amber-600 border border-amber-200'
                                            : order.status === 'completed'
                                                ? 'bg-emerald-100 text-emerald-600 border border-emerald-200'
                                                : 'bg-indigo-100 text-indigo-600 border border-indigo-200'
                                            }`}>
                                            {order.status === 'inquiry' ? 'Nowe Zapytanie' :
                                                order.status === 'pending' ? 'Oczekujące' :
                                                    order.status === 'proposal_sent' ? 'Wysłano Ofertę' :
                                                        order.status}
                                        </Badge>

                                        <div className="flex flex-col gap-1">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">WYNAGRODZENIE</p>
                                            <div className="flex items-center gap-2 text-2xl font-black text-slate-900 tabular-nums">
                                                <Wallet className="h-5 w-5 text-indigo-500" /> {order.amount} <span className="text-xs font-bold text-slate-400">PLN</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
                                        <Calendar className="h-3.5 w-3.5" />
                                        {format(new Date(order.created_at), "d MMM yyyy", { locale: pl }).toUpperCase()}
                                    </div>
                                </div>

                                {/* Center Section: Content Preview */}
                                <div className="p-8 flex-1 flex flex-col">
                                    <div className="space-y-6 flex-1">
                                        <div className="space-y-2">
                                            <p className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em] mb-1">WYBRANA USŁUGA</p>
                                            <Link href={`/app/services/dashboard/${order.id}`} className="block">
                                                <h3 className="text-2xl font-black text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1">
                                                    {order.package?.title || "Usługa archiwalna"}
                                                </h3>
                                            </Link>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-white group-hover:shadow-md transition-all">
                                                <Briefcase className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">KLIENT</p>
                                                <p className="font-bold text-slate-700">{companyData[order.company_id]?.nazwa || "Firma Partnerska"}</p>
                                            </div>
                                        </div>

                                        <div className="bg-slate-50/50 p-6 rounded-2xl border border-slate-100 group-hover:border-indigo-100 group-hover:bg-white transition-all">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">WYMAGANIA I OPIS</p>
                                            <p className="text-sm text-slate-600 line-clamp-2 font-medium leading-relaxed italic">
                                                "{order.requirements || "Brak dodatkowych wytycznych..."}"
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Right Section: Navigation */}
                                <div className="p-8 flex items-center justify-center lg:border-l lg:border-slate-50">
                                    <Link href={`/app/services/dashboard/${order.id}`} className="w-full lg:w-auto">
                                        <Button className="w-full group/btn rounded-2xl bg-slate-900 border-none hover:bg-indigo-600 text-white font-black h-14 px-8 shadow-xl transition-all flex items-center gap-3">
                                            SZCZEGÓŁY <ArrowRight className="h-5 w-5 transition-transform group-hover/btn:translate-x-1" />
                                        </Button>
                                    </Link>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}

                {(!filteredOrders || filteredOrders.length === 0) && (
                    <div className="py-24 text-center">
                        <div className="w-24 h-24 bg-slate-50 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 border border-slate-100">
                            <Sparkles className="h-10 w-10 text-slate-200" />
                        </div>
                        <h3 className="text-2xl font-black text-slate-900 mb-2">
                            {searchTerm || status !== 'all' ? "Brak wyników wyszukiwania" : "Pusto tu..."}
                        </h3>
                        <p className="text-slate-500 font-medium max-w-sm mx-auto mb-10">
                            {searchTerm || status !== 'all' ? "Spróbuj zmienić kryteria wyszukiwania lub zresetuj filtry." :
                                "Obecnie nie masz żadnych nowych zapytań ani aktywnych zleceń."}
                        </p>
                        <Link href="/app/services/my">
                            <Button className="rounded-2xl gradient-primary text-white font-black h-14 px-10 shadow-xl shadow-indigo-500/20">
                                ZARZĄDZAJ USŁUGAMI
                            </Button>
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}
