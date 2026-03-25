import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";

// GET /api/admin/export/invoices-zip?month=2026-03
// Eksportuje CSV z danymi faktur dla każdej płatności Stripe w danym miesiącu
// PDF generation wymaga @react-pdf/renderer — na MVP zwraca CSV z danymi faktur
export async function GET(req: NextRequest) {
  const supabase = await createClient();

  // Weryfikacja admina
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("user_id", user.id)
    .single();

  if (profile?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const month = searchParams.get("month"); // format: YYYY-MM

  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Pobierz płatności Stripe z financial_ledger
  let query = admin
    .from("financial_ledger")
    .select(`
      id,
      created_at,
      amount,
      amount_minor,
      currency,
      type,
      user_id,
      contract_id,
      application_id,
      stripe_payment_intent_id,
      stripe_session_id,
      description,
      metadata
    `)
    .in("type", ["stripe_payment", "platform_commission"])
    .eq("direction", "credit")
    .order("created_at", { ascending: true });

  if (month) {
    const start = `${month}-01T00:00:00.000Z`;
    const [year, mon] = month.split("-").map(Number);
    const nextMonth = mon === 12
      ? `${year + 1}-01-01T00:00:00.000Z`
      : `${year}-${String(mon + 1).padStart(2, "0")}-01T00:00:00.000Z`;
    query = query.gte("created_at", start).lt("created_at", nextMonth);
  }

  const { data: payments, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (!payments || payments.length === 0) {
    return NextResponse.json({ message: "Brak płatności w podanym okresie." }, { status: 404 });
  }

  // Pobierz kontrakty i firmy
  const contractIds = [...new Set(payments.map((p) => p.contract_id).filter(Boolean))];
  const { data: contracts } = await admin
    .from("contracts")
    .select("id, total_amount, total_amount_minor, student_id, company_id, application_id")
    .in("id", contractIds);

  const contractMap = new Map(contracts?.map((c) => [c.id, c]) ?? []);

  // Pobierz profile firm
  const companyIds = [...new Set(contracts?.map((c) => c.company_id).filter(Boolean) ?? [])];
  const { data: companyProfiles } = await admin
    .from("company_profiles")
    .select("user_id, nazwa, nip, address")
    .in("user_id", companyIds);
  const companyMap = new Map(companyProfiles?.map((c) => [c.user_id, c]) ?? []);

  // Pobierz profile studentów
  const studentIds = [...new Set(contracts?.map((c) => c.student_id).filter(Boolean) ?? [])];
  const { data: studentProfiles } = await admin
    .from("student_profiles")
    .select("user_id, public_name, pesel")
    .in("user_id", studentIds);
  const studentMap = new Map(studentProfiles?.map((s) => [s.user_id, s]) ?? []);

  // Generuj CSV z danymi faktur
  const BOM = "\uFEFF";
  const headers = [
    "Numer faktury",
    "Data wystawienia",
    "Stripe Session ID",
    "Stripe Payment Intent",
    "Kwota (PLN)",
    "Typ wpisu",
    "Firma — Nazwa",
    "Firma — NIP",
    "Firma — Adres",
    "Student — Imię i nazwisko",
    "Student — PESEL",
    "ID kontraktu",
    "Opis",
  ];

  let invoiceNum = 1;
  const rows = payments.map((p) => {
    const contract = contractMap.get(p.contract_id);
    const company = companyMap.get(contract?.company_id);
    const student = studentMap.get(contract?.student_id);
    const dateStr = new Date(p.created_at).toLocaleDateString("pl-PL");
    const num = `FV/${month ?? new Date(p.created_at).toISOString().slice(0, 7)}/${String(invoiceNum++).padStart(4, "0")}`;
    const amountPln = (Number(p.amount_minor ?? (Number(p.amount) * 100)) / 100).toFixed(2);

    return [
      num,
      dateStr,
      p.stripe_session_id ?? "—",
      p.stripe_payment_intent_id ?? "—",
      amountPln,
      p.type === "stripe_payment" ? "Płatność klienta" : "Prowizja platformy",
      company?.nazwa ?? "—",
      company?.nip ?? "—",
      company?.address ?? "—",
      student?.public_name ?? "—",
      student?.pesel ?? "—",
      p.contract_id ?? "—",
      p.description ?? "—",
    ].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",");
  });

  const csv = BOM + [headers.join(","), ...rows].join("\n");

  // TODO Sprint #2: generuj prawdziwe PDF faktury i pakuj w ZIP (jszip + @react-pdf/renderer)
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="faktury_${month ?? "all"}.csv"`,
    },
  });
}
