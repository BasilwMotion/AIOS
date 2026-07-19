/* Brain — the company's shared memory (live, every agent reads it). */
import { CompanyMemory } from "@/components/memory/CompanyMemory";

export default function BrainPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Brain</h1>
        <p className="text-sm text-muted">
          The company&apos;s shared memory. Everything here is read by every agent.
        </p>
      </div>

      <CompanyMemory />
    </div>
  );
}
