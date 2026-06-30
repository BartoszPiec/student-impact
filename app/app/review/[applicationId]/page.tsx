import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import StudentReviewForm from "./review-form";

export const dynamic = "force-dynamic";

export default async function StudentReviewPage({
  params,
}: {
  params: Promise<{ applicationId: string }>;
}) {
  const { applicationId } = await params;

  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) redirect("/auth");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("user_id", user.id)
    .single();

  if (profile?.role !== "student") redirect("/app");

  // Aplikacja + oferta (uczestnictwo)
  const { data: appRow } = await supabase
    .from("applications")
    .select("id, student_id, offer_id, status")
    .eq("id", applicationId)
    .maybeSingle();

  if (!appRow || appRow.student_id !== user.id) redirect("/app/applications");

  // Opinia jest dostępna po zamknięciu kontraktu lub rozliczeniu wszystkich etapów.
  const { data: contract } = await supabase
    .from("contracts")
    .select("status, milestones(status)")
    .eq("application_id", applicationId)
    .maybeSingle();

  const milestones = Array.isArray(contract?.milestones) ? contract.milestones : [];
  const allMilestonesReleased =
    milestones.length > 0 &&
    milestones.every((milestone: { status?: string | null }) =>
      ["released", "accepted", "completed", "refunded"].includes(String(milestone.status)),
    );
  const canReview = appRow.status === "completed" || contract?.status === "completed" || allMilestonesReleased;

  if (!canReview) redirect(`/app/deliverables/${applicationId}`);

  const { data: offer } = await supabase
    .from("offers")
    .select("id, company_id, tytul")
    .eq("id", appRow.offer_id)
    .maybeSingle();

  if (!offer) redirect(`/app/deliverables/${applicationId}`);

  // czy student już ocenił?
  const { data: existing } = await supabase
    .from("reviews")
    .select("id")
    .eq("application_id", applicationId)
    .eq("reviewer_role", "student")
    .maybeSingle();

  if (existing) redirect(`/app/deliverables/${applicationId}`);

  return (
    <main className="space-y-4">
      <h1 className="text-2xl font-semibold">Oceń firmę (opcjonalnie)</h1>
      <p className="text-sm text-muted-foreground">
        Pomaga to innym studentom. Możesz pominąć i wrócić do realizacji.
      </p>

      <StudentReviewForm
        applicationId={applicationId}
        companyId={offer.company_id}
        offerTitle={offer.tytul ?? "Zlecenie"}
      />
    </main>
  );
}
