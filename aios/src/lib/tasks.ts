/*
 * Tasks (Supabase) — the real, persisted Kanban board. `status` is the column
 * (todo | in-progress | review | done).
 */
import { getServerSupabase } from "./supabase";

export type TaskStatus = "todo" | "in-progress" | "review" | "done";
export type TaskPriority = "low" | "medium" | "high";

export type TaskRow = {
  id: string;
  title: string;
  agent: string | null;
  agent_accent: string | null;
  project: string | null;
  priority: TaskPriority;
  status: TaskStatus;
  source: string; // 'manual' | 'message' | 'schedule'
  created_at: string;
};

export async function listTasks(): Promise<TaskRow[]> {
  const sb = await getServerSupabase();
  if (!sb) return [];
  const { data, error } = await sb
    .from("aios_tasks")
    .select("*")
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as TaskRow[];
}

export async function createTask(input: {
  title: string;
  agent?: string | null;
  agent_accent?: string | null;
  project?: string | null;
  priority?: TaskPriority;
  status?: TaskStatus;
  source?: string;
}): Promise<TaskRow> {
  const sb = await getServerSupabase();
  if (!sb) throw new Error("Database not configured");
  const { data, error } = await sb
    .from("aios_tasks")
    .insert({
      title: input.title,
      agent: input.agent ?? null,
      agent_accent: input.agent_accent ?? null,
      project: input.project ?? null,
      priority: input.priority ?? "medium",
      status: input.status ?? "todo",
      source: input.source ?? "manual",
    })
    .select()
    .single();
  if (error) throw error;
  return data as TaskRow;
}

export async function updateTaskStatus(id: string, status: TaskStatus): Promise<void> {
  const sb = await getServerSupabase();
  if (!sb) throw new Error("Database not configured");
  const { error } = await sb.from("aios_tasks").update({ status }).eq("id", id);
  if (error) throw error;
}

export async function deleteTask(id: string): Promise<void> {
  const sb = await getServerSupabase();
  if (!sb) throw new Error("Database not configured");
  const { error } = await sb.from("aios_tasks").delete().eq("id", id);
  if (error) throw error;
}
