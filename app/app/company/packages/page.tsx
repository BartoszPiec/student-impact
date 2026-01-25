import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2,
  User,
  Sparkles,
  ArrowRight,
  Star,
  Clapperboard,
  Scale,
  PenTool,
  BarChart3,
  Globe,
  Languages,
  Cpu,
  Megaphone,
  Palette,
  Search,
  TrendingUp,
  Shield,
  Zap,
  Clock,
  Target,
  Rocket,
  Code,
  Users,
  Briefcase,
  GraduationCap
} from "lucide-react";

export const dynamic = "force-dynamic";

// Mapowanie kategorii na ikony i kolory
const categoryConfig: Record<string, { icon: React.ReactNode; gradient: string; lightBg: string; darkText: string }> = {
  "video": {
    icon: <Clapperboard className="w-5 h-5" />,
    gradient: "from-rose-500 to-orange-500",
    lightBg: "bg-rose-50",
    darkText: "text-rose-600"
  },
  "grafika": {
    icon: <Palette className="w-5 h-5" />,
    gradient: "from-violet-500 to-purple-600",
    lightBg: "bg-violet-50",
    darkText: "text-violet-600"
  },
  "it": {
    icon: <Code className="w-5 h-5" />,
    gradient: "from-cyan-500 to-blue-600",
    lightBg: "bg-cyan-50",
    darkText: "text-cyan-600"
  },
  "content": {
    icon: <PenTool className="w-5 h-5" />,
    gradient: "from-emerald-500 to-teal-600",
    lightBg: "bg-emerald-50",
    darkText: "text-emerald-600"
  },
  "marketing": {
    icon: <Megaphone className="w-5 h-5" />,
    gradient: "from-blue-500 to-indigo-600",
    lightBg: "bg-blue-50",
    darkText: "text-blue-600"
  },
  "analiza": {
    icon: <BarChart3 className="w-5 h-5" />,
    gradient: "from-amber-500 to-orange-600",
    lightBg: "bg-amber-50",
    darkText: "text-amber-600"
  },
  "tlumaczenia": {
    icon: <Languages className="w-5 h-5" />,
    gradient: "from-green-500 to-emerald-600",
    lightBg: "bg-green-50",
    darkText: "text-green-600"
  },
  "prawo": {
    icon: <Scale className="w-5 h-5" />,
    gradient: "from-slate-600 to-gray-700",
    lightBg: "bg-slate-50",
    darkText: "text-slate-600"
  },
  "finanse": {
    icon: <TrendingUp className="w-5 h-5" />,
    gradient: "from-yellow-500 to-amber-600",
    lightBg: "bg-yellow-50",
    darkText: "text-yellow-600"
  },
  "ai": {
    icon: <Cpu className="w-5 h-5" />,
    gradient: "from-purple-600 to-pink-600",
    lightBg: "bg-purple-50",
    darkText: "text-purple-600"
  },
  "default": {
    icon: <Sparkles className="w-5 h-5" />,
    gradient: "from-[#667eea] to-[#764ba2]",
    lightBg: "bg-indigo-50",
    darkText: "text-[#667eea]"
  }
};

function getCategoryConfig(category: string | null) {
  if (!category) return categoryConfig.default;
  const key = category.toLowerCase();
  // Simple heuristic mapping if exact key missing
  if (key.includes('video') || key.includes('wideo')) return categoryConfig['video'];
  if (key.includes('grafika') || key.includes('design')) return categoryConfig['grafika'];
  if (key.includes('program') || key.includes('it')) return categoryConfig['it'];
  if (key.includes('copy') || key.includes('text') || key.includes('pisan')) return categoryConfig['content'];
  if (key.includes('market') || key.includes('reklam')) return categoryConfig['marketing'];
  if (key.includes('dane') || key.includes('analiz')) return categoryConfig['analiza'];
  if (key.includes('tlumacz') || key.includes('język')) return categoryConfig['tlumaczenia'];
  if (key.includes('prawo') || key.includes('legal')) return categoryConfig['prawo'];
  if (key.includes('finans')) return categoryConfig['finanse'];
  if (key.includes('ai') || key.includes('gpt')) return categoryConfig['ai'];

  return categoryConfig[key] || categoryConfig.default;
}

