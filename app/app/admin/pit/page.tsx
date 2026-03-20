import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import PitDashboard from "./_components/pit-dashboard";

export const dynamic = "force-dynamic";

export default async function AdminPitPage() {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) redirect("/auth");

  // Verify admin role
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("user_id", userData.user.id)
    .single();

  if (profile?.role !== "admin") {
    redirect("/app");
  }

  // Fetch PIT withholdings with student info
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
        <div className="bg-red-50 text-red-600 p-4 rounded-xl">
          Błąd ładowania danych PIT: {error.message}
        </div>
      </main>
    );
  }

  // Fetch student names for display
  const studentIds = [...new Set((withholdings || []).map((w) => w.student_id))];
  const { data: studentProfiles } = await supabase
    .from("student_profiles")
    .select("user_id, public_name")
    .in("user_id", studentIds.length > 0 ? studentIds : ["none"]);

  const studentMap: Record<string, string> = {};
  (studentProfiles || []).forEach((sp) => {
    studentMap[sp.user_id] = sp.public_name || "Student";
  });

  // Enrich withholdings with student name
  const enrichedWithholdings = (withholdings || []).map((w) => ({
    ...w,
    student_name: studentMap[w.student_id] || "Nieznany",
  }));

  return <PitDashboard withholdings={enrichedWithholdings} />;
}
