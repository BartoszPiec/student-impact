import type { ServiceOrderFormAnswer } from "@/lib/services/service-order-snapshots";

export const PACKAGE_BRIEF_SEPARATOR = "--- SZCZEGOLY ZAMOWIENIA ---";

const LEGACY_BRIEF_SEPARATORS = [
  PACKAGE_BRIEF_SEPARATOR,
  "--- SZCZEGÓŁY ZAMÓWIENIA ---",
  "--- SZCZEGĂ“ĹY ZAMĂ“WIENIA ---",
];

const RESERVED_DETAIL_LABELS = new Set([
  "Wybrany wariant",
  "Cena wariantu",
  "Termin wariantu",
  "Zakres wariantu",
  "Preferowany termin",
  "Dodatkowe uwagi",
]);

export type PackageFormField = {
  id: string;
  label: string;
  type: "text" | "select" | "textarea" | "radio" | "file";
  inputType?: "text" | "url" | "email";
  section?: string | null;
  required?: boolean;
  options?: Array<{
    value: string;
    label: string;
  }>;
  multiline?: boolean;
  placeholder?: string | null;
  hint?: string | null;
  maxLength?: number | null;
  accept?: string | null;
  showIf?: {
    field: string;
    value: string[];
  } | null;
};

export type PackageVariantMilestone = {
  idx: number;
  title: string;
  acceptance_criteria: string;
  due_days: number | null;
};

export type PackageVariant = {
  name: string;
  label: string;
  price: number;
  commission_rate?: number | null;
  delivery_time_days?: number | null;
  scope?: string | null;
  description?: string | null;
  is_recommended?: boolean;
  includes?: string[];
  excludes?: string[];
  milestones?: PackageVariantMilestone[];
};

const LOGO_PACKAGE_ID = "5de0e9f6-3768-4732-987b-5c0073591646";

const LOGO_FALLBACK_VARIANTS: PackageVariant[] = [
  {
    name: "basic",
    label: "Basic",
    price: 350,
    delivery_time_days: 7,
    description: "Startowy pakiet logo dla mikrofirm i freelancerow.",
    is_recommended: false,
    includes: [
      "2 koncepcje logo",
      "1 runda poprawek",
      "Pliki PNG + SVG",
      "Pelne przeniesienie praw autorskich",
    ],
    excludes: [
      "Dodatkowa 3 koncepcja",
      "Rozszerzona mini-ksiega znaku",
    ],
    milestones: [
      { idx: 1, title: "Brief zatwierdzony", acceptance_criteria: "Brief jest kompletny", due_days: 1 },
      { idx: 2, title: "Koncepcje dostarczone", acceptance_criteria: "Firma wybiera 1 z 2 koncepcji", due_days: 4 },
      { idx: 3, title: "Finalizacja", acceptance_criteria: "Finalny projekt po poprawkach", due_days: 7 },
    ],
  },
  {
    name: "standard",
    label: "Standard",
    price: 650,
    delivery_time_days: 10,
    description: "Rekomendowany pakiet logo z szerszym zakresem plikow i poprawek.",
    is_recommended: true,
    includes: [
      "3 koncepcje logo",
      "2 rundy poprawek",
      "Pliki PNG + SVG + PDF CMYK + AI/EPS",
      "Mini-ksiega znaku",
      "Pelne przeniesienie praw autorskich",
    ],
    excludes: [],
    milestones: [
      { idx: 1, title: "Brief zatwierdzony", acceptance_criteria: "Brief jest kompletny", due_days: 1 },
      { idx: 2, title: "Koncepcje dostarczone", acceptance_criteria: "Firma wybiera 1 z 3 koncepcji", due_days: 5 },
      { idx: 3, title: "Runda poprawek", acceptance_criteria: "Pierwsza iteracja zmian", due_days: 7 },
      { idx: 4, title: "Finalizacja", acceptance_criteria: "Dostarczenie finalnych plikow", due_days: 10 },
    ],
  },
];

type PackageCustomizationSource = {
  type?: string | null;
  is_system?: boolean | null;
  student_id?: string | null;
} | null | undefined;

export type ParsedPackageBrief = {
  baseDescription: string;
  detailBlock: string;
  answersByLabel: Record<string, string>;
  notes: string;
  deadline: string;
  variantName: string;
};

function toNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function toStringValue(value: unknown) {
  return typeof value === "string" ? value : "";
}

function toStringArray(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter((item) => item.length > 0);
}

function toFieldOptions(value: unknown) {
  if (!Array.isArray(value)) return [];

  return value
    .map((item) => {
      if (typeof item === "string" && item.trim().length > 0) {
        return { value: item.trim(), label: item.trim() };
      }

      if (item && typeof item === "object") {
        const option = item as Record<string, unknown>;
        const optionValue =
          typeof option.value === "string" && option.value.trim().length > 0
            ? option.value.trim()
            : typeof option.label === "string" && option.label.trim().length > 0
              ? option.label.trim()
              : "";
        const optionLabel =
          typeof option.label === "string" && option.label.trim().length > 0
            ? option.label.trim()
            : optionValue;

        if (optionValue.length > 0) {
          return { value: optionValue, label: optionLabel };
        }
      }

      return null;
    })
    .filter((option): option is { value: string; label: string } => Boolean(option));
}

function toShowIf(value: unknown) {
  if (!value || typeof value !== "object") return null;

  const raw = value as Record<string, unknown>;
  if (typeof raw.field !== "string" || raw.field.trim().length === 0) return null;

  const values = Array.isArray(raw.value)
    ? raw.value
        .map((item) => (typeof item === "string" ? item.trim() : ""))
        .filter((item) => item.length > 0)
    : typeof raw.value === "string" && raw.value.trim().length > 0
      ? [raw.value.trim()]
      : [];

  if (values.length === 0) return null;

  return {
    field: raw.field.trim(),
    value: values,
  };
}

function normalizeFormField(
  field: Record<string, unknown>,
  sectionTitle: string | null,
): PackageFormField | null {
  const rawType = typeof field.type === "string" ? field.type : "text";
  const inputType: "text" | "url" | "email" =
    rawType === "url" ? "url" : rawType === "email" ? "email" : "text";

  const type =
    rawType === "radio"
      ? "radio"
      : rawType === "file"
        ? "file"
        : rawType === "select"
          ? "select"
          : rawType === "textarea" || field.multiline === true
            ? "textarea"
            : "text";

  const options = toFieldOptions(field.options);
  const maxLength = toNumber(field.max_length);

  const normalized = {
    id: typeof field.id === "string" ? field.id : "",
    label: typeof field.label === "string" ? field.label : "",
    type,
    inputType,
    section: typeof field.section === "string" ? field.section : sectionTitle,
    required: typeof field.required === "boolean" ? field.required : false,
    options: options.length > 0 ? options : undefined,
    multiline: Boolean(field.multiline),
    placeholder: typeof field.placeholder === "string" ? field.placeholder : null,
    hint: typeof field.hint === "string" ? field.hint : null,
    maxLength,
    accept: typeof field.accept === "string" ? field.accept : null,
    showIf: toShowIf(field.show_if),
  } satisfies PackageFormField;

  if (normalized.id.length === 0 || normalized.label.length === 0) return null;
  return normalized;
}

function normalizeMilestones(value: unknown): PackageVariantMilestone[] {
  if (!Array.isArray(value)) return [];

  return value
    .filter((item): item is Record<string, unknown> => Boolean(item && typeof item === "object"))
    .map((item) => ({
      idx: toNumber(item.idx) ?? 0,
      title: toStringValue(item.title).trim(),
      acceptance_criteria: toStringValue(item.acceptance_criteria).trim(),
      due_days: toNumber(item.due_days),
    }))
    .filter((item) => item.title.length > 0)
    .sort((a, b) => a.idx - b.idx);
}

function resolveRawVariants(value: unknown): Array<Record<string, unknown>> {
  if (Array.isArray(value)) {
    return value.filter((variant): variant is Record<string, unknown> => Boolean(variant && typeof variant === "object"));
  }

  if (value && typeof value === "object") {
    const candidate = value as Record<string, unknown>;
    if (Array.isArray(candidate.packages)) {
      return candidate.packages.filter(
        (variant): variant is Record<string, unknown> => Boolean(variant && typeof variant === "object"),
      );
    }
  }

  return [];
}

