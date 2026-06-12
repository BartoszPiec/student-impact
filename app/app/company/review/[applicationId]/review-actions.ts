"use server";

import { redirect } from "next/navigation";
import { submitReview } from "../../../deliverables/_actions";
import type { DetailedReviewInput } from "@/lib/reviews";

export async function submitCompanyReview(input: {
  applicationId: string;
  studentId: string;
  review: DetailedReviewInput;
}) {
  void input.studentId;
  await submitReview(input.applicationId, input.review);
  redirect(`/app/company/review/${input.applicationId}/done`);
}
