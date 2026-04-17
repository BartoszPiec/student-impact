import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, BriefcaseBusiness } from "lucide-react";

import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";

import CompanyOrdersClient from "./company-orders-client";

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

  const studentIds = Array.from(new Set((orders || []).map((order: any) => order.student_id).filter(Boolean)));
  const studentData: Record<string, any> = {};

  if (studentIds.length > 0) {
    const { data: students } = await supabase.from("student_profiles").select("user_id, public_name").in("user_id", studentIds);
    for (const student of students || []) {
      studentData[student.user_id] = student;
    }
  }

  return (
    <div className="space-y-12 pb-20">
      <div className="relative overflow-hidden rounded-[2.5rem] bg-slate-900 px-8 py-12 text-white shadow-2xl md:px-12 md:py-16">
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent" />
        <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-indigo-500/10 blur-[100px]" />
        <div className="absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-purple-500/10 blur-[80px]" />

        <div className="relative z-10 flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
          <div className="space-y-4 text-center md:text-left">
            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/20 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-indigo-300">
              <BriefcaseBusiness className="h-3 w-3" /> Zamówienia usług
            </div>
            <h1 className="text-4xl font-black tracking-tight md:text-5xl">Panel zamówień usług</h1>
            <p className="max-w-2xl text-lg font-medium text-indigo-100/70">
              Tutaj zobaczysz wszystkie zamówione usługi studentów, wyceny do zaakceptowania i projekty w realizacji.
            </p>
          </div>

          <Link href="/app/company/packages">
            <Button variant="outline" className="h-12 rounded-2xl border-white/10 bg-white/5 px-6 font-bold text-white hover:bg-white/10">
              <ArrowLeft className="mr-2 h-4 w-4" /> Katalog usług
            </Button>
          </Link>
        </div>
      </div>

      <CompanyOrdersClient initialOrders={orders || []} studentData={studentData} />
    </div>
  );
}
