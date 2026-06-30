
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
    tourId?: string;
}

export function PremiumPageHeader({
    title,
    description,
    badge,
    icon,
    actions,
    children,
    className,
    tourId,
}: PremiumPageHeaderProps) {
    return (
        <div data-tour={tourId} className={cn(
            "relative mb-5 overflow-hidden border-b border-[#203a72] bg-[#10245f] pb-8 pt-7 text-white shadow-sm sm:mb-6 sm:pb-10 sm:pt-9",
            className
        )}>
            <div className="absolute inset-0 bg-[#10245f]" />

            <div className="container relative z-10 mx-auto max-w-[1380px] px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col items-stretch justify-between gap-6 md:flex-row md:items-center md:gap-8">
                <div className="flex min-w-0 flex-col items-start gap-5 text-left md:flex-row md:items-center md:gap-6">
                    {icon && (
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-lime-300/20 bg-lime-300/10 text-lime-200 shadow-sm backdrop-blur-xl transition-transform duration-300 sm:h-14 sm:w-14 [&_svg]:text-lime-200">
                            {/* Clone icon to enforce sizing/styling if needed, but usually passing it tailored is better. 
                   We assume the passed icon has appropriate classes or we wrap it. */}
                            <div className="text-lime-200">
                                {icon}
                            </div>
                        </div>
                    )}
                    <div className="min-w-0">
                        {badge && (
                            <div className="mb-2 flex items-center gap-2">
                                <span className="rounded-full border border-lime-300/20 bg-lime-300/10 px-3 py-1 text-xs font-bold uppercase tracking-normal text-lime-200 backdrop-blur-md">
                                    {badge}
                                </span>
                            </div>
                        )}
                        <h1 className="break-words text-3xl font-extrabold leading-tight tracking-normal text-white sm:text-4xl">
                            {title}
                        </h1>
                        {description && (
                            <p className="mt-2 max-w-xl text-sm font-semibold leading-6 text-white/75 sm:text-base">
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
        </div>
    );
}
