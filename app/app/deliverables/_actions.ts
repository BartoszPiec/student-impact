"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import React from "react";
import { renderPdfToBuffer } from "@/lib/pdf/render";
import { ContractADocument } from "@/lib/pdf/contract-a-template";
import { ContractBDocument } from "@/lib/pdf/contract-b-template";
import { generateStudentInvoice } from "@/lib/pdf/generate-invoice";
import { resolveCommissionRate } from "@/lib/commission";
import { trySendNotification } from "@/lib/notifications/server";
import type { ContractData } from "@/lib/pdf/types";

type AppSupabaseClient = Awaited<ReturnType<typeof createClient>>;
type JsonPayload = Record<string, unknown>;
type RelationValue<T> = T | T[] | null;

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

type ProjectResourceInsert = {
  uploader_id: string;
  file_name: string;
  file_path: string;
  application_id?: string;
  service_order_id?: string;
};

type ApplicationNotificationRow = {
  offers: RelationValue<OfferSummaryRow>;
};

type ApplicationOfferDetailsRow = {
  offers: RelationValue<OfferDetailRow>;
};

type ServiceOrderOfferDetailsRow = {
  package: RelationValue<PackageSummaryRow>;
};

type ServiceOrderNotificationRow = {
  company_id: string | null;
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


export async function getSignedStorageUrl(bucket: string, pathOrUrl: string, expiresInSeconds: number = 600) {
  const supabase = await createClient();

  let safeBucket = String(bucket || "deliverables");
  let safePath = String(pathOrUrl || "").trim();

  // Accept legacy public URLs and extract bucket/path
  if (safePath.startsWith("http")) {
    const parsed = extractObjectPathFromPublicUrl(safePath);
    if (parsed?.bucket && parsed?.path) {
      safeBucket = parsed.bucket;
      safePath = parsed.path;
    } else {
      // If we can't parse, fall back to returning the URL (may fail if bucket is private)
      return safePath;
    }
  }

  safePath = safePath.replace(/^\/+/, "");
  if (!safePath) throw new Error("Missing file path");

  const { data, error } = await supabase.storage.from(safeBucket).createSignedUrl(safePath, expiresInSeconds);
  if (error) throw new Error(error.message);
  if (!data?.signedUrl) throw new Error("No signed URL returned");

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

export async function submitDeliverable(applicationId: string, formData: FormData) {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) redirect("/auth");

  const description = String(formData.get("description") ?? "").trim();
  const filesJson = String(formData.get("filesJson") ?? "[]");
  let files: unknown[] = [];
  try {
    files = JSON.parse(filesJson);
  } catch {
    throw new Error("Invalid files data");
  }

  if (files.length === 0 && !description) {
    throw new Error("Musisz dodać pliki lub opis.");
  }

  // Detect Source Type
  let sourceType = "application";
  const { data: appData } = await supabase.from("applications").select("id").eq("id", applicationId).maybeSingle();
  if (!appData) {
    const { data: soData } = await supabase.from("service_orders").select("id").eq("id", applicationId).maybeSingle();
    if (soData) {
      sourceType = "service_order";
    } else {
      throw new Error("Nie znaleziono zlecenia.");
    }
  }

  // ✅ [Realization Guard] Unified RPC
  const { error } = await supabase.rpc("submit_delivery", {
    p_source_id: applicationId,
    p_source_type: sourceType,
    p_description: description,
    p_files: files,
  });
  if (error) throw new Error(error.message);

  // Powiadom firmę że student przesłał pracę
  try {
    let companyId: string | null = null;
    let offerTitle: string | null = null;
    if (sourceType === "application") {
      const { data: appData } = await supabase
        .from("applications")
        .select("offers(company_id, tytul)")
        .eq("id", applicationId)
        .maybeSingle();

      const applicationRow = appData as ApplicationNotificationRow | null;
      const offer = unwrapRelation(applicationRow?.offers ?? null);
      companyId = offer?.company_id ?? null;
      offerTitle = offer?.tytul ?? null;
    } else {
      const { data: soData } = await supabase
        .from("service_orders")
        .select("company_id, package:service_packages(title)")
        .eq("id", applicationId)
        .maybeSingle();

      const serviceOrder = soData as ServiceOrderNotificationRow | null;
      const servicePackage = unwrapRelation(serviceOrder?.package ?? null);
      companyId = serviceOrder?.company_id ?? null;
      offerTitle = servicePackage?.title ?? null;
    }
    if (companyId) {
      await notifyUser(supabase, companyId, "deliverable_submitted", {
        application_id: applicationId,
        offer_title: offerTitle,
        snippet: `Student przesłał pracę do zlecenia "${offerTitle ?? "zlecenie"}". Sprawdź i zatwierdź!`,
      });
    }
  } catch {}

  revalidatePath(`/app/deliverables/${applicationId}`);
}

export async function reviewDeliverable(deliverableId: string, status: "accepted" | "rejected", feedback: string) {
  const supabase = await createClient();
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) redirect("/auth");

  // Need appId for revalidation
  const { data: delivData } = await supabase
    .from("deliverables")
    .select("application_id, applications(student_id, offers(tytul))")
    .eq("id", deliverableId)
    .maybeSingle();

  const deliv = delivData as DeliverableReviewRow | null;
  if (!deliv) throw new Error("Nie znaleziono oddanej pracy.");

  // ✅ [Realization Guard]
  try {
    const { error } = await supabase.rpc("review_deliverable_and_progress", {
      p_deliverable_id: deliverableId,
      p_decision: status, // "accepted" | "rejected"
      p_feedback: feedback ?? null,
    });
    if (error) throw new Error(error.message);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Blad podczas oceniania pracy.";
    throw new Error(message);
  }

  // Powiadom studenta o decyzji firmy
  try {
    const application = unwrapRelation(deliv.applications);
    const offer = unwrapRelation(application?.offers ?? null);
    const studentId = application?.student_id ?? null;
    const offerTitle = offer?.tytul ?? null;
    const appId = deliv?.application_id;
    if (studentId && appId) {
      const notifType = status === "accepted" ? "deliverable_accepted" : "deliverable_rejected";
      const snippet = status === "accepted"
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

export async function submitReview(applicationId: string, rating: number, comment: string) {
  const supabase = await createClient();
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) redirect("/auth");

  const reviewerId = user.user.id;
  const normalizedRating = Math.max(1, Math.min(5, Math.trunc(rating)));
  const normalizedComment = comment.trim() || null;

  // Try Application first
  let studentId = "";
  let companyId = "";
  let offerId: string | null = null;
  let offerTitle: string | null = null;
  let sourceType: "application" | "service_order" = "application";

  const { data: applicationData } = await supabase
    .from("applications")
    .select("id, student_id, offer_id, offers(company_id, tytul)")
    .eq("id", applicationId)
    .maybeSingle();

  const appRow = applicationData as ReviewApplicationRow | null;

  if (appRow) {
    const offer = unwrapRelation(appRow.offers);
    studentId = appRow.student_id;
    companyId = offer?.company_id ?? "";
    offerId = appRow.offer_id;
    offerTitle = offer?.tytul ?? null;
  } else {
    // Try Service Order
    const { data: serviceOrderData } = await supabase
      .from("service_orders")
      .select("id, company_id, student_id")
      .eq("id", applicationId)
      .maybeSingle();

    const soRow = serviceOrderData as ReviewServiceOrderRow | null;
    if (soRow) {
      sourceType = "service_order";
      studentId = soRow.student_id;
      companyId = soRow.company_id;
      // Service orders might not have 'offer_id' in the same way, or it's just the SO ID itself as reference
    } else {
      throw new Error("Brak aplikacji lub zlecenia");
    }
  }

  if (!studentId || !companyId) {
    throw new Error("Brak danych stron do zapisania opinii.");
  }

  let role: "student" | "company";
  let revieweeId = "";

  if (reviewerId === studentId) {
    role = "student";
    revieweeId = companyId;
  } else if (reviewerId === companyId) {
    role = "company";
    revieweeId = studentId;
  } else {
    throw new Error("Nie jesteś stroną tej umowy");
  }

  // Zabezpieczenie przed review flooding: sprawdź czy użytkownik już ocenił
  const existingReviewQuery = supabase
    .from("reviews")
    .select("id")
    .eq("reviewer_id", reviewerId);

  if (sourceType === "application") {
    existingReviewQuery.eq("application_id", applicationId);
  } else {
    existingReviewQuery.eq("service_order_id", applicationId);
  }

  const { data: existingReview } = await existingReviewQuery.maybeSingle();
  if (existingReview) {
    throw new Error("Już wystawiłeś ocenę dla tego zlecenia.");
  }

  // Insert Review
  const reviewPayload: ReviewPayload = {
    reviewer_id: reviewerId,
    reviewee_id: revieweeId,
    application_id: sourceType === 'application' ? applicationId : null,
    service_order_id: sourceType === 'service_order' ? applicationId : null,
    reviewer_role: role,
    rating: normalizedRating,
    comment: normalizedComment,
    company_id: companyId,
    student_id: studentId,
  };

  if (offerId) reviewPayload.offer_id = offerId;

  try {
    const { error: insertErr } = await supabase.from("reviews").insert(reviewPayload);
    if (insertErr) throw new Error(insertErr.message);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Błąd bazy danych";
    throw new Error("Nie udało się zapisać opinii: " + message);
  }

  // Powiadom drugą stronę o otrzymanej ocenie
  try {
    const ratingLabel = `${normalizedRating}/5`;
    const notifPayload = {
      application_id: applicationId,
      offer_title: offerTitle,
      rating: normalizedRating,
      snippet: `Otrzymałeś ocenę ${ratingLabel} za zlecenie "${offerTitle ?? "zlecenie"}".`,
    };
    await notifyUser(supabase, revieweeId, "review_received", notifPayload);
  } catch {}

  // Mark contract as COMPLETED
  // Find contract by source ID
  await supabase.from("contracts")
    .update({ status: 'completed' })
    .or(`application_id.eq.${applicationId},service_order_id.eq.${applicationId}`)
    .neq('status', 'completed');

  // Sync Parent Status
  if (sourceType === 'application') {
    await supabase.from("applications")
      .update({ status: 'completed', realization_status: 'completed' })
      .eq("id", applicationId)
      .neq("status", "completed")
      .in("status", ["accepted", "in_progress", "delivered"]);
  } else if (sourceType === 'service_order') {
    await supabase.from("service_orders")
      .update({ status: 'completed' })
      .eq("id", applicationId)
      .neq("status", "completed")
      .in("status", ["accepted", "active", "in_progress", "revision", "delivered"]);
  }

  revalidatePath(`/app/deliverables/${applicationId}`);
}

// --- NEW ACTIONS FOR RESOURCES & SECRETS ---

export async function addResource(applicationId: string, formData: FormData) {
  const supabase = await createClient();
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) redirect("/auth");

  const filename = String(formData.get("filename"));
  const filePathOrUrl = String(formData.get("fileUrl"));

  if (!filename || !filePathOrUrl) throw new Error("Brak pliku");

  // Store object path (recommended). If we receive a legacy public URL, extract the object path.
  let storedPath = filePathOrUrl;
  if (storedPath.startsWith("http")) {
    const parsed = extractObjectPathFromPublicUrl(storedPath);
    if (parsed) storedPath = parsed.path;
  }


  // RLS will check permissions
  const { error } = await supabase.from("project_resources").insert({
    application_id: applicationId,
    uploader_id: user.user.id,
    file_name: filename,
    file_path: storedPath
    // file_size and description removed as they don't exist in DB schema
  });

  if (error) throw new Error(error.message);
  revalidatePath(`/app/deliverables/${applicationId}`);
}

export async function deleteResource(resourceId: string, applicationId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth");

  // IDOR fix: upewnij się że user jest uploaderem tego zasobu
  const { data: resource } = await supabase
    .from("project_resources")
    .select("uploader_id")
    .eq("id", resourceId)
    .maybeSingle();

  if (!resource) throw new Error("Zasób nie istnieje");
  if (resource.uploader_id !== user.id) throw new Error("Brak uprawnień do usunięcia tego zasobu");

  const { error } = await supabase.from("project_resources").delete().eq("id", resourceId);
  if (error) throw new Error(error.message);
  revalidatePath(`/app/deliverables/${applicationId}`);
}

export async function addSecret(applicationId: string, formData: FormData) {
  const supabase = await createClient();
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) redirect("/auth");

  const title = String(formData.get("title"));
  const secretValue = String(formData.get("secretValue"));

  if (!title || !secretValue) throw new Error("Wypełnij pola");

  const { error } = await supabase.from("project_secrets").insert({
    application_id: applicationId,
    title: title,
    secret_value: secretValue,
    author_id: user.user.id
  });

  if (error) throw new Error(error.message);
  revalidatePath(`/app/deliverables/${applicationId}`);
}

