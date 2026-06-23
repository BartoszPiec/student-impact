import { createAdminClient } from "@/lib/supabase/admin";
import { FileText } from "lucide-react";
import { InvoicesTable, type InvoiceRow } from "@/components/admin/invoices-table";
import { ADMIN_PAGE_SIZE, getPageNumber, ServerPagination } from "@/components/admin/server-pagination";

export const dynamic = "force-dynamic";

function formatMoneyPLN(value: number | string | null | undefined) {
  return Number(value || 0).toLocaleString("pl-PL", {
    style: "currency",
    currency: "PLN",
  });
}

export default async function AdminFinanceInvoicesPage({
  searchParams,
}: {
  searchParams?: Promise<{ page?: string | string[] }>;
}) {
  const currentPage = getPageNumber((await searchParams)?.page);
  const rangeStart = (currentPage - 1) * ADMIN_PAGE_SIZE;
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("invoices")
    .select(`
      id,
      contract_id,
      invoice_number,
      invoice_type,
      status,
      amount_net,
      amount_gross,
      platform_fee,
      issuer_name,
      recipient_name,
      issued_at,
      created_at,
      paid_at,
      issuer_nip,
      recipient_nip,
      storage_path
    `)
    .order("created_at", { ascending: false })
    .range(rangeStart, rangeStart + ADMIN_PAGE_SIZE);

  if (error) {
    return (
      <div className="p-8 text-red-500">Błąd pobierania faktur: {error.message}</div>
    );
  }

  const allInvoiceRows = (data || []) as InvoiceRow[];
  const hasNextPage = allInvoiceRows.length > ADMIN_PAGE_SIZE;
  const invoiceRows = allInvoiceRows.slice(0, ADMIN_PAGE_SIZE);
  const storagePaths = invoiceRows
    .map((invoice) => invoice.storage_path)
    .filter((path): path is string => Boolean(path));
  const { data: signedUrls } = storagePaths.length > 0
    ? await supabase.storage.from("deliverables").createSignedUrls(storagePaths, 60 * 60)
    : { data: [] };
  const signedUrlByPath = new Map(
    (signedUrls ?? []).map((signedUrl, index) => [storagePaths[index], signedUrl.signedUrl ?? null]),
  );
  const invoices = invoiceRows.map((invoice) => ({
    ...invoice,
    download_url: invoice.storage_path ? signedUrlByPath.get(invoice.storage_path) ?? null : null,
  }));
  const grossTotal = invoices.reduce((sum, invoice) => sum + Number(invoice.amount_gross || 0), 0);
  const feeTotal = invoices.reduce((sum, invoice) => sum + Number(invoice.platform_fee || 0), 0);
  const paidCount = invoices.filter((invoice) => invoice.status === "paid").length;

  return (
    <div className="space-y-8 pb-12">
      <div className="relative overflow-hidden rounded-[2.5rem] border border-white/5 bg-slate-900/50 p-8 shadow-2xl">
        <div className="relative z-10 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-indigo-500/30 bg-indigo-500/20">
                <FileText className="h-6 w-6 text-indigo-400" />
              </div>
              <span className="text-xs font-black uppercase tracking-[0.2em] text-indigo-400/80">
                Finance
              </span>
            </div>
            <h1 className="mb-3 text-4xl font-black leading-none tracking-tight text-white md:text-5xl">
              Faktury
            </h1>
            <p className="max-w-2xl font-medium leading-relaxed text-slate-400">
              Read-only widok tabeli <code className="text-slate-300">invoices</code>.
              Pokazuje numeracje, statusy oraz kwoty w PLN bez konwersji z minor units.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-3xl border border-white/5 bg-slate-950/40 p-5">
          <div className="text-xs font-black uppercase tracking-widest text-slate-500">
            Faktury
          </div>
          <div className="mt-2 text-3xl font-black text-white">{invoices.length}</div>
          <div className="mt-1 text-sm text-slate-400">Liczba rekordów w tabeli invoices</div>
        </div>
        <div className="rounded-3xl border border-white/5 bg-slate-950/40 p-5">
          <div className="text-xs font-black uppercase tracking-widest text-slate-500">
            Suma brutto
          </div>
          <div className="mt-2 text-3xl font-black text-white">
            {formatMoneyPLN(grossTotal)}
          </div>
          <div className="mt-1 text-sm text-slate-400">Widoczne rekordy w PLN</div>
        </div>
        <div className="rounded-3xl border border-white/5 bg-slate-950/40 p-5">
          <div className="text-xs font-black uppercase tracking-widest text-slate-500">
            Oplacone
          </div>
          <div className="mt-2 text-3xl font-black text-white">{paidCount}</div>
          <div className="mt-1 text-sm text-slate-400">
            Platform fee razem: {formatMoneyPLN(feeTotal)}
          </div>
        </div>
      </div>

      <InvoicesTable invoices={invoices} />
      <ServerPagination pathname="/app/admin/finance/invoices" currentPage={currentPage} hasNextPage={hasNextPage} />
    </div>
  );
}
