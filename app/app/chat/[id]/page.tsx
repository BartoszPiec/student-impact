
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ChatInput } from "./ChatInput";
import { ChatList } from "./ChatList";
import { ChatDetailsSheet, ChatSidebar } from "./_components/ChatSidebar";
import { ChatBackBtn } from "./ChatBackBtn";
import { Sparkles } from "lucide-react";
import { ChatHeaderActions } from "./ChatHeaderActions";
import { getCurrentUser } from "@/lib/auth/request-context";

export const dynamic = "force-dynamic";

type ChatOffer = {
  id: string;
  tytul: string | null;
  stawka: number | null;
  typ: string | null;
  is_private: boolean | null;
  service_package_id: string | null;
  status?: string | null;
};

type ChatPackage = {
  title: string | null;
  price: number | null;
  is_system: boolean | null;
};

type ChatConversation = {
  id: string;
  status: string | null;
  company_id: string;
  student_id: string;
  offer_id: string | null;
  package_id: string | null;
  application_id: string | null;
  offers: ChatOffer | ChatOffer[] | null;
  package: ChatPackage | ChatPackage[] | null;
};

type ChatMessageRecord = {
  id: string;
  sender_id: string;
  content: string | null;
  created_at: string;
  read_at?: string | null;
  attachment_url?: string | null;
  attachment_type?: string | null;
  flagged_by?: string[] | null;
  event?: string | null;
  payload?: Record<string, unknown> | null;
};

function unwrapRelation<T>(value: T | T[] | null | undefined): T | null {
  return Array.isArray(value) ? value[0] ?? null : value ?? null;
}

