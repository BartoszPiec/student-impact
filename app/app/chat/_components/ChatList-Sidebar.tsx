
import { createClient } from "@/lib/supabase/server";
import ChatListSidebarClient from "./ChatListSidebarClient";

export type ChatPreview = {
    id: string;
    created_at: string;
    active_at: string;
    unread_count?: number;
    last_message?: string;
    type?: "inquiry" | "application" | "order" | "direct";
    other_user: {
        id: string;
        email: string;
        public_name?: string;
        avatar_url?: string;
        role?: string;
        nazwa?: string;
    };
    offer?: {
        tytul: string;
    };
    package?: {
        title: string;
    };
    application?: {
        offer?: {
            tytul: string;
        }
    }
};

export default async function ChatListSidebar() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return <ChatListSidebarClient initialConversations={[]} userId="" />;

    // REVERTED: Sorted by created_at because updated_at column might be missing.
    // Also removed updated_at from select to prevent crash.
    const { data, error } = await supabase
        .from("conversations")
        .select(`
        id, 
        created_at,
        updated_at,
        type,
        student_id,
        company_id,
        offer:offers(tytul),
        package:service_packages(title),
        application:applications(offer:offers(tytul)),
        messages:messages(content, created_at, read_at, sender_id)
      `)
        .or(`student_id.eq.${user.id},company_id.eq.${user.id}`)
        .order("updated_at", { ascending: false });

    if (error) {
        console.error("Sidebar fetch error:", error);
        return <ChatListSidebarClient initialConversations={[]} userId={user.id} />;
    }

    const processed: ChatPreview[] = await Promise.all(data.map(async (conv: any) => {
        const isStudent = user.id === conv.student_id;
        const otherId = isStudent ? conv.company_id : conv.student_id;

        let otherUser: any = { id: otherId, email: "User" };

        if (isStudent) {
            const { data: cp } = await supabase.from("company_profiles").select("nazwa, website").eq("user_id", otherId).maybeSingle();
            if (cp) otherUser = { ...otherUser, nazwa: cp.nazwa, role: "company" };
        } else {
            const { data: sp } = await supabase.from("student_profiles").select("public_name").eq("user_id", otherId).maybeSingle();
            if (sp) otherUser = { ...otherUser, public_name: sp.public_name, role: "student" };
        }

        // Sort messages desc
        const sortedMsgs = (conv.messages || []).sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        const lastMsg = sortedMsgs[0];
        const amISender = lastMsg?.sender_id === user.id;

        // Calculate unread. 
        // If I sent the last message, assume I read everything -> Unread = 0.
        const unreadRaw = conv.messages?.filter((m: any) => m.sender_id !== user.id && !m.read_at).length || 0;
        const unread = amISender ? 0 : unreadRaw;

        // Type Logic: Respect explicit 'inquiry' type even if package is present
        let derivedType = conv.type;
        if (conv.package && derivedType !== 'inquiry') derivedType = 'order';
        else if (conv.application) derivedType = 'application';
        else if (!derivedType) derivedType = 'inquiry';

        return {
            id: conv.id,
            created_at: conv.created_at,
            active_at: conv.updated_at || conv.created_at,
            type: derivedType as any,
            unread_count: unread,
            last_message: lastMsg?.content || "",
            other_user: otherUser,
            offer: conv.offer,
            package: conv.package,
            application: conv.application
        };
    }));

    return <ChatListSidebarClient initialConversations={processed} userId={user.id} />;
}
