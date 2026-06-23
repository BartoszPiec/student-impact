"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Wallet } from "lucide-react";
import { toast } from "sonner";

type StripeOnboardingState = "missing" | "pending" | "ready";

export function StripeOnboardingButton({ state }: { state: StripeOnboardingState }) {
  const [loading, setLoading] = useState(false);
  const label = state === "ready"
    ? "Otwórz Stripe"
    : state === "pending"
      ? "Dokończ weryfikację"
      : "Połącz konto Stripe";

  const handleClick = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/stripe/connect/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await response.json() as { url?: string; error?: string };

      if (!response.ok || !data.url) {
        throw new Error(data.error || "Nie udało się przygotować Stripe.");
      }

      window.location.href = data.url;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Nie udało się otworzyć Stripe.");
      setLoading(false);
    }
  };

  return (
    <Button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className="h-12 rounded-xl bg-slate-900 px-6 font-bold text-white hover:bg-indigo-600"
    >
      {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wallet className="mr-2 h-4 w-4" />}
      {label}
    </Button>
  );
}
