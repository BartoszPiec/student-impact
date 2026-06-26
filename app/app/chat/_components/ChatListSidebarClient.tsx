"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Inbox, MailOpen, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChatPreview } from "./ChatList-Sidebar";

export default function ChatListSidebarClient({
  initialConversations = [],
  userId,
}: {
  initialConversations: ChatPreview[];
  userId: string;
}) {
  const [conversations, setConversations] = useState<ChatPreview[]>(initialConversations);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [readMap, setReadMap] = useState<Record<string, string | undefined>>({});

  const pathname = usePathname();
  const router = useRouter();
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
    if (match) {
      const id = match[1];
      const conversation = conversations.find((item) => item.id === id);
      if (conversation) {
        setReadMap((previous) =>
          previous[id] === conversation.last_message
            ? previous
            : { ...previous, [id]: conversation.last_message },
        );
      }
    }
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
      const name = conversation.other_user.nazwa || conversation.other_user.public_name || "Użytkownik";
      const title = conversation.offer?.tytul || conversation.package?.title || "";
      const matchSearch =
        name.toLocaleLowerCase("pl-PL").includes(normalizedSearch) ||
        title.toLocaleLowerCase("pl-PL").includes(normalizedSearch);

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

  return (
    <div className="relative z-20 flex h-auto w-full flex-col border-r border-slate-200 bg-white md:w-80 lg:h-full">
      <div className="space-y-4 p-4 pb-2">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-lg font-black tracking-normal text-[#10245f]">
            <Inbox className="w-6 h-6 text-[#10245f]" />
            Wiadomości
          </h2>
          <Badge variant="secondary" className="bg-white shadow-sm text-slate-500 hover:bg-slate-50 border-slate-100 rounded-lg">
            {filtered.length}
          </Badge>
        </div>

        <div className="space-y-3">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-[#10245f] transition-colors" />
            <Input
              placeholder="Szukaj rozmów..."
              className="h-11 rounded-xl border-slate-200 bg-slate-50 pl-11 font-medium transition-all placeholder:text-slate-400 focus:border-lime-200 focus:bg-white focus:ring-2 focus:ring-lime-100"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
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

      <div className="space-y-2 p-3 lg:flex-1 lg:overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center p-8 text-center opacity-70">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
              <Search className="h-6 w-6 text-slate-400" />
            </div>
            <p className="text-sm font-bold text-slate-700">{emptyState.title}</p>
            <p className="text-xs text-slate-500 mt-2 max-w-[190px] leading-relaxed">{emptyState.description}</p>
          </div>
        ) : (
          filtered.map((conversation) => {
            const isActive = pathname === `/app/chat/${conversation.id}`;
            const name = conversation.other_user.nazwa || conversation.other_user.public_name || "Użytkownik";
            const initial = name[0]?.toUpperCase() || "?";
            const isOptimisticRead = readMap[conversation.id] === conversation.last_message;
            const effectiveUnread =
              isActive || isOptimisticRead ? 0 : (conversation.unread_count || 0);

            return (
              <Link
                key={conversation.id}
                href={`/app/chat/${conversation.id}`}
                className={cn(
                  "group relative flex items-start gap-3 rounded-xl border border-transparent p-3 transition-all duration-300",
                  isActive
                    ? "border-lime-200 bg-lime-100"
                    : "hover:bg-white hover:shadow-sm hover:border-slate-100",
                )}
              >
                <div className="relative">
                  <Avatar
                    className={cn(
                      "h-12 w-12 border-2 transition-colors",
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
                    <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full border-2 border-slate-50 bg-lime-300 flex items-center justify-center text-[9px] font-bold text-[#0b1b47] shadow-sm">
                      {effectiveUnread > 9 ? "9+" : effectiveUnread}
                    </span>
                  ) : null}
                </div>

                <div className="flex-1 min-w-0 py-0.5">
                  <div className="flex justify-between items-center mb-1">
                    <span className={cn("font-bold text-sm truncate", isActive ? "text-[#10245f]" : "text-slate-800")}>
                      {name}
                    </span>
                    {conversation.active_at ? (
                      <span className={cn("text-[10px] font-medium whitespace-nowrap ml-2", isActive ? "text-[#10245f]/60" : "text-slate-400")}>
                        {(() => {
                          const d = new Date(conversation.active_at);
                          const now = new Date();
                          const isToday =
                            d.getDate() === now.getDate() &&
                            d.getMonth() === now.getMonth() &&
                            d.getFullYear() === now.getFullYear();

                          return isToday
                            ? d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                            : d.toLocaleDateString([], { month: "short", day: "numeric" });
                        })()}
                      </span>
                    ) : null}
                  </div>

                  <div className="flex items-center gap-1.5 min-w-0">
                    <p
                      className={cn(
                        "text-sm truncate flex-1 leading-snug",
                        isActive ? "text-[#10245f]/80 font-medium" : "text-slate-500",
                        effectiveUnread ? "font-bold text-slate-900" : "",
                      )}
                    >
                      {conversation.last_message || (
                        <span className="italic text-slate-400 opacity-70">Brak wiadomości</span>
                      )}
                    </p>
                  </div>

                  <div className="flex mt-1.5 gap-1.5 flex-wrap">
                    {conversation.type === "order" && (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-100 uppercase tracking-wide">
                        Zlecenie
                      </span>
                    )}
                    {conversation.type === "application" && (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-lime-50 text-[#10245f] border border-lime-100 uppercase tracking-wide">
                        Aplikacja
                      </span>
                    )}
                    {conversation.type === "inquiry" && (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-50 text-amber-600 border border-amber-100 uppercase tracking-wide">
                        Zapytanie
                      </span>
                    )}
                    {effectiveUnread > 0 && !isActive && (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-black bg-[#10245f] text-white uppercase tracking-wide">
                        Nowe
                      </span>
                    )}
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
