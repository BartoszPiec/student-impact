import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import CustomizePackageForm from "./customize-form";
import Link from "next/link";
import { ArrowLeft, Sparkles, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const categoryGradients: Record<string, string> = {
    "multimedia": "from-rose-500 to-orange-500",
    "design": "from-violet-500 to-purple-600",
    "programowanie i it": "from-cyan-500 to-blue-600",
    "serwisy internetowe": "from-teal-500 to-cyan-600",
    "copywriting": "from-emerald-500 to-teal-600",
    "marketing": "from-blue-500 to-indigo-600",
    "analiza danych": "from-amber-500 to-orange-600",
    "tłumaczenia": "from-green-500 to-emerald-600",
    "prawo": "from-slate-600 to-gray-700",
    "prace biurowe": "from-stone-500 to-stone-700",
    "usprawnienia ai": "from-purple-600 to-pink-600",
    "inne prace": "from-gray-500 to-slate-600",
    "default": "from-[#667eea] to-[#764ba2]"
};

function getGradient(category: string | null) {
    if (!category) return categoryGradients.default;
    return categoryGradients[category.toLowerCase()] || categoryGradients.default;
}

// ── Full-bleed wrapper style ─────────────────────────────────
// Breaks out of parent <main className="mx-auto max-w-7xl p-4">
const fullBleedStyle = {
    width: '100vw',
    marginLeft: 'calc(-50vw + 50%)',
    marginTop: '-1rem',
} as const;

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

    const gradient = getGradient(pkg.category);

    return (
        <div style={fullBleedStyle} className="min-h-screen bg-slate-50/50 pb-20 font-sans">
            {/* ═══ PREMIUM DARK HERO ═══ */}
            <div className="relative overflow-hidden bg-[#0a0f1c] pb-32 pt-16">
                {/* Abstract Glowing Orbs in Background */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className={`absolute top-[-20%] left-[-10%] w-[50%] h-[80%] rounded-full opacity-20 blur-[120px] bg-gradient-to-br ${gradient}`} />
                    <div className={`absolute bottom-[-20%] right-[-10%] w-[40%] h-[60%] rounded-full opacity-20 blur-[100px] bg-gradient-to-tl ${gradient}`} />
                    
                    {/* Grid Pattern Overlay */}
                    <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-[0.03] bg-repeat" />
                </div>

                <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6">
                    <Link
                        href={`/app/company/packages/${params.id}`}
                        className="inline-flex items-center text-sm font-medium text-slate-300 hover:text-white mb-10 transition-colors group bg-white/5 backdrop-blur-md px-5 py-2.5 rounded-full border border-white/10 hover:bg-white/10"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
                        Wróć do szczegółów pakietu
                    </Link>

                    <div className="mb-2 text-white">
                        <div className="flex flex-wrap items-center gap-3 mb-6">
                            <Badge className="bg-white/10 backdrop-blur-md border border-white/10 text-white text-sm font-medium px-4 py-1.5 rounded-full shadow-[0_0_20px_rgba(255,255,255,0.05)]">
                                <Zap className="w-4 h-4 mr-1.5 opacity-80" />
                                {pkg.category || "Usługa Systemowa"}
                            </Badge>
                        </div>
                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-br from-white to-white/70 mb-6 leading-tight tracking-tight">
                            {pkg.title}
                        </h1>
                        <p className="text-xl md:text-2xl text-slate-300 leading-relaxed font-light">
                            Wypełnij formularz, abyśmy mogli dopasować cel, format i zakres realizacji do Twoich wymagań.
                        </p>
                    </div>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 sm:px-6 -mt-20 relative z-20">
                <CustomizePackageForm
                    packageId={pkg.id}
                    packageTitle={pkg.title}
                    packageCategory={pkg.category || ""}
                    gradient={gradient}
                />
            </div>
        </div>
    );
}
