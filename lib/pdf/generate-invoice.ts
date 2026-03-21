"use server";

import React from "react";
import { createAdminClient } from "@/lib/supabase/admin";
import { renderPdfToBuffer } from "./render";
import { InvoiceDocument } from "./invoice-template";
import { PLATFORM_ENTITY } from "./legal-clauses-pl";
import type { InvoiceData, InvoiceItem } from "./types";

/**
 * Generate a company invoice after Stripe payment is completed.
 * Called from webhook or verify-payment.
 */
export async function generateCompanyInvoice(
  contractId: string,
  amountGross: number, // In PLN (not grosze)
  platformFee: number, // In PLN
  paymentMethod: string = "Stripe"
) {
  const admin = createAdminClient();

  try {
    // Fetch contract + company data
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

    // Fetch company profile
    const { data: company } = await admin
      .from("company_profiles")
      .select("nazwa_firmy, nip, ulica, miasto, kod_pocztowy")
      .eq("id", contract.company_id)
      .single();

    const offerTitle = (contract.applications as any)?.offers?.tytul || "Usługa platformowa";

    // Generate invoice number from sequence
    const { data: seqResult, error: seqError } = await admin.rpc("nextval_invoice_number");
    if (seqError || !seqResult) {
      console.error("[generate-invoice] Failed to get invoice sequence number:", seqError);
      throw new Error("Nie udało się wygenerować numeru faktury — sekwencja niedostępna");
    }
    const seqNum = seqResult as number;
    const year = new Date().getFullYear();
    const invoiceNumber = `FV/${year}/${String(seqNum).padStart(5, "0")}`;

    const today = new Date().toLocaleDateString("pl-PL", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });

    const amountNet = amountGross - platformFee;

    const invoiceData: InvoiceData = {
      invoiceNumber,
      issuedAt: today,
      issuerName: PLATFORM_ENTITY.name,
      issuerNip: PLATFORM_ENTITY.nip,
      issuerAddress: `${PLATFORM_ENTITY.address}, ${PLATFORM_ENTITY.city}`,
      recipientName: company?.nazwa_firmy || "Firma",
      recipientNip: company?.nip || null,
      recipientAddress: company
        ? `${company.ulica || ""}, ${company.kod_pocztowy || ""} ${company.miasto || ""}`
        : "",
      items: [
        {
          description: `Escrow – ${offerTitle}`,
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

    // Render PDF
    const pdfElement = React.createElement(InvoiceDocument, { data: invoiceData });
    const buffer = await renderPdfToBuffer(pdfElement);

    // Upload to storage
    const storagePath = `contracts/${contractId}/faktura-firma-${invoiceNumber.replace(/\//g, "-")}.pdf`;
    const { error: uploadError } = await admin.storage
      .from("deliverables")
      .upload(storagePath, buffer, {
        contentType: "application/pdf",
        upsert: true,
      });

    if (uploadError) {
      console.error("[generate-invoice] Upload error:", uploadError);
      return null;
    }

    // Insert invoice record
    const { data: invoice, error: insertError } = await admin
      .from("invoices")
      .insert({
        contract_id: contractId,
        invoice_number: invoiceNumber,
        invoice_type: "company",
        amount_net: amountNet,
        amount_gross: amountGross,
        platform_fee: platformFee,
        issuer_name: PLATFORM_ENTITY.name,
        recipient_name: company?.nazwa_firmy || "Firma",
        recipient_nip: company?.nip || null,
        storage_path: storagePath,
        status: "issued",
      })
      .select("id")
      .single();

    if (insertError) {
      console.error("[generate-invoice] Insert error:", insertError);
      return null;
    }

    // Also insert into contract_documents for unified view
    await admin.from("contract_documents").insert({
      contract_id: contractId,
      document_type: "invoice_company",
      storage_path: storagePath,
      file_name: `Faktura-${invoiceNumber.replace(/\//g, "-")}.pdf`,
    });

    console.log(`[generate-invoice] Company invoice ${invoiceNumber} generated for contract ${contractId}`);
    return invoice?.id;
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
  amountNet: number // Student payout
) {
  const admin = createAdminClient();

  try {
    // Fetch contract + student data
    const { data: contract } = await admin
      .from("contracts")
      .select("id, student_id")
      .eq("id", contractId)
      .single();

    if (!contract) {
      console.error("[generate-invoice] Contract not found:", contractId);
      return null;
    }

    // Fetch student profile
    const { data: student } = await admin
      .from("student_profiles")
      .select("public_name")
      .eq("id", contract.student_id)
      .single();

    // Get student email from auth
    const { data: authUser } = await admin.auth.admin.getUserById(contract.student_id);
    const studentEmail = authUser?.user?.email || "";

    // Generate invoice number
    const { data: seqResult, error: seqError } = await admin.rpc("nextval_invoice_number");
    if (seqError || !seqResult) {
      console.error("[generate-invoice] Failed to get receipt sequence number:", seqError);
      throw new Error("Nie udało się wygenerować numeru rachunku — sekwencja niedostępna");
    }
    const seqNum = seqResult as number;
    const year = new Date().getFullYear();
    const invoiceNumber = `RCH/${year}/${String(seqNum).padStart(5, "0")}`;

    const today = new Date().toLocaleDateString("pl-PL", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });

    const invoiceData: InvoiceData = {
      invoiceNumber,
      issuedAt: today,
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

    // Render PDF
    const pdfElement = React.createElement(InvoiceDocument, { data: invoiceData });
    const buffer = await renderPdfToBuffer(pdfElement);

    // Upload to storage
    const storagePath = `contracts/${contractId}/rachunek-student-${invoiceNumber.replace(/\//g, "-")}.pdf`;
    const { error: uploadError } = await admin.storage
      .from("deliverables")
      .upload(storagePath, buffer, {
        contentType: "application/pdf",
        upsert: true,
      });

    if (uploadError) {
      console.error("[generate-invoice] Upload error:", uploadError);
      return null;
    }

    // Insert invoice record
    const { data: invoice, error: insertError } = await admin
      .from("invoices")
      .insert({
        contract_id: contractId,
        milestone_id: milestoneId,
        invoice_number: invoiceNumber,
        invoice_type: "student",
        amount_net: amountNet,
        amount_gross: amountGross,
        platform_fee: platformFee,
        issuer_name: PLATFORM_ENTITY.name,
        recipient_name: student?.public_name || "Student",
        storage_path: storagePath,
        status: "issued",
      })
      .select("id")
      .single();

    if (insertError) {
      console.error("[generate-invoice] Insert error:", insertError);
      return null;
    }

    // Also insert into contract_documents for unified view
    await admin.from("contract_documents").insert({
      contract_id: contractId,
      document_type: "invoice_student",
      storage_path: storagePath,
      file_name: `Rachunek-${invoiceNumber.replace(/\//g, "-")}.pdf`,
    });

    console.log(`[generate-invoice] Student invoice ${invoiceNumber} generated for milestone ${milestoneId}`);
    return invoice?.id;
  } catch (err) {
    console.error("[generate-invoice] Error:", err);
    return null;
  }
}
