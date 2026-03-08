import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
    ArrowLeft,
    CheckCircle2,
    Timer,
    ShieldCheck,
    Sparkles,
    Coins,
    Clapperboard,
    Palette,
    Code,
    PenTool,
    Megaphone,
    BarChart3,
    Languages,
    Scale,
    Cpu,
    ArrowRight,
    Zap,
    Shield,
    Users,
    FileText,
    Briefcase,
    Globe,
    ShieldAlert,
    Package,
    Lightbulb
} from "lucide-react";

import { MarkdownLite } from "@/components/markdown-lite";
export const dynamic = "force-dynamic";

// ── Category config ──────────────────────────────────────────

const categoryConfig: Record<string, { icon: React.ReactNode; gradient: string; lightBg: string; darkText: string }> = {
    "multimedia": {
        icon: <Clapperboard className="w-8 h-8" />,
        gradient: "from-rose-500 to-orange-500",
        lightBg: "bg-rose-50",
        darkText: "text-rose-600"
    },
    "design": {
        icon: <Palette className="w-8 h-8" />,
        gradient: "from-violet-500 to-purple-600",
        lightBg: "bg-violet-50",
        darkText: "text-violet-600"
    },
    "programowanie i it": {
        icon: <Code className="w-8 h-8" />,
        gradient: "from-cyan-500 to-blue-600",
        lightBg: "bg-cyan-50",
        darkText: "text-cyan-600"
    },
    "serwisy internetowe": {
        icon: <Globe className="w-8 h-8" />,
        gradient: "from-teal-500 to-cyan-600",
        lightBg: "bg-teal-50",
        darkText: "text-teal-600"
    },
    "copywriting": {
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
    "analiza danych": {
        icon: <BarChart3 className="w-8 h-8" />,
        gradient: "from-amber-500 to-orange-600",
        lightBg: "bg-amber-50",
        darkText: "text-amber-600"
    },
    "t\u0142umaczenia": {
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
    "prace biurowe": {
        icon: <Briefcase className="w-8 h-8" />,
        gradient: "from-stone-500 to-stone-700",
        lightBg: "bg-stone-50",
        darkText: "text-stone-600"
    },
    "usprawnienia ai": {
        icon: <Cpu className="w-8 h-8" />,
        gradient: "from-purple-600 to-pink-600",
        lightBg: "bg-purple-50",
        darkText: "text-purple-600"
    },
    "inne prace": {
        icon: <FileText className="w-8 h-8" />,
        gradient: "from-gray-500 to-slate-600",
        lightBg: "bg-gray-50",
        darkText: "text-gray-600"
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

// ── Section splitting ────────────────────────────────────────

type SectionType = 'intro' | 'features' | 'pricing' | 'comparison'
    | 'requirements' | 'exclusions' | 'process' | 'deliverables' | 'default';

interface DescriptionSection {
    title: string;
    content: string;
    type: SectionType;
}

function detectSectionType(title: string): SectionType {
    const t = title.toLowerCase();
    if (t.includes('chodzi') || t.includes('czym jest') || t.includes('o usłudze') || t.includes('o pakiecie')) return 'intro';
    if ((t.includes('wybierz') && t.includes('pakiet')) || t.includes('wariant') || t.includes('cennik') || t === 'pakiety') return 'pricing';
    if (t.includes('cen') && (t.includes('rynk') || t.includes('tle') || t.includes('porównan'))) return 'comparison';
    if (t.includes('dostarcz') || t.includes('musisz') || t.includes('materiał') || t.includes('potrzeb')) return 'requirements';
    if (t.includes('nie obejmuj') || t.includes('nie zawiera') || t.includes('ograniczen')) return 'exclusions';
    if (t.includes('proces') || t.includes('etap') || t.includes('przebieg') || t.includes('jak to działa')) return 'process';
    if (t.includes('otrzym') || t.includes('dostaje') || t.includes('co dostajesz')) return 'deliverables';
    if (t.includes('analizow') || t.includes('zakres') || t.includes('co można') || t.includes('co obejmuje') || t.includes('możliw')) return 'features';
    return 'default';
}

function splitDescriptionIntoSections(description: string): { intro: string | null; sections: DescriptionSection[] } {
    const lines = description.split('\n');
    const introLines: string[] = [];
    const sections: DescriptionSection[] = [];
    let currentTitle: string | null = null;
    let currentLines: string[] = [];

    for (const line of lines) {
        const trimmed = line.trim();
        // ### header (but not ####)
        if (trimmed.startsWith('### ') && !trimmed.startsWith('#### ')) {
            if (currentTitle !== null) {
                sections.push({
                    title: currentTitle,
                    content: currentLines.join('\n').trim(),
                    type: detectSectionType(currentTitle)
                });
            }
            currentTitle = trimmed.replace(/^###\s*/, '');
            currentLines = [];
        } else if (currentTitle !== null) {
            currentLines.push(line);
        } else {
            introLines.push(line);
        }
    }

    // Last section
    if (currentTitle !== null) {
        sections.push({
            title: currentTitle,
            content: currentLines.join('\n').trim(),
            type: detectSectionType(currentTitle)
        });
    }

    const introText = introLines.join('\n').trim();
    return { intro: introText || null, sections };
}

// ── Section card config ──────────────────────────────────────

interface SectionCardConfig {
    icon: React.ReactNode;
    iconBg: string;
    iconColor: string;
    borderColor: string;
    listIcon: "check" | "x" | "arrow" | "dot";
    bgClass: string;
}

const SECTION_CONFIGS: Record<SectionType, SectionCardConfig> = {
    intro: {
        icon: <Lightbulb className="w-5 h-5" />,
        iconBg: 'bg-amber-100',
        iconColor: 'text-amber-600',
        borderColor: 'border-l-amber-400',
        listIcon: 'dot',
        bgClass: 'bg-gradient-to-br from-white to-amber-50/30'
    },
    features: {
        icon: <Sparkles className="w-5 h-5" />,
        iconBg: 'bg-emerald-100',
        iconColor: 'text-emerald-600',
        borderColor: 'border-l-emerald-400',
        listIcon: 'check',
        bgClass: 'bg-white'
    },
    pricing: {
        icon: <Package className="w-5 h-5" />,
        iconBg: 'bg-indigo-100',
        iconColor: 'text-indigo-600',
        borderColor: 'border-l-indigo-400',
        listIcon: 'dot',
        bgClass: 'bg-white'
    },
    comparison: {
        icon: <BarChart3 className="w-5 h-5" />,
        iconBg: 'bg-violet-100',
        iconColor: 'text-violet-600',
        borderColor: 'border-l-violet-400',
        listIcon: 'dot',
        bgClass: 'bg-gradient-to-br from-white to-violet-50/20'
    },
    requirements: {
        icon: <FileText className="w-5 h-5" />,
        iconBg: 'bg-blue-100',
        iconColor: 'text-blue-600',
        borderColor: 'border-l-blue-400',
        listIcon: 'arrow',
        bgClass: 'bg-white'
    },
    exclusions: {
        icon: <ShieldAlert className="w-5 h-5" />,
        iconBg: 'bg-red-100',
        iconColor: 'text-red-500',
        borderColor: 'border-l-red-300',
        listIcon: 'x',
        bgClass: 'bg-gradient-to-br from-white to-red-50/20'
    },
    process: {
        icon: <Timer className="w-5 h-5" />,
        iconBg: 'bg-cyan-100',
        iconColor: 'text-cyan-600',
        borderColor: 'border-l-cyan-400',
        listIcon: 'arrow',
        bgClass: 'bg-white'
    },
    deliverables: {
        icon: <CheckCircle2 className="w-5 h-5" />,
        iconBg: 'bg-emerald-100',
        iconColor: 'text-emerald-600',
        borderColor: 'border-l-emerald-400',
        listIcon: 'check',
        bgClass: 'bg-white'
    },
    default: {
        icon: <FileText className="w-5 h-5" />,
        iconBg: 'bg-slate-100',
        iconColor: 'text-slate-500',
        borderColor: 'border-l-slate-300',
        listIcon: 'dot',
        bgClass: 'bg-white'
    }
};

// ── Hero subtitle extraction ─────────────────────────────────

function extractHeroSubtitle(description: string | null): string {
    if (!description) return "Sprawdź szczegóły pakietu poniżej.";

    const lines = description.split("\n");
    for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;
        if (trimmed.startsWith("#")) continue;
        if (trimmed.startsWith("*")) continue;
        if (trimmed.startsWith("|")) continue;
        if (trimmed.length < 30) continue;

        const clean = trimmed.replace(/\*\*/g, "");
        if (clean.length <= 160) return clean;
        const truncated = clean.substring(0, 160);
        const lastSpace = truncated.lastIndexOf(" ");
        return (lastSpace > 100 ? truncated.substring(0, lastSpace) : truncated) + "...";
    }

    return "Sprawdź szczegóły pakietu poniżej.";
}

// ── Page component ───────────────────────────────────────────

export default async function PackageDetailsPage(props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    const supabase = await createClient();

    // SECURITY: Explicit column selection — never expose locked_content or commission_rate
    const { data: pkg, error } = await supabase
        .from("service_packages")
        .select(`
            id, title, description, price, price_max,
            delivery_time_days, student_id, is_system, type,
            category, variants, requires_nda, status,
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
    const heroSubtitle = extractHeroSubtitle(pkg.description);

    // Parse variants for display
    const variants = Array.isArray(pkg.variants) ? pkg.variants as Array<{
        name: string;
        label: string;
        price: number;
        delivery_time_days?: number;
        scope?: string;
    }> : null;

    const hasVariants = variants && variants.length > 0;

    // Get the public-facing description (without internal notes)
    const publicDescription = pkg.description
        ? pkg.description.split("--- [MATERIAŁY DLA WYKONAWCY] ---")[0].trim()
        : null;

    // Remove trailing "Student2Work" footer line if present
    const cleanDescription = publicDescription
        ? publicDescription.replace(/\nStudent2Work — Łączymy ambicje studentów z potrzebami firm$/, "").trim()
        : null;

    // Split into sections for card-based rendering
    const { intro: introText, sections } = cleanDescription
        ? splitDescriptionIntoSections(cleanDescription)
        : { intro: null, sections: [] };

    return (
        <div className="min-h-screen bg-slate-50/50 pb-20">
            {/* Dynamic Hero Section */}
            <div className={`relative overflow-hidden bg-gradient-to-br ${config.gradient} pb-32 pt-12`}>
                {/* Animated Background Elements */}
                <div className="absolute inset-0 overflow-hidden">
                    <div className="absolute -top-40 -right-40 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
                    <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-white/10 rounded-full blur-3xl"></div>
                    <div className="absolute top-20 left-20 w-4 h-4 bg-white/20 rounded-full animate-bounce" style={{ animationDuration: '3s' }}></div>
                    <div className="absolute top-40 right-1/4 w-6 h-6 bg-white/10 rounded-lg rotate-45 animate-pulse"></div>
                </div>

                <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <Link href="/app/company/packages" className="inline-flex items-center text-sm font-medium text-white/80 hover:text-white mb-8 transition-colors bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full border border-white/20">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Wróć do katalogu
                    </Link>

                    <div className="max-w-4xl">
                        <div className="flex flex-wrap items-center gap-3 mb-6">
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
                            {pkg.requires_nda && (
                                <Badge className="bg-red-500/30 backdrop-blur-md border border-red-400/30 text-white text-sm font-semibold px-4 py-1.5">
                                    <ShieldAlert className="w-4 h-4 mr-1.5" />
                                    Wymaga NDA
                                </Badge>
                            )}
                            {hasVariants && (
                                <Badge className="bg-amber-500/30 backdrop-blur-md border border-amber-400/30 text-white text-sm font-semibold px-4 py-1.5">
                                    <Package className="w-4 h-4 mr-1.5" />
                                    {variants!.length} warianty
                                </Badge>
                            )}
                        </div>
                        <h1 className="text-4xl md:text-6xl font-extrabold text-white mb-6 leading-tight">
                            {pkg.title}
                        </h1>
                        <p className="text-xl md:text-2xl text-white/80 max-w-3xl leading-relaxed font-light">
                            {heroSubtitle}
                        </p>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-20 relative z-20">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* LEFT COLUMN: Main Content */}
                    <div className="lg:col-span-2 space-y-6">

                        {/* Trust Signals — compact summary bar */}
                        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-lg shadow-slate-200/40">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="flex items-center gap-3 p-3 bg-emerald-50 rounded-xl">
                                    <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0">
                                        <ShieldCheck className="w-5 h-5 text-emerald-600" />
                                    </div>
                                    <div>
                                        <div className="text-xs text-emerald-600 font-semibold">Płatność</div>
                                        <div className="text-sm font-bold text-slate-900">Po akceptacji</div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl">
                                    <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                                        <Timer className="w-5 h-5 text-blue-600" />
                                    </div>
                                    <div>
                                        <div className="text-xs text-blue-600 font-semibold">Realizacja</div>
                                        <div className="text-sm font-bold text-slate-900">
                                            {hasVariants
                                                ? `${pkg.delivery_time_days}–${Math.max(...variants!.map(v => v.delivery_time_days || pkg.delivery_time_days))} dni`
                                                : `${pkg.delivery_time_days} dni`
                                            }
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 p-3 bg-violet-50 rounded-xl">
                                    <div className="w-10 h-10 rounded-lg bg-violet-100 flex items-center justify-center shrink-0">
                                        <Shield className="w-5 h-5 text-violet-600" />
                                    </div>
                                    <div>
                                        <div className="text-xs text-violet-600 font-semibold">Bezpieczeństwo</div>
                                        <div className="text-sm font-bold text-slate-900">Escrow</div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 p-3 bg-amber-50 rounded-xl">
                                    <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
                                        <CheckCircle2 className="w-5 h-5 text-amber-600" />
                                    </div>
                                    <div>
                                        <div className="text-xs text-amber-600 font-semibold">Gwarancja</div>
                                        <div className="text-sm font-bold text-slate-900">Satysfakcji</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Intro text before first ### (if any) */}
                        {introText && (
                            <div className="bg-white rounded-2xl p-6 md:p-8 border border-slate-100 shadow-lg shadow-slate-200/40">
                                <MarkdownLite content={introText} className="text-lg" />
                            </div>
                        )}

                        {/* Section cards */}
                        {sections.map((section, index) => {
                            const sConfig = SECTION_CONFIGS[section.type];
                            return (
                                <div
                                    key={index}
                                    className={cn(
                                        "rounded-2xl p-6 md:p-8 border border-slate-100 shadow-lg shadow-slate-200/40 border-l-4",
                                        sConfig.borderColor,
                                        sConfig.bgClass
                                    )}
                                >
                                    <div className="flex items-center gap-3 mb-5">
                                        <div className={cn(
                                            "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                                            sConfig.iconBg,
                                            sConfig.iconColor
                                        )}>
                                            {sConfig.icon}
                                        </div>
                                        <h2 className="text-xl font-bold text-slate-900">
                                            {section.title}
                                        </h2>
                                    </div>
                                    <MarkdownLite
                                        content={section.content}
                                        listIcon={sConfig.listIcon}
                                    />
                                </div>
                            );
                        })}

                        {/* Fallback: no sections found — render full description */}
                        {sections.length === 0 && cleanDescription && (
                            <div className="bg-white rounded-2xl p-6 md:p-8 border border-slate-100 shadow-lg shadow-slate-200/40">
                                <MarkdownLite content={cleanDescription} />
                            </div>
                        )}
                    </div>

                    {/* RIGHT COLUMN: Sidebar / Action Card */}
                    <div className="lg:col-span-1">
                        <div className="sticky top-24 space-y-6">
                            <div className="bg-white rounded-[2rem] border border-slate-200 p-8 shadow-2xl shadow-indigo-500/10 backdrop-blur-xl relative overflow-hidden">

                                {/* Top decoration */}
                                <div className={`absolute top-0 inset-x-0 h-2 bg-gradient-to-r ${config.gradient}`}></div>

                                <div className="mb-8 text-center">
                                    <div className="text-sm text-slate-500 font-medium mb-2 uppercase tracking-wide">
                                        {hasVariants ? "Cena od" : "Całkowity koszt"}
                                    </div>
                                    <div className="flex items-baseline justify-center gap-2">
                                        <span className="text-5xl font-extrabold text-slate-900 tracking-tight">{pkg.price}</span>
                                        <span className="text-xl font-medium text-slate-400">PLN</span>
                                    </div>
                                    {hasVariants && pkg.price_max && pkg.price_max > pkg.price && (
                                        <div className="mt-1 text-sm text-slate-500">
                                            do <span className="font-semibold">{pkg.price_max} PLN</span> (wariant L)
                                        </div>
                                    )}
                                    <div className="mt-4 flex items-center justify-center gap-2 text-sm font-semibold text-emerald-700 bg-emerald-50 rounded-full px-4 py-2 w-fit mx-auto border border-emerald-100">
                                        <ShieldCheck className="w-4 h-4" />
                                        Gwarancja satysfakcji
                                    </div>
                                </div>

                                <div className="space-y-4 mb-8">
                                    <div className="flex justify-between items-center py-3 border-b border-slate-100">
                                        <span className="text-slate-500 flex items-center gap-3 font-medium">
                                            <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400">
                                                <Timer className="w-4 h-4" />
                                            </div>
                                            Czas realizacji
                                        </span>
                                        <span className="font-bold text-slate-900">
                                            {hasVariants
                                                ? `${pkg.delivery_time_days}–${Math.max(...variants!.map(v => v.delivery_time_days || pkg.delivery_time_days))} dni`
                                                : `${pkg.delivery_time_days} dni`
                                            }
                                        </span>
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

                            {/* Variant Quick Cards (if applicable) */}
                            {hasVariants && (
                                <div className="bg-white rounded-[2rem] border border-slate-100 p-6 shadow-lg">
                                    <div className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">Warianty cenowe</div>
                                    <div className="space-y-3">
                                        {variants!.map((v, i) => (
                                            <div key={v.name} className={`flex justify-between items-center p-3 rounded-xl ${i === 1 ? 'bg-indigo-50 border border-indigo-100' : 'bg-slate-50'}`}>
                                                <div>
                                                    <div className="font-semibold text-slate-900 text-sm">{v.label}</div>
                                                    {v.delivery_time_days && (
                                                        <div className="text-xs text-slate-500">do {v.delivery_time_days} dni</div>
                                                    )}
                                                </div>
                                                <div className="font-bold text-slate-900">{v.price} PLN</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Student Profile Card (if student gig) */}
                            {pkg.type === 'student_gig' && pkg.student && (
                                <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-lg flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center font-bold text-xl text-slate-400">
                                        {(pkg.student as any).public_name[0]}
                                    </div>
                                    <div>
                                        <div className="text-xs text-slate-500 uppercase font-bold tracking-wider">Realizuje</div>
                                        <div className="font-bold text-slate-900">{(pkg.student as any).public_name}</div>
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
