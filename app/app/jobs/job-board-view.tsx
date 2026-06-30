"use client";

import Link from "next/link";
import { useDeferredValue, useState, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, X, CheckCircle2, Briefcase, Zap, SearchCheck, ChevronRight } from "lucide-react";
import { JobCard, JobOffer } from "./job-card";
import { Sheet, SheetClose, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { JOB_CATEGORIES, JOB_CATEGORY_GROUPS, inferJobCategoryFromText, normalizeCategoryKey, resolveJobCategoryLabel } from "@/lib/constants";
import { cn } from "@/lib/utils";

const POPULAR_CONTRACTS = ["Umowa o pracę", "B2B", "Umowa zlecenie", "Umowa o dzieło", "Praktyki"];
const JOBS_PAGE_SIZE = 24;
type BoardMode = "micro" | "challenge" | "job";
type AssignmentType = "all" | "platform" | "regular" | "challenge";

function normalizeSearchText(value: unknown) {
    return String(value ?? "")
        .toLocaleLowerCase("pl-PL")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim();
}

function isJobOffer(offer: Pick<JobOffer, "typ">) {
    const type = normalizeSearchText(offer.typ);
    return type.includes("job") || type.includes("praca") || type.includes("staz");
}

function isChallengeOffer(offer: Pick<JobOffer, "typ">) {
    const type = normalizeSearchText(offer.typ);
    return type.includes("challenge") || type.includes("wyzwan");
}

function getOfferResolvedCategory(offer: Pick<JobOffer, "category" | "tytul" | "opis" | "obligations">) {
    return resolveJobCategoryLabel(offer.category) ?? inferJobCategoryFromText(`${offer.category ?? ""} ${offer.tytul} ${offer.opis ?? ""} ${offer.obligations ?? ""}`);
}

function getOfferCategory(offer: Pick<JobOffer, "category" | "tytul" | "opis" | "obligations">) {
    return getOfferResolvedCategory(offer) ?? offer.category?.trim() ?? "Inne";
}

function getSubcategoryId(subcategory: { readonly label: string; readonly url: string }) {
    return subcategory.url.split("/").filter(Boolean).at(-1) ?? normalizeCategoryKey(subcategory.label).replace(/\s+/g, "-");
}

function getCategoryGroupByLabel(label: string) {
    return JOB_CATEGORY_GROUPS.find((category) => category.label === label) ?? null;
}

function getSubcategoryById(id: string) {
    for (const category of JOB_CATEGORY_GROUPS) {
        const subcategory = category.subcategories.find((item) => getSubcategoryId(item) === id);
        if (subcategory) return subcategory;
    }

    return null;
}

function offerMatchesSubcategory(offer: JobOffer, subcategoryId: string) {
    const subcategory = getSubcategoryById(subcategoryId);
    if (!subcategory) return false;

    const source = normalizeCategoryKey([
        offer.tytul,
        offer.category,
        offer.opis,
        offer.obligations,
        ...(offer.technologies ?? []),
    ].join(" "));
    const subcategoryTokens = normalizeCategoryKey(`${subcategory.label} ${subcategory.url} ${subcategory.description}`)
        .split(" ")
        .filter((token) => token.length >= 4);

    return subcategoryTokens.some((token) => source.includes(token));
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
    const [mode, setMode] = useState<BoardMode>("micro");
    const [subFilter, setSubFilter] = useState<"all" | "platform" | "regular">("all");
    const [search, setSearch] = useState("");
    const deferredSearch = useDeferredValue(search);

    const [techFilters, setTechFilters] = useState<string[]>([]);
    const [contractFilters, setContractFilters] = useState<string[]>([]);
    const [categoryFilter, setCategoryFilter] = useState<string[]>([]);
    const [subcategoryFilter, setSubcategoryFilter] = useState<string[]>([]);
    const [salaryMin, setSalaryMin] = useState<number | "">("");
    const [salaryMax, setSalaryMax] = useState<number | "">("");

    const [budgetMin, setBudgetMin] = useState<number | "">("");
    const [budgetMax, setBudgetMax] = useState<number | "">("");

    const [showApplied, setShowApplied] = useState(false);

    const [companyIdFilter, setCompanyIdFilter] = useState(initialCompanyId || companyIdFromUrl || "");
    const activeAssignmentType: AssignmentType = mode === "challenge" ? "challenge" : subFilter;
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
        categoryFilter.length +
        subcategoryFilter.length +
        contractFilters.length +
        techFilters.length +
        Number(Boolean(salaryMin)) +
        Number(Boolean(salaryMax)) +
        Number(Boolean(budgetMin)) +
        Number(Boolean(budgetMax)) +
        Number(showApplied) +
        Number(mode === "micro" && subFilter !== "all");

    const { contracts, categories } = useMemo(() => {
        const conts = new Set<string>(POPULAR_CONTRACTS);
        const cats = new Set<string>(JOB_CATEGORIES);
        const unknownCats = new Set<string>();

        offers.forEach(o => {
            const isJob = isJobOffer(o);
            const isChallenge = isChallengeOffer(o);
            const matchesMode =
                mode === "job" ? isJob :
                    mode === "challenge" ? isChallenge :
                        !isJob && !isChallenge;

            if (matchesMode) {
                if (o.contract_type) conts.add(o.contract_type);
                const category = getOfferCategory(o);
                if (category && !cats.has(category)) unknownCats.add(category);
            }
        });

        return {
            contracts: Array.from(conts).sort(),
            categories: [...JOB_CATEGORIES, ...Array.from(unknownCats).sort()]
        };
    }, [offers, mode]);

    const filtered = useMemo(() => {
        const normalizedSearch = normalizeSearchText(deferredSearch);

        return offers.filter(o => {
            if (companyIdFilter && o.company_id !== companyIdFilter) return false;

            if (showApplied && !appliedOfferIds?.has(o.id)) return false;

            const isJob = isJobOffer(o);
            const isChallenge = isChallengeOffer(o);
            const offerCategory = getOfferCategory(o);
            const resolvedOfferCategory = getOfferResolvedCategory(o);

            if (!companyIdFilter) {
                if (mode === "job" && !isJob) return false;
                if (mode === "challenge" && !isChallenge) return false;
                if (mode === "micro" && (isJob || isChallenge)) return false;
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
                    offerCategory,
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
                if (categoryFilter.length > 0) {
                    const matchesCategory = categoryFilter.some((category) => {
                        if (category === "Inne") return !resolvedOfferCategory || resolvedOfferCategory === "Inne";
                        return offerCategory === category;
                    });
                    if (!matchesCategory) return false;
                }
                if (subcategoryFilter.length > 0) {
                    if (!subcategoryFilter.some((subcategoryId) => offerMatchesSubcategory(o, subcategoryId))) return false;
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
                if (categoryFilter.length > 0) {
                    const matchesCategory = categoryFilter.some((category) => {
                        if (category === "Inne") return !resolvedOfferCategory || resolvedOfferCategory === "Inne";
                        return offerCategory === category;
                    });
                    if (!matchesCategory) return false;
                }
                if (subcategoryFilter.length > 0) {
                    if (!subcategoryFilter.some((subcategoryId) => offerMatchesSubcategory(o, subcategoryId))) return false;
                }
                const rate = getOfferAmount(o);
                if (budgetMin !== "" && rate < Number(budgetMin)) return false;
                if (budgetMax !== "" && rate > Number(budgetMax)) return false;
            }

            return true;
        });
    }, [offers, mode, deferredSearch, techFilters, contractFilters, categoryFilter, subcategoryFilter, salaryMin, salaryMax, budgetMin, budgetMax, subFilter, companyIdFilter, showApplied, appliedOfferIds]);

    const toggleContract = (c: string) => setContractFilters(prev => prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c]);
    const toggleCategory = (c: string) => {
        const categoryGroup = getCategoryGroupByLabel(c);
        const subcategoryIds = new Set(categoryGroup?.subcategories.map(getSubcategoryId) ?? []);

        setCategoryFilter(prev => prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c]);
        if (subcategoryIds.size > 0) {
            setSubcategoryFilter(prev => prev.filter((id) => !subcategoryIds.has(id)));
        }
    };
    const toggleSubcategory = (category: string, subcategoryId: string) => {
        setCategoryFilter(prev => prev.includes(category) ? prev : [...prev, category]);
        setSubcategoryFilter(prev => prev.includes(subcategoryId) ? prev.filter((id) => id !== subcategoryId) : [...prev, subcategoryId]);
    };

    const clearFilters = () => {
        setSearch("");
        setTechFilters([]);
        setContractFilters([]);
        setCategoryFilter([]);
        setSubcategoryFilter([]);
        setSalaryMin("");
        setSalaryMax("");
        setBudgetMin("");
        setBudgetMax("");
        setSubFilter("all");
        setShowApplied(false);
    };

    const handleAssignmentTypeChange = (value: AssignmentType) => {
        if (value === "challenge") {
            setMode("challenge");
            setSubFilter("all");
            return;
        }

        setMode("micro");
        setSubFilter(value);
    };



    return (
        <div className="flex flex-col gap-4 sm:gap-5">

            <div className="-mt-20 space-y-4 lg:hidden">
                <div className="rounded-2xl border border-white/15 bg-[#233a78] p-3 shadow-sm">
                    <div className="hidden">
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-normal text-slate-400">
                                Wyszukiwarka ofert
                            </p>
                            <h2 className="mt-1 text-lg font-black leading-tight text-slate-900">
                                {mode === "job" ? "Znajdź pracę lub staż" : mode === "challenge" ? "Znajdź wyzwanie" : "Znajdź mikrozlecenie"}
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

                <div className="grid grid-cols-3 gap-2">
                    {[
                        { id: "micro" as const, label: "Mikro", icon: Zap },
                        { id: "challenge" as const, label: "Wyzwania", icon: SearchCheck },
                        { id: "job" as const, label: "Praca", icon: Briefcase },
                    ].map((item) => {
                        const Icon = item.icon;

                        return (
                            <button
                                key={item.id}
                                type="button"
                                onClick={() => setMode(item.id)}
                                className={cn(
                                    "flex min-h-14 items-center justify-center gap-1.5 rounded-2xl border px-2 text-xs font-black transition-all",
                                    mode === item.id
                                        ? "border-lime-200 bg-lime-100 text-[#0b1b47] shadow-sm"
                                        : "border-slate-200 bg-white text-slate-600",
                                )}
                            >
                                <Icon className="h-4 w-4" />
                                {item.label}
                            </button>
                        );
                    })}
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

                                {mode !== "job" && (
                                    <div className="space-y-3">
                                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Rodzaj zlecenia</label>
                                        <div className="grid grid-cols-2 gap-2 rounded-2xl border border-slate-200 bg-slate-100/80 p-1.5">
                                            {[
                                                { id: "all", label: "Wszystkie" },
                                                { id: "platform", label: "Systemowe" },
                                                { id: "regular", label: "Firmy" },
                                                { id: "challenge", label: "Wyzwania" },
                                            ].map((tab) => (
                                                <button
                                                    key={tab.id}
                                                    type="button"
                                                    onClick={() => handleAssignmentTypeChange(tab.id as AssignmentType)}
                                                    className={cn(
                                                        "min-h-10 rounded-xl px-2 text-[11px] font-black transition-all",
                                                        activeAssignmentType === tab.id
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
                                            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Wynagrodzenie (min-max)</label>
                                            <div className="flex gap-3">
                                                <Input type="number" placeholder="Min" value={salaryMin} onChange={e => setSalaryMin(e.target.value ? Number(e.target.value) : "")} className="h-12 bg-slate-50 border-slate-200 rounded-xl" />
                                                <Input type="number" placeholder="Max" value={salaryMax} onChange={e => setSalaryMax(e.target.value ? Number(e.target.value) : "")} className="h-12 bg-slate-50 border-slate-200 rounded-xl" />
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <div className="space-y-4">
                                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Wynagrodzenie (min-max)</label>
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
                                            {categories.map(c => {
                                                const categoryGroup = getCategoryGroupByLabel(c);
                                                const isSelected = categoryFilter.includes(c);

                                                return (
                                                    <div key={c} className="rounded-xl border border-slate-100 p-3 transition-colors hover:bg-slate-50">
                                                        <div className="flex items-center space-x-3">
                                                            <Checkbox id={`m-cat-${c}`} checked={isSelected} onCheckedChange={() => toggleCategory(c)} />
                                                            <Label htmlFor={`m-cat-${c}`} className="flex-1 cursor-pointer text-sm font-medium text-slate-700">{c}</Label>
                                                            {isSelected && categoryGroup && categoryGroup.subcategories.length > 0 ? (
                                                                <ChevronRight className="h-4 w-4 rotate-90 text-slate-400" />
                                                            ) : null}
                                                        </div>

                                                        {isSelected && categoryGroup && categoryGroup.subcategories.length > 0 ? (
                                                            <div className="mt-3 space-y-2 border-l border-slate-200 pl-4">
                                                                {categoryGroup.subcategories.map((subcategory) => {
                                                                    const subcategoryId = getSubcategoryId(subcategory);

                                                                    return (
                                                                        <div key={subcategory.url} className="flex items-center gap-2 rounded-lg px-2 py-1.5">
                                                                            <Checkbox
                                                                                id={`m-subcat-${subcategoryId}`}
                                                                                checked={subcategoryFilter.includes(subcategoryId)}
                                                                                onCheckedChange={() => toggleSubcategory(c, subcategoryId)}
                                                                            />
                                                                            <Label htmlFor={`m-subcat-${subcategoryId}`} className="flex-1 cursor-pointer text-xs font-bold leading-5 text-slate-500">
                                                                                {subcategory.label}
                                                                            </Label>
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        ) : null}
                                                    </div>
                                                );
                                            })}
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

            <div className="hidden grid-cols-1 gap-4 lg:grid lg:grid-cols-3">
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
                    onClick={() => setMode("challenge")}
                    className={cn(
                        "group relative flex cursor-pointer items-center gap-4 overflow-hidden rounded-2xl border p-4 transition-all duration-300",
                        mode === "challenge"
                            ? "border-lime-200 bg-lime-100 shadow-sm"
                            : "border-slate-200 bg-white hover:border-lime-200 hover:shadow-sm"
                    )}
                >
                    <div className="flex items-start justify-between">
                        <div className={cn(
                            "flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-300",
                            mode === "challenge" ? "bg-lime-300 text-[#0b1b47]" : "bg-slate-50 text-[#0b1b47]"
                        )}>
                            <SearchCheck className="h-5 w-5" />
                        </div>
                    </div>
                    <div>
                        <h3 className={cn("mb-1 text-base font-extrabold", mode === "challenge" ? "text-[#0b1b47]" : "text-slate-900")}>
                            Wyzwania
                        </h3>
                        <p className="text-xs font-semibold leading-5 text-slate-500">
                            Nietypowe problemy do pitcha, wyceny i doprecyzowania zakresu.
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
                                    placeholder={mode === "job" ? "Stanowisko, firma..." : mode === "challenge" ? "Problem, branża, narzędzie..." : "Czego szukasz?"}
                                    className="h-11 rounded-xl border-slate-200 bg-slate-50 pl-10 transition-all focus:border-indigo-500 focus:bg-white"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                />
                            </div>
                        </div>

                        {mode !== "job" && (
                            <div className="space-y-3 animate-in zoom-in-95 duration-300">
                                <label className="text-xs font-bold uppercase tracking-normal text-slate-400">Rodzaj zlecenia</label>
                                <Tabs value={activeAssignmentType} onValueChange={(value) => handleAssignmentTypeChange(value as AssignmentType)} className="w-full">
                                    <TabsList className="grid w-full grid-cols-1 gap-2 bg-transparent h-auto p-0">
                                        {[
                                            { id: 'all', label: 'Wszystkie' },
                                            { id: 'platform', label: '🛡️ Systemowe' },
                                            { id: 'regular', label: '🏢 Zlecenia firm' },
                                            { id: 'challenge', label: 'Wyzwania' }
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
                                    {categories.map(c => {
                                        const categoryGroup = getCategoryGroupByLabel(c);
                                        const isSelected = categoryFilter.includes(c);

                                        return (
                                            <div key={c}>
                                                <div className="flex cursor-pointer items-center space-x-3 group" onClick={() => toggleCategory(c)}>
                                                    <div className={cn(
                                                        "w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all",
                                                        isSelected ? "border-[#10245f] bg-[#10245f] shadow-sm" : "border-slate-200 bg-white group-hover:border-[#10245f]"
                                                    )}>
                                                        {isSelected && <CheckCircle2 className="h-3 w-3 text-white" />}
                                                    </div>
                                                    <span className={cn("flex-1 text-sm font-medium transition-colors", isSelected ? "text-indigo-900" : "text-slate-600 group-hover:text-indigo-600")}>{c}</span>
                                                    {isSelected && categoryGroup && categoryGroup.subcategories.length > 0 ? (
                                                        <ChevronRight className="h-3.5 w-3.5 rotate-90 text-slate-400" />
                                                    ) : null}
                                                </div>

                                                {isSelected && categoryGroup && categoryGroup.subcategories.length > 0 ? (
                                                    <div className="mt-2 space-y-1 border-l border-slate-200 pl-4">
                                                        {categoryGroup.subcategories.map((subcategory) => {
                                                            const subcategoryId = getSubcategoryId(subcategory);
                                                            const isSubcategorySelected = subcategoryFilter.includes(subcategoryId);

                                                            return (
                                                                <button
                                                                    key={subcategory.url}
                                                                    type="button"
                                                                    onClick={() => toggleSubcategory(c, subcategoryId)}
                                                                    className={cn(
                                                                        "flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs font-bold leading-5 transition",
                                                                        isSubcategorySelected
                                                                            ? "bg-[#10245f] text-white"
                                                                            : "text-slate-500 hover:bg-slate-50 hover:text-[#10245f]",
                                                                    )}
                                                                >
                                                                    <span
                                                                        className={cn(
                                                                            "h-2.5 w-2.5 rounded-full border",
                                                                            isSubcategorySelected ? "border-white bg-white" : "border-slate-300 bg-white",
                                                                        )}
                                                                    />
                                                                    {subcategory.label}
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                ) : null}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        <div className="space-y-4">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Wynagrodzenie</label>
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
                                    Tylko aplikowane
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
                                {mode === "job" ? "Praca i staże" : mode === "challenge" ? "Wyzwania" : "Mikrozlecenia"}
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
                                Resetuj filtry
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
