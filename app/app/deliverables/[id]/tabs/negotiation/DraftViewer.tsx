"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, RotateCcw, AlertOctagon, CheckCircle2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { MilestoneItem, DraftRole } from "./types";
import { generateContract } from "../../../_actions";

interface Props {
    applicationId: string;
    contractId: string;
    milestones: MilestoneItem[];
    role: DraftRole;
    isStudent: boolean;
    isCompany: boolean;
    diffBase: MilestoneItem[] | null; // If present, we show diffs
    onRefresh: () => void;
    onRestore?: (item: MilestoneItem) => void;
    onRestrict?: boolean; // ?
    onRevert?: (currentItem: MilestoneItem, baseItem: MilestoneItem) => void;
    onDelete?: (item: MilestoneItem) => void;
    onAccept?: (item: MilestoneItem) => void;
    onConfirm?: (item: MilestoneItem) => void;
    acceptedDiffs?: Set<string>;
}

export function DraftViewer({ applicationId, contractId, milestones, diffBase, isStudent, isCompany, onRefresh, onRestore, onConfirm, onRevert, onDelete, onAccept, acceptedDiffs }: Props) {
    const [loading, setLoading] = useState(false);
    const supabase = createClient();

    // --- DIFF LOGIC ---
    // Merge lists to find added/removed/modified
    const mergedList = (() => {
        if (!diffBase) return milestones.map(m => ({ type: 'UNCHANGED', current: m, base: null }));

        const allIds = new Set([...milestones.map(m => m.client_id), ...diffBase.map(m => m.client_id)]);
        const result = [];

        for (const id of allIds) {
            const current = milestones.find(m => m.client_id === id);
            const base = diffBase.find(m => m.client_id === id);

            if (current && !base) {
                result.push({ type: 'ADDED', current, base: null, position: current.position });
            } else if (!current && base) {
                result.push({ type: 'DELETED', current: null, base, position: base.position });
            } else if (current && base) {
                // Check content equality
                const isModified =
                    current.title !== base.title ||
                    current.amount !== base.amount ||
                    current.criteria !== base.criteria;

                result.push({
                    type: isModified ? 'MODIFIED' : 'UNCHANGED',
                    current,
                    base,
                    position: current.position
                });
            }
        }
        return result.sort((a, b) => (a.position ?? 999) - (b.position ?? 999));
    })();

    // Actions
    const handleApprove = async () => {
        console.log("handleApprove CLICKED");
        if (!confirm("Czy na pewno chcesz zatwierdzić te warunki? To zaktualizuje umowę i rozpocznie proces płatności.")) {
            console.log("handleApprove CANCELLED by user");
            return;
        }
        console.log("handleApprove CONFIRMED. ContractID:", contractId);
        setLoading(true);
        try {
            console.log("Calling rpc draft_approve...");
            const { data, error } = await supabase.rpc('draft_approve', { p_contract_id: contractId });
            console.log("RPC Result:", { data, error });

            if (error) throw error;

            console.log("Generating contract...");
            // Generate Contract File
            try {
                await generateContract(contractId, applicationId);
                toast.success("Zatwierdzono warunki i wygenerowano umowę!");
            } catch (err) {
                console.error("Generate Contract Error:", err);
                toast.warning("Warunki zatwierdzone, ale wystąpił błąd przy generowaniu pliku umowy.");
            }

            console.log("Refreshing view...");
            onRefresh();
        } catch (e: any) {
            console.error("handleApprove EXCEPTION:", JSON.stringify(e, null, 2));
            toast.error("Błąd: " + (e?.message || JSON.stringify(e)));
        } finally {
            setLoading(false);
        }
    };

    const handleRequestChanges = async () => {
        setLoading(true);
        try {
            const { error } = await supabase.rpc('draft_request_changes', { p_contract_id: contractId });
            if (error) throw error;
            toast.success("Otwarto tryb edycji");
            onRefresh();
        } catch (e: any) {
            toast.error("Błąd: " + e.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                {diffBase ? "Porównanie zmian (Diff)" : "Podgląd planu"}
            </h3>

            <div className="space-y-4">
                {mergedList.map((item, idx) => {
                    const { type, current, base } = item;

                    if (type === 'DELETED') {
                        return (
                            <div key={base!.client_id} className="p-6 rounded-2xl bg-red-50/50 border border-red-100 flex gap-4 opacity-75 grayscale hover:grayscale-0 transition-all">
                                <div className="p-2 bg-red-100 rounded-lg h-fit text-red-600">
                                    <Trash2 className="w-5 h-5" />
                                </div>
                                <div className="flex-1 space-y-2">
                                    <div className="text-xs text-red-600 font-bold uppercase tracking-wider">Propozycja usunięcia</div>
                                    <div className="flex justify-between items-start">
                                        <h4 className="font-bold text-slate-700 line-through decoration-red-300">{base!.title}</h4>
                                        <span className="font-mono text-slate-500 line-through decoration-red-300 bg-white/50 px-2 py-1 rounded">{base!.amount} PLN</span>
                                    </div>
                                    <p className="text-sm text-slate-500 line-through decoration-red-200">{base!.criteria}</p>

                                    {(onRestore || onConfirm) && (
                                        <div className="flex gap-2 mt-4">
                                            {onRestore && (
                                                <Button size="sm" variant="outline" className="bg-white hover:bg-red-50 border-red-200 text-red-700" onClick={() => onRestore(base!)}>
                                                    <RotateCcw className="w-3 h-3 mr-2" /> Przywróć
                                                </Button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    }

                    const m = current!;
                    const isAccepted = acceptedDiffs?.has(m.client_id);
                    const isModified = type === 'MODIFIED';
                    const isAdded = type === 'ADDED';

                    return (
                        <div key={m.client_id} className={`group relative bg-white rounded-2xl border p-1 shadow-sm transition-all duration-300
                            ${isAccepted ? 'ring-2 ring-emerald-500/20 border-emerald-100 bg-emerald-50/10' : 'border-slate-200 hover:shadow-md hover:border-indigo-200'}
                            ${!isAccepted && isAdded ? 'ring-2 ring-emerald-500/30 border-emerald-200 bg-emerald-50/20' : ''}
                            ${!isAccepted && isModified ? 'ring-2 ring-amber-500/30 border-amber-200 bg-amber-50/20' : ''}
                        `}>
                            {/* Status Badge Overlays */}
                            {isAccepted && <div className="absolute -top-3 left-6 px-3 py-1 bg-emerald-100 text-emerald-700 text-[10px] font-black uppercase tracking-widest rounded-full shadow-sm">Zaakceptowano</div>}
                            {!isAccepted && isAdded && <div className="absolute -top-3 left-6 px-3 py-1 bg-emerald-500 text-white text-[10px] font-black uppercase tracking-widest rounded-full shadow-sm shadow-emerald-200">Nowy Etap</div>}
                            {!isAccepted && isModified && <div className="absolute -top-3 left-6 px-3 py-1 bg-amber-500 text-white text-[10px] font-black uppercase tracking-widest rounded-full shadow-sm shadow-amber-200">Zmodyfikowano</div>}

                            <div className="p-5 md:p-6 flex flex-col md:flex-row gap-6 mt-2">
                                <div className="flex flex-col items-center gap-3">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shadow-sm
                                        ${isAccepted || isAdded ? 'bg-emerald-100 text-emerald-700' : isModified ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'}
                                    `}>
                                        {m.position + 1}
                                    </div>
                                    <div className="h-full w-0.5 bg-slate-100 rounded-full group-last:hidden" />
                                </div>

                                <div className="flex-1 space-y-4">
                                    <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                                        <div className="space-y-1">
                                            {isModified && base?.title !== m.title && (
                                                <div className="text-xs text-slate-400 line-through decoration-slate-300 mb-1">{base?.title}</div>
                                            )}
                                            <h4 className="text-lg font-bold text-slate-800 tracking-tight">{m.title}</h4>
                                        </div>

                                        <div className="text-right">
                                            {isModified && base?.amount !== m.amount && (
                                                <div className="text-xs text-slate-400 line-through decoration-slate-300 mb-1">{base?.amount} PLN</div>
                                            )}
                                            <div className="px-4 py-2 bg-slate-50 rounded-xl border border-slate-100">
                                                <span className="text-lg font-black text-slate-700">{m.amount}</span> <span className="text-xs font-bold text-slate-400">PLN</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-4 bg-slate-50/50 rounded-xl border border-slate-100/50 text-slate-600 text-sm leading-relaxed whitespace-pre-wrap">
                                        {isModified && base?.criteria !== m.criteria && (
                                            <div className="text-xs text-slate-400 line-through decoration-slate-300 mb-2">{base?.criteria}</div>
                                        )}
                                        {m.criteria}
                                    </div>

                                    {/* Action Buttons for Diffs */}
                                    {(isModified || isAdded) && !isAccepted && (onRevert || onDelete || onAccept) && (
                                        <div className="pt-4 border-t border-slate-100 flex flex-wrap gap-2">
                                            {isModified && onRevert && (
                                                <Button size="sm" variant="outline" className="border-amber-200 text-amber-700 hover:bg-amber-50" onClick={() => onRevert(m, base!)}>
                                                    <RotateCcw className="w-3 h-3 mr-2" /> Cofnij zmiany
                                                </Button>
                                            )}
                                            {isAdded && onDelete && (
                                                <Button size="sm" variant="outline" className="border-red-200 text-red-700 hover:bg-red-50" onClick={() => onDelete(m)}>
                                                    <Trash2 className="w-3 h-3 mr-2" /> Odrzuć
                                                </Button>
                                            )}
                                            {onAccept && (
                                                <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white ml-auto shadow-sm shadow-emerald-200" onClick={() => onAccept(m)}>
                                                    <CheckCircle2 className="w-3 h-3 mr-2" /> Zaakceptuj zmianę
                                                </Button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Actions Bar */}
            <div className="flex justify-end gap-3 pt-4">
                {isCompany && diffBase === null && (
                    <>
                        <Button variant="outline" onClick={handleRequestChanges} disabled={loading} className="border-orange-200 text-orange-700 hover:bg-orange-50">
                            <RotateCcw className="w-4 h-4 mr-2" />
                            Poproś o poprawki
                        </Button>
                        <Button onClick={handleApprove} disabled={loading} className="bg-green-600 hover:bg-green-700">
                            <CheckCircle2 className="w-4 h-4 mr-2" />
                            Zatwierdź Plan
                        </Button>
                    </>
                )}

                {/* 
                   If Student sees Diff (Wait Student Review), they accept by simply Submitting again via Editor. 
                   Wait, user flow says "Student finalizes". 
                   Actually, in S3, Student enters 'Editor' mode but sees Diffs? 
                   No, S3 leads to Student Editor (S0 rules apply? No S3 is distinct).
                   Actually, plan says S3 -> Student Edits (S0 equivalent rules) -> Resubmits.
                   So "Accept" for student is just "Don't change anything + Submit".
                   So Student uses Editor in S3, possibly initialized with Company's version.
                   We'll handle that in Orchestrator. 
                */}
            </div>
        </div>
    );
}
