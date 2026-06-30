"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { z } from "zod";
import { resolveCommissionRate } from "@/lib/commission";
import { isAllowedJobCategory, resolveJobCategoryLabel } from "@/lib/constants";
import { logCriticalError } from "@/lib/observability/error-log";
import { assertCanAccessStorageRef, assertUploadedObjectExists } from "@/lib/security/storage";

const ALLOWED_OFFER_TYPES = new Set(["micro", "job"]);
const ALLOWED_REALIZATION_MODES = new Set(["student_defined", "company_defined"]);
const ALLOWED_CONTRACT_TYPES = new Set(["B2B", "UoP", "UZ", "Staz", "Staż"]);
const ALLOWED_WORK_MODES = new Set(["remote", "onsite", "hybrid"]);
const ALLOWED_REALIZATION_TIME_TYPES = new Set(["days", "date"]);

type CompanyMilestoneTemplate = {
  title: string;
  acceptance_criteria: string;
};

const MAX_MICRO_BUDGET = 500_000;
const MAX_SALARY_AMOUNT = 500_000;
const MAX_REALIZATION_DAYS = 365;

const optionalTrimmedString = (maxLength: number, message: string) =>
  z
    .string()
    .trim()
    .max(maxLength, message)
    .transform((value) => (value.length > 0 ? value : null));

const createOfferFormSchema = z.object({
  tytul: z
    .string()
    .trim()
    .min(1, "Uzupelnij tytul i opis.")
    .max(140, "Tytul oferty jest za dlugi (max 140 znakow)."),
  opis: z
    .string()
    .trim()
    .min(1, "Uzupelnij tytul i opis.")
    .max(6000, "Opis oferty jest za dlugi (max 6000 znakow)."),
  kategoria: z
    .string()
    .trim()
    .min(1, "Wybierz kategorie oferty.")
    .transform((value) => resolveJobCategoryLabel(value) ?? value)
    .refine((value) => isAllowedJobCategory(value), "Wybierz poprawna kategorie oferty."),
  typ: z
    .string()
    .trim()
    .transform((value) => value || "micro")
    .refine((value) => ALLOWED_OFFER_TYPES.has(value), "Nieprawidlowy typ oferty."),
  czas: optionalTrimmedString(80, "Pole czasu realizacji jest za dlugie (max 80 znakow)."),
  cel_wspolpracy: z
    .string()
    .trim()
    .min(1, "Uzupelnij cel wspolpracy, oczekiwany rezultat, kryteria akceptacji i osobe prowadzaca.")
    .max(500, "Cel wspolpracy jest za dlugi (max 500 znakow)."),
  oczekiwany_rezultat: z
    .string()
    .trim()
    .min(1, "Uzupelnij cel wspolpracy, oczekiwany rezultat, kryteria akceptacji i osobe prowadzaca.")
    .max(500, "Oczekiwany rezultat jest za dlugi (max 500 znakow)."),
  kryteria_akceptacji: z
    .string()
    .trim()
    .min(1, "Uzupelnij cel wspolpracy, oczekiwany rezultat, kryteria akceptacji i osobe prowadzaca.")
    .max(500, "Kryteria akceptacji sa za dlugie (max 500 znakow)."),
  osoba_prowadzaca: z
    .string()
    .trim()
    .min(1, "Uzupelnij cel wspolpracy, oczekiwany rezultat, kryteria akceptacji i osobe prowadzaca.")
    .max(120, "Osoba prowadzaca jest za dluga (max 120 znakow)."),
  wymagania: optionalTrimmedString(3000, "Wymagania sa za dlugie (max 3000 znakow)."),
  obligations: optionalTrimmedString(3000, "Sekcja materialow i zasobow od firmy jest za dluga (max 3000 znakow)."),
  benefits: optionalTrimmedString(3000, "Sekcja benefitow jest za dluga (max 3000 znakow)."),
  contract_type: z
    .string()
    .trim()
    .transform((value) => {
      if (!value) return null;
      return value === "Sta\u017c" ? "Staz" : value;
    })
    .refine((value) => value == null || ALLOWED_CONTRACT_TYPES.has(value), "Wybierz poprawny model wspolpracy."),
  tryb_pracy: z
    .string()
    .trim()
    .transform((value) => value || null)
    .refine((value) => value == null || ALLOWED_WORK_MODES.has(value), "Wybierz poprawny tryb pracy."),
  location: optionalTrimmedString(160, "Lokalizacja jest za dluga (max 160 znakow)."),
  czas_realizacji_typ: z
    .string()
    .trim()
    .transform((value) => value || null)
    .refine(
      (value) => value == null || ALLOWED_REALIZATION_TIME_TYPES.has(value),
      "Wybierz poprawny sposob okreslenia czasu realizacji.",
    ),
  czas_realizacji_dni_raw: z.string().trim(),
  czas_realizacji_data_raw: z.string().trim(),
  planowany_start_raw: z.string().trim(),
  realization_mode_raw: z
    .string()
    .trim()
    .transform((value) => value || "student_defined")
    .refine(
      (value) => ALLOWED_REALIZATION_MODES.has(value),
      "Wybierz poprawny sposob ustalania etapow realizacji.",
    ),
  stawkaRaw: z.string().trim(),
  salaryRangeMinRaw: z.string().trim(),
  salaryRangeMaxRaw: z.string().trim(),
  technologies: z
    .array(z.string().trim().min(1).max(40, "Kazda technologia musi miec maksymalnie 40 znakow."))
    .max(20, "Mozesz dodac maksymalnie 20 technologii."),
});

