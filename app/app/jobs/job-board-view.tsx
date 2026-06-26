"use client";

import Link from "next/link";
import { useDeferredValue, useState, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, X, CheckCircle2, Briefcase, Zap } from "lucide-react";
import { JobCard, JobOffer } from "./job-card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetClose, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const POPULAR_CITIES = ["Warszawa", "Kraków", "Wrocław", "Poznań", "Gdańsk", "Łódź", "Katowice", "Lublin", "Bydgoszcz", "Szczecin"];
const POPULAR_CATEGORIES = ["IT / Programowanie", "Grafika & Design", "Marketing & Social Media", "Copywriting", "Wideo & Animacja", "Tłumaczenia", "Administracja"];
const POPULAR_CONTRACTS = ["Umowa o pracę", "B2B", "Umowa zlecenie", "Umowa o dzieło", "Praktyki"];
const JOBS_PAGE_SIZE = 24;

function normalizeSearchText(value: unknown) {
    return String(value ?? "").toLocaleLowerCase("pl-PL").trim();
}

function isJobOffer(offer: Pick<JobOffer, "typ">) {
    const type = normalizeSearchText(offer.typ);
    return type.includes("job") || type.includes("praca") || type.includes("staż") || type.includes("staż");
}

function getOfferAmount(offer: JobOffer) {
    const value = offer.salary_range_min ?? offer.stawka ?? 0;
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : 0;
}

