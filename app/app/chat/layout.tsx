import { ReactNode } from "react";
import ChatListSidebar from "./_components/ChatList-Sidebar";

export const dynamic = "force-dynamic";

export default function ChatLayout({ children }: { children: ReactNode }) {
    return (
        <div className="flex h-[calc(100dvh-4.5rem)] w-full bg-slate-50 lg:h-[calc(100vh-theme(spacing.16))]">
            {/* Sidebar */}
            <div className="hidden h-full flex-none lg:block">
                <ChatListSidebar />
            </div>

            {/* Main Content */}
            <main className="flex-1 w-full min-w-0 relative">
                {children}
            </main>
        </div>
    );
}
