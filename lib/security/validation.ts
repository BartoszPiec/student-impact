import { z } from "zod";

export const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const MONTH_RE = /^\d{4}-(0[1-9]|1[0-2])$/;

export const uuidSchema = z.string().trim().regex(UUID_RE);
export const optionalUuidSchema = z.string().trim().regex(UUID_RE).optional();
export const monthSchema = z.string().trim().regex(MONTH_RE);

export function isUuid(value: string | null | undefined): value is string {
  return typeof value === "string" && UUID_RE.test(value);
}

export function isAccountingMonth(value: string | null | undefined): value is string {
  return typeof value === "string" && MONTH_RE.test(value);
}
