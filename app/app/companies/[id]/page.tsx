import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MapPin, Globe, Building2, Briefcase, Star } from "lucide-react";
import { Stars, ReviewCard } from "@/components/ReviewCard";

export const dynamic = "force-dynamic";

// Stars now imported from ReviewCard

export default async function CompanyProfilePage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id: companyId } = await params;

    const supabase = createClient();
    const { data: userData } = await (await supabase).auth.getUser();
    const user = userData.user;
    if (!user) redirect("/auth");

    // Fetch company profile
    // Note: we might need to join or select carefully if RLS allows public reading of company profiles
    // Assuming 'company_profiles' is readable by authenticated users
    const { data: company, error } = await (await supabase)
        .from("company_profiles")
        .select("user_id, nazwa, opis, logo_url, strona_www, nip, miasto")
        .eq("user_id", companyId)
        .maybeSingle();

    if (error || !company) {
        return (
            <main className="container mx-auto max-w-5xl py-10 px-4">
                <div className="flex flex-col items-center justify-center min-h-[40vh] space-y-4 text-center">
                    <div className="bg-slate-100 p-6 rounded-full">
                        <Building2 className="h-10 w-10 text-slate-400" />
                    </div>
                    <h2 className="text-xl font-semibold text-slate-800">Profil niedostępny</h2>
                    <p className="text-muted-foreground">Nie udało się znaleźć profilu firmy.</p>
                    <Button asChild variant="outline">
                        <Link href="/app/jobs">Wróć do ofert</Link>
                    </Button>
                </div>
            </main>
        );
    }

    // Fetch active offers from this company?
    const { data: offers } = await (await supabase)
        .from("offers")
        .select("id, tytul, location, is_remote, typ, created_at")
        .eq("company_id", companyId)
        .eq("status", "published")
        .order("created_at", { ascending: false });

    // Fetch reviews
    const { data: reviews } = await (await supabase)
        .from("company_reviews")
        .select("id, rating, comment, created_at")
        .eq("company_id", companyId)
        .order("created_at", { ascending: false });

    const reviewCount = reviews?.length || 0;
    const avgRating = reviewCount > 0
        ? reviews!.reduce((acc, r) => acc + r.rating, 0) / reviewCount
        : 0;

    const initials = company.nazwa?.substring(0, 2).toUpperCase() || "FI";

    return (
        <main className="min-h-screen bg-slate-50/50 pb-20">
            {/* Header Banner */}
            <div className="h-48 w-full bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 relative">
                <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-20"></div>
                <div className="absolute top-6 left-6 z-10">
                    <Button asChild variant="secondary" size="sm" className="bg-white/10 text-white hover:bg-white/20 border-none backdrop-blur-sm">
                        <Link href="/app/jobs">← Wróć do ofert</Link>
                    </Button>
                </div>
            </div>

            <div className="container mx-auto max-w-6xl px-4 sm:px-6 -mt-20 relative z-10">
                <div className="bg-white rounded-xl shadow-xl border border-slate-100"> {/* Removed overflow-hidden */}
                    <div className="p-8 flex flex-col md:flex-row items-center md:items-end gap-8 pb-8 border-b border-slate-100">
                        <div className="-mt-16 md:-mt-20 relative">
                            <Avatar className="h-32 w-32 md:h-40 md:w-40 border-[6px] border-white shadow-lg bg-white">
                                <AvatarImage src={company.logo_url || ""} className="object-cover" />
                                <AvatarFallback className="bg-indigo-50 text-indigo-500 text-4xl font-bold">{initials}</AvatarFallback>
                            </Avatar>
                        </div>

                        <div className="flex-1 text-center md:text-left space-y-3 mb-2">
                            <div>
                                <div className="flex flex-col md:flex-row items-center md:items-start justify-between gap-4">
                                    <h1 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight">{company.nazwa}</h1>
                                    {reviewCount > 0 && (
                                        <div className="flex items-center gap-2 bg-amber-50 px-3 py-1.5 rounded-full border border-amber-100">
                                            <span className="text-lg font-bold text-amber-600">{avgRating.toFixed(1)}</span>
                                            <Stars rating={avgRating} />
                                            <span className="text-xs text-slate-400 font-medium">({reviewCount})</span>
                                        </div>
                                    )}
                                </div>

                                <p className="text-slate-500 font-medium mt-1 flex flex-wrap items-center justify-center md:justify-start gap-3">
                                    {company.miasto && (
                                        <span className="flex items-center gap-1">
                                            <MapPin className="h-4 w-4" /> {company.miasto}
                                        </span>
                                    )}
                                    {company.nip && (
                                        <>
                                            <span className="text-slate-300 hidden sm:inline">•</span>
                                            <span className="flex items-center gap-1 text-slate-500" title="Numer Identyfikacji Podatkowej">
                                                <Building2 className="h-4 w-4" /> NIP: {company.nip}
                                            </span>
                                        </>
                                    )}
                                    {company.strona_www && (
                                        <>
                                            <span className="text-slate-300 hidden sm:inline">•</span>
                                            <a href={company.strona_www} target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:text-indigo-600 transition-colors">
                                                <Globe className="h-4 w-4" /> Strona www
                                            </a>
                                        </>
                                    )}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="p-8 grid lg:grid-cols-3 gap-12 bg-white rounded-b-xl">
                        {/* LEFT COLUMN: About & Reviews */}
                        <div className="lg:col-span-2 space-y-10">
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 mb-2 pb-2 border-b border-slate-100">
                                    <Building2 className="h-5 w-5 text-indigo-600" />
                                    <h3 className="font-bold text-xl text-slate-900">O firmie</h3>
                                </div>
                                <div className="prose prose-slate max-w-none text-slate-600 leading-relaxed">
                                    {company.opis ? (
                                        <p className="whitespace-pre-wrap">{company.opis}</p>
                                    ) : (
                                        <p className="italic text-slate-400">Firma nie dodała jeszcze opisu swojej działalności.</p>
                                    )}
                                </div>
                            </div>

                            {/* REVIEWS SECTION */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 mb-2 pb-2 border-b border-slate-100">
                                    <Star className="h-5 w-5 text-amber-500" />
                                    <h3 className="font-bold text-xl text-slate-900">Opinie studentów</h3>
                                </div>

                                {reviewCount > 0 ? (
                                    <div className="grid gap-6">
                                        {reviews!.map((review) => (
                                            <ReviewCard
                                                key={review.id}
                                                id={review.id}
                                                rating={review.rating}
                                                comment={review.comment}
                                                createdAt={review.created_at}
                                                reviewerId="student" // Or real student ID if we fetch it
                                                reviewerName="Student" // Or real student name
                                            />
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-slate-500 italic text-sm">Ta firma nie ma jeszcze opinii.</div>
                                )}
                            </div>
                        </div>

                        {/* RIGHT COLUMN: Active Offers */}
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Briefcase className="h-5 w-5 text-indigo-600" />
                                    <h3 className="font-bold text-xl text-slate-900">Aktualne oferty</h3>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button asChild variant="link" className="text-indigo-600 h-auto p-0 text-sm hidden sm:inline-flex">
                                        <Link href={`/app/jobs?companyId=${companyId}`}>Zobacz wszystkie</Link>
                                    </Button>
                                    <span className="bg-indigo-100 text-indigo-700 text-xs font-bold px-2 py-1 rounded-full">
                                        {offers?.length || 0}
                                    </span>
                                </div>
                            </div>

                            {offers && offers.length > 0 ? (
                                <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                                    <div className="max-h-[400px] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
                                        <div className="divide-y divide-slate-100">
                                            {offers.map((offer) => (
                                                <Link key={offer.id} href={`/app/offers/${offer.id}`} className="block group hover:bg-slate-50 transition-colors px-4 py-3">
                                                    <div className="flex justify-between items-start">
                                                        <div className="space-y-1">
                                                            <div className="font-semibold text-slate-800 group-hover:text-indigo-600 transition-colors line-clamp-1">
                                                                {offer.tytul}
                                                            </div>
                                                            <div className="text-xs text-slate-500 flex items-center gap-2">
                                                                <span className="capitalize bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">
                                                                    {offer.typ === 'job' ? 'Praca' : offer.typ === 'internship' ? 'Staż' : 'Zlecenie'}
                                                                </span>
                                                                <span>•</span>
                                                                <span>{offer.is_remote ? 'Zdalnie' : offer.location || 'Brak lok.'}</span>
                                                            </div>
                                                        </div>
                                                        <div className="text-slate-300 group-hover:text-indigo-400">
                                                            <Briefcase className="h-4 w-4" />
                                                        </div>
                                                    </div>
                                                </Link>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="p-6 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                                    <Briefcase className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                                    <p className="text-sm text-slate-500">Brak aktywnych rekrutacji w tym momencie.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
