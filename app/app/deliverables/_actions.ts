"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { normalizeFullFundingContractState } from "@/lib/services/full-funding-contract-state";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import React from "react";
import { z } from "zod";
import { resolveCommissionRate } from "@/lib/commission";
import {
  assertKsefReadyForFinalStageAcceptance,
  ensureKsefInvoiceJobForCompletedContract,
} from "@/lib/ksef/invoice-jobs";
import { trySendNotification } from "@/lib/notifications/server";
import { transferLatestPayoutForMilestone } from "@/lib/stripe/payouts";
import { UUID_RE } from "@/lib/security/validation";
import { logCriticalError } from "@/lib/observability/error-log";
import {
  assertCanAccessStorageRef,
  assertUploadedObjectExists,
  buildStorageRef,
  createPrivateSignedUrl,
  parseStorageRef,
  type PrivateStorageBucket,
} from "@/lib/security/storage";
import {
  calculateOverallReviewRating,
  normalizeReviewCategoryRatings,
  serializeDetailedReviewComment,
  type DetailedReviewInput,
  type ReviewCategoryRatings,
} from "@/lib/reviews";
import type { ContractData } from "@/lib/pdf/types";

type AppSupabaseClient = Awaited<ReturnType<typeof createClient>>;
type JsonPayload = Record<string, unknown>;
type RelationValue<T> = T | T[] | null;
type DeliverableAttachment =
  | {
      kind?: "file";
      name: string;
      bucket: string;
      path: string;
      size?: number;
      url?: string;
    }
  | {
      kind: "external_link";
      name: string;
      url: string;
    };

type OfferSummaryRow = {
  company_id: string | null;
  tytul: string | null;
};

type PackageSummaryRow = {
  title: string | null;
  type?: string | null;
};

type OfferDetailRow = {
  tytul: string | null;
  opis: string | null;
};

type ContractMilestoneRow = {
  idx: number | null;
  title: string | null;
  amount: number | string | null;
  amount_minor?: number | string | null;
  acceptance_criteria: string | null;
  status: string | null;
  due_at?: string | null;
};

type ContractWithMilestonesRow = {
  company_id: string;
  student_id: string;
  application_id: string | null;
  service_order_id: string | null;
  commission_rate?: number | string | null;
  total_amount: number | string | null;
  total_amount_minor?: number | string | null;
  currency: string | null;
  review_window_days: number | null;
  milestones: ContractMilestoneRow[] | null;
};

type ApplicationDeliverableRow = {
  student_id: string | null;
  offers: RelationValue<Pick<OfferSummaryRow, "tytul">>;
};

type DeliverableReviewRow = {
  application_id: string | null;
  company_id: string | null;
  applications: RelationValue<ApplicationDeliverableRow>;
};

type ReviewApplicationRow = {
  student_id: string;
  offer_id: string | null;
  offers: RelationValue<OfferSummaryRow>;
};

type ReviewServiceOrderRow = {
  company_id: string;
  student_id: string;
};

type ReviewPayload = {
  reviewer_id: string;
  reviewee_id: string;
  application_id: string | null;
  service_order_id: string | null;
  reviewer_role: "student" | "company";
  rating: number;
  comment: string | null;
  company_id: string;
  student_id: string;
  offer_id?: string;
};

type ReviewContractRow = {
  id: string;
  status: string | null;
  application_id: string | null;
  service_order_id: string | null;
  milestones: Array<{ status: string | null }> | null;
};

type ContractDocumentAcceptanceRow = {
  id: string;
  contract_id: string;
  document_type: string;
};

type ApplicationOfferDetailsRow = {
  offers: RelationValue<OfferDetailRow>;
};

type ServiceOrderOfferDetailsRow = {
  package: RelationValue<PackageSummaryRow>;
};

type ContractApplicationsRow = {
  offers: RelationValue<Pick<OfferSummaryRow, "tytul">>;
};

type ContractNotificationRow = {
  student_id: string | null;
  total_amount: number | string | null;
  applications: RelationValue<ContractApplicationsRow>;
};

type ContractSourceRow = {
  company_id: string | null;
  student_id: string | null;
  application_id: string | null;
  service_order_id: string | null;
  status?: string | null;
  company_contract_accepted_at?: string | null;
  student_contract_accepted_at?: string | null;
  milestones?: Array<{ status: string | null }> | null;
};

type MilestoneContractCompanyRow = {
  company_id: string | null;
  application_id: string | null;
  applications: RelationValue<ContractApplicationsRow>;
};

type MilestoneCompanyNotificationRow = {
  title: string | null;
  contracts: RelationValue<MilestoneContractCompanyRow>;
};

type MilestoneContractStudentRow = {
  student_id: string | null;
  application_id: string | null;
  applications: RelationValue<ContractApplicationsRow>;
};

type MilestoneStudentNotificationRow = {
  title: string | null;
  amount: number | string | null;
  contracts: RelationValue<MilestoneContractStudentRow>;
};

type DeliverableSource = {
  id: string;
  type: "application" | "service_order";
  companyId: string;
  studentId: string;
  offerId: string | null;
  title: string | null;
};

type MilestoneSourceRow = {
  contracts: RelationValue<{
    id: string;
    company_id: string | null;
    student_id: string | null;
    application_id: string | null;
    service_order_id: string | null;
  }>;
};

type MilestoneSequenceRow = {
  id: string;
  contract_id: string | null;
  idx: number | null;
  status: string | null;
};

type ResourceOwnerRow = {
  uploader_id: string | null;
  application_id: string | null;
  service_order_id: string | null;
};

type SecretOwnerRow = {
  author_id: string | null;
  application_id: string | null;
  service_order_id: string | null;
};

type DeliverableLogLevel = "error" | "warning" | "info";

const PRIVATE_BUCKET_VALUES = ["cvs", "offer_attachments", "chat-attachments", "deliverables"] as const;
const uuidSchema = z.string().trim().regex(UUID_RE, "Nieprawidłowy identyfikator.");
const decisionSchema = z.enum(["accepted", "rejected"], {
  error: "Nieprawidłowa decyzja.",
});
const boundedTextSchema = (max: number, message: string) => z.string().trim().max(max, message);
const signedUrlSchema = z.object({
  bucket: z.enum(PRIVATE_BUCKET_VALUES),
  pathOrUrl: z.string().trim().min(1, "Brak ścieżki pliku.").max(2048, "Ścieżka pliku jest zbyt długa."),
  expiresInSeconds: z.coerce.number().int().min(60).max(3600).default(600),
  download: z.union([z.boolean(), z.string().trim().max(255)]).optional(),
});
const deliverableFormSchema = z.object({
  description: boundedTextSchema(10_000, "Opis jest zbyt długi."),
  filesJson: z.string().max(200_000, "Lista plików jest zbyt duża.").default("[]"),
});
const resourceFormSchema = z.object({
  filename: z.string().trim().min(1, "Brak nazwy pliku.").max(255, "Nazwa pliku jest zbyt długa."),
  filePathOrUrl: z.string().trim().min(1, "Brak ścieżki pliku.").max(2048, "Ścieżka pliku jest zbyt długa."),
});
const secretFormSchema = z.object({
  title: z.string().trim().min(1, "Podaj nazwę dostępu.").max(120, "Nazwa dostępu jest zbyt długa."),
  secretValue: z.string().trim().min(1, "Podaj wartość dostępu.").max(10_000, "Wartość dostępu jest zbyt długa."),
});
const reviewInputSchema = z.object({
  comment: boundedTextSchema(2_000, "Komentarz opinii jest zbyt długi.").default(""),
  categories: z.record(z.string(), z.union([z.number(), z.string(), z.null()])).default({}),
});

function parseOrThrow<T>(parsed: z.ZodSafeParseResult<T>): T {
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message || "Nieprawidłowe dane formularza.");
  }

  return parsed.data;
}

async function logDeliverableActionError(input: {
  source: string;
  error?: unknown;
  message?: string;
  level?: DeliverableLogLevel;
  userId?: string | null;
  contractId?: string | null;
  milestoneId?: string | null;
  applicationId?: string | null;
  serviceOrderId?: string | null;
  documentType?: string | null;
  storagePath?: string | null;
  context?: Record<string, unknown>;
}) {
  await logCriticalError({
    source: input.source,
    error: input.error,
    message: input.message,
    level: input.level ?? "error",
    userId: input.userId ?? null,
    contractId: input.contractId ?? null,
    context: {
      milestoneId: input.milestoneId ?? null,
      applicationId: input.applicationId ?? null,
      serviceOrderId: input.serviceOrderId ?? null,
      documentType: input.documentType ?? null,
      storagePath: input.storagePath ?? null,
      ...input.context,
    },
  });
}

function parseFilesJson(filesJson: string): unknown[] {
  try {
    const parsed = JSON.parse(filesJson);
    if (!Array.isArray(parsed)) throw new Error("not-array");
    return parsed;
  } catch {
    throw new Error("Nieprawidłowe dane plików.");
  }
}

