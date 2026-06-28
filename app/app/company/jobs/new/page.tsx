import { redirect } from "next/navigation";
import { Plus } from "lucide-react";
import JobCreationWizard from "./job-creation-wizard";
import { PageContainer } from "@/components/ui/page-container";
import { getRequestContext } from "@/lib/auth/request-context";
import { CompanyHero } from "../../_components/company-dashboard-ui";

export default async function NewJobPage() {
    const { user, role } = await getRequestContext();

    if (!user) redirect("/auth");
    if (role !== "company") redirect("/app");

    return (
        <main className="pb-20">
            <CompanyHero
                tourId="company-create-offer"
                title="Dodaj ofertę"
                description="Wybierz, jak chcesz delegować zadanie. Każda ścieżka jest objęta depozytem Student2Work i kontrolą jakości."
                badge="Panel firmy"
                icon={Plus}
            />

            <PageContainer className="py-5">
                <JobCreationWizard />
            </PageContainer>
        </main>
    );
}
