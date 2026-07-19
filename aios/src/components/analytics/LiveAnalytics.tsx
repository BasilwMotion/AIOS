"use client";

/* Live analytics from the database (/api/stats): KPI tiles + tasks-by-column. */
import { useEffect, useState } from "react";
import { Card, StatTile } from "@/components/ui/primitives";
import { kanbanColumns } from "@/lib/placeholder-data";
import type { Stats } from "@/lib/stats";

export function LiveAnalytics() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [configured, setConfigured] = useState<boolean | null>(null);

  useEffect(() => {
    fetch("/api/stats")
      .then((r) => r.json())
      .then((d) => {
        setConfigured(d.configured);
        setStats(d.stats ?? null);
      })
      .catch(() => setConfigured(false));
  }, []);

  if (configured === false) {
    return (
      <Card className="px-5 py-12 text-center text-sm text-muted-2">
        Connect the database (SUPABASE_URL + SUPABASE_PUBLISHABLE_KEY) for live analytics.
      </Card>
    );
  }

  const tiles = [
    { label: "Tasks", value: stats ? String(stats.tasks.total) : "…" },
    { label: "Messages", value: stats ? String(stats.messages) : "…" },
    { label: "Memory entries", value: stats ? String(stats.sharedMemory) : "…" },
    { label: "Scheduled jobs", value: stats ? String(stats.schedules) : "…" },
  ];

  const max = stats ? Math.max(1, ...Object.values(stats.tasks.byStatus)) : 1;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {tiles.map((t) => (
          <StatTile key={t.label} label={t.label} value={t.value} delta="live" trend="up" />
        ))}
      </div>

      <div>
        <h2 className="mb-4 text-sm font-semibold tracking-wide text-muted uppercase">
          Tasks by column
        </h2>
        <Card className="p-6">
          <div className="flex h-48 items-end gap-4">
            {kanbanColumns.map((c) => {
              const v = stats?.tasks.byStatus[c.id] ?? 0;
              return (
                <div key={c.id} className="flex flex-1 flex-col items-center gap-2">
                  <div className="flex w-full flex-1 items-end">
                    <div
                      className="w-full rounded-t-md transition-all"
                      style={{ height: `${(v / max) * 100}%`, backgroundColor: c.accent, minHeight: v > 0 ? 6 : 0 }}
                      title={`${v} tasks`}
                    />
                  </div>
                  <span className="text-lg font-semibold text-foreground">{v}</span>
                  <span className="text-[11px] text-muted-2">{c.label}</span>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
}
