/* Live company stats from the database — powers the Analytics page. */
import { getServerSupabase } from "./supabase";

export type Stats = {
  tasks: { total: number; byStatus: Record<string, number> };
  messages: number;
  sharedMemory: number;
  schedules: number;
  runs: number;
};

const STATUSES = ["todo", "in-progress", "review", "done"];

export async function getStats(): Promise<Stats | null> {
  const sb = await getServerSupabase();
  if (!sb) return null;

  const byStatus: Record<string, number> = {};
  let total = 0;
  for (const s of STATUSES) {
    const { count } = await sb
      .from("aios_tasks")
      .select("*", { count: "exact", head: true })
      .eq("status", s);
    byStatus[s] = count ?? 0;
    total += count ?? 0;
  }

  const one = async (table: string) =>
    (await sb.from(table).select("*", { count: "exact", head: true })).count ?? 0;

  const [messages, sharedMemory, schedules, runs] = await Promise.all([
    one("aios_messages"),
    one("aios_shared_memory"),
    one("aios_schedules"),
    one("aios_job_runs"),
  ]);

  return { tasks: { total, byStatus }, messages, sharedMemory, schedules, runs };
}
