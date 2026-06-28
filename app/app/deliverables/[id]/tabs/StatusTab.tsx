"use client";

import { useState, type ChangeEvent } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { UploadForm } from "../UploadForm";
import { ReviewModal } from "../../ReviewModal";
import { ReviewForm } from "../ReviewForm";


import {
    submitReview,
    submitMilestoneWorkAction,
    reviewMilestoneAction,
    getSignedStorageUrl,
    addResource
} from "../../_actions";
import { toast } from "sonner";
import { Shield, ShieldCheck, AlertCircle, CircleDollarSign, CheckCircle2, Lock, Clock, FileText, ChevronDown, ChevronUp, Star, Medal, MessageSquare, XCircle, Link2, Download, UploadCloud } from "lucide-react";
import { PaymentModal } from "@/app/components/payment-modal";
import { MilestoneNegotiation } from "./MilestoneNegotiation";
import { ContractDocumentsCard } from "./ContractDocumentsCard";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { uploadPrivateFile } from "@/lib/security/client-upload";

import { SecureImageViewer } from "@/app/components/SecureImageViewer";
import { ReviewBreakdown } from "@/components/reviews/ReviewBreakdown";
import { parseDetailedReviewComment } from "@/lib/reviews";
import { cn } from "@/lib/utils";

type ReviewData = {
    reviewer_id: string;
    rating: number;
    comment: string | null;
    created_at: string;
};

type DeliverableFile = {
    name?: string | null;
    kind?: string | null;
    url?: string | null;
    bucket?: string | null;
    path?: string | null;
};

type DeliverableRow = {
    id: string;
    milestone_id: string | null;
    status: string;
    company_feedback: string | null;
    description: string | null;
    files: DeliverableFile[] | null;
    created_at: string;
};

type ResourceRow = {
    id: string;
    file_name: string | null;
    file_path: string | null;
    created_at: string | null;
};

type MilestoneRow = {
    id: string;
    status: string;
    title: string;
    acceptance_criteria: string | null;
    amount: number;
    amount_minor: number | null;
    idx: number;
};

type ContractRow = {
    id: string;
    status: string;
    funding_mode: string | null;
    terms_status: string | null;
    company_contract_accepted_at: string | null;
    student_contract_accepted_at: string | null;
    documents_generated_at: string | null;
    milestones: MilestoneRow[] | null;
};

type ContractDocument = {
    id: string;
    contract_id: string;
    document_type: string;
    storage_path: string;
    file_name: string;
    company_accepted_at: string | null;
    student_accepted_at: string | null;
    generated_at: string;
};

type StatusTabProps = {
    applicationStatus: string;
    isStudent: boolean;
    isCompany: boolean;
    applicationId: string;
    deliverables: DeliverableRow[];
    myReview?: ReviewData | null;
    theirReview?: ReviewData | null;
    contract: ContractRow | null;
    totalAmount: number;
    enableNegotiation?: boolean;
    isPlatformService?: boolean;
    studentInstructions?: string | null;
    contractDocuments?: ContractDocument[];
    isServiceOrder?: boolean;
    resources?: ResourceRow[];
    projectTitle?: string | null;
    companyName?: string | null;
    companyHref?: string | null;
    conversationHref?: string | null;
    nextActionLabel?: string | null;
};