export async function deleteSecret(secretId: string, applicationId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth");

  // IDOR fix: upewnij się że user jest autorem sekretu
  const { data: secret } = await supabase
    .from("project_secrets")
    .select("author_id")
    .eq("id", secretId)
    .maybeSingle();

  if (!secret) throw new Error("Sekret nie istnieje");
  if (secret.author_id !== user.id) throw new Error("Brak uprawnień do usunięcia tego sekretu");

  const { error } = await supabase.from("project_secrets").delete().eq("id", secretId);
  if (error) throw new Error(error.message);
  revalidatePath(`/app/deliverables/${applicationId}`);
}

// --- NEW MILESTONE LIFECYCLE ACTIONS ---

export async function fundContractAction(contractId: string, applicationId: string) {
  const supabase = await createClient();
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) redirect("/auth");

  // Fund ALL milestones
  // ✅ [Refactor v1] Consolidated RPC
  const { error } = await supabase.rpc("company_fund_contract_v2", {
    p_contract_id: contractId,
  });

  if (error) throw new Error(error.message);

  // Sync application status: accepted → in_progress (escrow funded = work starts)
  await supabase
    .from("applications")
    .update({ status: "in_progress" })
    .eq("id", applicationId)
    .in("status", ["accepted"]);

  // Powiadom studenta że środki wpłynęły i może zacząć pracę
  try {
    const { data: contractDataRaw } = await supabase
      .from("contracts")
      .select("student_id, total_amount, applications(offers(tytul))")
      .eq("id", contractId)
      .maybeSingle();

    const contractData = contractDataRaw as ContractNotificationRow | null;
    const application = unwrapRelation(contractData?.applications ?? null);
    const offer = unwrapRelation(application?.offers ?? null);

    if (contractData?.student_id) {
      const offerTitle = offer?.tytul ?? null;
      await notifyUser(supabase, contractData.student_id, "escrow_funded", {
        application_id: applicationId,
        contract_id: contractId,
        offer_title: offerTitle,
        amount: contractData.total_amount,
        snippet: `Środki zostały wpłacone do depozytu. Możesz teraz rozpocząć realizację zlecenia!`,
      });
    }
  } catch {}

  revalidatePath(`/app/deliverables/${applicationId}`);
}

