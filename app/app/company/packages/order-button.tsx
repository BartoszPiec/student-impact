"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { createOfferFromPackage } from "./_actions";
import { Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";

export default function OrderButton({ packageId, label, variant = "default", className }: { packageId: string, label: string, variant?: "default" | "outline" | "secondary" | "destructive" | "ghost" | "link", className?: string }) {
    const [loading, setLoading] = useState(false);

    const handleClick = async () => {
        try {
            setLoading(true);
            await createOfferFromPackage(packageId);
        } catch (error) {
            console.error(error);
            setLoading(false);
            setLoading(false);
            // Show the actual error message
            alert(`Wystąpił błąd: ${error instanceof Error ? error.message : "Nieznany błąd"}`);
        }
    };

    return (
        <Button
            onClick={handleClick}
            disabled={loading}
            variant={variant}
            className={cn("w-full mt-4", className)}
        >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {label}
        </Button>
    );
}
