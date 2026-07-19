/* Automation — schedule agents to run on a cadence + execution history. */
import { Badge } from "@/components/ui/primitives";
import { AutomationManager } from "@/components/automation/AutomationManager";

export default function AutomationPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Automation</h1>
          <p className="text-sm text-muted">
            Schedule agents to run daily, weekly, or on a custom interval — while you sleep.
          </p>
        </div>
        <Badge>Live</Badge>
      </div>

      <AutomationManager />
    </div>
  );
}
