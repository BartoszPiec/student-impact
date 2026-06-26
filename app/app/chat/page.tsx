import { MessageSquare, Sparkles } from "lucide-react";

export default function ChatPage() {
  return (
    <>
      <div className="flex h-full flex-col items-center justify-center bg-slate-50/50 p-8 text-center">
        <div className="relative mb-6 group cursor-default">
          <div className="absolute inset-0 rounded-[2rem] bg-[#10245f] blur-2xl opacity-15 transition-opacity duration-500 group-hover:opacity-25" />
          <div className="relative bg-white p-8 rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-white">
            <div className="flex h-16 w-16 transform items-center justify-center rounded-2xl bg-[#10245f] text-white shadow-lg transition-transform duration-500 group-hover:scale-110">
              <MessageSquare className="h-8 w-8" />
            </div>
          </div>
          <div className="absolute -top-2 -right-2 animate-bounce rounded-xl bg-white p-2 shadow-md delay-700">
            <Sparkles className="h-4 w-4 text-lime-400" />
          </div>
        </div>

        <h3 className="text-2xl font-black text-slate-900 tracking-tight">Twoje centrum wiadomości</h3>
        <p className="max-w-xs mt-3 text-slate-500 font-medium leading-relaxed">
          Wybierz konwersację z listy po lewej stronie,
          <br />
          aby kontynuować współpracę.
        </p>
      </div>
    </>
  );
}
