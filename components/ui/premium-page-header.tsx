
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
        <div className={cn(
            "relative mb-6 overflow-hidden border-b border-white/5 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 pb-10 pt-8 text-white shadow-xl sm:mb-8 sm:pb-12 sm:pt-10",
            className
        )}>
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>

            <div className="container mx-auto max-w-[2000px] px-4 sm:px-6 lg:px-8 xl:px-12 relative z-10">
                <div className="flex flex-col items-stretch justify-between gap-6 md:flex-row md:items-center md:gap-8">
                <div className="flex min-w-0 flex-col items-start gap-5 text-left md:flex-row md:items-center md:gap-6">
                    {icon && (
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-white/20 bg-white/10 shadow-2xl backdrop-blur-xl transition-transform duration-500 group hover:scale-105 sm:h-20 sm:w-20">
                            {/* Clone icon to enforce sizing/styling if needed, but usually passing it tailored is better. 
                   We assume the passed icon has appropriate classes or we wrap it. */}
                            <div className="text-indigo-300 drop-shadow-[0_0_8px_rgba(165,180,252,0.5)]">
                                {icon}
                            </div>
                        </div>
                    )}
                    <div className="min-w-0">
                        {badge && (
                            <div className="mb-2 flex items-center gap-2">
                                <span className="px-3 py-1 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-full text-xs font-bold uppercase tracking-wider backdrop-blur-md">
                                    {badge}
                                </span>
                            </div>
                        )}
                        <h1 className="break-words bg-gradient-to-r from-white via-indigo-100 to-indigo-300 bg-clip-text text-2xl font-extrabold tracking-tight text-transparent sm:text-3xl md:text-4xl">
                            {title}
                        </h1>
                        {description && (
                            <p className="mt-2 max-w-xl text-sm font-medium leading-6 text-indigo-100/70 sm:text-lg">
                                {description}
                            </p>
                        )}
                        {children}
                    </div>
                </div>

                {actions && (
                    <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center sm:gap-4">
                        {actions}
                    </div>
                )}
                </div>
            </div>

            {/* Decorative elements */}
            <div className="absolute right-0 top-0 -mt-20 -mr-20 h-80 w-80 rounded-full bg-indigo-500/10 blur-[100px] pointer-events-none"></div>
            <div className="absolute left-1/4 bottom-0 -mb-20 h-60 w-60 rounded-full bg-violet-500/10 blur-[80px] pointer-events-none"></div>
        </div>
    );
}
