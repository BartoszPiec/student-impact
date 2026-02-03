
import { Button } from "@/components/ui/button";
import { Check, X, Banknote } from "lucide-react";
import { useState } from "react";
import { acceptRate, rejectRate, sendEventMessage } from "@/app/app/chat/_actions";
import { useTransition } from "react";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function RateCard({
    rate,
    isMine,
    isLatest,
    conversationId,
    messageId,
    status = "pending"
}: {
    rate: number;
    isMine: boolean;
    isLatest: boolean;
    conversationId: string;
    messageId: string;
    status?: "pending" | "accepted" | "rejected";
}) {
    const [pending, startTransition] = useTransition();
    const [counterOpen, setCounterOpen] = useState(false);
    const [counterValue, setCounterValue] = useState("");

    const handleAccept = () => {
        startTransition(async () => {
            try {
                await acceptRate(conversationId, messageId, rate);
            } catch (e) {
                alert("Błąd: " + e);
            }
        });
    };

    const handleReject = () => {
        startTransition(async () => {
            try {
                await rejectRate(conversationId, messageId, rate);
            } catch (e) {
                alert("Błąd: " + e);
            }
        });
    };

    const handleCounter = async () => {
        if (!counterValue) return;
        try {
            await sendEventMessage(conversationId, "rate.proposed", { proposed_stawka: parseFloat(counterValue) }, `Proponuję inną stawkę: ${counterValue} zł`);
            setCounterOpen(false);
            setCounterValue("");
        } catch (e) {
            alert("Błąd: " + e);
        }
    }

    const isInteractive = isLatest && !isMine && status === "pending";

    return (
        <div className={`
      relative p-4 rounded-xl border shadow-sm w-full max-w-[320px] bg-white text-slate-800
      ${isMine ? "border-indigo-100" : "border-slate-200"}
      ${status === 'accepted' ? 'border-emerald-200 bg-emerald-50/30' : ''}
      ${status === 'rejected' ? 'border-red-200 bg-red-50/30 opacity-70' : ''}
    `}>
            <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-md">
                        <Banknote className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Propozycja stawki</p>
                        <p className="text-xl font-bold tracking-tight">{rate} zł</p>
                    </div>
                </div>
            </div>

            {status === 'accepted' && (
                <div className="text-sm text-emerald-600 font-medium flex items-center gap-1.5 mb-1">
                    <Check className="w-4 h-4" /> Zaakceptowano
                </div>
            )}

            {status === 'rejected' && (
                <div className="text-sm text-red-600 font-medium flex items-center gap-1.5 mb-1">
                    <X className="w-4 h-4" /> Odrzucono
                </div>
            )}

            {isInteractive && (
                <div className="space-y-2 mt-2 pt-2 border-t border-slate-100">
                    <div className="grid grid-cols-2 gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleReject}
                            disabled={pending}
                            className="text-red-600 border-red-100 hover:bg-red-50 hover:text-red-700 h-9"
                        >
                            Odrzuć
                        </Button>
                        <Button
                            size="sm"
                            onClick={handleAccept}
                            disabled={pending}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-200 h-9"
                        >
                            {pending ? "..." : "Akceptuj"}
                        </Button>
                    </div>

                    <Dialog open={counterOpen} onOpenChange={setCounterOpen}>
                        <DialogTrigger asChild>
                            <Button
                                variant="secondary"
                                size="sm"
                                className="w-full bg-slate-100/80 hover:bg-slate-200 text-slate-600 h-9"
                            >
                                Zaproponuj inną
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Zaproponuj inną stawkę</DialogTitle>
                            </DialogHeader>
                            <div className="py-4 space-y-2">
                                <Label>Twoja propozycja (PLN)</Label>
                                <Input
                                    type="number"
                                    value={counterValue}
                                    onChange={e => setCounterValue(e.target.value)}
                                    placeholder="np. 1400"
                                />
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setCounterOpen(false)}>Anuluj</Button>
                                <Button onClick={handleCounter}>Wyślij propozycję</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            )}

            {!isInteractive && status === 'pending' && !isMine && !isLatest && (
                <p className="text-xs text-slate-400 italic mt-2">Ta propozycja wygasła.</p>
            )}

            {!isInteractive && status === 'pending' && isMine && (
                <p className="text-xs text-slate-400 italic mt-2">Oczekiwanie na decyzję...</p>
            )}
        </div>
    );
}
