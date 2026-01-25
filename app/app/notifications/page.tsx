import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Bell, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { markAllNotificationsRead } from "./_actions";
import NotificationList from "./NotificationList";

export const dynamic = "force-dynamic";

export default async function NotificationCenterPage() {
  const supabase = await createClient();
  const { data: userRaw } = await supabase.auth.getUser();
  const user = userRaw.user;

  if (!user) redirect("/auth");

  // Fetch all notifications
  const { data: notifications } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(100);

  const list = notifications || [];
  const unreadCount = list.filter((n) => !n.read_at).length;

  return (
    <div className="space-y-8 pb-20 container max-w-4xl mx-auto px-4 md:px-0 pt-6">
      {/* PREMIUM HEADER BANNER */}
      <div className="relative overflow-hidden rounded-[2.5rem] bg-slate-900 px-8 py-12 text-white shadow-2xl">
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none"></div>
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-purple-500/50 to-transparent" />
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-purple-500/10 rounded-full blur-[100px]" />
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-indigo-500/10 rounded-full blur-[80px]" />

        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="text-center md:text-left space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/10 text-indigo-100 text-[10px] font-black uppercase tracking-widest backdrop-blur-md">
              <Bell className="h-3 w-3" /> Powiadomienia
            </div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight leading-none bg-gradient-to-r from-white via-indigo-100 to-indigo-300 bg-clip-text text-transparent">
              Centrum Powiadomień
            </h1>
            <p className="text-indigo-100/70 text-base font-medium max-w-lg">
              Bądź na bieżąco ze statusami zleceń i nowymi wiadomościami.
            </p>
          </div>

          {unreadCount > 0 && (
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
              <form action={markAllNotificationsRead}>
                <Button className="relative bg-white text-slate-900 hover:bg-slate-50 border-none font-bold rounded-xl h-12 shadow-xl">
                  <CheckCheck className="mr-2 h-4 w-4 text-indigo-600" />
                  Oznacz wszystkie jako przeczytane
                </Button>
              </form>
            </div>
          )}
        </div>
      </div>

      {/* FILTERABLE LIST */}
      <NotificationList notifications={list} />
    </div>
  );
}
