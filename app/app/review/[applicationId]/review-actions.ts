"use server";

import { redirect } from "next/navigation";
import { submitReview } from "../../deliverables/_actions";
import type { DetailedReviewInput } from "@/lib/reviews";

export async function submitStudentReview(input: {
  applicationId: string;
  companyId: string;
  review: DetailedReviewInput;
}) {
  void input.companyId;
  await submitReview(input.applicationId, input.review);
  redirect(`/app/deliverables/${input.applicationId}`);
}
