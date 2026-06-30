"use server";

import React from "react";
import { randomUUID } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { renderPdfToBuffer } from "./render";
import { InvoiceDocument } from "./invoice-template";
import { PLATFORM_ENTITY } from "./legal-clauses-pl";
import type { InvoiceData } from "./types";
import { logCriticalError } from "@/lib/observability/error-log";

type AdminClient = ReturnType<typeof createAdminClient>;

type IssueInvoiceRpcRow = {
  id: string;
  invoice_number: string;
};

type IssueDraftInvoiceInput = {
  contractId: string;
  milestoneId: string | null;
  invoiceType: "company" | "student";
  amountNet: number;
  amountGross: number;
  platformFee: number;
  issuerName: string;
  issuerNip: string | null;
  recipientName: string;
  recipientNip: string | null;
  storagePath: string;
  fileName: string;
  numberPrefix: "FV" | "RCH";
};

class LoggedInvoiceError extends Error {
  readonly alreadyLogged = true;

  constructor(message: string) {
    super(message);
    this.name = "LoggedInvoiceError";
  }
}

function readErrorCode(error: unknown): string | null {
  if (!error || typeof error !== "object" || !("code" in error)) return null;
  const code = (error as { code?: unknown }).code;
  return typeof code === "string" && code.trim().length > 0 ? code.trim() : null;
}

function wasAlreadyLogged(error: unknown): error is LoggedInvoiceError {
  return error instanceof LoggedInvoiceError || (
    error !== null
    && typeof error === "object"
    && "alreadyLogged" in error
    && (error as { alreadyLogged?: unknown }).alreadyLogged === true
  );
}

async function failInvoiceOperation(input: {
  source: string;
  publicMessage: string;
  error?: unknown;
  level?: "error" | "warning" | "info";
  contractId?: string | null;
  context?: Record<string, unknown>;
}): Promise<never> {
  await logCriticalError({
    source: input.source,
    level: input.level,
    error: input.error,
    errorCode: readErrorCode(input.error),
    message: input.publicMessage,
    contractId: input.contractId ?? null,
    context: input.context,
  });
  throw new LoggedInvoiceError(input.publicMessage);
}

async function logInvoiceWarning(input: {
  source: string;
  message: string;
  error?: unknown;
  contractId?: string | null;
  context?: Record<string, unknown>;
}) {
  await logCriticalError({
    source: input.source,
    level: "warning",
    error: input.error,
    errorCode: readErrorCode(input.error),
    message: input.message,
    contractId: input.contractId ?? null,
    context: input.context,
  });
}

