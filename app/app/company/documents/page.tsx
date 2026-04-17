import { FileText } from "lucide-react";
import { redirect } from "next/navigation";
import { PremiumPageHeader } from "@/components/ui/premium-page-header";
import { PageContainer } from "@/components/ui/page-container";
import { createClient } from "@/lib/supabase/server";
import { CompanyDocumentsPanel } from "./company-documents-panel";

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
    <main className="space-y-8 pb-12">
      <PremiumPageHeader
        badge="Panel Pracodawcy"
        title="Dokumenty firmy"
        description="W jednym miejscu zobaczysz umowy A i faktury firmowe wygenerowane dla Twoich kontraktow."
        icon={<FileText className="h-10 w-10 text-indigo-300 drop-shadow-[0_0_8px_rgba(165,180,252,0.5)]" />}
      />

      <PageContainer className="pb-12">
        <CompanyDocumentsPanel />
      </PageContainer>
    </main>
  );
}
