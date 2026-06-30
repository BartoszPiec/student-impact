"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BriefcaseBusiness, GraduationCap, LogIn, Menu } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Student2WorkBrand } from "@/components/student2work-brand";

type LandingNavbarAudience = "company" | "student";

type LandingNavLink = {
  label: string;
  href: string;
};

type LandingNavbarConfig = {
  links: LandingNavLink[];
  ctaLabel: string;
  ctaHref: string;
  homeHref: string;
  audienceLabel: string;
};

const landingNavbarConfig: Record<LandingNavbarAudience, LandingNavbarConfig> = {
  company: {
    homeHref: "/",
    ctaLabel: "Deleguj zadanie",
    ctaHref: "/auth?role=company",
    audienceLabel: "Dla firm",
    links: [
      { label: "Jak to działa", href: "#jak-dziala" },
      { label: "Bezpieczeństwo", href: "#bezpieczenstwo" },
      { label: "Pakiety", href: "#pakiety" },
      { label: "Rozliczenia", href: "#cennik" },
      { label: "Dla studentów", href: "/dla-studentow" },
    ],
  },
  student: {
    homeHref: "/dla-studentow",
    ctaLabel: "Dołącz jako student",
    ctaHref: "/auth?role=student",
    audienceLabel: "Dla studentów",
    links: [
      { label: "Jak zacząć", href: "#jak-zaczac" },
      { label: "Kategorie", href: "#zlecenia" },
      { label: "Opinie", href: "#opinie" },
      { label: "Dla firm", href: "/" },
    ],
  },
};

function isLandingLinkActive(pathname: string, href: string) {
  if (href.startsWith("#")) {
    return false;
  }

  return pathname === href;
}

export function LandingNavbar({ audience }: { audience: LandingNavbarAudience }) {
  const pathname = usePathname();
  const lastScrollY = useRef(0);
  const [hidden, setHidden] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const config = landingNavbarConfig[audience];
  const AudienceIcon = audience === "company" ? BriefcaseBusiness : GraduationCap;

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const delta = currentScrollY - lastScrollY.current;

      if (currentScrollY < 12) {
        setHidden(false);
      } else if (delta > 8) {
        setHidden(true);
      } else if (delta < -8) {
        setHidden(false);
      }

      lastScrollY.current = currentScrollY;
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={cn(
        "landing-nav pointer-events-none fixed inset-x-0 top-0 z-50 w-full px-3 pt-3 transition-[opacity,transform] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] sm:px-4 lg:px-6",
        hidden && !menuOpen
          ? "-translate-y-[calc(100%+1rem)] opacity-0"
          : "translate-y-0 opacity-100",
      )}
    >
      <div
        className={cn(
          "pointer-events-auto mx-auto flex h-14 max-w-[1480px] origin-top items-center gap-3 rounded-2xl border border-white/10 bg-[#07142f]/96 px-3 shadow-[0_18px_52px_-32px_rgba(7,20,47,0.9)] backdrop-blur-xl transition-[box-shadow,background-color] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] sm:h-16 sm:px-4 lg:px-5",
        )}
      >
        <Student2WorkBrand href={config.homeHref} compact={false} />

        <nav className="hidden min-w-0 flex-1 items-center justify-center gap-1 lg:flex">
          {config.links.map((link) => {
            const active = isLandingLinkActive(pathname, link.href);

            return (
              <Link
                key={`${link.href}-${link.label}`}
                href={link.href}
                className={cn(
                  "relative inline-flex h-10 items-center rounded-xl px-3 text-xs font-black transition-all",
                  active
                    ? "bg-white/10 text-white"
                    : "text-white/58 hover:bg-white/8 hover:text-white",
                )}
              >
                {link.label}
                {active ? (
                  <span className="absolute bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-[#c5fb37]" />
                ) : null}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto hidden items-center gap-2 md:flex">
          <span className="hidden h-9 items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 text-xs font-black text-white/68 xl:inline-flex">
            <AudienceIcon className="h-3.5 w-3.5 text-[#c5fb37]" />
            {config.audienceLabel}
          </span>
          <Link
            href="/auth"
            className="inline-flex h-10 items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 text-xs font-black text-white/78 transition hover:bg-white/10 hover:text-white"
          >
            <LogIn className="h-3.5 w-3.5" />
            Zaloguj się
          </Link>
          <Link
            href={config.ctaHref}
            className="inline-flex h-10 items-center rounded-full bg-[#c5fb37] px-5 text-xs font-black text-[#07142f] shadow-[0_14px_32px_-18px_rgba(197,251,55,0.9)] transition hover:-translate-y-0.5 hover:bg-[#d8ff52]"
          >
            {config.ctaLabel}
          </Link>
        </div>

        <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
          <SheetTrigger asChild>
            <button
              type="button"
              className="ml-auto inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white/80 transition hover:bg-white/10 hover:text-white md:hidden"
              aria-label="Otwórz menu"
            >
              <Menu className="h-5 w-5" />
            </button>
          </SheetTrigger>
          <SheetContent
            side="right"
            className="w-[min(90vw,22rem)] border-l border-white/10 bg-[#07142f] p-4 text-white [&>button]:rounded-xl [&>button]:bg-white/10 [&>button]:text-white/70 [&>button]:hover:text-white"
          >
            <SheetHeader className="mb-6 border-b border-white/10 pb-5 text-left">
              <SheetTitle className="text-white">
                <Student2WorkBrand href={config.homeHref} />
              </SheetTitle>
              <SheetDescription className="sr-only">
                Nawigacja strony Student2Work.
              </SheetDescription>
            </SheetHeader>

            <div className="grid gap-1">
              {config.links.map((link) => (
                <Link
                  key={`${link.href}-${link.label}-mobile`}
                  href={link.href}
                  className="rounded-xl px-3 py-3 text-sm font-black text-white/70 transition hover:bg-white/10 hover:text-white"
                >
                  {link.label}
                </Link>
              ))}
            </div>

            <div className="mt-6 grid gap-3 border-t border-white/10 pt-5">
              <Link
                href={config.ctaHref}
                className="inline-flex h-12 items-center justify-center rounded-xl bg-[#c5fb37] px-5 text-sm font-black text-[#07142f]"
              >
                {config.ctaLabel}
              </Link>
              <Link
                href="/auth"
                className="inline-flex h-12 items-center justify-center rounded-xl border border-white/10 bg-white/5 px-5 text-sm font-black text-white/78"
              >
                Zaloguj się
              </Link>
            </div>

          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
