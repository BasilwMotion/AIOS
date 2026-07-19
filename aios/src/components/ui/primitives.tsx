/*
 * Small, reusable presentational primitives shared across pages.
 * Intentionally minimal — compose these instead of repeating Tailwind soup.
 */
import type { ReactNode } from "react";
import { statusStyles, type Status } from "@/lib/placeholder-data";

export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-card border border-border bg-surface ${className}`}
    >
      {children}
    </div>
  );
}

export function SectionHeader({
  title,
  action,
}: {
  title: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-4 flex items-center justify-between">
      <h2 className="text-sm font-semibold tracking-wide text-muted uppercase">
        {title}
      </h2>
      {action}
    </div>
  );
}

export function StatusBadge({ status }: { status: Status }) {
  const s = statusStyles[status];
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${s.className}`}
    >
      {s.label}
    </span>
  );
}

export function Badge({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full bg-surface-2 px-2.5 py-0.5 text-xs font-medium text-muted ${className}`}
    >
      {children}
    </span>
  );
}

/** Circular monogram avatar; color is passed in from data. */
export function Avatar({
  name,
  color,
  size = 36,
}: {
  name: string;
  color: string;
  size?: number;
}) {
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white"
      style={{ width: size, height: size, backgroundColor: color }}
      aria-hidden
    >
      {name.slice(0, 2).toUpperCase()}
    </span>
  );
}

/** KPI tile: big value + label + up/down delta. */
export function StatTile({
  label,
  value,
  delta,
  trend,
}: {
  label: string;
  value: string;
  delta: string;
  trend: "up" | "down";
}) {
  return (
    <Card className="p-5">
      <div className="text-sm text-muted">{label}</div>
      <div className="mt-2 flex items-end justify-between gap-2">
        <div className="text-2xl font-semibold text-foreground">{value}</div>
        <span
          className={`text-xs font-medium ${trend === "up" ? "text-success" : "text-danger"}`}
        >
          {trend === "up" ? "▲" : "▼"} {delta}
        </span>
      </div>
    </Card>
  );
}

/** Small colored dot for online/busy/idle presence. */
export function PresenceDot({ status }: { status: "online" | "busy" | "idle" }) {
  const color =
    status === "online"
      ? "bg-success"
      : status === "busy"
        ? "bg-warning"
        : "bg-muted-2";
  return <span className={`inline-block h-2 w-2 rounded-full ${color}`} />;
}
