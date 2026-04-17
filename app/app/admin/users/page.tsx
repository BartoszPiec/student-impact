import { Users } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";
import { UsersTable } from "@/components/admin/users-table";

export const dynamic = "force-dynamic";

type ProfileRow = {
  user_id: string;
  role: string | null;
  public_name: string | null;
  imie: string | null;
  nazwisko: string | null;
  created_at: string;
};

export default async function AdminUsersPage() {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("user_id, role, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <div className="p-8 text-red-500">Blad pobierania uzytkownikow: {error.message}</div>
    );
  }

  const profiles = ((data || []) as Array<Pick<ProfileRow, "user_id" | "role" | "created_at">>) || [];
  const studentIds = profiles
    .filter((profile) => profile.role === "student")
    .map((profile) => profile.user_id);
  const companyIds = profiles
    .filter((profile) => profile.role === "company")
    .map((profile) => profile.user_id);

  const [{ data: studentProfiles }, { data: companyProfiles }] = await Promise.all([
    studentIds.length > 0
      ? supabase.from("student_profiles").select("user_id, public_name").in("user_id", studentIds)
      : Promise.resolve({ data: [] as Array<{ user_id: string; public_name: string | null }> }),
    companyIds.length > 0
      ? supabase.from("company_profiles").select("user_id, nazwa").in("user_id", companyIds)
      : Promise.resolve({ data: [] as Array<{ user_id: string; nazwa: string | null }> }),
  ]);

  const studentNameByUserId = new Map(
    (studentProfiles || []).map((profile) => [profile.user_id, profile.public_name || null]),
  );
  const companyNameByUserId = new Map(
    (companyProfiles || []).map((profile) => [profile.user_id, profile.nazwa || null]),
  );

  const users = profiles.map((profile) => ({
    ...profile,
    imie: null,
    nazwisko: null,
    public_name:
      profile.role === "student"
        ? studentNameByUserId.get(profile.user_id) || null
        : profile.role === "company"
          ? companyNameByUserId.get(profile.user_id) || null
          : null,
  }));

  return (
    <div className="space-y-8 pb-12">
      <div className="relative flex flex-col gap-6 overflow-hidden rounded-[2.5rem] border border-white/5 bg-slate-900/50 p-8 shadow-2xl md:flex-row md:items-end md:justify-between">
        <div className="relative z-10">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-indigo-500/30 bg-indigo-500/20">
              <Users className="h-6 w-6 text-indigo-400" />
            </div>
            <span className="text-xs font-black uppercase tracking-[0.2em] text-indigo-400/80">
              Marketplace
            </span>
          </div>
          <h1 className="mb-3 text-4xl font-black leading-none tracking-tight text-white md:text-5xl">
            Uzytkownicy
          </h1>
          <p className="max-w-xl font-medium leading-relaxed text-slate-400">
            Przeglad wszystkich kont w systemie na podstawie profiles oraz
            profilow rolowych, z filtrowaniem po roli i szybkim wyszukiwaniem.
          </p>
        </div>
      </div>

      <UsersTable users={users as ProfileRow[]} />
    </div>
  );
}
