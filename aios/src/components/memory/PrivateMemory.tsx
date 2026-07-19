"use client";

/*
 * Private memory for a single agent — only this agent reads it (and it's fed
 * into that agent's chat system prompt). Backed by /api/memory/private.
 */
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/primitives";
import type { PrivateMemory as PrivateMemoryRow } from "@/lib/memory";

export function PrivateMemory({
  agentId,
  agentName,
}: {
  agentId: string;
  agentName: string;
}) {
  const [items, setItems] = useState<PrivateMemoryRow[]>([]);
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [content, setContent] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    try {
      const res = await fetch(`/api/memory/private?agentId=${encodeURIComponent(agentId)}`);
      const data = await res.json();
      setConfigured(data.configured);
      setItems(data.items ?? []);
    } catch {
      setConfigured(false);
    }
  }
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agentId]);

  async function add() {
    const c = content.trim();
    if (!c || busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/memory/private", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agentId, content: c }),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => null))?.error ?? "Failed to save.");
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
      <h2 className="mb-4 text-sm font-semibold tracking-wide text-muted uppercase">
        Private memory
      </h2>

      {configured === false ? (
        <p className="text-sm text-muted-2">
          Connect the database (SUPABASE_URL + SUPABASE_PUBLISHABLE_KEY) to give{" "}
          {agentName} private memory.
        </p>
      ) : (
        <>
          {items.length === 0 ? (
            <p className="mb-4 text-sm text-muted-2">
              {agentName} hasn&apos;t saved anything private yet.
            </p>
          ) : (
            <ul className="mb-4 space-y-2">
              {items.map((m) => (
                <li key={m.id} className="flex gap-2 text-sm text-foreground">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                  <span>{m.content}</span>
                </li>
              ))}
            </ul>
          )}

          <div className="space-y-2 border-t border-border pt-4">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={`Note something only ${agentName} should remember…`}
              rows={2}
              className="w-full resize-y rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-foreground placeholder:text-muted-2 focus:border-primary focus:outline-none"
            />
            <div className="flex items-center justify-between">
              {error ? (
                <span className="text-xs text-danger">{error}</span>
              ) : (
                <span className="text-xs text-muted-2">Private to {agentName}</span>
              )}
              <button
                onClick={add}
                disabled={busy || !content.trim()}
                className="rounded-lg bg-primary px-3.5 py-1.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {busy ? "Saving…" : "Add"}
              </button>
            </div>
          </div>
        </>
      )}
    </Card>
  );
}