export function normalizePackageFormSchema(value: unknown): PackageFormField[] {
  if (Array.isArray(value)) {
    return value
      .filter((field): field is Record<string, unknown> => Boolean(field && typeof field === "object"))
      .map((field) => normalizeFormField(field, null))
      .filter((field): field is PackageFormField => Boolean(field));
  }

  if (value && typeof value === "object") {
    const objectSchema = value as Record<string, unknown>;
    if (Array.isArray(objectSchema.sections)) {
      return objectSchema.sections
        .filter((section): section is Record<string, unknown> => Boolean(section && typeof section === "object"))
        .flatMap((section) => {
          const sectionTitle = typeof section.title === "string" ? section.title : null;
          const fields = Array.isArray(section.fields) ? section.fields : [];

          return fields
            .filter((field): field is Record<string, unknown> => Boolean(field && typeof field === "object"))
            .map((field) => normalizeFormField(field, sectionTitle))
            .filter((field): field is PackageFormField => Boolean(field));
        });
    }
  }

  return [];
}

export function groupPackageFormSchemaBySection(fields: PackageFormField[]) {
  const grouped = new Map<string, PackageFormField[]>();
  const order: string[] = [];

  fields.forEach((field) => {
    const sectionTitle = field.section?.trim() || "Dodatkowe informacje";
    if (!grouped.has(sectionTitle)) {
      grouped.set(sectionTitle, []);
      order.push(sectionTitle);
    }
    grouped.get(sectionTitle)!.push(field);
  });

  return order.map((title) => ({
    title,
    questions: grouped.get(title) || [],
  }));
}

export function normalizePackageVariants(value: unknown): PackageVariant[] {
  const rawVariants = resolveRawVariants(value);
  if (rawVariants.length === 0) return [];

  return rawVariants
    .map((variant) => {
      const price = toNumber(variant.price);
      const variantName =
        typeof variant.name === "string"
          ? variant.name
          : typeof variant.id === "string"
            ? variant.id
            : "";
      const variantLabel =
        typeof variant.label === "string"
          ? variant.label
          : typeof variant.name === "string"
            ? variant.name
            : variantName;

      return {
        name: variantName,
        label: variantLabel,
        price: price ?? 0,
        commission_rate: toNumber(variant.commission_rate),
        delivery_time_days: toNumber(variant.delivery_time_days),
        scope:
          typeof variant.scope === "string"
            ? variant.scope
            : typeof variant.description === "string"
              ? variant.description
              : null,
        description: typeof variant.description === "string" ? variant.description : null,
        is_recommended: Boolean(variant.is_recommended),
        includes: toStringArray(variant.includes),
        excludes: toStringArray(variant.excludes),
        milestones: normalizeMilestones(variant.milestones),
      } satisfies PackageVariant;
    })
    .filter((variant) => variant.name.length > 0 && variant.label.length > 0 && variant.price > 0);
}

export function resolvePackageVariantsWithFallback(packageId: string, value: unknown): PackageVariant[] {
  const normalized = normalizePackageVariants(value);
  if (packageId === LOGO_PACKAGE_ID) {
    const hasBasic = normalized.some((variant) => variant.name.toLowerCase() === "basic");
    const hasStandard = normalized.some((variant) => variant.name.toLowerCase() === "standard");

    if (normalized.length >= 2 && hasBasic && hasStandard) {
      return normalized;
    }

    return LOGO_FALLBACK_VARIANTS.map((variant) => ({
      ...variant,
      includes: [...(variant.includes || [])],
      excludes: [...(variant.excludes || [])],
      milestones: (variant.milestones || []).map((milestone) => ({ ...milestone })),
    }));
  }

  return normalized;
}

export function isSystemServicePackage(pkg: PackageCustomizationSource) {
  if (!pkg) return false;
  return pkg.type === "platform_service" || pkg.is_system === true || !pkg.student_id;
}

export function resolveSelectedPackageVariant(
  variants: PackageVariant[],
  requestedName?: string | null,
) {
  if (!variants.length) return null;

  if (requestedName) {
    const exactMatch = variants.find((variant) => variant.name.toLowerCase() === requestedName.toLowerCase());
    if (exactMatch) return exactMatch;
  }

  const recommended = variants.find((variant) => variant.is_recommended);
  if (recommended) return recommended;

  return variants.length === 3 ? variants[1] : variants[0];
}

