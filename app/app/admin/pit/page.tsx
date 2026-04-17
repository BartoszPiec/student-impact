import { createClient } from "@/lib/supabase/server";
import PitDashboard from "./_components/pit-dashboard";

export const dynamic = "force-dynamic";

export default async function AdminPitPage() {
  const supabase = await createClient();

  const { data: withholdings, error } = await supabase
    .from("pit_withholdings")
    .select(`
      id,
      contract_id,
      milestone_id,
      student_id,
      amount_gross,
      kup_rate,
      taxable_base,
      pit_rate,
      pit_amount,
      amount_net,
      status,
      paid_to_us_at,
      tax_period,
      created_at
    `)
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <main className="p-8">
        <div className="rounded-3xl border border-red-500/20 bg-red-500/5 p-6 text-red-300">
          Blad ladowania danych PIT: {error.message}
        </div>
      </main>
    );
  }

  const studentIds = [...new Set((withholdings || []).map((withholding) => withholding.student_id))];
  const { data: studentProfiles } = await supabase
    .from("student_profiles")
    .select("user_id, public_name")
    .in("user_id", studentIds.length > 0 ? studentIds : ["none"]);

  const studentMap: Record<string, string> = {};
  (studentProfiles || []).forEach((profile) => {
    studentMap[profile.user_id] = profile.public_name || "Student";
  });

  const enrichedWithholdings = (withholdings || []).map((withholding) => ({
    ...withholding,
    student_name: studentMap[withholding.student_id] || "Nieznany",
  }));

  return <PitDashboard withholdings={enrichedWithholdings} />;
}
