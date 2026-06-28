import "server-only";

import { logCriticalError } from "@/lib/observability/error-log";

function readErrorCode(error: unknown): string | null {
  if (!error || typeof error !== "object" || !("code" in error)) {
    return null;
  }

  const code = (error as { code?: unknown }).code;
  return typeof code === "string" && code.trim() ? code.trim() : null;
}

export async function logCompanyPackageError(input: {
  source: string;
  error?: unknown;
  userId?: string | null;
  packageId?: string | null;
  offerId?: string | null;
  serviceOrderId?: string | null;
  conversationId?: string | null;
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
    orderId: input.serviceOrderId ?? null,
    context: {
      packageId: input.packageId ?? null,
      offerId: input.offerId ?? null,
      serviceOrderId: input.serviceOrderId ?? null,
      conversationId: input.conversationId ?? null,
      ...(input.context ?? {}),
    },
  });
}
