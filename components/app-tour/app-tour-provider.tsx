"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Building2, Check, GraduationCap, X } from "lucide-react";
import { cn } from "@/lib/utils";

type TourRole = "company" | "student";
type TourResult = "completed" | "skipped";

type TourStep = {
  route: string;
  target: string;
  title: string;
  description: string;
};

type TargetRect = {
  top: number;
  right: number;
  bottom: number;
  left: number;
  width: number;
  height: number;
};

type AppTourContextValue = {
  available: boolean;
  restart: () => void;
};

const TOUR_VERSION = "v1";
const SPOTLIGHT_GAP = 8;
const TOOLTIP_GAP = 14;
const TOOLTIP_MAX_WIDTH = 380;

const COMPANY_STEPS: TourStep[] = [
  {
    route: "/app/company/packages",
    target: "tour-home",
    title: "Poznaj panel firmy",
    description: "W kilku krokach pokażemy Ci, gdzie zlecać pracę, wybierać wykonawców i odbierać gotowe realizacje.",
  },
  {
    route: "/app/company/packages",
    target: "company-catalog",
    title: "Wybierz gotową usługę",
    description: "W katalogu znajdziesz gotowe pakiety Quick Task. Wybierz usługę, dopasuj zakres i rozpocznij zamówienie bez publikowania ogłoszenia.",
  },
  {
    route: "/app/company/jobs/new",
    target: "company-create-offer",
    title: "Opublikuj własne zlecenie",
    description: "Jeśli potrzebujesz niestandardowej realizacji, przygotuj brief, budżet, termin i etapy. Studenci będą mogli aplikować na ogłoszenie.",
  },
  {
    route: "/app/company/offers",
    target: "company-offers",
    title: "Wybierz studenta",
    description: "Otwórz swoje ogłoszenie, porównaj aplikacje i zaakceptuj najlepszego kandydata. Z tego miejsca wrócisz też do aktywnych ofert.",
  },
  {
    route: "/app/company/orders",
    target: "company-orders",
    title: "Odbieraj i akceptuj pracę",
    description: "Tutaj śledzisz zamówione usługi. Po dostarczeniu etapu możesz zaakceptować realizację albo poprosić o poprawki.",
  },
  {
    route: "/app/chat",
    target: "company-chat",
    title: "Ustal szczegóły w wiadomościach",
    description: "Czat służy do rozmowy o zakresie, terminie i stawce. Uzgodnienia zapisują się przy danej współpracy i są dostępne dla obu stron.",
  },
];

const STUDENT_STEPS: TourStep[] = [
  {
    route: "/app/jobs",
    target: "tour-home",
    title: "Poznaj panel studenta",
    description: "Pokażemy Ci, gdzie znaleźć zlecenia, śledzić aplikacje, wystawić własne usługi i negocjować warunki współpracy.",
  },
  {
    route: "/app/jobs",
    target: "student-jobs",
    title: "Znajdź odpowiednie zlecenie",
    description: "Na giełdzie filtrujesz oferty według kategorii i budżetu. Otwórz interesujące zlecenie, przeczytaj brief i wyślij aplikację.",
  },
  {
    route: "/app/applications",
    target: "student-applications",
    title: "Kontroluj swoje aplikacje",
    description: "Tutaj sprawdzisz, które zgłoszenia oczekują na decyzję, zostały zaakceptowane albo wymagają dalszego działania.",
  },
  {
    route: "/app/services/my",
    target: "student-services",
    title: "Twórz własne usługi",
    description: "Dodaj usługę z opisem, ceną i zakresem. Firma może kupić ją bezpośrednio, a Ty zarządzasz publikacją z tego panelu.",
  },
  {
    route: "/app/chat",
    target: "student-chat",
    title: "Negocjuj stawkę i termin",
    description: "Po rozpoczęciu rozmowy użyj menu „+”, aby zaproponować stawkę lub termin. Druga strona może zaakceptować albo odrzucić propozycję.",
  },
];

const AppTourContext = createContext<AppTourContextValue | null>(null);

function getSteps(role: TourRole): TourStep[] {
  return role === "company" ? COMPANY_STEPS : STUDENT_STEPS;
}

function getStorageKey(userId: string, role: TourRole): string {
  return `student2work:product-tour:${TOUR_VERSION}:${userId}:${role}`;
}

function readTourResult(storageKey: string): TourResult | null {
  try {
    const value = window.localStorage.getItem(storageKey);
    return value === "completed" || value === "skipped" ? value : null;
  } catch {
    return null;
  }
}

function writeTourResult(storageKey: string, result: TourResult): void {
  try {
    window.localStorage.setItem(storageKey, result);
  } catch {
    // Prywatny tryb przeglądarki może blokować localStorage.
  }
}

function rectChanged(previous: TargetRect | null, next: TargetRect): boolean {
  if (!previous) return true;
  return (
    Math.abs(previous.top - next.top) > 0.5
    || Math.abs(previous.left - next.left) > 0.5
    || Math.abs(previous.width - next.width) > 0.5
    || Math.abs(previous.height - next.height) > 0.5
  );
}

