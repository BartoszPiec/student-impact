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

    // State
    const [offers] = useState<JobOffer[]>(initialOffers);
    const [mode, setMode] = useState<"job" | "micro">("micro"); // Default to micro
    const [subFilter, setSubFilter] = useState<"all" | "platform" | "regular">("all"); // Systemowe vs Zwykłe
    const [search, setSearch] = useState("");
    const deferredSearch = useDeferredValue(search);

    // Filters - Job
    const [locationFilter, setLocationFilter] = useState("");
    const [techFilters, setTechFilters] = useState<string[]>([]);
    const [contractFilters, setContractFilters] = useState<string[]>([]);
    const [categoryFilter, setCategoryFilter] = useState<string[]>([]);
    const [salaryMin, setSalaryMin] = useState<number | "">("");
    const [salaryMax, setSalaryMax] = useState<number | "">(""); // Added Max for Jobs

    // Filters - Micro
    const [budgetMin, setBudgetMin] = useState<number | "">("");
    const [budgetMax, setBudgetMax] = useState<number | "">(""); // Added Max

    const [showApplied, setShowApplied] = useState(false); // New Filter: Show Applied

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

    // Data Extraction based on ACTIVE MODE offers
    const { locations, contracts, categories } = useMemo(() => {
        const locs = new Set<string>(POPULAR_CITIES);
        const conts = new Set<string>(POPULAR_CONTRACTS);
        const cats = new Set<string>(POPULAR_CATEGORIES);

        offers.forEach(o => {
            // Only aggregate data relevant to the current mode? 
            // Actually, better to show all available options or just relevant ones. 
            // Let's filter by mode first for metadata to keep filters clean.
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

    // Derived State: Filtered Offers
    const filtered = useMemo(() => {
        return offers.filter(o => {
            // 0. Company Filter (Strict)
            if (companyIdFilter && o.company_id !== companyIdFilter) return false;

            // 0.5 Applied Filter (New)
            if (!showApplied && appliedOfferIds?.has(o.id)) return false;

            const isJob = isJobOffer(o);

            // 1. Mode Filter
            if (!companyIdFilter) {
                if (mode === "job" && !isJob) return false;
                if (mode === "micro" && isJob) return false;
            }

            // 1.5 Subfilter (Micro only)
            if (mode === "micro" && !companyIdFilter) {
                // Treat null/undefined as false (regular offer)
                const isPlatform = !!o.is_platform_service;

                if (subFilter === "platform" && !isPlatform) return false;
                if (subFilter === "regular" && isPlatform) return false;
            }

            // ... (rest common)
            // 2. Search
            const s = normalizeSearchText(deferredSearch);
            if (s) {
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

                if (!searchable.includes(s)) return false;
            }

            // 3. Specific Filters
            if (mode === "job") {
                // ... same logic
                // Location
                if (locationFilter) {
                    if (locationFilter === "Remote") {
                        if (!o.is_remote) return false;
                    } else if (o.location !== locationFilter && !normalizeSearchText(o.location).includes(normalizeSearchText(locationFilter))) {
                        return false;
                    }
                }
                // Category
                if (categoryFilter.length > 0) {
                    if (!o.category || !categoryFilter.includes(o.category)) return false;
                }
                // Tech
                if (techFilters.length > 0) {
                    const hasTech = o.technologies?.some(t => techFilters.includes(t));
                    if (!hasTech) return false;
                }
                // Contract
                if (contractFilters.length > 0) {
                    if (!o.contract_type || !contractFilters.includes(o.contract_type)) return false;
                }
                // Salary
                const oMsgMin = o.salary_range_min || 0;
                const oMsgMax = o.salary_range_max || oMsgMin;

                if (salaryMin !== "") {
                    if (oMsgMax < Number(salaryMin)) return false;
                }
                if (salaryMax !== "") {
                    if (oMsgMin > Number(salaryMax)) return false;
                }
            } else {
                // Micro Mode Filters
                // Location
                if (locationFilter) {
                    if (locationFilter === "Remote") {
                        if (!o.is_remote) return false;
                    } else if (o.location !== locationFilter && !normalizeSearchText(o.location).includes(normalizeSearchText(locationFilter))) {
                        return false;
                    }
                }
                // Category
                if (categoryFilter.length > 0) {
                    if (!o.category || !categoryFilter.includes(o.category)) return false;
                }
                // Budget
                const rate = getOfferAmount(o);
                if (budgetMin !== "" && rate < Number(budgetMin)) return false;
                if (budgetMax !== "" && rate > Number(budgetMax)) return false;
            }

            return true;
        });
    }, [offers, mode, deferredSearch, locationFilter, techFilters, contractFilters, categoryFilter, salaryMin, salaryMax, budgetMin, budgetMax, subFilter, companyIdFilter, showApplied, appliedOfferIds]);

    // Handlers
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
        <div className="flex flex-col gap-6 sm:gap-10">

            {/* Mobile discovery controls */}
            <div className="space-y-4 lg:hidden">
                <div className="rounded-[1.75rem] border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="mb-3 flex items-center justify-between gap-3">
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                                Wyszukiwarka ofert
                            </p>
                            <h2 className="mt-1 text-xl font-black leading-tight text-slate-900">
                                {mode === "micro" ? "Znajdź mikrozlecenie" : "Znajdź pracę lub staż"}
                            </h2>
                        </div>
                        <Badge
                            className={cn(
                                "shrink-0 rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-wider",
                                mode === "micro"
                                    ? "border-amber-100 bg-amber-50 text-amber-700"
                                    : "border-indigo-100 bg-indigo-50 text-indigo-700",
                            )}
                        >
                            {filtered.length} ofert
                        </Badge>
                    </div>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <Input
                            placeholder={mode === "micro" ? "Szukaj po zadaniu, kategorii lub firmie" : "Szukaj po stanowisku, firmie lub technologii"}
                            className="h-12 rounded-2xl border-slate-200 bg-slate-50 pl-10 font-semibold shadow-inner focus:border-indigo-300 focus:bg-white"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-2 rounded-[1.5rem] border border-slate-200 bg-slate-100/80 p-1.5 shadow-inner">
                    <button
                        type="button"
                        onClick={() => setMode("micro")}
                        className={cn(
                            "flex min-h-12 items-center justify-center gap-2 rounded-2xl px-3 text-sm font-black transition-all",
                            mode === "micro"
                                ? "bg-white text-amber-700 shadow-sm ring-1 ring-amber-100"
                                : "text-slate-500",
                        )}
                    >
                        <Zap className="h-4 w-4" />
                        Mikro
                    </button>
                    <button
                        type="button"
                        onClick={() => setMode("job")}
                        className={cn(
                            "flex min-h-12 items-center justify-center gap-2 rounded-2xl px-3 text-sm font-black transition-all",
                            mode === "job"
                                ? "bg-white text-indigo-700 shadow-sm ring-1 ring-indigo-100"
                                : "text-slate-500",
                        )}
                    >
                        <Briefcase className="h-4 w-4" />
                        Praca
                    </button>
                </div>

                <Sheet>
                    <SheetTrigger asChild>
                        <Button variant="outline" className="h-12 w-full justify-between rounded-2xl border-slate-200 bg-white px-4 font-black shadow-sm">
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
                            {/* ... Content adapted below ... */}
                            <div className="space-y-8">
                                {/* Search */}
                                <div className="space-y-3">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Szukaj</label>
                                    <Input
                                        placeholder="Wpisz frazę..."
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        className="h-12 bg-slate-50 border-slate-200 focus:border-indigo-500 rounded-xl"
                                    />
                                </div>

                                {/* Location */}
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

                                {/* Mode Specific */}
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

            {/* MODE SWITCHER - Premium Cards */}
            <div className="hidden grid-cols-1 gap-4 lg:grid lg:grid-cols-2 lg:gap-6">
                <div
                    onClick={() => setMode("micro")}
                    className={cn(
                        "cursor-pointer group relative overflow-hidden rounded-[2rem] border-2 transition-all duration-300 p-5 sm:p-6 flex flex-col gap-5 sm:gap-6",
                        mode === "micro"
                            ? "border-amber-500 bg-amber-50 shadow-xl shadow-amber-500/10"
                            : "border-slate-100 bg-white hover:border-amber-200 hover:shadow-lg"
                    )}
                >
                    <div className="flex items-start justify-between">
                        <div className={cn(
                            "h-12 w-12 rounded-2xl flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:rotate-3 sm:h-14 sm:w-14",
                            mode === "micro" ? "bg-amber-500 text-white shadow-lg shadow-amber-200" : "bg-amber-50 text-amber-500"
                        )}>
                            <Zap className="h-7 w-7 fill-current" />
                        </div>
                        {mode === "micro" && <Badge className="bg-amber-500 text-white border-none py-1">Aktywny tryb</Badge>}
                    </div>
                    <div>
                        <h3 className={cn("mb-1 text-xl font-extrabold sm:text-2xl", mode === "micro" ? "text-amber-900" : "text-slate-900")}>
                            Mikrozlecenia
                        </h3>
                        <p className="text-slate-500 font-medium">
                            Szybkie zadania z konkretną wyceną, płatne od ręki po realizacji.
                        </p>
                    </div>
                </div>

                <div
                    onClick={() => setMode("job")}
                    className={cn(
                        "cursor-pointer group relative overflow-hidden rounded-[2rem] border-2 transition-all duration-300 p-5 sm:p-6 flex flex-col gap-5 sm:gap-6",
                        mode === "job"
                            ? "border-indigo-600 bg-indigo-50 shadow-xl shadow-indigo-500/10"
                            : "border-slate-100 bg-white hover:border-indigo-200 hover:shadow-lg"
                    )}
                >
                    <div className="flex items-start justify-between">
                        <div className={cn(
                            "h-12 w-12 rounded-2xl flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:-rotate-3 sm:h-14 sm:w-14",
                            mode === "job" ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200" : "bg-indigo-50 text-indigo-600"
                        )}>
                            <Briefcase className="h-7 w-7 fill-current" />
                        </div>
                        {mode === "job" && <Badge className="bg-indigo-600 text-white border-none py-1">Aktywny tryb</Badge>}
                    </div>
                    <div>
                        <h3 className={cn("mb-1 text-xl font-extrabold sm:text-2xl", mode === "job" ? "text-indigo-900" : "text-slate-900")}>
                            Praca i Staże
                        </h3>
                        <p className="text-slate-500 font-medium">
                            Długofalowa współpraca, rozwój kompetencji i pewna ścieżka zawodowa.
                        </p>
                    </div>
                </div>
            </div>

            {/* MAIN CONTENT AREA */}
            <div className="flex flex-col items-start gap-8 lg:flex-row lg:gap-12">

                {/* DYNAMIC SIDEBAR FILTERS - Premium Styling */}
                <div className="hidden lg:block w-72 flex-shrink-0 space-y-10 sticky top-24">
                    <div className="space-y-10 animate-in fade-in slide-in-from-left-4 duration-500">
                        {/* Search */}
                        <div className="space-y-3">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Szukaj</label>
                            <div className="relative group">
                                <Search className="absolute left-3 top-3.5 h-5 w-5 text-slate-300 group-focus-within:text-indigo-500 transition-colors" />
                                <Input
                                    placeholder={mode === "job" ? "Stanowisko, firma..." : "Czego szukasz?"}
                                    className="pl-11 h-12 bg-white border-slate-200 focus:bg-white focus:border-indigo-500 rounded-2xl transition-all shadow-sm group-hover:shadow-md"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Location */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Lokalizacja</label>
                                {locationFilter && <span className="text-[10px] font-bold text-red-500 cursor-pointer hover:underline" onClick={() => setLocationFilter("")}>WYCZYŚĆ</span>}
                            </div>
                            <Select value={locationFilter || "all_locations"} onValueChange={handleLocationChange}>
                                <SelectTrigger className="h-12 bg-white border-slate-200 rounded-2xl shadow-sm hover:shadow-md transition-all">
                                    <SelectValue placeholder="Wybierz miasto" />
                                </SelectTrigger>
                                <SelectContent className="rounded-2xl border-slate-100 shadow-2xl">
                                    <SelectItem value="all_locations">Cała Polska</SelectItem>
                                    {locations.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* SUB FILTERS - TABS (External) */}
                        {mode === "micro" && (
                            <div className="space-y-3 animate-in zoom-in-95 duration-300">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Rodzaj zlecenia</label>
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
                                                className="justify-start px-4 py-3 rounded-xl border border-slate-100 bg-white shadow-sm data-[state=active]:bg-amber-50 data-[state=active]:border-amber-300 data-[state=active]:text-amber-700 data-[state=active]:shadow-md font-bold transition-all text-sm"
                                            >
                                                {tab.label}
                                            </TabsTrigger>
                                        ))}
                                    </TabsList>
                                </Tabs>
                            </div>
                        )}

                        {/* Categories */}
                        {categories.length > 0 && (
                            <div className="space-y-4">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Kategorie</label>
                                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                    {categories.map(c => (
                                        <div key={c} className="flex items-center space-x-3 group cursor-pointer" onClick={() => toggleCategory(c)}>
                                            <div className={cn(
                                                "w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all",
                                                categoryFilter.includes(c) ? "bg-indigo-600 border-indigo-600 shadow-sm" : "border-slate-200 bg-white group-hover:border-indigo-300"
                                            )}>
                                                {categoryFilter.includes(c) && <CheckCircle2 className="h-3 w-3 text-white" />}
                                            </div>
                                            <span className={cn("text-sm font-medium transition-colors", categoryFilter.includes(c) ? "text-indigo-900" : "text-slate-600 group-hover:text-indigo-600")}>{c}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Salary/Budget */}
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

                        <div className="pt-6 border-t border-slate-100 flex flex-col gap-4">
                            <div className="flex items-center space-x-3 cursor-pointer group" onClick={() => setShowApplied(!showApplied)}>
                                <Checkbox
                                    id="show-applied-desktop"
                                    checked={showApplied}
                                    onCheckedChange={(c) => setShowApplied(c === true)}
                                    className="rounded-md"
                                />
                                <Label htmlFor="show-applied-desktop" className="text-xs font-bold text-slate-500 uppercase tracking-widest cursor-pointer group-hover:text-indigo-600 transition-colors">
                                    Pokaż aplikowane
                                </Label>
                            </div>

                            <Button variant="outline" className="w-full rounded-xl border-slate-200 text-slate-500 font-bold hover:bg-slate-50 hover:text-slate-900 shadow-sm" onClick={clearFilters}>
                                <X className="mr-2 h-4 w-4" /> Wyczyść filtry
                            </Button>
                        </div>
                    </div>
                </div>

                {/* LIST */}
                <div className="flex-1 w-full space-y-6">
                    {/* INFO BAR */}
                    <div className="flex flex-col items-stretch justify-between gap-4 rounded-3xl border border-slate-100 bg-slate-50/50 p-3 sm:flex-row sm:items-center sm:p-4">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
                            <div className={cn(
                                "h-10 px-4 rounded-2xl flex items-center font-bold text-sm shadow-sm",
                                mode === "job" ? "bg-indigo-600 text-white" : "bg-amber-500 text-white"
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
                                    <div key={offer.id} className="content-auto animate-in fade-in slide-in-from-bottom-4 duration-500" style={{ animationDelay: `${idx * 50}ms` }}>
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
