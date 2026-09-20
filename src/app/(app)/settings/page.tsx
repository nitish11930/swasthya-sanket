import type { Metadata } from "next";
import PageShell from "@/components/layout/PageShell";
import SettingsClient from "./SettingsClient";

export const metadata: Metadata = {
  title: "Settings",
  description: "Configure your SWASTHYA-SANKET preferences",
};

export default function SettingsPage() {
  return (
    <PageShell>
      <div className="animate-fade-in">
        <h1 className="text-display-sm" style={{ marginBottom: 4 }}>System Settings</h1>
        <p style={{ color: "var(--on-surface-tertiary)", marginBottom: 24 }}>
          Adjust application behavior and layout preferences.
        </p>
        <SettingsClient />
      </div>
    </PageShell>
  );
}
