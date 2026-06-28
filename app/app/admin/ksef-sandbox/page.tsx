import Link from "next/link";
import { FileText, RefreshCw } from "lucide-react";

import { createAdminClient } from "@/lib/supabase/admin";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

type KsefInvoiceRow = {
  id: string;
  contract_id: string;
  application_id: string | null;
  service_order_id: string | null;
  company_name: string;
  company_nip: string;
  final_amount_gross_minor: number | string;
  invoice_status: string;
  business_status: string;
  ksef_environment: string;
  ksef_reference_number: string | null;
  ksef_invoice_number: string | null;
  sent_at: string | null;
  accepted_at: string | null;
  rejected_at: string | null;
  last_error_code: string | null;
  last_error_message: string | null;
  xml_file_path: string | null;
  created_at: string;
};

function formatMoneyPLN(minor: number | string | null | undefined) {
  return (Number(minor || 0) / 100).toLocaleString("pl-PL", {
    style: "currency",
    currency: "PLN",
  });
}

function formatDate(value: string | null) {
  return value
    ? new Intl.DateTimeFormat("pl-PL", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date(value))
    : "-";
}

function statusClass(status: string) {
  if (status === "ACCEPTED_BY_KSEF_TEST") return "border-emerald-400/30 bg-emerald-400/10 text-emerald-200";
  if (status === "REJECTED_BY_KSEF_TEST" || status === "MANUAL_REVIEW") {
    return "border-amber-400/30 bg-amber-400/10 text-amber-200";
  }
  if (status === "FAILED_TECHNICAL") return "border-red-400/30 bg-red-400/10 text-red-200";
  return "border-indigo-400/30 bg-indigo-400/10 text-indigo-200";
}

function isKsefSchemaMissing(error: { code?: string; message?: string } | null) {
  if (!error) return false;
  return error.code === "PGRST205"
    || error.message?.includes("Could not find the table 'public.ksef_invoices'") === true
    || error.message?.includes("ksef_invoices") === true && error.message?.includes("schema cache") === true;
}

