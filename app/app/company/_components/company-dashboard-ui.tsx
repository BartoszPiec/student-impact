import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type CompanyHeroProps = {
  title: string;
  description: string;
  badge?: string;
  icon: LucideIcon;
  actions?: ReactNode;
  children?: ReactNode;
  className?: string;
  tourId?: string;
};

export function CompanyHero({
  title,
  description,
  badge = "Panel firmy",
  icon: Icon,
  actions,
  children,
  className,
  tourId,
}: CompanyHeroProps) {
  return (
    <section data-tour={tourId} className={cn("border-b border-[#203a72] bg-[#10245f] text-white", className)}>
      <div className="mx-auto flex w-full max-w-[1380px] flex-col gap-5 px-4 py-7 sm:px-6 sm:py-9 lg:px-8">
        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
          <div className="flex min-w-0 items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-lime-300/20 bg-lime-300/10 text-lime-200 shadow-sm">
              <Icon className="h-6 w-6" />
            </div>
            <div className="min-w-0">
              <div className="mb-2 inline-flex rounded-full border border-lime-300/20 bg-lime-300/10 px-3 py-1 text-[10px] font-extrabold uppercase text-lime-100">
                {badge}
              </div>
              <h1 className="max-w-3xl text-3xl font-extrabold leading-tight text-white sm:text-4xl">
                {title}
              </h1>
              <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-white/75 sm:text-base">
                {description}
              </p>
            </div>
          </div>
          {actions ? <div className="flex shrink-0 flex-col gap-2 sm:flex-row sm:items-center">{actions}</div> : null}
        </div>
        {children}
      </div>
    </section>
  );
}

export function CompanyLightHero({
  title,
  description,
  badge = "Panel firmy - katalog uslug",
  children,
}: {
  title: string;
  description: string;
  badge?: string;
  children?: ReactNode;
}) {
  return (
    <section className="relative overflow-hidden border-b border-slate-200 bg-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_72%_30%,rgba(190,242,100,0.34),transparent_32%),linear-gradient(180deg,#ffffff_0%,#f7f9fd_100%)]" />
      <div className="relative mx-auto w-full max-w-[1380px] px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        <div className="max-w-4xl">
          <div className="mb-4 inline-flex rounded-full border border-lime-200 bg-lime-50 px-3 py-1 text-[10px] font-extrabold uppercase text-[#10245f]">
            {badge}
          </div>
          <h1 className="max-w-4xl text-3xl font-extrabold leading-tight text-[#10245f] sm:text-5xl">
            {title}
          </h1>
          <p className="mt-3 max-w-2xl text-sm font-semibold leading-6 text-slate-600 sm:text-base">
            {description}
          </p>
        </div>
        {children}
      </div>
    </section>
  );
}

export function CompanyStatCard({
  icon: Icon,
  value,
  label,
  tone = "lime",
}: {
  icon: LucideIcon;
  value: ReactNode;
  label: string;
  tone?: "lime" | "blue" | "amber" | "emerald" | "slate";
}) {
  const toneClass =
    tone === "blue"
      ? "bg-indigo-50 text-indigo-700"
      : tone === "amber"
        ? "bg-amber-50 text-amber-700"
        : tone === "emerald"
          ? "bg-emerald-50 text-emerald-700"
          : tone === "slate"
            ? "bg-slate-100 text-slate-700"
            : "bg-lime-100 text-[#10245f]";

  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
      <div className="flex items-center gap-3">
        <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-xl", toneClass)}>
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <div className="text-2xl font-extrabold leading-none text-[#10245f]">{value}</div>
          <div className="mt-1 text-xs font-bold text-slate-500">{label}</div>
        </div>
      </div>
    </div>
  );
}

export function CompanyPanel({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("rounded-2xl border border-slate-200 bg-white shadow-sm", className)}>
      {children}
    </div>
  );
}

export function CompanyPill({
  children,
  active,
  tone = "slate",
  className,
}: {
  children: ReactNode;
  active?: boolean;
  tone?: "lime" | "blue" | "amber" | "emerald" | "slate";
  className?: string;
}) {
  const activeClass =
    tone === "lime"
      ? "border-lime-300 bg-lime-200 text-[#10245f]"
      : tone === "blue"
        ? "border-indigo-200 bg-indigo-600 text-white"
        : tone === "amber"
          ? "border-amber-200 bg-amber-50 text-amber-800"
          : tone === "emerald"
            ? "border-emerald-200 bg-emerald-600 text-white"
            : "border-slate-300 bg-slate-900 text-white";

  return (
    <span
      className={cn(
        "inline-flex min-h-8 items-center justify-center rounded-full border px-3 py-1 text-xs font-extrabold transition",
        active ? activeClass : "border-slate-200 bg-white text-slate-600",
        className,
      )}
    >
      {children}
    </span>
  );
}
