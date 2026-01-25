"use client";

import { useState } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Package, Briefcase, LayoutGrid } from "lucide-react";
import JobsTab from "./jobs-tab";
import ServicesTab from "./services-tab";

interface OffersTabsProps {
    jobs: any[];
    systemServices: any[];
    studentServices: any[];
    statsMap: any;
}

export default function OffersTabs({ jobs, systemServices, studentServices, statsMap }: OffersTabsProps) {
    const [activeTab, setActiveTab] = useState("jobs");

    // Auto-switch to "all" or specific logic? 
    // The previous design had "all", "jobs", "services".
    // Let's keep it simple: "jobs" or "services".
    // Or emulate the "All", "Jobs", "Services" tabs from previous design if desired.
    // The previous design had 3 filters: All, Jobs, Services.
    // But conceptually: All = Jobs + Services.
    // Let's implement the 3 filters as requested in previous design, but backed by clear prop passing.

    const [categoryTab, setCategoryTab] = useState("all");

    return (
        <div className="space-y-6">
            <Tabs value={categoryTab} onValueChange={setCategoryTab} className="w-full">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-8">
                    <TabsList className="grid w-full grid-cols-3 md:w-[650px] bg-slate-100/80 p-1.5 rounded-2xl h-auto backdrop-blur-sm border border-slate-200/50 shadow-inner">
                        <TabsTrigger
                            value="all"
                            className="gap-2 rounded-xl py-3 data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:text-indigo-600 font-bold transition-all duration-300"
                        >
                            <LayoutGrid className="h-4.5 w-4.5" /> Wszystkie
                        </TabsTrigger>
                        <TabsTrigger
                            value="jobs"
                            className="gap-2 rounded-xl py-3 data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:text-indigo-600 font-bold transition-all duration-300"
                        >
                            <Briefcase className="h-4.5 w-4.5" /> Ogłoszenia
                        </TabsTrigger>
                        <TabsTrigger
                            value="services"
                            className="gap-2 rounded-xl py-3 data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:text-indigo-600 font-bold transition-all duration-300"
                        >
                            <Package className="h-4.5 w-4.5" /> Usługi ({systemServices.length + studentServices.length})
                        </TabsTrigger>
                    </TabsList>

                    <div className="px-5 py-2.5 bg-indigo-50 rounded-full border border-indigo-100/50 hidden md:block">
                        <p className="text-sm font-bold text-indigo-700">
                            Dostępne zasoby: <span className="text-indigo-900 ml-1">{jobs.length + systemServices.length + studentServices.length}</span>
                        </p>
                    </div>
                </div>

                {/* 
                    Logic:
                    If 'all', show everything? Or create a combined view?
                    Previously 'all' meant showing Jobs in 'All' categories?
                    Wait, previous implementation:
                    - 'all': Showed Jobs only? 
                    Actually, if categoryTab == 'all', it just filtered out services? 
                    Line 32 in previous file:
                    if (categoryTab === "all") return true; 
                    if (categoryTab === "jobs") return true;
                    if (categoryTab === "services") return false; (this filtered OUT offers for services tab?)
                    
                    The implementation was a bit confused.
                    Let's standardise:
                    - Jobs Tab: Show Jobs.
                    - Services Tab: Show Services (System + Student).
                    - All Tab: Show Jobs (maybe?). Services have a different card format, so mixing them might be ugly.
                    
                    Given the request "rozdzielenie", let's treat "All" as potentially just "Jobs" (default) or redirecting to Jobs.
                    Actually, "Zlecone zadania" is Jobs.
                    "Zlecane Usługi" is Services.
                    "Wszystkie Ogłoszenia" -> usually implies everything.
                    
                    But mixing OfferCard and ServiceCard in one list is tricky.
                    Let's assume "All" displays Jobs, and user clicks "Services" for Services independently.
                    Or better:
                    If tab is 'services', show ServicesTab.
                    If tab is 'jobs' OR 'all', show JobsTab.
                */}

                {categoryTab === 'services' ? (
                    <ServicesTab systemServices={systemServices} studentServices={studentServices} statsMap={statsMap} />
                ) : (
                    <JobsTab offers={jobs} statsMap={statsMap} />
                )}
            </Tabs>
        </div>
    );
}
