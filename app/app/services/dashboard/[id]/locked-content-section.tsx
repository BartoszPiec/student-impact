"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Lock, ChevronDown, ChevronUp } from "lucide-react";

export default function LockedContentSection({ content }: { content: string }) {
    const [isExpanded, setIsExpanded] = useState(true);

    return (
        <Card className="border-indigo-200 bg-indigo-50/30">
            <CardContent className="p-6 space-y-4">
                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="w-full flex items-center justify-between text-left"
                >
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                        <Lock className="w-5 h-5 text-indigo-600" />
                        Instrukcje wewnętrzne
                    </h2>
                    {isExpanded ? (
                        <ChevronUp className="w-5 h-5 text-slate-400" />
                    ) : (
                        <ChevronDown className="w-5 h-5 text-slate-400" />
                    )}
                </button>

                <p className="text-xs text-indigo-600 font-medium">
                    Materiały dla Wykonawcy — widoczne tylko po przyjęciu zlecenia
                </p>

                {isExpanded && (
                    <div className="bg-white p-5 rounded-xl border border-indigo-100 text-sm text-slate-700 whitespace-pre-wrap leading-relaxed animate-in fade-in duration-300">
                        {content}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
