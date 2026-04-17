"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { CheckCircle2, Loader2, MessageSquare, RefreshCw, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { acceptServiceProposalAction, counterServiceProposalAction, rejectServiceProposalAction } from "@/app/app/services/_actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

interface CompanyOrderDetailActionsProps {
  order: any;
  chatLink: string;
  canMessage?: boolean;
}

export default function CompanyOrderDetailActions({
  order,
  chatLink,
  canMessage = true,
}: CompanyOrderDetailActionsProps) {
  const router = useRouter();
  const [counterAmount, setCounterAmount] = useState(String(order.counter_amount ?? order.amount ?? ""));
  const [counterOpen, setCounterOpen] = useState(false);
  const [acceptLoading, setAcceptLoading] = useState(false);
  const [counterLoading, setCounterLoading] = useState(false);
  const [rejectLoading, setRejectLoading] = useState(false);

  const isRealizationActive = ["accepted", "active", "in_progress", "revision", "delivered", "completed"].includes(order.status);
  const isPendingSelection = order.status === "pending_selection";
  const isPendingStudentConfirmation = ["pending_student_confirmation", "pending_confirmation"].includes(order.status);
  const canReject = [
    "inquiry",
    "pending",
    "pending_selection",
    "pending_student_confirmation",
    "pending_confirmation",
    "proposal_sent",
    "countered",
  ].includes(order.status);

  const handleAcceptProposal = async () => {
    try {
      setAcceptLoading(true);
      await acceptServiceProposalAction(order.id);
      toast.success("Oferta studenta zostala zaakceptowana.");
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || "Nie udalo sie zaakceptowac oferty.");
    } finally {
      setAcceptLoading(false);
    }
  };

  const handleCounter = async () => {
    const amount = Number(counterAmount);
    if (!amount || Number.isNaN(amount) || amount <= 0) {
      toast.error("Podaj prawidlowa kwote kontroferty.");
      return;
    }

    try {
      setCounterLoading(true);
      await counterServiceProposalAction(order.id, amount);
      toast.success("Kontroferta zostala wyslana do studenta.");
      setCounterOpen(false);
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || "Nie udalo sie wyslac kontroferty.");
    } finally {
      setCounterLoading(false);
    }
  };

  const handleReject = async () => {
    if (!confirm("Czy na pewno chcesz zamknac te negocjacje?")) {
      return;
    }

    try {
      setRejectLoading(true);
      await rejectServiceProposalAction(order.id);
      toast.success("Negocjacja zostala zakonczona.");
      router.push("/app/company/orders");
    } catch (error: any) {
      toast.error(error.message || "Nie udalo sie zamknac negocjacji.");
    } finally {
      setRejectLoading(false);
    }
  };

  return (
    <div className="flex w-full flex-wrap gap-3 sm:w-auto">
      {isRealizationActive ? (
        <Link href={`/app/deliverables/${order.id}`} className="flex-1 sm:flex-none">
          <Button className="w-full bg-indigo-600 text-white hover:bg-indigo-700">Panel realizacji</Button>
        </Link>
      ) : null}

      {canMessage ? (
        <Link href={chatLink} className="flex-1 sm:flex-none">
          <Button variant="outline" className="w-full">
            <MessageSquare className="mr-2 h-4 w-4" />
            Czat / wiadomosc
          </Button>
        </Link>
      ) : (
        <Button disabled variant="secondary" className="flex-1 cursor-not-allowed opacity-80 sm:flex-none">
          <MessageSquare className="mr-2 h-4 w-4" />
          Czat aktywuje sie po wyborze studenta
        </Button>
      )}

      {order.status === "proposal_sent" ? (
        <>
          <Button
            onClick={handleAcceptProposal}
            disabled={acceptLoading}
            className="flex-1 bg-emerald-600 text-white hover:bg-emerald-700 sm:flex-none"
          >
            {acceptLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
            Akceptuj oferte
          </Button>

          <Dialog open={counterOpen} onOpenChange={setCounterOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="flex-1 border-orange-300 text-orange-700 hover:bg-orange-50 sm:flex-none">
                <RefreshCw className="mr-2 h-4 w-4" />
                Zloz kontroferte
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Kontroferta dla studenta</DialogTitle>
                <DialogDescription>Podaj nowa kwote, ktora chcesz zaproponowac wykonawcy.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <label className="mb-1 block text-sm font-medium">Nowa kwota (PLN)</label>
                  <Input type="number" value={counterAmount} onChange={(e) => setCounterAmount(e.target.value)} min={1} />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setCounterOpen(false)}>
                  Anuluj
                </Button>
                <Button onClick={handleCounter} disabled={counterLoading} className="bg-orange-600 text-white hover:bg-orange-700">
                  {counterLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Wyslij kontroferte
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      ) : null}

      {order.status === "countered" ? (
        <Button disabled variant="secondary" className="cursor-not-allowed opacity-80">
          Czekasz na decyzje studenta
        </Button>
      ) : null}

      {isPendingSelection ? (
        <Button disabled variant="secondary" className="cursor-not-allowed opacity-80">
          Wybierz studenta z listy ponizej
        </Button>
      ) : null}

      {isPendingStudentConfirmation ? (
        <Button disabled variant="secondary" className="cursor-not-allowed opacity-80">
          Czekasz na potwierdzenie realizacji przez studenta
        </Button>
      ) : null}

      {(order.status === "pending" || order.status === "inquiry") && !isPendingSelection ? (
        <Button disabled variant="secondary" className="cursor-not-allowed opacity-80">
          Czekasz na pierwsza wycene
        </Button>
      ) : null}

      {canReject ? (
        <Button variant="destructive" onClick={handleReject} disabled={rejectLoading} className="flex-1 sm:flex-none">
          {rejectLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
          Odrzuc
        </Button>
      ) : null}
    </div>
  );
}
