import { redirect } from "next/navigation";
import { FileText } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PremiumPageHeader } from "@/components/ui/premium-page-header";
import { PageContainer } from "@/components/ui/page-container";
import { ApplicationList, SavedList } from "./ApplicationList";

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
    if (deliverableStatus === "approved" || deliverableStatus === "completed") {
      return "done";
    }

    return "in_progress";
  }

  return "sent";
}

export default async function StudentApplicationsPage() {
  const supabase = await createClient();

  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) redirect("/auth");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("user_id", user.id)
    .maybeSingle();
  if (profile?.role !== "student") redirect("/app");

  const { data: rows, error } = await supabase
    .from("applications")
    .select(`
      id, status, message_to_company, created_at, offer_id,
      proposed_stawka, counter_stawka, agreed_stawka, agreed_stawka_minor,
      offers (id, tytul, typ, stawka, status, is_platform_service)
    `)
    .eq("student_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    return <div className="p-8 text-red-500">Blad pobierania danych: {error.message}</div>;
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

  const { data: savedRows } = await supabase
    .from("saved_offers")
    .select("created_at, offers(id, tytul, opis, typ, stawka, status, created_at)")
    .eq("student_id", user.id)
    .order("created_at", { ascending: false });

  const savedOffers = ((savedRows ?? []) as SavedOfferRow[])
    .map((row) => ({
      saved_at: row.created_at,
      offer: unwrapRelation(row.offers),
    }))
    .filter((item): item is SavedOfferItem => item.offer?.status === "published");

  const wTrakcie = applications.filter((application) => application.stage === "in_progress");
  const wyslane = applications.filter(
    (application) =>
      application.stage === "sent" || application.stage === "countered",
  );
  const archiwum = applications.filter(
    (application) =>
      application.stage === "rejected" ||
      application.stage === "done" ||
      application.stage === "cancelled",
  );

  const defaultTab =
    wTrakcie.length > 0
      ? "in_progress"
      : wyslane.length > 0
        ? "sent"
        : savedOffers.length > 0
          ? "saved"
          : "archive";

  return (
    <main className="pb-20">
      <PremiumPageHeader
        badge="Panel Studenta"
        title="Moje Aplikacje"
        description="Sledz swoje zgloszenia, zarzadzaj realizacjami i przegladaj zapisane okazje."
        icon={
          <FileText className="h-10 w-10 text-indigo-300 drop-shadow-[0_0_8px_rgba(165,180,252,0.5)]" />
        }
      />

      <PageContainer className="space-y-8">
        <Tabs key={defaultTab} defaultValue={defaultTab} className="w-full">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 md:w-auto h-auto p-1.5 bg-slate-100/80 backdrop-blur-sm rounded-2xl border border-slate-200/50 shadow-inner">
              <TabsTrigger
                value="in_progress"
                className="rounded-xl py-3 px-6 data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:text-indigo-600 font-bold transition-all duration-300"
              >
                W trakcie{" "}
                {wTrakcie.length > 0 ? (
                  <Badge
                    variant="secondary"
                    className="ml-2 bg-indigo-100 text-indigo-700 border-indigo-200"
                  >
                    {wTrakcie.length}
                  </Badge>
                ) : null}
              </TabsTrigger>
              <TabsTrigger
                value="sent"
                className="rounded-xl py-3 px-6 data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:text-indigo-600 font-bold transition-all duration-300"
              >
                Wyslane{" "}
                <span className="ml-2 text-slate-400 font-medium tracking-tighter">
                  ({wyslane.length})
                </span>
              </TabsTrigger>
              <TabsTrigger
                value="saved"
                className="rounded-xl py-3 px-6 data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:text-indigo-600 font-bold transition-all duration-300"
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
                className="rounded-xl py-3 px-6 data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:text-indigo-600 font-bold transition-all duration-300"
              >
                Archiwum
              </TabsTrigger>
            </TabsList>

            <div className="px-5 py-2.5 bg-indigo-50 rounded-full border border-indigo-100/50 hidden md:block">
              <p className="text-sm font-bold text-indigo-700">
                Filtr:{" "}
                <span className="text-indigo-900 ml-1">
                  {defaultTab === "in_progress" ? "Aktywne zlecenia" : "Widok ogolny"}
                </span>
              </p>
            </div>
          </div>

          <TabsContent value="in_progress" className="space-y-4">
            {wTrakcie.length === 0 ? (
              <EmptyState label="Nie masz obecnie zadnych zlecen w trakcie." />
            ) : (
              <ApplicationList items={wTrakcie} />
            )}
          </TabsContent>
          <TabsContent value="sent" className="space-y-4">
            {wyslane.length === 0 ? (
              <EmptyState label="Brak oczekujacych zgloszen." />
            ) : (
              <ApplicationList items={wyslane} />
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
