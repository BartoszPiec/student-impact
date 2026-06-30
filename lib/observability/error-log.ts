import "server-only";

import * as Sentry from "@sentry/nextjs";
import { createAdminClient } from "@/lib/supabase/admin";

type ErrorLogLevel = "error" | "warning" | "info";
type SentryLevel = "error" | "warning" | "info";
type JsonPrimitive = string | number | boolean | null;
type SanitizedValue = JsonPrimitive | SanitizedValue[] | { [key: string]: SanitizedValue };
type ErrorLogContext = Record<string, unknown>;

type LogCriticalErrorInput = {
  source: string;
  error?: unknown;
  message?: string;
  level?: ErrorLogLevel;
  errorType?: string | null;
  errorCode?: string | null;
  context?: ErrorLogContext;
  orderId?: string | null;
  contractId?: string | null;
  paymentId?: string | null;
  stripeSessionId?: string | null;
  stripeEventId?: string | null;
  userId?: string | null;
};

const MAX_MESSAGE_LENGTH = 1200;
const MAX_STRING_LENGTH = 500;
const MAX_CONTEXT_KEYS = 40;
const MAX_ARRAY_ITEMS = 20;
const MAX_DEPTH = 3;

const SENSITIVE_KEY_PATTERN =
  /(authorization|cookie|token|secret|password|passwd|session|jwt|email|mail|phone|telefon|pesel|nip|address|adres|card|iban|account_number|api[_-]?key)/i;

function truncate(value: string, maxLength: number) {
  return value.length > maxLength ? `${value.slice(0, maxLength - 1)}...` : value;
}

function readStringProperty(value: unknown, key: string): string | null {
  if (!value || typeof value !== "object" || !(key in value)) {
    return null;
  }

  const rawValue = (value as Record<string, unknown>)[key];
  return typeof rawValue === "string" && rawValue.trim().length > 0
    ? rawValue.trim()
    : null;
}

function resolveMessage(input: LogCriticalErrorInput) {
  const directMessage = input.message?.trim();
  if (directMessage) {
    return truncate(directMessage, MAX_MESSAGE_LENGTH);
  }

  if (input.error instanceof Error && input.error.message.trim()) {
    return truncate(input.error.message, MAX_MESSAGE_LENGTH);
  }

  if (typeof input.error === "string" && input.error.trim()) {
    return truncate(input.error.trim(), MAX_MESSAGE_LENGTH);
  }

  return "Nieznany blad operacyjny.";
}

function resolveErrorType(input: LogCriticalErrorInput) {
  if (input.errorType) return truncate(input.errorType, 120);
  if (input.error instanceof Error && input.error.name) return truncate(input.error.name, 120);
  return readStringProperty(input.error, "name") ?? null;
}

function resolveErrorCode(input: LogCriticalErrorInput) {
  if (input.errorCode) return truncate(input.errorCode, 120);
  return readStringProperty(input.error, "code");
}

function sanitizeValue(value: unknown, depth = 0): SanitizedValue {
  if (value === null || value === undefined) return null;

  if (typeof value === "string") {
    return truncate(value, MAX_STRING_LENGTH);
  }

  if (typeof value === "number") {
    return Number.isFinite(value) ? value : String(value);
  }

  if (typeof value === "boolean") {
    return value;
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (Array.isArray(value)) {
    if (depth >= MAX_DEPTH) return "[truncated]";
    return value.slice(0, MAX_ARRAY_ITEMS).map((item) => sanitizeValue(item, depth + 1));
  }

  if (typeof value === "object") {
    if (depth >= MAX_DEPTH) return "[truncated]";

    const entries = Object.entries(value as Record<string, unknown>).slice(0, MAX_CONTEXT_KEYS);
    const sanitized: Record<string, SanitizedValue> = {};

    for (const [key, nestedValue] of entries) {
      sanitized[truncate(key, 120)] = SENSITIVE_KEY_PATTERN.test(key)
        ? "[redacted]"
        : sanitizeValue(nestedValue, depth + 1);
    }

    return sanitized;
  }

  return truncate(String(value), MAX_STRING_LENGTH);
}

function sanitizeContext(context: ErrorLogContext | undefined): Record<string, SanitizedValue> {
  if (!context) return {};

  const sanitized = sanitizeValue(context);
  return sanitized && typeof sanitized === "object" && !Array.isArray(sanitized)
    ? sanitized
    : {};
}

function resolveSentryLevel(level: ErrorLogLevel): SentryLevel {
  if (level === "warning") return "warning";
  if (level === "info") return "info";
  return "error";
}

function sentryConfigured() {
  return Boolean(process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN);
}

export async function logCriticalError(input: LogCriticalErrorInput): Promise<void> {
  try {
    const level = input.level ?? "error";
    const message = resolveMessage(input);
    const context = sanitizeContext(input.context);
    const errorType = resolveErrorType(input);
    const errorCode = resolveErrorCode(input);
    const source = truncate(input.source, 120);

    if (sentryConfigured()) {
      const sentryLevel = resolveSentryLevel(level);
      Sentry.withScope((scope) => {
        scope.setLevel(sentryLevel);
        scope.setTag("source", source);
        if (errorCode) scope.setTag("error_code", errorCode);
        if (input.contractId) scope.setTag("contract_id", input.contractId);
        if (input.stripeEventId) scope.setTag("stripe_event_id", input.stripeEventId);
        if (input.userId) scope.setUser({ id: input.userId });
        scope.setContext("student2work", {
          ...context,
          orderId: input.orderId ?? null,
          contractId: input.contractId ?? null,
          paymentId: input.paymentId ?? null,
          stripeSessionId: input.stripeSessionId ?? null,
          stripeEventId: input.stripeEventId ?? null,
        });

        if (input.error instanceof Error) {
          Sentry.captureException(input.error);
        } else {
          Sentry.captureMessage(message, sentryLevel);
        }
      });
    }

    const admin = createAdminClient();
    await admin.from("error_logs").insert({
      source,
      level,
      error_type: errorType,
      error_code: errorCode,
      message,
      context,
      order_id: input.orderId ?? null,
      contract_id: input.contractId ?? null,
      payment_id: input.paymentId ?? null,
      stripe_session_id: input.stripeSessionId ?? null,
      stripe_event_id: input.stripeEventId ?? null,
      user_id: input.userId ?? null,
    });
  } catch (loggingError) {
    const message = loggingError instanceof Error ? loggingError.message : "unknown logging error";
    console.error("[observability] error log write failed:", message);
  }
}
