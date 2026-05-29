/* eslint-disable @typescript-eslint/no-explicit-any */
import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { format } from "date-fns";
import { pl } from "date-fns/locale";
import {
  ArrowLeft,
  Calendar,
  Clock3,
  CreditCard,
  ExternalLink,
  Globe,
  Mail,
  Package2,
  Sparkles,
  UserRound,
} from "lucide-react";

import { selectCompanyOrderStudentAction } from "@/app/app/services/_actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageContainer } from "@/components/ui/page-container";
import {
  fetchAvailableLogoStudents,
  LOGO_PACKAGE_ID,
  type LogoStudentCandidate,
} from "@/lib/services/logo-student-selection";
import { findConversationForServiceOrder } from "@/lib/services/service-order-conversations";
import { isQuoteSnapshot, isRequestSnapshot } from "@/lib/services/service-order-snapshots";
import { createClient } from "@/lib/supabase/server";

import CompanyOrderDetailActions from "./company-order-detail-actions";
import { getCompanyOrderStatusMeta } from "../company-order-status";

interface Props {
  params: Promise<{ id: string }>;
}

function toPlainPreview(value: string | null | undefined, maxLength = 320): string {
  if (!value) return "";

  const normalized = value
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/^\s*[-*+]\s+/gm, "")
    .replace(/^\s*\d+\.\s+/gm, "")
    .replace(/\|/g, " ")
    .replace(/\*\*/g, "")
    .replace(/\*/g, "")
    .replace(/\s+/g, " ")
    .trim();

  if (normalized.length <= maxLength) return normalized;
  return `${normalized.slice(0, maxLength - 1).trimEnd()}...`;
}

function isAssignedStudent(studentId: unknown): studentId is string {
  return typeof studentId === "string" && studentId.length > 0;
}

type LegacyRequirementSection = "contact" | "details" | "additional" | null;

type LegacyRequirementDetails = {
  contact: {
    email: string | null;
    website: string | null;
    other: Array<{ label: string; value: string }>;
  };
  answers: Array<{ label: string; value: string }>;
  additional: string | null;
  raw: string;
};

