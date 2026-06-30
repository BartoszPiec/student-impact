import { jsonError, noStoreJson } from "@/lib/security/api-response";
import { isUuid } from "@/lib/security/validation";
import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { rejectCrossSiteRequest } from "@/lib/security/request-origin";
import { buildRateLimitKey, enforceRateLimit, getRequestIp } from "@/lib/rate-limit";
import { buildStorageRef, isSafeStoragePath } from "@/lib/security/storage";
import {
  sanitizeDownloadName,
  UPLOAD_POLICIES,
  validateUploadFile,
  type UploadPurpose,
} from "@/lib/security/upload-policy";
import { logCriticalError } from "@/lib/observability/error-log";

export const dynamic = "force-dynamic";

const PURPOSES = new Set<UploadPurpose>([
  "cv",
  "offer_attachment",
  "system_offer_attachment",
  "chat_attachment",
  "deliverable",
  "deliverable_resource",
  "portfolio_image",
]);

type RoleRow = {
  role: string | null;
};

type ConversationRow = {
  company_id: string | null;
  student_id: string | null;
};

type ApplicationRow = {
  student_id: string | null;
  offers: { company_id: string | null } | Array<{ company_id: string | null }> | null;
};

type ServiceOrderRow = {
  company_id: string | null;
  student_id: string | null;
};

class UploadRequestError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "UploadRequestError";
  }
}

function readErrorCode(error: unknown): string | null {
  if (!error || typeof error !== "object" || !("code" in error)) return null;
  const code = (error as { code?: unknown }).code;
  return typeof code === "string" && code.trim().length > 0 ? code.trim() : null;
}

async function logUploadRouteError(input: {
  source: string;
  error?: unknown;
  userId?: string | null;
  level?: "error" | "warning" | "info";
  context?: Record<string, unknown>;
}) {
  await logCriticalError({
    source: input.source,
    error: input.error,
    errorCode: readErrorCode(input.error),
    level: input.level ?? "error",
    userId: input.userId ?? null,
    context: input.context,
  });
}

function unwrapRelation<T>(value: T | T[] | null | undefined): T | null {
  return Array.isArray(value) ? value[0] ?? null : value ?? null;
}

async function getRole(userId: string): Promise<string | null> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("profiles")
    .select("role")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    await logUploadRouteError({
      source: "storage.upload.role_lookup",
      error,
      userId,
    });
    throw new UploadRequestError("Nie udało się zweryfikować roli użytkownika.", 500);
  }

  return (data as RoleRow | null)?.role ?? null;
}

async function assertConversationParticipant(userId: string, conversationId: string) {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("conversations")
    .select("company_id, student_id")
    .eq("id", conversationId)
    .maybeSingle();

  if (error) {
    await logUploadRouteError({
      source: "storage.upload.conversation_lookup",
      error,
      userId,
      context: { conversationId },
    });
    throw new UploadRequestError("Nie udało się zweryfikować dostępu do rozmowy.", 500);
  }

  const conversation = data as ConversationRow | null;
  if (conversation?.company_id !== userId && conversation?.student_id !== userId) {
    throw new UploadRequestError("Brak dostępu do tej rozmowy.", 403);
  }
}

async function assertSourceParticipant(userId: string, sourceId: string, studentOnly: boolean) {
  const admin = createAdminClient();
  const { data: applicationData, error: applicationError } = await admin
    .from("applications")
    .select("student_id, offers(company_id)")
    .eq("id", sourceId)
    .maybeSingle();

  if (applicationError) {
    await logUploadRouteError({
      source: "storage.upload.application_lookup",
      error: applicationError,
      userId,
      context: { sourceId, studentOnly },
    });
    throw new UploadRequestError("Nie udało się zweryfikować dostępu do zlecenia.", 500);
  }

  const application = applicationData as ApplicationRow | null;
  const offer = unwrapRelation(application?.offers ?? null);
  if (application) {
    const isStudent = application.student_id === userId;
    const isCompany = offer?.company_id === userId;
    if ((studentOnly && isStudent) || (!studentOnly && (isStudent || isCompany))) return;
  }

  const { data: serviceOrderData, error: serviceOrderError } = await admin
    .from("service_orders")
    .select("company_id, student_id")
    .eq("id", sourceId)
    .maybeSingle();

  if (serviceOrderError) {
    await logUploadRouteError({
      source: "storage.upload.service_order_lookup",
      error: serviceOrderError,
      userId,
      context: { sourceId, studentOnly },
    });
    throw new UploadRequestError("Nie udało się zweryfikować dostępu do zlecenia.", 500);
  }

  const serviceOrder = serviceOrderData as ServiceOrderRow | null;
  if (serviceOrder) {
    const isStudent = serviceOrder.student_id === userId;
    const isCompany = serviceOrder.company_id === userId;
    if ((studentOnly && isStudent) || (!studentOnly && (isStudent || isCompany))) return;
  }

  throw new UploadRequestError("Brak dostępu do tego zlecenia.", 403);
}

