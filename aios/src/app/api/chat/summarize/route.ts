/* POST /api/chat/summarize — summarize a conversation and file it into shared
 * company memory (source: "summary"). No-ops gracefully without an LLM or DB. */
import { NextResponse } from "next/server";
import { getEmployee } from "@/lib/placeholder-data";
import { getProvider } from "@/lib/llm";
import { summarizeConversation } from "@/lib/llm/summarize";
import { addSharedMemory } from "@/lib/memory";
import { supabaseConfigured } from "@/lib/supabase";
import type { ChatTurn } from "@/lib/llm/types";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const provider = getProvider();
  if (!provider) return NextResponse.json({ saved: false, reason: "no-llm" });
  if (!supabaseConfigured()) return NextResponse.json({ saved: false, reason: "no-db" });

  let body: { deptSlug?: string; employeeId?: string; messages?: ChatTurn[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const { deptSlug, employeeId, messages } = body;
  if (!deptSlug || !employeeId || !Array.isArray(messages)) {
    return NextResponse.json({ error: "Missing deptSlug, employeeId, or messages." }, { status: 400 });
  }

  const found = getEmployee(deptSlug, employeeId);
  if (!found) return NextResponse.json({ error: "Unknown agent." }, { status: 404 });

  const turns: ChatTurn[] = messages
    .filter((m) => m && (m.role === "user" || m.role === "assistant") && typeof m.text === "string")
    .slice(-40)
    .map((m) => ({ role: m.role, text: m.text.slice(0, 4000) }));

  if (turns.length < 4) return NextResponse.json({ saved: false, reason: "too-short" });

  try {
    const summary = await summarizeConversation(provider, found.employee.name, turns);
    if (!summary) return NextResponse.json({ saved: false, reason: "nothing-useful" });

    const entry = await addSharedMemory({
      title: `Summary: chat with ${found.employee.name}`,
      content: summary,
      tags: ["chat-summary", found.dept.slug],
      source: "summary",
      created_by: found.employee.name,
    });
    return NextResponse.json({ saved: true, entry });
  } catch (e) {
    console.error("[/api/chat/summarize]", e);
    return NextResponse.json({ saved: false, reason: "error" }, { status: 500 });
  }
}
