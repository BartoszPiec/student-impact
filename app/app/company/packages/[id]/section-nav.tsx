"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import {
    Lightbulb,
    Sparkles,
    Package,
    BarChart3,
    FileText,
    ShieldAlert,
    Timer,
    CheckCircle2,
    type LucideIcon
} from "lucide-react";

// ── Types ────────────────────────────────────────────────────

interface SectionNavItem {
    id: string;
    title: string;
    type: string;
}

interface SectionNavProps {
    sections: SectionNavItem[];
    gradient: string;
}

// ── Icon map (client-side, not serialized from server) ───────

const SECTION_ICONS: Record<string, LucideIcon> = {
    intro: Lightbulb,
    features: Sparkles,
    pricing: Package,
    comparison: BarChart3,
    requirements: FileText,
    exclusions: ShieldAlert,
    process: Timer,
    deliverables: CheckCircle2,
    default: FileText,
};

// ── Component ────────────────────────────────────────────────

export function SectionNav({ sections, gradient }: SectionNavProps) {
    const [activeSection, setActiveSection] = useState<string>(sections[0]?.id ?? "");

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                for (const entry of entries) {
                    if (entry.isIntersecting) {
                        setActiveSection(entry.target.id);
                    }
                }
            },
            {
                rootMargin: "-120px 0px -60% 0px",
                threshold: 0,
            }
        );

        sections.forEach(({ id }) => {
            const el = document.getElementById(id);
            if (el) observer.observe(el);
        });

        return () => observer.disconnect();
    }, [sections]);

    function handleScrollTo(sectionId: string) {
        const el = document.getElementById(sectionId);
        if (!el) return;
        const offset = 120;
        const top = el.getBoundingClientRect().top + window.scrollY - offset;
        window.scrollTo({ top, behavior: "smooth" });
    }

    if (sections.length === 0) return null;

    return (
        <div className="sticky top-16 z-40 bg-white/95 backdrop-blur-xl border-b border-slate-200/60 shadow-md">
            <div className="max-w-[1600px] mx-auto px-6 sm:px-8 lg:px-10">
                <div className="flex items-center gap-2 py-3 overflow-x-auto scrollbar-hide">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mr-2 shrink-0 hidden sm:block">
                        Przejdź do:
                    </span>
                    <div className="flex items-center gap-2 lg:flex-wrap w-max lg:w-full">
                        {sections.map((section, index) => {
                            const Icon = SECTION_ICONS[section.type] || SECTION_ICONS.default;
                            const isActive = activeSection === section.id;

                            return (
                                <button
                                    key={section.id}
                                    onClick={() => handleScrollTo(section.id)}
                                    className={cn(
                                        "group relative inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all duration-300 cursor-pointer shrink-0",
                                        isActive
                                            ? `bg-gradient-to-r ${gradient} text-white shadow-lg shadow-indigo-500/25 scale-[1.03]`
                                            : "bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900 hover:shadow-sm border border-slate-200/60 hover:border-slate-300"
                                    )}
                                >
                                    <Icon className={cn(
                                        "w-4 h-4 transition-transform duration-300",
                                        isActive ? "" : "group-hover:scale-110"
                                    )} />
                                    <span>{section.title}</span>
                                    {isActive && (
                                        <span className="absolute -bottom-[8px] left-1/2 -translate-x-1/2 w-3 h-3 bg-white border-l border-b border-slate-200/60 rotate-[-45deg] scale-0 lg:scale-100 transition-transform hidden lg:block" />
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}
