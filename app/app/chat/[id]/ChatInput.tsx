"use client";

import { useRef, useState } from "react";
import { Paperclip, Plus, Send } from "lucide-react";

import { sendFileMessage, sendTextMessage } from "@/app/app/chat/_actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { uploadPrivateFile } from "@/lib/security/client-upload";

export function ChatInput({
  conversationId,
  placeholder = "Napisz wiadomość...",
  locked = false,
  lockedMessage = "Ta rozmowa jest zamknięta.",
}: {
  conversationId: string;
  placeholder?: string;
  locked?: boolean;
  lockedMessage?: string;
}) {
  const [message, setMessage] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [attachment, setAttachment] = useState<{ ref: string; type: "image" | "file"; name: string } | null>(null);
  const [actionsOpen, setActionsOpen] = useState(false);
  const [actionSheetOpen, setActionSheetOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleSend() {
    if (locked) return;
    if (!message.trim() && !attachment) return;

    const content = message;
    const currentAttachment = attachment;

    setMessage("");
    setAttachment(null);

    if (currentAttachment) {
      await sendFileMessage(conversationId, currentAttachment.name, currentAttachment.ref, currentAttachment.type);
    }

    if (content.trim()) {
      await sendTextMessage(conversationId, content);
    }
  }

  async function handleFileSelect(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file || locked) return;

    try {
      setIsUploading(true);
      const uploaded = await uploadPrivateFile({
        file,
        purpose: "chat_attachment",
        conversationId,
      });
      const type = file.type.startsWith("image/") ? "image" : "file";
      setAttachment({ ref: uploaded.ref, type, name: uploaded.name });
    } catch (error) {
      console.error("Upload failed:", error);
      alert("Błąd wysyłania pliku.");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  const closeActionMenus = () => {
    setActionsOpen(false);
    setActionSheetOpen(false);
  };

  const openFilePicker = () => {
    fileInputRef.current?.click();
    closeActionMenus();
  };

  const fileActionButton = (
    <Button variant="ghost" className="w-full justify-start gap-2 text-sm" onClick={openFilePicker}>
      <Paperclip className="h-4 w-4" /> Dodaj plik
    </Button>
  );

  return (
    <div className="relative flex w-full flex-col gap-2 px-0 sm:px-4">
      {locked ? (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
          {lockedMessage}
        </div>
      ) : null}

      {attachment ? (
        <div className="flex w-full max-w-full items-center gap-2 rounded-lg border border-slate-200 bg-slate-100 p-2 text-xs sm:w-fit">
          <div className="flex h-8 w-8 items-center justify-center rounded bg-lime-100 text-[#10245f]">
            <Paperclip className="h-4 w-4" />
          </div>

          <span className="max-w-[220px] truncate sm:max-w-[150px]">{attachment.name}</span>
          <button
            type="button"
            onClick={() => setAttachment(null)}
            aria-label="Usuń załącznik"
            className="ml-2 text-slate-400 hover:text-red-500"
          >
            ×
          </button>
        </div>
      ) : null}

      <div className="relative flex items-end gap-2">
        <Input type="file" ref={fileInputRef} className="hidden" onChange={handleFileSelect} />

        <Popover open={actionsOpen} onOpenChange={setActionsOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              aria-label="Dodaj plik"
              className="hidden h-10 w-10 shrink-0 rounded-full border-slate-200 text-slate-500 sm:inline-flex"
              disabled={locked}
            >
              <Plus className="h-5 w-5" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-48 p-1" align="start" side="top" sideOffset={10}>
            {fileActionButton}
          </PopoverContent>
        </Popover>

        <Sheet open={actionSheetOpen} onOpenChange={setActionSheetOpen}>
          <SheetTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              aria-label="Dodaj plik"
              className="inline-flex h-10 w-10 shrink-0 rounded-full border-slate-200 bg-white text-slate-600 shadow-sm sm:hidden"
              disabled={locked}
            >
              <Plus className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="rounded-t-[2rem] border-none bg-white p-0">
            <div className="mx-auto mt-3 h-1.5 w-12 rounded-full bg-slate-200" />
            <div className="p-5 pb-[calc(env(safe-area-inset-bottom)+1.25rem)]">
              <SheetHeader className="mb-4 text-left">
                <SheetTitle>Akcje rozmowy</SheetTitle>
              </SheetHeader>
              <div className="grid gap-2">{fileActionButton}</div>
            </div>
          </SheetContent>
        </Sheet>

        <div className="relative flex-1">
          <Input
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            placeholder={locked ? lockedMessage : placeholder}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                void handleSend();
              }
            }}
            className="h-auto rounded-xl border-transparent bg-slate-50 py-4 pl-4 pr-12 shadow-sm transition-all placeholder:text-slate-400 focus:bg-white focus:ring-4 focus:ring-lime-200/60 sm:py-6"
            autoComplete="off"
            disabled={locked || isUploading}
            readOnly={locked}
          />
          <Button
            onClick={() => void handleSend()}
            size="icon"
            aria-label="Wyślij wiadomość"
            className="absolute right-2 top-1/2 z-10 h-10 w-10 -translate-y-1/2 rounded-xl bg-lime-300 text-[#0b1b47] shadow-lg shadow-lime-200/60 transition-all hover:scale-105 hover:bg-lime-200 active:scale-95"
            disabled={locked || isUploading || (!message.trim() && !attachment)}
          >
            <Send className="ml-0.5 h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
