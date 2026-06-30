"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";
import { UUID_RE } from "@/lib/security/validation";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;
type ProfileRole = "student" | "company" | "admin";
type PortfolioLink = {
  category?: string;
  image_url?: string;
  thumbnail_url?: string;
  url?: string;
  file_url?: string;
};

const CURRENT_YEAR = new Date().getFullYear();
const MAX_SKILLS = 20;
const MAX_PORTFOLIO_LINKS = 20;

const optionalText = (maxLength: number, message: string) =>
  z.string().trim().max(maxLength, message).transform((value) => value || null);

const requiredText = (maxLength: number, message: string) =>
  z.string().trim().min(1, "To pole jest wymagane.").max(maxLength, message);

const studentProfileSchema = z.object({
  kierunek: z.string().trim().max(160, "Kierunek jest zbyt dlugi.").optional(),
  rok: z.string().trim().optional(),
  sciezka: z.string().trim().max(120, "Sciezka jest zbyt dluga.").optional(),
  bio: optionalText(2000, "Bio jest za dlugie (max 2000 znakow)."),
  doswiadczenie: optionalText(3000, "Opis doswiadczenia jest za dlugi (max 3000 znakow)."),
  linkedinUrl: optionalText(300, "LinkedIn URL jest zbyt dlugi."),
  portfolioUrl: optionalText(300, "Portfolio URL jest zbyt dlugi."),
});

const companyProfileSchema = z.object({
  nazwa: requiredText(200, "Nazwa firmy jest zbyt dluga."),
  nip: optionalText(20, "NIP jest zbyt dlugi."),
  address: optionalText(250, "Adres jest zbyt dlugi."),
  city: optionalText(120, "Miasto jest zbyt dlugie."),
  branza: z.string().trim().max(120, "Branza jest zbyt dluga."),
  osoba_kontaktowa: z.string().trim().max(160, "Osoba kontaktowa jest zbyt dluga."),
  opis: optionalText(2000, "Opis firmy jest zbyt dlugi."),
  website: optionalText(300, "Adres strony jest zbyt dlugi."),
  linkedinUrl: optionalText(300, "LinkedIn URL jest zbyt dlugi."),
});

const taxDataSchema = z.object({
  taxResidencePl: z.boolean(),
  birthDate: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$|^$/, "Podaj prawidlowa date urodzenia.")
    .transform((value) => value || null),
  pesel: z
    .string()
    .trim()
    .regex(/^\d{11}$|^$/, "PESEL musi skladac sie z 11 cyfr.")
    .transform((value) => value || null),
});

const educationSchema = z.object({
  schoolName: requiredText(200, "Nazwa uczelni jest zbyt dluga."),
  fieldOfStudy: requiredText(200, "Kierunek jest zbyt dlugi."),
  degree: optionalText(120, "Stopien jest zbyt dlugi."),
  startYear: z.string().trim(),
  endYear: z.string().trim(),
  isCurrent: z.boolean(),
});

const uuidSchema = z.string().trim().regex(UUID_RE, "Nieprawidlowy identyfikator wpisu.");

function readFormString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function readOptionalFormString(formData: FormData, key: string) {
  return formData.has(key) ? readFormString(formData, key) : undefined;
}

async function requireUserRole(supabase: SupabaseServerClient, requiredRole: Exclude<ProfileRole, "admin">) {
  const { data } = await supabase.auth.getUser();
  const user = data.user;
  if (!user) redirect("/auth");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("user_id", user.id)
    .maybeSingle();

  if (profile?.role !== requiredRole) {
    throw new Error(requiredRole === "student"
      ? "Ta operacja jest dostepna tylko dla konta studenta."
      : "Ta operacja jest dostepna tylko dla konta firmowego.");
  }

  return user;
}

function parseNullableAcademicYear(value: string | undefined) {
  if (value === undefined || value.trim() === "") return null;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 8) {
    throw new Error("Rok studiow musi byc liczba od 1 do 8.");
  }
  return parsed;
}

function parseNullableCalendarYear(value: string, fieldName: string) {
  if (!value) return null;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1950 || parsed > CURRENT_YEAR + 10) {
    throw new Error(`${fieldName} musi byc prawidlowym rokiem.`);
  }
  return parsed;
}

function normalizeOptionalHttpsUrl(value: string | null) {
  if (!value) return null;

  const trimmed = value.trim();
  if (!trimmed) return null;
  if (/^http:\/\//i.test(trimmed)) {
    throw new Error("Adres URL musi uzywac HTTPS.");
  }

  const withProtocol = /^https:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    const url = new URL(withProtocol);
    if (!/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(url.hostname) || url.username || url.password) {
      throw new Error("Nieprawidlowy adres URL.");
    }
    return url.toString().replace(/\/$/, "");
  } catch {
    throw new Error("Podaj prawidlowy adres URL, np. https://example.com.");
  }
}

