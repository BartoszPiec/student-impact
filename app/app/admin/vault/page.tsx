import { createAdminClient } from "@/lib/supabase/admin";
import Link from "next/link";
import { DownloadCloud, FileText, ShieldAlert } from "lucide-react";
import { VaultTable } from "@/components/admin/vault-table";
import { Button } from "@/components/ui/button";
import { backfillMissingContractPdfs } from "./_actions";

export const dynamic = "force-dynamic";

type LegalVaultPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function LegalVaultPage({ searchParams }: LegalVaultPageProps) {
  const supabase = createAdminClient();
  const resolvedSearchParams = (await searchParams) || {};
  const pdfRepairDone = resolvedSearchParams.pdfRepair === "done";
  const singleRepairDone = resolvedSearchParams.pdfRepair === "single";
  const targeted = Number(resolvedSearchParams.targeted || 0);
  const repaired = Number(resolvedSearchParams.repaired || 0);
  const failed = Number(resolvedSearchParams.failed || 0);
  const singleContractId = typeof resolvedSearchParams.contractId === "string" ? resolvedSearchParams.contractId : null;
  const errorMessage =
    typeof resolvedSearchParams.errorMessage === "string"
      ? decodeURIComponent(resolvedSearchParams.errorMessage)
      : null;

  const { data: contracts, error } = await supabase
    .from("contracts")
    .select(`
      id,
      created_at,
      total_amount,
      currency,
      status,
      documents_generated_at,
      company_contract_accepted_at,
      student_contract_accepted_at,
      student_id,
      company_id,
      student:student_profiles(public_name),
      company:company_profiles(nazwa),
      applications!contracts_application_id_fkey(offers(tytul))
    `)
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center rounded-3xl border border-red-500/20 bg-red-500/5 p-8">
        <ShieldAlert className="mb-4 h-12 w-12 text-red-500" />
        <h2 className="text-xl font-black text-white">Blad bazy danych</h2>
        <p className="mt-2 text-slate-400">{error.message}</p>
      </div>
    );
  }

  const contractRows = ((contracts || []) as any[]) || [];
  const contractIds = contractRows.map((contract) => contract.id).filter(Boolean);

  let documentCountByContract = new Map<string, number>();
  let invoiceSummaryByContract = new Map<string, { total: number; paid: number }>();
  let legalDocumentsByContract = new Map<
    string,
    Array<{ id: string; name: string; type: string; url: string | null }>
  >();

  if (contractIds.length > 0) {
    const [{ data: documents }, { data: invoices }] = await Promise.all([
      supabase
        .from("contract_documents")
        .select("id, contract_id, document_type, file_name, storage_path")
        .in("contract_id", contractIds),
      supabase
        .from("invoices")
        .select("contract_id, status")
        .in("contract_id", contractIds),
    ]);

    documentCountByContract = (documents || []).reduce((map, document: any) => {
      const contractId = document.contract_id;
      if (!contractId) return map;
      map.set(contractId, (map.get(contractId) || 0) + 1);
      return map;
    }, new Map<string, number>());

    const legalDocumentsWithUrls = await Promise.all(
      (documents || [])
        .filter((document: any) =>
          document.document_type === "contract_a" || document.document_type === "contract_b",
        )
        .map(async (document: any) => {
          const { data } = document.storage_path
            ? await supabase.storage
                .from("deliverables")
                .createSignedUrl(document.storage_path, 60 * 60)
            : { data: null };

          return {
            contract_id: document.contract_id,
            id: document.id,
            name: document.file_name || document.document_type,
            type: document.document_type,
            url: data?.signedUrl || null,
          };
        }),
    );

    legalDocumentsByContract = legalDocumentsWithUrls.reduce((map, document) => {
      if (!document.contract_id) return map;
      const current = map.get(document.contract_id) || [];
      current.push({
        id: document.id,
        name: document.name,
        type: document.type,
        url: document.url,
      });
      map.set(document.contract_id, current);
      return map;
    }, new Map<string, Array<{ id: string; name: string; type: string; url: string | null }>>());

    invoiceSummaryByContract = (invoices || []).reduce(
      (map, invoice: any) => {
        const contractId = invoice.contract_id;
        if (!contractId) return map;
        const current = map.get(contractId) || { total: 0, paid: 0 };
        current.total += 1;
        if (invoice.status === "paid") {
          current.paid += 1;
        }
        map.set(contractId, current);
        return map;
      },
      new Map<string, { total: number; paid: number }>(),
    );
  }

  const contractsWithSummary = contractRows.map((contract) => {
    const invoiceSummary = invoiceSummaryByContract.get(contract.id) || { total: 0, paid: 0 };

    return {
      ...contract,
      document_count: documentCountByContract.get(contract.id) || 0,
      invoice_count: invoiceSummary.total,
      paid_invoice_count: invoiceSummary.paid,
      legal_documents: legalDocumentsByContract.get(contract.id) || [],
    };
  });

  const singleRepairContract = singleContractId
    ? contractsWithSummary.find((contract) => contract.id === singleContractId) || null
    : null;
  const singleRepairHasDocuments = Boolean(
    singleRepairContract?.legal_documents?.some(
      (document: { id: string; name: string; type: string; url: string | null }) => document.id,
    ),
  );
  const showSingleRepairFailure = singleRepairDone && failed > 0 && !singleRepairHasDocuments;
  const showSingleRepairSuccess =
    singleRepairDone && !showSingleRepairFailure && (repaired > 0 || singleRepairHasDocuments);

  return (
    <div className="space-y-8 pb-12">
      <div className="group relative flex flex-col gap-6 overflow-hidden rounded-[2.5rem] border border-white/5 bg-slate-900/50 p-8 shadow-2xl md:flex-row md:items-end md:justify-between">
        <div className="absolute right-0 top-0 p-12 opacity-5 transition-opacity group-hover:opacity-10">
          <DownloadCloud className="h-32 w-32 text-indigo-400" />
        </div>

        <div className="relative z-10">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-indigo-500/30 bg-indigo-500/20">
              <FileText className="h-6 w-6 text-indigo-400" />
            </div>
            <span className="text-xs font-black uppercase tracking-[0.2em] text-indigo-400/80">
              Ksiegowosc i audyt
            </span>
          </div>
          <h1 className="mb-3 text-4xl font-black leading-none tracking-tight text-white md:text-5xl">
            Legal <span className="text-indigo-500">Vault</span>
          </h1>
          <p className="max-w-xl font-medium leading-relaxed text-slate-400">
            Centralne repozytorium wszystkich zawartych umow. Pobieraj podpisane
            dokumenty PDF do celow ksiegowych i prawnych.
          </p>
        </div>

        <form action={backfillMissingContractPdfs} className="relative z-10">
          <Button
            type="submit"
            className="h-11 rounded-xl bg-indigo-500 px-5 text-sm font-bold text-white hover:bg-indigo-400"
          >
            Napraw brakujace PDF
          </Button>
        </form>
      </div>

      {pdfRepairDone ? (
        <div className="rounded-2xl border border-indigo-500/20 bg-indigo-500/10 px-5 py-4 text-sm text-slate-200">
          Backfill PDF zakonczony. Sprawdzone kontrakty: <span className="font-bold text-white">{targeted}</span>,
          naprawione: <span className="font-bold text-emerald-300">{repaired}</span>,
          bledy: <span className="font-bold text-rose-300">{failed}</span>.
        </div>
      ) : null}

      {singleRepairDone ? (
        <div
          className={`rounded-2xl px-5 py-4 text-sm ${
            showSingleRepairFailure
              ? "border border-rose-500/20 bg-rose-500/10 text-rose-100"
              : "border border-emerald-500/20 bg-emerald-500/10 text-emerald-100"
          }`}
        >
          {showSingleRepairFailure
            ? "Naprawa pojedynczego PDF nie powiodla sie"
            : showSingleRepairSuccess
              ? "Naprawa pojedynczego PDF zakonczona"
              : "Stan naprawy pojedynczego PDF zaktualizowany"}
          {singleContractId ? (
            <>
              {" "}dla kontraktu <span className="font-bold text-white">{singleContractId.slice(0, 8)}...</span>.
            </>
          ) : (
            "."
          )}
          {showSingleRepairFailure && errorMessage ? (
            <div className="mt-2 text-rose-200/90">
              Powod: <span className="font-semibold text-white">{errorMessage}</span>
            </div>
          ) : null}
          {!showSingleRepairFailure && singleRepairHasDocuments ? (
            <div className="mt-2 text-emerald-200/90">
              Dokumenty umowy sa juz dostepne w Legal Vault.
            </div>
          ) : null}
          <div className="mt-3">
            <Link
              href="/app/admin/vault"
              className="text-xs font-bold uppercase tracking-wider text-slate-300 underline underline-offset-4 hover:text-white"
            >
              Wyczysc komunikat
            </Link>
          </div>
        </div>
      ) : null}

      <VaultTable contracts={contractsWithSummary} />
    </div>
  );
}
