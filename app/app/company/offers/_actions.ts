"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

function getString(formData: FormData, key: string) {
  const v = formData.get(key);
  return typeof v === "string" ? v.trim() : "";
}

function getNumber(formData: FormData, key: string) {
  const v = formData.get(key);
  if (typeof v !== "string") return null;
  const n = Number(v);
  if (Number.isNaN(n)) return null;
  return n;
}

export async function setOfferStatus(
  offerId: string,
  status: "published" | "in_progress" | "closed"
) {
  const supabase = await createClient();

  const { data } = await supabase.auth.getUser();
  const user = data.user;
  if (!user) redirect("/auth");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("user_id", user.id)
    .single();

  if (profile?.role !== "company") redirect("/app");

  // zabezpieczenia: nie otwieraj ponownie, jeśli:
  // - jest accepted (w trakcie)
  // - albo było approved (ukończone)
  if (status === "published") {
    const { data: accepted } = await supabase
      .from("applications")
      .select("id")
      .eq("offer_id", offerId)
      .eq("status", "accepted")
      .limit(1)
      .maybeSingle();

    if (accepted?.id) {
      redirect("/app/company/offers");
    }

    const { data: appIds } = await supabase
      .from("applications")
      .select("id")
      .eq("offer_id", offerId);

    const ids = (appIds ?? []).map((x: any) => x.id);
    if (ids.length > 0) {
      const { data: approved } = await supabase
        .from("deliverables")
        .select("id")
        .in("application_id", ids)
        .eq("status", "approved")
        .limit(1)
        .maybeSingle();

      if (approved?.id) {
        redirect("/app/company/offers");
      }
    }
  }

  const { error } = await supabase
    .from("offers")
    .update({ status })
    .eq("id", offerId)
    .eq("company_id", user.id);

  if (error) throw new Error(error.message);

  revalidatePath("/app/company/offers");
  revalidatePath("/app/company/applications");
  revalidatePath("/app");
  revalidatePath(`/app/offers/${offerId}`);
}

export async function updateOffer(offerId: string, formData: FormData) {
  const supabase = await createClient();

  const { data } = await supabase.auth.getUser();
  const user = data.user;
  if (!user) redirect("/auth");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("user_id", user.id)
    .single();

  if (profile?.role !== "company") redirect("/app");

  // blokada edycji po accepted (w trakcie)
  const { data: accepted } = await supabase
    .from("applications")
    .select("id")
    .eq("offer_id", offerId)
    .eq("status", "accepted")
    .limit(1)
    .maybeSingle();

  if (accepted?.id) {
    redirect("/app/company/offers");
  }

  // dodatkowo: edytować można tylko published
  const { data: offerRow } = await supabase
    .from("offers")
    .select("id, status, company_id")
    .eq("id", offerId)
    .maybeSingle();

  if (!offerRow || offerRow.company_id !== user.id) redirect("/app/company/offers");
  if (offerRow.status !== "published") redirect("/app/company/offers");

  const tytul = getString(formData, "tytul");
  const opis = getString(formData, "opis");
  const typ = getString(formData, "typ");
  const czas = getString(formData, "czas");
  const wymagania = getString(formData, "wymagania");
  const stawka = getNumber(formData, "stawka");

  const allowed = ["micro", "projekt", "praktyka"];
  if (!allowed.includes(typ)) redirect("/app/company/offers");
  if (!tytul || !opis) redirect("/app/company/offers");

  const { error } = await supabase
    .from("offers")
    .update({
      tytul,
      opis,
      typ,
      czas: czas || null,
      wymagania: wymagania || null,
      stawka: stawka ?? null,
    })
    .eq("id", offerId)
    .eq("company_id", user.id)
    .eq("status", "published");

  if (error) throw new Error(error.message);

  revalidatePath("/app/company/offers");
  revalidatePath("/app");
  revalidatePath(`/app/offers/${offerId}`);

  redirect("/app/company/offers");
}
