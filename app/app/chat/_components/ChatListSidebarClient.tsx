"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Inbox, Search } from "lucide-react";
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
  const supabase = createClient();

  useEffect(() => {
    setConversations(initialConversations);
  }, [initialConversations]);

  useEffect(() => {
    const match = pathname?.match(/\/app\/chat\/([^/]+)/);
    if (match) {
      const id = match[1];
      const conversation = conversations.find((item) => item.id === id);
      if (conversation) {
        setReadMap((prev) => ({ ...prev, [id]: conversation.last_message }));
      }
    }
  }, [pathname, conversations]);

  useEffect(() => {
    const channel = supabase
      .channel("chat_list_updates")
      .on("postgres_changes", { event: "*", schema: "public", table: "messages" }, (payload) => {
        const newMsg = payload.new as { sender_id?: string } | null;
        if (newMsg?.sender_id === userId) return;
        router.refresh();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [router, supabase, userId]);

  const filtered = useMemo(() => {
    return conversations.filter((conversation) => {
      const name = conversation.other_user.nazwa || conversation.other_user.public_name || "Użytkownik";
      const title = conversation.offer?.tytul || conversation.package?.title || "";
      const matchSearch =
        name.toLowerCase().includes(search.toLowerCase()) ||
        title.toLowerCase().includes(search.toLowerCase());

      if (activeTab === "all") return matchSearch;
      return matchSearch && conversation.type === activeTab;
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
    <div className="flex flex-col h-full bg-slate-50 border-r border-slate-200/60 w-full md:w-80 relative z-20">
      <div className="p-6 pb-2 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="font-black text-2xl text-slate-800 tracking-tight flex items-center gap-2">
            <Inbox className="w-6 h-6 text-indigo-500" />
            Wiadomości
          </h2>
          <Badge variant="secondary" className="bg-white shadow-sm text-slate-500 hover:bg-slate-50 border-slate-100 rounded-lg">
            {filtered.length}
          </Badge>
        </div>

        <div className="space-y-3">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
            <Input
              placeholder="Szukaj rozmów..."
              className="pl-11 h-12 bg-white/50 border-slate-200 focus:bg-white focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300 rounded-2xl transition-all font-medium placeholder:text-slate-400"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="w-full h-10 p-1 bg-slate-200/50 rounded-xl grid grid-cols-4 gap-1">
              <TabsTrigger value="all" className="rounded-lg text-xs font-bold data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm transition-all">
                Wsz.
              </TabsTrigger>
              <TabsTrigger value="application" className="rounded-lg text-xs font-bold data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm transition-all">
                Apl.
              </TabsTrigger>
              <TabsTrigger value="order" className="rounded-lg text-xs font-bold data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm transition-all">
                Zlec.
              </TabsTrigger>
              <TabsTrigger value="inquiry" className="rounded-lg text-xs font-bold data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm transition-all">
                Pyt.
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-2">
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
                  "flex items-start gap-3 p-4 rounded-2xl transition-all duration-300 relative group border border-transparent",
                  isActive
                    ? "bg-white shadow-md shadow-indigo-500/10 border-indigo-50"
                    : "hover:bg-white hover:shadow-sm hover:border-slate-100",
                )}
              >
                <div className="relative">
                  <Avatar
                    className={cn(
                      "h-12 w-12 border-2 transition-colors",
                      isActive ? "border-indigo-100" : "border-white shadow-sm",
                    )}
                  >
                    <AvatarFallback
                      className={cn(
                        "font-bold",
                        isActive ? "bg-indigo-50 text-indigo-600" : "bg-slate-100 text-slate-500",
                      )}
                    >
                      {initial}
                    </AvatarFallback>
                  </Avatar>
                  {effectiveUnread > 0 ? (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full border-2 border-slate-50 flex items-center justify-center text-[9px] font-bold text-white shadow-sm">
                      {effectiveUnread > 9 ? "9+" : effectiveUnread}
                    </span>
                  ) : null}
                </div>

                <div className="flex-1 min-w-0 py-0.5">
                  <div className="flex justify-between items-center mb-1">
                    <span className={cn("font-bold text-sm truncate", isActive ? "text-indigo-900" : "text-slate-800")}>
                      {name}
                    </span>
                    {conversation.active_at ? (
                      <span className={cn("text-[10px] font-medium whitespace-nowrap ml-2", isActive ? "text-indigo-400" : "text-slate-400")}>
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
                        isActive ? "text-indigo-600/80 font-medium" : "text-slate-500",
                        effectiveUnread ? "font-bold text-slate-900" : "",
                      )}
                    >
                      {conversation.last_message || (
                        <span className="italic text-slate-400 opacity-70">Brak wiadomości</span>
                      )}
                    </p>
                  </div>

                  <div className="flex mt-1.5 gap-2">
                    {conversation.type === "order" ? (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-100 uppercase tracking-wide">
                        Zlecenie
                      </span>
                    ) : null}
                    {conversation.type === "inquiry" ? (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-50 text-amber-600 border border-amber-100 uppercase tracking-wide">
                        Pytanie
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
