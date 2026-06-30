import { jsonError, noStoreJson } from "@/lib/security/api-response";
import { NextRequest } from "next/server";
import { z } from "zod";
import { resolveServerAppUrl } from "@/lib/app-url";
import { createAdminClient } from "@/lib/supabase/admin";
import { buildRateLimitKey, enforceRateLimit, getRequestIp } from "@/lib/rate-limit";
import { uuidSchema } from "@/lib/security/validation";
import { logCriticalError } from "@/lib/observability/error-log";

const supabaseAdmin = createAdminClient();

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const WEBHOOK_SECRET = process.env.NOTIFICATIONS_WEBHOOK_SECRET;

const notificationPayloadSchema = z.object({
  cancelled_by: z.string().max(120).nullable().optional(),
  cancel_reason: z.string().max(1000).nullable().optional(),
  milestone_title: z.string().max(200).nullable().optional(),
  offer_title: z.string().max(200).nullable().optional(),
  redirect_path: z.string().max(300).nullable().optional(),
  snippet: z.string().max(500).nullable().optional(),
}).passthrough();

const notificationRecordSchema = z.object({
  user_id: uuidSchema,
  typ: z.string().min(1).max(80),
  payload: notificationPayloadSchema.nullish(),
}).passthrough();

const notificationWebhookBodySchema = z.object({
  type: z.string().optional(),
  table: z.string().optional(),
  record: notificationRecordSchema.nullish(),
}).passthrough();

type NotificationPayload = z.infer<typeof notificationPayloadSchema>;

function jsonMessage(message: string, status = 200) {
  return noStoreJson({ message }, { status });
}

function escapeHtml(value: string | null | undefined) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function getEmailContent(type: string, payload: NotificationPayload = {}) {
  const safePayload = {
    cancelled_by: escapeHtml(payload.cancelled_by),
    cancel_reason: escapeHtml(payload.cancel_reason),
    milestone_title: escapeHtml(payload.milestone_title),
    offer_title: escapeHtml(payload.offer_title),
    snippet: escapeHtml(payload.snippet),
  };

  let subject = "Nowe powiadomienie - Student2Work";
  let html = "<p>Masz nowe powiadomienie w aplikacji Student2Work.</p>";

  switch (type) {
    case "cooperation_cancelled":
      subject = `Zlecenie anulowane: ${safePayload.offer_title || "Nieznane zlecenie"}`;
      html = `
        <h2>Zlecenie zostało anulowane</h2>
        <p>Uzytkownik (${safePayload.cancelled_by || "druga strona"}) anulowal zlecenie <strong>${safePayload.offer_title || ""}</strong>.</p>
        <p>Powod anulowania: ${safePayload.cancel_reason || "Brak dodatkowej informacji."}</p>
        <p>Szczegoly: ${safePayload.snippet || ""}</p>
      `;
      break;
    case "deliverable_submitted":
    case "milestone_submitted":
      subject = `Nowe pliki do weryfikacji: ${safePayload.milestone_title || "Etap"}`;
      html = `
        <h2>Student przeslal pliki!</h2>
        <p>Przeslano nowe pliki do weryfikacji w ramach etapu: <strong>${safePayload.milestone_title || ""}</strong>.</p>
        <p>Zaloguj sie do panelu realizacji, aby je sprawdzic i zaakceptować lub odrzucic.</p>
      `;
      break;
    case "deliverable_accepted":
    case "milestone_accepted":
      subject = `Etap zaakceptowany: ${safePayload.milestone_title || "Etap"}`;
      html = `
        <h2>Dobra robota!</h2>
        <p>Firma zaakceptowala etap: <strong>${safePayload.milestone_title || ""}</strong>.</p>
        <p>Możesz przejść do kolejnego etapu lub podsumowania zlecenia.</p>
      `;
      break;
    case "deliverable_rejected":
    case "milestone_rejected":
      subject = `Poprawki wymagane: ${safePayload.milestone_title || "Etap"}`;
      html = `
        <h2>Firma poprosila o poprawki</h2>
        <p>Pliki w etapie <strong>${safePayload.milestone_title || ""}</strong> zostały odrzucone. Zaloguj sie, aby przeczytac komentarz i wgrać poprawiona wersje.</p>
      `;
      break;
    case "escrow_funded":
      subject = "Depozyt zabezpieczony - start zlecenia!";
      html = `
        <h2>Srodki zostały zabezpieczone</h2>
        <p>Firma wplacila depozyt na poczet zlecenia. Mozesz bezpiecznie rozpoczac prace!</p>
      `;
      break;
    case "review_received":
      subject = "Otrzymales nowa opinie!";
      html = `
        <h2>Nowa opinia o współpracy</h2>
        <p>Druga strona wystawila opinie po zakończeniu zlecenia. Zobacz ja w swoim profilu.</p>
      `;
      break;
    case "new_message":
      subject = "Nowa wiadomosc w zleceniu";
      html = `
        <h2>Otrzymales nowa wiadomosc</h2>
        <p>Masz nowa nieodczytana wiadomosc w czacie projektu.</p>
        <p><em>${safePayload.snippet || ""}</em></p>
      `;
      break;
    case "offer_accepted":
      subject = "Twoja aplikacja została zaakceptowana!";
      html = `
        <h2>Gratulacje!</h2>
        <p>Firma zaakceptowala Twoja aplikacje na zlecenie <strong>${safePayload.offer_title || ""}</strong>.</p>
        <p>Zaloguj sie do platformy, aby sprawdzic szczegoly i warunki współpracy.</p>
      `;
      break;
  }

  const appUrl = resolveServerAppUrl();
  if (appUrl) {
    html += `<br><p><a href="${appUrl}/app">Przejdz do aplikacji Student2Work</a></p>`;
  }
  return { subject, html };
}

