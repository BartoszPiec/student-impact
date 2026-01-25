"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function submitCompanyReview(input: {
  applicationId: string;
  studentId: string;
  rating: number;
  comment: string;
}) {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) redirect("/auth");

  const rating = Math.max(1, Math.min(5, Math.trunc(input.rating)));

  // pobierz offer_id + company_id (żeby wypełnić wymagane kolumny company_id/student_id)
  const { data: appRow, error: appErr } = await supabase
    .from("applications")
    .select("id, student_id, offer_id, offers!inner(company_id)")
    .eq("id", input.applicationId)
    .single();

  if (appErr || !appRow) {
    throw new Error(`Cannot load application for review: ${appErr?.message ?? "not found"}`);
  }

  const offer: any = Array.isArray((appRow as any).offers)
    ? (appRow as any).offers[0]
    : (appRow as any).offers;

  const companyId = offer.company_id as string;
  const studentId = appRow.student_id as string;

  const { error } = await supabase.from("reviews").insert({
    // stare wymagane pola (Twoja obecna tabela)
    company_id: companyId,
    student_id: studentId,

    // nowe pola (pod nowy model)
    application_id: input.applicationId,
    reviewer_id: user.id,
    reviewee_id: studentId,
    reviewer_role: "company",

    rating,
    comment: input.comment?.trim() || null,
  });

  if (error) {
    if ((error as any).code === "23505") {
      redirect(`/app/deliverables/${input.applicationId}/done`);
    }
    throw new Error(`reviews.insert failed: ${error.message} (code: ${error.code})`);
  };

  if (error) throw error;

  redirect(`/app/company/review/${input.applicationId}/done`);
}
