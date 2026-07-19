/* Teams — the org, shown as clickable department cards. */
import Link from "next/link";
import { Card, Badge } from "@/components/ui/primitives";
import { departments } from "@/lib/placeholder-data";
import { departmentIcons } from "@/components/ui/icons";

export default function TeamsPage() {
  const totalAgents = departments.reduce((n, d) => n + d.members.length, 0);

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Teams</h1>
          <p className="text-sm text-muted">
            {departments.length} departments · {totalAgents} agents. Open one to see its team.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {departments.map((d) => {
          const Icon = departmentIcons[d.slug];
          return (
            <Link
              key={d.slug}
              href={`/teams/${d.slug}`}
              className="group rounded-card border border-border bg-surface p-5 transition-colors hover:border-primary/50 hover:bg-surface-2"
            >
              <div className="flex items-start justify-between gap-3">
                <span
                  className="flex h-11 w-11 items-center justify-center rounded-lg"
                  style={{ backgroundColor: `${d.accent}1f`, color: d.accent }}
                >
                  {Icon && <Icon width={22} height={22} />}
                </span>
                <div className="flex -space-x-2">
                  {d.members.slice(0, 4).map((m) => (
                    <span
                      key={m.id}
                      className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-surface text-[10px] font-semibold text-white"
                      style={{ backgroundColor: m.accent }}
                      title={m.name}
                    >
                      {m.name.slice(0, 2).toUpperCase()}
                    </span>
                  ))}
                </div>
              </div>

              <h2 className="mt-4 text-base font-semibold text-foreground group-hover:text-primary">
                {d.name}
              </h2>
              <p className="mt-1 line-clamp-2 text-sm text-muted">{d.description}</p>

              <div className="mt-4 flex items-center gap-4 border-t border-border pt-3 text-xs text-muted-2">
                <span>{d.members.length} agents</span>
                <Badge className="ml-auto">Lead: {d.lead}</Badge>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
