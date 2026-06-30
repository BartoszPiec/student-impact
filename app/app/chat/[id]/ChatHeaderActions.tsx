"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { MailOpen } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { markConversationAsUnread } from "../_actions";

export function ChatHeaderActions({ conversationId }: { conversationId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleMarkUnread = () => {
    startTransition(async () => {
      try {
        window.localStorage.setItem(`chat:manual-unread:${conversationId}`, String(Date.now()));
        await markConversationAsUnread(conversationId);
        toast.success("Rozmowa oznaczona jako nieprzeczytana.");
        router.refresh();
      } catch (error) {
        const message = error instanceof Error ? error.message : "Nie udało się oznaczyć rozmowy.";
        toast.error(message);
      }
    });
  };

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={handleMarkUnread}
      disabled={isPending}
      className="inline-flex rounded-full border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
    >
      <MailOpen className="mr-2 h-4 w-4" />
      Oznacz jako nieprzeczytane
    </Button>
  );
}
