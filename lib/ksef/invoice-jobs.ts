import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { logCriticalError } from "@/lib/observability/error-log";

type RelationValue<T> = T | T[] | null;

type ContractRelation = {
  id: string;
  company_id: string | null;
  status: string | null;
};

type MilestoneForFinalStage = {
  id: string;
  contract_id: string | null;
  status: string | null;
  contracts: RelationValue<ContractRelation>;
};

type CompanyBillingProfile = {
  nazwa: string | null;
  nip: string | null;
  address: string | null;
  city?: string | null;
  miasto?: string | null;
};

type KsefInvoiceJobRpcRow = {
  invoice_id: string;
  invoice_status: string;
  created: boolean;
};

type FinalStageReadiness = {
  isFinalStage: boolean;
  contractId: string | null;
};

const FINALIZED_MILESTONE_STATUSES = new Set(["released", "accepted", "completed", "refunded"]);

function unwrapRelation<T>(value: RelationValue<T>): T | null {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
}

function hasText(value: string | null | undefined) {
  return typeof value === "string" && value.trim().length > 0;
}

function isCompanyBillingComplete(company: CompanyBillingProfile | null) {
  return Boolean(
    company
      && hasText(company.nazwa)
      && hasText(company.nip)
      && hasText(company.address)
      && (hasText(company.city) || hasText(company.miasto)),
  );
}

async function logKsefInvoiceJobWarning(input: {
  source: string;
  message: string;
  error?: unknown;
  contractId?: string | null;
  userId?: string | null;
  context?: Record<string, unknown>;
}) {
  await logCriticalError({
    source: input.source,
    level: "warning",
    error: input.error,
    message: input.message,
    contractId: input.contractId ?? null,
    userId: input.userId ?? null,
    context: input.context,
  });
}

