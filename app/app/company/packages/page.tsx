import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { PageContainer } from "@/components/ui/page-container";
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
  GraduationCap,
  PlusCircle
} from "lucide-react";

export const dynamic = "force-dynamic";

// ── Strip Markdown helper ────────────────────────────────────
function stripMarkdown(text: string): string {
  if (!text) return '';
  return text
    .replace(/^#{1,6}\s+/gm, '')    // headings: ###, ##, #
    .replace(/\*\*(.+?)\*\*/g, '$1') // bold
    .replace(/\*(.+?)\*/g, '$1')     // italic
    .replace(/`(.+?)`/g, '$1')       // inline code
    .replace(/\[(.+?)\]\(.+?\)/g, '$1') // links
    .replace(/^[-*+]\s+/gm, '')     // list bullets
    .replace(/^>\s+/gm, '')         // blockquote
    .replace(/\n{2,}/g, ' ')        // extra newlines
    .trim();
}

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

export default async function CompanyPackagesPage(props: { searchParams: Promise<{ category?: string; success?: string; type?: string; search?: string; sort?: string }> }) {
  const searchParams = await props.searchParams;
  const supabase = await createClient();

  /* 1. Fetch ALL Packages from service_packages */
  const { data: servicePackages, error: spError } = await supabase
    .from("service_packages")
    .select(`
      *,
      student:student_profiles (
        user_id,
        public_name
      )
    `)
    .eq("status", "active")
    .order("created_at", { ascending: false });

  if (spError) console.error("Error fetching packages:", spError);

  /* 2. Fetch Ranking Data (Reviews & Completed Projects) */
  const studentIds = Array.from(new Set(servicePackages?.filter(p => p.student_id).map(p => p.student_id) || []));
  
  const { data: allReviews } = await supabase
    .from("reviews")
    .select("rating, reviewee_id")
    .in("reviewee_id", studentIds);

  const { data: allApplications } = await supabase
    .from("applications")
    .select("student_id, status")
    .in("student_id", studentIds)
    .eq("status", "completed");

  /* 3. Helper for Ranking & Tags */
  const getStudentMetrics = (studentId: string) => {
    const studentReviews = allReviews?.filter(r => r.reviewee_id === studentId) || [];
    const completedProjects = allApplications?.filter(a => a.student_id === studentId).length || 0;
    const avgRating = studentReviews.length > 0 
      ? studentReviews.reduce((acc, curr) => acc + curr.rating, 0) / studentReviews.length 
      : 0;
    
    // Score Formula: Completed Projects * 2 + Avg Rating
    const score = (completedProjects * 2) + avgRating;

    const tags = [];
    if (avgRating >= 4.5 && completedProjects >= 3) tags.push("Top Talent");
    if (completedProjects >= 1) tags.push("Szybki Start");
    
    return { score, avgRating, completedProjects, tags };
  };

  /* 4. Filter & Segregate */
  const activeType = searchParams?.type || "platform";
  const activeCategory = searchParams?.category || "all";
  const searchQuery = (searchParams?.search || "").toLowerCase();
  const sortOrder = searchParams?.sort || "score"; // 'score', 'price_asc', 'price_desc', 'newest'

  const filterByAll = (p: any) => {
    // Category Filter
    if (activeCategory !== "all") {
      const cat = (p.category || "").toLowerCase();
      const match = (activeCategory === 'video' && (cat.includes('video') || cat.includes('wideo'))) ||
                    (activeCategory === 'grafika' && (cat.includes('grafika') || cat.includes('design'))) ||
                    (activeCategory === 'it' && (cat.includes('program') || cat.includes('it') || cat.includes('web'))) ||
                    (activeCategory === 'marketing' && (cat.includes('market') || cat.includes('social'))) ||
                    (cat === activeCategory || cat.includes(activeCategory));
      if (!match) return false;
    }
    // Search Filter
    if (searchQuery) {
      const tit = (p.title || "").toLowerCase();
      const des = (p.description || "").toLowerCase();
      if (!tit.includes(searchQuery) && !des.includes(searchQuery)) return false;
    }
    return true;
  };

  let platformServices = servicePackages?.filter((p: any) => p.type === 'platform_service' && filterByAll(p)) || [];
  let studentServices = servicePackages?.filter((p: any) => (!p.type || p.type === 'student_gig') && filterByAll(p)) || [];

  // Enrich Student Services with Ranking & Tags
  studentServices = studentServices.map((p: any) => {
    const metrics = getStudentMetrics(p.student_id);
    const isNew = (new Date().getTime() - new Date(p.created_at).getTime()) < (7 * 24 * 60 * 60 * 1000);
    const finalTags = [...metrics.tags];
    if (isNew) finalTags.push("Nowość");
    
    return { ...p, ...metrics, tags: finalTags };
  });

  // Apply Sorting
  const sortBy = (data: any[], order: string) => {
    return [...data].sort((a, b) => {
      if (order === 'price_asc') return Number(a.price) - Number(b.price);
      if (order === 'price_desc') return Number(b.price) - Number(a.price);
      if (order === 'newest') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      return (b.score || 0) - (a.score || 0);
    });
  };

  platformServices = sortBy(platformServices, sortOrder);
  studentServices = sortBy(studentServices, sortOrder);

  const totalServices = platformServices.length + studentServices.length;

  return (
    <div className="min-h-screen pb-10 relative">
      {/* Ambient background blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-indigo-950/30 to-transparent" />
        <div className="absolute top-1/4 -left-32 w-[600px] h-[600px] bg-indigo-500/5 rounded-full blur-[120px]" />
        <div className="absolute top-1/3 -right-32 w-[500px] h-[500px] bg-violet-500/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 left-1/3 w-[400px] h-[400px] bg-blue-500/5 rounded-full blur-[100px]" />
      </div>
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#667eea] via-[#764ba2] to-[#667eea] border-b border-white/10 mb-10 shadow-[0_20px_50px_-15px_rgba(118,75,162,0.3)]">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-white/10 rounded-full blur-[100px] animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-400/20 rounded-full blur-[80px]"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-white/5 to-transparent rounded-full animate-rotate-slow"></div>

          {/* Floating shapes */}
          <div className="absolute top-20 left-20 w-4 h-4 bg-white/20 rounded-full animate-bounce" style={{ animationDuration: '3.3s' }}></div>
          <div className="absolute top-40 right-40 w-6 h-6 bg-white/10 rounded-lg rotate-45 animate-pulse"></div>
          <div className="absolute bottom-20 left-1/3 w-3 h-3 bg-white/20 rounded-full animate-bounce" style={{ animationDuration: '2.7s', animationDelay: '0.5s' }}></div>
        </div>

        <div className="relative z-10 px-8 py-20 md:py-32">
          <div className="max-w-6xl mx-auto text-center md:text-left">
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-black text-white mb-8 leading-[0.9] tracking-tighter">
              Transformuj swój <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-200 via-white to-purple-200 italic pr-4">business</span>
            </h1>

            {/* Description */}
            <p className="text-xl text-white/70 max-w-2xl mb-14 leading-relaxed mx-auto md:mx-0 font-medium">
              Odkryj gotowe pakiety usług realizowane przez wyselekcjonowane talenty. 
              Stałe stawki, profesjonalny proces, gwarantowany efekt końcowy.
            </p>

            {/* Stats */}
            <div className="flex flex-wrap justify-center md:justify-start gap-6 md:gap-10">
              <div className="flex items-center gap-4 group">
                <div className="w-14 h-14 bg-white/10 backdrop-blur-xl rounded-2xl flex items-center justify-center border border-white/10 group-hover:bg-white/20 transition-all duration-500">
                  <Briefcase className="w-6 h-6 text-white" />
                </div>
                <div className="text-left">
                  <p className="text-3xl font-black text-white leading-none tracking-tighter">{totalServices}+</p>
                  <p className="text-[10px] text-white/50 font-black uppercase tracking-widest mt-1.5">Usług</p>
                </div>
              </div>
              <div className="flex items-center gap-4 group">
                <div className="w-14 h-14 bg-white/10 backdrop-blur-xl rounded-2xl flex items-center justify-center border border-white/10 group-hover:bg-white/20 transition-all duration-500">
                  <GraduationCap className="w-6 h-6 text-white" />
                </div>
                <div className="text-left">
                  <p className="text-3xl font-black text-white leading-none tracking-tighter">2,500+</p>
                  <p className="text-[10px] text-white/50 font-black uppercase tracking-widest mt-1.5">Studentów</p>
                </div>
              </div>
              <div className="flex items-center gap-4 group">
                <div className="w-14 h-14 bg-white/10 backdrop-blur-xl rounded-2xl flex items-center justify-center border border-white/10 group-hover:bg-white/20 transition-all duration-500">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <div className="text-left">
                  <p className="text-3xl font-black text-white leading-none tracking-tighter">100%</p>
                  <p className="text-[10px] text-white/50 font-black uppercase tracking-widest mt-1.5">Zaufania</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <PageContainer className="pb-20 relative">
        {/* Subtle Background Blobs */}
        <div className="absolute top-1/4 -left-20 w-96 h-96 bg-indigo-500/5 rounded-full blur-[100px] pointer-events-none animate-pulse"></div>
        <div className="absolute bottom-1/4 -right-20 w-[500px] h-[500px] bg-purple-500/5 rounded-full blur-[120px] pointer-events-none animate-pulse delay-1000"></div>

        {/* Success Message */}
        {searchParams?.success === 'inquiry_sent' && (
          <div className="mb-10 p-5 rounded-3xl bg-emerald-50 border border-emerald-200 flex items-center gap-4 animate-in slide-in-from-top-4 fade-in duration-500 shadow-xl shadow-emerald-500/10 relative z-20">
            <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-inner">
              <CheckCircle2 className="h-6 w-6 text-emerald-600" />
            </div>
            <div>
              <p className="font-bold text-emerald-800">Zapytanie zostało wysłane pomyślnie!</p>
              <p className="text-sm text-emerald-600 font-medium">
                Możesz śledzić jego status w zakładce{" "}
                <Link href="/app/chat" className="underline hover:text-emerald-800 font-bold">Wiadomości</Link>.
              </p>
            </div>
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-10 relative z-10">
          
          {/* ── LEFT SIDEBAR (FILTERS) ── */}
          <aside className="w-full lg:w-[320px] flex-shrink-0">
            <div className="lg:sticky lg:top-24 space-y-8">
              
              {/* Tabs Switcher (Sidebar style) */}
              <div className="bg-white p-2 rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-100 flex flex-col gap-1">
                <Link 
                  href="?type=platform" 
                  className={cn(
                    "flex items-center gap-3 px-6 py-4 rounded-2xl font-bold text-sm transition-all",
                    activeType === "platform" 
                      ? "bg-slate-900 text-white shadow-lg shadow-slate-900/20 translate-x-1" 
                      : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                  )}
                >
                  <Shield className={cn("w-5 h-5", activeType === "platform" ? "text-indigo-400" : "text-slate-400")} />
                  Usługi Systemowe
                  <div className={cn("ml-auto w-2 h-2 rounded-full", activeType === "platform" ? "bg-indigo-400 animate-pulse" : "bg-transparent")} />
                </Link>
                <Link 
                  href="?type=student" 
                  className={cn(
                    "flex items-center gap-3 px-6 py-4 rounded-2xl font-bold text-sm transition-all",
                    activeType === "student" 
                      ? "bg-slate-900 text-white shadow-lg shadow-slate-900/20 translate-x-1" 
                      : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                  )}
                >
                  <Users className={cn("w-5 h-5", activeType === "student" ? "text-blue-400" : "text-slate-400")} />
                  Od Studentów
                  <div className={cn("ml-auto w-2 h-2 rounded-full", activeType === "student" ? "bg-blue-400 animate-pulse" : "bg-transparent")} />
                </Link>
              </div>

              {/* Search & Categories */}
              <div className="bg-white rounded-[2.5rem] p-6 shadow-xl shadow-slate-200/50 border border-slate-100 space-y-8">
                <div className="space-y-4">
                  <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-2">Wyszukiwarka</h4>
                  <div className="flex flex-col gap-3">
                    <form className="relative group">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                      <input
                        type="text"
                        name="search"
                        defaultValue={searchQuery}
                        placeholder="Szukaj usługi..."
                        className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm focus:outline-none focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/5 transition-all font-semibold placeholder:text-slate-400"
                      />
                      <input type="hidden" name="type" value={activeType} />
                      <input type="hidden" name="category" value={activeCategory} />
                    </form>

                    <div className="flex gap-1.5 flex-wrap">
                      {[
                        { value: 'score', label: 'Najlepsze' },
                        { value: 'newest', label: 'Nowe' },
                        { value: 'price_asc', label: '↑ Cena' },
                        { value: 'price_desc', label: '↓ Cena' },
                      ].map(opt => {
                        const sortUrl = `?type=${activeType}&category=${activeCategory}&sort=${opt.value}${searchQuery ? `&search=${searchQuery}` : ''}`;
                        return (
                          <Link
                            key={opt.value}
                            href={sortUrl}
                            scroll={false}
                            className={cn(
                              "px-3 py-1.5 rounded-xl text-xs font-bold transition-all",
                              sortOrder === opt.value
                                ? "bg-slate-900 text-white shadow-sm"
                                : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                            )}
                          >
                            {opt.label}
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Categories */}
                <div className="space-y-4">
                  <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-2">Kategorie</h4>
                  <nav className="flex flex-col gap-1">
                    {categories.map((cat) => {
                      const isActive = activeCategory === cat.id;
                      const baseUrl = `?category=${cat.id}&type=${activeType}`;
                      const searchPart = searchQuery ? `&search=${searchQuery}` : '';
                      const sortPart = sortOrder !== 'score' ? `&sort=${sortOrder}` : '';
                      
                      return (
                        <Link
                          key={cat.id}
                          href={`${baseUrl}${searchPart}${sortPart}`}
                          scroll={false}
                          className={cn(
                            "group flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all duration-300",
                            isActive
                              ? "bg-indigo-50 text-indigo-700 shadow-sm ring-1 ring-indigo-200/50"
                              : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                          )}
                        >
                          <div className={cn(
                            "p-2 rounded-lg transition-all duration-300",
                            isActive ? "bg-white shadow-sm text-indigo-600 rotate-0" : "bg-slate-100 text-slate-400 group-hover:bg-white group-hover:rotate-6"
                          )}>
                            {cat.icon}
                          </div>
                          <span className="flex-1 truncate">{cat.label}</span>
                          {isActive && <ArrowRight className="w-3.5 h-3.5 animate-in slide-in-from-left-2" />}
                        </Link>
                      );
                    })}
                  </nav>
                </div>

                {/* Support Card in Sidebar */}
                <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-violet-600 via-indigo-600 to-blue-600 p-0.5 shadow-xl shadow-indigo-500/30 group">
                  <div className="relative rounded-[calc(1.5rem-2px)] bg-slate-950 p-5 overflow-hidden">
                    {/* animated blobs */}
                    <div className="absolute -top-8 -right-8 w-28 h-28 bg-violet-500/20 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
                    <div className="absolute -bottom-8 -left-8 w-24 h-24 bg-indigo-500/20 rounded-full blur-2xl" />

                    <div className="relative z-10">
                      {/* pulsing badge */}
                      <div className="inline-flex items-center gap-1.5 bg-violet-500/15 border border-violet-500/30 rounded-full px-3 py-1 mb-4">
                        <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
                        <span className="text-[10px] font-black text-violet-300 uppercase tracking-widest">Dedykowane</span>
                      </div>

                      <h5 className="font-black text-white text-base mb-2 leading-tight">Nie znalazłeś tego czego szukasz?</h5>
                      <p className="text-[11px] text-white/50 mb-5 leading-relaxed font-medium">
                        Opisz swoje potrzeby — przygotujemy ofertę szytą na miarę w ciągu 24h.
                      </p>

                      <Link
                        href="/app/company/jobs/new"
                        className="flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-violet-500 to-indigo-600 text-white text-xs font-black shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 hover:scale-[1.03] transition-all"
                      >
                        <PlusCircle className="w-3.5 h-3.5" />
                        Dodaj własne zlecenie
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </aside>

          {/* ── RIGHT CONTENT ── */}
          <main className="flex-1 space-y-10">

            {/* ── PROMINENT CUSTOM JOB CTA BANNER ── */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-700 p-px shadow-2xl shadow-indigo-500/20">
              <div className="relative rounded-[calc(1.5rem-1px)] bg-slate-950/80 backdrop-blur-sm px-8 py-6 flex flex-col sm:flex-row items-center gap-6 overflow-hidden">
                {/* background glow */}
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/10 via-violet-600/10 to-purple-700/10 pointer-events-none" />
                <div className="absolute -right-16 -top-16 w-48 h-48 bg-violet-500/10 rounded-full blur-3xl" />

                <div className="relative z-10 flex-1 text-center sm:text-left">
                  <div className="inline-flex items-center gap-2 bg-violet-500/15 border border-violet-500/25 rounded-full px-3 py-1 mb-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
                    <span className="text-[10px] font-black text-violet-300 uppercase tracking-widest">Nowa możliwość</span>
                  </div>
                  <h3 className="text-lg font-black text-white leading-tight mb-1">
                    Nie znalazłeś pasującej usługi? <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 to-violet-300">Dodaj własne zlecenie!</span>
                  </h3>
                  <p className="text-sm text-white/50 font-medium">
                    Opisz czego szukasz — studenci złożą Ci oferty dopasowane do Twoich potrzeb.
                  </p>
                </div>

                <Link
                  href="/app/company/jobs/new"
                  className="relative z-10 shrink-0 flex items-center gap-2 px-7 py-3.5 rounded-2xl bg-gradient-to-r from-indigo-500 to-violet-600 text-white font-black text-sm shadow-xl shadow-indigo-500/30 hover:shadow-indigo-500/50 hover:-translate-y-0.5 hover:scale-[1.02] transition-all whitespace-nowrap"
                >
                  <PlusCircle className="w-4 h-4" />
                  Dodaj zlecenie
                </Link>
              </div>
            </div>

            {activeType === 'platform' && (
              <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
                {/* Info Banner (Improved Glassmorphism) */}
                <div className="group relative overflow-hidden bg-white/60 backdrop-blur-xl rounded-[2.5rem] p-8 border border-white/40 shadow-2xl shadow-slate-200/40">
                  <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 via-purple-500/5 to-indigo-500/5 animate-pulse"></div>
                  <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start gap-8 text-center md:text-left">
                    <div className="relative">
                      <div className="absolute inset-0 bg-indigo-500 blur-2xl opacity-20 group-hover:opacity-40 transition-opacity"></div>
                      <div className="w-20 h-20 bg-gradient-to-br from-indigo-600 to-violet-700 rounded-3xl flex items-center justify-center flex-shrink-0 shadow-2xl shadow-indigo-500/30 rotate-3 transition-transform group-hover:rotate-0 duration-500">
                        <CheckCircle2 className="h-10 w-10 text-white" />
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
                        <h3 className="text-2xl font-black text-slate-900 tracking-tight">Gwarancja Jakości Student2Work</h3>
                        <Badge className="bg-amber-100 text-amber-700 border-amber-200 font-black uppercase text-[10px] tracking-widest px-2 shadow-sm">Standard Pro</Badge>
                      </div>
                      <p className="text-slate-600 leading-relaxed max-w-4xl font-medium text-lg">
                        Usługi systemowe to nasz "złoty standard". Proces jest ustandaryzowany, cena stała i nienegocjowalna,
                        a wykonawcy weryfikowani. <span className="text-indigo-600 font-bold">Ty zamawiasz efekt — my dbamy o resztę.</span>
                      </p>
                    </div>
                  </div>
                  <div className="absolute -right-20 -top-20 w-80 h-80 bg-gradient-to-br from-indigo-200/20 to-transparent rounded-full blur-[100px] pointer-events-none group-hover:bg-indigo-300/30 transition-all duration-700"></div>
                </div>

                {/* Services Grid (Revamped Cards) */}
                <div className="grid gap-8 md:grid-cols-2 2xl:grid-cols-3">
                  {platformServices.map((pkg: any) => {
                    const config = getCategoryConfig(pkg.category || pkg.title);
                    return (
                      <div
                        key={pkg.id}
                        className="group relative flex flex-col bg-white rounded-[3rem] border border-slate-100 overflow-hidden transition-all duration-500 hover:border-indigo-200 hover:shadow-[0_20px_60px_-15px_rgba(99,102,241,0.15)] hover:-translate-y-3 cursor-default"
                      >
                        {/* Glow effect on hover */}
                        <div className={`absolute top-0 right-0 w-64 h-64 bg-gradient-to-br ${config.gradient} opacity-0 group-hover:opacity-10 blur-[100px] transition-opacity duration-700 rounded-full`}></div>

                        {/* Top Gradient Visual */}
                        <div className={`relative h-56 bg-gradient-to-br ${config.gradient} p-8 overflow-hidden`}>
                          {/* Rich Background Elements */}
                          <div className="absolute inset-0 opacity-[0.15] pointer-events-none">
                            <div className="absolute -top-10 -right-10 w-48 h-48 border-[12px] border-white rounded-full animate-rotate-slow"></div>
                            <div className="absolute -bottom-20 -left-10 w-64 h-64 border-[16px] border-white rounded-full"></div>
                            <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] bg-repeat opacity-20"></div>
                          </div>

                          {/* Float Icons */}
                          <div className="relative z-10 w-20 h-20 bg-white/20 backdrop-blur-xl rounded-[2rem] flex items-center justify-center border border-white/40 shadow-2xl transition-transform group-hover:scale-110 group-hover:rotate-6 duration-500">
                            <div className="text-white drop-shadow-lg scale-125">
                              {getServiceIcon(pkg.title, pkg.category || pkg.title)}
                            </div>
                          </div>

                          {/* Badge */}
                          <div className="absolute top-10 right-10 z-10">
                            <Badge className="bg-white/90 backdrop-blur-sm border-none px-5 py-2 h-auto text-slate-900 text-[10px] font-black uppercase tracking-[0.2em] rounded-full shadow-xl animate-in zoom-in-75 duration-500">
                              <Sparkles className="w-3.5 h-3.5 mr-2 text-indigo-600 fill-current animate-pulse" />
                              Systemowa
                            </Badge>
                          </div>
                        </div>

                        {/* Card Content */}
                        <div className="flex flex-col flex-grow p-10 pt-8 relative">
                          <div className={`absolute top-0 left-10 -translate-y-1/2 inline-flex items-center gap-2 px-6 py-2 ${config.lightBg} border border-white rounded-full shadow-lg z-20`}>
                            <div className={`w-2 h-2 rounded-full ${config.gradient.split(' ')[0].replace('from-', 'bg-')}`}></div>
                            <span className={`text-[11px] font-black uppercase tracking-widest ${config.darkText}`}>
                              {pkg.category || "Usługa"}
                            </span>
                          </div>

                          <h3 className="text-[1.75rem] font-black text-slate-900 mb-4 leading-tight group-hover:text-indigo-600 transition-colors">
                            {pkg.title}
                          </h3>

                          <p className="text-slate-500 text-base leading-relaxed mb-10 line-clamp-3 font-medium">
                            {stripMarkdown(pkg.description)}
                          </p>

                          <div className="mt-auto space-y-8">
                            {/* Metrics Grid */}
                            <div className="grid grid-cols-2 gap-4">
                              <div className="p-4 bg-slate-50/50 rounded-[1.5rem] border border-slate-100 group-hover:bg-white group-hover:border-indigo-100 transition-all text-center">
                                <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Expres</div>
                                <div className="flex items-center justify-center gap-1.5 font-black text-slate-700">
                                  <Clock className="w-4 h-4 text-indigo-500" />
                                  <span>{pkg.delivery_time_days} dni</span>
                                </div>
                              </div>
                              <div className="p-4 bg-slate-50/50 rounded-[1.5rem] border border-slate-100 group-hover:bg-white group-hover:border-indigo-100 transition-all text-center">
                                <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Koszt netto</div>
                                <div className="text-2xl font-black text-slate-900 tracking-tighter">
                                  {pkg.price}<span className="text-xs font-bold text-slate-400 ml-1">PLN</span>
                                </div>
                              </div>
                            </div>

                            <Link
                              href={`/app/company/packages/${pkg.id}`}
                              className={`
                                width-full group/btn flex items-center justify-center gap-3 py-5 rounded-2xl font-black text-white text-lg
                                bg-gradient-to-r ${config.gradient}
                                shadow-[0_10px_30px_-5px_rgba(99,102,241,0.3)]
                                hover:shadow-[0_15px_40px_-5px_rgba(99,102,241,0.4)] hover:scale-[1.02]
                                active:scale-[0.98] transition-all duration-300
                              `}
                            >
                              Pokaż ofertę
                              <ArrowRight className="w-6 h-6 group-hover/btn:translate-x-1.5 transition-transform" />
                            </Link>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Empty State */}
                {platformServices.length === 0 && (
                  <div className="py-32 text-center bg-white rounded-[3.5rem] border border-slate-100 shadow-2xl shadow-slate-200/30">
                    <div className="w-32 h-32 bg-indigo-50 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 shadow-inner rotate-3">
                      <Sparkles className="h-16 w-16 text-indigo-300 animate-pulse" />
                    </div>
                    <h3 className="text-3xl font-black text-slate-900 mb-4 tracking-tight">Cisza w eterze...</h3>
                    <p className="text-slate-500 mb-12 max-w-lg mx-auto font-medium text-lg leading-relaxed">Wygląda na to, że w tej kategorii nie mamy jeszcze gotowych pakietów. Wybierz inną kategorię lub napisz do nas!</p>
                    <Link
                      href="?category=all&type=platform"
                      className="inline-flex items-center gap-3 px-12 py-5 bg-slate-900 text-white rounded-[1.5rem] font-black hover:bg-indigo-600 hover:shadow-2xl hover:shadow-indigo-500/30 transform hover:-translate-y-1 transition-all"
                    >
                      Pokaż wszystko
                      <ArrowRight className="w-5 h-5" />
                    </Link>
                  </div>
                )}
              </div>
            )}

            {/* STUDENT SERVICES VIEW (Optional, keeping consistent) */}
            {activeType === 'student' && (
              <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="flex flex-col md:flex-row items-center justify-between bg-white/60 backdrop-blur-xl p-10 rounded-[3.5rem] border border-white/50 shadow-2xl shadow-slate-200/40 gap-8">
                  <div className="flex items-center gap-8">
                    <div className="relative">
                      <div className="absolute inset-0 bg-blue-500 blur-2xl opacity-20"></div>
                      <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-700 rounded-3xl flex items-center justify-center shadow-2xl shadow-blue-500/30 rotate-6">
                        <Users className="w-10 h-10 text-white" />
                      </div>
                    </div>
                    <div>
                      <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-2">Portfolio Studentów</h3>
                      <p className="text-slate-500 font-medium text-lg max-w-xl line-clamp-2">Gotowe usługi wystawiane bezpośrednio przez wybitne talenty z całej Polski. Każda oferta jest unikalna.</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-center">
                    <div className="text-4xl font-black text-indigo-600 mb-1">{studentServices.length}</div>
                    <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Aktywnych Ofert</div>
                  </div>
                </div>

                <div className="grid gap-6 sm:grid-cols-2 2xl:grid-cols-3">
                  {studentServices.map((pkg: any) => (
                    <Link
                      key={pkg.id}
                      href={`/app/orders/create/${pkg.id}`}
                      className="group relative flex flex-col rounded-[2.5rem] border border-slate-200 bg-white overflow-hidden transition-all duration-500 hover:border-blue-300 hover:shadow-[0_20px_50px_-12px_rgba(59,130,246,0.2)] hover:-translate-y-2"
                    >
                      {/* Glow overlay */}
                      <div className="absolute top-0 right-0 w-56 h-56 bg-blue-500/5 opacity-0 group-hover:opacity-100 blur-[60px] pointer-events-none transition-opacity duration-700 rounded-full" />

                      {/* Top tags bar */}
                      {pkg.tags && pkg.tags.length > 0 && (
                        <div className="flex gap-1.5 px-6 pt-5 pb-0 flex-wrap">
                          {pkg.tags.map((tag: string) => (
                            <span key={tag} className={cn(
                              "text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg",
                              tag === 'Top Talent' ? "bg-amber-100 text-amber-700 border border-amber-200" :
                              tag === 'Nowość' ? "bg-emerald-100 text-emerald-700 border border-emerald-200" :
                              "bg-blue-50 text-blue-600 border border-blue-100"
                            )}>
                              {tag === 'Top Talent' && '⭐ '}{tag}
                            </span>
                          ))}
                        </div>
                      )}

                      <div className="flex flex-col flex-1 p-6 gap-4">
                        {/* Author + Stats row */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-black text-sm shadow-md">
                              {pkg.student?.public_name?.[0]?.toUpperCase() || 'S'}
                            </div>
                            <span className="text-xs font-bold text-slate-600 truncate max-w-[130px]">
                              {pkg.student?.public_name || 'Student Impact'}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-50 border border-slate-100 rounded-full">
                            <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                            <span className="text-[11px] font-black text-slate-800">
                              {(pkg.avgRating > 0 ? pkg.avgRating : 5).toFixed(1)}
                            </span>
                            {pkg.completedProjects > 0 && (
                              <>
                                <span className="w-px h-3 bg-slate-200 mx-0.5" />
                                <span className="text-[11px] font-bold text-slate-500">{pkg.completedProjects} proj.</span>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Title */}
                        <h3 className="text-lg font-black text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-2 leading-tight min-h-[3.5rem]">
                          {pkg.title}
                        </h3>

                        {/* Description */}
                        <p className="text-slate-500 text-sm leading-relaxed line-clamp-2 flex-1 font-medium">
                          {pkg.description || 'Profesjonalna usługa realizowana przez studenta.'}
                        </p>

                        {/* Price + CTA bar */}
                        <div className="flex items-center justify-between pt-4 border-t border-slate-100 mt-2">
                          <div>
                            <div className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-0.5">Cena od</div>
                            <div className="text-xl font-black text-slate-900 tracking-tighter">
                              {Number(pkg.price).toLocaleString()} <span className="text-xs text-slate-400 font-bold">PLN</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 text-slate-500 text-xs font-bold">
                            <Clock className="w-3.5 h-3.5" />
                            {pkg.delivery_time_days} dni
                            <div className="ml-2 w-9 h-9 bg-slate-900 text-white rounded-xl flex items-center justify-center transition-all group-hover:bg-blue-600 group-hover:scale-110 shadow-lg">
                              <ArrowRight className="w-4 h-4" />
                            </div>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>

                {studentServices.length === 0 && (
                  <div className="text-center py-24 bg-white/50 backdrop-blur-sm rounded-[3rem] border-2 border-dashed border-slate-200 animate-in fade-in zoom-in duration-500">
                    <div className="w-20 h-20 bg-slate-100 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-inner">
                      <Search className="w-10 h-10 text-slate-300" />
                    </div>
                    <h3 className="text-2xl font-black text-slate-900 mb-2">Brak wyników</h3>
                    <p className="text-slate-500 font-medium mb-6">Spróbuj zmienić parametry wyszukiwania lub kategorię.</p>
                    <Link href="?type=student" className="px-6 py-3 bg-slate-900 text-white rounded-2xl font-bold hover:scale-105 transition-all shadow-xl shadow-slate-900/10">
                      Wyczyść filtry
                    </Link>
                  </div>
                )}

              </div>
            )}
          </main>
        </div>

        {/* BOTTOM CTA: FULL WIDTH VIBRANT BANNER */}
        <div className="group mt-32 relative overflow-hidden bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 rounded-[4rem] p-16 md:p-24 shadow-[0_50px_100px_-20px_rgba(99,102,241,0.3)]">
          <div className="absolute inset-0 opacity-20 group-hover:opacity-40 transition-opacity duration-1000">
            <div className="absolute top-0 left-0 w-full h-full bg-[url('/grid-pattern.svg')] bg-repeat opacity-30"></div>
            <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-indigo-500 rounded-full blur-[150px] animate-pulse"></div>
            <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-purple-500 rounded-full blur-[150px] animate-pulse delay-700"></div>
          </div>

          <div className="relative z-10 flex flex-col xl:flex-row xl:items-center xl:justify-between gap-12 text-center xl:text-left h-full">
            <div className="max-w-3xl space-y-6">
              <Badge className="bg-indigo-500/20 text-indigo-300 border-indigo-500/30 px-6 py-2 rounded-full font-black uppercase text-xs tracking-[0.3em]">Indywidualne podejście</Badge>
              <h3 className="text-4xl md:text-6xl font-black text-white leading-[1.1] tracking-tight">
                Potrzebujesz czegoś <br/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 to-purple-300 italic pr-4">nieszablonowego?</span>
              </h3>
              <p className="text-indigo-200/70 font-medium text-xl leading-relaxed">
                Opisz swoje potrzeby naszym ekspertom, a my w ciągu 24h znajdziemy dla Ciebie 
                <span className="text-white font-bold ml-1">idealnego wykonawcę</span> spośród tysięcy studentów.
              </p>
            </div>
            
            <Link
              href="/app/company/jobs/new"
              className="group/cta inline-flex items-center justify-center gap-4 px-12 py-8 bg-white text-slate-950 rounded-[2rem] font-black shadow-2xl hover:bg-indigo-50 hover:scale-105 transition-all text-2xl whitespace-nowrap active:scale-95"
            >
              <Rocket className="w-8 h-8 text-indigo-600 group-hover/cta:animate-bounce" />
              Dodaj własne zlecenie
            </Link>
          </div>

          {/* Abstract small particles */}
          <div className="absolute top-1/2 left-10 w-2 h-2 bg-indigo-400 rounded-full animate-ping"></div>
          <div className="absolute top-1/3 right-1/3 w-1.5 h-1.5 bg-purple-400 rounded-full animate-ping delay-500"></div>
          </div>
        </PageContainer>
      </div>
    );
}
