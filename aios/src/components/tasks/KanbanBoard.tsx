"use client";

/*
 * Live Kanban board backed by Supabase (/api/tasks).
 * Fully interactive: create tasks, drag between columns (persists the move),
 * and delete. Native HTML5 drag-and-drop, no external DnD library.
 */
import { useEffect, useState } from "react";
import { Avatar, Badge } from "@/components/ui/primitives";
import { kanbanColumns, priorityStyles } from "@/lib/placeholder-data";
import type { TaskRow, TaskStatus, TaskPriority } from "@/lib/tasks";

export function KanbanBoard() {
  const [tasks, setTasks] = useState<TaskRow[]>([]);
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [overCol, setOverCol] = useState<TaskStatus | null>(null);

  // New-task form
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState<TaskPriority>("medium");
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    try {
      const res = await fetch("/api/tasks");
      const data = await res.json();
      setConfigured(data.configured);
      setTasks(data.items ?? []);
    } catch {
      setConfigured(false);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    load();
  }, []);

  async function moveTask(id: string, status: TaskStatus) {
    const prev = tasks;
    setTasks((xs) => xs.map((t) => (t.id === id ? { ...t, status } : t)));
    try {
      const res = await fetch("/api/tasks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      if (!res.ok) throw new Error();
    } catch {
      setTasks(prev); // revert on failure
    }
  }

  async function addTask() {
    const t = title.trim();
    if (!t || adding) return;
    setAdding(true);
    setError(null);
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: t, priority, status: "todo" }),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => null))?.error ?? "Failed to add.");
      setTitle("");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to add.");
    } finally {
      setAdding(false);
    }
  }

  async function removeTask(id: string) {
    const prev = tasks;
    setTasks((xs) => xs.filter((t) => t.id !== id));
    try {
      const res = await fetch(`/api/tasks?id=${encodeURIComponent(id)}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
    } catch {
      setTasks(prev);
    }
  }

  if (configured === false) {
    return (
      <div className="rounded-card border border-dashed border-border px-5 py-12 text-center text-sm text-muted-2">
        Connect the database (SUPABASE_URL + SUPABASE_PUBLISHABLE_KEY) to use the live board.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Quick add */}
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") addTask();
          }}
          placeholder="New task title…"
          className="flex-1 rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted-2 focus:border-primary focus:outline-none"
        />
        <select
          value={priority}
          onChange={(e) => setPriority(e.target.value as TaskPriority)}
          className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
        >
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
        <button
          onClick={addTask}
          disabled={adding || !title.trim()}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {adding ? "Adding…" : "Add task"}
        </button>
      </div>
      {error && <p className="text-xs text-danger">{error}</p>}

      {/* Columns */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {kanbanColumns.map((col) => {
          const items = tasks.filter((t) => t.status === col.id);
          const isOver = overCol === col.id;
          return (
            <div
              key={col.id}
              onDragOver={(e) => {
                e.preventDefault();
                if (overCol !== col.id) setOverCol(col.id);
              }}
              onDragLeave={(e) => {
                if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                  setOverCol((c) => (c === col.id ? null : c));
                }
              }}
              onDrop={(e) => {
                e.preventDefault();
                const id = draggingId ?? e.dataTransfer.getData("text/plain");
                if (id) moveTask(id, col.id);
                setDraggingId(null);
                setOverCol(null);
              }}
              className={`flex flex-col rounded-card border bg-surface/50 transition-colors ${
                isOver ? "border-primary bg-surface-2/60" : "border-border"
              }`}
            >
              <div className="flex items-center gap-2 border-b border-border px-4 py-3">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: col.accent }} />
                <h2 className="text-sm font-semibold text-foreground">{col.label}</h2>
                <span className="ml-auto text-xs text-muted-2">{items.length}</span>
              </div>

              <div className="flex min-h-28 flex-1 flex-col gap-3 p-3">
                {loading ? (
                  <div className="py-6 text-center text-xs text-muted-2">Loading…</div>
                ) : (
                  items.map((t) => (
                    <article
                      key={t.id}
                      draggable
                      onDragStart={(e) => {
                        setDraggingId(t.id);
                        e.dataTransfer.effectAllowed = "move";
                        e.dataTransfer.setData("text/plain", t.id);
                      }}
                      onDragEnd={() => {
                        setDraggingId(null);
                        setOverCol(null);
                      }}
                      className={`group cursor-grab rounded-lg border border-border bg-surface p-3 transition-opacity active:cursor-grabbing ${
                        draggingId === t.id ? "opacity-40" : "opacity-100"
                      }`}
                    >
                      <div className="mb-2 flex items-start justify-between gap-2">
                        <span className="text-sm font-medium text-foreground">{t.title}</span>
                        <button
                          onClick={() => removeTask(t.id)}
                          title="Delete task"
                          className="shrink-0 text-muted-2 opacity-0 transition-opacity group-hover:opacity-100 hover:text-danger"
                        >
                          ✕
                        </button>
                      </div>
                      <div className="mb-2 flex flex-wrap items-center gap-1.5">
                        {t.project && <Badge>{t.project}</Badge>}
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${priorityStyles[t.priority]}`}
                        >
                          {t.priority}
                        </span>
                        {t.source === "message" && (
                          <span className="rounded-full bg-accent/15 px-2 py-0.5 text-[10px] font-semibold text-accent">
                            from message
                          </span>
                        )}
                      </div>
                      {t.agent && (
                        <div className="flex items-center gap-2">
                          <Avatar name={t.agent} color={t.agent_accent ?? "#6366f1"} size={22} />
                          <span className="text-xs text-muted">{t.agent}</span>
                        </div>
                      )}
                    </article>
                  ))
                )}

                {!loading && items.length === 0 && (
                  <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed border-border py-6 text-xs text-muted-2">
                    Drop tasks here
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
