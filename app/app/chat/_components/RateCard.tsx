"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Banknote, Check, X } from "lucide-react";

import { acceptRate, rejectRate } from "@/app/app/chat/_actions";
import { Button } from "@/components/ui/button";

export function RateCard({
  rate,
  isMine,
  isLatest,
  conversationId,
  messageId,
  status = "pending",
  locked = false,
}: {
  rate: number;
  isMine: boolean;
  isLatest: boolean;
  conversationId: string;
  messageId: string;
  status?: "pending" | "accepted" | "rejected";
  locked?: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const handleAccept = () => {
    startTransition(async () => {
      try {
        await acceptRate(conversationId, messageId, rate);
        router.refresh();
      } catch (error) {
        alert(error instanceof Error ? error.message : "Nie udało się zaakceptować stawki.");
        router.refresh();
      }
    });
  };

  const handleReject = () => {
    startTransition(async () => {
      try {
        await rejectRate(conversationId, messageId, rate);
        router.refresh();
      } catch (error) {
        alert(error instanceof Error ? error.message : "Nie udało się odrzucić stawki.");
        router.refresh();
      }
    });
  };

  const effectiveStatus = locked && status === "pending" ? "rejected" : status;
  const isInteractive = isLatest && !isMine && effectiveStatus === "pending" && !locked;

  return (
    <div
      className={`
        relative w-full max-w-[min(78vw,320px)] rounded-xl border bg-white p-4 text-slate-800 shadow-sm
        ${isMine ? "border-indigo-100" : "border-slate-200"}
        ${effectiveStatus === "accepted" ? "border-emerald-200 bg-emerald-50/30" : ""}
        ${effectiveStatus === "rejected" ? "border-red-200 bg-red-50/30 opacity-70" : ""}
      `}
    >
      <div className="mb-3 flex items-start justify-between">
        <div className="flex items-center gap-2">
          <div className="rounded-md bg-indigo-50 p-1.5 text-indigo-600">
            <Banknote className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Propozycja stawki</p>
            <p className="text-xl font-bold tracking-tight">{rate} zł</p>
          </div>
        </div>
      </div>

      {effectiveStatus === "accepted" ? (
        <div className="mb-1 flex items-center gap-1.5 text-sm font-medium text-emerald-600">
          <Check className="h-4 w-4" /> Zaakceptowano
        </div>
      ) : null}

      {effectiveStatus === "rejected" ? (
        <div className="mb-1 flex items-center gap-1.5 text-sm font-medium text-red-600">
          <X className="h-4 w-4" /> Negocjacje zamknięte
        </div>
      ) : null}

      {isInteractive ? (
        <div className="mt-2 border-t border-slate-100 pt-2">
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleReject}
              disabled={pending}
              className="h-9 border-red-100 text-red-600 hover:bg-red-50 hover:text-red-700"
            >
              Odrzuć
            </Button>
            <Button
              size="sm"
              onClick={handleAccept}
              disabled={pending}
              className="h-9 bg-emerald-600 text-white shadow-emerald-200 hover:bg-emerald-700"
            >
              {pending ? "..." : "Akceptuj"}
            </Button>
          </div>
        </div>
      ) : null}

      {!isInteractive && effectiveStatus === "pending" && !isMine && !isLatest ? (
        <p className="mt-2 text-xs italic text-slate-400">Ta propozycja wygasła.</p>
      ) : null}

      {!isInteractive && effectiveStatus === "pending" && isMine ? (
        <p className="mt-2 text-xs italic text-slate-400">Oczekiwanie na decyzję...</p>
      ) : null}
    </div>
  );
}
