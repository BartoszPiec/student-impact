"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { proposeServicePriceAction, rejectOrderAction } from "../_actions";
import { Loader2, MessageSquare, Banknote, Eye, Building2, Globe, MapPin, Trash2, MoreHorizontal } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { Separator } from "@/components/ui/separator";

interface OrderActionsProps {
    order: any;
    chatLink: string;
    companyProfile?: any;
}

export default function OrderActions({ order, chatLink, companyProfile }: OrderActionsProps) {
    const [price, setPrice] = useState(order.amount);
    const [loading, setLoading] = useState(false);
    const [rejectLoading, setRejectLoading] = useState(false);
    const [openProposal, setOpenProposal] = useState(false);
    const [openDetails, setOpenDetails] = useState(false);

    const handlePropose = async () => {
        try {
            setLoading(true);
            await proposeServicePriceAction(order.id, parseFloat(price));
            toast.success("Oferta wysłana!");
            setOpenProposal(false);
        } catch (e: any) {
            toast.error(e.message);
        } finally {
            setLoading(false);
        }
    };

    const handleReject = async () => {
        if (!confirm("Czy na pewno chcesz odrzucić to zapytanie? Zniknie ono z listy.")) return;
        try {
            setRejectLoading(true);
            await rejectOrderAction(order.id);
            toast.success("Zapytanie odrzucone.");
            setOpenDetails(false); // Close details if open
        } catch (e: any) {
            toast.error(e.message);
        } finally {
            setRejectLoading(false);
        }
    }

    const requirementsSection = (
        <div className="bg-slate-50 p-4 rounded-md border text-sm whitespace-pre-wrap font-mono text-slate-700 max-h-60 overflow-y-auto">
            {order.requirements || "Brak dodatkowych wymagań."}
        </div>
    );

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Otwórz menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Akcje</DropdownMenuLabel>
                    <DropdownMenuItem onClick={() => setOpenDetails(true)}>
                        <Eye className="mr-2 h-4 w-4" />
                        Szczegóły
                    </DropdownMenuItem>

                    <Link href={chatLink} className="w-full cursor-default">
                        <DropdownMenuItem>
                            <MessageSquare className="mr-2 h-4 w-4" />
                            Czat / Wiadomość
                        </DropdownMenuItem>
                    </Link>

                    {(order.status === 'inquiry' || order.status === 'pending') && (
                        <DropdownMenuItem onClick={() => setOpenProposal(true)}>
                            <Banknote className="mr-2 h-4 w-4" />
                            Złóż Ofertę
                        </DropdownMenuItem>
                    )}

                    <DropdownMenuSeparator />

                    <DropdownMenuItem onClick={handleReject} className="text-red-600 focus:text-red-600 focus:bg-red-50">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Odrzuć
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            {/* DETAILS DIALOG */}
            <Dialog open={openDetails} onOpenChange={setOpenDetails}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Szczegóły Zapytania</DialogTitle>
                        <DialogDescription>
                            Poniżej znajdziesz pełne informacje o zapytaniu oraz profil firmy.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-6 py-2">
                        {/* COMPANY INFO */}
                        <div>
                            <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
                                <Building2 className="w-4 h-4 text-indigo-600" />
                                Informacje o Firmie
                            </h3>
                            <div className="grid md:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <div className="text-xs text-muted-foreground uppercase font-semibold">Nazwa</div>
                                    <div className="font-medium">{companyProfile?.nazwa || "Nieznana firma"}</div>
                                </div>
                                <div className="space-y-1">
                                    <div className="text-xs text-muted-foreground uppercase font-semibold">Branża</div>
                                    <div className="text-sm">{companyProfile?.branza || "—"}</div>
                                </div>
                                <div className="space-y-1 md:col-span-2">
                                    <div className="text-xs text-muted-foreground uppercase font-semibold">Opis</div>
                                    <div className="text-sm text-slate-600">{companyProfile?.opis || "Brak opisu."}</div>
                                </div>
                                <div className="space-y-1">
                                    <div className="text-xs text-muted-foreground uppercase font-semibold">Lokalizacja</div>
                                    <div className="text-sm flex items-center gap-1">
                                        <MapPin className="w-3 h-3 text-slate-400" />
                                        {companyProfile?.city || "—"} {companyProfile?.address ? `, ${companyProfile.address}` : ""}
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <div className="text-xs text-muted-foreground uppercase font-semibold">WWW</div>
                                    {companyProfile?.website ? (
                                        <a href={companyProfile.website} target="_blank" className="text-sm text-indigo-600 hover:underline flex items-center gap-1">
                                            <Globe className="w-3 h-3" />
                                            Strona internetowa
                                        </a>
                                    ) : <div className="text-sm text-slate-400">—</div>}
                                </div>
                            </div>
                        </div>

                        <Separator />

                        {/* REQUIREMENTS */}
                        <div>
                            <h3 className="text-sm font-semibold text-slate-900 mb-2">Treść Zapytania / Wymagania</h3>
                            {requirementsSection}
                        </div>

                        <Separator />

                        {/* ACTIONS IN DETAILS */}
                        <div className="flex flex-wrap gap-2 justify-end">
                            <Button variant="destructive" size="sm" onClick={handleReject} disabled={rejectLoading}>
                                {rejectLoading ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Trash2 className="w-3 h-3 mr-1" />}
                                Odrzuć Zapytanie
                            </Button>
                            <Link href={chatLink}>
                                <Button variant="outline" size="sm">
                                    <MessageSquare className="w-3 h-3 mr-1" />
                                    Napisz Wiadomość
                                </Button>
                            </Link>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* PROPOSAL DIALOG */}
            <Dialog open={openProposal} onOpenChange={setOpenProposal}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Zaproponuj Cenę</DialogTitle>
                        <DialogDescription>
                            Klient zapytał o wycenę. Podaj swoją stawkę za realizację tego zlecenia.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <label className="text-sm font-medium mb-1 block">Twoja stawka (PLN)</label>
                        <Input
                            type="number"
                            value={price}
                            onChange={(e) => setPrice(e.target.value)}
                            min={1}
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setOpenProposal(false)}>Anuluj</Button>
                        <Button onClick={handlePropose} disabled={loading} className="bg-indigo-600">
                            {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                            Wyślij Ofertę
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