function unwrapRelation<T>(value: RelationValue<T>): T | null {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
}

async function notifyUser(
  _supabase: AppSupabaseClient,
  userId: string,
  typ: string,
  payload: JsonPayload = {},
) {
  await trySendNotification(userId, typ, payload);
}

async function resolveDeliverableSource(
  supabase: AppSupabaseClient,
  sourceId: string,
  userId: string,
): Promise<DeliverableSource> {
  const { data: applicationData, error: applicationError } = await supabase
    .from("applications")
    .select("id, student_id, offers(company_id, tytul)")
    .eq("id", sourceId)
    .maybeSingle();

  if (applicationError) throw new Error("Nie udało się sprawdzić zlecenia.");

  const application = applicationData as ReviewApplicationRow | null;
  if (application) {
    const offer = unwrapRelation(application.offers);
    const companyId = offer?.company_id ?? "";
    if (!application.student_id || !companyId) throw new Error("Brak danych stron zlecenia.");
    if (application.student_id !== userId && companyId !== userId) throw new Error("Brak dostępu do zlecenia.");
    return {
      id: sourceId,
      type: "application",
      companyId,
      studentId: application.student_id,
      offerId: application.offer_id,
      title: offer?.tytul ?? null,
    };
  }

  const { data: serviceOrderData, error: serviceOrderError } = await supabase
    .from("service_orders")
    .select("id, company_id, student_id, package:service_packages(title)")
    .eq("id", sourceId)
    .maybeSingle();

  if (serviceOrderError) throw new Error("Nie udało się sprawdzić zlecenia.");

  const serviceOrder = serviceOrderData as (ReviewServiceOrderRow & {
    package: RelationValue<PackageSummaryRow>;
  }) | null;
  if (!serviceOrder) throw new Error("Nie znaleziono zlecenia.");
  if (serviceOrder.student_id !== userId && serviceOrder.company_id !== userId) {
    throw new Error("Brak dostępu do zlecenia.");
  }

  const servicePackage = unwrapRelation(serviceOrder.package);
  return {
    id: sourceId,
    type: "service_order",
    companyId: serviceOrder.company_id,
    studentId: serviceOrder.student_id,
    offerId: null,
    title: servicePackage?.title ?? null,
  };
}

async function assertMilestoneMatchesSource(
  supabase: AppSupabaseClient,
  params: {
    milestoneId: string;
    sourceId: string;
    userId: string;
    actor: "student" | "company";
  },
) {
  const { data, error } = await supabase
    .from("milestones")
    .select("contracts(id, company_id, student_id, application_id, service_order_id)")
    .eq("id", params.milestoneId)
    .maybeSingle();

  if (error) throw new Error("Nie udało się sprawdzić etapu.");

  const row = data as MilestoneSourceRow | null;
  const contract = unwrapRelation(row?.contracts ?? null);
  if (!contract) throw new Error("Nie znaleziono etapu.");

  const matchesSource = contract.application_id === params.sourceId || contract.service_order_id === params.sourceId;
  if (!matchesSource) throw new Error("Etap nie należy do wskazanego zlecenia.");

  if (params.actor === "student" && contract.student_id !== params.userId) {
    throw new Error("Tylko przypisany student może wykonać tę operację.");
  }

  if (params.actor === "company" && contract.company_id !== params.userId) {
    throw new Error("Tylko firma przypisana do zlecenia może wykonać tę operację.");
  }
}

async function assertMilestoneCanBeSubmittedInSequence(milestoneId: string) {
  const admin = createAdminClient();
  const submittableStatuses = new Set(["funded", "in_progress", "rejected"]);
  const acceptedStatuses = new Set(["released", "accepted", "completed", "refunded"]);

  const { data: currentData, error: currentError } = await admin
    .from("milestones")
    .select("id, contract_id, idx, status")
    .eq("id", milestoneId)
    .maybeSingle();

  const current = currentData as MilestoneSequenceRow | null;
  if (currentError || !current?.contract_id) {
    throw new Error("Nie udało się sprawdzić kolejności etapów.");
  }

  if (!submittableStatuses.has(String(current.status))) {
    throw new Error("Ten etap nie jest aktualnie dostępny do wysyłki.");
  }

  const { data: milestonesData, error: milestonesError } = await admin
    .from("milestones")
    .select("id, contract_id, idx, status")
    .eq("contract_id", current.contract_id);

  if (milestonesError) {
    throw new Error("Nie udało się sprawdzić poprzedniego etapu.");
  }

  const milestones = ((milestonesData || []) as MilestoneSequenceRow[]).sort((a, b) => {
    const aIdx = a.idx ?? Number.MAX_SAFE_INTEGER;
    const bIdx = b.idx ?? Number.MAX_SAFE_INTEGER;
    if (aIdx !== bIdx) return aIdx - bIdx;
    return a.id.localeCompare(b.id);
  });
  const currentIndex = milestones.findIndex((milestone) => milestone.id === milestoneId);
  const previousMilestone = currentIndex > 0 ? milestones[currentIndex - 1] : null;

  if (previousMilestone && !acceptedStatuses.has(String(previousMilestone.status))) {
    throw new Error("Ten etap będzie dostępny po akceptacji poprzedniego etapu.");
  }
}

function sourceColumnsFor(source: DeliverableSource): { application_id?: string; service_order_id?: string } {
  return source.type === "application"
    ? { application_id: source.id }
    : { service_order_id: source.id };
}

async function assertContractMatchesSource(
  _supabase: AppSupabaseClient,
  params: {
    contractId: string;
    sourceId: string;
    userId: string;
    allowAdmin?: boolean;
    includeMilestones?: boolean;
  },
): Promise<ContractSourceRow> {
  const admin = createAdminClient();
  const selectColumns = params.includeMilestones
    ? "company_id, student_id, application_id, service_order_id, status, company_contract_accepted_at, student_contract_accepted_at, milestones(status)"
    : "company_id, student_id, application_id, service_order_id";

  const { data, error } = await admin
    .from("contracts")
    .select(selectColumns)
    .eq("id", params.contractId)
    .maybeSingle();

  const contract = data as ContractSourceRow | null;
  if (error || !contract) throw new Error("Nie znaleziono kontraktu.");

  const matchesSource = contract.application_id === params.sourceId || contract.service_order_id === params.sourceId;
  if (!matchesSource) throw new Error("Kontrakt nie należy do wskazanego zlecenia.");

  const isParty = contract.company_id === params.userId || contract.student_id === params.userId;
  if (!isParty) {
    if (!params.allowAdmin) throw new Error("Brak uprawnień do tego kontraktu.");

    const { data: actorProfile } = await admin
      .from("profiles")
      .select("role")
      .eq("user_id", params.userId)
      .maybeSingle();

    if (actorProfile?.role !== "admin") throw new Error("Brak uprawnień do tego kontraktu.");
  }

  return contract;
}


export async function getSignedStorageUrl(
  bucket: string,
  pathOrUrl: string,
  expiresInSeconds: number = 600,
  download?: string | boolean,
) {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) redirect("/auth");

  const input = parseOrThrow(signedUrlSchema.safeParse({
    bucket,
    pathOrUrl,
    expiresInSeconds,
    download,
  }));
  const parsed = parseStorageRef(input.pathOrUrl);
  if (!parsed && /^[a-zA-Z][a-zA-Z\d+\-.]*:\/\//.test(input.pathOrUrl)) {
    throw new Error("Nieprawidłowa referencja pliku.");
  }
  const cleanPath = input.pathOrUrl.replace(/^\/+/, "");
  const storageRef = parsed
    ?? {
      bucket: input.bucket as PrivateStorageBucket,
      path: cleanPath,
      ref: buildStorageRef(input.bucket as PrivateStorageBucket, cleanPath),
    };

  const allowedRef = await assertCanAccessStorageRef(userData.user.id, storageRef.ref);
  return createPrivateSignedUrl(allowedRef, {
    expiresInSeconds: input.expiresInSeconds,
    download: input.download ?? true,
  });
}

/**
 * Returns a signed URL for a contract document (umowa A/B PDF).
 *
 * Contract PDFs are stored under `contracts/<contractId>/...` in the
 * `deliverables` bucket and are uploaded with the service-role client, so the
 * `deliverables_read_strict` storage RLS policy (which keys access off an
 * application/service-order id in the path) denies user-scoped reads and
 * Supabase reports "Object not found". We therefore verify the caller is a
 * party to the contract (company, student, or admin) here and sign the URL
 * with the admin client.
 */
