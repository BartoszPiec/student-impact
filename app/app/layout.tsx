import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getRequestContext } from "@/lib/auth/request-context";
import { EnsureOnboarding } from "./EnsureOnboarding";
import { AppNavbar } from "./app-navbar";

type OnboardingDetails = {
  kierunek?: string | null;
  nazwa?: string | null;
};

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { user, role } = await getRequestContext();

  if (!user) redirect("/auth");

  const detailsQuery = role === "student"
    ? supabase.from("student_profiles").select("kierunek").eq("user_id", user.id).maybeSingle()
    : role === "company"
      ? supabase.from("company_profiles").select("nazwa").eq("user_id", user.id).maybeSingle()
      : Promise.resolve({ data: null, error: null });

  const [detailsResult, notificationsResult, chatResult] = await Promise.all([
    detailsQuery,
    supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .is("read_at", null),
    supabase.rpc("get_my_unread_chat_count"),
  ]);

  const details = detailsResult.data as OnboardingDetails | null;
  const hasDetails = role === "student"
    ? Boolean(details?.kierunek)
    : role === "company"
      ? Boolean(details?.nazwa && details.nazwa !== "Firma Bez Nazwy")
      : true;
  const unread = notificationsResult.count ?? 0;
  const unreadChatValue = Number(chatResult.data ?? 0);
  const unreadChat = Number.isFinite(unreadChatValue) ? unreadChatValue : 0;
  const needsOnboarding = Boolean(role && role !== "admin" && !hasDetails);

  return (
    <div className="min-h-screen">
      {needsOnboarding ? <EnsureOnboarding /> : null}
      <AppNavbar user={user} role={role} unread={unread} unreadChat={unreadChat} />
      <main className="min-h-screen pb-24 lg:pb-0">{children}</main>
    </div>
  );
}
