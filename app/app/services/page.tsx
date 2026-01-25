import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";
import { redirect } from "next/navigation";
import CatalogClient from "./catalog-client";

export const dynamic = "force-dynamic";

export default async function ServicesCatalogPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) redirect("/auth");

    const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("user_id", user.id)
        .single();

    const isCompany = profile?.role === "company";

    // Pobierz WSZYSTKIE pakiety (systemowe i studenckie)
    const { data: allPackages } = await supabase
        .from("service_packages")
        .select(`
            *,
            price_max,
            profiles:student_id (
                imie, nazwisko, avatar_url
            )
        `)
        .eq("status", "active")
        .order("is_system", { ascending: false }) // Systemowe najpierw
        .order("price", { ascending: true });

    return (
        <main className="space-y-8 pb-20">
            {/* HERO SECTION */}
            <div className="relative rounded-3xl bg-gradient-to-br from-gray-900 via-slate-800 to-gray-900 px-6 py-12 text-white shadow-xl overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10"></div>
                <div className="relative z-10 max-w-2xl">
                    <Badge variant="outline" className="mb-4 border-white/20 text-indigo-300 bg-white/5 backdrop-blur-sm px-3 py-1">
                        <Sparkles className="mr-2 h-3.5 w-3.5" />
                        Katalog Rozwiązań
                    </Badge>
                    <h1 className="text-3xl font-bold sm:text-4xl mb-4">
                        {isCompany ? "Gotowe Rozwiązania dla Twojej Firmy" : "Zainspiruj się Gotowymi Rozwiązaniami"}
                    </h1>
                    <p className="text-slate-300 text-lg">
                        {isCompany
                            ? "Wybierz sprawdzone pakiety systemowe lub unikalne usługi oferowane bezpośrednio przez utalentowanych studentów."
                            : "Przeglądaj pakiety i zobacz, jak inni studenci wyceniają swoje umiejętności."
                        }
                    </p>

                    {isCompany && (
                        <div className="mt-8 flex flex-wrap gap-4">
                            <Button asChild variant="secondary" className="bg-white/10 hover:bg-white/20 text-white border-none backdrop-blur-md">
                                <a href="/app/company/packages">Twoje Zamówienia →</a>
                            </Button>
                        </div>
                    )}
                </div>
                {/* Decorative elements */}
                <div className="absolute right-0 top-0 -mt-10 -mr-10 h-64 w-64 rounded-full bg-indigo-500/20 blur-3xl"></div>
                <div className="absolute bottom-0 right-20 -mb-10 h-40 w-40 rounded-full bg-violet-500/20 blur-2xl"></div>
            </div>

            {/* CLIENT CATALOG WITH TABS */}
            <CatalogClient packages={allPackages || []} isCompany={isCompany} />
        </main>
    );
}
