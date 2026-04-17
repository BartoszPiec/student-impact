import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, Clock, DollarSign, LayoutTemplate, Plus, Zap } from "lucide-react";
import { DeleteServiceButton } from "./delete-service-button";
import { ServiceCommissionEditor } from "./service-commission-editor";

export const dynamic = "force-dynamic";

export default async function AdminSystemServicesPage() {
  const supabase = await createClient();

  const { data: services, error } = await supabase
    .from("service_packages")
    .select("*")
    .eq("type", "platform_service")
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <div className="rounded-[2.5rem] border border-rose-500/20 bg-rose-500/5 p-8 text-rose-100">
        Blad pobierania uslug: {error.message}
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      <div className="relative overflow-hidden rounded-[2.5rem] border border-white/5 bg-slate-900/50 p-8 shadow-2xl">
        <div className="relative z-10 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-amber-500/30 bg-amber-500/20">
                <Zap className="h-6 w-6 text-amber-400" />
              </div>
              <span className="text-xs font-black uppercase tracking-[0.2em] text-amber-300/80">
                Marketplace
              </span>
            </div>
            <h1 className="mb-3 text-4xl font-black leading-none tracking-tight text-white md:text-5xl">
              Uslugi systemowe
            </h1>
            <p className="max-w-2xl font-medium leading-relaxed text-slate-300">
              Zarzadzaj ofertami gwarantowanymi i platformowymi pakietami bez wychodzenia
              z glownego shellu admina.
            </p>
          </div>

          <Button
            asChild
            className="h-11 rounded-xl bg-amber-500 px-5 text-sm font-bold text-slate-950 hover:bg-amber-400"
          >
            <Link href="/app/admin/system-services/new">
              <Plus className="mr-2 h-4 w-4" />
              Dodaj usluge
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
        {(services || []).map((service) => (
          <ServiceCard key={service.id} service={service} />
        ))}

        {(!services || services.length === 0) && (
          <div className="col-span-full rounded-[2.5rem] border border-dashed border-white/10 bg-slate-950/30 px-6 py-20 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-white/10 bg-white/5">
              <Zap className="h-8 w-8 text-slate-500" />
            </div>
            <h3 className="text-lg font-bold text-white">Brak uslug systemowych</h3>
            <p className="mt-2 text-slate-400">
              Dodaj pierwsza usluge, aby pojawila sie na gieldzie i w panelu admina.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function ServiceCard({ service }: { service: any }) {
  return (
    <Card className="overflow-hidden rounded-[2rem] border border-white/5 bg-slate-950/40 shadow-xl shadow-black/20 transition-all duration-300 hover:-translate-y-1 hover:border-white/10">
      <CardHeader className="border-b border-white/5 bg-white/5 pb-4">
        <div className="flex items-start justify-between gap-4">
          <Badge className="border-amber-400/20 bg-amber-500/10 text-[10px] font-bold uppercase tracking-wider text-amber-300">
            Systemowe
          </Badge>
          <div
            className={`h-3 w-3 rounded-full ${
              service.status === "active"
                ? "bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.45)]"
                : "bg-slate-500"
            }`}
            title={service.status}
          />
        </div>
        <CardTitle className="pt-2 text-xl font-bold leading-tight text-white">
          {service.title}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6 p-6">
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2 font-medium text-slate-400">
              <DollarSign className="h-4 w-4 text-emerald-400" /> Stawka
            </span>
            <span className="text-lg font-bold text-white">{service.price} PLN</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2 font-medium text-slate-400">
              <Clock className="h-4 w-4 text-indigo-400" /> Termin
            </span>
            <span className="font-semibold text-slate-200">
              {service.delivery_time_days || "?"} dni
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2 font-medium text-slate-400">
              <LayoutTemplate className="h-4 w-4 text-purple-400" /> Kategoria
            </span>
            <span className="max-w-[140px] truncate font-semibold text-slate-200" title={service.category}>
              {service.category || "Brak"}
            </span>
          </div>
        </div>

        <ServiceCommissionEditor
          serviceId={service.id}
          initialRate={service.commission_rate ?? null}
        />

        <div className="pt-2">
          <Button
            asChild
            variant="outline"
            className="w-full rounded-xl border-white/10 bg-white/5 font-bold text-slate-200 hover:bg-white/10 hover:text-white"
          >
            <Link href={`/app/company/packages/${service.id}`}>
              Podglad uslugi
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <div className="mt-2 flex gap-2">
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="flex-1 rounded-lg text-slate-400 hover:bg-white/5 hover:text-indigo-300"
            >
              <Link href={`/app/admin/system-services/${service.id}/edit`}>Edytuj</Link>
            </Button>
            <DeleteServiceButton serviceId={service.id} serviceTitle={service.title} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
