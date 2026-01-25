"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { UploadForm } from "../UploadForm";
import { ReviewModal } from "../../ReviewModal";
import { ReviewForm } from "../ReviewForm";


import {
    submitDeliverable,
    reviewDeliverable,
    submitReview,
    fundMilestoneAction,
    generateContract,
    fundContractAction,
    submitMilestoneWorkAction,
    reviewMilestoneAction,
    getSignedStorageUrl
} from "../../_actions";
import { toast } from "sonner";
import { Shield, ShieldCheck, AlertCircle, CircleDollarSign, CheckCircle2, Lock, Clock, FileText, ChevronDown, ChevronUp, Star, Medal, MessageSquare } from "lucide-react";
import { PaymentModal } from "@/app/components/payment-modal";
import { MilestoneNegotiation } from "./MilestoneNegotiation";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

import { SecureImageViewer } from "@/app/components/SecureImageViewer";

export function StatusTab({
    status,
    isStudent,
    isCompany,
    applicationId,
    currentDeliv, // Keeping for backward compat just in case
    deliverables,
    myReview,
    theirReview,
    contract,
    totalAmount,
    enableNegotiation = false
}: any) {
    // State for Payment Modal
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

    // State for Secure Viewer
    const [viewerState, setViewerState] = useState<{ isOpen: boolean; url: string; fileName: string }>({
        isOpen: false,
        url: "",
        fileName: ""
    });

    // Filter milestones
    const milestones = contract?.milestones || [];


    // Funding model: default to sequential (per milestone). Optional: contract.funding_mode = 'full'
    const fundingMode = (contract as any)?.funding_mode ?? "sequential";
    const nextToFund = milestones.find((m: any) => m.status === "awaiting_funding") || null;

    const isEscrowReady =
        fundingMode === "full"
            ? (milestones.length > 0 && milestones.every((m: any) => ["funded", "in_progress", "delivered", "released", "accepted", "completed"].includes(m.status)))
            : !nextToFund; // sequential: ready when no milestone is currently waiting for funding

    // Progress helpers
    const isAnyFunded = milestones.some((m: any) => ['funded', 'in_progress', 'delivered', 'completed', 'released', 'accepted'].includes(m.status));
    const allFunded = milestones.length > 0 && milestones.every((m: any) => ['funded', 'in_progress', 'delivered', 'completed', 'released', 'accepted'].includes(m.status));

    // Calculate Total Budget strictly from milestones to avoid mismatches
    const contractBudget = milestones.reduce((sum: number, m: any) => sum + Number(m.amount), 0);

    const handlePaymentConfirm = async () => {
        try {
            if (!contract) throw new Error("Brak kontraktu");

            if (fundingMode === "full") {
                await fundContractAction(contract.id, applicationId);
                toast.success("Środki wpłacone! Odświeżam status...");
                setIsPaymentModalOpen(false);
                return;
            }

            if (!nextToFund) {
                throw new Error("Brak etapu do zasilenia.");
            }

            await fundContractAction(contract.id, applicationId);
            toast.success("Etap został zasilony! Odświeżam status...");
            setIsPaymentModalOpen(false);
        } catch (e) {
            console.error("Payment failed", e);
            throw e; // Propagate to PaymentModal to show error state
        }
    };

    // Global Progress Logic
    let progress = 5;
    let currentStep = 1;

    if (contract?.status === 'completed') {
        progress = 100;
        currentStep = 5;
    } else if (milestones.some((m: any) => m.status === 'delivered')) {
        progress = 75;
        currentStep = 4; // Verification phase (at least one delivered)
    } else if (isAnyFunded) {
        // In sequential funding, work starts as soon as at least one milestone is funded.
        progress = 50;
        currentStep = 3;
    } else if (contract?.terms_status === 'agreed') {
        progress = 25;
        currentStep = 2; // Waiting for funding
    }

    // Stepper Configuration
    const steps = [
        { id: 1, label: "Start" },
        { id: 2, label: "Escrow" },
        { id: 3, label: "Realizacja" },
        { id: 4, label: "Weryfikacja" }, // Changed label slightly
        { id: 5, label: "Wypłata" }
    ];

    // MANDATORY REVIEW LOGIC
    // Company must review if status is 'delivered' (or 'completed' but missing review due to legacy/migration miss)
    // Robustness: Check contract.status directly, AND check if all milestones are done (for migration safety)
    // FIX: Only show if explicitly completed OR all milestones are released. 'delivered' contract status might be premature if triggered by partial delivery.
    const allMilestonesReleased = milestones.length > 0 && milestones.every((m: any) => m.status === 'released' || m.status === 'accepted' || m.status === 'completed');
    const isContractDone = contract?.status === 'completed' || allMilestonesReleased;

    // Show if: Company AND No Review AND (Explicit Status OR Implicit Status)
    const showReviewModal = isCompany && !myReview && isContractDone;

    // Counter Logic
    const completedCount = milestones.filter((m: any) => ['released', 'accepted', 'completed'].includes(m.status)).length;
    const totalCount = milestones.length;

    return (
        <div className="grid gap-6 animate-in slide-in-from-bottom-2 duration-500">
            {/* SECURE VIEWER */}
            <SecureImageViewer
                isOpen={viewerState.isOpen}
                onClose={() => setViewerState(prev => ({ ...prev, isOpen: false }))}
                url={viewerState.url}
                fileName={viewerState.fileName}
            />

            {/* BLOCKING REVIEW MODAL */}
            {showReviewModal && (
                <ReviewModal
                    isOpen={true}
                    applicationId={applicationId}
                    action={submitReview}
                />
            )}
            {contract && (
                <PaymentModal
                    isOpen={isPaymentModalOpen}
                    onClose={() => setIsPaymentModalOpen(false)}
                    onConfirm={handlePaymentConfirm}
                    amount={fundingMode === "full" ? (contractBudget > 0 ? contractBudget : totalAmount) : Number(nextToFund?.amount ?? 0)}
                    title={fundingMode === "full" ? `Zasilenie Depozytu (Cały Projekt)` : `Zasilenie Depozytu (Następny etap)`}
                />
            )}

            {/* HEADER CARD */}
            <Card className="overflow-hidden border-0 shadow-xl bg-white/80 backdrop-blur-xl ring-1 ring-slate-200/50">
                <div className="p-6 md:p-8">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                        <div>
                            <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                                Panel Realizacji
                                <Badge variant="outline" className="ml-2 bg-slate-50 text-slate-500 border-slate-200 font-normal">
                                    {contract?.status === 'completed' ? 'Zakończone' : 'W toku'}
                                </Badge>
                            </h2>
                            {milestones.length > 0 && (
                                <p className="text-sm text-slate-500 mt-1 flex items-center gap-2">
                                    Postęp prac:
                                    <span className="font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                                        {completedCount} / {totalCount} etapów
                                    </span>
                                </p>
                            )}
                            {isCompany && contract?.terms_status === 'agreed' && (
                                <div className="mt-2 text-left">
                                    <RegenerateContractButton contractId={contract.id} applicationId={applicationId} />
                                </div>
                            )}
                        </div>

                        {/* Escrow Badge */}
                        {milestones.length > 0 && (
                            <div className={`px-4 py-2 rounded-full border flex items-center gap-2 text-sm font-semibold shadow-sm transition-all duration-300
                                ${isEscrowReady
                                    ? 'bg-emerald-50/80 border-emerald-100 text-emerald-700 backdrop-blur-sm'
                                    : 'bg-amber-50/80 border-amber-100 text-amber-700 backdrop-blur-sm animate-pulse-slow'
                                }`}>
                                {isEscrowReady ? <ShieldCheck className="w-4 h-4" /> : <Shield className="w-4 h-4" />}
                                {isEscrowReady ? (fundingMode === "full" ? "Środki Zabezpieczone (Całość)" : "Środki Zabezpieczone (Bieżący etap)") : (fundingMode === "full" ? "Wymagane Zasilenie Escrow" : "Wymagane Zasilenie Następnego Etapu")}
                            </div>
                        )}
                    </div>

                    {/* STEPPER */}
                    <div className="relative mb-12 px-2 md:px-4 py-6">
                        <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-full h-1.5 bg-slate-100 -z-0 rounded-full" />
                        <div
                            className="absolute left-0 top-1/2 transform -translate-y-1/2 h-1.5 bg-gradient-to-r from-emerald-400 to-emerald-500 -z-0 transition-all duration-1000 ease-out rounded-full shadow-[0_0_10px_rgba(16,185,129,0.3)]"
                            style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
                        />

                        <div className="flex justify-between relative z-10">
                            {steps.map((step) => {
                                const isCompleted = currentStep > step.id;
                                const isActive = currentStep === step.id;

                                return (
                                    <div key={step.id} className="relative z-10 flex flex-col items-center group">
                                        <div
                                            className={`
                                                w-12 h-12 rounded-full flex items-center justify-center border-[3px] transition-all duration-500 shadow-sm
                                                ${isCompleted
                                                    ? 'bg-emerald-500 border-emerald-500 text-white shadow-emerald-200'
                                                    : isActive
                                                        ? 'bg-white border-indigo-600 text-indigo-600 shadow-[0_0_0_4px_rgba(79,70,229,0.15)] scale-110'
                                                        : 'bg-white border-slate-200 text-slate-300'}
                                            `}
                                        >
                                            {isCompleted ? <CheckCircle2 className="w-6 h-6" /> : <span className="text-sm font-extrabold">{step.id}</span>}
                                        </div>
                                        <span className={`
                                            absolute -bottom-10 text-xs font-bold uppercase tracking-wider transition-colors duration-300
                                            ${isActive ? 'text-indigo-600 bg-indigo-50 px-2 py-1 rounded-full' : (isCompleted ? 'text-emerald-600' : 'text-slate-400')}
                                        `}>
                                            {step.label}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Step Actions */}
                    <div className="bg-gradient-to-r from-slate-50 to-white rounded-2xl p-6 md:p-8 border border-slate-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6 mt-8 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50/50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />

                        <div className="text-center md:text-left relative z-10">
                            <h3 className="text-lg font-bold text-slate-800 mb-2">
                                {currentStep === 1 && "Start Zlecenia"}
                                {currentStep === 2 && "Oczekiwanie na płatność"}
                                {currentStep >= 3 && "Realizacja Etapów"}
                            </h3>
                            <p className="text-slate-500 text-sm max-w-lg leading-relaxed">
                                {currentStep === 1 && "Uzgodnijcie warunki umowy, aby rozpocząć współpracę na jasnych zasadach."}
                                {currentStep === 2 && (fundingMode === "full" ? "Firma musi wpłacić całość budżetu do bezpiecznego depozytu. Środki zostaną zamrożone do czasu akceptacji prac." : "Firma musi zasilić depozyt dla następnego etapu, aby student mógł bezpiecznie rozpocząć prace.")}
                                {currentStep >= 3 && "Środki są bezpieczne w depozycie. Student realizuje kolejne etapy zgodnie z harmonogramem."}
                            </p>
                        </div>

                        {/* Payment Button */}
                        {isCompany && !isEscrowReady && contract?.terms_status === 'agreed' && (
                            <Button
                                size="lg"
                                onClick={() => setIsPaymentModalOpen(true)}
                                className="relative z-10 w-full md:w-auto bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-600 text-white shadow-lg shadow-indigo-200 font-bold px-8 h-12 rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98]"
                            >
                                <CircleDollarSign className="w-5 h-5 mr-2" />
                                Zasil Depozyt ({fundingMode === "full" ? (contractBudget > 0 ? contractBudget : totalAmount) : Number(nextToFund?.amount ?? 0)} PLN)
                            </Button>
                        )}

                        {isStudent && !isEscrowReady && contract?.terms_status === 'agreed' && (
                            <div className="relative z-10 px-5 py-3 bg-white border border-slate-200 rounded-xl text-slate-500 text-sm font-medium flex items-center gap-3 shadow-sm">
                                <div className="p-1.5 bg-amber-50 rounded-full">
                                    <Clock className="w-4 h-4 text-amber-500" />
                                </div>
                                Czekamy na wpłatę klienta
                            </div>
                        )}
                    </div>
                </div>
            </Card>

            {/* NEGOTIATION AREA (Step 1) */}
            {enableNegotiation && contract?.terms_status !== 'agreed' && !isAnyFunded && (
                <MilestoneNegotiation
                    applicationId={applicationId}
                    contract={contract}
                    milestones={milestones}
                    isCompany={isCompany}
                    isStudent={isStudent}
                    totalAmount={totalAmount}
                />
            )}

            {/* MILESTONE LIST (Step 3+) */}
            {((contract?.terms_status === 'agreed') || isAnyFunded) && milestones.length > 0 && (
                <div className="space-y-6">
                    <h3 className="text-xl font-bold text-slate-800 px-1">Harmonogram Realizacji</h3>
                    {milestones.map((milestone: any, index: number) => (
                        <MilestoneItem
                            key={milestone.id}
                            milestone={milestone}
                            index={index}
                            isStudent={isStudent}
                            isCompany={isCompany}
                            applicationId={applicationId}
                            deliverables={deliverables}
                            onOpenSecureViewer={(url: string, name: string) => setViewerState({ isOpen: true, url, fileName: name })}
                        />
                    ))}
                </div>
            )}
            {/* REVIEW SECTION (Completed Only) */}
            {contract?.status === 'completed' && (
                <Card className="border-indigo-100 shadow-sm bg-gradient-to-br from-indigo-50/50 to-white overflow-hidden">
                    <CardHeader className="border-b border-indigo-50 bg-white/50">
                        <CardTitle className="flex items-center gap-2 text-indigo-900">
                            <Star className="w-5 h-5 fill-indigo-500 text-indigo-500" />
                            Podsumowanie współpracy
                        </CardTitle>
                        <CardDescription>
                            Zlecenie zostało zakończone. {isCompany ? "Oceń współpracę ze studentem." : "Oto opinia wystawiona przez klienta."}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="p-6 md:p-8">
                        {isCompany ? (
                            <>
                                {myReview ? (
                                    <div className="bg-white p-6 rounded-xl border shadow-sm">
                                        <div className="flex items-center gap-2 mb-4">
                                            <div className="flex gap-1">
                                                {[1, 2, 3, 4, 5].map(star => (
                                                    <Star
                                                        key={star}
                                                        className={`w-5 h-5 ${star <= myReview.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`}
                                                    />
                                                ))}
                                            </div>
                                            <span className="font-bold text-slate-700 ml-2">{myReview.rating}/5</span>
                                        </div>
                                        <div className="text-slate-600 italic">"{myReview.comment}"</div>
                                        <div className="mt-4 text-xs text-slate-400">Wystawiono: {new Date(myReview.created_at).toLocaleString('pl-PL')}</div>
                                    </div>
                                ) : (
                                    <div className="max-w-xl mx-auto text-center space-y-4">
                                        <div className="p-4 bg-indigo-50 rounded-full w-fit mx-auto">
                                            <Star className="w-8 h-8 text-indigo-600 fill-indigo-600" />
                                        </div>
                                        <div>
                                            <h4 className="font-medium text-slate-900 text-lg">Zlecenie zrealizowane!</h4>
                                            <p className="text-slate-500">
                                                Aby odblokować historię i zakończyć współpracę,<br />
                                                wystaw opinię w oknie, które się pojawiło.
                                            </p>
                                        </div>
                                        <Button variant="outline" onClick={() => window.location.reload()}>
                                            Nie widzę okna? Odśwież
                                        </Button>
                                    </div>
                                )}
                            </>
                        ) : (
                            <>
                                {/* Student View - Seeing Company's Review */}
                                {theirReview ? (
                                    <div className="bg-white p-6 rounded-xl border shadow-sm relative overflow-hidden">
                                        <div className="absolute top-0 right-0 p-4 opacity-10">
                                            <Medal className="w-24 h-24 text-indigo-500" />
                                        </div>
                                        <h4 className="font-medium text-slate-500 mb-2 uppercase tracking-wide text-xs">Opinia Klienta</h4>
                                        <div className="flex items-center gap-2 mb-4 relative z-10">
                                            <div className="flex gap-1">
                                                {[1, 2, 3, 4, 5].map(star => (
                                                    <Star
                                                        key={star}
                                                        className={`w-6 h-6 ${star <= theirReview.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`}
                                                    />
                                                ))}
                                            </div>
                                            <span className="font-bold text-2xl text-slate-800 ml-2">{theirReview.rating}/5</span>
                                        </div>
                                        <p className="text-slate-700 text-lg relative z-10">"{theirReview.comment}"</p>
                                    </div>
                                ) : (
                                    <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed">
                                        <Clock className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                                        <h4 className="text-slate-600 font-medium">Oczekiwanie na opinię</h4>
                                        <p className="text-slate-400 text-sm">Klient jeszcze nie wystawił oceny za to zlecenie.</p>
                                    </div>
                                )}
                            </>
                        )}
                    </CardContent>
                </Card>
            )}

        </div>
    );
}

function MilestoneItem({ milestone, index, isStudent, isCompany, applicationId, deliverables, onOpenSecureViewer }: any) {
    async function openDeliverableFile(file: any) {
        try {
            // New format: { bucket, path }
            let signed = "";
            if (file?.bucket && file?.path) {
                signed = await getSignedStorageUrl(file.bucket, file.path, 600);
            }
            // Legacy format: { url }
            else if (file?.url) {
                signed = await getSignedStorageUrl("deliverables", file.url, 600);
            }

            if (!signed) return;

            // Check extension
            const lowerName = (file.name || "").toLowerCase();
            const isImage = lowerName.endsWith(".png") || lowerName.endsWith(".jpg") || lowerName.endsWith(".jpeg") || lowerName.endsWith(".gif") || lowerName.endsWith(".webp");

            if (isImage && onOpenSecureViewer) {
                onOpenSecureViewer(signed, file.name);
            } else {
                if (isCompany) {
                    toast.info("Pliki inne niż obrazy otwierają się w nowym oknie (brak znaku wodnego).");
                }
                window.open(signed, "_blank");
            }

        } catch (err) {
            console.error(err);
            alert("Nie udało się otworzyć pliku.");
        }
    }

    const [isOpen, setIsOpen] = useState(milestone.status !== 'completed');

    // Find deliverables linked to this milestone
    const milestoneDeliverables = deliverables?.filter((d: any) => d.milestone_id === milestone.id) || [];
    const latestDeliverable = milestoneDeliverables[0]; // Assuming order by created_at desc

    const statusConfig = {
        'awaiting_funding': { label: 'Oczekuje', color: 'bg-slate-100 text-slate-500' },
        'funded': { label: 'Do zrobienia', color: 'bg-blue-50 text-blue-700 border-blue-200' },
        'in_progress': { label: 'W trakcie', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
        'delivered': { label: 'Czeka na akceptację', color: 'bg-amber-50 text-amber-700 border-amber-200' },
        'completed': { label: 'Zakończone', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
        'released': { label: 'Wypłacone', color: 'bg-emerald-100 text-emerald-800 border-emerald-300' }
    }[milestone.status as string] || { label: milestone.status, color: 'bg-gray-100' };

    return (
        <Card className={`border shadow-sm transition-all overflow-hidden ${milestone.status === 'completed' ? 'opacity-75 hover:opacity-100' : 'border-indigo-100 shadow-md'}`}>
            <Collapsible open={isOpen} onOpenChange={setIsOpen}>
                <div className="p-6 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between bg-white relative z-10">
                    <div className="flex items-start gap-4 flex-1">
                        <div className={`
                            w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold border shadow-sm shrink-0 mt-0.5
                            ${milestone.status === 'completed'
                                ? 'bg-emerald-100 border-emerald-200 text-emerald-700'
                                : 'bg-white border-slate-100 text-slate-700'}
                        `}>
                            {milestone.status === 'completed' ? <CheckCircle2 className="w-5 h-5" /> : index + 1}
                        </div>
                        <div>
                            <h4 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                                {milestone.title}
                                {milestone.status === 'delivered' && (
                                    <span className="flex h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                                )}
                            </h4>
                            <p className="text-slate-500 text-sm mt-1 leading-relaxed max-w-2xl">{milestone.acceptance_criteria}</p>
                        </div>
                    </div>

                    <div className="flex flex-row md:flex-col items-center md:items-end gap-3 md:gap-1 min-w-[150px] w-full md:w-auto justify-between md:justify-start border-t md:border-t-0 pt-4 md:pt-0 mt-2 md:mt-0 border-slate-100">
                        <div className="font-black text-slate-900 text-lg">{milestone.amount} <span className="text-xs font-bold text-slate-400">PLN</span></div>
                        <Badge variant="outline" className={`font-semibold border px-2.5 py-0.5 ${statusConfig.color}`}>
                            {statusConfig.label}
                        </Badge>
                        <CollapsibleTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 absolute md:static top-6 right-6 text-slate-400 hover:text-slate-600">
                                {isOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                            </Button>
                        </CollapsibleTrigger>
                    </div>
                </div>

                <CollapsibleContent className="border-t border-slate-100 bg-slate-50/50">
                    <div className="p-6 space-y-8">

                        {/* STUDENT ACTIONS */}
                        {isStudent && ['funded', 'in_progress', 'rejected'].includes(milestone.status) && (
                            <div className="bg-white p-6 rounded-2xl border border-indigo-100 shadow-sm">
                                <h5 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                                    <div className="p-1.5 bg-indigo-100 text-indigo-600 rounded-lg">
                                        <FileText className="w-4 h-4" />
                                    </div>
                                    Prześlij efekty pracy
                                </h5>

                                <UploadForm
                                    applicationId={applicationId}
                                    action={async (_appId, formData) => {
                                        await submitMilestoneWorkAction(applicationId, milestone.id, formData);
                                    }}
                                />
                                {/* Display latest feedback if available */}
                                {latestDeliverable && latestDeliverable.company_feedback && (
                                    <div className="mt-6 p-4 bg-red-50 border border-red-100 rounded-xl flex gap-3 text-red-800 animate-in fade-in slide-in-from-top-2">
                                        <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                                        <div>
                                            <div className="font-bold mb-1 text-sm uppercase tracking-wide opacity-80">Uwagi od firmy</div>
                                            <p className="text-sm leading-relaxed">{latestDeliverable.company_feedback}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* COMPANY ACTIONS (REVIEW) */}
                        {isCompany && milestone.status === 'delivered' && latestDeliverable && (
                            <div className="bg-white rounded-2xl border border-indigo-100 shadow-lg shadow-indigo-50/50 overflow-hidden">
                                <div className="bg-gradient-to-r from-indigo-50 to-white px-6 py-4 border-b border-indigo-100 flex items-center gap-3">
                                    <div className="p-2 bg-white rounded-lg border border-indigo-100 shadow-sm text-indigo-600">
                                        <ShieldCheck className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-indigo-950">Weryfikacja efektów pracy</h3>
                                        <p className="text-xs text-indigo-600/80 font-medium">Student zgłosił zakończenie tego etapu</p>
                                    </div>
                                </div>

                                <div className="p-6 md:p-8 space-y-8">
                                    {/* Student's Submission Content */}
                                    <div className="grid lg:grid-cols-3 gap-8">
                                        <div className="space-y-2 lg:col-span-2">
                                            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Opis realizacji</label>
                                            <div className="text-slate-700 bg-slate-50 p-4 rounded-xl border border-slate-200/60 leading-relaxed whitespace-pre-wrap break-words min-h-[100px]">
                                                {latestDeliverable.description}
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Załączone pliki</label>
                                            <div className="grid gap-2">
                                                {latestDeliverable.files && latestDeliverable.files.length > 0 ? latestDeliverable.files.map((f: any, i: number) => (
                                                    <button
                                                        key={i}
                                                        type="button"
                                                        onClick={() => openDeliverableFile(f)}
                                                        className="group flex items-center gap-3 p-3 bg-white border border-slate-200 hover:border-indigo-300 hover:shadow-md hover:shadow-indigo-100 rounded-xl transition-all text-left w-full overflow-hidden"
                                                    >
                                                        <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-500 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                                                            <FileText className="w-4 h-4" />
                                                        </div>
                                                        <div className="min-w-0">
                                                            <div className="text-sm font-medium text-slate-700 truncate group-hover:text-indigo-700">{f.name}</div>
                                                            <div className="text-[10px] text-slate-400 uppercase font-bold group-hover:text-indigo-400">Pobierz</div>
                                                        </div>
                                                    </button>
                                                )) : (
                                                    <div className="text-sm text-slate-400 italic p-3 border border-dashed rounded-xl text-center">Brak plików</div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action Form */}
                                    <form action={async (formData) => {
                                        const decision = formData.get('decision') as 'accepted' | 'rejected';
                                        const feedback = String(formData.get('feedback') ?? "");
                                        await reviewMilestoneAction(milestone.id, applicationId, decision, feedback);
                                    }}>
                                        <ReviewControls label="Zatwierdź i wypłać środki" />
                                    </form>
                                </div>
                            </div>
                        )}

                        {/* HISTORY FOR THIS MILESTONE */}
                        {milestoneDeliverables.length > 0 && (
                            <div className="mt-8 pt-8 border-t border-slate-200/60">
                                <h5 className="flex items-center gap-2 text-xs font-bold uppercase text-slate-400 mb-6 tracking-wide">
                                    <Clock className="w-3 h-3" />
                                    Historia przesłanych wersji
                                </h5>
                                <div className="space-y-4 relative before:absolute before:inset-y-0 before:left-2 before:w-px before:bg-slate-200">
                                    {milestoneDeliverables.map((deliv: any) => (
                                        <div key={deliv.id} className="relative pl-8">
                                            <div className={`absolute top-3 left-0 w-4 h-4 rounded-full border-2 bg-white z-10 
                                                ${deliv.status === 'accepted' ? 'border-emerald-500' : deliv.status === 'rejected' ? 'border-red-400' : 'border-slate-300'}
                                            `} />

                                            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col gap-3 group hover:border-indigo-200 transition-colors">
                                                <div className="flex justify-between items-start gap-4">
                                                    <div>
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <span className="text-xs font-bold text-slate-400">
                                                                {new Date(deliv.created_at).toLocaleString('pl-PL', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}
                                                            </span>
                                                        </div>
                                                        <p className="text-slate-700 text-sm">{deliv.description}</p>
                                                    </div>
                                                    <Badge variant={deliv.status === 'rejected' ? 'destructive' : 'outline'} className={
                                                        deliv.status === 'accepted' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : ''
                                                    }>
                                                        {deliv.status === 'accepted' ? 'Zaakceptowane' : deliv.status === 'rejected' ? 'Odrzucone' : deliv.status}
                                                    </Badge>
                                                </div>

                                                {deliv.company_feedback && (
                                                    <div className="bg-red-50 text-red-800 p-3 rounded-lg text-sm border border-red-100 flex gap-2">
                                                        <MessageSquare className="w-4 h-4 shrink-0 mt-0.5 opacity-60" />
                                                        <div>
                                                            <span className="font-bold text-xs uppercase opacity-70 block mb-0.5">Powód odrzucenia:</span>
                                                            {deliv.company_feedback}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {milestoneDeliverables.length === 0 && !(['funded', 'in_progress'].includes(milestone.status) && isStudent) && (
                            <div className="text-center py-8">
                                <div className="inline-flex items-center justify-center p-3 bg-slate-50 rounded-full mb-3">
                                    <Clock className="w-6 h-6 text-slate-300" />
                                </div>
                                <p className="text-slate-500 font-medium">Jeszcze nic tu nie ma</p>
                                <p className="text-xs text-slate-400">Aktywność w tym etapie pojawi się tutaj.</p>
                            </div>
                        )}
                    </div>
                </CollapsibleContent>
            </Collapsible>
        </Card>
    );
}

function ReviewControls({ label = "Zatwierdź realizację" }: { label?: string }) {
    const [feedback, setFeedback] = useState("");

    return (
        <div className="space-y-4 pt-6 mt-6 border-t border-slate-100">
            <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 block">Uwagi do akceptacji lub powód odrzucenia</label>
                <Textarea
                    name="feedback"
                    placeholder="Wpisz komentarz tutaj..."
                    className="bg-slate-50 border-slate-200 resize-none min-h-[100px] focus:bg-white transition-colors"
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                />
                <p className="text-xs text-slate-400 text-right">
                    {feedback.length > 0 ? "Komentarz zostanie dołączony do decyzji." : "Komentarz jest wymagany tylko w przypadku odrzucenia."}
                </p>
            </div>

            <div className="flex flex-col-reverse md:flex-row gap-4 pt-2">
                <Button
                    type="submit"
                    name="decision"
                    value="rejected"
                    variant="outline"
                    disabled={!feedback.trim()}
                    className="md:flex-1 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 hover:border-red-300"
                >
                    <AlertCircle className="w-4 h-4 mr-2" />
                    Zgłoś poprawki (Odrzuć)
                </Button>

                <Button
                    type="submit"
                    name="decision"
                    value="accepted"
                    className="md:flex-[2] bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white shadow-lg shadow-emerald-200 border-0"
                >
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    {label}
                </Button>
            </div>
        </div>
    );
}


function RegenerateContractButton({ contractId, applicationId }: { contractId: string, applicationId: string }) {
    const [loading, setLoading] = useState(false);
    const handleRegen = async () => {
        if (!confirm("Wygenerować ponownie umowę? (DEBUG)")) return;
        setLoading(true);
        try {
            await generateContract(contractId, applicationId);
            // @ts-ignore
            toast.success("Umowa wygenerowana i dodana do plików.");
        } catch (e: any) {
            // @ts-ignore
            toast.error("Błąd: " + e.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Button onClick={handleRegen} disabled={loading} variant="outline" size="sm" className="text-xs border-dashed text-slate-400 hover:text-indigo-600">
            {loading ? "Generowanie..." : "⚡ Regeneruj Umowę (Debug)"}
        </Button>
    )
}
