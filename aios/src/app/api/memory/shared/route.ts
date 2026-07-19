/* /api/memory/shared — company memory every agent can read. */
import { NextResponse } from "next/server";
import { supabaseConfigured } from "@/lib/supabase";
import { listSharedMemory, addSharedMemory } from "@/lib/memory";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  if (!supabaseConfigured()) return NextResponse.json({ configured: false, items: [] });
  try {
    const items = await listSharedMemory();
    return NextResponse.json({ configured: true, items });
  } catch (e) {
    console.error("[memory/shared GET]", e);
    return NextResponse.json({ configured: true, items: [], error: "Failed to load memory." }, { status: 500 });
  }
}

export async function POST(req: Request) {
  if (!supabaseConfigured())
    return NextResponse.json({ error: "Database not configured." }, { status: 503 });

  let body: { title?: string; content?: string; tags?: string[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const content = body.content?.trim();
  if (!content) return NextResponse.json({ error: "Content is required." }, { status: 400 });

  try {
    const item = await addSharedMemory({
      title: body.title?.trim() || null,
      content: content.slice(0, 4000),
      tags: Array.isArray(body.tags) ? body.tags.slice(0, 10) : [],
    });
    return NextResponse.json({ item });
  } catch (e) {
    console.error("[memory/shared POST]", e);
    return NextResponse.json({ error: "Failed to save." }, { status: 500 });
  }
}
