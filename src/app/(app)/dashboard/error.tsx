"use client";

import { useEffect } from "react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Dashboard error:", error);
  }, [error]);

  return (
    <div style={{ padding: 24, textAlign: "center", color: "var(--error)" }}>
      <h2>Something went wrong on the Dashboard!</h2>
      <p style={{ marginTop: 8 }}>{error.message || "An unexpected error occurred."}</p>
      <button 
        className="btn btn-primary" 
        onClick={() => reset()} 
        style={{ marginTop: 16 }}
      >
        Try again
      </button>
    </div>
  );
}
