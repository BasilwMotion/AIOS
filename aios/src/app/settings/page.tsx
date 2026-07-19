/* Settings — company configuration (persists to the database). */
import { SettingsForm } from "@/components/settings/SettingsForm";

export default function SettingsPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Settings</h1>
        <p className="text-sm text-muted">Configure your AI company.</p>
      </div>

      <SettingsForm />
    </div>
  );
}
