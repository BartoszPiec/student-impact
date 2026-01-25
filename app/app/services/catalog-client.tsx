"use client";

import { useState, useTransition } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle2, Clock, Sparkles, User, Briefcase } from "lucide-react";
import Link from "next/link";
import { SERVICE_CATEGORIES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { createInquiryAction } from "./_actions";
import { toast } from "sonner";

type Package = {
    id: string;
    title: string;
    description: string;
    price: number;
    price_max?: number | null;
    delivery_time_days: number;
    student_id: string | null;
    is_system?: boolean;
    categories?: string[] | null;
    profiles?: {
        imie: string;
        nazwisko: string;
        avatar_url: string | null;
    } | null;
};

export default function CatalogClient({ packages, isCompany }: { packages: Package[], isCompany: boolean }) {
    const [pending, startTransition] = useTransition();
    const [activeTab, setActiveTab] = useState<"system" | "student">("system");
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

    const systemPackages = packages.filter(p => p.is_system);
    const studentPackages = packages.filter(p => !p.is_system);

    const list = activeTab === "system" ? systemPackages : studentPackages;

    const filtered = selectedCategory
        ? list.filter(p => p.categories?.includes(selectedCategory))
        : list;

    return (
        <div className="space-y-8">
            {/* TABS HEADER */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full sm:w-auto">
                    <TabsList className="grid w-full grid-cols-2 p-1 bg-slate-100 h-auto">
                        <TabsTrigger value="system" className="data-[state=active]:bg-white data-[state=active]:text-indigo-600 py-2.5">
                            <Sparkles className="mr-2 h-4 w-4" /> Gotowe Pakiety
                        </TabsTrigger>
                        <TabsTrigger value="student" className="data-[state=active]:bg-white data-[state=active]:text-amber-600 py-2.5">
                            <User className="mr-2 h-4 w-4" /> Usługi Studentów
                        </TabsTrigger>
                    </TabsList>
                </Tabs>

                <div className="text-sm text-slate-500">
                    Znaleziono: <span className="font-semibold text-slate-900">{filtered.length}</span>
                </div>
            </div>

            {/* CATEGORY FILTERS */}
            <div className="flex flex-wrap gap-2 pb-4">
                <Button
                    variant={selectedCategory === null ? "default" : "outline"}
                    onClick={() => setSelectedCategory(null)}
                    className={cn("rounded-full h-9 px-4", selectedCategory === null ? "bg-indigo-600 hover:bg-indigo-700 text-white" : "text-slate-600 border-slate-200 hover:border-indigo-300 hover:text-indigo-600 bg-white")}
                >
                    Wszystkie
                </Button>
                {SERVICE_CATEGORIES.map(cat => (
                    <Button
                        key={cat}
                        variant={selectedCategory === cat ? "default" : "outline"}
                        onClick={() => setSelectedCategory(cat)}
                        className={cn("rounded-full h-9 px-4", selectedCategory === cat ? "bg-indigo-600 hover:bg-indigo-700 text-white" : "text-slate-600 border-slate-200 hover:border-indigo-300 hover:text-indigo-600 bg-white")}
                    >
                        {cat}
                    </Button>
                ))}
            </div>


            {/* GRID */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {filtered.map((pkg) => (
                    <Card key={pkg.id} className="flex flex-col border-slate-200 hover:border-indigo-300 transition-all hover:shadow-lg group bg-white h-full">
                        <CardHeader>
                            {/* Author Badge for Student Services */}
                            {!pkg.is_system && pkg.profiles && pkg.student_id && (
                                <Link href={`/app/students/${pkg.student_id}`} className="mb-3 flex items-center gap-2 text-xs text-slate-500 bg-slate-50 p-2 rounded-lg w-fit border border-slate-100 hover:bg-slate-100 hover:border-slate-300 transition-all cursor-pointer">
                                    <div className="h-6 w-6 rounded-full bg-slate-200 overflow-hidden relative">
                                        {pkg.profiles.avatar_url ? (
                                            <img src={pkg.profiles.avatar_url} alt="Avatar" className="object-cover w-full h-full" />
                                        ) : (
                                            <User className="h-3 w-3 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-slate-400" />
                                        )}
                                    </div>
                                    <span className="font-medium text-slate-700">{pkg.profiles.imie} {pkg.profiles.nazwisko}</span>
                                </Link>
                            )}

                            {pkg.is_system && (
                                <Badge variant="secondary" className="w-fit mb-3 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border-indigo-100">
                                    <Sparkles className="mr-1 h-3 w-3" /> Systemowy
                                </Badge>
                            )}

                            <CardTitle className="text-lg leading-tight group-hover:text-indigo-700 transition-colors min-h-[3.5rem] flex items-start">
                                {pkg.title}
                            </CardTitle>
                            <CardDescription className="line-clamp-3 min-h-[60px]">
                                {pkg.description}
                            </CardDescription>
                        </CardHeader>

                        <CardContent className="flex-1 space-y-4">
                            <Separator />
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div className="flex items-center gap-2 text-slate-600 bg-slate-50 p-2 rounded">
                                    <Clock className="h-4 w-4 text-slate-400" />
                                    <span>{pkg.delivery_time_days} dni</span>
                                </div>
                                <div className="flex items-center gap-2 text-slate-600 bg-slate-50 p-2 rounded justify-end min-w-[100px]">
                                    {pkg.price_max ? (
                                        <div className="flex flex-col items-end leading-none py-0.5">
                                            <span className="font-bold text-slate-900 text-sm whitespace-nowrap">{pkg.price} - {pkg.price_max} PLN</span>
                                            <span className="text-[10px] text-slate-400 font-medium">Szacowany budżet</span>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-end leading-none py-0.5">
                                            <span className="font-bold text-slate-900 text-base">{pkg.price} PLN</span>
                                            <span className="text-[10px] text-slate-400 font-medium">Szacowany budżet</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </CardContent>

                        <CardFooter className="p-4 pt-0">
                            {isCompany ? (
                                pkg.is_system ? (
                                    <Button asChild className="w-full shadow-sm bg-slate-900 hover:bg-slate-800 transition-all">
                                        <Link href={`/app/orders/create/${pkg.id}`}>Wybierz Pakiet</Link>
                                    </Button>
                                ) : (
                                    <Button
                                        className="w-full shadow-sm bg-amber-600 hover:bg-amber-700 text-white transition-all"
                                        onClick={() => {
                                            startTransition(async () => {
                                                try {
                                                    await createInquiryAction(pkg.id);
                                                    toast.success("Zapytanie wysłane! Sprawdź czat i pulpit zleceń.");
                                                } catch (err: any) {
                                                    console.error(err);
                                                    toast.error(err.message || "Wystąpił błąd");
                                                }
                                            });
                                        }}
                                        disabled={pending}
                                    >
                                        {pending ? "Przetwarzanie..." : "Zapytaj o wycenę"}
                                    </Button>
                                )
                            ) : (
                                <Button variant="outline" disabled className="w-full opacity-50">
                                    Tylko dla Firm
                                </Button>
                            )}
                        </CardFooter>
                    </Card>
                ))}

                {filtered.length === 0 && (
                    <div className="col-span-full py-20 text-center bg-slate-50 rounded-xl border border-dashed flex flex-col items-center justify-center gap-4">
                        <div className="h-16 w-16 bg-slate-100 rounded-full flex items-center justify-center">
                            {activeTab === "system" ? <Sparkles className="h-8 w-8 text-slate-400" /> : <Briefcase className="h-8 w-8 text-slate-400" />}
                        </div>
                        <div>
                            <h3 className="font-semibold text-lg text-slate-900">Brak dostępnych usług</h3>
                            <p className="text-slate-500">
                                {activeTab === "system"
                                    ? "Obecnie nie mamy aktywnych pakietów systemowych."
                                    : "Żaden student nie opublikował jeszcze swoich usług."}
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div >
    );
}
