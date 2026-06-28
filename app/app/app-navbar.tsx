"use client";

import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import dynamic from "next/dynamic";
import {
  Briefcase,
  ChevronDown,
  CircleDollarSign,
  CircleHelp,
  FileText,
  LayoutGrid,
  LogOut,
  Menu,
  MessageSquare,
  Plus,
  Search,
  Settings,
  Star,
  User,
  WalletCards,
  type LucideIcon,
} from "lucide-react";

import { AdminNav } from "@/components/admin/admin-nav";
import { Student2WorkBrand } from "@/components/student2work-brand";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { useAppTour } from "@/components/app-tour/app-tour-provider";
import { signOut } from "./_actions/auth";

const NotificationsBell = dynamic<NotificationsBellProps>(() => import("@/components/notifications-bell"));
const UnreadChatBadge = dynamic(() =>
  import("./_components/UnreadChatBadge").then((module) => module.UnreadChatBadge),
);

type AppNavbarUser = {
  id: string;
  email?: string | null;
};

interface AppNavbarProps {
  user: AppNavbarUser | null;
  role: string | null;
  unread: number;
  unreadChat?: number;
}

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  chat?: boolean;
  tourId?: string;
};

type MobileAction = {
  href: string;
  label: string;
  icon: LucideIcon;
  tourId?: string;
};

type NotificationsBellProps = {
  unread: number;
  triggerClassName?: string;
  badgeClassName?: string;
};

function isPathActive(pathname: string | null, path: string) {
  return pathname === path || pathname?.startsWith(`${path}/`);
}

function getRoleLabel(role: string | null) {
  if (role === "company") return "Firma";
  if (role === "admin") return "Admin";
  return "Student";
}

function getDisplayName(user: AppNavbarUser | null, role: string | null) {
  if (!user?.email) {
    return role === "company" ? "LOOB" : "Bartosz";
  }

  const [localPart] = user.email.split("@");
  const cleaned = localPart.replace(/[._-]+/g, " ").trim();

  if (!cleaned) {
    return role === "company" ? "Firma" : "Student";
  }

  return cleaned
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(" ");
}

function getInitials(name: string, role: string | null) {
  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");

  if (initials) {
    return initials;
  }

  return role === "company" ? "L" : "BP";
}

function getHomeHref(role: string | null) {
  if (role === "student") return "/app/jobs";
  if (role === "company") return "/app/company/packages";
  if (role === "admin") return "/app/admin";
  return "/app";
}

function getDesktopNavItems(role: string | null): NavItem[] {
  if (role === "company") {
    return [
      { href: "/app/company/packages", label: "Katalog", icon: Search, tourId: "company-catalog" },
      { href: "/app/company/offers", label: "Ogłoszenia", icon: LayoutGrid, tourId: "company-offers" },
      { href: "/app/company/documents", label: "Dokumenty", icon: FileText },
      { href: "/app/company/orders", label: "Zamówienia", icon: Briefcase, tourId: "company-orders" },
    ];
  }

  if (role === "student") {
    return [
      { href: "/app/jobs", label: "Giełda Zleceń", icon: Search, tourId: "student-jobs" },
      { href: "/app/applications", label: "Aplikacje", icon: FileText, tourId: "student-applications" },
      { href: "/app/services/my", label: "Usługi", icon: Briefcase, tourId: "student-services" },
      { href: "/app/finances", label: "Finanse", icon: CircleDollarSign },
      { href: "/app/chat", label: "Wiadomości", icon: MessageSquare, chat: true, tourId: "student-chat" },
    ];
  }

  return [
    { href: "/app", label: "Start", icon: LayoutGrid },
    { href: "/app/chat", label: "Wiadomości", icon: MessageSquare, chat: true },
    { href: "/app/profile", label: "Profil", icon: User },
  ];
}

