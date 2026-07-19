"use client";

/* Global search: agents (client-side) + tasks & memory (/api/search). */
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { SearchIcon } from "@/components/ui/icons";
import { allAgents } from "@/lib/placeholder-data";

type TaskHit = { id: string; title: string; project: string | null; status: string };
type MemHit = { id: string; title: string | null; content: string };

function Result({
  href,
  title,
  sub,
  onNav,
}: {
  href: string;
  title: string;
  sub?: string;
  onNav: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onNav}
      className="block px-4 py-2 transition-colors hover:bg-surface-2"
    >
      <div className="truncate text-sm text-foreground">{title}</div>
      {sub && <div className="truncate text-xs text-muted-2">{sub}</div>}
    </Link>
  );
}

export function TopbarSearch() {
  const agents = useMemo(() => allAgents(), []);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [tasks, setTasks] = useState<TaskHit[]>([]);
  const [memory, setMemory] = useState<MemHit[]>([]);
  const boxRef = useRef<HTMLDivElement>(null);

  const query = q.trim().toLowerCase();
  const agentHits =
    query.length >= 1
      ? agents
          .filter((a) => `${a.name} ${a.role} ${a.deptName}`.toLowerCase().includes(query))
          .slice(0, 5)
      : [];

  useEffect(() => {
    if (query.length < 2) {
      setTasks([]);
      setMemory([]);
      return;
    }
    const t = setTimeout(() => {
      fetch(`/api/search?q=${encodeURIComponent(query)}`)
        .then((r) => r.json())
        .then((d) => {
          setTasks(d.tasks ?? []);
          setMemory(d.memory ?? []);
        })
        .catch(() => {});
    }, 200);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const close = () => {
    setOpen(false);
    setQ("");
  };
  const hasResults = agentHits.length + tasks.length + memory.length > 0;

  return (
    <div ref={boxRef} className="relative w-full max-w-md">
      <SearchIcon className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted-2" />
      <input
        type="text"
        value={q}
        onChange={(e) => {
          setQ(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        placeholder="Search agents, tasks, memory…"
        className="w-full rounded-lg border border-border bg-surface py-2 pr-3 pl-10 text-sm text-foreground placeholder:text-muted-2 focus:border-primary focus:outline-none"
      />

      {open && query.length >= 1 && (
        <div className="absolute z-50 mt-2 w-full rounded-lg border border-border bg-surface shadow-lg">
          {!hasResults ? (
            <div className="px-4 py-3 text-sm text-muted-2">
              {query.length < 2 ? "Keep typing…" : "No matches."}
            </div>
          ) : (
            <div className="max-h-80 overflow-y-auto py-1">
              {agentHits.length > 0 && (
                <>
                  <div className="px-4 pt-2 pb-1 text-[10px] font-semibold tracking-wide text-muted-2 uppercase">
                    Agents
                  </div>
                  {agentHits.map((a) => (
                    <Result
                      key={a.id}
                      href={`/teams/${a.deptSlug}/${a.id}`}
                      title={a.name}
                      sub={`${a.role} · ${a.deptName}`}
                      onNav={close}
                    />
                  ))}
                </>
              )}
              {tasks.length > 0 && (
                <>
                  <div className="px-4 pt-2 pb-1 text-[10px] font-semibold tracking-wide text-muted-2 uppercase">
                    Tasks
                  </div>
                  {tasks.map((t) => (
                    <Result
                      key={t.id}
                      href="/tasks"
                      title={t.title}
                      sub={t.project ?? t.status}
                      onNav={close}
                    />
                  ))}
                </>
              )}
              {memory.length > 0 && (
                <>
                  <div className="px-4 pt-2 pb-1 text-[10px] font-semibold tracking-wide text-muted-2 uppercase">
                    Memory
                  </div>
                  {memory.map((m) => (
                    <Result
                      key={m.id}
                      href="/brain"
                      title={m.title ?? m.content.slice(0, 48)}
                      sub={m.title ? m.content.slice(0, 60) : undefined}
                      onNav={close}
                    />
                  ))}
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
