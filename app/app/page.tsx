import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { OfferCard } from "./_components/offer-card";
import HeroSection from "./_components/hero-section";

export const dynamic = "force-dynamic";

type SP = Record<string, string | string[] | undefined>;

function getStr(sp: SP, key: string) {
  const v = sp[key];
  return typeof v === "string" ? v : "";
}

function minutesAgo(iso?: string | null) {
  if (!iso) return null;
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return null;
  return Math.floor((Date.now() - t) / (60 * 1000));
}

export default async function OffersPage({
  searchParams,
}: {
  searchParams: Promise<SP>;
}) {
  const sp = await searchParams;

  const q = getStr(sp, "q");
  const typ = getStr(sp, "typ") || "micro"; // Default to Mikrozlecenia
  const sub = getStr(sp, "sub"); // platform / regular / all
  const min = getStr(sp, "min"); // stawka od
  const max = getStr(sp, "max"); // stawka do
  const sort = getStr(sp, "sort") || "newest"; // newest/oldest/stawka_desc/stawka_asc

  const supabase = await createClient();

  // user + rola (żeby pokazać dopisek "aplikowałeś")
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;

  let role: string | null = null;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("user_id", user.id)
      .single();
    role = profile?.role ?? null;
    // Firma nie powinna widzieć publicznej tablicy ofert (to widok dla studentów)
    if (role === "company") redirect("/app/company/packages");
    // Admin powinien widzieć Panel Admina
    if (role === "admin") redirect("/app/admin/offers");
    // Student powinien widzieć Giełdę Zleceń zamiast Dashboardu
    if (role === "student" && !sp.typ) {
      redirect("/app/jobs");
    }
  }

  // Budowanie query ofert
  let query = supabase
    .from("offers")
    .select("id, tytul, opis, typ, czas, wymagania, stawka, status, created_at, kategoria, technologies, is_platform_service, salary_range_min")
    .eq("status", "published");

  const cat = getStr(sp, "cat");
  if (cat) {
    query = query.eq("kategoria", cat);
  }

  if (typ && ["micro", "projekt", "praktyka"].includes(typ)) {
    query = query.eq("typ", typ);
  }

  // Sub-filter logic for Micro tasks
  if (typ === "micro") {
    if (sub === "platform") {
      query = query.eq("is_platform_service", true);
    } else if (sub === "regular") {
      query = query.eq("is_platform_service", false);
    }
  }

  if (q) {
    const safe = q.replace(/%/g, "\\%").replace(/_/g, "\\_");
    query = query.or(`tytul.ilike.%${safe}%,opis.ilike.%${safe}%`);
  }

  const minN = Number(min);
  if (!Number.isNaN(minN) && min !== "") query = query.gte("stawka", minN);

  const maxN = Number(max);
  if (!Number.isNaN(maxN) && max !== "") query = query.lte("stawka", maxN);

  if (sort === "oldest") query = query.order("created_at", { ascending: true });
  else if (sort === "stawka_asc") query = query.order("stawka", { ascending: true });
  else if (sort === "stawka_desc") query = query.order("stawka", { ascending: false });
  else query = query.order("created_at", { ascending: false }); // newest

  const { data: offers, error } = await query;

  // ✅ Zamiast ukrywać — oznaczamy oferty, do których student już aplikował
  const myAppByOfferId = new Map<
    string,
    {
      id: string;
      status: string;
      created_at: string | null;
      proposed_stawka: number | null;
      counter_stawka: number | null;
    }
  >();

  if (user && role === "student") {
    const { data: apps } = await supabase
      .from("applications")
      .select("id, offer_id, status, created_at, proposed_stawka, counter_stawka")
      .eq("student_id", user.id)
      .neq("status", "rejected");

    (apps ?? []).forEach((a: any) => {
      if (!a?.offer_id) return;
      myAppByOfferId.set(a.offer_id, {
        id: a.id,
        status: a.status ?? "sent",
        created_at: a.created_at ?? null,
        proposed_stawka: a.proposed_stawka ?? null,
        counter_stawka: a.counter_stawka ?? null,
      });
    });
  }

  // Fetch technologies/skills for matching
  let studentSkills: string[] = [];
  if (user && role === "student") {
    const { data: stData } = await supabase
      .from("student_profiles")
      .select("kompetencje")
      .eq("user_id", user.id)
      .single();
    studentSkills = stData?.kompetencje || [];
  }

  const visibleOffers = offers ?? [];
  const appliedCount = myAppByOfferId.size;

  return (
    <main className="space-y-12 pb-20">
      <HeroSection />

      {/* KATEGORIE */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold tracking-tight">Popularne kategorie</h2>
          <Button variant="ghost" className="text-primary">Zobacz wszystkie</Button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {[
            { label: "Grafika & Design", icon: "🎨", color: "bg-pink-100 text-pink-700" },
            { label: "Digital Marketing", icon: "📢", color: "bg-purple-100 text-purple-700" },
            { label: "Programowanie", icon: "💻", color: "bg-blue-100 text-blue-700" },
            { label: "Wideo & Animacja", icon: "🎥", color: "bg-indigo-100 text-indigo-700" },
            { label: "Tłumaczenia", icon: "🌍", color: "bg-orange-100 text-orange-700" },
            { label: "Social Media", icon: "📱", color: "bg-green-100 text-green-700" },
          ].map((cat) => (
            <div key={cat.label} className="group cursor-pointer flex flex-col items-center justify-center p-6 rounded-2xl border bg-white hover:border-primary/20 hover:shadow-lg transition-all duration-300">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl mb-3 ${cat.color} group-hover:scale-110 transition-transform`}>
                {cat.icon}
              </div>
              <span className="text-sm font-semibold text-center">{cat.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* OFERTY */}
      <section id="offers">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
          <div className="flex flex-col gap-1">
            <h2 className="text-2xl font-bold tracking-tight">Najnowsze zlecenia</h2>
            {typ === 'micro' && (
              <div className="flex gap-2 mt-2">
                <Link href="?typ=micro&sub=all" className={`px-3 py-1 rounded-full text-xs font-medium transition-colors border ${!sub || sub === 'all' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}>
                  Wszystkie
                </Link>
                <Link href="?typ=micro&sub=platform" className={`px-3 py-1 rounded-full text-xs font-medium transition-colors border ${sub === 'platform' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}>
                  Systemowe (Gwarantowane)
                </Link>
                <Link href="?typ=micro&sub=regular" className={`px-3 py-1 rounded-full text-xs font-medium transition-colors border ${sub === 'regular' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}>
                  Zwykłe Zlecenia
                </Link>
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <Link href="?filter=all" className={`rounded-full px-4 py-1 text-sm font-medium transition ${!getStr(sp, 'filter') || getStr(sp, 'filter') === 'all' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'}`}>
              Wszystkie
            </Link>
            <Link href="?filter=matched" className={`rounded-full px-4 py-1 text-sm font-medium transition ${getStr(sp, 'filter') === 'matched' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'}`}>
              Dopasowane
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {visibleOffers.filter(o => {
            if (getStr(sp, 'filter') !== 'matched') return true;
            if (!studentSkills || studentSkills.length === 0) return true; // Show all if no skills defined
            // Logic for matching: overlap between offer.technologies and studentSkills
            const offerTechs = Array.isArray(o.technologies) ? o.technologies : [];
            if (offerTechs.length === 0) return true; // No requirements -> match
            return offerTechs.some((t: string) => studentSkills.includes(t));
          }).map((o: any) => {
            const app = myAppByOfferId.get(o.id);
            return <OfferCard key={o.id} offer={o} applicationStatus={app} />;
          })}
        </div>

        {error && (
          <div className="rounded-xl border border-red-100 bg-red-50 p-6 text-center text-red-600">
            Nie udało się załadować ofert: {error.message}
          </div>
        )}

        {!error && visibleOffers.length === 0 && (
          <div className="text-center py-20 bg-gray-50 rounded-3xl border border-dashed">
            <h3 className="text-xl font-bold text-gray-900">Brak ofert w tej chwili 😔</h3>
            <p className="text-gray-500 mt-2">Zajrzyj tu później lub zmień kryteria wyszukiwania.</p>
          </div>
        )}
      </section>

      {/* BANNER REKRUTACYJNY */}
      <section className="relative overflow-hidden rounded-3xl bg-gray-900 text-white p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="space-y-4 max-w-xl relative z-10">
          <h2 className="text-3xl font-bold">Jesteś Firmą?</h2>
          <p className="text-gray-300 text-lg">Zleć zadania studentom już dziś. To szybsze i tańsze niż tradycyjna rekrutacja.</p>
          <Button size="lg" className="bg-white text-gray-900 hover:bg-gray-100 font-bold border-none">
            Dodaj ofertę za darmo
          </Button>
        </div>
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-primary/30 to-transparent pointer-events-none"></div>
      </section>
    </main>
  );
}
