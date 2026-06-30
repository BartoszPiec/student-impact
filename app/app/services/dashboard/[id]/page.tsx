import Link from "next/link";
import { redirect } from "next/navigation";
import { format } from "date-fns";
import { pl } from "date-fns/locale";
import {
  ArrowLeft,
  Building2,
  Calendar,
  CheckCircle2,
  CreditCard,
  Globe,
  History,
  Lock,
  MapPin,
  Package2,
  Sparkles,
  Wallet,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageContainer } from "@/components/ui/page-container";
import { findConversationForServiceOrder } from "@/lib/services/service-order-conversations";
import { isQuoteSnapshot, isRequestSnapshot } from "@/lib/services/service-order-snapshots";
import { createClient } from "@/lib/supabase/server";

import OrderDetailActions from "../order-detail-actions";
import { getServiceOrderStatusMeta } from "../service-order-status";

interface Props {
  params: Promise<{ id: string }>;
}

function stripVisibleMarkdown(value: string | null | undefined) {
  return String(value || "")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .trim();
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-4">
      <p className="mb-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{label}</p>
      <div className="font-semibold leading-relaxed text-slate-800">{value}</div>
    </div>
  );
}

export default async function ServiceOrderDetailPage(props: Props) {
  const params = await props.params;
  const { id } = params;

  if (!id) {
    return <div className="p-8 text-center text-red-500">Brak identyfikatora zlecenia.</div>;
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth");
  }

  const { data: order, error } = await supabase
    .from("service_orders")
    .select(`
      id,
      created_at,
      status,
      entry_point,
      initiated_by,
      amount,
      counter_amount,
      requirements,
      request_snapshot,
      quote_snapshot,
      company_id,
      package:service_packages!service_orders_package_id_fkey(
        id,
        title,
        description,
        price
      )
    `)
    .eq("id", id)
    .eq("student_id", user.id)
    .single();

  if (error || !order) {
    return (
      <div className="container py-12 text-center">
        <h1 className="mb-4 text-2xl font-bold">Nie znaleziono zlecenia</h1>
        <p className="mb-6 text-slate-500">Prawdopodobnie zostało usuniete lub nie masz do niego dostepu.</p>
        <Link href="/app/services/dashboard">
          <Button>Wroc do pulpitu</Button>
        </Link>
      </div>
    );
  }

  const { data: company } = await supabase.from("company_profiles").select("*").eq("user_id", order.company_id).single();
  const conv = await findConversationForServiceOrder(supabase, {
    serviceOrderId: order.id,
    companyId: order.company_id,
    studentId: user.id,
    packageId: (order.package as { id?: string } | null)?.id ?? null,
  });

  const chatLink = conv ? `/app/chat/${conv.id}` : `/app/chat`;
  const statusInfo = getServiceOrderStatusMeta(order.status);
  const requestSnapshot = isRequestSnapshot(order.request_snapshot) ? order.request_snapshot : null;
  const quoteSnapshot = isQuoteSnapshot(order.quote_snapshot) ? order.quote_snapshot : null;
  const isPrivateProposal = requestSnapshot?.source === "student_private_proposal";

  const displayAmount =
    order.status === "countered" && order.counter_amount
      ? order.counter_amount
      : order.amount;

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_#f8f9ff_0%,_#f3f5ff_35%,_#edf2ff_100%)] pb-24">
      <PageContainer className="pt-6 space-y-8">

        {/* BACK LINK */}
        <Link
          href="/app/services/dashboard"
          className="group inline-flex items-center rounded-full border border-slate-200 bg-white/90 px-5 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-white hover:text-slate-900"
        >
          <ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
          Wróć do listy zleceń
        </Link>

        {/* HERO — status, tytuł, facts, akcje */}
        <div className="relative overflow-hidden rounded-[1.5rem] border border-indigo-100/60 bg-gradient-to-br from-white via-white to-indigo-50/40 p-4 shadow-[0_30px_70px_-40px_rgba(71,85,105,0.3)] sm:rounded-[2rem] sm:p-6 md:p-12">
          <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-indigo-100/50 blur-3xl" />

          {/* Badges row */}
          <div className="mb-5 flex flex-wrap items-center gap-3">
            <span className={`inline-flex items-center rounded-full px-4 py-1.5 text-sm font-black uppercase tracking-widest ${statusInfo.badgeClass}`}>
              {statusInfo.label}
            </span>
            <Badge variant="outline" className="rounded-full border-indigo-200 bg-indigo-50 px-4 py-1.5 text-sm font-medium text-indigo-700">
              {isPrivateProposal ? "Twoja prywatną propozycja" : "Zapytanie od firmy"}
            </Badge>
          </div>

          {/* Title */}
          <h1 className="mb-3 text-3xl font-extrabold tracking-tight text-slate-900 md:text-4xl">
            {(order.package as { title?: string } | null)?.title || "Usunięta usługa"}
          </h1>
          <p className="flex items-center gap-2 text-sm font-medium text-slate-500">
            <Calendar className="h-4 w-4" />
            Otrzymano: {format(new Date(order.created_at), "d MMMM yyyy, HH:mm", { locale: pl })}
          </p>

          {/* Key facts strip */}
          <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4">
            <div className="min-w-0 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:p-4">
              <p className="mb-2 text-[10px] font-black uppercase tracking-normal text-slate-400 sm:tracking-[0.2em]">
                {order.status === "countered" ? "Kontroferta firmy" : "Budżet / wycena"}
              </p>
              <div className="flex items-center gap-2">
                <Wallet className="h-4 w-4 shrink-0 text-indigo-500" />
                <span className="min-w-0 text-lg font-black tabular-nums text-slate-900 sm:text-xl">
                  {displayAmount != null ? `${displayAmount} PLN` : "Do ustalenia"}
                </span>
              </div>
              {order.status === "countered" && typeof order.amount === "number" && order.amount !== order.counter_amount && (
                <p className="mt-1 text-xs text-slate-400">Poprzednio: {order.amount} PLN</p>
              )}
            </div>

            {company && (
              <div className="min-w-0 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:p-4">
                <p className="mb-2 text-[10px] font-black uppercase tracking-normal text-slate-400 sm:tracking-[0.2em]">Zleceniodawca</p>
                <p className="truncate font-bold text-slate-800">{company.nazwa || "Nieznana firma"}</p>
                {company.branza && <p className="mt-0.5 text-xs text-slate-500">{company.branza}</p>}
              </div>
            )}

            <div className="min-w-0 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:p-4">
              <p className="mb-2 text-[10px] font-black uppercase tracking-normal text-slate-400 sm:tracking-[0.2em]">Wybrany pakiet</p>
              <p className="break-words font-bold leading-tight text-slate-800">
                {(order.package as { title?: string } | null)?.title || "—"}
              </p>
              {(order.package as { price?: number } | null)?.price && (
                <p className="mt-0.5 text-xs text-slate-500">
                  Cena bazowa: {(order.package as { price?: number }).price} PLN
                </p>
              )}
            </div>
          </div>

          {/* Counter offer alert */}
          {order.status === "countered" && order.counter_amount ? (
            <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5">
              <div className="mb-1 flex items-center gap-2 font-bold text-amber-900">
                <CreditCard className="h-4 w-4 text-amber-700" />
                Firma wróciła z kontrofertą: {order.counter_amount} PLN
              </div>
              <p className="text-sm text-amber-800 leading-relaxed">
                Możesz zaakceptować tę stawkę lub wrócić do rozmowy na czacie.
              </p>
            </div>
          ) : null}

          {/* Actions */}
          <div className="mt-8 border-t border-slate-100 pt-8">
            <p className="mb-4 text-[10px] font-black uppercase tracking-normal text-slate-400 sm:tracking-[0.2em]">Dostępne akcje</p>
            <OrderDetailActions order={order} chatLink={chatLink} />
          </div>
        </div>

        {/* MAIN GRID */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">

          {/* LEFT — brief & quote history */}
          <div className="space-y-6 lg:col-span-2">

            {/* Brief / Request Details */}
            <div className="overflow-hidden rounded-[2rem] border border-slate-200/70 bg-white shadow-[0_20px_60px_-30px_rgba(15,23,42,0.12)]">
              <div className="border-b border-slate-100 px-8 py-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100">
                    <Package2 className="h-5 w-5 text-indigo-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-extrabold text-slate-900">
                      {isPrivateProposal ? "Szczegóły Twojej propozycji" : "Brief i wymagania zlecenia"}
                    </h2>
                    <p className="text-sm text-slate-500">
                      {isPrivateProposal ? "Dane, które wysłałeś do firmy" : "Zakres i oczekiwania klienta"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4 p-6 md:p-8">
                {requestSnapshot ? (
                  requestSnapshot.source === "student_private_proposal" ? (
                    <div className="space-y-4">
                      <InfoRow label="Cel współpracy" value={requestSnapshot.proposal_goal} />
                      <InfoRow label="Oczekiwany rezultat" value={requestSnapshot.expected_result} />
                      <InfoRow label="Zakres i plan realizacji" value={requestSnapshot.scope_summary} />
                      <div className="grid gap-4 md:grid-cols-2">
                        <InfoRow
                          label="Firma docelowa"
                          value={requestSnapshot.target_company_name || "Firma z historii współpracy"}
                        />
                        <InfoRow
                          label="Twoja propozycja"
                          value={
                            <span>
                              {requestSnapshot.proposed_amount
                                ? `${requestSnapshot.proposed_amount} PLN`
                                : "Do ustalenia"}
                              {requestSnapshot.estimated_timeline_days && (
                                <span className="block text-xs font-medium text-slate-500 mt-1">
                                  {requestSnapshot.estimated_timeline_days} dni realizacji
                                </span>
                              )}
                            </span>
                          }
                        />
                      </div>
                      {requestSnapshot.message && (
                        <InfoRow label="Wiadomość do firmy" value={requestSnapshot.message} />
                      )}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {requestSnapshot.form_answers.length > 0 && (
                        <>
                          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                            Zakres zapytania
                          </p>
                          <div className="space-y-3">
                            {requestSnapshot.form_answers.map((answer) => (
                              <InfoRow
                                key={answer.id}
                                label={answer.label}
                                value={
                                  <span className="whitespace-pre-wrap text-sm">{answer.value}</span>
                                }
                              />
                            ))}
                          </div>
                        </>
                      )}
                      {requestSnapshot.additional_info && (
                        <InfoRow
                          label="Dodatkowe informacje"
                          value={
                            <span className="whitespace-pre-wrap text-sm">{requestSnapshot.additional_info}</span>
                          }
                        />
                      )}
                      <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4">
                        <p className="mb-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                          Kontakt do briefu
                        </p>
                        <p className="font-medium text-slate-800">{requestSnapshot.contact.email}</p>
                        {requestSnapshot.contact.website && (
                          <a
                            href={requestSnapshot.contact.website}
                            rel="noopener noreferrer"
                            target="_blank"
                            className="mt-1 block text-sm text-indigo-600 hover:underline"
                          >
                            {requestSnapshot.contact.website.replace(/^https?:\/\//, "")}
                          </a>
                        )}
                      </div>
                    </div>
                  )
                ) : (
                  <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-5">
                    <p className="whitespace-pre-wrap text-sm font-medium leading-relaxed text-slate-700">
                      {stripVisibleMarkdown(order.requirements) || "Brak dodatkowych wymagań od klienta."}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Quote history */}
            {quoteSnapshot?.student_offer || quoteSnapshot?.company_counter || quoteSnapshot?.accepted_amount ? (
              <div className="overflow-hidden rounded-[2rem] border border-slate-200/70 bg-white shadow-[0_20px_60px_-30px_rgba(15,23,42,0.12)]">
                <div className="border-b border-slate-100 px-8 py-6">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100">
                      <History className="h-5 w-5 text-violet-600" />
                    </div>
                    <div>
                      <h2 className="text-lg font-extrabold text-slate-900">Historia wyceny</h2>
                      <p className="text-sm text-slate-500">Przebieg negocjacji cenowych</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-3 p-6 md:p-8">
                  {quoteSnapshot.student_offer && (
                    <div className="flex items-center justify-between rounded-2xl border border-indigo-100 bg-indigo-50/50 p-4">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-500">Twoja oferta</p>
                        <p className="mt-1 text-lg font-black text-slate-900">{quoteSnapshot.student_offer.amount} PLN</p>
                        {quoteSnapshot.student_offer.message && (
                          <p className="mt-1 text-xs text-slate-500">{quoteSnapshot.student_offer.message}</p>
                        )}
                      </div>
                    </div>
                  )}
                  {quoteSnapshot.company_counter && (
                    <div className="flex items-center justify-between rounded-2xl border border-amber-100 bg-amber-50/50 p-4">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-600">Kontroferta firmy</p>
                        <p className="mt-1 text-lg font-black text-slate-900">{quoteSnapshot.company_counter.amount} PLN</p>
                      </div>
                    </div>
                  )}
                  {quoteSnapshot.accepted_amount && (
                    <div className="flex items-center justify-between rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600">Uzgodniona kwota</p>
                        <p className="mt-1 text-lg font-black text-slate-900">{quoteSnapshot.accepted_amount} PLN</p>
                      </div>
                      <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                    </div>
                  )}
                </div>
              </div>
            ) : null}
          </div>

          {/* RIGHT SIDEBAR — company + prywatną propozycja info */}
          <div className="space-y-6">

            {/* Company card */}
            <div className="overflow-hidden rounded-[2rem] border border-slate-200/70 bg-white shadow-[0_20px_60px_-30px_rgba(15,23,42,0.12)]">
              <div className="border-b border-slate-100 px-6 py-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100">
                    <Building2 className="h-4 w-4 text-slate-600" />
                  </div>
                  <h3 className="font-extrabold text-slate-900">Zleceniodawca</h3>
                </div>
              </div>
              <div className="p-6 space-y-4">
                <Link href={`/app/companies/${order.company_id}`} className="group block">
                  <div className="text-lg font-bold text-slate-900 transition-colors group-hover:text-indigo-600">
                    {company?.nazwa || "Nieznana firma"}
                  </div>
                  <div className="text-xs text-slate-400 group-hover:underline">Zobacz profil firmy →</div>
                </Link>
                {company?.branza && (
                  <p className="text-sm font-medium text-slate-600">{company.branza}</p>
                )}
                <div className="space-y-2.5 text-sm pt-2 border-t border-slate-50">
                  {(company?.city || company?.address) && (
                    <div className="flex items-start gap-2 text-slate-600">
                      <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                      <span>{company.city || ""}{company.address ? `, ${company.address}` : ""}</span>
                    </div>
                  )}
                  {company?.website && (
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4 shrink-0 text-slate-400" />
                      <a
                        href={company.website}
                        rel="noopener noreferrer"
                        target="_blank"
                        className="truncate text-indigo-600 hover:underline text-sm"
                      >
                        {company.website.replace(/^https?:\/\//, "")}
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Private proposal info */}
            {isPrivateProposal && (
              <div className="rounded-[2rem] border border-indigo-100 bg-indigo-50/60 p-6">
                <div className="mb-3 flex items-center gap-2 font-bold text-slate-900">
                  <Sparkles className="h-4 w-4 text-indigo-600" />
                  Inicjatywa wyszła od Ciebie
                </div>
                <p className="text-sm leading-relaxed text-slate-600">
                  To Ty wysłałeś tę propozycję bez publicznego ogłoszenia. Dalszy flow po akceptacji pozostaje taki sam jak przy zwykłym zamówieniu usługi.
                </p>
              </div>
            )}

            {/* Private details lock info */}
            {!isPrivateProposal && (
              <div className="rounded-[2rem] border border-slate-100 bg-slate-50/80 p-6">
                <div className="mb-3 flex items-center gap-2 font-bold text-slate-700">
                  <Lock className="h-4 w-4 text-slate-400" />
                  Informacje dla wykonawcy
                </div>
                <p className="text-sm leading-relaxed text-slate-500">
                  Szczegółowe instrukcje, linki i materiały prywatne pojawią się tu po zaakceptowaniu zlecenia i przejściu do panelu realizacji.
                </p>
              </div>
            )}
          </div>
        </div>
      </PageContainer>
    </main>
  );
}
