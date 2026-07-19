"use client";

/*
 * Left navigation rail (Discord-like).
 * Client component because it uses usePathname() to highlight the active route.
 */
import Link from "next/link";
import { usePathname } from "next/navigation";
import { primaryNav, secondaryNav, type NavItem } from "@/lib/nav";
import { BoltIcon } from "@/components/ui/icons";

function NavLink({ item, active }: { item: NavItem; active: boolean }) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      title={item.hint}
      aria-current={active ? "page" : undefined}
      className={`group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
        active
          ? "bg-surface-2 text-foreground"
          : "text-muted hover:bg-surface-2/60 hover:text-foreground"
      }`}
    >
      <Icon
        className={`transition-colors ${active ? "text-primary" : "text-muted-2 group-hover:text-foreground"}`}
      />
      <span>{item.label}</span>
    </Link>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <aside className="flex h-full w-64 shrink-0 flex-col border-r border-border bg-sidebar">
      {/* Brand */}
      <div className="flex items-center gap-2.5 px-5 py-5">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <BoltIcon width={20} height={20} />
        </span>
        <div className="leading-tight">
          <div className="text-sm font-semibold text-foreground">AIOS</div>
          <div className="text-xs text-muted-2">AI Company OS</div>
        </div>
      </div>

      {/* Primary nav */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-2">
        {primaryNav.map((item) => (
          <NavLink key={item.href} item={item} active={isActive(item.href)} />
        ))}
      </nav>

      {/* Secondary nav + workspace footer */}
      <div className="space-y-1 border-t border-border px-3 py-3">
        {secondaryNav.map((item) => (
          <NavLink key={item.href} item={item} active={isActive(item.href)} />
        ))}
      </div>
    </aside>
  );
}
