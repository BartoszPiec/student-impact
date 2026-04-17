import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, BriefcaseBusiness, Building2, Receipt, Users } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type Params = Promise<{ id: string }>;

function formatMoney(value: number | string | null | undefined, currency = "PLN") {
  return Number(value || 0).toLocaleString("pl-PL", {
    style: "currency",
    currency,
  });
}

function getDisplayName(profile: {
  public_name?: string | null;
  user_id: string;
}) {
  return profile.public_name || `Uzytkownik ${profile.user_id.slice(0, 8)}`;
}

function getRoleBadge(role: string | null) {
  if (role === "admin") {
    return "border border-amber-500/20 bg-amber-500/10 text-amber-300";
  }

  if (role === "company") {
    return "border border-indigo-500/20 bg-indigo-500/10 text-indigo-300";
  }

  if (role === "student") {
    return "border border-emerald-500/20 bg-emerald-500/10 text-emerald-300";
  }

  return "border border-white/10 bg-slate-500/10 text-slate-400";
}

export default async function AdminUserDetailPage({ params }: { params: Params }) {
  const { id } = await params;
  const admin = createAdminClient();

  const { data: profile, error } = await admin
    .from("profiles")
    .select("user_id, role, created_at")
    .eq("user_id", id)
    .maybeSingle();

  if (error || !profile) {
    notFound();
  }

  const [authUserResult, contractsResult, studentProfileResult, companyProfileResult, pitResult] =
    await Promise.all([
      admin.auth.admin.getUserById(id),
      admin
        .from("contracts")
        .select("id, status, total_amount, currency, commission_rate, created_at")
        .or(`student_id.eq.${id},company_id.eq.${id}`)
        .order("created_at", { ascending: false })
        .limit(20),
      profile.role === "student"
        ? admin
            .from("student_profiles")
            .select("public_name, pesel, birth_date")
            .eq("user_id", id)
            .maybeSingle()
        : Promise.resolve({ data: null, error: null }),
      profile.role === "company"
        ? admin
            .from("company_profiles")
            .select("nazwa, nip, city, osoba_kontaktowa")
            .eq("user_id", id)
            .maybeSingle()
        : Promise.resolve({ data: null, error: null }),
      profile.role === "student"
        ? admin
            .from("pit_withholdings")
            .select("id, contract_id, pit_amount, status, tax_period, created_at")
            .eq("student_id", id)
            .order("created_at", { ascending: false })
            .limit(10)
        : Promise.resolve({ data: [], error: null }),
    ]);

  const authEmail = authUserResult.data.user?.email || "Brak danych";
  const displayName = getDisplayName({
    ...profile,
    public_name:
      profile.role === "student"
        ? studentProfileResult.data?.public_name || null
        : profile.role === "company"
          ? companyProfileResult.data?.nazwa || null
          : null,
  });
  const contracts = contractsResult.data || [];
  const pitRows = pitResult.data || [];
  const studentContractIds = profile.role === "student" ? contracts.map((contract: any) => contract.id) : [];
  const payouts =
    profile.role === "student" && studentContractIds.length > 0
      ? (
          await admin
            .from("payouts")
            .select("id, contract_id, amount_net, status, created_at")
            .in("contract_id", studentContractIds)
            .order("created_at", { ascending: false })
            .limit(10)
        ).data || []
      : [];
  const totalPayoutNet = payouts.reduce((sum, row: any) => sum + Number(row.amount_net || 0), 0);
  const totalPit = pitRows.reduce((sum, row: any) => sum + Number(row.pit_amount || 0), 0);

  return (
    <div className="space-y-8 pb-12">
      <div className="relative overflow-hidden rounded-[2.5rem] border border-white/5 bg-slate-900/50 p-8 shadow-2xl">
        <div className="relative z-10 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <Link
              href="/app/admin/users"
              className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-slate-300 transition hover:bg-white/10 hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" />
              Wroc do uzytkownikow
            </Link>

            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-indigo-500/30 bg-indigo-500/20">
                <Users className="h-6 w-6 text-indigo-400" />
              </div>
              <span className="text-xs font-black uppercase tracking-[0.2em] text-indigo-400/80">
                User Detail
              </span>
            </div>
            <h1 className="mb-3 text-4xl font-black leading-none tracking-tight text-white md:text-5xl">
              {displayName}
            </h1>
            <div className="flex flex-wrap items-center gap-3">
              <span
                className={`rounded-lg px-2 py-1 text-[10px] font-black uppercase tracking-wider ${getRoleBadge(profile.role)}`}
              >
                {profile.role || "brak"}
              </span>
              <span className="text-sm font-medium text-slate-400">{authEmail}</span>
              <span className="text-sm text-slate-500">
                Konto od {new Date(profile.created_at).toLocaleDateString("pl-PL")}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <div className="rounded-3xl border border-white/5 bg-slate-950/40 p-5">
          <div className="text-xs font-black uppercase tracking-widest text-slate-500">Rola</div>
          <div className="mt-2 text-2xl font-black text-white">{profile.role || "brak"}</div>
        </div>
        <div className="rounded-3xl border border-white/5 bg-slate-950/40 p-5">
          <div className="text-xs font-black uppercase tracking-widest text-slate-500">Kontrakty</div>
          <div className="mt-2 text-2xl font-black text-white">{contracts.length}</div>
        </div>
        <div className="rounded-3xl border border-white/5 bg-slate-950/40 p-5">
          <div className="text-xs font-black uppercase tracking-widest text-slate-500">Wyplaty</div>
          <div className="mt-2 text-2xl font-black text-white">
            {profile.role === "student" ? formatMoney(totalPayoutNet) : "-"}
          </div>
        </div>
        <div className="rounded-3xl border border-white/5 bg-slate-950/40 p-5">
          <div className="text-xs font-black uppercase tracking-widest text-slate-500">PIT</div>
          <div className="mt-2 text-2xl font-black text-white">
            {profile.role === "student" ? formatMoney(totalPit) : "-"}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-[2.5rem] border border-white/5 bg-slate-950/40 shadow-xl backdrop-blur-sm">
          <div className="border-b border-white/5 bg-white/5 px-6 py-5">
            <h2 className="text-lg font-black text-white">Kontrakty</h2>
            <p className="mt-1 text-sm text-slate-400">Ostatnie kontrakty powiazane z tym uzytkownikiem.</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-white/5 bg-slate-950/20">
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">ID</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Status</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Prowizja</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Wartosc</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Data</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {contracts.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-sm font-medium text-slate-500">
                      Brak kontraktow dla tego uzytkownika.
                    </td>
                  </tr>
                ) : (
                  contracts.map((contract: any) => (
                    <tr key={contract.id} className="transition-colors hover:bg-white/5">
                      <td className="px-6 py-4 font-mono text-[11px]">
                        <Link
                          href={`/app/admin/contracts/${contract.id}`}
                          className="text-slate-400 transition-colors hover:text-indigo-300"
                        >
                          {contract.id}
                        </Link>
                      </td>
                      <td className="px-6 py-4 text-sm font-bold text-white">{contract.status}</td>
                      <td className="px-6 py-4 text-sm text-slate-300">
                        {Math.round(Number(contract.commission_rate || 0) * 100)}%
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-300">
                        {formatMoney(contract.total_amount, contract.currency || "PLN")}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-500">
                        {new Date(contract.created_at).toLocaleDateString("pl-PL")}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-[2.5rem] border border-white/5 bg-slate-950/40 p-6 shadow-xl backdrop-blur-sm">
            <div className="mb-4 flex items-center gap-2">
              {profile.role === "company" ? (
                <Building2 className="h-4 w-4 text-indigo-400" />
              ) : (
                <Users className="h-4 w-4 text-emerald-400" />
              )}
              <h2 className="text-lg font-black text-white">Profil</h2>
            </div>

            <div className="space-y-3 text-sm text-slate-300">
              <div>
                <div className="text-xs font-black uppercase tracking-widest text-slate-500">Display name</div>
                <div className="mt-1">{displayName}</div>
              </div>
              <div>
                <div className="text-xs font-black uppercase tracking-widest text-slate-500">Email</div>
                <div className="mt-1">{authEmail}</div>
              </div>

              {profile.role === "student" && studentProfileResult.data ? (
                <>
                  <div>
                    <div className="text-xs font-black uppercase tracking-widest text-slate-500">PESEL</div>
                    <div className="mt-1">{studentProfileResult.data.pesel || "Brak"}</div>
                  </div>
                  <div>
                    <div className="text-xs font-black uppercase tracking-widest text-slate-500">Data urodzenia</div>
                    <div className="mt-1">{studentProfileResult.data.birth_date || "Brak"}</div>
                  </div>
                </>
              ) : null}

              {profile.role === "company" && companyProfileResult.data ? (
                <>
                  <div>
                    <div className="text-xs font-black uppercase tracking-widest text-slate-500">Nazwa firmy</div>
                    <div className="mt-1">{companyProfileResult.data.nazwa || "Brak"}</div>
                  </div>
                  <div>
                    <div className="text-xs font-black uppercase tracking-widest text-slate-500">NIP</div>
                    <div className="mt-1">{companyProfileResult.data.nip || "Brak"}</div>
                  </div>
                  <div>
                    <div className="text-xs font-black uppercase tracking-widest text-slate-500">Miasto</div>
                    <div className="mt-1">{companyProfileResult.data.city || "Brak"}</div>
                  </div>
                  <div>
                    <div className="text-xs font-black uppercase tracking-widest text-slate-500">Osoba kontaktowa</div>
                    <div className="mt-1">{companyProfileResult.data.osoba_kontaktowa || "Brak"}</div>
                  </div>
                </>
              ) : null}
            </div>
          </div>

          {profile.role === "student" ? (
            <div className="rounded-[2.5rem] border border-white/5 bg-slate-950/40 p-6 shadow-xl backdrop-blur-sm">
              <div className="mb-4 flex items-center gap-2">
                <Receipt className="h-4 w-4 text-amber-400" />
                <h2 className="text-lg font-black text-white">Finanse studenta</h2>
              </div>

              <div className="space-y-4">
                <div>
                  <div className="text-xs font-black uppercase tracking-widest text-slate-500">Ostatnie wyplaty</div>
                  <div className="mt-2 space-y-2">
                    {payouts.length === 0 ? (
                      <div className="text-sm text-slate-500">Brak wyplat.</div>
                    ) : (
                      payouts.map((payout: any) => (
                        <div
                          key={payout.id}
                          className="rounded-2xl border border-white/5 bg-slate-900/40 px-4 py-3"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <span className="font-mono text-[11px] text-slate-400">
                              {payout.contract_id}
                            </span>
                            <span className="text-sm font-bold text-white">
                              {formatMoney(payout.amount_net)}
                            </span>
                          </div>
                          <div className="mt-1 text-xs text-slate-500">
                            {payout.status} • {new Date(payout.created_at).toLocaleDateString("pl-PL")}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div>
                  <div className="text-xs font-black uppercase tracking-widest text-slate-500">Ostatnie PIT</div>
                  <div className="mt-2 space-y-2">
                    {pitRows.length === 0 ? (
                      <div className="text-sm text-slate-500">Brak pozycji PIT.</div>
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
                            {row.status} • {new Date(row.created_at).toLocaleDateString("pl-PL")}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-[2.5rem] border border-white/5 bg-slate-950/40 p-6 shadow-xl backdrop-blur-sm">
              <div className="mb-4 flex items-center gap-2">
                <BriefcaseBusiness className="h-4 w-4 text-indigo-400" />
                <h2 className="text-lg font-black text-white">Kontekst firmy</h2>
              </div>
              <p className="text-sm leading-relaxed text-slate-400">
                Widok firmy koncentruje sie na kontraktach i danych rejestrowych.
                Kolejny sensowny drill-down po tym batchu to szczegoly kontraktu.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
