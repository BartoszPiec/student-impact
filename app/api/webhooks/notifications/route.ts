import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const WEBHOOK_SECRET = process.env.NOTIFICATIONS_WEBHOOK_SECRET;

type NotificationPayload = {
  cancelled_by?: string | null;
  milestone_title?: string | null;
  offer_title?: string | null;
  snippet?: string | null;
};

type NotificationRecord = {
  user_id: string;
  typ: string;
  payload?: NotificationPayload | null;
};

type NotificationWebhookBody = {
  type?: string;
  table?: string;
  record?: NotificationRecord | null;
};

function getEmailContent(type: string, payload: NotificationPayload = {}) {
  let subject = "Nowe powiadomienie - Student2Work";
  let html = "<p>Masz nowe powiadomienie w aplikacji Student2Work.</p>";

  switch (type) {
    case "cooperation_cancelled":
      subject = `Zlecenie anulowane: ${payload.offer_title || "Nieznane zlecenie"}`;
      html = `
        <h2>Zlecenie zostalo anulowane</h2>
        <p>Uzytkownik (${payload.cancelled_by || "druga strona"}) anulowal zlecenie <strong>${payload.offer_title || ""}</strong>.</p>
        <p>Szczegoly: ${payload.snippet || ""}</p>
      `;
      break;
    case "deliverable_submitted":
      subject = `Nowe pliki do weryfikacji: ${payload.milestone_title || "Etap"}`;
      html = `
        <h2>Student przeslal pliki!</h2>
        <p>Przeslano nowe pliki do weryfikacji w ramach etapu: <strong>${payload.milestone_title || ""}</strong>.</p>
        <p>Zaloguj sie do panelu realizacji, aby je sprawdzic i zaakceptowac lub odrzucic.</p>
      `;
      break;
    case "deliverable_accepted":
      subject = `Pliki zaakceptowane: ${payload.milestone_title || "Etap"}`;
      html = `
        <h2>Dobra robota!</h2>
        <p>Firma zaakceptowala pliki z etapu: <strong>${payload.milestone_title || ""}</strong>.</p>
      `;
      break;
    case "deliverable_rejected":
      subject = `Poprawki wymagane: ${payload.milestone_title || "Etap"}`;
      html = `
        <h2>Firma poprosila o poprawki</h2>
        <p>Pliki w etapie <strong>${payload.milestone_title || ""}</strong> zostaly odrzucone. Zaloguj sie, aby przeczytac komentarz i wgrac poprawiona wersje.</p>
      `;
      break;
    case "escrow_funded":
      subject = "Depozyt zabezpieczony - start zlecenia!";
      html = `
        <h2>Srodki zostaly zabezpieczone</h2>
        <p>Firma wplacila depozyt na poczet zlecenia. Mozesz bezpiecznie rozpoczac prace!</p>
      `;
      break;
    case "review_received":
      subject = "Otrzymales nowa opinie!";
      html = `
        <h2>Nowa opinia o wspolpracy</h2>
        <p>Druga strona wystawila opinie po zakonczeniu zlecenia. Zobacz ja w swoim profilu.</p>
      `;
      break;
    case "new_message":
      subject = "Nowa wiadomosc w zleceniu";
      html = `
        <h2>Otrzymales nowa wiadomosc</h2>
        <p>Masz nowa nieodczytana wiadomosc w czacie projektu.</p>
        <p><em>${payload.snippet || ""}</em></p>
      `;
      break;
    case "offer_accepted":
      subject = "Twoja aplikacja zostala zaakceptowana!";
      html = `
        <h2>Gratulacje!</h2>
        <p>Firma zaakceptowala Twoja aplikacje na zlecenie <strong>${payload.offer_title || ""}</strong>.</p>
        <p>Zaloguj sie do platformy, aby sprawdzic szczegoly i warunki wspolpracy.</p>
      `;
      break;
  }

  html += `<br><p><a href="${process.env.NEXT_PUBLIC_APP_URL}/app">Przejdz do aplikacji Student2Work</a></p>`;
  return { subject, html };
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("x-webhook-secret");
    if (authHeader !== WEBHOOK_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await req.json()) as NotificationWebhookBody;

    if (body.type !== "INSERT" || body.table !== "notifications") {
      return NextResponse.json({ message: "Ignored event" }, { status: 200 });
    }

    const record = body.record;
    if (!record?.user_id) {
      return NextResponse.json({ error: "Missing record data" }, { status: 400 });
    }

    const { data: userData, error: userErr } =
      await supabaseAdmin.auth.admin.getUserById(record.user_id);
    if (userErr || !userData.user?.email) {
      console.error("Failed to fetch user email:", userErr);
      return NextResponse.json(
        { error: "User not found or missing email" },
        { status: 404 },
      );
    }

    const email = userData.user.email;
    const { subject, html } = getEmailContent(record.typ, record.payload ?? {});

    if (!RESEND_API_KEY) {
      console.log(`[DRY RUN] Would send email to: ${email}`);
      console.log(`[DRY RUN] Subject: ${subject}`);
      return NextResponse.json(
        { message: "Dry run - no RESEND_API_KEY" },
        { status: 200 },
      );
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
      const errBody = await resendRes.text();
      console.error("Resend API Error:", resendRes.status, errBody);
      return NextResponse.json({ error: "Failed to send email" }, { status: 500 });
    }

    const responseData = (await resendRes.json()) as { id?: string };
    return NextResponse.json(
      { success: true, id: responseData.id ?? null },
      { status: 200 },
    );
  } catch (err: unknown) {
    console.error("Webhook Error:", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
