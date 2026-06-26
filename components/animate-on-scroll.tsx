"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface AnimateOnScrollProps {
    children: React.ReactNode;
    className?: string;
    delay?: number; // ms delay for stagger effect
    direction?: "up" | "left" | "right" | "none";
    amount?: number;
}

const hiddenByDirection: Record<NonNullable<AnimateOnScrollProps["direction"]>, string> = {
    up: "opacity-0 translate-y-8",
    left: "opacity-0 -translate-x-8",
    right: "opacity-0 translate-x-8",
    none: "opacity-0",
};

export function AnimateOnScroll({
    children,
    className,
    delay = 0,
    direction = "up",
    amount = 0.12,
}: AnimateOnScrollProps) {
    const ref = useRef<HTMLDivElement>(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        let timer: ReturnType<typeof setTimeout> | undefined;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    // Apply delay for stagger effect
                    if (delay > 0) {
                        timer = setTimeout(() => setIsVisible(true), delay);
                    } else {
                        setIsVisible(true);
                    }
                    observer.unobserve(el);
                }
            },
            {
                threshold: amount,
                rootMargin: "0px 0px -40px 0px",
            }
        );

        observer.observe(el);
        return () => {
            observer.disconnect();
            if (timer) {
                clearTimeout(timer);
            }
        };
    }, [amount, delay]);

    return (
        <div
            ref={ref}
            className={cn(
                "transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] max-sm:translate-x-0 max-sm:translate-y-0 max-sm:opacity-100 motion-reduce:transform-none motion-reduce:transition-none",
                isVisible
                    ? "opacity-100 translate-x-0 translate-y-0"
                    : hiddenByDirection[direction],
                className
            )}
        >
            {children}
        </div>
    );
}
