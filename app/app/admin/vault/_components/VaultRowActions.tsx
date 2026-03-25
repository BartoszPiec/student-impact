"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FileText, Loader2, Download } from "lucide-react";
import { getContractDocuments } from "../_actions";
import { toast } from "sonner";

interface VaultRowActionsProps {
  contractId: string;
}

export function VaultRowActions({ contractId }: VaultRowActionsProps) {
  const [loading, setLoading] = useState(false);

  const handleDownload = async () => {
    setLoading(true);
    try {
      const documents = await getContractDocuments(contractId);
      
      if (documents.length === 0) {
        toast.error("Nie znaleziono dokumentów PDF dla tej umowy.");
        return;
      }

      // Open each document in a new tab
      documents.forEach((doc) => {
        if (doc.url) {
          window.open(doc.url, "_blank");
        }
      });
      
      toast.success(`Otwarto ${documents.length} dokument(y) PDF.`);
    } catch (error) {
      console.error("Vault download error:", error);
      toast.error("Błąd podczas pobierania dokumentów.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      className="gap-2 h-8 px-3 text-xs font-bold border-white/10 hover:bg-white/5 text-slate-300 hover:text-white transition-all shadow-sm"
      onClick={handleDownload}
      disabled={loading}
    >
      {loading ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <FileText className="h-3.5 w-3.5 text-indigo-400" />
      )}
      <span>Dokumenty PDF</span>
      <Download className="h-3 w-3 opacity-30" />
    </Button>
  );
}
