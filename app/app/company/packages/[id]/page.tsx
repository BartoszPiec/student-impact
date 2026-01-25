import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    ArrowLeft,
    CheckCircle2,
    Timer,
    ShieldCheck,
    Sparkles,
    Clock,
    Coins,
    Clapperboard,
    Palette,
    Code,
    PenTool,
    Megaphone,
    BarChart3,
    Languages,
    Scale,
    TrendingUp,
    Cpu,
    ArrowRight,
    Star,
    Zap,
    Shield,
    Users
} from "lucide-react";

export const dynamic = "force-dynamic";

// Configuration for category-specific styles
const categoryConfig: Record<string, { icon: React.ReactNode; gradient: string; lightBg: string; darkText: string }> = {
    "video": {
        icon: <Clapperboard className="w-8 h-8" />,
        gradient: "from-rose-500 to-orange-500",
        lightBg: "bg-rose-50",
        darkText: "text-rose-600"
    },
    "grafika": {
        icon: <Palette className="w-8 h-8" />,
        gradient: "from-violet-500 to-purple-600",
        lightBg: "bg-violet-50",
        darkText: "text-violet-600"
    },
    "it": {
        icon: <Code className="w-8 h-8" />,
        gradient: "from-cyan-500 to-blue-600",
        lightBg: "bg-cyan-50",
        darkText: "text-cyan-600"
    },
    "content": {
        icon: <PenTool className="w-8 h-8" />,
        gradient: "from-emerald-500 to-teal-600",
        lightBg: "bg-emerald-50",
        darkText: "text-emerald-600"
    },
    "marketing": {
        icon: <Megaphone className="w-8 h-8" />,
        gradient: "from-blue-500 to-indigo-600",
        lightBg: "bg-blue-50",
        darkText: "text-blue-600"
    },
    "analiza": {
        icon: <BarChart3 className="w-8 h-8" />,
        gradient: "from-amber-500 to-orange-600",
        lightBg: "bg-amber-50",
        darkText: "text-amber-600"
    },
    "tlumaczenia": {
        icon: <Languages className="w-8 h-8" />,
        gradient: "from-green-500 to-emerald-600",
        lightBg: "bg-green-50",
        darkText: "text-green-600"
    },
    "prawo": {
        icon: <Scale className="w-8 h-8" />,
        gradient: "from-slate-600 to-gray-700",
        lightBg: "bg-slate-50",
        darkText: "text-slate-600"
    },
    "finanse": {
        icon: <TrendingUp className="w-8 h-8" />,
        gradient: "from-yellow-500 to-amber-600",
        lightBg: "bg-yellow-50",
        darkText: "text-yellow-600"
    },
    "ai": {
        icon: <Cpu className="w-8 h-8" />,
        gradient: "from-purple-600 to-pink-600",
        lightBg: "bg-purple-50",
        darkText: "text-purple-600"
    },
    "default": {
        icon: <Sparkles className="w-8 h-8" />,
        gradient: "from-[#667eea] to-[#764ba2]",
        lightBg: "bg-indigo-50",
        darkText: "text-[#667eea]"
    }
};

function getCategoryConfig(category: string | null) {
    if (!category) return categoryConfig.default;
    const key = category.toLowerCase();
    return categoryConfig[key] || categoryConfig.default;
}

