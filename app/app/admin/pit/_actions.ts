"use server";

import { requireAdmin } from "@/lib/admin/auth";
import { revalidatePath } from "next/cache";

export async function markPitPaid(withholdingId: string) {
  const { supabase } = await requireAdmin();

  const { error } = await supabase
    .from("pit_withholdings")
    .update({
      status: "paid",
      paid_to_us_at: new Date().toISOString(),
    })
    .eq("id", withholdingId);

  if (error) throw new Error(error.message);

  revalidatePath("/app/admin/pit");
}

export async function markPitBatchPaid(withholdingIds: string[]) {
  const { supabase } = await requireAdmin();

  const now = new Date().toISOString();
  const { error } = await supabase
    .from("pit_withholdings")
    .update({ status: "paid", paid_to_us_at: now })
    .in("id", withholdingIds);

  if (error) throw new Error(error.message);

  revalidatePath("/app/admin/pit");
}
