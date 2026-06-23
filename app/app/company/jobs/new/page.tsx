import { redirect } from "next/navigation";
import { Briefcase } from "lucide-react";
import JobCreationWizard from "./job-creation-wizard";
import { PremiumPageHeader } from "@/components/ui/premium-page-header";
import { PageContainer } from "@/components/ui/page-container";
import { getRequestContext } from "@/lib/auth/request-context";

export default async function NewJobPage() {
    const { user, role } = await getRequestContext();

    if (!user) redirect("/auth");
    if (role !== "company") redirect("/app");

    return (
        <main className="pb-20">
            <PremiumPageHeader
                tourId="company-create-offer"
                title="Dodaj ogloszenie"
                description="Wybierz typ współpracy i przygotuj brief, który ułatwi aplikowanie, negocjacje i dalsza współpracę."
                badge="Strefa Rekrutera"
                icon={<Briefcase className="w-10 h-10" />}
            />

            <PageContainer>
                <JobCreationWizard />
            </PageContainer>
        </main>
    );
}
