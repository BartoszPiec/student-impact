"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Loader2, AlertTriangle, CheckCircle2, ClipboardList, Info } from "lucide-react";
import { applyToOffer } from "@/app/app/offers/[id]/_actions";
import { parsePackageBriefDescription } from "@/lib/services/package-customization";
import { JobOffer } from "./job-card";

type ConfirmationDetails = {
    scopeLines: string[];
    companyDetails: Array<{ label: string; value: string }>;
};

function isMeaningfulText(value: unknown) {
    if (typeof value !== "string") return false;
    const normalized = value.trim();
    return normalized.length > 0 && !["()", "[]", "{}", "-", "—"].includes(normalized);
}

function splitScopeLines(text: string) {
    return text
        .split(/\r?\n|•|(?:^|\s)-\s+/)
        .map((line) => line.trim())
        .filter((line) => isMeaningfulText(line) && !/^https?:\/\//i.test(line));
}

function stripMarkdown(text: string) {
    return text
        .replace(/^#{1,4}\s+/gm, "")
        .replace(/\*\*(.*?)\*\*/g, "$1")
        .trim();
}

function formatAnswerValue(label: string, value: string) {
    const normalized = value.trim();
    const lower = normalized.toLowerCase();

    if (lower === "no_logo") return "Logo nie zostało przekazane.";
    if (lower === "platform") return "Kontakt przez platformę Student2Work.";
    if (lower === "brak") return "Brak wskazanych preferencji.";

    if (label.toLowerCase().includes("termin")) {
        const date = new Date(normalized);
        if (!Number.isNaN(date.getTime())) return date.toLocaleDateString("pl-PL");
    }

    return normalized;
}

function buildConfirmationDetails(offer: JobOffer): ConfirmationDetails {
    const parsedBrief = parsePackageBriefDescription(offer.opis);
    const obligationLines = isMeaningfulText(offer.obligations)
        ? splitScopeLines(offer.obligations || "")
        : [];
    const descriptionLines = splitScopeLines(stripMarkdown(parsedBrief.baseDescription || offer.opis || ""));

    const companyDetails = Object.entries(parsedBrief.answersByLabel)
        .filter(([, value]) => isMeaningfulText(value))
        .slice(0, 8)
        .map(([label, value]) => ({
            label,
            value: formatAnswerValue(label, value),
        }));

    if (isMeaningfulText(parsedBrief.deadline)) {
        companyDetails.push({
            label: "Preferowany termin",
            value: formatAnswerValue("Preferowany termin", parsedBrief.deadline),
        });
    }

    return {
        scopeLines: obligationLines.length > 0 ? obligationLines : descriptionLines.slice(0, 6),
        companyDetails,
    };
}

export function ApplySheet({
    offer,
    children,
    onSuccess,
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

    const confirmationDetails = buildConfirmationDetails(offer);

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
        } catch (e: unknown) {
            console.error(e);
            setError(e instanceof Error ? e.message : "Wystąpił błąd podczas aplikowania.");
            setIsLoading(false);
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
                <DialogHeader className="space-y-2">
                    <DialogTitle className="flex items-start gap-4 text-xl font-black text-slate-950 md:text-2xl">
                        <div className="rounded-2xl bg-amber-100 p-3 text-amber-700">
                            <ClipboardList className="h-5 w-5" />
                        </div>
                        <div>
                            Potwierdź przyjęcie zlecenia
                            <div className="mt-1 line-clamp-2 text-base font-semibold text-slate-500">
                                {offer.tytul}
                            </div>
                        </div>
                    </DialogTitle>
                    <DialogDescription className="pt-2 text-sm font-medium leading-6 text-slate-600">
                        To jest <strong>zlecenie systemowe</strong>. Po potwierdzeniu przyjmujesz odpowiedzialność za realizację zgodnie z zakresem i briefem firmy.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-6">
                    <div className="rounded-3xl border border-slate-100 bg-slate-50/80 p-5">
                        <h4 className="mb-4 flex items-center gap-2 font-black text-slate-900">
                            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                            Co przyjmujesz
                        </h4>
                        {confirmationDetails.scopeLines.length > 0 ? (
                            <ul className="max-h-56 space-y-3 overflow-y-auto pr-2">
                                {confirmationDetails.scopeLines.map((line) => (
                                    <li key={line} className="flex items-start gap-3 rounded-2xl border border-white bg-white p-4 text-sm font-semibold leading-6 text-slate-700">
                                        <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                                        <span>{line}</span>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-sm font-semibold text-slate-600">Szczegóły znajdziesz w opisie zlecenia.</p>
                        )}
                    </div>

                    {confirmationDetails.companyDetails.length > 0 ? (
                        <div className="rounded-3xl border border-amber-100 bg-amber-50/50 p-5">
                            <h4 className="mb-4 flex items-center gap-2 font-black text-amber-950">
                                <Info className="h-4 w-4 text-amber-700" />
                                Najważniejsze informacje od firmy
                            </h4>
                            <div className="grid gap-3 sm:grid-cols-2">
                                {confirmationDetails.companyDetails.map((detail) => (
                                    <div key={detail.label} className="rounded-2xl border border-amber-100/80 bg-white p-4">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{detail.label}</p>
                                        <p className="mt-2 break-words text-sm font-bold leading-6 text-slate-900">{detail.value}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : null}

                    <div className="flex items-start space-x-3 rounded-2xl border border-amber-100 bg-amber-50 p-4">
                        <Checkbox
                            id="accept-terms"
                            checked={accepted}
                            onCheckedChange={(c) => setAccepted(c === true)}
                            className="mt-1 border-amber-600 data-[state=checked]:bg-amber-600"
                        />
                        <div className="space-y-1">
                            <Label htmlFor="accept-terms" className="cursor-pointer text-sm font-bold text-amber-950">
                                Akceptuję odpowiedzialność
                            </Label>
                            <p className="text-xs leading-relaxed text-amber-700/80">
                                Rozumiem, że przyjęcie zlecenia wiąże się z obowiązkiem jego wykonania w wyznaczonym terminie.
                            </p>
                        </div>
                    </div>

                    {error ? (
                        <div className="flex items-center gap-2 rounded-lg border border-red-100 bg-red-50 p-3 text-sm text-red-600">
                            <AlertTriangle className="h-4 w-4" />
                            {error}
                        </div>
                    ) : null}
                </div>

                <DialogFooter className="sticky bottom-0 gap-2 bg-white pt-2 sm:gap-0">
                    <Button variant="outline" onClick={() => setIsOpen(false)}>
                        Anuluj
                    </Button>
                    <Button
                        onClick={handleApply}
                        disabled={!accepted || isLoading}
                        className="min-w-[140px] bg-amber-600 text-white hover:bg-amber-700"
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
