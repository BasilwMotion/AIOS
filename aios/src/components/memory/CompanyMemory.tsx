"use client";

/*
 * Shared company memory — every agent reads from this, and the founder can add
 * to it here. Backed by /api/memory/shared (Supabase). Degrades to a clear
 * "connect the database" note when Supabase env isn't set.
 */
import { useEffect, useState } from "react";
import { Card, Badge } from "@/components/ui/primitives";
import type { SharedMemory } from "@/lib/memory";

export function CompanyMemory() {
  const [items, setItems] = useState<SharedMemory[]>([]);
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    try {
      const res = await fetch("/api/memory/shared");
      const data = await res.json();
      setConfigured(data.configured);
      setItems(data.items ?? []);
    } catch {
      setConfigured(false);
    }
  }
  useEffect(() => {
    load();
  }, []);

  async function add() {
    const c = content.trim();
    if (!c || busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/memory/shared", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim() || undefined, content: c }),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => null))?.error ?? "Failed to save.");
      setTitle("");
      setContent("");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold tracking-wide text-muted uppercase">
          Company memory
        </h2>
        <Badge>{configured ? `${items.length} entries · shared` : "Database"}</Badge>
      </div>

      {configured === false ? (
        <p className="text-sm text-muted-2">
          Connect the database to enable shared memory — add{" "}
          <code className="text-muted">SUPABASE_URL</code> and{" "}
          <code className="text-muted">SUPABASE_PUBLISHABLE_KEY</code> to your env
          (see <code className="text-muted">.env.local.example</code>).
        </p>
      ) : (
        <>
          {/* Add form */}
          <div className="mb-5 space-y-2">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Title (optional)"
              className="w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-foreground placeholder:text-muted-2 focus:border-primary focus:outline-none"
            />
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Add something every agent should remember…"
              rows={2}
              className="w-full resize-y rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-foreground placeholder:text-muted-2 focus:border-primary focus:outline-none"
            />
            <div className="flex items-center justify-between">
              {error ? (
                <span className="text-xs text-danger">{error}</span>
              ) : (
                <span className="text-xs text-muted-2">Visible to all agents</span>
              )}
              <button
                onClick={add}
                disabled={busy || !content.trim()}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {busy ? "Saving…" : "Add to memory"}
              </button>
            </div>
          </div>

          {/* Entries */}
          {items.length === 0 ? (
            <p className="text-sm text-muted-2">No shared memory yet.</p>
          ) : (
            <ul className="divide-y divide-border">
              {items.map((m) => (
                <li key={m.id} className="py-3 first:pt-0 last:pb-0">
                  {m.title && (
                    <div className="text-sm font-medium text-foreground">{m.title}</div>
                  )}
                  <p className="text-sm text-muted">{m.content}</p>
                  <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-muted-2">
                    <span>{m.created_by}</span>
                    {m.source === "summary" && (
                      <span className="rounded-full bg-accent/15 px-2 py-0.5 text-accent">
                        auto-summary
                      </span>
                    )}
                    {m.tags?.map((t) => (
                      <span key={t} className="rounded-full bg-surface-2 px-2 py-0.5">
                        {t}
                      </span>
                    ))}
                    <span className="ml-auto">
                      {new Date(m.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </Card>
  );
}