export async function submitMilestoneWorkAction(
  applicationId: string,
  milestoneId: string,
  formData: FormData
) {
  const supabase = await createClient();
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) redirect("/auth");

  const description = String(formData.get("description") ?? "").trim();
  const filesJson = String(formData.get("filesJson") ?? "[]");
  let files = [];
  try {
    files = JSON.parse(filesJson);
  } catch {
    throw new Error("Invalid files data");
  }

  // ✅ [Refactor v1] Consolidated RPC
  const { error } = await supabase.rpc("submit_delivery_v2", {
    p_milestone_id: milestoneId,
    p_description: description,
    p_files: files,
    p_contract_id: null // Optional validation, can pass if we have it, but RPC resolves it
  });

  if (error) throw new Error(error.message);

  // Powiadom firmę że student przesłał pracę do oceny
  try {
    const { data: milestoneDataRaw } = await supabase
      .from("milestones")
      .select("title, contracts(company_id, application_id, applications(offers(tytul)))")
      .eq("id", milestoneId)
      .maybeSingle();

    const milestoneData = milestoneDataRaw as MilestoneCompanyNotificationRow | null;
    const contract = unwrapRelation(milestoneData?.contracts ?? null);
    const application = unwrapRelation(contract?.applications ?? null);
    const offer = unwrapRelation(application?.offers ?? null);
    const companyId = contract?.company_id ?? null;

    if (companyId) {
      const offerTitle = offer?.tytul ?? null;
      await notifyUser(supabase, companyId, "milestone_submitted", {
        application_id: applicationId,
        offer_title: offerTitle,
        milestone_title: milestoneData?.title,
        snippet: `Student przesłał pracę do etapu "${milestoneData?.title}". Sprawdź i zaakceptuj!`,
      });
    }
  } catch {}

  revalidatePath(`/app/deliverables/${applicationId}`);
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

  // ✅ [Refactor v1] Consolidated RPC
  const { error } = await supabase.rpc("review_delivery_v3", {
    p_milestone_id: milestoneId,
    p_decision: decision,
    p_feedback: feedback
  });

  if (error) throw new Error(error.message);

  // Sync application status after milestone review
  if (decision === "accepted") {
    // Generate student invoice for the accepted milestone (non-blocking)
    try {
      const { data: milestoneData } = await supabase
        .from("milestones")
        .select("id, title, amount, contract_id")
        .eq("id", milestoneId)
        .maybeSingle();

      if (milestoneData) {
        const { data: payoutData } = await supabase
          .from("payouts")
          .select("amount_gross, platform_fee, amount_net")
          .eq("milestone_id", milestoneId)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        const amount = Number(payoutData?.amount_gross ?? milestoneData.amount);
        const fee = Number(payoutData?.platform_fee ?? 0);
        const net = Number(payoutData?.amount_net ?? Math.max(amount - fee, 0));
        await generateStudentInvoice(
          milestoneData.contract_id,
          milestoneId,
          milestoneData.title,
          amount,
          fee,
          net
        );
      }
    } catch (invoiceErr) {
      console.error("Failed to generate student invoice (non-critical):", invoiceErr);
    }

    // Check if contract became completed (all milestones released)
    const { data: contractRow } = await supabase
      .from("contracts")
      .select("id, status")
      .eq("application_id", applicationId)
      .maybeSingle();

    if (contractRow?.status === "completed") {
      await supabase
        .from("applications")
        .update({ status: "completed", realization_status: "completed" })
        .eq("id", applicationId)
        .in("status", ["in_progress", "accepted"]);
    }
  }

  // Powiadom studenta o decyzji firmy ws. milestone'a
  try {
    const { data: milestoneDataRaw } = await supabase
      .from("milestones")
      .select("title, contracts(student_id, applications(offers(tytul)))")
      .eq("id", milestoneId)
      .maybeSingle();

    const milestoneData = milestoneDataRaw as MilestoneStudentNotificationRow | null;
    const contract = unwrapRelation(milestoneData?.contracts ?? null);
    const application = unwrapRelation(contract?.applications ?? null);
    const offer = unwrapRelation(application?.offers ?? null);
    const studentId = contract?.student_id ?? null;

    if (studentId) {
      const offerTitle = offer?.tytul ?? null;
      const notifType = decision === "accepted" ? "milestone_accepted" : "milestone_rejected";
      const snippet = decision === "accepted"
        ? `Etap "${milestoneData?.title}" został zaakceptowany. Środki zostaną przekazane!`
        : `Etap "${milestoneData?.title}" został odrzucony. Sprawdź uwagi firmy i prześlij poprawki.`;
      await notifyUser(supabase, studentId, notifType, {
        application_id: applicationId,
        offer_title: offerTitle,
        milestone_title: milestoneData?.title,
        snippet,
      });
    }
  } catch {}

  revalidatePath(`/app/deliverables/${applicationId}`);
}

