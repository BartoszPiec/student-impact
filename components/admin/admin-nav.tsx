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
  ShieldCheck,
  Users,
  Wallet,
  Wrench,
  BriefcaseBusiness,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

type AdminNavProps = {
  pathname: string | null;
  mobile?: boolean;
  onNavigate?: () => void;
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

function isPathActive(pathname: string | null, path: string) {
  return pathname === path || pathname?.startsWith(`${path}/`);
}

function AdminNavLink({
  href,
  children,
  icon: Icon,
  onClick,
  pathname,
}: {
  href: string;
  children: ReactNode;
  icon?: LucideIcon;
  onClick?: () => void;
  pathname: string | null;
}) {
  const active = isPathActive(pathname, href);

  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        "relative flex shrink-0 items-center gap-2 whitespace-nowrap rounded-xl px-3 py-2.5 text-[13px] font-bold leading-none transition-all duration-200",
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

export function AdminNav({ pathname, mobile = false, onNavigate }: AdminNavProps) {
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

  return (
    <div className="flex min-w-0 items-center gap-1 overflow-x-auto pr-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {ADMIN_NAV_SECTIONS.flatMap((section) => section.items).map((item) => (
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
  );
}
