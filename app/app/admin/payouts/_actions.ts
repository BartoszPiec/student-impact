"use server";

import { requireAdmin } from "@/lib/admin/auth";
import { uuidSchema } from "@/lib/security/validation";
import { createAdminClient } from "@/lib/supabase/admin";
import { transferPayoutViaStripe } from "@/lib/stripe/payouts";
import { logCriticalError } from "@/lib/observability/error-log";
import { revalidatePath } from "next/cache";

const INVALID_PAYOUT_ID_MESSAGE = "Nieprawidłowy identyfikator wypłaty.";
const PAYOUT_STATUS_UPDATE_ERROR_MESSAGE = "Nie udało się zmienić statusu wypłaty.";
const PAYOUT_LOAD_ERROR_MESSAGE = "Nie udało się pobrać wypłaty.";
const PAYOUT_NOT_FOUND_MESSAGE = "Nie znaleziono wypłaty.";
const PAYOUT_NOT_PAYABLE_MESSAGE = "Tej wypłaty nie można już przetworzyć w aktualnym statusie.";
const PAYOUT_MARK_PAID_ERROR_MESSAGE = "Nie udało się zatwierdzić wypłaty.";
const PAYOUT_TRANSFER_ERROR_MESSAGE = "Nie udało się wykonać transferu Stripe dla wypłaty.";
const PAYOUT_STATUS_FILTERS = new Set(["pending", "processing", "paid"]);

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
    throw new Error("Nieprawidłowa kwota wypłaty.");
  }

  return Math.round(amountNet * 100);
}

function parsePayoutId(payoutId: string) {
  const parsed = uuidSchema.safeParse(payoutId);
  if (!parsed.success) {
    throw new Error(INVALID_PAYOUT_ID_MESSAGE);
  }

  return parsed.data;
}

function readErrorCode(error: unknown): string | null {
  if (!error || typeof error !== "object" || !("code" in error)) return null;
  const code = (error as { code?: unknown }).code;
  return typeof code === "string" && code.trim().length > 0 ? code.trim() : null;
}

function isMissingRpcFunction(error: unknown): boolean {
  return readErrorCode(error) === "PGRST202";
}

async function logAdminPayoutError(input: {
  source: string;
  error?: unknown;
  message: string;
  userId?: string | null;
  payoutId?: string | null;
  context?: Record<string, unknown>;
}) {
  await logCriticalError({
    source: input.source,
    error: input.error,
    errorCode: readErrorCode(input.error),
    message: input.message,
    userId: input.userId ?? null,
    context: {
      payoutId: input.payoutId ?? null,
      ...input.context,
    },
  });
}

export async function markPayoutProcessing(payoutId: string) {
  const { user } = await requireAdmin();
  const safePayoutId = parsePayoutId(payoutId);
  const admin = createAdminClient();

  const { data: updatedPayout, error } = await admin
    .from("payouts")
    .update({
      status: "processing",
      updated_at: new Date().toISOString(),
    })
    .eq("id", safePayoutId)
    .eq("status", "pending")
    .select("id")
    .maybeSingle();

  if (error) {
    await logAdminPayoutError({
      source: "admin.payouts.processing_update_failed",
      error,
      message: "Admin payout processing status update failed.",
      userId: user.id,
      payoutId: safePayoutId,
    });
    throw new Error(PAYOUT_STATUS_UPDATE_ERROR_MESSAGE);
  }

  if (!updatedPayout) {
    throw new Error(PAYOUT_NOT_PAYABLE_MESSAGE);
  }

  revalidatePath("/app/admin/payouts");
}

