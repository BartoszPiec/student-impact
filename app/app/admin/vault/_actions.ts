"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateContractDocumentsForAdmin } from "@/app/app/deliverables/_actions";

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

export async function getContractDocuments(contractId: string) {
  await requireAdmin();
  const supabase = createAdminClient();

  const { data: documents, error } = await supabase
    .from("contract_documents")
    .select("id, file_name, storage_path, document_type, created_at")
    .eq("contract_id", contractId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error loading contract documents:", error);
    throw new Error("Nie udalo sie pobrac dokumentow kontraktu.");
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

      return {
        id: document.id,
        name: document.file_name || document.document_type,
        type: document.document_type,
        url: data?.signedUrl || null,
        error: error?.message || null,
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
    console.error("Error loading contracts for PDF backfill:", contractsError);
    throw new Error("Nie udalo sie pobrac kontraktow do naprawy PDF.");
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
    console.error("Error loading contract documents for PDF backfill:", documentsError);
    throw new Error("Nie udalo sie pobrac dokumentow kontraktow.");
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
      console.error(`PDF backfill failed for contract ${contractId}:`, error);
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

  try {
    const result = await generateContractDocumentsForAdmin(contractId, user.id);
    revalidatePath("/app/admin/vault");
    revalidatePath(`/app/admin/contracts/${contractId}`);
    redirect(
      `/app/admin/vault?pdfRepair=single&contractId=${contractId}&repaired=${result.skipped ? 0 : 1}&failed=0`,
    );
  } catch (error) {
    if (isNextRedirectError(error)) {
      throw error;
    }

    console.error(`Single PDF repair failed for contract ${contractId}:`, error);
    const message =
      error instanceof Error && error.message
        ? encodeURIComponent(error.message.slice(0, 180))
        : encodeURIComponent("Nieznany blad naprawy PDF");
    redirect(
      `/app/admin/vault?pdfRepair=single&contractId=${contractId}&repaired=0&failed=1&errorMessage=${message}`,
    );
  }
}
