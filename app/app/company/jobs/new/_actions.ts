"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { parseCommissionRateInput, resolveCommissionRate } from "@/lib/commission";

const ALLOWED_OFFER_TYPES = new Set(["micro", "job"]);
const ALLOWED_REALIZATION_MODES = new Set(["student_defined", "company_defined"]);
const ALLOWED_CONTRACT_TYPES = new Set(["B2B", "UoP", "UZ", "Staz", "Staż"]);
const ALLOWED_WORK_MODES = new Set(["remote", "onsite", "hybrid"]);
const ALLOWED_CATEGORIES = new Set([
  "Administracja biurowa",
  "Badania i rozwoj",
  "Bankowosc",
  "BHP / Ochrona srodowiska",
  "Budownictwo",
  "Call Center",
  "Doradztwo / Konsulting",
  "Edukacja / Szkolenia",
  "Energetyka",
  "Finanse / Ekonomia",
  "Franczyza / Wlasny biznes",
  "Grafika & Design",
  "Hotelarstwo / Gastronomia / Turystyka",
  "Human Resources / Zasoby ludzkie",
  "Internet / e-Commerce / Nowe media",
  "Inzynieria",
  "IT - Administracja",
  "IT - Rozwoj oprogramowania",
  "Kontrola jakosci",
  "Lancuch dostaw",
  "Marketing",
  "Media / Sztuka / Rozrywka",
  "Nieruchomosci",
  "Obsluga klienta",
  "Praca fizyczna",
  "Prawo",
  "Produkcja",
  "Public Relations",
  "Reklama / Grafika / Kreacja / Fotografia",
  "Sektor publiczny",
  "Sprzedaz",
  "Transport / Spedycja / Logistyka",
  "Ubezpieczenia",
  "Zakupy",
  "Zdrowie / Uroda / Rekreacja",
  "Inne",
]);

type CompanyMilestoneTemplate = {
  title: string;
  acceptance_criteria: string;
};

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

  const uploadedFilePrefix = "[ZALACZONY PLIK]:";
  const lines = value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  for (const line of lines) {
    if (line.startsWith(uploadedFilePrefix)) {
      const uploadedFileUrl = line.slice(uploadedFilePrefix.length).trim();
      if (!isValidHttpsUrl(uploadedFileUrl)) {
        throw new Error("Link do zalaczonego pliku musi byc poprawnym adresem https://.");
      }
      continue;
    }

    // Walidacja URL linku do materiałów wyłączona — akceptujemy dowolny tekst
    // if (/^(https?:\/\/|www\.)/i.test(line)) {
    //   if (!line.startsWith("https://") || !isValidHttpsUrl(line)) {
    //     throw new Error("Link do materialow musi zaczynac sie od https:// i prowadzic do poprawnego adresu.");
    //   }
    // }
  }
}

function parseCompanyMilestones(rawValue: FormDataEntryValue | null): CompanyMilestoneTemplate[] {
  if (typeof rawValue !== "string" || rawValue.trim().length === 0) return [];

  let parsed: unknown;
  try {
    parsed = JSON.parse(rawValue);
  } catch {
    throw new Error("Nie udalo sie odczytac etapow realizacji.");
  }

  if (!Array.isArray(parsed)) {
    throw new Error("Etapy realizacji musza byc lista.");
  }

  if (parsed.length > 12) {
    throw new Error("Mozesz zapisac maksymalnie 12 etapow realizacji.");
  }

  return parsed.map((entry, index) => {
    if (!entry || typeof entry !== "object") {
      throw new Error(`Etap ${index + 1} ma nieprawidlowy format.`);
    }

    const title = String((entry as { title?: unknown }).title ?? "").trim();
    const acceptance_criteria = String(
      (entry as { acceptance_criteria?: unknown }).acceptance_criteria ?? "",
    ).trim();

    if (!title) {
      throw new Error(`Etap ${index + 1} musi miec nazwe.`);
    }
    if (title.length > 120) {
      throw new Error(`Nazwa etapu ${index + 1} jest za dluga (max 120 znakow).`);
    }
    if (acceptance_criteria.length > 600) {
      throw new Error(`Opis etapu ${index + 1} jest za dlugi (max 600 znakow).`);
    }

    return { title, acceptance_criteria };
  });
}

