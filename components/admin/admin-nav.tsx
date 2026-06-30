"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import {
  Activity,
  AlertTriangle,
  BookOpenText,
  CalendarRange,
  FileText,
  LayoutGrid,
  MoreHorizontal,
  ShieldCheck,
  Users,
  Wallet,
  Wrench,
  BriefcaseBusiness,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type AdminNavProps = {
  pathname: string | null;
  mobile?: boolean;
  onNavigate?: () => void;
  wrap?: boolean;
};

type AdminNavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

type AdminNavSection = {
  title: string;
  items: AdminNavItem[];
};

const ADMIN_NAV_SECTIONS: AdminNavSection[] = [
  {
    title: "Overview",
    items: [{ href: "/app/admin/analytics", label: "Analityka", icon: Activity }],
  },
  {
    title: "Marketplace",
    items: [
      { href: "/app/admin/offers", label: "Oferty", icon: LayoutGrid },
      { href: "/app/admin/users", label: "Uzytkownicy", icon: Users },
      { href: "/app/admin/contracts", label: "Kontrakty", icon: BriefcaseBusiness },
      { href: "/app/admin/disputes", label: "Spory", icon: AlertTriangle },
    ],
  },
  {
    title: "Finance",
    items: [
      { href: "/app/admin/finance/ledger", label: "Ksiega", icon: BookOpenText },
      { href: "/app/admin/finance/invoices", label: "Faktury", icon: FileText },
      { href: "/app/admin/ksef-sandbox", label: "KSeF Sandbox", icon: FileText },
      { href: "/app/admin/finance/periods", label: "Okresy", icon: CalendarRange },
      { href: "/app/admin/payouts", label: "Wyplaty", icon: Wallet },
      { href: "/app/admin/pit", label: "PIT", icon: FileText },
      { href: "/app/admin/exports", label: "Eksporty", icon: FileText },
    ],
  },
  {
    title: "Legal",
    items: [{ href: "/app/admin/vault", label: "Legal Vault", icon: ShieldCheck }],
  },
  {
    title: "Platform",
    items: [
      { href: "/app/admin/system-services", label: "Uslugi Systemowe", icon: Wrench },
    ],
  },
];

const DESKTOP_PRIMARY_HREFS = new Set([
  "/app/admin/analytics",
  "/app/admin/offers",
  "/app/admin/users",
  "/app/admin/contracts",
  "/app/admin/disputes",
  "/app/admin/finance/invoices",
  "/app/admin/ksef-sandbox",
  "/app/admin/payouts",
]);

function isPathActive(pathname: string | null, path: string) {
  return pathname === path || pathname?.startsWith(`${path}/`);
}

function AdminNavLink({
  href,
  children,
  icon: Icon,
  onClick,
  pathname,
  compact = false,
}: {
  href: string;
  children: ReactNode;
  icon?: LucideIcon;
  onClick?: () => void;
  pathname: string | null;
  compact?: boolean;
}) {
  const active = isPathActive(pathname, href);

  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        "relative flex shrink-0 items-center whitespace-nowrap rounded-xl font-bold leading-none transition-all duration-200",
        compact
          ? "gap-1.5 px-2.5 py-2 text-[12px]"
          : "gap-2 px-3 py-2.5 text-[13px]",
        active
          ? "border border-white/10 bg-white/16 text-white shadow-sm shadow-black/20"
          : "border border-transparent text-white/75 hover:border-white/8 hover:bg-white/10 hover:text-white",
      )}
    >
      {Icon ? (
        <Icon
          className={cn(
            "h-3.5 w-3.5 shrink-0 transition-colors",
            active ? "text-white" : "text-white/55",
          )}
        />
      ) : null}
      <span>{children}</span>
      {active ? (
        <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-indigo-400 rounded-full" />
      ) : null}
    </Link>
  );
}

