"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Trash2, XCircle } from "lucide-react";
import {
  ALLOWED_COMMISSION_RATE_OPTIONS,
  formatCommissionRateLabel,
  resolveDefaultCommissionRate,
} from "@/lib/commission";
import {
  closeOfferAction,
  deleteOfferAction,
  updateOfferCommissionAction,
} from "./_actions";

interface AdminOffersTableProps {
  offers: Array<{
    id: string;
    tytul: string;
    typ: string | null;
    commission_rate: number | null;
    status: string;
    created_at: string;
    company_profiles?: { nazwa?: string | null } | Array<{ nazwa?: string | null }> | null;
  }>;
}

function OfferCommissionEditor({
  offerId,
  offerType,
  initialRate,
  disabled,
}: {
  offerId: string;
  offerType: string | null;
  initialRate: number | null;
  disabled: boolean;
}) {
  const [value, setValue] = useState(initialRate == null ? "auto" : String(initialRate));
  const [isPending, startTransition] = useTransition();
  const autoLabel = formatCommissionRateLabel(
    resolveDefaultCommissionRate({ sourceType: "application", offerType }),
  );

  const handleSave = () => {
    startTransition(async () => {
      const result = await updateOfferCommissionAction(
        offerId,
        value === "auto" ? "" : value,
      );

      if (result?.error) {
        toast.error(`Blad zapisu prowizji: ${result.error}`);
        return;
      }

      toast.success("Prowizja oferty zostala zaktualizowana.");
    });
  };

  return (
    <div className="flex min-w-[180px] items-center gap-2">
      <select
        value={value}
        onChange={(event) => setValue(event.target.value)}
        className="h-9 flex-1 rounded-lg border border-white/10 bg-slate-900/70 px-3 text-xs font-bold text-slate-200 outline-none"
        disabled={disabled || isPending}
      >
        <option value="auto">Auto ({autoLabel})</option>
        {ALLOWED_COMMISSION_RATE_OPTIONS.map((rate) => (
          <option key={rate} value={String(rate)}>
            {formatCommissionRateLabel(rate)}
          </option>
        ))}
      </select>
      <Button
        type="button"
        size="sm"
        variant="outline"
        className="border-white/10 bg-white/5 text-[10px] font-black uppercase tracking-widest text-slate-200 hover:bg-white/10 hover:text-white"
        onClick={handleSave}
        disabled={disabled || isPending}
      >
        Zapisz
      </Button>
    </div>
  );
}

export function AdminOffersTable({ offers }: AdminOffersTableProps) {
  const [isPending, startTransition] = useTransition();

  const handleDelete = (id: string) => {
    if (!confirm("Czy na pewno chcesz usunac te oferte? Ta operacja jest nieodwracalna.")) {
      return;
    }

    startTransition(async () => {
      const result = await deleteOfferAction(id);
      if (result.error) {
        toast.error(`Blad usuwania: ${result.error}`);
      } else {
        toast.success("Oferta zostala usunieta.");
      }
    });
  };

  const handleClose = (id: string) => {
    if (!confirm("Czy na pewno chcesz zamknac te oferte?")) {
      return;
    }

    startTransition(async () => {
      const result = await closeOfferAction(id);
      if (result.error) {
        toast.error(`Blad zamykania: ${result.error}`);
      } else {
        toast.success("Oferta zostala zamknieta.");
      }
    });
  };

  return (
    <div className="overflow-hidden rounded-[2.5rem] border border-white/5 bg-slate-950/40 shadow-xl backdrop-blur-sm">
      <Table>
        <TableHeader>
          <TableRow className="border-b border-white/5 bg-slate-950/20">
            <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-500">Tytul</TableHead>
            <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-500">Firma</TableHead>
            <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-500">Typ</TableHead>
            <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-500">Status</TableHead>
            <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-500">Prowizja</TableHead>
            <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-500">Data utworzenia</TableHead>
            <TableHead className="text-right text-[10px] font-black uppercase tracking-widest text-slate-500">Akcje</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {offers.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="py-8 text-center text-slate-500">
                Brak ofert w systemie.
              </TableCell>
            </TableRow>
          ) : (
            offers.map((offer) => (
              <TableRow key={offer.id} className="border-white/5 transition-colors hover:bg-white/5">
                {(() => {
                  const companyProfile = Array.isArray(offer.company_profiles)
                    ? offer.company_profiles[0]
                    : offer.company_profiles;

                  return (
                    <>
                <TableCell className="font-medium text-white">
                  <Link
                    href={`/app/admin/offers/${offer.id}`}
                    className="transition-colors hover:text-indigo-300"
                  >
                    {offer.tytul}
                  </Link>
                </TableCell>
                <TableCell className="text-slate-300">{companyProfile?.nazwa || "Nieznana firma"}</TableCell>
                <TableCell className="text-slate-300">{offer.typ || "brak"}</TableCell>
                <TableCell>
                  <span
                    className={`rounded-full px-2 py-1 text-xs font-semibold ${
                      offer.status === "published"
                        ? "bg-emerald-500/10 text-emerald-300"
                        : offer.status === "closed"
                          ? "bg-slate-500/10 text-slate-300"
                          : "bg-amber-500/10 text-amber-300"
                    }`}
                  >
                    {offer.status}
                  </span>
                </TableCell>
                <TableCell>
                  <OfferCommissionEditor
                    offerId={offer.id}
                    offerType={offer.typ}
                    initialRate={offer.commission_rate}
                    disabled={isPending}
                  />
                </TableCell>
                <TableCell className="text-slate-300">{new Date(offer.created_at).toLocaleDateString("pl-PL")}</TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    {offer.status !== "closed" && (
                      <Button
                        variant="secondary"
                        size="sm"
                        disabled={isPending}
                        onClick={() => handleClose(offer.id)}
                        className="border-white/10 bg-white/5 text-slate-200 hover:bg-white/10"
                      >
                        <XCircle className="mr-1 h-4 w-4" />
                        Zamknij
                      </Button>
                    )}
                    <Button
                      variant="destructive"
                      size="sm"
                      disabled={isPending}
                      onClick={() => handleDelete(offer.id)}
                      className="bg-red-600 text-white shadow-sm hover:bg-red-700"
                    >
                      <Trash2 className="mr-1 h-4 w-4" />
                      Usun
                    </Button>
                  </div>
                </TableCell>
                    </>
                  );
                })()}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
