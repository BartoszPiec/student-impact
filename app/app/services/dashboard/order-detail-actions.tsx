"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Banknote, CheckCircle2, Loader2, MessageSquare, RefreshCw, Trash2 } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";

import {
  acceptServiceCounterAction,
  confirmStudentSelectionAction,
  proposeServicePriceAction,
  rejectOrderAction,
} from "../_actions";

interface OrderDetailActionsProps {
  order: any;
  chatLink: string;
}

export default function OrderDetailActions({ order, chatLink }: OrderDetailActionsProps) {
  const router = useRouter();
  const [price, setPrice] = useState(order.amount);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [rejectLoading, setRejectLoading] = useState(false);
  const [counterLoading, setCounterLoading] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [openProposal, setOpenProposal] = useState(false);

  const handlePropose = async () => {
    if (!price || Number.isNaN(parseFloat(price))) {
      toast.error("Wprowadz prawidlowa kwote.");
      return;
    }

    try {
      setLoading(true);
      await proposeServicePriceAction(order.id, parseFloat(price), message);
      toast.success("Oferta i wiadomosc zostaly wyslane.");
      setOpenProposal(false);
      router.refresh();
    } catch (e: any) {
      toast.error(e.message || "Wystapil blad.");
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptCounter = async () => {
    try {
      setCounterLoading(true);
      await acceptServiceCounterAction(order.id);
      toast.success("Zaakceptowales kontrofertes. Zamowienie przechodzi do realizacji.");
      router.refresh();
    } catch (e: any) {
      toast.error(e.message || "Wystapil blad.");
    } finally {
      setCounterLoading(false);
    }
  };

  const handleConfirmSelection = async () => {
    try {
      setConfirmLoading(true);
      await confirmStudentSelectionAction(order.id);
      toast.success("Potwierdziles rozpoczecie realizacji.");
      router.refresh();
    } catch (e: any) {
      toast.error(e.message || "Nie udalo sie potwierdzic realizacji.");
    } finally {
      setConfirmLoading(false);
    }
  };

  const handleReject = async () => {
    if (!confirm("Czy na pewno chcesz odrzucic to zapytanie? Zniknie ono z listy.")) {
      return;
    }

    try {
      setRejectLoading(true);
      await rejectOrderAction(order.id);
      toast.success("Zapytanie odrzucone.");
      router.push("/app/services/dashboard");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setRejectLoading(false);
    }
  };

  const isRealizationActive = ["accepted", "active", "in_progress", "delivered", "completed"].includes(order.status);

  return (
    <div className="flex w-full flex-wrap gap-3 sm:w-auto">
      {isRealizationActive ? (
        <Link href={`/app/deliverables/${order.id}`} className="flex-1 sm:flex-none">
          <Button className="w-full bg-indigo-600 text-white shadow-sm hover:bg-indigo-700">Panel realizacji</Button>
        </Link>
      ) : null}

      <Link href={chatLink} className="flex-1 sm:flex-none">
        <Button variant="outline" className="w-full">
          <MessageSquare className="mr-2 h-4 w-4" />
          Czat / wiadomosc
        </Button>
      </Link>

      {(order.status === "inquiry" || order.status === "pending") ? (
        <Dialog open={openProposal} onOpenChange={setOpenProposal}>
          <DialogTrigger asChild>
            <Button variant="outline" className="flex-1 border-indigo-600 text-indigo-600 hover:bg-indigo-50 sm:flex-none">
              <Banknote className="mr-2 h-4 w-4" />
              Zloz oferte
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Zaproponuj cene</DialogTitle>
              <DialogDescription>
                Klient poprosil o wycene. Podaj stawke za realizacje.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <label className="mb-1 block text-sm font-medium">Twoja stawka (PLN)</label>
                <Input type="number" value={price} onChange={(e) => setPrice(e.target.value)} min={1} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Wiadomosc do klienta (opcjonalnie)</label>
                <Textarea
                  placeholder="Np. moge zaczac od wtorku i rozpisze prace na etapy..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpenProposal(false)}>
                Anuluj
              </Button>
              <Button onClick={handlePropose} disabled={loading} variant="outline" className="border-indigo-600 text-indigo-600 hover:bg-indigo-50">
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Wyslij oferte
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      ) : null}

      {order.status === "pending_student_confirmation" || order.status === "pending_confirmation" ? (
        <Button onClick={handleConfirmSelection} disabled={confirmLoading} className="flex-1 bg-emerald-600 text-white hover:bg-emerald-700 sm:flex-none">
          {confirmLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
          Potwierdz realizacje
        </Button>
      ) : null}

      {order.status === "proposal_sent" ? (
        <Button disabled variant="secondary" className="cursor-not-allowed opacity-80">
          Czekasz na decyzje firmy
        </Button>
      ) : null}

      {order.status === "countered" ? (
        <div className="flex flex-1 flex-col gap-3 rounded-2xl border border-orange-200 bg-orange-50 p-3 sm:min-w-[340px] sm:flex-none">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-sm font-medium text-orange-700">
              <RefreshCw className="h-3.5 w-3.5" />
              Firma zlozyla kontrofertes
            </div>
            <p className="text-sm text-orange-800">
              Klient proponuje <span className="font-bold">{order.counter_amount} PLN</span>. Mozesz zaakceptowac te stawke
              albo wrocic do rozmowy na czacie.
            </p>
          </div>
          <Button onClick={handleAcceptCounter} disabled={counterLoading} className="w-full bg-emerald-600 text-white hover:bg-emerald-700 sm:w-auto">
            {counterLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
            Akceptuj {order.counter_amount} PLN
          </Button>
        </div>
      ) : null}

      <Button variant="destructive" onClick={handleReject} disabled={rejectLoading} className="flex-1 sm:flex-none">
        {rejectLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
        Odrzuc
      </Button>
    </div>
  );
}