function formatIssueDate() {
  return new Date().toLocaleDateString("pl-PL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function sanitizeInvoiceNumber(invoiceNumber: string) {
  return String(invoiceNumber).replace(/\//g, "-");
}

async function uploadPdf(admin: AdminClient, path: string, buffer: Buffer) {
  const { error } = await admin.storage.from("deliverables").upload(path, buffer, {
    contentType: "application/pdf",
    upsert: true,
  });

  if (error) {
    await failInvoiceOperation({
      source: "pdf.invoice.upload_failed",
      publicMessage: "Nie udało się zapisać pliku PDF faktury.",
      error,
      context: {
        storagePath: path,
      },
    });
  }
}

async function issueDraftInvoice(admin: AdminClient, input: IssueDraftInvoiceInput): Promise<IssueInvoiceRpcRow> {
  const { data, error } = await admin.rpc("issue_invoice_with_counter", {
    p_contract_id: input.contractId,
    p_milestone_id: input.milestoneId,
    p_invoice_type: input.invoiceType,
    p_amount_net: input.amountNet,
    p_amount_gross: input.amountGross,
    p_platform_fee: input.platformFee,
    p_issuer_name: input.issuerName,
    p_issuer_nip: input.issuerNip,
    p_recipient_name: input.recipientName,
    p_recipient_nip: input.recipientNip,
    p_storage_path: input.storagePath,
    p_file_name: input.fileName,
    p_number_prefix: input.numberPrefix,
    p_initial_status: "draft",
  });

  if (error) {
    await failInvoiceOperation({
      source: "pdf.invoice.issue_rpc_failed",
      publicMessage: "Nie udało się wystawić faktury w bazie.",
      error,
      contractId: input.contractId,
      context: {
        milestoneId: input.milestoneId,
        invoiceType: input.invoiceType,
        storagePath: input.storagePath,
      },
    });
  }

  const row = Array.isArray(data) ? (data[0] as IssueInvoiceRpcRow | undefined) : (data as IssueInvoiceRpcRow | null);
  if (!row?.id || !row?.invoice_number) {
    await failInvoiceOperation({
      source: "pdf.invoice.issue_rpc_empty",
      publicMessage: "Nie udało się odczytać numeru wystawionej faktury.",
      contractId: input.contractId,
      context: {
        milestoneId: input.milestoneId,
        invoiceType: input.invoiceType,
      },
    });
  }

  return row as IssueInvoiceRpcRow;
}

async function markInvoiceIssued(admin: AdminClient, invoiceId: string, storagePath: string, fileName: string) {
  const { error } = await admin
    .from("invoices")
    .update({
      status: "issued",
      issued_at: new Date().toISOString(),
      storage_path: storagePath,
      file_name: fileName,
      updated_at: new Date().toISOString(),
    })
    .eq("id", invoiceId);

  if (error) {
    await failInvoiceOperation({
      source: "pdf.invoice.mark_issued_failed",
      publicMessage: "Nie udało się oznaczyć faktury jako wystawionej.",
      error,
      context: {
        invoiceId,
        storagePath,
        fileName,
      },
    });
  }
}

async function ensureContractDocument(
  admin: AdminClient,
  contractId: string,
  documentType: "invoice_company" | "invoice_student",
  storagePath: string,
  fileName: string,
) {
  const { error } = await admin.from("contract_documents").upsert(
    {
      contract_id: contractId,
      document_type: documentType,
      storage_path: storagePath,
      file_name: fileName,
      version: 1,
    },
    { onConflict: "contract_id,document_type,version" },
  );

  if (error) {
    await failInvoiceOperation({
      source: "pdf.invoice.contract_document_upsert_failed",
      publicMessage: "Nie udało się zsynchronizować dokumentu faktury.",
      error,
      contractId,
      context: {
        documentType,
        storagePath,
        fileName,
      },
    });
  }
}

/**
 * Generate a company invoice after Stripe payment is completed.
 * Called from webhook or verify-payment.
 */
export async function generateCompanyInvoice(
  contractId: string,
  amountGross: number, // In PLN (not grosze)
  platformFee: number, // In PLN
  paymentMethod: string = "Stripe",
) {
  const admin = createAdminClient();

  try {
    const { data: existingIssued, error: existingIssuedError } = await admin
      .from("invoices")
      .select("id")
      .eq("contract_id", contractId)
      .eq("invoice_type", "company")
      .eq("status", "issued")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existingIssuedError) {
      await failInvoiceOperation({
        source: "pdf.invoice.company_existing_lookup_failed",
        publicMessage: "Nie udało się sprawdzić istniejącej faktury firmy.",
        error: existingIssuedError,
        contractId,
      });
    }

    if (existingIssued?.id) {
      return existingIssued.id;
    }

    const { data: contract, error: contractError } = await admin
      .from("contracts")
      .select(`
        id, company_id, student_id, total_amount,
        applications!contracts_application_id_fkey(
          offers(tytul)
        )
      `)
      .eq("id", contractId)
      .single();

    if (contractError) {
      await failInvoiceOperation({
        source: "pdf.invoice.company_contract_lookup_failed",
        publicMessage: "Nie udało się pobrać kontraktu do faktury firmy.",
        error: contractError,
        contractId,
      });
    }

    if (!contract) {
      await failInvoiceOperation({
        source: "pdf.invoice.company_contract_missing",
        publicMessage: "Nie znaleziono kontraktu do faktury firmy.",
        contractId,
      });
      return null;
    }

    const { data: company, error: companyError } = await admin
      .from("company_profiles")
      .select("nazwa, nip, address, city, miasto")
      .eq("user_id", contract.company_id)
      .maybeSingle();

    if (companyError) {
      await failInvoiceOperation({
        source: "pdf.invoice.company_profile_lookup_failed",
        publicMessage: "Nie udało się pobrać danych firmy do faktury.",
        error: companyError,
        contractId,
        context: {
          companyId: contract.company_id,
        },
      });
    }

    const offerTitle = (contract.applications as { offers?: { tytul?: string } } | null)?.offers?.tytul || "Usługa platformowa";
    const amountNet = amountGross - platformFee;
    const tempStoragePath = `contracts/${contractId}/invoice-drafts/company-${randomUUID()}.pdf`;

    const draftData: InvoiceData = {
      invoiceNumber: "FV/TMP/00000",
      issuedAt: formatIssueDate(),
      issuerName: PLATFORM_ENTITY.name,
      issuerNip: PLATFORM_ENTITY.nip,
      issuerAddress: `${PLATFORM_ENTITY.address}, ${PLATFORM_ENTITY.city}`,
      recipientName: company?.nazwa || "Firma",
      recipientNip: company?.nip || null,
      recipientAddress: company
        ? [company.address, company.city || company.miasto].filter(Boolean).join(", ")
        : "",
      items: [
        {
          description: `Depozyt - ${offerTitle}`,
          quantity: 1,
          unitPrice: amountGross,
          total: amountGross,
        },
      ],
      totalNet: amountNet,
      totalGross: amountGross,
      platformFee,
      currency: "PLN",
      contractId,
      paymentMethod,
    };

    const draftBuffer = await renderPdfToBuffer(React.createElement(InvoiceDocument, { data: draftData }));
    await uploadPdf(admin, tempStoragePath, draftBuffer);

    const issued = await issueDraftInvoice(admin, {
      contractId,
      milestoneId: null,
      invoiceType: "company",
      amountNet,
      amountGross,
      platformFee,
      issuerName: PLATFORM_ENTITY.name,
      issuerNip: PLATFORM_ENTITY.nip,
      recipientName: company?.nazwa || "Firma",
      recipientNip: company?.nip || null,
      storagePath: tempStoragePath,
      fileName: "invoice-draft.pdf",
      numberPrefix: "FV",
    });

    const invoiceData: InvoiceData = {
      ...draftData,
      invoiceNumber: issued.invoice_number,
    };
    const finalBuffer = await renderPdfToBuffer(React.createElement(InvoiceDocument, { data: invoiceData }));

    const finalStoragePath = `contracts/${contractId}/invoices/company-${issued.id}.pdf`;
    await uploadPdf(admin, finalStoragePath, finalBuffer);

    const fileName = `Faktura-${sanitizeInvoiceNumber(issued.invoice_number)}.pdf`;
    await markInvoiceIssued(admin, issued.id, finalStoragePath, fileName);
    await ensureContractDocument(admin, contractId, "invoice_company", finalStoragePath, fileName);

    const { error: tempRemoveError } = await admin.storage.from("deliverables").remove([tempStoragePath]);
    if (tempRemoveError) {
      await logInvoiceWarning({
        source: "pdf.invoice.company_draft_cleanup_failed",
        message: "Failed to remove temporary company invoice draft PDF.",
        error: tempRemoveError,
        contractId,
        context: {
          storagePath: tempStoragePath,
        },
      });
    }

    return issued.id;
  } catch (err) {
    if (!wasAlreadyLogged(err)) {
      await logInvoiceWarning({
        source: "pdf.invoice.company_generation_failed",
        message: "Company invoice generation failed.",
        error: err,
        contractId,
      });
    }
    return null;
  }
}

/**
 * Generate a student payout receipt/invoice after milestone is accepted.
 * Called from reviewMilestoneAction or auto_accept.
 */
export async function generateStudentInvoice(
  contractId: string,
  milestoneId: string,
  milestoneTitle: string,
  amountGross: number, // Milestone gross amount
  platformFee: number, // Platform fee
  amountNet: number, // Student payout
) {
  const admin = createAdminClient();

  try {
    const { data: existingInvoices, error: existingInvoicesError } = await admin
      .from("invoices")
      .select("id, storage_path, invoice_number, status")
      .eq("milestone_id", milestoneId)
      .eq("invoice_type", "student")
      .order("created_at", { ascending: false })
      .limit(1);

    if (existingInvoicesError) {
      await failInvoiceOperation({
        source: "pdf.invoice.student_existing_lookup_failed",
        publicMessage: "Nie udało się sprawdzić istniejącego rachunku studenta.",
        error: existingInvoicesError,
        contractId,
        context: {
          milestoneId,
        },
      });
    }

    const existingInvoice = existingInvoices?.[0];
    if (existingInvoice && existingInvoice.status === "issued" && existingInvoice.storage_path) {
      const { data: existingDocumentRows, error: existingDocumentError } = await admin
        .from("contract_documents")
        .select("id")
        .eq("contract_id", contractId)
        .eq("storage_path", existingInvoice.storage_path)
        .limit(1);

      if (existingDocumentError) {
        await failInvoiceOperation({
          source: "pdf.invoice.student_existing_document_lookup_failed",
          publicMessage: "Nie udało się zsynchronizować dokumentu rachunku.",
          error: existingDocumentError,
          contractId,
          context: {
            milestoneId,
            storagePath: existingInvoice.storage_path,
          },
        });
      }

      if (!existingDocumentRows?.length) {
        await ensureContractDocument(
          admin,
          contractId,
          "invoice_student",
          existingInvoice.storage_path,
          `Rachunek-${sanitizeInvoiceNumber(existingInvoice.invoice_number)}.pdf`,
        );
      }

      return existingInvoice.id;
    }

    const { data: contract, error: contractError } = await admin
      .from("contracts")
      .select("id, student_id")
      .eq("id", contractId)
      .single();

    if (contractError) {
      await failInvoiceOperation({
        source: "pdf.invoice.student_contract_lookup_failed",
        publicMessage: "Nie udało się pobrać kontraktu do rachunku studenta.",
        error: contractError,
        contractId,
        context: {
          milestoneId,
        },
      });
    }

    if (!contract) {
      await failInvoiceOperation({
        source: "pdf.invoice.student_contract_missing",
        publicMessage: "Nie znaleziono kontraktu do rachunku studenta.",
        contractId,
        context: {
          milestoneId,
        },
      });
      return null;
    }

    const { data: student, error: studentError } = await admin
      .from("student_profiles")
      .select("public_name")
      .eq("user_id", contract.student_id)
      .maybeSingle();

    if (studentError) {
      await failInvoiceOperation({
        source: "pdf.invoice.student_profile_lookup_failed",
        publicMessage: "Nie udało się pobrać profilu studenta do rachunku.",
        error: studentError,
        contractId,
        context: {
          milestoneId,
          studentId: contract.student_id,
        },
      });
    }

    const { data: authUser, error: authUserError } = await admin.auth.admin.getUserById(contract.student_id);
    if (authUserError) {
      await failInvoiceOperation({
        source: "pdf.invoice.student_auth_lookup_failed",
        publicMessage: "Nie udało się pobrać danych użytkownika do rachunku.",
        error: authUserError,
        contractId,
        context: {
          milestoneId,
          studentId: contract.student_id,
        },
      });
    }
    const studentEmail = authUser?.user?.email || "";
    const tempStoragePath = `contracts/${contractId}/invoice-drafts/student-${randomUUID()}.pdf`;

    const draftData: InvoiceData = {
      invoiceNumber: "RCH/TMP/00000",
      issuedAt: formatIssueDate(),
      issuerName: PLATFORM_ENTITY.name,
      issuerNip: PLATFORM_ENTITY.nip,
      issuerAddress: `${PLATFORM_ENTITY.address}, ${PLATFORM_ENTITY.city}`,
      recipientName: student?.public_name || "Student",
      recipientNip: null,
      recipientAddress: studentEmail ? `Email: ${studentEmail}` : "",
      items: [
        {
          description: `Wynagrodzenie za: ${milestoneTitle}`,
          quantity: 1,
          unitPrice: amountNet,
          total: amountNet,
        },
      ],
      totalNet: amountNet,
      totalGross: amountGross,
      platformFee,
      currency: "PLN",
      contractId,
      paymentMethod: "Przelew platformowy",
    };

    const draftBuffer = await renderPdfToBuffer(React.createElement(InvoiceDocument, { data: draftData }));
    await uploadPdf(admin, tempStoragePath, draftBuffer);

    const issued = await issueDraftInvoice(admin, {
      contractId,
      milestoneId,
      invoiceType: "student",
      amountNet,
      amountGross,
      platformFee,
      issuerName: PLATFORM_ENTITY.name,
      issuerNip: PLATFORM_ENTITY.nip,
      recipientName: student?.public_name || "Student",
      recipientNip: null,
      storagePath: tempStoragePath,
      fileName: "invoice-draft.pdf",
      numberPrefix: "RCH",
    });

    const finalData: InvoiceData = {
      ...draftData,
      invoiceNumber: issued.invoice_number,
    };
    const finalBuffer = await renderPdfToBuffer(React.createElement(InvoiceDocument, { data: finalData }));

    const finalStoragePath = `contracts/${contractId}/invoices/student-${issued.id}.pdf`;
    await uploadPdf(admin, finalStoragePath, finalBuffer);

    const fileName = `Rachunek-${sanitizeInvoiceNumber(issued.invoice_number)}.pdf`;
    await markInvoiceIssued(admin, issued.id, finalStoragePath, fileName);
    await ensureContractDocument(admin, contractId, "invoice_student", finalStoragePath, fileName);

    const { error: tempRemoveError } = await admin.storage.from("deliverables").remove([tempStoragePath]);
    if (tempRemoveError) {
      await logInvoiceWarning({
        source: "pdf.invoice.student_draft_cleanup_failed",
        message: "Failed to remove temporary student invoice draft PDF.",
        error: tempRemoveError,
        contractId,
        context: {
          milestoneId,
          storagePath: tempStoragePath,
        },
      });
    }

    return issued.id;
  } catch (err) {
    if (!wasAlreadyLogged(err)) {
      await logInvoiceWarning({
        source: "pdf.invoice.student_generation_failed",
        message: "Student invoice generation failed.",
        error: err,
        contractId,
        context: {
          milestoneId,
        },
      });
    }
    return null;
  }
}
