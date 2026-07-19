/* GET /api/cron — invoked by Vercel Cron. Runs every schedule whose next_run_at
 * is due. Protected by CRON_SECRET when that env var is set. */
import { NextResponse } from "next/server";
import { supabaseConfigured } from "@/lib/supabase";
import { runDueSchedules } from "@/lib/run-schedule";

export const runtime = "nodejs";
export const maxDuration = 60;
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  // Vercel Cron sends `Authorization: Bearer <CRON_SECRET>` when CRON_SECRET is set.
  const secret = process.env.CRON_SECRET?.trim();
  if (secret) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  if (!supabaseConfigured()) return NextResponse.json({ ran: 0, reason: "no-db" });

  try {
    const result = await runDueSchedules();
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    console.error("[/api/cron]", e);
    return NextResponse.json({ ok: false, error: "Cron run failed." }, { status: 500 });
  }
}
