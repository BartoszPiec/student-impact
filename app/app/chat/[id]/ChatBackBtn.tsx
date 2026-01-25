"use client";

import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export function ChatBackBtn() {
    const router = useRouter();

    return (
        <Button
            variant="ghost"
            size="icon"
            className="mr-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100/50"
            onClick={() => router.back()}
            title="Wróć"
        >
            <ArrowLeft className="h-5 w-5" />
        </Button>
    );
}
