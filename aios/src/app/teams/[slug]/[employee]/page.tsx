/* Agent profile — /teams/[slug]/[employee]. Live chat, inbox, and memory. */
import Link from "next/link";
import { notFound } from "next/navigation";
import { Card, Badge, Avatar, PresenceDot } from "@/components/ui/primitives";
import { departments, getEmployee } from "@/lib/placeholder-data";
import { ArrowLeftIcon } from "@/components/ui/icons";
import { AgentChat } from "@/components/agents/AgentChat";
import { AgentInbox } from "@/components/agents/AgentInbox";
import { PrivateMemory } from "@/components/memory/PrivateMemory";

export function generateStaticParams() {
  return departments.flatMap((d) => d.members.map((m) => ({ slug: d.slug, employee: m.id })));
}

export default async function AgentProfilePage({
  params,
}: {
  params: Promise<{ slug: string; employee: string }>;
}) {
  const { slug, employee } = await params;
  const found = getEmployee(slug, employee);
  if (!found) notFound();

  const { dept, employee: agent } = found;
  const isLead = agent.name === dept.lead;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <Link
        href={`/teams/${dept.slug}`}
        className="inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-foreground"
      >
        <ArrowLeftIcon width={16} height={16} />
        Back to {dept.name}
      </Link>

      {/* Header */}
      <Card className="p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <Avatar name={agent.name} color={agent.accent} size={72} />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-semibold text-foreground">{agent.name}</h1>
              {isLead && (
                <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-semibold text-primary">
                  LEAD
                </span>
              )}
            </div>
            <p className="mt-0.5 text-sm text-muted">{agent.role}</p>
            <div className="mt-2 flex items-center gap-2 text-xs text-muted">
              <PresenceDot status={agent.status} />
              <span className="capitalize">{agent.status}</span>
            </div>
          </div>
          <Badge>{dept.name}</Badge>
        </div>
        {agent.bio && (
          <p className="mt-5 border-t border-border pt-5 text-sm leading-relaxed text-muted">
            {agent.bio}
          </p>
        )}
      </Card>

      {/* Live: chat + inbox (main), private memory + identity (side) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <AgentChat deptSlug={dept.slug} employeeId={agent.id} agentName={agent.name} />
          <AgentInbox agentId={agent.id} agentName={agent.name} />
        </div>

        <div className="space-y-6">
          <PrivateMemory agentId={agent.id} agentName={agent.name} />

          {agent.tools?.length ? (
            <Card className="p-5">
              <h2 className="mb-4 text-sm font-semibold tracking-wide text-muted uppercase">Tools</h2>
              <ul className="space-y-3">
                {agent.tools.map((t) => (
                  <li key={t.name} className="flex items-start gap-3">
                    <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-surface-2 text-[10px] font-semibold text-muted">
                      {t.name.slice(0, 2).toUpperCase()}
                    </span>
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-foreground">{t.name}</div>
                      <div className="text-xs text-muted-2">{t.description}</div>
                    </div>
                  </li>
                ))}
              </ul>
            </Card>
          ) : null}

          {agent.skills?.length ? (
            <Card className="p-5">
              <h2 className="mb-4 text-sm font-semibold tracking-wide text-muted uppercase">Skills</h2>
              <div className="flex flex-wrap gap-2">
                {agent.skills.map((s) => (
                  <span
                    key={s}
                    className="rounded-full bg-surface-2 px-3 py-1 text-xs font-medium text-muted"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </Card>
          ) : null}
        </div>
      </div>
    </div>
  );
}
