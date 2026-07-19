"use client";

/*
 * Automation console: schedule agents to run on a cadence, run them on demand,
 * toggle/delete them, and view execution history. Backed by /api/schedules
 * (Supabase) and /api/schedules/run. Real recurring runs fire via Vercel Cron.
 */
import { useEffect, useMemo, useState } from "react";
import { Card, Badge } from "@/components/ui/primitives";
import { allAgents } from "@/lib/placeholder-data";
import type { Schedule, JobRun, Cadence } from "@/lib/schedules";

const statusStyle: Record<string, string> = {
  running: "bg-primary/15 text-primary",
  success: "bg-success/15 text-success",
  failed: "bg-danger/15 text-danger",
};

function fmt(iso: string | null) {
  return iso ? new Date(iso).toLocaleString() : "—";
}

export function AutomationManager() {
  const agents = useMemo(() => allAgents(), []);
  const agentName = (id: string) => agents.find((a) => a.id === id)?.name ?? id;

  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [runs, setRuns] = useState<JobRun[]>([]);
  const [configured, setConfigured] = useState<boolean | null>(null);

  const [name, setName] = useState("");
  const [agentId, setAgentId] = useState(agents[0]?.id ?? "");
  const [cadence, setCadence] = useState<Cadence>("daily");
  const [interval, setIntervalMin] = useState(60);
  const [prompt, setPrompt] = useState("");
  const [busy, setBusy] = useState(false);
  const [running, setRunning] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    try {
      const res = await fetch("/api/schedules");
      const data = await res.json();
      setConfigured(data.configured);
      setSchedules(data.schedules ?? []);
      setRuns(data.runs ?? []);
    } catch {
      setConfigured(false);
    }
  }
  useEffect(() => {
    load();
  }, []);

  const scheduleName = (id: string) => schedules.find((s) => s.id === id)?.name ?? "Schedule";

  async function create() {
    if (!name.trim() || !prompt.trim() || !agentId || busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/schedules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          agentId,
          cadence,
          intervalMinutes: cadence === "custom" ? interval : undefined,
          prompt,
        }),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => null))?.error ?? "Failed to create.");
      setName("");
      setPrompt("");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create.");
    } finally {
      setBusy(false);
    }
  }

  async function toggle(id: string, enabled: boolean) {
    setSchedules((xs) => xs.map((s) => (s.id === id ? { ...s, enabled } : s)));
    await fetch("/api/schedules", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, enabled }),
    }).catch(() => {});
  }

  async function remove(id: string) {
    setSchedules((xs) => xs.filter((s) => s.id !== id));
    await fetch(`/api/schedules?id=${encodeURIComponent(id)}`, { method: "DELETE" }).catch(() => {});
    load();
  }

  async function runNow(id: string) {
    setRunning(id);
    setError(null);
    try {
      await fetch("/api/schedules/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
    } catch {
      /* result shows in history */
    } finally {
      setRunning(null);
      await load();
    }
  }

  if (configured === false) {
    return (
      <Card className="px-5 py-12 text-center text-sm text-muted-2">
        Connect the database (SUPABASE_URL + SUPABASE_PUBLISHABLE_KEY) to use automation.
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Create */}
      <Card className="p-5">
        <h2 className="mb-4 text-sm font-semibold tracking-wide text-muted uppercase">
          New schedule
        </h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Schedule name (e.g. Nightly standup)"
            className="rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-foreground placeholder:text-muted-2 focus:border-primary focus:outline-none"
          />
          <select
            value={agentId}
            onChange={(e) => setAgentId(e.target.value)}
            className="rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
          >
            {agents.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name} · {a.deptName}
              </option>
            ))}
          </select>
          <select
            value={cadence}
            onChange={(e) => setCadence(e.target.value as Cadence)}
            className="rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="custom">Custom interval</option>
          </select>
          {cadence === "custom" ? (
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={5}
                value={interval}
                onChange={(e) => setIntervalMin(Number(e.target.value))}
                className="w-24 rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
              />
              <span className="text-xs text-muted-2">minutes between runs</span>
            </div>
          ) : (
            <div />
          )}
        </div>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="What should this agent do each run? (e.g. Summarize open tasks and flag blockers.)"
          rows={2}
          className="mt-3 w-full resize-y rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-foreground placeholder:text-muted-2 focus:border-primary focus:outline-none"
        />
        <div className="mt-3 flex items-center justify-between">
          {error ? (
            <span className="text-xs text-danger">{error}</span>
          ) : (
            <span className="text-xs text-muted-2">
              Recurring runs fire via Vercel Cron (once daily on the Hobby plan). Use “Run now” to test.
            </span>
          )}
          <button
            onClick={create}
            disabled={busy || !name.trim() || !prompt.trim()}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy ? "Creating…" : "Create schedule"}
          </button>
        </div>
      </Card>

      {/* Schedules */}
      <div>
        <h2 className="mb-3 text-sm font-semibold tracking-wide text-muted uppercase">
          Scheduled jobs
        </h2>
        {schedules.length === 0 ? (
          <Card className="px-5 py-8 text-center text-sm text-muted-2">No schedules yet.</Card>
        ) : (
          <div className="space-y-3">
            {schedules.map((s) => (
              <Card key={s.id} className="p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-foreground">{s.name}</span>
                      <Badge>{agentName(s.agent_id)}</Badge>
                      <span className="text-xs text-muted-2 capitalize">
                        {s.cadence}
                        {s.cadence === "custom" && s.interval_minutes
                          ? ` · ${s.interval_minutes}m`
                          : ""}
                      </span>
                    </div>
                    <p className="mt-1 line-clamp-2 text-sm text-muted">{s.prompt}</p>
                    <div className="mt-1 text-xs text-muted-2">
                      Next: {fmt(s.next_run_at)} · Last: {fmt(s.last_run_at)}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => runNow(s.id)}
                      disabled={running === s.id}
                      className="rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-surface-2 disabled:opacity-50"
                    >
                      {running === s.id ? "Running…" : "Run now"}
                    </button>
                    <button
                      onClick={() => toggle(s.id, !s.enabled)}
                      className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                        s.enabled
                          ? "bg-success/15 text-success"
                          : "border border-border bg-surface text-muted-2"
                      }`}
                    >
                      {s.enabled ? "Enabled" : "Paused"}
                    </button>
                    <button
                      onClick={() => remove(s.id)}
                      className="rounded-lg border border-border bg-surface px-2.5 py-1.5 text-xs text-muted-2 transition-colors hover:text-danger"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* History */}
      <div>
        <h2 className="mb-3 text-sm font-semibold tracking-wide text-muted uppercase">
          Execution history
        </h2>
        {runs.length === 0 ? (
          <Card className="px-5 py-8 text-center text-sm text-muted-2">
            No runs yet — create a schedule and hit “Run now”.
          </Card>
        ) : (
          <Card className="divide-y divide-border">
            {runs.map((r) => (
              <div key={r.id} className="px-5 py-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-foreground">{scheduleName(r.schedule_id)}</span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${statusStyle[r.status] ?? "bg-surface-2 text-muted"}`}
                  >
                    {r.status}
                  </span>
                  <span className="ml-auto text-xs text-muted-2">{fmt(r.started_at)}</span>
                </div>
                {r.output && <p className="mt-1 line-clamp-3 text-sm text-muted">{r.output}</p>}
              </div>
            ))}
          </Card>
        )}
      </div>
    </div>
  );
}
