"use client";

/*
 * Projects derived from real tasks: group tasks by their `project` field and
 * show progress (done / total). No fake data — reflects whatever's on the board.
 */
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/primitives";
import type { TaskRow } from "@/lib/tasks";

type Group = { name: string; total: number; done: number };

export function LiveProjects() {
  const [tasks, setTasks] = useState<TaskRow[]>([]);
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/tasks")
      .then((r) => r.json())
      .then((d) => {
        setConfigured(d.configured);
        setTasks(d.items ?? []);
      })
      .catch(() => setConfigured(false))
      .finally(() => setLoading(false));
  }, []);

  const groups = useMemo<Group[]>(() => {
    const map = new Map<string, Group>();
    for (const t of tasks) {
      const name = t.project?.trim() || "Unassigned";
      const g = map.get(name) ?? { name, total: 0, done: 0 };
      g.total += 1;
      if (t.status === "done") g.done += 1;
      map.set(name, g);
    }
    return [...map.values()].sort((a, b) => b.total - a.total);
  }, [tasks]);

  if (configured === false) {
    return (
      <Card className="px-5 py-12 text-center text-sm text-muted-2">
        Connect the database to see projects.
      </Card>
    );
  }

  if (!loading && groups.length === 0) {
    return (
      <Card className="px-5 py-12 text-center text-sm text-muted-2">
        No projects yet. Add tasks with a project name on the{" "}
        <Link href="/tasks" className="text-primary hover:underline">
          Tasks board
        </Link>{" "}
        and they&apos;ll show up here.
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {groups.map((g) => {
        const pct = g.total ? Math.round((g.done / g.total) * 100) : 0;
        return (
          <Card key={g.name} className="p-5">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-base font-semibold text-foreground">{g.name}</h2>
              <span className="text-xs text-muted-2">
                {g.done}/{g.total} done
              </span>
            </div>
            <div className="mt-4">
              <div className="mb-1.5 flex justify-between text-xs text-muted-2">
                <span>Progress</span>
                <span>{pct}%</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-surface-2">
                <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
              </div>
            </div>
            <div className="mt-4 border-t border-border pt-3 text-xs text-muted">
              {g.total} task{g.total === 1 ? "" : "s"}
            </div>
          </Card>
        );
      })}
    </div>
  );
}
