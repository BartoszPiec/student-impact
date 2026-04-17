import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ArrowUpRight,
  BriefcaseBusiness,
  FileText,
  Users,
  Wallet,
} from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type Params = Promise<{ id: string }>;

function formatMoney(value: number | string | null | undefined, currency = "PLN") {
  return Number(value || 0).toLocaleString("pl-PL", {
    style: "currency",
    currency,
  });
}

function formatOfferBudget(offer: {
  salary_range_min?: number | null;
  salary_range_max?: number | null;
  stawka?: number | null;
}) {
  if (offer.salary_range_min && offer.salary_range_max) {
    return `${offer.salary_range_min} - ${offer.salary_range_max} PLN`;
  }

  if (offer.salary_range_min) {
    return `od ${offer.salary_range_min} PLN`;
  }

  if (offer.stawka) {
    return `${offer.stawka} PLN`;
  }

  return "Brak stawki";
}

function getOfferStatusBadge(status: string | null | undefined) {
  if (status === "published") return "border border-emerald-500/20 bg-emerald-500/10 text-emerald-300";
  if (status === "closed") return "border border-slate-500/20 bg-slate-500/10 text-slate-300";
  if (status === "draft") return "border border-amber-500/20 bg-amber-500/10 text-amber-300";
  return "border border-white/10 bg-slate-500/10 text-slate-400";
}

function getApplicationStatusBadge(status: string | null | undefined) {
  if (status === "accepted" || status === "in_progress") {
    return "border border-emerald-500/20 bg-emerald-500/10 text-emerald-300";
  }
  if (status === "countered") {
    return "border border-amber-500/20 bg-amber-500/10 text-amber-300";
  }
  if (status === "rejected") {
    return "border border-red-500/20 bg-red-500/10 text-red-300";
  }
  return "border border-indigo-500/20 bg-indigo-500/10 text-indigo-300";
}

function getContractStatusBadge(status: string | null | undefined) {
  if (status === "completed") return "border border-emerald-500/20 bg-emerald-500/10 text-emerald-300";
  if (status === "active") return "border border-blue-500/20 bg-blue-500/10 text-blue-300";
  if (status === "disputed") return "border border-amber-500/20 bg-amber-500/10 text-amber-300";
  if (status === "cancelled") return "border border-red-500/20 bg-red-500/10 text-red-300";
  return "border border-white/10 bg-slate-500/10 text-slate-400";
}

