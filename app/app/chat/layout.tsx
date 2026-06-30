import { ReactNode } from "react";
import ChatListSidebar from "./_components/ChatList-Sidebar";
import { ChatLayoutShell } from "./ChatLayoutShell";

export const dynamic = "force-dynamic";

export default function ChatLayout({ children }: { children: ReactNode }) {
    return (
        <ChatLayoutShell sidebar={<ChatListSidebar />}>
            {children}
        </ChatLayoutShell>
    );
}
