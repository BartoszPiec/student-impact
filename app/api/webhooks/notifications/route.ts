import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase admin client to fetch user profiles/emails
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const WEBHOOK_SECRET = process.env.NOTIFICATIONS_WEBHOOK_SECRET;

function getEmailContent(type: string, payload: any) {
  let subject = "Nowe powiadomienie - Student2Work";
  let html = `<p>Masz nowe powiadomienie w aplikacji Student2Work.</p>`;

  switch (type) {
    case "cooperation_cancelled":
      subject = `Zlecenie anulowane: ${payload.offer_title || 'Nieznane zlecenie'}`;
      html = `
        <h2>Zlecenie zostało anulowane</h2>
        <p>Użytkownik (${payload.cancelled_by || 'druga strona'}) anulował zlecenie <strong>${payload.offer_title || ''}</strong>.</p>
        <p>Szczegóły: ${payload.snippet || ''}</p>
      `;
      break;
    case "deliverable_submitted":
      subject = `Nowe pliki do weryfikacji: ${payload.milestone_title || 'Etap'}`;
      html = `
        <h2>Student przesłał pliki!</h2>
        <p>Przesłano nowe pliki do weryfikacji w ramach etapu: <strong>${payload.milestone_title || ''}</strong>.</p>
        <p>Zaloguj się do panelu realizacji, aby je sprawdzić i zaakceptować lub odrzucić.</p>
      `;
      break;
    case "deliverable_accepted":
      subject = `Pliki zaakceptowane: ${payload.milestone_title || 'Etap'}`;
      html = `
        <h2>Dobra robota!</h2>
        <p>Firma zaakceptowała pliki z etapu: <strong>${payload.milestone_title || ''}</strong>.</p>
      `;
      break;
    case "deliverable_rejected":
      subject = `Poprawki wymagane: ${payload.milestone_title || 'Etap'}`;
      html = `
        <h2>Firma poprosiła o poprawki</h2>
        <p>Pliki w etapie <strong>${payload.milestone_title || ''}</strong> zostały odrzucone. Zaloguj się, aby przeczytać komentarz i wgrać poprawioną wersję.</p>
      `;
      break;
    case "escrow_funded":
      subject = `Depozyt zabezpieczony - start zlecenia!`;
      html = `
        <h2>Środki zostały zabezpieczone</h2>
        <p>Firma wpłaciła depozyt na poczet zlecenia. Możesz bezpiecznie rozpocząć pracę!</p>
      `;
      break;
    case "review_received":
      subject = `Otrzymałeś nową opinię!`;
      html = `
        <h2>Nowa opinia o współpracy</h2>
        <p>Druga strona wystawiła opinię po zakończeniu zlecenia. Zobacz ją w swoim profilu.</p>
      `;
      break;
    case "new_message":
      subject = `Nowa wiadomość w zleceniu`;
      html = `
        <h2>Otrzymałeś nową wiadomość</h2>
        <p>Masz nową nieodczytaną wiadomość w czacie projektu.</p>
        <p><em>${payload.snippet || ''}</em></p>
      `;
      break;
    case "offer_accepted":
      subject = `Twoja aplikacja została zaakceptowana!`;
      html = `
        <h2>Gratulacje!</h2>
        <p>Firma zaakceptowała Twoją aplikację na zlecenie <strong>${payload.offer_title || ''}</strong>.</p>
        <p>Zaloguj się do platformy, aby sprawdzić szczegóły i warunki współpracy.</p>
      `;
      break;
  }

  html += `<br><p><a href="${process.env.NEXT_PUBLIC_APP_URL}/app">Przejdź do aplikacji Student2Work</a></p>`;
  return { subject, html };
}

export async function POST(req: NextRequest) {
  try {
    // 1. Verify Secret to prevent unauthorized access
    const authHeader = req.headers.get("x-webhook-secret");
    if (authHeader !== WEBHOOK_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    // 2. We only care about INSERT events on the notifications table
    if (body.type !== "INSERT" || body.table !== "notifications") {
      return NextResponse.json({ message: "Ignored event" }, { status: 200 });
    }

    const record = body.record;
    if (!record || !record.user_id) {
      return NextResponse.json({ error: "Missing record data" }, { status: 400 });
    }

    // 3. Fetch user email
    const { data: userData, error: userErr } = await supabaseAdmin.auth.admin.getUserById(record.user_id);
    if (userErr || !userData.user?.email) {
      console.error("Failed to fetch user email:", userErr);
      return NextResponse.json({ error: "User not found or missing email" }, { status: 404 });
    }

    const email = userData.user.email;
    const { subject, html } = getEmailContent(record.typ, record.payload || {});

    // 4. Send email via Resend
    if (!RESEND_API_KEY) {
      console.log(`[DRY RUN] Would send email to: ${email}`);
      console.log(`[DRY RUN] Subject: ${subject}`);
      return NextResponse.json({ message: "Dry run - no RESEND_API_KEY" }, { status: 200 });
    }

    const resendRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.RESEND_FROM_EMAIL || "Student2Work <powiadomienia@student2work.pl>", 
        to: email,
        subject: subject,
        html: html,
      }),
    });

    if (!resendRes.ok) {
      const errBody = await resendRes.text();
      console.error("Resend API Error:", resendRes.status, errBody);
      return NextResponse.json({ error: "Failed to send email" }, { status: 500 });
    }

    const responseData = await resendRes.json();
    return NextResponse.json({ success: true, id: responseData.id }, { status: 200 });

  } catch (err: any) {
    console.error("Webhook Error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
