import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

/**
 * Layout admina — chroni WSZYSTKIE podstrony /app/admin/* przed nieadminami.
 * Każda strona w tym katalogu dziedziczy ten guard automatycznie.
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/auth");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("user_id", user.id)
    .single();

  if (profile?.role !== "admin") redirect("/app");

  return <>{children}</>;
}
