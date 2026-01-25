"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Save, Send, AlertTriangle, Lock, GripVertical, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { DraftViewer } from "./DraftViewer";
import { MilestoneItem, DraftRole, DraftHeader } from "./types";

// Simple UUID generator
const uuidv4 = () => {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
    return '10000000-1000-4000-8000-100000000000'.replace(/[018]/g, c =>
        (+c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> +c / 4).toString(16)
    );
};

interface Props {
    draftId: string;
    contractId: string;
    initialMilestones: MilestoneItem[];
    totalBudget: number;
    role: DraftRole;
    onRefresh: () => void;
    diffBase?: MilestoneItem[] | null;
    applicationId: string; // Needed for DraftViewer
}

export function DraftEditor({ draftId, contractId, initialMilestones, totalBudget, role, onRefresh, diffBase, applicationId }: Props) {
    const supabase = createClient();
    const [items, setItems] = useState<MilestoneItem[]>(initialMilestones);
    const [loading, setLoading] = useState(false);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [allocationMode, setAllocationMode] = useState<'MANUAL' | 'REST_TO_LAST'>('MANUAL');
    const [acceptedDiffs, setAcceptedDiffs] = useState<Set<string>>(new Set());
    const [lastDebugError, setLastDebugError] = useState<any>(null);

    // Sync initial checks
    useEffect(() => {
        setItems(initialMilestones);
        setHasUnsavedChanges(false);
        setAllocationMode('MANUAL');
        setAcceptedDiffs(new Set());
        setLastDebugError(null);
    }, [initialMilestones]);

    // Budget Calcs
    // Budget Calcs
    const currentSum = items.reduce((sum, item) => sum + (item.amount || 0), 0);
    const delta = Math.round((totalBudget - currentSum) * 100) / 100; // positive = UNDER (missing), negative = OVER (excess)
    // Note: User spec says: UNDER -> Yellow "Brakuje...", OVER -> Red "Przekroczono..."

    // Valid if delta is effectively 0
    const isBudgetValid = Math.abs(delta) < 0.01;

    // Helper to calculate "Rest to Last"
    const calculateRestToLast = (currentItems: MilestoneItem[]) => {
        if (currentItems.length === 0) return currentItems;
        const others = currentItems.slice(0, -1);
        const othersSum = others.reduce((s, i) => s + (i.amount || 0), 0);
        const newLastAmount = Math.max(0, Math.round((totalBudget - othersSum) * 100) / 100);

        const newItems = [...currentItems];
        newItems[newItems.length - 1] = {
            ...newItems[newItems.length - 1],
            amount: newLastAmount
        };
        return newItems;
    };



    const handleAccept = (item: MilestoneItem) => {
        console.log("DraftEditor: handleAccept called for", item.client_id);
        setAcceptedDiffs(prev => {
            const next = new Set(prev);
            next.add(item.client_id);
            console.log("DraftEditor: New Accepted Set:", Array.from(next));
            return next;
        });
        toast.success("Zmiana zaakceptowana - odśwież widok");
    };

    // DnD Refs
    const dragItem = useRef<number | null>(null);
    const dragOverItem = useRef<number | null>(null);

    const handleSort = () => {
        // Strict null checks
        if (dragItem.current === null || dragOverItem.current === null) return;
        if (dragItem.current === dragOverItem.current) return;

        // Clone items
        const _items = [...items];

        // Remove and save the dragged item content
        const draggedItemContent = _items.splice(dragItem.current, 1)[0];

        // Insert the item
        _items.splice(dragOverItem.current, 0, draggedItemContent);

        // Update positions
        const updatedItems = _items.map((item, index) => ({ ...item, position: index }));

        // Switch to manual mode if we are moving things around
        if (allocationMode !== 'MANUAL') {
            setAllocationMode('MANUAL');
            toast.info("Tryb automatyczny wyłączony (zmiana kolejności).");
        }

        // Reset refs
        dragItem.current = null;
        dragOverItem.current = null;

        setItems(updatedItems);
        setHasUnsavedChanges(true);
    };

    // Actions
    const handleUpdate = (client_id: string, field: keyof MilestoneItem, value: any) => {
        let newItems = items.map(item =>
            item.client_id === client_id ? { ...item, [field]: value } : item
        );

        // If we are editing the LAST item's AMOUNT in REST_TO_LAST mode, switch to MANUAL
        const isLastItem = newItems[newItems.length - 1].client_id === client_id;
        if (allocationMode === 'REST_TO_LAST' && isLastItem && field === 'amount') {
            setAllocationMode('MANUAL');
            toast.info("Tryb automatyczny wyłączony (ręczna edycja ostatniego etapu).");
        }

        // If we are in REST_TO_LAST mode and editing a non-last item amount, recalculate last
        if (allocationMode === 'REST_TO_LAST' && !isLastItem && field === 'amount') {
            newItems = calculateRestToLast(newItems);
        }

        setItems(newItems);
        setHasUnsavedChanges(true);
    };

    const handleAdd = () => {
        const newItem: MilestoneItem = {
            client_id: uuidv4(),
            title: "Nowy Etap",
            amount: 0,
            criteria: "",
            position: items.length
        };

        let newItems = [...items, newItem];

        // If adding in REST_TO_LAST mode, the NEW item becomes the "last" (rest)
        // Previous last stays as is? Or we redistribute?
        // User spec: "jeśli dodasz milestone na końcu → on staje się 'resztą'"
        if (allocationMode === 'REST_TO_LAST') {
            newItems = calculateRestToLast(newItems);
        }

        setItems(newItems);
        setHasUnsavedChanges(true);
    };

    const handleRemove = (client_id: string) => {
        const remaining = items.filter(i => i.client_id !== client_id);

        let newItems = remaining;
        // User spec: "jeśli usuniesz ostatni milestone → nowy 'ostatni' przejmuje rolę 'reszty'"
        if (allocationMode === 'REST_TO_LAST') {
            newItems = calculateRestToLast(remaining);
        }

        setItems(newItems);
        setHasUnsavedChanges(true);
    };

    const distributeBudget = (mode: 'equal' | 'end' | 'manual') => {
        if (!items.length) return;

        let newItems = [...items];
        setHasUnsavedChanges(true);

        if (mode === 'manual') {
            setAllocationMode('MANUAL');
            // Just switch mode, keep amounts
            toast.info("Tryb ręczny aktywny");
            return;
        }

        if (mode === 'equal') {
            setAllocationMode('MANUAL'); // "Po równo" is a one-time trigger, usually
            const count = newItems.length;
            const perItem = Math.floor((totalBudget * 100) / count);
            const remainder = (totalBudget * 100) % count;

            newItems = newItems.map((item, i) => ({
                ...item,
                amount: (i === count - 1 ? (perItem + remainder) / 100 : perItem / 100)
            }));
            setItems(newItems);
        }
        else if (mode === 'end') {
            setAllocationMode('REST_TO_LAST');
            // Recalculate immediately with current values of others (or zero out others? User says: "ostatni = total - reszta")
            // Usually "Reszta na ostatni" implies preserving existing entries and dumping diff to last.
            // But if we just switch mode, we should run the calc.
            newItems = calculateRestToLast(newItems);
            setItems(newItems);
            toast.success("Włączono tryb: Reszta na ostatni etap");
        }
    };

    const handleSave = async (silent = false): Promise<boolean> => {
        if (!draftId) return false;
        setLoading(true);
        try {
            const payload = items.map((item, idx) => ({
                client_id: item.client_id,
                title: item.title,
                amount_minor: Math.round(item.amount * 100),
                criteria: item.criteria,
                position: idx
            }));

            console.log("Saving payload:", JSON.stringify(payload, null, 2)); // DEBUG payload

            const { data, error } = await supabase.rpc('draft_save_version', {
                p_contract_id: contractId,
                p_base_version_id: null,
                p_items: payload
            });

            console.log("Save response:", { data, error }); // DEBUG response

            if (error) throw error;

            if (!silent) toast.success("Zapisano wersję roboczą");
            setHasUnsavedChanges(false);
            onRefresh();
            return true;
        } catch (e: any) {
            console.error("Save Error Details:", JSON.stringify(e, null, 2));
            console.error("Original Error:", e);
            toast.error("Błąd zapisu: " + (e?.message || JSON.stringify(e)));
            return false;
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async () => {
        setLastDebugError(null); // Clear previous

        if (!isBudgetValid) {
            toast.error("Budżet musi się zgadzać co do grosza!");
            return;
        }

        if (hasUnsavedChanges) {
            const saved = await handleSave(true);
            if (!saved) {
                toast.error("Nie można wysłać: Błąd zapisu zmian.");
                return;
            }
        }

        setLoading(true);
        try {
            const endpoint = role === 'STUDENT' ? 'draft_submit' : 'draft_send_changes';
            console.log(`Submitting to ${endpoint} with contractId: ${contractId}`); // DEBUG

            const { data, error } = await supabase.rpc(endpoint, {
                p_contract_id: contractId
            });

            if (error) {
                console.error("RPC Error Object:", error);
                throw error;
            }

            // Check Application-Level Validation (JSON)
            if (data && data.status && data.status !== 'OK') {
                console.warn("Validation Failed:", data);
                setLastDebugError(data); // Log validation fail
                if (data.status === 'UNDER') {
                    toast.error(`Błąd: Budżet niepełny. Brakuje ${(data.delta / 100).toFixed(2)} PLN`);
                } else if (data.status === 'OVER') {
                    toast.error(`Błąd: Przekroczono budżet o ${(data.delta / 100).toFixed(2)} PLN`);
                } else {
                    toast.error(`Błąd walidacji: ${data.status} ${data.reason || ''}`);
                }
                return;
            }

            toast.success(role === 'STUDENT' ? "Wysłano do akceptacji" : "Wysłano propozycję zmian");
            onRefresh();
        } catch (e: any) {
            console.error("Submit Exception:", e);
            setLastDebugError(e); // Log exception
            // Explicitly extract properties
            const msg = e?.message || "Unknown error";

            // Handle P0001 from legacy RPC if it exists
            if (msg.includes("Budget validation failed")) {
                toast.error("Błąd budżetu (Backend): Upewnij się, że suma wynosi dokładnie " + totalBudget.toFixed(2));
            } else {
                toast.error(`Błąd wysyłania: ${msg}`);
            }
        } finally {
            setLoading(false);
        }
    };

    // UI STATUS helpers
    let statusColor = "bg-green-50 border-green-200";
    let statusText = <span className="text-green-700 font-bold">OK - Budżet rozdzielony</span>;

    // delta > 0 means UNDER (Missing money)
    // delta < 0 means OVER (Overspent)
    if (delta > 0.009) {
        statusColor = "bg-yellow-50 border-yellow-200";
        statusText = <span className="text-yellow-700 font-bold">UNDER - Brakuje: {delta.toFixed(2)} PLN</span>;
    } else if (delta < -0.009) {
        statusColor = "bg-red-50 border-red-200";
        statusText = <span className="text-red-700 font-bold">OVER - Przekroczono o: {Math.abs(delta).toFixed(2)} PLN</span>;
    }


    // --- RESTORE LOGIC ---
    const handleRestore = (itemToRestore: MilestoneItem) => {
        // Check if already exists (sanity check)
        if (items.find(i => i.client_id === itemToRestore.client_id)) {
            toast.info("Ten etap już istnieje na liście.");
            return;
        }

        // Add back
        const newItems = [...items, { ...itemToRestore, position: items.length }];
        setItems(newItems);
        setHasUnsavedChanges(true);
        setAllocationMode('MANUAL'); // Safety switch
        toast.success(`Przywrócono etap: ${itemToRestore.title}`);
    };

    const handleRevert = (currentItem: MilestoneItem, baseItem: MilestoneItem) => {
        // Find and replace current with base properties
        // We revert to BASE which is what the other party proposed.
        const newItems = items.map(i =>
            i.client_id === currentItem.client_id
                ? { ...i, title: baseItem.title, amount: baseItem.amount, criteria: baseItem.criteria }
                : i
        );
        setItems(newItems);
        setHasUnsavedChanges(true);
        setAllocationMode('MANUAL');
        toast.success("Cofnięto zmiany (przywrócono wersję oryginalną).");
    };

    const handleConfirmDelete = (item: MilestoneItem) => {
        toast.info("Zatwierdzono usunięcie etapu (widoczne w podglądzie).");
    };

    return (
        <div className="space-y-6">

            {/* INTEGRATED DIFF VIEWER (For Student Review Mode) */}
            {diffBase && (
                <div className="mb-8 pb-8">
                    <div className="bg-indigo-50/50 p-4 border border-indigo-100 rounded-2xl text-indigo-900 text-sm mb-6 flex items-start gap-3">
                        <div className="p-1.5 bg-white rounded-lg shadow-sm text-indigo-500">
                            <AlertTriangle className="w-5 h-5" />
                        </div>
                        <div className="space-y-1">
                            <h4 className="font-bold text-base">Tryb Negocjacji</h4>
                            <p className="text-indigo-800/80 leading-relaxed">Poniżej znajduje się podgląd różnic między Twoją pierwotną propozycją a zmianami wprowadzonymi przez firmę. Możesz <b>przywrócić</b> usunięte etapy lub edytować obecne w formularzu poniżej.</p>
                        </div>
                    </div>
                    <DraftViewer
                        applicationId={applicationId}
                        contractId={contractId}
                        milestones={items} // LIVE PREVIEW of current editor state vs BASE
                        diffBase={diffBase}
                        isStudent={role === 'STUDENT'}
                        isCompany={role === 'COMPANY'}
                        role={role}
                        onRefresh={onRefresh}
                        onRestore={handleRestore}
                        onConfirm={handleConfirmDelete}
                        onRevert={handleRevert}
                        onDelete={(item) => handleRemove(item.client_id)}
                        onAccept={handleAccept}
                        acceptedDiffs={acceptedDiffs}
                    />
                </div>
            )}

            {/* Budget Bar */}
            <div className={`p-5 rounded-2xl border flex flex-col gap-4 shadow-sm transition-all duration-300 ${statusColor}`}>
                <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                    <div className="flex flex-col gap-1">
                        <div className="flex gap-4 text-sm font-medium text-slate-600/80 uppercase tracking-wide">
                            <span>Ustalona kwota: <b className="text-slate-800">{totalBudget.toFixed(2)}</b></span>
                            <span>Suma etapów: <b className="text-slate-800">{currentSum.toFixed(2)}</b></span>
                        </div>
                        <div className="text-lg">
                            {statusText}
                        </div>
                    </div>

                    {/* Distribution Tools */}
                    <div className="flex items-center gap-1 bg-white/80 p-1.5 rounded-xl border border-slate-200/50 backdrop-blur-sm shadow-sm">
                        <Button
                            variant={allocationMode === 'MANUAL' ? "secondary" : "ghost"}
                            size="sm"
                            onClick={() => distributeBudget('manual')}
                            className={`text-xs h-8 rounded-lg font-medium transition-all ${allocationMode === 'MANUAL' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            Ręcznie
                        </Button>
                        <div className="w-px h-4 bg-slate-300 mx-1" />
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => distributeBudget('equal')}
                            className="text-xs h-8 rounded-lg font-medium text-slate-500 hover:text-indigo-600 hover:bg-indigo-50"
                        >
                            Po równo
                        </Button>
                        <Button
                            variant={allocationMode === 'REST_TO_LAST' ? "secondary" : "ghost"}
                            size="sm"
                            onClick={() => distributeBudget('end')}
                            className={`text-xs h-8 rounded-lg font-medium transition-all ${allocationMode === 'REST_TO_LAST' ? 'bg-white shadow-sm text-orange-600 ring-1 ring-orange-100' : 'text-slate-500 hover:text-orange-600 hover:bg-orange-50'}`}
                        >
                            {allocationMode === 'REST_TO_LAST' && <Lock className="w-3 h-3 mr-1" />}
                            Reszta na ostatni
                        </Button>
                    </div>
                </div>
            </div>

            {/* List */}
            <div className="space-y-4">
                {items.map((item, idx) => {
                    // Lock last item logic IF active
                    const isLast = idx === items.length - 1;
                    const isLocked = isLast && allocationMode === 'REST_TO_LAST';

                    return (
                        <div
                            key={item.client_id}
                            className={`group relative bg-white rounded-2xl border p-1 shadow-sm transition-all duration-300
                                ${isLocked ? 'bg-slate-50/50 border-slate-100' : 'border-slate-200 hover:shadow-md hover:border-indigo-200'}
                            `}
                            draggable={!isLocked}
                            onDragStart={(e) => {
                                dragItem.current = idx;
                                e.currentTarget.classList.add('opacity-50', 'scale-[0.98]');
                            }}
                            onDragEnter={(e) => {
                                dragOverItem.current = idx;
                                e.preventDefault(); // Necesssary for drop
                            }}
                            onDragOver={(e) => e.preventDefault()} // Necesssary for drop
                            onDragEnd={(e) => {
                                e.currentTarget.classList.remove('opacity-50', 'scale-[0.98]');
                                handleSort();
                            }}
                        >
                            {!isLocked && <div className="absolute left-0 top-6 bottom-6 w-1 rounded-r-full bg-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity" />}

                            <div className="flex flex-col md:flex-row gap-4 p-4">
                                {/* Drag Handle */}
                                <div className="flex flex-col items-center gap-2 mt-2 cursor-grab active:cursor-grabbing text-slate-300 hover:text-indigo-400">
                                    <GripVertical className="w-5 h-5" />
                                    <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold
                                        ${isLocked ? 'bg-slate-200 text-slate-500' : 'bg-indigo-50 text-indigo-600'}
                                    `}>
                                        {idx + 1}
                                    </div>
                                </div>

                                <div className="flex-1 space-y-3">
                                    <div className="flex flex-col md:flex-row gap-3 items-start md:items-center">
                                        <div className="flex-1 w-full">
                                            <Input
                                                placeholder="Nazwa etapu (np. Etap 1)"
                                                value={item.title}
                                                onChange={e => handleUpdate(item.client_id, 'title', e.target.value)}
                                                className="font-bold border-transparent hover:border-slate-200 focus:border-indigo-500 bg-transparent px-2 rounded-lg focus:ring-0 focus:bg-white transition-all -ml-2"
                                            />
                                        </div>

                                        <div className="flex items-center gap-2 self-end md:self-auto">
                                            <div className="relative w-32 md:w-36 group/amount">
                                                <Input
                                                    type="number"
                                                    step="0.01"
                                                    min="0"
                                                    value={item.amount || ''}
                                                    disabled={isLocked}
                                                    onChange={e => handleUpdate(item.client_id, 'amount', parseFloat(e.target.value) || 0)}
                                                    onBlur={e => {
                                                        if (isLocked) return;
                                                        const val = parseFloat(e.target.value) || 0;
                                                        const rounded = Math.round(val * 100) / 100;
                                                        handleUpdate(item.client_id, 'amount', rounded);
                                                    }}
                                                    className={`text-right pr-10 font-mono font-bold rounded-lg border-slate-200 focus:border-indigo-500 transition-all
                                                    ${isLocked ? 'bg-slate-50 text-slate-400 cursor-not-allowed' : 'bg-white'}
                                                `}
                                                />
                                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 group-focus-within/amount:text-indigo-500 pointer-events-none transition-colors">
                                                    PLN
                                                </span>
                                            </div>

                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                className="text-slate-300 hover:text-red-500 hover:bg-red-50 h-10 w-10 rounded-full"
                                                onClick={() => handleRemove(item.client_id)}
                                                disabled={isLocked}
                                            >
                                                <Trash2 className="w-5 h-5" />
                                            </Button>
                                        </div>
                                    </div>

                                    <Textarea
                                        placeholder="Zakres prac / kryteria akceptacji..."
                                        value={item.criteria}
                                        onChange={e => handleUpdate(item.client_id, 'criteria', e.target.value)}
                                        className="text-sm min-h-[60px] bg-slate-50/50 border-slate-100 focus:bg-white focus:border-indigo-500 rounded-xl resize-none"
                                    />
                                </div>
                            </div>
                        </div>
                    );
                })}

                <button
                    onClick={handleAdd}
                    className="w-full py-5 border-2 border-dashed border-slate-200 rounded-2xl flex items-center justify-center gap-3 text-slate-400 hover:text-indigo-600 hover:border-indigo-300 hover:bg-indigo-50/20 transition-all duration-300 font-medium group mt-4"
                >
                    <div className="p-1.5 bg-slate-100 rounded-lg group-hover:bg-indigo-100 text-slate-400 group-hover:text-indigo-500 transition-colors shadow-sm">
                        <Plus className="w-5 h-5" />
                    </div>
                    Dodaj kolejny etap
                </button>
            </div>

            {/* Footer Actions */}
            <div className="flex justify-between items-center pt-8 border-t border-slate-100 mt-8">
                <Button variant="ghost" onClick={() => handleSave(false)} disabled={!hasUnsavedChanges || loading} className="text-slate-500 hover:text-slate-900 gap-2">
                    <Save className="w-4 h-4" /> Zapisz jako szkic
                </Button>

                <div className="flex gap-2">
                    <Button
                        onClick={handleSubmit}
                        disabled={!isBudgetValid || loading}
                        className={`
                            h-12 px-8 rounded-xl font-bold shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98]
                            ${role === 'STUDENT'
                                ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-600 text-white shadow-indigo-200'
                                : 'bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-600 text-white shadow-orange-200'
                            }
                        `}
                    >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : (role === 'STUDENT' ? "Przekaż do akceptacji" : "Wyślij propozycję")}
                        {!loading && <Send className="w-4 h-4 ml-2" />}
                    </Button>
                </div>
            </div>
        </div>
    );
}
