"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function submitStudentReview(input: {
  applicationId: string;
  companyId: string;
  rating: number;
  comment: string;
}) {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) redirect("/auth");

  const rating = Math.max(1, Math.min(5, Math.trunc(input.rating)));

  // pobierz student_id z aplikacji (żeby wypełnić wymagane kolumny student_id/company_id w tabeli)
  const { data: appRow, error: appErr } = await supabase
    .from("applications")
    .select("id, student_id")
    .eq("id", input.applicationId)
    .single();

  if (appErr || !appRow) {
    throw new Error(`Cannot load application for review: ${appErr?.message ?? "not found"}`);
  }

  const { error } = await supabase.from("reviews").insert({
    // stare wymagane pola
    company_id: input.companyId,
    student_id: appRow.student_id,

    // nowe pola
    application_id: input.applicationId,
    reviewer_id: user.id,
    reviewee_id: input.companyId,
    reviewer_role: "student",

    rating,
    comment: input.comment?.trim() || null,
  });

  if (error) {
    if ((error as any).code === "23505") {
      redirect(`/app/deliverables/${input.applicationId}`);
    }
    throw new Error(`reviews.insert failed: ${error.message} (code: ${error.code})`);
  }

  redirect(`/app/deliverables/${input.applicationId}`);
}
