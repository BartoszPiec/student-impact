import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ArrowUpRight,
  BriefcaseBusiness,
  FileText,
  Receipt,
  ShieldCheck,
  Users,
} from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";
import { getDocumentTypeDescription, getDocumentTypeLabel } from "@/types/documents";

export const dynamic = "force-dynamic";

type Params = Promise<{ id: string }>;

function formatMoney(value: number | string | null | undefined, currency = "PLN") {
  return Number(value || 0).toLocaleString("pl-PL", {
    style: "currency",
    currency,
  });
}

function getStatusBadge(status: string) {
  if (status === "active") return "border border-emerald-500/20 bg-emerald-500/10 text-emerald-300";
  if (status === "completed") return "border border-blue-500/20 bg-blue-500/10 text-blue-300";
  if (status === "cancelled") return "border border-red-500/20 bg-red-500/10 text-red-300";
  if (status === "disputed") return "border border-amber-500/20 bg-amber-500/10 text-amber-300";
  return "border border-white/10 bg-slate-500/10 text-slate-400";
}

function getMilestoneBadge(status: string | null | undefined) {
  if (status === "done" || status === "completed" || status === "accepted") {
    return "border border-emerald-500/20 bg-emerald-500/10 text-emerald-300";
  }
  if (status === "disputed") {
    return "border border-amber-500/20 bg-amber-500/10 text-amber-300";
  }
  if (status === "cancelled") {
    return "border border-red-500/20 bg-red-500/10 text-red-300";
  }
  if (status === "in_progress" || status === "processing" || status === "active") {
    return "border border-indigo-500/20 bg-indigo-500/10 text-indigo-300";
  }
  return "border border-white/10 bg-slate-500/10 text-slate-400";
}

function getContractDocumentBadge(type: string) {
  if (type === "contract_a" || type === "contract_b") {
    return "border border-indigo-500/20 bg-indigo-500/10 text-indigo-300";
  }

  if (type === "invoice_company" || type === "invoice_student") {
    return "border border-emerald-500/20 bg-emerald-500/10 text-emerald-300";
  }

  return "border border-white/10 bg-slate-500/10 text-slate-400";
}

function getInvoiceBadge(type: string | null | undefined) {
  if (type === "company") {
    return "border border-indigo-500/20 bg-indigo-500/10 text-indigo-300";
  }

  return "border border-emerald-500/20 bg-emerald-500/10 text-emerald-300";
}

function getInvoiceLabel(type: string | null | undefined) {
  return type === "company" ? "Faktura firmy" : "Rachunek studenta";
}

