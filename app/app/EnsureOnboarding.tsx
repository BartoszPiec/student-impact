"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

export function EnsureOnboarding() {
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        // Jeśli jesteśmy już na onboardingu LUB PROFILU, nie rób nic
        if (pathname?.includes("/onboarding") || pathname?.includes("/profile")) return;

        // W przeciwnym razie przekieruj
        router.replace("/app/onboarding");
    }, [pathname, router]);

    return null;
}
