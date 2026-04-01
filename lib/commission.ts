type CommissionSourceType = "application" | "service_order";

type ResolveCommissionRateOptions = {
  explicitRate?: number | null;
  sourceType?: CommissionSourceType;
  offerType?: string | null;
  isPlatformService?: boolean | null;
};

export const DEFAULT_JOB_COMMISSION_RATE = 0.1;
export const DEFAULT_MICRO_COMMISSION_RATE = 0.15;
export const DEFAULT_PLATFORM_SERVICE_COMMISSION_RATE = 0.2;
export const ALLOWED_COMMISSION_RATE_OPTIONS = [0.1, 0.15, 0.2] as const;

export function isAllowedCommissionRate(rate: number | null | undefined): boolean {
  return rate == null || ALLOWED_COMMISSION_RATE_OPTIONS.includes(rate as (typeof ALLOWED_COMMISSION_RATE_OPTIONS)[number]);
}

export function formatCommissionRateLabel(rate: number | null | undefined): string {
  if (rate == null) {
    return "Auto";
  }

  return `${Math.round(rate * 100)}%`;
}

export function normalizeCommissionRate(rate: number | null | undefined): number | null {
  if (rate == null || !Number.isFinite(rate)) {
    return null;
  }

  const normalized = rate > 1 && rate <= 100 ? rate / 100 : rate;
  if (!Number.isFinite(normalized) || normalized < 0 || normalized > 1) {
    return null;
  }

  return Number(normalized.toFixed(4));
}

export function parseCommissionRateInput(
  value: FormDataEntryValue | string | number | null | undefined,
): number | null {
  if (value == null) {
    return null;
  }

  if (typeof value === "number") {
    return normalizeCommissionRate(value);
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) {
      return null;
    }

    return normalizeCommissionRate(Number(trimmed.replace(",", ".")));
  }

  return null;
}

export function resolveDefaultCommissionRate({
  sourceType = "application",
  offerType,
  isPlatformService,
}: Omit<ResolveCommissionRateOptions, "explicitRate"> = {}): number {
  if (isPlatformService === true) {
    return DEFAULT_PLATFORM_SERVICE_COMMISSION_RATE;
  }

  if (sourceType === "service_order") {
    return DEFAULT_MICRO_COMMISSION_RATE;
  }

  const normalizedOfferType = offerType?.toLowerCase() ?? "";
  if (normalizedOfferType.includes("micro") || normalizedOfferType.includes("mikro")) {
    return DEFAULT_MICRO_COMMISSION_RATE;
  }

  return DEFAULT_JOB_COMMISSION_RATE;
}

export function resolveCommissionRate(options: ResolveCommissionRateOptions): number {
  return normalizeCommissionRate(options.explicitRate)
    ?? resolveDefaultCommissionRate(options);
}
