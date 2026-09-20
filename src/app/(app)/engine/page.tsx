import type { Metadata } from "next";
import { Suspense } from "react";
import PageShell from "@/components/layout/PageShell";
import EngineClient from "./EngineClient";

export const metadata: Metadata = {
  title: "Engine — Forecast",
  description: "Deterministic shortage prediction engine — SWASTHYA-SANKET",
};

export default function EnginePage() {
  // ── HERO SCENARIO DATA ──
  // Per requirements: Stock=180, Buffer=100, Demand=80/day
  // Should deterministically evaluate to 24h to breach.
  const heroData = {
    targetFacilityName: "Barmer-03 PHC",
    initialStock: 180,
    safetyBuffer: 100,
    dailyDemand: 80,
    historicalDemand: 45,      // Showing a surge to trigger the ward/epidemiology signal
    bedOccupancyRate: 0.88,    // 88% occupancy
    staffAbsentCount: 1        // 1 ANM absent to trigger staffing bottleneck
  };

  return (
    <PageShell>
      <div className="animate-fade-in" style={{ marginBottom: 16 }}>
        <h1 className="text-headline-md">Decision Engine</h1>
        <p className="text-body-md" style={{ marginTop: 2 }}>
          Deterministic days-to-stockout model — no AI arithmetic.
        </p>
      </div>

      <Suspense fallback={<div>Loading Engine...</div>}>
        <EngineClient {...heroData} />
      </Suspense>
    </PageShell>
  );
}
