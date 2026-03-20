import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { PageContainer } from "@/components/ui/page-container";
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
import { AnimateOnScroll } from "@/components/animate-on-scroll";
import { VariantPicker } from "./variant-picker";
import { SectionNav } from "./section-nav";
import { InteractivePricingCards } from "./interactive-pricing-cards";
import { MarketComparisonCards } from "./market-comparison-cards";
import { ProcessTimeline } from "./process-timeline";

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
    "tłumaczenia": {
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

function generateSectionId(title: string, index: number): string {
    const map: Record<string, string> = {
        'ą': 'a', 'ć': 'c', 'ę': 'e', 'ł': 'l', 'ń': 'n',
        'ó': 'o', 'ś': 's', 'ź': 'z', 'ż': 'z',
        'Ą': 'A', 'Ć': 'C', 'Ę': 'E', 'Ł': 'L', 'Ń': 'N',
        'Ó': 'O', 'Ś': 'S', 'Ź': 'Z', 'Ż': 'Z',
    };
    const slug = title
        .toLowerCase()
        .split('')
        .map(c => map[c] || c)
        .join('')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
    return `section-${slug || index}`;
}

interface SectionCardConfig {
    icon: React.ReactNode;
    iconBg: string;
    iconColor: string;
    borderColor: string;
    listIcon: "check" | "x" | "arrow" | "dot";
    bgClass: string;
    accentGradient: string;
}

const SECTION_CONFIGS: Record<SectionType, SectionCardConfig> = {
    intro: {
        icon: <Lightbulb className="w-6 h-6" />,
        iconBg: 'bg-amber-100',
        iconColor: 'text-amber-600',
        borderColor: 'border-l-amber-400',
        listIcon: 'dot',
        bgClass: 'bg-gradient-to-br from-white to-amber-50/30',
        accentGradient: 'from-amber-400 to-orange-400'
    },
    features: {
        icon: <Sparkles className="w-6 h-6" />,
        iconBg: 'bg-emerald-100',
        iconColor: 'text-emerald-600',
        borderColor: 'border-l-emerald-400',
        listIcon: 'check',
        bgClass: 'bg-white',
        accentGradient: 'from-emerald-400 to-teal-400'
    },
    pricing: {
        icon: <Package className="w-6 h-6" />,
        iconBg: 'bg-indigo-100',
        iconColor: 'text-indigo-600',
        borderColor: 'border-l-indigo-400',
        listIcon: 'dot',
        bgClass: 'bg-white',
        accentGradient: 'from-indigo-400 to-purple-400'
    },
    comparison: {
        icon: <BarChart3 className="w-6 h-6" />,
        iconBg: 'bg-violet-100',
        iconColor: 'text-violet-600',
        borderColor: 'border-l-violet-400',
        listIcon: 'dot',
        bgClass: 'bg-gradient-to-br from-white to-violet-50/30',
        accentGradient: 'from-violet-400 to-purple-400'
    },
    requirements: {
        icon: <FileText className="w-6 h-6" />,
        iconBg: 'bg-blue-100',
        iconColor: 'text-blue-600',
        borderColor: 'border-l-blue-400',
        listIcon: 'arrow',
        bgClass: 'bg-white',
        accentGradient: 'from-blue-400 to-cyan-400'
    },
    exclusions: {
        icon: <ShieldAlert className="w-6 h-6" />,
        iconBg: 'bg-red-100',
        iconColor: 'text-red-500',
        borderColor: 'border-l-red-300',
        listIcon: 'x',
        bgClass: 'bg-gradient-to-br from-white to-red-50/40',
        accentGradient: 'from-red-400 to-rose-400'
    },
    process: {
        icon: <Timer className="w-6 h-6" />,
        iconBg: 'bg-cyan-100',
        iconColor: 'text-cyan-600',
        borderColor: 'border-l-cyan-400',
        listIcon: 'arrow',
        bgClass: 'bg-white',
        accentGradient: 'from-cyan-400 to-blue-400'
    },
    deliverables: {
        icon: <CheckCircle2 className="w-6 h-6" />,
        iconBg: 'bg-emerald-100',
        iconColor: 'text-emerald-600',
        borderColor: 'border-l-emerald-400',
        listIcon: 'check',
        bgClass: 'bg-white',
        accentGradient: 'from-emerald-400 to-green-400'
    },
    default: {
        icon: <FileText className="w-6 h-6" />,
        iconBg: 'bg-slate-100',
        iconColor: 'text-slate-500',
        borderColor: 'border-l-slate-300',
        listIcon: 'dot',
        bgClass: 'bg-white',
        accentGradient: 'from-slate-300 to-slate-400'
    }
};

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

export default async function PackageDetailsPage(props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    const supabase = await createClient();

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

    const variants = Array.isArray(pkg.variants) ? pkg.variants as Array<{
        name: string;
        label: string;
        price: number;
        delivery_time_days?: number;
        scope?: string;
    }> : null;

    const hasVariants = variants && variants.length > 0;

    const publicDescription = pkg.description
        ? pkg.description.split("--- [MATERIAŁY DLA WYKONAWCY] ---")[0].trim()
        : null;

    const cleanDescription = publicDescription
        ? publicDescription.replace(/\nStudent2Work — Łączymy ambicje studentów z potrzebami firm$/, "").trim()
        : null;

    const { intro: introText, sections } = cleanDescription
        ? splitDescriptionIntoSections(cleanDescription)
        : { intro: null, sections: [] };

    const navItems = sections.map((section, index) => ({
        id: generateSectionId(section.title, index),
        title: section.title,
        type: section.type as string,
    }));

    return (
        <main className="min-h-screen bg-slate-50/50 pb-20 font-sans">

            {/* ═══ PREMIUM DARK HERO ═══ */}
            <div className={`relative overflow-hidden bg-[#0a0f1c] pb-32 pt-16`}>
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className={`absolute top-[-20%] left-[-10%] w-[50%] h-[80%] rounded-full opacity-20 blur-[120px] bg-gradient-to-br ${config.gradient}`} />
                    <div className={`absolute bottom-[-20%] right-[-10%] w-[40%] h-[60%] rounded-full opacity-20 blur-[100px] bg-gradient-to-tl ${config.gradient}`} />
                    <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-[0.03] bg-repeat" />
                </div>

                <PageContainer className="relative z-10">
                    <Link href="/app/company/packages" className="inline-flex items-center text-sm font-medium text-slate-300 hover:text-white mb-10 transition-colors group bg-white/5 backdrop-blur-md px-5 py-2.5 rounded-full border border-white/10 hover:bg-white/10">
                        <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
                        Wróć do katalogu
                    </Link>

                    <div className="max-w-4xl">
                        <div className="flex flex-wrap items-center gap-3 mb-8">
                            <Badge className={`bg-white/10 backdrop-blur-md border border-white/10 text-white text-sm font-medium px-4 py-1.5 rounded-full shadow-[0_0_20px_rgba(255,255,255,0.05)]`}>
                                <Zap className="w-4 h-4 mr-1.5 opacity-80" />
                                {pkg.category || "Usługa Systemowa"}
                            </Badge>
                            {pkg.type === 'student_gig' && (
                                <Badge className="bg-blue-500/20 backdrop-blur-md border border-blue-400/20 text-blue-100 text-sm font-medium px-4 py-1.5 rounded-full">
                                    <Users className="w-4 h-4 mr-1.5" />
                                    Oferta Studenta
                                </Badge>
                            )}
                            {pkg.requires_nda && (
                                <Badge className="bg-rose-500/20 backdrop-blur-md border border-rose-400/20 text-rose-100 text-sm font-medium px-4 py-1.5 rounded-full">
                                    <ShieldAlert className="w-4 h-4 mr-1.5" />
                                    Wymaga NDA
                                </Badge>
                            )}
                            {hasVariants && (
                                <Badge className="bg-amber-500/20 backdrop-blur-md border border-amber-400/20 text-amber-100 text-sm font-medium px-4 py-1.5 rounded-full">
                                    <Package className="w-4 h-4 mr-1.5" />
                                    {variants!.length} warianty
                                </Badge>
                            )}
                        </div>
                        <h1 className="text-4xl md:text-5xl lg:text-7xl font-extrabold text-transparent bg-clip-text bg-gradient-to-br from-white to-white/70 mb-6 leading-tight tracking-tight">
                            {pkg.title}
                        </h1>
                        <p className="text-xl md:text-2xl text-slate-300 max-w-3xl leading-relaxed font-light">
                            {heroSubtitle}
                        </p>
                    </div>
                </PageContainer>
            </div>

            {/* ═══ OVERLAPPING BENTO GRID (Trust Signals) ═══ */}
            <PageContainer className="relative z-20 -mt-20 mb-12">
                <AnimateOnScroll>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                        <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 border border-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-300 hover:-translate-y-1">
                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-100 to-emerald-50 flex items-center justify-center mb-4 border border-emerald-100/50">
                                <Coins className="w-6 h-6 text-emerald-600" />
                            </div>
                            <div className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">Cena od</div>
                            <div className="text-2xl font-extrabold text-slate-900">{pkg.price} PLN</div>
                        </div>

                        <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 border border-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-300 hover:-translate-y-1">
                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-100 to-blue-50 flex items-center justify-center mb-4 border border-blue-100/50">
                                <Timer className="w-6 h-6 text-blue-600" />
                            </div>
                            <div className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">Realizacja</div>
                            <div className="text-2xl font-extrabold text-slate-900">
                                {hasVariants
                                    ? `${pkg.delivery_time_days}–${Math.max(...variants!.map(v => v.delivery_time_days || pkg.delivery_time_days))} dni`
                                    : `${pkg.delivery_time_days} dni`
                                }
                            </div>
                        </div>

                        <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 border border-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-300 hover:-translate-y-1">
                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-100 to-violet-50 flex items-center justify-center mb-4 border border-violet-100/50">
                                <Shield className="w-6 h-6 text-violet-600" />
                            </div>
                            <div className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">Płatność</div>
                            <div className="text-2xl font-extrabold text-slate-900">Escrow</div>
                        </div>

                        <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 border border-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-300 hover:-translate-y-1">
                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-100 to-amber-50 flex items-center justify-center mb-4 border border-amber-100/50">
                                <ShieldCheck className="w-6 h-6 text-amber-600" />
                            </div>
                            <div className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">Gwarancja</div>
                            <div className="text-2xl font-extrabold text-slate-900">Satysfakcji</div>
                        </div>
                    </div>
                </AnimateOnScroll>
            </PageContainer>

            {/* ═══ SECTION NAV (sticky anchor navigation) ═══ */}
            {navItems.length > 0 && (
                <div className="hidden lg:block relative z-30 mb-8">
                    <SectionNav sections={navItems} gradient={config.gradient} />
                </div>
            )}

            {/* ═══ MAIN CONTENT ═══ */}
            <PageContainer>
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10">

                    {/* LEFT COLUMN: Section Cards */}
                    <div className="lg:col-span-8 xl:col-span-9 space-y-8">

                        {/* ── Intro section ── */}
                        {introText && (
                            <AnimateOnScroll delay={100}>
                                <div className="bg-white/70 backdrop-blur-xl rounded-[2rem] p-8 md:p-12 border border-white shadow-xl shadow-slate-200/20 mb-8 relative overflow-hidden group hover:shadow-2xl hover:shadow-slate-200/30 transition-all duration-500">
                                    <div className={`absolute top-0 left-0 w-2 h-full bg-gradient-to-b ${config.gradient} rounded-l-[2rem] opacity-80 group-hover:opacity-100 transition-opacity`} />
                                    
                                    <div className="flex items-start gap-5 mb-8">
                                        <div className={`w-16 h-16 rounded-2xl ${config.lightBg} flex items-center justify-center shrink-0 border border-white shadow-inner`}>
                                            <Lightbulb className={`w-8 h-8 ${config.darkText}`} />
                                        </div>
                                        <div className="pt-1">
                                            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">O pakiecie</h2>
                                            <p className="text-slate-500 mt-1 font-medium text-lg">W skrócie o tym, czego dotyczy ta usługa</p>
                                        </div>
                                    </div>
                                    <div className="prose prose-lg prose-slate max-w-none text-slate-600 leading-relaxed font-normal">
                                        <MarkdownLite content={introText} />
                                    </div>
                                </div>
                            </AnimateOnScroll>
                        )}

                        {sections.map((section, index) => {
                            const sConfig = SECTION_CONFIGS[section.type] || SECTION_CONFIGS.default;
                            const sectionId = generateSectionId(section.title, index);
                            return (
                                <AnimateOnScroll key={index} delay={150 + index * 80}>
                                    <div
                                        id={sectionId}
                                        className={cn(
                                            "bg-white/70 backdrop-blur-xl rounded-[2rem] p-6 sm:p-8 md:p-12 border border-white shadow-xl shadow-slate-200/20 scroll-mt-[120px] relative overflow-hidden group hover:shadow-2xl hover:shadow-slate-200/30 transition-all duration-500",
                                            sConfig.bgClass
                                        )}
                                    >
                                        <div className="absolute top-0 right-0 w-64 h-64 bg-slate-50 rounded-full blur-3xl -mr-32 -mt-32 opacity-50 pointer-events-none" />
                                        
                                        <div className="flex items-start gap-5 mb-6 relative z-10">
                                            <div className={cn(
                                                "w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 border border-white shadow-sm",
                                                sConfig.iconBg,
                                                sConfig.iconColor
                                            )}>
                                                {sConfig.icon}
                                            </div>
                                            <div className="pt-2">
                                                <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                                                    {section.title}
                                                </h2>
                                                <div className={`w-12 h-1.5 rounded-full bg-gradient-to-r ${sConfig.accentGradient} mt-4`} />
                                            </div>
                                        </div>

                                        <div className="prose prose-lg prose-slate max-w-none text-slate-600 relative z-10 w-full">
                                            {section.type === 'pricing' ? (
                                                <InteractivePricingCards markdownContent={section.content} gradient={config.gradient} />
                                            ) : section.type === 'comparison' ? (
                                                <MarketComparisonCards markdownContent={section.content} gradient={config.gradient} />
                                            ) : section.type === 'process' ? (
                                                <ProcessTimeline markdownContent={section.content} gradient={config.gradient} variants={variants || undefined} />
                                            ) : (
                                                <MarkdownLite
                                                    content={section.content}
                                                    listIcon={sConfig.listIcon}
                                                />
                                            )}
                                        </div>
                                    </div>
                                </AnimateOnScroll>
                            );
                        })}

                        {sections.length === 0 && cleanDescription && (
                            <AnimateOnScroll delay={100}>
                                <div className="bg-white/70 backdrop-blur-xl rounded-[2rem] p-8 md:p-12 border border-white shadow-xl shadow-slate-200/20">
                                    <MarkdownLite content={cleanDescription} />
                                </div>
                            </AnimateOnScroll>
                        )}
                    </div>

                    {/* RIGHT COLUMN: Sidebar (Sticky Buy Card + Profile) */}
                    <div className="lg:col-span-4 xl:col-span-3">
                        <div className="sticky top-[120px] space-y-8">

                            {hasVariants ? (
                                <div className="rounded-[2.5rem] shadow-[0_8px_40px_rgba(0,0,0,0.06)] bg-white">
                                    <VariantPicker
                                        variants={variants!}
                                        baseDeliveryDays={pkg.delivery_time_days}
                                        gradient={config.gradient}
                                        packageId={pkg.id}
                                    />
                                </div>
                            ) : (
                                <div className="bg-white/90 backdrop-blur-2xl rounded-[2.5rem] border border-white p-8 md:p-10 shadow-[0_8px_40px_rgba(0,0,0,0.06)] relative overflow-hidden group">
                                    <div className={`absolute top-0 inset-x-0 h-2 bg-gradient-to-r ${config.gradient}`} />
                                    
                                    <div className="absolute -top-24 -right-24 w-64 h-64 bg-slate-100 rounded-full blur-3xl pointer-events-none opacity-50 group-hover:bg-indigo-50 transition-colors duration-700" />

                                    <div className="mb-8 text-center relative z-10">
                                        <div className="text-sm text-slate-400 font-bold mb-3 uppercase tracking-widest">
                                            Podstawowy pakiet
                                        </div>
                                        <div className="flex items-baseline justify-center gap-2">
                                            <span className="text-6xl font-extrabold text-slate-900 tracking-tighter">{pkg.price}</span>
                                            <span className="text-2xl font-bold text-slate-400">PLN</span>
                                        </div>
                                        <div className="mt-5 flex items-center justify-center gap-2 text-sm font-bold text-emerald-700 bg-emerald-50/80 backdrop-blur-sm rounded-full px-5 py-2.5 w-fit mx-auto border border-emerald-100">
                                            <ShieldCheck className="w-5 h-5" />
                                            Gwarancja satysfakcji
                                        </div>
                                    </div>

                                    <div className="space-y-4 mb-10 relative z-10">
                                        <div className="flex justify-between items-center py-4 border-b border-slate-100/80">
                                            <span className="text-slate-500 flex items-center gap-3 font-medium">
                                                <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-600 border border-slate-100/50">
                                                    <Timer className="w-5 h-5" />
                                                </div>
                                                Czas realizacji
                                            </span>
                                            <span className="font-bold text-slate-900 text-lg">{pkg.delivery_time_days} dni</span>
                                        </div>
                                        <div className="flex justify-between items-center py-4 border-b border-slate-100/80">
                                            <span className="text-slate-500 flex items-center gap-3 font-medium">
                                                <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-600 border border-slate-100/50">
                                                    <Coins className="w-5 h-5" />
                                                </div>
                                                Płatność
                                            </span>
                                            <span className="font-bold text-slate-900 text-lg">Po akceptacji</span>
                                        </div>
                                        <div className="flex justify-between items-center py-4">
                                            <span className="text-slate-500 flex items-center gap-3 font-medium">
                                                <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-600 border border-slate-100/50">
                                                    <Shield className="w-5 h-5" />
                                                </div>
                                                Bezpieczeństwo
                                            </span>
                                            <span className="font-bold text-slate-900 text-lg">System Escrow</span>
                                        </div>
                                    </div>

                                    <Button asChild className={`w-full h-16 text-lg font-bold text-white bg-gradient-to-r ${config.gradient} shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40 hover:-translate-y-0.5 transition-all duration-300 rounded-2xl relative z-10 overflow-hidden`}>
                                        <Link href={`/app/company/packages/${pkg.id}/customize`}>
                                            <div className="absolute inset-0 bg-white/20 opacity-0 hover:opacity-100 transition-opacity" />
                                            <span className="flex items-center">
                                                Rozpocznij współpracę
                                                <ArrowRight className="ml-2 w-5 h-5" />
                                            </span>
                                        </Link>
                                    </Button>

                                    <div className="mt-5 text-center relative z-10">
                                        <p className="text-xs text-slate-400 font-medium leading-relaxed">
                                            Nie pobieramy jeszcze żadnej opłaty.<br />Zostaniesz poproszony o szczegóły projektu.
                                        </p>
                                    </div>
                                </div>
                            )}

                            {pkg.type === 'student_gig' && pkg.student && (
                                <div className="bg-white/80 backdrop-blur-xl rounded-[2rem] p-6 border border-white shadow-xl shadow-slate-200/20 flex flex-col items-center text-center relative overflow-hidden group">
                                    <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${config.gradient} opacity-5 rounded-full blur-2xl -mr-10 -mt-10`} />
                                    
                                    <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center font-bold text-3xl text-slate-400 mb-4 border-4 border-white shadow-md relative z-10">
                                        {(pkg.student as any).public_name?.[0] || "?"}
                                    </div>
                                    <div className="relative z-10">
                                        <div className="text-xs text-slate-400 uppercase font-black tracking-widest mb-1">Wykonawca</div>
                                        <div className="font-extrabold text-xl text-slate-900">{(pkg.student as any).public_name}</div>
                                        <div className="mt-3 inline-flex items-center text-sm font-medium text-slate-500 bg-slate-50 px-4 py-1.5 rounded-full border border-slate-100">
                                            <ShieldCheck className="w-4 h-4 mr-1.5 text-emerald-500" />
                                            Zweryfikowany talent
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </PageContainer>
        </main>
    );
}
