/*
 * Sidebar navigation config — single source of truth.
 * Add/remove a destination here and it updates the sidebar everywhere.
 */
import {
  DashboardIcon,
  TeamsIcon,
  BrainIcon,
  ProjectsIcon,
  TasksIcon,
  AnalyticsIcon,
  AutomationIcon,
  SettingsIcon,
} from "@/components/ui/icons";

export type NavItem = {
  label: string;
  href: string;
  icon: typeof DashboardIcon;
  /** Optional short description used as a tooltip / subtitle. */
  hint?: string;
};

/** Primary navigation (top of the sidebar). */
export const primaryNav: NavItem[] = [
  { label: "Dashboard", href: "/", icon: DashboardIcon, hint: "Company overview" },
  { label: "Teams", href: "/teams", icon: TeamsIcon, hint: "Your AI agents" },
  { label: "Brain", href: "/brain", icon: BrainIcon, hint: "Shared knowledge & memory" },
  { label: "Projects", href: "/projects", icon: ProjectsIcon, hint: "Ongoing work" },
  { label: "Tasks", href: "/tasks", icon: TasksIcon, hint: "The work queue" },
  { label: "Analytics", href: "/analytics", icon: AnalyticsIcon, hint: "Output & cost" },
  { label: "Automation", href: "/automation", icon: AutomationIcon, hint: "Scheduled agent jobs" },
];

/** Secondary navigation (bottom of the sidebar). */
export const secondaryNav: NavItem[] = [
  { label: "Settings", href: "/settings", icon: SettingsIcon, hint: "Configuration" },
];
