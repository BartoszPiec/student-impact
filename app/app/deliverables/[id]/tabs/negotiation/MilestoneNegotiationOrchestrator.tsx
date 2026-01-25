"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { DraftHeader, MilestoneItem, Props } from "./types";
import { DraftEditor } from "./DraftEditor";
import { DraftViewer } from "./DraftViewer";

export function MilestoneNegotiationOrchestrator({ applicationId, contractId, totalAmount, isStudent, isCompany }: Props) {
    const supabase = createClient();
    const router = useRouter();

    const [loading, setLoading] = useState(true);
    const [draft, setDraft] = useState<DraftHeader | null>(null);
    const [milestones, setMilestones] = useState<MilestoneItem[]>([]);

    // For Diff View (S3)
    const [diffBase, setDiffBase] = useState<MilestoneItem[] | null>(null);

    const refreshDraft = async () => {
        if (!draft) return;
        setLoading(true);
        // Re-fetch header
        const { data } = await supabase.from('milestone_drafts').select('*').eq('id', draft.id).single();
        if (data) {
            setDraft(data);
            await fetchVersionData(data);
            router.refresh(); // Sync Server Components (e.g. Contract Status)
        }
        setLoading(false);
    };

    // Initial Load & Bootstrap
    useEffect(() => {
        const init = async () => {
            try {
                setLoading(true);

                // 1. Try to fetch existing draft
                const { data: existing, error } = await supabase
                    .from('milestone_drafts')
                    .select('*')
                    .eq('contract_id', contractId)
                    .maybeSingle();

                if (error) throw error;

                if (existing) {
                    setDraft(existing);
                    await fetchVersionData(existing);
                } else {
                    // 2. Initialize if missing
                    const totalMinor = Math.round(totalAmount * 100);
                    const { data: newId, error: initErr } = await supabase.rpc('draft_initialize', {
                        p_contract_id: contractId,
                        p_total_amount_minor: totalMinor
                    });

                    if (initErr) throw initErr;

                    const { data: created } = await supabase.from('milestone_drafts').select('*').eq('id', newId).single();
                    setDraft(created);
                }
            } catch (e: any) {
                console.error("Orchestrator Init Error:", e);
                toast.error("Błąd ładowania negocjacji");
            } finally {
                setLoading(false);
            }
        };

        if (contractId) init();
    }, [contractId]);

    const fetchSnapshot = async (versionId: string): Promise<MilestoneItem[]> => {
        if (!versionId) return [];
        const { data, error } = await supabase
            .from('milestone_snapshots')
            .select('*')
            .eq('version_id', versionId)
            .order('position');

        if (error) throw error;
        return data.map((d: any) => ({
            client_id: d.milestone_client_id,
            title: d.title,
            amount: d.amount_minor / 100.0,
            criteria: typeof d.criteria === 'string' ? d.criteria : JSON.stringify(d.criteria),
            position: d.position
        }));
    };

    const fetchVersionData = async (header: DraftHeader) => {
        let targetVersionId = header.current_version_id;
        let baseVersionId: string | null = null;

        // Logic Source: Which version is 'Active' for the current state?
        if (header.state === 'WAITING_COMPANY_REVIEW') {
            targetVersionId = header.review_version_id; // Company sees what Student sent
        } else if (header.state === 'WAITING_STUDENT_REVIEW') {
            targetVersionId = header.company_changes_version_id; // Student sees what Company sent
            if (isStudent) baseVersionId = header.review_version_id; // Student compares with what they originally sent
        }

        if (targetVersionId) {
            const items = await fetchSnapshot(targetVersionId);
            setMilestones(items);
        } else {
            setMilestones([]);
        }

        if (baseVersionId) {
            const baseItems = await fetchSnapshot(baseVersionId);
            setDiffBase(baseItems);
        } else {
            setDiffBase(null);
        }
    };

    if (loading) {
        return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-slate-400" /></div>;
    }

    if (!draft) {
        return <div className="text-center p-8 text-red-500">Nie udało się załadować negocjacji.</div>;
    }

    const commonProps = {
        applicationId,
        draftId: draft.id,
        contractId: contractId,
        totalBudget: totalAmount,
        onRefresh: refreshDraft,
    };

    // --- ROUTING LOGIC ---

    // S0: Student Editing
    if (draft.state === 'STUDENT_EDITING') {
        if (isStudent) {
            return <DraftEditor {...commonProps} initialMilestones={milestones} role="STUDENT" />;
        }
        return <div className="text-center py-8 text-slate-500">Student przygotowuje nową propozycję warunków.</div>;
    }

    // S1: Waiting Company Review
    if (draft.state === 'WAITING_COMPANY_REVIEW') {
        // Company views & acts. Student only views.
        return <DraftViewer
            {...commonProps}
            milestones={milestones}
            diffBase={null}
            role={isCompany ? 'COMPANY' : 'STUDENT'}
            isStudent={isStudent}
            isCompany={isCompany}
        />;
    }

    // S2: Company Editing
    if (draft.state === 'COMPANY_EDITING') {
        if (isCompany) {
            return <DraftEditor {...commonProps} initialMilestones={milestones} role="COMPANY" />;
        }
        return <div className="text-center py-8 text-slate-500">Firma nanosi poprawki do propozycji...</div>;
    }

    // S3: Waiting Student Review
    if (draft.state === 'WAITING_STUDENT_REVIEW') {
        if (isStudent) {
            return (
                <div className="space-y-4">
                    <div className="bg-orange-50 p-4 border border-orange-200 rounded-lg text-orange-800 text-sm">
                        Firma zaproponowała zmiany. Poniżej widoczny jest edytor z naniesionymi propozycjami firmy oraz podgląd różnic.
                    </div>
                    {/* Editor now handles the Diff visualization internally */}
                    <DraftEditor
                        {...commonProps}
                        initialMilestones={milestones}
                        role="STUDENT"
                        diffBase={diffBase}
                    />
                </div>
            );
        }
        return <div className="text-center py-8 text-slate-500">Oczekiwanie na decyzję Studenta odnośnie poprawek firmy.</div>;
    }

    // S4: Approved
    if (draft.state === 'APPROVED') {
        return (
            <div className="flex flex-col items-center justify-center py-16 text-center space-y-4 bg-green-50 rounded-lg border border-green-100">
                <CheckCircle2 className="w-12 h-12 text-green-600" />
                <h3 className="text-2xl font-bold text-green-800">Negocjacje Zakończone</h3>
                <p className="text-green-700">Warunki zostały zaakceptowane i zapisane w umowie.</p>
            </div>
        );
    }

    return <div>Stan nieznany: {draft.state}</div>;
}