// LEGACY / SINGLE MILESTONE
export async function fundMilestoneAction(milestoneId: string, applicationId: string) {
  const supabase = await createClient();
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) redirect("/auth");

  // ✅ [Realization Guard]
  const { error } = await supabase.rpc("company_mark_milestone_funded", {
    p_milestone_id: milestoneId,
  });

  if (error) throw new Error(error.message);

  // Sync application status: accepted → in_progress (milestone funded = work starts)
  await supabase
    .from("applications")
    .update({ status: "in_progress" })
    .eq("id", applicationId)
    .in("status", ["accepted"]);

  // Powiadom studenta że środki wpłynęły
  try {
    const { data: milestoneDataRaw } = await supabase
      .from("milestones")
      .select("title, amount, contracts(student_id, application_id, applications(offers(tytul)))")
      .eq("id", milestoneId)
      .maybeSingle();

    const milestoneData = milestoneDataRaw as MilestoneStudentNotificationRow | null;
    const contract = unwrapRelation(milestoneData?.contracts ?? null);
    const application = unwrapRelation(contract?.applications ?? null);
    const offer = unwrapRelation(application?.offers ?? null);
    const studentId = contract?.student_id ?? null;

    if (studentId) {
      const offerTitle = offer?.tytul ?? null;
      await notifyUser(supabase, studentId, "escrow_funded", {
        application_id: applicationId,
        offer_title: offerTitle,
        milestone_title: milestoneData?.title,
        amount: milestoneData?.amount,
        snippet: `Środki dla etapu "${milestoneData?.title}" zostały wpłacone. Możesz zacząć pracę!`,
      });
    }
  } catch {}

  revalidatePath(`/app/deliverables/${applicationId}`);
}

