"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { logCriticalError } from "@/lib/observability/error-log";
import { uuidSchema } from "@/lib/security/validation";

function parseNotificationId(id: string) {
  const parsed = uuidSchema.safeParse(id);
  if (!parsed.success) {
    throw new Error("Nieprawidlowy identyfikator powiadomienia.");
  }

  return parsed.data;
}

function clampNotificationLimit(limit: number) {
  if (!Number.isFinite(limit)) return 5;
  return Math.min(Math.max(Math.trunc(limit), 1), 50);
}

async function logNotificationActionError(input: {
  source: string;
  error: unknown;
  userId?: string | null;
  notificationId?: string | null;
}) {
  await logCriticalError({
    source: input.source,
    error: input.error,
    userId: input.userId ?? null,
    context: {
      notificationId: input.notificationId ?? null,
    },
  });
}

export async function markNotificationRead(id: string) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/auth");
  const safeNotificationId = parseNotificationId(id);

  // IDOR fix: upewnij się że user może oznaczyć tylko swoje powiadomienia
  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", safeNotificationId)
    .eq("user_id", data.user.id);

  if (error) {
    await logNotificationActionError({
      source: "notifications.mark_read",
      error,
      userId: data.user.id,
      notificationId: safeNotificationId,
    });
    throw new Error("Nie udalo sie oznaczyc powiadomienia jako przeczytanego.");
  }

  revalidatePath("/app/notifications");
}

export async function markAllNotificationsRead() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  const user = data.user;
  if (!user) redirect("/auth");

  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("user_id", user.id)
    .is("read_at", null);

  if (error) {
    await logNotificationActionError({
      source: "notifications.mark_all_read",
      error,
      userId: user.id,
    });
    throw new Error("Nie udalo sie oznaczyc powiadomien jako przeczytanych.");
  }

  revalidatePath("/app/notifications");
}

export async function getRecentNotifications(limit = 5) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const safeLimit = clampNotificationLimit(limit);
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(safeLimit);

  if (error) {
    await logNotificationActionError({
      source: "notifications.recent.list",
      error,
      userId: user.id,
    });
    return [];
  }

  return data || [];
}