export async function getContractDocumentSignedUrl(
  documentId: string,
  expiresInSeconds: number = 300,
  download?: string | boolean,
) {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) redirect("/auth");
  const userId = userData.user.id;
  const parsedDocumentId = parseOrThrow(uuidSchema.safeParse(documentId));
  const parsedExpiresInSeconds = parseOrThrow(z.coerce.number().int().min(60).max(3600).safeParse(expiresInSeconds));

  const admin = createAdminClient();

  const { data: docRow, error: docError } = await admin
    .from("contract_documents")
    .select("id, storage_path, file_name, contract:contracts(company_id, student_id)")
    .eq("id", parsedDocumentId)
    .maybeSingle();

  if (docError) throw new Error("Nie udało się pobrać dokumentu umowy.");
  if (!docRow?.storage_path) throw new Error("Nie znaleziono dokumentu umowy.");

  const contract = unwrapRelation(
    (docRow as { contract: RelationValue<{ company_id: string | null; student_id: string | null }> }).contract,
  );

  const isParty = contract?.company_id === userId || contract?.student_id === userId;
  if (!isParty) {
    const { data: profile } = await admin
      .from("profiles")
      .select("role")
      .eq("user_id", userId)
      .maybeSingle();
    if (profile?.role !== "admin") {
      throw new Error("Brak uprawnień do pobrania tej umowy.");
    }
  }

  const options = download ? { download: download === true ? (docRow.file_name ?? true) : download } : undefined;

  const { data, error } = await admin.storage
    .from("deliverables")
    .createSignedUrl(String(docRow.storage_path).replace(/^\/+/, ""), parsedExpiresInSeconds, options);

  if (error) throw new Error("Nie udało się wygenerować linku do dokumentu.");
  if (!data?.signedUrl) throw new Error("Nie udało się wygenerować linku do dokumentu.");

  return data.signedUrl;
}

function extractObjectPathFromPublicUrl(url: string): { bucket: string; path: string } | null {
  // Supports URLs like: .../storage/v1/object/public/<bucket>/<path>
  try {
    const u = new URL(url);
    const parts = u.pathname.split("/").filter(Boolean);
    const objIdx = parts.findIndex((p) => p === "object");
    if (objIdx === -1) return null;
    const pubIdx = parts.findIndex((p, i) => p === "public" && i > objIdx);
    if (pubIdx === -1) return null;
    const bucket = parts[pubIdx + 1];
    const path = parts.slice(pubIdx + 2).join("/");
    if (!bucket || !path) return null;
    return { bucket, path };
  } catch {
    return null;
  }
}

function normalizeExternalLink(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return "";
  if (/^[a-zA-Z][a-zA-Z\d+\-.]*:\/\//.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

function isSafeExternalLink(raw: string): boolean {
  try {
    const parsed = new URL(normalizeExternalLink(raw));
    return parsed.protocol === "https:" || parsed.protocol === "http:";
  } catch {
    return false;
  }
}

function normalizeDeliverableAttachments(value: unknown): DeliverableAttachment[] {
  if (!Array.isArray(value)) return [];

  return value.flatMap((item): DeliverableAttachment[] => {
    if (!item || typeof item !== "object" || Array.isArray(item)) return [];

    const row = item as Record<string, unknown>;
    const kind = typeof row.kind === "string" ? row.kind : "file";
    const name = typeof row.name === "string" ? row.name.trim() : "";
    if (!name || name.length > 255) return [];

    if (kind === "external_link") {
      const url = typeof row.url === "string" ? normalizeExternalLink(row.url) : "";
      if (!url || !isSafeExternalLink(url)) return [];
      return [{ kind: "external_link", name, url }];
    }

    const bucket = typeof row.bucket === "string" ? row.bucket.trim() : "";
    const path = typeof row.path === "string" ? row.path.trim().replace(/^\/+/, "") : "";
    if (bucket !== "deliverables" || !path) return [];

    const size = typeof row.size === "number" && Number.isFinite(row.size) && row.size >= 0
      ? row.size
      : undefined;

    return [{ kind: "file", name, bucket, path, size }];
  });
}

async function verifyDeliverableAttachments(
  userId: string,
  sourceId: string,
  attachments: DeliverableAttachment[],
  options: { resourceUpload?: boolean } = {},
) {
  const maxFiles = 20;
  if (attachments.length > maxFiles) {
    throw new Error("Mozesz dodac maksymalnie 20 zalacznikow.");
  }

  for (const attachment of attachments) {
    if (attachment.kind === "external_link") continue;

    const allowedPrefix = options.resourceUpload
      ? `resources/${sourceId}/${userId}/`
      : `${sourceId}/${userId}/`;

    if (attachment.bucket !== "deliverables" || !attachment.path.startsWith(allowedPrefix)) {
      throw new Error("Nieprawidłowa ścieżka załącznika.");
    }

    const ref = await assertCanAccessStorageRef(userId, buildStorageRef("deliverables", attachment.path));
    await assertUploadedObjectExists(ref);
  }
}

export async function submitDeliverable(applicationId: string, formData: FormData) {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) redirect("/auth");

  const parsedApplicationId = parseOrThrow(uuidSchema.safeParse(applicationId));
  const source = await resolveDeliverableSource(supabase, parsedApplicationId, userData.user.id);
  if (source.studentId !== userData.user.id) {
    throw new Error("Tylko przypisany student może przesłać pracę.");
  }

  const formInput = parseOrThrow(deliverableFormSchema.safeParse({
    description: formData.get("description") ?? "",
    filesJson: formData.get("filesJson") ?? "[]",
  }));
  const files = parseFilesJson(formInput.filesJson);
  const attachments = normalizeDeliverableAttachments(files);
  await verifyDeliverableAttachments(userData.user.id, parsedApplicationId, attachments);

  if (attachments.length === 0 && !formInput.description) {
    throw new Error("Musisz dodać pliki lub opis.");
  }

  const { error } = await supabase.rpc("submit_delivery", {
    p_source_id: parsedApplicationId,
    p_source_type: source.type,
    p_description: formInput.description,
    p_files: attachments,
  });
  if (error) throw new Error("Nie udało się przesłać pracy. Sprawdź status zlecenia i spróbuj ponownie.");

  try {
    await notifyUser(supabase, source.companyId, "deliverable_submitted", {
      application_id: parsedApplicationId,
      offer_title: source.title,
      snippet: `Student przesłał pracę do zlecenia "${source.title ?? "zlecenie"}". Sprawdź i zatwierdź!`,
    });
  } catch {}

  revalidatePath(`/app/deliverables/${parsedApplicationId}`);
}

export async function reviewDeliverable(deliverableId: string, status: "accepted" | "rejected", feedback: string) {
  const supabase = await createClient();
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) redirect("/auth");

  const parsedDeliverableId = parseOrThrow(uuidSchema.safeParse(deliverableId));
  const parsedDecision = parseOrThrow(decisionSchema.safeParse(status));
  const parsedFeedback = parseOrThrow(boundedTextSchema(5_000, "Informacja zwrotna jest zbyt długa.").safeParse(feedback ?? ""));

  const { data: delivData } = await supabase
    .from("deliverables")
    .select("application_id, company_id, applications(student_id, offers(tytul))")
    .eq("id", parsedDeliverableId)
    .maybeSingle();

  const deliv = delivData as DeliverableReviewRow | null;
  if (!deliv) throw new Error("Nie znaleziono oddanej pracy.");
  if (deliv.company_id !== user.user.id) throw new Error("Tylko firma przypisana do zlecenia może ocenić pracę.");

  const { error } = await supabase.rpc("review_deliverable_and_progress", {
    p_deliverable_id: parsedDeliverableId,
    p_decision: parsedDecision,
    p_feedback: parsedFeedback || null,
  });
  if (error) throw new Error("Nie udało się zapisać decyzji. Sprawdź status pracy i spróbuj ponownie.");

  try {
    const application = unwrapRelation(deliv.applications);
    const offer = unwrapRelation(application?.offers ?? null);
    const studentId = application?.student_id ?? null;
    const offerTitle = offer?.tytul ?? null;
    const appId = deliv?.application_id;
    if (studentId && appId) {
      const notifType = parsedDecision === "accepted" ? "deliverable_accepted" : "deliverable_rejected";
      const snippet = parsedDecision === "accepted"
        ? `Twoja praca do zlecenia "${offerTitle ?? "zlecenie"}" została zaakceptowana!`
        : `Praca do zlecenia "${offerTitle ?? "zlecenie"}" została odrzucona. Sprawdź uwagi i prześlij ponownie.`;
      await notifyUser(supabase, studentId, notifType, {
        application_id: appId,
        offer_title: offerTitle,
        snippet,
      });
    }
  } catch {}

  if (deliv?.application_id) {
    revalidatePath(`/app/deliverables/${deliv.application_id}`);
  }
}

