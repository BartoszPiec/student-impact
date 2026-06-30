import { redirect } from "next/navigation";
import { FileText } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PremiumPageHeader } from "@/components/ui/premium-page-header";
import { PageContainer } from "@/components/ui/page-container";
import { ApplicationList, SavedList } from "./ApplicationList";
import { getRequestContext } from "@/lib/auth/request-context";

export const dynamic = "force-dynamic";

type OfferRow = {
  id: string;
  tytul: string | null;
  opis?: string | null;
  typ: string | null;
  stawka: number | null;
  status?: string | null;
  is_platform_service?: boolean | null;
};

type ApplicationRelation<T> = T | T[] | null;

type ApplicationRow = {
  id: string;
  status: string;
  message_to_company: string | null;
  cancel_reason?: string | null;
  created_at: string | null;
  offer_id: string;
  proposed_stawka: number | null;
  counter_stawka: number | null;
  agreed_stawka: number | null;
  agreed_stawka_minor?: number | null;
  offers: ApplicationRelation<OfferRow>;
};

type DeliverableRow = {
  application_id: string | null;
  status: string;
};

type ApplicationStage =
  | "sent"
  | "countered"
  | "in_progress"
  | "done"
  | "rejected"
  | "cancelled";

type NormalizedApplication = Omit<ApplicationRow, "offers"> & {
  offer: OfferRow | null;
  stage: ApplicationStage;
  deliverableStatus?: string;
};

type SavedOfferRow = {
  created_at: string | null;
  offers: ApplicationRelation<OfferRow>;
};

type SavedOfferItem = {
  saved_at: string | null;
  offer: OfferRow | null;
};

function EmptyState({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 border-2 border-dashed rounded-xl border-slate-200 bg-slate-50/50">
      <div className="bg-white p-3 rounded-full shadow-sm mb-3">
        <FileText className="w-6 h-6 text-slate-300" />
      </div>
      <p className="text-slate-500 font-medium">{label}</p>
    </div>
  );
}

function unwrapRelation<T>(value: ApplicationRelation<T>): T | null {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
}

function fromMinorUnits(value?: number | null): number | null {
  if (value == null || !Number.isFinite(value)) return null;
  return value / 100;
}

function resolveApplicationStage(
  status: string,
  deliverableStatus?: string,
): ApplicationStage {
  if (status === "completed") return "done";
  if (status === "rejected") return "rejected";
  if (status === "cancelled") return "cancelled";
  if (status === "countered") return "countered";
  if (status === "in_progress") return "in_progress";

  if (status === "accepted") {
    if (["accepted", "approved", "released", "completed"].includes(String(deliverableStatus))) {
      return "done";
    }

    return "in_progress";
  }

  return "sent";
}

