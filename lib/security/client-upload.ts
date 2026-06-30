"use client";

import type { UploadPurpose } from "@/lib/security/upload-policy";
export { storageDownloadUrl } from "@/lib/security/storage-url";

export type UploadedFileResult = {
  bucket: string;
  path: string;
  ref: string;
  name: string;
  size: number;
  contentType: string;
};

export async function uploadPrivateFile(params: {
  file: File;
  purpose: UploadPurpose;
  sourceId?: string;
  conversationId?: string;
}): Promise<UploadedFileResult> {
  const formData = new FormData();
  formData.set("file", params.file);
  formData.set("purpose", params.purpose);
  if (params.sourceId) formData.set("sourceId", params.sourceId);
  if (params.conversationId) formData.set("conversationId", params.conversationId);

  const response = await fetch("/api/storage/upload", {
    method: "POST",
    body: formData,
  });

  const payload = (await response.json().catch(() => null)) as { error?: string } | UploadedFileResult | null;

  if (!response.ok) {
    throw new Error(payload && "error" in payload && payload.error ? payload.error : "Nie udało sie przesłać pliku.");
  }

  if (!payload || !("ref" in payload)) {
    throw new Error("Nieprawidłowa odpowiedz serwera po przeslaniu pliku.");
  }

  return payload;
}
