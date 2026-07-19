/* POST /api/schedules/run — run one schedule immediately (the "Run now" button). */
import { NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase";
import { getSchedule } from "@/lib/schedules";
import { runSchedule } from "@/lib/run-schedule";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: Request) {
  const db = await getServerSupabase();
  if (!db) return NextResponse.json({ error: "Database not configured." }, { status: 503 });
  const body = await req.json().catch(() => null);
  const id = body?.id?.trim();
  if (!id) return NextResponse.json({ error: "id is required." }, { status: 400 });

  const schedule = await getSchedule(id);
  if (!schedule) return NextResponse.json({ error: "Schedule not found." }, { status: 404 });

  // Run as the logged-in user (authenticated) — works without a service key.
  const result = await runSchedule(schedule, db);
  return NextResponse.json(result);
}
