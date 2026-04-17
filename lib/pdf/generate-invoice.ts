"use server";

import React from "react";
import { randomUUID } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { renderPdfToBuffer } from "./render";
import { InvoiceDocument } from "./invoice-template";
import { PLATFORM_ENTITY } from "./legal-clauses-pl";
import type { InvoiceData } from "./types";

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
    throw new Error(`Upload PDF failed: ${error.message}`);
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
    throw new Error(`Invoice RPC failed: ${error.message}`);
  }

  const row = Array.isArray(data) ? (data[0] as IssueInvoiceRpcRow | undefined) : (data as IssueInvoiceRpcRow | null);
  if (!row?.id || !row?.invoice_number) {
    throw new Error("Invoice RPC returned empty payload.");
  }

  return row;
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
    throw new Error(`Invoice update failed: ${error.message}`);
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
    throw new Error(`Contract document upsert failed: ${error.message}`);
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
    const { data: existingIssued } = await admin
      .from("invoices")
      .select("id")
      .eq("contract_id", contractId)
      .eq("invoice_type", "company")
      .eq("status", "issued")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existingIssued?.id) {
      return existingIssued.id;
    }

    const { data: contract } = await admin
      .from("contracts")
      .select(`
        id, company_id, student_id, total_amount,
        applications!contracts_application_id_fkey(
          offers(tytul)
        )
      `)
      .eq("id", contractId)
      .single();

    if (!contract) {
      console.error("[generate-invoice] Contract not found:", contractId);
      return null;
    }

    const { data: companyById } = await admin
      .from("company_profiles")
      .select("nazwa_firmy, nip, ulica, miasto, kod_pocztowy")
      .eq("id", contract.company_id)
      .maybeSingle();

    const company = companyById
      ? companyById
      : (
          await admin
            .from("company_profiles")
            .select("nazwa_firmy, nip, ulica, miasto, kod_pocztowy")
            .eq("user_id", contract.company_id)
            .maybeSingle()
        ).data;

    const offerTitle = (contract.applications as { offers?: { tytul?: string } } | null)?.offers?.tytul || "Usluga platformowa";
    const amountNet = amountGross - platformFee;
    const tempStoragePath = `contracts/${contractId}/invoice-drafts/company-${randomUUID()}.pdf`;

    const draftData: InvoiceData = {
      invoiceNumber: "FV/TMP/00000",
      issuedAt: formatIssueDate(),
      issuerName: PLATFORM_ENTITY.name,
      issuerNip: PLATFORM_ENTITY.nip,
      issuerAddress: `${PLATFORM_ENTITY.address}, ${PLATFORM_ENTITY.city}`,
      recipientName: company?.nazwa_firmy || "Firma",
      recipientNip: company?.nip || null,
      recipientAddress: company
        ? `${company.ulica || ""}, ${company.kod_pocztowy || ""} ${company.miasto || ""}`.trim()
        : "",
      items: [
        {
          description: `Escrow - ${offerTitle}`,
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
      recipientName: company?.nazwa_firmy || "Firma",
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

    await admin.storage.from("deliverables").remove([tempStoragePath]);

    console.log(`[generate-invoice] Company invoice ${issued.invoice_number} generated for contract ${contractId}`);
    return issued.id;
  } catch (err) {
    console.error("[generate-invoice] Error:", err);
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
      console.error("[generate-invoice] Existing student invoice guard error:", existingInvoicesError);
      throw new Error("Nie udalo sie sprawdzic istniejacego rachunku studenta.");
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
        console.error("[generate-invoice] Existing contract_document sync error:", existingDocumentError);
        throw new Error("Nie udalo sie zsynchronizowac dokumentu rachunku.");
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

    const { data: contract } = await admin
      .from("contracts")
      .select("id, student_id")
      .eq("id", contractId)
      .single();

    if (!contract) {
      console.error("[generate-invoice] Contract not found:", contractId);
      return null;
    }

    const { data: studentById } = await admin
      .from("student_profiles")
      .select("public_name")
      .eq("id", contract.student_id)
      .maybeSingle();

    const student = studentById
      ? studentById
      : (
          await admin
            .from("student_profiles")
            .select("public_name")
            .eq("user_id", contract.student_id)
            .maybeSingle()
        ).data;

    const { data: authUser } = await admin.auth.admin.getUserById(contract.student_id);
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

    await admin.storage.from("deliverables").remove([tempStoragePath]);

    console.log(`[generate-invoice] Student invoice ${issued.invoice_number} generated for milestone ${milestoneId}`);
    return issued.id;
  } catch (err) {
    console.error("[generate-invoice] Error:", err);
    return null;
  }
}
