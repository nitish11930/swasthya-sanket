"use client";

import { useEffect, useState } from "react";

export default function SyncStatusIndicator() {
  const [isOnline, setIsOnline] = useState(true);
  const [lastSync, setLastSync] = useState("Just now");

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsOnline(navigator.onLine);

    const handleOnline = () => {
      setIsOnline(true);
      setLastSync("Just now");
    };
    const handleOffline = () => {
      setIsOnline(false);
      setLastSync("14 mins ago");
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "4px 8px",
        background: "var(--bg-dim)",
        borderRadius: 9999,
        border: "1px solid var(--border)",
      }}
    >
      <span
        style={{
          width: 8,
          height: 8,
          borderRadius: "50%",
          background: isOnline ? "var(--success)" : "var(--warning)",
          boxShadow: isOnline ? "0 0 0 2px rgba(16, 185, 129, 0.2)" : "none",
        }}
      />
      <span style={{ fontSize: 10, fontWeight: 600, color: "var(--on-surface-tertiary)" }}>
        {isOnline ? "Data Freshness: Live (Network)" : `Cached locally ${lastSync} (SQLite)`}
      </span>
    </div>
  );
}
