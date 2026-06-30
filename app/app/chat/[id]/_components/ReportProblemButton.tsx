"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, ShieldAlert, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { reportProblem } from "@/app/app/chat/_actions";

export function ReportProblemButton({ conversationId }: { conversationId: string }) {
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [reason, setReason] = useState("");
    const [done, setDone] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();

    const reset = () => {
        setReason("");
        setDone(false);
        setError(null);
    };

    const handleSubmit = () => {
        const trimmed = reason.trim();
        if (!trimmed) {
            setError("Opisz krótko, na czym polega problem.");
            return;
        }

        setError(null);
        startTransition(async () => {
            try {
                await reportProblem(conversationId, trimmed);
                setDone(true);
                toast.success("Zgłoszenie wysłane do zespołu wsparcia.");
                router.refresh();
            } catch (err) {
                const message =
                    err instanceof Error ? err.message : "Nie udało się wysłać zgłoszenia.";
                setError(message);
                toast.error(message);
            }
        });
    };

    return (
        <>
            <Button
                type="button"
                variant="ghost"
                onClick={() => {
                    reset();
                    setOpen(true);
                }}
                className="w-full h-auto p-0 text-xs text-slate-400 hover:text-red-500 hover:bg-transparent justify-center"
            >
                <AlertTriangle className="w-3 h-3 mr-1.5" /> Zgłoś problem
            </Button>

            <Dialog
                open={open}
                onOpenChange={(next) => {
                    setOpen(next);
                    if (!next) reset();
                }}
            >
                <DialogContent className="rounded-[1.5rem]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <ShieldAlert className="h-5 w-5 text-red-500" /> Zgłoś problem
                        </DialogTitle>
                        <DialogDescription>
                            Opisz, co poszło nie tak. Zgłoszenie trafi do zespołu wsparcia
                            platformy, który skontaktuje się z obiema stronami. Powiązane zlecenie
                            zostanie oznaczone jako sporne.
                        </DialogDescription>
                    </DialogHeader>

                    {done ? (
                        <div className="flex flex-col items-center gap-3 py-6 text-center">
                            <div className="rounded-2xl bg-emerald-50 p-3 text-emerald-600">
                                <CheckCircle2 className="h-7 w-7" />
                            </div>
                            <p className="text-sm font-semibold text-slate-700">
                                Dziękujemy. Twoje zgłoszenie zostało przekazane do administracji.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-2 py-2">
                            <Textarea
                                value={reason}
                                onChange={(event) => setReason(event.target.value)}
                                rows={5}
                                maxLength={2000}
                                placeholder="Np. brak kontaktu ze strony wykonawcy, niezgodność z ustaleniami, problem z płatnością..."
                                className="min-h-[140px] rounded-2xl border-slate-200 bg-slate-50"
                                disabled={isPending}
                            />
                            {error ? (
                                <p className="text-xs font-semibold text-red-500">{error}</p>
                            ) : null}
                        </div>
                    )}

                    <DialogFooter>
                        {done ? (
                            <Button
                                onClick={() => setOpen(false)}
                                className="rounded-xl bg-slate-900 text-white hover:bg-slate-800"
                            >
                                Zamknij
                            </Button>
                        ) : (
                            <>
                                <Button
                                    variant="outline"
                                    onClick={() => setOpen(false)}
                                    disabled={isPending}
                                    className="rounded-xl border-slate-200"
                                >
                                    Anuluj
                                </Button>
                                <Button
                                    onClick={handleSubmit}
                                    disabled={isPending}
                                    className="rounded-xl bg-red-600 text-white hover:bg-red-700"
                                >
                                    {isPending ? "Wysyłanie..." : "Wyślij zgłoszenie"}
                                </Button>
                            </>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
