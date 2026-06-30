"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { resolveCommissionRate } from "@/lib/commission";
import { isAllowedJobCategory, resolveJobCategoryLabel } from "@/lib/constants";
import { logCriticalError } from "@/lib/observability/error-log";
import { createClient } from "@/lib/supabase/server";

type BudgetRange = "lt_500" | "500_1500" | "1500_3000" | "estimate";

type CreateChallengeResult =
  | { success: true; redirectUrl: string }
  | { success: false; error: string };

const budgetMeta: Record<
  BudgetRange,
  {
    label: string;
    min: number | null;
    max: number | null;
  }
> = {
  lt_500: { label: "Do 500 PLN", min: null, max: 500 },
  "500_1500": { label: "500-1500 PLN", min: 500, max: 1500 },
  "1500_3000": { label: "1500-3000 PLN", min: 1500, max: 3000 },
  estimate: { label: "Chce darmowa estymacje", min: null, max: null },
};

const optionalTrimmedString = (maxLength: number) =>
  z.preprocess(
    (value) => {
      if (typeof value !== "string") return undefined;
      const trimmed = value.trim();
      return trimmed.length > 0 ? trimmed : undefined;
    },
    z.string().max(maxLength).optional(),
  );

const challengeSchema = z.object({
  problem: z
    .string()
    .trim()
    .min(20, "Opisz problem szerzej - minimum 20 znakow.")
    .max(5000, "Opis problemu jest za dlugi (max 5000 znakow)."),
  problemLocation: optionalTrimmedString(600),
  budgetRange: z.enum(["lt_500", "500_1500", "1500_3000", "estimate"], {
    error: "Wybierz orientacyjny budzet.",
  }),
  category: z
    .string()
    .trim()
    .min(1, "Wybierz kategorie wyzwania.")
    .transform((value) => resolveJobCategoryLabel(value) ?? value)
    .refine((value) => isAllowedJobCategory(value), "Wybierz poprawna kategorie wyzwania."),
  contactPerson: z
    .string()
    .trim()
    .min(2, "Podaj osobe kontaktowa po stronie firmy.")
    .max(120, "Osoba kontaktowa jest za dluga (max 120 znakow)."),
  extraContext: optionalTrimmedString(1200),
});

function getFormString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function buildChallengeTitle(problem: string) {
  const singleLine = problem.replace(/\s+/g, " ").trim();
  const shortProblem = singleLine.length > 76 ? `${singleLine.slice(0, 73)}...` : singleLine;
  return `Wyzwanie: ${shortProblem}`;
}

function buildChallengeDescription(input: z.infer<typeof challengeSchema>, budgetLabel: string) {
  const lines = [
    "## Problem do wyceny",
    input.problem,
    "",
    "## Gdzie lezy problem",
    input.problemLocation ?? "Nie podano linku ani miejsca problemu.",
    "",
    "## Orientacyjny budzet",
    budgetLabel,
    "",
    "## Kategoria",
    input.category,
  ];

  if (input.extraContext) {
    lines.push("", "## Dodatkowy kontekst", input.extraContext);
  }

  lines.push(
    "",
    "## Czego oczekujemy od studenta",
    "- szybki research problemu",
    "- propozycja rozwiazania",
    "- orientacyjna wycena i termin",
  );

  return lines.join("\n");
}

export async function createChallengeOffer(formData: FormData): Promise<CreateChallengeResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Zaloguj sie jako firma, aby opublikowac wyzwanie." };
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("user_id", user.id)
    .maybeSingle();

  if (profileError || profile?.role !== "company") {
    return { success: false, error: "Tylko konto firmowe moze publikowac wyzwania." };
  }

  const parsed = challengeSchema.safeParse({
    problem: getFormString(formData, "problem"),
    problemLocation: getFormString(formData, "problemLocation"),
    budgetRange: getFormString(formData, "budgetRange"),
    category: getFormString(formData, "category"),
    contactPerson: getFormString(formData, "contactPerson"),
    extraContext: getFormString(formData, "extraContext"),
  });

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Uzupelnij formularz wyzwania.",
    };
  }

  const budget = budgetMeta[parsed.data.budgetRange];
  const now = new Date().toISOString();
  const title = buildChallengeTitle(parsed.data.problem);
  const description = buildChallengeDescription(parsed.data, budget.label);
  const budgetSummary =
    budget.min != null && budget.max != null
      ? `${budget.min}-${budget.max} PLN`
      : budget.max != null
        ? `Do ${budget.max} PLN`
        : "Do wyceny przez studentow";

  const { data: inserted, error } = await supabase
    .from("offers")
    .insert({
      company_id: user.id,
      tytul: title,
      opis: description,
      kategoria: parsed.data.category,
      typ: "challenge",
      status: "published",
      stawka: null,
      salary_range_min: budget.min,
      salary_range_max: budget.max,
      cel_wspolpracy: parsed.data.problem,
      oczekiwany_rezultat: "Kontroferta / pitch studenta z szybkim researchem, zakresem, wycena i terminem.",
      kryteria_akceptacji: "Firma wybiera propozycje po ocenie pitcha, zakresu, ceny i terminu.",
      osoba_prowadzaca: parsed.data.contactPerson,
      obligations: parsed.data.problemLocation
        ? `Miejsce problemu: ${parsed.data.problemLocation}\nBudzet orientacyjny: ${budget.label}`
        : `Budzet orientacyjny: ${budget.label}`,
      wymagania: "W odpowiedzi przygotuj krotki pitch, proponowane rozwiazanie, wycene i przewidywany termin.",
      benefits: parsed.data.extraContext ?? null,
      czas: "Do ustalenia w kontrofertach",
      tryb_pracy: "remote",
      is_remote: true,
      realization_mode: "student_defined",
      is_platform_service: false,
      is_private: false,
      commission_rate: resolveCommissionRate({
        sourceType: "application",
        offerType: "micro",
        isPlatformService: false,
      }),
      technologies: ["Wyzwanie", "Research", "Pitch"],
      przeniesienie_praw_autorskich: true,
      portfolio_dozwolone: true,
      materialy_legalnie_udostepnione: false,
      wymagana_poufnosc: false,
      created_at: now,
    })
    .select("id")
    .single();

  if (error || !inserted?.id) {
    await logCriticalError({
      source: "company.challenges.create_offer",
      error,
      message: error ? undefined : "Supabase insert returned no challenge offer id.",
      userId: user.id,
      context: {
        budgetRange: parsed.data.budgetRange,
        budgetLabel: budget.label,
      },
    });

    return {
      success: false,
      error: "Nie udalo sie zapisac wyzwania. Sprobuj ponownie lub skontaktuj sie z pomoca.",
    };
  }

  revalidatePath("/app/jobs");
  revalidatePath("/app/company/offers");

  return { success: true, redirectUrl: `/app/company/offers?created=challenge&budget=${encodeURIComponent(budgetSummary)}` };
}
