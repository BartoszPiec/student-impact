
import React from "react";
import { cn } from "@/lib/utils";

interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
}

export function PageContainer({ children, className }: PageContainerProps) {
  return (
    <div className={cn(
      "mx-auto w-full max-w-[2000px] px-4 sm:px-6 lg:px-8 xl:px-12",
      className
    )}>
      {children}
    </div>
  );
}
