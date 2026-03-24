"use client";

import { useEffect, useEffectEvent, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function UnreadChatBadge({ userId, initialCount = 0 }: { userId: string, initialCount?: number }) {
    const [count, setCount] = useState(initialCount);
    const supabase = createClient();

    const fetchCount = useEffectEvent(async () => {
        const { count, error } = await supabase
            .from("messages")
            .select("id", { count: "exact", head: true })
            .neq("sender_id", userId)
            .is("read_at", null);

        if (!error && count !== null) {
            setCount(count);
        }
    });

    useEffect(() => {
        setCount(initialCount);
    }, [initialCount]);

    useEffect(() => {
        fetchCount();

        const channel = supabase
            .channel('global_unread_chat')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, () => {
                fetchCount();
            })
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [supabase, userId]);

    if (count === 0) return null;

    return (
        <span className="inline-block ml-2 h-2.5 w-2.5 rounded-full bg-red-600 shadow-sm ring-1 ring-white" />
    );
}
