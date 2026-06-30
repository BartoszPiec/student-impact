import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { ArrowLeft, ClipboardList, Edit2, Eye } from "lucide-react";

import CompanyApplicationsPage from "@/app/app/company/applications/applications-view";
import { CompanyStatePill } from "@/app/app/company/_components/company-card-theme";
import { Button } from "@/components/ui/button";
import { PageContainer } from "@/components/ui/page-container";
import { PremiumPageHeader } from "@/components/ui/premium-page-header";

export default async function CompanyOfferDashboard({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth");

  const { data: offer } = await supabase
    .from("offers")
    .select("id, tytul, status, typ, created_at, company_id")
    .eq("id", id)
    .single();

  if (!offer) notFound();

  if (offer.company_id !== user.id) {
    redirect(`/app/offers/${id}`);
  }

  return (
    <main className="min-h-screen bg-slate-50/60 pb-12">
      <PremiumPageHeader
        badge="Moje oferty"
        title={offer.tytul ?? "Szczegoly oferty"}
        description="Jedno miejsce do przegladu kandydatow, negocjacji i dalszych decyzji dla tego ogloszenia."
        icon={<ClipboardList className="h-10 w-10 text-indigo-300 drop-shadow-[0_0_8px_rgba(165,180,252,0.5)]" />}
        actions={
          <div className="flex flex-wrap items-center gap-3">
            <Button asChild variant="outline" className="h-12 rounded-2xl border-white/20 bg-white/10 px-6 font-bold text-white hover:bg-white/20 hover:text-white">
              <Link href="/app/company/offers">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Wroc do listy
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-12 rounded-2xl border-white/20 bg-white/10 px-6 font-bold text-white hover:bg-white/20 hover:text-white">
              <Link href={`/app/offers/${offer.id}`} target="_blank">
                <Eye className="mr-2 h-4 w-4" />
                Podglad oferty
              </Link>
            </Button>
            <Button asChild className="h-12 rounded-2xl bg-white px-6 font-bold text-slate-950 hover:bg-indigo-50">
              <Link href={`/app/company/offers/${offer.id}/edit`}>
                <Edit2 className="mr-2 h-4 w-4" />
                Edytuj oferte
              </Link>
            </Button>
          </div>
        }
      />

      <PageContainer className="py-8">
        <div className="mb-6 rounded-[2rem] border border-slate-200 bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 px-6 py-5 text-white shadow-xl">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-indigo-300">Kontekst ogloszenia</p>
          <h2 className="mt-2 text-2xl font-black tracking-tight">Aplikacje i decyzje dla tej oferty</h2>
          <p className="mt-2 max-w-3xl text-sm font-medium text-indigo-100/75">
            Ten widok korzysta z tego samego systemu sygnalow co lista ogloszen: indigo dla nowych zgloszen,
            bursztyn dla negocjacji i spokojniejsze stany dla realizacji oraz archiwum.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <CompanyStatePill tone="slate">{offer.typ ?? "Oferta"}</CompanyStatePill>
            <CompanyStatePill tone="indigo">{offer.status ?? "Aktywna"}</CompanyStatePill>
          </div>
        </div>

        <CompanyApplicationsPage searchParams={Promise.resolve({ offerId: id })} embedded />
      </PageContainer>
    </main>
  );
}
