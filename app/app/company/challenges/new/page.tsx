import { redirect } from "next/navigation";
import { SearchCheck } from "lucide-react";

import { PageContainer } from "@/components/ui/page-container";
import { getRequestContext } from "@/lib/auth/request-context";
import { ChallengeForm } from "./challenge-form";
import { CompanyHero } from "../../_components/company-dashboard-ui";

export default async function NewChallengePage() {
  const { user, role } = await getRequestContext();

  if (!user) redirect("/auth?tab=register&role=company");
  if (role !== "company") redirect("/app");

  return (
    <main className="min-h-screen bg-slate-50/60 pb-16">
      <CompanyHero
        badge="Panel firmy"
        title="Zgłoś wyzwanie"
        description="Masz nietypowe zadanie, którego nie ma w katalogu? Opisz je, a my wybierzemy wykonawcę i przygotujemy wycenę."
        icon={SearchCheck}
      />

      <PageContainer className="py-5">
        <ChallengeForm />
      </PageContainer>
    </main>
  );
}
