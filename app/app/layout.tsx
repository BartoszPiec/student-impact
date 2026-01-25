import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { EnsureOnboarding } from "./EnsureOnboarding";
import { signOut } from "./_actions/auth";
import NotificationsBell from "@/components/notifications-bell";
import { AppNavbar } from "./app-navbar";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  // 1) user z cookies (SSR)
  const { data } = await supabase.auth.getUser();
  const user = data.user;

  // 2) rola z profiles (jeśli zalogowany)
  const { data: profile } = user
    ? await supabase
      .from("profiles")
      .select("role")
      .eq("user_id", user.id)
      .single()
    : { data: null };

  const role = profile?.role ?? null;

  // Pobieramy dodatkowe dane do sprawdzenia onboardingu
  let hasDetails = false;
  if (user && role === "student") {
    const { data: sp } = await supabase.from("student_profiles").select("kierunek").eq("user_id", user.id).single();
    if (sp?.kierunek) hasDetails = true;
  } else if (user && role === "company") {
    const { data: cp } = await supabase.from("company_profiles").select("nazwa").eq("user_id", user.id).single();
    // Sprawdzamy czy nazwa istnieje i nie jest domyślna
    if (cp?.nazwa && cp.nazwa !== "Firma Bez Nazwy") hasDetails = true;
  }

  // 3) liczba nieprzeczytanych powiadomień (SSR)
  let unread = 0;
  let unreadChat = 0;

  if (user) {
    const { data: unreadRows } = await supabase
      .from("notifications")
      .select("id")
      .eq("user_id", user.id)
      .is("read_at", null);

    unread = unreadRows?.length ?? 0;

    // Count unread chat messages for badge initialization (SSR)
    const { count: chatCount } = await supabase
      .from("messages")
      .select("id", { count: "exact", head: true })
      .neq("sender_id", user.id)
      .is("read_at", null);

    unreadChat = chatCount ?? 0;
  }

  // --- ONBOARDING CHECK ---
  // Jeśli użytkownik jest zalogowany, ma rolę, ale nie ma 'details' -> needs onboarding.
  // Wykluczamy admina z onboardingu.
  const needsOnboarding = !!(user && role && role !== 'admin' && !hasDetails);

  return (
    <div className="min-h-screen">
      {needsOnboarding && <EnsureOnboarding />}
      <AppNavbar user={user} role={role} unread={unread} unreadChat={unreadChat} />

      <main className="mx-auto max-w-7xl p-4">{children}</main>
    </div>
  );
}
