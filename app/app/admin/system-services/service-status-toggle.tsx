"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { updateSystemServiceStatus } from "./_actions";
import { toast } from "sonner";

type ServiceStatusToggleProps = {
  serviceId: string;
  currentStatus: string | null | undefined;
};

export function ServiceStatusToggle({ serviceId, currentStatus }: ServiceStatusToggleProps) {
  const [isPending, startTransition] = useTransition();
  const isActive = currentStatus === "active";
  const nextStatus: "active" | "inactive" = isActive ? "inactive" : "active";

  const handleClick = () => {
    startTransition(async () => {
      const result = await updateSystemServiceStatus(serviceId, nextStatus);
      if (result?.error) {
        toast.error(`Nie udało sie zapisać statusu: ${result.error}`);
        return;
      }
      toast.success(isActive ? "Usługa została zarchiwizowana." : "Usługa została przywrócona.");
    });
  };

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className="flex-1 rounded-lg text-slate-400 hover:bg-white/5 hover:text-indigo-300"
      onClick={handleClick}
      disabled={isPending}
    >
      {isPending ? "Zapisywanie..." : isActive ? "Archiwizuj" : "Przywroc"}
    </Button>
  );
}
