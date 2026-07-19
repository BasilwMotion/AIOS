/* /api/schedules — CRUD for scheduled agent jobs + recent run history. */
import { NextResponse } from "next/server";
import { supabaseConfigured } from "@/lib/supabase";
import {
  listSchedules,
  listRecentRuns,
  createSchedule,
  setScheduleEnabled,
  deleteSchedule,
  type Cadence,
} from "@/lib/schedules";
import { getAgentRef } from "@/lib/placeholder-data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CADENCES: Cadence[] = ["daily", "weekly", "custom"];

export async function GET() {
  if (!supabaseConfigured())
    return NextResponse.json({ configured: false, schedules: [], runs: [] });
  try {
    const [schedules, runs] = await Promise.all([listSchedules(), listRecentRuns(20)]);
    return NextResponse.json({ configured: true, schedules, runs });
  } catch (e) {
    console.error("[schedules GET]", e);
    return NextResponse.json({ configured: true, schedules: [], runs: [], error: "Failed to load." }, { status: 500 });
  }
}

export async function POST(req: Request) {
  if (!supabaseConfigured())
    return NextResponse.json({ error: "Database not configured." }, { status: 503 });
  let body: {
    name?: string;
    agentId?: string;
    cadence?: Cadence;
    intervalMinutes?: number;
    prompt?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const name = body.name?.trim();
  const agentId = body.agentId?.trim();
  const prompt = body.prompt?.trim();
  const cadence = CADENCES.includes(body.cadence as Cadence) ? (body.cadence as Cadence) : "daily";
  if (!name || !agentId || !prompt)
    return NextResponse.json({ error: "name, agentId and prompt are required." }, { status: 400 });
  if (!getAgentRef(agentId)) return NextResponse.json({ error: "Unknown agent." }, { status: 404 });

  try {
    const item = await createSchedule({
      name: name.slice(0, 120),
      agent_id: agentId,
      cadence,
      interval_minutes: cadence === "custom" ? Math.max(5, Number(body.intervalMinutes) || 60) : null,
      prompt: prompt.slice(0, 2000),
    });
    return NextResponse.json({ item });
  } catch (e) {
    console.error("[schedules POST]", e);
    return NextResponse.json({ error: "Failed to create schedule." }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  if (!supabaseConfigured())
    return NextResponse.json({ error: "Database not configured." }, { status: 503 });
  let body: { id?: string; enabled?: boolean };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }
  const id = body.id?.trim();
  if (!id || typeof body.enabled !== "boolean")
    return NextResponse.json({ error: "id and enabled are required." }, { status: 400 });
  try {
    await setScheduleEnabled(id, body.enabled);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[schedules PATCH]", e);
    return NextResponse.json({ error: "Failed to update." }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  if (!supabaseConfigured())
    return NextResponse.json({ error: "Database not configured." }, { status: 503 });
  const id = new URL(req.url).searchParams.get("id")?.trim();
  if (!id) return NextResponse.json({ error: "id is required." }, { status: 400 });
  try {
    await deleteSchedule(id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[schedules DELETE]", e);
    return NextResponse.json({ error: "Failed to delete." }, { status: 500 });
  }
}
