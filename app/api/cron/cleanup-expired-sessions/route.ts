import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
  }

  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = createAdminClient();
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const { data, error } = await supabase
      .from("payments")
      .update({ status: "expired" })
      .eq("status", "pending")
      .lt("created_at", cutoff)
      .select("id");

    if (error) {
      console.error("[cron:cleanup-expired-sessions] update error:", error.message);
      return NextResponse.json({ ok: false, error: "Nie udało sie wykonac zadania cyklicznego." }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      expiredCount: data?.length ?? 0,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[cron:cleanup-expired-sessions] unexpected error:", message);
    return NextResponse.json({ ok: false, error: "Nie udało sie wykonac zadania cyklicznego." }, { status: 500 });
  }
}
