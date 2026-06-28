"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { toggleSavedOffer } from "./saved-actions";
import { toast } from "sonner";

export default function SaveButton({ offerId, isSaved }: { offerId: string; isSaved: boolean }) {
  const [pending, startTransition] = useTransition();

  const handleToggle = () => {
    startTransition(async () => {
      try {
        await toggleSavedOffer(offerId);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Nie udało się zaktualizować zapisanej oferty.";
        toast.error(message);
      }
    });
  };

  return (
    <Button
      variant={isSaved ? "secondary" : "outline"}
      disabled={pending}
      onClick={handleToggle}
      className="h-12 w-full rounded-2xl border-white bg-white px-6 font-bold text-slate-900 shadow-xl hover:bg-slate-100 disabled:opacity-70 sm:w-auto"
    >
      {pending ? "..." : isSaved ? "Usuń z zapisanych" : "Zapisz ofertę"}
    </Button>
  );
}
