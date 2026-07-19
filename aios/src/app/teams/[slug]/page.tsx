/* Department detail — /teams/[slug]. Its members. */
import Link from "next/link";
import { notFound } from "next/navigation";
import { Card, Badge, Avatar, PresenceDot } from "@/components/ui/primitives";
import { departments, getDepartment } from "@/lib/placeholder-data";
import { departmentIcons, ArrowLeftIcon } from "@/components/ui/icons";

export function generateStaticParams() {
  return departments.map((d) => ({ slug: d.slug }));
}

export default async function DepartmentPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const dept = getDepartment(slug);
  if (!dept) notFound();

  const Icon = departmentIcons[dept.slug];

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <Link
        href="/teams"
        className="inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-foreground"
      >
        <ArrowLeftIcon width={16} height={16} />
        All teams
      </Link>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-4">
          <span
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl"
            style={{ backgroundColor: `${dept.accent}1f`, color: dept.accent }}
          >
            {Icon && <Icon width={28} height={28} />}
          </span>
          <div>
            <h1 className="text-xl font-semibold text-foreground">{dept.name}</h1>
            <p className="mt-1 max-w-xl text-sm text-muted">{dept.description}</p>
          </div>
        </div>
        <Badge>Lead: {dept.lead}</Badge>
      </div>

      <div>
        <h2 className="mb-4 text-sm font-semibold tracking-wide text-muted uppercase">
          {dept.members.length} team members
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {dept.members.map((m) => (
            <Link
              key={m.id}
              href={`/teams/${dept.slug}/${m.id}`}
              className="group rounded-card border border-border bg-surface p-5 transition-colors hover:border-primary/50 hover:bg-surface-2"
            >
              <div className="flex items-start gap-4">
                <Avatar name={m.name} color={m.accent} size={44} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="truncate text-base font-semibold text-foreground group-hover:text-primary">
                      {m.name}
                    </h3>
                    {m.name === dept.lead && (
                      <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-semibold text-primary">
                        LEAD
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted">{m.role}</p>
                </div>
              </div>
              <div className="mt-4 flex items-center gap-2 border-t border-border pt-3 text-xs text-muted">
                <PresenceDot status={m.status} />
                <span className="capitalize">{m.status}</span>
                <span className="ml-auto text-primary opacity-0 transition-opacity group-hover:opacity-100">
                  View profile →
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
