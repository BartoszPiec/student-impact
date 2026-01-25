import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Briefcase, Sparkles } from "lucide-react";
import JobCreationWizard from "./job-creation-wizard";

export default async function NewJobPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) redirect("/auth");

    // Sprawdź czy to firma
    const { data: profile } = await supabase.from("profiles").select("role").eq("user_id", user.id).single();
    if (profile?.role !== "company") redirect("/app");

    return (
        <main className="max-w-5xl mx-auto space-y-8 pb-20">
            {/* Header */}
            <div className="relative rounded-3xl bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 p-8 text-white overflow-hidden shadow-xl">
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                    <div>
                        <Badge variant="secondary" className="bg-white/20 text-white border-none mb-4 backdrop-blur-md">
                            <Briefcase className="mr-2 h-3 w-3" />
                            Strefa Rekrutera
                        </Badge>
                        <h1 className="text-3xl font-bold mb-2 text-white shadow-black/10 drop-shadow-sm">Dodaj Ogłoszenie</h1>
                        <p className="text-indigo-100 opacity-90 max-w-xl">
                            Wybierz rodzaj ogłoszenia. Możesz zlecić szybkie zadanie (mikrozlecenie) lub znaleźć stażystę na dłuższą metę.
                        </p>
                    </div>
                    <div className="hidden md:block opacity-80 rotate-12 transform translate-y-4 translate-x-4">
                        <Sparkles className="h-24 w-24 text-white/20" />
                    </div>
                </div>
            </div>

            <JobCreationWizard />
        </main>
    );
}