export async function submitReview(applicationId: string, input: DetailedReviewInput) {
  const supabase = await createClient();
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) redirect("/auth");

  const reviewerId = user.user.id;
  const parsedApplicationId = parseOrThrow(uuidSchema.safeParse(applicationId));
  const parsedInput = parseOrThrow(reviewInputSchema.safeParse(input));
  const normalizedCategories = normalizeReviewCategoryRatings(parsedInput.categories as ReviewCategoryRatings);
  const hasAtLeastOneRatedCategory = Object.values(normalizedCategories).some((value) => typeof value === "number");

  if (!hasAtLeastOneRatedCategory) {
    throw new Error("Wybierz przynajmniej jedną kategorię oceny.");
  }

  const normalizedRating = calculateOverallReviewRating(normalizedCategories);
  const normalizedComment = serializeDetailedReviewComment({
    comment: parsedInput.comment,
    categories: normalizedCategories,
  });

  const source = await resolveDeliverableSource(supabase, parsedApplicationId, reviewerId);

  let role: "student" | "company";
  let revieweeId = "";

  if (reviewerId === source.studentId) {
    role = "student";
    revieweeId = source.companyId;
  } else if (reviewerId === source.companyId) {
    role = "company";
    revieweeId = source.studentId;
  } else {
    throw new Error("Nie jesteś stroną tej umowy.");
  }

  const contractQuery = supabase
    .from("contracts")
    .select("id, status, application_id, service_order_id, milestones(status)");

  const { data: contractData, error: contractError } =
    source.type === "application"
      ? await contractQuery.eq("application_id", parsedApplicationId).maybeSingle()
      : await contractQuery.eq("service_order_id", parsedApplicationId).maybeSingle();

  if (contractError) {
    throw new Error("Nie udało się sprawdzić statusu kontraktu.");
  }

  const reviewContract = contractData as ReviewContractRow | null;
  const reviewMilestones = reviewContract?.milestones ?? [];
  const allMilestonesReleased =
    reviewMilestones.length > 0 &&
    reviewMilestones.every((milestone) =>
      ["released", "accepted", "completed", "refunded"].includes(String(milestone.status)),
    );

  if (!reviewContract || (reviewContract.status !== "completed" && !allMilestonesReleased)) {
    throw new Error("Ocenę można wystawić dopiero po zakończeniu i rozliczeniu zlecenia.");
  }

  const existingReviewQuery = supabase
    .from("reviews")
    .select("id")
    .eq("reviewer_id", reviewerId);

  if (source.type === "application") {
    existingReviewQuery.eq("application_id", parsedApplicationId);
  } else {
    existingReviewQuery.eq("service_order_id", parsedApplicationId);
  }

  const { data: existingReview } = await existingReviewQuery.maybeSingle();
  if (existingReview) {
    throw new Error("Już wystawiłeś ocenę dla tego zlecenia.");
  }

  const reviewPayload: ReviewPayload = {
    reviewer_id: reviewerId,
    reviewee_id: revieweeId,
    application_id: source.type === "application" ? parsedApplicationId : null,
    service_order_id: source.type === "service_order" ? parsedApplicationId : null,
    reviewer_role: role,
    rating: normalizedRating,
    comment: normalizedComment,
    company_id: source.companyId,
    student_id: source.studentId,
  };

  if (source.offerId) reviewPayload.offer_id = source.offerId;

  const { error: insertErr } = await supabase.from("reviews").insert(reviewPayload);
  if (insertErr) throw new Error("Nie udało się zapisać opinii.");

  try {
    const ratingLabel = `${normalizedRating}/5`;
    const notifPayload = {
      application_id: parsedApplicationId,
      offer_title: source.title,
      rating: normalizedRating,
      snippet: `Otrzymałeś ocenę ${ratingLabel} za zlecenie "${source.title ?? "zlecenie"}".`,
    };
    await notifyUser(supabase, revieweeId, "review_received", notifPayload);
  } catch {}

  if (source.type === "application" && reviewContract.status === "completed") {
    await supabase.from("applications")
      .update({ status: "completed", realization_status: "completed" })
      .eq("id", parsedApplicationId)
      .neq("status", "completed")
      .in("status", ["accepted", "in_progress", "delivered"]);
  } else if (source.type === "service_order" && reviewContract.status === "completed") {
    await supabase.from("service_orders")
      .update({ status: "completed" })
      .eq("id", parsedApplicationId)
      .neq("status", "completed")
      .in("status", ["accepted", "active", "in_progress", "revision", "delivered"]);
  }

  revalidatePath(`/app/deliverables/${parsedApplicationId}`);
}

// --- NEW ACTIONS FOR RESOURCES & SECRETS ---

export async function addResource(applicationId: string, formData: FormData) {
  const supabase = await createClient();
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) redirect("/auth");

  const parsedApplicationId = parseOrThrow(uuidSchema.safeParse(applicationId));
  await resolveDeliverableSource(supabase, parsedApplicationId, user.user.id);
  const input = parseOrThrow(resourceFormSchema.safeParse({
    filename: formData.get("filename") ?? "",
    filePathOrUrl: formData.get("fileUrl") ?? "",
  }));

  // Store object path (recommended). If we receive a legacy public URL, extract the object path.
  let storedPath = input.filePathOrUrl;
  if (storedPath.startsWith("http")) {
    const parsed = extractObjectPathFromPublicUrl(storedPath);
    if (!parsed || parsed.bucket !== "deliverables") throw new Error("Nieprawidłowa referencja pliku.");
    storedPath = parsed.path;
  }

  const resourceRef = await assertCanAccessStorageRef(user.user.id, buildStorageRef("deliverables", storedPath));
  if (!resourceRef.path.startsWith(`resources/${parsedApplicationId}/${user.user.id}/`)) {
    throw new Error("Nieprawidłowa ścieżka zasobu.");
  }
  await assertUploadedObjectExists(resourceRef);

  const { data: applicationSource } = await supabase
    .from("applications")
    .select("id")
    .eq("id", parsedApplicationId)
    .maybeSingle();

  let sourceColumns: { application_id?: string; service_order_id?: string };
  if (applicationSource?.id) {
    sourceColumns = { application_id: parsedApplicationId };
  } else {
    const { data: serviceOrderSource } = await supabase
      .from("service_orders")
      .select("id")
      .eq("id", parsedApplicationId)
      .maybeSingle();

    if (!serviceOrderSource?.id) {
      throw new Error("Nie znaleziono zlecenia dla materiału.");
    }

    sourceColumns = { service_order_id: parsedApplicationId };
  }

  // RLS will check permissions
  const { error } = await supabase.from("project_resources").insert({
    ...sourceColumns,
    uploader_id: user.user.id,
    file_name: input.filename,
    file_path: storedPath
    // file_size and description removed as they don't exist in DB schema
  });

  if (error) throw new Error("Nie udało się zapisać materiału.");
  revalidatePath(`/app/deliverables/${parsedApplicationId}`);
}

export async function deleteResource(resourceId: string, applicationId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth");
  const parsedResourceId = parseOrThrow(uuidSchema.safeParse(resourceId));
  const parsedApplicationId = parseOrThrow(uuidSchema.safeParse(applicationId));
  await resolveDeliverableSource(supabase, parsedApplicationId, user.id);

  // IDOR fix: upewnij się że user jest uploaderem tego zasobu
  const { data: resource, error: resourceError } = await supabase
    .from("project_resources")
    .select("uploader_id, application_id, service_order_id")
    .eq("id", parsedResourceId)
    .maybeSingle();

  const resourceRow = resource as ResourceOwnerRow | null;
  if (resourceError || !resourceRow) throw new Error("Zasób nie istnieje.");
  if (resourceRow.uploader_id !== user.id) throw new Error("Brak uprawnień do usunięcia tego zasobu.");
  if (resourceRow.application_id !== parsedApplicationId && resourceRow.service_order_id !== parsedApplicationId) {
    throw new Error("Zasób nie należy do wskazanego zlecenia.");
  }

  const { data: deletedResource, error } = await supabase
    .from("project_resources")
    .delete()
    .eq("id", parsedResourceId)
    .eq("uploader_id", user.id)
    .select("id")
    .single();
  if (error || !deletedResource) throw new Error("Nie udało się usunąć zasobu.");
  revalidatePath(`/app/deliverables/${parsedApplicationId}`);
}

export async function addSecret(applicationId: string, formData: FormData) {
  const supabase = await createClient();
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) redirect("/auth");

  const parsedApplicationId = parseOrThrow(uuidSchema.safeParse(applicationId));
  const source = await resolveDeliverableSource(supabase, parsedApplicationId, user.user.id);
  const input = parseOrThrow(secretFormSchema.safeParse({
    title: formData.get("title") ?? "",
    secretValue: formData.get("secretValue") ?? "",
  }));

  const { error } = await supabase.from("project_secrets").insert({
    ...sourceColumnsFor(source),
    title: input.title,
    secret_value: input.secretValue,
    author_id: user.user.id,
  });

  if (error) throw new Error("Nie udało się zapisać danych dostępowych.");
  revalidatePath(`/app/deliverables/${parsedApplicationId}`);
}

