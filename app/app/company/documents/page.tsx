import { FileText } from "lucide-react";
import { redirect } from "next/navigation";
import { PageContainer } from "@/components/ui/page-container";
import { createClient } from "@/lib/supabase/server";
import { CompanyDocumentsPanel } from "./company-documents-panel";
import { CompanyHero } from "../_components/company-dashboard-ui";

export const dynamic = "force-dynamic";

export default async function CompanyDocumentsPage() {
  const supabase = await createClient();

  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) redirect("/auth");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("user_id", user.id)
    .single();

  if (profile?.role !== "company") {
    redirect("/app");
  }

  return (
    <main className="min-h-screen bg-slate-50/60 pb-12">
      <CompanyHero
        badge="Panel Pracodawcy"
        title="Dokumenty"
        description="Umowy i faktury powiązane z Twoimi zleceniami, gotowe do pobrania i kontroli rozliczeń."
        icon={FileText}
      />

      <PageContainer className="py-5">
        <CompanyDocumentsPanel />
      </PageContainer>
    </main>
  );
}
