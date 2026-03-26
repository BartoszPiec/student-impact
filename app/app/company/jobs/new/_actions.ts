"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { parseCommissionRateInput, resolveCommissionRate } from "@/lib/commission";

const ALLOWED_OFFER_TYPES = new Set(["micro", "job"]);
const ALLOWED_CONTRACT_TYPES = new Set(["B2B", "UoP", "UZ", "Staż"]);
const ALLOWED_CATEGORIES = new Set([
  "Administracja biurowa", "Badania i rozwój", "Bankowość", "BHP / Ochrona środowiska",
  "Budownictwo", "Call Center", "Doradztwo / Konsulting", "Edukacja / Szkolenia",
  "Energetyka", "Finanse / Ekonomia", "Franczyza / Własny biznes", "Grafika & Design",
  "Hotelarstwo / Gastronomia / Turystyka", "Human Resources / Zasoby ludzkie",
  "Internet / e-Commerce / Nowe media", "Inżynieria", "IT - Administracja",
  "IT - Rozwój oprogramowania", "Kontrola jakości", "Łańcuch dostaw", "Marketing",
  "Media / Sztuka / Rozrywka", "Nieruchomości", "Obsługa klienta", "Praca fizyczna",
  "Prawo", "Produkcja", "Public Relations", "Reklama / Grafika / Kreacja / Fotografia",
  "Sektor publiczny", "Sprzedaż", "Transport / Spedycja / Logistyka", "Ubezpieczenia",
  "Zakupy", "Zdrowie / Uroda / Rekreacja", "Inne",
]);

function isValidHttpsUrl(value: string) {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function validateOfferMaterials(value: string | null) {
  if (!value) return;

  const uploadedFilePrefix = "[ZAŁĄCZONY PLIK]:";
  const lines = value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  for (const line of lines) {
    if (line.startsWith(uploadedFilePrefix)) {
      const uploadedFileUrl = line.slice(uploadedFilePrefix.length).trim();
      if (!isValidHttpsUrl(uploadedFileUrl)) {
        throw new Error("Link do załączonego pliku musi być poprawnym adresem https://.");
      }
      continue;
    }

    if (/^(https?:\/\/|www\.)/i.test(line)) {
      if (!line.startsWith("https://") || !isValidHttpsUrl(line)) {
        throw new Error("Link do materiałów musi zaczynać się od https:// i prowadzić do poprawnego adresu.");
      }
    }
  }
}

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
  const commission_rate = resolveCommissionRate({
    explicitRate: parseCommissionRateInput(formData.get("commission_rate")),
    sourceType: "application",
    offerType: typ,
    isPlatformService: is_platform_service,
  });

  // Salary / Price
  const stawkaRaw = String(formData.get("stawka") ?? "").trim();
  const stawka = stawkaRaw ? Number(stawkaRaw) : null;

  const minSalRaw = String(formData.get("salary_range_min") ?? "").trim();
  const maxSalRaw = String(formData.get("salary_range_max") ?? "").trim();
  const salary_range_min = minSalRaw ? Number(minSalRaw) : null;
  const salary_range_max = maxSalRaw ? Number(maxSalRaw) : null;

  // Tech stack (comma separated)
  const techStr = String(formData.get("technologies") ?? "");
  const technologies = Array.from(
    new Set(
      techStr
        .split(",")
        .map((technology) => technology.trim())
        .filter((technology) => technology.length > 0),
    ),
  );

  if (!tytul || !opis) throw new Error("Uzupełnij tytuł i opis");

  if (!ALLOWED_OFFER_TYPES.has(typ)) throw new Error("Nieprawidłowy typ oferty.");
  if (!ALLOWED_CATEGORIES.has(kategoria)) throw new Error("Wybierz poprawną kategorię oferty.");
  if (contract_type && !ALLOWED_CONTRACT_TYPES.has(contract_type)) {
    throw new Error("Wybierz poprawny rodzaj umowy.");
  }
  if (tytul.length > 140) throw new Error("Tytuł oferty jest za długi (max 140 znaków).");
  if (opis.length > 6000) throw new Error("Opis oferty jest za długi (max 6000 znaków).");
  if (czas && czas.length > 80) throw new Error("Pole czasu realizacji jest za długie (max 80 znaków).");
  if (wymagania && wymagania.length > 3000) throw new Error("Wymagania są za długie (max 3000 znaków).");
  if (benefits && benefits.length > 3000) throw new Error("Sekcja benefitów jest za długa (max 3000 znaków).");
  if (obligations && obligations.length > 3000) throw new Error("Materiały do zlecenia są za długie (max 3000 znaków).");
  if (technologies.some((technology) => technology.length > 40)) {
    throw new Error("Każda technologia musi mieć maksymalnie 40 znaków.");
  }
  if (technologies.length > 20) {
    throw new Error("Możesz dodać maksymalnie 20 technologii.");
  }
  if (typ === "micro" && (!Number.isFinite(stawka) || stawka == null || stawka <= 0)) {
    throw new Error("Podaj poprawny budżet mikrozlecenia.");
  }
  if (typ === "job") {
    if (salary_range_min != null && salary_range_min < 0) {
      throw new Error("Minimalne wynagrodzenie nie może być ujemne.");
    }
    if (salary_range_max != null && salary_range_max < 0) {
      throw new Error("Maksymalne wynagrodzenie nie może być ujemne.");
    }
    if (salary_range_min != null && salary_range_max != null && salary_range_max < salary_range_min) {
      throw new Error("Maksymalne wynagrodzenie nie może być niższe od minimalnego.");
    }
  }

  validateOfferMaterials(obligations);

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
    commission_rate,
    status: "published",
    technologies: technologies,
    created_at: new Date().toISOString(),
  });

  if (error) throw new Error(error.message);

  redirect("/app/company/offers?created=1");
}
