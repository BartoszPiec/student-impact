"use server";

import { requireAdmin } from "@/lib/admin/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { transferPayoutViaStripe } from "@/lib/stripe/payouts";
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
  amount_net_minor?: number | string | null;
  amount_gross: number | string;
  platform_fee: number | string;
  status?: string;
  stripe_transfer_id?: string | null;
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
  return payout.contracts?.applications?.offers?.tytul?.trim() || "Brak tytulu";
}

function amountNetMinorFromPayout(payout: PayoutRow): number {
  if (payout.amount_net_minor != null) {
    const amountMinor = Number(payout.amount_net_minor);
    if (Number.isInteger(amountMinor) && amountMinor > 0) return amountMinor;
  }

  const amountNet = Number(payout.amount_net);
  if (!Number.isFinite(amountNet) || amountNet <= 0) {
    throw new Error("Nieprawidlowa kwota wyplaty.");
  }

  return Math.round(amountNet * 100);
}

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

  if (error) throw new Error("Nie udalo sie zmienic statusu: " + error.message);

  revalidatePath("/app/admin/payouts");
}

export async function markPayoutPaid(payoutId: string) {
  const { user } = await requireAdmin();
  const admin = createAdminClient();

  const { data: payout, error: payoutError } = await admin
    .from("payouts")
    .select("id, contract_id, milestone_id, amount_net, amount_net_minor, amount_gross, platform_fee, status, stripe_transfer_id, contracts(student_id, applications!contracts_application_id_fkey(offers(tytul)))")
    .eq("id", payoutId)
    .maybeSingle();

  if (payoutError) {
    throw new Error("Nie udalo sie pobrac wyplaty: " + payoutError.message);
  }

  if (!payout) {
    throw new Error("Nie znaleziono wyplaty");
  }

  const typedPayout = payout as unknown as PayoutRow;
  const amountNetMinor = amountNetMinorFromPayout(typedPayout);

  if (process.env.STRIPE_PAYOUTS_ENABLED === "true") {
    const transferResult = await transferPayoutViaStripe(payoutId, {
      paidByAdminId: user.id,
      throwOnError: true,
    });

    if (
      transferResult.status === "already_paid"
      || transferResult.status === "marked_paid"
      || transferResult.status === "transferred"
    ) {
      revalidatePath("/app/admin/payouts");
      return;
    }

    if (transferResult.status === "not_found") {
      throw new Error("Nie znaleziono wyplaty");
    }

    if (transferResult.status === "not_payable_status") {
      throw new Error("Tej wyplaty nie mozna juz przetworzyc w aktualnym statusie.");
    }
  }

  let { error: rpcError } = await admin.rpc("process_payout_paid_v1", {
    p_payout_id: payoutId,
    p_admin_id: user.id,
    p_amount_net_minor: amountNetMinor,
  });

  if (rpcError?.message?.includes("Could not find the function")) {
    const fallback = await admin.rpc("process_payout_paid_v1", {
      p_payout_id: payoutId,
      p_admin_id: user.id,
    });
    rpcError = fallback.error;
  }

  if (rpcError) {
    console.error("RPC Error processing payout:", rpcError);
    throw new Error("Nie udalo sie zatwierdzic wyplaty: " + rpcError.message);
  }

  revalidatePath("/app/admin/payouts");
}

export async function getPayouts(statusFilter?: string) {
  await requireAdmin();
  const admin = createAdminClient();

  let query = admin
    .from("payouts")
    .select(`
      id, milestone_id, contract_id, amount_gross, platform_fee, amount_net, status, created_at, paid_at,
      stripe_transfer_id, stripe_transfer_error,
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
  const studentIds = [
    ...new Set(typedData.map((p) => getStudentIdFromPayout(p)).filter((id): id is string => Boolean(id))),
  ];

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
    ]),
  );

  return typedData.map((payout) => ({
    ...payout,
    studentName: studentMap.get(getStudentIdFromPayout(payout) ?? "") || "Nieznany",
    offerTitle: getOfferTitleFromPayout(payout),
    milestoneTitle: payout.milestones?.title || "Brak",
    milestoneIdx: payout.milestones?.idx || 0,
  }));
}
