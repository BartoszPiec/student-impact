import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import CustomizePackageForm from "./customize-form";
import Link from "next/link";
import { ArrowLeft, Sparkles } from "lucide-react";

export default async function CustomizePackagePage(props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    const supabase = await createClient();

    // Verify User
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect("/auth");

    // Fetch Package
    const { data: pkg, error } = await supabase
        .from("service_packages")
        .select("*")
        .eq("id", params.id)
        .single();

    if (error || !pkg) {
        notFound();
    }

    return (
        <div className="min-h-screen bg-slate-50 pb-20 relative">
            {/* Header Background */}
            <div className="absolute top-0 left-0 w-full h-80 bg-gradient-to-r from-indigo-600 to-purple-600" />

            <div className="max-w-4xl mx-auto pt-8 px-4 sm:px-6 relative z-10">
                <Link
                    href={`/app/company/packages/${params.id}`}
                    className="inline-flex items-center text-sm font-medium text-white/80 hover:text-white mb-8 transition-colors bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full border border-white/10 hover:bg-white/20"
                >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Wróć do szczegółów pakietu
                </Link>

                <div className="mb-10 text-white">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-white/20 backdrop-blur-md rounded-lg border border-white/20">
                            <Sparkles className="w-6 h-6 text-white" />
                        </div>
                        <h1 className="text-4xl font-bold tracking-tight">Dostosuj zamówienie</h1>
                    </div>

                    <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20 inline-block min-w-full md:min-w-0 md:pr-12">
                        <p className="text-indigo-100 mb-1 font-medium uppercase tracking-wider text-xs">Wybrany pakiet</p>
                        <p className="text-2xl font-bold text-white mb-2">{pkg.title}</p>
                        <p className="text-sm text-indigo-100 opacity-90 leading-relaxed max-w-2xl">
                            Wypełnij poniższy formularz, abyśmy mogli dopasować realizację do Twoich unikalnych potrzeb.
                            Im więcej szczegółów podasz, tym lepszy efekt końcowy uzyskasz.
                        </p>
                    </div>
                </div>

                <div className="relative z-10">
                    <CustomizePackageForm
                        packageId={pkg.id}
                        packageTitle={pkg.title}
                        packageCategory={pkg.category || ""}
                    />
                </div>
            </div>
        </div>
    );
}