function getServiceIcon(title: string, category: string | null) {
  const config = getCategoryConfig(category);
  return config.icon;
}

// Kategorie do filtrowania - HARDCODED for UI (can be dynamic later)
const categories = [
  { id: "all", label: "Wszystkie", icon: <Sparkles className="w-4 h-4" /> },
  { id: "video", label: "Video & Multimedia", icon: <Clapperboard className="w-4 h-4" /> },
  { id: "grafika", label: "Grafika & Design", icon: <Palette className="w-4 h-4" /> },
  { id: "it", label: "IT & Programowanie", icon: <Code className="w-4 h-4" /> },
  { id: "content", label: "Content & Copywriting", icon: <PenTool className="w-4 h-4" /> },
  { id: "marketing", label: "Marketing & Social", icon: <Megaphone className="w-4 h-4" /> },
  { id: "analiza", label: "Analiza Danych", icon: <BarChart3 className="w-4 h-4" /> },
  { id: "tlumaczenia", label: "Tłumaczenia", icon: <Languages className="w-4 h-4" /> },
  { id: "prawo", label: "Prawo & Finanse", icon: <Scale className="w-4 h-4" /> },
];

export default async function CompanyPackagesPage(props: { searchParams: Promise<{ category?: string; success?: string }> }) {
  const searchParams = await props.searchParams;
  const supabase = await createClient();

  /* 1. Fetch ALL Packages from service_packages */
  const { data: servicePackages, error: spError } = await supabase
    .from("service_packages")
    .select(`
      *,
      student:student_profiles (
        public_name
      )
    `)
    .eq("status", "active")
    .order("created_at", { ascending: false });

  if (spError) console.error("Error fetching packages:", spError);

  /* 2. Segregate Services */
  let platformServices = servicePackages?.filter((p: any) => p.type === 'platform_service') || [];
  const studentServices = servicePackages?.filter((p: any) => !p.type || p.type === 'student_gig') || [];

  // Filter Logic (Applied to platform services)
  const activeCategory = searchParams?.category || "all";
  if (activeCategory !== "all") {
    platformServices = platformServices.filter((p: any) => {
      const cat = (p.category || "").toLowerCase();
      // Simplified heuristic matching
      if (activeCategory === 'video' && (cat.includes('video') || cat.includes('wideo'))) return true;
      if (activeCategory === 'grafika' && (cat.includes('grafika') || cat.includes('design'))) return true;
      if (activeCategory === 'it' && (cat.includes('program') || cat.includes('it') || cat.includes('web'))) return true;
      if (activeCategory === 'marketing' && (cat.includes('market') || cat.includes('social'))) return true;

      return cat === activeCategory || cat.includes(activeCategory);
    });
  }

  // Statystyki
  const totalServices = platformServices.length + studentServices.length;

  return (
    <div className="min-h-screen bg-slate-50/30">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#667eea] via-[#764ba2] to-[#667eea] rounded-[2.5rem] mb-10 mx-4 mt-4 shadow-2xl shadow-purple-500/20">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-400/20 rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-white/5 to-transparent rounded-full"></div>

          {/* Floating shapes */}
          <div className="absolute top-20 left-20 w-4 h-4 bg-white/20 rounded-full animate-bounce" style={{ animationDuration: '3s' }}></div>
          <div className="absolute top-40 right-40 w-6 h-6 bg-white/10 rounded-lg rotate-45 animate-pulse"></div>
          <div className="absolute bottom-20 left-1/3 w-3 h-3 bg-white/20 rounded-full animate-bounce" style={{ animationDuration: '2.5s', animationDelay: '0.5s' }}></div>
        </div>

        <div className="relative z-10 px-8 py-16 md:py-24">
          <div className="max-w-4xl mx-auto text-center md:text-left">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md rounded-full border border-white/20 mb-6 mx-auto md:mx-0">
              <Sparkles className="w-4 h-4 text-yellow-300" />
              <span className="text-white/90 text-sm font-medium">Katalog Gotowych Usług</span>
            </div>

            {/* Title */}
            <h1 className="text-4xl md:text-6xl font-black text-white mb-6 leading-tight">
              Znajdź idealną usługę
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-purple-200 to-indigo-200">dla Twojej firmy</span>
            </h1>

            {/* Description */}
            <p className="text-lg text-white/80 max-w-2xl mb-12 leading-relaxed mx-auto md:mx-0 font-medium">
              Przeglądaj sprawdzone pakiety usług realizowane przez utalentowanych studentów.
              Stała cena, jasny zakres, gwarantowana jakość.
            </p>

            {/* Stats */}
            <div className="flex flex-wrap justify-center md:justify-start gap-4 md:gap-6">
              <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md rounded-2xl px-5 py-3 border border-white/10">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                  <Briefcase className="w-5 h-5 text-white" />
                </div>
                <div className="text-left">
                  <p className="text-2xl font-bold text-white leading-none">{totalServices}+</p>
                  <p className="text-xs text-white/60 font-medium mt-1">Dostępnych usług</p>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md rounded-2xl px-5 py-3 border border-white/10">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                  <GraduationCap className="w-5 h-5 text-white" />
                </div>
                <div className="text-left">
                  <p className="text-2xl font-bold text-white leading-none">2,500+</p>
                  <p className="text-xs text-white/60 font-medium mt-1">Studentów</p>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md rounded-2xl px-5 py-3 border border-white/10">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <div className="text-left">
                  <p className="text-2xl font-bold text-white leading-none">100%</p>
                  <p className="text-xs text-white/60 font-medium mt-1">Gwarancja jakości</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container max-w-7xl mx-auto px-4 pb-20">
        {/* Success Message */}
        {searchParams?.success === 'inquiry_sent' && (
          <div className="mb-8 p-5 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center gap-4 animate-in slide-in-from-top-4 fade-in duration-500 shadow-xl shadow-emerald-500/10">
            <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <CheckCircle2 className="h-6 w-6 text-emerald-600" />
            </div>
            <div>
              <p className="font-bold text-emerald-800">Zapytanie zostało wysłane pomyślnie!</p>
              <p className="text-sm text-emerald-600">
                Możesz śledzić jego status w zakładce{" "}
                <Link href="/app/chat" className="underline hover:text-emerald-800 font-semibold">Wiadomości</Link>.
              </p>
            </div>
          </div>
        )}

        {/* Main Content */}
        <Tabs defaultValue="platform" className="w-full">
          {/* Tabs Header */}
          <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-6 mb-10">
            <TabsList className="grid w-full xl:w-auto grid-cols-2 max-w-md bg-white p-2 rounded-2xl shadow-sm border border-slate-100 h-auto">
              <TabsTrigger
                value="platform"
                className="rounded-xl px-6 py-3 font-bold text-sm data-[state=active]:bg-slate-900 data-[state=active]:text-white data-[state=active]:shadow-lg hover:text-slate-600 transition-all"
              >
                <Shield className="w-4 h-4 mr-2" />
                Usługi Systemowe
              </TabsTrigger>
              <TabsTrigger
                value="student"
                className="rounded-xl px-6 py-3 font-bold text-sm data-[state=active]:bg-slate-900 data-[state=active]:text-white data-[state=active]:shadow-lg hover:text-slate-600 transition-all"
              >
                <Users className="w-4 h-4 mr-2" />
                Od Studentów
              </TabsTrigger>
            </TabsList>

            {/* Search - Visual Only for now */}
            <div className="flex items-center gap-3 w-full xl:w-auto">
              <div className="relative w-full xl:w-80">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Szukaj usługi..."
                  className="pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm w-full focus:outline-none focus:border-[#667eea] focus:ring-2 focus:ring-[#667eea]/20 transition-all shadow-sm font-medium placeholder:text-slate-400"
                />
              </div>
            </div>
          </div>

          {/* Platform Services Tab */}
          <TabsContent value="platform" className="space-y-10 animate-in fade-in-50 duration-500">
            {/* Category Filters */}
            <div className="flex flex-wrap gap-3">
              {categories.map((cat) => {
                const isActive = activeCategory === cat.id;
                return (
                  <Link
                    key={cat.id}
                    href={`?category=${cat.id}`}
                    scroll={false}
                    className={`
                        inline-flex items-center gap-2 px-5 py-3 rounded-2xl text-sm font-bold transition-all duration-200
                        ${isActive
                        ? 'bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white shadow-lg shadow-purple-500/25 scale-[1.02]'
                        : 'bg-white border border-slate-200 text-slate-600 hover:border-[#667eea]/50 hover:text-[#667eea] hover:shadow-md'
                      }
                    `}
                  >
                    <div className={isActive ? "text-white" : "text-slate-400"}>{cat.icon}</div>
                    {cat.label}
                  </Link>
                );
              })}
            </div>

            {/* Info Banner */}
            <div className="relative overflow-hidden bg-gradient-to-r from-[#667eea]/5 via-[#764ba2]/5 to-[#667eea]/5 rounded-3xl p-8 border border-[#667eea]/10">
              <div className="flex flex-col md:flex-row items-center md:items-start gap-6 text-center md:text-left">
                <div className="w-16 h-16 bg-gradient-to-br from-[#667eea] to-[#764ba2] rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-purple-500/20 rotate-3 md:rotate-0">
                  <CheckCircle2 className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Gwarancja Jakości Student2Work</h3>
                  <p className="text-gray-600 leading-relaxed max-w-3xl">
                    Usługi systemowe to nasz "złoty standard". Proces jest ustandaryzowany, cena stała i nienegocjowalna,
                    a wykonawcy weryfikowani. Ty zamawiasz efekt — my dbamy o resztę.
                  </p>
                </div>
              </div>
              <div className="absolute -right-20 -top-20 w-64 h-64 bg-gradient-to-br from-[#667eea]/10 to-[#764ba2]/10 rounded-full blur-3xl pointer-events-none"></div>
            </div>

            {/* Services Grid */}
            <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-3">
              {platformServices.map((pkg: any) => {
                const config = getCategoryConfig(pkg.category || pkg.title);
                return (
                  <div
                    key={pkg.id}
                    className="group relative flex flex-col bg-white rounded-[2.5rem] border border-slate-100 overflow-hidden transition-all duration-300 hover:border-[#667eea]/30 hover:shadow-2xl hover:shadow-purple-500/10 hover:-translate-y-2 cursor-default"
                  >
                    {/* Header */}
                    <div className={`relative h-48 bg-gradient-to-br ${config.gradient} p-8 overflow-hidden`}>
                      {/* Background Pattern */}
                      <div className="absolute inset-0 opacity-10 pointer-events-none">
                        <div className="absolute top-4 right-4 w-24 h-24 border-4 border-white rounded-full"></div>
                        <div className="absolute -bottom-10 -left-10 w-40 h-40 border-4 border-white rounded-full"></div>
                      </div>

                      {/* Icon */}
                      <div className="relative z-10 w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/30 shadow-inner">
                        <div className="text-white">
                          {getServiceIcon(pkg.title, pkg.category || pkg.title)}
                        </div>
                      </div>

                      {/* Badge */}
                      <div className="absolute top-8 right-8 z-10">
                        <Badge className="bg-black/20 backdrop-blur-md border px-4 py-1.5 h-auto text-white text-xs font-bold rounded-xl shadow-lg">
                          <Zap className="w-3.5 h-3.5 mr-1.5 text-yellow-300" />
                          Premium
                        </Badge>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex flex-col flex-grow p-8 pt-6">
                      {/* Category Tag */}
                      <div className={`inline-flex items-center gap-1.5 px-3 py-1 ${config.lightBg} rounded-lg w-fit mb-4`}>
                        <span className={`text-xs font-bold uppercase tracking-wider ${config.darkText}`}>
                          {pkg.category || "Usługa"}
                        </span>
                      </div>

                      {/* Title */}
                      <h3 className="text-2xl font-black text-slate-900 mb-3 group-hover:text-[#667eea] transition-colors line-clamp-2">
                        {pkg.title}
                      </h3>

                      {/* Description */}
                      <p className="text-slate-500 text-sm leading-relaxed mb-8 line-clamp-3">
                        {pkg.description}
                      </p>

                      <div className="mt-auto space-y-6">
                        {/* Meta Info */}
                        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 group-hover:bg-white group-hover:shadow-sm transition-all">
                          <div>
                            <div className="text-[10px] font-bold uppercase text-slate-400 mb-1">Czas</div>
                            <div className="flex items-center gap-1.5 font-bold text-slate-700">
                              <Clock className="w-4 h-4 text-[#667eea]" />
                              <span>{pkg.delivery_time_days} dni</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-[10px] font-bold uppercase text-slate-400 mb-1">Cena netto</div>
                            <div className="text-xl font-black text-slate-900">
                              {pkg.price} <span className="text-sm font-bold text-slate-400">PLN</span>
                            </div>
                          </div>
                        </div>

                        <Link
                          href={`/app/company/packages/${pkg.id}`}
                          className={`
                                w-full flex items-center justify-center gap-2 py-4 rounded-xl font-bold text-white
                                bg-gradient-to-r ${config.gradient}
                                shadow-lg shadow-purple-500/20
                                hover:shadow-xl hover:shadow-purple-500/30 hover:opacity-90
                                active:scale-[0.98] transition-all
                            `}
                        >
                          Wybierz pakiet
                          <ArrowRight className="w-5 h-5" />
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Empty State */}
            {platformServices.length === 0 && (
              <div className="col-span-full py-20 text-center bg-white rounded-[2.5rem] border border-slate-100 shadow-sm">
                <div className="w-24 h-24 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
                  <Sparkles className="h-10 w-10 text-slate-300" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-3">Brak usług w tej kategorii</h3>
                <p className="text-slate-500 mb-8 max-w-md mx-auto">Zmień kategorię lub sprawdź niezależne usługi od studentów. Na pewno znajdziesz coś dla siebie!</p>
                <Link
                  href="?category=all"
                  className="inline-flex items-center gap-2 px-8 py-4 bg-slate-900 text-white rounded-xl font-bold hover:shadow-lg transition-all"
                >
                  Zobacz wszystkie
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            )}
          </TabsContent>

          {/* Student Services Tab */}
          <TabsContent value="student" className="space-y-10 animate-in fade-in-50 duration-500">
            {/* Info Banner */}
            <div className="flex flex-col md:flex-row items-center justify-between bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm gap-6">
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-3xl flex items-center justify-center shadow-lg shadow-indigo-500/20 rotate-3">
                  <Users className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-1">Niezależne Usługi Studentów</h3>
                  <p className="text-gray-500 font-medium">Unikalne oferty wystawiane bezpośrednio przez talenty z całego kraju.</p>
                </div>
              </div>
              <Badge className="px-6 py-3 bg-slate-900 text-white rounded-xl font-bold shadow-lg shadow-slate-900/10 shrink-0">
                {studentServices.length} aktywnych ofert
              </Badge>
            </div>

            {/* Student Services Grid */}
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {studentServices.map((pkg: any) => (
                <div
                  key={pkg.id}
                  className="group relative flex flex-col rounded-[2.5rem] border border-slate-200 bg-white p-8 transition-all duration-300 hover:border-blue-300 hover:shadow-2xl hover:shadow-indigo-500/10 hover:-translate-y-2"
                >
                  {/* Student Info */}
                  <div className="flex items-center gap-4 mb-6">
                    <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center text-slate-500 font-bold text-xl border border-white shadow-inner group-hover:from-blue-500 group-hover:to-indigo-600 group-hover:text-white transition-all duration-300">
                      {pkg.student?.public_name?.[0]?.toUpperCase() || <User className="h-6 w-6" />}
                    </div>
                    <div className="flex-grow min-w-0">
                      <div className="flex items-center gap-2 mb-1.5">
                        <Link
                          href={`/app/students/${pkg.student_id}`}
                          className="font-bold text-lg text-slate-900 hover:text-[#667eea] transition-colors truncate"
                        >
                          {pkg.student?.public_name || "Student"}
                        </Link>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 border-emerald-100 text-[10px] font-bold px-2 py-0.5">
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          Zweryfikowany
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* Title */}
                  <h3 className="text-xl font-bold text-slate-900 mb-3 group-hover:text-blue-600 transition-colors line-clamp-2 leading-tight">
                    {pkg.title}
                  </h3>

                  {/* Description */}
                  <p className="text-sm text-slate-500 mb-8 flex-grow line-clamp-3 leading-relaxed font-medium">
                    {pkg.description}
                  </p>

                  {/* Footer */}
                  <div className="pt-6 border-t border-slate-100 space-y-6 mt-auto">
                    <div className="flex items-end justify-between">
                      <div>
                        <p className="text-[10px] font-bold uppercase text-slate-400 mb-1">Od</p>
                        <p className="font-black text-2xl text-slate-900">
                          {pkg.price} <span className="text-sm font-bold text-slate-400">PLN</span>
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-600 bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-lg font-bold text-xs">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{pkg.delivery_time_days} dni</span>
                      </div>
                    </div>

                    <Link
                      href={`/app/orders/create/${pkg.id}`}
                      className="w-full flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-4 text-sm font-bold text-white transition-all hover:bg-[#667eea] hover:shadow-lg hover:shadow-indigo-500/20 active:scale-[0.98]"
                    >
                      Zamów u studenta
                      <ArrowRight className="w-4 h-4 ml-1" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>

            {/* Empty State */}
            {studentServices.length === 0 && (
              <div className="col-span-full py-20 text-center bg-slate-50 rounded-[2.5rem] border border-slate-200">
                <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-sm">
                  <Users className="h-10 w-10 text-slate-300" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-2">Brak usług od studentów</h3>
                <p className="text-slate-500 font-medium">Bądź pierwszy i poproś o wycenę indywidualną.</p>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Bottom CTA */}
        <div className="mt-20 relative overflow-hidden bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-[2.5rem] p-10 md:p-14 shadow-2xl shadow-indigo-500/20">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-8 text-center md:text-left">
            <div>
              <h3 className="text-3xl font-black text-white mb-2">Nie znalazłeś tego, czego szukasz?</h3>
              <p className="text-indigo-200 font-medium text-lg">Opisz swoje potrzeby, a my dopasujemy odpowiedniego studenta w 24h.</p>
            </div>
            <Link
              href="/app/company/jobs/new"
              className="inline-flex items-center gap-2 px-8 py-5 bg-white text-indigo-900 rounded-2xl font-black shadow-xl hover:shadow-2xl hover:scale-105 transition-all text-lg whitespace-nowrap"
            >
              <Rocket className="w-6 h-6" />
              Dodaj własne zlecenie
            </Link>
          </div>

          {/* Background decorations */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-[#667eea]/30 to-transparent rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-[#764ba2]/30 to-transparent rounded-full blur-3xl pointer-events-none"></div>
        </div>
      </div>
    </div>
  );
}
