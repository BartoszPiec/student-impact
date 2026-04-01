"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { CheckCircle2, Loader2, MessageSquare, RefreshCw, Trash2 } from "lucide-react";
import { toast } from "sonner";

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

import { acceptServiceProposalAction, counterServiceProposalAction, rejectServiceProposalAction } from "@/app/app/services/_actions";

interface CompanyOrderDetailActionsProps {
  order: any;
  chatLink: string;
}

export default function CompanyOrderDetailActions({ order, chatLink }: CompanyOrderDetailActionsProps) {
  const router = useRouter();
  const [counterAmount, setCounterAmount] = useState(String(order.counter_amount ?? order.amount ?? ""));
  const [counterOpen, setCounterOpen] = useState(false);
  const [acceptLoading, setAcceptLoading] = useState(false);
  const [counterLoading, setCounterLoading] = useState(false);
  const [rejectLoading, setRejectLoading] = useState(false);

  const isRealizationActive = ["accepted", "in_progress", "delivered", "completed"].includes(order.status);
  const canReject = ["inquiry", "pending", "proposal_sent", "countered"].includes(order.status);

  const handleAcceptProposal = async () => {
    try {
      setAcceptLoading(true);
      await acceptServiceProposalAction(order.id);
      toast.success("Oferta studenta została zaakceptowana.");
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || "Nie udało się zaakceptować oferty.");
    } finally {
      setAcceptLoading(false);
    }
  };

  const handleCounter = async () => {
    const amount = Number(counterAmount);
    if (!amount || Number.isNaN(amount) || amount <= 0) {
      toast.error("Podaj prawidłową kwotę kontroferty.");
      return;
    }

    try {
      setCounterLoading(true);
      await counterServiceProposalAction(order.id, amount);
      toast.success("Kontroferta została wysłana do studenta.");
      setCounterOpen(false);
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || "Nie udało się wysłać kontroferty.");
    } finally {
      setCounterLoading(false);
    }
  };

  const handleReject = async () => {
    if (!confirm("Czy na pewno chcesz zamknąć tę negocjację?")) {
      return;
    }

    try {
      setRejectLoading(true);
      await rejectServiceProposalAction(order.id);
      toast.success("Negocjacja została zakończona.");
      router.push("/app/company/orders");
    } catch (error: any) {
      toast.error(error.message || "Nie udało się zamknąć negocjacji.");
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

      <Link href={chatLink} className="flex-1 sm:flex-none">
        <Button variant="outline" className="w-full">
          <MessageSquare className="mr-2 h-4 w-4" />
          Czat / wiadomość
        </Button>
      </Link>

      {order.status === "proposal_sent" ? (
        <>
          <Button onClick={handleAcceptProposal} disabled={acceptLoading} className="flex-1 bg-emerald-600 text-white hover:bg-emerald-700 sm:flex-none">
            {acceptLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
            Akceptuj ofertę
          </Button>

          <Dialog open={counterOpen} onOpenChange={setCounterOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="flex-1 border-orange-300 text-orange-700 hover:bg-orange-50 sm:flex-none">
                <RefreshCw className="mr-2 h-4 w-4" />
                Złóż kontrofertę
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Kontroferta dla studenta</DialogTitle>
                <DialogDescription>Podaj nową kwotę, którą chcesz zaproponować wykonawcy.</DialogDescription>
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
                  Wyślij kontrofertę
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      ) : null}

      {order.status === "countered" ? (
        <Button disabled variant="secondary" className="cursor-not-allowed opacity-80">
          Czekasz na decyzję studenta
        </Button>
      ) : null}

      {order.status === "pending" || order.status === "inquiry" ? (
        <Button disabled variant="secondary" className="cursor-not-allowed opacity-80">
          Czekasz na pierwszą wycenę
        </Button>
      ) : null}

      {canReject ? (
        <Button variant="destructive" onClick={handleReject} disabled={rejectLoading} className="flex-1 sm:flex-none">
          {rejectLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
          Odrzuć
        </Button>
      ) : null}
    </div>
  );
}