export default async function AdminOfferDetailPage({ params }: { params: Params }) {
  const { id } = await params;
  const admin = createAdminClient();

  const [offerResult, applicationsResult] = await Promise.all([
    admin
      .from("offers")
      .select(`
        id,
        tytul,
        opis,
        typ,
        stawka,
        salary_range_min,
        salary_range_max,
        location,
        is_remote,
        contract_type,
        status,
        commission_rate,
        is_platform_service,
        created_at,
        company_id,
        company:company_profiles(nazwa)
      `)
      .eq("id", id)
      .maybeSingle(),
    admin
      .from("applications")
      .select(`
        id,
        offer_id,
        status,
        student_id,
        created_at,
        proposed_stawka,
        agreed_stawka,
        counter_stawka
      `)
      .eq("offer_id", id)
      .order("created_at", { ascending: false }),
  ]);

  if (offerResult.error || !offerResult.data) {
    notFound();
  }

  const offer = offerResult.data as any;
  const applications = (applicationsResult.data || []) as any[];
  const studentIds = [...new Set(applications.map((application) => application.student_id).filter(Boolean))];
  const applicationIds = applications.map((application) => application.id);

  const [studentProfilesResult, contractsResult] = await Promise.all([
    studentIds.length > 0
      ? admin
          .from("student_profiles")
          .select("user_id, public_name")
          .in("user_id", studentIds)
      : Promise.resolve({ data: [], error: null }),
    applicationIds.length > 0
      ? admin
          .from("contracts")
          .select(`
            id,
            application_id,
            status,
            terms_status,
            total_amount,
            currency,
            commission_rate,
            created_at,
            student_id,
            student:student_profiles(public_name)
          `)
          .in("application_id", applicationIds)
          .order("created_at", { ascending: false })
      : Promise.resolve({ data: [], error: null }),
  ]);

  const contracts = (contractsResult.data || []) as any[];
  const contractIds = contracts.map((contract) => contract.id);

  const payoutsResult =
    contractIds.length > 0
      ? await admin
          .from("payouts")
          .select("id, contract_id, amount_net, status")
          .in("contract_id", contractIds)
      : { data: [], error: null };

  const studentMap = new Map(
    ((studentProfilesResult.data || []) as Array<{ user_id: string; public_name: string | null }>).map(
      (profile) => [profile.user_id, profile.public_name || "Nieznany student"],
    ),
  );

  const contractByApplicationId = new Map(contracts.map((contract) => [contract.application_id, contract]));
  const payoutsByContractId = new Map<string, { count: number; total: number }>();

  ((payoutsResult.data || []) as Array<{ contract_id: string; amount_net: number | string }>).forEach(
    (payout) => {
      const current = payoutsByContractId.get(payout.contract_id) || { count: 0, total: 0 };
      payoutsByContractId.set(payout.contract_id, {
        count: current.count + 1,
        total: current.total + Number(payout.amount_net || 0),
      });
    },
  );

  const acceptedApplications = applications.filter(
    (application) => application.status === "accepted" || application.status === "in_progress",
  ).length;
  const budgetLabel = formatOfferBudget(offer);
  const contractCount = contracts.length;
  const payoutCount = (payoutsResult.data || []).length;

  return (
    <div className="space-y-8 pb-12">
      <div className="relative overflow-hidden rounded-[2.5rem] border border-white/5 bg-slate-900/50 p-8 shadow-2xl">
        <div className="relative z-10 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <Link
              href="/app/admin/offers"
              className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-slate-300 transition hover:bg-white/10 hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" />
              Wroc do ofert
            </Link>

            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-indigo-500/30 bg-indigo-500/20">
                <BriefcaseBusiness className="h-6 w-6 text-indigo-400" />
              </div>
              <span className="text-xs font-black uppercase tracking-[0.2em] text-indigo-400/80">
                Offer Detail
              </span>
            </div>
            <h1 className="mb-3 text-4xl font-black leading-none tracking-tight text-white md:text-5xl">
              {offer.tytul || "Oferta"}
            </h1>
            <div className="flex flex-wrap items-center gap-3">
              <span
                className={`rounded-lg px-2 py-1 text-[10px] font-black uppercase tracking-wider ${getOfferStatusBadge(offer.status)}`}
              >
                {offer.status || "brak"}
              </span>
              <span className="text-sm text-slate-400">
                Dodano {new Date(offer.created_at).toLocaleDateString("pl-PL")}
              </span>
              <span className="text-sm text-slate-500">ID: {offer.id}</span>
            </div>
          </div>

          {offer.company_id ? (
            <Link
              href={`/app/admin/users/${offer.company_id}`}
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-bold text-slate-200 transition-all hover:border-indigo-400/30 hover:bg-indigo-500/10 hover:text-white"
            >
              Profil firmy
              <ArrowUpRight className="h-4 w-4 text-indigo-300" />
            </Link>
          ) : null}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <div className="rounded-3xl border border-white/5 bg-slate-950/40 p-5">
          <div className="text-xs font-black uppercase tracking-widest text-slate-500">Aplikacje</div>
          <div className="mt-2 text-2xl font-black text-white">{applications.length}</div>
          <div className="mt-1 text-sm text-slate-400">Wszystkie aplikacje dla tej oferty</div>
        </div>
        <div className="rounded-3xl border border-white/5 bg-slate-950/40 p-5">
          <div className="text-xs font-black uppercase tracking-widest text-slate-500">Aktywne leady</div>
          <div className="mt-2 text-2xl font-black text-white">{acceptedApplications}</div>
          <div className="mt-1 text-sm text-slate-400">Accepted lub in progress</div>
        </div>
        <div className="rounded-3xl border border-white/5 bg-slate-950/40 p-5">
          <div className="text-xs font-black uppercase tracking-widest text-slate-500">Kontrakty</div>
          <div className="mt-2 text-2xl font-black text-white">{contractCount}</div>
          <div className="mt-1 text-sm text-slate-400">Umowy powiazane z oferta</div>
        </div>
        <div className="rounded-3xl border border-white/5 bg-slate-950/40 p-5">
          <div className="text-xs font-black uppercase tracking-widest text-slate-500">Budzet</div>
          <div className="mt-2 text-2xl font-black text-white">{budgetLabel}</div>
          <div className="mt-1 text-sm text-slate-400">Payoutow: {payoutCount}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-[2.5rem] border border-white/5 bg-slate-950/40 p-6 shadow-xl backdrop-blur-sm">
          <div className="mb-4 flex items-center gap-2">
            <FileText className="h-4 w-4 text-indigo-300" />
            <h2 className="text-lg font-black text-white">Kontekst oferty</h2>
          </div>

          <div className="space-y-4 text-sm text-slate-300">
            <div className="rounded-2xl border border-white/5 bg-slate-900/40 p-4">
              <div className="text-xs font-black uppercase tracking-widest text-slate-500">Firma</div>
              <div className="mt-2 flex items-center justify-between gap-3">
                <div className="font-medium text-white">{offer.company?.nazwa || "Brak danych"}</div>
                {offer.company_id ? (
                  <Link
                    href={`/app/admin/users/${offer.company_id}`}
                    className="text-xs font-bold text-indigo-300 hover:text-white"
                  >
                    Profil firmy
                  </Link>
                ) : null}
              </div>
            </div>

            <div className="rounded-2xl border border-white/5 bg-slate-900/40 p-4">
              <div className="text-xs font-black uppercase tracking-widest text-slate-500">Typ i model</div>
              <div className="mt-2 flex flex-wrap gap-2 text-xs font-bold uppercase tracking-wider text-slate-300">
                <span className="rounded-lg border border-white/10 bg-white/5 px-2 py-1">
                  {offer.typ || "brak typu"}
                </span>
                {offer.contract_type ? (
                  <span className="rounded-lg border border-white/10 bg-white/5 px-2 py-1">
                    {offer.contract_type}
                  </span>
                ) : null}
                {offer.is_platform_service ? (
                  <span className="rounded-lg border border-amber-500/20 bg-amber-500/10 px-2 py-1 text-amber-300">
                    Systemowa
                  </span>
                ) : null}
              </div>
            </div>

            <div className="rounded-2xl border border-white/5 bg-slate-900/40 p-4">
              <div className="text-xs font-black uppercase tracking-widest text-slate-500">Finanse</div>
              <div className="mt-2 text-sm text-white">
                Budzet: <span className="font-bold">{budgetLabel}</span>
              </div>
              <div className="mt-1 text-xs text-slate-500">
                Prowizja: {offer.commission_rate == null ? "auto" : `${Math.round(Number(offer.commission_rate) * 100)}%`}
              </div>
              <div className="mt-1 text-xs text-slate-500">
                {offer.is_remote ? "Remote" : offer.location || "Brak lokalizacji"}
              </div>
            </div>

            <div className="rounded-2xl border border-white/5 bg-slate-900/40 p-4">
              <div className="text-xs font-black uppercase tracking-widest text-slate-500">Opis</div>
              <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-slate-300">
                {offer.opis || "Brak opisu oferty."}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-[2.5rem] border border-white/5 bg-slate-950/40 p-6 shadow-xl backdrop-blur-sm">
          <div className="mb-4 flex items-center gap-2">
            <Users className="h-4 w-4 text-emerald-400" />
            <h2 className="text-lg font-black text-white">Aplikacje</h2>
          </div>

          <div className="space-y-3">
            {applications.length === 0 ? (
              <div className="text-sm text-slate-500">Brak aplikacji dla tej oferty.</div>
            ) : (
              applications.map((application) => {
                const contract = contractByApplicationId.get(application.id);
                return (
                  <div
                    key={application.id}
                    className="rounded-2xl border border-white/5 bg-slate-900/40 px-4 py-4"
                  >
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-bold text-white">
                            {studentMap.get(application.student_id) || "Nieznany student"}
                          </span>
                          <span
                            className={`rounded-lg px-2 py-1 text-[10px] font-black uppercase tracking-wider ${getApplicationStatusBadge(application.status)}`}
                          >
                            {application.status || "brak"}
                          </span>
                        </div>

                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                          <span>ID: {application.id.slice(0, 8)}</span>
                          <span>Dodano: {new Date(application.created_at).toLocaleDateString("pl-PL")}</span>
                          {application.proposed_stawka ? (
                            <span>Propozycja: {formatMoney(application.proposed_stawka)}</span>
                          ) : null}
                          {application.counter_stawka ? (
                            <span>Kontra: {formatMoney(application.counter_stawka)}</span>
                          ) : null}
                          {application.agreed_stawka ? (
                            <span>Uzgodnione: {formatMoney(application.agreed_stawka)}</span>
                          ) : null}
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        {application.student_id ? (
                          <Link
                            href={`/app/admin/users/${application.student_id}`}
                            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-bold text-slate-200 transition-all hover:border-indigo-400/30 hover:bg-indigo-500/10 hover:text-white"
                          >
                            Profil studenta
                          </Link>
                        ) : null}
                        {contract ? (
                          <Link
                            href={`/app/admin/contracts/${contract.id}`}
                            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-bold text-slate-200 transition-all hover:border-emerald-400/30 hover:bg-emerald-500/10 hover:text-white"
                          >
                            Szczegoly kontraktu
                            <ArrowUpRight className="h-3.5 w-3.5 text-emerald-300" />
                          </Link>
                        ) : null}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      <div className="rounded-[2.5rem] border border-white/5 bg-slate-950/40 p-6 shadow-xl backdrop-blur-sm">
        <div className="mb-4 flex items-center gap-2">
          <Wallet className="h-4 w-4 text-amber-400" />
          <h2 className="text-lg font-black text-white">Kontrakty urodzone z tej oferty</h2>
        </div>

        <div className="space-y-3">
          {contracts.length === 0 ? (
            <div className="text-sm text-slate-500">Brak kontraktow powiazanych z ta oferta.</div>
          ) : (
            contracts.map((contract) => {
              const payoutStats = payoutsByContractId.get(contract.id);
              return (
                <div
                  key={contract.id}
                  className="rounded-2xl border border-white/5 bg-slate-900/40 px-4 py-4"
                >
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-sm text-white">{contract.id.slice(0, 8)}</span>
                        <span
                          className={`rounded-lg px-2 py-1 text-[10px] font-black uppercase tracking-wider ${getContractStatusBadge(contract.status)}`}
                        >
                          {contract.status || "brak"}
                        </span>
                        {contract.terms_status ? (
                          <span className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-[10px] font-black uppercase tracking-wider text-slate-300">
                            terms: {contract.terms_status}
                          </span>
                        ) : null}
                      </div>

                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                        <span>Student: {contract.student?.public_name || "Brak danych"}</span>
                        <span>Wartosc: {formatMoney(contract.total_amount, contract.currency || "PLN")}</span>
                        <span>Prowizja: {Math.round(Number(contract.commission_rate || 0) * 100)}%</span>
                        <span>Utworzono: {new Date(contract.created_at).toLocaleDateString("pl-PL")}</span>
                        {payoutStats ? (
                          <span>
                            Payouty: {payoutStats.count} / {formatMoney(payoutStats.total)}
                          </span>
                        ) : (
                          <span>Payouty: 0</span>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {contract.student_id ? (
                        <Link
                          href={`/app/admin/users/${contract.student_id}`}
                          className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-bold text-slate-200 transition-all hover:border-indigo-400/30 hover:bg-indigo-500/10 hover:text-white"
                        >
                          Profil studenta
                        </Link>
                      ) : null}
                      <Link
                        href={`/app/admin/contracts/${contract.id}`}
                        className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-bold text-slate-200 transition-all hover:border-emerald-400/30 hover:bg-emerald-500/10 hover:text-white"
                      >
                        Szczegoly kontraktu
                        <ArrowUpRight className="h-3.5 w-3.5 text-emerald-300" />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
