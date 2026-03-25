"use server";

import { redirect } from "next/navigation";
import { submitReview } from "../../deliverables/_actions";

export async function submitStudentReview(input: {
  applicationId: string;
  companyId: string;
  rating: number;
  comment: string;
}) {
  void input.companyId;
  await submitReview(input.applicationId, input.rating, input.comment);
  redirect(`/app/deliverables/${input.applicationId}`);
}
