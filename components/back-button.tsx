"use client";

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

interface BackButtonProps {
    label?: string;
    fallbackUrl?: string; // Optional fallback if history is empty (though router.back relies on browser history)
    className?: string;
    variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
}

export default function BackButton({
    label = "Wróć",
    fallbackUrl = "/app",
    className,
    variant = "ghost"
}: BackButtonProps) {
    const router = useRouter();

    const handleBack = () => {
        if (window.history.length > 2) {
            router.back();
        } else {
            // If opened directly or no history, go fallback
            router.push(fallbackUrl);
        }
    };

    return (
        <Button
            variant={variant}
            onClick={handleBack}
            className={className || "text-white hover:bg-white/20 hover:text-white"}
        >
            <ArrowLeft className="mr-2 h-4 w-4" />
            {label}
        </Button>
    );
}
