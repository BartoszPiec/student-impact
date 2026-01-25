"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";


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
  let files = [];
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

  revalidatePath(`/app/deliverables/${applicationId}`);
}

export async function reviewDeliverable(deliverableId: string, status: "accepted" | "rejected", feedback: string) {
  const supabase = await createClient();
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) redirect("/auth");

  // Need appId for revalidation
  const { data: deliv } = await supabase.from("deliverables").select("application_id").eq("id", deliverableId).single();

  // ✅ [Realization Guard]
  const { error } = await supabase.rpc("review_deliverable_and_progress", {
    p_deliverable_id: deliverableId,
    p_decision: status, // "accepted" | "rejected"
    p_feedback: feedback ?? null,
  });
  if (error) throw new Error(error.message);

  if (deliv?.application_id) {
    revalidatePath(`/app/deliverables/${deliv.application_id}`);
  }
}

export async function submitReview(applicationId: string, rating: number, comment: string) {
  const supabase = await createClient();
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) redirect("/auth");

  // Try Application first
  let studentId = "";
  let companyId = "";
  let offerId = ""; // Might be null for service orders if not using offers table
  let sourceType = "application";

  const { data: appRow } = await supabase
    .from("applications")
    .select("id, student_id, offer_id, offers(company_id)")
    .eq("id", applicationId)
    .maybeSingle();

  if (appRow) {
    studentId = appRow.student_id;
    companyId = (appRow.offers as any)?.company_id;
    offerId = appRow.offer_id;
  } else {
    // Try Service Order
    const { data: soRow } = await supabase
      .from("service_orders")
      .select("id, company_id, student_id")
      .eq("id", applicationId)
      .maybeSingle();

    if (soRow) {
      sourceType = "service_order";
      studentId = soRow.student_id;
      companyId = soRow.company_id;
      // Service orders might not have 'offer_id' in the same way, or it's just the SO ID itself as reference
    } else {
      throw new Error("Brak aplikacji lub zlecenia");
    }
  }

  let role = "";
  let revieweeId = "";

  if (user.user.id === studentId) {
    role = "student";
    revieweeId = companyId;
  } else if (user.user.id === companyId) {
    role = "company";
    revieweeId = studentId;
  } else {
    throw new Error("Nie jesteś stroną tej umowy");
  }

  // Insert Review
  const reviewPayload: any = {
    reviewer_id: user.user.id,
    reviewee_id: revieweeId,
    application_id: sourceType === 'application' ? applicationId : null,
    service_order_id: sourceType === 'service_order' ? applicationId : null,
    // offer_id: offerId, // Optional?
    reviewer_role: role,
    rating: rating,
    comment: comment
  };

  if (offerId) reviewPayload.offer_id = offerId;

  // Backward compatibility for profile page
  if (role === 'company') {
    reviewPayload.student_id = revieweeId;
  }

  await supabase.from("reviews").insert(reviewPayload);

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
      .eq("id", applicationId);
  } else if (sourceType === 'service_order') {
    await supabase.from("service_orders")
      .update({ status: 'completed' })
      .eq("id", applicationId);
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
  const description = String(formData.get("description") ?? "");
  const fileSize = Number(formData.get("fileSize") ?? 0);

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

export async function deleteResource(resourceId: string, applicationId: string) { // appId param for revalidation
  const supabase = await createClient();
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
  const { error } = await supabase.rpc("review_delivery_v2", {
    p_milestone_id: milestoneId,
    p_decision: decision,
    p_feedback: feedback
  });

  if (error) throw new Error(error.message);

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

  const dateStr = new Date().toLocaleDateString('pl-PL');
  let content = `UMOWA O DZIEŁO\n\n`;
  content += `ID Kontraktu: ${contractId}\n`;
  content += `Data zawarcia: ${dateStr}\n\n`;
  content += `HARMONOGRAM REALIZACJI I PŁATNOŚCI:\n\n`;

  let total = 0;
  milestones?.forEach((m: any, i: number) => {
    content += `${i + 1}. ${m.title}\n`;
    content += `   Kwota: ${Number(m.amount).toFixed(2)} PLN\n`;
    content += `   Zakres: ${m.acceptance_criteria}\n`;
    content += `   Status: ${m.status}\n\n`;
    total += Number(m.amount);
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

  const insertPayload: any = {
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
