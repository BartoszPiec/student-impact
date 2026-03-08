"use client";

// Removed unused imports if any, keeping core structure
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Coins, Clock, Sparkles, User, Briefcase, Star } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { createOrder, startInquiry } from "./_actions";
import { useTransition } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

type FormField = {
    id: string;
    label: string;
    type: "text" | "select";
    options?: string[];
};

type Variant = {
    name: string;
    label: string;
    price: number;
    delivery_time_days?: number;
    scope?: string;
};

interface OrderFormProps {
    packageId: string;
    price: number;
    title: string;
    description: string;
    formSchema: FormField[] | null;
    defaultEmail?: string;
    defaultPhone?: string;
    defaultWebsite?: string;
    variants?: Variant[] | null;
    initialVariant?: string | null;
    requiresNda?: boolean;
}

export default function OrderForm({
    packageId,
    price,
    title,
    description,
    formSchema,
    defaultEmail,
    defaultPhone,
    defaultWebsite,
    variants,
    initialVariant,
    requiresNda
}: OrderFormProps) {
    const [loading, setLoading] = useState(false);
    const [isPending, startTransition] = useTransition();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [inquiryMessage, setInquiryMessage] = useState("");
    const [step, setStep] = useState(1);
    const [selectedVariant, setSelectedVariant] = useState<string>(
        initialVariant || (variants && variants.length > 0 ? variants[0].name : "")
    );
    const [ndaAccepted, setNdaAccepted] = useState(false);

    const currentVariant = variants?.find(v => v.name === selectedVariant) || null;
    const effectivePrice = currentVariant ? currentVariant.price : price;

    // Stan dla odpowiedzi z formularza dynamicznego
    const [answers, setAnswers] = useState<Record<string, string>>({});

    const handleAnswerChange = (id: string, value: string) => {
        setAnswers(prev => ({ ...prev, [id]: value }));
    };

    const handleSendInquiry = () => {
        startTransition(() => {
            startInquiry(packageId, inquiryMessage);
            setIsDialogOpen(false);
        });
    };

    return (
        <div className="space-y-6">
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden border-0 rounded-[2rem] shadow-2xl">
                    <div className="bg-gradient-to-r from-violet-600 to-indigo-600 p-6 text-white">
                        <DialogHeader>
                            <DialogTitle className="text-2xl font-bold text-white">Zadaj pytanie</DialogTitle>
                            <DialogDescription className="text-indigo-100">
                                Wyślij wiadomość bezpośrednio do wykonawcy.
                            </DialogDescription>
                        </DialogHeader>
                    </div>

                    <div className="p-6 space-y-4 bg-white">
                        <div className="space-y-2">
                            <Label htmlFor="inquiry-message" className="text-sm font-semibold text-slate-700">
                                Twoja wiadomość
                            </Label>
                            <Textarea
                                id="inquiry-message"
                                placeholder={`Dzień dobry, chciałbym zapytać o szczegóły usługi: "${title}"...`}
                                rows={5}
                                className="resize-none bg-slate-50 border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 rounded-xl transition-all"
                                value={inquiryMessage}
                                onChange={(e) => setInquiryMessage(e.target.value)}
                            />
                            <p className="text-xs text-slate-500">
                                Odpowiedź znajdziesz w zakładce "Wiadomości".
                            </p>
                        </div>
                    </div>

                    <DialogFooter className="p-6 pt-0 bg-white sm:justify-between gap-3">
                        <Button
                            variant="ghost"
                            onClick={() => setIsDialogOpen(false)}
                            disabled={isPending}
                            className="rounded-xl hover:bg-slate-100 text-slate-600 font-medium"
                        >
                            Anuluj
                        </Button>
                        <Button
                            onClick={handleSendInquiry}
                            disabled={isPending || !inquiryMessage.trim()}
                            className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200 px-6 font-semibold"
                        >
                            {isPending ? "Wysyłanie..." : "Wyślij wiadomość"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {step === 1 ? (
                <div className="space-y-8 animate-in fade-in duration-500">
                    <div className="space-y-4">
                        <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                            <span className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                                <Sparkles className="w-5 h-5" />
                            </span>
                            Opis usługi
                        </h3>
                        <div className="text-slate-600 leading-relaxed whitespace-pre-wrap bg-slate-50 p-6 rounded-2xl border border-slate-100">
                            {description}
                        </div>
                    </div>

                    <div className="flex flex-col gap-4 pt-2">
                        <Button
                            onClick={() => setStep(2)}
                            className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white h-14 text-lg font-bold rounded-2xl shadow-xl shadow-indigo-500/20 hover:shadow-indigo-500/40 hover:-translate-y-0.5 transition-all duration-300"
                        >
                            Przejdź do wyceny
                        </Button>

                        <div className="relative py-2">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t border-slate-200" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase tracking-wider font-semibold">
                                <span className="bg-white px-3 text-slate-400">lub</span>
                            </div>
                        </div>

                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setIsDialogOpen(true)}
                            className="w-full border-2 border-slate-100 bg-white hover:bg-slate-50 hover:border-slate-200 text-slate-600 h-12 rounded-xl font-semibold transition-all"
                        >
                            Mam pytania? Zapytaj o szczegóły
                        </Button>
                    </div>
                </div>
            ) : (
                <form action={createOrder} onSubmit={() => setLoading(true)} className="space-y-8 animate-in slide-in-from-right-8 duration-500">
                    <div className="flex items-center gap-2 mb-2">
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setStep(1)}
                            className="text-slate-400 hover:text-slate-900 -ml-2 hover:bg-slate-100/50 rounded-lg px-3"
                        >
                            ← Wróć do opisu
                        </Button>
                    </div>

                    <input type="hidden" name="packageId" value={packageId} />
                    {/* SECURITY: price is determined server-side from packageId + variant, not from client */}
                    <input type="hidden" name="title" value={title} />
                    {selectedVariant && <input type="hidden" name="selected_variant" value={selectedVariant} />}
                    {ndaAccepted && <input type="hidden" name="nda_accepted" value="true" />}

                    {/* Variant Selector */}
                    {variants && variants.length > 0 && (
                        <div className="space-y-4">
                            <h3 className="font-bold text-xl text-slate-900">Wybierz Pakiet</h3>
                            <div className="grid gap-3">
                                {variants.map((v) => (
                                    <button
                                        key={v.name}
                                        type="button"
                                        onClick={() => setSelectedVariant(v.name)}
                                        className={cn(
                                            "flex items-center justify-between p-4 rounded-xl border-2 transition-all text-left",
                                            selectedVariant === v.name
                                                ? "border-indigo-500 bg-indigo-50/50 ring-2 ring-indigo-500/20"
                                                : "border-slate-200 hover:border-slate-300 bg-white"
                                        )}
                                    >
                                        <div>
                                            <div className="font-bold text-slate-900">{v.label}</div>
                                            {v.scope && <div className="text-sm text-slate-500 mt-0.5">{v.scope}</div>}
                                            {v.delivery_time_days && (
                                                <div className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                                                    <Clock className="h-3 w-3" /> {v.delivery_time_days} dni
                                                </div>
                                            )}
                                        </div>
                                        <div className="text-right">
                                            <span className="font-extrabold text-lg text-slate-900">{v.price}</span>
                                            <span className="text-sm text-slate-400 ml-1">PLN</span>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* NDA Acceptance */}
                    {requiresNda && (
                        <div className="space-y-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                            <h3 className="font-bold text-amber-900 flex items-center gap-2">
                                <Sparkles className="h-4 w-4" /> Wymagana Umowa NDA
                            </h3>
                            <p className="text-sm text-amber-800">
                                Ta usługa wymaga podpisania Umowy o Zachowaniu Poufności (NDA) przed rozpoczęciem pracy.
                                Student podpisze NDA elektronicznie zanim otrzyma dostęp do Twoich danych.
                                Kara umowna za naruszenie: 10 000 PLN.
                            </p>
                            <label className="flex items-start gap-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={ndaAccepted}
                                    onChange={(e) => setNdaAccepted(e.target.checked)}
                                    className="mt-1 h-4 w-4 rounded border-amber-300 text-amber-600 focus:ring-amber-500"
                                />
                                <span className="text-sm text-amber-900 font-medium">
                                    Rozumiem i akceptuję wymóg NDA dla tego zlecenia
                                </span>
                            </label>
                        </div>
                    )}

                    {/* Sekcja Kontaktowa */}
                    <div className="space-y-6">
                        <h3 className="font-bold text-xl text-slate-900 flex items-center gap-2">
                            Dane Kontaktowe
                        </h3>
                        <div className="grid gap-5 md:grid-cols-2 bg-slate-50/50 p-6 rounded-[1.5rem] border border-slate-100">
                            <div className="space-y-2 col-span-full">
                                <Label htmlFor="contact_email" className="font-semibold text-slate-700">Email kontaktowy <span className="text-red-500">*</span></Label>
                                <Input
                                    id="contact_email"
                                    name="contact_email"
                                    type="email"
                                    required
                                    defaultValue={defaultEmail}
                                    placeholder="jan@firma.pl"
                                    className="h-12 rounded-xl border-slate-200 bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
                                />
                            </div>

                            <div className="space-y-2 col-span-full">
                                <Label htmlFor="company_website" className="font-semibold text-slate-700">Strona www firmy (opcjonalne)</Label>
                                <Input
                                    id="company_website"
                                    name="company_website"
                                    type="text"
                                    defaultValue={defaultWebsite}
                                    placeholder="https://twojafirma.pl"
                                    className="h-12 rounded-xl border-slate-200 bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Sekcja Pytań Dedykowanych */}
                    {formSchema && formSchema.length > 0 && (
                        <div className="space-y-6">
                            <h3 className="font-bold text-xl text-slate-900">Szczegóły realizacji</h3>
                            <div className="grid gap-5 md:grid-cols-2">
                                {formSchema.map((field) => (
                                    <div key={field.id} className="space-y-2">
                                        <Label htmlFor={field.id} className="font-semibold text-slate-700">{field.label}</Label>
                                        {field.type === "select" ? (
                                            <Select name={`q_${field.id}`} required onValueChange={(val) => handleAnswerChange(field.id, val)}>
                                                <SelectTrigger className="h-12 rounded-xl border-slate-200 bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500">
                                                    <SelectValue placeholder="Wybierz z listy..." />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {field.options?.map(opt => (
                                                        <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        ) : (
                                            <Input
                                                name={`q_${field.id}`}
                                                required
                                                placeholder="Wpisz odpowiedź..."
                                                className="h-12 rounded-xl border-slate-200 bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
                                                onChange={(e) => handleAnswerChange(field.id, e.target.value)}
                                            />
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Informacje Dodatkowe */}
                    <div className="space-y-3">
                        <Label htmlFor="requirements" className="text-lg font-bold text-slate-900">
                            Dodatkowe informacje (Opcjonalne)
                        </Label>
                        <div className="bg-amber-50 rounded-xl p-4 border border-amber-100 text-amber-800 text-sm mb-2">
                            💡 Tu możesz dopisać wszystko, czego nie uwzględniliśmy w pytaniach powyżej.
                        </div>
                        <Textarea
                            id="requirements"
                            name="requirements"
                            rows={5}
                            placeholder="Opisz swoją wizję projektu, prześlij linki do inspiracji lub materiałów, które już posiadasz..."
                            className="min-h-[140px] resize-y rounded-xl border-slate-200 bg-slate-50 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all p-4 leading-relaxed"
                        />
                    </div>

                    <div className="pt-6">
                        <Button
                            disabled={loading || isPending || (requiresNda === true && !ndaAccepted)}
                            type="submit"
                            className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white h-16 text-lg font-bold rounded-2xl shadow-xl shadow-indigo-500/20 hover:shadow-indigo-500/40 hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? "Przetwarzanie..." : `Zamów wycenę — ${effectivePrice} PLN`}
                        </Button>
                        <p className="text-center text-xs text-slate-400 mt-4">
                            Klikając, akceptujesz regulamin usług Student2Work. Płatność nastąpi dopiero po akceptacji wykonania.
                        </p>
                    </div>
                </form>
            )}
        </div>
    );
}