export default async function PackageDetailsPage(props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    const supabase = await createClient();

    const { data: pkg, error } = await supabase
        .from("service_packages")
        .select(`
            *,
            student:student_profiles (
                public_name
            )
        `)
        .eq("id", params.id)
        .single();

    if (error || !pkg) {
        notFound();
    }

    const config = getCategoryConfig(pkg.category);

    // Predefined benefits/process steps (mocked for now, or could be in DB)
    const features = [
        "Pełna obsługa od A do Z",
        "Weryfikacja jakości przez system",
        "Bezpieczna płatność po realizacji",
        "Faktura VAT (po stronie platformy/studenta)"
    ];

    const steps = [
        { title: "Złożenie zamówienia", desc: "Klikasz i tworzysz draft zlecenia." },
        { title: "Dopasowanie wykonawcy", desc: "System dobiera najlepszego studenta." },
        { title: "Realizacja", desc: "Student wykonuje pracę w terminie." },
        { title: "Akceptacja", desc: "Otrzymujesz pliki i akceptujesz jakość." }
    ];

    return (
        <div className="min-h-screen bg-slate-50/50 pb-20">
            {/* Dynamic Hero Section */}
            <div className={`relative overflow-hidden bg-gradient-to-br ${config.gradient} pb-32 pt-12`}>
                {/* Animated Background Elements */}
                <div className="absolute inset-0 overflow-hidden">
                    <div className="absolute -top-40 -right-40 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
                    <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-white/10 rounded-full blur-3xl"></div>

                    {/* Floating shapes */}
                    <div className="absolute top-20 left-20 w-4 h-4 bg-white/20 rounded-full animate-bounce" style={{ animationDuration: '3s' }}></div>
                    <div className="absolute top-40 right-1/4 w-6 h-6 bg-white/10 rounded-lg rotate-45 animate-pulse"></div>
                </div>

                <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Back Link */}
                    <Link href="/app/company/packages" className="inline-flex items-center text-sm font-medium text-white/80 hover:text-white mb-8 transition-colors bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full border border-white/20">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Wróć do katalogu
                    </Link>

                    <div className="max-w-4xl">
                        <div className="flex flex-wrap items-center gap-4 mb-6">
                            <Badge className="bg-white/20 backdrop-blur-md border-0 text-white text-sm font-semibold px-4 py-1.5">
                                <Zap className="w-4 h-4 mr-1.5" />
                                {pkg.category || "Usługa Systemowa"}
                            </Badge>
                            {pkg.type === 'student_gig' && (
                                <Badge className="bg-blue-500/30 backdrop-blur-md border border-blue-400/30 text-white text-sm font-semibold px-4 py-1.5">
                                    <Users className="w-4 h-4 mr-1.5" />
                                    Oferta Studenta
                                </Badge>
                            )}
                        </div>

                        <h1 className="text-4xl md:text-6xl font-extrabold text-white mb-6 leading-tight">
                            {pkg.title}
                        </h1>
                        <p className="text-xl md:text-2xl text-white/80 max-w-3xl leading-relaxed font-light">
                            {pkg.description}
                        </p>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-20 relative z-20">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* LEFT COLUMN: Main Content */}
                    <div className="lg:col-span-2 space-y-8">

                        {/* Features / What's included */}
                        <div className="bg-white rounded-[2.5rem] p-8 md:p-10 border border-slate-100 shadow-xl shadow-slate-200/50">
                            <h3 className="text-2xl font-bold text-slate-900 mb-8 flex items-center gap-3">
                                <span className={`p-2 rounded-xl ${config.lightBg} ${config.darkText}`}>
                                    <Sparkles className="w-6 h-6" />
                                </span>
                                Co otrzymujesz w pakiecie?
                            </h3>
                            <ul className="grid gap-5">
                                {features.map((feat, i) => (
                                    <li key={i} className="group flex items-start gap-4 text-slate-700 bg-slate-50 hover:bg-white p-4 rounded-2xl transition-all hover:shadow-md border border-transparent hover:border-slate-100">
                                        <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-110 transition-transform">
                                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                        </div>
                                        <span className="font-medium">{feat}</span>
                                    </li>
                                ))}
                                <li className="flex items-start gap-4 text-slate-900 bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100">
                                    <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center shrink-0 mt-0.5">
                                        <Timer className="w-4 h-4 text-emerald-600" />
                                    </div>
                                    <span>Gwarantowany termin realizacji: <span className="font-bold text-emerald-700">{pkg.delivery_time_days} dni</span></span>
                                </li>
                            </ul>
                        </div>

                        {/* Process Steps */}
                        <div className="bg-white rounded-[2.5rem] p-8 md:p-10 border border-slate-100 shadow-xl shadow-slate-200/50">
                            <h3 className="text-2xl font-bold text-slate-900 mb-8 flex items-center gap-3">
                                <span className="p-2 rounded-xl bg-blue-50 text-blue-600">
                                    <Clock className="w-6 h-6" />
                                </span>
                                Jak wygląda proces?
                            </h3>
                            <div className="relative">
                                {/* Connector Line */}
                                <div className="absolute left-[27px] top-4 bottom-4 w-0.5 bg-slate-100 md:hidden"></div>

                                <div className="grid gap-6 md:grid-cols-2">
                                    {steps.map((step, i) => (
                                        <div key={i} className="relative bg-white rounded-2xl p-6 border-2 border-slate-100 hover:border-indigo-100 hover:shadow-lg transition-all group">
                                            <div className="absolute -top-3 -right-3 w-8 h-8 bg-slate-100 text-slate-500 rounded-lg flex items-center justify-center font-bold text-sm shadow-sm group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                                {i + 1}
                                            </div>
                                            <div className="font-bold text-slate-900 text-lg mb-2 group-hover:text-indigo-700 transition-colors">{step.title}</div>
                                            <div className="text-slate-500 leading-relaxed">{step.desc}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT COLUMN: Sidebar / Action Card */}
                    <div className="lg:col-span-1">
                        <div className="sticky top-24">
                            <div className="bg-white rounded-[2rem] border border-slate-200 p-8 shadow-2xl shadow-indigo-500/10 backdrop-blur-xl relative overflow-hidden">

                                {/* Top decoration */}
                                <div className={`absolute top-0 inset-x-0 h-2 bg-gradient-to-r ${config.gradient}`}></div>

                                <div className="mb-8 text-center">
                                    <div className="text-sm text-slate-500 font-medium mb-2 uppercase tracking-wide">Całkowity koszt</div>
                                    <div className="flex items-baseline justify-center gap-2">
                                        <span className="text-5xl font-extrabold text-slate-900 tracking-tight">{pkg.price}</span>
                                        <span className="text-xl font-medium text-slate-400">PLN</span>
                                    </div>
                                    <div className="mt-4 flex items-center justify-center gap-2 text-sm font-semibold text-emerald-700 bg-emerald-50 rounded-full px-4 py-2 w-fit mx-auto border border-emerald-100">
                                        <ShieldCheck className="w-4 h-4" />
                                        Gwarancja satysfakcji
                                    </div>
                                </div>

                                <div className="space-y-6 mb-8">
                                    <div className="flex justify-between items-center py-3 border-b border-slate-100">
                                        <span className="text-slate-500 flex items-center gap-3 font-medium">
                                            <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400">
                                                <Timer className="w-4 h-4" />
                                            </div>
                                            Czas realizacji
                                        </span>
                                        <span className="font-bold text-slate-900">{pkg.delivery_time_days} dni</span>
                                    </div>
                                    <div className="flex justify-between items-center py-3 border-b border-slate-100">
                                        <span className="text-slate-500 flex items-center gap-3 font-medium">
                                            <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400">
                                                <Coins className="w-4 h-4" />
                                            </div>
                                            Płatność
                                        </span>
                                        <span className="font-bold text-slate-900">Po akceptacji</span>
                                    </div>
                                    <div className="flex justify-between items-center py-3">
                                        <span className="text-slate-500 flex items-center gap-3 font-medium">
                                            <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400">
                                                <Shield className="w-4 h-4" />
                                            </div>
                                            Bezpieczeństwo
                                        </span>
                                        <span className="font-bold text-slate-900">Escrow</span>
                                    </div>
                                </div>

                                <Button asChild className={`w-full h-auto py-4 text-lg bg-gradient-to-r ${config.gradient} hover:shadow-xl hover:shadow-indigo-500/30 hover:scale-[1.02] transition-all duration-300 rounded-xl`}>
                                    <Link href={`/app/company/packages/${pkg.id}/customize`}>
                                        Zamawiam Pakiet
                                        <ArrowRight className="ml-2 w-5 h-5" />
                                    </Link>
                                </Button>

                                <div className="mt-6 text-center">
                                    <p className="text-xs text-slate-400 leading-tight">
                                        Klikając przycisk, przejdziesz do konfiguracji szczegółów zamówienia.
                                    </p>
                                </div>
                            </div>

                            {/* Student Profile Card (if student gig) */}
                            {pkg.type === 'student_gig' && pkg.student && (
                                <div className="mt-6 bg-white rounded-3xl p-6 border border-slate-100 shadow-lg flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center font-bold text-xl text-slate-400">
                                        {pkg.student.public_name[0]}
                                    </div>
                                    <div>
                                        <div className="text-xs text-slate-500 uppercase font-bold tracking-wider">Realizuje</div>
                                        <div className="font-bold text-slate-900">{pkg.student.public_name}</div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

