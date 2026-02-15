
"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface PremiumPageHeaderProps {
    title: string;
    description?: string;
    badge?: string;
    icon?: React.ReactNode;
    actions?: React.ReactNode;
    children?: React.ReactNode;
    className?: string;
}

export function PremiumPageHeader({
    title,
    description,
    badge,
    icon,
    actions,
    children,
    className,
}: PremiumPageHeaderProps) {
    return (
        <div className={cn("relative rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 px-8 py-12 text-white shadow-xl overflow-hidden mb-8", className)}>
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>

            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                <div className="flex flex-col md:flex-row items-center gap-6 text-center md:text-left">
                    {icon && (
                        <div className="h-20 w-20 bg-white/10 backdrop-blur-xl rounded-2xl flex items-center justify-center border border-white/20 shadow-2xl group hover:scale-105 transition-transform duration-500 shrink-0">
                            {/* Clone icon to enforce sizing/styling if needed, but usually passing it tailored is better. 
                   We assume the passed icon has appropriate classes or we wrap it. */}
                            <div className="text-indigo-300 drop-shadow-[0_0_8px_rgba(165,180,252,0.5)]">
                                {icon}
                            </div>
                        </div>
                    )}
                    <div>
                        {badge && (
                            <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
                                <span className="px-3 py-1 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-full text-xs font-bold uppercase tracking-wider backdrop-blur-md">
                                    {badge}
                                </span>
                            </div>
                        )}
                        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-white via-indigo-100 to-indigo-300 bg-clip-text text-transparent">
                            {title}
                        </h1>
                        {description && (
                            <p className="text-indigo-100/70 mt-2 max-w-xl text-lg font-medium">
                                {description}
                            </p>
                        )}
                        {children}
                    </div>
                </div>

                {actions && (
                    <div className="flex items-center gap-4">
                        {actions}
                    </div>
                )}
            </div>

            {/* Decorative elements */}
            <div className="absolute right-0 top-0 -mt-20 -mr-20 h-80 w-80 rounded-full bg-indigo-500/10 blur-[100px] pointer-events-none"></div>
            <div className="absolute left-1/4 bottom-0 -mb-20 h-60 w-60 rounded-full bg-violet-500/10 blur-[80px] pointer-events-none"></div>
        </div>
    );
}
