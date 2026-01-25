"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export async function removeSavedOffer(offerId: string) {
  const supabase = await createClient();

  const { data } = await supabase.auth.getUser();
  const user = data.user;
  if (!user) redirect("/auth");

  // RLS i tak pilnuje, ale doprecyzowujemy warunek
  const { error } = await supabase
    .from("saved_offers")
    .delete()
    .eq("student_id", user.id)
    .eq("offer_id", offerId);

  if (error) throw new Error(error.message);

  revalidatePath("/app/saved");
}
