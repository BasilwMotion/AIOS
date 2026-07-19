/* Dashboard — live company overview. */
import { LiveDashboard } from "@/components/dashboard/LiveDashboard";

export default function DashboardPage() {
  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted">Your AI company at a glance.</p>
      </div>

      <LiveDashboard />
    </div>
  );
}
