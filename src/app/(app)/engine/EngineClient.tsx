"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  generateEngineEvidence,
  optimizeIntervention,
  type EngineEvidence,
  type CounterfactualScenario,
  type ScenarioRanking,
} from "@/domain/index";
import { approveEngineTransferAction } from "./actions";

interface EngineClientProps {
  initialStock: number;
  safetyBuffer: number;
  dailyDemand: number;
  historicalDemand: number;
  bedOccupancyRate: number;
  staffAbsentCount: number;
  targetFacilityName: string;
}

// ─── Hero Demonstration Scenarios ─────────────────────────────────────────────
// Hardcoded definitions evaluated dynamically by deterministic domain functions.
const SCENARIOS: CounterfactualScenario[] = [
  {
    id: "OPT_3",
    type: "TRANSFER",
    transferQuantity: 120,
    donor: {
      phcId: "Jodhpur-07",
      currentStock: 620,
      safetyBuffer: 200,
      dailyDemand: 20,
      travelTimeHours: 4.167, // 4h 10m
    },
  },
  {
    id: "OPT_1",
    type: "DO_NOTHING",
    transferQuantity: 0,
  },
  {
    id: "OPT_2",
    type: "TRANSFER",
    transferQuantity: 80,
    donor: {
      phcId: "Balotra-02",
      currentStock: 410,
      safetyBuffer: 180,
      dailyDemand: 25,
      travelTimeHours: 3.0,
    },
  },
  {
    id: "OPT_4",
    type: "TRANSFER",
    transferQuantity: 220,
    donor: {
      phcId: "Balotra-02",
      currentStock: 410,
      safetyBuffer: 180,
      dailyDemand: 25,
      travelTimeHours: 3.0,
    },
  },
];

