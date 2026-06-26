import Link from "next/link";
import { redirect } from "next/navigation";
import { BriefcaseBusiness, Search } from "lucide-react";

import { PageContainer } from "@/components/ui/page-container";
import { CompanyHero } from "../_components/company-dashboard-ui";
import { createClient } from "@/lib/supabase/server";
import { getRequestContext } from "@/lib/auth/request-context";

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
  const { user, role } = await getRequestContext();

  if (!user) {
    redirect("/auth");
  }
  if (role !== "company") redirect("/app");

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
      <CompanyHero
        tourId="company-orders"
        badge="Panel Pracodawcy"
        title="Zamówienia usług"
        description="Usługi systemowe zamówione w katalogu: statusy realizacji, płatności i dokumenty w jednym widoku."
        icon={BriefcaseBusiness}
        actions={
          <Link
            href="/app/company/packages"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-lime-300 px-5 text-sm font-extrabold text-[#10245f] shadow-lg shadow-lime-300/20 transition hover:bg-lime-200"
          >
            <Search className="h-4 w-4" />
            Przeglądaj katalog
          </Link>
        }
      />

      <PageContainer className="py-5">
        <CompanyOrdersClient initialOrders={orders ?? []} studentData={studentData} />
      </PageContainer>
    </main>
  );
}
