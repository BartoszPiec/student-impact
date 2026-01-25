"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export async function saveStudentProfile(formData: FormData) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  const user = data.user;
  if (!user) redirect("/auth");

  const kierunek = String(formData.get("kierunek") ?? "").trim();
  const rok = Number(formData.get("rok") ?? 0) || null;
  const sciezka = String(formData.get("sciezka") ?? "").trim();

  const bio = String(formData.get("bio") ?? "").trim() || null;
  const doswiadczenie = String(formData.get("doswiadczenie") ?? "").trim() || null;

  const linkedin_url = String(formData.get("linkedin_url") ?? "").trim() || null;
  const portfolio_url = String(formData.get("portfolio_url") ?? "").trim() || null;

  // ✅ tagi kompetencji
  const kompetencjeJson = String(formData.get("kompetencje_json") ?? "").trim();
  let kompetencje: string[] = [];
  if (kompetencjeJson) {
    try {
      const arr = JSON.parse(kompetencjeJson);
      if (Array.isArray(arr)) kompetencje = arr.map(String).map((s) => s.trim()).filter(Boolean);
    } catch { }
  } else {
    // fallback dla starych form
    const raw = String(formData.get("kompetencje") ?? "").trim();
    kompetencje = raw ? raw.split(",").map((s) => s.trim()).filter(Boolean) : [];
  }

  const linkiRaw = String(formData.get("linki") ?? "").trim();
  let linki: any = {};
  try {
    linki = linkiRaw ? JSON.parse(linkiRaw) : {};
  } catch {
    linki = {};
  }

  const { error } = await supabase.from("student_profiles").upsert({
    user_id: user.id,
    kierunek,
    rok,
    sciezka,
    bio,
    doswiadczenie,
    linkedin_url,
    portfolio_url,
    kompetencje,
    linki,
  });

  if (error) throw new Error(error.message);

  revalidatePath("/app/profile");
}

export async function saveCompanyProfile(formData: FormData) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  const user = data.user;
  if (!user) redirect("/auth");

  const nazwa = String(formData.get("nazwa") ?? "").trim();
  const nip = String(formData.get("nip") ?? "").trim() || null;
  const address = String(formData.get("address") ?? "").trim() || null;
  const city = String(formData.get("city") ?? "").trim() || null;

  const branza = String(formData.get("branza") ?? "").trim();
  const osoba_kontaktowa = String(formData.get("osoba_kontaktowa") ?? "").trim();

  const opis = String(formData.get("opis") ?? "").trim() || null;
  const website = String(formData.get("website") ?? "").trim() || null;
  const linkedin_url = String(formData.get("linkedin_url") ?? "").trim() || null;

  const { error } = await supabase.from("company_profiles").upsert({
    user_id: user.id,
    nazwa,
    nip,
    address,
    city,
    branza,
    osoba_kontaktowa,
    opis,
    website,
    linkedin_url,
  });

  if (error) throw new Error(error.message);

  revalidatePath("/app/profile");
}

export async function addEducationEntry(formData: FormData) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/auth");

  const school_name = String(formData.get("school_name") ?? "").trim();
  const field_of_study = String(formData.get("field_of_study") ?? "").trim();
  const degree = String(formData.get("degree") ?? "").trim();

  const start_year = Number(formData.get("start_year"));
  const end_year = Number(formData.get("end_year")) || null;
  const is_current = formData.get("is_current") === "on";

  if (!school_name || !field_of_study) {
    throw new Error("Uczelnia i kierunek są wymagane.");
  }

  const { error } = await supabase.from("education_entries").insert({
    student_id: data.user.id,
    school_name,
    field_of_study,
    degree,
    start_year: start_year || null,
    end_year: is_current ? null : end_year,
    is_current,
  });

  if (error) throw new Error(error.message);
  revalidatePath("/app/profile");
}

export async function deleteEducationEntry(entryId: string) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/auth");

  const { error } = await supabase
    .from("education_entries")
    .delete()
    .eq("id", entryId)
    .eq("student_id", data.user.id);

  if (error) throw new Error(error.message);
  revalidatePath("/app/profile");
}