export async function POST(req: NextRequest) {
  try {
    const ip = getRequestIp(req);
    if (!WEBHOOK_SECRET) {
      await logCriticalError({
        source: "notifications.webhook.missing_secret",
        message: "NOTIFICATIONS_WEBHOOK_SECRET is not configured.",
      });
      return jsonError("Konfiguracja webhooka powiadomień jest niekompletna.", 500);
    }

    const authHeader = req.headers.get("x-webhook-secret");
    if (authHeader !== WEBHOOK_SECRET) {
      return jsonError("Brak autoryzacji webhooka.", 401);
    }

    const rawBody = await req.json().catch(() => null);
    const parsedBody = notificationWebhookBodySchema.safeParse(rawBody);
    if (!parsedBody.success) {
      return jsonError("Nieprawidłowe dane webhooka.", 400);
    }

    const body = parsedBody.data;

    if (body.type !== "INSERT" || body.table !== "notifications") {
      return jsonMessage("Zdarzenie pominięte.");
    }

    const record = body.record;
    if (!record?.user_id) {
      return jsonError("Brak danych powiadomienia.", 400);
    }

    const rateKey = buildRateLimitKey(["notifications_webhook", ip, record.user_id, record.typ]);
    const rateLimitResult = await enforceRateLimit("notifications", rateKey);
    if (!rateLimitResult.success) {
      return jsonError("Zbyt wiele prób wysyłki powiadomień. Spróbuj ponownie później.", 429);
    }

    const { data: userData, error: userErr } =
      await supabaseAdmin.auth.admin.getUserById(record.user_id);
    if (userErr || !userData.user?.email) {
      await logCriticalError({
        source: "notifications.webhook.user_email_missing",
        level: "warning",
        error: userErr,
        errorCode: userErr?.code,
        message: "Notification webhook could not resolve recipient email.",
        userId: record.user_id,
        context: {
          notificationType: record.typ,
        },
      });
      return jsonError("Nie znaleziono użytkownika lub adresu email.", 404);
    }

    const email = userData.user.email;
    const { subject, html } = getEmailContent(record.typ, record.payload ?? {});

    if (!RESEND_API_KEY) {
      if (process.env.NODE_ENV === "production") {
        await logCriticalError({
          source: "notifications.webhook.missing_resend_key",
          message: "RESEND_API_KEY is missing in production.",
          userId: record.user_id,
          context: {
            notificationType: record.typ,
          },
        });
        return jsonError("Konfiguracja wysyłki email jest niekompletna.", 500);
      }

      return jsonMessage("Tryb testowy - email nie został wysłany.");
    }

    const resendRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from:
          process.env.RESEND_FROM_EMAIL ||
          "Student2Work <powiadomienia@student2work.pl>",
        to: email,
        subject,
        html,
      }),
    });

    if (!resendRes.ok) {
      await logCriticalError({
        source: "notifications.webhook.resend_failed",
        message: "Resend API returned a non-success response.",
        userId: record.user_id,
        context: {
          notificationType: record.typ,
          status: resendRes.status,
        },
      });
      return jsonError("Nie udało się wysłać powiadomienia email.", 500);
    }

    const responseData = (await resendRes.json()) as { id?: string };
    return noStoreJson({ success: true, id: responseData.id ?? null });
  } catch (err: unknown) {
    await logCriticalError({
      source: "notifications.webhook.unexpected",
      error: err,
      message: "Unexpected notification webhook failure.",
    });
    return jsonError("Wystąpił błąd obsługi webhooka powiadomień.", 500);
  }
}
