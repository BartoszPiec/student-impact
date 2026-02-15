"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FolderGit2, ChevronDown, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

interface Project {
    id: string;
    title: string;
    summary: string;
    link: string | null;
    created_at: string;
    company_id?: string;
}

function fmtDate(ts: string) {
    if (!ts) return "";
    const date = new Date(ts);
    return new Intl.DateTimeFormat("pl-PL", {
        day: "numeric",
        month: "short",
        year: "numeric",
    })
        .format(date)
        .toUpperCase();
}

export function StudentProjectsList({ projects }: { projects: Project[] }) {
    const [isExpanded, setIsExpanded] = useState(false);
    const visibleProjects = isExpanded ? projects : projects.slice(0, 2);

    if (projects.length === 0) return null;

    return (
        <div className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
                {visibleProjects.map((p) => {
                    const CardContentInner = (
                        <Card
                            className={`h-full border-slate-100 bg-white rounded-3xl transition-all duration-300 ${p.link
                                    ? "hover:shadow-xl hover:shadow-indigo-100/50 hover:-translate-y-1 hover:border-indigo-200 cursor-pointer group"
                                    : "cursor-default"
                                }`}
                        >
                            <CardHeader className="pb-3">
                                <div className="flex justify-between items-start gap-2">
                                    <CardTitle
                                        className={`text-lg font-bold text-slate-800 line-clamp-2 transition-colors ${p.link ? "group-hover:text-indigo-600" : ""
                                            }`}
                                    >
                                        {p.title || "Bez tytułu"}
                                    </CardTitle>
                                    <div
                                        className={`p-2 bg-slate-50 rounded-xl transition-colors ${p.link ? "group-hover:bg-indigo-50" : ""
                                            }`}
                                    >
                                        <FolderGit2
                                            className={`h-5 w-5 text-slate-400 transition-colors ${p.link ? "group-hover:text-indigo-500" : ""
                                                }`}
                                        />
                                    </div>
                                </div>
                                <div className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                                    {fmtDate(p.created_at)}
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <p className="text-sm text-slate-600 line-clamp-3 leading-relaxed">
                                    {p.summary || "Brak opisu."}
                                </p>

                                {/* Visual "Button" for affordance if linked */}
                                {p.link && (
                                    <div className="w-full py-2.5 px-4 rounded-xl bg-slate-100 text-slate-700 font-bold text-sm text-center transition-all shadow-sm group-hover:bg-indigo-600 group-hover:text-white flex items-center justify-center gap-2">
                                        Zobacz projekt <ExternalLink className="w-4 h-4" />
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    );

                    return p.link ? (
                        <Link key={p.id} href={p.link} className="block h-full">
                            {CardContentInner}
                        </Link>
                    ) : (
                        <div key={p.id} className="h-full">
                            {CardContentInner}
                        </div>
                    );
                })}
            </div>

            {!isExpanded && projects.length > 2 && (
                <div className="flex justify-center pt-2">
                    <Button
                        variant="outline"
                        className="rounded-full px-6 border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-indigo-600 transition-colors"
                        onClick={() => setIsExpanded(true)}
                    >
                        <ChevronDown className="mr-2 h-4 w-4" />
                        Zobacz wszystkie zrealizowane projekty ({projects.length})
                    </Button>
                </div>
            )}

            {isExpanded && projects.length > 2 && (
                <div className="flex justify-center pt-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="rounded-full text-slate-400 hover:text-slate-600"
                        onClick={() => setIsExpanded(false)}
                    >
                        Zwiń listę
                    </Button>
                </div>
            )}
        </div>
    );
}
