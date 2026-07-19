/* /api/memory/private — memory scoped to a single agent. */
import { NextResponse } from "next/server";
import { supabaseConfigured } from "@/lib/supabase";
import { listPrivateMemory, addPrivateMemory } from "@/lib/memory";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const agentId = new URL(req.url).searchParams.get("agentId")?.trim();
  if (!agentId) return NextResponse.json({ error: "agentId is required." }, { status: 400 });
  if (!supabaseConfigured()) return NextResponse.json({ configured: false, items: [] });
  try {
    const items = await listPrivateMemory(agentId);
    return NextResponse.json({ configured: true, items });
  } catch (e) {
    console.error("[memory/private GET]", e);
    return NextResponse.json({ configured: true, items: [], error: "Failed to load memory." }, { status: 500 });
  }
}

export async function POST(req: Request) {
  if (!supabaseConfigured())
    return NextResponse.json({ error: "Database not configured." }, { status: 503 });

  let body: { agentId?: string; content?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const agentId = body.agentId?.trim();
  const content = body.content?.trim();
  if (!agentId || !content)
    return NextResponse.json({ error: "agentId and content are required." }, { status: 400 });

  try {
    const item = await addPrivateMemory(agentId, content.slice(0, 4000));
    return NextResponse.json({ item });
  } catch (e) {
    console.error("[memory/private POST]", e);
    return NextResponse.json({ error: "Failed to save." }, { status: 500 });
  }
}
