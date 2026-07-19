/*
 * Automation: scheduled agent jobs and execution history (Supabase).
 * Runner functions (used by cron, which has no user session) accept a service
 * client via `db`; user-facing functions use the logged-in-user client.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import { getServerSupabase } from "./supabase";

export type Cadence = "daily" | "weekly" | "custom";
export type JobStatus = "running" | "success" | "failed";

export type Schedule = {
  id: string;
  name: string;
  agent_id: string;
  cadence: Cadence;
  interval_minutes: number | null;
  prompt: string;
  enabled: boolean;
  last_run_at: string | null;
  next_run_at: string;
  created_at: string;
};

export type JobRun = {
  id: string;
  schedule_id: string;
  status: JobStatus;
  output: string | null;
  started_at: string;
  finished_at: string | null;
};

export function computeNextRun(
  cadence: Cadence,
  intervalMinutes: number | null,
  from: Date = new Date(),
): string {
  const d = new Date(from);
  if (cadence === "daily") d.setDate(d.getDate() + 1);
  else if (cadence === "weekly") d.setDate(d.getDate() + 7);
  else d.setMinutes(d.getMinutes() + (intervalMinutes && intervalMinutes > 0 ? intervalMinutes : 60));
  return d.toISOString();
}

export async function listSchedules(): Promise<Schedule[]> {
  const sb = await getServerSupabase();
  if (!sb) return [];
  const { data, error } = await sb
    .from("aios_schedules")
    .select("*")
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as Schedule[];
}

export async function getSchedule(id: string): Promise<Schedule | null> {
  const sb = await getServerSupabase();
  if (!sb) return null;
  const { data, error } = await sb.from("aios_schedules").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return (data as Schedule) ?? null;
}

export async function createSchedule(input: {
  name: string;
  agent_id: string;
  cadence: Cadence;
  interval_minutes?: number | null;
  prompt: string;
}): Promise<Schedule> {
  const sb = await getServerSupabase();
  if (!sb) throw new Error("Database not configured");
  const { data, error } = await sb
    .from("aios_schedules")
    .insert({
      name: input.name,
      agent_id: input.agent_id,
      cadence: input.cadence,
      interval_minutes: input.cadence === "custom" ? (input.interval_minutes ?? 60) : null,
      prompt: input.prompt,
      enabled: true,
      next_run_at: computeNextRun(input.cadence, input.interval_minutes ?? null),
    })
    .select()
    .single();
  if (error) throw error;
  return data as Schedule;
}

export async function setScheduleEnabled(id: string, enabled: boolean): Promise<void> {
  const sb = await getServerSupabase();
  if (!sb) throw new Error("Database not configured");
  const { error } = await sb.from("aios_schedules").update({ enabled }).eq("id", id);
  if (error) throw error;
}

export async function deleteSchedule(id: string): Promise<void> {
  const sb = await getServerSupabase();
  if (!sb) throw new Error("Database not configured");
  const { error } = await sb.from("aios_schedules").delete().eq("id", id);
  if (error) throw error;
}

export async function listRecentRuns(limit = 20): Promise<JobRun[]> {
  const sb = await getServerSupabase();
  if (!sb) return [];
  const { data, error } = await sb
    .from("aios_job_runs")
    .select("*")
    .order("started_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as JobRun[];
}

/* --- Runner functions (accept a service client for the cron context) --- */

export async function dueSchedules(db?: SupabaseClient): Promise<Schedule[]> {
  const sb = db ?? (await getServerSupabase());
  if (!sb) return [];
  const { data, error } = await sb
    .from("aios_schedules")
    .select("*")
    .eq("enabled", true)
    .lte("next_run_at", new Date().toISOString());
  if (error) throw error;
  return (data ?? []) as Schedule[];
}

export async function createJobRun(scheduleId: string, db?: SupabaseClient): Promise<JobRun> {
  const sb = db ?? (await getServerSupabase());
  if (!sb) throw new Error("Database not configured");
  const { data, error } = await sb
    .from("aios_job_runs")
    .insert({ schedule_id: scheduleId, status: "running" })
    .select()
    .single();
  if (error) throw error;
  return data as JobRun;
}

export async function finishJobRun(
  id: string,
  status: JobStatus,
  output: string | null,
  db?: SupabaseClient,
): Promise<void> {
  const sb = db ?? (await getServerSupabase());
  if (!sb) throw new Error("Database not configured");
  const { error } = await sb
    .from("aios_job_runs")
    .update({ status, output, finished_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}

export async function markScheduleRan(id: string, next: string, db?: SupabaseClient): Promise<void> {
  const sb = db ?? (await getServerSupabase());
  if (!sb) throw new Error("Database not configured");
  const { error } = await sb
    .from("aios_schedules")
    .update({ last_run_at: new Date().toISOString(), next_run_at: next })
    .eq("id", id);
  if (error) throw error;
}