export async function assertKsefReadyForFinalStageAcceptance(
  milestoneId: string,
  actorUserId: string,
): Promise<FinalStageReadiness> {
  const admin = createAdminClient();
  const { data: milestoneData, error: milestoneError } = await admin
    .from("milestones")
    .select("id, contract_id, status, contracts(id, company_id, status)")
    .eq("id", milestoneId)
    .maybeSingle();

  if (milestoneError) {
    await logKsefInvoiceJobWarning({
      source: "ksef.final_stage_precheck.milestone_lookup_failed",
      message: "Nie udalo sie sprawdzic etapu przed finalizacja KSeF.",
      error: milestoneError,
      userId: actorUserId,
      context: { milestoneId },
    });
    throw new Error("Nie udalo sie sprawdzic gotowosci zlecenia do finalizacji.");
  }

  const milestone = milestoneData as MilestoneForFinalStage | null;
  const contract = unwrapRelation(milestone?.contracts ?? null);
  if (!milestone || !contract?.id) {
    throw new Error("Nie znaleziono etapu do finalizacji.");
  }

  if (contract.company_id !== actorUserId) {
    throw new Error("Tylko firma przypisana do zlecenia moze zakonczyc ostatni etap.");
  }

  if (milestone.status !== "delivered") {
    return { isFinalStage: false, contractId: contract.id };
  }

  if (contract.status === "disputed" || contract.status === "cancelled") {
    throw new Error("Zlecenie ma aktywny spor albo zostalo anulowane.");
  }

  const { data: milestones, error: milestonesError } = await admin
    .from("milestones")
    .select("id, status, amount, amount_minor")
    .eq("contract_id", contract.id);

  if (milestonesError) {
    await logKsefInvoiceJobWarning({
      source: "ksef.final_stage_precheck.milestones_lookup_failed",
      message: "Nie udalo sie pobrac etapow przed finalizacja KSeF.",
      error: milestonesError,
      contractId: contract.id,
      userId: actorUserId,
      context: { milestoneId },
    });
    throw new Error("Nie udalo sie sprawdzic etapow zlecenia.");
  }

  const allMilestones = milestones ?? [];
  const isFinalStage = allMilestones
    .filter((row) => row.id !== milestone.id)
    .every((row) => FINALIZED_MILESTONE_STATUSES.has(String(row.status)));

  if (!isFinalStage) {
    return { isFinalStage: false, contractId: contract.id };
  }

  const finalAmountMinor = allMilestones
    .filter((row) => String(row.status) !== "refunded")
    .reduce((sum, row) => {
      const amountMinor = row.amount_minor == null
        ? Math.round(Number(row.amount ?? 0) * 100)
        : Number(row.amount_minor);
      return sum + (Number.isFinite(amountMinor) ? amountMinor : 0);
    }, 0);

  if (!Number.isFinite(finalAmountMinor) || finalAmountMinor <= 0) {
    throw new Error("Kwota koncowa zlecenia nie jest ustalona.");
  }

  const { data: company, error: companyError } = await admin
    .from("company_profiles")
    .select("nazwa, nip, address, city, miasto")
    .eq("user_id", contract.company_id)
    .maybeSingle();

  if (companyError) {
    await logKsefInvoiceJobWarning({
      source: "ksef.final_stage_precheck.company_lookup_failed",
      message: "Nie udalo sie pobrac danych rozliczeniowych firmy przed finalizacja KSeF.",
      error: companyError,
      contractId: contract.id,
      userId: actorUserId,
      context: { companyId: contract.company_id },
    });
    throw new Error("Nie udalo sie sprawdzic danych rozliczeniowych firmy.");
  }

  if (!isCompanyBillingComplete(company as CompanyBillingProfile | null)) {
    throw new Error("Uzupelnij dane rozliczeniowe firmy przed zakonczeniem zlecenia.");
  }

  const { data: existingKsefInvoice, error: existingKsefInvoiceError } = await admin
    .from("ksef_invoices")
    .select("id")
    .eq("contract_id", contract.id)
    .eq("invoice_type", "ORIGINAL")
    .maybeSingle();

  if (existingKsefInvoiceError) {
    await logKsefInvoiceJobWarning({
      source: "ksef.final_stage_precheck.existing_ksef_lookup_failed",
      message: "Nie udalo sie sprawdzic duplikatu faktury KSeF.",
      error: existingKsefInvoiceError,
      contractId: contract.id,
      userId: actorUserId,
    });
    throw new Error("Nie udalo sie sprawdzic, czy faktura juz istnieje.");
  }

  if (existingKsefInvoice?.id) {
    throw new Error("Do tego zlecenia istnieje juz faktura pierwotna KSeF.");
  }

  const { data: existingCompanyInvoice, error: existingCompanyInvoiceError } = await admin
    .from("invoices")
    .select("id")
    .eq("contract_id", contract.id)
    .eq("invoice_type", "company")
    .neq("status", "cancelled")
    .limit(1)
    .maybeSingle();

  if (existingCompanyInvoiceError) {
    await logKsefInvoiceJobWarning({
      source: "ksef.final_stage_precheck.existing_company_invoice_lookup_failed",
      message: "Nie udalo sie sprawdzic istniejacej faktury firmy.",
      error: existingCompanyInvoiceError,
      contractId: contract.id,
      userId: actorUserId,
    });
    throw new Error("Nie udalo sie sprawdzic, czy faktura firmy juz istnieje.");
  }

  if (existingCompanyInvoice?.id) {
    throw new Error("Do tego zlecenia istnieje juz faktura pierwotna firmy.");
  }

  return { isFinalStage: true, contractId: contract.id };
}

export async function ensureKsefInvoiceJobForCompletedContract(
  contractId: string,
  actorUserId: string,
): Promise<KsefInvoiceJobRpcRow | null> {
  const admin = createAdminClient();
  const { data, error } = await admin.rpc("create_ksef_invoice_job_for_completed_contract", {
    p_contract_id: contractId,
    p_actor_user_id: actorUserId,
    p_trigger_event: "FINAL_STAGE_ACCEPTED_BY_COMPANY",
  });

  if (error) {
    await logKsefInvoiceJobWarning({
      source: "ksef.invoice_job.create_failed",
      message: "Nie udalo sie utworzyc zadania faktury KSeF po finalnej akceptacji etapu.",
      error,
      contractId,
      userId: actorUserId,
    });
    throw new Error("Zlecenie zostalo zakonczone, ale faktura wymaga recznej weryfikacji administratora.");
  }

  const row = Array.isArray(data) ? data[0] : data;
  if (!row?.invoice_id) {
    await logKsefInvoiceJobWarning({
      source: "ksef.invoice_job.empty_result",
      message: "RPC tworzenia zadania faktury KSeF nie zwrocilo identyfikatora.",
      contractId,
      userId: actorUserId,
    });
    throw new Error("Nie udalo sie utworzyc zadania faktury KSeF.");
  }

  return row as KsefInvoiceJobRpcRow;
}
