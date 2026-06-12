"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { createClient } from "@/lib/supabase/client";
import { Label } from "@/components/ui/label";
import { Loader2, File, Link2, Plus, UploadCloud, Send, X } from "lucide-react";

type FileAttachment = {
  kind?: "file";
  name: string;
  bucket: string;
  path: string;
  size: number;
  url?: string;
};

type ExternalLinkAttachment = {
  kind: "external_link";
  name: string;
  url: string;
};

type Attachment = FileAttachment | ExternalLinkAttachment;

function normalizeExternalUrl(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (/^[a-zA-Z][a-zA-Z\d+\-.]*:\/\//.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

function isValidExternalUrl(value: string) {
  try {
    const parsed = new URL(normalizeExternalUrl(value));
    return parsed.protocol === "https:" || parsed.protocol === "http:";
  } catch {
    return false;
  }
}

function buildLinkLabel(url: string) {
  try {
    const parsed = new URL(normalizeExternalUrl(url));
    return parsed.hostname.replace(/^www\./, "");
  } catch {
    return "Link";
  }
}

export function UploadForm({
  applicationId,
  action
}: {
  applicationId: string,
  action: (appId: string, formData: FormData) => Promise<void>
}) {
  const [isUploading, setIsUploading] = useState(false);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [description, setDescription] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [linkLabel, setLinkLabel] = useState("");

  const hasContent = useMemo(
    () => attachments.length > 0 || description.trim().length > 0,
    [attachments, description],
  );

  async function handleSubmit(formData: FormData) {
    formData.append("filesJson", JSON.stringify(attachments));
    await action(applicationId, formData);
  }

  const ALLOWED_MIME_TYPES = new Set([
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "text/plain",
    "text/csv",
    "text/markdown",
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    "image/svg+xml",
    "application/zip",
    "application/x-zip-compressed",
    "application/x-rar-compressed",
    "application/x-7z-compressed",
    "application/json",
    "text/html",
    "text/css",
    "application/javascript",
    "text/javascript",
  ]);
  const MAX_FILE_SIZE_MB = 50;
  const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files?.length) return;

    for (let i = 0; i < e.target.files.length; i++) {
      const file = e.target.files[i];
      if (file.size > MAX_FILE_SIZE_BYTES) {
        alert(`Plik "${file.name}" przekracza limit ${MAX_FILE_SIZE_MB} MB. Skompresuj plik i spróbuj ponownie.`);
        e.target.value = "";
        return;
      }
      if (file.type && !ALLOWED_MIME_TYPES.has(file.type)) {
        alert(`Typ pliku "${file.type}" nie jest dozwolony. Dozwolone formaty: PDF, DOCX, XLSX, PPTX, TXT, CSV, JPG, PNG, GIF, WEBP, SVG, ZIP, RAR, JSON.`);
        e.target.value = "";
        return;
      }
    }

    setIsUploading(true);
    const supabase = createClient();
    const newFiles: FileAttachment[] = [];

    try {
      for (let i = 0; i < e.target.files.length; i++) {
        const file = e.target.files[i];
        const fileExt = file.name.split(".").pop();
        const fileName = `${applicationId}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;

        const { error } = await supabase.storage
          .from("deliverables")
          .upload(fileName, file);

        if (error) throw error;

        newFiles.push({
          kind: "file",
          name: file.name,
          bucket: "deliverables",
          path: fileName,
          size: file.size,
        });
      }
      setAttachments((prev) => [...prev, ...newFiles]);
    } catch (err) {
      console.error(err);
      alert("Brak dostępu lub błąd wysyłania.");
    } finally {
      setIsUploading(false);
      e.target.value = "";
    }
  }

  function handleAddLink() {
    const normalizedUrl = normalizeExternalUrl(linkUrl);
    const normalizedLabel = linkLabel.trim();

    if (!normalizedUrl) return;
    if (!isValidExternalUrl(normalizedUrl)) {
      alert("Podaj poprawny link zaczynający się od http:// lub https://.");
      return;
    }

    setAttachments((prev) => [
      ...prev,
      {
        kind: "external_link",
        name: normalizedLabel || buildLinkLabel(normalizedUrl),
        url: normalizedUrl,
      },
    ]);
    setLinkUrl("");
    setLinkLabel("");
  }

  return (
    <form action={handleSubmit} className="space-y-6 text-left">
      <div className="space-y-5">
        <div>
          <Label className="text-base font-bold text-slate-800">Prześlij pliki</Label>
          <p className="text-sm text-slate-500 mb-3">Wgraj gotowe pliki dla klienta.</p>

          <Label htmlFor="file-upload" className="cursor-pointer group block">
            <div className="flex flex-col items-center justify-center p-4 md:p-8 border-2 border-dashed border-indigo-200 rounded-2xl bg-indigo-50/30 hover:bg-indigo-50 hover:border-indigo-400 transition-all duration-300 group-hover:shadow-md">
              <div className="p-4 bg-white rounded-full shadow-sm mb-3 group-hover:scale-110 transition-transform">
                <UploadCloud className="w-6 h-6 md:w-8 md:h-8 text-indigo-600" />
              </div>
              <span className="font-bold text-indigo-700 text-lg">Kliknij, aby wybrać pliki</span>
              <span className="text-sm text-slate-500 mt-1">lub przeciągnij je tutaj</span>
              <span className="text-xs text-slate-400 mt-2">PDF, DOCX, XLSX, JPG, PNG, ZIP i inne · maks. 50 MB / plik</span>
            </div>
            <Input
              id="file-upload"
              type="file"
              multiple
              onChange={handleFileChange}
              disabled={isUploading}
              className="hidden"
            />
          </Label>
        </div>

        <div className="group relative overflow-hidden rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50/40 via-white to-white p-5 shadow-sm transition-all duration-300 hover:border-indigo-200 hover:shadow-md">
          <div className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full bg-indigo-200/20 blur-3xl" />
          <div className="relative flex items-start gap-3">
            <div className="shrink-0 rounded-xl bg-white p-2.5 shadow-sm ring-1 ring-indigo-100">
              <Link2 className="h-5 w-5 text-indigo-600" />
            </div>
            <div>
              <Label className="text-base font-black tracking-tight text-slate-900">Dodaj link</Label>
              <p className="mt-0.5 text-sm text-slate-500">Przydatne dla Google Drive, Figmy, Notion, repozytorium lub innych materiałów online.</p>
            </div>
          </div>

          <div className="relative mt-4 grid gap-3 md:grid-cols-[minmax(0,1fr)_220px_auto]">
            <Input
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddLink();
                }
              }}
              placeholder="drive.google.com/... albo https://drive.google.com/..."
              inputMode="url"
              className="h-11 rounded-xl border-slate-200 bg-white/80 backdrop-blur-sm transition-colors focus:border-indigo-300 focus-visible:ring-indigo-200"
            />
            <Input
              value={linkLabel}
              onChange={(e) => setLinkLabel(e.target.value)}
              placeholder="Nazwa linku (opcjonalnie)"
              maxLength={255}
              className="h-11 rounded-xl border-slate-200 bg-white/80 backdrop-blur-sm transition-colors focus:border-indigo-300 focus-visible:ring-indigo-200"
            />
            <Button
              type="button"
              onClick={handleAddLink}
              disabled={!linkUrl.trim()}
              className="h-11 gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 font-bold text-white shadow-[0_4px_14px_0_rgba(79,70,229,0.35)] transition-all hover:from-indigo-500 hover:to-indigo-400 hover:shadow-[0_6px_20px_0_rgba(79,70,229,0.45)] active:scale-[0.98] disabled:from-slate-200 disabled:to-slate-200 disabled:text-slate-400 disabled:shadow-none"
            >
              <Plus className="h-4 w-4" />
              Dodaj link
            </Button>
          </div>
        </div>

        {isUploading && (
          <div className="mt-4 flex items-center justify-center gap-2 text-indigo-600 font-medium animate-pulse">
            <Loader2 className="animate-spin h-5 w-5" />
            Wysyłanie plików...
          </div>
        )}

        {attachments.length > 0 && (
          <div className="space-y-2">
            {attachments.map((item, i) => (
              <div key={`${item.name}-${i}`} className="flex justify-between items-center p-3 bg-white rounded-xl border shadow-sm hover:border-indigo-200 transition-colors">
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="p-2 bg-slate-100 rounded text-slate-500">
                    {item.kind === "external_link" ? <Link2 className="w-4 h-4" /> : <File className="w-4 h-4" />}
                  </div>
                  <div className="min-w-0">
                    <div className="font-medium text-slate-700 truncate">{item.name}</div>
                    <div className="text-xs text-slate-400 truncate">
                      {item.kind === "external_link" ? item.url : "Plik do pobrania"}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setAttachments((prev) => prev.filter((_, idx) => idx !== i))}
                  className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label className="font-semibold text-slate-800">Opis realizacji (opcjonalne)</Label>
        <Textarea
          name="description"
          placeholder="Napisz krótko co zostało zrobione i co zawierają załączniki."
          className="min-h-[100px] border-slate-200 focus:border-indigo-300 rounded-xl resize-none"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>

      <Button
        type="submit"
        size="lg"
        className={`w-full font-bold text-lg rounded-xl py-3 md:py-6 shadow-[0_4px_14px_0_rgba(79,70,229,0.4)] transition-all hover:scale-[1.02] active:scale-[0.98]
          ${hasContent
            ? "bg-[#4F46E5] hover:bg-[#4338ca] text-white"
            : "bg-slate-200 text-slate-400 cursor-not-allowed shadow-none"}
        `}
        disabled={isUploading || !hasContent}
      >
        <Send className="w-5 h-5 mr-2" />
        Wyślij do akceptacji
      </Button>
    </form>
  );
}
