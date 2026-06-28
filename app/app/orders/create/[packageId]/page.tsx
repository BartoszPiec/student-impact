import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import {
    Coins,
    Clock,
    Sparkles,
    Star,
    ArrowLeft,
    ShieldCheck,
    Clapperboard,
    Palette,
    Code,
    PenTool,
    Megaphone,
    BarChart3,
    Briefcase,
    Globe,
    Languages,
    Scale,
    TrendingUp,
    Cpu
} from "lucide-react";
import OrderForm from "./order-form";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import Link from "next/link";
import { resolveJobCategorySlug } from "@/lib/constants";

const categoryConfig: Record<string, { icon: React.ReactNode; gradient: string; lightBg: string; darkText: string }> = {
    "marketing-i-social-media": {
        icon: <Megaphone className="w-8 h-8" />,
        gradient: "from-blue-500 to-indigo-600",
        lightBg: "bg-blue-50",
        darkText: "text-blue-600"
    },
    "e-commerce-i-marketplace": {
        icon: <TrendingUp className="w-8 h-8" />,
        gradient: "from-yellow-500 to-amber-600",
        lightBg: "bg-yellow-50",
        darkText: "text-yellow-600"
    },
    "strony-internetowe-i-cms": {
        icon: <Globe className="w-8 h-8" />,
        gradient: "from-teal-500 to-cyan-600",
        lightBg: "bg-teal-50",
        darkText: "text-teal-600"
    },
    "seo-i-tresci": {
        icon: <PenTool className="w-8 h-8" />,
        gradient: "from-emerald-500 to-teal-600",
        lightBg: "bg-emerald-50",
        darkText: "text-emerald-600"
    },
    "grafika-i-materialy-sprzedazowe": {
        icon: <Palette className="w-8 h-8" />,
        gradient: "from-violet-500 to-purple-600",
        lightBg: "bg-violet-50",
        darkText: "text-violet-600"
    },
    "wideo-i-ugc": {
        icon: <Clapperboard className="w-8 h-8" />,
        gradient: "from-rose-500 to-orange-500",
        lightBg: "bg-rose-50",
        darkText: "text-rose-600"
    },
    "dane-research-analizy": {
        icon: <BarChart3 className="w-8 h-8" />,
        gradient: "from-amber-500 to-orange-600",
        lightBg: "bg-amber-50",
        darkText: "text-amber-600"
    },
    "automatyzacje-ai-narzedzia": {
        icon: <Cpu className="w-8 h-8" />,
        gradient: "from-purple-600 to-pink-600",
        lightBg: "bg-purple-50",
        darkText: "text-purple-600"
    },
    "administracja-i-operacje": {
        icon: <Briefcase className="w-8 h-8" />,
        gradient: "from-stone-500 to-stone-700",
        lightBg: "bg-stone-50",
        darkText: "text-stone-600"
    },
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
    const key = resolveJobCategorySlug(category) ?? category.toLowerCase();
    return categoryConfig[key] || categoryConfig.default;
}

