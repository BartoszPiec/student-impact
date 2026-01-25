"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Bell, Check, Info, AlertCircle, CheckCircle, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { getRecentNotifications, markNotificationRead, markAllNotificationsRead } from "@/app/app/notifications/_actions";
import { formatDistanceToNow } from "date-fns";
import { pl } from "date-fns/locale";
import { getNotificationTitle } from "@/app/app/notifications/utils";

export default function NotificationsBell({ unread }: { unread: number }) {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [cleared, setCleared] = useState(false);

  useEffect(() => {
    if (open) {
      setCleared(true);
      setLoading(true);
      getRecentNotifications(5).then((data) => {
        setNotifications(data);
        setLoading(false);
      });
    }
  }, [open]); // Refresh when opened

  const handleMarkAllRead = async () => {
    await markAllNotificationsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, read_at: new Date().toISOString() })));
  };

  const handleMarkRead = async (id: string, currentReadAt: string | null) => {
    if (!currentReadAt) {
      await markNotificationRead(id);
      setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read_at: new Date().toISOString() } : n));
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "MESSAGE": return <MessageSquare className="h-4 w-4 text-blue-500" />;
      case "OFFER": return <AlertCircle className="h-4 w-4 text-orange-500" />;
      case "JOB_COMPLETED": return <CheckCircle className="h-4 w-4 text-green-500" />;
      default: return <Info className="h-4 w-4 text-slate-500" />;
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative text-slate-500 hover:text-indigo-600 hover:bg-indigo-50/50">
          <Bell className="h-5 w-5" />
          {unread > 0 && !cleared && (
            <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-sm ring-2 ring-white">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0 shadow-xl border-slate-100 bg-white" align="end">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50/50">
          <h4 className="font-semibold text-sm text-slate-900">Powiadomienia</h4>
          {unread > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="text-[10px] uppercase font-bold text-indigo-600 hover:text-indigo-700 tracking-wide"
            >
              Oznacz wszystkie
            </button>
          )}
        </div>

        <div className="max-h-[300px] overflow-y-auto py-1">
          {loading ? (
            <div className="p-4 text-center text-xs text-slate-400">Ładowanie...</div>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center">
              <Bell className="h-8 w-8 text-slate-200 mx-auto mb-2" />
              <p className="text-xs text-slate-400">Brak nowych powiadomień</p>
            </div>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                className={cn(
                  "px-4 py-3 hover:bg-slate-50 transition-colors cursor-pointer border-b border-slate-50 last:border-0",
                  !n.read_at && "bg-indigo-50/30"
                )}
                onClick={() => handleMarkRead(n.id, n.read_at)}
              >
                <div className="flex gap-3 items-start">
                  <div className={cn("mt-0.5 p-1.5 rounded-full bg-white border shadow-sm", !n.read_at && "border-indigo-100 bg-indigo-50")}>
                    {getIcon(n.typ)}
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className={cn("text-xs text-slate-700 leading-snug", !n.read_at && "font-medium text-slate-900")}>
                      {getNotificationTitle(n)}
                    </p>
                    <p className="text-[10px] text-slate-400">
                      {n.created_at && formatDistanceToNow(new Date(n.created_at), { addSuffix: true, locale: pl })}
                    </p>
                  </div>
                  {!n.read_at && (
                    <div className="h-1.5 w-1.5 rounded-full bg-indigo-500 mt-2 shrink-0" />
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-2 border-t border-slate-100 bg-slate-50/30">
          <Link href="/app/notifications" onClick={() => setOpen(false)}>
            <Button variant="ghost" className="w-full h-8 text-xs font-medium text-slate-600 hover:text-indigo-600">
              Zobacz wszystkie
            </Button>
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  );
}
