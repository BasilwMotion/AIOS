/* /api/messages — agent inbox (GET), send (POST), mark read (PATCH). */
import { NextResponse } from "next/server";
import { supabaseConfigured } from "@/lib/supabase";
import { listInbox, sendMessage, markRead } from "@/lib/messages";
import { getAgentRef } from "@/lib/placeholder-data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const agentId = new URL(req.url).searchParams.get("agentId")?.trim();
  if (!agentId) return NextResponse.json({ error: "agentId is required." }, { status: 400 });
  if (!supabaseConfigured()) return NextResponse.json({ configured: false, items: [] });
  try {
    const items = await listInbox(agentId);
    return NextResponse.json({ configured: true, items });
  } catch (e) {
    console.error("[messages GET]", e);
    return NextResponse.json({ configured: true, items: [], error: "Failed to load inbox." }, { status: 500 });
  }
}

export async function POST(req: Request) {
  if (!supabaseConfigured())
    return NextResponse.json({ error: "Database not configured." }, { status: 503 });

  let body: { fromAgentId?: string; toAgentId?: string; body?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const from = body.fromAgentId?.trim();
  const to = body.toAgentId?.trim();
  const text = body.body?.trim();
  if (!from || !to || !text)
    return NextResponse.json({ error: "fromAgentId, toAgentId and body are required." }, { status: 400 });
  if (from === to)
    return NextResponse.json({ error: "An agent can't message itself." }, { status: 400 });
  if (!getAgentRef(from) || !getAgentRef(to))
    return NextResponse.json({ error: "Unknown agent." }, { status: 404 });

  try {
    const item = await sendMessage(from, to, text.slice(0, 4000));
    return NextResponse.json({ item });
  } catch (e) {
    console.error("[messages POST]", e);
    return NextResponse.json({ error: "Failed to send." }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  if (!supabaseConfigured())
    return NextResponse.json({ error: "Database not configured." }, { status: 503 });
  let body: { id?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }
  const id = body.id?.trim();
  if (!id) return NextResponse.json({ error: "id is required." }, { status: 400 });
  try {
    await markRead(id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[messages PATCH]", e);
    return NextResponse.json({ error: "Failed to update." }, { status: 500 });
  }
}