function normalizeLegacyHeader(value: string): LegacyRequirementSection {
  const normalized = value
    .replace(/[=]/g, "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  if (normalized.includes("dane kontaktowe")) return "contact";
  if (normalized.includes("szczegoly zlecenia")) return "details";
  if (normalized.includes("dodatkowe informacje")) return "additional";

  return null;
}

function parseLabelValue(line: string) {
  const separatorIndex = line.indexOf(":");
  if (separatorIndex === -1) return null;

  const label = line.slice(0, separatorIndex).trim();
  const value = line.slice(separatorIndex + 1).trim();

  if (!label || !value) return null;
  return { label, value };
}

function parseLegacyRequirements(requirements: string | null | undefined): LegacyRequirementDetails | null {
  const raw = requirements?.trim();
  if (!raw) return null;

  const result: LegacyRequirementDetails = {
    contact: {
      email: null,
      website: null,
      other: [],
    },
    answers: [],
    additional: null,
    raw,
  };
  let currentSection: LegacyRequirementSection = null;
  const additionalLines: string[] = [];

  raw.split(/\r?\n/).forEach((rawLine) => {
    const line = rawLine.trim();
    if (!line) return;

    if (/^=+.*=+$/.test(line)) {
      currentSection = normalizeLegacyHeader(line);
      return;
    }

    if (currentSection === "additional") {
      additionalLines.push(line);
      return;
    }

    const pair = parseLabelValue(line);
    if (!pair) {
      if (currentSection === "details") {
        result.answers.push({ label: "Informacja", value: line });
      }
      return;
    }

    const normalizedLabel = pair.label
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");

    if (currentSection === "contact") {
      if (normalizedLabel === "email") {
        result.contact.email = pair.value;
        return;
      }
      if (normalizedLabel === "www" || normalizedLabel.includes("strona")) {
        result.contact.website = pair.value;
        return;
      }
      result.contact.other.push(pair);
      return;
    }

    result.answers.push(pair);
  });

  result.additional = additionalLines.join("\n").trim() || null;

  if (!result.contact.email && !result.contact.website && result.contact.other.length === 0 && result.answers.length === 0 && !result.additional) {
    return null;
  }

  return result;
}

function SelectionCard({
  candidate,
  orderId,
}: {
  candidate: LogoStudentCandidate;
  orderId: string;
}) {
  return (
    <div className="group relative flex flex-col rounded-[2rem] border border-slate-100 bg-white p-6 shadow-xl shadow-slate-200/50 transition-all duration-500 hover:-translate-y-1 hover:shadow-2xl hover:shadow-indigo-500/10">
      <div className="flex items-start gap-4 mb-4">
        <div className="relative flex h-14 w-14 flex-shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100">
          {candidate.avatarUrl ? (
            <Image src={candidate.avatarUrl} alt={candidate.displayName} fill sizes="56px" className="object-cover" />
          ) : (
            <UserRound className="h-7 w-7 text-indigo-400" />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-lg font-black text-slate-900 group-hover:text-indigo-600 transition-colors">{candidate.displayName}</p>
          <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400 font-bold mt-0.5">
            Aktywne zlecenia: {candidate.activeOrders}
          </p>
        </div>
      </div>

      {candidate.bio ? (
        <p className="mb-4 line-clamp-2 text-sm font-medium text-slate-500 leading-relaxed">
          {candidate.bio}
        </p>
      ) : (
        <p className="mb-4 text-sm italic text-slate-400">Student dostępny do realizacji projektu logo.</p>
      )}

      {candidate.portfolioPreview.length > 0 ? (
        <div className="mb-5 grid grid-cols-3 gap-2">
          {candidate.portfolioPreview.map((url, idx) => (
            <div key={`${candidate.userId}-${idx}`} className="relative aspect-square overflow-hidden rounded-xl border border-slate-100 bg-slate-50 shadow-sm">
              <Image src={url} alt={`Portfolio ${idx + 1}`} fill sizes="120px" className="object-cover" />
            </div>
          ))}
        </div>
      ) : (
        <div className="mb-5 rounded-xl border border-dashed border-slate-200 bg-slate-50 px-3 py-4 text-center text-xs text-slate-400 font-medium">
          Brak miniatur portfolio
        </div>
      )}

      <div className="mt-auto flex flex-wrap gap-3 pt-4 border-t border-slate-50">
        <form action={selectCompanyOrderStudentAction}>
          <input type="hidden" name="orderId" value={orderId} />
          <input type="hidden" name="studentId" value={candidate.userId} />
          <Button type="submit" className="bg-indigo-600 text-white hover:bg-indigo-700 rounded-2xl font-bold h-10 px-5">
            Wybierz studenta
          </Button>
        </form>

        <Button asChild variant="outline" className="rounded-2xl border-slate-200 font-bold h-10 px-5 hover:border-indigo-200 hover:text-indigo-600">
          <Link href={`/app/students/${candidate.userId}`}>
            Profil studenta
          </Link>
        </Button>
      </div>
    </div>
  );
}

export default async function CompanyOrderDetailPage(props: Props) {
  const params = await props.params;
  const { id } = params;

  if (!id) {
    return <div className="p-8 text-center text-red-500">Brak identyfikatora zamówienia.</div>;
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
      student_id,
      package:service_packages!service_orders_package_id_fkey(
        id,
        title,
        description,
        price
      )
    `)
    .eq("id", id)
    .eq("company_id", user.id)
    .single();

  if (error || !order) {
    return (
      <div className="mx-auto w-full max-w-[900px] px-4 py-12 text-center sm:px-6">
        <h1 className="mb-4 text-2xl font-black text-slate-900">Nie znaleziono zamówienia</h1>
        <p className="mb-6 font-medium text-slate-500">Prawdopodobnie zostało usunięte albo nie masz do niego dostępu.</p>
        <Button asChild className="rounded-2xl bg-indigo-600 text-white hover:bg-indigo-700 font-bold h-11 px-6">
          <Link href="/app/company/orders">Wróć do panelu zamówień</Link>
        </Button>
      </div>
    );
  }

  const packageId = (order.package as { id?: string } | null)?.id ?? null;
  const hasStudentAssigned = isAssignedStudent(order.student_id);
  const isLogoOrder = packageId === LOGO_PACKAGE_ID;
  const isPendingSelection = isLogoOrder && !hasStudentAssigned && ["pending_selection", "pending"].includes(order.status);
  const isPendingStudentConfirmation =
    hasStudentAssigned && ["pending_student_confirmation", "pending_confirmation"].includes(order.status);

  const { data: student } = hasStudentAssigned
    ? await supabase.from("student_profiles").select("*").eq("user_id", order.student_id).maybeSingle()
    : { data: null };

  const conv = hasStudentAssigned
    ? await findConversationForServiceOrder(supabase, {
        serviceOrderId: order.id,
        companyId: user.id,
        studentId: order.student_id,
        packageId,
      })
    : null;

  const availableStudents = isPendingSelection
    ? await fetchAvailableLogoStudents(supabase, { maxActiveOrders: 1 })
    : [];

  const chatLink = conv ? `/app/chat/${conv.id}` : "/app/chat";
  const statusInfo = getCompanyOrderStatusMeta(order.status);
  const requestSnapshot = isRequestSnapshot(order.request_snapshot) ? order.request_snapshot : null;
  const legacyRequirements = requestSnapshot ? null : parseLegacyRequirements(order.requirements);
  const quoteSnapshot = isQuoteSnapshot(order.quote_snapshot) ? order.quote_snapshot : null;
  const isPrivateProposal = requestSnapshot?.source === "student_private_proposal";
  const packageTitle = (order.package as { title?: string } | null)?.title || "Usługa archiwalna";
  const packageDescriptionPreview = toPlainPreview(
    (order.package as { description?: string } | null)?.description ?? null,
    300,
  );
  const requestPackageTitle = requestSnapshot?.package_title?.trim() || "";
  const serviceDisplayTitle = requestPackageTitle.length > 0 ? requestPackageTitle : packageTitle;
  const serviceVariantLabel = requestPackageTitle.includes(" - ")
    ? requestPackageTitle.split(" - ").slice(1).join(" - ").trim()
    : null;

  const activeAmount = order.status === "countered" && order.counter_amount
    ? order.counter_amount
    : order.amount;

  return (
    <main className="pb-20">
      {/* Hero */}
      <div className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 px-4 pt-8 pb-16 sm:px-6 xl:px-8">
        <div className="mx-auto max-w-[1400px]">
          <Link
            href="/app/company/orders"
            className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-bold text-white/80 transition-colors hover:bg-white/20 hover:text-white mb-8"
          >
            <ArrowLeft className="h-4 w-4" />
            Wróć do panelu zamówień
          </Link>

          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <Badge className={`${statusInfo.badgeClass} border-0 text-xs font-black uppercase tracking-widest px-3 py-1 rounded-full`}>
                  {statusInfo.label}
                </Badge>
                <Badge className="rounded-full border border-indigo-400/30 bg-indigo-500/20 px-3 py-1 text-xs font-bold text-indigo-200 uppercase tracking-widest">
                  {isPrivateProposal ? "Prywatna propozycja" : "Zapytanie firmy"}
                </Badge>
              </div>
              <h1 className="text-3xl font-black tracking-tight text-white md:text-4xl">
                {serviceDisplayTitle}
              </h1>
              <p className="flex items-center gap-2 text-sm font-medium text-slate-400">
                <Calendar className="h-4 w-4" />
                Zamówienie z dnia {format(new Date(order.created_at), "d MMMM yyyy, HH:mm", { locale: pl })}
              </p>
            </div>

            <div className="shrink-0">
              <CompanyOrderDetailActions order={order} chatLink={chatLink} canMessage={hasStudentAssigned} />
            </div>
          </div>

          {/* Key facts strip */}
          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-white/5 px-5 py-4 backdrop-blur-sm">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Kwota</p>
              <p className="mt-1 text-xl font-black text-white tabular-nums">
                {activeAmount ? `${activeAmount} PLN` : "—"}
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 px-5 py-4 backdrop-blur-sm">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Wykonawca</p>
              <p className="mt-1 text-base font-bold text-white truncate">
                {hasStudentAssigned ? (student?.public_name || "Student") : "Nie przypisano"}
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 px-5 py-4 backdrop-blur-sm col-span-2 sm:col-span-1">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Status</p>
              <p className="mt-1 text-base font-bold text-white">{statusInfo.label}</p>
            </div>
          </div>
        </div>
      </div>

      <PageContainer className="space-y-8 -mt-8">
        <div className="grid grid-cols-1 gap-8 xl:grid-cols-[minmax(0,1.75fr)_minmax(340px,1fr)]">
          {/* Main column */}
          <div className="space-y-6">
            {isPendingSelection ? (
              <div className="rounded-[2rem] border border-amber-200 bg-amber-50 p-6 shadow-xl shadow-amber-500/5">
                <div className="mb-5 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-100">
                    <Clock3 className="h-5 w-5 text-amber-600" />
                  </div>
                  <div>
                    <h2 className="text-base font-black text-slate-900">Wybierz studenta do realizacji logo</h2>
                    <p className="text-xs font-medium text-amber-700">Masz 48h na wybór wykonawcy</p>
                  </div>
                </div>
                <p className="mb-5 text-sm font-medium text-slate-600 leading-relaxed">
                  Ten etap jest wymagany dla projektu logo. Po 72h platforma może uruchomić fallback automatyczny.
                </p>
                <p className="mb-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                  Dostępni kandydaci: {availableStudents.length}
                </p>

                {availableStudents.length > 0 ? (
                  <div className="grid gap-4 md:grid-cols-2">
                    {availableStudents.map((candidate) => (
                      <SelectionCard key={candidate.userId} candidate={candidate} orderId={order.id} />
                    ))}
                  </div>
                ) : (
                  <div className="rounded-2xl border border-dashed border-amber-300 bg-white p-6 text-sm font-medium text-slate-600">
                    Brak studentów spełniających kryteria (portfolio min. 3 i maks. 1 aktywne zlecenie). Spróbuj ponownie za chwilę.
                  </div>
                )}
              </div>
            ) : null}

            {/* Brief / request card */}
            <div className="rounded-[2rem] border border-slate-100 bg-white p-8 shadow-xl shadow-slate-200/50">
              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-50">
                  <Package2 className="h-5 w-5 text-indigo-600" />
                </div>
                <h2 className="text-lg font-black text-slate-900">
                  {isPrivateProposal ? "Propozycja współpracy od studenta" : "Brief i zakres współpracy"}
                </h2>
              </div>

              {requestSnapshot ? (
                requestSnapshot.source === "student_private_proposal" ? (
                  <div className="space-y-4 text-sm text-slate-700">
                    {[
                      { label: "Cel współpracy", value: requestSnapshot.proposal_goal },
                      { label: "Oczekiwany rezultat", value: requestSnapshot.expected_result },
                      { label: "Zakres i plan realizacji", value: requestSnapshot.scope_summary },
                    ].map(({ label, value }) =>
                      value ? (
                        <div key={label} className="rounded-2xl border border-slate-100 bg-slate-50 p-5">
                          <p className="mb-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{label}</p>
                          <p className="font-medium leading-relaxed text-slate-700">{value as string}</p>
                        </div>
                      ) : null,
                    )}

                    <div className="grid gap-3 md:grid-cols-2">
                      <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5">
                        <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-slate-400">Szacowany czas</p>
                        <p className="font-bold text-slate-900">
                          {requestSnapshot.estimated_timeline_days ? `${requestSnapshot.estimated_timeline_days} dni` : "Do ustalenia"}
                        </p>
                      </div>
                      <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5">
                        <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-slate-400">Proponowana kwota</p>
                        <p className="font-bold text-slate-900">
                          {requestSnapshot.proposed_amount ? `${requestSnapshot.proposed_amount} PLN` : "Do ustalenia"}
                        </p>
                      </div>
                    </div>

                    {requestSnapshot.message ? (
                      <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5">
                        <p className="mb-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Wiadomość od studenta</p>
                        <p className="font-medium leading-relaxed text-slate-700">{requestSnapshot.message}</p>
                      </div>
                    ) : null}
                  </div>
                ) : (
                  <div className="space-y-4 text-sm text-slate-700">
                    <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5">
                      <p className="mb-3 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Kontakt do briefu</p>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 font-medium text-slate-900">
                          <Mail className="h-4 w-4 text-indigo-500" />
                          {requestSnapshot.contact.email}
                        </div>
                        {requestSnapshot.contact.website ? (
                          <a
                            href={requestSnapshot.contact.website}
                            rel="noopener noreferrer"
                            target="_blank"
                            className="inline-flex items-center gap-2 font-medium text-indigo-600 hover:underline"
                          >
                            <Globe className="h-4 w-4" />
                            {requestSnapshot.contact.website.replace(/^https?:\/\//, "")}
                          </a>
                        ) : null}
                      </div>
                    </div>

                    {requestSnapshot.form_answers.length > 0 ? (
                      <div className="space-y-3">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Odpowiedzi z briefu</p>
                        <div className="space-y-3">
                          {requestSnapshot.form_answers.map((answer: any) => (
                            <div key={answer.id} className="rounded-2xl border border-slate-100 bg-slate-50 p-5">
                              <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-slate-400">{answer.label}</p>
                              <p className="whitespace-pre-wrap font-medium leading-relaxed text-slate-700">{answer.value}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null}

                    {requestSnapshot.additional_info ? (
                      <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5">
                        <p className="mb-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Dodatkowe informacje</p>
                        <p className="whitespace-pre-wrap font-medium leading-relaxed text-slate-700">{requestSnapshot.additional_info}</p>
                      </div>
                    ) : null}
                  </div>
                )
              ) : legacyRequirements ? (
                <div className="space-y-5 text-sm text-slate-700">
                  {(legacyRequirements.contact.email || legacyRequirements.contact.website || legacyRequirements.contact.other.length > 0) ? (
                    <div className="rounded-3xl border border-indigo-100 bg-indigo-50/40 p-5">
                      <p className="mb-4 text-[10px] font-black uppercase tracking-[0.2em] text-indigo-500">Kontakt do briefu</p>
                      <div className="grid gap-3 sm:grid-cols-2">
                        {legacyRequirements.contact.email ? (
                          <div className="rounded-2xl border border-white bg-white p-4">
                            <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-slate-400">Email</p>
                            <p className="break-words font-bold text-slate-900">{legacyRequirements.contact.email}</p>
                          </div>
                        ) : null}
                        {legacyRequirements.contact.website ? (
                          <div className="rounded-2xl border border-white bg-white p-4">
                            <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-slate-400">WWW</p>
                            <a
                              href={legacyRequirements.contact.website}
                              rel="noopener noreferrer"
                              target="_blank"
                              className="break-words font-bold text-indigo-600 hover:underline"
                            >
                              {legacyRequirements.contact.website.replace(/^https?:\/\//, "")}
                            </a>
                          </div>
                        ) : null}
                        {legacyRequirements.contact.other.map((item) => (
                          <div key={item.label} className="rounded-2xl border border-white bg-white p-4">
                            <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-slate-400">{item.label}</p>
                            <p className="break-words font-bold text-slate-900">{item.value}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  {legacyRequirements.answers.length > 0 ? (
                    <div className="rounded-3xl border border-slate-100 bg-slate-50/80 p-5">
                      <p className="mb-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Odpowiedzi z briefu</p>
                      <div className="grid gap-3 md:grid-cols-2">
                        {legacyRequirements.answers.map((answer) => (
                          <div key={`${answer.label}-${answer.value}`} className="rounded-2xl border border-slate-100 bg-white p-4">
                            <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-slate-400">{answer.label}</p>
                            <p className="whitespace-pre-wrap break-words font-bold leading-relaxed text-slate-900">{answer.value}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  {legacyRequirements.additional ? (
                    <div className="rounded-3xl border border-slate-100 bg-slate-50 p-5">
                      <p className="mb-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Dodatkowe informacje</p>
                      <p className="whitespace-pre-wrap font-medium leading-relaxed text-slate-700">{legacyRequirements.additional}</p>
                    </div>
                  ) : null}
                </div>
              ) : (
                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5">
                  <p className="whitespace-pre-wrap font-medium leading-relaxed text-slate-700">
                    {order.requirements || "Brak dodatkowych wymagań."}
                  </p>
                </div>
              )}

              {/* Budget line */}
              <div className="mt-5 flex items-center gap-2 rounded-2xl border border-slate-100 bg-slate-50 p-4 text-sm">
                <CreditCard className="h-4 w-4 text-indigo-500" />
                <span className="font-medium text-slate-500">Budżet / wycena:</span>
                <span className="font-black text-slate-900">
                  {activeAmount ? `${activeAmount} PLN` : "Nie ustalono"}
                </span>
              </div>

              {/* Quote history */}
              {quoteSnapshot?.student_offer || quoteSnapshot?.company_counter || quoteSnapshot?.accepted_amount ? (
                <div className="mt-4 rounded-2xl border border-slate-100 bg-slate-50 p-5">
                  <p className="mb-3 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Historia wyceny</p>
                  <div className="space-y-2 text-sm">
                    {quoteSnapshot.student_offer ? (
                      <div className="flex items-center justify-between rounded-xl border border-indigo-100 bg-white px-4 py-3">
                        <span className="font-medium text-slate-500">Oferta studenta</span>
                        <span className="font-black text-indigo-700">{quoteSnapshot.student_offer.amount} PLN</span>
                      </div>
                    ) : null}
                    {quoteSnapshot.company_counter ? (
                      <div className="flex items-center justify-between rounded-xl border border-amber-100 bg-white px-4 py-3">
                        <span className="font-medium text-slate-500">Twoja kontroferta</span>
                        <span className="font-black text-amber-700">{quoteSnapshot.company_counter.amount} PLN</span>
                      </div>
                    ) : null}
                    {quoteSnapshot.accepted_amount ? (
                      <div className="flex items-center justify-between rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3">
                        <span className="font-medium text-slate-500">Uzgodniona kwota</span>
                        <span className="font-black text-emerald-700">{quoteSnapshot.accepted_amount} PLN</span>
                      </div>
                    ) : null}
                  </div>
                </div>
              ) : null}
            </div>

            {/* Selected service card */}
            {order.package ? (
              <div className="rounded-[2rem] border border-slate-100 bg-white p-8 shadow-xl shadow-slate-200/50">
                <h3 className="mb-5 text-base font-black text-slate-900">Wybrana usługa</h3>
                <div className="space-y-4 rounded-2xl border border-slate-100 bg-slate-50 p-5 text-sm">
                  <div>
                    <p className="mb-1 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Nazwa</p>
                    <p className="font-bold text-slate-900">{serviceDisplayTitle}</p>
                  </div>
                  {serviceVariantLabel ? (
                    <div>
                      <p className="mb-1 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Wariant</p>
                      <p className="font-medium text-slate-700">{serviceVariantLabel}</p>
                    </div>
                  ) : null}
                  {packageDescriptionPreview ? (
                    <div>
                      <p className="mb-1 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Opis usługi</p>
                      <p className="leading-relaxed text-slate-600">{packageDescriptionPreview}</p>
                    </div>
                  ) : null}
                </div>
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm font-medium text-slate-500">
                    Cena bazowa w katalogu:{" "}
                    <span className="font-black text-slate-900">
                      {(order.package as { price?: number } | null)?.price} PLN
                    </span>
                  </p>
                  {packageId ? (
                    <Link
                      href={`/app/company/packages/${packageId}`}
                      className="inline-flex items-center gap-1.5 text-sm font-bold text-indigo-600 hover:text-indigo-700 hover:underline"
                    >
                      Otwórz kartę usługi
                      <ExternalLink className="h-3.5 w-3.5" />
                    </Link>
                  ) : null}
                </div>
              </div>
            ) : null}
          </div>

          {/* Sidebar */}
          <div className="space-y-6 xl:sticky xl:top-24 xl:self-start">
            <div className="rounded-[2rem] border border-slate-100 bg-white p-8 shadow-xl shadow-slate-200/50">
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-50">
                  <UserRound className="h-5 w-5 text-indigo-600" />
                </div>
                <h3 className="text-base font-black text-slate-900">Wykonawca</h3>
              </div>

              {hasStudentAssigned ? (
                <div className="space-y-4">
                  <Link href={`/app/students/${order.student_id}`} className="group block rounded-2xl border border-slate-100 bg-slate-50 p-4 transition-colors hover:border-indigo-100 hover:bg-indigo-50/50">
                    <div className="text-base font-black text-slate-900 transition-colors group-hover:text-indigo-600">
                      {student?.public_name || "Student wykonawca"}
                    </div>
                    <div className="mt-0.5 text-xs font-medium text-slate-400 group-hover:text-indigo-400">
                      Zobacz profil studenta →
                    </div>
                  </Link>

                  <div className="space-y-2 text-sm font-medium text-slate-500">
                    {student?.miasto ? (
                      <div className="flex justify-between">
                        <span className="text-slate-400">Miasto</span>
                        <span className="text-slate-700">{student.miasto}</span>
                      </div>
                    ) : null}
                    {student?.uczelnia ? (
                      <div className="flex justify-between">
                        <span className="text-slate-400">Uczelnia</span>
                        <span className="text-slate-700 text-right max-w-[160px] truncate">{student.uczelnia}</span>
                      </div>
                    ) : null}
                  </div>

                  {student?.bio ? (
                    <p className="text-sm font-medium leading-relaxed text-slate-500 line-clamp-3">{student.bio}</p>
                  ) : (
                    <p className="text-sm italic text-slate-400">Brak dodatkowego opisu studenta.</p>
                  )}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-5 text-sm">
                  <p className="font-black text-slate-900">Student nie został jeszcze przypisany.</p>
                  <p className="mt-2 font-medium text-slate-500">Wybierz wykonawcę z listy kandydatów, aby rozpocząć realizację.</p>
                </div>
              )}

              {isPendingStudentConfirmation ? (
                <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-medium text-amber-900">
                  Student ma 24h na potwierdzenie realizacji.
                </div>
              ) : null}
            </div>

            {isPrivateProposal ? (
              <div className="rounded-[2rem] border border-slate-100 bg-white p-8 shadow-xl shadow-slate-200/50">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-50">
                    <Sparkles className="h-5 w-5 text-indigo-600" />
                  </div>
                  <h3 className="text-base font-black text-slate-900">Prywatny entry point</h3>
                </div>
                <p className="text-sm font-medium leading-relaxed text-slate-500">
                  To zamówienie zostało zainicjowane przez studenta jako prywatna propozycja współpracy. Po akceptacji
                  przejdzie do tego samego flow kontraktu, escrow i realizacji co standardowe zamówienia usług.
                </p>
              </div>
            ) : null}
          </div>
        </div>
      </PageContainer>
    </main>
  );
}
