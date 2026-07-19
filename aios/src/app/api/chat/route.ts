/* POST /api/chat — stream an agent's reply. GET /api/chat — connection status.
 * The API key lives only in server env (.env.local) and never reaches here as
 * input; the client sends which agent to talk to + the conversation so far. */
import { NextResponse } from "next/server";
import { getEmployee } from "@/lib/placeholder-data";
import { getProvider, getLLMStatus } from "@/lib/llm";
import { buildAgentSystemPrompt } from "@/lib/llm/prompt";
import { listSharedMemory, listPrivateMemory } from "@/lib/memory";
import type { ChatTurn } from "@/lib/llm/types";

export const runtime = "nodejs";

export function GET() {
  return NextResponse.json(getLLMStatus());
}

export async function POST(req: Request) {
  const provider = getProvider();
  if (!provider) {
    return NextResponse.json(
      { error: "No LLM provider configured. Add an API key to .env.local." },
      { status: 503 },
    );
  }

  let body: { deptSlug?: string; employeeId?: string; messages?: ChatTurn[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const { deptSlug, employeeId, messages } = body;
  if (!deptSlug || !employeeId || !Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json({ error: "Missing deptSlug, employeeId, or messages." }, { status: 400 });
  }

  const found = getEmployee(deptSlug, employeeId);
  if (!found) {
    return NextResponse.json({ error: "Unknown agent." }, { status: 404 });
  }

  // Sanitize/clamp the conversation before it reaches the model.
  const turns: ChatTurn[] = messages
    .filter((m) => m && (m.role === "user" || m.role === "assistant") && typeof m.text === "string")
    .slice(-20)
    .map((m) => ({ role: m.role, text: m.text.slice(0, 4000) }));

  if (turns.length === 0 || turns[turns.length - 1].role !== "user") {
    return NextResponse.json({ error: "Conversation must end with a user message." }, { status: 400 });
  }

  // Ground the agent in company + private memory (best-effort; DB optional).
  let system = buildAgentSystemPrompt(found.dept, found.employee);
  try {
    const [shared, priv] = await Promise.all([
      listSharedMemory(),
      listPrivateMemory(employeeId),
    ]);
    if (shared.length) {
      system +=
        "\n\nShared company memory (every agent can read this):\n" +
        shared.map((m) => `- ${m.title ? m.title + ": " : ""}${m.content}`).join("\n");
    }
    if (priv.length) {
      system +=
        "\n\nYour private memory (only you have this):\n" +
        priv.map((m) => `- ${m.content}`).join("\n");
    }
  } catch (e) {
    console.error("[/api/chat] memory load failed:", e);
  }

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const encoder = new TextEncoder();
      try {
        for await (const chunk of provider.streamChat({ system, messages: turns })) {
          controller.enqueue(encoder.encode(chunk));
        }
      } catch (err) {
        console.error("[/api/chat] provider error:", err);
        controller.enqueue(encoder.encode("\n\n[The agent could not respond — check the server logs and your API key.]"));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
