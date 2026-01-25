
"use client";

import { useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { Paperclip, Send, Banknote, CalendarClock, Plus } from "lucide-react";
import { sendTextMessage, sendFileMessage, sendEventMessage } from "@/app/app/chat/_actions";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export function ChatInput({
    conversationId,
    placeholder = "Napisz wiadomość..."
}: {
    conversationId: string;
    placeholder?: string;
}) {
    const [message, setMessage] = useState("");
    const [isUploading, setIsUploading] = useState(false);
    const [attachment, setAttachment] = useState<{ url: string; type: 'image' | 'file'; name: string } | null>(null);
    const [rateOpen, setRateOpen] = useState(false);
    const [deadlineOpen, setDeadlineOpen] = useState(false);
    const [rateValue, setRateValue] = useState("");
    const [deadlineValue, setDeadlineValue] = useState("");
    const fileInputRef = useRef<HTMLInputElement>(null);

    async function handleSend() {
        if (!message.trim() && !attachment) return;

        const content = message;
        const att = attachment;

        // Optimistic clear
        setMessage("");
        setAttachment(null);

        if (att) {
            await sendFileMessage(conversationId, att.name, att.url, att.type);
        }

        if (content.trim()) {
            await sendTextMessage(conversationId, content);
        }
    }

    async function handleFileSelect(event: React.ChangeEvent<HTMLInputElement>) {
        const file = event.target.files?.[0];
        if (!file) return;

        try {
            setIsUploading(true);
            const supabase = createClient();
            const fileExt = file.name.split('.').pop();
            const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
            const filePath = `${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('chat-attachments')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('chat-attachments')
                .getPublicUrl(filePath);

            const type = file.type.startsWith('image/') ? 'image' : 'file';
            setAttachment({ url: publicUrl, type, name: file.name });
        } catch (e) {
            console.error("Upload failed:", e);
            alert("Błąd wysyłania pliku.");
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    }

    const submitRate = async () => {
        if (!rateValue) return;
        const rate = parseFloat(rateValue);
        await sendEventMessage(conversationId, "rate.proposed", { proposed_stawka: rate }, "");
        setRateOpen(false);
        setRateValue("");
    };

    const submitDeadline = async () => {
        if (!deadlineValue) return;
        await sendEventMessage(conversationId, "deadline.proposed", { proposed_deadline: deadlineValue }, "");
        setDeadlineOpen(false);
        setDeadlineValue("");
    };

    return (
        <div className="flex flex-col gap-2 relative w-full px-4">
            {/* Attachment Preview */}
            {attachment && (
                <div className="flex items-center gap-2 p-2 bg-slate-100 rounded-lg w-fit text-xs border border-slate-200">
                    {attachment.type === 'image' ? (
                        <div className="h-8 w-8 bg-slate-300 rounded overflow-hidden">
                            {/*eslint-disable-next-line @next/next/no-img-element*/}
                            <img src={attachment.url} alt="preview" className="h-full w-full object-cover" />
                        </div>
                    ) : (
                        <div className="h-8 w-8 bg-indigo-100 text-indigo-600 flex items-center justify-center rounded">
                            <Paperclip className="w-4 h-4" />
                        </div>
                    )}
                    <span className="max-w-[150px] truncate">{attachment.name}</span>
                    <button
                        type="button"
                        onClick={() => setAttachment(null)}
                        className="ml-2 text-slate-400 hover:text-red-500"
                    >
                        ✕
                    </button>
                </div>
            )}

            <div className="relative flex items-end gap-2">
                <Input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    onChange={handleFileSelect}
                />

                {/* Actions Menu */}
                <Popover>
                    <PopoverTrigger asChild>
                        <Button variant="outline" size="icon" className="h-10 w-10 shrink-0 rounded-full border-slate-200 text-slate-500">
                            <Plus className="w-5 h-5" />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-48 p-1" align="start">
                        <Button variant="ghost" className="w-full justify-start gap-2 text-sm" onClick={() => fileInputRef.current?.click()}>
                            <Paperclip className="w-4 h-4" /> Dodaj plik
                        </Button>
                        <Button variant="ghost" className="w-full justify-start gap-2 text-sm" onClick={() => setRateOpen(true)}>
                            <Banknote className="w-4 h-4" /> Zaproponuj stawkę
                        </Button>
                        <Button variant="ghost" className="w-full justify-start gap-2 text-sm" onClick={() => setDeadlineOpen(true)}>
                            <CalendarClock className="w-4 h-4" /> Zaproponuj termin
                        </Button>
                    </PopoverContent>
                </Popover>

                <div className="relative flex-1">
                    <Input
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder={placeholder}
                        onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault();
                                handleSend();
                            }
                        }}
                        className="pl-4 pr-12 py-6 h-auto rounded-xl border-transparent bg-slate-50 shadow-sm focus:bg-white focus:ring-4 focus:ring-indigo-500/10 transition-all placeholder:text-slate-400"
                        autoComplete="off"
                        disabled={isUploading}
                    />
                    <Button
                        onClick={handleSend}
                        size="icon"
                        className="absolute right-2 top-1/2 -translate-y-1/2 h-9 w-9 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition-transform active:scale-95"
                        disabled={isUploading || (!message.trim() && !attachment)}
                    >
                        <Send className="w-4 h-4 ml-0.5" />
                    </Button>
                </div>
            </div>

            {/* Rate Dialog */}
            <Dialog open={rateOpen} onOpenChange={setRateOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Zaproponuj stawkę</DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                        <Label>Kwota (PLN)</Label>
                        <Input
                            type="number"
                            value={rateValue}
                            onChange={(e) => setRateValue(e.target.value)}
                            placeholder="np. 1500"
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setRateOpen(false)}>Anuluj</Button>
                        <Button onClick={submitRate}>Wyślij propozycję</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Deadline Dialog */}
            <Dialog open={deadlineOpen} onOpenChange={setDeadlineOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Zaproponuj termin</DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                        <Label>Termin (YYYY-MM-DD)</Label>
                        <Input
                            type="date"
                            value={deadlineValue}
                            onChange={(e) => setDeadlineValue(e.target.value)}
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeadlineOpen(false)}>Anuluj</Button>
                        <Button onClick={submitDeadline}>Wyślij propozycję</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