function travelLabel(hours: number): string {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

export default function EngineClient(props: EngineClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  // Deterministic Optimizer Run
  const optimizerResult = optimizeIntervention(
    SCENARIOS,
    props.targetFacilityName,
    props.initialStock,
    props.safetyBuffer,
    props.dailyDemand
  );

  // Initialize selected scenario safely for SSR
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>(optimizerResult.recommendedScenarioId);
  const [isMounted, setIsMounted] = useState(false);

  const [showFullEvidence, setShowFullEvidence] = useState(false);
  const [showAuditDrawer, setShowAuditDrawer] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isApproving, setIsApproving] = useState(false);
  const [approvedTransferId, setApprovedTransferId] = useState<string | null>(null);

  // Read URL/localStorage only on client after mount to prevent hydration mismatch
  useEffect(() => {
    setIsMounted(true);
    const param = new URLSearchParams(window.location.search).get("scenario");
    if (param && SCENARIOS.some((s) => s.id === param)) {
      setSelectedScenarioId(param);
      return;
    }
    const cached = localStorage.getItem("swasthya_selected_scenario");
    if (cached && SCENARIOS.some((s) => s.id === cached)) {
      setSelectedScenarioId(cached);
    }
  }, []);

  // Sync with URL & localStorage when scenario changes
  const handleScenarioSelect = (id: string) => {
    setSelectedScenarioId(id);
    if (typeof window !== "undefined") {
      localStorage.setItem("swasthya_selected_scenario", id);
    }
    startTransition(() => {
      router.replace(`?scenario=${id}`, { scroll: false });
    });
  };

  // Sync state if URL changes externally
  useEffect(() => {
    const param = searchParams.get("scenario");
    if (param && param !== selectedScenarioId && SCENARIOS.some((s) => s.id === param)) {
      setSelectedScenarioId(param);
    }
  }, [searchParams, selectedScenarioId]);

  const selectedScenario = SCENARIOS.find((s) => s.id === selectedScenarioId) || SCENARIOS[0];
  const selectedRanking = optimizerResult.allRankings.find((r) => r.scenarioId === selectedScenarioId)!;
  const selectedEval = selectedRanking.evaluation;

  // Evidence trail
  const evidence: EngineEvidence[] = generateEngineEvidence(
    props.dailyDemand,
    props.historicalDemand,
    props.bedOccupancyRate,
    props.staffAbsentCount
  );

  const isRecommended = selectedScenario.id === optimizerResult.recommendedScenarioId;
  const isRejected = !selectedEval.isFeasible;
  const isCritical = selectedEval.recipientBreachTimeHours !== null && selectedEval.recipientBreachTimeHours <= 24;

  const handleApprovePlan = async () => {
    if (!selectedEval.isFeasible) {
      alert("Cannot approve an infeasible transfer plan that violates safety constraints.");
      return;
    }
    if (approvedTransferId) {
      // Already approved, navigate to transfers
      router.push(`/transfers`);
      return;
    }
    setIsApproving(true);
    try {
      const res = await approveEngineTransferAction({
        donorPhcId: optimizerResult.donorPhcId || "UNKNOWN",
        recipientFacilityName: props.targetFacilityName,
        quantity: optimizerResult.recommendedQuantity,
        medicineName: "ORS",
        scenarioId: selectedScenario.id,
        expectedEffect: optimizerResult.expectedEffect,
      });
      if (res.success && res.transferId) {
        setApprovedTransferId(res.transferId);
        setToastMessage(`Transfer ${res.transferId} created & approved. Redirecting to Transfers Hub...`);
        setTimeout(() => {
          router.push("/transfers");
        }, 2500);
      } else {
        alert(res.error || "Failed to approve transfer.");
      }
    } catch (err: any) {
      alert(err.message || "Unexpected error.");
    } finally {
      setIsApproving(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

      {/* ── TOAST NOTIFICATION ──────────────────────────────────────────────── */}
      {toastMessage && (
        <div
          id="actionToast"
          style={{
            position: "fixed",
            bottom: 24,
            right: 24,
            zIndex: 9999,
            background: "var(--on-surface)",
            color: "var(--surface)",
            padding: "12px 18px",
            borderRadius: "var(--radius-md)",
            boxShadow: "0 8px 24px rgba(0,0,0,0.18)",
            display: "flex",
            alignItems: "center",
            gap: 12,
            border: "1px solid var(--border)",
            animation: "fadeIn 0.2s ease-in-out",
          }}
        >
          <span style={{ color: "var(--success)", fontSize: 20 }}>✓</span>
          <div>
            <p style={{ fontSize: 13, fontWeight: 700, margin: 0 }}>Transfer Requisition Dispatched</p>
            <p style={{ fontSize: 11, opacity: 0.85, margin: 0 }}>{toastMessage}</p>
          </div>
          <button
            onClick={() => setToastMessage(null)}
            style={{ background: "none", border: "none", color: "#FFF", cursor: "pointer", marginLeft: 8, fontSize: 16 }}
          >
            ×
          </button>
        </div>
      )}

      {/* ── OPERATIONAL ANCHOR BANNER ────────────────────────────────────────── */}
      <div
        className={`animate-fade-in ${isCritical || isRejected ? "card-danger" : "card-success"}`}
        style={{ padding: 18, borderRadius: "var(--radius-md)" }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 8, marginBottom: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span
              style={{
                width: 10,
                height: 10,
                borderRadius: "50%",
                background: isCritical || isRejected ? "var(--danger)" : "var(--success)",
                display: "inline-block",
                boxShadow: "0 0 0 3px rgba(220, 38, 38, 0.2)",
              }}
            />
            <span style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.06em", color: isCritical || isRejected ? "var(--danger-text)" : "var(--success-text)" }}>
              {isCritical ? "Predictive Shortage Detected" : isRejected ? "Constraint Invalidation Alert" : "Optimal Safe Status"}
            </span>
          </div>

          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              padding: "4px 10px",
              borderRadius: 9999,
              background: isCritical ? "var(--warning-bg)" : "var(--success-bg)",
              color: isCritical ? "var(--warning-text)" : "var(--success-text)",
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            ⏱ Action Required Prior to Night Shift
          </span>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 12 }}>
          <div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
              <span style={{ fontSize: 32, fontWeight: 800, fontFamily: "var(--font-display)", color: isCritical || isRejected ? "var(--danger-text)" : "var(--success-text)" }}>
                {selectedEval.recipientBreachTimeHours !== null
                  ? `${selectedEval.recipientBreachTimeHours.toFixed(1)}h`
                  : "No Breach"}
              </span>
              <span style={{ fontSize: 16, fontWeight: 600, color: "var(--on-surface)" }}>
                to ORS Safety Breach
              </span>
            </div>
            <p style={{ fontSize: 12, color: "var(--on-surface-secondary)", marginTop: 4 }}>
              Target Facility: <strong>{props.targetFacilityName} (Maternal & Child Wing)</strong>
            </p>
          </div>

          <div
            style={{
              padding: "6px 12px",
              borderRadius: "var(--radius-sm)",
              background: "var(--surface)",
              border: "1px solid var(--border)",
              fontSize: 12,
              fontWeight: 700,
              color: "var(--primary-dark)",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <span style={{ color: "var(--primary)" }}>✓</span>
            <span>Deterministic Confidence: 99.4%</span>
          </div>
        </div>

        {/* Telemetry Metric Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
            gap: 8,
            marginTop: 14,
            paddingTop: 12,
            borderTop: "1px solid rgba(0,0,0,0.06)",
          }}
        >
          <div style={{ background: "var(--surface)", padding: 10, borderRadius: "var(--radius-sm)" }}>
            <span style={{ fontSize: 10, textTransform: "uppercase", fontWeight: 700, color: "var(--on-surface-tertiary)" }}>Current Stock</span>
            <p style={{ fontSize: 18, fontWeight: 800, color: "var(--on-surface)", margin: "2px 0 0" }}>180 <span style={{ fontSize: 12, fontWeight: 500 }}>pkts</span></p>
            <span style={{ fontSize: 10, color: "var(--danger)" }}>-40 today</span>
          </div>

          <div style={{ background: "var(--surface)", padding: 10, borderRadius: "var(--radius-sm)" }}>
            <span style={{ fontSize: 10, textTransform: "uppercase", fontWeight: 700, color: "var(--on-surface-tertiary)" }}>Safety Threshold</span>
            <p style={{ fontSize: 18, fontWeight: 800, color: "var(--danger)", margin: "2px 0 0" }}>{props.safetyBuffer} <span style={{ fontSize: 12, fontWeight: 500 }}>pkts</span></p>
            <span style={{ fontSize: 10, color: "var(--on-surface-tertiary)" }}>Static mandate</span>
          </div>

          <div style={{ background: "var(--surface)", padding: 10, borderRadius: "var(--radius-sm)" }}>
            <span style={{ fontSize: 10, textTransform: "uppercase", fontWeight: 700, color: "var(--on-surface-tertiary)" }}>Demand Forecast</span>
            <p style={{ fontSize: 18, fontWeight: 800, color: "var(--warning-text)", margin: "2px 0 0" }}>{props.dailyDemand} <span style={{ fontSize: 12, fontWeight: 500 }}>pkts/d</span></p>
            <span style={{ fontSize: 10, color: "var(--warning-text)" }}>1.6x heatwave surge</span>
          </div>

          <div style={{ background: "var(--surface)", padding: 10, borderRadius: "var(--radius-sm)" }}>
            <span style={{ fontSize: 10, textTransform: "uppercase", fontWeight: 700, color: "var(--on-surface-tertiary)" }}>Inpatient Beds</span>
            <p style={{ fontSize: 18, fontWeight: 800, color: "var(--on-surface)", margin: "2px 0 0" }}>{Math.round(props.bedOccupancyRate * 100)}%</p>
            <span style={{ fontSize: 10, color: "var(--warning-text)" }}>Acute GI cluster</span>
          </div>

          <div style={{ background: "var(--surface)", padding: 10, borderRadius: "var(--radius-sm)" }}>
            <span style={{ fontSize: 10, textTransform: "uppercase", fontWeight: 700, color: "var(--on-surface-tertiary)" }}>ANM Staffing</span>
            <p style={{ fontSize: 18, fontWeight: 800, color: "var(--on-surface)", margin: "2px 0 0" }}>2 / 3</p>
            <span style={{ fontSize: 10, color: "var(--on-surface-tertiary)" }}>Sita A. on leave</span>
          </div>
        </div>
      </div>

      {/* ── OPTIMIZER RECOMMENDATION BANNER ──────────────────────────────────── */}
      <div
        className="card animate-fade-in animate-delay-1"
        style={{
          padding: 16,
          borderLeft: "5px solid var(--primary)",
          background: "var(--primary-xlight)",
          borderRadius: "var(--radius-md)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 8 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 14 }}>🔬</span>
              <p style={{ fontSize: 11, fontWeight: 800, color: "var(--primary-dark)", textTransform: "uppercase", letterSpacing: "0.06em", margin: 0 }}>
                Deterministic Optimizer Recommendation
              </p>
            </div>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: "var(--on-surface)", marginTop: 4, marginBottom: 2 }}>
              Transfer {optimizerResult.recommendedQuantity} ORS from {optimizerResult.donorPhcId}
            </h3>
            <p style={{ fontSize: 12, color: "var(--on-surface-secondary)", margin: 0 }}>
              {optimizerResult.expectedEffect}
            </p>
            {optimizerResult.donorEffect && (
              <p style={{ fontSize: 12, color: "var(--primary-dark)", fontWeight: 600, marginTop: 3 }}>
                Donor Stability: {optimizerResult.donorEffect}
              </p>
            )}
          </div>
          <span className="badge badge-synced" style={{ fontWeight: 800, padding: "5px 12px", borderRadius: 9999 }}>
            Optimal Safe
          </span>
        </div>

        {optimizerResult.constraintViolations.length > 0 && (
          <div style={{ marginTop: 12, paddingTop: 10, borderTop: "1px solid var(--border)" }}>
            <p style={{ fontSize: 11, fontWeight: 800, color: "var(--danger)", margin: "0 0 4px" }}>
              ⛔ Hard Constraint Enforced (Rejected by Backend Domain Engine):
            </p>
            {optimizerResult.constraintViolations.map((v, i) => (
              <p key={i} style={{ fontSize: 11, color: "var(--danger-text)", fontFamily: "var(--font-mono)", margin: "2px 0" }}>
                {v}
              </p>
            ))}
          </div>
        )}
      </div>

      {/* ── STOCK TRAJECTORY CURVE / CHART CARD ─────────────────────────────── */}
      <div className="card animate-fade-in animate-delay-2" style={{ padding: 18, borderRadius: "var(--radius-md)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 18, color: "var(--primary)" }}>📈</span>
            <h3 className="text-headline-sm" style={{ margin: 0 }}>Stock Trajectory with Interventions</h3>
          </div>
          <span style={{ fontSize: 11, color: "var(--on-surface-tertiary)", background: "var(--bg-dim)", padding: "2px 8px", borderRadius: 9999 }}>
            T-0 = 14:00 IST
          </span>
        </div>

        {/* Depletion timeline SVG */}
        {/* Depletion timeline SVG */}
        <div
          style={{
            width: "100%",
            height: 190,
            background: "var(--surface-variant)",
            borderRadius: "var(--radius-sm)",
            position: "relative",
            overflow: "hidden",
            padding: "8px 4px 4px",
            border: "1px solid var(--border)",
            display: "flex",
            flexDirection: "column"
          }}
        >
          {(() => {
            // Dynamic Math Model
            const T_MAX = 66; // Render up to 66 hours for some right padding
            const mapX = (t: number) => (t / T_MAX) * 400;
            
            // Dynamically scale Y axis based on the CURRENT selected scenario
            // to maximize visual impact without distorting the math.
            const selectedQ = selectedScenario.transferQuantity || 0;
            const peakStock = props.initialStock + selectedQ;
            const MAX_STOCK = Math.max(props.initialStock * 1.2, peakStock);
            
            // Map MAX_STOCK -> Y=10, 0 -> Y=105
            const mapY = (s: number) => 105 - (s / (MAX_STOCK || 1)) * 95;
            const Dh = props.dailyDemand / 24;

            const generatePath = (scenario: CounterfactualScenario) => {
              const startY = mapY(props.initialStock);
              if (scenario.type === "DO_NOTHING" || !scenario.donor) {
                const endStock = props.initialStock - Dh * T_MAX;
                return `M 0 ${startY} L ${mapX(T_MAX)} ${mapY(endStock)}`;
              } else {
                const t_arr = scenario.donor.travelTimeHours;
                const Q = scenario.transferQuantity;
                const arrStockPre = props.initialStock - Dh * t_arr;
                const arrStockPost = arrStockPre + Q;
                const endStock = arrStockPost - Dh * (T_MAX - t_arr);
                return `M 0 ${startY} L ${mapX(t_arr)} ${mapY(arrStockPre)} L ${mapX(t_arr)} ${mapY(arrStockPost)} L ${mapX(T_MAX)} ${mapY(endStock)}`;
              }
            };

            const generatePolygon = (scenario: CounterfactualScenario) => {
              const startY = mapY(props.initialStock);
              if (scenario.type === "DO_NOTHING" || !scenario.donor) {
                const endStock = props.initialStock - Dh * T_MAX;
                return `0,${startY} ${mapX(T_MAX)},${mapY(endStock)} ${mapX(T_MAX)},130 0,130`;
              } else {
                const t_arr = scenario.donor.travelTimeHours;
                const Q = scenario.transferQuantity;
                const arrStockPre = props.initialStock - Dh * t_arr;
                const arrStockPost = arrStockPre + Q;
                const endStock = arrStockPost - Dh * (T_MAX - t_arr);
                // Clamp the polygon to x=400 at the end to ensure it fills neatly
                return `0,${startY} ${mapX(t_arr)},${mapY(arrStockPre)} ${mapX(t_arr)},${mapY(arrStockPost)} ${mapX(T_MAX)},${mapY(endStock)} 400,130 0,130`;
              }
            };

            const doNothingBreachT = (props.initialStock - props.safetyBuffer) / Dh;

            return (
              <>
                {/* Critical Safety Floor dashed line */}
                <div
                  style={{
                    position: "absolute",
                    top: `${(mapY(props.safetyBuffer) / 130) * 100}%`,
                    left: 0,
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    zIndex: 10,
                    pointerEvents: "none",
                    padding: "0 8px",
                  }}
                >
                  <div style={{ flex: 1, borderTop: "2px dashed var(--danger)" }} />
                  <span
                    style={{
                      background: "var(--danger)",
                      color: "#FFFFFF",
                      fontSize: 10,
                      fontWeight: 700,
                      padding: "2px 6px",
                      borderRadius: 4,
                      boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                      whiteSpace: "nowrap",
                    }}
                  >
                    Critical Safety Floor ({props.safetyBuffer} units)
                  </span>
                </div>

                {/* SVG Depletion Curves */}
                <svg
                  viewBox="0 0 400 130"
                  preserveAspectRatio="none"
                  style={{ width: "100%", flex: 1, display: "block" }}
                >
                  <defs>
                    <linearGradient id="optimalTealGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#087f8c" stopOpacity="0.4" />
                      <stop offset="100%" stopColor="#087f8c" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>

                  {/* Shaded buffer for selected scenario */}
                  <polygon fill="url(#optimalTealGradient)" points={generatePolygon(selectedScenario)} />

                  {/* Scenario paths */}
                  {SCENARIOS.map((scenario) => {
                    const isSelected = scenario.id === selectedScenarioId;
                    const isOptimal = scenario.id === optimizerResult.recommendedScenarioId;
                    
                    let strokeColor = "var(--on-surface-tertiary)";
                    let strokeDash = "3 3";
                    let strokeWidth = isSelected ? "4" : "2";
                    let opacity = isSelected ? 1 : 0.6;
                    
                    if (scenario.type === "DO_NOTHING") {
                      strokeColor = "var(--danger)";
                      strokeDash = "4 4";
                    } else if (isOptimal) {
                      strokeColor = "var(--primary)";
                      strokeDash = "none";
                      strokeWidth = isSelected ? "4.5" : "3";
                      opacity = isSelected ? 1 : 0.8;
                    } else if (scenario.transferQuantity < 100) {
                      strokeColor = "var(--warning)";
                    } else {
                      strokeColor = "var(--danger)";
                      strokeDash = "2 2";
                    }

                    return (
                      <path
                        key={scenario.id}
                        d={generatePath(scenario)}
                        fill="none"
                        stroke={strokeColor}
                        strokeDasharray={strokeDash}
                        strokeWidth={strokeWidth}
                        strokeLinecap="round"
                        opacity={opacity}
                      />
                    );
                  })}

                  {/* Transfer Arrival Marker for selected scenario */}
                  {selectedScenario.donor && (
                    <circle 
                      cx={mapX(selectedScenario.donor.travelTimeHours)} 
                      cy={mapY(props.initialStock - Dh * selectedScenario.donor.travelTimeHours + selectedScenario.transferQuantity)} 
                      r="6" 
                      fill="var(--primary-dark)" 
                    />
                  )}
                </svg>

                {/* Timeline Axis Labels */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: 10,
                    color: "var(--on-surface-tertiary)",
                    padding: "4px 6px 4px",
                    zIndex: 20,
                    position: "relative",
                    background: "var(--surface-variant)"
                  }}
                >
                  <span style={{ flex: 1 }}>Now ({props.initialStock}u)</span>
                  
                  {selectedScenario.donor && (
                    <span style={{ position: "absolute", left: `${(mapX(selectedScenario.donor.travelTimeHours) / 400) * 100}%`, transform: "translateX(-50%)", color: "var(--primary-dark)", fontWeight: 700 }}>
                      Transfer (+{selectedScenario.donor.travelTimeHours.toFixed(1)}h)
                    </span>
                  )}
                  
                  {doNothingBreachT > 0 && doNothingBreachT < T_MAX && (
                    <span style={{ position: "absolute", left: `${(mapX(doNothingBreachT) / 400) * 100}%`, transform: "translateX(-50%)", color: "var(--danger)", fontWeight: 700 }}>
                      {doNothingBreachT.toFixed(1)}h Breach
                    </span>
                  )}
                  
                  <span style={{ flex: 1, textAlign: "right", color: "var(--success-text)", fontWeight: 700 }}>
                    60h End-Peak
                  </span>
                </div>
              </>
            );
          })()}
        </div>

        {/* Legend */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 16, marginTop: 12, fontSize: 11, color: "var(--on-surface-tertiary)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ width: 14, height: 2, background: "var(--danger)", display: "inline-block" }} />
            <span style={{ fontWeight: selectedScenarioId === "OPT_1" ? 700 : 400 }}>Do Nothing (24h breach)</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ width: 14, height: 2, background: "var(--warning)", display: "inline-block" }} />
            <span style={{ fontWeight: selectedScenarioId === "OPT_2" ? 700 : 400 }}>Balotra-02 (+80 ORS)</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ width: 16, height: 4, borderRadius: 2, background: "var(--primary)", display: "inline-block" }} />
            <span style={{ fontWeight: selectedScenarioId === "OPT_3" ? 800 : 600, color: "var(--on-surface)" }}>
              Option 3: Jodhpur-07 (+120 ORS, Optimal)
            </span>
          </div>
        </div>
      </div>

      {/* ── DETERMINISTIC EVIDENCE DRAWER (WHY IS THIS HAPPENING?) ─────────── */}
      <div className="card animate-fade-in animate-delay-2" style={{ padding: 18, borderRadius: "var(--radius-md)" }}>
        <div
          onClick={() => setShowAuditDrawer((v) => !v)}
          style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 18, color: "var(--primary)" }}>📋</span>
            <h3 className="text-headline-sm" style={{ margin: 0 }}>Why is this happening? (Deterministic Trail)</h3>
          </div>
          <button style={{ background: "none", border: "none", fontSize: 16, color: "var(--on-surface-tertiary)", cursor: "pointer" }}>
            {showAuditDrawer ? "▲" : "▼"}
          </button>
        </div>

        {showAuditDrawer && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 14 }}>
            <div style={{ display: "flex", gap: 12, padding: 12, background: "var(--surface-variant)", borderRadius: "var(--radius-sm)" }}>
              <div style={{ width: 24, height: 24, borderRadius: "50%", background: "var(--primary)", color: "#FFF", fontSize: 11, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                1
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "var(--on-surface)" }}>Frontline Dispensation Surge</span>
                  <span style={{ fontSize: 11, color: "var(--on-surface-tertiary)" }}>11:42 IST</span>
                </div>
                <p style={{ fontSize: 12, color: "var(--on-surface-secondary)", margin: "4px 0 0" }}>
                  Field telemetry recorded 40 ORS sachets issued in 4 hours. Outpatient logs show temperature exceeded 43.5°C.
                </p>
              </div>
            </div>

            <div style={{ display: "flex", gap: 12, padding: 12, background: "var(--surface-variant)", borderRadius: "var(--radius-sm)" }}>
              <div style={{ width: 24, height: 24, borderRadius: "50%", background: "var(--primary)", color: "#FFF", fontSize: 11, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                2
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "var(--on-surface)" }}>Ward Inflow & GI Influx</span>
                  <span style={{ fontSize: 11, color: "var(--on-surface-tertiary)" }}>12:30 IST</span>
                </div>
                <p style={{ fontSize: 12, color: "var(--on-surface-secondary)", margin: "4px 0 0" }}>
                  Bed 3 admitted with acute gastroenteritis; 3 pediatric dehydration cases triaged at emergency triage desk.
                </p>
              </div>
            </div>

            <div style={{ display: "flex", gap: 12, padding: 12, background: "var(--surface-variant)", borderRadius: "var(--radius-sm)" }}>
              <div style={{ width: 24, height: 24, borderRadius: "50%", background: "var(--primary)", color: "#FFF", fontSize: 11, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                3
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "var(--on-surface)" }}>Staffing Bottleneck</span>
                  <span style={{ fontSize: 11, color: "var(--on-surface-tertiary)" }}>Roster</span>
                </div>
                <p style={{ fontSize: 12, color: "var(--on-surface-secondary)", margin: "4px 0 0" }}>
                  1 Auxiliary Nurse Midwife absent, limiting home-rehydration counselling & increasing inpatient ORS reliance.
                </p>
              </div>
            </div>

            <div style={{ display: "flex", gap: 12, padding: 12, background: "var(--warning-bg)", borderRadius: "var(--radius-sm)" }}>
              <div style={{ width: 24, height: 24, borderRadius: "50%", background: "var(--warning)", color: "#FFF", fontSize: 11, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                4
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "var(--on-surface)" }}>Mathematical Runout Model</span>
                  <span style={{ fontSize: 11, color: "var(--warning-text)", fontWeight: 800 }}>T - 24.0h</span>
                </div>
                <p style={{ fontSize: 12, color: "var(--on-surface)", fontWeight: 600, fontFamily: "var(--font-mono)", margin: "4px 0 0" }}>
                  Stock equation: 180 units - (80 units/day × 1.0 day) = 100 units floor breached in precisely 24.0 hours.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── COUNTERFACTUAL INTERVENTION ENGINE — 4 SCENARIOS ────────────────── */}
      <div className="card animate-fade-in animate-delay-3" style={{ padding: 18, borderRadius: "var(--radius-md)" }}>
        <div style={{ marginBottom: 14 }}>
          <h2 className="text-headline-sm" style={{ margin: "0 0 4px" }}>Counterfactual Intervention Engine</h2>
          <p style={{ fontSize: 12, color: "var(--on-surface-secondary)", margin: 0 }}>
            Select and simulate prospective transfers to verify non-breach across donor facilities before dispatch.
            Infeasible options are rejected by backend domain logic, not merely visually hidden.
          </p>
        </div>

        <div id="scenario-selector" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {SCENARIOS.map((scenario) => {
            const ranking = optimizerResult.allRankings.find((r) => r.scenarioId === scenario.id)!;
            const ev = ranking.evaluation;
            const isSelected = selectedScenarioId === scenario.id;
            const isRec = scenario.id === optimizerResult.recommendedScenarioId;
            const isFeas = ev.isFeasible;

            return (
              <label
                key={scenario.id}
                onClick={() => handleScenarioSelect(scenario.id)}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                  padding: 14,
                  borderRadius: "var(--radius-md)",
                  cursor: "pointer",
                  border: isSelected
                    ? "2px solid var(--primary)"
                    : isRec
                      ? "1.5px solid var(--success)"
                      : "1px solid var(--border)",
                  background: isSelected
                    ? "var(--primary-xlight)"
                    : isRec
                      ? "linear-gradient(90deg, var(--surface) 0%, rgba(22, 163, 74, 0.05) 100%)"
                      : "var(--surface)",
                  boxShadow: isSelected ? "0 4px 12px rgba(13, 148, 136, 0.12)" : "0 1px 3px rgba(0,0,0,0.04)",
                  transition: "all 0.15s ease",
                  opacity: !isFeas && !isSelected ? 0.75 : 1,
                }}
              >
                {/* Header Row */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <input
                      type="radio"
                      name="simulation_option"
                      checked={isSelected}
                      onChange={() => handleScenarioSelect(scenario.id)}
                      style={{ accentColor: "var(--primary)", width: 18, height: 18 }}
                    />
                    <div>
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 800,
                          textTransform: "uppercase",
                          letterSpacing: "0.04em",
                          color: isRec
                            ? "var(--primary)"
                            : !isFeas
                              ? "var(--danger)"
                              : "var(--on-surface-tertiary)",
                        }}
                      >
                        {scenario.id === "OPT_3"
                          ? "Option 3 (Algorithmic Choice)"
                          : scenario.id === "OPT_1"
                            ? "Option 1"
                            : scenario.id === "OPT_2"
                              ? "Option 2"
                              : "Option 4"}
                      </span>
                      <h3 style={{ fontSize: 14, fontWeight: 700, color: "var(--on-surface)", margin: "2px 0 0" }}>
                        {scenario.type === "DO_NOTHING"
                          ? "Do Nothing (Current Trajectory)"
                          : `Transfer ${scenario.transferQuantity} ORS from ${scenario.donor?.phcId}`}
                      </h3>
                    </div>
                  </div>

                  {/* Badge */}
                  <div>
                    {!isFeas ? (
                      <span className="badge badge-danger" style={{ fontWeight: 800, padding: "4px 10px" }}>
                        Rejected: Donor Breach
                      </span>
                    ) : isRec ? (
                      <span className="badge badge-synced" style={{ fontWeight: 800, padding: "4px 10px", display: "inline-flex", alignItems: "center", gap: 4 }}>
                        <span>✓</span> Optimal Safe
                      </span>
                    ) : scenario.id === "OPT_1" ? (
                      <span className="badge badge-danger" style={{ fontWeight: 800, padding: "4px 10px" }}>
                        Unsafe - Breach Confirmed
                      </span>
                    ) : (
                      <span className="badge badge-queued" style={{ fontWeight: 800, padding: "4px 10px" }}>
                        Partial Protection
                      </span>
                    )}
                  </div>
                </div>

                {/* Sub-grid with metric boxes matching Stitch */}
                {scenario.id === "OPT_3" && (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 8, marginTop: 4 }}>
                    <div style={{ background: "var(--surface-variant)", padding: 8, borderRadius: "var(--radius-sm)" }}>
                      <span style={{ fontSize: 10, color: "var(--on-surface-tertiary)" }}>Recipient Outcome</span>
                      <p style={{ fontSize: 14, fontWeight: 800, color: "var(--success-text)", margin: "2px 0" }}>+36h Safe Window</p>
                      <span style={{ fontSize: 10, color: "var(--on-surface-secondary)" }}>Breach delayed to 60h</span>
                    </div>
                    <div style={{ background: "var(--surface-variant)", padding: 8, borderRadius: "var(--radius-sm)" }}>
                      <span style={{ fontSize: 10, color: "var(--on-surface-tertiary)" }}>Donor Stock Stability</span>
                      <p style={{ fontSize: 14, fontWeight: 700, color: "var(--on-surface)", margin: "2px 0" }}>500 remain</p>
                      <span style={{ fontSize: 10, color: "var(--success-text)", fontWeight: 600 }}>&gt;25 days buffer safe</span>
                    </div>
                    <div style={{ background: "var(--surface-variant)", padding: 8, borderRadius: "var(--radius-sm)" }}>
                      <span style={{ fontSize: 10, color: "var(--on-surface-tertiary)" }}>Transit Timeline</span>
                      <p style={{ fontSize: 14, fontWeight: 700, color: "var(--on-surface)", margin: "2px 0" }}>4h 10m ETA</p>
                      <span style={{ fontSize: 10, color: "var(--success-text)", fontWeight: 600 }}>Arrives 19.8h before breach</span>
                    </div>
                    <div style={{ background: "var(--surface-variant)", padding: 8, borderRadius: "var(--radius-sm)" }}>
                      <span style={{ fontSize: 10, color: "var(--on-surface-tertiary)" }}>Donor Facility</span>
                      <p style={{ fontSize: 14, fontWeight: 700, color: "var(--on-surface)", margin: "2px 0" }}>SDH Jodhpur-07</p>
                      <span style={{ fontSize: 10, color: "var(--on-surface-secondary)" }}>Cold chain: A1</span>
                    </div>
                  </div>
                )}

                {scenario.id === "OPT_1" && (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 8, marginTop: 4 }}>
                    <div style={{ background: "var(--surface-variant)", padding: 8, borderRadius: "var(--radius-sm)" }}>
                      <span style={{ fontSize: 10, color: "var(--on-surface-tertiary)" }}>Recipient Status</span>
                      <p style={{ fontSize: 14, fontWeight: 800, color: "var(--danger)", margin: "2px 0" }}>Breach at 24.0h</p>
                      <span style={{ fontSize: 10, color: "var(--on-surface-secondary)" }}>Stock hits 0 at 54h</span>
                    </div>
                    <div style={{ background: "var(--surface-variant)", padding: 8, borderRadius: "var(--radius-sm)" }}>
                      <span style={{ fontSize: 10, color: "var(--on-surface-tertiary)" }}>Donor Impact</span>
                      <p style={{ fontSize: 14, fontWeight: 700, color: "var(--on-surface)", margin: "2px 0" }}>None</p>
                      <span style={{ fontSize: 10, color: "var(--on-surface-secondary)" }}>No vehicles dispatched</span>
                    </div>
                    <div style={{ background: "var(--surface-variant)", padding: 8, borderRadius: "var(--radius-sm)" }}>
                      <span style={{ fontSize: 10, color: "var(--on-surface-tertiary)" }}>Clinical Exposure</span>
                      <p style={{ fontSize: 14, fontWeight: 800, color: "var(--danger)", margin: "2px 0" }}>~34 Patients</p>
                      <span style={{ fontSize: 10, color: "var(--on-surface-secondary)" }}>Risk of dehydration referrals</span>
                    </div>
                  </div>
                )}

                {scenario.id === "OPT_2" && (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 8, marginTop: 4 }}>
                    <div style={{ background: "var(--surface-variant)", padding: 8, borderRadius: "var(--radius-sm)" }}>
                      <span style={{ fontSize: 10, color: "var(--on-surface-tertiary)" }}>Recipient Extension</span>
                      <p style={{ fontSize: 14, fontWeight: 800, color: "var(--warning-text)", margin: "2px 0" }}>+24h Delay</p>
                      <span style={{ fontSize: 10, color: "var(--on-surface-secondary)" }}>Breaches at 48h</span>
                    </div>
                    <div style={{ background: "var(--surface-variant)", padding: 8, borderRadius: "var(--radius-sm)" }}>
                      <span style={{ fontSize: 10, color: "var(--on-surface-tertiary)" }}>Donor Stock Left</span>
                      <p style={{ fontSize: 14, fontWeight: 700, color: "var(--warning-text)", margin: "2px 0" }}>330 units</p>
                      <span style={{ fontSize: 10, color: "var(--warning-text)" }}>Leaves only 4.2 days</span>
                    </div>
                    <div style={{ background: "var(--surface-variant)", padding: 8, borderRadius: "var(--radius-sm)" }}>
                      <span style={{ fontSize: 10, color: "var(--on-surface-tertiary)" }}>Transit Duration</span>
                      <p style={{ fontSize: 14, fontWeight: 700, color: "var(--on-surface)", margin: "2px 0" }}>3h 0m</p>
                      <span style={{ fontSize: 10, color: "var(--on-surface-secondary)" }}>Quick road transfer</span>
                    </div>
                  </div>
                )}

                {scenario.id === "OPT_4" && (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 8, marginTop: 4 }}>
                    <div style={{ background: "var(--surface-variant)", padding: 8, borderRadius: "var(--radius-sm)" }}>
                      <span style={{ fontSize: 10, color: "var(--on-surface-tertiary)" }}>Recipient Extension</span>
                      <p style={{ fontSize: 14, fontWeight: 800, color: "var(--success-text)", margin: "2px 0" }}>+66h Buffer</p>
                      <span style={{ fontSize: 10, color: "var(--on-surface-secondary)" }}>Full outbreak coverage</span>
                    </div>
                    <div style={{ background: "var(--danger-bg)", padding: 8, borderRadius: "var(--radius-sm)" }}>
                      <span style={{ fontSize: 10, color: "var(--danger-text)" }}>Donor Danger</span>
                      <p style={{ fontSize: 14, fontWeight: 800, color: "var(--danger)", margin: "2px 0" }}>190 units</p>
                      <span style={{ fontSize: 10, color: "var(--danger-text)", fontWeight: 600 }}>Breaches Balotra's 180 margin</span>
                    </div>
                    <div style={{ background: "var(--danger-bg)", padding: 8, borderRadius: "var(--radius-sm)" }}>
                      <span style={{ fontSize: 10, color: "var(--danger-text)" }}>Rule Violations</span>
                      <p style={{ fontSize: 14, fontWeight: 800, color: "var(--danger)", margin: "2px 0" }}>1 Invalidation</p>
                      <span style={{ fontSize: 10, color: "var(--danger-text)", fontWeight: 600 }}>Rule R-08 (Donor Stability)</span>
                    </div>
                  </div>
                )}

                {/* Constraint rejection callout */}
                {!isFeas && ev.rejectionReason && (
                  <div style={{ background: "var(--danger-bg)", padding: "8px 12px", borderRadius: "var(--radius-sm)", marginTop: 4 }}>
                    <p style={{ fontSize: 11, color: "var(--danger)", fontWeight: 700, margin: 0 }}>
                      ⛔ {ev.rejectionReason}
                    </p>
                  </div>
                )}
              </label>
            );
          })}
        </div>
      </div>

      {/* ── ACTIVE DISPATCH ROUTE ────────────────────────────────────────────── */}
      <div className="card animate-fade-in animate-delay-3" style={{ padding: 18, borderRadius: "var(--radius-md)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 18, color: "var(--primary)" }}>🚚</span>
            <h3 className="text-headline-sm" style={{ margin: 0 }}>
              Active Dispatch Route ({selectedScenario.id === "OPT_3" ? "Option 3" : selectedScenario.id === "OPT_2" ? "Option 2" : "Alternative Route"})
            </h3>
          </div>
          <span
            style={{
              fontSize: 11,
              fontWeight: 800,
              padding: "4px 10px",
              borderRadius: 9999,
              background: "var(--success-bg)",
              color: "var(--success-text)",
            }}
          >
            {selectedScenario.id === "OPT_3" ? "NH-112 Direct Corridor" : "NH-25 Transit Corridor"}
          </span>
        </div>

        <div
          style={{
            height: 140,
            borderRadius: "var(--radius-sm)",
            background: "linear-gradient(135deg, #17343b 0%, #087f8c 100%)",
            color: "#FFFFFF",
            padding: 16,
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-end",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Subtle map / route grid effect */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              opacity: 0.1,
              backgroundImage: "radial-gradient(#FFFFFF 1px, transparent 1px)",
              backgroundSize: "16px 16px",
            }}
          />

          <div style={{ position: "relative", zIndex: 2, display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 8 }}>
            <div>
              <span style={{ fontSize: 11, color: "#79d4e2", fontWeight: 700, textTransform: "uppercase" }}>
                Route Transit: {selectedScenario.donor?.phcId ?? "Jodhpur SDH"} ➔ {props.targetFacilityName}
              </span>
              <p style={{ fontSize: 14, fontWeight: 700, color: "#FFFFFF", margin: "2px 0 0" }}>
                {selectedScenario.donor?.phcId === "Balotra-02"
                  ? "110 km • ETA: 3h 0m (Van RJ-04-GA-0842)"
                  : "198 km • ETA: 4h 10m (Van RJ-04-GA-1102)"}
              </p>
            </div>
            <div
              style={{
                background: "rgba(255,255,255,0.92)",
                color: "var(--on-surface)",
                fontSize: 11,
                fontWeight: 700,
                padding: "4px 8px",
                borderRadius: 4,
              }}
            >
              Temp: 22.4°C (Normal)
            </div>
          </div>
        </div>
      </div>

      {/* ── PRIMARY DECISION ACTION CARD — APPROVED CLINICAL RESPONSE ────────── */}
      <div className="card animate-fade-in animate-delay-4" style={{ padding: 18, borderRadius: "var(--radius-md)", boxShadow: "0 4px 14px rgba(0,0,0,0.06)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12, marginBottom: 14 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 20, color: "var(--primary)" }}>🛡</span>
              <h2 className="text-headline-sm" style={{ margin: 0, color: "var(--on-surface)" }}>
                Approved Clinical Response: Transfer {optimizerResult.recommendedQuantity} ORS
              </h2>
            </div>
            <p style={{ fontSize: 12, color: "var(--on-surface-secondary)", margin: "4px 0 0" }}>
              {optimizerResult.donorPhcId} SDH ➔ {props.targetFacilityName} • Electronic Requisition ID:{" "}
              <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, color: "var(--primary)" }}>TR-00427</span>
            </p>
          </div>

          <div
            style={{
              padding: "6px 12px",
              borderRadius: "var(--radius-sm)",
              background: "var(--success-bg)",
              color: "var(--success-text)",
              fontSize: 13,
              fontWeight: 800,
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <span>+</span>
            <span>36 Hours Safe Coverage</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
          <button
            id="approveBtn"
            onClick={handleApprovePlan}
            disabled={!selectedEval.isFeasible || isApproving}
            style={{
              flex: 1,
              minWidth: 220,
              minHeight: 46,
              background: approvedTransferId ? "var(--success)" : selectedEval.isFeasible ? "var(--primary)" : "var(--border)",
              color: selectedEval.isFeasible || approvedTransferId ? "#FFFFFF" : "var(--on-surface-tertiary)",
              border: "none",
              borderRadius: "var(--radius-sm)",
              fontSize: 13,
              fontWeight: 700,
              cursor: selectedEval.isFeasible ? "pointer" : "not-allowed",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              transition: "all 0.15s ease",
            }}
          >
            <span>{approvedTransferId ? "✓" : isApproving ? "⏳" : "✓"}</span>
            <span>
              {approvedTransferId
                ? `Approved (${approvedTransferId}) — View in Transfers`
                : isApproving
                  ? "Creating Transfer..."
                  : selectedEval.isFeasible
                    ? `Approve & Create Transfer`
                    : `Blocked: Violates Rule R-08`}
            </span>
          </button>

          <button
            id="auditBtn"
            onClick={() => setShowFullEvidence((v) => !v)}
            style={{
              minHeight: 46,
              padding: "0 16px",
              background: "var(--surface-variant)",
              color: "var(--primary-dark)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-sm)",
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <span>🔍</span>
            <span>{showFullEvidence ? "Hide Audit Rules" : "Inspect Audit Rules"}</span>
          </button>
        </div>

        {/* Deterministic System Guarantee Text */}
        <div style={{ marginTop: 14, paddingTop: 12, borderTop: "1px solid var(--border)", display: "flex", alignItems: "flex-start", gap: 8 }}>
          <span style={{ fontSize: 16, color: "var(--primary)", marginTop: 1 }}>🔒</span>
          <p style={{ fontSize: 11, color: "var(--on-surface-secondary)", margin: 0, lineHeight: 1.5 }}>
            <strong style={{ color: "var(--on-surface)" }}>Deterministic System Guarantee:</strong> Mathematical runout calculations and safety floors are hardcoded via state public health directives. Large language models and AI classifiers are strictly restricted to field voice-note transcription and patient triage extraction; all dispatch proposals must satisfy rule-set{" "}
            <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, color: "var(--primary-dark)" }}>R-01 through R-12</span>.
          </p>
        </div>
      </div>

      {/* ── EVIDENCE PANEL (COLLAPSIBLE TRACE) ────────────────────────────────── */}
      <div className="card animate-fade-in animate-delay-4" style={{ padding: 18, borderRadius: "var(--radius-md)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div>
            <h3 className="text-headline-sm" style={{ margin: 0 }}>Evidence Panel & Calculation Audit</h3>
            <p style={{ fontSize: 11, color: "var(--on-surface-tertiary)", margin: "2px 0 0" }}>
              Mathematical proof and step-by-step constraint verification for selected option ({selectedScenario.id}).
            </p>
          </div>
          <button
            onClick={() => setShowFullEvidence((v) => !v)}
            style={{ fontSize: 12, color: "var(--primary)", background: "none", border: "none", cursor: "pointer", fontWeight: 700 }}
          >
            {showFullEvidence ? "Collapse Details" : "Show Full Derivation"}
          </button>
        </div>

        {/* Calculation evidence for selected scenario */}
        <div
          style={{
            background: "var(--surface-variant)",
            padding: 14,
            borderRadius: "var(--radius-sm)",
            border: "1px solid var(--border)",
            fontFamily: "var(--font-mono)",
            fontSize: 11,
            color: "var(--on-surface)",
            lineHeight: 1.6,
          }}
        >
          <div style={{ marginBottom: 10, paddingBottom: 10, borderBottom: "1px dashed var(--border)" }}>
            <strong style={{ color: "var(--primary-dark)" }}>[RECIPIENT CALCULATION: {props.targetFacilityName}]</strong><br />
            Initial Stock: {props.initialStock} | Safety Buffer: {props.safetyBuffer} | Daily Demand: {props.dailyDemand}/day<br />
            Transfer In Quantity: +{selectedScenario.transferQuantity} ORS<br />
            Projected Inventory: {selectedEval.recipientProjectedStock} ORS<br />
            Safety Breach Time: {selectedEval.recipientBreachTimeHours !== null ? `${selectedEval.recipientBreachTimeHours.toFixed(1)}h` : "None"}<br />
            Expected Shortage Delay: {selectedEval.expectedShortageDelayHours !== null ? `+${selectedEval.expectedShortageDelayHours.toFixed(1)}h` : "0.0h"}<br />
            Coverage Gain: +{selectedEval.coverageGain} ORS
          </div>

          {selectedScenario.type !== "DO_NOTHING" && selectedScenario.donor && (
            <div style={{ marginBottom: 10, paddingBottom: 10, borderBottom: "1px dashed var(--border)" }}>
              <strong style={{ color: "var(--primary-dark)" }}>[DONOR CALCULATION: {selectedScenario.donor.phcId}]</strong><br />
              Initial Stock: {selectedScenario.donor.currentStock} | Safety Buffer: {selectedScenario.donor.safetyBuffer} | Local Demand: {selectedScenario.donor.dailyDemand}/day<br />
              Remaining Stock After Transfer: {selectedEval.donorRemainingStock}<br />
              Safety Margin: <span style={{ color: (selectedEval.donorSafetyMargin ?? 0) < 0 ? "var(--danger)" : "var(--success-text)", fontWeight: 700 }}>{selectedEval.donorSafetyMargin} units</span><br />
              Donor Breach Risk: <span style={{ color: selectedEval.donorBreachRisk ? "var(--danger)" : "var(--success-text)", fontWeight: 700 }}>{selectedEval.donorBreachRisk ? "TRUE (BREACH INDUCED)" : "FALSE (SAFE)"}</span><br />
              Transit Travel Time: {travelLabel(selectedEval.travelTimeHours ?? 0)} ({selectedEval.travelTimeHours?.toFixed(2)}h)
            </div>
          )}

          <div>
            <strong style={{ color: "var(--primary-dark)" }}>[FEASIBILITY & DECISION STATUS]</strong><br />
            Feasibility:{" "}
            <span style={{ color: selectedEval.isFeasible ? "var(--success-text)" : "var(--danger)", fontWeight: 800 }}>
              {selectedEval.isFeasible ? "APPROVED CLINICAL RESPONSE" : "REJECTED BY SAFETY CONSTRAINT"}
            </span><br />
            {selectedEval.rejectionReason ? (
              <span style={{ color: "var(--danger)", fontWeight: 700 }}>
                Constraint Violation: {selectedEval.rejectionReason}
              </span>
            ) : (
              <span style={{ color: "var(--success-text)" }}>
                Hard Constraints: Passed (Donor stability preserved &gt; 24h operational floor).
              </span>
            )}
          </div>
        </div>

        {/* Full optimizer execution trace */}
        {showFullEvidence && (
          <div
            style={{
              marginTop: 12,
              background: "#0F2424",
              color: "#A8D4D2",
              padding: 14,
              borderRadius: "var(--radius-sm)",
              fontFamily: "var(--font-mono)",
              fontSize: 10.5,
              lineHeight: 1.7,
              whiteSpace: "pre-wrap",
            }}
          >
            <div style={{ color: "#FFFFFF", fontWeight: 700, marginBottom: 6 }}>
              // DETERMINISTIC CONSTRAINT-BASED OPTIMIZER EXECUTION LOG:
            </div>
            {optimizerResult.calculationEvidence.join("\n")}
          </div>
        )}
      </div>

    </div>
  );
}
