import { createAdminClient } from "@/lib/supabase/admin";
import { getStripe } from "@/lib/stripe";
import { checkPayoutAccountReadiness } from "@/lib/stripe/connect-readiness";

type CreatePayoutTransferInput = {
  payoutId: string;
  contractId: string;
  milestoneId: string | null;
  amountNetMinor: number;
  destinationAccountId: string;
};

type PayoutContractRelation = {
  student_id: string | null;
};

type PayoutTransferRow = {
  id: string;
  contract_id: string | null;
  milestone_id: string | null;
  amount_net: number | string;
  amount_net_minor?: number | string | null;
  status: string | null;
  stripe_transfer_id?: string | null;
  contracts: PayoutContractRelation | PayoutContractRelation[] | null;
};

type StudentStripeProfileRow = {
  stripe_account_id: string | null;
};

type PayoutTransferOptions = {
  paidByAdminId?: string | null;
  throwOnError?: boolean;
};

type PayoutTransferResult =
  | { status: "disabled" }
  | { status: "not_found" }
  | { status: "already_paid" }
  | { status: "not_payable_status"; payoutStatus: string | null }
  | { status: "missing_account"; message: string }
  | { status: "failed"; message: string }
  | { status: "marked_paid"; transferId: string; amountNetMinor: number }
  | { status: "transferred"; transferId: string; amountNetMinor: number };

function unwrapRelation<T>(value: T | T[] | null): T | null {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
}

