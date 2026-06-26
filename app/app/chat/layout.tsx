import { ReactNode } from "react";
import ChatListSidebar from "./_components/ChatList-Sidebar";

export const dynamic = "force-dynamic";

export default function ChatLayout({ children }: { children: ReactNode }) {
    return (
        <div className="mx-auto flex min-h-[calc(100dvh-3.5rem)] w-full max-w-[1380px] flex-col bg-[#f3f6fb] lg:h-[calc(100vh-3.5rem)] lg:flex-row">
            {/* Sidebar */}
            <div className="flex-none border-b border-slate-200 lg:h-full lg:border-b-0">
                <ChatListSidebar />
            </div>

            {/* Main Content */}
            <main className="relative min-h-[680px] w-full min-w-0 flex-1 lg:min-h-0">
                {children}
            </main>
        </div>
    );
}
