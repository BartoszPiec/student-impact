import { redirect } from "next/navigation";
import { Lightbulb } from "lucide-react";

import { PageContainer } from "@/components/ui/page-container";
import { PremiumPageHeader } from "@/components/ui/premium-page-header";
import { getRequestContext } from "@/lib/auth/request-context";
import { ChallengeForm } from "./challenge-form";

export default async function NewChallengePage() {
  const { user, role } = await getRequestContext();

  if (!user) redirect("/auth?tab=register&role=company");
  if (role !== "company") redirect("/app");

  return (
    <main className="min-h-screen bg-slate-50/60 pb-16">
      <PremiumPageHeader
        badge="Wyzwanie do wyceny"
        title="Daj studentom jedno zalegle zadanie"
        description="Uproszczony formularz dla firm: problem, miejsce problemu i budzet. Studenci wracaja z researchem, pitchem i kontroferta."
        icon={<Lightbulb className="h-10 w-10 text-amber-300 drop-shadow-[0_0_8px_rgba(251,191,36,0.55)]" />}
      />

      <PageContainer className="py-8">
        <ChallengeForm />
      </PageContainer>
    </main>
  );
}
