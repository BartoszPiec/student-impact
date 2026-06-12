"use client";

import Link from "next/link";

import { DetailedReviewForm } from "@/components/reviews/DetailedReviewForm";
import { Button } from "@/components/ui/button";
import { submitStudentReview } from "./review-actions";

export default function StudentReviewForm({
  applicationId,
  companyId,
  offerTitle,
}: {
  applicationId: string;
  companyId: string;
  offerTitle: string;
}) {
  return (
    <div className="space-y-4 max-w-3xl">
      <div className="space-y-1">
        <div className="text-sm text-muted-foreground">Zlecenie</div>
        <div className="font-medium">{offerTitle}</div>
      </div>

      <DetailedReviewForm
        onSubmit={async (review) => {
          await submitStudentReview({ applicationId, companyId, review });
        }}
        submitLabel="Zapisz ocene"
      />

      <Button asChild variant="outline">
        <Link href={`/app/deliverables/${applicationId}`}>Pomin</Link>
      </Button>
    </div>
  );
}
