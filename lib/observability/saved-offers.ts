import "server-only";

import { logCriticalError } from "@/lib/observability/error-log";

function readErrorCode(error: unknown): string | null {
  if (!error || typeof error !== "object" || !("code" in error)) {
    return null;
  }

  const code = (error as { code?: unknown }).code;
  return typeof code === "string" && code.trim() ? code.trim() : null;
}

export async function logSavedOfferError(input: {
  source: string;
  error?: unknown;
  userId?: string | null;
  offerId?: string | null;
  message?: string;
  level?: "error" | "warning";
  context?: Record<string, unknown>;
}) {
  await logCriticalError({
    source: input.source,
    error: input.error,
    message: input.message,
    level: input.level ?? "error",
    errorCode: readErrorCode(input.error),
    userId: input.userId ?? null,
    context: {
      offerId: input.offerId ?? null,
      ...(input.context ?? {}),
    },
  });
}
