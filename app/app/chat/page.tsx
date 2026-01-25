import { MessageSquare, Sparkles } from "lucide-react";
import ChatListSidebar from "./_components/ChatList-Sidebar";

export default function ChatPage() {
    return (
        <>
            {/* Mobile View: Just the list */}
            <div className="md:hidden h-full">
                <ChatListSidebar />
            </div>

            {/* Desktop View: Empty State */}
            <div className="hidden md:flex h-full flex-col items-center justify-center p-8 text-center bg-slate-50/50">
                <div className="relative mb-6 group cursor-default">
                    <div className="absolute inset-0 bg-indigo-500 rounded-[2rem] blur-2xl opacity-20 group-hover:opacity-30 transition-opacity duration-500"></div>
                    <div className="relative bg-white p-8 rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-white">
                        <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center text-white shadow-lg transform group-hover:scale-110 transition-transform duration-500">
                            <MessageSquare className="h-8 w-8" />
                        </div>
                    </div>
                    <div className="absolute -top-2 -right-2 bg-white p-2 rounded-xl shadow-md animate-bounce delay-700">
                        <Sparkles className="h-4 w-4 text-amber-500" />
                    </div>
                </div>

                <h3 className="text-2xl font-black text-slate-900 tracking-tight">Twoje Centrum Wiadomości</h3>
                <p className="max-w-xs mt-3 text-slate-500 font-medium leading-relaxed">
                    Wybierz konwersację z listy po lewej stronie,<br />aby kontynuować współpracę.
                </p>
            </div>
        </>
    );
}
