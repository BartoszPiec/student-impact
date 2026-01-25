"use client";

import { Button } from "@/components/ui/button";
import { useTransition } from "react";
import { withdrawApplication } from "./_actions";
import { useRouter } from "next/navigation";

export function WithdrawApplicationButton({ applicationId }: { applicationId: string }) {
    const [pending, startTransition] = useTransition();
    const router = useRouter();

    const handleWithdraw = () => {
        if (!confirm("Czy na pewno chcesz wycofać to zgłoszenie?")) return;

        startTransition(async () => {
            const result = await withdrawApplication(applicationId);
            if (result?.error) {
                alert(`Błąd: ${result.error}`);
            } else if (result?.success) {
                // Success
                router.refresh();
                // Force reload to be sure
                setTimeout(() => window.location.reload(), 300);
            }
        });
    };

    return (
        <Button
            variant="link"
            className="w-full text-red-400 hover:text-red-600 h-auto p-0 text-xs"
            onClick={handleWithdraw}
            disabled={pending}
        >
            {pending ? "Wycofywanie..." : "Wycofaj zgłoszenie"}
        </Button>
    );
}
