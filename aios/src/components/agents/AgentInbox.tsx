"use client";

/*
 * Per-agent inbox + compose. Shows messages sent TO this agent, and lets you
 * send a message FROM this agent to another. Backed by /api/messages (Supabase).
 */
import { useEffect, useMemo, useState } from "react";
import { Card, Badge, Avatar } from "@/components/ui/primitives";
import { allAgents } from "@/lib/placeholder-data";
import type { Message } from "@/lib/messages";

export function AgentInbox({
  agentId,
  agentName,
}: {
  agentId: string;
  agentName: string;
}) {
  const agents = useMemo(() => allAgents(), []);
  const nameOf = (id: string) => agents.find((a) => a.id === id)?.name ?? id;
  const accentOf = (id: string) => agents.find((a) => a.id === id)?.accent ?? "#6366f1";
  const recipients = useMemo(() => agents.filter((a) => a.id !== agentId), [agents, agentId]);

  const [items, setItems] = useState<Message[]>([]);
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [to, setTo] = useState(recipients[0]?.id ?? "");
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [converting, setConverting] = useState<string | null>(null);

  async function load() {
    try {
      const res = await fetch(`/api/messages?agentId=${encodeURIComponent(agentId)}`);
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

  async function send() {
    const text = body.trim();
    if (!text || !to || busy) return;
    setBusy(true);
    setError(null);
    setNote(null);
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fromAgentId: agentId, toAgentId: to, body: text }),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => null))?.error ?? "Failed to send.");
      setBody("");
      setNote(`Sent to ${nameOf(to)} ✓`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to send.");
    } finally {
      setBusy(false);
    }
  }

  async function convertToTask(id: string) {
    if (converting) return;
    setConverting(id);
    setError(null);
    setNote(null);
    try {
      const res = await fetch("/api/tasks/from-message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messageId: id }),
      });
      const data = await res.json().catch(() => null);
      if (res.ok && data?.taskId) {
        setItems((xs) => xs.map((m) => (m.id === id ? { ...m, task_id: data.taskId } : m)));
        setNote("Created a task on the board ✓");
      } else {
        setError(data?.error ?? "Failed to create task.");
      }
    } catch {
      setError("Failed to create task.");
    } finally {
      setConverting(null);
    }
  }

  async function markRead(id: string) {
    setItems((xs) => xs.map((m) => (m.id === id ? { ...m, read: true } : m)));
    try {
      await fetch("/api/messages", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
    } catch {
      /* optimistic; ignore */
    }
  }

  const unread = items.filter((m) => !m.read).length;

  return (
    <Card className="p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold tracking-wide text-muted uppercase">Inbox</h2>
        {configured && (
          <Badge>{unread > 0 ? `${unread} unread` : `${items.length} messages`}</Badge>
        )}
      </div>

      {configured === false ? (
        <p className="text-sm text-muted-2">
          Connect the database (SUPABASE_URL + SUPABASE_PUBLISHABLE_KEY) to enable messaging.
        </p>
      ) : (
        <>
          {/* Messages */}
          {items.length === 0 ? (
            <p className="mb-5 text-sm text-muted-2">No messages yet.</p>
          ) : (
            <ul className="mb-5 divide-y divide-border">
              {items.map((m) => (
                <li key={m.id} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
                  <Avatar name={nameOf(m.from_agent)} color={accentOf(m.from_agent)} size={30} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-foreground">
                        {nameOf(m.from_agent)}
                      </span>
                      {!m.read && <span className="h-2 w-2 rounded-full bg-primary" />}
                      <span className="ml-auto text-xs text-muted-2">
                        {new Date(m.created_at).toLocaleString()}
                      </span>
                    </div>
                    <p className="mt-0.5 text-sm text-muted">{m.body}</p>
                    <div className="mt-1.5 flex items-center gap-3">
                      {m.task_id ? (
                        <span className="rounded-full bg-success/15 px-2 py-0.5 text-[10px] font-semibold text-success">
                          converted to task
                        </span>
                      ) : (
                        <button
                          onClick={() => convertToTask(m.id)}
                          disabled={converting === m.id}
                          className="text-xs font-medium text-primary hover:underline disabled:opacity-50"
                        >
                          {converting === m.id ? "Creating…" : "Turn into task"}
                        </button>
                      )}
                      {!m.read && (
                        <button
                          onClick={() => markRead(m.id)}
                          className="text-xs font-medium text-muted hover:text-foreground"
                        >
                          Mark read
                        </button>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {/* Compose */}
          <div className="space-y-2 border-t border-border pt-4">
            <div className="flex items-center gap-2 text-xs text-muted-2">
              <span>From {agentName} to</span>
              <select
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="rounded-lg border border-border bg-surface-2 px-2 py-1 text-xs text-foreground focus:border-primary focus:outline-none"
              >
                {recipients.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} · {a.deptName}
                  </option>
                ))}
              </select>
            </div>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Write a message to another agent…"
              rows={2}
              className="w-full resize-y rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-foreground placeholder:text-muted-2 focus:border-primary focus:outline-none"
            />
            <div className="flex items-center justify-between">
              {error ? (
                <span className="text-xs text-danger">{error}</span>
              ) : note ? (
                <span className="text-xs text-accent">{note}</span>
              ) : (
                <span className="text-xs text-muted-2">Lands in the recipient&apos;s inbox</span>
              )}
              <button
                onClick={send}
                disabled={busy || !body.trim() || !to}
                className="rounded-lg bg-primary px-3.5 py-1.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {busy ? "Sending…" : "Send"}
              </button>
            </div>
          </div>
        </>
      )}
    </Card>
  );
}
