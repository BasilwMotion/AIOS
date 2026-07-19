"use client";

/* Notifications: unread agent messages + recent scheduled-job runs. */
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { BellIcon } from "@/components/ui/icons";
import { allAgents } from "@/lib/placeholder-data";

type Msg = { id: string; from_agent: string; to_agent: string; body: string; created_at: string };
type Run = { id: string; schedule_id: string; status: string; started_at: string };

export function TopbarNotifications() {
  const agents = useMemo(() => allAgents(), []);
  const nameOf = (id: string) => agents.find((a) => a.id === id)?.name ?? id;

  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [runs, setRuns] = useState<Run[]>([]);
  const [count, setCount] = useState(0);
  const boxRef = useRef<HTMLDivElement>(null);

  async function load() {
    try {
      const d = await (await fetch("/api/notifications")).json();
      setMsgs(d.unreadMessages ?? []);
      setRuns(d.runs ?? []);
      setCount(d.count ?? 0);
    } catch {
      /* ignore */
    }
  }

  useEffect(() => {
    load();
    const t = setInterval(load, 30000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <div ref={boxRef} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Notifications"
        className="relative rounded-lg border border-border bg-surface p-2 text-muted transition-colors hover:text-foreground"
      >
        <BellIcon />
        {count > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[9px] font-bold text-white">
            {count}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-80 rounded-lg border border-border bg-surface shadow-lg">
          <div className="border-b border-border px-4 py-2 text-sm font-semibold text-foreground">
            Notifications
          </div>
          <div className="max-h-96 overflow-y-auto">
            {msgs.length === 0 && runs.length === 0 ? (
              <div className="px-4 py-6 text-center text-sm text-muted-2">Nothing new.</div>
            ) : (
              <>
                {msgs.map((m) => (
                  <Link
                    key={m.id}
                    href="/teams"
                    onClick={() => setOpen(false)}
                    className="block px-4 py-2.5 transition-colors hover:bg-surface-2"
                  >
                    <div className="text-xs text-muted-2">
                      Message · {nameOf(m.from_agent)} → {nameOf(m.to_agent)}
                    </div>
                    <div className="truncate text-sm text-foreground">{m.body}</div>
                  </Link>
                ))}
                {runs.map((r) => (
                  <Link
                    key={r.id}
                    href="/automation"
                    onClick={() => setOpen(false)}
                    className="block px-4 py-2.5 transition-colors hover:bg-surface-2"
                  >
                    <div className="text-sm text-foreground">Scheduled run — {r.status}</div>
                    <div className="text-xs text-muted-2">
                      {new Date(r.started_at).toLocaleString()}
                    </div>
                  </Link>
                ))}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