export async function deleteSecret(secretId: string, applicationId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth");
  const parsedSecretId = parseOrThrow(uuidSchema.safeParse(secretId));
  const parsedApplicationId = parseOrThrow(uuidSchema.safeParse(applicationId));
  await resolveDeliverableSource(supabase, parsedApplicationId, user.id);

  // IDOR fix: upewnij się że user jest autorem sekretu
  const { data: secret, error: secretError } = await supabase
    .from("project_secrets")
    .select("author_id, application_id, service_order_id")
    .eq("id", parsedSecretId)
    .maybeSingle();

  const secretRow = secret as SecretOwnerRow | null;
  if (secretError || !secretRow) throw new Error("Sekret nie istnieje.");
  if (secretRow.author_id !== user.id) throw new Error("Brak uprawnień do usunięcia tego sekretu.");
  if (secretRow.application_id !== parsedApplicationId && secretRow.service_order_id !== parsedApplicationId) {
    throw new Error("Sekret nie należy do wskazanego zlecenia.");
  }

  const { data: deletedSecret, error } = await supabase
    .from("project_secrets")
    .delete()
    .eq("id", parsedSecretId)
    .eq("author_id", user.id)
    .select("id")
    .single();
  if (error || !deletedSecret) throw new Error("Nie udało się usunąć sekretu.");
  revalidatePath(`/app/deliverables/${parsedApplicationId}`);
}

// --- NEW MILESTONE LIFECYCLE ACTIONS ---

export async function fundContractAction(contractId: string, applicationId: string) {
  const supabase = await createClient();
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) redirect("/auth");
  const parsedContractId = parseOrThrow(uuidSchema.safeParse(contractId));
  const parsedApplicationId = parseOrThrow(uuidSchema.safeParse(applicationId));
  const source = await resolveDeliverableSource(supabase, parsedApplicationId, user.user.id);
  if (source.companyId !== user.user.id) {
    throw new Error("Tylko firma przypisana do zlecenia może aktywować kontrakt.");
  }

  const { data: contractSourceData, error: contractSourceError } = await supabase
    .from("contracts")
    .select("company_id, student_id, application_id, service_order_id")
    .eq("id", parsedContractId)
    .maybeSingle();

  const contractSource = contractSourceData as ContractSourceRow | null;
  if (contractSourceError || !contractSource) throw new Error("Nie znaleziono kontraktu.");
  if (contractSource.company_id !== user.user.id) throw new Error("Brak dostępu do kontraktu.");
  if (contractSource.application_id !== parsedApplicationId && contractSource.service_order_id !== parsedApplicationId) {
    throw new Error("Kontrakt nie należy do wskazanego zlecenia.");
  }

  const { data: completedPayment, error: paymentProofError } = await supabase
    .from("payments")
    .select("id")
    .eq("contract_id", parsedContractId)
    .eq("status", "completed")
    .limit(1)
    .maybeSingle();

  if (paymentProofError || !completedPayment) {
    throw new Error("Kontrakt może zostac aktywowany dopiero po potwierdzonej płatności Stripe.");
  }

  // Fund ALL milestones
  // ✅ [Refactor v1] Consolidated RPC
  const { error } = await supabase.rpc("company_fund_contract_v2", {
    p_contract_id: parsedContractId,
  });

  if (error) throw new Error("Nie udało się aktywować kontraktu.");

  // Sync application status: accepted → in_progress (deposit funded = work starts)
  if (source.type === "application") {
    await supabase
      .from("applications")
      .update({ status: "in_progress" })
      .eq("id", parsedApplicationId)
      .in("status", ["accepted"]);
  } else {
    await supabase
      .from("service_orders")
      .update({ status: "in_progress" })
      .eq("id", parsedApplicationId)
      .in("status", ["accepted", "active"]);
  }

  // Powiadom studenta że środki wpłynęły i może zacząć pracę
  try {
    const { data: contractDataRaw } = await supabase
      .from("contracts")
      .select("student_id, total_amount, applications(offers(tytul))")
      .eq("id", parsedContractId)
      .maybeSingle();

    const contractData = contractDataRaw as ContractNotificationRow | null;
    const application = unwrapRelation(contractData?.applications ?? null);
    const offer = unwrapRelation(application?.offers ?? null);

    if (contractData?.student_id) {
      const offerTitle = offer?.tytul ?? null;
      await notifyUser(supabase, contractData.student_id, "escrow_funded", {
        application_id: parsedApplicationId,
        contract_id: parsedContractId,
        offer_title: offerTitle,
        amount: contractData.total_amount,
        snippet: `Środki zostały wpłacone do depozytu. Możesz teraz rozpocząć realizację zlecenia!`,
      });
    }
  } catch {}

  revalidatePath(`/app/deliverables/${parsedApplicationId}`);
}

export async function submitMilestoneWorkAction(
  applicationId: string,
  milestoneId: string,
  formData: FormData
) {
  const supabase = await createClient();
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) redirect("/auth");

  const parsedApplicationId = parseOrThrow(uuidSchema.safeParse(applicationId));
  const parsedMilestoneId = parseOrThrow(uuidSchema.safeParse(milestoneId));
  const source = await resolveDeliverableSource(supabase, parsedApplicationId, user.user.id);
  if (source.studentId !== user.user.id) {
    throw new Error("Tylko przypisany student może przesłać pracę.");
  }
  await assertMilestoneMatchesSource(supabase, {
    milestoneId: parsedMilestoneId,
    sourceId: parsedApplicationId,
    userId: user.user.id,
    actor: "student",
  });
  await assertMilestoneCanBeSubmittedInSequence(parsedMilestoneId);

  const formInput = parseOrThrow(deliverableFormSchema.safeParse({
    description: formData.get("description") ?? "",
    filesJson: formData.get("filesJson") ?? "[]",
  }));
  const files = parseFilesJson(formInput.filesJson);
  const attachments = normalizeDeliverableAttachments(files);
  await verifyDeliverableAttachments(user.user.id, parsedApplicationId, attachments);

  // ✅ [Refactor v1] Consolidated RPC
  if (attachments.length === 0 && !formInput.description) {
    throw new Error("Musisz dodać pliki, link lub opis.");
  }

  const { error } = await supabase.rpc("submit_delivery_v2", {
    p_milestone_id: parsedMilestoneId,
    p_description: formInput.description,
    p_files: attachments,
    p_contract_id: null // Optional validation, can pass if we have it, but RPC resolves it
  });

  if (error) throw new Error("Nie udało się przesłać pracy do etapu.");

  // Powiadom firmę że student przesłał pracę do oceny
  try {
    const { data: milestoneDataRaw } = await supabase
      .from("milestones")
      .select("title, contracts(company_id, application_id, applications(offers(tytul)))")
      .eq("id", parsedMilestoneId)
      .maybeSingle();

    const milestoneData = milestoneDataRaw as MilestoneCompanyNotificationRow | null;
    const contract = unwrapRelation(milestoneData?.contracts ?? null);
    const application = unwrapRelation(contract?.applications ?? null);
    const offer = unwrapRelation(application?.offers ?? null);
    const companyId = contract?.company_id ?? null;

    if (companyId) {
      const offerTitle = offer?.tytul ?? null;
      await notifyUser(supabase, companyId, "milestone_submitted", {
        application_id: parsedApplicationId,
        redirect_path: `/app/deliverables/${parsedApplicationId}`,
        offer_title: offerTitle,
        milestone_title: milestoneData?.title,
        snippet: `Student przesłał pracę do etapu "${milestoneData?.title}". Sprawdź i zaakceptuj!`,
      });
    }
  } catch {}

  revalidatePath(`/app/deliverables/${parsedApplicationId}`);
}

