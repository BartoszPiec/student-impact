import { NextRequest, NextResponse } from "next/server";
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
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

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

function jsonError(error: string, status: number) {
  return NextResponse.json({ error }, { status, headers: { "Cache-Control": "no-store" } });
}

function unwrapRelation<T>(value: T | T[] | null | undefined): T | null {
  return Array.isArray(value) ? value[0] ?? null : value ?? null;
}

function isUuid(value: string): boolean {
  return UUID_RE.test(value);
}

async function getRole(userId: string): Promise<string | null> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("profiles")
    .select("role")
    .eq("user_id", userId)
    .maybeSingle();

  return (data as RoleRow | null)?.role ?? null;
}

async function assertConversationParticipant(userId: string, conversationId: string) {
  const admin = createAdminClient();
  const { data } = await admin
    .from("conversations")
    .select("company_id, student_id")
    .eq("id", conversationId)
    .maybeSingle();

  const conversation = data as ConversationRow | null;
  if (conversation?.company_id !== userId && conversation?.student_id !== userId) {
    throw new Error("Brak dostepu do tej rozmowy.");
  }
}

async function assertSourceParticipant(userId: string, sourceId: string, studentOnly: boolean) {
  const admin = createAdminClient();
  const { data: applicationData } = await admin
    .from("applications")
    .select("student_id, offers(company_id)")
    .eq("id", sourceId)
    .maybeSingle();

  const application = applicationData as ApplicationRow | null;
  const offer = unwrapRelation(application?.offers ?? null);
  if (application) {
    const isStudent = application.student_id === userId;
    const isCompany = offer?.company_id === userId;
    if ((studentOnly && isStudent) || (!studentOnly && (isStudent || isCompany))) return;
  }

  const { data: serviceOrderData } = await admin
    .from("service_orders")
    .select("company_id, student_id")
    .eq("id", sourceId)
    .maybeSingle();

  const serviceOrder = serviceOrderData as ServiceOrderRow | null;
  if (serviceOrder) {
    const isStudent = serviceOrder.student_id === userId;
    const isCompany = serviceOrder.company_id === userId;
    if ((studentOnly && isStudent) || (!studentOnly && (isStudent || isCompany))) return;
  }

  throw new Error("Brak dostepu do tego zlecenia.");
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
    return jsonError("Musisz byc zalogowany.", 401);
  }

  const limit = await enforceRateLimit("upload", buildRateLimitKey(["upload", user.id, getRequestIp(req)]));
  if (!limit.success) {
    return jsonError("Zbyt wiele prób przesyłania plikow. Spróbuj ponownie za chwile.", 429);
  }

  try {
    const formData = await req.formData();
    const purposeRaw = requireString(formData, "purpose");
    if (!PURPOSES.has(purposeRaw as UploadPurpose)) {
      return jsonError("Nieprawidlowy typ uploadu.", 400);
    }

    const purpose = purposeRaw as UploadPurpose;
    const file = formData.get("file");
    if (!(file instanceof File)) {
      return jsonError("Brak pliku do przeslania.", 400);
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
      return jsonError("Zalacznik oferty może przesłać tylko konto firmy.", 403);
    }
    if (purpose === "system_offer_attachment" && role !== "admin") {
      return jsonError("Brak uprawnien administratora do tego uploadu.", 403);
    }

    const sourceId = requireString(formData, "sourceId");
    const conversationId = requireString(formData, "conversationId");

    if (purpose === "chat_attachment") {
      if (!conversationId) return jsonError("Brak identyfikatora rozmowy.", 400);
      if (!isUuid(conversationId)) return jsonError("Nieprawidlowy identyfikator rozmowy.", 400);
      await assertConversationParticipant(user.id, conversationId);
    }

    if (purpose === "deliverable" || purpose === "deliverable_resource") {
      if (!sourceId) return jsonError("Brak identyfikatora zlecenia.", 400);
      if (!isUuid(sourceId)) return jsonError("Nieprawidlowy identyfikator zlecenia.", 400);
      await assertSourceParticipant(user.id, sourceId, purpose === "deliverable");
    }

    const policy = UPLOAD_POLICIES[purpose];
    const fileId = crypto.randomUUID();
    const path = safeObjectPath(purpose, user.id, fileId, validation.extension, { sourceId, conversationId });
    if (!isSafeStoragePath(path)) {
      return jsonError("Nieprawidłowa sciezka pliku.", 400);
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const admin = createAdminClient();
    const { error: uploadError } = await admin.storage.from(policy.bucket).upload(path, buffer, {
      contentType: file.type,
      upsert: false,
    });

    if (uploadError) {
      console.error("[storage-upload] upload failed:", uploadError.message);
      return jsonError("Nie udało sie zapisać pliku.", 500);
    }

    const bucket = policy.bucket;
    const ref = bucket === "portfolio"
      ? admin.storage.from("portfolio").getPublicUrl(path).data.publicUrl
      : buildStorageRef(bucket, path);

    return NextResponse.json(
      {
        bucket,
        path,
        ref,
        name: sanitizeDownloadName(file.name),
        size: file.size,
        contentType: file.type,
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Nie udało sie przesłać pliku.";
    return jsonError(message, 400);
  }
}
