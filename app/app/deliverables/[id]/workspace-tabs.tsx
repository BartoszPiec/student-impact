"use client";

import { useState, type ComponentProps } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { Clock, FileText, Lock, MessageSquare } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";

const StatusTab = dynamic(() => import("./tabs/StatusTab").then((module) => module.StatusTab), {
  loading: () => <TabSkeleton />,
});
const FilesTab = dynamic(() => import("./tabs/FilesTab").then((module) => module.FilesTab), {
  loading: () => <TabSkeleton />,
});
const SecretsTab = dynamic(() => import("./tabs/SecretsTab").then((module) => module.SecretsTab), {
  loading: () => <TabSkeleton />,
});

type StatusTabProps = ComponentProps<typeof StatusTab>;
type FilesTabProps = ComponentProps<typeof FilesTab>;
type SecretsTabProps = ComponentProps<typeof SecretsTab>;
type WorkspaceTab = "status" | "files" | "secrets" | "chat";

function TabSkeleton() {
  return <div className="h-80 animate-pulse rounded-[2rem] bg-slate-100" />;
}

export function WorkspaceTabs({
  statusProps,
  filesProps,
  secretsProps,
  conversationId,
}: {
  statusProps: StatusTabProps;
  filesProps: FilesTabProps;
  secretsProps: SecretsTabProps;
  conversationId?: string;
}) {
  const [activeTab, setActiveTab] = useState<WorkspaceTab>("status");

  return (
    <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as WorkspaceTab)} className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150">
      <div className="flex flex-col justify-between gap-6 rounded-[2rem] border border-slate-200 bg-white/90 p-4 shadow-2xl shadow-slate-200/40 backdrop-blur-xl md:flex-row md:items-center">
        <TabsList className="flex h-auto w-full flex-wrap gap-1.5 rounded-2xl border-none bg-slate-100/50 p-1.5 md:inline-flex md:w-auto">
          <TabsTrigger value="status" className="flex-1 rounded-xl px-3 py-2 text-[10px] font-black uppercase tracking-wider transition-all data-[state=active]:bg-slate-900 data-[state=active]:text-white data-[state=active]:shadow-lg md:flex-none md:px-8 md:py-3 md:text-xs md:tracking-widest">
            <Clock className="mr-1.5 h-3.5 w-3.5 md:h-4 md:w-4" /> Status
          </TabsTrigger>
          <TabsTrigger value="files" className="flex-1 rounded-xl px-3 py-2 text-[10px] font-black uppercase tracking-wider transition-all data-[state=active]:bg-slate-900 data-[state=active]:text-white data-[state=active]:shadow-lg md:flex-none md:px-8 md:py-3 md:text-xs md:tracking-widest">
            <FileText className="mr-1.5 h-3.5 w-3.5 md:h-4 md:w-4" /> Pliki
          </TabsTrigger>
          <TabsTrigger value="secrets" className="flex-1 rounded-xl px-3 py-2 text-[10px] font-black uppercase tracking-wider transition-all data-[state=active]:bg-slate-900 data-[state=active]:text-white data-[state=active]:shadow-lg md:flex-none md:px-8 md:py-3 md:text-xs md:tracking-widest">
            <Lock className="mr-1.5 h-3.5 w-3.5 md:h-4 md:w-4" /> Dostępy
          </TabsTrigger>
          <TabsTrigger value="chat" className="flex-1 rounded-xl px-3 py-2 text-[10px] font-black uppercase tracking-wider transition-all data-[state=active]:bg-slate-900 data-[state=active]:text-white data-[state=active]:shadow-lg md:flex-none md:px-8 md:py-3 md:text-xs md:tracking-widest">
            <MessageSquare className="mr-1.5 h-3.5 w-3.5 md:h-4 md:w-4" /> Wiadomości
          </TabsTrigger>
        </TabsList>
        <div className="hidden items-center gap-3 border-l border-slate-100 px-6 py-2 lg:flex">
          <div className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Sesja aktywna</span>
        </div>
      </div>

      <div className="min-h-[400px]">
        <TabsContent value="status" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
          {activeTab === "status" ? <StatusTab {...statusProps} /> : null}
        </TabsContent>
        <TabsContent value="files" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
          {activeTab === "files" ? <FilesTab {...filesProps} /> : null}
        </TabsContent>
        <TabsContent value="secrets" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
          {activeTab === "secrets" ? <SecretsTab {...secretsProps} /> : null}
        </TabsContent>
        <TabsContent value="chat" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
          {activeTab === "chat" ? (
            <div className="flex min-h-80 items-center justify-center rounded-[2rem] border border-slate-200 bg-white p-8 text-center">
              <div>
                <MessageSquare className="mx-auto h-10 w-10 text-indigo-500" />
                <h3 className="mt-4 text-xl font-black text-slate-900">Wiadomości są dostępne w pełnym widoku czatu</h3>
                <Button asChild className="mt-5 rounded-xl" disabled={!conversationId}>
                  <Link href={conversationId ? `/app/chat/${conversationId}` : "/app/chat"}>Otwórz rozmowę</Link>
                </Button>
              </div>
            </div>
          ) : null}
        </TabsContent>
      </div>
    </Tabs>
  );
}