export function JobBoardView({
    initialOffers,
    initialCompanyId,
    appliedOfferIds,
    totalOffersCount,
    currentPage = 1,
}: {
    initialOffers: JobOffer[],
    initialCompanyId?: string,
    appliedOfferIds?: Set<string>,
    totalOffersCount?: number,
    currentPage?: number,
}) {
    const searchParams = useSearchParams();
    const companyIdFromUrl = searchParams.get("companyId");

    const offers = initialOffers;
    const [mode, setMode] = useState<"job" | "micro">("micro");
    const [subFilter, setSubFilter] = useState<"all" | "platform" | "regular">("all");
    const [search, setSearch] = useState("");
    const deferredSearch = useDeferredValue(search);

    const [locationFilter, setLocationFilter] = useState("");
    const [techFilters, setTechFilters] = useState<string[]>([]);
    const [contractFilters, setContractFilters] = useState<string[]>([]);
    const [categoryFilter, setCategoryFilter] = useState<string[]>([]);
    const [salaryMin, setSalaryMin] = useState<number | "">("");
    const [salaryMax, setSalaryMax] = useState<number | "">("");

    const [budgetMin, setBudgetMin] = useState<number | "">("");
    const [budgetMax, setBudgetMax] = useState<number | "">("");

    const [showApplied, setShowApplied] = useState(false);

    const [companyIdFilter, setCompanyIdFilter] = useState(initialCompanyId || companyIdFromUrl || "");
    const nextPageHref = useMemo(() => {
        const params = new URLSearchParams(searchParams.toString());
        params.set("page", String(currentPage + 1));
        const query = params.toString();
        return query ? `/app/jobs?${query}` : "/app/jobs";
    }, [currentPage, searchParams]);
    const previousPageHref = useMemo(() => {
        const params = new URLSearchParams(searchParams.toString());
        const previousPage = Math.max(1, currentPage - 1);
        if (previousPage === 1) params.delete("page");
        else params.set("page", String(previousPage));
        const query = params.toString();
        return query ? `/app/jobs?${query}` : "/app/jobs";
    }, [currentPage, searchParams]);
    const hasMoreServerOffers = typeof totalOffersCount === "number"
        && currentPage * JOBS_PAGE_SIZE < totalOffersCount;
    const activeFilterCount =
        Number(search.trim().length > 0) +
        Number(Boolean(locationFilter)) +
        categoryFilter.length +
        contractFilters.length +
        techFilters.length +
        Number(Boolean(salaryMin)) +
        Number(Boolean(salaryMax)) +
        Number(Boolean(budgetMin)) +
        Number(Boolean(budgetMax)) +
        Number(showApplied) +
        Number(mode === "micro" && subFilter !== "all");

    const { locations, contracts, categories } = useMemo(() => {
        const locs = new Set<string>(POPULAR_CITIES);
        const conts = new Set<string>(POPULAR_CONTRACTS);
        const cats = new Set<string>(POPULAR_CATEGORIES);

        offers.forEach(o => {
            const isJob = isJobOffer(o);
            const matchesMode = mode === "job" ? isJob : !isJob;

            if (matchesMode) {
                if (o.location) locs.add(o.location);
                if (o.is_remote) locs.add("Remote");
                if (o.contract_type) conts.add(o.contract_type);
                if (o.category) cats.add(o.category);
            }
        });

        return {
            locations: Array.from(locs).sort(),
            contracts: Array.from(conts).sort(),
            categories: Array.from(cats).sort()
        };
    }, [offers, mode]);

    const filtered = useMemo(() => {
        const normalizedSearch = normalizeSearchText(deferredSearch);

        return offers.filter(o => {
            if (companyIdFilter && o.company_id !== companyIdFilter) return false;

            if (!showApplied && appliedOfferIds?.has(o.id)) return false;

            const isJob = isJobOffer(o);

            if (!companyIdFilter) {
                if (mode === "job" && !isJob) return false;
                if (mode === "micro" && isJob) return false;
            }

            if (mode === "micro" && !companyIdFilter) {
                const isPlatform = !!o.is_platform_service;

                if (subFilter === "platform" && !isPlatform) return false;
                if (subFilter === "regular" && isPlatform) return false;
            }

            if (normalizedSearch) {
                const searchable = [
                    o.tytul,
                    o.company_name,
                    o.category,
                    o.location,
                    o.typ,
                    o.contract_type,
                    o.opis,
                    o.obligations,
                    ...(o.technologies ?? []),
                ]
                    .map(normalizeSearchText)
                    .join(" ");

                if (!searchable.includes(normalizedSearch)) return false;
            }

            if (mode === "job") {
                if (locationFilter) {
                    if (locationFilter === "Remote") {
                        if (!o.is_remote) return false;
                    } else if (o.location !== locationFilter && !normalizeSearchText(o.location).includes(normalizeSearchText(locationFilter))) {
                        return false;
                    }
                }
                if (categoryFilter.length > 0) {
                    if (!o.category || !categoryFilter.includes(o.category)) return false;
                }
                if (techFilters.length > 0) {
                    const hasTech = o.technologies?.some(t => techFilters.includes(t));
                    if (!hasTech) return false;
                }
                if (contractFilters.length > 0) {
                    if (!o.contract_type || !contractFilters.includes(o.contract_type)) return false;
                }
                const oMsgMin = o.salary_range_min || 0;
                const oMsgMax = o.salary_range_max || oMsgMin;

                if (salaryMin !== "") {
                    if (oMsgMax < Number(salaryMin)) return false;
                }
                if (salaryMax !== "") {
                    if (oMsgMin > Number(salaryMax)) return false;
                }
            } else {
                if (locationFilter) {
                    if (locationFilter === "Remote") {
                        if (!o.is_remote) return false;
                    } else if (o.location !== locationFilter && !normalizeSearchText(o.location).includes(normalizeSearchText(locationFilter))) {
                        return false;
                    }
                }
                if (categoryFilter.length > 0) {
                    if (!o.category || !categoryFilter.includes(o.category)) return false;
                }
                const rate = getOfferAmount(o);
                if (budgetMin !== "" && rate < Number(budgetMin)) return false;
                if (budgetMax !== "" && rate > Number(budgetMax)) return false;
            }

            return true;
        });
    }, [offers, mode, deferredSearch, locationFilter, techFilters, contractFilters, categoryFilter, salaryMin, salaryMax, budgetMin, budgetMax, subFilter, companyIdFilter, showApplied, appliedOfferIds]);

    const toggleContract = (c: string) => setContractFilters(prev => prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c]);
    const toggleCategory = (c: string) => setCategoryFilter(prev => prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c]);

    const clearFilters = () => {
        setSearch("");
        setLocationFilter("");
        setTechFilters([]);
        setContractFilters([]);
        setCategoryFilter([]);
        setSalaryMin("");
        setSalaryMax("");
        setBudgetMin("");
        setBudgetMax("");
        setSubFilter("all");
    };

    const handleLocationChange = (value: string) => {
        setLocationFilter(value === "all_locations" ? "" : value);
    };



    return (
        <div className="flex flex-col gap-4 sm:gap-5">

            <div className="-mt-24 space-y-4 lg:hidden">
                <div className="rounded-2xl border border-white/15 bg-[#233a78] p-3 shadow-sm">
                    <div className="hidden">
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-normal text-slate-400">
                                Wyszukiwarka ofert
                            </p>
                            <h2 className="mt-1 text-lg font-black leading-tight text-slate-900">
                                {mode === "micro" ? "Znajdź mikrozlecenie" : "Znajdź pracę lub staż"}
                            </h2>
                        </div>
                        <Badge
                            className={cn(
                                "shrink-0 rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-normal",
                                mode === "micro"
                                    ? "border-lime-200 bg-lime-100 text-[#0b1b47]"
                                    : "border-indigo-100 bg-indigo-50 text-indigo-700",
                            )}
                        >
                            {filtered.length} ofert
                        </Badge>
                    </div>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-indigo-100/80" />
                        <Input
                            placeholder="Czego dziś szukasz?"
                            className="h-11 rounded-xl border-white/15 bg-white/10 pl-10 font-semibold text-white shadow-inner placeholder:text-indigo-100/80 focus:border-white/30 focus:bg-white/15"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-2">
                    <button
                        type="button"
                        onClick={() => setMode("micro")}
                        className={cn(
                            "flex min-h-14 items-center justify-start gap-3 rounded-2xl border px-3 text-sm font-black transition-all",
                            mode === "micro"
                                ? "border-lime-200 bg-lime-100 text-[#0b1b47] shadow-sm"
                                : "border-slate-200 bg-white text-slate-600",
                        )}
                    >
                        <Zap className="h-4 w-4" />
                        Mikro
                    </button>
                    <button
                        type="button"
                        onClick={() => setMode("job")}
                        className={cn(
                            "flex min-h-14 items-center justify-start gap-3 rounded-2xl border px-3 text-sm font-black transition-all",
                            mode === "job"
                                ? "border-lime-200 bg-lime-100 text-[#0b1b47] shadow-sm"
                                : "border-slate-200 bg-white text-slate-600",
                        )}
                    >
                        <Briefcase className="h-4 w-4" />
                        Praca
                    </button>
                </div>

                <Sheet>
                    <SheetTrigger asChild>
                        <Button variant="outline" className="h-11 w-full justify-between rounded-full border-slate-200 bg-white px-4 font-black shadow-sm">
                            <span className="inline-flex items-center gap-2">
                                <Filter className="h-4 w-4" />
                                Filtry
                            </span>
                            <span className="text-xs font-bold text-slate-400">
                                {activeFilterCount > 0 ? `${activeFilterCount} aktywne` : "Pokaż wszystkie"}
                            </span>
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="bottom" className="max-h-[86dvh] rounded-t-[2rem] border-none p-0">
                        <div className="mx-auto mt-3 h-1.5 w-12 rounded-full bg-slate-200" />
                        <div className="max-h-[calc(86dvh-1rem)] space-y-6 overflow-y-auto bg-white p-5 pb-[calc(env(safe-area-inset-bottom)+1.5rem)] sm:space-y-8 sm:p-8">
                            <SheetHeader className="mb-4 text-left sm:mb-8">
                                <SheetTitle className="text-xl font-extrabold text-[#1a1a2e] sm:text-2xl">Filtruj oferty</SheetTitle>
                            </SheetHeader>
                            <div className="space-y-8">
                                <div className="space-y-3">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Szukaj</label>
                                    <Input
                                        placeholder="Wpisz frazę..."
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        className="h-12 bg-slate-50 border-slate-200 focus:border-indigo-500 rounded-xl"
                                    />
                                </div>

                                <div className="space-y-3">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Lokalizacja</label>
                                    <Select value={locationFilter || "all_locations"} onValueChange={handleLocationChange}>
                                        <SelectTrigger className="h-12 bg-slate-50 border-slate-200 rounded-xl"><SelectValue placeholder="Wybierz" /></SelectTrigger>
                                        <SelectContent className="bg-white z-50 rounded-xl border-slate-100 shadow-2xl">
                                            <SelectItem value="all_locations">Cała Polska</SelectItem>
                                            {locations.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {mode === "micro" && (
                                    <div className="space-y-3">
                                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Rodzaj zlecenia</label>
                                        <div className="grid grid-cols-3 gap-2 rounded-2xl border border-slate-200 bg-slate-100/80 p-1.5">
                                            {[
                                                { id: "all", label: "Wszystkie" },
                                                { id: "platform", label: "Systemowe" },
                                                { id: "regular", label: "Firmy" },
                                            ].map((tab) => (
                                                <button
                                                    key={tab.id}
                                                    type="button"
                                                    onClick={() => setSubFilter(tab.id as "all" | "platform" | "regular")}
                                                    className={cn(
                                                        "min-h-10 rounded-xl px-2 text-[11px] font-black transition-all",
                                                        subFilter === tab.id
                                                            ? "bg-white text-amber-700 shadow-sm ring-1 ring-amber-100"
                                                            : "text-slate-500",
                                                    )}
                                                >
                                                    {tab.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {mode === "job" ? (
                                    <>
                                        <div className="space-y-4">
                                            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Rodzaj umowy</label>
                                            <div className="grid grid-cols-1 gap-3">
                                                {contracts.map(c => (
                                                    <div key={c} className="flex items-center space-x-3 p-3 rounded-xl border border-slate-100 hover:bg-slate-50 transition-colors">
                                                        <Checkbox id={`m-contr-${c}`} checked={contractFilters.includes(c)} onCheckedChange={() => toggleContract(c)} />
                                                        <Label htmlFor={`m-contr-${c}`} className="text-sm font-medium text-slate-700 flex-1 cursor-pointer">{c}</Label>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="space-y-4">
                                            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Płaca (min-max)</label>
                                            <div className="flex gap-3">
                                                <Input type="number" placeholder="Min" value={salaryMin} onChange={e => setSalaryMin(e.target.value ? Number(e.target.value) : "")} className="h-12 bg-slate-50 border-slate-200 rounded-xl" />
                                                <Input type="number" placeholder="Max" value={salaryMax} onChange={e => setSalaryMax(e.target.value ? Number(e.target.value) : "")} className="h-12 bg-slate-50 border-slate-200 rounded-xl" />
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <div className="space-y-4">
                                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Budżet (min-max)</label>
                                        <div className="flex gap-3">
                                            <Input type="number" placeholder="Min" value={budgetMin} onChange={e => setBudgetMin(e.target.value ? Number(e.target.value) : "")} className="h-12 bg-slate-50 border-slate-200 rounded-xl" />
                                            <Input type="number" placeholder="Max" value={budgetMax} onChange={e => setBudgetMax(e.target.value ? Number(e.target.value) : "")} className="h-12 bg-slate-50 border-slate-200 rounded-xl" />
                                        </div>
                                    </div>
                                )}

                                {categories.length > 0 && (
                                    <div className="space-y-4">
                                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Kategorie</label>
                                        <div className="grid grid-cols-1 gap-3">
                                            {categories.map(c => (
                                                <div key={c} className="flex items-center space-x-3 rounded-xl border border-slate-100 p-3 transition-colors hover:bg-slate-50">
                                                    <Checkbox id={`m-cat-${c}`} checked={categoryFilter.includes(c)} onCheckedChange={() => toggleCategory(c)} />
                                                    <Label htmlFor={`m-cat-${c}`} className="flex-1 cursor-pointer text-sm font-medium text-slate-700">{c}</Label>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className="flex items-center space-x-3 rounded-xl border border-slate-100 p-3">
                                    <Checkbox
                                        id="show-applied-mobile"
                                        checked={showApplied}
                                        onCheckedChange={(checked) => setShowApplied(checked === true)}
                                    />
                                    <Label htmlFor="show-applied-mobile" className="flex-1 cursor-pointer text-sm font-bold text-slate-700">
                                        Pokaż oferty, na które już aplikowałem
                                    </Label>
                                </div>

                                <div className="sticky bottom-0 -mx-5 grid grid-cols-2 gap-3 border-t border-slate-100 bg-white/95 p-5 backdrop-blur-xl sm:-mx-8 sm:px-8">
                                    <Button onClick={clearFilters} variant="ghost" className="h-11 text-slate-400 hover:text-slate-900 font-bold">Wyczyść</Button>
                                    <SheetClose asChild>
                                        <Button className="h-11 rounded-xl bg-slate-900 font-bold text-white hover:bg-slate-800">
                                            Zastosuj
                                        </Button>
                                    </SheetClose>
                                </div>
                            </div>
                        </div>
                    </SheetContent>
                </Sheet>
            </div>

            <div className="hidden grid-cols-1 gap-4 lg:grid lg:grid-cols-2">
                <div
                    onClick={() => setMode("micro")}
                    className={cn(
                        "group relative flex cursor-pointer items-center gap-4 overflow-hidden rounded-2xl border p-4 transition-all duration-300",
                        mode === "micro"
                            ? "border-lime-200 bg-lime-100 shadow-sm"
                            : "border-slate-200 bg-white hover:border-lime-200 hover:shadow-sm"
                    )}
                >
                    <div className="flex items-start justify-between">
                        <div className={cn(
                            "flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-300",
                            mode === "micro" ? "bg-lime-300 text-[#0b1b47]" : "bg-slate-50 text-[#0b1b47]"
                        )}>
                            <Zap className="h-5 w-5 fill-current" />
                        </div>
                    </div>
                    <div>
                        <h3 className={cn("mb-1 text-base font-extrabold", mode === "micro" ? "text-[#0b1b47]" : "text-slate-900")}>
                            Mikrozlecenia
                        </h3>
                        <p className="text-xs font-semibold leading-5 text-slate-500">
                            Szybkie zadania z konkretną wyceną, płatne od ręki po realizacji.
                        </p>
                    </div>
                </div>

                <div
                    onClick={() => setMode("job")}
                    className={cn(
                        "group relative flex cursor-pointer items-center gap-4 overflow-hidden rounded-2xl border p-4 transition-all duration-300",
                        mode === "job"
                            ? "border-lime-200 bg-lime-100 shadow-sm"
                            : "border-slate-200 bg-white hover:border-lime-200 hover:shadow-sm"
                    )}
                >
                    <div className="flex items-start justify-between">
                        <div className={cn(
                            "flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-300",
                            mode === "job" ? "bg-lime-300 text-[#0b1b47]" : "bg-slate-50 text-[#0b1b47]"
                        )}>
                            <Briefcase className="h-5 w-5" />
                        </div>
                    </div>
                    <div>
                        <h3 className={cn("mb-1 text-base font-extrabold", mode === "job" ? "text-[#0b1b47]" : "text-slate-900")}>
                            Praca i Staże
                        </h3>
                        <p className="text-xs font-semibold leading-5 text-slate-500">
                            Długofalowa współpraca, rozwój kompetencji i pewna ścieżka zawodowa.
                        </p>
                    </div>
                </div>
            </div>

            <div className="flex flex-col items-start gap-4 lg:flex-row lg:gap-6">

                <div className="sticky top-20 hidden w-72 flex-shrink-0 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:block">
                    <div className="animate-in space-y-6 fade-in slide-in-from-left-4 duration-500">
                        <div className="space-y-3">
                            <label className="text-xs font-bold uppercase tracking-normal text-slate-400">Szukaj</label>
                            <div className="relative group">
                                <Search className="absolute left-3 top-3.5 h-5 w-5 text-slate-300 group-focus-within:text-indigo-500 transition-colors" />
                                <Input
                                    placeholder={mode === "job" ? "Stanowisko, firma..." : "Czego szukasz?"}
                                    className="h-11 rounded-xl border-slate-200 bg-slate-50 pl-10 transition-all focus:border-indigo-500 focus:bg-white"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <label className="text-xs font-bold uppercase tracking-normal text-slate-400">Lokalizacja</label>
                                {locationFilter && <span className="text-[10px] font-bold text-red-500 cursor-pointer hover:underline" onClick={() => setLocationFilter("")}>WYCZYŚĆ</span>}
                            </div>
                            <Select value={locationFilter || "all_locations"} onValueChange={handleLocationChange}>
                                <SelectTrigger className="h-11 rounded-xl border-slate-200 bg-slate-50 transition-all">
                                    <SelectValue placeholder="Wybierz miasto" />
                                </SelectTrigger>
                                <SelectContent className="rounded-2xl border-slate-100 shadow-2xl">
                                    <SelectItem value="all_locations">Cała Polska</SelectItem>
                                    {locations.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>

                        {mode === "micro" && (
                            <div className="space-y-3 animate-in zoom-in-95 duration-300">
                                <label className="text-xs font-bold uppercase tracking-normal text-slate-400">Rodzaj zlecenia</label>
                                <Tabs value={subFilter} onValueChange={(value) => setSubFilter(value as "all" | "platform" | "regular")} className="w-full">
                                    <TabsList className="grid w-full grid-cols-1 gap-2 bg-transparent h-auto p-0">
                                        {[
                                            { id: 'all', label: 'Wszystkie' },
                                            { id: 'platform', label: '🛡️ Systemowe' },
                                            { id: 'regular', label: '🏢 Zlecenia firm' }
                                        ].map(tab => (
                                            <TabsTrigger
                                                key={tab.id}
                                                value={tab.id}
                                                className="justify-start rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold transition-all data-[state=active]:border-lime-200 data-[state=active]:bg-lime-100 data-[state=active]:text-[#0b1b47]"
                                            >
                                                {tab.label}
                                            </TabsTrigger>
                                        ))}
                                    </TabsList>
                                </Tabs>
                            </div>
                        )}

                        {categories.length > 0 && (
                            <div className="space-y-4">
                                <label className="text-xs font-bold uppercase tracking-normal text-slate-400">Kategorie</label>
                                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                    {categories.map(c => (
                                        <div key={c} className="flex items-center space-x-3 group cursor-pointer" onClick={() => toggleCategory(c)}>
                                            <div className={cn(
                                                "w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all",
                                                categoryFilter.includes(c) ? "border-[#10245f] bg-[#10245f] shadow-sm" : "border-slate-200 bg-white group-hover:border-[#10245f]"
                                            )}>
                                                {categoryFilter.includes(c) && <CheckCircle2 className="h-3 w-3 text-white" />}
                                            </div>
                                            <span className={cn("text-sm font-medium transition-colors", categoryFilter.includes(c) ? "text-indigo-900" : "text-slate-600 group-hover:text-indigo-600")}>{c}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="space-y-4">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Budżet / Płaca</label>
                            <div className="flex items-center gap-3">
                                <Input
                                    type="number"
                                    placeholder="Od"
                                    value={mode === "job" ? salaryMin : budgetMin}
                                    onChange={(e) => {
                                        const val = e.target.value ? Number(e.target.value) : "";
                                        if (mode === "job") {
                                            setSalaryMin(val);
                                        } else {
                                            setBudgetMin(val);
                                        }
                                    }}
                                    className="h-11 bg-white border-slate-200 rounded-xl"
                                />
                                <Input
                                    type="number"
                                    placeholder="Do"
                                    value={mode === "job" ? salaryMax : budgetMax}
                                    onChange={(e) => {
                                        const val = e.target.value ? Number(e.target.value) : "";
                                        if (mode === "job") {
                                            setSalaryMax(val);
                                        } else {
                                            setBudgetMax(val);
                                        }
                                    }}
                                    className="h-11 bg-white border-slate-200 rounded-xl"
                                />
                            </div>
                        </div>

                        <div className="flex flex-col gap-4 border-t border-slate-100 pt-5">
                            <div className="flex items-center space-x-3 cursor-pointer group" onClick={() => setShowApplied(!showApplied)}>
                                <Checkbox
                                    id="show-applied-desktop"
                                    checked={showApplied}
                                    onCheckedChange={(c) => setShowApplied(c === true)}
                                    className="rounded-md"
                                />
                                <Label htmlFor="show-applied-desktop" className="cursor-pointer text-xs font-bold uppercase tracking-normal text-slate-500 transition-colors group-hover:text-indigo-600">
                                    Pokaż aplikowane
                                </Label>
                            </div>

                            <Button variant="outline" className="w-full rounded-xl border-slate-200 text-slate-500 font-bold hover:bg-slate-50 hover:text-slate-900 shadow-sm" onClick={clearFilters}>
                                <X className="mr-2 h-4 w-4" /> Wyczyść filtry
                            </Button>
                        </div>
                    </div>
                </div>

                <div className="w-full flex-1 space-y-4">
                    <div className="flex flex-col items-stretch justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:flex-row sm:items-center">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
                            <div className={cn(
                                "flex h-9 items-center rounded-full px-4 text-sm font-extrabold shadow-sm",
                                mode === "job" ? "bg-lime-300 text-[#0b1b47]" : "bg-lime-300 text-[#0b1b47]"
                            )}>
                                {mode === "job" ? "💼 Praca & Staże" : "⚡ Mikrozlecenia"}
                            </div>
                            <div className="text-sm font-bold text-slate-500">
                                Odkryto <span className="text-slate-900 font-extrabold">{filtered.length}</span> ofert
                            </div>
                        </div>
                        <div className="hidden sm:flex items-center gap-2">
                            {companyIdFilter && (
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => setCompanyIdFilter("")}
                                    className="text-xs font-bold text-red-500 hover:text-red-600 hover:bg-red-50 rounded-xl"
                                >
                                    WYCZYŚĆ FILTR FIRMY <X className="h-3 w-3 ml-1" />
                                </Button>
                            )}
                            <div className="h-6 w-px bg-slate-200 mx-2" />
                            <span className="text-xs font-bold text-slate-400 tracking-widest uppercase">Sortowanie: Najnowsze</span>
                        </div>
                    </div>

                    {filtered.length === 0 ? (
                        <div className="rounded-[3rem] border-2 border-dashed border-slate-200 bg-slate-50/30 px-4 py-16 text-center sm:py-24">
                            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl border border-slate-100 animate-bounce cursor-default">
                                <Search className="h-10 w-10 text-slate-300" />
                            </div>
                            <h3 className="mb-2 text-xl font-extrabold text-slate-900 sm:text-2xl">
                                Nic nie znaleźliśmy...
                            </h3>
                            <p className="text-slate-500 max-w-sm mx-auto mb-8 font-medium">
                                Spróbuj zmienić parametry wyszukiwania lub zresetuj wszystkie filtry, aby zobaczyć całą listę.
                            </p>
                            <Button onClick={clearFilters} className="gradient-primary text-white font-bold px-8 h-12 rounded-2xl shadow-lg">
                                Resetuj filtre
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-5 pb-16 sm:space-y-8 sm:pb-20">
                            <div className="grid grid-cols-1 gap-3 sm:gap-6">
                                {filtered.map((offer, idx) => (
                                    <div key={offer.id} className="animate-in fade-in slide-in-from-bottom-4 duration-500" style={{ animationDelay: `${idx * 50}ms` }}>
                                        <JobCard
                                            offer={offer}
                                            isApplied={appliedOfferIds?.has(offer.id)}
                                        />
                                    </div>
                                ))}
                            </div>

                            {(currentPage > 1 || hasMoreServerOffers) && (
                                <div className="flex flex-col items-center gap-3 rounded-[2rem] border border-slate-200 bg-white px-6 py-8 text-center shadow-sm">
                                    <p className="text-sm font-semibold text-slate-500">
                                        Strona <span className="font-extrabold text-slate-900">{currentPage}</span>. Łącznie{" "}
                                        <span className="font-extrabold text-slate-900">{totalOffersCount}</span> ofert.
                                    </p>
                                    <div className="flex flex-wrap justify-center gap-3">
                                        {currentPage > 1 ? (
                                            <Button asChild variant="outline" className="h-12 rounded-2xl px-6 font-bold">
                                                <Link href={previousPageHref}>Poprzednia strona</Link>
                                            </Button>
                                        ) : null}
                                        {hasMoreServerOffers ? (
                                            <Button asChild className="h-12 rounded-2xl bg-slate-900 px-6 font-bold text-white hover:bg-slate-800">
                                                <Link href={nextPageHref}>Następna strona</Link>
                                            </Button>
                                        ) : null}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
