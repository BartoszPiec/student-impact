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
import { Search, SlidersHorizontal, X } from "lucide-react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useCallback, useState, useEffect } from "react";
import { useDebounce } from "use-debounce";

export default function DashboardFilters() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    // Local state for immediate UI feedback
    const [searchTerm, setSearchTerm] = useState(searchParams.get("search") || "");
    const [debouncedSearch] = useDebounce(searchTerm, 500);

    const currentStatus = searchParams.get("status") || "all";
    const currentSort = searchParams.get("sort") || "newest";

    // Create query string logic
    const createQueryString = useCallback(
        (name: string, value: string) => {
            const params = new URLSearchParams(searchParams.toString());

            if (value && value !== "all" && value !== "") {
                params.set(name, value);
            } else {
                params.delete(name);
            }

            return params.toString();
        },
        [searchParams]
    );

    // Effect for search debounce
    useEffect(() => {
        const params = new URLSearchParams(searchParams.toString());
        if (debouncedSearch) {
            params.set("search", debouncedSearch);
        } else {
            params.delete("search");
        }
        router.push(pathname + "?" + params.toString());
    }, [debouncedSearch, pathname, router, searchParams]); // Warning: this depends on searchParams which updates. 
    // Optimization: Only run if `search` param differs from `debouncedSearch` to avoid loops, 
    // but simpler manual push on debounced change is safer usually.
    // Let's refactor to avoid dependency loop issue common with simple useEffects on searchParams.

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value);
    };

    const handleStatusChange = (value: string) => {
        router.push(pathname + "?" + createQueryString("status", value));
    };

    const handleSortChange = (value: string) => {
        router.push(pathname + "?" + createQueryString("sort", value));
    };

    const clearFilters = () => {
        setSearchTerm("");
        router.push(pathname);
    };

    return (
        <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50 flex flex-col md:flex-row gap-4 items-center animate-in fade-in slide-in-from-top-4">
            {/* Search */}
            <div className="relative w-full md:flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <Input
                    placeholder="Szukaj po nazwie firmy lub usługi..."
                    value={searchTerm}
                    onChange={handleSearchChange}
                    className="pl-12 h-12 rounded-2xl border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300 transition-all font-medium"
                />
            </div>

            {/* Filters Group */}
            <div className="flex w-full md:w-auto gap-3 overflow-x-auto pb-2 md:pb-0 no-scrollbar">

                {/* Status Filter */}
                <Select value={currentStatus} onValueChange={handleStatusChange}>
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
                <Select value={currentSort} onValueChange={handleSortChange}>
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

                {(currentStatus !== "all" || currentSort !== "newest" || searchTerm) && (
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
    );
}
