"use client";

import { useState } from "react";
import { submitStudentReview } from "./review-actions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import Link from "next/link";

export default function StudentReviewForm({
  applicationId,
  companyId,
  offerTitle,
}: {
  applicationId: string;
  companyId: string;
  offerTitle: string;
}) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");

  return (
    <div className="space-y-4 max-w-xl">
      <div className="space-y-1">
        <div className="text-sm text-muted-foreground">Zlecenie</div>
        <div className="font-medium">{offerTitle}</div>
      </div>

      <form
        className="space-y-4"
        action={async () => {
          await submitStudentReview({ applicationId, companyId, rating, comment });
        }}
      >
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

        <div className="flex gap-2">
          <Button type="submit">Zapisz ocenę</Button>
          <Button asChild variant="outline">
            <Link href={`/app/deliverables/${applicationId}`}>Pomiń</Link>
          </Button>
        </div>
      </form>
    </div>
  );
}
