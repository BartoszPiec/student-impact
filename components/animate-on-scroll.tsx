"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface AnimateOnScrollProps {
    children: React.ReactNode;
    className?: string;
    delay?: number; // ms delay for stagger effect
}

export function AnimateOnScroll({ children, className, delay = 0 }: AnimateOnScrollProps) {
    const ref = useRef<HTMLDivElement>(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    // Apply delay for stagger effect
                    if (delay > 0) {
                        setTimeout(() => setIsVisible(true), delay);
                    } else {
                        setIsVisible(true);
                    }
                    observer.unobserve(el);
                }
            },
            {
                threshold: 0.08,
                rootMargin: "0px 0px -40px 0px",
            }
        );

        observer.observe(el);
        return () => observer.disconnect();
    }, [delay]);

    return (
        <div
            ref={ref}
            className={cn(
                "transition-all duration-700 ease-out",
                isVisible
                    ? "opacity-100 translate-y-0"
                    : "opacity-0 translate-y-8",
                className
            )}
        >
            {children}
        </div>
    );
}
