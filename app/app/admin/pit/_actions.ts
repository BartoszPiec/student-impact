"use server";

import { requireAdmin } from "@/lib/admin/auth";
import { uuidSchema } from "@/lib/security/validation";
import { logCriticalError } from "@/lib/observability/error-log";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const INVALID_WITHHOLDING_ID_MESSAGE = "Nieprawidłowy identyfikator potrącenia PIT.";
const INVALID_WITHHOLDING_BATCH_MESSAGE = "Wybierz co najmniej jedno poprawne potrącenie PIT.";
const PIT_MARK_PAID_ERROR_MESSAGE = "Nie udało się oznaczyć potrącenia PIT jako zapłaconego.";

const withholdingIdsSchema = z.array(uuidSchema).min(1).max(200);

function readErrorCode(error: unknown): string | null {
  if (!error || typeof error !== "object" || !("code" in error)) return null;
  const code = (error as { code?: unknown }).code;
  return typeof code === "string" && code.trim().length > 0 ? code.trim() : null;
}

async function logPitActionError(input: {
  source: string;
  error: unknown;
  userId?: string | null;
  withholdingId?: string | null;
  withholdingIds?: string[];
}) {
  await logCriticalError({
    source: input.source,
    error: input.error,
    errorCode: readErrorCode(input.error),
    userId: input.userId ?? null,
    context: {
      withholdingId: input.withholdingId ?? null,
      withholdingIds: input.withholdingIds?.slice(0, 200) ?? null,
      withholdingCount: input.withholdingIds?.length ?? null,
    },
  });
}

export async function markPitPaid(withholdingId: string) {
  const { supabase, user } = await requireAdmin();
  const parsedWithholdingId = uuidSchema.safeParse(withholdingId);

  if (!parsedWithholdingId.success) {
    throw new Error(INVALID_WITHHOLDING_ID_MESSAGE);
  }

  const { error } = await supabase
    .from("pit_withholdings")
    .update({
      status: "paid",
      paid_to_us_at: new Date().toISOString(),
    })
    .eq("id", parsedWithholdingId.data);

  if (error) {
    await logPitActionError({
      source: "admin.pit.mark_paid",
      error,
      userId: user.id,
      withholdingId: parsedWithholdingId.data,
    });
    throw new Error(PIT_MARK_PAID_ERROR_MESSAGE);
  }

  revalidatePath("/app/admin/pit");
}

export async function markPitBatchPaid(withholdingIds: string[]) {
  const { supabase, user } = await requireAdmin();
  const uniqueIds = [...new Set(withholdingIds)];
  const parsedWithholdingIds = withholdingIdsSchema.safeParse(uniqueIds);

  if (!parsedWithholdingIds.success) {
    throw new Error(INVALID_WITHHOLDING_BATCH_MESSAGE);
  }

  const now = new Date().toISOString();
  const { error } = await supabase
    .from("pit_withholdings")
    .update({ status: "paid", paid_to_us_at: now })
    .in("id", parsedWithholdingIds.data);

  if (error) {
    await logPitActionError({
      source: "admin.pit.mark_batch_paid",
      error,
      userId: user.id,
      withholdingIds: parsedWithholdingIds.data,
    });
    throw new Error(PIT_MARK_PAID_ERROR_MESSAGE);
  }

  revalidatePath("/app/admin/pit");
}
