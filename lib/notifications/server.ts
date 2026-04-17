import { createAdminClient } from "@/lib/supabase/admin";

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
    throw new Error(`create_notification failed: ${error.message}`);
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
    console.error("Notification dispatch failed:", error);
  }
}
