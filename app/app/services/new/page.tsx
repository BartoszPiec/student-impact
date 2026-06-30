import Link from "next/link";
import { ArrowLeft, CheckCircle2, PackagePlus, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageContainer } from "@/components/ui/page-container";
import { PremiumPageHeader } from "@/components/ui/premium-page-header";
import ServiceForm from "../_components/service-form";

export default function NewServicePage() {
  return (
    <main className="pb-20">
      <PremiumPageHeader
        badge="Panel Studenta"
        title="Nowy pakiet usług"
        description="Zbuduj ofertę w katalogu usług, określ zakres, cenę i materiały potrzebne do startu."
        icon={<PackagePlus className="h-9 w-9 text-lime-200" />}
        actions={
          <Button
            asChild
            variant="outline"
            className="h-11 rounded-2xl border-white/20 bg-white/10 px-5 font-bold text-white hover:bg-white/20 hover:text-white"
          >
            <Link href="/app/services/my">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Moje usługi
            </Link>
          </Button>
        }
      />

      <PageContainer className="max-w-6xl">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
          <ServiceForm />

          <aside className="space-y-4 lg:sticky lg:top-24">
            <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-lime-100 text-[#10245f]">
                <Sparkles className="h-5 w-5" />
              </div>
              <h2 className="text-lg font-black text-[#10245f]">Premium brief sprzedaje usługę szybciej</h2>
              <p className="mt-2 text-sm font-medium leading-6 text-slate-500">
                Użyj konkretnego tytułu, widełek cenowych i krótkiej listy materiałów od klienta. Firmy szybciej wybierają oferty, przy których wiedzą, czego się spodziewać.
              </p>
            </div>

            <div className="rounded-[1.75rem] border border-emerald-100 bg-emerald-50/80 p-5 text-emerald-950 shadow-sm">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700">Checklist</p>
              <div className="mt-4 space-y-3">
                {[
                  "Dodaj minimum jedną kategorię.",
                  "Wgraj portfolio lub linki do realizacji.",
                  "Zadaj pytania, jeśli wycena zależy od briefu.",
                ].map((item) => (
                  <div key={item} className="flex items-start gap-2 text-sm font-bold leading-5">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </PageContainer>
    </main>
  );
}