function readFormString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function parseTechnologies(rawValue: string) {
  return Array.from(
    new Set(
      rawValue
        .split(",")
        .map((technology) => technology.trim())
        .filter((technology) => technology.length > 0),
    ),
  );
}

function parseCreateOfferForm(formData: FormData) {
  const parsed = createOfferFormSchema.safeParse({
    tytul: readFormString(formData, "tytul"),
    opis: readFormString(formData, "opis"),
    kategoria: readFormString(formData, "kategoria"),
    typ: readFormString(formData, "typ"),
    czas: readFormString(formData, "czas"),
    cel_wspolpracy: readFormString(formData, "cel_wspolpracy"),
    oczekiwany_rezultat: readFormString(formData, "oczekiwany_rezultat"),
    kryteria_akceptacji: readFormString(formData, "kryteria_akceptacji"),
    osoba_prowadzaca: readFormString(formData, "osoba_prowadzaca"),
    wymagania: readFormString(formData, "wymagania"),
    obligations: readFormString(formData, "obligations"),
    benefits: readFormString(formData, "benefits"),
    contract_type: readFormString(formData, "contract_type"),
    tryb_pracy: readFormString(formData, "tryb_pracy"),
    location: readFormString(formData, "location"),
    czas_realizacji_typ: readFormString(formData, "czas_typ"),
    czas_realizacji_dni_raw: readFormString(formData, "czas_dni"),
    czas_realizacji_data_raw: readFormString(formData, "czas_data"),
    planowany_start_raw: readFormString(formData, "planowany_start"),
    realization_mode_raw: readFormString(formData, "realization_mode"),
    stawkaRaw: readFormString(formData, "stawka"),
    salaryRangeMinRaw: readFormString(formData, "salary_range_min"),
    salaryRangeMaxRaw: readFormString(formData, "salary_range_max"),
    technologies: parseTechnologies(readFormString(formData, "technologies")),
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Nieprawidlowe dane oferty.");
  }

  return parsed.data;
}

function parseNullableAmount(rawValue: string, fieldLabel: string, maxAmount: number) {
  if (!rawValue) return null;

  const amount = Number(rawValue.replace(",", "."));
  if (!Number.isFinite(amount)) {
    throw new Error(`Podaj poprawna kwote w polu ${fieldLabel}.`);
  }
  if (amount < 0) {
    throw new Error(`Kwota w polu ${fieldLabel} nie moze byc ujemna.`);
  }
  if (amount > maxAmount) {
    throw new Error(`Kwota w polu ${fieldLabel} jest za wysoka (max ${maxAmount} PLN).`);
  }

  return Math.round(amount * 100) / 100;
}

function parseNullableRealizationDays(rawValue: string) {
  if (!rawValue) return null;

  const days = Number(rawValue);
  if (!Number.isInteger(days) || days <= 0) {
    throw new Error("Podaj oczekiwana liczbe dni na wykonanie zlecenia.");
  }
  if (days > MAX_REALIZATION_DAYS) {
    throw new Error(`Czas realizacji nie moze przekraczac ${MAX_REALIZATION_DAYS} dni.`);
  }

  return days;
}

async function validateOfferMaterials(value: string | null, userId: string) {
  if (!value) return;

  const uploadedFilePrefix = "[ZALACZONY PLIK]:";
  const lines = value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  for (const line of lines) {
    if (line.startsWith(uploadedFilePrefix)) {
      const uploadedFileUrl = line.slice(uploadedFilePrefix.length).trim();
      const ref = await assertCanAccessStorageRef(userId, uploadedFileUrl);
      if (ref.bucket !== "offer_attachments") {
        throw new Error("Zalaczony plik oferty ma nieprawidlowy bucket.");
      }
      await assertUploadedObjectExists(ref);
      continue;
    }

    // Walidacja URL linku do materiałów wyłączona — akceptujemy dowolny tekst
    // if (/^(https?:\/\/|www\.)/i.test(line)) {
    //   if (!line.startsWith("https://") || !isValidHttpsUrl(line)) {
    //     throw new Error("Link do materiałów musi zaczynac sie od https:// i prowadzic do poprawnego adresu.");
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
    throw new Error("Nie udało sie odczytać etapów realizacji.");
  }

  if (!Array.isArray(parsed)) {
    throw new Error("Etapy realizacji musza byc lista.");
  }

  if (parsed.length > 12) {
    throw new Error("Mozesz zapisać maksymalnie 12 etapów realizacji.");
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
    throw new Error("Tylko konto firmowe może dodawac zadania.");
  }

  const input = parseCreateOfferForm(formData);
  const tytul = input.tytul;
  const opis = input.opis;
  const kategoria = input.kategoria;
  const typ = input.typ;
  const is_platform_service = false;

  const czas = input.czas;
  const cel_wspolpracy = input.cel_wspolpracy;
  const oczekiwany_rezultat = input.oczekiwany_rezultat;
  const kryteria_akceptacji = input.kryteria_akceptacji;
  const osoba_prowadzaca = input.osoba_prowadzaca;
  const wymagania = input.wymagania;
  const obligations = input.obligations;
  const benefits = input.benefits;
  const contract_type = input.contract_type;
  const tryb_pracy = input.tryb_pracy;
  const location = input.location;
  const is_remote = tryb_pracy === "remote" || formData.get("is_remote") === "on";
  const czas_realizacji_typ = input.czas_realizacji_typ;
  const czas_realizacji_dni_raw = input.czas_realizacji_dni_raw;
  const czas_realizacji_data_raw = input.czas_realizacji_data_raw;
  const planowany_start_raw = input.planowany_start_raw;
  const planowany_start = czas_realizacji_typ === "date" ? planowany_start_raw || null : null;
  const czas_realizacji_dni =
    czas_realizacji_typ === "days" ? parseNullableRealizationDays(czas_realizacji_dni_raw) : null;
  const czas_realizacji_data = czas_realizacji_typ === "date" ? czas_realizacji_data_raw || null : null;
  const wymagana_poufnosc = formData.get("wymagana_poufnosc") === "on";
  const przeniesienie_praw_autorskich = formData.get("przeniesienie_praw_autorskich") === "on";
  const portfolio_dozwolone = formData.get("portfolio_dozwolone") === "on";
  const materialy_legalnie_udostepnione = formData.get("materialy_legalnie_udostepnione") === "on";
  const commission_rate = resolveCommissionRate({
    sourceType: "application",
    offerType: typ,
    isPlatformService: is_platform_service,
  });
  const realization_mode_raw = input.realization_mode_raw;
  const realization_mode = typ === "micro" ? realization_mode_raw : "student_defined";
  const company_milestones =
    typ === "micro" && realization_mode === "company_defined"
      ? parseCompanyMilestones(formData.get("company_milestones"))
      : [];

  const stawka = parseNullableAmount(input.stawkaRaw, "budzet", MAX_MICRO_BUDGET);
  const salary_range_min = parseNullableAmount(input.salaryRangeMinRaw, "minimalne wynagrodzenie", MAX_SALARY_AMOUNT);
  const salary_range_max = parseNullableAmount(input.salaryRangeMaxRaw, "maksymalne wynagrodzenie", MAX_SALARY_AMOUNT);
  const technologies = input.technologies;

  if (!tytul || !opis) throw new Error("Uzupelnij tytul i opis.");
  if (!cel_wspolpracy || !oczekiwany_rezultat || !kryteria_akceptacji || !osoba_prowadzaca) {
    throw new Error(
      "Uzupelnij cel współpracy, oczekiwany rezultat, kryteria akceptacji i osobe prowadzaca.",
    );
  }

  if (!ALLOWED_OFFER_TYPES.has(typ)) throw new Error("Nieprawidlowy typ oferty.");
  if (!isAllowedJobCategory(kategoria)) throw new Error("Wybierz poprawna kategorie oferty.");
  if (contract_type && !ALLOWED_CONTRACT_TYPES.has(contract_type)) {
    throw new Error("Wybierz poprawny model współpracy.");
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
    throw new Error("Cel współpracy jest za dlugi (max 500 znakow).");
  }
  if (oczekiwany_rezultat && oczekiwany_rezultat.length > 500) {
    throw new Error("Oczekiwany rezultat jest za dlugi (max 500 znakow).");
  }
  if (kryteria_akceptacji && kryteria_akceptacji.length > 500) {
    throw new Error("Kryteria akceptacji są za dlugie (max 500 znakow).");
  }
  if (osoba_prowadzaca && osoba_prowadzaca.length > 120) {
    throw new Error("Osoba prowadzaca jest za dluga (max 120 znakow).");
  }
  if (wymagania && wymagania.length > 3000) throw new Error("Wymagania są za dlugie (max 3000 znakow).");
  if (benefits && benefits.length > 3000) throw new Error("Sekcja benefitow jest za dluga (max 3000 znakow).");
  if (obligations && obligations.length > 3000) {
    throw new Error("Sekcja materiałów i zasobow od firmy jest za dluga (max 3000 znakow).");
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
    throw new Error("Wybierz poprawny sposob ustalania etapów realizacji.");
  }
  if (typ === "micro" && (!Number.isFinite(stawka) || stawka == null || stawka <= 0)) {
    throw new Error("Podaj poprawny budzet mikrozlecenia.");
  }
  if (typ === "micro" && realization_mode === "company_defined" && company_milestones.length === 0) {
    throw new Error("Dodaj przynajmniej jeden etap realizacji ustalany przez firme.");
  }
  if (typ === "job") {
    if (salary_range_min != null && salary_range_min < 0) {
      throw new Error("Minimalne wynagrodzenie nie może byc ujemne.");
    }
    if (salary_range_max != null && salary_range_max < 0) {
      throw new Error("Maksymalne wynagrodzenie nie może byc ujemne.");
    }
    if (salary_range_min != null && salary_range_max != null && salary_range_max < salary_range_min) {
      throw new Error("Maksymalne wynagrodzenie nie może byc nizsze od minimalnego.");
    }
  }

  await validateOfferMaterials(obligations, user.id);

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

  if (error) {
    await logCriticalError({
      source: "company.jobs.create_offer",
      error,
      userId: user.id,
      context: {
        offerType: typ,
        category: kategoria,
        isPlatformService: is_platform_service,
        realizationMode: realization_mode,
      },
    });
    throw new Error("Nie udalo sie opublikowac oferty. Sprobuj ponownie lub skontaktuj sie z pomoca.");
  }

  redirect("/app/company/offers?created=1");
}
