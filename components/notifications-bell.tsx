"use client";

import { useState } from "react";
import Link from "next/link";
import { Bell, Info, AlertCircle, CheckCircle, MessageSquare } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { pl } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import {
  getRecentNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from "@/app/app/notifications/_actions";
import { getNotificationTitle } from "@/app/app/notifications/utils";

interface Notification {
  id: string;
  typ: string;
  read_at: string | null;
  created_at: string;
  payload?: Record<string, unknown>;
}

type NotificationsBellProps = {
  unread: number;
  triggerClassName?: string;
  badgeClassName?: string;
};

export default function NotificationsBell({
  unread,
  triggerClassName,
  badgeClassName,
}: NotificationsBellProps) {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [cleared, setCleared] = useState(false);

  const handleOpenChange = async (nextOpen: boolean) => {
    setOpen(nextOpen);

    if (!nextOpen) {
      return;
    }

    setCleared(true);
    setLoading(true);

    try {
      const data = await getRecentNotifications(5);
      setNotifications(data);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAllRead = async () => {
    await markAllNotificationsRead();
    setNotifications((prev) =>
      prev.map((notification) => ({
        ...notification,
        read_at: new Date().toISOString(),
      }))
    );
  };

  const handleMarkRead = async (id: string, currentReadAt: string | null) => {
    if (currentReadAt) {
      return;
    }

    await markNotificationRead(id);
    setNotifications((prev) =>
      prev.map((notification) =>
        notification.id === id
          ? { ...notification, read_at: new Date().toISOString() }
          : notification
      )
    );
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "MESSAGE":
        return <MessageSquare className="h-4 w-4 text-blue-500" />;
      case "OFFER":
        return <AlertCircle className="h-4 w-4 text-orange-500" />;
      case "JOB_COMPLETED":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      default:
        return <Info className="h-4 w-4 text-slate-500" />;
    }
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "relative text-slate-500 hover:bg-indigo-50/50 hover:text-indigo-600",
            triggerClassName,
          )}
        >
          <Bell className="h-5 w-5" />
          {unread > 0 && !cleared && (
            <span
              className={cn(
                "absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-sm ring-2 ring-white",
                badgeClassName,
              )}
            >
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-80 overflow-hidden rounded-2xl border-slate-100 bg-white p-0 shadow-[0_24px_70px_-34px_rgba(7,20,47,0.75)]"
        align="end"
        sideOffset={12}
      >
        <div className="flex items-center justify-between border-b border-slate-100 bg-white px-4 py-3">
          <h4 className="text-sm font-black text-[#07142f]">Powiadomienia</h4>
          {unread > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="text-[10px] font-black text-indigo-600 hover:text-indigo-700"
            >
              Oznacz wszystkie
            </button>
          )}
        </div>

        <div className="max-h-[300px] overflow-y-auto py-1">
          {loading ? (
            <div className="space-y-1 p-2" aria-label="Ładowanie powiadomień">
              {[1, 2, 3].map((item) => (
                <div key={item} className="flex animate-pulse items-start gap-3 px-4 py-3">
                  <div className="h-7 w-7 shrink-0 rounded-full bg-slate-100" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 w-3/4 rounded bg-slate-100" />
                    <div className="h-2 w-1/3 rounded bg-slate-100" />
                  </div>
                </div>
              ))}
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center">
              <Bell className="mx-auto mb-2 h-8 w-8 text-slate-200" />
              <p className="text-xs text-slate-400">Brak nowych powiadomień</p>
            </div>
          ) : (
            notifications.map((notification) => (
              <div
                key={notification.id}
                className={cn(
                  "cursor-pointer border-b border-slate-50 px-4 py-3 transition-colors last:border-0 hover:bg-slate-50",
                  !notification.read_at && "bg-[#f0ffbd]/70"
                )}
                onClick={() =>
                  handleMarkRead(notification.id, notification.read_at)
                }
              >
                <div className="flex items-start gap-3">
                  <div
                    className={cn(
                      "mt-0.5 rounded-full border bg-white p-1.5 shadow-sm",
                      !notification.read_at && "border-lime-200 bg-white"
                    )}
                  >
                    {getIcon(notification.typ)}
                  </div>
                  <div className="flex-1 space-y-1">
                    <p
                      className={cn(
                        "text-xs leading-snug text-slate-700",
                        !notification.read_at && "font-black text-[#07142f]"
                      )}
                    >
                      {getNotificationTitle(notification)}
                    </p>
                    <p className="text-[10px] text-slate-400">
                      {notification.created_at &&
                        formatDistanceToNow(new Date(notification.created_at), {
                          addSuffix: true,
                          locale: pl,
                        })}
                    </p>
                  </div>
                  {!notification.read_at && (
                    <div className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#c5fb37]" />
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="border-t border-slate-100 bg-white p-2">
          <Link href="/app/notifications" onClick={() => setOpen(false)}>
            <Button
              variant="ghost"
              className="h-8 w-full text-xs font-black text-[#07142f] hover:text-indigo-600"
            >
              Zobacz wszystkie
            </Button>
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  );
}
