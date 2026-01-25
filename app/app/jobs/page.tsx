import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { JobBoardView } from "./job-board-view";

export const dynamic = "force-dynamic";

type SP = Record<string, string | string[] | undefined>;

function getStr(sp: SP, key: string) {
    const v = sp[key];
    return typeof v === "string" ? v : "";
}

export default async function JobsPage({
    searchParams,
}: {
    searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
    const sp = await searchParams;
    const companyId = getStr(sp, "companyId");

    const supabase = await createClient();
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) redirect("/auth");

    // Access Control: Companies should not see this page
    const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("user_id", userData.user.id)
        .single();

    if (profile?.role === "company") {
        redirect("/app");
    }

    // Fetch all published offers
    const { data: offersData, error } = await supabase
        .from("offers")
        .select(`
            id, tytul, opis, typ, stawka, status, created_at, kategoria, 
            location, contract_type, technologies, is_remote, company_id, is_platform_service,
            salary_range_min, salary_range_max,
            company_profiles ( nazwa, logo_url )
        `)
        //.eq("status", "published") 
        .order("created_at", { ascending: false });

    if (error) {
        console.error("Error fetching job offers:", error);
    }

    // Fetch user applications to mark as "Applied"
    const { data: userApps } = await supabase
        .from("applications")
        .select("offer_id")
        .eq("student_id", userData.user.id);

    const appliedOfferIds = new Set((userApps || []).map((a: any) => a.offer_id));

    // Transform data to match JobOffer interface
    const offers = (offersData || []).map((o: any, index: number) => ({
        id: o.id,
        tytul: o.tytul,
        company_id: o.company_id,
        company_name: o.company_profiles?.nazwa || "Firma",
        company_logo: o.company_profiles?.logo_url,
        stawka: o.stawka,
        salary_range_min: o.salary_range_min,
        salary_range_max: o.salary_range_max,
        location: o.location,
        is_remote: o.is_remote,
        contract_type: o.contract_type,
        technologies: o.technologies,
        typ: o.typ,
        category: o.kategoria,
        created_at: o.created_at,
        // MOCK: First micro-task is System Service for UI testing
        // Use real DB value
        is_platform_service: o.is_platform_service,
        obligations: o.obligations,
    }));

    return (
        <main className="space-y-8 pb-10">
            {/* HERO / HEADER */}
            <div className="relative rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 px-8 py-16 text-white shadow-xl overflow-hidden mb-12">
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>

                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                    <div className="max-w-3xl text-center md:text-left">
                        <div className="flex items-center justify-center md:justify-start gap-2 mb-4">
                            <span className="px-3 py-1 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-full text-xs font-bold uppercase tracking-wider backdrop-blur-md">
                                Giełda Zleceń i Staży
                            </span>
                            <span className="px-3 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-full text-xs font-bold uppercase tracking-wider backdrop-blur-md">
                                {offers.length} aktywnych ofert
                            </span>
                        </div>
                        <h1 className="text-4xl md:text-6xl font-black mb-6 tracking-tight leading-none bg-gradient-to-r from-white via-indigo-100 to-indigo-300 bg-clip-text text-transparent">
                            Kształtuj swoją <br className="hidden md:block" /> karierę już dziś.
                        </h1>
                        <p className="text-indigo-100/70 text-lg md:text-xl font-medium max-w-2xl leading-relaxed">
                            Odkrywaj mikrozlecenia, staże i projekty systemowe dopasowane do Twoich umiejętności. Zdobądź doświadczenie, którego szukają pracodawcy.
                        </p>
                    </div>

                    <div className="hidden lg:block relative shrink-0">
                        <div className="w-64 h-64 bg-white/5 backdrop-blur-3xl rounded-3xl border border-white/10 shadow-2xl flex items-center justify-center group hover:scale-105 transition-transform duration-500 overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 opacity-50"></div>
                            <svg className="h-32 w-32 text-indigo-400 drop-shadow-[0_0_15px_rgba(165,180,252,0.4)] relative z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                            </svg>
                        </div>
                        {/* Status Floaties */}
                        <div className="absolute -top-4 -left-4 bg-emerald-500/90 backdrop-blur-md text-white px-4 py-2 rounded-xl text-xs font-bold shadow-xl animate-bounce">
                            Nowe oferty!
                        </div>
                    </div>
                </div>

                {/* Decorative elements */}
                <div className="absolute right-0 top-0 -mt-20 -mr-20 h-[500px] w-[500px] rounded-full bg-indigo-500/10 blur-[120px] pointer-events-none"></div>
                <div className="absolute left-1/4 bottom-0 -mb-20 h-64 w-64 rounded-full bg-violet-600/10 blur-[100px] pointer-events-none"></div>
            </div>

            <JobBoardView initialOffers={offers} appliedOfferIds={appliedOfferIds} />
        </main>
    );
}
