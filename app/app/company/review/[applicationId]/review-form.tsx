"use client";

import { DetailedReviewForm } from "@/components/reviews/DetailedReviewForm";
import { submitCompanyReview } from "./review-actions";

export default function CompanyReviewForm({
  applicationId,
  studentId,
  offerTitle,
}: {
  applicationId: string;
  studentId: string;
  offerTitle: string;
}) {
  return (
    <div className="space-y-4 max-w-3xl">
      <div className="space-y-2">
        <div className="text-sm text-muted-foreground">Zlecenie</div>
        <div className="font-medium">{offerTitle}</div>
      </div>

      <DetailedReviewForm
        onSubmit={async (review) => {
          await submitCompanyReview({ applicationId, studentId, review });
        }}
        submitLabel="Zapisz ocenę"
      />
    </div>
  );
}
