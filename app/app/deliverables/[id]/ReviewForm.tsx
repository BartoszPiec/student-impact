"use client";

import { DetailedReviewForm } from "@/components/reviews/DetailedReviewForm";
import type { DetailedReviewInput } from "@/lib/reviews";

export function ReviewForm({
  applicationId,
  action,
}: {
  applicationId: string;
  action: (appId: string, input: DetailedReviewInput) => Promise<void>;
}) {
  return (
    <DetailedReviewForm
      onSubmit={async (input) => {
        await action(applicationId, input);
      }}
      submitLabel="Wystaw opinie"
    />
  );
}
