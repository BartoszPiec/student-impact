"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function createOffer(formData: FormData) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  const user = data.user;

  if (!user) throw new Error("Brak sesji");

  const tytul = String(formData.get("tytul") ?? "").trim();
  const opis = String(formData.get("opis") ?? "").trim();
  const kategoria = String(formData.get("kategoria") ?? "Inne");
  const typ = String(formData.get("typ") ?? "micro");

  // Platform service flag
  const is_platform_service = formData.get("is_platform_service") === "on";

  // Common fields (might be used differently per type)
  const czas = String(formData.get("czas") ?? "").trim() || null;
  const wymagania = String(formData.get("wymagania") ?? "").trim() || null;
  const obligations = String(formData.get("obligations") ?? "").trim() || null;
  const benefits = String(formData.get("benefits") ?? "").trim() || null;
  const contract_type = String(formData.get("contract_type") ?? "").trim() || null;
  const location = String(formData.get("location") ?? "").trim() || null;
  const is_remote = formData.get("is_remote") === "on";

  // Salary / Price
  const stawkaRaw = String(formData.get("stawka") ?? "").trim();
  const stawka = stawkaRaw ? Number(stawkaRaw) : null;

  const minSalRaw = String(formData.get("salary_range_min") ?? "").trim();
  const maxSalRaw = String(formData.get("salary_range_max") ?? "").trim();
  const salary_range_min = minSalRaw ? Number(minSalRaw) : null;
  const salary_range_max = maxSalRaw ? Number(maxSalRaw) : null;

  // Tech stack (comma separated)
  const techStr = String(formData.get("technologies") ?? "");
  const technologies = techStr.split(",").map(t => t.trim()).filter(t => t.length > 0);

  if (!tytul || !opis) throw new Error("Uzupełnij tytuł i opis");

  const { error } = await supabase.from("offers").insert({
    company_id: user.id,
    tytul,
    opis,
    kategoria,
    typ,
    czas,
    wymagania,
    obligations,
    benefits,
    stawka, // For micro tasks
    salary_range_min, // For jobs
    salary_range_max, // For jobs
    contract_type,
    location,
    is_remote,
    is_platform_service,
    status: "published",
    technologies: technologies,
    created_at: new Date().toISOString(),
  });

  if (error) throw new Error(error.message);

  redirect("/app/company/offers");
}
