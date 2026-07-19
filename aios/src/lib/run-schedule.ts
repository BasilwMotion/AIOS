/*
 * Executes a scheduled agent job with an explicit Supabase client:
 * - "Run now" passes the logged-in user's client (authenticated → RLS ok).
 * - The cron passes the service client (no user session).
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import { getProvider } from "@/lib/llm";
import { buildAgentSystemPrompt } from "@/lib/llm/prompt";
import { getAgentRef, getEmployee } from "@/lib/placeholder-data";
import { listSharedMemory, listPrivateMemory, addSharedMemory } from "@/lib/memory";
import { getServiceSupabase } from "@/lib/supabase-service";
import { getSettings } from "@/lib/settings";
import {
  computeNextRun,
  createJobRun,
  finishJobRun,
  markScheduleRan,
  dueSchedules,
  type Schedule,
  type JobStatus,
} from "@/lib/schedules";

export async function runSchedule(
  schedule: Schedule,
  db: SupabaseClient,
): Promise<{ status: JobStatus; output: string }> {
  const run = await createJobRun(schedule.id, db);
  const next = computeNextRun(schedule.cadence, schedule.interval_minutes);

  try {
    const provider = getProvider();
    if (!provider) {
      const msg = "No LLM configured — run skipped.";
      await finishJobRun(run.id, "failed", msg, db);
      await markScheduleRan(schedule.id, next, db);
      return { status: "failed", output: msg };
    }

    const ref = getAgentRef(schedule.agent_id);
    const found = ref ? getEmployee(ref.deptSlug, schedule.agent_id) : undefined;
    let system = found
      ? buildAgentSystemPrompt(found.dept, found.employee)
      : "You are an AI agent working inside AIOS.";

    try {
      const [shared, priv] = await Promise.all([
        listSharedMemory(db),
        listPrivateMemory(schedule.agent_id, db),
      ]);
      if (shared.length)
        system +=
          "\n\nShared company memory:\n" +
          shared.map((m) => `- ${m.title ? m.title + ": " : ""}${m.content}`).join("\n");
      if (priv.length)
        system += "\n\nYour private memory:\n" + priv.map((m) => `- ${m.content}`).join("\n");
    } catch {
      /* memory optional */
    }

    system +=
      "\n\nThis is an automated scheduled run — the founder is not present. Complete the task concisely and report the result.";

    let out = "";
    for await (const chunk of provider.streamChat({
      system,
      messages: [{ role: "user", text: schedule.prompt }],
    })) {
      out += chunk;
    }
    out = out.trim() || "(no output)";

    await finishJobRun(run.id, "success", out, db);
    await markScheduleRan(schedule.id, next, db);

    try {
      await addSharedMemory(
        {
          title: `${schedule.name} — ${new Date().toLocaleDateString()}`,
          content: out.slice(0, 4000),
          tags: ["scheduled", schedule.agent_id],
          source: "summary",
          created_by: found?.employee.name ?? schedule.agent_id,
        },
        db,
      );
    } catch {
      /* non-fatal */
    }

    return { status: "success", output: out };
  } catch (e) {
    console.error("[runSchedule]", e);
    const msg = e instanceof Error ? e.message : "Run failed.";
    try {
      await finishJobRun(run.id, "failed", msg, db);
      await markScheduleRan(schedule.id, next, db);
    } catch {
      /* ignore */
    }
    return { status: "failed", output: msg };
  }
}

/** Cron entry point — uses the service client (no user session). */
export async function runDueSchedules(): Promise<{ ran: number; reason?: string }> {
  const db = getServiceSupabase();
  if (!db) return { ran: 0, reason: "no-service-key" };

  // "Run tasks overnight" toggle (Settings) gates the cron.
  const settings = await getSettings(db);
  if (!settings.run_overnight) return { ran: 0, reason: "paused" };

  const due = await dueSchedules(db);
  for (const s of due) {
    await runSchedule(s, db);
  }
  return { ran: due.length };
}
