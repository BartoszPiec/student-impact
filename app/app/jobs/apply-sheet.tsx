"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, AlertTriangle, CheckCircle2 } from "lucide-react";
import { applyToOffer } from "@/app/app/offers/[id]/_actions";
import { JobOffer } from "./job-card";

export function ApplySheet({
    offer,
    children,
    onSuccess
}: {
    offer: JobOffer;
    children: React.ReactNode;
    onSuccess?: () => void;
}) {
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [accepted, setAccepted] = useState(false);
    const [error, setError] = useState("");

    const router = useRouter();

    async function handleApply() {
        if (!accepted) return;
        setIsLoading(true);
        setError("");

        try {
            const result = await applyToOffer(offer.id, "Zgłoszenie z Giełdy (Systemowe)");
            if (result?.error) throw new Error(result.error);

            setIsOpen(false);
            if (onSuccess) onSuccess();

            if (result?.success && result?.redirectUrl) {
                router.refresh();
                router.push(result.redirectUrl);
            }
        } catch (e: any) {
            console.error(e);
            setError(e.message || "Wystąpił błąd podczas aplikowania.");
            setIsLoading(false);
        }
    }

    const scopeOfWork = (offer as any).obligations || offer.opis || "Szczegóły w opisie zlecenia.";

    const formatScopeOfWork = (text: string) => {
        // Simple splitter by newlines or '-'
        const lines = text.split(/[\n•-]+/).map(l => l.trim()).filter(l => l.length > 0);

        if (lines.length === 0) return <p className="text-sm text-slate-600">Brak szczegółowego opisu.</p>;

        return (
            <ul className="space-y-2">
                {lines.map((line, idx) => (
                    <li key={idx} className="flex gap-2 text-sm text-slate-700 items-start">
                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-2 flex-shrink-0" />
                        <span>{line}</span>
                    </li>
                ))}
            </ul>
        );
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                {children}
            </DialogTrigger>
            <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
                <DialogHeader className="space-y-2">
                    <DialogTitle className="text-xl md:text-2xl font-bold flex items-start gap-4">
                        <div className="bg-amber-100 text-amber-700 p-3 rounded-xl">
                            ⚡
                        </div>
                        <div>
                            Potwierdź zgłoszenie
                            <div className="text-base font-normal text-slate-500 mt-1 line-clamp-1">
                                {offer.tytul}
                            </div>
                        </div>
                    </DialogTitle>
                    <DialogDescription className="pt-2">
                        To jest <strong>Zlecenie Systemowe</strong> (Gwarantowane). Aplikując, zobowiązujesz się do jego realizacji.
                    </DialogDescription>
                </DialogHeader>

                <div className="py-6 space-y-6">
                    {/* SCOPE OF WORK */}
                    <div className="bg-slate-50/80 p-5 rounded-xl border border-slate-100">
                        <h4 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-indigo-600" />
                            Zakres Obowiązków
                        </h4>
                        <div className="max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                            {formatScopeOfWork(scopeOfWork)}
                        </div>
                    </div>

                    {/* CONFIRMATION */}
                    <div className="flex items-start space-x-3 p-4 bg-amber-50 rounded-xl border border-amber-100/50">
                        <Checkbox
                            id="accept-terms"
                            checked={accepted}
                            onCheckedChange={(c) => setAccepted(c === true)}
                            className="mt-1 border-amber-600 data-[state=checked]:bg-amber-600"
                        />
                        <div className="space-y-1">
                            <Label htmlFor="accept-terms" className="text-sm font-medium text-amber-900 cursor-pointer">
                                Akceptuję odpowiedzialność
                            </Label>
                            <p className="text-xs text-amber-700/80 leading-relaxed">
                                Rozumiem, że przyjęcie zlecenia wiąże się z obowiązkiem jego wykonania w wyznaczonym terminie.
                            </p>
                        </div>
                    </div>

                    {error && (
                        <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg flex items-center gap-2 border border-red-100">
                            <AlertTriangle className="h-4 w-4" />
                            {error}
                        </div>
                    )}
                </div>

                <DialogFooter className="gap-2 sm:gap-0 sticky bottom-0 bg-white pt-2">
                    <Button variant="outline" onClick={() => setIsOpen(false)}>
                        Anuluj
                    </Button>
                    <Button
                        onClick={handleApply}
                        disabled={!accepted || isLoading}
                        className="bg-amber-600 hover:bg-amber-700 text-white min-w-[140px]"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Wysyłanie...
                            </>
                        ) : (
                            "Potwierdzam"
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
