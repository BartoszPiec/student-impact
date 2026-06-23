"use client";

import { useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { uploadPrivateFile } from "@/lib/security/client-upload";
import { Paperclip, Send, Banknote, CalendarClock, Plus } from "lucide-react";
import { sendTextMessage, sendFileMessage, sendEventMessage } from "@/app/app/chat/_actions";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

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
  const [rateOpen, setRateOpen] = useState(false);
  const [deadlineOpen, setDeadlineOpen] = useState(false);
  const [rateValue, setRateValue] = useState("");
  const [deadlineValue, setDeadlineValue] = useState("");
  const [eventError, setEventError] = useState<string | null>(null);
  const [isSendingEvent, setIsSendingEvent] = useState(false);
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

  const submitRate = async () => {
    if (locked || !rateValue) return;
    const rate = parseFloat(rateValue);
    if (Number.isNaN(rate)) {
      alert("Proszę podać prawidłową kwotę.");
      return;
    }

    setIsSendingEvent(true);
    setEventError(null);
    try {
      await sendEventMessage(conversationId, "rate.proposed", { proposed_stawka: rate }, `Proponuję stawkę: ${rate} zł`);
      setRateOpen(false);
      setRateValue("");
    } catch {
      setEventError("Nie udało się wysłać propozycji stawki.");
    } finally {
      setIsSendingEvent(false);
    }
  };

  const submitDeadline = async () => {
    if (locked || !deadlineValue) return;
    setIsSendingEvent(true);
    setEventError(null);
    try {
      await sendEventMessage(conversationId, "deadline.proposed", { proposed_deadline: deadlineValue }, "");
      setDeadlineOpen(false);
      setDeadlineValue("");
    } catch {
      setEventError("Nie udało się wysłać propozycji terminu.");
    } finally {
      setIsSendingEvent(false);
    }
  };

  return (
    <div className="relative flex w-full flex-col gap-2 px-0 sm:px-4">
      {locked ? (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
          {lockedMessage}
        </div>
      ) : null}

      {attachment ? (
        <div className="flex w-full max-w-full items-center gap-2 rounded-lg border border-slate-200 bg-slate-100 p-2 text-xs sm:w-fit">
          {attachment.type === "image" ? (
            <div className="flex h-8 w-8 items-center justify-center rounded bg-indigo-100 text-indigo-600">
              <Paperclip className="h-4 w-4" />
            </div>
          ) : (
            <div className="flex h-8 w-8 items-center justify-center rounded bg-indigo-100 text-indigo-600">
              <Paperclip className="h-4 w-4" />
            </div>
          )}

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
        <Input
          type="file"
          ref={fileInputRef}
          className="hidden"
          onChange={handleFileSelect}
        />

        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              aria-label="Dodaj załącznik lub propozycję"
              className="h-10 w-10 shrink-0 rounded-full border-slate-200 text-slate-500"
              disabled={locked}
            >
              <Plus className="h-5 w-5" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-48 p-1" align="start">
            <Button variant="ghost" className="w-full justify-start gap-2 text-sm" onClick={() => fileInputRef.current?.click()}>
              <Paperclip className="h-4 w-4" /> Dodaj plik
            </Button>
            <Button variant="ghost" className="w-full justify-start gap-2 text-sm" onClick={() => setRateOpen(true)}>
              <Banknote className="h-4 w-4" /> Zaproponuj stawkę
            </Button>
            <Button variant="ghost" className="w-full justify-start gap-2 text-sm" onClick={() => setDeadlineOpen(true)}>
              <CalendarClock className="h-4 w-4" /> Zaproponuj termin
            </Button>
          </PopoverContent>
        </Popover>

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
            className="h-auto rounded-xl border-transparent bg-slate-50 py-4 pl-4 pr-12 shadow-sm transition-all placeholder:text-slate-400 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 sm:py-6"
            autoComplete="off"
            disabled={locked || isUploading}
            readOnly={locked}
          />
          <Button
            onClick={() => void handleSend()}
            size="icon"
            aria-label="Wyślij wiadomość"
            className="absolute right-2 top-1/2 z-10 h-10 w-10 -translate-y-1/2 rounded-xl bg-indigo-600 text-white shadow-lg shadow-indigo-200/50 transition-all hover:scale-105 hover:bg-indigo-700 active:scale-95"
            disabled={locked || isUploading || (!message.trim() && !attachment)}
          >
            <Send className="ml-0.5 h-5 w-5" />
          </Button>
        </div>
      </div>

      <Dialog open={rateOpen} onOpenChange={setRateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Zaproponuj stawkę</DialogTitle>
            <DialogDescription>Podaj kwotę, którą chcesz zaproponować drugiej stronie.</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label>Kwota (PLN)</Label>
            <Input
              type="number"
              value={rateValue}
              onChange={(event) => setRateValue(event.target.value)}
              placeholder="np. 1500"
            />
            {eventError ? <p className="mt-2 text-sm text-red-600">{eventError}</p> : null}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRateOpen(false)} className="rounded-xl border-slate-200">
              Anuluj
            </Button>
            <Button disabled={isSendingEvent} onClick={() => void submitRate()} className="rounded-xl bg-indigo-600 text-white hover:bg-indigo-700">
              {isSendingEvent ? "Wysyłanie..." : "Wyślij propozycję"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deadlineOpen} onOpenChange={setDeadlineOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Zaproponuj termin</DialogTitle>
            <DialogDescription>Wybierz proponowany termin zakończenia prac.</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label>Termin (YYYY-MM-DD)</Label>
            <Input
              type="date"
              value={deadlineValue}
              onChange={(event) => setDeadlineValue(event.target.value)}
            />
            {eventError ? <p className="mt-2 text-sm text-red-600">{eventError}</p> : null}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeadlineOpen(false)} className="rounded-xl border-slate-200">
              Anuluj
            </Button>
            <Button disabled={isSendingEvent} onClick={() => void submitDeadline()} className="rounded-xl bg-indigo-600 text-white hover:bg-indigo-700">
              {isSendingEvent ? "Wysyłanie..." : "Wyślij propozycję"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
