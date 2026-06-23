import type { PrivateStorageBucket } from "@/lib/security/storage";

export type UploadPurpose =
  | "cv"
  | "offer_attachment"
  | "system_offer_attachment"
  | "chat_attachment"
  | "deliverable"
  | "deliverable_resource"
  | "portfolio_image";

export type UploadPolicy = {
  bucket: PrivateStorageBucket | "portfolio";
  maxBytes: number;
  allowedMimeTypes: Set<string>;
  allowedExtensions: Set<string>;
};

const DOC_MIME_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

const OFFICE_MIME_TYPES = [
  ...DOC_MIME_TYPES,
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "text/plain",
  "text/csv",
  "text/markdown",
];

const IMAGE_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
];

const ARCHIVE_MIME_TYPES = [
  "application/zip",
  "application/x-zip-compressed",
  "application/x-rar-compressed",
  "application/x-7z-compressed",
];

export const UPLOAD_POLICIES: Record<UploadPurpose, UploadPolicy> = {
  cv: {
    bucket: "cvs",
    maxBytes: 10 * 1024 * 1024,
    allowedMimeTypes: new Set(DOC_MIME_TYPES),
    allowedExtensions: new Set(["pdf", "doc", "docx"]),
  },
  offer_attachment: {
    bucket: "offer_attachments",
    maxBytes: 25 * 1024 * 1024,
    allowedMimeTypes: new Set([...OFFICE_MIME_TYPES, ...IMAGE_MIME_TYPES, ...ARCHIVE_MIME_TYPES]),
    allowedExtensions: new Set(["pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx", "txt", "csv", "md", "jpg", "jpeg", "png", "gif", "webp", "zip", "rar", "7z"]),
  },
  system_offer_attachment: {
    bucket: "offer_attachments",
    maxBytes: 25 * 1024 * 1024,
    allowedMimeTypes: new Set([...OFFICE_MIME_TYPES, ...IMAGE_MIME_TYPES, ...ARCHIVE_MIME_TYPES]),
    allowedExtensions: new Set(["pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx", "txt", "csv", "md", "jpg", "jpeg", "png", "gif", "webp", "zip", "rar", "7z"]),
  },
  chat_attachment: {
    bucket: "chat-attachments",
    maxBytes: 20 * 1024 * 1024,
    allowedMimeTypes: new Set([...OFFICE_MIME_TYPES, ...IMAGE_MIME_TYPES, ...ARCHIVE_MIME_TYPES]),
    allowedExtensions: new Set(["pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx", "txt", "csv", "md", "jpg", "jpeg", "png", "gif", "webp", "zip", "rar", "7z"]),
  },
  deliverable: {
    bucket: "deliverables",
    maxBytes: 50 * 1024 * 1024,
    allowedMimeTypes: new Set([...OFFICE_MIME_TYPES, ...IMAGE_MIME_TYPES, ...ARCHIVE_MIME_TYPES]),
    allowedExtensions: new Set(["pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx", "txt", "csv", "md", "jpg", "jpeg", "png", "gif", "webp", "zip", "rar", "7z"]),
  },
  deliverable_resource: {
    bucket: "deliverables",
    maxBytes: 50 * 1024 * 1024,
    allowedMimeTypes: new Set([...OFFICE_MIME_TYPES, ...IMAGE_MIME_TYPES, ...ARCHIVE_MIME_TYPES]),
    allowedExtensions: new Set(["pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx", "txt", "csv", "md", "jpg", "jpeg", "png", "gif", "webp", "zip", "rar", "7z"]),
  },
  portfolio_image: {
    bucket: "portfolio",
    maxBytes: 5 * 1024 * 1024,
    allowedMimeTypes: new Set(IMAGE_MIME_TYPES),
    allowedExtensions: new Set(["jpg", "jpeg", "png", "gif", "webp"]),
  },
};

export function getFileExtension(fileName: string): string {
  const ext = fileName.split(".").pop()?.toLowerCase().trim() ?? "";
  return /^[a-z0-9]{1,12}$/.test(ext) ? ext : "";
}

export function sanitizeDownloadName(fileName: string): string {
  const fallback = "plik";
  const cleaned = fileName
    .replace(/[/\\?%*:|"<>]/g, "_")
    .replace(/[\u0000-\u001f\u007f]/g, "")
    .trim()
    .slice(0, 160);

  return cleaned || fallback;
}

export function validateUploadFile(file: File, purpose: UploadPurpose): { ok: true; extension: string } | { ok: false; error: string } {
  const policy = UPLOAD_POLICIES[purpose];
  const extension = getFileExtension(file.name);

  if (!extension || !policy.allowedExtensions.has(extension)) {
    return { ok: false, error: "Ten typ pliku nie jest dozwolony." };
  }

  if (!policy.allowedMimeTypes.has(file.type)) {
    return { ok: false, error: "Nieprawidlowy typ MIME pliku." };
  }

  if (file.size <= 0 || file.size > policy.maxBytes) {
    return { ok: false, error: "Plik jest pusty albo przekracza dozwolony limit rozmiaru." };
  }

  return { ok: true, extension };
}
