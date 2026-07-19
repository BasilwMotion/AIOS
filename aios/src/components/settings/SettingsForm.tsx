"use client";

/* Company settings that persist to /api/settings. */
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/primitives";
import type { Settings } from "@/lib/settings";

function Toggle({ on, onClick }: { on: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`flex h-6 w-11 items-center rounded-full p-0.5 transition-colors ${on ? "bg-primary" : "bg-surface-2"}`}
    >
      <span
        className={`h-5 w-5 rounded-full bg-white transition-transform ${on ? "translate-x-5" : ""}`}
      />
    </button>
  );
}

function Row({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-6 px-5 py-4">
      <div className="min-w-0">
        <div className="text-sm font-medium text-foreground">{label}</div>
        {hint && <div className="text-xs text-muted-2">{hint}</div>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

export function SettingsForm() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [name, setName] = useState("");
  const [note, setNote] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((d) => {
        setConfigured(d.configured);
        setSettings(d.settings);
        if (d.settings) setName(d.settings.company_name);
      })
      .catch(() => setConfigured(false));
  }, []);

  async function patch(p: Partial<Settings>) {
    if (!settings) return;
    setSettings({ ...settings, ...p });
    setNote(null);
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(p),
      });
      const data = await res.json();
      if (data.settings) setSettings(data.settings);
      setNote("Saved ✓");
    } catch {
      setNote("Failed to save.");
    }
  }

  async function pauseAll() {
    await patch({ run_overnight: false });
    try {
      const res = await fetch("/api/schedules");
      const data = await res.json();
      for (const s of data.schedules ?? []) {
        await fetch("/api/schedules", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: s.id, enabled: false }),
        });
      }
      setNote("All agents paused — schedules disabled.");
    } catch {
      setNote("Failed to pause.");
    }
  }

  if (configured === false) {
    return (
      <Card className="px-5 py-12 text-center text-sm text-muted-2">
        Connect the database to manage settings.
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      {note && <p className="text-xs text-success">{note}</p>}

      {/* Company */}
      <div>
        <h2 className="mb-4 text-sm font-semibold tracking-wide text-muted uppercase">Company</h2>
        <Card className="divide-y divide-border">
          <div className="px-5 py-4">
            <label className="mb-1.5 block text-sm font-medium text-foreground">Company name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={() => name.trim() && name !== settings?.company_name && patch({ company_name: name.trim() })}
              className="w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
            />
          </div>
        </Card>
      </div>

      {/* Automation */}
      <div>
        <h2 className="mb-4 text-sm font-semibold tracking-wide text-muted uppercase">Automation</h2>
        <Card className="divide-y divide-border">
          <Row label="Run tasks overnight" hint="Let the scheduled cron run agents while you're away.">
            <Toggle on={!!settings?.run_overnight} onClick={() => patch({ run_overnight: !settings?.run_overnight })} />
          </Row>
          <Row label="Require review for risky actions" hint="A preference agents are told to respect.">
            <Toggle on={!!settings?.require_review} onClick={() => patch({ require_review: !settings?.require_review })} />
          </Row>
          <Row label="Daily summary email" hint="Stored preference (email delivery not set up).">
            <Toggle on={!!settings?.daily_digest} onClick={() => patch({ daily_digest: !settings?.daily_digest })} />
          </Row>
        </Card>
      </div>

      {/* Danger */}
      <div>
        <h2 className="mb-4 text-sm font-semibold tracking-wide text-muted uppercase">Danger zone</h2>
        <Card className="p-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="text-sm font-medium text-foreground">Pause all agents</div>
              <div className="text-xs text-muted-2">Turn off overnight runs and disable every schedule.</div>
            </div>
            <button
              onClick={pauseAll}
              className="rounded-lg border border-danger/40 bg-danger/10 px-3.5 py-2 text-sm font-medium text-danger transition-colors hover:bg-danger/20"
            >
              Pause company
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
}
