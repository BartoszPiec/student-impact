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
import {
    groupPackageFormSchemaBySection,
    normalizePackageFormSchema,
    resolvePackageVariantsWithFallback,
} from "@/lib/services/package-customization";
import { LOGO_PACKAGE_ID } from "@/lib/services/logo-student-selection";

export const dynamic = "force-dynamic";

// Category config

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

function normalizeSearchText(value: string): string {
    return value
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim();
}

function getCategoryConfig(category: string | null) {
    if (!category) return categoryConfig.default;
    const key = normalizeSearchText(category);
    return categoryConfig[key] || categoryConfig.default;
}

// Section splitting

type SectionType = 'intro' | 'features' | 'pricing' | 'comparison'
    | 'requirements' | 'exclusions' | 'process' | 'deliverables' | 'default';

interface DescriptionSection {
    title: string;
    content: string;
    type: SectionType;
}


function detectSectionType(title: string): SectionType {
    const t = normalizeSearchText(title);
    if (t.includes('chodzi') || t.includes('czym jest') || t.includes('o usludze') || t.includes('o pakiecie')) return 'intro';
    if (t.includes('dla kogo')) return 'features';
    if ((t.includes('wybierz') && t.includes('pakiet')) || t.includes('wariant') || t.includes('cennik') || t === 'pakiety') return 'pricing';
    if (t.includes('cen') && (t.includes('rynk') || t.includes('tle') || t.includes('porownan'))) return 'comparison';
    if (t.includes('dostarcz') || t.includes('musisz') || t.includes('material') || t.includes('potrzeb')) return 'requirements';
    if (t.includes('nie obejmuj') || t.includes('nie zawiera') || t.includes('ograniczen')) return 'exclusions';
    if (t.includes('proces') || t.includes('etap') || t.includes('przebieg') || t.includes('jak to dziala')) return 'process';
    if (t.includes('otrzym') || t.includes('dostaje') || t.includes('co dostajesz')) return 'deliverables';
    if (t.includes('analizow') || t.includes('zakres') || t.includes('co mozna') || t.includes('co obejmuje') || t.includes('mozliw')) return 'features';
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
    const slug = normalizeSearchText(title)
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
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

const LOGO_HERO_SUBTITLE = "Prawdziwy projekt. Prawdziwy student grafiki. Twoje logo na zawsze.";
const FAQ_SECTION_ID = "section-faq";

const LOGO_AUDIENCE_SECTION: DescriptionSection = {
    title: "Dla kogo",
    type: "features",
    content: [
        "- **Nowa firma lub startup** - Dopiero zaczynasz i potrzebujesz pierwszego profesjonalnego logo.",
        "- **Firma z amatorskim logo** - Czas na znak, ktory lepiej reprezentuje Twoja marke.",
        "- **Stowarzyszenie lub NGO** - Potrzebujesz profesjonalnego wizerunku przy ograniczonym budzecie.",
        "- **Freelancer lub specjalista** - Budujesz marke osobista do strony, portfolio i social mediow.",
        "- **Rebrand** - Firma rosnie i stare logo przestalo pasowac do nowego etapu.",
    ].join("\n"),
};

const LOGO_FAQ_FALLBACK: Array<{ question: string; answer: string }> = [
    {
        question: "Czy moge zobaczyc portfolio studenta przed zakupem?",
        answer:
            "Tak. Po zlozeniu zamowienia zobaczysz liste dostepnych studentow z portfolio i mozesz wybrac wykonawce samodzielnie albo auto-przydzial.",
    },
    {
        question: "Co jesli zadna z propozycji mi nie odpowiada?",
        answer:
            "Student przygotuje dodatkowa koncepcje na podstawie Twojego feedbacku bez dodatkowych kosztow.",
    },
    {
        question: "Jak dzialaja poprawki?",
        answer:
            "1 zmiana to 1 modyfikacja 1 elementu w 1 pliku. Basic: 1 runda (8 zmian). Standard: 2 rundy (8 zmian kazda).",
    },
    {
        question: "Czy dostaje pelne prawa autorskie?",
        answer:
            "Tak. W obu pakietach nastepuje pelne przeniesienie majatkowych praw autorskich na firme.",
    },
    {
        question: "Jak zabezpieczona jest platnosc?",
        answer:
            "Platnosc jest realizowana przez Escrow. Srodki sa uwalniane po Twojej akceptacji dostarczonej pracy.",
    },
];

const LOGO_PROCESS_FALLBACK_STEPS = [
    {
        num: 1,
        title: "Brief i wybor studenta",
        description:
            "Przy zamowieniu wypelniasz brief (10-15 min), wybierasz studenta z portfolio lub uruchamiasz auto-przydzial.",
    },
    {
        num: 2,
        title: "Analiza i szkice",
        description:
            "Student analizuje branze i brief, a nastepnie przygotowuje szkice przed digitalizacja.",
    },
    {
        num: 3,
        title: "Propozycje koncepcji",
        description:
            "Dostajesz 2-3 propozycje logo. Wybierasz kierunek i przekazujesz feedback.",
    },
    {
        num: 4,
        title: "Dopracowanie i poprawki",
        description:
            "Student dopracowuje wybrana koncepcje. Basic ma 1 runde poprawek, Standard ma 2 rundy.",
    },
    {
        num: 5,
        title: "Pliki koncowe i zamkniecie",
        description:
            "Otrzymujesz komplet plikow, masz czas na finalny feedback, a po akceptacji Escrow uwalnia srodki.",
    },
];

function extractHeroSubtitle(description: string | null): string {
    if (!description) return "Sprawdz szczegoly pakietu ponizej.";

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

    return "Sprawdz szczegoly pakietu ponizej.";
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
            form_schema, faq, related_service_ids,
            student:student_profiles (
                public_name
            )
        `)
        .eq("id", params.id)
        .single();

    if (error || !pkg) {
        notFound();
    }

    const isLogoPackage = pkg.id === LOGO_PACKAGE_ID;
    const displayTitle = isLogoPackage ? "Projekt Logo" : pkg.title;
    const config = getCategoryConfig(pkg.category);
    const heroSubtitle = isLogoPackage ? LOGO_HERO_SUBTITLE : extractHeroSubtitle(pkg.description);

    const variants = resolvePackageVariantsWithFallback(pkg.id, (pkg as any).variants);
    const hasVariants = variants.length > 0;

    const recommendedVariant = hasVariants
        ? variants.find((variant) => variant.is_recommended)
            || variants.find((variant) => normalizeSearchText(variant.name) === "standard")
            || null
        : null;

    const minVariantPrice = hasVariants
        ? Math.min(...variants.map((variant) => variant.price))
        : pkg.price;
    const maxVariantPrice = hasVariants
        ? Math.max(...variants.map((variant) => variant.price))
        : pkg.price;

    const comparisonPriceLabel = recommendedVariant
        ? `${recommendedVariant.price} PLN`
        : minVariantPrice === maxVariantPrice
            ? `${minVariantPrice} PLN`
            : `${minVariantPrice}-${maxVariantPrice} PLN`;

    const minDeliveryDays = hasVariants
        ? Math.min(...variants.map((variant) => variant.delivery_time_days || pkg.delivery_time_days))
        : pkg.delivery_time_days;
    const maxDeliveryDays = hasVariants
        ? Math.max(...variants.map((variant) => variant.delivery_time_days || pkg.delivery_time_days))
        : pkg.delivery_time_days;
    const deliveryRangeLabel = minDeliveryDays === maxDeliveryDays
        ? `${minDeliveryDays} dni`
        : `${minDeliveryDays}–${maxDeliveryDays} dni`;
    const formSchema = normalizePackageFormSchema((pkg as any).form_schema);
    const briefPreviewSections = groupPackageFormSchemaBySection(formSchema);

    const publicDescription = pkg.description
        ? pkg.description.split(/--- \[MATERIA(?:Ł|L)Y DLA WYKONAWCY\] ---/i)[0].trim()
        : null;

    const cleanDescription = publicDescription
        ? publicDescription.replace(/\nStudent2Work - Laczymy ambicje studentow z potrzebami firm$/, "").trim()
        : null;

    const sectionResult = cleanDescription
        ? splitDescriptionIntoSections(cleanDescription)
        : { intro: null, sections: [] };
    const introText = sectionResult.intro;

    const hasAudienceSection = sectionResult.sections.some((section) =>
        normalizeSearchText(section.title).includes("dla kogo"),
    );

    const sections = isLogoPackage && !hasAudienceSection
        ? (() => {
            const introIdx = sectionResult.sections.findIndex((section) =>
                normalizeSearchText(section.title).includes("o co chodzi"),
            );

            if (introIdx >= 0) {
                return [
                    ...sectionResult.sections.slice(0, introIdx + 1),
                    LOGO_AUDIENCE_SECTION,
                    ...sectionResult.sections.slice(introIdx + 1),
                ];
            }

            return [LOGO_AUDIENCE_SECTION, ...sectionResult.sections];
        })()
        : sectionResult.sections;

    const dbFaqItems: Array<{ question: string; answer: string }> = Array.isArray((pkg as any).faq)
        ? (pkg as any).faq
            .filter((item: any) => item && typeof item === "object")
            .map((item: any) => ({
                question: typeof item.question === "string" ? item.question : "",
                answer: typeof item.answer === "string" ? item.answer : "",
            }))
            .filter((item: any) => item.question.length > 0 && item.answer.length > 0)
        : [];
    const faqItems = dbFaqItems.length > 0 ? dbFaqItems : (isLogoPackage ? LOGO_FAQ_FALLBACK : []);

    const navItems = sections.map((section, index) => ({
        id: generateSectionId(section.title, index),
        title: section.title,
        type: section.type as string,
    }));

    if (faqItems.length > 0 && !navItems.some((item) => item.id === FAQ_SECTION_ID)) {
        navItems.push({
            id: FAQ_SECTION_ID,
            title: "FAQ",
            type: "default",
        });
    }
    const firstSectionId = navItems[0]?.id || null;

    const relatedServiceIds = Array.isArray((pkg as any).related_service_ids)
        ? (pkg as any).related_service_ids.filter((value: unknown): value is string => typeof value === "string")
        : [];

    type RelatedServiceRow = {
        id: string;
        title: string;
        price: number | null;
        delivery_time_days: number | null;
        category: string | null;
    };

    let relatedServices: Array<{
        id: string;
        title: string;
        price: number;
        delivery_time_days: number;
        category: string | null;
    }> = [];

    if (relatedServiceIds.length > 0) {
        const { data: relatedRows } = await supabase
            .from("service_packages")
            .select("id, title, price, delivery_time_days, category")
            .in("id", relatedServiceIds)
            .eq("status", "active");

        if (Array.isArray(relatedRows)) {
            const byId = new Map((relatedRows as RelatedServiceRow[]).map((row) => [row.id, row]));
            relatedServices = relatedServiceIds
                .map((relatedId: string) => byId.get(relatedId))
                .filter((row: RelatedServiceRow | undefined): row is RelatedServiceRow => Boolean(row))
                .map((row: RelatedServiceRow) => ({
                    id: row.id,
                    title: row.title,
                    price: Number(row.price || 0),
                    delivery_time_days: Number(row.delivery_time_days || 0),
                    category: row.category || null,
                }));
        }
    }

    return (
        <main className="min-h-screen bg-[radial-gradient(circle_at_top,_#f8f9ff_0%,_#f3f5ff_35%,_#edf2ff_100%)] pb-24 font-sans">

            {/* PREMIUM HERO */}
            <div className="relative overflow-hidden border-b border-indigo-100/60 bg-gradient-to-br from-[#f7f9ff] via-white to-[#edf2ff] pb-24 pt-14 lg:pb-28">
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className={`absolute -left-24 top-[-30%] h-[70%] w-[45%] rounded-full bg-gradient-to-br ${config.gradient} opacity-20 blur-[120px]`} />
                    <div className={`absolute -right-20 bottom-[-30%] h-[65%] w-[40%] rounded-full bg-gradient-to-tl ${config.gradient} opacity-20 blur-[120px]`} />
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(99,102,241,0.08),transparent_42%),radial-gradient(circle_at_80%_65%,rgba(168,85,247,0.08),transparent_40%)]" />
                    <div className="absolute left-1/2 top-10 h-[560px] w-[560px] -translate-x-1/2 rounded-full border border-indigo-200/40" />
                    <div className="absolute left-1/2 top-16 h-[480px] w-[480px] -translate-x-1/2 rounded-full border border-indigo-100/50" />
                </div>

                <PageContainer className="relative z-10">
                    <Link href="/app/company/packages" className="group mb-10 inline-flex items-center rounded-full border border-slate-200 bg-white/90 px-5 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-white hover:text-slate-900">
                        <ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
                        Wroc do katalogu
                    </Link>

                    <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_420px] lg:items-end">
                        <div className="max-w-4xl">
                            <div className="mb-8 flex flex-wrap items-center gap-3">
                                <Badge className="rounded-full border border-indigo-200 bg-indigo-50/90 px-4 py-1.5 text-sm font-semibold text-indigo-700">
                                    <Zap className="mr-1.5 h-4 w-4 opacity-90" />
                                    {pkg.category || "Usluga systemowa"}
                                </Badge>
                                {pkg.type === "student_gig" && (
                                    <Badge className="rounded-full border border-blue-200 bg-blue-50/90 px-4 py-1.5 text-sm font-semibold text-blue-700">
                                        <Users className="mr-1.5 h-4 w-4" />
                                        Oferta Studenta
                                    </Badge>
                                )}
                                {pkg.requires_nda && (
                                    <Badge className="rounded-full border border-rose-200 bg-rose-50/90 px-4 py-1.5 text-sm font-semibold text-rose-700">
                                        <ShieldAlert className="mr-1.5 h-4 w-4" />
                                        Wymaga NDA
                                    </Badge>
                                )}
                                {hasVariants && (
                                    <Badge className="rounded-full border border-amber-200 bg-amber-50/90 px-4 py-1.5 text-sm font-semibold text-amber-700">
                                        <Package className="mr-1.5 h-4 w-4" />
                                        {variants.length} warianty
                                    </Badge>
                                )}
                            </div>
                            <h1 className="mb-6 bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-700 bg-clip-text text-4xl font-extrabold leading-tight tracking-tight text-transparent md:text-6xl lg:text-7xl">
                                {displayTitle}
                            </h1>
                            <p className="max-w-3xl text-lg leading-relaxed text-slate-600 md:text-2xl">
                                {heroSubtitle}
                            </p>

                            <div className="mt-10 flex flex-wrap items-center gap-3">
                                <Button asChild className={`h-12 rounded-full bg-gradient-to-r px-7 text-base font-bold text-white shadow-xl shadow-indigo-900/30 ${config.gradient} hover:opacity-95`}>
                                    <Link href={`/app/company/packages/${pkg.id}/customize`}>
                                        Rozpocznij brief
                                        <ArrowRight className="ml-2 h-4 w-4" />
                                    </Link>
                                </Button>
                                {firstSectionId ? (
                                    <Button asChild variant="outline" className="h-12 rounded-full border-slate-300 bg-white px-7 text-base font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900">
                                        <Link href={`#${firstSectionId}`}>
                                            Zobacz szczegoly
                                        </Link>
                                    </Button>
                                ) : null}
                            </div>
                        </div>

                        <div className="hidden lg:block">
                            <div className="relative overflow-hidden rounded-[2rem] border border-slate-200 bg-white/95 p-6 shadow-[0_35px_90px_-45px_rgba(71,85,105,0.35)]">
                                <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${config.gradient}`} />
                                <div className="pointer-events-none absolute -right-20 -top-20 h-44 w-44 rounded-full bg-indigo-100/70 blur-2xl" />
                                <div className="mb-5 flex items-center justify-between">
                                    <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">Snapshot pakietu</p>
                                    <span className="inline-flex items-center rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">
                                        Escrow aktywne
                                    </span>
                                </div>
                                <div className="space-y-4">
                                    <div className="rounded-2xl border border-slate-200 bg-slate-50/90 p-4">
                                        <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Cena startowa</p>
                                        <p className="mt-2 text-3xl font-extrabold text-slate-900">{minVariantPrice} PLN</p>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="rounded-2xl border border-slate-200 bg-white p-3">
                                            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">Realizacja</p>
                                            <p className="mt-1 text-base font-bold text-slate-800">{deliveryRangeLabel}</p>
                                        </div>
                                        <div className="rounded-2xl border border-slate-200 bg-white p-3">
                                            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">Platnosc</p>
                                            <p className="mt-1 text-base font-bold text-slate-800">Po akceptacji</p>
                                        </div>
                                    </div>
                                    <div className="space-y-2 rounded-2xl border border-slate-200 bg-white p-4">
                                        <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Zakres wspolpracy</p>
                                        <div className="h-2 w-full rounded-full bg-slate-100">
                                            <div className={`h-2 rounded-full bg-gradient-to-r ${config.gradient} w-4/5`} />
                                        </div>
                                        <p className="text-sm text-slate-600">Brief, realizacja, poprawki, finalne pliki.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </PageContainer>
            </div>

            {/* KEY FACTS STRIP */}
            <PageContainer className="relative z-20 -mt-8 mb-14">
                <AnimateOnScroll>
                    <div className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-[0_25px_60px_-40px_rgba(71,85,105,0.35)]">
                        <div className="grid grid-cols-2 divide-x divide-y divide-slate-200 md:grid-cols-4 md:divide-y-0">
                            <div className="p-5 md:p-6">
                                <div className="mb-2 flex items-center gap-2 text-slate-500">
                                    <Coins className="h-4 w-4" />
                                    <span className="text-xs font-bold uppercase tracking-[0.2em]">Cena od</span>
                                </div>
                                <p className="text-2xl font-extrabold text-slate-900">{minVariantPrice} PLN</p>
                            </div>
                            <div className="p-5 md:p-6">
                                <div className="mb-2 flex items-center gap-2 text-slate-500">
                                    <Timer className="h-4 w-4" />
                                    <span className="text-xs font-bold uppercase tracking-[0.2em]">Realizacja</span>
                                </div>
                                <p className="text-2xl font-extrabold text-slate-900">{deliveryRangeLabel}</p>
                            </div>
                            <div className="p-5 md:p-6">
                                <div className="mb-2 flex items-center gap-2 text-slate-500">
                                    <Shield className="h-4 w-4" />
                                    <span className="text-xs font-bold uppercase tracking-[0.2em]">Platnosc</span>
                                </div>
                                <p className="text-2xl font-extrabold text-slate-900">Escrow</p>
                            </div>
                            <div className="p-5 md:p-6">
                                <div className="mb-2 flex items-center gap-2 text-slate-500">
                                    <ShieldCheck className="h-4 w-4" />
                                    <span className="text-xs font-bold uppercase tracking-[0.2em]">Gwarancja</span>
                                </div>
                                <p className="text-2xl font-extrabold text-slate-900">Satysfakcji</p>
                            </div>
                        </div>
                    </div>
                </AnimateOnScroll>
            </PageContainer>

            {/* SECTION NAV (sticky anchor navigation) */}
            {navItems.length > 0 && (
                <div className="relative z-30 mb-12 hidden lg:block">
                    <SectionNav sections={navItems} gradient={config.gradient} />
                </div>
            )}

            {/* MAIN CONTENT */}
            <PageContainer className="relative">
                <div className={`pointer-events-none absolute -left-24 top-20 h-72 w-72 rounded-full bg-gradient-to-br ${config.gradient} opacity-20 blur-[110px]`} />
                <div className="pointer-events-none absolute -right-24 bottom-24 h-80 w-80 rounded-full bg-indigo-400/20 blur-[120px]" />
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10">

                    {/* LEFT COLUMN: Section Cards */}
                    <div className="lg:col-span-8 xl:col-span-9 space-y-8">

                        {/* Intro section */}
                        {introText && (
                            <AnimateOnScroll delay={100}>
                                <div className="relative mb-8 overflow-hidden rounded-[2rem] border border-slate-200/70 bg-white p-8 shadow-[0_30px_70px_-40px_rgba(15,23,42,0.55)] transition-all duration-500 group hover:shadow-[0_40px_90px_-45px_rgba(15,23,42,0.65)] md:p-12">
                                    <div className={`absolute top-0 left-0 w-2 h-full bg-gradient-to-b ${config.gradient} rounded-l-[2rem] opacity-80 group-hover:opacity-100 transition-opacity`} />
                                    
                                    <div className="flex items-start gap-5 mb-8">
                                        <div className={`w-16 h-16 rounded-2xl ${config.lightBg} flex items-center justify-center shrink-0 border border-white shadow-inner`}>
                                            <Lightbulb className={`w-8 h-8 ${config.darkText}`} />
                                        </div>
                                        <div className="pt-1">
                                            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">O pakiecie</h2>
                                            <p className="text-slate-500 mt-1 font-medium text-lg">W skrocie o tym, czego dotyczy ta usluga</p>
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
                                            "relative scroll-mt-[120px] overflow-hidden rounded-[2rem] border border-slate-200/70 bg-white p-6 shadow-[0_30px_70px_-40px_rgba(15,23,42,0.55)] transition-all duration-500 group hover:shadow-[0_40px_90px_-45px_rgba(15,23,42,0.65)] sm:p-8 md:p-12",
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
                                                <InteractivePricingCards markdownContent={section.content} gradient={config.gradient} variants={variants} />
                                            ) : section.type === 'comparison' ? (
                                                <MarketComparisonCards
                                                    markdownContent={section.content}
                                                    gradient={config.gradient}
                                                    studentPriceLabel={comparisonPriceLabel}
                                                />
                                            ) : section.type === 'process' ? (
                                                <ProcessTimeline
                                                    markdownContent={section.content}
                                                    gradient={config.gradient}
                                                    variants={variants}
                                                    fallbackSteps={isLogoPackage ? LOGO_PROCESS_FALLBACK_STEPS : undefined}
                                                />
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
                                <div className="rounded-[2rem] border border-slate-200/70 bg-white p-8 shadow-[0_30px_70px_-40px_rgba(15,23,42,0.55)] md:p-12">
                                    <MarkdownLite content={cleanDescription} />
                                </div>
                            </AnimateOnScroll>
                        )}

                        {briefPreviewSections.length > 0 && (
                            <AnimateOnScroll delay={220}>
                                <div className="rounded-[2rem] border border-slate-200/70 bg-white p-6 shadow-[0_30px_70px_-40px_rgba(15,23,42,0.55)] sm:p-8 md:p-12">
                                    <div className="flex items-start gap-5 mb-8">
                                        <div className={`w-16 h-16 rounded-2xl ${config.lightBg} flex items-center justify-center shrink-0 border border-white shadow-inner`}>
                                            <FileText className={`w-8 h-8 ${config.darkText}`} />
                                        </div>
                                        <div className="pt-1">
                                            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">O co zapytamy w briefie</h2>
                                            <p className="text-slate-500 mt-1 font-medium text-lg">
                                                Po kliknieciu zamowienia poprosimy Cie dokladnie o te informacje.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="grid gap-5 md:grid-cols-2">
                                        {briefPreviewSections.map((section) => (
                                            <div key={section.title} className="rounded-[1.5rem] border border-slate-100 bg-slate-50/80 p-5">
                                                <h3 className="text-lg font-bold text-slate-900 mb-3">{section.title}</h3>
                                                <ul className="space-y-2 text-sm leading-6 text-slate-600">
                                                    {section.questions.map((question) => (
                                                        <li key={question.id} className="flex items-start gap-2">
                                                            <span className={`mt-2 h-1.5 w-1.5 rounded-full bg-gradient-to-r ${config.gradient}`} />
                                                            <span>{question.label}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </AnimateOnScroll>
                        )}

                        {faqItems.length > 0 && (
                            <AnimateOnScroll delay={260}>
                                <div
                                    id={FAQ_SECTION_ID}
                                    className="scroll-mt-[120px] rounded-[2rem] border border-slate-200/70 bg-white p-6 shadow-[0_30px_70px_-40px_rgba(15,23,42,0.55)] sm:p-8 md:p-12"
                                >
                                    <div className="flex items-start gap-5 mb-8">
                                        <div className={`w-16 h-16 rounded-2xl ${config.lightBg} flex items-center justify-center shrink-0 border border-white shadow-inner`}>
                                            <ShieldCheck className={`w-8 h-8 ${config.darkText}`} />
                                        </div>
                                        <div className="pt-1">
                                            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">FAQ</h2>
                                            <p className="text-slate-500 mt-1 font-medium text-lg">
                                                Najczestsze pytania przed startem wspolpracy.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        {faqItems.map((item: { question: string; answer: string }, idx: number) => (
                                            <details key={`${item.question}-${idx}`} className="group rounded-[1.5rem] border border-slate-100 bg-slate-50/80 p-5">
                                                <summary className="cursor-pointer list-none text-lg font-bold text-slate-900">
                                                    {item.question}
                                                </summary>
                                                <p className="mt-3 text-sm leading-7 text-slate-600">{item.answer}</p>
                                            </details>
                                        ))}
                                    </div>
                                </div>
                            </AnimateOnScroll>
                        )}

                        {isLogoPackage && (
                            <AnimateOnScroll delay={280}>
                                <div className="rounded-[2rem] border border-slate-200/70 bg-white p-6 shadow-[0_30px_70px_-40px_rgba(15,23,42,0.55)] sm:p-8 md:p-12">
                                    <div className="flex items-start gap-5 mb-8">
                                        <div className={`w-16 h-16 rounded-2xl ${config.lightBg} flex items-center justify-center shrink-0 border border-white shadow-inner`}>
                                            <Users className={`w-8 h-8 ${config.darkText}`} />
                                        </div>
                                        <div className="pt-1">
                                            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Opinie</h2>
                                            <p className="text-slate-500 mt-1 font-medium text-lg">
                                                Ta sekcja uzupelni sie automatycznie po pierwszych realizacjach.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="rounded-[1.5rem] border border-dashed border-slate-300 bg-slate-50/80 p-5 text-sm leading-7 text-slate-600">
                                        Brak publicznych opinii dla tego pakietu. Wkrotce pojawia sie tutaj oceny i komentarze firm.
                                    </div>
                                </div>
                            </AnimateOnScroll>
                        )}

                        {relatedServices.length > 0 && (
                            <AnimateOnScroll delay={300}>
                                <div className="rounded-[2rem] border border-slate-200/70 bg-white p-6 shadow-[0_30px_70px_-40px_rgba(15,23,42,0.55)] sm:p-8 md:p-12">
                                    <div className="flex items-start gap-5 mb-8">
                                        <div className={`w-16 h-16 rounded-2xl ${config.lightBg} flex items-center justify-center shrink-0 border border-white shadow-inner`}>
                                            <Sparkles className={`w-8 h-8 ${config.darkText}`} />
                                        </div>
                                        <div className="pt-1">
                                            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Co dalej</h2>
                                            <p className="text-slate-500 mt-1 font-medium text-lg">
                                                Jesli potrzebujesz wiecej, sprawdz podobne uslugi.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="grid gap-4 md:grid-cols-3">
                                        {relatedServices.slice(0, 3).map((related) => (
                                            <Link
                                                key={related.id}
                                                href={`/app/company/packages/${related.id}`}
                                                className="rounded-[1.5rem] border border-slate-100 bg-slate-50/80 p-5 transition hover:-translate-y-1 hover:border-indigo-200 hover:bg-white"
                                            >
                                                <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">
                                                    {related.category || "Usluga"}
                                                </p>
                                                <h3 className="mt-3 text-lg font-bold text-slate-900 line-clamp-2">{related.title}</h3>
                                                <p className="mt-4 text-sm font-semibold text-slate-600">
                                                    od {related.price} PLN
                                                </p>
                                                <p className="text-xs text-slate-500">{related.delivery_time_days} dni realizacji</p>
                                            </Link>
                                        ))}
                                    </div>
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
                                        variants={variants}
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
                                                Platnosc
                                            </span>
                                            <span className="font-bold text-slate-900 text-lg">Po akceptacji</span>
                                        </div>
                                        <div className="flex justify-between items-center py-4">
                                            <span className="text-slate-500 flex items-center gap-3 font-medium">
                                                <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-600 border border-slate-100/50">
                                                    <Shield className="w-5 h-5" />
                                                </div>
                                                Bezpieczenstwo
                                            </span>
                                            <span className="font-bold text-slate-900 text-lg">System Escrow</span>
                                        </div>
                                    </div>

                                    <Button asChild className={`w-full h-16 text-lg font-bold text-white bg-gradient-to-r ${config.gradient} shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40 hover:-translate-y-0.5 transition-all duration-300 rounded-2xl relative z-10 overflow-hidden`}>
                                        <Link href={`/app/company/packages/${pkg.id}/customize`}>
                                            <div className="absolute inset-0 bg-white/20 opacity-0 hover:opacity-100 transition-opacity" />
                                            <span className="flex items-center">
                                                Rozpocznij wspolprace
                                                <ArrowRight className="ml-2 w-5 h-5" />
                                            </span>
                                        </Link>
                                    </Button>

                                    <div className="mt-5 text-center relative z-10">
                                        <p className="text-xs text-slate-400 font-medium leading-relaxed">
                                            Nie pobieramy jeszcze zadnej oplaty.<br />Zostaniesz poproszony o szczegoly projektu.
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



