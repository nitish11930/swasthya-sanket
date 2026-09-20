"use client";

import { useState, useEffect } from "react";
import { AppSettings, getStoredSettings, saveSettings } from "@/lib/settings";

export default function SettingsClient() {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [savedMessage, setSavedMessage] = useState(false);

  useEffect(() => {
    setSettings(getStoredSettings());
  }, []);

  if (!settings) return null; // Avoid hydration mismatch

  const handleSave = () => {
    saveSettings(settings);
    setSavedMessage(true);
    setTimeout(() => setSavedMessage(false), 2000);
  };

  return (
    <div className="card" style={{ maxWidth: 600 }}>
      <div className="card-body" style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        
        {/* Dashboard Auto-Refresh */}
        <div>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: "var(--on-surface)", marginBottom: 8 }}>Dashboard Telemetry Refresh</h3>
          <p style={{ fontSize: 12, color: "var(--on-surface-tertiary)", marginBottom: 12 }}>
            Automatically fetch fresh data on the Overview dashboard without reloading the page.
          </p>
          <div style={{ display: "flex", gap: 12 }}>
            {(["off", "30s", "60s"] as const).map(option => (
              <button 
                key={option}
                className={`btn ${settings.dashboardRefresh === option ? "btn-primary" : "btn-secondary"}`}
                onClick={() => setSettings({ ...settings, dashboardRefresh: option })}
                style={{ flex: 1, textTransform: "capitalize" }}
              >
                {option === "off" ? "Off" : option}
              </button>
            ))}
          </div>
        </div>

        <div className="divider" />

        {/* Data Table Density */}
        <div>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: "var(--on-surface)", marginBottom: 8 }}>Data Table Density</h3>
          <p style={{ fontSize: 12, color: "var(--on-surface-tertiary)", marginBottom: 12 }}>
            Adjust the padding in data tables (like Transfers and Ledger) to fit more rows on screen.
          </p>
          <div style={{ display: "flex", gap: 12 }}>
            {(["comfortable", "compact"] as const).map(option => (
              <button 
                key={option}
                className={`btn ${settings.tableDensity === option ? "btn-primary" : "btn-secondary"}`}
                onClick={() => setSettings({ ...settings, tableDensity: option })}
                style={{ flex: 1, textTransform: "capitalize" }}
              >
                {option}
              </button>
            ))}
          </div>
        </div>

        <div className="divider" />

        {/* Field Capture Sync Strategy */}
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: "var(--on-surface)" }}>Field Capture Sync Strategy</h3>
            <span className="badge" style={{ background: "var(--warning)", color: "white", fontSize: 10, padding: "2px 6px" }}>Offline-First</span>
          </div>
          <p style={{ fontSize: 12, color: "var(--on-surface-tertiary)", marginBottom: 12 }}>
            Determine when extracted field capture events are committed to the network.
          </p>
          <div style={{ display: "flex", gap: 12 }}>
            <button 
              className={`btn ${settings.fieldCaptureSync === "auto" ? "btn-primary" : "btn-secondary"}`}
              onClick={() => setSettings({ ...settings, fieldCaptureSync: "auto" })}
              style={{ flex: 1 }}
            >
              Auto-Sync
            </button>
            <button 
              className={`btn ${settings.fieldCaptureSync === "manual" ? "btn-primary" : "btn-secondary"}`}
              onClick={() => setSettings({ ...settings, fieldCaptureSync: "manual" })}
              style={{ flex: 1 }}
            >
              Manual Only
            </button>
          </div>
        </div>

        <div className="divider" />

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <p style={{ fontSize: 13, color: "var(--success)", opacity: savedMessage ? 1 : 0, transition: "opacity 0.2s" }}>
            Settings saved successfully!
          </p>
          <button className="btn btn-primary" onClick={handleSave} style={{ padding: "10px 24px" }}>
            Save Preferences
          </button>
        </div>

      </div>
    </div>
  );
}
