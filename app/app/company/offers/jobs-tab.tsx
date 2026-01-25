"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import OfferCard from "./offer-card";

interface JobsTabProps {
    offers: any[];
    statsMap: any;
}

export default function JobsTab({ offers, statsMap }: JobsTabProps) {
    const [statusTab, setStatusTab] = useState("in_progress");

    // Group by Status
    const published = offers.filter(o => (o.status ?? "published") === "published");
    const inProgress = offers.filter(o => o.status === "in_progress");
    const closed = offers.filter(o => o.status === "closed");

    return (
        <div className="space-y-8">
            <Tabs value={statusTab} onValueChange={setStatusTab} className="w-full">
                <TabsList className="mb-6 bg-transparent border-b border-slate-200 w-full justify-start h-auto p-0 rounded-none space-x-6">
                    <TabsTrigger value="in_progress" className="px-0 pb-3 rounded-none border-b-2 border-transparent data-[state=active]:border-indigo-600 data-[state=active]:text-indigo-600 data-[state=active]:shadow-none bg-transparent hover:text-slate-800 transition-colors">
                        W trakcie <span className="ml-2 bg-slate-100 text-slate-600 py-0.5 px-2 rounded-full text-xs">{inProgress.length}</span>
                    </TabsTrigger>
                    <TabsTrigger value="published" className="px-0 pb-3 rounded-none border-b-2 border-transparent data-[state=active]:border-indigo-600 data-[state=active]:text-indigo-600 data-[state=active]:shadow-none bg-transparent hover:text-slate-800 transition-colors">
                        Opublikowane <span className="ml-2 bg-slate-100 text-slate-600 py-0.5 px-2 rounded-full text-xs">{published.length}</span>
                    </TabsTrigger>
                    <TabsTrigger value="closed" className="px-0 pb-3 rounded-none border-b-2 border-transparent data-[state=active]:border-indigo-600 data-[state=active]:text-indigo-600 data-[state=active]:shadow-none bg-transparent hover:text-slate-800 transition-colors">
                        Zakończone <span className="ml-2 bg-slate-100 text-slate-600 py-0.5 px-2 rounded-full text-xs">{closed.length}</span>
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="in_progress" className="space-y-4">
                    {inProgress.length === 0 ? (
                        <div className="text-sm text-muted-foreground p-12 text-center border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                            Brak ofert w trakcie realizacji.
                        </div>
                    ) : (
                        inProgress.map(o => (
                            <OfferCard key={o.id} o={o} stats={statsMap[o.id]} />
                        ))
                    )}
                </TabsContent>

                <TabsContent value="published" className="space-y-4">
                    {published.length === 0 ? (
                        <div className="text-sm text-muted-foreground p-12 text-center border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                            Brak opublikowanych ofert.
                        </div>
                    ) : (
                        published.map(o => (
                            <OfferCard key={o.id} o={o} stats={statsMap[o.id]} />
                        ))
                    )}
                </TabsContent>

                <TabsContent value="closed" className="space-y-4">
                    {closed.length === 0 ? (
                        <div className="text-sm text-muted-foreground p-12 text-center border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                            Brak zakończonych ofert.
                        </div>
                    ) : (
                        closed.map(o => (
                            <OfferCard key={o.id} o={o} stats={statsMap[o.id]} />
                        ))
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
}
