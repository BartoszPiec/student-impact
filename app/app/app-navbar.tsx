"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import NotificationsBell from "@/components/notifications-bell";
import { LogOut, User, Bell, Package, Briefcase, FileText, LayoutGrid, PlusCircle, Search, Menu, MessageSquare, CircleDollarSign } from "lucide-react";
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

    const NavLink = ({ href, children, icon: Icon, exact = false, onClick }: { href: string; children: React.ReactNode; icon?: any; exact?: boolean; onClick?: () => void }) => {
        const active = exact ? pathname === href : isActive(href);
        return (
            <Link
                href={href}
                onClick={onClick}
                className={cn(
                    "relative flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-300",
                    active
                        ? "text-indigo-700 bg-indigo-50 shadow-sm ring-1 ring-indigo-100"
                        : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                )}
            >
                {Icon && <Icon className={cn("h-4 w-4 transition-colors", active ? "text-indigo-600" : "text-slate-400 group-hover:text-slate-600")} />}
                <span>{children}</span>
            </Link>
        );
    };

    return (
        <header className="sticky top-0 z-50 w-full border-b border-slate-200/60 bg-white/70 backdrop-blur-xl shadow-sm supports-[backdrop-filter]:bg-white/60">
            <div className="mx-auto max-w-7xl px-4 h-16 flex items-center gap-4">

                {/* Left Side: Mobile Menu & Logo */}
                <div className="flex items-center gap-4 mr-auto">
                    {/* Mobile Menu Trigger */}
                    <Sheet open={isOpen} onOpenChange={setIsOpen}>
                        <SheetTrigger asChild>
                            <Button variant="ghost" size="icon" className="md:hidden -ml-2 text-slate-500 hover:text-indigo-600">
                                <Menu className="h-6 w-6" />
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="left" className="w-[300px] sm:w-[350px] flex flex-col pt-10 bg-white shadow-2xl z-[100] border-r-0">
                            <SheetHeader className="px-1 mb-8 text-left border-b border-slate-100 pb-6">
                                <SheetTitle className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 shadow-lg shadow-indigo-500/20 flex items-center justify-center text-white">
                                        <div className="font-bold text-xl">S</div>
                                    </div>
                                    <div>
                                        <span className="font-bold text-xl text-slate-900 block leading-tight">Student2Work</span>
                                        <span className="text-xs text-slate-500 font-medium tracking-wide uppercase">Platforma dla Ciebie</span>
                                    </div>
                                </SheetTitle>
                            </SheetHeader>

                            <div className="flex-1 flex flex-col gap-2 overflow-y-auto py-2">
                                {role === "company" && (
                                    <>
                                        <div className="px-3 text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1 mt-2 pl-4">Panel Firmy</div>
                                        <div className="space-y-1">
                                            <NavLink href="/app/company/packages" icon={Search} onClick={() => setIsOpen(false)}>Katalog Usług</NavLink>
                                            <NavLink href="/app/company/offers" icon={LayoutGrid} onClick={() => setIsOpen(false)}>Moje ogłoszenia</NavLink>
                                            <NavLink href="/app/chat" icon={MessageSquare} onClick={() => setIsOpen(false)}>
                                                Wiadomości
                                                {user && <UnreadChatBadge userId={user.id} initialCount={unreadChat} />}
                                            </NavLink>
                                            <NavLink href="/app/company/jobs/new" icon={PlusCircle} onClick={() => setIsOpen(false)}>Dodaj ofertę</NavLink>
                                        </div>
                                    </>
                                )}

                                {role === "student" && (
                                    <>
                                        <div className="px-3 text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1 mt-2 pl-4">Panel Studenta</div>
                                        <div className="space-y-1">
                                            <NavLink href="/app/jobs" icon={Search} onClick={() => setIsOpen(false)}>Giełda Zleceń</NavLink>
                                            <NavLink href="/app/applications" icon={FileText} onClick={() => setIsOpen(false)}>Aplikacje</NavLink>
                                            <NavLink href="/app/services/my" icon={Briefcase} onClick={() => setIsOpen(false)}>Usługi</NavLink>
                                            <NavLink href="/app/finances" icon={CircleDollarSign} onClick={() => setIsOpen(false)}>Finanse</NavLink>
                                            <NavLink href="/app/chat" icon={MessageSquare} onClick={() => setIsOpen(false)}>
                                                Wiadomości
                                                {user && <UnreadChatBadge userId={user.id} initialCount={unreadChat} />}
                                            </NavLink>
                                        </div>
                                    </>
                                )}
                            </div>

                            <div className="border-t border-slate-100 pt-6 mt-auto pb-6 space-y-3 bg-slate-50/50 -mx-6 px-6">
                                {user ? (
                                    <>
                                        <div className="px-3 text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1 pl-4">Konto</div>
                                        <Link href="/app/profile" onClick={() => setIsOpen(false)} className="flex items-center gap-3 px-3 py-3 rounded-xl bg-white border border-slate-100 shadow-sm hover:shadow-md transition-all active:scale-95 group">
                                            <div className="h-9 w-9 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 border border-indigo-100 group-hover:bg-gradient-to-br group-hover:from-indigo-600 group-hover:to-violet-600 group-hover:text-white transition-all">
                                                <User className="h-5 w-5" />
                                            </div>
                                            <div className="flex-1 overflow-hidden">
                                                <div className="text-sm font-bold text-slate-900 truncate">Twój Profil</div>
                                                <div className="text-xs text-slate-500 truncate">{user.email}</div>
                                            </div>
                                        </Link>
                                        <form action={signOut} className="w-full">
                                            <button className="flex w-full items-center justify-center gap-2 px-3 py-3 rounded-xl border border-transparent text-slate-500 hover:text-red-600 hover:bg-red-50 transition-all font-semibold text-sm">
                                                <LogOut className="h-4 w-4" />
                                                Wyloguj się
                                            </button>
                                        </form>
                                    </>
                                ) : (
                                    <Link href="/auth" onClick={() => setIsOpen(false)} className="block w-full text-center rounded-xl bg-slate-900 text-white px-5 py-4 font-bold text-sm shadow-xl shadow-slate-200">
                                        Dołącz teraz
                                    </Link>
                                )}
                            </div>
                        </SheetContent>
                    </Sheet>

                    {/* Logo */}
                    <Link href={role === "student" ? "/app/jobs" : "/app"} className="flex items-center gap-2 group">
                        <div className="relative flex items-center justify-center">
                            <div className="absolute inset-0 bg-indigo-500/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                            <img src="/logo.png" alt="Logo" className="h-8 w-auto relative z-10 transition-transform duration-300 group-hover:scale-110" />
                        </div>
                        <span className="hidden sm:inline-block font-bold text-lg tracking-tight text-slate-900 transition-colors">
                            Student<span className="text-indigo-600">2</span>Work
                        </span>
                    </Link>
                </div>


                {/* Center Navigation (Desktop) */}
                <nav className="hidden md:flex items-center gap-1">

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
                                    "ml-3 flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 active:scale-95",
                                    isActive("/app/company/jobs/new")
                                        ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-indigo-500/30"
                                        : "bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
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
                        <NavLink href="/app/admin/offers" icon={LayoutGrid}>Wszystkie Oferty (Admin)</NavLink>
                    )}

                </nav>

                {/* Right Actions */}
                <div className="flex items-center gap-3 pl-4 border-l border-slate-200/50 ml-2">

                    {/* Notifications */}
                    {user && (
                        <div className="relative">
                            <NotificationsBell unread={unread} />
                        </div>
                    )}

                    {/* User Profile / Auth */}
                    {user ? (
                        <div className="flex items-center gap-2">
                            <Link href="/app/profile" className={cn(
                                "flex items-center justify-center h-10 w-10 rounded-full transition-all border-2",
                                isActive("/app/profile")
                                    ? "bg-indigo-50 text-indigo-700 border-indigo-100"
                                    : "border-transparent hover:bg-slate-50 text-slate-600"
                            )} title="Mój Profil">
                                <User className="h-5 w-5" />
                            </Link>

                            <form action={signOut} className="hidden md:block">
                                <button className="flex items-center justify-center h-10 w-10 rounded-full text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all active:scale-95" title="Wyloguj">
                                    <LogOut className="h-5 w-5" />
                                </button>
                            </form>
                        </div>
                    ) : (
                        <Link href="/auth" className="rounded-full bg-slate-900 text-white px-6 py-2.5 hover:bg-slate-800 hover:shadow-lg hover:-translate-y-0.5 transition-all active:scale-95 font-semibold text-xs uppercase tracking-wide">
                            Dołącz
                        </Link>
                    )}
                </div>

            </div>
        </header>
    );
}
