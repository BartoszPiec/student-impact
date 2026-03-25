import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";

// GET /api/admin/export/pit-csv?month=2026-03
// Eksportuje CSV dla PIT-11 — wypłaty studentów za dany miesiąc
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

  // Parametr miesiąca (np. "2026-03")
  const { searchParams } = new URL(req.url);
  const month = searchParams.get("month"); // format: YYYY-MM

  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Pobierz dane z pit_withholdings
  let query = admin
    .from("pit_withholdings")
    .select(`
      id,
      created_at,
      amount_gross_minor,
      pit_amount_minor,
      amount_net_minor,
      tax_period,
      student_id,
      contract_id
    `)
    .order("created_at", { ascending: true });

  if (month) {
    query = query.eq("tax_period", month);
  }

  const { data: withholdings, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  
  if (!withholdings || withholdings.length === 0) {
    return new NextResponse("Brak danych dot. zaliczek PIT w podanym okresie.\n", {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="pit11_${month ?? "all"}.csv"`,
      },
    });
  }

  // Pobierz profile studentów
  const studentIds = [...new Set(withholdings.map((p) => p.student_id).filter(Boolean))];
  const { data: studentProfiles } = await admin
    .from("student_profiles")
    .select("user_id, public_name, pesel, birth_date, pit_exemption_u26, tax_residence_pl")
    .in("user_id", studentIds);

  const profileMap = new Map(studentProfiles?.map((s) => [s.user_id, s]) ?? []);

  // Pobierz emaile z auth.users
  const { data: { users: authUsers } } = await admin.auth.admin.listUsers();
  const emailMap = new Map(authUsers?.map((u) => [u.id, u.email]) ?? []);

  // Generuj CSV
  const BOM = "\uFEFF"; // UTF-8 BOM dla Excela
  const headers = [
    "Data wygenerowania",
    "ID rekordu",
    "Imię i nazwisko",
    "Email",
    "PESEL",
    "Data urodzenia",
    "Rezydent PL",
    "Zwolnienie PIT u26",
    "Kwota brutto (PLN)",
    "Zaliczka PIT (PLN)",
    "Kwota netto (PLN)",
    "ID kontraktu",
  ];

  const rows = withholdings.map((p) => {
    const sp = profileMap.get(p.student_id);
    const gross = (Number(p.amount_gross_minor) / 100).toFixed(2);
    const pit = (Number(p.pit_amount_minor) / 100).toFixed(2);
    const net = (Number(p.amount_net_minor) / 100).toFixed(2);

    return [
      new Date(p.created_at).toLocaleDateString("pl-PL"),
      p.id,
      sp?.public_name ?? "—",
      emailMap.get(p.student_id) ?? "—",
      sp?.pesel ?? "—",
      sp?.birth_date ?? "—",
      sp?.tax_residence_pl ? "TAK" : "NIE",
      sp?.pit_exemption_u26 ? "TAK" : "NIE",
      gross,
      pit,
      net,
      p.contract_id ?? "—",
    ].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",");
  });

  const csv = BOM + [headers.join(","), ...rows].join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="pit11_${month ?? "all"}.csv"`,
    },
  });
}