export function StatusTab({
    applicationStatus,
    isStudent,
    isCompany,
    applicationId,
    deliverables,
    myReview,
    theirReview,
    contract,
    totalAmount,
    enableNegotiation = false,
    isPlatformService = false,
    studentInstructions = null,
    contractDocuments = [],
    isServiceOrder = false,
    resources = [],
    projectTitle = null,
    companyName = null,
    companyHref = null,
    conversationHref = "/app/chat",
    nextActionLabel = null,
}: StatusTabProps) {
    // State for Payment Modal
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

    // State for Secure Viewer
    const [viewerState, setViewerState] = useState<{ isOpen: boolean; url: string; fileName: string; fileType: "image" | "pdf" }>({
        isOpen: false,
        url: "",
        fileName: "",
        fileType: "image",
    });

    // Filter milestones
    const milestones = contract?.milestones || [];
    const myReviewDetails = myReview ? parseDetailedReviewComment(myReview.comment) : null;
    const theirReviewDetails = theirReview ? parseDetailedReviewComment(theirReview.comment) : null;


    // Checkout charges the selected funding scope from the server, with full-contract funding as the MVP default.
    const fundingMode = contract?.funding_mode === "sequential" ? "sequential" : "full";
    const nextToFund = milestones.find((milestone) => milestone.status === "awaiting_funding") || null;
    const hasAgreedMilestones = contract?.terms_status === "agreed" && milestones.length > 0;
    const contractsAccepted = !!contract?.company_contract_accepted_at && !!contract?.student_contract_accepted_at;
    const canEnterEscrow = hasAgreedMilestones && contractsAccepted;

    const isEscrowReady =
        canEnterEscrow && fundingMode === "full"
            ? (milestones.length > 0 && milestones.every((milestone) => ["funded", "in_progress", "delivered", "released", "accepted", "completed"].includes(milestone.status)))
            : canEnterEscrow && !nextToFund; // sequential: ready when no milestone is currently waiting for funding

    // Progress helpers
    const isAnyFunded = milestones.some((milestone) => ['funded', 'in_progress', 'delivered', 'completed', 'released', 'accepted'].includes(milestone.status));

    // Calculate Total Budget strictly from milestones to avoid mismatches
    const contractBudget = milestones.reduce((sum, milestone) => sum + (Number(milestone.amount_minor ?? (milestone.amount * 100)) / 100), 0);

    // Global Progress Logic
    let currentStep = 1;

    if (contract?.status === 'completed') {
        currentStep = 5;
    } else if (milestones.some((milestone) => milestone.status === 'delivered')) {
        currentStep = 4; // Verification phase (at least one delivered)
    } else if (isAnyFunded) {
        // In sequential funding, work starts as soon as at least one milestone is funded.
        currentStep = 4;
    } else if (canEnterEscrow) {
        currentStep = 3; // Waiting for funding
    } else if (hasAgreedMilestones) {
        currentStep = 2; // Contract acceptance
    }

    // Stepper Configuration
    const steps = [
        { id: 1, label: "Start" },
        { id: 2, label: "Projekt" },
        { id: 3, label: "Rozliczenie" },
        { id: 4, label: "Realizacja" },
        { id: 5, label: "Odbiór" }
    ];
    const stepperProgress = Math.max(0, Math.min(1, (currentStep - 1) / (steps.length - 1)));

    // MANDATORY REVIEW LOGIC
    // Company must review if status is 'delivered' (or 'completed' but missing review due to legacy/migration miss)
    // Robustness: Check contract.status directly, AND check if all milestones are done (for migration safety)
    // FIX: Only show if explicitly completed OR all milestones are released. 'delivered' contract status might be premature if triggered by partial delivery.
    const allMilestonesReleased = milestones.length > 0 && milestones.every((milestone) => milestone.status === 'released' || milestone.status === 'accepted' || milestone.status === 'completed');
    const isContractDone = contract?.status === 'completed' || allMilestonesReleased;

    // Show if: Company AND No Review AND (Explicit Status OR Implicit Status)
    const showReviewModal = isCompany && !myReview && isContractDone;
    const canReopenTerms =
        !!contract &&
        hasAgreedMilestones &&
        !contractsAccepted &&
        !isAnyFunded &&
        ["draft", "awaiting_funding"].includes(String(contract.status));

    // Counter Logic
    const completedCount = milestones.filter((milestone) => ['released', 'accepted', 'completed'].includes(milestone.status)).length;
    const totalCount = milestones.length;
    const progressPercent = Math.max(0, Math.min(100, Math.round(stepperProgress * 100)));
    const displayBudget = contractBudget > 0 ? contractBudget : totalAmount;
    const securedAmount = milestones.reduce((sum, milestone) => (
        ['funded', 'in_progress', 'delivered', 'released', 'accepted', 'completed'].includes(milestone.status)
            ? sum + Number(milestone.amount_minor ?? (milestone.amount * 100)) / 100
            : sum
    ), 0);
    const releasedAmount = milestones.reduce((sum, milestone) => (
        ['released', 'accepted', 'completed'].includes(milestone.status)
            ? sum + Number(milestone.amount_minor ?? (milestone.amount * 100)) / 100
            : sum
    ), 0);
    const pendingAmount = Math.max(0, displayBudget - releasedAmount);
    const fundingAmount = fundingMode === "full"
        ? (contractBudget > 0 ? contractBudget : totalAmount)
        : Number((nextToFund?.amount_minor ? nextToFund.amount_minor / 100 : nextToFund?.amount) ?? 0);
    const projectDisplayName = projectTitle ?? "Realizowane zlecenie";
    const companyDisplayName = companyName ?? "Klient Student2Work";
    const activeActionLabel = nextActionLabel ?? (isStudent ? "Prześlij efekt pracy" : "Sprawdź postęp");
    const briefItems = [
        "Zakres prac, harmonogram i kryteria odbioru są zebrane w jednym miejscu.",
        "Pliki, briefy i materiały klienta pozostają dostępne w ramach etapu.",
        "Akceptacja etapu aktualizuje postęp oraz rozliczenie projektu.",
    ];
    const timelineItems = [
        { label: "Uzgodnienie etapów", done: currentStep > 1, active: currentStep === 1 },
        { label: "Umowy i depozyt", done: currentStep > 3, active: currentStep === 2 || currentStep === 3 },
        { label: "Realizacja pracy", done: currentStep > 4, active: currentStep === 4 },
        { label: "Odbiór i wypłata", done: currentStep === 5, active: currentStep === 5 },
    ];
    const escrowLabel = isEscrowReady
        ? "Środki zabezpieczone"
        : fundingMode === "full"
            ? "Wymagany depozyt"
            : "Wymagany depozyt etapu";
    const safeConversationHref = conversationHref ?? "/app/chat";
    const showLegacyWorkspace = false;

    return (
        <div className="grid gap-6 animate-in slide-in-from-bottom-2 duration-500">
            {/* SECURE VIEWER */}
            <SecureImageViewer
                isOpen={viewerState.isOpen}
                onClose={() => setViewerState(prev => ({ ...prev, isOpen: false }))}
                url={viewerState.url}
                fileName={viewerState.fileName}
                fileType={viewerState.fileType}
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
                    amount={fundingMode === "full" ? (contractBudget > 0 ? contractBudget : totalAmount) : Number((nextToFund?.amount_minor ? nextToFund.amount_minor / 100 : nextToFund?.amount) ?? 0)}
                    title={fundingMode === "full" ? `Zasilenie Depozytu (Cały Projekt)` : `Zasilenie Depozytu (Następny etap)`}
                    contractId={contract.id}
                    applicationId={isServiceOrder ? undefined : applicationId}
                    serviceOrderId={isServiceOrder ? applicationId : undefined}
                />
            )}

            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-3 duration-500">
                <section className="rounded-[1.35rem] border border-slate-200/80 bg-white p-4 shadow-[0_18px_50px_-34px_rgba(15,23,42,0.35)] sm:p-5">
                    <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Postęp realizacji</p>
                            <h2 className="mt-1 text-lg font-black text-[#07142f] sm:text-xl">{projectDisplayName}</h2>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                            <Badge className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-emerald-700">
                                {progressPercent}% ukończone
                            </Badge>
                            <Badge variant="outline" className="rounded-full border-slate-200 bg-white px-3 py-1 text-[10px] font-black uppercase tracking-widest text-slate-500">
                                {totalCount > 0 ? `${completedCount}/${totalCount}` : "0"} etapów
                            </Badge>
                        </div>
                    </div>

                    <div className="hidden sm:block">
                        <div className="relative px-5 py-3">
                            <div className="absolute left-10 right-10 top-8 h-1.5 rounded-full bg-slate-100" />
                            <div
                                className="absolute left-10 right-10 top-8 h-1.5 origin-left rounded-full bg-emerald-400 transition-transform duration-700 ease-out"
                                style={{ transform: `scaleX(${stepperProgress})` }}
                            />
                            <div className="relative z-10 grid grid-cols-5 gap-3">
                                {steps.map((step) => {
                                    const isCompleted = currentStep > step.id;
                                    const isActive = currentStep === step.id;

                                    return (
                                        <div key={step.id} className="flex min-w-0 flex-col items-center gap-2 text-center">
                                            <div
                                                className={cn(
                                                    "flex h-10 w-10 items-center justify-center rounded-full border-2 bg-white text-xs font-black transition-all",
                                                    isCompleted && "border-emerald-400 bg-emerald-400 text-white",
                                                    isActive && "border-[#07142f] bg-[#07142f] text-white shadow-[0_0_0_6px_rgba(7,20,47,0.08)]",
                                                    !isCompleted && !isActive && "border-slate-200 text-slate-300",
                                                )}
                                            >
                                                {isCompleted ? <CheckCircle2 className="h-4 w-4" /> : step.id}
                                            </div>
                                            <span
                                                className={cn(
                                                    "max-w-full text-[10px] font-black uppercase tracking-widest",
                                                    isActive && "text-[#07142f]",
                                                    isCompleted && "text-emerald-700",
                                                    !isCompleted && !isActive && "text-slate-400",
                                                )}
                                            >
                                                {step.label}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    <div className="grid gap-2 sm:hidden">
                        {steps.map((step) => {
                            const isCompleted = currentStep > step.id;
                            const isActive = currentStep === step.id;

                            return (
                                <div
                                    key={step.id}
                                    className={cn(
                                        "grid grid-cols-[2.25rem,minmax(0,1fr)] gap-3 rounded-2xl border p-3",
                                        isActive ? "border-[#07142f] bg-slate-50" : "border-slate-100 bg-white",
                                    )}
                                >
                                    <div className="flex items-start justify-center">
                                        <div
                                            className={cn(
                                                "flex h-9 w-9 items-center justify-center rounded-full border-2 bg-white text-xs font-black",
                                                isCompleted && "border-emerald-400 bg-emerald-400 text-white",
                                                isActive && "border-[#07142f] bg-[#07142f] text-white",
                                                !isCompleted && !isActive && "border-slate-200 text-slate-300",
                                            )}
                                        >
                                            {isCompleted ? <CheckCircle2 className="h-4 w-4" /> : step.id}
                                        </div>
                                    </div>
                                    <div className="min-w-0">
                                        <p className={cn("text-xs font-black uppercase tracking-normal", isActive ? "text-[#07142f]" : "text-slate-500")}>
                                            {step.label}
                                        </p>
                                        {isActive ? <p className="mt-1 text-xs font-semibold text-slate-500">{activeActionLabel}</p> : null}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </section>

                <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
                    <div className="space-y-4">
                        <section className="rounded-[1.35rem] border border-slate-200/80 bg-white p-4 shadow-[0_18px_50px_-36px_rgba(15,23,42,0.34)] sm:p-5">
                            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Etapy i akceptacja</p>
                                    <h2 className="mt-1 text-lg font-black text-[#07142f]">Plan pracy</h2>
                                </div>
                                <Badge className={cn(
                                    "w-fit rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-widest",
                                    isEscrowReady
                                        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                        : "border-amber-200 bg-amber-50 text-amber-700",
                                )}>
                                    {escrowLabel}
                                </Badge>
                            </div>

                            {enableNegotiation && contract?.terms_status !== 'agreed' && !isAnyFunded ? (
                                <MilestoneNegotiation
                                    applicationId={applicationId}
                                    contract={contract}
                                    isCompany={isCompany}
                                    isStudent={isStudent}
                                    totalAmount={totalAmount}
                                />
                            ) : null}

                            {contract && contract?.terms_status === 'agreed' ? (
                                <div className="mb-4">
                                    <ContractDocumentsCard
                                        contractId={contract.id}
                                        applicationId={applicationId}
                                        isCompany={isCompany}
                                        isStudent={isStudent}
                                        documents={contractDocuments}
                                        documentsGeneratedAt={contract.documents_generated_at}
                                        companyAcceptedAt={contract.company_contract_accepted_at}
                                        studentAcceptedAt={contract.student_contract_accepted_at}
                                        termsAgreed={contract.terms_status === 'agreed'}
                                        canReopenTerms={canReopenTerms}
                                    />
                                </div>
                            ) : null}

                            {((contract?.terms_status === 'agreed') || isAnyFunded) && milestones.length > 0 ? (
                                <div className="space-y-3">
                                    {milestones.map((milestone, index) => (
                                        <MilestoneItem
                                            key={milestone.id}
                                            milestone={milestone}
                                            allMilestones={milestones}
                                            index={index}
                                            isStudent={isStudent}
                                            isCompany={isCompany}
                                            applicationId={applicationId}
                                            deliverables={deliverables}
                                            resources={resources}
                                            onOpenSecureViewer={(url: string, name: string, fileType: "image" | "pdf") => setViewerState({ isOpen: true, url, fileName: name, fileType })}
                                        />
                                    ))}
                                </div>
                            ) : (
                                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-5 text-sm font-semibold text-slate-500">
                                    Etapy pojawią się tutaj po uzgodnieniu zakresu projektu.
                                </div>
                            )}
                        </section>

                        <section className="rounded-[1.35rem] border border-slate-200/80 bg-white p-4 shadow-[0_18px_50px_-36px_rgba(15,23,42,0.28)] sm:p-5">
                            <div className="mb-4 flex items-center gap-2">
                                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-lime-100 text-[#07142f]">
                                    <Lock className="h-4 w-4" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Brief i zakres</p>
                                    <h2 className="text-lg font-black text-[#07142f]">Materiały do realizacji</h2>
                                </div>
                            </div>
                            {isStudent && isPlatformService && studentInstructions ? (
                                <pre className="whitespace-pre-wrap rounded-2xl border border-amber-200 bg-amber-50 p-4 font-sans text-sm font-semibold leading-relaxed text-amber-950">
                                    {studentInstructions}
                                </pre>
                            ) : (
                                <div className="grid gap-2">
                                    {briefItems.map((item) => (
                                        <div key={item} className="flex gap-2 rounded-xl bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-600">
                                            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                                            <span>{item}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </section>
                    </div>

                    <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
                        <section className="rounded-[1.35rem] border border-slate-200/80 bg-white p-4 shadow-[0_18px_50px_-36px_rgba(15,23,42,0.34)]">
                            {companyHref ? (
                                <Link href={companyHref} className="group flex items-center gap-3 rounded-2xl transition-colors hover:bg-slate-50">
                                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#102b66] text-sm font-black text-[#c5fb37]">
                                        {companyDisplayName.slice(0, 2).toUpperCase()}
                                    </div>
                                    <div className="min-w-0">
                                        <h3 className="truncate text-sm font-black text-[#07142f] group-hover:text-[#102b66]">{companyDisplayName}</h3>
                                        <p className="text-xs font-bold text-slate-400">Klient projektu</p>
                                    </div>
                                </Link>
                            ) : (
                                <div className="flex items-center gap-3">
                                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#102b66] text-sm font-black text-[#c5fb37]">
                                        {companyDisplayName.slice(0, 2).toUpperCase()}
                                    </div>
                                    <div className="min-w-0">
                                        <h3 className="truncate text-sm font-black text-[#07142f]">{companyDisplayName}</h3>
                                        <p className="text-xs font-bold text-slate-400">Klient projektu</p>
                                    </div>
                                </div>
                            )}
                            <div className="mt-4 grid gap-2 rounded-2xl bg-slate-50 p-3">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="font-bold text-slate-500">Budżet projektu</span>
                                    <span className="font-black text-[#07142f]">{displayBudget.toFixed(2)} PLN</span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="font-bold text-slate-500">W depozycie</span>
                                    <span className="font-black text-emerald-600">{securedAmount.toFixed(2)} PLN</span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="font-bold text-slate-500">Do rozliczenia</span>
                                    <span className="font-black text-[#07142f]">{pendingAmount.toFixed(2)} PLN</span>
                                </div>
                            </div>

                            {isCompany && !isEscrowReady && canEnterEscrow ? (
                                <Button
                                    size="lg"
                                    onClick={() => setIsPaymentModalOpen(true)}
                                    className="mt-4 h-12 w-full rounded-2xl bg-[#07142f] text-sm font-black text-white shadow-[0_18px_40px_-26px_rgba(7,20,47,0.8)] hover:bg-[#102b66]"
                                >
                                    <CircleDollarSign className="mr-2 h-4 w-4" />
                                    Zasil depozyt {fundingAmount.toFixed(2)} PLN
                                </Button>
                            ) : (
                                <Button asChild className="mt-4 h-12 w-full rounded-2xl bg-[#07142f] text-sm font-black text-white hover:bg-[#102b66]">
                                    <Link href={safeConversationHref}>
                                        <MessageSquare className="mr-2 h-4 w-4" />
                                        Otwórz rozmowę
                                    </Link>
                                </Button>
                            )}
                        </section>

                        <section className="rounded-[1.35rem] border border-slate-200/80 bg-white p-4 shadow-[0_18px_50px_-36px_rgba(15,23,42,0.26)]">
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Najbliższe</p>
                            <div className="mt-4 space-y-3">
                                {timelineItems.map((item) => (
                                    <div key={item.label} className="grid grid-cols-[1rem,1fr] gap-3">
                                        <span
                                            className={cn(
                                                "mt-1 h-3 w-3 rounded-full border-2 bg-white",
                                                item.done && "border-emerald-400 bg-emerald-400",
                                                item.active && "border-[#102b66] bg-[#102b66]",
                                                !item.done && !item.active && "border-slate-200",
                                            )}
                                        />
                                        <p className={cn("text-sm font-bold", item.active ? "text-[#07142f]" : "text-slate-500")}>
                                            {item.label}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </section>

                        <section className="rounded-[1.35rem] border border-amber-200 bg-amber-50 p-4">
                            <div className="flex gap-3">
                                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
                                <div>
                                    <h3 className="text-sm font-black text-amber-950">Czy potrzebujesz pomocy?</h3>
                                    <p className="mt-1 text-xs font-semibold leading-relaxed text-amber-800">
                                        W razie problemów możesz wrócić do rozmowy albo zgłosić sprawę do obsługi.
                                    </p>
                                    <Button asChild variant="outline" size="sm" className="mt-3 rounded-xl border-amber-300 bg-white text-amber-900 hover:bg-amber-100">
                                        <Link href={safeConversationHref}>Otwórz rozmowę</Link>
                                    </Button>
                                </div>
                            </div>
                        </section>
                    </aside>
                </div>
            </div>

            {showLegacyWorkspace ? (
                <>
            {/* HEADER CARD */}
            <Card className="overflow-hidden rounded-[2rem] border border-slate-200/80 bg-white shadow-[0_24px_70px_-44px_rgba(15,23,42,0.55)]">
                <div className="p-5 sm:p-6 md:p-8">
                    <div className="mb-8 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
                        <div>
                            <h2 className="flex flex-wrap items-center gap-2 text-xl font-black tracking-tight text-slate-900 sm:text-2xl">
                                Panel Realizacji
                                <Badge variant="outline" className="rounded-full border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-normal text-slate-500">
                                    {contract?.status === 'completed' ? 'Zakończone' : 'W toku'}
                                </Badge>
                            </h2>
                            {milestones.length > 0 && (
                                <p className="mt-2 flex flex-wrap items-center gap-2 text-sm font-medium text-slate-500">
                                    Postęp prac
                                    <span className="rounded-full border border-indigo-100 bg-indigo-50 px-2.5 py-1 text-xs font-black text-indigo-700">
                                        {completedCount} / {totalCount} etapów
                                    </span>
                                </p>
                            )}
                            {/* Contract documents generation handled by ContractDocumentsCard below */}
                        </div>

                        {/* Deposit status badge */}
                        {milestones.length > 0 && (
                            <div className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-black shadow-sm transition-all duration-300
                                ${isEscrowReady
                                    ? 'bg-emerald-50 border-emerald-100 text-emerald-700'
                                    : 'bg-amber-50 border-amber-100 text-amber-700'
                                }`}>
                                {isEscrowReady ? <ShieldCheck className="w-4 h-4" /> : <Shield className="w-4 h-4" />}
                                {isEscrowReady ? (fundingMode === "full" ? "Środki Zabezpieczone (Całość)" : "Środki Zabezpieczone (Bieżący etap)") : (fundingMode === "full" ? "Wymagane Zasilenie Depozytu" : "Wymagane Zasilenie Następnego Etapu")}
                            </div>
                        )}
                    </div>

                    {/* STEPPER */}
                    <div className="relative mb-8 rounded-[1.75rem] border border-slate-100 bg-slate-50/70 px-3 py-5 sm:px-6">
                        <div className="absolute left-7 right-7 top-[2.15rem] h-1.5 rounded-full bg-slate-200/80 sm:left-11 sm:right-11" />
                        <div
                            className="absolute left-7 right-7 top-[2.15rem] h-1.5 origin-left rounded-full bg-gradient-to-r from-indigo-500 via-violet-500 to-emerald-400 shadow-[0_8px_24px_-16px_rgba(79,70,229,0.9)] transition-transform duration-700 ease-out sm:left-11 sm:right-11"
                            style={{ transform: `scaleX(${stepperProgress})` }}
                        />

                        <div className="relative z-10 grid grid-cols-5 gap-1 sm:gap-3">
                            {steps.map((step) => {
                                const isCompleted = currentStep > step.id;
                                const isActive = currentStep === step.id;

                                return (
                                    <div key={step.id} className="flex min-w-0 flex-col items-center gap-3 text-center">
                                        <div
                                            className={cn(
                                                "flex h-9 w-9 items-center justify-center rounded-full border-[3px] text-xs font-black shadow-sm transition-all duration-500 sm:h-12 sm:w-12 sm:text-sm",
                                                isCompleted && "border-emerald-500 bg-emerald-500 text-white shadow-emerald-200",
                                                isActive && "scale-105 border-indigo-600 bg-white text-indigo-600 shadow-[0_0_0_5px_rgba(79,70,229,0.13)]",
                                                !isCompleted && !isActive && "border-slate-200 bg-white text-slate-300",
                                            )}
                                        >
                                            {isCompleted ? <CheckCircle2 className="h-4 w-4 sm:h-6 sm:w-6" /> : step.id}
                                        </div>
                                        <span
                                            className={cn(
                                                "max-w-full whitespace-nowrap text-[9px] font-black uppercase tracking-normal [overflow-wrap:normal] sm:text-[11px]",
                                                isActive && "rounded-full bg-indigo-50 px-2 py-1 text-indigo-700",
                                                isCompleted && "text-emerald-700",
                                                !isCompleted && !isActive && "text-slate-400",
                                            )}
                                        >
                                            {step.label}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Step Actions */}
                    <div className="relative mt-6 flex flex-col items-start justify-between gap-5 overflow-hidden rounded-[1.5rem] border border-slate-100 bg-gradient-to-br from-white via-slate-50 to-indigo-50/35 p-5 shadow-sm md:flex-row md:items-center md:p-6">
                        <div className="relative z-10 text-left">
                            <h3 className="mb-2 text-lg font-black tracking-tight text-slate-900">
                                {currentStep === 1 && "Ustalanie etapów"}
                                {currentStep === 2 && "Akceptacja umów"}
                                {currentStep === 3 && "Depozyt / płatność"}
                                {currentStep >= 4 && "Realizacja etapów"}
                            </h3>
                            <p className="max-w-2xl text-sm font-medium leading-relaxed text-slate-500">
                                {currentStep === 1 && "Najpierw ustalcie zakres i harmonogram etapów."}
                                {currentStep === 2 && "Po zatwierdzeniu etapów obie strony musza zaakceptować swoje umowy."}
                                {currentStep === 3 && (fundingMode === "full" ? "Firma może teraz wplacic calosc budzetu do bezpiecznego depozytu." : "Firma może teraz zasilic depozyt dla nastepnego etapu.")}
                                {currentStep >= 4 && "Srodki są zabezpieczone w depozycie. Student realizuje kolejne etapy zgodnie z harmonogramem."}
                            </p>
                        </div>

                        {/* Payment Button — visible only after agreed milestones and both contract acceptances */}
                        {isCompany && !isEscrowReady && canEnterEscrow && (
                            <Button
                                size="lg"
                                onClick={() => setIsPaymentModalOpen(true)}
                                className="relative z-10 w-full md:w-auto bg-slate-900 hover:bg-slate-800 text-white shadow-xl font-bold px-8 h-14 rounded-2xl transition-all active:scale-[0.98]"
                            >
                                <CircleDollarSign className="w-5 h-5 mr-2" />
                                Zasil Depozyt ({fundingMode === "full" ? (contractBudget > 0 ? contractBudget : totalAmount) : Number((nextToFund?.amount_minor ? nextToFund.amount_minor / 100 : nextToFund?.amount) ?? 0)} PLN)
                            </Button>
                        )}

                        {isStudent && !isEscrowReady && canEnterEscrow && (
                            <div className="relative z-10 px-5 py-3 bg-white border border-slate-200 rounded-2xl text-slate-500 text-sm font-medium flex items-center gap-3 shadow-sm">
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
                    isCompany={isCompany}
                    isStudent={isStudent}
                    totalAmount={totalAmount}
                />
            )}

            {/* CONTRACT DOCUMENTS (after negotiation, before payment) — hidden for platform services */}
            {contract && contract?.terms_status === 'agreed' && (
                <ContractDocumentsCard
                    contractId={contract.id}
                    applicationId={applicationId}
                    isCompany={isCompany}
                    isStudent={isStudent}
                    documents={contractDocuments}
                    documentsGeneratedAt={contract.documents_generated_at}
                    companyAcceptedAt={contract.company_contract_accepted_at}
                    studentAcceptedAt={contract.student_contract_accepted_at}
                    termsAgreed={contract.terms_status === 'agreed'}
                    canReopenTerms={canReopenTerms}
                />
            )}

            {/* STUDENT INSTRUCTIONS (platform service only, hidden from company) */}
            {isStudent && isPlatformService && studentInstructions && (
                <Card className="rounded-2xl border-amber-200 bg-amber-50 shadow-sm overflow-hidden">
                    <CardHeader className="pb-3 border-b border-amber-200">
                        <CardTitle className="flex items-center gap-2 text-base text-amber-900">
                            <Lock className="w-4 h-4 text-amber-600" />
                            Instrukcje realizacji (widoczne tylko dla Ciebie)
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4">
                        <pre className="whitespace-pre-wrap text-sm text-amber-900 font-sans leading-relaxed">
                            {studentInstructions}
                        </pre>
                    </CardContent>
                </Card>
            )}

            {/* MILESTONE LIST (Step 3+) */}
            {((contract?.terms_status === 'agreed') || isAnyFunded) && milestones.length > 0 && (
                <div className="space-y-6">
                    <h3 className="text-xl font-bold text-slate-800 px-1">Harmonogram Realizacji</h3>
                    {milestones.map((milestone, index) => (
                        <MilestoneItem
                            key={milestone.id}
                            milestone={milestone}
                            allMilestones={milestones}
                            index={index}
                            isStudent={isStudent}
                            isCompany={isCompany}
                            applicationId={applicationId}
                            deliverables={deliverables}
                            resources={resources}
                            onOpenSecureViewer={(url: string, name: string, fileType: "image" | "pdf") => setViewerState({ isOpen: true, url, fileName: name, fileType })}
                        />
                    ))}
                </div>
            )}
                </>
            ) : null}

            {/* REVIEW SECTION (Completed Only) */}
            {isContractDone && (
                <Card className="rounded-2xl border-slate-200 shadow-sm bg-gradient-to-br from-indigo-50/50 to-white overflow-hidden">
                    <CardHeader className="border-b border-indigo-50 bg-white/50">
                        <CardTitle className="flex items-center gap-2 text-indigo-900">
                            <Star className="w-5 h-5 fill-indigo-500 text-indigo-500" />
                            Podsumowanie współpracy
                        </CardTitle>
                        <CardDescription>
                            Zlecenie zostało zakończone. {isCompany ? "Oceń współpracę ze studentem." : "Możesz ocenić firmę i zobaczyć opinię klienta."}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="p-6 md:p-8">
                        {isCompany ? (
                            <>
                                {myReview ? (
                                    <div className="bg-white p-6 rounded-2xl border shadow-sm">
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
                                        <ReviewBreakdown ratings={myReviewDetails?.categories ?? {}} compact />
                                        <div className="text-slate-600 italic mt-3">
                                            {myReviewDetails?.displayComment ? `"${myReviewDetails.displayComment}"` : "Bez dodatkowego komentarza."}
                                        </div>
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
                                    <div className="bg-white p-6 rounded-2xl border shadow-sm relative overflow-hidden">
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
                                        <ReviewBreakdown ratings={theirReviewDetails?.categories ?? {}} compact />
                                        <p className="text-slate-700 text-lg relative z-10 mt-3">
                                            {theirReviewDetails?.displayComment ? `"${theirReviewDetails.displayComment}"` : "Bez dodatkowego komentarza."}
                                        </p>
                                    </div>
                                ) : (
                                    <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed">
                                        <Clock className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                                        <h4 className="text-slate-600 font-medium">Oczekiwanie na opinię</h4>
                                        <p className="text-slate-400 text-sm">Klient jeszcze nie wystawił oceny za to zlecenie.</p>
                                    </div>
                                )}

                                <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                                    {myReview ? (
                                        <div>
                                            <h4 className="mb-4 text-xs font-bold uppercase tracking-wide text-slate-500">Twoja opinia o firmie</h4>
                                            <div className="mb-4 flex items-center gap-2">
                                                <div className="flex gap-1">
                                                    {[1, 2, 3, 4, 5].map(star => (
                                                        <Star
                                                            key={star}
                                                            className={`w-5 h-5 ${star <= myReview.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`}
                                                        />
                                                    ))}
                                                </div>
                                                <span className="ml-2 font-bold text-slate-700">{myReview.rating}/5</span>
                                            </div>
                                            <ReviewBreakdown ratings={myReviewDetails?.categories ?? {}} compact />
                                            <div className="mt-3 italic text-slate-600">
                                                {myReviewDetails?.displayComment ? `"${myReviewDetails.displayComment}"` : "Bez dodatkowego komentarza."}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            <div>
                                                <h4 className="font-bold text-slate-900">Wystaw opinię firmie</h4>
                                                <p className="mt-1 text-sm text-slate-500">Opinia pomaga innym studentom ocenić jakość współpracy.</p>
                                            </div>
                                            <ReviewForm applicationId={applicationId} action={submitReview} />
                                        </div>
                                    )}
                                </div>
                            </>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* DANGER ZONE — Zakończ współpracę (tylko przed startem realizacji, tj. do etapu 2) */}
            {applicationStatus === 'accepted' && contract?.status !== 'completed' && currentStep <= 2 && (
                <Card className="border-red-200 bg-red-50/40 shadow-sm overflow-hidden">
                    <CardContent className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="flex items-start gap-3">
                            <div className="p-2 bg-red-100 rounded-lg shrink-0 mt-0.5">
                                <XCircle className="w-5 h-5 text-red-600" />
                            </div>
                            <div>
                                <p className="font-semibold text-red-800 text-sm">Zakończ współpracę</p>
                                <p className="text-red-600/80 text-xs mt-0.5 max-w-md">
                                    Ta operacja jest nieodwracalna. Zlecenie zostanie anulowane,
                                    a środki z depozytu — zwrócone zgodnie z regulaminem.
                                </p>
                            </div>
                        </div>
                        <Button
                            asChild
                            variant="outline"
                            size="sm"
                            className="shrink-0 border-red-300 text-red-700 hover:bg-red-100 hover:border-red-400 hover:text-red-800 transition-colors"
                        >
                            <Link href={`/app/cancel/${applicationId}`}>
                                <XCircle className="w-4 h-4 mr-1.5" />
                                Anuluj zlecenie
                            </Link>
                        </Button>
                    </CardContent>
                </Card>
            )}

        </div>
    );
}

function MilestoneResources({ applicationId, resources, isCompany }: { applicationId: string; resources: ResourceRow[]; isCompany: boolean }) {
    const [isUploading, setIsUploading] = useState(false);

    async function openResource(resource: ResourceRow) {
        if (!resource?.file_path) return;

        try {
            const signedUrl = await getSignedStorageUrl("deliverables", String(resource.file_path), 600);
            window.open(signedUrl, "_blank", "noopener,noreferrer");
        } catch (error) {
            console.error(error);
            toast.error("Nie udało się otworzyć materiału.");
        }
    }

    async function handleUpload(event: ChangeEvent<HTMLInputElement>) {
        const file = event.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        try {
            const uploaded = await uploadPrivateFile({
                file,
                purpose: "deliverable_resource",
                sourceId: applicationId,
            });

            const formData = new FormData();
            formData.append("filename", uploaded.name);
            formData.append("fileUrl", uploaded.path);
            formData.append("fileSize", String(uploaded.size));

            await addResource(applicationId, formData);
            toast.success("Materiał został dodany do zlecenia.");
        } catch (error) {
            console.error(error);
            const message = error instanceof Error ? error.message : "Nie udało się dodać materiału.";
            toast.error(message);
        } finally {
            setIsUploading(false);
            event.target.value = "";
        }
    }

    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h5 className="flex items-center gap-2 text-sm font-black text-[#07142f]">
                        <FileText className="h-4 w-4 text-emerald-600" />
                        Materiały od firmy
                    </h5>
                    <p className="mt-1 text-xs font-semibold leading-relaxed text-slate-500">
                        Briefy, screeny, logotypy i dodatkowe wytyczne dostępne bez wychodzenia poza platformę.
                    </p>
                </div>

                {isCompany && (
                    <label className="inline-flex h-9 cursor-pointer items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 text-xs font-black text-emerald-700 transition-colors hover:bg-emerald-100">
                        <UploadCloud className="h-4 w-4" />
                        {isUploading ? "Wysyłanie..." : "Dodaj materiał"}
                        <input
                            type="file"
                            className="hidden"
                            onChange={handleUpload}
                            disabled={isUploading}
                        />
                    </label>
                )}
            </div>

            {resources.length > 0 ? (
                <div className="mt-3 flex flex-wrap gap-2">
                    {resources.map((resource) => (
                        <button
                            key={resource.id}
                            type="button"
                            onClick={() => openResource(resource)}
                            className="inline-flex max-w-full items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-left transition-colors hover:border-emerald-200 hover:bg-emerald-50"
                        >
                            <span className="min-w-0 max-w-[14rem]">
                                <span className="block truncate text-xs font-black text-slate-700">
                                    {resource.file_name || "Materiał"}
                                </span>
                                <span className="text-[10px] font-bold text-slate-400">
                                    {resource.created_at ? new Date(resource.created_at).toLocaleDateString("pl-PL") : "Dodano do zlecenia"}
                                </span>
                            </span>
                            <Download className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                        </button>
                    ))}
                </div>
            ) : (
                <div className="mt-3 rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-5 text-center text-xs font-semibold text-slate-400">
                    Brak materiałów od firmy dla tego zlecenia.
                </div>
            )}
        </div>
    );
}

type MilestoneItemProps = {
    milestone: MilestoneRow;
    allMilestones: MilestoneRow[];
    index: number;
    isStudent: boolean;
    isCompany: boolean;
    applicationId: string;
    deliverables: DeliverableRow[];
    resources: ResourceRow[];
    onOpenSecureViewer: (url: string, name: string, fileType: "image" | "pdf") => void;
};

function MilestoneItem({ milestone, allMilestones, index, isStudent, isCompany, applicationId, deliverables, resources, onOpenSecureViewer }: MilestoneItemProps) {
    async function openDeliverableFile(file: DeliverableFile, allowFullAccess = false) {
        try {
            let signed = "";
            if (file?.kind === "external_link" && typeof file?.url === "string") {
                window.open(file.url, "_blank", "noopener,noreferrer");
                return;
            } else if (file?.bucket && file?.path) {
                signed = await getSignedStorageUrl(file.bucket, file.path, 600);
            } else if (file?.url && typeof file.url === "string" && !/^https?:\/\//i.test(file.url)) {
                signed = await getSignedStorageUrl("deliverables", file.url, 600);
            }

            if (!signed) return;

            const lowerName = (file.name || "").toLowerCase();
            const isImage = lowerName.endsWith(".png") || lowerName.endsWith(".jpg") || lowerName.endsWith(".jpeg") || lowerName.endsWith(".gif") || lowerName.endsWith(".webp");
            const isPdf = lowerName.endsWith(".pdf");

            if (allowFullAccess) {
                window.open(signed, "_blank");
            } else if ((isImage || isPdf) && onOpenSecureViewer) {
                onOpenSecureViewer(signed, file.name || "Plik", isPdf ? "pdf" : "image");
            } else {
                toast.info("Pelny plik bedzie dostępny po akceptacji etapu. Popros studenta o preview w formacie PNG/JPG/PDF.");
            }
        } catch (err) {
            console.error(err);
            alert("Nie udało sie otworzyć pliku.");
        }
    }

    const [isOpen, setIsOpen] = useState(milestone.status !== 'completed');

    // Find deliverables linked to this milestone
    const milestoneDeliverables = deliverables.filter((deliverable) => deliverable.milestone_id === milestone.id);
    const latestDeliverable = milestoneDeliverables[0]; // Assuming order by created_at desc
    const hasFullFileAccess = (deliverable: DeliverableRow) =>
        isStudent ||
        ["accepted", "released", "completed"].includes(String(deliverable?.status)) ||
        ["accepted", "released", "completed"].includes(String(milestone.status));
    const isFinalDeliveredMilestone = milestone.status === "delivered"
        && allMilestones
            .filter((candidate) => candidate.id !== milestone.id)
            .every((candidate) => ["released", "accepted", "completed", "refunded"].includes(String(candidate.status)));

    const statusConfig = {
        'awaiting_funding': { label: 'Oczekuje', color: 'bg-slate-100 text-slate-500' },
        'funded': { label: 'Do zrobienia', color: 'bg-blue-50 text-blue-700 border-blue-200' },
        'in_progress': { label: 'W trakcie', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
        'delivered': { label: 'Czeka na akceptację', color: 'bg-amber-50 text-amber-700 border-amber-200' },
        'completed': { label: 'Zakończone', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
        'released': { label: 'Zaakceptowany', color: 'bg-emerald-100 text-emerald-800 border-emerald-300' }
    }[milestone.status as string] || { label: milestone.status, color: 'bg-gray-100' };

    return (
        <Card className={cn(
            "overflow-hidden rounded-2xl border bg-white shadow-none transition-all",
            milestone.status === 'completed'
                ? 'border-emerald-100 bg-emerald-50/25'
                : milestone.status === 'delivered'
                    ? 'border-amber-200 bg-amber-50/20'
                    : 'border-slate-200 hover:border-emerald-200',
        )}>
            <Collapsible open={isOpen} onOpenChange={setIsOpen}>
                <div className="relative z-10 flex flex-col gap-3 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex min-w-0 flex-1 items-start gap-3">
                        <div className={cn(
                            "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border text-sm font-black",
                            milestone.status === 'completed'
                                ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                                : milestone.status === 'delivered'
                                    ? 'border-amber-200 bg-amber-50 text-amber-700'
                                    : 'border-slate-200 bg-slate-50 text-[#07142f]',
                        )}>
                            {milestone.status === 'completed' ? <CheckCircle2 className="h-4 w-4" /> : index + 1}
                        </div>
                        <div className="min-w-0">
                            <h4 className="flex min-w-0 items-center gap-2 text-sm font-black leading-snug text-[#07142f] sm:text-base">
                                <span className="truncate">{milestone.title}</span>
                                {milestone.status === 'delivered' && (
                                    <span className="flex h-2 w-2 shrink-0 animate-pulse rounded-full bg-amber-500" />
                                )}
                            </h4>
                            {milestone.acceptance_criteria ? (
                                <p className="mt-1 line-clamp-2 max-w-2xl text-xs font-semibold leading-relaxed text-slate-500">
                                    {milestone.acceptance_criteria}
                                </p>
                            ) : null}
                        </div>
                    </div>

                    <div className="flex w-full items-center justify-between gap-3 border-t border-slate-100 pt-3 sm:w-auto sm:min-w-[170px] sm:border-t-0 sm:pt-0">
                        <div className="min-w-0 sm:text-right">
                            <div className="text-base font-black text-[#07142f]">
                                {(milestone.amount_minor ? milestone.amount_minor / 100 : milestone.amount)} <span className="text-[10px] font-black text-slate-400">PLN</span>
                            </div>
                            <Badge variant="outline" className={`mt-1 border px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wide ${statusConfig.color}`}>
                                {statusConfig.label}
                            </Badge>
                        </div>
                        <CollapsibleTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-9 w-9 shrink-0 rounded-xl p-0 text-slate-400 hover:bg-slate-100 hover:text-[#07142f]">
                                {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                            </Button>
                        </CollapsibleTrigger>
                    </div>
                </div>

                <CollapsibleContent className="border-t border-slate-100 bg-slate-50/70">
                    <div className="space-y-4 p-4 sm:p-5">
                        <MilestoneResources
                            applicationId={applicationId}
                            resources={resources ?? []}
                            isCompany={isCompany}
                        />

                        {/* STUDENT ACTIONS */}
                        {isStudent && ['funded', 'in_progress', 'rejected'].includes(milestone.status) && (
                            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
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
                                {latestDeliverable && latestDeliverable.company_feedback && latestDeliverable.status === 'rejected' && (
                                    <div className="mt-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex gap-3 text-red-800 animate-in fade-in slide-in-from-top-2">
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
                            <div className="bg-white rounded-2xl border border-slate-200 shadow-lg overflow-hidden">
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
                                                {latestDeliverable.files && latestDeliverable.files.length > 0 ? latestDeliverable.files.map((file, index) => (
                                                    <button
                                                        key={index}
                                                        type="button"
                                                        onClick={() => openDeliverableFile(file, hasFullFileAccess(latestDeliverable))}
                                                        className="group flex items-center gap-3 p-3 bg-white border border-slate-200 hover:border-indigo-300 hover:shadow-md hover:shadow-indigo-100 rounded-xl transition-all text-left w-full overflow-hidden"
                                                    >
                                                        <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-500 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                                                            {file.kind === "external_link" ? <Link2 className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <div className="text-sm font-medium text-slate-700 truncate group-hover:text-indigo-700">{file.name}</div>
                                                            <div className="text-[10px] text-slate-400 uppercase font-bold group-hover:text-indigo-400">
                                                                {file.kind === "external_link"
                                                                    ? "Otwórz link"
                                                                    : hasFullFileAccess(latestDeliverable)
                                                                      ? "Pobierz"
                                                                      : "Podglad z watermarkiem"}
                                                            </div>
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
                                        <ReviewControls label={isFinalDeliveredMilestone ? "Akceptuję wykonanie i kończę zlecenie" : "Zatwierdź"} />
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
                                    {milestoneDeliverables.map((deliv) => (
                                        <div key={deliv.id} className="relative pl-8">
                                            <div className={`absolute top-3 left-0 w-4 h-4 rounded-full border-2 bg-white z-10 
                                                ${deliv.status === 'accepted' ? 'border-emerald-500' : deliv.status === 'rejected' ? 'border-red-400' : 'border-slate-300'}
                                            `} />

                                            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-3 group hover:border-indigo-200 transition-colors">
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
                                                        {deliv.status === 'accepted'
                                                            ? 'Zaakceptowane'
                                                            : deliv.status === 'rejected'
                                                              ? 'Odrzucone'
                                                              : 'Czeka na akceptacje'}
                                                    </Badge>
                                                </div>

                                                {deliv.company_feedback && (
                                                    <div className={`p-3 rounded-lg text-sm border flex gap-2 ${
                                                        deliv.status === 'rejected'
                                                            ? 'bg-red-50 text-red-800 border-red-100'
                                                            : deliv.status === 'accepted'
                                                              ? 'bg-emerald-50 text-emerald-800 border-emerald-100'
                                                              : 'bg-slate-50 text-slate-700 border-slate-200'
                                                    }`}>
                                                        <MessageSquare className="w-4 h-4 shrink-0 mt-0.5 opacity-60" />
                                                        <div>
                                                            <span className="font-bold text-xs uppercase opacity-70 block mb-0.5">
                                                                {deliv.status === 'rejected'
                                                                    ? 'Pow?d odrzucenia:'
                                                                    : deliv.status === 'accepted'
                                                                      ? 'Komentarz firmy:'
                                                                      : 'Uwagi firmy:'}
                                                            </span>
                                                            {deliv.company_feedback}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                                {Array.isArray(deliv.files) && deliv.files.length > 0 && (
                                                    <div className="flex flex-wrap gap-2">
                                                        {deliv.files.map((file, fileIndex) => (
                                                            <button
                                                                key={`${deliv.id}-${fileIndex}`}
                                                                type="button"
                                                                onClick={() => openDeliverableFile(file, hasFullFileAccess(deliv))}
                                                                className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-600 hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
                                                            >
                                                                {file?.kind === "external_link" ? <Link2 className="h-3.5 w-3.5" /> : <FileText className="h-3.5 w-3.5" />}
                                                                {file.name || "Plik"}
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}
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


// RegenerateContractButton removed — replaced by ContractDocumentsCard