export default async function AdminContractDetailPage({ params }: { params: Params }) {
  const { id } = await params;
  const admin = createAdminClient();

  const { data: contract, error } = await admin
    .from("contracts")
    .select(`
      id,
      status,
      total_amount,
      currency,
      commission_rate,
      created_at,
      documents_generated_at,
      company_contract_accepted_at,
      student_contract_accepted_at,
      student_id,
      company_id,
      application_id,
      service_order_id,
      student:student_profiles(public_name),
      company:company_profiles(nazwa),
      applications!contracts_application_id_fkey(offers(tytul))
    `)
    .eq("id", id)
    .maybeSingle();

  if (error || !contract) {
    notFound();
  }

  const [milestonesResult, documentsResult, invoicesResult, payoutsResult, pitResult] =
    await Promise.all([
      admin
        .from("milestones")
        .select("id, idx, title, amount, status, due_at")
        .eq("contract_id", id)
        .order("idx", { ascending: true }),
      admin
        .from("contract_documents")
        .select("id, document_type, file_name, storage_path, generated_at, created_at")
        .eq("contract_id", id)
        .order("created_at", { ascending: false }),
      admin
        .from("invoices")
        .select("id, invoice_number, invoice_type, amount_gross, amount_net, status, created_at, storage_path")
        .eq("contract_id", id)
        .order("created_at", { ascending: false }),
      admin
        .from("payouts")
        .select("id, amount_net, status, created_at")
        .eq("contract_id", id)
        .order("created_at", { ascending: false })
        .limit(10),
      admin
        .from("pit_withholdings")
        .select("id, pit_amount, status, tax_period, created_at")
        .eq("contract_id", id)
        .order("created_at", { ascending: false })
        .limit(10),
    ]);

  const milestones = milestonesResult.data || [];
  const documents = documentsResult.data || [];
  const invoices = invoicesResult.data || [];
  const payouts = payoutsResult.data || [];
  const pitRows = pitResult.data || [];
  const paidInvoices = invoices.filter((invoice: any) => invoice.status === "paid").length;
  const contractADocument = documents.find((document: any) => document.document_type === "contract_a");
  const contractBDocument = documents.find((document: any) => document.document_type === "contract_b");
  const companyInvoicesCount = invoices.filter((invoice: any) => invoice.invoice_type === "company").length;
  const studentInvoicesCount = invoices.filter((invoice: any) => invoice.invoice_type === "student").length;
  const workspaceId = contract.application_id || contract.service_order_id || null;
  const offerTitle =
    (Array.isArray((contract as any).applications)
      ? (contract as any).applications[0]?.offers?.tytul
      : (contract as any).applications?.offers?.tytul) || "Kontrakt";
  const [documentsWithUrl, invoicesWithUrl] = await Promise.all([
    Promise.all(
      documents.map(async (document: any) => {
        if (!document.storage_path) {
          return { ...document, download_url: null };
        }

        const { data } = await admin.storage
          .from("deliverables")
          .createSignedUrl(document.storage_path, 60 * 60);

        return { ...document, download_url: data?.signedUrl || null };
      }),
    ),
    Promise.all(
      invoices.map(async (invoice: any) => {
        if (!invoice.storage_path) {
          return { ...invoice, download_url: null };
        }

        const { data } = await admin.storage
          .from("deliverables")
          .createSignedUrl(invoice.storage_path, 60 * 60);

        return { ...invoice, download_url: data?.signedUrl || null };
      }),
    ),
  ]);

  return (
    <div className="space-y-8 pb-12">
      <div className="relative overflow-hidden rounded-[2.5rem] border border-white/5 bg-slate-900/50 p-8 shadow-2xl">
        <div className="relative z-10 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <Link
              href="/app/admin/contracts"
              className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-slate-300 transition hover:bg-white/10 hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" />
              Wroc do kontraktow
            </Link>

            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-indigo-500/30 bg-indigo-500/20">
                <BriefcaseBusiness className="h-6 w-6 text-indigo-400" />
              </div>
              <span className="text-xs font-black uppercase tracking-[0.2em] text-indigo-400/80">
                Contract Detail
              </span>
            </div>
            <h1 className="mb-3 text-4xl font-black leading-none tracking-tight text-white md:text-5xl">
              {offerTitle}
            </h1>
            <div className="flex flex-wrap items-center gap-3">
              <span
                className={`rounded-lg px-2 py-1 text-[10px] font-black uppercase tracking-wider ${getStatusBadge(contract.status)}`}
              >
                {contract.status}
              </span>
              <span className="text-sm text-slate-400">
                Utworzono {new Date(contract.created_at).toLocaleDateString("pl-PL")}
              </span>
              <span className="text-sm text-slate-500">ID: {contract.id}</span>
            </div>
          </div>

          {workspaceId ? (
            <Link
              href={`/app/deliverables/${workspaceId}`}
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-bold text-slate-200 transition-all hover:border-indigo-400/30 hover:bg-indigo-500/10 hover:text-white"
            >
              Otworz workspace
              <ArrowUpRight className="h-4 w-4 text-indigo-300" />
            </Link>
          ) : null}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <div className="rounded-3xl border border-white/5 bg-slate-950/40 p-5">
          <div className="text-xs font-black uppercase tracking-widest text-slate-500">Wartosc</div>
          <div className="mt-2 text-2xl font-black text-white">
            {formatMoney(contract.total_amount, contract.currency || "PLN")}
          </div>
        </div>
        <div className="rounded-3xl border border-white/5 bg-slate-950/40 p-5">
          <div className="text-xs font-black uppercase tracking-widest text-slate-500">Prowizja</div>
          <div className="mt-2 text-2xl font-black text-white">
            {Math.round(Number(contract.commission_rate || 0) * 100)}%
          </div>
        </div>
        <div className="rounded-3xl border border-white/5 bg-slate-950/40 p-5">
          <div className="text-xs font-black uppercase tracking-widest text-slate-500">Dokumenty</div>
          <div className="mt-2 text-2xl font-black text-white">{documents.length}</div>
        </div>
        <div className="rounded-3xl border border-white/5 bg-slate-950/40 p-5">
          <div className="text-xs font-black uppercase tracking-widest text-slate-500">Faktury</div>
          <div className="mt-2 text-2xl font-black text-white">
            {paidInvoices}/{invoices.length}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="rounded-[2.5rem] border border-white/5 bg-slate-950/40 p-6 shadow-xl backdrop-blur-sm">
          <div className="mb-4 flex items-center gap-2">
            <Users className="h-4 w-4 text-indigo-400" />
            <h2 className="text-lg font-black text-white">Strony i stan akceptacji</h2>
          </div>

          <div className="space-y-4 text-sm text-slate-300">
            <div className="rounded-2xl border border-white/5 bg-slate-900/40 p-4">
              <div className="text-xs font-black uppercase tracking-widest text-slate-500">Firma</div>
              <div className="mt-2 flex items-center justify-between gap-3">
                <div className="font-medium text-white">
                  {(contract as any).company?.nazwa || "Brak danych"}
                </div>
                {contract.company_id ? (
                  <Link
                    href={`/app/admin/users/${contract.company_id}`}
                    className="text-xs font-bold text-indigo-300 hover:text-white"
                  >
                    Profil firmy
                  </Link>
                ) : null}
              </div>
              <div className="mt-2 text-xs text-slate-500">
                Akceptacja: {contract.company_contract_accepted_at
                  ? new Date(contract.company_contract_accepted_at).toLocaleDateString("pl-PL")
                  : "brak"}
              </div>
            </div>

            <div className="rounded-2xl border border-white/5 bg-slate-900/40 p-4">
              <div className="text-xs font-black uppercase tracking-widest text-slate-500">Student</div>
              <div className="mt-2 flex items-center justify-between gap-3">
                <div className="font-medium text-white">
                  {(contract as any).student?.public_name || "Brak danych"}
                </div>
                {contract.student_id ? (
                  <Link
                    href={`/app/admin/users/${contract.student_id}`}
                    className="text-xs font-bold text-indigo-300 hover:text-white"
                  >
                    Profil studenta
                  </Link>
                ) : null}
              </div>
              <div className="mt-2 text-xs text-slate-500">
                Akceptacja: {contract.student_contract_accepted_at
                  ? new Date(contract.student_contract_accepted_at).toLocaleDateString("pl-PL")
                  : "brak"}
              </div>
            </div>

            <div className="rounded-2xl border border-white/5 bg-slate-900/40 p-4">
              <div className="text-xs font-black uppercase tracking-widest text-slate-500">Dokumenty</div>
              <div className="mt-2 space-y-2 text-sm text-slate-300">
                <div>
                  {contract.documents_generated_at
                    ? `Wygenerowane ${new Date(contract.documents_generated_at).toLocaleDateString("pl-PL")}`
                    : "Brak wygenerowanych dokumentow"}
                </div>
                <div className="flex flex-wrap gap-2 text-[10px] font-black uppercase tracking-wider">
                  <span className={contractADocument
                    ? "rounded-full border border-indigo-500/20 bg-indigo-500/10 px-2 py-1 text-indigo-300"
                    : "rounded-full border border-white/10 bg-white/5 px-2 py-1 text-slate-500"}>
                    Umowa A {contractADocument ? "gotowa" : "brak"}
                  </span>
                  <span className={contractBDocument
                    ? "rounded-full border border-indigo-500/20 bg-indigo-500/10 px-2 py-1 text-indigo-300"
                    : "rounded-full border border-white/10 bg-white/5 px-2 py-1 text-slate-500"}>
                    Umowa B {contractBDocument ? "gotowa" : "brak"}
                  </span>
                  <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-1 text-emerald-300">
                    Faktury firmy {companyInvoicesCount}
                  </span>
                  <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-1 text-emerald-300">
                    Rachunki studenta {studentInvoicesCount}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-[2.5rem] border border-white/5 bg-slate-950/40 p-6 shadow-xl backdrop-blur-sm">
          <div className="mb-4 flex items-center gap-2">
            <BriefcaseBusiness className="h-4 w-4 text-amber-400" />
            <h2 className="text-lg font-black text-white">Milestones</h2>
          </div>

          <div className="space-y-3">
            {milestones.length === 0 ? (
              <div className="text-sm text-slate-500">Brak milestoneow dla tego kontraktu.</div>
            ) : (
              milestones.map((milestone: any) => (
                <div
                  key={milestone.id}
                  className="rounded-2xl border border-white/5 bg-slate-900/40 px-4 py-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-sm font-bold text-white">
                        {milestone.idx ? `Etap ${milestone.idx}: ` : ""}
                        {milestone.title || "Brak tytulu"}
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                        <span
                          className={`rounded-lg px-2 py-1 text-[10px] font-black uppercase tracking-wider ${getMilestoneBadge(milestone.status)}`}
                        >
                          {milestone.status || "brak"}
                        </span>
                        {milestone.due_at ? (
                          <span>
                            Termin: {new Date(milestone.due_at).toLocaleDateString("pl-PL")}
                          </span>
                        ) : null}
                      </div>
                    </div>
                    <div className="text-sm font-bold text-slate-300">
                      {formatMoney(milestone.amount, contract.currency || "PLN")}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_1fr]">
        <div className="rounded-[2.5rem] border border-white/5 bg-slate-950/40 p-6 shadow-xl backdrop-blur-sm">
          <div className="mb-4 flex items-center gap-2">
            <Receipt className="h-4 w-4 text-emerald-400" />
            <h2 className="text-lg font-black text-white">Finanse</h2>
          </div>

          <div className="space-y-4">
            <div>
              <div className="text-xs font-black uppercase tracking-widest text-slate-500">Wyplaty</div>
              <div className="mt-2 space-y-2">
                {payouts.length === 0 ? (
                  <div className="text-sm text-slate-500">Brak wyplat dla tego kontraktu.</div>
                ) : (
                  payouts.map((payout: any) => (
                    <div
                      key={payout.id}
                      className="rounded-2xl border border-white/5 bg-slate-900/40 px-4 py-3"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className="font-mono text-[11px] text-slate-400">
                          {payout.id.slice(0, 8)}
                        </span>
                        <span className="text-sm font-bold text-white">
                          {formatMoney(payout.amount_net)}
                        </span>
                      </div>
                      <div className="mt-1 text-xs text-slate-500">
                        {payout.status} | {new Date(payout.created_at).toLocaleDateString("pl-PL")}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div>
              <div className="text-xs font-black uppercase tracking-widest text-slate-500">PIT</div>
              <div className="mt-2 space-y-2">
                {pitRows.length === 0 ? (
                  <div className="text-sm text-slate-500">Brak pozycji PIT dla tego kontraktu.</div>
                ) : (
                  pitRows.map((row: any) => (
                    <div
                      key={row.id}
                      className="rounded-2xl border border-white/5 bg-slate-900/40 px-4 py-3"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-sm font-medium text-slate-300">
                          {row.tax_period || "Brak okresu"}
                        </span>
                        <span className="text-sm font-bold text-white">
                          {formatMoney(row.pit_amount)}
                        </span>
                      </div>
                      <div className="mt-1 text-xs text-slate-500">
                        {row.status} | {new Date(row.created_at).toLocaleDateString("pl-PL")}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-[2.5rem] border border-white/5 bg-slate-950/40 p-6 shadow-xl backdrop-blur-sm">
          <div className="mb-4 flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-indigo-300" />
            <h2 className="text-lg font-black text-white">Dokumenty i faktury</h2>
          </div>

          <div className="space-y-4">
            <div>
              <div className="text-xs font-black uppercase tracking-widest text-slate-500">
                Dokumenty kontraktu
              </div>
              <div className="mt-2 space-y-2">
                {documentsWithUrl.length === 0 ? (
                  <div className="text-sm text-slate-500">Brak dokumentow dla tego kontraktu.</div>
                ) : (
                  documentsWithUrl.map((document: any) => (
                    <div
                      key={document.id}
                      className="rounded-2xl border border-white/5 bg-slate-900/40 px-4 py-3"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <div className="text-sm font-medium text-slate-300">
                            {document.file_name || document.document_type}
                          </div>
                          <div className="mt-2 flex flex-wrap items-center gap-2">
                            <span
                              className={`rounded-lg px-2 py-1 text-[10px] font-black uppercase tracking-wider ${getContractDocumentBadge(document.document_type)}`}
                            >
                              {getDocumentTypeLabel(document.document_type as any)}
                            </span>
                            <span className="text-xs text-slate-500">
                              {getDocumentTypeDescription(document.document_type as any)}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="mb-1 text-[10px] font-black uppercase tracking-wider text-slate-500">
                            {document.download_url ? "PDF zapisany" : "Brak pliku"}
                          </div>
                          {document.download_url ? (
                            <a
                              href={document.download_url}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-xs font-bold text-indigo-300 transition-colors hover:text-white"
                            >
                              <FileText className="h-3.5 w-3.5" />
                              Pobierz PDF
                            </a>
                          ) : (
                            <span className="text-xs text-slate-500">Brak pliku</span>
                          )}
                        </div>
                      </div>
                      <div className="mt-1 text-xs text-slate-500">
                        {new Date(document.created_at || document.generated_at).toLocaleDateString("pl-PL")}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div>
              <div className="text-xs font-black uppercase tracking-widest text-slate-500">Faktury</div>
              <div className="mt-2 space-y-2">
                {invoicesWithUrl.length === 0 ? (
                  <div className="text-sm text-slate-500">Brak faktur dla tego kontraktu.</div>
                ) : (
                  invoicesWithUrl.map((invoice: any) => (
                    <div
                      key={invoice.id}
                      className="rounded-2xl border border-white/5 bg-slate-900/40 px-4 py-3"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <div className="text-sm font-medium text-slate-300">
                            {invoice.invoice_number || invoice.id}
                          </div>
                          <div className="mt-2 flex flex-wrap items-center gap-2">
                            <span
                              className={`rounded-lg px-2 py-1 text-[10px] font-black uppercase tracking-wider ${getInvoiceBadge(invoice.invoice_type)}`}
                            >
                              {getInvoiceLabel(invoice.invoice_type)}
                            </span>
                            <span className="text-xs text-slate-500">
                              {invoice.download_url ? "PDF zapisany" : "Brak pliku PDF"}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-bold text-white">
                            {formatMoney(invoice.amount_gross)}
                          </div>
                          {invoice.download_url ? (
                            <a
                              href={invoice.download_url}
                              target="_blank"
                              rel="noreferrer"
                              className="mt-1 inline-block text-xs font-bold text-indigo-300 transition-colors hover:text-white"
                            >
                              Pobierz PDF
                            </a>
                          ) : null}
                        </div>
                      </div>
                      <div className="mt-1 text-xs text-slate-500">
                        {invoice.status} | {new Date(invoice.created_at).toLocaleDateString("pl-PL")}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
