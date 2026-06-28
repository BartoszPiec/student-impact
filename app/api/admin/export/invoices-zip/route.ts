import { NextRequest, NextResponse } from "next/server";

import { createZip } from "@/lib/export/zip";
import { csvCell } from "@/lib/security/csv";
import { jsonError, noStoreJson } from "@/lib/security/api-response";
import { isAccountingMonth } from "@/lib/security/validation";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { logCriticalError } from "@/lib/observability/error-log";

export const runtime = "nodejs";

type InvoiceExportRow = {
  id: string;
  contract_id: string;
  milestone_id: string | null;
  invoice_number: string;
  invoice_type: "company" | "student";
  amount_net: number | string;
  amount_gross: number | string;
  platform_fee: number | string;
  issuer_name: string;
  issuer_nip: string | null;
  recipient_name: string;
  recipient_nip: string | null;
  status: "draft" | "issued" | "paid" | "cancelled";
  issued_at: string | null;
  paid_at: string | null;
  storage_path: string | null;
  file_name: string | null;
  created_at: string;
};

type InvoiceZipEntry = {
  path: string;
  data: Buffer;
  modifiedAt?: Date;
};

function readErrorCode(error: unknown): string | null {
  if (!error || typeof error !== "object" || !("code" in error)) return null;
  const code = (error as { code?: unknown }).code;
  return typeof code === "string" && code.trim().length > 0 ? code.trim() : null;
}

async function logInvoicesZipExportError(input: {
  source: string;
  error?: unknown;
  userId?: string | null;
  month?: string | null;
  contractId?: string | null;
  context?: Record<string, unknown>;
}) {
  await logCriticalError({
    source: input.source,
    error: input.error,
    errorCode: readErrorCode(input.error),
    userId: input.userId ?? null,
    contractId: input.contractId ?? null,
    context: {
      month: input.month ?? null,
      ...input.context,
    },
  });
}

function nextMonthIso(month: string) {
  const [year, mon] = month.split("-").map(Number);
  return mon === 12
    ? `${year + 1}-01-01T00:00:00.000Z`
    : `${year}-${String(mon + 1).padStart(2, "0")}-01T00:00:00.000Z`;
}

function amount(value: number | string | null | undefined) {
  return Number(value ?? 0).toFixed(2);
}

function sanitizeFileName(value: string, fallback: string) {
  const cleaned = value
    .replace(/[\\/:*?"<>|\u0000-\u001f]/g, "-")
    .replace(/\s+/g, " ")
    .trim();

  return cleaned || fallback;
}

function invoiceTypeLabel(type: InvoiceExportRow["invoice_type"]) {
  return type === "company" ? "Faktura firmy" : "Rachunek studenta";
}

function buildManifest(invoices: InvoiceExportRow[], zipPaths: Map<string, string>) {
  const BOM = "\uFEFF";
  const headers = [
    "Numer dokumentu",
    "Typ dokumentu",
    "Status",
    "Data wystawienia",
    "Data platnosci",
    "Kwota netto",
    "Kwota brutto",
    "Prowizja platformy",
    "Wystawca",
    "NIP wystawcy",
    "Odbiorca",
    "NIP odbiorcy",
    "ID kontraktu",
    "ID etapu",
    "Plik w ZIP",
  ];

  const rows = invoices.map((invoice) =>
    [
      invoice.invoice_number,
      invoiceTypeLabel(invoice.invoice_type),
      invoice.status,
      invoice.issued_at ? new Date(invoice.issued_at).toLocaleDateString("pl-PL") : "-",
      invoice.paid_at ? new Date(invoice.paid_at).toLocaleDateString("pl-PL") : "-",
      amount(invoice.amount_net),
      amount(invoice.amount_gross),
      amount(invoice.platform_fee),
      invoice.issuer_name,
      invoice.issuer_nip ?? "-",
      invoice.recipient_name,
      invoice.recipient_nip ?? "-",
      invoice.contract_id,
      invoice.milestone_id ?? "-",
      zipPaths.get(invoice.id) ?? "-",
    ].map(csvCell).join(","),
  );

  return Buffer.from(BOM + [headers.join(","), ...rows].join("\n"), "utf8");
}

async function assertAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: jsonError("Musisz być zalogowany.", 401) };
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("user_id", user.id)
    .single();

  if (profileError) {
    await logInvoicesZipExportError({
      source: "admin.export.invoices_zip.profile_lookup",
      error: profileError,
      userId: user.id,
    });
    return { error: jsonError("Nie udało się zweryfikować uprawnień administratora.", 500) };
  }

  if (profile?.role !== "admin") {
    return { error: jsonError("Brak uprawnień administratora.", 403) };
  }

  return { error: null, userId: user.id };
}

