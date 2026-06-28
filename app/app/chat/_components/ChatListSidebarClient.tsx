"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Inbox, MailOpen, Search } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import type { ChatPreview } from "./chat-preview-types";

type ChatListVariant = "sidebar" | "inbox";

function getConversationName(conversation: ChatPreview) {
  return conversation.other_user.nazwa || conversation.other_user.public_name || "Użytkownik";
}

function getConversationTitle(conversation: ChatPreview) {
  return conversation.offer?.tytul || conversation.package?.title || conversation.application?.offer?.tytul || "";
}

function formatActiveAt(value: string) {
  const date = new Date(value);
  const now = new Date();
  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();

  return isToday
    ? date.toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit" })
    : date.toLocaleDateString("pl-PL", { month: "short", day: "numeric" });
}

export default function ChatListSidebarClient({
  initialConversations = [],
  userId,
  variant = "sidebar",
}: {
  initialConversations: ChatPreview[];
  userId: string;
  variant?: ChatListVariant;
}) {
  const [conversations, setConversations] = useState<ChatPreview[]>(initialConversations);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [readMap, setReadMap] = useState<Record<string, string | undefined>>({});

  const pathname = usePathname();
  const router = useRouter();
  const isInbox = variant === "inbox";
  const knownConversationIdsRef = useRef(
    new Set(initialConversations.map((conversation) => conversation.id)),
  );

  useEffect(() => {
    setConversations(initialConversations);
  }, [initialConversations]);

  useEffect(() => {
    knownConversationIdsRef.current = new Set(conversations.map((conversation) => conversation.id));
  }, [conversations]);

  useEffect(() => {
    const match = pathname?.match(/\/app\/chat\/([^/]+)/);
    if (!match) return;

    const id = match[1];
    const conversation = conversations.find((item) => item.id === id);
    if (!conversation) return;

    setReadMap((previous) =>
      previous[id] === conversation.last_message
        ? previous
        : { ...previous, [id]: conversation.last_message },
    );
  }, [pathname, conversations]);

  useEffect(() => {
    let active = true;
    let refreshTimer: ReturnType<typeof setTimeout> | null = null;
    let removeChannel: (() => void) | undefined;

    const requestRefresh = () => {
      if (refreshTimer) return;
      refreshTimer = setTimeout(() => {
        refreshTimer = null;
        router.refresh();
      }, 1200);
    };

    void import("@/lib/supabase/client").then(({ createClient }) => {
      if (!active) return;

      const supabase = createClient();
      const channel = supabase
        .channel("chat_list_updates")
        .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, (payload) => {
          const newMsg = payload.new as { conversation_id?: string; sender_id?: string } | null;
          if (newMsg?.sender_id === userId) return;
          if (newMsg?.conversation_id && !knownConversationIdsRef.current.has(newMsg.conversation_id)) return;
          requestRefresh();
        })
        .on("postgres_changes", { event: "INSERT", schema: "public", table: "conversations" }, (payload) => {
          const conversation = payload.new as { company_id?: string; student_id?: string } | null;
          if (conversation?.company_id === userId || conversation?.student_id === userId) {
            requestRefresh();
          }
        })
        .subscribe();

      removeChannel = () => {
        void supabase.removeChannel(channel);
      };
    });

    return () => {
      active = false;
      if (refreshTimer) clearTimeout(refreshTimer);
      removeChannel?.();
    };
  }, [router, userId]);

  const filtered = useMemo(() => {
    const normalizedSearch = search.toLocaleLowerCase("pl-PL");

    return conversations.filter((conversation) => {
      const name = getConversationName(conversation);
      const title = getConversationTitle(conversation);
      const matchSearch =
        name.toLocaleLowerCase("pl-PL").includes(normalizedSearch) ||
        title.toLocaleLowerCase("pl-PL").includes(normalizedSearch) ||
        String(conversation.last_message ?? "").toLocaleLowerCase("pl-PL").includes(normalizedSearch);

      if (activeTab === "unread") {
        return matchSearch && (conversation.unread_count || 0) > 0;
      }

      return matchSearch;
    });
  }, [activeTab, conversations, search]);

  const emptyState = useMemo(() => {
    const hasSearch = search.trim().length > 0;
    const hasFilters = activeTab !== "all";

    if (conversations.length === 0) {
      return {
        title: "Nie masz jeszcze żadnych rozmów",
        description: "Gdy rozpoczniesz kontakt z firmą lub studentem, rozmowy pojawią się tutaj.",
      };
    }

    if (hasSearch || hasFilters) {
      return {
        title: "Brak wyników",
        description: "Spróbuj zmienić wyszukiwane hasło albo wyczyścić filtry.",
      };
    }

    return {
      title: "Wybierz rozmowę z listy",
      description: "Tutaj zobaczysz tylko te konwersacje, które pasują do wybranego widoku.",
    };
  }, [activeTab, conversations.length, search]);

  const isConversationRoute = Boolean(pathname?.match(/\/app\/chat\/[^/]+/));

  return (
    <div
      className={cn(
        isInbox
          ? "relative z-20 flex h-full w-full flex-col bg-white"
          : "relative z-20 h-auto w-full flex-col border-r border-slate-200 bg-white md:w-80 lg:flex lg:h-full",
        !isInbox && isConversationRoute ? "hidden lg:flex" : "flex",
      )}
    >
      <div className={cn("space-y-4", isInbox ? "p-4 pb-3 sm:p-6 sm:pb-4" : "p-4 pb-2")}>
        <div className="flex items-center justify-between gap-3">
          <h2 className={cn("flex items-center gap-2 font-black tracking-normal text-[#10245f]", isInbox ? "text-2xl sm:text-3xl" : "text-lg")}>
            <Inbox className={cn("text-[#10245f]", isInbox ? "h-7 w-7" : "h-6 w-6")} />
            Wiadomości
          </h2>
          <Badge variant="secondary" className="rounded-lg border-slate-100 bg-white text-slate-500 shadow-sm hover:bg-slate-50">
            {filtered.length}
          </Badge>
        </div>

        <div className="space-y-3">
          <div className="group relative">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-[#10245f]" />
            <Input
              placeholder="Szukaj rozmów..."
              className={cn(
                "rounded-xl border-slate-200 bg-slate-50 pl-11 font-medium transition-all placeholder:text-slate-400 focus:border-lime-200 focus:bg-white focus:ring-2 focus:ring-lime-100",
                isInbox ? "h-12" : "h-11",
              )}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid h-10 w-full grid-cols-2 gap-1 rounded-xl bg-slate-100 p-1">
              <TabsTrigger value="all" className="rounded-lg text-xs font-bold transition-all data-[state=active]:bg-[#10245f] data-[state=active]:text-white">
                Wszystkie
              </TabsTrigger>
              <TabsTrigger value="unread" className="rounded-lg text-xs font-bold transition-all data-[state=active]:bg-[#10245f] data-[state=active]:text-white">
                <MailOpen className="mr-1 h-3.5 w-3.5" />
                Nieprzeczytane
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      <div className={cn("space-y-2", isInbox ? "flex-1 overflow-y-auto p-3 sm:p-4" : "p-3 lg:flex-1 lg:overflow-y-auto")}>
        {filtered.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center p-8 text-center opacity-70">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
              <Search className="h-6 w-6 text-slate-400" />
            </div>
            <p className="text-sm font-bold text-slate-700">{emptyState.title}</p>
            <p className="mt-2 max-w-[240px] text-xs leading-relaxed text-slate-500">{emptyState.description}</p>
          </div>
        ) : (
          filtered.map((conversation) => {
            const isActive = pathname === `/app/chat/${conversation.id}`;
            const name = getConversationName(conversation);
            const title = getConversationTitle(conversation);
            const initial = name[0]?.toUpperCase() || "?";
            const isOptimisticRead = readMap[conversation.id] === conversation.last_message;
            const effectiveUnread = isActive || isOptimisticRead ? 0 : (conversation.unread_count || 0);

            return (
              <Link
                key={conversation.id}
                href={`/app/chat/${conversation.id}`}
                className={cn(
                  "group relative flex items-start gap-3 rounded-xl border border-transparent transition-all duration-300",
                  isInbox ? "p-4 sm:gap-4 sm:rounded-2xl sm:border-slate-100 sm:bg-white sm:shadow-sm" : "p-3",
                  isActive ? "border-lime-200 bg-lime-100" : "hover:border-slate-100 hover:bg-white hover:shadow-sm",
                )}
              >
                <div className="relative">
                  <Avatar
                    className={cn(
                      "border-2 transition-colors",
                      isInbox ? "h-14 w-14 sm:h-16 sm:w-16" : "h-12 w-12",
                      isActive ? "border-lime-200" : "border-white shadow-sm",
                    )}
                  >
                    <AvatarFallback
                      className={cn(
                        "font-bold",
                        isActive ? "bg-lime-100 text-[#10245f]" : "bg-slate-100 text-slate-500",
                      )}
                    >
                      {initial}
                    </AvatarFallback>
                  </Avatar>
                  {effectiveUnread > 0 ? (
                    <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-slate-50 bg-lime-300 text-[9px] font-bold text-[#0b1b47] shadow-sm">
                      {effectiveUnread > 9 ? "9+" : effectiveUnread}
                    </span>
                  ) : null}
                </div>

                <div className="min-w-0 flex-1 py-0.5">
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <span className={cn("truncate font-bold", isInbox ? "text-base" : "text-sm", isActive ? "text-[#10245f]" : "text-slate-800")}>
                      {name}
                    </span>
                    {conversation.active_at ? (
                      <span className={cn("ml-2 whitespace-nowrap text-[10px] font-medium", isActive ? "text-[#10245f]/60" : "text-slate-400")}>
                        {formatActiveAt(conversation.active_at)}
                      </span>
                    ) : null}
                  </div>

                  {isInbox && title ? (
                    <p className="mb-1 truncate text-xs font-bold uppercase tracking-wide text-slate-400">
                      {title}
                    </p>
                  ) : null}

                  <div className="flex min-w-0 items-center gap-1.5">
                    <p
                      className={cn(
                        "flex-1 truncate leading-snug",
                        isInbox ? "text-sm sm:text-base" : "text-sm",
                        isActive ? "font-medium text-[#10245f]/80" : "text-slate-500",
                        effectiveUnread ? "font-bold text-slate-900" : "",
                      )}
                    >
                      {conversation.last_message || (
                        <span className="italic text-slate-400 opacity-70">Brak wiadomości</span>
                      )}
                    </p>
                  </div>

                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {conversation.type === "order" && (
                      <span className="inline-flex items-center rounded border border-emerald-100 bg-emerald-50 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-emerald-600">
                        Zlecenie
                      </span>
                    )}
                    {conversation.type === "application" && (
                      <span className="inline-flex items-center rounded border border-lime-100 bg-lime-50 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-[#10245f]">
                        Aplikacja
                      </span>
                    )}
                    {conversation.type === "inquiry" && (
                      <span className="inline-flex items-center rounded border border-amber-100 bg-amber-50 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-amber-600">
                        Zapytanie
                      </span>
                    )}
                    {effectiveUnread > 0 && !isActive ? (
                      <span className="inline-flex items-center rounded bg-[#10245f] px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wide text-white">
                        Nowe
                      </span>
                    ) : null}
                  </div>
                </div>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}
