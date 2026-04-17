import Link from "next/link";
import { redirect } from "next/navigation";
import { format } from "date-fns";
import { pl } from "date-fns/locale";
import { ArrowLeft, Building2, Calendar, CreditCard, Globe, Mail, MapPin, Package2, Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { findConversationForServiceOrder } from "@/lib/services/service-order-conversations";
import { isQuoteSnapshot, isRequestSnapshot } from "@/lib/services/service-order-snapshots";
import { createClient } from "@/lib/supabase/server";

import OrderDetailActions from "../order-detail-actions";
import { getServiceOrderStatusMeta } from "../service-order-status";

interface Props {
  params: Promise<{ id: string }>;
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
        <p className="mb-6 text-slate-500">Prawdopodobnie zostalo usuniete lub nie masz do niego dostepu.</p>
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

  return (
    <div className="container max-w-5xl space-y-8 py-8">
      <div className="flex flex-col gap-4">
        <Link href="/app/services/dashboard" className="flex w-fit items-center gap-1 text-sm text-slate-500 hover:text-slate-900">
          <ArrowLeft className="h-4 w-4" />
          Wroc do listy zlecen
        </Link>

        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="mb-2 flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-bold text-slate-900">{(order.package as { title?: string } | null)?.title || "Usunieta usluga"}</h1>
              <Badge className={`${statusInfo.badgeClass} border-0`}>{statusInfo.label}</Badge>
              <Badge variant="outline" className="border-indigo-200 bg-indigo-50 text-indigo-700">
                {isPrivateProposal ? "Twoja prywatna propozycja" : "Zapytanie od firmy"}
              </Badge>
            </div>
            <p className="flex items-center gap-2 text-slate-500">
              <Calendar className="h-4 w-4" />
              Otrzymano: {format(new Date(order.created_at), "d MMMM yyyy, HH:mm", { locale: pl })}
            </p>
          </div>

          <OrderDetailActions order={order} chatLink={chatLink} />
        </div>
      </div>

      <Separator />

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardContent className="space-y-4 p-6">
              <h2 className="flex items-center gap-2 text-lg font-semibold">
                <Package2 className="h-5 w-5 text-indigo-600" />
                {isPrivateProposal ? "Szczegoly prywatnej propozycji" : "Szczegoly zlecenia"}
              </h2>

              {order.status === "countered" && order.counter_amount ? (
                <div className="rounded-2xl border border-orange-200 bg-orange-50 p-4 text-sm text-orange-900">
                  <p className="font-bold">Firma wrocila z kontroferta: {order.counter_amount} PLN.</p>
                  <p className="mt-1 text-orange-800">Mozesz ja zaakceptowac, odrzucic albo wrocic do rozmowy na czacie.</p>
                </div>
              ) : null}

              {requestSnapshot ? (
                requestSnapshot.source === "student_private_proposal" ? (
                  <div className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-700">
                    <div className="space-y-2">
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Cel wspolpracy</p>
                      <div className="rounded-xl border border-slate-200 bg-white p-4 font-medium leading-relaxed text-slate-700">
                        {requestSnapshot.proposal_goal}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Oczekiwany rezultat</p>
                      <div className="rounded-xl border border-slate-200 bg-white p-4 font-medium leading-relaxed text-slate-700">
                        {requestSnapshot.expected_result}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Zakres i plan realizacji</p>
                      <div className="rounded-xl border border-slate-200 bg-white p-4 font-medium leading-relaxed text-slate-700">
                        {requestSnapshot.scope_summary}
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="rounded-xl border border-slate-200 bg-white p-4">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Firma docelowa</p>
                        <p className="mt-2 font-semibold text-slate-900">{requestSnapshot.target_company_name || "Firma z historii wspolpracy"}</p>
                      </div>
                      <div className="rounded-xl border border-slate-200 bg-white p-4">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Twoja propozycja</p>
                        <p className="mt-2 font-semibold text-slate-900">
                          {requestSnapshot.proposed_amount ? `${requestSnapshot.proposed_amount} PLN` : "Do ustalenia"}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {requestSnapshot.estimated_timeline_days ? `${requestSnapshot.estimated_timeline_days} dni realizacji` : "Termin do ustalenia"}
                        </p>
                      </div>
                    </div>

                    {requestSnapshot.message ? (
                      <div className="space-y-2">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Wiadomosc do firmy</p>
                        <div className="rounded-xl border border-slate-200 bg-white p-4 font-medium leading-relaxed text-slate-700">
                          {requestSnapshot.message}
                        </div>
                      </div>
                    ) : null}
                  </div>
                ) : (
                  <div className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-700">
                    <div className="space-y-1">
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Kontakt do briefu</p>
                      <p className="font-medium text-slate-900">{requestSnapshot.contact.email}</p>
                      {requestSnapshot.contact.website ? (
                        <a
                          href={requestSnapshot.contact.website}
                          rel="noopener noreferrer"
                          target="_blank"
                          className="text-indigo-600 hover:underline"
                        >
                          {requestSnapshot.contact.website.replace(/^https?:\/\//, "")}
                        </a>
                      ) : null}
                    </div>

                    {requestSnapshot.form_answers.length > 0 ? (
                      <div className="space-y-3">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Zakres zapytania</p>
                        <div className="space-y-3">
                          {requestSnapshot.form_answers.map((answer) => (
                            <div key={answer.id} className="rounded-xl border border-slate-200 bg-white p-4">
                              <p className="text-xs font-black uppercase tracking-widest text-slate-400">{answer.label}</p>
                              <p className="mt-2 whitespace-pre-wrap font-medium leading-relaxed text-slate-700">{answer.value}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null}

                    {requestSnapshot.additional_info ? (
                      <div className="space-y-2">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Dodatkowe informacje</p>
                        <div className="whitespace-pre-wrap rounded-xl border border-slate-200 bg-white p-4 font-medium leading-relaxed text-slate-700">
                          {requestSnapshot.additional_info}
                        </div>
                      </div>
                    ) : null}
                  </div>
                )
              ) : (
                <div className="whitespace-pre-wrap rounded-lg border bg-slate-50 p-4 font-mono text-sm leading-relaxed text-slate-700">
                  {order.requirements || "Brak dodatkowych wymagan od klienta."}
                </div>
              )}

              <div className="mt-2 flex items-center gap-2 text-sm text-slate-500">
                <CreditCard className="h-4 w-4" />
                <span>Budzet / wycena:</span>
                <span className="font-semibold text-slate-900">
                  {order.status === "countered" && order.counter_amount
                    ? `${order.counter_amount} PLN`
                    : order.amount
                      ? `${order.amount} PLN`
                      : "Nie ustalono (zalezne od wyceny)"}
                </span>
              </div>

              {order.status === "countered" &&
              typeof order.amount === "number" &&
              order.amount !== order.counter_amount ? (
                <p className="text-sm text-slate-500">Twoja poprzednia propozycja wynosila {order.amount} PLN.</p>
              ) : null}

              {quoteSnapshot?.student_offer || quoteSnapshot?.company_counter || quoteSnapshot?.accepted_amount ? (
                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Historia wyceny</p>
                  <div className="mt-3 space-y-2 text-sm text-slate-600">
                    {quoteSnapshot.student_offer ? (
                      <p>
                        Twoja oferta: <span className="font-semibold text-slate-900">{quoteSnapshot.student_offer.amount} PLN</span>
                        {quoteSnapshot.student_offer.message ? ` • ${quoteSnapshot.student_offer.message}` : ""}
                      </p>
                    ) : null}
                    {quoteSnapshot.company_counter ? (
                      <p>
                        Kontroferta firmy: <span className="font-semibold text-slate-900">{quoteSnapshot.company_counter.amount} PLN</span>
                      </p>
                    ) : null}
                    {quoteSnapshot.accepted_amount ? (
                      <p>
                        Uzgodniona kwota: <span className="font-semibold text-slate-900">{quoteSnapshot.accepted_amount} PLN</span>
                      </p>
                    ) : null}
                  </div>
                </div>
              ) : null}
            </CardContent>
          </Card>

          {order.package ? (
            <div className="rounded-lg border bg-white p-6 text-sm text-slate-600">
              <h3 className="mb-2 font-semibold text-slate-900">Dotyczy Twojej uslugi</h3>
              <p className="italic text-slate-500">{(order.package as { description?: string } | null)?.description || "Brak opisu uslugi."}</p>
              <p className="mt-2 font-medium">Cena bazowa w katalogu: {(order.package as { price?: number } | null)?.price} PLN</p>
            </div>
          ) : null}
        </div>

        <div className="space-y-6">
          <Card className="border-sky-100 bg-sky-50 shadow-sm">
            <CardContent className="space-y-6 p-6">
              <div>
                <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-900">
                  <Building2 className="h-4 w-4 text-indigo-600" />
                  Zleceniodawca
                </h3>

                <div className="mb-4">
                  <Link href={`/app/companies/${order.company_id}`} className="group block">
                    <div className="text-lg font-bold text-slate-900 transition-colors group-hover:text-indigo-600">
                      {company?.nazwa || "Nieznana firma"}
                    </div>
                    <div className="text-xs text-slate-500 group-hover:underline">Zobacz profil firmy →</div>
                  </Link>
                  <div className="mt-1 text-sm text-slate-600">{company?.branza || "Brak branzy"}</div>
                </div>

                <div className="space-y-3 text-sm">
                  <div className="flex items-start gap-2">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                    <span>
                      {company?.city || "Brak miasta"}
                      {company?.address ? `, ${company.address}` : ""}
                    </span>
                  </div>
                  {company?.website ? (
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4 shrink-0 text-slate-400" />
                      <a href={company.website} rel="noopener noreferrer" target="_blank" className="truncate text-indigo-600 hover:underline">
                        {company.website.replace(/^https?:\/\//, "")}
                      </a>
                    </div>
                  ) : null}
                </div>
              </div>

              {isPrivateProposal ? (
                <div className="rounded-2xl border border-sky-200 bg-white p-4 text-sm text-slate-600">
                  <div className="mb-2 flex items-center gap-2 font-semibold text-slate-900">
                    <Sparkles className="h-4 w-4 text-indigo-600" />
                    Inicjatywa wyszla od Ciebie
                  </div>
                  <p className="leading-relaxed">
                    To Ty wyslales te propozycje bez publicznego ogloszenia. Dalszy flow po akceptacji pozostaje taki sam jak
                    przy zwyklym zamowieniu uslugi.
                  </p>
                </div>
              ) : null}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
