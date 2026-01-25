"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Loader2, CheckCircle2, CreditCard, ShieldCheck, Lock } from "lucide-react";
import { toast } from "sonner";

interface PaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => Promise<void>;
    amount: number;
    title: string;
}

export function PaymentModal({ isOpen, onClose, onConfirm, amount, title }: PaymentModalProps) {
    const [step, setStep] = useState<'method' | 'processing' | 'success'>('method');
    const [method, setMethod] = useState('blik');
    const [blikCode, setBlikCode] = useState('');

    // Reset state on open
    useEffect(() => {
        if (isOpen) {
            setStep('method');
            setBlikCode('');
        }
    }, [isOpen]);

    const handlePay = async () => {
        if (method === 'blik' && blikCode.length !== 6) {
            toast.error("Wprowadź 6-cyfrowy kod BLIK");
            return;
        }

        setStep('processing');

        // Simulate processing delay
        setTimeout(async () => {
            try {
                await onConfirm(); // Execute actual action (server action)
                setStep('success');

                // Close after success
                setTimeout(() => {
                    onClose();
                }, 2000);
            } catch (error) {
                console.error(error);
                toast.error("Błąd płatności. Spróbuj ponownie.");
                setStep('method');
            }
        }, 2000);
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <div className="mx-auto bg-slate-100 p-3 rounded-full mb-2">
                        <ShieldCheck className="w-6 h-6 text-indigo-600" />
                    </div>
                    <DialogTitle className="text-center text-xl">Bezpieczna Płatność</DialogTitle>
                    <DialogDescription className="text-center">
                        Student Impact Escrow
                    </DialogDescription>
                </DialogHeader>

                {step === 'method' && (
                    <div className="space-y-6 py-2">
                        <div className="text-center p-4 bg-slate-50 rounded-xl border border-slate-100">
                            <div className="text-sm text-slate-500 mb-1">Kwota do zapłaty</div>
                            <div className="text-3xl font-bold text-slate-900">{amount} PLN</div>
                            <div className="text-xs text-slate-400 mt-1">{title}</div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div
                                onClick={() => setMethod('blik')}
                                className={`
                                    cursor-pointer rounded-xl border-2 p-4 flex flex-col items-center justify-between h-full bg-white transition-all
                                    ${method === 'blik' ? 'border-indigo-600 text-indigo-600 bg-indigo-50/50 shadow-sm' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}
                                `}
                            >
                                <span className="text-2xl font-black mb-2">BLIK</span>
                                <span className="text-xs font-normal">Szybki przelew</span>
                            </div>

                            <div
                                onClick={() => setMethod('card')}
                                className={`
                                    cursor-pointer rounded-xl border-2 p-4 flex flex-col items-center justify-between h-full bg-white transition-all
                                    ${method === 'card' ? 'border-indigo-600 text-indigo-600 bg-indigo-50/50 shadow-sm' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}
                                `}
                            >
                                <CreditCard className="w-8 h-8 mb-2" />
                                <span className="text-xs font-normal">Karta płatnicza</span>
                            </div>
                        </div>

                        {method === 'blik' && (
                            <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                                <Label htmlFor="code">Kod BLIK</Label>
                                <Input
                                    id="code"
                                    placeholder="123 456"
                                    className="text-center text-xl tracking-widest"
                                    maxLength={6}
                                    value={blikCode}
                                    onChange={(e) => setBlikCode(e.target.value.replace(/\D/g, ''))}
                                />
                                <p className="text-xs text-center text-slate-500">Wpisz dowolne 6 cyfr do testów.</p>
                            </div>
                        )}

                        <Button onClick={handlePay} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-12 text-lg shadow-lg shadow-indigo-200">
                            Zapłać {amount} PLN
                        </Button>
                        <div className="flex justify-center items-center gap-2 text-[10px] text-slate-400 uppercase tracking-wider">
                            <Lock className="w-3 h-3" /> Szyfrowane połączenie SSL
                        </div>
                    </div>
                )}

                {step === 'processing' && (
                    <div className="py-12 flex flex-col items-center justify-center space-y-4 text-center animate-in fade-in">
                        <div className="relative">
                            <div className="absolute inset-0 bg-indigo-200 blur-xl opacity-50 rounded-full animate-pulse"></div>
                            <Loader2 className="w-16 h-16 text-indigo-600 animate-spin relative z-10" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-slate-800">Przetwarzanie płatności...</h3>
                            <p className="text-sm text-slate-500">Prosimy nie zamykać okna.</p>
                        </div>
                    </div>
                )}

                {step === 'success' && (
                    <div className="py-12 flex flex-col items-center justify-center space-y-4 text-center animate-in fade-in zoom-in">
                        <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mb-2">
                            <CheckCircle2 className="w-12 h-12 text-emerald-600" />
                        </div>
                        <div>
                            <h3 className="text-2xl font-bold text-emerald-700">Płatność Przyjęta!</h3>
                            <p className="text-slate-600">Środki zostały zabezpieczone w Escrow.</p>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
