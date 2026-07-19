/* POST /api/tasks/from-message — turn an inbox message into a Kanban task,
 * assigned to the recipient, and link the message back to the new task. */
import { NextResponse } from "next/server";
import { supabaseConfigured } from "@/lib/supabase";
import { getMessage, setMessageTask } from "@/lib/messages";
import { createTask } from "@/lib/tasks";
import { getAgentRef } from "@/lib/placeholder-data";

export const runtime = "nodejs";

export async function POST(req: Request) {
  if (!supabaseConfigured())
    return NextResponse.json({ error: "Database not configured." }, { status: 503 });

  let body: { messageId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const messageId = body.messageId?.trim();
  if (!messageId) return NextResponse.json({ error: "messageId is required." }, { status: 400 });

  try {
    const msg = await getMessage(messageId);
    if (!msg) return NextResponse.json({ error: "Message not found." }, { status: 404 });
    if (msg.task_id)
      return NextResponse.json({ error: "Already converted to a task." }, { status: 409 });

    // The recipient received the request, so they own the resulting task.
    const assignee = getAgentRef(msg.to_agent);
    const title = msg.body.length > 120 ? msg.body.slice(0, 117) + "…" : msg.body;

    const task = await createTask({
      title,
      agent: assignee?.name ?? null,
      agent_accent: assignee?.accent ?? null,
      project: "Inbox",
      priority: "medium",
      status: "todo",
      source: "message",
    });

    await setMessageTask(msg.id, task.id);
    return NextResponse.json({ task, taskId: task.id });
  } catch (e) {
    console.error("[tasks/from-message]", e);
    return NextResponse.json({ error: "Failed to create task." }, { status: 500 });
  }
}