function AdminNavMore({
  items,
  pathname,
  onNavigate,
  compact = false,
}: {
  items: AdminNavItem[];
  pathname: string | null;
  onNavigate?: () => void;
  compact?: boolean;
}) {
  if (items.length === 0) return null;

  const active = items.some((item) => isPathActive(pathname, item.href));

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={cn(
            "relative flex shrink-0 items-center whitespace-nowrap rounded-xl border font-bold leading-none transition-all duration-200",
            compact
              ? "gap-1.5 px-2.5 py-2 text-[12px]"
              : "gap-2 px-3 py-2.5 text-[13px]",
            active
              ? "border border-white/10 bg-white/16 text-white shadow-sm shadow-black/20"
              : "border-transparent text-white/75 hover:border-white/8 hover:bg-white/10 hover:text-white",
          )}
          aria-label="Pozostale sekcje panelu admina"
        >
          <MoreHorizontal
            className={cn(
              "h-3.5 w-3.5 shrink-0 transition-colors",
              active ? "text-white" : "text-white/55",
            )}
          />
          <span>Wiecej</span>
          {active ? (
            <span className="absolute bottom-0.5 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-indigo-400" />
          ) : null}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        sideOffset={8}
        className="z-[80] w-60 rounded-xl border border-white/10 bg-[#07142f] p-1.5 text-white shadow-[0_22px_60px_-30px_rgba(0,0,0,0.7)]"
      >
        {items.map((item) => {
          const Icon = item.icon;
          const itemActive = isPathActive(pathname, item.href);

          return (
            <DropdownMenuItem
              key={item.href}
              asChild
              className={cn(
                "cursor-pointer rounded-lg px-3 py-2.5 text-xs font-bold text-white/75 focus:bg-white/10 focus:text-white",
                itemActive && "bg-white/12 text-white",
              )}
            >
              <Link href={item.href} onClick={onNavigate}>
                <Icon
                  className={cn(
                    "h-3.5 w-3.5 shrink-0",
                    itemActive ? "text-white" : "text-white/55",
                  )}
                />
                <span>{item.label}</span>
              </Link>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function AdminNav({ pathname, mobile = false, onNavigate, wrap = false }: AdminNavProps) {
  if (mobile) {
    return (
      <>
        <div className="px-4 text-[10px] font-black text-white/30 uppercase tracking-[0.15em] mb-2 mt-1">
          Panel Admina
        </div>
        {ADMIN_NAV_SECTIONS.map((section) => (
          <div key={section.title} className="mb-3">
            <div className="px-4 pb-1 text-[10px] font-black text-white/20 uppercase tracking-[0.15em]">
              {section.title}
            </div>
            <div className="flex flex-col gap-1">
              {section.items.map((item) => (
                <AdminNavLink
                  key={item.href}
                  href={item.href}
                  icon={item.icon}
                  pathname={pathname}
                  onClick={onNavigate}
                >
                  {item.label}
                </AdminNavLink>
              ))}
            </div>
          </div>
        ))}
      </>
    );
  }

  const desktopItems = ADMIN_NAV_SECTIONS.flatMap((section) => section.items);
  const primaryItems = desktopItems.filter((item) => DESKTOP_PRIMARY_HREFS.has(item.href));
  const overflowItems = desktopItems.filter((item) => !DESKTOP_PRIMARY_HREFS.has(item.href));

  return (
    <div
      className={cn(
        "flex min-w-0 items-center gap-1 pr-1",
        wrap
          ? "w-full flex-wrap overflow-visible"
          : "overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
      )}
    >
      {primaryItems.map((item) => (
        <AdminNavLink
          key={item.href}
          href={item.href}
          icon={item.icon}
          pathname={pathname}
          onClick={onNavigate}
          compact={wrap}
        >
          {item.label}
        </AdminNavLink>
      ))}
      <AdminNavMore
        items={overflowItems}
        pathname={pathname}
        onNavigate={onNavigate}
        compact={wrap}
      />
    </div>
  );
}