// --- CONTRACT GENERATION ---
// --- CONTRACT GENERATION ---
export async function generateContract(contractId: string, applicationId: string) {
  const supabase = await createClient();
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) redirect("/auth");

  // Check Contract Linkage (Service Order vs Application)
  const { data: contract, error: contractError } = await supabase
    .from('contracts')
    .select('service_order_id, application_id')
    .eq('id', contractId)
    .single();

  if (contractError || !contract) {
    throw new Error("Nie znaleziono kontraktu: " + (contractError?.message || "Brak danych"));
  }

  const { data: milestones } = await supabase.from('milestones')
    .select('*')
    .eq('contract_id', contractId)
    .order('idx');

  const contractMilestones = (milestones ?? []) as ContractMilestoneRow[];

  const dateStr = new Date().toLocaleDateString('pl-PL');
  let content = `UMOWA O DZIEŁO\n\n`;
  content += `ID Kontraktu: ${contractId}\n`;
  content += `Data zawarcia: ${dateStr}\n\n`;
  content += `HARMONOGRAM REALIZACJI I PŁATNOŚCI:\n\n`;

  let total = 0;
  contractMilestones.forEach((m, i) => {
    const mAmount = Number(m.amount_minor) / 100 || Number(m.amount) || 0;
    content += `${i + 1}. ${m.title}\n`;
    content += `   Kwota: ${mAmount.toFixed(2)} PLN\n`;
    content += `   Zakres: ${m.acceptance_criteria}\n`;
    content += `   Status: ${m.status}\n\n`;
    total += mAmount;
  });

  content += `----------------------------------------\n`;
  content += `SUMA CAŁKOWITA: ${total.toFixed(2)} PLN\n`;
  content += `\n\n---\nWygenerowano automatycznie przez system Student Impact.`;

  const fileName = `contracts/${applicationId}/Umowa_${contractId}_${Date.now()}.txt`;

  const fileBody = Buffer.from(content, 'utf-8');
  const { error: uploadError } = await supabase.storage.from('deliverables').upload(fileName, fileBody, {
    contentType: 'text/plain; charset=utf-8'
  });

  if (uploadError) {
    console.error("Upload Contract Error:", uploadError);
    throw new Error("Błąd wgrywania pliku: " + uploadError.message);
  }

  const insertPayload: ProjectResourceInsert = {
    uploader_id: user.user.id,
    file_name: `Umowa_o_Dzieło_${dateStr}.txt`,
    file_path: fileName
  };

  if (contract.service_order_id) {
    insertPayload.service_order_id = contract.service_order_id;
  } else {
    insertPayload.application_id = applicationId;
  }

  const { error: insertError } = await supabase.from("project_resources").insert(insertPayload);

  if (insertError) {
    console.error("Insert Resource Error:", insertError);
    throw new Error("Błąd zapisu w bazie: " + insertError.message);
  }

  revalidatePath(`/app/deliverables/${applicationId}`);
}

