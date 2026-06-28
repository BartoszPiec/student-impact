import { createAdminClient } from "@/lib/supabase/admin";
import { logCriticalError } from "@/lib/observability/error-log";

export type NotificationPayload = Record<string, unknown>;

export async function sendNotification(
  userId: string,
  typ: string,
  payload: NotificationPayload = {},
) {
  const normalizedPayload =
    "p_payload" in payload &&
    payload.p_payload &&
    typeof payload.p_payload === "object" &&
    !Array.isArray(payload.p_payload)
      ? (payload.p_payload as NotificationPayload)
      : payload;

  const admin = createAdminClient();
  const { error } = await admin.rpc("create_notification", {
    p_user_id: userId,
    p_typ: typ,
    p_payload: normalizedPayload,
  });

  if (error) {
    await logCriticalError({
      source: "notifications.create_notification_failed",
      error,
      errorCode: error.code,
      message: "create_notification RPC failed.",
      userId,
      context: {
        notificationType: typ,
      },
    });
    throw new Error("Nie udało się wysłać powiadomienia.");
  }
}

export async function trySendNotification(
  userId: string,
  typ: string,
  payload: NotificationPayload = {},
) {
  try {
    await sendNotification(userId, typ, payload);
  } catch (error) {
    await logCriticalError({
      source: "notifications.try_send_failed",
      level: "warning",
      error,
      message: "Non-blocking notification dispatch failed.",
      userId,
      context: {
        notificationType: typ,
      },
    });
  }
}
