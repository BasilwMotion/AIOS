/* /api/notifications — recent unread messages + recent scheduled-job runs. */
import { NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const sb = await getServerSupabase();
  if (!sb) return NextResponse.json({ unreadMessages: [], runs: [], count: 0 });

  try {
    const [msgs, runs] = await Promise.all([
      sb
        .from("aios_messages")
        .select("id, from_agent, to_agent, body, created_at")
        .eq("read", false)
        .order("created_at", { ascending: false })
        .limit(8),
      sb
        .from("aios_job_runs")
        .select("id, schedule_id, status, started_at")
        .order("started_at", { ascending: false })
        .limit(5),
    ]);
    const unreadMessages = msgs.data ?? [];
    return NextResponse.json({
      unreadMessages,
      runs: runs.data ?? [],
      count: unreadMessages.length,
    });
  } catch (e) {
    console.error("[notifications]", e);
    return NextResponse.json({ unreadMessages: [], runs: [], count: 0 }, { status: 500 });
  }
}
