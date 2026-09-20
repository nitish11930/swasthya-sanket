import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import PageShell from "@/components/layout/PageShell";
import { getDashboardTelemetry, getLatestActiveTransfer, getProactiveOutcome, getInventoryOverview, getEpidemiologicalRisk, getWorkforceRoster } from "@/features/dashboard/actions";
import Link from "next/link";

import DashboardAutoRefresher from "./DashboardAutoRefresher";
import SyncStatusIndicator from "./SyncStatusIndicator";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "PHC overview dashboard — SWASTHYA-SANKET",
};

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) return null;

  const { name, role, roleLabel, phcName, employeeId, phcId } = session.user;

  const roleColors: Record<string, string> = {
    ANM: "#0D9488",
    MO: "#2563EB",
    PHC_HEAD: "#7C3AED",
    DISTRICT_OFFICER: "#EA580C",
    STATE_ADMIN: "#DC2626",
  };
  const roleColor = roleColors[role] ?? "#0D9488";

  // Fetch dynamic telemetry based on user's facility
  const telemetry = await getDashboardTelemetry(phcId);
  const activeTransfer = await getLatestActiveTransfer(phcId);
  const proactiveOutcome = await getProactiveOutcome(phcId);
  const inventory = await getInventoryOverview(phcId);
  const epiRisk = await getEpidemiologicalRisk(phcId);
  const roster = await getWorkforceRoster(phcId);

  return (
    <PageShell>
      <DashboardAutoRefresher />
      {/* Welcome + session info */}
      <div
        className="card animate-fade-in"
        style={{ background: "var(--primary-xlight)", border: "1px solid var(--primary-light)" }}
      >
        <div className="card-body" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
            <SyncStatusIndicator />
          </div>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
            <div>
              <p style={{ fontSize: 13, color: "var(--on-surface-tertiary)" }}>Welcome back,</p>
              <p className="text-headline-md">{name}</p>
            </div>
            <div style={{ textAlign: "right" }}>
              <span
                className="badge"
                style={{
                  background: `${roleColor}18`,
                  color: roleColor,
                  border: `1.5px solid ${roleColor}35`,
                  fontSize: 11,
                }}
              >
                {roleLabel ?? role}
              </span>
              <p style={{ fontSize: 10, color: "var(--on-surface-tertiary)", marginTop: 4 }}>{employeeId}</p>
            </div>
          </div>
          <div className="divider" />
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            <p style={{ fontSize: 12, color: "var(--primary-dark)", fontWeight: 500 }}>{phcName}</p>
          </div>
        </div>
      </div>

      {/* Summary stats */}
      <div
        className="stats-row animate-fade-in animate-delay-1"
      >
        <div className="stat-card">
          <p className="stat-value text-warning">{telemetry.activeQueue.toString().padStart(2, "0")}</p>
          <p className="stat-label">Active Queue</p>
          <p className="stat-sub">{telemetry.urgentCount} Urgent</p>
        </div>
        <div className="stat-card">
          <p className="stat-value text-success">{telemetry.freshnessAvg}</p>
          <p className="stat-label">Freshness Avg</p>
          <p className="stat-sub">Score</p>
        </div>
        <div className="stat-card">
          <p className="stat-value text-primary">{telemetry.reconciledToday}</p>
          <p className="stat-label">Reconciled</p>
          <p className="stat-sub">Today</p>
        </div>
      </div>

      {/* Critical Inventory Status */}
      <div className="card animate-fade-in animate-delay-1" style={{ marginTop: 8 }}>
        <div className="card-body">
          <h3 className="text-title-sm" style={{ marginBottom: 12 }}>Critical Inventory Status</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {inventory.map(item => (
              <div key={item.id}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>{item.medicineName}</span>
                  <span style={{ fontSize: 12, color: "var(--on-surface-secondary)" }}>
                    <strong style={{ color: "var(--on-surface)" }}>{item.balance}</strong> / {item.threshold} {item.unit}
                  </span>
                </div>
                <div style={{ width: "100%", height: 6, background: "var(--surface-sunken)", borderRadius: 3, overflow: "hidden" }}>
                  <div 
                    style={{ 
                      width: `${item.percentage}%`, 
                      height: "100%", 
                      background: item.statusColor,
                      borderRadius: 3,
                      transition: "width 1s ease-in-out"
                    }} 
                  />
                </div>
              </div>
            ))}
            {inventory.length === 0 && (
              <p style={{ fontSize: 12, color: "var(--on-surface-tertiary)" }}>No inventory data available.</p>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="animate-fade-in animate-delay-1" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 8, marginBottom: 8 }}>
        <Link href="/field-capture" style={{ textDecoration: 'none' }}>
          <div className="btn btn-secondary" style={{ width: "100%", padding: "12px", display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/></svg>
            <span style={{ fontSize: 11, fontWeight: 600 }}>Field Capture</span>
          </div>
        </Link>
        <Link href="/transfers" style={{ textDecoration: 'none' }}>
          <div className="btn btn-secondary" style={{ width: "100%", padding: "12px", display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3v18"/><path d="M10 18l7 4 7-4"/><path d="M7 21V3"/><path d="M14 6L7 2 0 6"/></svg>
            <span style={{ fontSize: 11, fontWeight: 600 }}>Transfers</span>
          </div>
        </Link>
      </div>

      {/* Clinical & Environmental Context Grid */}
      <div className="animate-fade-in animate-delay-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 8 }}>
        {/* Epidemiological Risk */}
        <div className="card" style={{ padding: 12, background: "var(--danger-bg)", border: "1px solid var(--danger-light)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--danger)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
            </svg>
            <span style={{ fontSize: 10, fontWeight: 800, color: "var(--danger)", textTransform: "uppercase", letterSpacing: "0.04em" }}>Epidemiological Risk</span>
          </div>
          <p style={{ fontSize: 14, fontWeight: 700, color: "var(--danger-text)" }}>{epiRisk.temperature} {epiRisk.condition}</p>
          <p style={{ fontSize: 11, color: "var(--danger)", marginTop: 4, fontWeight: 500 }}>{epiRisk.projectedImpact}</p>
        </div>

        {/* Workforce Roster */}
        <div className="card" style={{ padding: 12, background: roster.absentName ? "var(--warning-bg)" : "var(--success-bg)", border: `1px solid ${roster.absentName ? "var(--warning-light)" : "var(--success)"}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={roster.absentName ? "var(--warning)" : "var(--success)"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            <span style={{ fontSize: 10, fontWeight: 800, color: roster.absentName ? "var(--warning-text)" : "var(--success-text)", textTransform: "uppercase", letterSpacing: "0.04em" }}>Workforce Readiness</span>
          </div>
          <p style={{ fontSize: 14, fontWeight: 700, color: roster.absentName ? "var(--warning-text)" : "var(--success-text)" }}>{roster.onDuty} / {roster.total} {roster.role}s On Duty</p>
          <p style={{ fontSize: 11, color: roster.absentName ? "var(--warning-text)" : "var(--success-text)", marginTop: 4, fontWeight: 500 }}>
            {roster.absentName ? `Warning: ${roster.absentName} absent.` : "All frontline staff are present."}
          </p>
        </div>
      </div>
      
      {/* INTELLIGENT INSIGHTS NARRATIVE BANNER */}
      <div className="card animate-fade-in animate-delay-1" style={{ background: "linear-gradient(135deg, rgba(8, 127, 140, 0.1) 0%, rgba(8, 127, 140, 0.02) 100%)", border: "1px solid var(--primary-light)", padding: 20, marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
          <div style={{ background: "var(--primary)", color: "#FFF", padding: 12, borderRadius: "50%" }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          </div>
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: "var(--primary-dark)", marginBottom: 8, display: "flex", alignItems: "center", gap: 8 }}>
              System Insight: Impending Resource Bottleneck
              <span className="badge badge-error" style={{ fontSize: 10 }}>Action Required</span>
            </h3>
            <p style={{ fontSize: 13, color: "var(--on-surface-secondary)", lineHeight: "1.5", marginBottom: 12 }}>
              A <strong>Severe Heatwave</strong> in Barmer is projecting a 45% spike in pediatric dehydration cases. Simultaneously, field reports indicate <strong>Workforce Absenteeism</strong> at Barmer-03 PHC. The predictive model forecasts that Barmer-03 will exhaust its ORS stock within 48 hours under these compounding conditions.
            </p>
            <div style={{ display: "flex", gap: 12 }}>
              <a href="/engine" className="btn btn-primary" style={{ fontSize: 12, padding: "8px 16px" }}>
                Launch Decision Engine
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Active Transfer (if exists) */}
      {activeTransfer ? (
        <div className="card animate-fade-in animate-delay-2">
          <div className="transfer-header">
            <div>
              <p style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.8)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Trans-ID
              </p>
              <Link href={`/ledger?id=${activeTransfer.transId}`} style={{ textDecoration: 'none' }}>
                <p className="text-telemetry-md" style={{ color: "white", textDecoration: 'underline', cursor: 'pointer' }}>
                  {activeTransfer.transId}
                </p>
              </Link>
            </div>
            <span
              className="badge"
              style={{ background: "rgba(255,255,255,0.15)", color: "white", border: "1px solid rgba(255,255,255,0.3)", fontSize: 11 }}
            >
              ⚡ {activeTransfer.badge}
            </span>
          </div>

          <div className="card-body" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {/* Donor / Recipient */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div style={{ padding: "10px 12px", background: "var(--bg)", borderRadius: "var(--radius-sm)" }}>
                <p style={{ fontSize: 10, fontWeight: 600, color: "var(--on-surface-tertiary)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>
                  Donor Facility
                </p>
                <p style={{ fontSize: 13, fontWeight: 700, color: "var(--on-surface)" }}>{activeTransfer.donorFacility}</p>
              </div>
              <div style={{ padding: "10px 12px", background: "var(--primary-xlight)", borderRadius: "var(--radius-sm)", border: "1px solid var(--primary-light)" }}>
                <p style={{ fontSize: 10, fontWeight: 600, color: "var(--primary-dark)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>
                  ➤ Recipient
                </p>
                <p style={{ fontSize: 13, fontWeight: 700, color: "var(--primary-dark)" }}>{activeTransfer.recipientFacility}</p>
              </div>
            </div>

            {/* Medicine */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 12px", background: "var(--bg)", borderRadius: "var(--radius-sm)" }}>
              <p style={{ fontSize: 12, fontWeight: 600, color: "var(--on-surface-secondary)" }}>{activeTransfer.medicine}</p>
              <div style={{ textAlign: "right" }}>
                <p style={{ fontSize: 10, color: "var(--on-surface-tertiary)" }}>Authorized</p>
                <p className="text-telemetry-md text-primary">{activeTransfer.authorizedQty} <span style={{ fontSize: 12, fontWeight: 500 }}>units</span></p>
              </div>
            </div>

            {/* Audit Stepper */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <p style={{ fontSize: 10, fontWeight: 700, color: "var(--on-surface-tertiary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Audit Lifecycle Stepper
                </p>
                <p style={{ fontSize: 10, fontWeight: 600, color: "var(--primary)" }}>
                  Step {activeTransfer.currentStep} of {activeTransfer.totalSteps}
                </p>
              </div>
              
              <div className="stepper">
                {activeTransfer.lifecycle.map((step) => (
                  <div key={step.label} className={`stepper-step ${step.state === "completed" ? "completed" : ""}`}>
                    <div className={`stepper-dot ${step.state === "completed" ? "completed" : step.state === "current" ? "current" : ""}`}>
                      {step.state === "completed" ? (
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                      ) : step.state === "current" ? (
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="5"></circle>
                        </svg>
                      ) : ""}
                    </div>
                    <p className={`stepper-label ${step.state}`}>{step.label}</p>
                    <p className="stepper-time">{step.time}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="card animate-fade-in animate-delay-2" style={{ padding: 24, textAlign: 'center', background: 'var(--bg)', border: '1px dashed var(--border)' }}>
          <p style={{ color: 'var(--on-surface-tertiary)' }}>No active transfers at the moment.</p>
        </div>
      )}

      {/* Reconciliation Alert */}
      {activeTransfer?.isException && (
        <div className="card-warning card-body animate-fade-in animate-delay-3" style={{ borderRadius: "var(--radius-md)" }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: "50%", background: "var(--warning)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
                <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" stroke="white" strokeWidth="2" strokeLinecap="round" />
                <line x1="12" y1="17" x2="12.01" y2="17" stroke="white" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </div>
            <div>
              <p style={{ fontSize: 11, fontWeight: 800, color: "var(--warning-text)", textTransform: "uppercase", letterSpacing: "0.04em" }}>Reconciliation Alert</p>
              <p className="text-headline-sm" style={{ color: "var(--on-surface)", marginTop: 2 }}>Transfer Discrepancy Detected</p>
            </div>
          </div>
          <p style={{ fontSize: 13, color: "var(--on-surface-secondary)", lineHeight: "18px", marginBottom: 12 }}>
            <strong>{Math.abs(activeTransfer.discrepancy || 0)} units do not reconcile.</strong> Expected: {activeTransfer.dispatchedQty} units · Recorded at Gate: {activeTransfer.receivedQty} units.
          </p>
          <Link href={`/exceptions`} style={{ textDecoration: 'none' }}>
            <button type="button" className="btn btn-warning" style={{ width: "100%" }}>
              Resolve Discrepancy
            </button>
          </Link>
        </div>
      )}

      {/* Proactive Outcome */}
      <div className="card-proactive card-body animate-fade-in animate-delay-4" style={{ borderRadius: "var(--radius-md)" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 12 }}>
          <div>
            <p style={{ fontSize: 10, fontWeight: 700, color: "var(--primary-dark)", textTransform: "uppercase", letterSpacing: "0.05em" }}>✅ Proactive Outcome</p>
            <p className="text-headline-sm" style={{ color: "var(--primary-dark)", marginTop: 4 }}>Shortage Successfully Averted</p>
          </div>
          <p className="text-telemetry-lg text-primary">{proactiveOutcome.avertedShortage}</p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <div>
            <p style={{ fontSize: 11, color: "var(--on-surface-tertiary)", marginBottom: 2 }}>Current Physical Balance</p>
            <p className="text-telemetry-lg text-primary">{proactiveOutcome.currentBalance} <span style={{ fontSize: 12, fontWeight: 500 }}>ORS Packets</span></p>
          </div>
          <div>
            <p style={{ fontSize: 11, color: "var(--on-surface-tertiary)", marginBottom: 2 }}>Safety Threshold</p>
            <p className="text-telemetry-lg text-success">{proactiveOutcome.safetyThreshold} <span style={{ fontSize: 12, fontWeight: 500 }}>units</span></p>
            <p style={{ fontSize: 10, color: "var(--on-surface-tertiary)" }}>Safe Margin (+{proactiveOutcome.safeMargin})</p>
          </div>
        </div>
      </div>

    </PageShell>
  );
}
