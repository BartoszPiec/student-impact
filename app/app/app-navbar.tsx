"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import dynamic from "next/dynamic";
import {
  Briefcase,
  CircleHelp,
  CircleDollarSign,
  FileText,
  LayoutGrid,
  LogOut,
  Menu,
  MessageSquare,
  PlusCircle,
  Search,
  SearchCheck,
  Sparkles,
  User,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { AdminNav } from "@/components/admin/admin-nav";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { signOut } from "./_actions/auth";
import { useAppTour } from "@/components/app-tour/app-tour-provider";

const NotificationsBell = dynamic(() => import("@/components/notifications-bell"));
const UnreadChatBadge = dynamic(() =>
  import("./_components/UnreadChatBadge").then((module) => module.UnreadChatBadge)
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

type MobileNavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  chat?: boolean;
  tourId?: string;
};

function isPathActive(pathname: string | null, path: string) {
  return pathname === path || pathname?.startsWith(`${path}/`);
}

function AppNavLink({
  href,
  children,
  icon: Icon,
  onClick,
  pathname,
  tourId,
}: {
  href: string;
  children: ReactNode;
  icon?: LucideIcon;
  onClick?: () => void;
  pathname: string | null;
  tourId?: string;
}) {
  const active = isPathActive(pathname, href);

  return (
    <Link
      href={href}
      onClick={onClick}
      data-tour={tourId}
      className={cn(
        "relative flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-extrabold transition-all duration-200 xl:px-4",
        active
          ? "bg-white/10 text-white shadow-sm"
          : "text-white/60 hover:bg-white/10 hover:text-white"
      )}
    >
      {Icon && (
        <Icon
          className={cn(
            "h-4 w-4 transition-colors",
            active ? "text-white" : "text-white/40"
          )}
        />
      )}
      <span>{children}</span>
      {active && (
        <span className="absolute bottom-0.5 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-lime-300" />
      )}
    </Link>
  );
}

function getMobileNavItems(role: string | null): MobileNavItem[] {
  if (role === "company") {
    return [
      { href: "/app/company/packages", label: "Katalog", icon: Search, tourId: "company-catalog" },
      { href: "/app/company/offers", label: "Zlecenia", icon: LayoutGrid, tourId: "company-offers" },
      { href: "/app/chat", label: "Chat", icon: MessageSquare, chat: true, tourId: "company-chat" },
      { href: "/app/profile", label: "Profil", icon: User },
    ];
  }

  if (role === "student") {
    return [
      { href: "/app/jobs", label: "Giełda", icon: Search, tourId: "student-jobs" },
      { href: "/app/applications", label: "Aplikacje", icon: FileText, tourId: "student-applications" },
      { href: "/app/chat", label: "Chat", icon: MessageSquare, chat: true, tourId: "student-chat" },
      { href: "/app/profile", label: "Profil", icon: User },
    ];
  }

  if (role === "admin") {
    return [
      { href: "/app/admin", label: "Admin", icon: LayoutGrid },
      { href: "/app/admin/users", label: "Użytkownicy", icon: User },
      { href: "/app/admin/offers", label: "Oferty", icon: FileText },
      { href: "/app/profile", label: "Profil", icon: User },
    ];
  }

  return [
    { href: "/app", label: "Start", icon: LayoutGrid },
    { href: "/app/chat", label: "Chat", icon: MessageSquare, chat: true },
    { href: "/app/profile", label: "Profil", icon: User },
  ];
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

  const mobileNavItems = getMobileNavItems(role);
  const restartTourFromMobileMenu = () => {
    setIsOpen(false);
    window.setTimeout(restartTour, 300);
  };

  return (
    <>
    <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-[#07142f] backdrop-blur-xl">
      <div className="mx-auto w-full max-w-[1380px] px-3 sm:px-4 lg:px-8">
        <div className="relative flex h-14 items-center gap-2 sm:gap-4">
          <div className="flex min-w-0 shrink-0 items-center gap-2 sm:gap-3">
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-1/2 h-9 w-9 -translate-y-1/2 rounded-xl text-white/70 hover:bg-white/10 hover:text-white lg:hidden"
                  suppressHydrationWarning
                >
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent
                side="left"
                className="flex flex-col bg-slate-950 pt-8 border-r border-white/5 z-[100]"
              >
                <SheetHeader className="px-1 mb-6 text-left border-b border-white/5 pb-6">
                  <SheetTitle className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg shadow-indigo-500/25 flex items-center justify-center">
                      <Sparkles className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <span className="font-black text-xl text-white block leading-tight">
                        Student<span className="text-indigo-400">2</span>Work
                      </span>
                      <span className="text-[10px] text-white/40 font-bold tracking-[0.15em] uppercase">
                        Platforma Premium
                      </span>
                    </div>
                  </SheetTitle>
                  <SheetDescription className="sr-only">
                    Nawigacja aplikacji, profil użytkownika i szybkie uruchomienie samouczka.
                  </SheetDescription>
                </SheetHeader>

                <div className="flex-1 flex flex-col gap-1 overflow-y-auto py-2">
                  {role === "company" && (
                    <>
                      <div className="px-4 text-[10px] font-black text-white/30 uppercase tracking-[0.15em] mb-2 mt-1">
                        Panel Firmy
                      </div>
                      <AppNavLink href="/app/company/packages" icon={Search} onClick={() => setIsOpen(false)} pathname={pathname} tourId="company-catalog">
                        Katalog Usług
                      </AppNavLink>
                      <AppNavLink href="/app/company/offers" icon={LayoutGrid} onClick={() => setIsOpen(false)} pathname={pathname} tourId="company-offers">
                        Moje ogłoszenia
                      </AppNavLink>
                      <AppNavLink href="/app/company/challenges/new" icon={SearchCheck} onClick={() => setIsOpen(false)} pathname={pathname}>
                        Dodaj wyzwanie
                      </AppNavLink>
                      <AppNavLink href="/app/company/documents" icon={FileText} onClick={() => setIsOpen(false)} pathname={pathname}>
                        Dokumenty
                      </AppNavLink>
                      <AppNavLink href="/app/company/orders" icon={Briefcase} onClick={() => setIsOpen(false)} pathname={pathname} tourId="company-orders">
                        Zamówienia usług
                      </AppNavLink>
                      <AppNavLink href="/app/chat" icon={MessageSquare} onClick={() => setIsOpen(false)} pathname={pathname} tourId="company-chat">
                        Wiadomości
                        {user && <UnreadChatBadge userId={user.id} initialCount={unreadChat} />}
                      </AppNavLink>
                      <AppNavLink href="/app/company/jobs/new" icon={PlusCircle} onClick={() => setIsOpen(false)} pathname={pathname} tourId="company-create-offer">
                        Dodaj ofertę
                      </AppNavLink>
                    </>
                  )}

                  {role === "student" && (
                    <>
                      <div className="px-4 text-[10px] font-black text-white/30 uppercase tracking-[0.15em] mb-2 mt-1">
                        Panel Studenta
                      </div>
                      <AppNavLink href="/app/jobs" icon={Search} onClick={() => setIsOpen(false)} pathname={pathname} tourId="student-jobs">
                        Giełda Zleceń
                      </AppNavLink>
                      <AppNavLink href="/app/applications" icon={FileText} onClick={() => setIsOpen(false)} pathname={pathname} tourId="student-applications">
                        Aplikacje
                      </AppNavLink>
                      <AppNavLink href="/app/services/my" icon={Briefcase} onClick={() => setIsOpen(false)} pathname={pathname} tourId="student-services">
                        Usługi
                      </AppNavLink>
                      <AppNavLink href="/app/finances" icon={CircleDollarSign} onClick={() => setIsOpen(false)} pathname={pathname}>
                        Finanse
                      </AppNavLink>
                      <AppNavLink href="/app/chat" icon={MessageSquare} onClick={() => setIsOpen(false)} pathname={pathname} tourId="student-chat">
                        Wiadomości
                        {user && <UnreadChatBadge userId={user.id} initialCount={unreadChat} />}
                      </AppNavLink>
                    </>
                  )}

                  {role === "admin" && (
                    <AdminNav
                      pathname={pathname}
                      mobile
                      onNavigate={() => setIsOpen(false)}
                    />
                  )}
                </div>

                <div className="border-t border-white/5 pt-4 mt-auto pb-6 space-y-2">
                  {user ? (
                    <>
                      {tourAvailable ? (
                        <button
                          type="button"
                          onClick={restartTourFromMobileMenu}
                          data-testid="restart-app-tour-mobile"
                          className="flex w-full items-center gap-3 rounded-xl border border-indigo-300/20 bg-indigo-500/10 px-3 py-3 text-left text-sm font-black text-indigo-100 transition-all hover:border-indigo-300/40 hover:bg-indigo-500/20"
                        >
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-500/20 text-indigo-100">
                            <CircleHelp className="h-4 w-4" />
                          </div>
                          Samouczek
                        </button>
                      ) : null}
                      <Link
                        href="/app/profile"
                        onClick={() => setIsOpen(false)}
                        className="flex items-center gap-3 px-3 py-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all group"
                      >
                        <div className="h-9 w-9 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/25">
                          <User className="h-4 w-4 text-white" />
                        </div>
                        <div className="flex-1 overflow-hidden">
                          <div className="text-sm font-bold text-white truncate">Twój Profil</div>
                          <div className="text-xs text-white/40 truncate">{user.email}</div>
                        </div>
                      </Link>
                      <form action={signOut} className="w-full">
                        <button className="flex w-full items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-white/40 hover:text-red-400 hover:bg-red-500/10 transition-all font-bold text-sm">
                          <LogOut className="h-4 w-4" />
                          Wyloguj sie
                        </button>
                      </form>
                    </>
                  ) : (
                    <Link
                      href="/auth"
                      onClick={() => setIsOpen(false)}
                      className="block w-full text-center rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white px-5 py-3.5 font-bold text-sm shadow-xl shadow-indigo-500/25"
                    >
                      Dołącz teraz
                    </Link>
                  )}
                </div>
              </SheetContent>
            </Sheet>

            <Link
              href={role === "student" ? "/app/jobs" : role === "admin" ? "/app/admin" : role === "company" ? "/app/company/packages" : "/app"}
              data-tour="tour-home"
              className="flex items-center gap-2.5 group"
            >
              <div className="relative">
                <div className="absolute inset-0 bg-indigo-500/30 blur-lg rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <Image
                  src="/logo.png"
                  alt="Logo"
                  width={128}
                  height={32}
                  priority
                className="relative z-10 h-6 w-auto transition-transform duration-300 group-hover:scale-105 sm:h-7"
              />
            </div>
              <span className="inline-block text-xs font-black tracking-normal text-white sm:text-sm">
                Student<span className="text-indigo-400">2</span>Work
              </span>
            </Link>
          </div>

          <nav className="hidden min-w-0 flex-1 items-center justify-center gap-0.5 px-3 lg:flex">
            {role === "company" && (
              <>
                <AppNavLink href="/app/company/packages" icon={Search} pathname={pathname} tourId="company-catalog">
                  Katalog Usług
                </AppNavLink>
                <AppNavLink href="/app/company/offers" icon={LayoutGrid} pathname={pathname} tourId="company-offers">
                  Moje ogłoszenia
                </AppNavLink>
                <AppNavLink href="/app/company/challenges/new" icon={SearchCheck} pathname={pathname}>
                  Wyzwanie
                </AppNavLink>
                <AppNavLink href="/app/company/documents" icon={FileText} pathname={pathname}>
                  Dokumenty
                </AppNavLink>
                <AppNavLink href="/app/company/orders" icon={Briefcase} pathname={pathname} tourId="company-orders">
                  Zamówienia usług
                </AppNavLink>
                <AppNavLink href="/app/chat" icon={MessageSquare} pathname={pathname} tourId="company-chat">
                  Wiadomości
                  {user && <UnreadChatBadge userId={user.id} initialCount={unreadChat} />}
                </AppNavLink>
                <Link
                  href="/app/company/jobs/new"
                  data-tour="company-create-offer"
                  className={cn(
                    "ml-3 flex items-center gap-2 rounded-full px-5 py-2 text-sm font-black transition-all active:scale-95",
                    isPathActive(pathname, "/app/company/jobs/new")
                      ? "bg-lime-300 text-[#10245f] shadow-lg shadow-lime-300/20"
                      : "bg-lime-300 text-[#10245f] shadow-md shadow-lime-300/20 hover:-translate-y-0.5 hover:bg-lime-200 hover:shadow-lg hover:shadow-lime-300/30"
                  )}
                >
                  <PlusCircle className="h-4 w-4" />
                  <span>Dodaj ofertę</span>
                </Link>
              </>
            )}

            {role === "student" && (
              <>
                <AppNavLink href="/app/jobs" icon={Search} pathname={pathname} tourId="student-jobs">
                  Giełda Zleceń
                </AppNavLink>
                <AppNavLink href="/app/applications" icon={FileText} pathname={pathname} tourId="student-applications">
                  Aplikacje
                </AppNavLink>
                <AppNavLink href="/app/services/my" icon={Briefcase} pathname={pathname} tourId="student-services">
                  Usługi
                </AppNavLink>
                <AppNavLink href="/app/finances" icon={CircleDollarSign} pathname={pathname}>
                  Finanse
                </AppNavLink>
                <AppNavLink href="/app/chat" icon={MessageSquare} pathname={pathname} tourId="student-chat">
                  Wiadomości
                  {user && <UnreadChatBadge userId={user.id} initialCount={unreadChat} />}
                </AppNavLink>
              </>
            )}

            {role === "admin" && (
              <AdminNav pathname={pathname} />
            )}
          </nav>

          <div className="ml-auto flex items-center gap-1 border-l border-white/10 pl-2 pr-10 sm:gap-2 sm:pl-3 lg:ml-2 lg:pr-0">
            {tourAvailable ? (
              <button
                type="button"
                onClick={restartTour}
                data-testid="restart-app-tour"
                className="hidden h-9 items-center gap-2 rounded-full border border-lime-300/25 bg-white/5 px-2.5 text-lime-100 shadow-sm shadow-indigo-950/20 transition-all hover:border-lime-200/60 hover:bg-white/10 hover:text-white sm:px-3 lg:inline-flex"
                title="Uruchom samouczek"
                aria-label="Uruchom samouczek"
              >
                <CircleHelp className="h-4 w-4" />
                <span className="hidden xl:inline text-xs font-black">Samouczek</span>
              </button>
            ) : null}

            {user && (
              <div className="relative [&_button]:text-white/60 [&_button]:hover:text-white [&_button]:hover:bg-white/10 [&_button]:rounded-xl">
                <NotificationsBell unread={unread} />
              </div>
            )}

            {user ? (
              <div className="flex items-center gap-1">
                <Link
                  href="/app/profile"
                  className={cn(
                    "hidden h-9 w-9 items-center justify-center rounded-xl transition-all sm:flex",
                    isPathActive(pathname, "/app/profile")
                      ? "bg-white/15 text-white shadow-sm"
                      : "text-white/50 hover:text-white hover:bg-white/10"
                  )}
                  title="Mój Profil"
                >
                  <User className="h-4 w-4" />
                </Link>

                <form action={signOut} className="hidden md:block">
                  <button
                    className="flex items-center justify-center h-9 w-9 rounded-xl text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-all active:scale-95"
                    title="Wyloguj"
                  >
                    <LogOut className="h-4 w-4" />
                  </button>
                </form>
              </div>
            ) : (
              <Link
                href="/auth"
                className="rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 text-white px-5 py-2 hover:shadow-lg hover:shadow-indigo-500/30 hover:-translate-y-0.5 transition-all active:scale-95 font-black text-xs uppercase tracking-widest shadow-md shadow-indigo-500/20"
              >
                Dołącz
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>

    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-slate-200/80 bg-white px-3 pb-[calc(env(safe-area-inset-bottom)+0.45rem)] pt-1.5 shadow-[0_-10px_28px_-24px_rgba(15,23,42,0.55)] lg:hidden">
      <div className="mx-auto grid max-w-md grid-cols-4 gap-1">
        {mobileNavItems.map(({ href, label, icon: Icon, chat, tourId }) => {
          const active = isPathActive(pathname, href);

          return (
            <Link
              key={href}
              href={href}
              data-tour={tourId}
              className={cn(
                "relative flex min-w-0 flex-col items-center justify-center gap-1 rounded-xl px-1 py-1.5 text-[10px] font-extrabold transition-all",
                active
                  ? "bg-lime-200 text-[#0b1b47]"
                  : "text-slate-500 hover:bg-slate-100 hover:text-slate-950"
              )}
            >
              <span className="relative">
                <Icon className={cn("h-4 w-4", active ? "text-[#0b1b47]" : "text-slate-500")} />
                {chat && user && unreadChat > 0 ? (
                  <span className="absolute -right-2 -top-2 min-w-4 rounded-full bg-red-500 px-1 text-center text-[9px] leading-4 text-white">
                    {unreadChat > 9 ? "9+" : unreadChat}
                  </span>
                ) : null}
              </span>
              <span className="max-w-full truncate">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
    </>
  );
}