export default async function AdminKsefSandboxPage() {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("ksef_invoices")
    .select(`
      id,
      contract_id,
      application_id,
      service_order_id,
      company_name,
      company_nip,
      final_amount_gross_minor,
      invoice_status,
      business_status,
      ksef_environment,
      ksef_reference_number,
      ksef_invoice_number,
      sent_at,
      accepted_at,
      rejected_at,
      last_error_code,
      last_error_message,
      xml_file_path,
      created_at
    `)
    .order("created_at", { ascending: false })
    .limit(100);

  const schemaMissing = isKsefSchemaMissing(error);
  const invoices = (data || []) as KsefInvoiceRow[];
  const xmlPaths = invoices
    .map((invoice) => invoice.xml_file_path)
    .filter((path): path is string => Boolean(path));
  const { data: signedXmlUrls } = xmlPaths.length > 0
    ? await supabase.storage.from("deliverables").createSignedUrls(xmlPaths, 60 * 10)
    : { data: [] };
  const signedXmlUrlByPath = new Map(
    (signedXmlUrls ?? []).map((signedUrl, index) => [xmlPaths[index], signedUrl.signedUrl ?? null]),
  );

  return (
    <div className="space-y-8 pb-12">
      <div className="rounded-[2rem] border border-white/5 bg-slate-900/55 p-6 shadow-2xl md:p-8">
        <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-indigo-500/30 bg-indigo-500/20">
                <FileText className="h-6 w-6 text-indigo-300" />
              </div>
              <span className="text-xs font-black uppercase tracking-[0.2em] text-indigo-300/80">
                KSeF TEST
              </span>
            </div>
            <h1 className="text-4xl font-black tracking-tight text-white">KSeF Sandbox</h1>
            <p className="mt-3 max-w-3xl text-sm font-medium leading-relaxed text-slate-400">
              Faktury testowe tworzone po zdarzeniu FINAL_STAGE_ACCEPTED_BY_COMPANY. Wysylka do produkcji nie jest tu aktywna.
            </p>
          </div>
          <Button asChild variant="outline" className="border-white/10 bg-white/5 text-white hover:bg-white/10">
            <Link href="/app/admin/ksef-sandbox">
              <RefreshCw className="mr-2 h-4 w-4" />
              Odswiez
            </Link>
          </Button>
        </div>
      </div>

      {schemaMissing ? (
        <div className="rounded-2xl border border-amber-400/30 bg-amber-500/10 p-5 text-sm font-bold text-amber-100">
          Moduł KSeF Sandbox jest dodany w aplikacji, ale migracja bazy danych nie została jeszcze zastosowana
          w podłączonym projekcie Supabase. Po wdrożeniu migracji <code className="text-amber-50">20260628120000_ksef_invoice_job_final_stage.sql</code>
          panel zacznie pokazywać faktury testowe.
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-red-400/30 bg-red-500/10 p-5 text-sm font-bold text-red-100">
          Nie udalo sie pobrac faktur KSeF: {error.message}
        </div>
      ) : null}

      {!schemaMissing ? (
      <div className="overflow-hidden rounded-2xl border border-white/10 bg-slate-950/45">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px] text-left text-sm">
            <thead className="border-b border-white/10 bg-white/5 text-[11px] uppercase tracking-widest text-slate-400">
              <tr>
                <th className="px-4 py-3">Zlecenie</th>
                <th className="px-4 py-3">Firma</th>
                <th className="px-4 py-3">Kwota</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Srodowisko</th>
                <th className="px-4 py-3">Referencja KSeF</th>
                <th className="px-4 py-3">Daty</th>
                <th className="px-4 py-3">XML</th>
                <th className="px-4 py-3">Blad</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {invoices.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-10 text-center text-sm font-bold text-slate-500">
                    Brak testowych faktur KSeF.
                  </td>
                </tr>
              ) : invoices.map((invoice) => {
                const xmlUrl = invoice.xml_file_path ? signedXmlUrlByPath.get(invoice.xml_file_path) : null;

                return (
                  <tr key={invoice.id} className="align-top text-slate-300 hover:bg-white/[0.03]">
                    <td className="px-4 py-4">
                      <Link href={`/app/admin/contracts/${invoice.contract_id}`} className="font-black text-white hover:text-indigo-200">
                        {invoice.contract_id.slice(0, 8)}
                      </Link>
                      <div className="mt-1 text-xs text-slate-500">{invoice.id.slice(0, 8)}</div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="font-bold text-white">{invoice.company_name}</div>
                      <div className="mt-1 text-xs text-slate-500">NIP {invoice.company_nip}</div>
                    </td>
                    <td className="px-4 py-4 font-black text-white">
                      {formatMoneyPLN(invoice.final_amount_gross_minor)}
                    </td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-wide ${statusClass(invoice.invoice_status)}`}>
                        {invoice.invoice_status}
                      </span>
                      <div className="mt-1 text-xs text-slate-500">{invoice.business_status}</div>
                    </td>
                    <td className="px-4 py-4 font-bold">{invoice.ksef_environment}</td>
                    <td className="px-4 py-4">
                      <div>{invoice.ksef_reference_number || "-"}</div>
                      <div className="mt-1 text-xs text-slate-500">{invoice.ksef_invoice_number || "Brak numeru KSeF"}</div>
                    </td>
                    <td className="px-4 py-4 text-xs text-slate-400">
                      <div>Utworzono: {formatDate(invoice.created_at)}</div>
                      <div>Wyslano: {formatDate(invoice.sent_at)}</div>
                      <div>Akceptacja: {formatDate(invoice.accepted_at)}</div>
                      <div>Odrzucenie: {formatDate(invoice.rejected_at)}</div>
                    </td>
                    <td className="px-4 py-4">
                      {xmlUrl ? (
                        <a href={xmlUrl} className="font-bold text-indigo-200 hover:text-white">
                          Pobierz XML
                        </a>
                      ) : (
                        <span className="text-slate-500">Brak XML</span>
                      )}
                    </td>
                    <td className="max-w-[260px] px-4 py-4 text-xs text-slate-400">
                      {invoice.last_error_code || invoice.last_error_message ? (
                        <>
                          <div className="font-black text-amber-200">{invoice.last_error_code || "Blad"}</div>
                          <div className="mt-1 line-clamp-3">{invoice.last_error_message || "-"}</div>
                        </>
                      ) : "-"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      ) : null}
    </div>
  );
}
