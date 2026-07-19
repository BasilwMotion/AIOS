/* /api/search?q= — search live tasks and shared memory. */
import { NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const q = new URL(req.url).searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) return NextResponse.json({ tasks: [], memory: [] });

  const sb = await getServerSupabase();
  if (!sb) return NextResponse.json({ tasks: [], memory: [] });

  const like = `%${q.replace(/[%_]/g, "")}%`;
  try {
    const [tasks, memory] = await Promise.all([
      sb
        .from("aios_tasks")
        .select("id, title, project, status")
        .or(`title.ilike.${like},project.ilike.${like}`)
        .limit(6),
      sb
        .from("aios_shared_memory")
        .select("id, title, content")
        .or(`title.ilike.${like},content.ilike.${like}`)
        .limit(6),
    ]);
    return NextResponse.json({ tasks: tasks.data ?? [], memory: memory.data ?? [] });
  } catch (e) {
    console.error("[search]", e);
    return NextResponse.json({ tasks: [], memory: [] }, { status: 500 });
  }
}
