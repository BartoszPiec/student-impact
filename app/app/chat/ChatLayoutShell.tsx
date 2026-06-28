"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

export function ChatLayoutShell({
  sidebar,
  children,
}: {
  sidebar: ReactNode;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const isInboxRoute = pathname === "/app/chat";

  return (
    <div
      className={cn(
        "mx-auto flex min-h-[calc(100dvh-5rem)] w-full max-w-[1380px] flex-col overflow-x-hidden bg-[#f3f6fb] lg:h-[calc(100vh-6rem)] lg:flex-row",
      )}
    >
      <div
        className={cn(
          "flex-none border-b border-slate-200 lg:h-full lg:border-b-0",
          isInboxRoute ? "hidden lg:block" : "block",
        )}
      >
        {sidebar}
      </div>

      <main
        className={cn(
          "relative w-full min-w-0 flex-1",
          isInboxRoute ? "min-h-[calc(100dvh-9rem)] overflow-hidden lg:min-h-0" : "min-h-[calc(100dvh-9rem)] lg:min-h-0",
        )}
      >
        {children}
      </main>
    </div>
  );
}