export default async function ChatPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = await createClient();
  const user = await getCurrentUser();
  if (!user) redirect("/auth");

  const { data: conv, error: convErr } = await supabase
    .from("conversations")
    .select("id, status, company_id, student_id, offer_id, package_id, application_id, offers(id, tytul, stawka, typ, is_private, service_package_id, status), package:service_packages(title, price, is_system)")
    .eq("id", id)
    .single();

  if (convErr || !conv) redirect("/app");

  const conversation = conv as ChatConversation;
  const isCompany = user.id === conversation.company_id;
  const isStudent = user.id === conversation.student_id;
  if (!isCompany && !isStudent) redirect("/app");

  const offer = unwrapRelation(conversation.offers);
  const pkg = unwrapRelation(conversation.package);

  const chatTitle = offer?.tytul ?? pkg?.title ?? "Rozmowa";

  let headerLink: string | null = null;
  const isOfferUnavailable = !offer && Boolean(conversation.offer_id);
  const isOfferClosed = ["completed", "cancelled", "closed", "archived"].includes(String(offer?.status || ""));

  if (offer && !isOfferClosed) {
    headerLink = isCompany ? `/app/company/offers/${conversation.offer_id}` : `/app/offers/${conversation.offer_id}`;
  } else if (conversation.package_id) {
    headerLink = `/app/orders/create/${conversation.package_id}`;
  }

  const effectivePackageId = conversation.package_id || offer?.service_package_id;
  const [studentResult, applicationResult, messagesResult, serviceOrderResult] = await Promise.all([
    isCompany
      ? supabase.from("student_profiles").select("public_name").eq("user_id", conversation.student_id).maybeSingle()
      : Promise.resolve({ data: null }),
    conversation.application_id
      ? supabase.from("applications").select("*").eq("id", conversation.application_id).maybeSingle()
      : Promise.resolve({ data: null }),
    supabase
      .from("messages")
      .select("id, sender_id, content, created_at, read_at, flagged_by, attachment_url, attachment_type, event, payload")
      .eq("conversation_id", conversation.id)
      .order("created_at", { ascending: false })
      .limit(100),
    effectivePackageId
      ? supabase
        .from("service_orders")
        .select("*")
        .eq("package_id", effectivePackageId)
        .eq("student_id", conversation.student_id)
        .eq("company_id", conversation.company_id)
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  if (messagesResult.error) {
    console.error("Nie udało się pobrać wiadomości czatu:", messagesResult.error);
  }

  const studentName = studentResult.data?.public_name ?? null;
  const appRow = applicationResult.data;
  const chatMessages = ((messagesResult.data ?? []) as ChatMessageRecord[]).reverse();
  const serviceOrderRow = serviceOrderResult.data;

  const isApplicationConversationLocked =
    conversation.status === "inactive" ||
    appRow?.status === "rejected" ||
    appRow?.status === "cancelled";

  return (
    <div className="mx-auto flex h-full w-full flex-col gap-2 p-2 sm:gap-3 sm:p-3 lg:flex-row">
      <div className="relative isolate flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

        {/* Decorative elements */}
        <div className="pointer-events-none absolute left-0 right-0 top-0 -z-10 h-24 bg-gradient-to-b from-slate-50/80 to-transparent" />

        {/* Header */}
        <div className="sticky top-0 z-20 flex flex-none items-start justify-between gap-3 border-b border-slate-100 bg-white/90 px-4 py-3 backdrop-blur-md sm:items-center sm:gap-4 sm:px-5 sm:py-4">
          <div className="flex min-w-0 items-start gap-3 sm:items-center sm:gap-4">
            <div className="md:hidden">
              <ChatBackBtn />
            </div>
            <div>
              {headerLink ? (
                <Link href={headerLink} className="group flex items-center gap-2">
                  <h2 className="line-clamp-2 text-base font-black tracking-normal text-[#10245f] transition-colors group-hover:text-indigo-600 sm:text-lg sm:line-clamp-1">{chatTitle}</h2>
                  <div className="opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-indigo-500">
                    <Sparkles className="h-4 w-4" />
                  </div>
                </Link>
              ) : (
                <h2 className="line-clamp-2 text-base font-black tracking-normal text-[#10245f] sm:text-lg sm:line-clamp-1">{chatTitle}</h2>
              )}
              {studentName && (
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-0.5">Rozmowa z: <span className="text-indigo-500">{studentName}</span></p>
              )}
              {(isOfferUnavailable || isOfferClosed) && (
                <p className="mt-1 text-xs font-semibold text-amber-600">
                  To ogłoszenie jest już zakończone albo niedostępne. Rozmowa zostaje jako historia ustaleń.
                </p>
              )}
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <ChatDetailsSheet
              conversation={conversation}
              application={appRow}
              offer={offer}
              packageData={pkg}
              serviceOrder={serviceOrderRow}
              isCompany={isCompany}
            />
            <ChatHeaderActions conversationId={conversation.id} />
          </div>
        </div>

        {/* Chat List */}
        <div className="flex-1 overflow-y-auto scroll-smooth bg-slate-50/30 px-2 sm:px-4 md:px-6">
          <div className="mx-auto max-w-3xl py-3 sm:py-6">
            <ChatList
              messages={chatMessages}
              userId={user.id}
              conversationId={conversation.id}
              applicationStatus={appRow?.status ?? null}
              conversationStatus={conversation.status}
              initialHasMore={(messagesResult.data?.length ?? 0) === 100}
            />
          </div>
        </div>

        {/* Input */}
        <div className="z-20 border-t border-slate-100 bg-white p-3 sm:p-4">
          <div className="mx-auto max-w-3xl">
            <ChatInput
              conversationId={conv.id}
              locked={isApplicationConversationLocked}
              lockedMessage="Niestety tym razem firma wybrała kogoś innego."
            />
          </div>
        </div>
      </div>

      {/* Right Sidebar */}
      <ChatSidebar
        conversation={conversation}
        application={appRow}
        offer={offer}
        packageData={pkg}
        serviceOrder={serviceOrderRow}
        isCompany={isCompany}
      />
    </div>
  );
}
