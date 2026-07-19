"use client";

/*
 * Live agent chat. Streams replies from /api/chat and auto-summarizes long
 * conversations into shared company memory. Starts empty — real conversation only.
 */
import { useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui/primitives";
import type { ChatTurn, LLMStatus } from "@/lib/llm/types";

function Bubble({ turn, agentName }: { turn: ChatTurn; agentName: string }) {
  const right = turn.role === "user";
  return (
    <div className={`flex flex-col ${right ? "items-end" : "items-start"}`}>
      <div className="mb-1 text-xs font-medium text-muted-2">{right ? "You" : agentName}</div>
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm whitespace-pre-wrap ${
          right
            ? "rounded-br-sm bg-primary text-primary-foreground"
            : "rounded-bl-sm bg-surface-2 text-foreground"
        }`}
      >
        {turn.text || "…"}
      </div>
    </div>
  );
}

export function AgentChat({
  deptSlug,
  employeeId,
  agentName,
}: {
  deptSlug: string;
  employeeId: string;
  agentName: string;
}) {
  const [status, setStatus] = useState<LLMStatus | null>(null);
  const [live, setLive] = useState<ChatTurn[]>([]);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summarizedLen, setSummarizedLen] = useState(0);
  const [memNote, setMemNote] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/chat")
      .then((r) => r.json())
      .then(setStatus)
      .catch(() => setStatus({ configured: false, provider: null }));
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [live, pending]);

  const SUMMARY_EVERY = 6;

  async function maybeSummarize(convo: ChatTurn[]) {
    if (convo.length - summarizedLen < SUMMARY_EVERY) return;
    setSummarizedLen(convo.length);
    try {
      setMemNote("Summarizing to company memory…");
      const res = await fetch("/api/chat/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deptSlug, employeeId, messages: convo }),
      });
      const data = await res.json().catch(() => null);
      setMemNote(data?.saved ? "Saved a summary to company memory ✓" : null);
    } catch {
      setMemNote(null);
    }
  }

  async function send() {
    const text = input.trim();
    if (!text || pending) return;
    setError(null);
    setMemNote(null);

    const history: ChatTurn[] = [...live, { role: "user", text }];
    setLive([...history, { role: "assistant", text: "" }]);
    setInput("");
    setPending(true);

    let acc = "";
    let ok = false;
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deptSlug, employeeId, messages: history }),
      });
      if (!res.ok || !res.body) {
        const info = await res.json().catch(() => null);
        throw new Error(info?.error ?? `Request failed (${res.status}).`);
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        setLive((h) => {
          const copy = [...h];
          copy[copy.length - 1] = { role: "assistant", text: acc };
          return copy;
        });
      }
      ok = true;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
      setLive((h) => h.filter((m, i) => !(i === h.length - 1 && m.role === "assistant" && m.text === "")));
    } finally {
      setPending(false);
    }

    if (ok) void maybeSummarize([...history, { role: "assistant", text: acc }]);
  }

  const enabled = status?.configured === true;

  return (
    <Card className="flex flex-col p-5">
      <h2 className="mb-4 text-sm font-semibold tracking-wide text-muted uppercase">Chat</h2>

      <div className="space-y-3">
        {live.length === 0 && (
          <p className="py-4 text-center text-sm text-muted-2">
            Start a conversation with {agentName}.
          </p>
        )}
        {live.map((t, i) => (
          <Bubble key={i} turn={t} agentName={agentName} />
        ))}
        <div ref={endRef} />
      </div>

      <div className="mt-5 border-t border-border pt-4">
        {error && <p className="mb-2 text-xs text-danger">{error}</p>}
        <div className="flex items-center gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            disabled={!enabled || pending}
            placeholder={enabled ? `Message ${agentName}…` : "Add an LLM key to enable chat"}
            className="flex-1 rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-foreground placeholder:text-muted-2 focus:border-primary focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
          />
          <button
            onClick={send}
            disabled={!enabled || pending || !input.trim()}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {pending ? "…" : "Send"}
          </button>
        </div>
        {memNote && <p className="mt-2 text-center text-xs text-accent">{memNote}</p>}
        <p className="mt-2 text-center text-xs text-muted-2">
          {enabled
            ? `Connected to ${status?.provider}. Long chats auto-save to company memory.`
            : "AI is not connected — add a free Gemini key (see .env.local.example)."}
        </p>
      </div>
    </Card>
  );
}
