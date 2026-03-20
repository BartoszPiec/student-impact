"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

/**
 * Verify the current user is an admin.
 * Uses the profiles table's `role` column.
 */
async function requireAdmin() {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error("Nieautoryzowany");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userData.user.id)
    .single();

  if (profile?.role !== "admin") {
    throw new Error("Brak uprawnień administratora");
  }

  return userData.user;
}

/**
 * Mark a payout as "processing" — admin has begun the transfer.
 */
export async function markPayoutProcessing(payoutId: string) {
  await requireAdmin();
  const admin = createAdminClient();

  const { error } = await admin
    .from("payouts")
    .update({
      status: "processing",
      updated_at: new Date().toISOString(),
    })
    .eq("id", payoutId)
    .eq("status", "pending");

  if (error) throw new Error("Nie udało się zmienić statusu: " + error.message);

  revalidatePath("/app/admin/payouts");
}

/**
 * Mark a payout as "paid" — funds transferred to student.
 */
export async function markPayoutPaid(payoutId: string) {
  await requireAdmin();
  const admin = createAdminClient();

  const { error } = await admin
    .from("payouts")
    .update({
      status: "paid",
      paid_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", payoutId)
    .in("status", ["pending", "processing"]);

  if (error) throw new Error("Nie udało się zmienić statusu: " + error.message);

  revalidatePath("/app/admin/payouts");
}

/**
 * Fetch all payouts with related data.
 */
export async function getPayouts(statusFilter?: string) {
  await requireAdmin();
  const admin = createAdminClient();

  let query = admin
    .from("payouts")
    .select(`
      id, milestone_id, contract_id, amount_gross, platform_fee, amount_net, status, created_at, paid_at,
      milestones!inner(title, idx),
      contracts!inner(
        student_id, company_id,
        applications!contracts_application_id_fkey(
          offers(tytul)
        )
      )
    `)
    .order("created_at", { ascending: false });

  if (statusFilter && statusFilter !== "all") {
    query = query.eq("status", statusFilter);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching payouts:", error);
    return [];
  }

  // Enrich with student names
  if (data && data.length > 0) {
    const studentIds = [...new Set(data.map((p: any) => p.contracts?.student_id).filter(Boolean))];
    const { data: students } = await admin
      .from("student_profiles")
      .select("id, public_name")
      .in("id", studentIds);

    const studentMap = new Map((students || []).map((s: any) => [s.id, s.public_name]));

    return data.map((p: any) => ({
      ...p,
      studentName: studentMap.get(p.contracts?.student_id) || "Nieznany",
      offerTitle: (p.contracts?.applications as any)?.offers?.tytul || "—",
      milestoneTitle: p.milestones?.title || "—",
      milestoneIdx: p.milestones?.idx || 0,
    }));
  }

  return data || [];
}
