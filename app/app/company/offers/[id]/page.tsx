import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Edit2, ExternalLink, Eye, LayoutTemplate } from "lucide-react";
import CompanyApplicationsPage from "@/app/app/company/applications/page"; // Import the Applications Page as a component

export default async function CompanyOfferDashboard({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/auth");

  // Fetch Offer Details for Header
  const { data: offer } = await supabase
    .from("offers")
    .select("id, tytul, status, typ, created_at, company_id")
    .eq("id", id)
    .single();

  if (!offer) notFound();

  // Security Check
  if (offer.company_id !== user.id) {
    redirect(`/app/offers/${id}`);
  }

  return (
    <div className="max-w-7xl mx-auto pb-10 px-4 md:px-8 space-y-8">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 py-6 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Link href="/app/company/offers" className="text-slate-400 hover:text-indigo-600 transition-colors flex items-center text-sm font-medium">
              <ArrowLeft className="h-4 w-4 mr-1" /> Moje Oferty
            </Link>
            <span className="text-slate-300">/</span>
            <span className="text-slate-500 text-sm font-medium">Szczegóły</span>
          </div>
          <h1 className="text-3xl font-bold text-slate-900 leading-tight">{offer.tytul}</h1>
          <div className="flex gap-3 text-sm text-slate-500 mt-2 font-medium">
            <span className="uppercase tracking-wider text-xs font-bold bg-slate-100 px-2 py-0.5 rounded text-slate-600">{offer.typ}</span>
            <span>Status: {offer.status}</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button asChild variant="outline" className="border-slate-200">
            <Link href={`/app/offers/${offer.id}`} target="_blank">
              <Eye className="mr-2 h-4 w-4 text-slate-500" />
              Podgląd Oarty
            </Link>
          </Button>

          <Button asChild className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-200">
            <Link href={`/app/company/offers/${offer.id}/edit`}>
              <Edit2 className="mr-2 h-4 w-4" />
              Edytuj Ofertę
            </Link>
          </Button>
        </div>
      </div>

      {/* APPLICATIONS SECTION */}
      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-6 md:p-8">
        <CompanyApplicationsPage searchParams={Promise.resolve({ offerId: id })} />
      </div>
    </div>
  );
}
