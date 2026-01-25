"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { resetServices } from "./_actions";
import { RefreshCw } from "lucide-react";

export default function ResetCatalogButton() {
    const [isPending, startTransition] = useTransition();

    return (
        <Button
            variant="destructive"
            size="sm"
            onClick={() => startTransition(() => resetServices())}
            disabled={isPending}
            className="bg-red-600 text-white hover:bg-red-700 shadow-sm"
        >
            <RefreshCw className={`mr-2 h-4 w-4 ${isPending ? 'animate-spin' : ''}`} />
            {isPending ? "Resetowanie..." : "Napraw Katalog (Reset Services)"}
        </Button>
    );
}