function getMobileItems(role: string | null): { left: NavItem[]; right: NavItem[]; action: MobileAction } {
  if (role === "company") {
    return {
      left: [
        { href: "/app/company/packages", label: "Katalog", icon: Search, tourId: "company-catalog" },
        { href: "/app/company/offers", label: "Oferty", icon: LayoutGrid, tourId: "company-offers" },
      ],
      right: [
        { href: "/app/company/orders", label: "Zamówienia", icon: Briefcase, tourId: "company-orders" },
        { href: "/app/profile", label: "Profil", icon: User },
      ],
      action: {
        href: "/app/company/jobs/new",
        label: "Dodaj",
        icon: Plus,
        tourId: "company-create-offer",
      },
    };
  }

  if (role === "student") {
    return {
      left: [
        { href: "/app/jobs", label: "Giełda", icon: Search, tourId: "student-jobs" },
        { href: "/app/applications", label: "Aplikacje", icon: FileText, tourId: "student-applications" },
      ],
      right: [
        { href: "/app/chat", label: "Czat", icon: MessageSquare, chat: true, tourId: "student-chat" },
        { href: "/app/profile", label: "Profil", icon: User },
      ],
      action: {
        href: "/app/services/new",
        label: "Dodaj",
        icon: Plus,
      },
    };
  }

  return {
    left: [
      { href: "/app/admin", label: "Admin", icon: LayoutGrid },
      { href: "/app/admin/users", label: "Użytkownicy", icon: User },
    ],
    right: [
      { href: "/app/admin/offers", label: "Oferty", icon: FileText },
      { href: "/app/profile", label: "Profil", icon: User },
    ],
    action: {
      href: "/app/admin",
      label: "Panel",
      icon: Plus,
    },
  };
}

function AppNavLink({
  href,
  children,
  icon: Icon,
  pathname,
  tourId,
  userId,
  unreadChat,
  chat,
  className,
  activeIndicatorClassName,
}: {
  href: string;
  children: ReactNode;
  icon: LucideIcon;
  pathname: string | null;
  tourId?: string;
  userId?: string;
  unreadChat: number;
  chat?: boolean;
  className?: string;
  activeIndicatorClassName?: string;
}) {
  const active = isPathActive(pathname, href);

  return (
    <Link
      href={href}
      data-tour={tourId}
      className={cn(
        "relative flex h-10 min-w-fit flex-none items-center gap-1.5 whitespace-nowrap rounded-xl px-3 text-[11px] font-black transition-all duration-200 2xl:text-xs",
        active
          ? "bg-white/10 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
          : "text-white/58 hover:bg-white/8 hover:text-white",
        className,
      )}
    >
      <Icon
        className={cn(
          "h-3.5 w-3.5 shrink-0 transition-colors 2xl:h-4 2xl:w-4",
          active ? "text-[#c5fb37]" : "text-white/38",
        )}
      />
      <span className="leading-none">{children}</span>
      {chat && userId ? (
        <UnreadChatBadge userId={userId} initialCount={unreadChat} />
      ) : null}
      {active ? (
        <span className={cn("absolute bottom-0.5 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-[#c5fb37]", activeIndicatorClassName)} />
      ) : null}
    </Link>
  );
}

function MobileBottomLink({
  item,
  pathname,
  userId,
  unreadChat,
}: {
  item: NavItem;
  pathname: string | null;
  userId?: string;
  unreadChat: number;
}) {
  const active = isPathActive(pathname, item.href);
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      data-tour={item.tourId}
      className={cn(
        "relative flex min-w-0 flex-col items-center justify-center gap-1 rounded-xl px-1 py-1.5 text-[10px] font-black transition-all",
        active ? "bg-lime-100 text-[#07142f]" : "text-slate-500 hover:bg-slate-100 hover:text-slate-950",
      )}
    >
      <span className="relative flex h-5 w-5 items-center justify-center">
        <Icon className={cn("h-4 w-4", active ? "text-[#07142f]" : "text-slate-500")} />
        {item.chat && userId && unreadChat > 0 ? (
          <span className="absolute -right-2 -top-2 min-w-4 rounded-full bg-red-500 px-1 text-center text-[9px] leading-4 text-white">
            {unreadChat > 9 ? "9+" : unreadChat}
          </span>
        ) : null}
      </span>
      <span className="max-w-full truncate">{item.label}</span>
    </Link>
  );
}

