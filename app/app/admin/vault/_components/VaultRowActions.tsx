"use client";

import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Download, FileText } from "lucide-react";
import { repairSingleContractPdf } from "../_actions";

interface VaultRowActionsProps {
  contractId: string;
  documents: Array<{ id: string; name: string; type: string; url: string | null }>;
}

function getDocumentLabel(type: string) {
  if (type === "contract_a") return "Umowa A";
  if (type === "contract_b") return "Umowa B";
  return "Dokument";
}

export function VaultRowActions({ contractId, documents }: VaultRowActionsProps) {
  const availableDocuments = documents.filter((document) => Boolean(document.url));

  return (
    <div className="flex flex-col items-end gap-2">
      {availableDocuments.length === 0 ? (
        <>
          <Button
            variant="outline"
            size="sm"
            className="h-8 gap-2 border-white/10 px-3 text-xs font-bold text-slate-500 shadow-sm"
            disabled
          >
            <FileText className="h-3.5 w-3.5 text-slate-600" />
            <span>Brak umow PDF</span>
          </Button>
          <form action={repairSingleContractPdf.bind(null, contractId)}>
            <RepairButton />
          </form>
        </>
      ) : (
        availableDocuments.map((document) => (
          <a
            key={document.id}
            href={document.url || undefined}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-8 items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 text-xs font-bold text-slate-200 shadow-sm transition-all hover:bg-white/10 hover:text-white"
            title={`${getDocumentLabel(document.type)} | ${contractId}`}
          >
            <FileText className="h-3.5 w-3.5 text-indigo-400" />
            <span>{getDocumentLabel(document.type)}</span>
            <Download className="h-3 w-3 opacity-40" />
          </a>
        ))
      )}
    </div>
  );
}

function RepairButton() {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      size="sm"
      className="h-8 gap-2 bg-indigo-500 px-3 text-xs font-bold text-white hover:bg-indigo-400"
      disabled={pending}
    >
      <FileText className="h-3.5 w-3.5" />
      <span>{pending ? "Naprawianie..." : "Napraw PDF"}</span>
    </Button>
  );
}
