import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

export type PrivateStorageBucket = "cvs" | "offer_attachments" | "chat-attachments" | "deliverables";

export type StorageReference = {
  bucket: PrivateStorageBucket;
  path: string;
  ref: string;
};

type RoleRow = {
  role: string | null;
};

type ApplicationCvRow = {
  student_id: string | null;
  offers: { company_id: string | null } | Array<{ company_id: string | null }> | null;
};

type ConversationRow = {
  company_id: string | null;
  student_id: string | null;
};

type ContractRow = {
  company_id: string | null;
  student_id: string | null;
};

type OfferRow = {
  company_id: string | null;
};

type ServiceOrderRow = {
  company_id: string | null;
  student_id: string | null;
};

const PRIVATE_BUCKETS = new Set<PrivateStorageBucket>([
  "cvs",
  "offer_attachments",
  "chat-attachments",
  "deliverables",
]);

const STORAGE_REF_RE = /^storage:\/\/([^/]+)\/(.+)$/;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isUuid(value: string): boolean {
  return UUID_RE.test(value);
}

export function buildStorageRef(bucket: PrivateStorageBucket, path: string): string {
  return `storage://${bucket}/${path.replace(/^\/+/, "")}`;
}

export function isSafeStoragePath(path: string): boolean {
  if (!path || path.length > 1024) return false;
  if (path.startsWith("/") || path.includes("\\")) return false;
  if (path.split("/").some((segment) => segment === "" || segment === "." || segment === "..")) return false;
  return !/[\u0000-\u001f\u007f]/.test(path);
}

export function parseStorageRef(value: string): StorageReference | null {
  const raw = String(value || "").trim();
  const directMatch = raw.match(STORAGE_REF_RE);

  if (directMatch) {
    const bucket = directMatch[1] as PrivateStorageBucket;
    const path = directMatch[2].replace(/^\/+/, "");
    if (!PRIVATE_BUCKETS.has(bucket) || !isSafeStoragePath(path)) return null;
    return { bucket, path, ref: buildStorageRef(bucket, path) };
  }

  try {
    const url = new URL(raw);
    const match = url.pathname.match(/\/storage\/v1\/object\/(?:public|sign|authenticated)\/([^/]+)\/(.+)$/);
    if (!match) return null;

    const bucket = decodeURIComponent(match[1]) as PrivateStorageBucket;
    const path = decodeURIComponent(match[2]).replace(/^\/+/, "");
    if (!PRIVATE_BUCKETS.has(bucket) || !isSafeStoragePath(path)) return null;
    return { bucket, path, ref: buildStorageRef(bucket, path) };
  } catch {
    return null;
  }
}

function unwrapRelation<T>(value: T | T[] | null | undefined): T | null {
  return Array.isArray(value) ? value[0] ?? null : value ?? null;
}

async function isAdminUser(userId: string): Promise<boolean> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("profiles")
    .select("role")
    .eq("user_id", userId)
    .maybeSingle<RoleRow>();

  return data?.role === "admin";
}

async function userCanAccessCv(userId: string, ref: StorageReference): Promise<boolean> {
  if (ref.path.startsWith(`${userId}/`)) return true;

  const admin = createAdminClient();
  const { data } = await admin
    .from("applications")
    .select("student_id, offers(company_id)")
    .eq("cv_url", ref.ref)
    .limit(1)
    .maybeSingle<ApplicationCvRow>();

  const offer = unwrapRelation(data?.offers ?? null);
  return data?.student_id === userId || offer?.company_id === userId;
}

async function userCanAccessChatAttachment(userId: string, ref: StorageReference): Promise<boolean> {
  const [conversationId] = ref.path.split("/");
  if (!conversationId || !isUuid(conversationId)) return false;

  const admin = createAdminClient();
  const { data } = await admin
    .from("conversations")
    .select("company_id, student_id")
    .eq("id", conversationId)
    .maybeSingle<ConversationRow>();

  return data?.company_id === userId || data?.student_id === userId;
}

async function userCanAccessDeliverable(userId: string, ref: StorageReference): Promise<boolean> {
  const parts = ref.path.split("/");
  const sourceId = parts[0] === "resources" ? parts[1] : parts[0];
  if (!sourceId || !isUuid(sourceId)) return false;

  const admin = createAdminClient();

  const { data: application } = await admin
    .from("applications")
    .select("student_id, offers(company_id)")
    .eq("id", sourceId)
    .maybeSingle<ApplicationCvRow>();

  const offer = unwrapRelation(application?.offers ?? null);
  if (application?.student_id === userId || offer?.company_id === userId) return true;

  const { data: serviceOrder } = await admin
    .from("service_orders")
    .select("company_id, student_id")
    .eq("id", sourceId)
    .maybeSingle<ServiceOrderRow>();

  if (serviceOrder?.company_id === userId || serviceOrder?.student_id === userId) return true;

  const { data: contract } = await admin
    .from("contracts")
    .select("company_id, student_id")
    .or(`application_id.eq.${sourceId},service_order_id.eq.${sourceId}`)
    .limit(1)
    .maybeSingle<ContractRow>();

  return contract?.company_id === userId || contract?.student_id === userId;
}

async function userCanAccessOfferAttachment(userId: string, ref: StorageReference): Promise<boolean> {
  const parts = ref.path.split("/");
  if ((parts[0] === "offers" || parts[0] === "system") && parts[1] === userId) return true;

  const admin = createAdminClient();
  const { data: ownOffer } = await admin
    .from("offers")
    .select("company_id")
    .eq("company_id", userId)
    .ilike("obligations", `%${ref.ref}%`)
    .limit(1)
    .maybeSingle<OfferRow>();

  return ownOffer?.company_id === userId;
}

export async function assertCanAccessStorageRef(userId: string, value: string): Promise<StorageReference> {
  const ref = parseStorageRef(value);
  if (!ref) {
    throw new Error("Nieprawidłowa referencja pliku.");
  }

  if (await isAdminUser(userId)) {
    return ref;
  }

  const allowed =
    ref.bucket === "cvs"
      ? await userCanAccessCv(userId, ref)
      : ref.bucket === "chat-attachments"
        ? await userCanAccessChatAttachment(userId, ref)
        : ref.bucket === "deliverables"
          ? await userCanAccessDeliverable(userId, ref)
          : await userCanAccessOfferAttachment(userId, ref);

  if (!allowed) {
    throw new Error("Brak dostepu do pliku.");
  }

  return ref;
}

export async function assertUploadedObjectExists(ref: StorageReference): Promise<void> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .schema("storage")
    .from("objects")
    .select("id")
    .eq("bucket_id", ref.bucket)
    .eq("name", ref.path)
    .maybeSingle<{ id: string }>();

  if (error || !data) {
    throw new Error("Nie znaleziono przeslanego pliku.");
  }
}

export async function createPrivateSignedUrl(
  ref: StorageReference,
  options: { expiresInSeconds?: number; download?: string | boolean } = {},
): Promise<string> {
  const admin = createAdminClient();
  const { data, error } = await admin.storage.from(ref.bucket).createSignedUrl(
    ref.path,
    options.expiresInSeconds ?? 600,
    options.download ? { download: options.download } : undefined,
  );

  if (error || !data?.signedUrl) {
    throw new Error("Nie udało sie wygenerowac linku do pliku.");
  }

  return data.signedUrl;
}

export function getStorageSourceId(ref: StorageReference): string | null {
  const parts = ref.path.split("/");
  return parts[0] === "resources" ? parts[1] ?? null : parts[0] ?? null;
}
