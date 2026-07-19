/* /api/tasks — the live Kanban board. GET list, POST create, PATCH move, DELETE. */
import { NextResponse } from "next/server";
import { supabaseConfigured } from "@/lib/supabase";
import {
  listTasks,
  createTask,
  updateTaskStatus,
  deleteTask,
  type TaskStatus,
  type TaskPriority,
} from "@/lib/tasks";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const STATUSES: TaskStatus[] = ["todo", "in-progress", "review", "done"];
const PRIORITIES: TaskPriority[] = ["low", "medium", "high"];

export async function GET() {
  if (!supabaseConfigured()) return NextResponse.json({ configured: false, items: [] });
  try {
    const items = await listTasks();
    return NextResponse.json({ configured: true, items });
  } catch (e) {
    console.error("[tasks GET]", e);
    return NextResponse.json({ configured: true, items: [], error: "Failed to load tasks." }, { status: 500 });
  }
}

export async function POST(req: Request) {
  if (!supabaseConfigured())
    return NextResponse.json({ error: "Database not configured." }, { status: 503 });
  let body: {
    title?: string;
    agent?: string;
    agent_accent?: string;
    project?: string;
    priority?: TaskPriority;
    status?: TaskStatus;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }
  const title = body.title?.trim();
  if (!title) return NextResponse.json({ error: "Title is required." }, { status: 400 });
  try {
    const item = await createTask({
      title: title.slice(0, 300),
      agent: body.agent?.trim() || null,
      agent_accent: body.agent_accent || null,
      project: body.project?.trim() || null,
      priority: PRIORITIES.includes(body.priority as TaskPriority) ? body.priority : "medium",
      status: STATUSES.includes(body.status as TaskStatus) ? body.status : "todo",
      source: "manual",
    });
    return NextResponse.json({ item });
  } catch (e) {
    console.error("[tasks POST]", e);
    return NextResponse.json({ error: "Failed to create task." }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  if (!supabaseConfigured())
    return NextResponse.json({ error: "Database not configured." }, { status: 503 });
  let body: { id?: string; status?: TaskStatus };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }
  const id = body.id?.trim();
  if (!id || !STATUSES.includes(body.status as TaskStatus))
    return NextResponse.json({ error: "id and a valid status are required." }, { status: 400 });
  try {
    await updateTaskStatus(id, body.status as TaskStatus);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[tasks PATCH]", e);
    return NextResponse.json({ error: "Failed to move task." }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  if (!supabaseConfigured())
    return NextResponse.json({ error: "Database not configured." }, { status: 503 });
  const id = new URL(req.url).searchParams.get("id")?.trim();
  if (!id) return NextResponse.json({ error: "id is required." }, { status: 400 });
  try {
    await deleteTask(id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[tasks DELETE]", e);
    return NextResponse.json({ error: "Failed to delete task." }, { status: 500 });
  }
}
