/* Tasks — the work queue as a drag-and-drop Kanban board. */
import { Badge } from "@/components/ui/primitives";
import { KanbanBoard } from "@/components/tasks/KanbanBoard";

export default function TasksPage() {
  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Tasks</h1>
          <p className="text-sm text-muted">
            Drag tasks between columns to update their status.
          </p>
        </div>
        <Badge>Placeholder data</Badge>
      </div>

      <KanbanBoard />
    </div>
  );
}
