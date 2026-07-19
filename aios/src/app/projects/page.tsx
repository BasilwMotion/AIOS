/* Projects — derived live from tasks on the board. */
import { LiveProjects } from "@/components/projects/LiveProjects";

export default function ProjectsPage() {
  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Projects</h1>
        <p className="text-sm text-muted">Grouped from the tasks your team is working on.</p>
      </div>

      <LiveProjects />
    </div>
  );
}
