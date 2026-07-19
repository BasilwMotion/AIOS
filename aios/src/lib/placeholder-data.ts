/*
 * Structural app data: the departments and agents that make up the company,
 * plus Kanban column config and small style maps. All *content* (memory,
 * messages, tasks, schedules, analytics) is real and lives in Supabase — this
 * file only defines the org structure and UI config.
 */

/* --- Kanban columns (the live board maps task.status to these) --- */
export type KanbanColumnId = "todo" | "in-progress" | "review" | "done";

export const kanbanColumns: { id: KanbanColumnId; label: string; accent: string }[] = [
  { id: "todo", label: "To Do", accent: "#9aa1ad" },
  { id: "in-progress", label: "In Progress", accent: "#6366f1" },
  { id: "review", label: "Review", accent: "#f59e0b" },
  { id: "done", label: "Done", accent: "#22c55e" },
];

export type Priority = "low" | "medium" | "high";

export const priorityStyles: Record<Priority, string> = {
  low: "bg-muted/15 text-muted",
  medium: "bg-primary/15 text-primary",
  high: "bg-danger/15 text-danger",
};

/* --- Status styles (used by the shared StatusBadge primitive) --- */
export type Status = "running" | "queued" | "done" | "failed" | "review";

export const statusStyles: Record<Status, { label: string; className: string }> = {
  running: { label: "Running", className: "bg-primary/15 text-primary" },
  queued: { label: "Queued", className: "bg-muted/15 text-muted" },
  done: { label: "Done", className: "bg-success/15 text-success" },
  failed: { label: "Failed", className: "bg-danger/15 text-danger" },
  review: { label: "Needs review", className: "bg-warning/15 text-warning" },
};

/* --- Agents & departments (the org structure) --- */
export type Agent = {
  id: string;
  name: string;
  role: string;
  status: "online" | "busy" | "idle";
  accent: string;
  bio?: string;
  skills?: string[];
  tools?: { name: string; description: string }[];
};

export type Department = {
  slug: string;
  name: string;
  description: string;
  accent: string;
  lead: string;
  members: Agent[];
};

export const departments: Department[] = [
  {
    slug: "development",
    name: "Development",
    description: "Builds and maintains the product, platform, and internal tooling.",
    accent: "#6366f1",
    lead: "Forge",
    members: [
      {
        id: "d-forge",
        name: "Forge",
        role: "Development Manager",
        status: "busy",
        accent: "#6366f1",
        bio: "Leads the Development department. Breaks product goals into buildable work, assigns it across the team, and unblocks the other engineers.",
        skills: ["System design", "Planning", "Code review", "Mentoring"],
        tools: [
          { name: "Task Planner", description: "Break goals into assignable tasks" },
          { name: "Code Review", description: "Review and approve pull requests" },
          { name: "Git", description: "Read repository history" },
        ],
      },
      {
        id: "d-vector",
        name: "Vector",
        role: "Frontend Developer",
        status: "busy",
        accent: "#38bdf8",
        bio: "Builds the dashboard UI and owns the component library and layout system.",
        skills: ["React", "TypeScript", "Tailwind", "Accessibility"],
        tools: [
          { name: "Code Editor", description: "Write and edit React/TypeScript" },
          { name: "Browser", description: "Preview and test the UI" },
        ],
      },
      {
        id: "d-byte",
        name: "Byte",
        role: "Backend Developer",
        status: "online",
        accent: "#818cf8",
        bio: "Owns the server, data model, and APIs.",
        skills: ["Node.js", "PostgreSQL", "API design", "Queues"],
        tools: [
          { name: "Code Editor", description: "Write and edit server code" },
          { name: "Database", description: "Query and inspect data" },
        ],
      },
      {
        id: "d-patch",
        name: "Patch",
        role: "QA Tester",
        status: "idle",
        accent: "#34d399",
        bio: "Guards quality — writes automated tests and signs off before work ships.",
        skills: ["Test automation", "Playwright", "Bug triage"],
        tools: [{ name: "Playwright", description: "Run end-to-end browser tests" }],
      },
      {
        id: "d-nimbus",
        name: "Nimbus",
        role: "DevOps Engineer",
        status: "online",
        accent: "#22d3ee",
        bio: "Owns deployments, CI/CD, and the infrastructure that runs agents around the clock.",
        skills: ["Docker", "CI/CD", "Cloud infra", "Monitoring"],
        tools: [{ name: "CI/CD", description: "Manage deploy pipelines" }],
      },
    ],
  },
  {
    slug: "marketing",
    name: "Marketing",
    description: "Owns growth, content, and the company's public voice.",
    accent: "#ec4899",
    lead: "Muse",
    members: [
      { id: "m-muse", name: "Muse", role: "Content Lead", status: "busy", accent: "#ec4899" },
      { id: "m-blitz", name: "Blitz", role: "Growth", status: "online", accent: "#f472b6" },
      { id: "m-reach", name: "Reach", role: "Social", status: "idle", accent: "#fb7185" },
    ],
  },
  {
    slug: "sales",
    name: "Sales",
    description: "Runs outreach, qualifies leads, and closes deals.",
    accent: "#22c55e",
    lead: "Quota",
    members: [
      { id: "s-quota", name: "Quota", role: "Account Executive", status: "online", accent: "#22c55e" },
      { id: "s-pitch", name: "Pitch", role: "SDR", status: "busy", accent: "#4ade80" },
      { id: "s-close", name: "Close", role: "Account Executive", status: "idle", accent: "#16a34a" },
    ],
  },
  {
    slug: "design",
    name: "Design",
    description: "Shapes product, brand, and every pixel customers see.",
    accent: "#f43f5e",
    lead: "Pixel",
    members: [
      { id: "de-pixel", name: "Pixel", role: "Product Designer", status: "online", accent: "#f43f5e" },
      { id: "de-hue", name: "Hue", role: "Brand Designer", status: "idle", accent: "#fb7185" },
      { id: "de-frame", name: "Frame", role: "UX Researcher", status: "busy", accent: "#a78bfa" },
    ],
  },
  {
    slug: "research",
    name: "Research",
    description: "Gathers intelligence and feeds insights into the company Brain.",
    accent: "#22d3ee",
    lead: "Scout",
    members: [
      { id: "r-scout", name: "Scout", role: "Lead Researcher", status: "online", accent: "#22d3ee" },
      { id: "r-probe", name: "Probe", role: "Data Analyst", status: "busy", accent: "#06b6d4" },
      { id: "r-cite", name: "Cite", role: "Fact Checker", status: "idle", accent: "#67e8f9" },
    ],
  },
];

export function getDepartment(slug: string): Department | undefined {
  return departments.find((d) => d.slug === slug);
}

export function getEmployee(
  deptSlug: string,
  employeeId: string,
): { dept: Department; employee: Agent } | undefined {
  const dept = getDepartment(deptSlug);
  const employee = dept?.members.find((m) => m.id === employeeId);
  if (!dept || !employee) return undefined;
  return { dept, employee };
}

export type AgentRef = {
  id: string;
  name: string;
  role: string;
  deptName: string;
  deptSlug: string;
  accent: string;
};

export function allAgents(): AgentRef[] {
  return departments.flatMap((d) =>
    d.members.map((m) => ({
      id: m.id,
      name: m.name,
      role: m.role,
      deptName: d.name,
      deptSlug: d.slug,
      accent: m.accent,
    })),
  );
}

export function getAgentRef(id: string): AgentRef | undefined {
  return allAgents().find((a) => a.id === id);
}
