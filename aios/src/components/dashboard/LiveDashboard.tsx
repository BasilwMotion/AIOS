"use client";

/*
 * Live company overview: real KPIs (/api/stats), recent tasks (/api/tasks),
 * and the team roster (org structure). No fake numbers.
 */
import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, Avatar, PresenceDot } from "@/components/ui/primitives";
import { departments, kanbanColumns } from "@/lib/placeholder-data";
import type { Stats } from "@/lib/stats";
import type { TaskRow } from "@/lib/tasks";

const team = departments.flatMap((d) =>
  d.members.map((m) => ({ ...m, deptSlug: d.slug })),
);

const colLabel = (id: string) => kanbanColumns.find((c) => c.id === id)?.label ?? id;

export function LiveDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [tasks, setTasks] = useState<TaskRow[]>([]);
  const [configured, setConfigured] = useState<boolean | null>(null);

  useEffect(() => {
    fetch("/api/stats")
      .then((r) => r.json())
      .then((d) => {
        setConfigured(d.configured);
        setStats(d.stats ?? null);
      })
      .catch(() => setConfigured(false));
    fetch("/api/tasks")
      .then((r) => r.json())
      .then((d) => setTasks(d.items ?? []))
      .catch(() => {});
  }, []);

  const tiles = [
    { label: "Open tasks", value: stats ? stats.tasks.total - (stats.tasks.byStatus.done ?? 0) : "…" },
    { label: "In progress", value: stats ? stats.tasks.byStatus["in-progress"] ?? 0 : "…" },
    { label: "Messages", value: stats ? stats.messages : "…" },
    { label: "Memory entries", value: stats ? stats.sharedMemory : "…" },
  ];

  const recent = [...tasks].slice(-6).reverse();

  return (
    <div className="space-y-6">
      {configured === false && (
        <Card className="px-5 py-4 text-sm text-muted-2">
          Connect the database (SUPABASE keys) to see live company data.
        </Card>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {tiles.map((t) => (
          <Card key={t.label} className="p-5">
            <div className="text-sm text-muted">{t.label}</div>
            <div className="mt-2 text-2xl font-semibold text-foreground">{t.value}</div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Recent tasks */}
        <div className="lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold tracking-wide text-muted uppercase">Recent tasks</h2>
            <Link href="/tasks" className="text-xs font-medium text-primary hover:underline">
              Open board
            </Link>
          </div>
          {recent.length === 0 ? (
            <Card className="px-5 py-8 text-center text-sm text-muted-2">
              No tasks yet — add some on the board.
            </Card>
          ) : (
            <Card className="divide-y divide-border">
              {recent.map((t) => (
                <div key={t.id} className="flex items-center gap-4 px-5 py-3.5">
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium text-foreground">{t.title}</div>
                    <div className="mt-0.5 text-xs text-muted-2">
                      {t.agent ?? "Unassigned"}
                      {t.project ? ` · ${t.project}` : ""}
                    </div>
                  </div>
                  <span className="rounded-full bg-surface-2 px-2.5 py-0.5 text-xs font-medium text-muted">
                    {colLabel(t.status)}
                  </span>
                </div>
              ))}
            </Card>
          )}
        </div>

        {/* Team */}
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold tracking-wide text-muted uppercase">Team</h2>
            <Link href="/teams" className="text-xs font-medium text-primary hover:underline">
              All teams
            </Link>
          </div>
          <Card className="p-4">
            <ul className="space-y-3">
              {team.slice(0, 8).map((m) => (
                <li key={m.id}>
                  <Link
                    href={`/teams/${m.deptSlug}/${m.id}`}
                    className="flex items-center gap-3 rounded-lg px-1 py-1 transition-colors hover:bg-surface-2"
                  >
                    <Avatar name={m.name} color={m.accent} size={30} />
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium text-foreground">{m.name}</div>
                      <div className="text-xs text-muted-2">{m.role}</div>
                    </div>
                    <span className="ml-auto">
                      <PresenceDot status={m.status} />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}