export async function markPayoutPaid(payoutId: string) {
  const { user } = await requireAdmin();
  const safePayoutId = parsePayoutId(payoutId);
  const admin = createAdminClient();

  const { data: payout, error: payoutError } = await admin
    .from("payouts")
    .select("id, contract_id, milestone_id, amount_net, amount_net_minor, amount_gross, platform_fee, status, stripe_transfer_id, contracts(student_id, applications!contracts_application_id_fkey(offers(tytul)))")
    .eq("id", safePayoutId)
    .maybeSingle();

  if (payoutError) {
    await logAdminPayoutError({
      source: "admin.payouts.payout_load_failed",
      error: payoutError,
      message: "Admin payout load failed.",
      userId: user.id,
      payoutId: safePayoutId,
    });
    throw new Error(PAYOUT_LOAD_ERROR_MESSAGE);
  }

  if (!payout) {
    throw new Error(PAYOUT_NOT_FOUND_MESSAGE);
  }

  const typedPayout = payout as unknown as PayoutRow;
  const amountNetMinor = amountNetMinorFromPayout(typedPayout);

  if (process.env.STRIPE_PAYOUTS_ENABLED === "true") {
    const transferResult = await (async () => {
      try {
        return await transferPayoutViaStripe(safePayoutId, {
          paidByAdminId: user.id,
          throwOnError: true,
        });
      } catch (error) {
        await logAdminPayoutError({
          source: "admin.payouts.stripe_transfer_failed",
          error,
          message: "Admin-triggered Stripe payout transfer failed.",
          userId: user.id,
          payoutId: safePayoutId,
        });
        throw new Error(PAYOUT_TRANSFER_ERROR_MESSAGE);
      }
    })();

    if (
      transferResult.status === "already_paid"
      || transferResult.status === "marked_paid"
      || transferResult.status === "transferred"
    ) {
      revalidatePath("/app/admin/payouts");
      return;
    }

    if (transferResult.status === "not_found") {
      throw new Error(PAYOUT_NOT_FOUND_MESSAGE);
    }

    if (transferResult.status === "not_payable_status") {
      throw new Error(PAYOUT_NOT_PAYABLE_MESSAGE);
    }
  }

  let { error: rpcError } = await admin.rpc("process_payout_paid_v1", {
    p_payout_id: safePayoutId,
    p_admin_id: user.id,
    p_amount_net_minor: amountNetMinor,
  });

  if (isMissingRpcFunction(rpcError)) {
    const fallback = await admin.rpc("process_payout_paid_v1", {
      p_payout_id: safePayoutId,
      p_admin_id: user.id,
    });
    rpcError = fallback.error;
  }

  if (rpcError) {
    await logAdminPayoutError({
      source: "admin.payouts.mark_paid_rpc_failed",
      error: rpcError,
      message: "process_payout_paid_v1 failed from admin payout action.",
      userId: user.id,
      payoutId: safePayoutId,
    });
    throw new Error(PAYOUT_MARK_PAID_ERROR_MESSAGE);
  }

  revalidatePath("/app/admin/payouts");
}

export async function getPayouts(statusFilter?: string) {
  const { user } = await requireAdmin();
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
    if (!PAYOUT_STATUS_FILTERS.has(statusFilter)) {
      return [];
    }

    query = query.eq("status", statusFilter);
  }

  const { data, error } = await query;

  if (error) {
    await logAdminPayoutError({
      source: "admin.payouts.list_fetch_failed",
      error,
      message: "Admin payout list fetch failed.",
      userId: user.id,
      context: {
        statusFilter: statusFilter ?? null,
      },
    });
    return [];
  }

  if (!data || data.length === 0) {
    return [];
  }

  const typedData = data as unknown as PayoutListRow[];
  const studentIds = [
    ...new Set(typedData.map((p) => getStudentIdFromPayout(p)).filter((id): id is string => Boolean(id))),
  ];

  if (studentIds.length === 0) {
    return typedData.map((payout) => ({
      ...payout,
      studentName: "Nieznany",
      offerTitle: getOfferTitleFromPayout(payout),
      milestoneTitle: payout.milestones?.title || "Brak",
      milestoneIdx: payout.milestones?.idx || 0,
    }));
  }

  const { data: students, error: studentError } = await admin
    .from("student_profiles")
    .select("user_id, public_name")
    .in("user_id", studentIds);

  if (studentError) {
    await logAdminPayoutError({
      source: "admin.payouts.student_profiles_fetch_failed",
      error: studentError,
      message: "Admin payout student profile fetch failed.",
      userId: user.id,
      context: {
        studentCount: studentIds.length,
      },
    });
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