export async function createOffer(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Brak sesji");

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("user_id", user.id)
    .maybeSingle();

  if (profileError || profile?.role !== "company") {
    throw new Error("Tylko konto firmowe moze dodawac zadania.");
  }

  const tytul = String(formData.get("tytul") ?? "").trim();
  const opis = String(formData.get("opis") ?? "").trim();
  const kategoria = String(formData.get("kategoria") ?? "Inne");
  const typ = String(formData.get("typ") ?? "micro");
  const is_platform_service = false;

  const czas = String(formData.get("czas") ?? "").trim() || null;
  const cel_wspolpracy = String(formData.get("cel_wspolpracy") ?? "").trim() || null;
  const oczekiwany_rezultat = String(formData.get("oczekiwany_rezultat") ?? "").trim() || null;
  const kryteria_akceptacji = String(formData.get("kryteria_akceptacji") ?? "").trim() || null;
  const osoba_prowadzaca = String(formData.get("osoba_prowadzaca") ?? "").trim() || null;
  const wymagania = String(formData.get("wymagania") ?? "").trim() || null;
  const obligations = String(formData.get("obligations") ?? "").trim() || null;
  const benefits = String(formData.get("benefits") ?? "").trim() || null;
  const rawContractType = String(formData.get("contract_type") ?? "").trim() || null;
  const contract_type = rawContractType === "Staż" ? "Staz" : rawContractType;
  const tryb_pracy = String(formData.get("tryb_pracy") ?? "").trim() || null;
  const location = String(formData.get("location") ?? "").trim() || null;
  const is_remote = tryb_pracy === "remote" || formData.get("is_remote") === "on";
  const czas_realizacji_typ = String(formData.get("czas_typ") ?? "").trim() || null;
  const czas_realizacji_dni_raw = String(formData.get("czas_dni") ?? "").trim();
  const czas_realizacji_data_raw = String(formData.get("czas_data") ?? "").trim();
  const planowany_start_raw = String(formData.get("planowany_start") ?? "").trim();
  const planowany_start = czas_realizacji_typ === "date" ? planowany_start_raw || null : null;
  const czas_realizacji_dni =
    czas_realizacji_typ === "days" && czas_realizacji_dni_raw ? Number(czas_realizacji_dni_raw) : null;
  const czas_realizacji_data = czas_realizacji_typ === "date" ? czas_realizacji_data_raw || null : null;
  const wymagana_poufnosc = formData.get("wymagana_poufnosc") === "on";
  const przeniesienie_praw_autorskich = formData.get("przeniesienie_praw_autorskich") === "on";
  const portfolio_dozwolone = formData.get("portfolio_dozwolone") === "on";
  const materialy_legalnie_udostepnione = formData.get("materialy_legalnie_udostepnione") === "on";
  const commission_rate = resolveCommissionRate({
    explicitRate: parseCommissionRateInput(formData.get("commission_rate")),
    sourceType: "application",
    offerType: typ,
    isPlatformService: is_platform_service,
  });
  const realization_mode_raw = String(formData.get("realization_mode") ?? "").trim() || "student_defined";
  const realization_mode = typ === "micro" ? realization_mode_raw : "student_defined";
  const company_milestones =
    typ === "micro" && realization_mode === "company_defined"
      ? parseCompanyMilestones(formData.get("company_milestones"))
      : [];

  const stawkaRaw = String(formData.get("stawka") ?? "").trim();
  const stawka = stawkaRaw ? Number(stawkaRaw) : null;

  const minSalRaw = String(formData.get("salary_range_min") ?? "").trim();
  const maxSalRaw = String(formData.get("salary_range_max") ?? "").trim();
  const salary_range_min = minSalRaw ? Number(minSalRaw) : null;
  const salary_range_max = maxSalRaw ? Number(maxSalRaw) : null;

  const techStr = String(formData.get("technologies") ?? "");
  const technologies = Array.from(
    new Set(
      techStr
        .split(",")
        .map((technology) => technology.trim())
        .filter((technology) => technology.length > 0),
    ),
  );

  if (!tytul || !opis) throw new Error("Uzupelnij tytul i opis.");
  if (!cel_wspolpracy || !oczekiwany_rezultat || !kryteria_akceptacji || !osoba_prowadzaca) {
    throw new Error(
      "Uzupelnij cel wspolpracy, oczekiwany rezultat, kryteria akceptacji i osobe prowadzaca.",
    );
  }

  if (!ALLOWED_OFFER_TYPES.has(typ)) throw new Error("Nieprawidlowy typ oferty.");
  if (!ALLOWED_CATEGORIES.has(kategoria)) throw new Error("Wybierz poprawna kategorie oferty.");
  if (contract_type && !ALLOWED_CONTRACT_TYPES.has(contract_type)) {
    throw new Error("Wybierz poprawny model wspolpracy.");
  }
  if (!tryb_pracy && typ === "job") {
    throw new Error("Wybierz tryb pracy.");
  }
  if (tryb_pracy && !ALLOWED_WORK_MODES.has(tryb_pracy)) {
    throw new Error("Wybierz poprawny tryb pracy.");
  }
  if (tytul.length > 140) throw new Error("Tytul oferty jest za dlugi (max 140 znakow).");
  if (opis.length > 6000) throw new Error("Opis oferty jest za dlugi (max 6000 znakow).");
  if (czas && czas.length > 80) throw new Error("Pole czasu realizacji jest za dlugie (max 80 znakow).");
  if (cel_wspolpracy && cel_wspolpracy.length > 500) {
    throw new Error("Cel wspolpracy jest za dlugi (max 500 znakow).");
  }
  if (oczekiwany_rezultat && oczekiwany_rezultat.length > 500) {
    throw new Error("Oczekiwany rezultat jest za dlugi (max 500 znakow).");
  }
  if (kryteria_akceptacji && kryteria_akceptacji.length > 500) {
    throw new Error("Kryteria akceptacji sa za dlugie (max 500 znakow).");
  }
  if (osoba_prowadzaca && osoba_prowadzaca.length > 120) {
    throw new Error("Osoba prowadzaca jest za dluga (max 120 znakow).");
  }
  if (wymagania && wymagania.length > 3000) throw new Error("Wymagania sa za dlugie (max 3000 znakow).");
  if (benefits && benefits.length > 3000) throw new Error("Sekcja benefitow jest za dluga (max 3000 znakow).");
  if (obligations && obligations.length > 3000) {
    throw new Error("Sekcja materialow i zasobow od firmy jest za dluga (max 3000 znakow).");
  }
  if (planowany_start && Number.isNaN(Date.parse(planowany_start))) {
    throw new Error("Planowany start musi byc poprawna data.");
  }
  if (czas_realizacji_typ && !new Set(["days", "date"]).has(czas_realizacji_typ)) {
    throw new Error("Wybierz poprawny sposob okreslenia czasu realizacji.");
  }
  if (
    czas_realizacji_typ === "days" &&
    (!Number.isFinite(czas_realizacji_dni) || czas_realizacji_dni == null || czas_realizacji_dni <= 0)
  ) {
    throw new Error("Podaj oczekiwana liczbe dni na wykonanie zlecenia.");
  }
  if (czas_realizacji_typ === "date" && !czas_realizacji_data) {
    throw new Error("Wybierz konkretna date graniczna.");
  }
  if (czas_realizacji_data && Number.isNaN(Date.parse(czas_realizacji_data))) {
    throw new Error("Data graniczna musi byc poprawna data.");
  }
  if (technologies.some((technology) => technology.length > 40)) {
    throw new Error("Kazda technologia musi miec maksymalnie 40 znakow.");
  }
  if (technologies.length > 20) {
    throw new Error("Mozesz dodac maksymalnie 20 technologii.");
  }
  if (!ALLOWED_REALIZATION_MODES.has(realization_mode)) {
    throw new Error("Wybierz poprawny sposob ustalania etapow realizacji.");
  }
  if (typ === "micro" && (!Number.isFinite(stawka) || stawka == null || stawka <= 0)) {
    throw new Error("Podaj poprawny budzet mikrozlecenia.");
  }
  if (typ === "micro" && realization_mode === "company_defined" && company_milestones.length === 0) {
    throw new Error("Dodaj przynajmniej jeden etap realizacji ustalany przez firme.");
  }
  if (typ === "job") {
    if (salary_range_min != null && salary_range_min < 0) {
      throw new Error("Minimalne wynagrodzenie nie moze byc ujemne.");
    }
    if (salary_range_max != null && salary_range_max < 0) {
      throw new Error("Maksymalne wynagrodzenie nie moze byc ujemne.");
    }
    if (salary_range_min != null && salary_range_max != null && salary_range_max < salary_range_min) {
      throw new Error("Maksymalne wynagrodzenie nie moze byc nizsze od minimalnego.");
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
    cel_wspolpracy,
    oczekiwany_rezultat,
    kryteria_akceptacji,
    osoba_prowadzaca,
    wymagania,
    obligations,
    benefits,
    stawka,
    salary_range_min,
    salary_range_max,
    contract_type,
    tryb_pracy,
    location,
    is_remote,
    planowany_start,
    czas_realizacji_typ,
    czas_realizacji_dni,
    czas_realizacji_data,
    wymagana_poufnosc,
    przeniesienie_praw_autorskich,
    portfolio_dozwolone,
    materialy_legalnie_udostepnione,
    realization_mode,
    company_milestones: company_milestones.length > 0 ? company_milestones : null,
    is_platform_service,
    commission_rate,
    status: "published",
    technologies,
    created_at: new Date().toISOString(),
  });

  if (error) throw new Error(error.message);

  redirect("/app/company/offers?created=1");
}
