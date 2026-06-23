"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { toggleSavedOffer } from "./saved-actions";

export default function SaveButton({ offerId, isSaved }: { offerId: string; isSaved: boolean }) {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      variant={isSaved ? "secondary" : "outline"}
      disabled={pending}
      onClick={() => startTransition(async () => toggleSavedOffer(offerId))}
      className="h-12 w-full rounded-2xl px-6 font-bold sm:w-auto"
    >
      {pending ? "..." : isSaved ? "Usuń z zapisanych" : "Zapisz ofertę"}
    </Button>
  );
}
