import { NextRequest, NextResponse } from "next/server";
import { jsonError } from "@/lib/security/api-response";
import { isAccountingMonth } from "@/lib/security/validation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { csvCell } from "@/lib/security/csv";
import { logCriticalError } from "@/lib/observability/error-log";

function readErrorCode(error: unknown): string | null {
  if (!error || typeof error !== "object" || !("code" in error)) return null;
  const code = (error as { code?: unknown }).code;
  return typeof code === "string" && code.trim().length > 0 ? code.trim() : null;
}

async function logPitCsvExportError(input: {
  source: string;
  error?: unknown;
  userId?: string | null;
  month?: string | null;
  context?: Record<string, unknown>;
}) {
  await logCriticalError({
    source: input.source,
    error: input.error,
    errorCode: readErrorCode(input.error),
    userId: input.userId ?? null,
    context: {
      month: input.month ?? null,
      ...input.context,
    },
  });
}

// GET /api/admin/export/pit-csv?month=2026-03
// Eksportuje CSV dla PIT-11 - wypłaty studentów za dany miesiąc.
export async function GET(req: NextRequest) {
  const supabase = await createClient();

  // Weryfikacja admina
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return jsonError("Musisz być zalogowany.", 401);

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("user_id", user.id)
    .single();

  if (profileError) {
    await logPitCsvExportError({
      source: "admin.export.pit_csv.profile_lookup",
      error: profileError,
      userId: user.id,
    });
    return jsonError("Nie udało się zweryfikować uprawnień administratora.", 500);
  }

  if (profile?.role !== "admin") {
    return jsonError("Brak uprawnień administratora.", 403);
  }

  // Parametr miesiąca (np. "2026-03").
  const { searchParams } = new URL(req.url);
  const month = searchParams.get("month"); // format: YYYY-MM
  if (month && !isAccountingMonth(month)) {
    return jsonError("Nieprawidłowy miesiąc eksportu.", 400);
  }

  const admin = createAdminClient();

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
  if (error) {
    await logPitCsvExportError({
      source: "admin.export.pit_csv.load_withholdings",
      error,
      userId: user.id,
      month,
    });
    return jsonError("Nie udało się przygotować eksportu.", 500);
  }

  if (!withholdings || withholdings.length === 0) {
    return new NextResponse("Brak danych dot. zaliczek PIT w podanym okresie.\n", {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="pit11_${month ?? "all"}.csv"`,
        "Cache-Control": "no-store",
      },
    });
  }

  // Pobierz profile studentów.
  const studentIds = [...new Set(withholdings.map((p) => p.student_id).filter(Boolean))];
  const { data: studentProfiles, error: studentProfilesError } = await admin
    .from("student_profiles")
    .select("user_id, public_name, pesel, birth_date, pit_exemption_u26, tax_residence_pl")
    .in("user_id", studentIds);

  if (studentProfilesError) {
    await logPitCsvExportError({
      source: "admin.export.pit_csv.load_student_profiles",
      error: studentProfilesError,
      userId: user.id,
      month,
      context: {
        studentCount: studentIds.length,
      },
    });
    return jsonError("Nie udało się pobrać danych studentów do eksportu.", 500);
  }

  const profileMap = new Map(studentProfiles?.map((s) => [s.user_id, s]) ?? []);

  const emailEntries = await Promise.all(
    studentIds.map(async (studentId) => {
      const { data, error: authUserError } = await admin.auth.admin.getUserById(studentId);
      if (authUserError) {
        await logPitCsvExportError({
          source: "admin.export.pit_csv.load_student_email",
          error: authUserError,
          userId: user.id,
          month,
          context: {
            studentId,
          },
        });
        throw new Error("student-email-load-failed");
      }
      return [studentId, data.user?.email ?? null] as const;
    }),
  ).catch(() => null);

  if (!emailEntries) {
    return jsonError("Nie udało się pobrać danych kontaktowych studentów do eksportu.", 500);
  }

  const emailMap = new Map(emailEntries);

  // Generuj CSV.
  const BOM = "\uFEFF"; // UTF-8 BOM dla Excela.
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
      sp?.public_name ?? "-",
      emailMap.get(p.student_id) ?? "-",
      sp?.pesel ?? "-",
      sp?.birth_date ?? "-",
      sp?.tax_residence_pl ? "TAK" : "NIE",
      sp?.pit_exemption_u26 ? "TAK" : "NIE",
      gross,
      pit,
      net,
      p.contract_id ?? "-",
    ].map(csvCell).join(",");
  });

  const csv = BOM + [headers.join(","), ...rows].join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="pit11_${month ?? "all"}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
