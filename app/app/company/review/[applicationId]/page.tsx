import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import CompanyReviewForm from "./review-form";

export const dynamic = "force-dynamic";

export default async function CompanyReviewPage({
  params,
}: {
  params: Promise<{ applicationId: string }>;
}) {
  const { applicationId } = await params;
  const supabase = await createClient();

  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) redirect("/auth");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("user_id", userData.user.id)
    .single();

  if (profile?.role !== "company") redirect("/app");

  // sprawdzamy czy aplikacja jest accepted i deliverable approved
  const { data: appRow } = await supabase
    .from("applications")
    .select("id, student_id, status, offer_id")
    .eq("id", applicationId)
    .maybeSingle();

  if (!appRow) redirect("/app/company/applications");

  const { data: offer } = await supabase
    .from("offers")
    .select("company_id, tytul")
    .eq("id", appRow.offer_id)
    .maybeSingle();

  if (!offer || offer.company_id !== userData.user.id) redirect("/app/company/applications");

  const { data: deliverable } = await supabase
    .from("deliverables")
    .select("status")
    .eq("application_id", applicationId)
    .maybeSingle();

  if (!deliverable || deliverable.status !== "approved") {
    redirect(`/app/deliverables/${applicationId}`);
  }

  // czy firma już oceniła?
  const { data: existing } = await supabase
    .from("reviews")
    .select("id")
    .eq("application_id", applicationId)
    .eq("reviewer_role", "company")
    .maybeSingle();

  if (existing) {
    redirect(`/app/deliverables/${applicationId}/done`);
  }

  return (
    <main className="space-y-4">
      <h1 className="text-2xl font-semibold">Oceń współpracę</h1>
      <p className="text-sm text-muted-foreground">
        Ta ocena jest obowiązkowa, aby zakończyć proces zlecenia.
      </p>

      <CompanyReviewForm
        applicationId={applicationId}
        studentId={appRow.student_id}
        offerTitle={offer.tytul ?? "Zlecenie"}
      />
    </main>
  );
}
