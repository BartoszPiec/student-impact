"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, CreditCard, ShieldCheck, Lock, ExternalLink, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface PaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => Promise<void>; // Kept for backward compatibility (mock mode)
    amount: number;
    title: string;
    // Stripe integration props
    contractId?: string;
    applicationId?: string;
    useStripe?: boolean; // Toggle between mock and real Stripe
}

export function PaymentModal({
    isOpen,
    onClose,
    onConfirm,
    amount,
    title,
    contractId,
    applicationId,
    useStripe = true // Default to Stripe in production
}: PaymentModalProps) {
    const [step, setStep] = useState<'confirm' | 'processing' | 'success' | 'error'>('confirm');
    const [errorMessage, setErrorMessage] = useState<string>("");

    // Reset state on open
    useEffect(() => {
        if (isOpen) {
            setStep('confirm');
            setErrorMessage("");
        }
    }, [isOpen]);

    // Check for payment success/cancel from URL params and auto-refresh
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            const paymentStatus = params.get('payment');

            if (paymentStatus === 'success') {
                toast.success("Płatność przyjęta! Aktualizacja statusu...", {
                    duration: 5000,
                });
                // Clean up URL params immediately
                const newUrl = window.location.pathname;
                window.history.replaceState({}, '', newUrl);

                // Auto-refresh page after delay to let Stripe webhook process
                // Webhook typically takes 1-5 seconds to update contract/milestone status
                const refreshTimer = setTimeout(() => {
                    window.location.reload();
                }, 4000);

                return () => {
                    clearTimeout(refreshTimer);
                };
            } else if (paymentStatus === 'cancelled') {
                toast.info("Płatność anulowana.");
                const newUrl = window.location.pathname;
                window.history.replaceState({}, '', newUrl);
            }
        }
    }, []);

    const handleStripePayment = async () => {
        if (!contractId || !applicationId) {
            toast.error("Brak wymaganych danych do płatności");
            return;
        }

        setStep('processing');

        try {
            const response = await fetch('/api/stripe/create-checkout', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contractId,
                    applicationId,
                    amount,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Nie udało się utworzyć sesji płatności');
            }

            if (data.url) {
                // Redirect to Stripe Checkout
                window.location.href = data.url;
            } else {
                throw new Error('Brak URL do płatności');
            }
        } catch (error: any) {
            console.error('Stripe payment error:', error);
            setErrorMessage(error.message || 'Wystąpił błąd podczas przetwarzania płatności');
            setStep('error');
        }
    };

    const handleMockPayment = async () => {
        setStep('processing');

        // Simulate processing delay
        setTimeout(async () => {
            try {
                await onConfirm();
                setStep('success');

                // Close after success
                setTimeout(() => {
                    onClose();
                }, 2000);
            } catch (error: any) {
                console.error(error);
                setErrorMessage(error.message || 'Błąd płatności');
                setStep('error');
            }
        }, 2000);
    };

    const handlePay = () => {
        if (useStripe && contractId && applicationId) {
            handleStripePayment();
        } else {
            handleMockPayment();
        }
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

                {step === 'confirm' && (
                    <div className="space-y-6 py-2">
                        <div className="text-center p-4 bg-slate-50 rounded-xl border border-slate-100">
                            <div className="text-sm text-slate-500 mb-1">Kwota do zapłaty</div>
                            <div className="text-3xl font-bold text-slate-900">{amount} PLN</div>
                            <div className="text-xs text-slate-400 mt-1">{title}</div>
                        </div>

                        {/* Payment methods info */}
                        <div className="bg-indigo-50/50 rounded-xl p-4 border border-indigo-100">
                            <div className="flex items-center gap-3 text-sm text-indigo-700">
                                <CreditCard className="w-5 h-5 shrink-0" />
                                <div>
                                    <div className="font-medium">Dostępne metody płatności:</div>
                                    <div className="text-xs text-indigo-600/80 mt-0.5">
                                        Karta płatnicza, BLIK, Przelewy24
                                    </div>
                                </div>
                            </div>
                        </div>

                        <Button
                            onClick={handlePay}
                            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-12 text-lg shadow-lg shadow-indigo-200"
                        >
                            <span className="mr-2">Przejdź do płatności</span>
                            <ExternalLink className="w-4 h-4" />
                        </Button>

                        <div className="flex justify-center items-center gap-2 text-[10px] text-slate-400 uppercase tracking-wider">
                            <Lock className="w-3 h-3" />
                            Płatność obsługiwana przez Stripe
                        </div>

                        <p className="text-xs text-center text-slate-400">
                            Po kliknięciu zostaniesz przekierowany na bezpieczną stronę płatności Stripe.
                            Środki zostaną zabezpieczone w Escrow do czasu akceptacji prac.
                        </p>
                    </div>
                )}

                {step === 'processing' && (
                    <div className="py-12 flex flex-col items-center justify-center space-y-4 text-center animate-in fade-in">
                        <div className="relative">
                            <div className="absolute inset-0 bg-indigo-200 blur-xl opacity-50 rounded-full animate-pulse"></div>
                            <Loader2 className="w-16 h-16 text-indigo-600 animate-spin relative z-10" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-slate-800">Przygotowywanie płatności...</h3>
                            <p className="text-sm text-slate-500">Za chwilę nastąpi przekierowanie.</p>
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

                {step === 'error' && (
                    <div className="py-8 flex flex-col items-center justify-center space-y-4 text-center animate-in fade-in">
                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-2">
                            <AlertCircle className="w-10 h-10 text-red-600" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-red-700">Błąd płatności</h3>
                            <p className="text-slate-600 text-sm mt-2">{errorMessage}</p>
                        </div>
                        <Button
                            onClick={() => setStep('confirm')}
                            variant="outline"
                            className="mt-4"
                        >
                            Spróbuj ponownie
                        </Button>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
