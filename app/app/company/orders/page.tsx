import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, BriefcaseBusiness } from "lucide-react";

import { Button } from "@/components/ui/button";
import { PageContainer } from "@/components/ui/page-container";
import { PremiumPageHeader } from "@/components/ui/premium-page-header";
import { createClient } from "@/lib/supabase/server";

import CompanyOrdersClient from "./company-orders-client";

type ServiceOrderRow = {
  student_id: string | null;
};

type StudentProfileRow = {
  user_id: string;
  public_name: string | null;
};

export default async function CompanyOrdersPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth");
  }

  const { data: orders } = await supabase
    .from("service_orders")
    .select(`
      id,
      created_at,
      status,
      entry_point,
      initiated_by,
      amount,
      counter_amount,
      requirements,
      request_snapshot,
      quote_snapshot,
      student_id,
      package:service_packages!service_orders_package_id_fkey(
        id,
        title
      )
    `)
    .eq("company_id", user.id)
    .order("created_at", { ascending: false });

  const studentIds = Array.from(
    new Set(((orders ?? []) as ServiceOrderRow[]).map((order) => order.student_id).filter((value): value is string => Boolean(value))),
  );
  const studentData: Record<string, StudentProfileRow> = {};

  if (studentIds.length > 0) {
    const { data: students } = await supabase.from("student_profiles").select("user_id, public_name").in("user_id", studentIds);
    for (const student of (students ?? []) as StudentProfileRow[]) {
      studentData[student.user_id] = student;
    }
  }

  return (
    <main className="min-h-screen bg-slate-50/60 pb-12">
      <PremiumPageHeader
        badge="Panel Pracodawcy"
        title="Zamowienia uslug"
        description="Wszystkie zamowione uslugi studentow, negocjacje, realizacje i archiwum w jednym operacyjnym widoku."
        icon={<BriefcaseBusiness className="h-10 w-10 text-indigo-300 drop-shadow-[0_0_8px_rgba(165,180,252,0.5)]" />}
        actions={
          <Button asChild variant="outline" className="h-12 rounded-2xl border-white/20 bg-white/10 px-6 font-bold text-white hover:bg-white/20 hover:text-white">
            <Link href="/app/company/packages">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Katalog uslug
            </Link>
          </Button>
        }
      />

      <PageContainer className="py-8">
        <div className="mb-6 rounded-[2rem] border border-slate-200 bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 px-6 py-5 text-white shadow-xl">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-indigo-300">Wymagana akcja</p>
          <h2 className="mt-2 text-2xl font-black tracking-tight">Zamowienia uslug w tym samym systemie kart</h2>
          <p className="mt-2 max-w-3xl text-sm font-medium text-indigo-100/75">
            Decyzje, negocjacje i realizacje korzystaja teraz z tego samego jezyka wizualnego co ogloszenia i aplikacje.
          </p>
        </div>

        <CompanyOrdersClient initialOrders={orders ?? []} studentData={studentData} />
      </PageContainer>
    </main>
  );
}
