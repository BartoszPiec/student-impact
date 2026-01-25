"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export function UnreadChatBadge({ userId, initialCount = 0 }: { userId: string, initialCount?: number }) {
    // Initialize with SSR value to prevent flicker
    const [count, setCount] = useState(initialCount);
    const supabase = createClient();
    const router = useRouter();

    const fetchCount = async () => {
        // Count messages that are NOT from me, and NOT read.
        // RLS ensures we only see messages from our conversations.
        const { count, error } = await supabase
            .from("messages")
            .select("id", { count: "exact", head: true })
            .neq("sender_id", userId)
            .is("read_at", null);

        if (!error && count !== null) {
            setCount(count);
        }
    };

    // Update count if initialCount prop changes (e.g. navigation / revalidation)
    useEffect(() => {
        setCount(initialCount);
    }, [initialCount]);

    useEffect(() => {
        // We still fetch on mount to be sure, and subscribe.
        fetchCount();

        const channel = supabase
            .channel('global_unread_chat')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, () => {
                fetchCount();
            })
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [userId]);

    if (count === 0) return null;

    // Minimalist red dot (Static, no animation)
    return (
        <span className="inline-block ml-2 h-2.5 w-2.5 rounded-full bg-red-600 shadow-sm ring-1 ring-white" />
    );
}
