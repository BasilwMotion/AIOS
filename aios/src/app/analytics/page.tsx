/* Analytics — live company metrics from the database. */
import { LiveAnalytics } from "@/components/analytics/LiveAnalytics";

export default function AnalyticsPage() {
  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Analytics</h1>
        <p className="text-sm text-muted">Live company metrics, straight from the database.</p>
      </div>

      <LiveAnalytics />
    </div>
  );
}
