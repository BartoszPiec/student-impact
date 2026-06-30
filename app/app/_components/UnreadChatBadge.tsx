"use client";

import { useEffect, useEffectEvent, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function UnreadChatBadge({ userId, initialCount = 0 }: { userId: string, initialCount?: number }) {
    const [count, setCount] = useState(initialCount);
    const supabase = useMemo(() => createClient(), []);

    const fetchCount = useEffectEvent(async () => {
        const { data, error } = await supabase.rpc("get_my_unread_chat_count");

        if (!error && data !== null) {
            const unreadCount = Number(data);
            setCount(Number.isFinite(unreadCount) ? unreadCount : 0);
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
