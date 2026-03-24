"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

type PayoutContractRelation = {
  student_id: string | null;
  applications?: {
    offers?: {
      tytul?: string | null;
    } | null;
  } | null;
};

type PayoutRow = {
  id: string;
  contract_id: string | null;
  milestone_id: string | null;
  amount_net: number | string;
  amount_gross: number | string;
  platform_fee: number | string;
  contracts: PayoutContractRelation | null;
};

type PayoutListRow = PayoutRow & {
  status: string;
  created_at: string;
  paid_at: string | null;
  milestones: {
    title: string | null;
    idx: number | null;
  } | null;
};

type StudentProfileRow = {
  user_id: string;
  public_name: string | null;
};

function getStudentIdFromPayout(payout: PayoutRow): string | null {
  return payout.contracts?.student_id ?? null;
}

function getOfferTitleFromPayout(payout: PayoutRow): string {
  return payout.contracts?.applications?.offers?.tytul?.trim() || "Brak tytułu";
}

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
    .eq("user_id", userData.user.id)
    .single();

  if (profile?.role !== "admin") {
    throw new Error("Brak uprawnień administratora");
  }

  return userData.user;
}

/**
 * Mark a payout as "processing" - admin has begun the transfer.
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
 * Mark a payout as "paid" - funds transferred to student.
 */
export async function markPayoutPaid(payoutId: string) {
  const user = await requireAdmin();
  const admin = createAdminClient();

  const { data: payout, error: payoutError } = await admin
    .from("payouts")
    .select("id, contract_id, milestone_id, amount_net, amount_gross, platform_fee, contracts(student_id, applications!contracts_application_id_fkey(offers(tytul)))")
    .eq("id", payoutId)
    .maybeSingle();

  if (payoutError) {
    throw new Error("Nie udało się pobrać wypłaty: " + payoutError.message);
  }

  if (!payout) {
    throw new Error("Nie znaleziono wypłaty");
  }

  const typedPayout = payout as unknown as PayoutRow;

  // ✅ [Refactor v1] Atomic Payout Processing with Accounting
  const { error: rpcError } = await admin.rpc("process_payout_paid_v1", {
    p_payout_id: payoutId,
    p_admin_id: user.id
  });

  if (rpcError) {
    console.error("RPC Error processing payout:", rpcError);
    throw new Error("Nie udało się zatwierdzić wypłaty: " + rpcError.message);
  }

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

  if (!data || data.length === 0) {
    return [];
  }

  const typedData = data as unknown as PayoutListRow[];
  const studentIds = [...new Set(typedData.map((p) => getStudentIdFromPayout(p)).filter((id): id is string => Boolean(id)))];

  const { data: students, error: studentError } = await admin
    .from("student_profiles")
    .select("user_id, public_name")
    .in("user_id", studentIds);

  if (studentError) {
    console.error("Error fetching student profiles:", studentError);
  }

  const studentMap = new Map(
    ((students ?? []) as StudentProfileRow[]).map((student) => [
      student.user_id,
      student.public_name ?? "Nieznany",
    ])
  );

  return typedData.map((payout) => ({
    ...payout,
    studentName: studentMap.get(getStudentIdFromPayout(payout) ?? "") || "Nieznany",
    offerTitle: getOfferTitleFromPayout(payout),
    milestoneTitle: payout.milestones?.title || "Brak",
    milestoneIdx: payout.milestones?.idx || 0,
  }));
}
