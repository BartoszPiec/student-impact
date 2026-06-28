import Link from "next/link";

import { cn } from "@/lib/utils";

type Student2WorkBrandProps = {
  href?: string;
  className?: string;
  markClassName?: string;
  textClassName?: string;
  compact?: boolean;
  onClick?: () => void;
};

function BrandContent({
  className,
  markClassName,
  textClassName,
  compact = false,
}: Omit<Student2WorkBrandProps, "href" | "onClick">) {
  return (
    <span className={cn("flex min-w-0 items-center gap-2.5", className)}>
      <span
        className={cn(
          "flex shrink-0 items-center justify-center rounded-xl bg-[#193466] shadow-[inset_0_1px_0_rgba(255,255,255,0.18)] ring-1 ring-lime-300/20",
          compact ? "h-8 w-8" : "h-9 w-9",
          markClassName,
        )}
      >
        <span className={cn("font-black text-[#c5fb37]", compact ? "text-[11px]" : "text-xs")}>
          S2
        </span>
      </span>
      <span
        className={cn(
          "truncate font-black leading-none tracking-normal text-white",
          compact ? "text-sm" : "text-base",
          textClassName,
        )}
      >
        Student<span className="text-[#c5fb37]">2</span>Work
      </span>
    </span>
  );
}

export function Student2WorkBrand({
  href,
  onClick,
  ...props
}: Student2WorkBrandProps) {
  if (!href) {
    return <BrandContent {...props} />;
  }

  return (
    <Link href={href} onClick={onClick} className="min-w-0 shrink-0">
      <BrandContent {...props} />
    </Link>
  );
}