export default async function CreateOrderPage({
    params,
}: {
    params: Promise<{ packageId: string }>;
}) {
    const { packageId } = await params;
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect("/auth");

    const { data: profile } = await supabase.from("profiles").select("role").eq("user_id", user.id).maybeSingle();
    if (profile?.role !== "company") redirect("/app");

    const [companyProfileResult, packageResult] = await Promise.all([
        supabase
            .from("company_profiles")
            .select("website")
            .eq("user_id", user.id)
            .single(),
        supabase
            .from("service_packages")
            .select("id, title, description, category, price, price_max, delivery_time_days, form_schema, student_id")
            .eq("id", packageId)
            .single(),
    ]);
    const companyProfile = companyProfileResult.data;
    const pkg = packageResult.data;

    if (!pkg) return <div>Pakiet nie znaleziony.</div>;

    const config = getCategoryConfig(pkg.category);

    let studentName = "Student";
    let orderCount = 0;
    let avgRating = 0;
    let reviewCount = 0;

    if (pkg.student_id) {
        const [studentResult, ordersResult, reviewsResult] = await Promise.all([
            supabase.from("student_profiles").select("public_name").eq("user_id", pkg.student_id).single(),
            supabase.from("service_orders").select("id", { count: "exact", head: true }).eq("student_id", pkg.student_id),
            supabase.from("reviews").select("rating").eq("reviewee_id", pkg.student_id),
        ]);

        const sp = studentResult.data;
        if (sp?.public_name) {
            studentName = sp.public_name;
        }

        orderCount = ordersResult.count ?? 0;

        const revs = reviewsResult.data;
        if (revs && revs.length > 0) {
            const sum = revs.reduce((a, b) => a + b.rating, 0);
            avgRating = parseFloat((sum / revs.length).toFixed(1));
            reviewCount = revs.length;
        }
    }

    return (
        <main className="min-h-screen bg-slate-50/50 pb-20">
            <div className={`relative overflow-hidden bg-gradient-to-br ${config.gradient} pb-32 pt-12`}>
                <div className="absolute inset-0 overflow-hidden">
                    <div className="absolute -top-40 -right-40 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
                    <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-white/10 rounded-full blur-3xl"></div>

                    <div className="absolute top-20 left-20 w-4 h-4 bg-white/20 rounded-full animate-bounce" style={{ animationDuration: '3s' }}></div>
                    <div className="absolute top-40 right-1/4 w-6 h-6 bg-white/10 rounded-lg rotate-45 animate-pulse"></div>
                </div>

                <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <Link href="/app/company/packages?tab=student" className="inline-flex items-center text-sm font-medium text-white/80 hover:text-white mb-8 transition-colors bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full border border-white/20">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Anuluj i wróć
                    </Link>

                    <div className="max-w-4xl">
                        <div className="flex flex-wrap items-center gap-4 mb-6">
                            <Badge className="bg-white/20 backdrop-blur-md border-0 text-white text-sm font-semibold px-4 py-1.5">
                                <Sparkles className="w-4 h-4 mr-1.5" />
                                Nowe Zlecenie
                            </Badge>
                            {avgRating > 0 && (
                                <Badge className="bg-amber-400/20 backdrop-blur-md border border-amber-300/30 text-amber-100 text-sm font-semibold px-4 py-1.5">
                                    <Star className="w-3.5 h-3.5 mr-1.5 fill-amber-300 text-amber-300" />
                                    {avgRating} ({reviewCount})
                                </Badge>
                            )}
                        </div>

                        <h1 className="text-3xl md:text-5xl font-extrabold text-white mb-4 leading-tight">
                            Zamawiasz: {pkg.title}
                        </h1>
                        <p className="text-lg md:text-xl text-white/80 max-w-2xl leading-relaxed font-light">
                            {pkg.description}
                        </p>
                    </div>
                </div>
            </div>

            <div className="w-full max-w-[2000px] mx-auto px-4 sm:px-6 lg:px-8 -mt-20 relative z-20">
                <div className="grid gap-8 lg:grid-cols-3">
                    <div className="lg:col-span-2 space-y-8">
                        <div className="bg-white rounded-[2.5rem] p-8 md:p-10 border border-slate-100 shadow-xl shadow-slate-200/50">
                            <h2 className="text-2xl font-bold text-slate-900 mb-8 flex items-center gap-3">
                                <span className={`p-2 rounded-xl ${config.lightBg} ${config.darkText}`}>
                                    <PenTool className="w-6 h-6" />
                                </span>
                                Szczegóły Zlecenia
                            </h2>
                            <OrderForm
                                packageId={pkg.id}
                                title={pkg.title}
                                description={pkg.description}
                                formSchema={pkg.form_schema}
                                defaultEmail={user.email}
                                defaultWebsite={companyProfile?.website || ""}
                            />
                        </div>
                    </div>

                    <div className="space-y-6 lg:col-span-1">

                        <div className="sticky top-6">
                            {pkg.student_id && (
                                <div className="bg-white rounded-[2rem] p-6 border border-slate-200 shadow-lg mb-6">
                                    <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Wykonawca</div>
                                    <div className="flex items-center gap-4">
                                        <Avatar className="h-16 w-16 border-2 border-slate-100 shadow-sm">
                                            <AvatarFallback className={`text-xl font-bold bg-gradient-to-br ${config.gradient} text-white`}>
                                                {studentName.charAt(0)}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <h4 className="text-lg font-bold text-slate-900 leading-tight">{studentName}</h4>
                                            <Link href={`/app/students/${pkg.student_id}`} className="text-sm text-indigo-600 hover:text-indigo-800 font-medium hover:underline mt-1 block">
                                                Zobacz profil
                                            </Link>
                                        </div>
                                    </div>

                                    <div className="mt-6 pt-6 border-t border-slate-100 grid grid-cols-2 gap-4">
                                        <div className="bg-slate-50 rounded-xl p-3 text-center">
                                            <div className="text-xs text-slate-500 mb-1">Zrealizowano</div>
                                            <div className="font-bold text-slate-900">{orderCount} zleceń</div>
                                        </div>
                                        <div className="bg-slate-50 rounded-xl p-3 text-center">
                                            <div className="text-xs text-slate-500 mb-1">Ocena</div>
                                            <div className="font-bold text-slate-900 flex items-center justify-center gap-1">
                                                <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                                                {avgRating > 0 ? avgRating : "-"}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="bg-white rounded-[2rem] border border-slate-200 p-8 shadow-2xl shadow-indigo-500/10 backdrop-blur-xl relative overflow-hidden">
                                <div className={`absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r ${config.gradient}`}></div>

                                <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6">Podsumowanie</div>

                                <div className="space-y-4">
                                    <div className="flex justify-between items-end pb-4 border-b border-slate-100">
                                        <span className="text-slate-500 flex items-center gap-2 text-sm font-medium">
                                            <Coins className="h-4 w-4" /> Budżet
                                        </span>
                                        <div className="text-right">
                                            <span className="font-extrabold text-2xl text-slate-900">
                                                {pkg.price}
                                            </span>
                                            <span className="text-sm font-medium text-slate-400 ml-1">PLN</span>
                                            {pkg.price_max && (
                                                <div className="text-xs text-slate-400">do {pkg.price_max} PLN</div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex justify-between items-center py-2">
                                        <span className="text-slate-500 flex items-center gap-2 text-sm font-medium">
                                            <Clock className="h-4 w-4" /> Czas realizacji
                                        </span>
                                        <span className="font-bold text-slate-900 bg-slate-50 px-3 py-1 rounded-lg border border-slate-100">
                                            {pkg.delivery_time_days} dni
                                        </span>
                                    </div>
                                </div>

                                <div className="mt-8 pt-4 border-t border-slate-100">
                                    <div className="flex items-start gap-3 bg-emerald-50 p-3 rounded-xl">
                                        <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                                        <p className="text-xs text-emerald-800 leading-relaxed">
                                            <strong>Bezpieczna transakcja.</strong> Środki są zamrożone do momentu akceptacji przez Ciebie wykonanej pracy.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
