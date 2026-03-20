"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export async function markPitPaid(withholdingId: string) {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) redirect("/auth");

  // Verify admin role
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("user_id", userData.user.id)
    .single();

  if (profile?.role !== "admin") {
    throw new Error("Brak uprawnień administratora.");
  }

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
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) redirect("/auth");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("user_id", userData.user.id)
    .single();

  if (profile?.role !== "admin") {
    throw new Error("Brak uprawnień administratora.");
  }

  const now = new Date().toISOString();
  const { error } = await supabase
    .from("pit_withholdings")
    .update({ status: "paid", paid_to_us_at: now })
    .in("id", withholdingIds);

  if (error) throw new Error(error.message);

  revalidatePath("/app/admin/pit");
}
