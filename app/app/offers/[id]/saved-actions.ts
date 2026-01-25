"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function toggleSavedOffer(offerId: string) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  const user = data.user;

  if (!user) throw new Error("Brak sesji");

  const studentId = user.id;

  const { data: existing } = await supabase
    .from("saved_offers")
    .select("offer_id")
    .eq("student_id", studentId)
    .eq("offer_id", offerId)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from("saved_offers")
      .delete()
      .eq("student_id", studentId)
      .eq("offer_id", offerId);

    if (error) throw new Error(error.message);
  } else {
    const { error } = await supabase.from("saved_offers").insert({
      student_id: studentId,
      offer_id: offerId,
    });

    if (error) throw new Error(error.message);
  }

  revalidatePath(`/app/offers/${offerId}`);
  revalidatePath(`/app/saved`);
}