export function splitPackageBriefDescription(description: string | null | undefined) {
  const safeDescription = description ?? "";

  for (const separator of LEGACY_BRIEF_SEPARATORS) {
    if (safeDescription.includes(separator)) {
      const [baseDescription, ...rest] = safeDescription.split(separator);
      return {
        baseDescription: baseDescription.trim(),
        detailBlock: rest.join(separator).trim(),
      };
    }
  }

  return {
    baseDescription: safeDescription.trim(),
    detailBlock: "",
  };
}

export function buildPackageBriefDescription(params: {
  baseDescription: string | null | undefined;
  formAnswers: ServiceOrderFormAnswer[];
  notes?: string | null;
  deadline?: string | null;
  variant?: PackageVariant | null;
}) {
  const lines: string[] = [params.baseDescription?.trim() || "", "", PACKAGE_BRIEF_SEPARATOR];

  if (params.variant) {
    lines.push(
      "",
      `Wybrany wariant: ${params.variant.label} (${params.variant.name})`,
      `Cena wariantu: ${params.variant.price} PLN`,
    );

    if (params.variant.delivery_time_days) {
      lines.push(`Termin wariantu: ${params.variant.delivery_time_days} dni`);
    }

    if (params.variant.scope) {
      lines.push(`Zakres wariantu: ${params.variant.scope}`);
    }
  }

  const compactAnswers = params.formAnswers
    .map((answer) => ({
      ...answer,
      value: answer.value.trim(),
    }))
    .filter((answer) => answer.value.length > 0);

  if (compactAnswers.length > 0) {
    lines.push("");
    compactAnswers.forEach((answer) => {
      const answerLines = answer.value.split(/\r?\n/);
      const [firstLine = "", ...restLines] = answerLines;
      lines.push(`${answer.label}: ${firstLine}`);
      restLines.forEach((line) => {
        lines.push(`  ${line}`);
      });
    });
  }

  if (params.deadline?.trim()) {
    lines.push("", `Preferowany termin: ${params.deadline.trim()}`);
  }

  if (params.notes?.trim()) {
    lines.push("", "Dodatkowe uwagi:", params.notes.trim());
  }

  return lines.join("\n").trim();
}

export function parsePackageBriefDescription(description: string | null | undefined): ParsedPackageBrief {
  const { baseDescription, detailBlock } = splitPackageBriefDescription(description);
  const answersByLabel: Record<string, string> = {};
  const lines = detailBlock.split(/\r?\n/);
  const noteLines: string[] = [];
  let readingNotes = false;
  let deadline = "";
  let variantName = "";
  let currentAnswerLabel = "";

  lines.forEach((rawLine) => {
    const line = rawLine.trim();
    if (!line) {
      if (readingNotes && noteLines.length > 0) {
        noteLines.push("");
      } else if (currentAnswerLabel && answersByLabel[currentAnswerLabel]) {
        answersByLabel[currentAnswerLabel] += "\n";
      }
      return;
    }

    if (currentAnswerLabel && /^\s+/.test(rawLine)) {
      answersByLabel[currentAnswerLabel] = `${answersByLabel[currentAnswerLabel]}\n${line}`.trim();
      return;
    }

    currentAnswerLabel = "";

    if (readingNotes) {
      noteLines.push(line);
      return;
    }

    if (/^Dodatkowe uwagi:/i.test(line)) {
      readingNotes = true;
      return;
    }

    const firstSeparator = line.indexOf(":");
    if (firstSeparator === -1) return;

    const label = line.slice(0, firstSeparator).trim();
    const value = line.slice(firstSeparator + 1).trim();

    if (!label || !value) return;

    if (label === "Preferowany termin") {
      deadline = value;
      return;
    }

    if (label === "Wybrany wariant") {
      const nameMatch = value.match(/\(([^)]+)\)\s*$/);
      variantName = nameMatch?.[1]?.trim() || value.trim();
      return;
    }

    if (RESERVED_DETAIL_LABELS.has(label)) {
      return;
    }

    answersByLabel[label] = value;
    currentAnswerLabel = label;
  });

  return {
    baseDescription,
    detailBlock,
    answersByLabel,
    notes: noteLines.join("\n").trim(),
    deadline,
    variantName,
  };
}