export async function reviewMilestoneAction(
  milestoneId: string,
  applicationId: string,
  decision: "accepted" | "rejected",
  feedback: string
) {
  const supabase = await createClient();
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) redirect("/auth");
  const parsedMilestoneId = parseOrThrow(uuidSchema.safeParse(milestoneId));
  const parsedApplicationId = parseOrThrow(uuidSchema.safeParse(applicationId));
  const parsedDecision = parseOrThrow(decisionSchema.safeParse(decision));
  const parsedFeedback = parseOrThrow(boundedTextSchema(5_000, "Informacja zwrotna jest zbyt długa.").safeParse(feedback ?? ""));
  await resolveDeliverableSource(supabase, parsedApplicationId, user.user.id);
  await assertMilestoneMatchesSource(supabase, {
    milestoneId: parsedMilestoneId,
    sourceId: parsedApplicationId,
    userId: user.user.id,
    actor: "company",
  });

  // ✅ [Refactor v1] Consolidated RPC
  const finalStageReadiness = parsedDecision === "accepted"
    ? await assertKsefReadyForFinalStageAcceptance(parsedMilestoneId, user.user.id)
    : { isFinalStage: false, contractId: null };

  const { error } = await supabase.rpc("review_delivery_v3", {
    p_milestone_id: parsedMilestoneId,
    p_decision: parsedDecision,
    p_feedback: parsedFeedback,
  });

  if (error) throw new Error("Nie udało się zapisać decyzji dla etapu.");

  // Sync application status after milestone review
  if (parsedDecision === "accepted") {
    const { data: acceptedMilestone } = await supabase
      .from("milestones")
      .select("contract_id")
      .eq("id", parsedMilestoneId)
      .maybeSingle();

    if (acceptedMilestone?.contract_id) {
      await normalizeFullFundingContractState(acceptedMilestone.contract_id);
    }

    if (finalStageReadiness.isFinalStage && finalStageReadiness.contractId) {
      await ensureKsefInvoiceJobForCompletedContract(finalStageReadiness.contractId, user.user.id);
    }

    // Generate student invoice for the accepted milestone (non-blocking)
    try {
      const { data: milestoneData } = await supabase
        .from("milestones")
        .select("id, title, amount, contract_id")
        .eq("id", parsedMilestoneId)
        .maybeSingle();

      if (milestoneData) {
        const { data: payoutData } = await supabase
          .from("payouts")
          .select("amount_gross, platform_fee, amount_net")
          .eq("milestone_id", parsedMilestoneId)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        const amount = Number(payoutData?.amount_gross ?? milestoneData.amount);
        const fee = Number(payoutData?.platform_fee ?? 0);
        const net = Number(payoutData?.amount_net ?? Math.max(amount - fee, 0));
        const { generateStudentInvoice } = await import("@/lib/pdf/generate-invoice");
        await generateStudentInvoice(
          milestoneData.contract_id,
          parsedMilestoneId,
          milestoneData.title,
          amount,
          fee,
          net
        );
      }
    } catch (invoiceErr) {
      await logDeliverableActionError({
        source: "deliverables.review_milestone.invoice_generation",
        error: invoiceErr,
        message: "Nie udalo sie wygenerowac faktury studenta po akceptacji etapu.",
        level: "warning",
        userId: user.user.id,
        milestoneId: parsedMilestoneId,
        applicationId: parsedApplicationId,
      });
    }

    try {
      const transferResult = await transferLatestPayoutForMilestone(parsedMilestoneId);
      if (transferResult.status === "failed" || transferResult.status === "missing_account") {
        await logDeliverableActionError({
          source: "deliverables.review_milestone.auto_payout",
          message: transferResult.message,
          level: "warning",
          userId: user.user.id,
          milestoneId: parsedMilestoneId,
          applicationId: parsedApplicationId,
          context: {
            payoutStatus: transferResult.status,
          },
        });
      }
    } catch (payoutErr) {
      await logDeliverableActionError({
        source: "deliverables.review_milestone.auto_payout_exception",
        error: payoutErr,
        message: "Automatyczna wyplata Stripe po akceptacji etapu nie zostala wykonana.",
        level: "warning",
        userId: user.user.id,
        milestoneId: parsedMilestoneId,
        applicationId: parsedApplicationId,
      });
    }

    // Check if contract became completed (all milestones released)
    const { data: contractRow } = await supabase
      .from("contracts")
      .select("id, status, application_id, service_order_id")
      .or(`application_id.eq.${parsedApplicationId},service_order_id.eq.${parsedApplicationId}`)
      .maybeSingle();

    if (contractRow?.status === "completed") {
      if (contractRow.application_id) {
        await supabase
          .from("applications")
          .update({ status: "completed", realization_status: "completed" })
          .eq("id", contractRow.application_id)
          .in("status", ["in_progress", "accepted"]);
      } else if (contractRow.service_order_id) {
        await supabase
          .from("service_orders")
          .update({ status: "completed" })
          .eq("id", contractRow.service_order_id)
          .in("status", ["accepted", "active", "in_progress", "revision", "delivered"]);
      }
    }
  }

  // Powiadom studenta o decyzji firmy ws. milestone'a
  try {
    const { data: milestoneDataRaw } = await supabase
      .from("milestones")
      .select("title, contracts(student_id, applications(offers(tytul)))")
      .eq("id", parsedMilestoneId)
      .maybeSingle();

    const milestoneData = milestoneDataRaw as MilestoneStudentNotificationRow | null;
    const contract = unwrapRelation(milestoneData?.contracts ?? null);
    const application = unwrapRelation(contract?.applications ?? null);
    const offer = unwrapRelation(application?.offers ?? null);
    const studentId = contract?.student_id ?? null;

    if (studentId) {
      const offerTitle = offer?.tytul ?? null;
      const notifType = parsedDecision === "accepted" ? "milestone_accepted" : "milestone_rejected";
      const snippet = parsedDecision === "accepted"
        ? `Firma zaakceptowała etap "${milestoneData?.title}". Możesz przejść do kolejnego etapu lub podsumowania zlecenia.`
        : `Etap "${milestoneData?.title}" został odrzucony. Sprawdź uwagi firmy i prześlij poprawki.`;
      await notifyUser(supabase, studentId, notifType, {
        application_id: parsedApplicationId,
        redirect_path: `/app/deliverables/${parsedApplicationId}`,
        offer_title: offerTitle,
        milestone_title: milestoneData?.title,
        snippet,
      });
    }
  } catch {}

  revalidatePath(`/app/deliverables/${parsedApplicationId}`);
}

// LEGACY / SINGLE MILESTONE
export async function fundMilestoneAction(milestoneId: string, applicationId: string) {
  const supabase = await createClient();
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) redirect("/auth");
  const parsedMilestoneId = parseOrThrow(uuidSchema.safeParse(milestoneId));
  const parsedApplicationId = parseOrThrow(uuidSchema.safeParse(applicationId));
  await resolveDeliverableSource(supabase, parsedApplicationId, user.user.id);
  await assertMilestoneMatchesSource(supabase, {
    milestoneId: parsedMilestoneId,
    sourceId: parsedApplicationId,
    userId: user.user.id,
    actor: "company",
  });

  // ✅ [Realization Guard]
  const { error } = await supabase.rpc("company_mark_milestone_funded", {
    p_milestone_id: parsedMilestoneId,
  });

  if (error) throw new Error("Nie udało się oznaczyć etapu jako opłaconego.");

  // Sync application status: accepted → in_progress (milestone funded = work starts)
  await supabase
    .from("applications")
    .update({ status: "in_progress" })
    .eq("id", parsedApplicationId)
    .in("status", ["accepted"]);

  // Powiadom studenta że środki wpłynęły
  try {
    const { data: milestoneDataRaw } = await supabase
      .from("milestones")
      .select("title, amount, contracts(student_id, application_id, applications(offers(tytul)))")
      .eq("id", parsedMilestoneId)
      .maybeSingle();

    const milestoneData = milestoneDataRaw as MilestoneStudentNotificationRow | null;
    const contract = unwrapRelation(milestoneData?.contracts ?? null);
    const application = unwrapRelation(contract?.applications ?? null);
    const offer = unwrapRelation(application?.offers ?? null);
    const studentId = contract?.student_id ?? null;

    if (studentId) {
      const offerTitle = offer?.tytul ?? null;
      await notifyUser(supabase, studentId, "escrow_funded", {
        application_id: parsedApplicationId,
        offer_title: offerTitle,
        milestone_title: milestoneData?.title,
        amount: milestoneData?.amount,
        snippet: `Środki dla etapu "${milestoneData?.title}" zostały wpłacone. Możesz zacząć pracę!`,
      });
    }
  } catch {}

  revalidatePath(`/app/deliverables/${parsedApplicationId}`);
}

// --- CONTRACT PDF GENERATION ---
export async function generateContractDocuments(contractId: string, applicationId: string) {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) redirect("/auth");

  const parsedContractId = parseOrThrow(uuidSchema.safeParse(contractId));
  const parsedApplicationId = parseOrThrow(uuidSchema.safeParse(applicationId));
  await assertContractMatchesSource(supabase, {
    contractId: parsedContractId,
    sourceId: parsedApplicationId,
    userId: userData.user.id,
    allowAdmin: true,
  });

  return generateContractDocumentsInternal(parsedContractId, userData.user.id);
}

