"use client";

import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, MapPin, Filter, X, CheckCircle2, Briefcase, Zap } from "lucide-react";
import { JobCard, JobOffer } from "./job-card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export function JobBoardView({ initialOffers, initialCompanyId, appliedOfferIds }: { initialOffers: JobOffer[], initialCompanyId?: string, appliedOfferIds?: Set<string> }) {
    const searchParams = useSearchParams();
    const companyIdFromUrl = searchParams.get("companyId");

    // State
    const [offers] = useState<JobOffer[]>(initialOffers);
    const [mode, setMode] = useState<"job" | "micro">("micro"); // Default to micro
    const [subFilter, setSubFilter] = useState<"all" | "platform" | "regular">("all"); // Systemowe vs Zwykłe
    const [search, setSearch] = useState("");

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

    // Sync companyId from params (for navigating from profile)
    useEffect(() => {
        const id = initialCompanyId || companyIdFromUrl;
        if (id) {
            setCompanyIdFilter(id);
        }
    }, [initialCompanyId, companyIdFromUrl]);

    // ... (rest of the code)

    // Defined lists
    const POPULAR_CITIES = ["Warszawa", "Kraków", "Wrocław", "Poznań", "Gdańsk", "Łódź", "Katowice", "Lublin", "Bydgoszcz", "Szczecin"];
    const POPULAR_CATEGORIES = ["IT / Programowanie", "Grafika & Design", "Marketing & Social Media", "Copywriting", "Wideo & Animacja", "Tłumaczenia", "Administracja"];
    const POPULAR_CONTRACTS = ["Umowa o pracę", "B2B", "Umowa zlecenie", "Umowa o dzieło", "Praktyki"];

    // Data Extraction based on ACTIVE MODE offers
    const { locations, technologies, contracts, categories } = useMemo(() => {
        const locs = new Set<string>(POPULAR_CITIES);
        const techs = new Set<string>();
        const conts = new Set<string>(POPULAR_CONTRACTS);
        const cats = new Set<string>(POPULAR_CATEGORIES);

        offers.forEach(o => {
            // Only aggregate data relevant to the current mode? 
            // Actually, better to show all available options or just relevant ones. 
            // Let's filter by mode first for metadata to keep filters clean.
            const isJob = o.typ === "job" || o.typ === "Praca" || o.typ === "praca" || o.typ === "Staż";
            const matchesMode = mode === "job" ? isJob : !isJob;

            if (matchesMode) {
                if (o.location) locs.add(o.location);
                if (o.is_remote) locs.add("Remote");
                o.technologies?.forEach(t => techs.add(t));
                if (o.contract_type) conts.add(o.contract_type);
                if (o.category) cats.add(o.category);
            }
        });

        return {
            locations: Array.from(locs).sort(),
            technologies: Array.from(techs).sort(),
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

            const type = o.typ ? o.typ.toLowerCase() : "";
            const isJob = type.includes("job") || type.includes("praca") || type.includes("staż");

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
            const s = search.toLowerCase();
            const matchesSearch =
                o.tytul.toLowerCase().includes(s) ||
                (o.technologies && o.technologies.some(t => t.toLowerCase().includes(s))) ||
                (o.company_name && o.company_name.toLowerCase().includes(s));
            if (!matchesSearch) return false;

            // 3. Specific Filters
            if (mode === "job") {
                // ... same logic
                // Location
                if (locationFilter) {
                    if (locationFilter === "Remote") {
                        if (!o.is_remote) return false;
                    } else if (o.location !== locationFilter && !o.location?.includes(locationFilter)) {
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
                    } else if (o.location !== locationFilter && !o.location?.includes(locationFilter)) {
                        return false;
                    }
                }
                // Category
                if (categoryFilter.length > 0) {
                    if (!o.category || !categoryFilter.includes(o.category)) return false;
                }
                // Budget
                const rate = o.salary_range_min || 0;
                if (budgetMin !== "" && rate < Number(budgetMin)) return false;
                if (budgetMax !== "" && rate > Number(budgetMax)) return false;
            }

            return true;
        });
    }, [offers, mode, search, locationFilter, techFilters, contractFilters, categoryFilter, salaryMin, salaryMax, budgetMin, budgetMax, subFilter, companyIdFilter, showApplied, appliedOfferIds]);

    // Handlers
    const toggleTech = (t: string) => setTechFilters(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]);
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



    return (
        <div className="flex flex-col gap-10">

            {/* Mobile Filter Trigger */}
            <div className="lg:hidden">
                <Sheet>
                    <SheetTrigger asChild>
                        <Button variant="outline" className="w-full h-12 rounded-2xl border-slate-200 shadow-sm font-semibold">
                            <Filter className="mr-2 h-4 w-4" /> Filtry i Wyszukiwanie
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="w-[85%] sm:w-[400px] overflow-y-auto border-none p-0">
                        <div className="p-8 space-y-8 h-full bg-white">
                            <SheetHeader className="mb-8">
                                <SheetTitle className="text-2xl font-extrabold text-[#1a1a2e]">Filtruj oferty</SheetTitle>
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
                                    <Select value={locationFilter} onValueChange={setLocationFilter}>
                                        <SelectTrigger className="h-12 bg-slate-50 border-slate-200 rounded-xl"><SelectValue placeholder="Wybierz" /></SelectTrigger>
                                        <SelectContent className="bg-white z-50 rounded-xl border-slate-100 shadow-2xl">
                                            <SelectItem value="all_locations">Cała Polska</SelectItem>
                                            {locations.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>

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

                                <Button onClick={clearFilters} variant="ghost" className="w-full text-slate-400 hover:text-slate-900 font-bold">Wyczyść wszystko</Button>
                            </div>
                        </div>
                    </SheetContent>
                </Sheet>
            </div>

            {/* MODE SWITCHER - Premium Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div
                    onClick={() => setMode("micro")}
                    className={cn(
                        "cursor-pointer group relative overflow-hidden rounded-[2rem] border-2 transition-all duration-300 p-6 flex flex-col gap-6",
                        mode === "micro"
                            ? "border-amber-500 bg-amber-50 shadow-xl shadow-amber-500/10"
                            : "border-slate-100 bg-white hover:border-amber-200 hover:shadow-lg"
                    )}
                >
                    <div className="flex items-start justify-between">
                        <div className={cn(
                            "h-14 w-14 rounded-2xl flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:rotate-3",
                            mode === "micro" ? "bg-amber-500 text-white shadow-lg shadow-amber-200" : "bg-amber-50 text-amber-500"
                        )}>
                            <Zap className="h-7 w-7 fill-current" />
                        </div>
                        {mode === "micro" && <Badge className="bg-amber-500 text-white border-none py-1">Aktywny tryb</Badge>}
                    </div>
                    <div>
                        <h3 className={cn("font-extrabold text-2xl mb-1", mode === "micro" ? "text-amber-900" : "text-slate-900")}>
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
                        "cursor-pointer group relative overflow-hidden rounded-[2rem] border-2 transition-all duration-300 p-6 flex flex-col gap-6",
                        mode === "job"
                            ? "border-indigo-600 bg-indigo-50 shadow-xl shadow-indigo-500/10"
                            : "border-slate-100 bg-white hover:border-indigo-200 hover:shadow-lg"
                    )}
                >
                    <div className="flex items-start justify-between">
                        <div className={cn(
                            "h-14 w-14 rounded-2xl flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:-rotate-3",
                            mode === "job" ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200" : "bg-indigo-50 text-indigo-600"
                        )}>
                            <Briefcase className="h-7 w-7 fill-current" />
                        </div>
                        {mode === "job" && <Badge className="bg-indigo-600 text-white border-none py-1">Aktywny tryb</Badge>}
                    </div>
                    <div>
                        <h3 className={cn("font-extrabold text-2xl mb-1", mode === "job" ? "text-indigo-900" : "text-slate-900")}>
                            Praca i Staże
                        </h3>
                        <p className="text-slate-500 font-medium">
                            Długofalowa współpraca, rozwój kompetencji i pewna ścieżka zawodowa.
                        </p>
                    </div>
                </div>
            </div>

            {/* MAIN CONTENT AREA */}
            <div className="flex flex-col lg:flex-row gap-12 items-start">

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
                            <Select value={locationFilter} onValueChange={setLocationFilter}>
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
                                <Tabs value={subFilter} onValueChange={(v) => setSubFilter(v as any)} className="w-full">
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
                                        mode === "job" ? setSalaryMin(val) : setBudgetMin(val);
                                    }}
                                    className="h-11 bg-white border-slate-200 rounded-xl"
                                />
                                <Input
                                    type="number"
                                    placeholder="Do"
                                    value={mode === "job" ? salaryMax : budgetMax}
                                    onChange={(e) => {
                                        const val = e.target.value ? Number(e.target.value) : "";
                                        mode === "job" ? setSalaryMax(val) : setBudgetMax(val);
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
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50/50 p-4 rounded-3xl border border-slate-100">
                        <div className="flex items-center gap-4">
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
                        <div className="text-center py-24 bg-slate-50/30 rounded-[3rem] border-2 border-dashed border-slate-200">
                            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl border border-slate-100 animate-bounce cursor-default">
                                <Search className="h-10 w-10 text-slate-300" />
                            </div>
                            <h3 className="text-2xl font-extrabold text-slate-900 mb-2">
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
                        <div className="grid grid-cols-1 gap-6 pb-20">
                            {filtered.map((offer, idx) => (
                                <div key={offer.id} className="animate-in fade-in slide-in-from-bottom-4 duration-500" style={{ animationDelay: `${idx * 50}ms` }}>
                                    <JobCard
                                        offer={offer}
                                        isApplied={appliedOfferIds?.has(offer.id)}
                                    />
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
