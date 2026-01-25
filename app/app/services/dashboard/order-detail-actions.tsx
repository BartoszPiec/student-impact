"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { proposeServicePriceAction, rejectOrderAction } from "../_actions";
import { Loader2, MessageSquare, Banknote, Trash2 } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { useRouter } from "next/navigation";

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
    const [openProposal, setOpenProposal] = useState(false);

    const handlePropose = async () => {
        console.log("handlePropose clicked", { price, message });
        if (!price || isNaN(parseFloat(price))) {
            toast.error("Wprowadź prawidłową kwotę.");
            return;
        }

        try {
            setLoading(true);
            await proposeServicePriceAction(order.id, parseFloat(price), message);
            toast.success("Oferta i wiadomość zostały wysłane!");
            setOpenProposal(false);
            router.refresh();
        } catch (e: any) {
            console.error("Client Error:", e);
            toast.error(e.message || "Wystąpił błąd.");
        } finally {
            setLoading(false);
        }
    };

    const handleReject = async () => {
        if (!confirm("Czy na pewno chcesz odrzucić to zapytanie? Zniknie ono z listy.")) return;
        try {
            setRejectLoading(true);
            await rejectOrderAction(order.id);
            toast.success("Zapytanie odrzucone.");
            router.push("/app/services/dashboard"); // Redirect back to dashboard
        } catch (e: any) {
            toast.error(e.message);
        } finally {
            setRejectLoading(false);
        }
    }

    const isRealizationActive = ['accepted', 'in_progress', 'delivered', 'completed'].includes(order.status);

    return (
        <div className="flex flex-wrap gap-3 w-full sm:w-auto">
            {/* Realization Button Action */}
            {isRealizationActive && (
                <Link href={`/app/deliverables/${order.id}`} className="flex-1 sm:flex-none">
                    <Button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm">
                        Panel Realizacji
                    </Button>
                </Link>
            )}

            <Link href={chatLink} className="flex-1 sm:flex-none">
                <Button variant="outline" className="w-full">
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Czat / Wiadomość
                </Button>
            </Link>

            {(order.status === 'inquiry' || order.status === 'pending') && (
                <Dialog open={openProposal} onOpenChange={setOpenProposal}>
                    <DialogTrigger asChild>
                        <Button variant="outline" className="border-indigo-600 text-indigo-600 hover:bg-indigo-50 flex-1 sm:flex-none">
                            <Banknote className="w-4 h-4 mr-2" />
                            Złóż Ofertę
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Zaproponuj Cenę</DialogTitle>
                            <DialogDescription>
                                Klient zapytał o wycenę. Podaj swoją stawkę za realizację tego zlecenia.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="py-4 space-y-4">
                            <div>
                                <label className="text-sm font-medium mb-1 block">Twoja stawka (PLN)</label>
                                <Input
                                    type="number"
                                    value={price}
                                    onChange={(e) => setPrice(e.target.value)}
                                    min={1}
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium mb-1 block">Wiadomość do klienta (opcjonalne)</label>
                                <Textarea
                                    placeholder="Np. proponuję termin na wtorek..."
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    rows={3}
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setOpenProposal(false)}>Anuluj</Button>
                            <Button onClick={handlePropose} disabled={loading} variant="outline" className="border-indigo-600 text-indigo-600 hover:bg-indigo-50">
                                {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                                Wyślij Ofertę
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            )}

            {order.status === 'proposal_sent' && (
                <Button disabled variant="secondary" className="flex-1 sm:flex-none opacity-80 cursor-not-allowed">
                    Oferta Wysłana
                </Button>
            )}

            <Button
                variant="destructive"
                onClick={handleReject}
                disabled={rejectLoading}
                className="flex-1 sm:flex-none"
            >
                {rejectLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Trash2 className="w-4 h-4 mr-2" />}
                Odrzuć
            </Button>
        </div>
    );
}
