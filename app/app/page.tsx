import { redirect } from "next/navigation";
import { getRequestContext } from "@/lib/auth/request-context";

export default async function AppIndexPage() {
  const { user, role } = await getRequestContext();

  if (!user) redirect("/auth");
  if (role === "company") redirect("/app/company/packages");
  if (role === "admin") redirect("/app/admin");
  if (role === "student") redirect("/app/jobs");

  redirect("/app/onboarding");
}
