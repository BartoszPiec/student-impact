import { createClient } from "@/lib/supabase/server";
import { ChatList } from "@/app/app/chat/[id]/ChatList";
import { ChatInput } from "@/app/app/chat/[id]/ChatInput";
import { sendMessage } from "@/app/app/chat/_actions";
import { redirect } from "next/navigation";

export async function ChatTab({ conversationId }: { conversationId?: string }) {
    if (!conversationId) {
        return <div className="p-8 text-center text-muted-foreground">Brak aktywnej konwersacji.</div>;
    }

    const supabase = await createClient();
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return null;

    const { data: msgs } = await supabase
        .from("messages")
        .select("id, sender_id, content, created_at, attachment_url, attachment_type")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });

    const sendAction = sendMessage.bind(null, conversationId);

    return (
        <div className="flex flex-col h-[600px] border border-slate-100 rounded-2xl overflow-hidden bg-white shadow-sm">
            <div className="flex-1 overflow-y-auto px-4 bg-white bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:20px_20px]">
                <ChatList messages={msgs ?? []} userId={userData.user.id} conversationId={conversationId} />
            </div>
            <div className="p-4 bg-white">
                <ChatInput conversationId={conversationId} placeholder="Napisz wiadomość w sprawie realizacji..." />
            </div>
        </div>
    );
}
