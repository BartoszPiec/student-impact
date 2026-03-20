"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Download, CheckCircle2, Clock, Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import {
  generateContractDocuments,
  acceptContractDocument,
  getSignedStorageUrl,
} from "../../_actions";

interface ContractDocument {
  id: string;
  contract_id: string;
  document_type: string;
  storage_path: string;
  file_name: string;
  company_accepted_at: string | null;
  student_accepted_at: string | null;
  generated_at: string;
}

interface ContractDocumentsCardProps {
  contractId: string;
  applicationId: string;
  isCompany: boolean;
  isStudent: boolean;
  documents: ContractDocument[];
  documentsGeneratedAt: string | null;
  companyAcceptedAt: string | null;
  studentAcceptedAt: string | null;
  termsAgreed: boolean;
}

export function ContractDocumentsCard({
  contractId,
  applicationId,
  isCompany,
  isStudent,
  documents,
  documentsGeneratedAt,
  companyAcceptedAt,
  studentAcceptedAt,
  termsAgreed,
}: ContractDocumentsCardProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isAccepting, setIsAccepting] = useState(false);
  const [isDownloading, setIsDownloading] = useState<string | null>(null);

  // Don't show if terms not agreed yet
  if (!termsAgreed) return null;

  const contractA = documents.find((d) => d.document_type === "contract_a");
  const contractB = documents.find((d) => d.document_type === "contract_b");

  const bothAccepted = !!companyAcceptedAt && !!studentAcceptedAt;

  // Determine which document this user needs to accept
  const myDocument = isCompany ? contractA : contractB;
  const myAcceptedAt = isCompany ? companyAcceptedAt : studentAcceptedAt;
  const otherAcceptedAt = isCompany ? studentAcceptedAt : companyAcceptedAt;

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      await generateContractDocuments(contractId, applicationId);
      toast.success("Umowy zostały wygenerowane!");
    } catch (err: any) {
      toast.error(err.message || "Błąd generowania umów");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = async (doc: ContractDocument) => {
    setIsDownloading(doc.id);
    try {
      const url = await getSignedStorageUrl("deliverables", doc.storage_path, 300);
      window.open(url, "_blank");
    } catch (err: any) {
      toast.error("Błąd pobierania pliku");
    } finally {
      setIsDownloading(null);
    }
  };

  const handleAccept = async () => {
    if (!myDocument) return;
    setIsAccepting(true);
    try {
      await acceptContractDocument(myDocument.id, contractId, applicationId);
      toast.success("Umowa zaakceptowana!");
    } catch (err: any) {
      toast.error(err.message || "Błąd akceptacji");
    } finally {
      setIsAccepting(false);
    }
  };

  return (
    <Card className="border-indigo-200 bg-indigo-50/30">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <ShieldCheck className="w-5 h-5 text-indigo-600" />
          Umowy kontraktowe
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Not generated yet — show generate button */}
        {!documentsGeneratedAt && (
          <div className="text-center py-4">
            <p className="text-sm text-slate-500 mb-3">
              Po zatwierdzeniu harmonogramu należy wygenerować umowy prawne.
            </p>
            <Button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generowanie umów...
                </>
              ) : (
                <>
                  <FileText className="w-4 h-4 mr-2" />
                  Wygeneruj umowy
                </>
              )}
            </Button>
          </div>
        )}

        {/* Documents generated — show status */}
        {documentsGeneratedAt && (
          <>
            {/* Overall status */}
            {bothAccepted ? (
              <div className="flex items-center gap-2 p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span className="text-sm font-medium text-emerald-700">
                  Obie strony zaakceptowały umowy — można przejść do płatności
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2 p-3 bg-amber-50 rounded-lg border border-amber-200">
                <Clock className="w-5 h-5 text-amber-600" />
                <span className="text-sm text-amber-700">
                  Oczekiwanie na akceptację umów przez obie strony
                </span>
              </div>
            )}

            {/* Document list */}
            <div className="space-y-3">
              {/* Contract A — for Company */}
              {contractA && (
                <DocumentRow
                  label="Umowa o Świadczenie Usługi"
                  sublabel="Firma ↔ Student Impact"
                  doc={contractA}
                  accepted={!!companyAcceptedAt}
                  isMyDoc={isCompany}
                  onDownload={() => handleDownload(contractA)}
                  isDownloading={isDownloading === contractA.id}
                />
              )}

              {/* Contract B — for Student */}
              {contractB && (
                <DocumentRow
                  label="Umowa o Dzieło z Przeniesieniem Praw Autorskich"
                  sublabel="Student ↔ Student Impact"
                  doc={contractB}
                  accepted={!!studentAcceptedAt}
                  isMyDoc={isStudent}
                  onDownload={() => handleDownload(contractB)}
                  isDownloading={isDownloading === contractB.id}
                />
              )}
            </div>

            {/* Acceptance section */}
            {myDocument && !myAcceptedAt && (
              <div className="mt-4 p-4 bg-white rounded-lg border border-indigo-200">
                <p className="text-sm text-slate-600 mb-3">
                  Przeczytaj umowę, a następnie potwierdź akceptację warunków.
                </p>
                <Button
                  onClick={handleAccept}
                  disabled={isAccepting}
                  className="w-full bg-indigo-600 hover:bg-indigo-700"
                >
                  {isAccepting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Akceptowanie...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Akceptuję warunki umowy
                    </>
                  )}
                </Button>
              </div>
            )}

            {/* Already accepted */}
            {myAcceptedAt && !otherAcceptedAt && (
              <p className="text-sm text-slate-500 text-center">
                Zaakceptowałeś umowę. Oczekiwanie na drugą stronę...
              </p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

function DocumentRow({
  label,
  sublabel,
  doc,
  accepted,
  isMyDoc,
  onDownload,
  isDownloading,
}: {
  label: string;
  sublabel: string;
  doc: ContractDocument;
  accepted: boolean;
  isMyDoc: boolean;
  onDownload: () => void;
  isDownloading: boolean;
}) {
  return (
    <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-slate-200">
      <div className="flex items-center gap-3">
        <FileText className="w-5 h-5 text-indigo-500 shrink-0" />
        <div>
          <div className="text-sm font-medium">{label}</div>
          <div className="text-xs text-slate-400">{sublabel}</div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {accepted ? (
          <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Zaakceptowana
          </Badge>
        ) : (
          <Badge variant="outline" className="text-amber-600 border-amber-300">
            <Clock className="w-3 h-3 mr-1" />
            Oczekuje
          </Badge>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={onDownload}
          disabled={isDownloading}
        >
          {isDownloading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Download className="w-4 h-4" />
          )}
        </Button>
      </div>
    </div>
  );
}