export default async function StudentApplicationsPage() {
  const supabase = await createClient();

  const { user, role } = await getRequestContext();
  if (!user) redirect("/auth");

  if (role !== "student") redirect("/app");

  const [applicationsResult, savedResult] = await Promise.all([
    supabase
      .from("applications")
      .select(`
        id, status, message_to_company, cancel_reason, created_at, offer_id,
        proposed_stawka, counter_stawka, agreed_stawka, agreed_stawka_minor,
        offers (id, tytul, typ, stawka, status, is_platform_service)
      `)
      .eq("student_id", user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("saved_offers")
      .select("created_at, offers(id, tytul, opis, typ, stawka, status, created_at)")
      .eq("student_id", user.id)
      .order("created_at", { ascending: false }),
  ]);
  const { data: rows, error } = applicationsResult;

  if (error) {
    return <div className="p-8 text-red-500">Błąd pobierania danych: {error.message}</div>;
  }

  const applicationRows = (rows ?? []) as ApplicationRow[];
  const appIds = applicationRows.map((row) => row.id);
  const deliverableByAppId = new Map<string, string>();

  if (appIds.length > 0) {
    const { data: deliverables } = await supabase
      .from("deliverables")
      .select("application_id, status")
      .in("application_id", appIds);

    (deliverables ?? ([] as DeliverableRow[])).forEach((deliverable) => {
      const typedDeliverable = deliverable as DeliverableRow;
      if (typedDeliverable.application_id) {
        deliverableByAppId.set(
          typedDeliverable.application_id,
          typedDeliverable.status,
        );
      }
    });
  }

  const applications: NormalizedApplication[] = applicationRows.map((row) => {
    const offer = unwrapRelation(row.offers);
    const deliverableStatus = deliverableByAppId.get(row.id);
    const stage = resolveApplicationStage(row.status, deliverableStatus);

    return {
      ...row,
      agreed_stawka: row.agreed_stawka ?? fromMinorUnits(row.agreed_stawka_minor),
      offer,
      stage,
      deliverableStatus,
    };
  });

  const savedRows = savedResult.data;

  const savedOffers = ((savedRows ?? []) as SavedOfferRow[])
    .map((row) => ({
      saved_at: row.created_at,
      offer: unwrapRelation(row.offers),
    }))
    .filter((item): item is SavedOfferItem => item.offer?.status === "published");

  const doAkcji = applications.filter((application) => application.stage === "countered");
  const wRealizacji = applications.filter((application) => application.stage === "in_progress");
  const oczekujeNaFirme = applications.filter((application) => application.stage === "sent");
  const czekaNaOcene = applications.filter((application) => application.stage === "done");
  const archiwum = applications.filter(
    (application) =>
      application.stage === "rejected" ||
      application.stage === "cancelled",
  );

  const defaultTab =
    doAkcji.length > 0
      ? "action"
      : wRealizacji.length > 0
        ? "progress"
        : oczekujeNaFirme.length > 0
          ? "waiting"
          : savedOffers.length > 0
            ? "saved"
            : czekaNaOcene.length > 0
            ? "review"
            : "archive";

  const activeFilterLabel =
    defaultTab === "action"
      ? "Wymaga Twojej akcji"
      : defaultTab === "progress"
        ? "W realizacji"
        : defaultTab === "waiting"
          ? "Czeka na firmę"
          : defaultTab === "review"
            ? "Do oceny"
            : defaultTab === "saved"
              ? "Zapisane"
              : "Archiwum";

  return (
    <main className="pb-14">
      <PremiumPageHeader
        badge="Panel Studenta"
        title="Moje aplikacje"
        description="Śledź swoje zgłoszenia, zarządzaj realizacjami i przeglądaj zapisane okazje."
        icon={
          <FileText className="h-8 w-8 text-indigo-300 drop-shadow-[0_0_8px_rgba(165,180,252,0.5)]" />
        }
        className="mb-5 pb-7 pt-6 sm:mb-6 sm:pb-8 sm:pt-7"
      />

      <PageContainer className="max-w-7xl space-y-4">
        <div className="hidden rounded-2xl border border-slate-200 bg-white px-3 py-3 shadow-sm sm:block sm:px-5">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <h2 className="text-base font-black tracking-tight text-[#10245f] sm:text-lg">Centrum aplikacji</h2>
              <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">
                {doAkcji.length > 0
                  ? `${doAkcji.length} elementów wymaga Twojej uwagi`
                  : "Aktualne aplikacje, zapisane oferty i archiwum w jednym miejscu."}
              </p>
            </div>
            <div className="scrollbar-hide flex gap-1.5 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:flex-wrap sm:overflow-visible sm:pb-0">
              <Badge className="rounded-full border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-black text-slate-700 hover:bg-slate-50">
                Wszystkie {applications.length}
              </Badge>
              <Badge className="rounded-full border-amber-200 bg-amber-50 px-2.5 py-1 text-[11px] font-black text-amber-700 hover:bg-amber-50">
                Wymagają akcji {doAkcji.length}
              </Badge>
              <Badge className="rounded-full border-blue-100 bg-blue-50 px-2.5 py-1 text-[11px] font-black text-[#10245f] hover:bg-blue-50">
                Czeka na firmę {oczekujeNaFirme.length}
              </Badge>
              <Badge className="rounded-full border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-black text-emerald-700 hover:bg-emerald-50">
                W realizacji {wRealizacji.length}
              </Badge>
              <Badge className="rounded-full border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-black text-slate-600 hover:bg-slate-50">
                Do oceny {czekaNaOcene.length}
              </Badge>
              <Badge className="rounded-full border-slate-200 bg-white px-2.5 py-1 text-[11px] font-black text-slate-500 hover:bg-white">
                Zapisane {savedOffers.length}
              </Badge>
            </div>
          </div>
        </div>

        <Tabs key={defaultTab} defaultValue={defaultTab} className="w-full">
          <div className="mb-5 flex flex-col justify-between gap-3 md:flex-row md:items-center">
            <div className="scrollbar-hide w-full overflow-x-auto rounded-2xl border border-slate-200 bg-white p-1 shadow-sm [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:w-auto">
            <TabsList className="flex h-auto min-w-max justify-start gap-1.5 bg-transparent p-0">
              <TabsTrigger
                value="action"
                className="min-h-9 shrink-0 justify-center whitespace-nowrap rounded-xl px-3.5 py-2 text-[12px] font-bold leading-none transition-all duration-300 data-[state=active]:bg-lime-200 data-[state=active]:text-[#0b1b47] data-[state=active]:shadow-sm sm:px-4"
              >
                Akcja{" "}
                {doAkcji.length > 0 ? (
                  <Badge
                    variant="secondary"
                    className="ml-2 border-lime-200 bg-lime-100 text-[#0b1b47]"
                  >
                    {doAkcji.length}
                  </Badge>
                ) : null}
              </TabsTrigger>
              <TabsTrigger
                value="waiting"
                className="min-h-9 min-w-[8.5rem] shrink-0 justify-center whitespace-nowrap rounded-xl px-3.5 py-2 text-[12px] font-bold leading-none transition-all duration-300 data-[state=active]:bg-lime-200 data-[state=active]:text-[#0b1b47] data-[state=active]:shadow-sm sm:min-w-[10rem] sm:px-4"
              >
                <span className="sm:hidden">Czeka</span>
                <span className="hidden sm:inline">Czeka na firmę</span>{" "}
                <span className="ml-2 text-slate-400 font-medium tracking-tighter">
                  ({oczekujeNaFirme.length})
                </span>
              </TabsTrigger>
              <TabsTrigger
                value="progress"
                className="min-h-9 min-w-[7.5rem] shrink-0 justify-center whitespace-nowrap rounded-xl px-3.5 py-2 text-[12px] font-bold leading-none transition-all duration-300 data-[state=active]:bg-lime-200 data-[state=active]:text-[#0b1b47] data-[state=active]:shadow-sm sm:min-w-[8.75rem] sm:px-4"
              >
                <span className="sm:hidden">W toku</span>
                <span className="hidden sm:inline">W realizacji</span>{" "}
                <span className="ml-2 text-slate-400 font-medium tracking-tighter">
                  ({wRealizacji.length})
                </span>
              </TabsTrigger>
              <TabsTrigger
                value="review"
                className="min-h-9 min-w-[6.5rem] shrink-0 justify-center whitespace-nowrap rounded-xl px-3.5 py-2 text-[12px] font-bold leading-none transition-all duration-300 data-[state=active]:bg-lime-200 data-[state=active]:text-[#0b1b47] data-[state=active]:shadow-sm sm:min-w-[7.5rem] sm:px-4"
              >
                <span className="sm:hidden">Ocena</span>
                <span className="hidden sm:inline">Do oceny</span>{" "}
                <span className="ml-2 text-slate-400 font-medium tracking-tighter">
                  ({czekaNaOcene.length})
                </span>
              </TabsTrigger>
              <TabsTrigger
                value="saved"
                className="min-h-9 shrink-0 justify-center whitespace-nowrap rounded-xl px-3.5 py-2 text-[12px] font-bold leading-none transition-all duration-300 data-[state=active]:bg-lime-200 data-[state=active]:text-[#0b1b47] data-[state=active]:shadow-sm sm:px-4"
              >
                Zapisane{" "}
                {savedOffers.length > 0 ? (
                  <Badge
                    variant="secondary"
                    className="ml-2 bg-amber-100 text-amber-700 border-amber-200"
                  >
                    {savedOffers.length}
                  </Badge>
                ) : null}
              </TabsTrigger>
              <TabsTrigger
                value="archive"
                className="min-h-9 shrink-0 justify-center whitespace-nowrap rounded-xl px-3.5 py-2 text-[12px] font-bold leading-none transition-all duration-300 data-[state=active]:bg-lime-200 data-[state=active]:text-[#0b1b47] data-[state=active]:shadow-sm sm:px-4"
              >
                Archiwum
              </TabsTrigger>
            </TabsList>
            </div>

            <div className="hidden rounded-full border border-slate-200 bg-white px-4 py-2 md:block">
              <p className="text-xs font-bold text-slate-500">
                Filtr:{" "}
                <span className="ml-1 text-[#10245f]">
                  {activeFilterLabel}
                </span>
              </p>
            </div>
          </div>

          <TabsContent value="action" className="space-y-4">
            {doAkcji.length === 0 ? (
              <EmptyState label="Nic nie wymaga teraz Twojej akcji." />
            ) : (
              <ApplicationList items={doAkcji} />
            )}
          </TabsContent>
          <TabsContent value="waiting" className="space-y-4">
            {oczekujeNaFirme.length === 0 ? (
              <EmptyState label="Brak zgłoszeń oczekujących na decyzję firmy." />
            ) : (
              <ApplicationList items={oczekujeNaFirme} />
            )}
          </TabsContent>
          <TabsContent value="progress" className="space-y-4">
            {wRealizacji.length === 0 ? (
              <EmptyState label="Brak aktywnych realizacji." />
            ) : (
              <ApplicationList items={wRealizacji} />
            )}
          </TabsContent>
          <TabsContent value="review" className="space-y-4">
            {czekaNaOcene.length === 0 ? (
              <EmptyState label="Brak zakończonych zleceń czekających na ocenę." />
            ) : (
              <ApplicationList items={czekaNaOcene} />
            )}
          </TabsContent>
          <TabsContent value="saved" className="space-y-4">
            {savedOffers.length === 0 ? (
              <EmptyState label="Brak zapisanych ofert." />
            ) : (
              <SavedList items={savedOffers} />
            )}
          </TabsContent>
          <TabsContent value="archive" className="space-y-4">
            {archiwum.length === 0 ? (
              <EmptyState label="Pusto w archiwum." />
            ) : (
              <ApplicationList items={archiwum} />
            )}
          </TabsContent>
        </Tabs>
      </PageContainer>
    </main>
  );
}
