"use server";

import { redirect } from "next/navigation";
import { submitReview } from "../../../deliverables/_actions";

export async function submitCompanyReview(input: {
  applicationId: string;
  studentId: string;
  rating: number;
  comment: string;
}) {
  void input.studentId;
  await submitReview(input.applicationId, input.rating, input.comment);
  redirect(`/app/company/review/${input.applicationId}/done`);
}