function findVisibleTarget(target: string): HTMLElement | null {
  const candidates = document.querySelectorAll<HTMLElement>(`[data-tour="${target}"]`);

  for (const candidate of candidates) {
    const rect = candidate.getBoundingClientRect();
    const style = window.getComputedStyle(candidate);
    if (
      rect.width > 0
      && rect.height > 0
      && style.display !== "none"
      && style.visibility !== "hidden"
    ) {
      return candidate;
    }
  }

  return null;
}

export function AppTourProvider({
  children,
  userId,
  role,
  enabled,
}: {
  children: ReactNode;
  userId: string;
  role: string | null;
  enabled: boolean;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const supportedRole = role === "company" || role === "student" ? role : null;
  const available = Boolean(enabled && supportedRole);
  const steps = useMemo(() => (supportedRole ? getSteps(supportedRole) : []), [supportedRole]);
  const storageKey = supportedRole ? getStorageKey(userId, supportedRole) : null;

  const [isOpen, setIsOpen] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState<TargetRect | null>(null);
  const [tooltipHeight, setTooltipHeight] = useState(260);
  const dialogRef = useRef<HTMLDivElement>(null);

  const restart = useCallback(() => {
    if (!available || steps.length === 0) return;
    setStepIndex(0);
    setTargetRect(null);
    setIsOpen(true);
  }, [available, steps.length]);

  const closeWithResult = useCallback((result: TourResult) => {
    if (storageKey) writeTourResult(storageKey, result);
    setIsOpen(false);
    setTargetRect(null);
  }, [storageKey]);

  useEffect(() => {
    if (!available || !storageKey || readTourResult(storageKey)) return;

    const timer = window.setTimeout(() => {
      setIsOpen(true);
    }, 700);

    return () => window.clearTimeout(timer);
  }, [available, storageKey]);

  const step = steps[stepIndex] ?? null;

  useLayoutEffect(() => {
    if (!isOpen || !step) return;

    if (pathname !== step.route) {
      router.push(step.route);
      return;
    }

    let frameId = 0;
    let resizeObserver: ResizeObserver | null = null;

    const updateTarget = () => {
      window.cancelAnimationFrame(frameId);
      frameId = window.requestAnimationFrame(() => {
        const element = findVisibleTarget(step.target);
        if (!element) {
          setTargetRect(null);
          return;
        }

        const rect = element.getBoundingClientRect();
        const nextRect: TargetRect = {
          top: rect.top,
          right: rect.right,
          bottom: rect.bottom,
          left: rect.left,
          width: rect.width,
          height: rect.height,
        };
        setTargetRect((previous) => (rectChanged(previous, nextRect) ? nextRect : previous));

        resizeObserver?.disconnect();
        resizeObserver = new ResizeObserver(updateTarget);
        resizeObserver.observe(element);
      });
    };

    updateTarget();
    const retryTimer = window.setTimeout(updateTarget, 180);
    window.addEventListener("resize", updateTarget);
    window.addEventListener("scroll", updateTarget, { capture: true, passive: true });

    return () => {
      window.clearTimeout(retryTimer);
      window.cancelAnimationFrame(frameId);
      resizeObserver?.disconnect();
      window.removeEventListener("resize", updateTarget);
      window.removeEventListener("scroll", updateTarget, true);
    };
  }, [isOpen, pathname, router, step]);

  useLayoutEffect(() => {
    if (!isOpen) return;
    const dialog = dialogRef.current;
    if (!dialog) return;

    const updateHeight = () => {
      const height = dialog.getBoundingClientRect().height;
      if (height > 0) setTooltipHeight(height);
    };

    updateHeight();
    const observer = new ResizeObserver(updateHeight);
    observer.observe(dialog);
    dialog.focus();

    return () => observer.disconnect();
  }, [isOpen, stepIndex]);

  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeWithResult("skipped");
      }
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.documentElement.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [closeWithResult, isOpen]);

  const contextValue = useMemo<AppTourContextValue>(() => ({ available, restart }), [available, restart]);

  if (!isOpen || !step || !supportedRole) {
    return <AppTourContext.Provider value={contextValue}>{children}</AppTourContext.Provider>;
  }

  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const tooltipWidth = Math.min(TOOLTIP_MAX_WIDTH, viewportWidth - 32);
  const spotlight = targetRect
    ? {
        top: Math.max(0, targetRect.top - SPOTLIGHT_GAP),
        right: Math.min(viewportWidth, targetRect.right + SPOTLIGHT_GAP),
        bottom: Math.min(viewportHeight, targetRect.bottom + SPOTLIGHT_GAP),
        left: Math.max(0, targetRect.left - SPOTLIGHT_GAP),
      }
    : null;

  const tooltipTop = spotlight
    ? spotlight.bottom + TOOLTIP_GAP + tooltipHeight <= viewportHeight - 16
      ? spotlight.bottom + TOOLTIP_GAP
      : Math.max(16, spotlight.top - TOOLTIP_GAP - tooltipHeight)
    : Math.max(16, (viewportHeight - tooltipHeight) / 2);
  const tooltipLeft = spotlight
    ? Math.min(
        viewportWidth - tooltipWidth - 16,
        Math.max(16, (spotlight.left + spotlight.right - tooltipWidth) / 2),
      )
    : Math.max(16, (viewportWidth - tooltipWidth) / 2);

  const isLastStep = stepIndex === steps.length - 1;
  const roleLabel = supportedRole === "company" ? "Panel firmy" : "Panel studenta";
  const RoleIcon = supportedRole === "company" ? Building2 : GraduationCap;

  return (
    <AppTourContext.Provider value={contextValue}>
      {children}

      <div className="fixed inset-0 z-[200]" data-testid="app-tour-overlay">
        {spotlight ? (
          <>
            <div className="fixed left-0 right-0 top-0 bg-slate-950/55 backdrop-blur-[1px]" style={{ height: spotlight.top }} />
            <div className="fixed left-0 bg-slate-950/55 backdrop-blur-[1px]" style={{ top: spotlight.top, width: spotlight.left, height: spotlight.bottom - spotlight.top }} />
            <div className="fixed right-0 bg-slate-950/55 backdrop-blur-[1px]" style={{ top: spotlight.top, width: viewportWidth - spotlight.right, height: spotlight.bottom - spotlight.top }} />
            <div className="fixed bottom-0 left-0 right-0 bg-slate-950/55 backdrop-blur-[1px]" style={{ top: spotlight.bottom }} />
            <div
              className="pointer-events-none fixed rounded-2xl border-2 border-indigo-300 shadow-[0_0_0_4px_rgba(99,102,241,0.22),0_18px_55px_rgba(15,23,42,0.35)] transition-all duration-300"
              style={{
                top: spotlight.top,
                left: spotlight.left,
                width: spotlight.right - spotlight.left,
                height: spotlight.bottom - spotlight.top,
              }}
            />
          </>
        ) : (
          <div className="fixed inset-0 bg-slate-950/55 backdrop-blur-[1px]" />
        )}

        <div
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="app-tour-title"
          tabIndex={-1}
          data-testid="app-tour-dialog"
          className="fixed max-h-[calc(100vh-2rem)] overflow-y-auto rounded-[1.75rem] border border-white/70 bg-white p-5 text-slate-900 shadow-2xl shadow-slate-950/30 outline-none sm:p-6"
          style={{ top: tooltipTop, left: tooltipLeft, width: tooltipWidth }}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-200">
                <RoleIcon className="h-5 w-5" />
              </div>
              <div>
                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-500">{roleLabel}</div>
                <div className="mt-0.5 text-xs font-bold text-slate-400">Krok {stepIndex + 1} z {steps.length}</div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => closeWithResult("skipped")}
              aria-label="Pomiń samouczek"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-[width] duration-300"
              style={{ width: `${((stepIndex + 1) / steps.length) * 100}%` }}
            />
          </div>

          <h2 id="app-tour-title" className="mt-5 text-xl font-black tracking-tight text-slate-950 sm:text-2xl">
            {step.title}
          </h2>
          <p className="mt-2 text-sm font-medium leading-6 text-slate-600">
            {step.description}
          </p>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => closeWithResult("skipped")}
              className="text-sm font-bold text-slate-400 transition hover:text-slate-700"
            >
              Pomiń samouczek
            </button>
            <div className="ml-auto flex items-center gap-2">
              {stepIndex > 0 ? (
                <button
                  type="button"
                  onClick={() => {
                    setTargetRect(null);
                    setStepIndex((current) => Math.max(0, current - 1));
                  }}
                  className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 transition hover:border-indigo-200 hover:bg-indigo-50"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Wstecz
                </button>
              ) : null}
              <button
                type="button"
                data-testid="app-tour-next"
                onClick={() => {
                  if (isLastStep) {
                    closeWithResult("completed");
                    return;
                  }
                  setTargetRect(null);
                  setStepIndex((current) => Math.min(steps.length - 1, current + 1));
                }}
                className={cn(
                  "inline-flex h-10 items-center gap-2 rounded-xl px-4 text-sm font-black text-white shadow-lg transition active:scale-95",
                  isLastStep
                    ? "bg-emerald-600 shadow-emerald-200 hover:bg-emerald-700"
                    : "bg-indigo-600 shadow-indigo-200 hover:bg-indigo-700",
                )}
              >
                {isLastStep ? (
                  <>
                    Gotowe <Check className="h-4 w-4" />
                  </>
                ) : (
                  <>
                    Dalej <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </AppTourContext.Provider>
  );
}

export function useAppTour(): AppTourContextValue {
  const context = useContext(AppTourContext);
  if (!context) {
    throw new Error("useAppTour musi być użyty wewnątrz AppTourProvider.");
  }
  return context;
}