function amountNetMinorFromPayout(payout: Pick<PayoutTransferRow, "amount_net" | "amount_net_minor">): number {
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

async function markPayoutPaidInLedger(
  payoutId: string,
  amountNetMinor: number,
  paidByAdminId: string | null,
): Promise<void> {
  const admin = createAdminClient();
  const { error } = await admin.rpc("process_payout_paid_v1", {
    p_payout_id: payoutId,
    p_admin_id: paidByAdminId,
    p_amount_net_minor: amountNetMinor,
  });

  if (error) {
    throw new Error("Nie udalo sie zatwierdzic wyplaty po transferze Stripe: " + error.message);
  }
}

async function recordPayoutTransferError(payoutId: string, message: string): Promise<void> {
  const admin = createAdminClient();
  await admin
    .from("payouts")
    .update({
      status: "pending",
      stripe_transfer_error: message,
      updated_at: new Date().toISOString(),
    })
    .eq("id", payoutId)
    .neq("status", "paid");
}

function resolvePayoutError(error: unknown): string {
  return error instanceof Error ? error.message : "Nie udalo sie wykonac transferu Stripe.";
}

export async function createPayoutTransfer(input: CreatePayoutTransferInput) {
  if (!Number.isInteger(input.amountNetMinor) || input.amountNetMinor <= 0) {
    throw new Error("Nieprawidlowa kwota wyplaty dla Stripe.");
  }

  return getStripe().transfers.create(
    {
      amount: input.amountNetMinor,
      currency: "pln",
      destination: input.destinationAccountId,
      metadata: {
        payout_id: input.payoutId,
        contract_id: input.contractId,
        milestone_id: input.milestoneId ?? "",
      },
    },
    {
      idempotencyKey: `payout_transfer_${input.payoutId}`,
    },
  );
}

export async function transferPayoutViaStripe(
  payoutId: string,
  options: PayoutTransferOptions = {},
): Promise<PayoutTransferResult> {
  if (process.env.STRIPE_PAYOUTS_ENABLED !== "true") {
    return { status: "disabled" };
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("payouts")
    .select("id, contract_id, milestone_id, amount_net, amount_net_minor, status, stripe_transfer_id, contracts(student_id)")
    .eq("id", payoutId)
    .maybeSingle();

  if (error) {
    const message = "Nie udalo sie pobrac wyplaty: " + error.message;
    if (options.throwOnError) throw new Error(message);
    return { status: "failed", message };
  }

  if (!data) {
    return { status: "not_found" };
  }

  const payout = data as unknown as PayoutTransferRow;
  const amountNetMinor = amountNetMinorFromPayout(payout);

  if (payout.status === "paid") {
    return { status: "already_paid" };
  }

  if (!["pending", "processing"].includes(String(payout.status))) {
    return { status: "not_payable_status", payoutStatus: payout.status };
  }

  if (payout.stripe_transfer_id) {
    await markPayoutPaidInLedger(payout.id, amountNetMinor, options.paidByAdminId ?? null);
    return { status: "marked_paid", transferId: payout.stripe_transfer_id, amountNetMinor };
  }

  if (!payout.contract_id) {
    const message = "Wyplata nie ma powiazanego kontraktu.";
    await recordPayoutTransferError(payout.id, message);
    if (options.throwOnError) throw new Error(message);
    return { status: "failed", message };
  }

  const contract = unwrapRelation(payout.contracts);
  const studentId = contract?.student_id ?? null;
  if (!studentId) {
    const message = "Nie znaleziono studenta dla tej wyplaty.";
    await recordPayoutTransferError(payout.id, message);
    if (options.throwOnError) throw new Error(message);
    return { status: "failed", message };
  }

  const { data: studentStripeProfile, error: studentStripeError } = await admin
    .from("student_profiles")
    .select("stripe_account_id")
    .eq("user_id", studentId)
    .maybeSingle();

  if (studentStripeError) {
    const message = "Nie udalo sie pobrac konta Stripe studenta: " + studentStripeError.message;
    await recordPayoutTransferError(payout.id, message);
    if (options.throwOnError) throw new Error(message);
    return { status: "failed", message };
  }

  const stripeProfile = studentStripeProfile as StudentStripeProfileRow | null;
  if (!stripeProfile?.stripe_account_id) {
    const message = "Student nie ma skonfigurowanego konta Stripe do wyplat.";
    await recordPayoutTransferError(payout.id, message);
    if (options.throwOnError) throw new Error(message);
    return { status: "missing_account", message };
  }

  const accountReadiness = await checkPayoutAccountReadiness(stripeProfile.stripe_account_id);
  if (!accountReadiness.ready) {
    await recordPayoutTransferError(payout.id, accountReadiness.message);
    if (options.throwOnError) throw new Error(accountReadiness.message);
    return { status: "failed", message: accountReadiness.message };
  }

  await admin
    .from("payouts")
    .update({
      status: "processing",
      stripe_transfer_error: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", payout.id)
    .in("status", ["pending", "processing"]);

  try {
    const transfer = await createPayoutTransfer({
      payoutId: payout.id,
      contractId: payout.contract_id,
      milestoneId: payout.milestone_id,
      amountNetMinor,
      destinationAccountId: stripeProfile.stripe_account_id,
    });

    await admin
      .from("payouts")
      .update({
        stripe_transfer_id: transfer.id,
        stripe_transfer_created_at: new Date().toISOString(),
        stripe_transfer_error: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", payout.id);

    await markPayoutPaidInLedger(payout.id, amountNetMinor, options.paidByAdminId ?? null);

    return { status: "transferred", transferId: transfer.id, amountNetMinor };
  } catch (error) {
    const message = resolvePayoutError(error);
    await recordPayoutTransferError(payout.id, message);
    if (options.throwOnError) throw new Error(message);
    return { status: "failed", message };
  }
}

export async function transferLatestPayoutForMilestone(
  milestoneId: string,
  options: PayoutTransferOptions = {},
): Promise<PayoutTransferResult> {
  if (process.env.STRIPE_PAYOUTS_ENABLED !== "true") {
    return { status: "disabled" };
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("payouts")
    .select("id")
    .eq("milestone_id", milestoneId)
    .in("status", ["pending", "processing"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    const message = "Nie udalo sie pobrac wyplaty dla etapu: " + error.message;
    if (options.throwOnError) throw new Error(message);
    return { status: "failed", message };
  }

  if (!data?.id) {
    return { status: "not_found" };
  }

  return transferPayoutViaStripe(data.id, options);
}