function parseSkills(formData: FormData) {
  const rawJson = readFormString(formData, "kompetencje_json").trim();
  const rawFallback = readFormString(formData, "kompetencje").trim();
  const rawValues = rawJson ? safeJsonParse(rawJson) : rawFallback.split(",");
  const values = Array.isArray(rawValues) ? rawValues : [];
  const seen = new Set<string>();

  return values
    .map((value) => String(value ?? "").trim().replace(/\s+/g, " "))
    .filter((value) => value.length > 0 && value.length <= 60)
    .filter((value) => {
      const key = value.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, MAX_SKILLS);
}

function safeJsonParse(value: string): unknown {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function textFromRecord(record: Record<string, unknown>, key: keyof PortfolioLink) {
  const value = record[key];
  return typeof value === "string" ? value.trim().slice(0, 300) : "";
}

function parsePortfolioLinks(formData: FormData) {
  const raw = readFormString(formData, "linki").trim();
  if (!raw) return [];

  const parsed = safeJsonParse(raw);
  if (!Array.isArray(parsed)) return [];

  return parsed
    .filter((item): item is Record<string, unknown> => Boolean(item && typeof item === "object" && !Array.isArray(item)))
    .map((item) => ({
      category: textFromRecord(item, "category"),
      image_url: normalizeOptionalHttpsUrl(textFromRecord(item, "image_url")) ?? undefined,
      thumbnail_url: normalizeOptionalHttpsUrl(textFromRecord(item, "thumbnail_url")) ?? undefined,
      url: normalizeOptionalHttpsUrl(textFromRecord(item, "url")) ?? undefined,
      file_url: normalizeOptionalHttpsUrl(textFromRecord(item, "file_url")) ?? undefined,
    }))
    .filter((item) => item.url || item.image_url || item.thumbnail_url || item.file_url)
    .slice(0, MAX_PORTFOLIO_LINKS);
}

function isValidPesel(value: string | null) {
  if (!value) return true;
  const weights = [1, 3, 7, 9, 1, 3, 7, 9, 1, 3];
  const digits = value.split("").map((digit) => Number(digit));
  const checksum = weights.reduce((sum, weight, index) => sum + weight * digits[index], 0);
  return (10 - (checksum % 10)) % 10 === digits[10];
}

function isValidNip(value: string | null) {
  if (!value) return true;
  if (!/^\d{10}$/.test(value)) return false;
  const weights = [6, 5, 7, 2, 3, 4, 5, 6, 7];
  const digits = value.split("").map((digit) => Number(digit));
  const checksum = weights.reduce((sum, weight, index) => sum + weight * digits[index], 0) % 11;
  return checksum !== 10 && checksum === digits[9];
}

export async function saveStudentProfile(formData: FormData) {
  const supabase = await createClient();
  const user = await requireUserRole(supabase, "student");

  const parsed = studentProfileSchema.safeParse({
    kierunek: readOptionalFormString(formData, "kierunek"),
    rok: readOptionalFormString(formData, "rok"),
    sciezka: readOptionalFormString(formData, "sciezka"),
    bio: readFormString(formData, "bio"),
    doswiadczenie: readFormString(formData, "doswiadczenie"),
    linkedinUrl: readFormString(formData, "linkedin_url"),
    portfolioUrl: readFormString(formData, "portfolio_url"),
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Nieprawidlowe dane profilu.");
  }

  const update: Record<string, unknown> = {
    user_id: user.id,
    bio: parsed.data.bio,
    doswiadczenie: parsed.data.doswiadczenie,
    linkedin_url: normalizeOptionalHttpsUrl(parsed.data.linkedinUrl),
    portfolio_url: normalizeOptionalHttpsUrl(parsed.data.portfolioUrl),
  };

  if (formData.has("kierunek")) update.kierunek = parsed.data.kierunek ?? "";
  if (formData.has("rok")) update.rok = parseNullableAcademicYear(parsed.data.rok);
  if (formData.has("sciezka")) update.sciezka = parsed.data.sciezka ?? "";
  if (formData.has("kompetencje_json") || formData.has("kompetencje")) {
    update.kompetencje = parseSkills(formData);
  }
  if (formData.has("linki")) {
    update.linki = parsePortfolioLinks(formData);
  }

  const { error } = await supabase.from("student_profiles").upsert(update);
  if (error) throw new Error("Nie udalo sie zapisac profilu studenta.");

  revalidatePath("/app/profile");
  redirect("/app/profile?saved=student");
}

export async function saveCompanyProfile(formData: FormData) {
  const supabase = await createClient();
  const user = await requireUserRole(supabase, "company");

  const parsed = companyProfileSchema.safeParse({
    nazwa: readFormString(formData, "nazwa"),
    nip: readFormString(formData, "nip"),
    address: readFormString(formData, "address"),
    city: readFormString(formData, "city"),
    branza: readFormString(formData, "branza"),
    osoba_kontaktowa: readFormString(formData, "osoba_kontaktowa"),
    opis: readFormString(formData, "opis"),
    website: readFormString(formData, "website"),
    linkedinUrl: readFormString(formData, "linkedin_url"),
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Nieprawidlowe dane firmy.");
  }

  const nip = parsed.data.nip?.replace(/\D/g, "") || null;
  if (!isValidNip(nip)) {
    throw new Error("Podaj prawidlowy NIP.");
  }

  const { error } = await supabase.from("company_profiles").upsert({
    user_id: user.id,
    nazwa: parsed.data.nazwa,
    nip,
    address: parsed.data.address,
    city: parsed.data.city,
    branza: parsed.data.branza,
    osoba_kontaktowa: parsed.data.osoba_kontaktowa,
    opis: parsed.data.opis,
    website: normalizeOptionalHttpsUrl(parsed.data.website),
    linkedin_url: normalizeOptionalHttpsUrl(parsed.data.linkedinUrl),
  });

  if (error) throw new Error("Nie udalo sie zapisac profilu firmy.");

  revalidatePath("/app/profile");
  redirect("/app/profile?saved=company");
}

export async function saveStudentTaxData(formData: FormData) {
  const supabase = await createClient();
  const user = await requireUserRole(supabase, "student");

  const parsed = taxDataSchema.safeParse({
    taxResidencePl: readFormString(formData, "tax_residence_pl") === "true",
    birthDate: readFormString(formData, "birth_date"),
    pesel: readFormString(formData, "pesel").replace(/\D/g, ""),
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Nieprawidlowe dane podatkowe.");
  }

  if (!isValidPesel(parsed.data.pesel)) {
    throw new Error("Podaj prawidlowy PESEL.");
  }

  const { error } = await supabase
    .from("student_profiles")
    .update({
      tax_residence_pl: parsed.data.taxResidencePl,
      birth_date: parsed.data.birthDate,
      pesel: parsed.data.pesel,
    })
    .eq("user_id", user.id);

  if (error) throw new Error("Nie udalo sie zapisac danych podatkowych.");

  revalidatePath("/app/profile");
}

export async function addEducationEntry(formData: FormData) {
  const supabase = await createClient();
  const user = await requireUserRole(supabase, "student");

  const parsed = educationSchema.safeParse({
    schoolName: readFormString(formData, "school_name"),
    fieldOfStudy: readFormString(formData, "field_of_study"),
    degree: readFormString(formData, "degree"),
    startYear: readFormString(formData, "start_year"),
    endYear: readFormString(formData, "end_year"),
    isCurrent: formData.get("is_current") === "on",
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Nieprawidlowe dane edukacji.");
  }

  const startYear = parseNullableCalendarYear(parsed.data.startYear, "Rok rozpoczecia");
  const endYear = parsed.data.isCurrent
    ? null
    : parseNullableCalendarYear(parsed.data.endYear, "Rok zakonczenia");

  if (startYear && endYear && endYear < startYear) {
    throw new Error("Rok zakonczenia nie moze byc wczesniejszy niz rok rozpoczecia.");
  }

  const { error } = await supabase.from("education_entries").insert({
    student_id: user.id,
    school_name: parsed.data.schoolName,
    field_of_study: parsed.data.fieldOfStudy,
    degree: parsed.data.degree,
    start_year: startYear,
    end_year: endYear,
    is_current: parsed.data.isCurrent,
  });

  if (error) throw new Error("Nie udalo sie dodac edukacji.");
  revalidatePath("/app/profile");
}

export async function deleteEducationEntry(entryId: string) {
  const parsed = uuidSchema.safeParse(entryId);
  if (!parsed.success) {
    throw new Error("Nieprawidlowy identyfikator wpisu.");
  }

  const supabase = await createClient();
  const user = await requireUserRole(supabase, "student");

  const { error } = await supabase
    .from("education_entries")
    .delete()
    .eq("id", parsed.data)
    .eq("student_id", user.id);

  if (error) throw new Error("Nie udalo sie usunac edukacji.");
  revalidatePath("/app/profile");
}
