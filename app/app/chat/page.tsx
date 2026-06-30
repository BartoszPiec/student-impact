import ChatListSidebarClient from "./_components/ChatListSidebarClient";
import { getChatPreviews } from "./_components/chat-preview-data";
import { MessageSquare, Sparkles } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ChatPage() {
  const { conversations, userId } = await getChatPreviews();

  return (
    <div className="h-full w-full">
      <div className="h-full w-full overflow-hidden rounded-none bg-white shadow-sm sm:rounded-2xl sm:border sm:border-slate-200 lg:hidden">
        <ChatListSidebarClient
          initialConversations={conversations}
          userId={userId}
          variant="inbox"
        />
      </div>

      <div className="hidden h-full flex-col items-center justify-center bg-slate-50/50 p-8 text-center lg:flex">
        <div className="group relative mb-6 cursor-default">
          <div className="absolute inset-0 rounded-[2rem] bg-[#10245f] opacity-15 blur-2xl transition-opacity duration-500 group-hover:opacity-25" />
          <div className="relative rounded-[2.5rem] border border-white bg-white p-8 shadow-xl shadow-slate-200/50">
            <div className="flex h-16 w-16 transform items-center justify-center rounded-2xl bg-[#10245f] text-white shadow-lg transition-transform duration-500 group-hover:scale-110">
              <MessageSquare className="h-8 w-8" />
            </div>
          </div>
          <div className="absolute -right-2 -top-2 animate-bounce rounded-xl bg-white p-2 shadow-md delay-700">
            <Sparkles className="h-4 w-4 text-lime-400" />
          </div>
        </div>

        <h3 className="text-2xl font-black tracking-tight text-slate-900">Twoje centrum wiadomości</h3>
        <p className="mt-3 max-w-xs font-medium leading-relaxed text-slate-500">
          Wybierz konwersację z listy po lewej stronie,
          <br />
          aby kontynuować współpracę.
        </p>
      </div>
    </div>
  );
}
