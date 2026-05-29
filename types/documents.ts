export const STUDENT_DOCUMENT_TYPES = ["contract_b", "invoice_student"] as const;
export const COMPANY_DOCUMENT_TYPES = ["contract_a", "invoice_company"] as const;

export type StudentDocumentType = (typeof STUDENT_DOCUMENT_TYPES)[number];
export type CompanyDocumentType = (typeof COMPANY_DOCUMENT_TYPES)[number];
export type UserDocumentType = StudentDocumentType | CompanyDocumentType;

export type UserDocumentKind = "contract" | "invoice";

export type UserFacingDocument = {
  id: string;
  contractId: string;
  title: string;
  contractStatus: string;
  counterpartName: string;
  type: UserDocumentType;
  kind: UserDocumentKind;
  fileName: string;
  createdAt: string | null;
  downloadUrl: string | null;
};

export type DocumentGroup = {
  contractId: string;
  title: string;
  contractStatus: string;
  counterpartName: string;
  createdAt: string;
  documents: UserFacingDocument[];
};

export type StudentDocumentGroup = DocumentGroup;
export type CompanyDocumentGroup = DocumentGroup;

export function getDocumentTypeLabel(type: UserDocumentType) {
  if (type === "contract_a") return "Umowa A";
  if (type === "contract_b") return "Umowa B";
  if (type === "invoice_company") return "Faktura FV";
  return "Rachunek studenta";
}

export function getDocumentTypeDescription(type: UserDocumentType) {
  if (type === "contract_a") return "Wersja firmy do archiwum i rozliczen";
  if (type === "contract_b") return "Wersja studenta do pobrania";
  if (type === "invoice_company") return "Dokument rozliczeniowy firmy";
  return "Rachunek studenta zapisany po akceptacji etapu";
}

export function getDocumentKind(type: UserDocumentType): UserDocumentKind {
  return type === "contract_a" || type === "contract_b" ? "contract" : "invoice";
}

export function getContractStatusLabel(status: string | null | undefined) {
  if (status === "draft") return "Przygotowanie umowy";
  if (status === "awaiting_terms_acceptance") return "Czeka na akceptacje umowy";
  if (status === "awaiting_funding") return "Czeka na platnosc";
  if (status === "active") return "W realizacji";
  if (status === "delivered") return "Czeka na odbior";
  if (status === "completed") return "Zakonczone";
  if (status === "cancelled") return "Anulowane";
  if (status === "disputed") return "W sporze";
  if (status === "refunded") return "Zwrocone";
  return "W trakcie";
}
