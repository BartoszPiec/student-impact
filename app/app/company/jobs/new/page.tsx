import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Briefcase } from "lucide-react";
import JobCreationWizard from "./job-creation-wizard";
import { PremiumPageHeader } from "@/components/ui/premium-page-header";
import { PageContainer } from "@/components/ui/page-container";

export default async function NewJobPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) redirect("/auth");

    // Sprawdź czy to firma
    const { data: profile } = await supabase.from("profiles").select("role").eq("user_id", user.id).single();
    if (profile?.role !== "company") redirect("/app");

    return (
        <main className="pb-20">
            <PremiumPageHeader
                title="Dodaj Ogłoszenie"
                description="Wybierz rodzaj ogłoszenia. Możesz zlecić szybkie zadanie (mikrozlecenie) lub znaleźć stażystę na dłuższą metę."
                badge="Strefa Rekrutera"
                icon={<Briefcase className="w-10 h-10" />}
            />

            <PageContainer>
                <JobCreationWizard />
            </PageContainer>
        </main>
    );
}
