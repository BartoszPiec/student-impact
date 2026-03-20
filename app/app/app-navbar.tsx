"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import NotificationsBell from "@/components/notifications-bell";
import {
  LogOut,
  User,
  Package,
  Briefcase,
  FileText,
  LayoutGrid,
  PlusCircle,
  Search,
  Menu,
  MessageSquare,
  CircleDollarSign,
  Wallet,
  ChevronDown,
  Sparkles,
} from "lucide-react";
import { signOut } from "./_actions/auth";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { UnreadChatBadge } from "./_components/UnreadChatBadge";

interface AppNavbarProps {
  user: any;
  role: string | null;
  unread: number;
  unreadChat?: number;
}

export function AppNavbar({ user, role, unread, unreadChat = 0 }: AppNavbarProps) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const isActive = (path: string) => pathname === path || pathname?.startsWith(`${path}/`);

  const NavLink = ({
    href,
    children,
    icon: Icon,
    exact = false,
    onClick,
  }: {
    href: string;
    children: React.ReactNode;
    icon?: any;
    exact?: boolean;
    onClick?: () => void;
  }) => {
    const active = exact ? pathname === href : isActive(href);
    return (
      <Link
        href={href}
        onClick={onClick}
        className={cn(
          "relative flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all duration-200",
          active
            ? "text-white bg-white/15 shadow-sm"
            : "text-white/60 hover:text-white hover:bg-white/10"
        )}
      >
        {Icon && <Icon className={cn("h-4 w-4 transition-colors", active ? "text-white" : "text-white/40")} />}
        <span>{children}</span>
        {active && (
          <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-indigo-400 rounded-full" />
        )}
      </Link>
    );
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-slate-950/95 backdrop-blur-xl">
      {/* Premium glass bar */}
      <div className="mx-auto w-full max-w-[2000px] px-4 md:px-8 xl:px-12 py-2.5">
        <div className="h-14 flex items-center gap-4 px-3 rounded-2xl bg-slate-950/95 backdrop-blur-xl shadow-[0_8px_32px_-8px_rgba(0,0,0,0.4)] border border-white/5">

          {/* Left: Mobile Menu + Logo */}
          <div className="flex items-center gap-3 mr-auto">

            {/* Mobile Menu */}
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="md:hidden text-white/60 hover:text-white hover:bg-white/10 rounded-xl h-9 w-9"
                  suppressHydrationWarning
                >
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[300px] sm:w-[360px] flex flex-col pt-8 bg-slate-950 border-r border-white/5 z-[100]">
                <SheetHeader className="px-1 mb-6 text-left border-b border-white/5 pb-6">
                  <SheetTitle className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg shadow-indigo-500/25 flex items-center justify-center">
                      <Sparkles className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <span className="font-black text-xl text-white block leading-tight">
                        Student<span className="text-indigo-400">2</span>Work
                      </span>
                      <span className="text-[10px] text-white/40 font-bold tracking-[0.15em] uppercase">Platforma Premium</span>
                    </div>
                  </SheetTitle>
                </SheetHeader>

                <div className="flex-1 flex flex-col gap-1 overflow-y-auto py-2">
                  {role === "company" && (
                    <>
                      <div className="px-4 text-[10px] font-black text-white/30 uppercase tracking-[0.15em] mb-2 mt-1">Panel Firmy</div>
                      <NavLink href="/app/company/packages" icon={Search} onClick={() => setIsOpen(false)}>Katalog Usług</NavLink>
                      <NavLink href="/app/company/offers" icon={LayoutGrid} onClick={() => setIsOpen(false)}>Moje ogłoszenia</NavLink>
                      <NavLink href="/app/chat" icon={MessageSquare} onClick={() => setIsOpen(false)}>
                        Wiadomości
                        {user && <UnreadChatBadge userId={user.id} initialCount={unreadChat} />}
                      </NavLink>
                      <NavLink href="/app/company/jobs/new" icon={PlusCircle} onClick={() => setIsOpen(false)}>Dodaj ofertę</NavLink>
                    </>
                  )}

                  {role === "student" && (
                    <>
                      <div className="px-4 text-[10px] font-black text-white/30 uppercase tracking-[0.15em] mb-2 mt-1">Panel Studenta</div>
                      <NavLink href="/app/jobs" icon={Search} onClick={() => setIsOpen(false)}>Giełda Zleceń</NavLink>
                      <NavLink href="/app/applications" icon={FileText} onClick={() => setIsOpen(false)}>Aplikacje</NavLink>
                      <NavLink href="/app/services/my" icon={Briefcase} onClick={() => setIsOpen(false)}>Usługi</NavLink>
                      <NavLink href="/app/finances" icon={CircleDollarSign} onClick={() => setIsOpen(false)}>Finanse</NavLink>
                      <NavLink href="/app/chat" icon={MessageSquare} onClick={() => setIsOpen(false)}>
                        Wiadomości
                        {user && <UnreadChatBadge userId={user.id} initialCount={unreadChat} />}
                      </NavLink>
                    </>
                  )}
                </div>

                <div className="border-t border-white/5 pt-4 mt-auto pb-6 space-y-2">
                  {user ? (
                    <>
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
                          Wyloguj się
                        </button>
                      </form>
                    </>
                  ) : (
                    <Link href="/auth" onClick={() => setIsOpen(false)} className="block w-full text-center rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white px-5 py-3.5 font-bold text-sm shadow-xl shadow-indigo-500/25">
                      Dołącz teraz
                    </Link>
                  )}
                </div>
              </SheetContent>
            </Sheet>

            {/* Logo */}
            <Link
              href={role === "student" ? "/app/jobs" : "/app"}
              className="flex items-center gap-2.5 group"
            >
              <div className="relative">
                <div className="absolute inset-0 bg-indigo-500/30 blur-lg rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <img src="/logo.png" alt="Logo" className="h-7 w-auto relative z-10 transition-transform duration-300 group-hover:scale-110" />
              </div>
              <span className="hidden sm:inline-block font-black text-base tracking-tight text-white">
                Student<span className="text-indigo-400">2</span>Work
              </span>
            </Link>
          </div>

          {/* Center Navigation (Desktop) */}
          <nav className="hidden md:flex items-center gap-0.5">

            {/* Company Links */}
            {role === "company" && (
              <>
                <NavLink href="/app/company/packages" icon={Search}>Katalog Usług</NavLink>
                <NavLink href="/app/company/offers" icon={LayoutGrid}>Moje ogłoszenia</NavLink>
                <NavLink href="/app/chat" icon={MessageSquare}>
                  Wiadomości
                  {user && <UnreadChatBadge userId={user.id} initialCount={unreadChat} />}
                </NavLink>
                <Link
                  href="/app/company/jobs/new"
                  className={cn(
                    "ml-3 flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-black transition-all active:scale-95",
                    isActive("/app/company/jobs/new")
                      ? "bg-gradient-to-r from-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-500/30"
                      : "bg-gradient-to-r from-indigo-500 to-violet-600 text-white shadow-md shadow-indigo-500/20 hover:shadow-lg hover:shadow-indigo-500/30 hover:-translate-y-0.5"
                  )}
                >
                  <PlusCircle className="h-4 w-4" />
                  <span>Dodaj ofertę</span>
                </Link>
              </>
            )}

            {/* Student Links */}
            {role === "student" && (
              <>
                <NavLink href="/app/jobs" icon={Search}>Giełda Zleceń</NavLink>
                <NavLink href="/app/applications" icon={FileText}>Aplikacje</NavLink>
                <NavLink href="/app/services/my" icon={Briefcase}>Usługi</NavLink>
                <NavLink href="/app/finances" icon={CircleDollarSign}>Finanse</NavLink>
                <NavLink href="/app/chat" icon={MessageSquare}>
                  Wiadomości
                  {user && <UnreadChatBadge userId={user.id} initialCount={unreadChat} />}
                </NavLink>
              </>
            )}

            {/* Admin Links */}
            {role === "admin" && (
              <>
                <NavLink href="/app/admin/offers" icon={LayoutGrid}>Oferty (Admin)</NavLink>
                <NavLink href="/app/admin/payouts" icon={Wallet}>Wypłaty (Admin)</NavLink>
              </>
            )}
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-2 pl-3 ml-2 border-l border-white/5">

            {/* Notifications */}
            {user && (
              <div className="relative [&_button]:text-white/60 [&_button]:hover:text-white [&_button]:hover:bg-white/10 [&_button]:rounded-xl">
                <NotificationsBell unread={unread} />
              </div>
            )}

            {/* Profile + Logout */}
            {user ? (
              <div className="flex items-center gap-1">
                <Link
                  href="/app/profile"
                  className={cn(
                    "flex items-center justify-center h-9 w-9 rounded-xl transition-all",
                    isActive("/app/profile")
                      ? "bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-md shadow-indigo-500/25"
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
  );
}
