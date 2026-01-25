"use client";

import { useState } from "react";
import { submitCompanyReview } from "./review-actions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export default function CompanyReviewForm({
  applicationId,
  studentId,
  offerTitle,
}: {
  applicationId: string;
  studentId: string;
  offerTitle: string;
}) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");

  return (
    <form
      className="space-y-4 max-w-xl"
      action={async () => {
        await submitCompanyReview({ applicationId, studentId, rating, comment });
      }}
    >
      <div className="space-y-2">
        <div className="text-sm text-muted-foreground">Zlecenie</div>
        <div className="font-medium">{offerTitle}</div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Ocena (1–5)</label>
        <input
          type="number"
          min={1}
          max={5}
          value={rating}
          onChange={(e) => setRating(Number(e.target.value))}
          className="w-24 rounded-md border px-3 py-2"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Komentarz (opcjonalnie)</label>
        <Textarea value={comment} onChange={(e) => setComment(e.target.value)} />
      </div>

      <Button type="submit">Zapisz ocenę</Button>
    </form>
  );
}
