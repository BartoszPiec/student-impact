import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";
import { redirect } from "next/navigation";
import CatalogClient from "./catalog-client";
import Link from "next/link";
import { getRequestContext } from "@/lib/auth/request-context";

export const dynamic = "force-dynamic";

// ── Full-bleed wrapper style ─────────────────────────────────
const fullBleedStyle = {
    width: '100vw',
    marginLeft: 'calc(-50vw + 50%)',
    marginTop: '-2rem', // adjust for layout padding
} as const;

export default async function ServicesCatalogPage() {
    const supabase = await createClient();
    const { user, role } = await getRequestContext();

    if (!user) redirect("/auth");

    const isCompany = role === "company";

    const { data: packageRows, error: packagesError } = await supabase
        .from("service_packages")
        .select("id, title, description, price, price_max, delivery_time_days, student_id, is_system, categories")
        .eq("status", "active")
        .order("is_system", { ascending: false }) // Systemowe najpierw
        .order("price", { ascending: true });

    if (packagesError) {
        throw new Error("Nie udało się pobrać katalogu usług.");
    }

    const studentIds = [...new Set((packageRows ?? []).flatMap((pkg) => pkg.student_id ? [pkg.student_id] : []))];
    const { data: studentRows, error: studentsError } = studentIds.length > 0
        ? await supabase
            .from("student_public_profiles")
            .select("user_id, public_name")
            .in("user_id", studentIds)
        : { data: [], error: null };

    if (studentsError) {
        throw new Error("Nie udało się pobrać autorów usług.");
    }

    const studentsById = new Map((studentRows ?? []).map((student) => [student.user_id, student]));
    const allPackages = (packageRows ?? []).map((pkg) => ({
        ...pkg,
        profiles: pkg.student_id ? studentsById.get(pkg.student_id) ?? null : null,
    }));

    return (
        <main className="space-y-8 pb-20">
            {/* HERO SECTION */}
            <div style={fullBleedStyle} className="relative bg-gradient-to-br from-gray-900 via-slate-800 to-gray-900 px-6 sm:px-12 lg:px-24 py-16 text-white shadow-xl overflow-hidden mb-12">
                <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-10"></div>
                <div className="relative z-10 w-full max-w-[2000px] mx-auto">
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
                                <Link href="/app/company/packages">Twoje Zamówienia →</Link>
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