// GET /api/admin/export/invoices-zip?month=2026-03
// Historyczny URL zwraca teraz faktyczny ZIP z PDF-ami faktur oraz manifestem CSV.
export async function GET(req: NextRequest) {
  const auth = await assertAdmin();
  if (auth.error) return auth.error;
  const userId = auth.userId;

  const { searchParams } = new URL(req.url);
  const month = searchParams.get("month");
  if (month && !isAccountingMonth(month)) {
    return jsonError("Nieprawidłowy miesiąc eksportu.", 400);
  }

  const admin = createAdminClient();
  let query = admin
    .from("invoices")
    .select(`
      id,
      contract_id,
      milestone_id,
      invoice_number,
      invoice_type,
      amount_net,
      amount_gross,
      platform_fee,
      issuer_name,
      issuer_nip,
      recipient_name,
      recipient_nip,
      status,
      issued_at,
      paid_at,
      storage_path,
      file_name,
      created_at
    `)
    .in("status", ["issued", "paid"])
    .not("storage_path", "is", null)
    .order("issued_at", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: true });

  if (month) {
    const start = `${month}-01T00:00:00.000Z`;
    query = query.gte("issued_at", start).lt("issued_at", nextMonthIso(month));
  }

  const { data, error } = await query;
  if (error) {
    await logInvoicesZipExportError({
      source: "admin.export.invoices_zip.load_invoices",
      error,
      userId,
      month,
    });
    return jsonError("Nie udało się przygotować paczki faktur.", 500);
  }

  const invoices = (data ?? []) as InvoiceExportRow[];
  if (invoices.length === 0) {
    return noStoreJson({ message: "Brak faktur PDF w podanym okresie." }, { status: 404 });
  }

  const zipEntries: InvoiceZipEntry[] = [];
  const zipPathsByInvoiceId = new Map<string, string>();

  for (const [index, invoice] of invoices.entries()) {
    if (!invoice.storage_path) {
      continue;
    }

    const { data: file, error: downloadError } = await admin.storage
      .from("deliverables")
      .download(invoice.storage_path);

    if (downloadError || !file) {
      await logInvoicesZipExportError({
        source: "admin.export.invoices_zip.download_pdf",
        error: downloadError,
        userId,
        month,
        contractId: invoice.contract_id,
        context: {
          invoiceId: invoice.id,
          invoiceType: invoice.invoice_type,
          storagePath: invoice.storage_path,
        },
      });
      return jsonError("Nie udało się pobrać jednego z plików PDF faktur.", 500);
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const safeNumber = sanitizeFileName(invoice.invoice_number.replace(/\//g, "-"), invoice.id);
    const fileName = sanitizeFileName(invoice.file_name ?? `${safeNumber}.pdf`, `${safeNumber}.pdf`);
    const zipPath = `${invoice.invoice_type === "company" ? "faktury-firm" : "rachunki-studentow"}/${String(index + 1).padStart(3, "0")}-${fileName}`;

    zipPathsByInvoiceId.set(invoice.id, zipPath);
    zipEntries.push({
      path: zipPath,
      data: buffer,
      modifiedAt: invoice.issued_at ? new Date(invoice.issued_at) : new Date(invoice.created_at),
    });
  }

  if (zipEntries.length === 0) {
    return noStoreJson({ message: "Brak plików PDF faktur do spakowania." }, { status: 404 });
  }

  zipEntries.unshift({
    path: "manifest-faktur.csv",
    data: buildManifest(invoices, zipPathsByInvoiceId),
    modifiedAt: new Date(),
  });

  const archive = createZip(zipEntries);
  const archiveName = `faktury_${month ?? "all"}.zip`;
  const archiveBody = new Blob([new Uint8Array(archive)], { type: "application/zip" });

  return new NextResponse(archiveBody, {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${archiveName}"`,
      "X-Export-Format": "zip",
      "X-Invoice-Count": String(invoices.length),
      "Cache-Control": "no-store",
    },
  });
}
