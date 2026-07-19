"use client";

/*
 * Top navigation bar: contextual page title (derived from the route),
 * a global search box, a primary action, notifications, and the user chip.
 * Client component so it can label itself from the active route.
 */
import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { primaryNav, secondaryNav } from "@/lib/nav";
import { PlusIcon } from "@/components/ui/icons";
import { Avatar } from "@/components/ui/primitives";
import { getBrowserSupabase } from "@/lib/supabase-browser";
import { TopbarSearch } from "@/components/layout/TopbarSearch";
import { TopbarNotifications } from "@/components/layout/TopbarNotifications";

function useSectionTitle() {
  const pathname = usePathname();
  const all = [...primaryNav, ...secondaryNav];
  const match =
    all.find((i) => (i.href === "/" ? pathname === "/" : pathname.startsWith(i.href))) ??
    primaryNav[0];
  return match;
}

export function Topbar() {
  const section = useSectionTitle();
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    const sb = getBrowserSupabase();
    if (!sb) return;
    sb.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? null));
  }, []);

  async function signOut() {
    const sb = getBrowserSupabase();
    if (sb) await sb.auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  return (
    <header className="flex h-16 shrink-0 items-center gap-4 border-b border-border bg-background/80 px-6 backdrop-blur">
      {/* Contextual title */}
      <div className="min-w-0">
        <h1 className="truncate text-base font-semibold text-foreground">
          {section.label}
        </h1>
        {section.hint && (
          <p className="truncate text-xs text-muted-2">{section.hint}</p>
        )}
      </div>

      {/* Search */}
      <div className="ml-4 hidden flex-1 md:flex">
        <TopbarSearch />
      </div>

      {/* Actions */}
      <div className="ml-auto flex items-center gap-2">
        <Link
          href="/tasks"
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-3.5 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
        >
          <PlusIcon width={18} height={18} />
          <span className="hidden sm:inline">New task</span>
        </Link>

        <TopbarNotifications />

        <div className="flex items-center gap-2 rounded-lg border border-border bg-surface py-1.5 pr-2.5 pl-1.5 text-sm text-foreground">
          <Avatar name={email ?? "You"} color="#6366f1" size={28} />
          <span className="hidden max-w-[140px] truncate font-medium sm:inline">
            {email ?? "Account"}
          </span>
        </div>
        <button
          onClick={signOut}
          title="Sign out"
          className="rounded-lg border border-border bg-surface px-3 py-2 text-xs font-medium text-muted transition-colors hover:text-foreground"
        >
          Sign out
        </button>
      </div>
    </header>
  );
}
