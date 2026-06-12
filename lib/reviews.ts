export const REVIEW_CATEGORIES = [
  {
    key: "timeliness",
    label: "Terminowosc",
    description: "Czy zadanie bylo realizowane zgodnie z ustalonym czasem.",
  },
  {
    key: "communication",
    label: "Komunikatywnosc",
    description: "Jak sprawnie przebiegaly odpowiedzi i ustalenia.",
  },
  {
    key: "professionalism",
    label: "Profesjonalizm",
    description: "Jakosc wspolpracy, podejscie i kultura pracy.",
  },
  {
    key: "project_documentation",
    label: "Dokumentacja projektowa",
    description: "Czy przekazane materialy i opis rozwiazania byly czytelne.",
  },
  {
    key: "decision_making",
    label: "Samodzielnosc decyzyjna",
    description: "Jak dobrze wykonawca podejmowal trafne decyzje w toku pracy.",
  },
] as const;

export type ReviewCategoryKey = (typeof REVIEW_CATEGORIES)[number]["key"];

export type ReviewCategoryRatings = Partial<Record<ReviewCategoryKey, number | null>>;

export type DetailedReviewInput = {
  comment: string;
  categories: ReviewCategoryRatings;
};

export type ParsedDetailedReview = {
  displayComment: string | null;
  categories: ReviewCategoryRatings;
  hasStructuredData: boolean;
};

const REVIEW_META_PREFIX = "<!--student2work-review:";
const REVIEW_META_SUFFIX = "-->";

function clampRating(value: unknown): number | null {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return null;
  const rounded = Math.trunc(numeric);
  if (rounded < 1 || rounded > 5) return null;
  return rounded;
}

export function normalizeReviewCategoryRatings(input: ReviewCategoryRatings): ReviewCategoryRatings {
  const normalized: ReviewCategoryRatings = {};

  for (const category of REVIEW_CATEGORIES) {
    normalized[category.key] = clampRating(input[category.key]);
  }

  return normalized;
}

export function calculateOverallReviewRating(categories: ReviewCategoryRatings): number {
  const enabledRatings = REVIEW_CATEGORIES
    .map((category) => clampRating(categories[category.key]))
    .filter((value): value is number => value !== null);

  if (enabledRatings.length === 0) {
    return 5;
  }

  const average = enabledRatings.reduce((sum, value) => sum + value, 0) / enabledRatings.length;
  return Math.max(1, Math.min(5, Math.round(average)));
}

export function serializeDetailedReviewComment(input: DetailedReviewInput): string {
  const normalizedCategories = normalizeReviewCategoryRatings(input.categories);
  const meta = encodeURIComponent(JSON.stringify({ v: 1, categories: normalizedCategories }));
  const comment = String(input.comment ?? "").trim();
  return `${REVIEW_META_PREFIX}${meta}${REVIEW_META_SUFFIX}${comment}`;
}

export function parseDetailedReviewComment(rawComment: string | null | undefined): ParsedDetailedReview {
  if (!rawComment) {
    return {
      displayComment: null,
      categories: {},
      hasStructuredData: false,
    };
  }

  const text = String(rawComment);
  const prefixPattern = /^<!--student2work-review:(.*?)-->([\s\S]*)$/;
  const match = text.match(prefixPattern);

  if (!match) {
    return {
      displayComment: text.trim() || null,
      categories: {},
      hasStructuredData: false,
    };
  }

  try {
    const parsed = JSON.parse(decodeURIComponent(match[1])) as {
      categories?: ReviewCategoryRatings;
    };

    return {
      displayComment: match[2].trim() || null,
      categories: normalizeReviewCategoryRatings(parsed.categories ?? {}),
      hasStructuredData: true,
    };
  } catch {
    return {
      displayComment: text.trim() || null,
      categories: {},
      hasStructuredData: false,
    };
  }
}
