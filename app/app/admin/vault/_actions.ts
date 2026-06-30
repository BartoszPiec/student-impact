"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin/auth";
import { uuidSchema } from "@/lib/security/validation";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateContractDocumentsForAdmin } from "@/app/app/deliverables/_actions";
import { logCriticalError } from "@/lib/observability/error-log";

const INVALID_CONTRACT_ID_MESSAGE = "Nieprawidłowy identyfikator kontraktu.";
const PDF_REPAIR_FAILED_MESSAGE =
  "Nie udało się naprawić dokumentów PDF. Sprawdź logi serwera albo spróbuj ponownie.";

function readErrorCode(error: unknown): string | null {
  if (!error || typeof error !== "object" || !("code" in error)) return null;
  const code = (error as { code?: unknown }).code;
  return typeof code === "string" && code.trim().length > 0 ? code.trim() : null;
}

async function logAdminVaultError(input: {
  source: string;
  error?: unknown;
  level?: "error" | "warning" | "info";
  userId?: string | null;
  contractId?: string | null;
  context?: Record<string, unknown>;
}) {
  await logCriticalError({
    source: input.source,
    error: input.error,
    errorCode: readErrorCode(input.error),
    level: input.level ?? "error",
    userId: input.userId ?? null,
    contractId: input.contractId ?? null,
    context: input.context,
  });
}

function isNextRedirectError(error: unknown) {
  if (!error || typeof error !== "object") {
    return false;
  }

  const candidate = error as { message?: string; digest?: string };
  return (
    candidate.message === "NEXT_REDIRECT" ||
    candidate.message?.includes("NEXT_REDIRECT") ||
    candidate.digest?.includes("NEXT_REDIRECT")
  );
}

function parseContractId(contractId: string) {
  const parsed = uuidSchema.safeParse(contractId);
  if (!parsed.success) {
    throw new Error(INVALID_CONTRACT_ID_MESSAGE);
  }

  return parsed.data;
}

function redirectSingleRepairFailure(message: string, contractId?: string): never {
  const params = new URLSearchParams({
    pdfRepair: "single",
    repaired: "0",
    failed: "1",
    errorMessage: message,
  });

  if (contractId) {
    params.set("contractId", contractId);
  }

  redirect(`/app/admin/vault?${params.toString()}`);
}

export async function getContractDocuments(contractId: string) {
  const { user } = await requireAdmin();
  const safeContractId = parseContractId(contractId);
  const supabase = createAdminClient();

  const { data: documents, error } = await supabase
    .from("contract_documents")
    .select("id, file_name, storage_path, document_type, created_at")
    .eq("contract_id", safeContractId)
    .order("created_at", { ascending: false });

  if (error) {
    await logAdminVaultError({
      source: "admin.vault.load_contract_documents",
      error,
      userId: user.id,
      contractId: safeContractId,
    });
    throw new Error("Nie udało sie pobrać dokumentów kontraktu.");
  }

  if (!documents || documents.length === 0) {
    return [];
  }

  const signedUrls = await Promise.all(
    documents.map(async (document) => {
      if (!document.storage_path) {
        return {
          id: document.id,
          name: document.file_name || document.document_type,
          type: document.document_type,
          url: null,
          error: "missing storage_path",
        };
      }

      const { data, error } = await supabase.storage
        .from("deliverables")
        .createSignedUrl(document.storage_path, 60 * 60 * 24);

      if (error || !data?.signedUrl) {
        await logAdminVaultError({
          source: "admin.vault.contract_document_signed_url",
          error,
          level: "warning",
          userId: user.id,
          contractId: safeContractId,
          context: {
            documentId: document.id,
            documentType: document.document_type,
            storagePath: document.storage_path,
          },
        });
      }

      return {
        id: document.id,
        name: document.file_name || document.document_type,
        type: document.document_type,
        url: data?.signedUrl || null,
        error: error ? "signed-url-failed" : null,
      };
    }),
  );

  return signedUrls.filter((item) => item.url !== null);
}

export async function backfillMissingContractPdfs() {
  const { user } = await requireAdmin();
  const supabase = createAdminClient();

  const { data: contracts, error: contractsError } = await supabase
    .from("contracts")
    .select("id")
    .order("created_at", { ascending: false });

  if (contractsError) {
    await logAdminVaultError({
      source: "admin.vault.pdf_backfill.load_contracts",
      error: contractsError,
      userId: user.id,
    });
    throw new Error("Nie udało sie pobrać kontraktów do naprawy PDF.");
  }

  const contractIds = (contracts || []).map((contract) => contract.id).filter(Boolean);

  if (contractIds.length === 0) {
    redirect("/app/admin/vault?pdfRepair=done&targeted=0&repaired=0&failed=0");
  }

  const { data: documents, error: documentsError } = await supabase
    .from("contract_documents")
    .select("contract_id, document_type, storage_path")
    .in("contract_id", contractIds)
    .in("document_type", ["contract_a", "contract_b"]);

  if (documentsError) {
    await logAdminVaultError({
      source: "admin.vault.pdf_backfill.load_documents",
      error: documentsError,
      userId: user.id,
      context: {
        contractCount: contractIds.length,
      },
    });
    throw new Error("Nie udało sie pobrać dokumentów kontraktów.");
  }

  const documentTypesByContract = (documents || []).reduce((map, document) => {
    if (!document.contract_id || !document.storage_path) {
      return map;
    }

    const current = map.get(document.contract_id) || new Set<string>();
    current.add(document.document_type);
    map.set(document.contract_id, current);
    return map;
  }, new Map<string, Set<string>>());

  const missingContractIds = contractIds.filter((contractId) => {
    const types = documentTypesByContract.get(contractId);
    return !types || !types.has("contract_a") || !types.has("contract_b");
  });

  let repaired = 0;
  let failed = 0;

  for (const contractId of missingContractIds) {
    try {
      const result = await generateContractDocumentsForAdmin(contractId, user.id);
      if (!result.skipped) {
        repaired += 1;
      }
    } catch (error) {
      failed += 1;
      await logAdminVaultError({
        source: "admin.vault.pdf_backfill.generate_contract_documents",
        error,
        level: "warning",
        userId: user.id,
        contractId,
      });
    }
  }

  revalidatePath("/app/admin/vault");
  revalidatePath("/app/admin/contracts");

  redirect(
    `/app/admin/vault?pdfRepair=done&targeted=${missingContractIds.length}&repaired=${repaired}&failed=${failed}`,
  );
}

export async function repairSingleContractPdf(contractId: string) {
  const { user } = await requireAdmin();
  const parsedContractId = uuidSchema.safeParse(contractId);

  if (!parsedContractId.success) {
    redirectSingleRepairFailure(INVALID_CONTRACT_ID_MESSAGE);
  }

  const safeContractId = parsedContractId.data;

  try {
    const result = await generateContractDocumentsForAdmin(safeContractId, user.id);
    revalidatePath("/app/admin/vault");
    revalidatePath(`/app/admin/contracts/${safeContractId}`);
    redirect(
      `/app/admin/vault?pdfRepair=single&contractId=${safeContractId}&repaired=${result.skipped ? 0 : 1}&failed=0`,
    );
  } catch (error) {
    if (isNextRedirectError(error)) {
      throw error;
    }

    await logAdminVaultError({
      source: "admin.vault.pdf_repair_single.generate_contract_documents",
      error,
      userId: user.id,
      contractId: safeContractId,
    });
    redirectSingleRepairFailure(PDF_REPAIR_FAILED_MESSAGE, safeContractId);
  }
}