async function generateContractDocumentsInternal(contractId: string, actorUserId: string) {
  const admin = createAdminClient();

  const { data: contract, error: contractError } = await admin
    .from("contracts")
    .select(
      "id, company_id, student_id, application_id, service_order_id, commission_rate, total_amount, total_amount_minor, currency, review_window_days, documents_generated_at",
    )
    .eq("id", contractId)
    .maybeSingle();

  if (contractError || !contract) {
    throw new Error("Nie znaleziono kontraktu.");
  }

  if (actorUserId !== contract.company_id && actorUserId !== contract.student_id) {
    const { data: actorProfile } = await admin
      .from("profiles")
      .select("role")
      .eq("user_id", actorUserId)
      .maybeSingle();

    if (actorProfile?.role !== "admin") {
      throw new Error("Brak uprawnień do wygenerowania dokumentów tego kontraktu.");
    }
  }

  const { data: milestonesData, error: milestonesError } = await admin
    .from("milestones")
    .select("idx, title, amount, amount_minor, acceptance_criteria, due_at, status")
    .eq("contract_id", contractId)
    .order("idx", { ascending: true });

  if (milestonesError) {
    await logDeliverableActionError({
      source: "deliverables.generate_documents.load_milestones",
      error: milestonesError,
      userId: actorUserId,
      contractId,
    });
    throw new Error("Nie udało się pobrać etapów kontraktu.");
  }

  const typedContract = {
    ...(contract as Omit<ContractWithMilestonesRow, "milestones">),
    milestones: (milestonesData || []) as ContractMilestoneRow[],
  } as ContractWithMilestonesRow;
  const deliverableId = typedContract.application_id || typedContract.service_order_id || null;

  const { data: existingDocuments, error: existingDocumentsError } = await admin
    .from("contract_documents")
    .select("id, document_type, storage_path")
    .eq("contract_id", contractId)
    .in("document_type", ["contract_a", "contract_b"]);

  if (existingDocumentsError) {
    await logDeliverableActionError({
      source: "deliverables.generate_documents.existing_documents_guard",
      error: existingDocumentsError,
      userId: actorUserId,
      contractId,
    });
    throw new Error("Nie udało się sprawdzić istniejących dokumentów kontraktu.");
  }

  const existingTypes = new Set(
    (existingDocuments || [])
      .filter((document) => Boolean(document.storage_path))
      .map((document) => document.document_type),
  );

  const needsContractA = !existingTypes.has("contract_a");
  const needsContractB = !existingTypes.has("contract_b");

  if (!needsContractA && !needsContractB) {
    if (!contract.documents_generated_at) {
      const { error: syncGeneratedAtError } = await admin
        .from("contracts")
        .update({ documents_generated_at: new Date().toISOString() })
        .eq("id", contractId);

      if (syncGeneratedAtError) {
        await logDeliverableActionError({
          source: "deliverables.generate_documents.sync_generated_at",
          error: syncGeneratedAtError,
          message: "Nie udalo sie zsynchronizowac znacznika wygenerowanych dokumentow.",
          level: "warning",
          userId: actorUserId,
          contractId,
          applicationId: typedContract.application_id,
          serviceOrderId: typedContract.service_order_id,
        });
      }
    }

    if (deliverableId) {
      revalidatePath(`/app/deliverables/${deliverableId}`);
    }

    return { success: true, skipped: true, generated: [] as string[] };
  }

  const { data: companyProfile } = await admin
    .from("company_profiles")
    .select("nazwa, nip, address, city, osoba_kontaktowa")
    .eq("user_id", contract.company_id)
    .single();

  const { data: studentProfile } = await admin
    .from("student_profiles")
    .select("public_name")
    .eq("user_id", contract.student_id)
    .single();

  const { data: studentAuth } = await admin.auth.admin.getUserById(contract.student_id);
  const studentEmail = studentAuth?.user?.email || "brak@email.com";

  let offerTitle = "Zlecenie";
  let offerDescription = "";
  let servicePackage: PackageSummaryRow | null = null;

  if (typedContract.application_id) {
    const { data: appData } = await admin
      .from("applications")
      .select("offers(tytul, opis)")
      .eq("id", typedContract.application_id)
      .single();

    const app = appData as ApplicationOfferDetailsRow | null;
    const offer = unwrapRelation(app?.offers ?? null);
    offerTitle = offer?.tytul || offerTitle;
    offerDescription = offer?.opis || "";
  } else if (typedContract.service_order_id) {
    const { data: serviceOrderData } = await admin
      .from("service_orders")
      .select("package:service_packages(title, type)")
      .eq("id", typedContract.service_order_id)
      .single();

    const serviceOrder = serviceOrderData as ServiceOrderOfferDetailsRow | null;
    servicePackage = unwrapRelation(serviceOrder?.package ?? null);
    offerTitle = servicePackage?.title || offerTitle;
  }

  const milestones = (typedContract.milestones || []).sort((a, b) => (a.idx || 0) - (b.idx || 0));
  const totalAmount = Number(contract.total_amount_minor) / 100 || Number(contract.total_amount) || 0;
  const commissionRate = resolveCommissionRate({
    explicitRate: Number(typedContract.commission_rate ?? null),
    sourceType: typedContract.service_order_id ? "service_order" : "application",
    isPlatformService: servicePackage?.type === "platform_service",
  });
  const platformFeePercent = Math.round(commissionRate * 100);
  const platformFee = Math.round(totalAmount * commissionRate * 100) / 100;
  const netAmount = totalAmount - platformFee;
  const dateStr = new Date().toLocaleDateString("pl-PL");

  const contractData: ContractData = {
    contractId,
    createdAt: dateStr,
    companyName: companyProfile?.nazwa || "Firma",
    companyNip: companyProfile?.nip || "",
    companyAddress: companyProfile?.address || "",
    companyCity: companyProfile?.city || "",
    companyContactPerson: companyProfile?.osoba_kontaktowa || "",
    studentName: studentProfile?.public_name || "Student",
    studentEmail,
    offerTitle,
    offerDescription,
    milestones: milestones.map((milestone, index) => ({
      idx: milestone.idx || index + 1,
      title: milestone.title || `Etap ${index + 1}`,
      criteria: milestone.acceptance_criteria || "",
      amount: Number(milestone.amount_minor) / 100 || Number(milestone.amount) || 0,
      dueAt: milestone.due_at ? new Date(milestone.due_at).toLocaleDateString("pl-PL") : null,
    })),
    totalAmount,
    platformFeePercent,
    platformFee,
    netAmount,
    currency: contract.currency || "PLN",
    reviewWindowDays: contract.review_window_days || 8,
  };

  const [{ renderPdfToBuffer }, { ContractADocument }, { ContractBDocument }] = await Promise.all([
    import("@/lib/pdf/render"),
    import("@/lib/pdf/contract-a-template"),
    import("@/lib/pdf/contract-b-template"),
  ]);
  const [pdfA, pdfB] = await Promise.all([
    needsContractA
      ? renderPdfToBuffer(React.createElement(ContractADocument, { data: contractData }))
      : Promise.resolve(null),
    needsContractB
      ? renderPdfToBuffer(React.createElement(ContractBDocument, { data: contractData }))
      : Promise.resolve(null),
  ]);

  const timestamp = Date.now();
  const documentsToInsert: Array<{
    contract_id: string;
    document_type: string;
    storage_path: string;
    file_name: string;
    generated_by: string;
  }> = [];
  const generated: string[] = [];

  if (needsContractA && pdfA) {
    const pathA = `contracts/${contractId}/Umowa_A_Firma_${timestamp}.pdf`;
    const { error: uploadErrorA } = await admin.storage
      .from("deliverables")
      .upload(pathA, pdfA, { contentType: "application/pdf" });

    if (uploadErrorA) {
      await logDeliverableActionError({
        source: "deliverables.generate_documents.upload_contract_a",
        error: uploadErrorA,
        userId: actorUserId,
        contractId,
        applicationId: typedContract.application_id,
        serviceOrderId: typedContract.service_order_id,
        documentType: "contract_a",
        storagePath: pathA,
      });
      throw new Error("Nie udało się wgrać Umowy A.");
    }

    documentsToInsert.push({
      contract_id: contractId,
      document_type: "contract_a",
      storage_path: pathA,
      file_name: `Umowa_o_Swiadczenie_Uslugi_${dateStr}.pdf`,
      generated_by: actorUserId,
    });
    generated.push("contract_a");
  }

  if (needsContractB && pdfB) {
    const pathB = `contracts/${contractId}/Umowa_B_Student_${timestamp}.pdf`;
    const { error: uploadErrorB } = await admin.storage
      .from("deliverables")
      .upload(pathB, pdfB, { contentType: "application/pdf" });

    if (uploadErrorB) {
      await logDeliverableActionError({
        source: "deliverables.generate_documents.upload_contract_b",
        error: uploadErrorB,
        userId: actorUserId,
        contractId,
        applicationId: typedContract.application_id,
        serviceOrderId: typedContract.service_order_id,
        documentType: "contract_b",
        storagePath: pathB,
      });
      throw new Error("Nie udało się wgrać Umowy B.");
    }

    documentsToInsert.push({
      contract_id: contractId,
      document_type: "contract_b",
      storage_path: pathB,
      file_name: `Umowa_o_Dzielo_${dateStr}.pdf`,
      generated_by: actorUserId,
    });
    generated.push("contract_b");
  }

  if (documentsToInsert.length > 0) {
    const { error: docInsertError } = await admin
      .from("contract_documents")
      .insert(documentsToInsert);

    if (docInsertError) {
      await logDeliverableActionError({
        source: "deliverables.generate_documents.insert_contract_documents",
        error: docInsertError,
        userId: actorUserId,
        contractId,
        applicationId: typedContract.application_id,
        serviceOrderId: typedContract.service_order_id,
        context: {
          generated,
          documentCount: documentsToInsert.length,
        },
      });
      throw new Error("Nie udało się zapisać dokumentów kontraktu.");
    }
  }

  const { error: contractUpdateError } = await admin
    .from("contracts")
    .update({ documents_generated_at: new Date().toISOString() })
    .eq("id", contractId);

  if (contractUpdateError) {
    await logDeliverableActionError({
      source: "deliverables.generate_documents.update_generated_at",
      error: contractUpdateError,
      userId: actorUserId,
      contractId,
      applicationId: typedContract.application_id,
      serviceOrderId: typedContract.service_order_id,
    });
    throw new Error("Dokumenty powstały, ale nie udało się zapisać znacznika generacji.");
  }

  if (deliverableId) {
    revalidatePath(`/app/deliverables/${deliverableId}`);
  }

  return { success: true, skipped: false, generated };
}