// --- CONTRACT PDF GENERATION ---
export async function generateContractDocuments(contractId: string, applicationId: string) {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) redirect("/auth");

  return generateContractDocumentsInternal(contractId, userData.user.id);

  // 1. Fetch contract with milestones
  const { data: contract, error: contractError } = await supabase
    .from("contracts")
    .select("*, milestones(*)")
    .eq("id", contractId)
    .single();

  if (contractError || !contract) {
    throw new Error("Nie znaleziono kontraktu: " + (contractError?.message || ""));
  }

  // 2. Fetch company profile
  const { data: companyProfile } = await supabase
    .from("company_profiles")
    .select("nazwa, nip, address, city, osoba_kontaktowa")
    .eq("user_id", contract.company_id)
    .single();

  // 3. Fetch student profile + email
  const { data: studentProfile } = await supabase
    .from("student_profiles")
    .select("public_name")
    .eq("user_id", contract.student_id)
    .single();

  // Get student email from admin client (auth.users)
  const admin = createAdminClient();
  const { data: studentAuth } = await admin.auth.admin.getUserById(contract.student_id);
  const studentEmail = studentAuth?.user?.email || "brak@email.com";

  // 4. Fetch offer details
  let offerTitle = "Zlecenie";
  let offerDescription = "";

  if (contract.application_id) {
    const { data: appData } = await supabase
      .from("applications")
      .select("offers(tytul, opis)")
      .eq("id", contract.application_id)
      .single();

    const app = appData as ApplicationOfferDetailsRow | null;
    const offer = unwrapRelation(app?.offers ?? null);
    offerTitle = offer?.tytul || offerTitle;
    offerDescription = offer?.opis || "";
  }

  // 5. Build ContractData
  const typedContract = contract as ContractWithMilestonesRow;
  const milestones = (typedContract.milestones || [])
    .sort((a, b) => (a.idx || 0) - (b.idx || 0));

  const totalAmount = Number(contract.total_amount_minor) / 100 || Number(contract.total_amount) || 0;
  const commissionRate = resolveCommissionRate({
    explicitRate: Number(typedContract.commission_rate ?? null),
    sourceType: typedContract.service_order_id ? "service_order" : "application",
    isPlatformService: false,
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
    milestones: milestones.map((m, i) => ({
      idx: m.idx || i + 1,
      title: m.title || `Etap ${i + 1}`,
      criteria: m.acceptance_criteria || "",
      amount: Number(m.amount_minor) / 100 || Number(m.amount) || 0,
      dueAt: m.due_at ? new Date(m.due_at).toLocaleDateString("pl-PL") : null,
    })),
    totalAmount,
    platformFeePercent,
    platformFee,
    netAmount,
    currency: contract.currency || "PLN",
    reviewWindowDays: contract.review_window_days || 8,
  };

  // 6. Render PDFs
  const pdfA = await renderPdfToBuffer(
    React.createElement(ContractADocument, { data: contractData })
  );
  const pdfB = await renderPdfToBuffer(
    React.createElement(ContractBDocument, { data: contractData })
  );

  const timestamp = Date.now();

  // 7. Upload Contract A
  const pathA = `contracts/${contractId}/Umowa_A_Firma_${timestamp}.pdf`;
  const { error: uploadErrorA } = await admin.storage
    .from("deliverables")
    .upload(pathA, pdfA, { contentType: "application/pdf" });

  if (uploadErrorA) {
    console.error("Upload Contract A Error:", uploadErrorA);
    throw new Error("Błąd wgrywania Umowy A: " + (uploadErrorA?.message || "unknown error"));
  }

  // 8. Upload Contract B
  const pathB = `contracts/${contractId}/Umowa_B_Student_${timestamp}.pdf`;
  const { error: uploadErrorB } = await admin.storage
    .from("deliverables")
    .upload(pathB, pdfB, { contentType: "application/pdf" });

  if (uploadErrorB) {
    console.error("Upload Contract B Error:", uploadErrorB);
    throw new Error("Błąd wgrywania Umowy B: " + (uploadErrorB?.message || "unknown error"));
  }

  // 9. Insert contract_documents records (use admin client to bypass RLS)
  const { error: docInsertError } = await admin
    .from("contract_documents")
    .insert([
      {
        contract_id: contractId,
        document_type: "contract_a",
        storage_path: pathA,
        file_name: `Umowa_o_Swiadczenie_Uslugi_${dateStr}.pdf`,
        generated_by: userData.user?.id || "",
      },
      {
        contract_id: contractId,
        document_type: "contract_b",
        storage_path: pathB,
        file_name: `Umowa_o_Dzielo_${dateStr}.pdf`,
        generated_by: userData.user?.id || "",
      },
    ]);

  if (docInsertError) {
    console.error("Insert contract_documents Error:", docInsertError);
    throw new Error("Błąd zapisu dokumentów: " + (docInsertError?.message || "unknown error"));
  }

  // 10. Update contract — mark documents as generated (use admin to bypass RLS)
  await admin
    .from("contracts")
    .update({ documents_generated_at: new Date().toISOString() })
    .eq("id", contractId);

  revalidatePath(`/app/deliverables/${applicationId}`);

  return { success: true, pathA, pathB };
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
    throw new Error("Nie znaleziono kontraktu: " + (contractError?.message || ""));
  }

  const { data: milestonesData, error: milestonesError } = await admin
    .from("milestones")
    .select("idx, title, amount, amount_minor, acceptance_criteria, due_at, status")
    .eq("contract_id", contractId)
    .order("idx", { ascending: true });

  if (milestonesError) {
    console.error("Milestones load error:", milestonesError);
    throw new Error("Nie udalo sie pobrac etapow kontraktu.");
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
    console.error("Contract document guard error:", existingDocumentsError);
    throw new Error("Nie udalo sie sprawdzic istniejacych dokumentow kontraktu.");
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
        console.error("documents_generated_at sync error:", syncGeneratedAtError);
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
    const servicePackage = unwrapRelation(serviceOrder?.package ?? null);
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

  const [pdfA, pdfB] = await Promise.all([
    renderPdfToBuffer(React.createElement(ContractADocument, { data: contractData })),
    renderPdfToBuffer(React.createElement(ContractBDocument, { data: contractData })),
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

  if (needsContractA) {
    const pathA = `contracts/${contractId}/Umowa_A_Firma_${timestamp}.pdf`;
    const { error: uploadErrorA } = await admin.storage
      .from("deliverables")
      .upload(pathA, pdfA, { contentType: "application/pdf" });

    if (uploadErrorA) {
      console.error("Upload Contract A Error:", uploadErrorA);
      throw new Error("Nie udalo sie wgrac Umowy A: " + (uploadErrorA?.message || "unknown error"));
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

  if (needsContractB) {
    const pathB = `contracts/${contractId}/Umowa_B_Student_${timestamp}.pdf`;
    const { error: uploadErrorB } = await admin.storage
      .from("deliverables")
      .upload(pathB, pdfB, { contentType: "application/pdf" });

    if (uploadErrorB) {
      console.error("Upload Contract B Error:", uploadErrorB);
      throw new Error("Nie udalo sie wgrac Umowy B: " + (uploadErrorB?.message || "unknown error"));
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
      console.error("Insert contract_documents Error:", docInsertError);
      throw new Error("Nie udalo sie zapisac dokumentow kontraktu: " + (docInsertError?.message || "unknown error"));
    }
  }

  const { error: contractUpdateError } = await admin
    .from("contracts")
    .update({ documents_generated_at: new Date().toISOString() })
    .eq("id", contractId);

  if (contractUpdateError) {
    console.error("documents_generated_at update error:", contractUpdateError);
    throw new Error("Dokumenty powstaly, ale nie udalo sie zapisac znacznika generacji.");
  }

  if (deliverableId) {
    revalidatePath(`/app/deliverables/${deliverableId}`);
  }

  return { success: true, skipped: false, generated };
}

export async function generateContractDocumentsForAdmin(contractId: string, actorUserId: string) {
  return generateContractDocumentsInternal(contractId, actorUserId);
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

  // 1. Fetch contract to determine role
  const { data: contract } = await supabase
    .from("contracts")
    .select("id, company_id, student_id")
    .eq("id", contractId)
    .single();

  if (!contract) throw new Error("Kontrakt nie znaleziony");

  const isCompany = contract.company_id === userId;
  const isStudent = contract.student_id === userId;

  if (!isCompany && !isStudent) {
    throw new Error("Brak uprawnień do akceptacji tego dokumentu");
  }

  const now = new Date().toISOString();
  const admin = createAdminClient();

  // 2. Update contract_documents (use admin to bypass RLS)
  if (isCompany) {
    await admin
      .from("contract_documents")
      .update({ company_accepted_at: now })
      .eq("id", contractDocumentId);

    // Also update the contract-level timestamp
    await admin
      .from("contracts")
      .update({ company_contract_accepted_at: now })
      .eq("id", contractId);
  } else {
    await admin
      .from("contract_documents")
      .update({ student_accepted_at: now })
      .eq("id", contractDocumentId);

    await admin
      .from("contracts")
      .update({ student_contract_accepted_at: now })
      .eq("id", contractId);
  }

  revalidatePath(`/app/deliverables/${applicationId}`);

  return { success: true, role: isCompany ? "company" : "student" };
}
