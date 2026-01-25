"use client";

import { deleteOfferAction, closeOfferAction } from "./_actions";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trash2, XCircle } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";

interface AdminOffersTableProps {
    offers: any[];
}

export function AdminOffersTable({ offers }: AdminOffersTableProps) {
    const [isPending, startTransition] = useTransition();

    const handleDelete = (id: string) => {
        if (!confirm("Czy na pewno chcesz usunąć tę ofertę? Ta operacja jest nieodwracalna.")) return;

        startTransition(async () => {
            const result = await deleteOfferAction(id);
            if (result.error) {
                toast.error("Błąd usuwania: " + result.error);
            } else {
                toast.success("Oferta została usunięta.");
            }
        });
    };

    const handleClose = (id: string) => {
        if (!confirm("Czy na pewno chcesz zamknąć tę ofertę?")) return;

        startTransition(async () => {
            const result = await closeOfferAction(id);
            if (result.error) {
                toast.error("Błąd zamykania: " + result.error);
            } else {
                toast.success("Oferta została zamknięta.");
            }
        });
    };

    return (
        <div className="bg-white rounded-lg border shadow-sm">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Tytuł</TableHead>
                        <TableHead>Firma</TableHead>
                        <TableHead>Typ</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Data utworzenia</TableHead>
                        <TableHead className="text-right">Akcje</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {offers.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={6} className="text-center py-8 text-slate-500">
                                Brak ofert w systemie.
                            </TableCell>
                        </TableRow>
                    ) : (
                        offers.map((offer) => (
                            <TableRow key={offer.id}>
                                <TableCell className="font-medium">{offer.tytul}</TableCell>
                                <TableCell>{offer.company_profiles?.nazwa || "Nieznana firma"}</TableCell>
                                <TableCell>{offer.typ}</TableCell>
                                <TableCell>
                                    <span className={`px-2 py-1 rounded-full text-xs font-semibold
                    ${offer.status === 'published' ? 'bg-green-100 text-green-700' :
                                            offer.status === 'closed' ? 'bg-slate-100 text-slate-700' : 'bg-amber-100 text-amber-700'}`}>
                                        {offer.status}
                                    </span>
                                </TableCell>
                                <TableCell>{new Date(offer.created_at).toLocaleDateString()}</TableCell>
                                <TableCell className="text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        {offer.status !== 'closed' && (
                                            <Button
                                                variant="secondary"
                                                size="sm"
                                                disabled={isPending}
                                                onClick={() => handleClose(offer.id)}
                                                className="text-slate-600"
                                            >
                                                <XCircle className="h-4 w-4 mr-1" />
                                                Zamknij
                                            </Button>
                                        )}
                                        <Button
                                            variant="destructive"
                                            size="sm"
                                            disabled={isPending}
                                            onClick={() => handleDelete(offer.id)}
                                            className="bg-red-600 hover:bg-red-700 text-white shadow-sm"
                                        >
                                            <Trash2 className="h-4 w-4 mr-1" />
                                            Usuń
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </div>
    );
}