export async function generateContractDocumentsForAdmin(contractId: string, actorUserId: string) {
  const parsedContractId = parseOrThrow(uuidSchema.safeParse(contractId));
  const parsedActorUserId = parseOrThrow(uuidSchema.safeParse(actorUserId));
  return generateContractDocumentsInternal(parsedContractId, parsedActorUserId);
}

// --- ACCEPT CONTRACT DOCUMENT ---
export async function acceptContractDocument(
  contractDocumentId: string,
  contractId: string,
  applicationId: string
) {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) redirect("/auth");

  const userId = userData.user.id;
  const parsedContractDocumentId = parseOrThrow(uuidSchema.safeParse(contractDocumentId));
  const parsedContractId = parseOrThrow(uuidSchema.safeParse(contractId));
  const parsedApplicationId = parseOrThrow(uuidSchema.safeParse(applicationId));
  const contract = await assertContractMatchesSource(supabase, {
    contractId: parsedContractId,
    sourceId: parsedApplicationId,
    userId,
  });

  const isCompany = contract.company_id === userId;
  const isStudent = contract.student_id === userId;

  if (!isCompany && !isStudent) {
    throw new Error("Brak uprawnień do akceptacji tego dokumentu.");
  }

  const now = new Date().toISOString();
  const requestHeaders = await headers();
  const acceptedIp =
    requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim()
    || requestHeaders.get("x-real-ip")
    || null;
  const admin = createAdminClient();
  const { data: contractDocument, error: contractDocumentError } = await admin
    .from("contract_documents")
    .select("id, contract_id, document_type")
    .eq("id", parsedContractDocumentId)
    .eq("contract_id", parsedContractId)
    .maybeSingle();

  if (contractDocumentError) {
    await logDeliverableActionError({
      source: "deliverables.accept_contract_document.load_document",
      error: contractDocumentError,
      userId,
      contractId: parsedContractId,
      applicationId: parsedApplicationId,
      context: {
        contractDocumentId: parsedContractDocumentId,
      },
    });
    throw new Error("Dokument kontraktu nie istnieje albo nie należy do tego kontraktu.");
  }

  if (!contractDocument) {
    throw new Error("Dokument kontraktu nie istnieje albo nie należy do tego kontraktu.");
  }

  const typedDocument = contractDocument as ContractDocumentAcceptanceRow;
  if (isCompany && typedDocument.document_type !== "contract_a") {
    throw new Error("Firma może zaakceptować tylko umowę A.");
  }
  if (isStudent && typedDocument.document_type !== "contract_b") {
    throw new Error("Student może zaakceptować tylko umowę B.");
  }

  // 2. Update contract_documents (use admin to bypass RLS)
  if (isCompany) {
    const { error: documentUpdateError } = await admin
      .from("contract_documents")
      .update({ company_accepted_at: now, company_accepted_ip: acceptedIp })
      .eq("id", parsedContractDocumentId)
      .eq("contract_id", parsedContractId);

    if (documentUpdateError) {
      await logDeliverableActionError({
        source: "deliverables.accept_contract_document.company_document_acceptance",
        error: documentUpdateError,
        userId,
        contractId: parsedContractId,
        applicationId: parsedApplicationId,
        documentType: typedDocument.document_type,
        context: {
          contractDocumentId: parsedContractDocumentId,
        },
      });
      throw new Error("Nie udało się zapisać akceptacji dokumentu.");
    }

    // Also update the contract-level timestamp
    const { error: contractUpdateError } = await admin
      .from("contracts")
      .update({ company_contract_accepted_at: now, company_contract_accepted_ip: acceptedIp })
      .eq("id", parsedContractId);

    if (contractUpdateError) {
      await logDeliverableActionError({
        source: "deliverables.accept_contract_document.company_contract_acceptance",
        error: contractUpdateError,
        userId,
        contractId: parsedContractId,
        applicationId: parsedApplicationId,
        documentType: typedDocument.document_type,
        context: {
          contractDocumentId: parsedContractDocumentId,
        },
      });
      throw new Error("Nie udało się zapisać akceptacji kontraktu.");
    }
  } else {
    const { error: documentUpdateError } = await admin
      .from("contract_documents")
      .update({ student_accepted_at: now, student_accepted_ip: acceptedIp })
      .eq("id", parsedContractDocumentId)
      .eq("contract_id", parsedContractId);

    if (documentUpdateError) {
      await logDeliverableActionError({
        source: "deliverables.accept_contract_document.student_document_acceptance",
        error: documentUpdateError,
        userId,
        contractId: parsedContractId,
        applicationId: parsedApplicationId,
        documentType: typedDocument.document_type,
        context: {
          contractDocumentId: parsedContractDocumentId,
        },
      });
      throw new Error("Nie udało się zapisać akceptacji dokumentu.");
    }

    const { error: contractUpdateError } = await admin
      .from("contracts")
      .update({ student_contract_accepted_at: now, student_contract_accepted_ip: acceptedIp })
      .eq("id", parsedContractId);

    if (contractUpdateError) {
      await logDeliverableActionError({
        source: "deliverables.accept_contract_document.student_contract_acceptance",
        error: contractUpdateError,
        userId,
        contractId: parsedContractId,
        applicationId: parsedApplicationId,
        documentType: typedDocument.document_type,
        context: {
          contractDocumentId: parsedContractDocumentId,
        },
      });
      throw new Error("Nie udało się zapisać akceptacji kontraktu.");
    }
  }

  revalidatePath(`/app/deliverables/${parsedApplicationId}`);

  return { success: true, role: isCompany ? "company" : "student" };
}

export async function reopenMilestoneNegotiationAction(contractId: string, applicationId: string) {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) redirect("/auth");
  const parsedContractId = parseOrThrow(uuidSchema.safeParse(contractId));
  const parsedApplicationId = parseOrThrow(uuidSchema.safeParse(applicationId));
  const contract = await assertContractMatchesSource(supabase, {
    contractId: parsedContractId,
    sourceId: parsedApplicationId,
    userId: userData.user.id,
    includeMilestones: true,
  });

  const milestones = Array.isArray(contract.milestones) ? contract.milestones : [];
  const hasFundedMilestone = milestones.some((milestone) =>
    ["funded", "in_progress", "delivered", "accepted", "released", "completed"].includes(String(milestone.status)),
  );

  if (hasFundedMilestone || !["draft", "awaiting_funding"].includes(String(contract.status))) {
    throw new Error("Nie można cofnąć etapów po zasileniu depozytu lub rozpoczęciu realizacji.");
  }

  if (contract.company_contract_accepted_at || contract.student_contract_accepted_at) {
    throw new Error("Umowa została już zaakceptowana. Wymagana jest korekta przez administratora.");
  }

  const admin = createAdminClient();
  const { error: contractUpdateError } = await admin
    .from("contracts")
    .update({
      terms_status: "draft",
      status: "draft",
      documents_generated_at: null,
      company_approved_version: null,
      student_approved_version: null,
    })
    .eq("id", parsedContractId);

  if (contractUpdateError) {
    await logDeliverableActionError({
      source: "deliverables.reopen_milestone_negotiation.update_contract",
      error: contractUpdateError,
      userId: userData.user.id,
      contractId: parsedContractId,
      applicationId: parsedApplicationId,
    });
    throw new Error("Nie udało się cofnąć kontraktu do ustalania etapów.");
  }

  const { error: draftUpdateError } = await admin
    .from("milestone_drafts")
    .update({ state: "STUDENT_EDITING" })
    .eq("contract_id", parsedContractId);

  if (draftUpdateError) {
    await logDeliverableActionError({
      source: "deliverables.reopen_milestone_negotiation.update_drafts",
      error: draftUpdateError,
      userId: userData.user.id,
      contractId: parsedContractId,
      applicationId: parsedApplicationId,
    });
    throw new Error("Nie udało się cofnąć wersji roboczej etapów.");
  }

  const { error: documentDeleteError } = await admin
    .from("contract_documents")
    .delete()
    .eq("contract_id", parsedContractId)
    .is("company_accepted_at", null)
    .is("student_accepted_at", null);

  if (documentDeleteError) {
    await logDeliverableActionError({
      source: "deliverables.reopen_milestone_negotiation.delete_unsigned_documents",
      error: documentDeleteError,
      userId: userData.user.id,
      contractId: parsedContractId,
      applicationId: parsedApplicationId,
    });
    throw new Error("Nie udało się usunąć niezaakceptowanych dokumentów kontraktu.");
  }

  revalidatePath(`/app/deliverables/${parsedApplicationId}`);
  return { success: true };
}
