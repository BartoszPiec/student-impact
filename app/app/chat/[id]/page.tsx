
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card } from "@/components/ui/card";
import { ChatInput } from "./ChatInput";
import { ChatList } from "./ChatList";
import { ChatSidebar } from "./_components/ChatSidebar";
import { ChatBackBtn } from "./ChatBackBtn";
import { Sparkles } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ChatPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) redirect("/auth");

  const { data: conv, error: convErr } = await supabase
    .from("conversations")
    .select("id, company_id, student_id, offer_id, package_id, application_id, offers(id, tytul, stawka, typ, is_private, service_package_id), package:service_packages(title, price, is_system)")
    .eq("id", id)
    .single();

  if (convErr || !conv) redirect("/app");

  const isCompany = user.id === conv.company_id;
  const isStudent = user.id === conv.student_id;
  if (!isCompany && !isStudent) redirect("/app");

  // Fetch Student Name for Company View
  let studentName = null;
  if (isCompany && conv.student_id) {
    const { data: sp } = await supabase.from("student_profiles").select("public_name").eq("user_id", conv.student_id).single();
    studentName = sp?.public_name;
  }

  const offer = Array.isArray((conv as any).offers) ? (conv as any).offers[0] : (conv as any).offers;
  const pkg = (conv as any).package;

  const chatTitle = offer?.tytul ?? pkg?.title ?? "Rozmowa";

  let headerLink = "#";
  if (offer) {
    headerLink = isCompany ? `/app/company/offers/${conv.offer_id}` : `/app/jobs/${conv.offer_id}`;
  } else if (conv.package_id) {
    headerLink = `/app/orders/create/${conv.package_id}`;
  }

  let appRow = null;
  if (conv.application_id) {
    const { data } = await supabase
      .from('applications')
      .select('*')
      .eq('id', conv.application_id)
      .single();
    if (data) appRow = data;
  }

  // Fallback: If application_id is missing, try connecting via offer_id
  if (!appRow && conv.offer_id && conv.student_id) {
    const { data: fb } = await supabase.from('applications')
      .select('*')
      .eq('offer_id', conv.offer_id)
      .eq('student_id', conv.student_id)
      .maybeSingle();
    if (fb) appRow = fb;
  }

  const { data: msgs } = await supabase
    .from("messages")
    .select("id, sender_id, content, created_at, read_at, attachment_url, attachment_type, event, payload")
    .eq("conversation_id", conv.id)
    .order("created_at", { ascending: true });

  // Fetch Service Order if needed (System Context)
  let serviceOrderRow = null;
  const effectivePackageId = conv.package_id || offer?.service_package_id;

  if (effectivePackageId) {
    let { data: so } = await supabase.from("service_orders")
      .select("*")
      .eq("package_id", effectivePackageId)
      .eq("student_id", conv.student_id)
      .eq("company_id", conv.company_id)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    serviceOrderRow = so;
  }

  return (
    <div className="flex flex-col md:flex-row h-full gap-4 p-4 w-full ml-0 max-w-[1920px] mx-auto">
      <div className="flex-1 flex flex-col min-h-0 bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/60 border border-white overflow-hidden relative isolate">

        {/* Decorative elements */}
        <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-slate-50/80 to-transparent pointer-events-none -z-10" />

        {/* Header */}
        <div className="flex-none flex items-center justify-between px-8 py-5 bg-white/80 backdrop-blur-md border-b border-slate-50 z-20 sticky top-0">
          <div className="flex items-center gap-4">
            <div className="md:hidden">
              <ChatBackBtn />
            </div>
            <div>
              <Link href={headerLink} className="group flex items-center gap-2">
                <h2 className="text-xl font-black text-slate-800 tracking-tight group-hover:text-indigo-600 transition-colors line-clamp-1">{chatTitle}</h2>
                <div className="opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-indigo-500">
                  <Sparkles className="h-4 w-4" />
                </div>
              </Link>
              {studentName && (
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-0.5">Rozmowa z: <span className="text-indigo-500">{studentName}</span></p>
              )}
            </div>
          </div>
        </div>

        {/* Chat List */}
        <div className="flex-1 overflow-y-auto px-2 md:px-6 bg-slate-50/30 scroll-smooth">
          <div className="max-w-3xl mx-auto py-6">
            <ChatList
              messages={msgs ?? []}
              userId={user.id}
              conversationId={conv.id}
            />
          </div>
        </div>

        {/* Input */}
        <div className="p-6 bg-white border-t border-slate-50 z-20">
          <div className="max-w-3xl mx-auto">
            <ChatInput conversationId={conv.id} />
          </div>
        </div>
      </div>

      {/* Right Sidebar */}
      <ChatSidebar
        conversation={conv}
        application={appRow}
        offer={offer}
        packageData={pkg}
        serviceOrder={serviceOrderRow}
        isCompany={isCompany}
      />
    </div>
  );
}