function AccountMenu({
  displayName,
  email,
  initials,
  role,
  roleLabel,
  tourAvailable,
  onRestartTour,
}: {
  displayName: string;
  email?: string | null;
  initials: string;
  role: string | null;
  roleLabel: string;
  tourAvailable: boolean;
  onRestartTour: () => void;
}) {
  const documentsHref = role === "company" ? "/app/company/documents" : "/app/finances";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="hidden h-10 items-center gap-2 rounded-full border border-white/10 bg-white/5 py-1 pl-1.5 pr-2.5 text-left text-white transition hover:bg-white/10 xl:flex"
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#8b6ff5] text-[11px] font-black text-white">
            {initials}
          </span>
          <span className="grid min-w-0 leading-none">
            <span className="max-w-24 truncate text-xs font-black">{displayName}</span>
            <span className="mt-0.5 text-[9px] font-bold text-white/46">{roleLabel}</span>
          </span>
          <ChevronDown className="h-3.5 w-3.5 text-white/38" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        sideOffset={12}
        className="w-72 overflow-hidden rounded-2xl border border-slate-200 bg-white p-0 shadow-[0_24px_70px_-34px_rgba(7,20,47,0.75)]"
      >
        <div className="bg-[#172b68] px-4 py-4 text-white">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#8b6ff5] text-sm font-black">
              {initials}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-black">{displayName}</p>
              <p className="truncate text-xs font-semibold text-white/58">{email ?? "konto@student2work.pl"}</p>
            </div>
          </div>
          <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-[#c5fb37]/12 px-2.5 py-1 text-[10px] font-black uppercase tracking-normal text-[#c5fb37]">
            <Star className="h-3 w-3" />
            {role === "company" ? "Zweryfikowana firma" : "Zweryfikowany profil"}
          </p>
        </div>

        <div className="grid gap-1 p-2">
          <DropdownMenuItem asChild className="cursor-pointer rounded-xl px-3 py-3 text-xs font-black text-[#07142f]">
            <Link href="/app/profile">
              <User className="h-4 w-4" />
              Mój profil
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild className="cursor-pointer rounded-xl px-3 py-3 text-xs font-black text-[#07142f]">
            <Link href={documentsHref}>
              <WalletCards className="h-4 w-4" />
              Płatności i faktury
            </Link>
          </DropdownMenuItem>
          {tourAvailable ? (
            <DropdownMenuItem
              onSelect={(event) => {
                event.preventDefault();
                onRestartTour();
              }}
              className="cursor-pointer rounded-xl px-3 py-3 text-xs font-black text-[#07142f]"
            >
              <CircleHelp className="h-4 w-4" />
              Samouczek
              <span className="ml-auto rounded-full bg-lime-100 px-2 py-0.5 text-[9px] font-black text-[#07142f]">
                Nowość
              </span>
            </DropdownMenuItem>
          ) : null}
          <DropdownMenuItem asChild className="cursor-pointer rounded-xl px-3 py-3 text-xs font-black text-[#07142f]">
            <Link href="/app/profile">
              <Settings className="h-4 w-4" />
              Ustawienia
            </Link>
          </DropdownMenuItem>
        </div>

        <DropdownMenuSeparator className="mx-2 bg-slate-100" />
        <form action={signOut} className="p-2 pt-1">
          <button
            type="submit"
            className="flex w-full items-center gap-2 rounded-xl px-3 py-3 text-left text-xs font-black text-red-500 transition hover:bg-red-50"
          >
            <LogOut className="h-4 w-4" />
            Wyloguj się
          </button>
        </form>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function MobileSheetMenu({
  user,
  role,
  roleLabel,
  displayName,
  email,
  initials,
  pathname,
  unreadChat,
  tourAvailable,
  onRestartTour,
  open,
  onOpenChange,
}: {
  user: AppNavbarUser | null;
  role: string | null;
  roleLabel: string;
  displayName: string;
  email?: string | null;
  initials: string;
  pathname: string | null;
  unreadChat: number;
  tourAvailable: boolean;
  onRestartTour: () => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const navItems = getDesktopNavItems(role);

  const handleRestartTour = () => {
    onOpenChange(false);
    window.setTimeout(onRestartTour, 250);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetTrigger asChild>
        <button
          type="button"
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white/78 transition hover:bg-white/10 hover:text-white lg:hidden"
          aria-label="Otwórz menu"
        >
          <Menu className="h-5 w-5" />
        </button>
      </SheetTrigger>
      <SheetContent
        side="left"
        className="flex w-[min(86vw,20rem)] flex-col border-r border-white/10 bg-[#07142f] p-3 text-white [&>button]:rounded-xl [&>button]:bg-white/10 [&>button]:text-white/70 [&>button]:hover:text-white"
      >
        <SheetHeader className="mb-4 border-b border-white/10 px-1 pb-5 text-left">
          <SheetTitle className="text-white">
            <Student2WorkBrand href={getHomeHref(role)} onClick={() => onOpenChange(false)} />
          </SheetTitle>
          <SheetDescription className="sr-only">
            Nawigacja aplikacji Student2Work.
          </SheetDescription>
        </SheetHeader>

        {user ? (
          <Link
            href="/app/profile"
            onClick={() => onOpenChange(false)}
            className="mb-4 flex items-center gap-3 rounded-xl border border-white/10 bg-white/8 p-3"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#8b6ff5] text-sm font-black">
              {initials}
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-black">{displayName}</span>
              <span className="block truncate text-[11px] font-semibold text-white/48">{email ?? roleLabel}</span>
            </span>
          </Link>
        ) : null}

        <div className="grid gap-1">
          {role === "admin" ? (
            <AdminNav pathname={pathname} mobile onNavigate={() => onOpenChange(false)} />
          ) : (
            navItems.map((item) => (
              <AppNavLink
                key={item.href}
                href={item.href}
                icon={item.icon}
                pathname={pathname}
                tourId={item.tourId}
                userId={user?.id}
                unreadChat={unreadChat}
                chat={item.chat}
                className="w-full justify-start"
                activeIndicatorClassName="bottom-auto left-auto right-5 top-1/2 -translate-x-0 -translate-y-1/2"
              >
                {item.label}
              </AppNavLink>
            ))
          )}

          {role === "company" ? (
            <AppNavLink
              href="/app/company/jobs/new"
              icon={Plus}
              pathname={pathname}
              tourId="company-create-offer"
              userId={user?.id}
              unreadChat={unreadChat}
              className="w-full justify-start"
              activeIndicatorClassName="bottom-auto left-auto right-5 top-1/2 -translate-x-0 -translate-y-1/2"
            >
              Dodaj ofertę
            </AppNavLink>
          ) : null}
        </div>

        <div className="mt-auto grid gap-2 border-t border-white/10 pt-4">
          {tourAvailable ? (
            <button
              type="button"
              onClick={handleRestartTour}
              className="flex h-12 items-center justify-center gap-2 rounded-xl bg-[#c5fb37] px-4 text-sm font-black text-[#07142f]"
            >
              <CircleHelp className="h-4 w-4" />
              Samouczek
            </button>
          ) : null}
          <form action={signOut}>
            <button
              type="submit"
              className="flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 text-sm font-black text-white transition hover:bg-white/10"
            >
              <LogOut className="h-4 w-4" />
              Wyloguj się
            </button>
          </form>
        </div>
      </SheetContent>
    </Sheet>
  );
}

export function AppNavbar({
  user,
  role,
  unread,
  unreadChat = 0,
}: AppNavbarProps) {
  const pathname = usePathname();
  const { available: tourAvailable, restart: restartTour } = useAppTour();
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const lastScrollYRef = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentY = window.scrollY;
      const delta = currentY - lastScrollYRef.current;

      setScrolled(currentY > 12);

      if (isOpen || currentY < 24) {
        setHidden(false);
      } else if (Math.abs(delta) > 8) {
        setHidden(delta > 0 && currentY > 96);
      }

      lastScrollYRef.current = currentY;
    };

    lastScrollYRef.current = window.scrollY;
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => window.removeEventListener("scroll", handleScroll);
  }, [isOpen, pathname]);

  const navItems = getDesktopNavItems(role);
  const mobile = getMobileItems(role);
  const roleLabel = getRoleLabel(role);
  const displayName = getDisplayName(user, role);
  const initials = getInitials(displayName, role);
  const homeHref = getHomeHref(role);
  const MobileActionIcon = mobile.action.icon;

  return (
    <>
      <header
        className={cn(
          "fixed inset-x-0 top-0 z-50 w-full px-3 py-3 transition-[transform,opacity] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform sm:px-4 lg:px-6",
          hidden ? "pointer-events-none -translate-y-[120%] opacity-0" : "translate-y-0 opacity-100",
        )}
      >
        <div
          className={cn(
            "mx-auto flex min-h-14 items-center gap-2 rounded-2xl border border-white/10 bg-[#07142f]/96 px-3 py-2 shadow-[0_18px_52px_-34px_rgba(7,20,47,0.9)] backdrop-blur-xl transition-all duration-200 sm:min-h-16 sm:px-4 lg:gap-3 lg:px-5",
            role === "admin" ? "max-w-[1880px]" : "max-w-[1480px]",
            scrolled && "bg-[#07142f]/90 shadow-[0_22px_60px_-30px_rgba(7,20,47,0.95)]",
          )}
        >
          <Student2WorkBrand href={homeHref} compact={false} />

          <nav className={cn(
            "hidden min-w-0 flex-1 items-center gap-1 px-2 lg:flex 2xl:px-5",
            role === "admin" ? "justify-start" : "justify-center",
          )}>
            {role === "admin" ? (
              <AdminNav pathname={pathname} wrap />
            ) : (
              navItems.map((item) => (
                <AppNavLink
                  key={item.href}
                  href={item.href}
                  icon={item.icon}
                  pathname={pathname}
                  tourId={item.tourId}
                  userId={user?.id}
                  unreadChat={unreadChat}
                  chat={item.chat}
                >
                  {item.label}
                </AppNavLink>
              ))
            )}

            {role === "company" ? (
              <Link
                href="/app/company/jobs/new"
                data-tour="company-create-offer"
                className={cn(
                  "ml-2 flex h-10 flex-none items-center gap-1.5 whitespace-nowrap rounded-full px-4 text-[11px] font-black text-[#07142f] shadow-[0_14px_34px_-20px_rgba(197,251,55,0.9)] transition-all active:scale-95 2xl:text-xs",
                  isPathActive(pathname, "/app/company/jobs/new")
                    ? "bg-[#c5fb37]"
                    : "bg-[#c5fb37] hover:-translate-y-0.5 hover:bg-[#d8ff52]",
                )}
              >
                <Plus className="h-4 w-4" />
                Dodaj ofertę
              </Link>
            ) : null}
          </nav>

          <div className="ml-auto flex items-center gap-1.5 lg:ml-2 lg:border-l lg:border-white/10 lg:pl-3">
            {tourAvailable ? (
              <button
                type="button"
                onClick={restartTour}
                data-testid="restart-app-tour"
                className="hidden h-10 items-center gap-2 rounded-full border border-lime-300/25 bg-white/5 px-3 text-xs font-black text-lime-100 transition-all hover:border-lime-200/60 hover:bg-white/10 hover:text-white md:inline-flex"
                title="Uruchom samouczek"
                aria-label="Uruchom samouczek"
              >
                <CircleHelp className="h-4 w-4" />
                <span className="hidden xl:inline">Samouczek</span>
              </button>
            ) : null}

            {user ? (
              <NotificationsBell
                unread={unread}
                triggerClassName="h-10 w-10 rounded-xl border border-white/10 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white"
                badgeClassName="ring-[#07142f]"
              />
            ) : null}

            {user ? (
              <AccountMenu
                displayName={displayName}
                email={user.email}
                initials={initials}
                role={role}
                roleLabel={roleLabel}
                tourAvailable={tourAvailable}
                onRestartTour={restartTour}
              />
            ) : (
              <Link
                href="/auth"
                className="hidden h-10 items-center rounded-full bg-[#c5fb37] px-5 text-xs font-black text-[#07142f] transition hover:bg-[#d8ff52] md:inline-flex"
              >
                Dołącz
              </Link>
            )}

            <MobileSheetMenu
              user={user}
              role={role}
              roleLabel={roleLabel}
              displayName={displayName}
              email={user?.email}
              initials={initials}
              pathname={pathname}
              unreadChat={unreadChat}
              tourAvailable={tourAvailable}
              onRestartTour={restartTour}
              open={isOpen}
              onOpenChange={setIsOpen}
            />
          </div>
        </div>
      </header>

      <nav className="fixed inset-x-0 bottom-0 z-50 max-w-full overflow-visible border-t border-slate-200/80 bg-white px-3 pb-[calc(env(safe-area-inset-bottom)+0.45rem)] pt-2 shadow-[0_-10px_28px_-24px_rgba(15,23,42,0.55)] lg:hidden">
        <div className="mx-auto grid w-full max-w-sm grid-cols-5 items-end gap-1">
          {mobile.left.map((item) => (
            <MobileBottomLink
              key={item.href}
              item={item}
              pathname={pathname}
              userId={user?.id}
              unreadChat={unreadChat}
            />
          ))}

          <Link
            href={mobile.action.href}
            data-tour={mobile.action.tourId}
            className="relative -mt-4 flex min-w-0 flex-col items-center justify-end gap-1 rounded-xl px-1 pb-1.5 text-[10px] font-black text-[#07142f]"
          >
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#c5fb37] shadow-[0_12px_28px_-14px_rgba(7,20,47,0.8)]">
              <MobileActionIcon className="h-6 w-6 shrink-0" />
            </span>
            <span className="max-w-full truncate">{mobile.action.label}</span>
          </Link>

          {mobile.right.map((item) => (
            <MobileBottomLink
              key={item.href}
              item={item}
              pathname={pathname}
              userId={user?.id}
              unreadChat={unreadChat}
            />
          ))}
        </div>
      </nav>
    </>
  );
}