function requireString(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "").trim();
}

function safeObjectPath(purpose: UploadPurpose, userId: string, fileId: string, extension: string, params: { sourceId?: string; conversationId?: string }) {
  switch (purpose) {
    case "cv":
      return `${userId}/${fileId}.${extension}`;
    case "offer_attachment":
      return `offers/${userId}/${fileId}.${extension}`;
    case "system_offer_attachment":
      return `system/${userId}/${fileId}.${extension}`;
    case "chat_attachment":
      return `${params.conversationId}/${userId}/${fileId}.${extension}`;
    case "deliverable":
      return `${params.sourceId}/${userId}/${fileId}.${extension}`;
    case "deliverable_resource":
      return `resources/${params.sourceId}/${userId}/${fileId}.${extension}`;
    case "portfolio_image":
      return `${userId}/${fileId}.${extension}`;
  }
}

export async function POST(req: NextRequest) {
  const crossSiteResponse = rejectCrossSiteRequest(req);
  if (crossSiteResponse) return crossSiteResponse;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return jsonError("Musisz być zalogowany.", 401);
  }

  const limit = await enforceRateLimit("upload", buildRateLimitKey(["upload", user.id, getRequestIp(req)]));
  if (!limit.success) {
    return jsonError("Zbyt wiele prób przesyłania plików. Spróbuj ponownie za chwilę.", 429);
  }

  try {
    const formData = await req.formData();
    const purposeRaw = requireString(formData, "purpose");
    if (!PURPOSES.has(purposeRaw as UploadPurpose)) {
      return jsonError("Nieprawidłowy typ uploadu.", 400);
    }

    const purpose = purposeRaw as UploadPurpose;
    const file = formData.get("file");
    if (!(file instanceof File)) {
      return jsonError("Brak pliku do przesłania.", 400);
    }

    const validation = validateUploadFile(file, purpose);
    if (!validation.ok) {
      return jsonError(validation.error, 400);
    }

    const role = await getRole(user.id);
    if (purpose === "cv" && role !== "student") {
      return jsonError("CV może przesłać tylko konto studenta.", 403);
    }
    if (purpose === "offer_attachment" && role !== "company") {
      return jsonError("Załącznik oferty może przesłać tylko konto firmy.", 403);
    }
    if (purpose === "system_offer_attachment" && role !== "admin") {
      return jsonError("Brak uprawnień administratora do tego uploadu.", 403);
    }

    const sourceId = requireString(formData, "sourceId");
    const conversationId = requireString(formData, "conversationId");

    if (purpose === "chat_attachment") {
      if (!conversationId) return jsonError("Brak identyfikatora rozmowy.", 400);
      if (!isUuid(conversationId)) return jsonError("Nieprawidłowy identyfikator rozmowy.", 400);
      await assertConversationParticipant(user.id, conversationId);
    }

    if (purpose === "deliverable" || purpose === "deliverable_resource") {
      if (!sourceId) return jsonError("Brak identyfikatora zlecenia.", 400);
      if (!isUuid(sourceId)) return jsonError("Nieprawidłowy identyfikator zlecenia.", 400);
      await assertSourceParticipant(user.id, sourceId, purpose === "deliverable");
    }

    const policy = UPLOAD_POLICIES[purpose];
    const fileId = crypto.randomUUID();
    const path = safeObjectPath(purpose, user.id, fileId, validation.extension, { sourceId, conversationId });
    if (!isSafeStoragePath(path)) {
      return jsonError("Nieprawidłowa ścieżka pliku.", 400);
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const admin = createAdminClient();
    const { error: uploadError } = await admin.storage.from(policy.bucket).upload(path, buffer, {
      contentType: file.type,
      upsert: false,
    });

    if (uploadError) {
      await logUploadRouteError({
        source: "storage.upload.failed",
        error: uploadError,
        userId: user.id,
        context: {
          bucket: policy.bucket,
          purpose,
          contentType: file.type,
          size: file.size,
          storagePath: path,
        },
      });
      return jsonError("Nie udało się zapisać pliku.", 500);
    }

    const bucket = policy.bucket;
    const ref = bucket === "portfolio"
      ? admin.storage.from("portfolio").getPublicUrl(path).data.publicUrl
      : buildStorageRef(bucket, path);

    return noStoreJson(
      {
        bucket,
        path,
        ref,
        name: sanitizeDownloadName(file.name),
        size: file.size,
        contentType: file.type,
      },
    );
  } catch (error) {
    if (error instanceof UploadRequestError) {
      return jsonError(error.message, error.status);
    }

    await logUploadRouteError({
      source: "storage.upload.unhandled",
      error,
      userId: user.id,
    });
    return jsonError("Nie udało się przesłać pliku.", 500);
  }
}
