"use client";

import { useState, useEffect } from "react";
import { reconcileTransferAction } from "@/features/transfers/actions";
import { Role } from "@/domain/enums";
import { getDynamicExceptionsAction } from "./actions";

export default function ExceptionsClient() {
  const [filter, setFilter] = useState("all"); 
  const [showEmpty, setShowEmpty] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [isResolved, setIsResolved] = useState(false);
  const [resolving, setResolving] = useState(false);
  
  const [dynamicExceptions, setDynamicExceptions] = useState<any[]>([]);

  useEffect(() => {
    async function loadExceptions() {
      try {
        const data = await getDynamicExceptionsAction();
        setDynamicExceptions(data);
      } catch (err) {
        console.error(err);
      }
    }
    loadExceptions();
  }, []);

  const toggleEmptyState = () => {
    setShowEmpty(!showEmpty);
    if (showEmpty) setFilter("all");
  };

  const handleResolve = () => {
    setShowModal(false);
    setResolving(true);
    setTimeout(() => {
      setIsResolved(true);
      alert('Discrepancy signed with digital attestation. TR-00427 ledger reconciled.');
    }, 350);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", width: "100%", gap: 24 }}>
      {/* Operational Header Block */}
      <section style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ width: 10, height: 10, borderRadius: "50%", background: "var(--danger)" }} className="animate-pulse"></span>
            <span className="text-label-sm" style={{ color: "var(--danger)", fontWeight: 700 }}>Action Required</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 12px", borderRadius: 16, background: "var(--bg-dim)" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 21v-5h5"/></svg>
            <span className="text-label-sm">Polling Mesh • 12s ago</span>
          </div>
        </div>
        <div>
          <h1 className="text-headline-md" style={{ color: "var(--on-surface)" }}>Exceptions &amp; Resilience Triage</h1>
          <p className="text-body-md" style={{ marginTop: 4 }}>Operational discrepancies and synchronization alerts requiring clinical human review.</p>
        </div>

        {/* Freshness & Health Mini Telemetry */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, paddingTop: 8 }}>
          <div className="card" style={{ padding: 12 }}>
            <span className="text-label-sm" style={{ color: "var(--on-surface-secondary)" }}>Active Queue</span>
            <span className="text-telemetry-md" style={{ color: "var(--on-surface)", display: "block", marginTop: 4 }}>
              {String((isResolved ? 3 : 4) + dynamicExceptions.length).padStart(2, '0')}
            </span>
            <span className="text-label-sm" style={{ color: "var(--danger)", display: "flex", alignItems: "center", gap: 4, marginTop: 4 }}>
              ! {isResolved ? 0 + dynamicExceptions.length : 1 + dynamicExceptions.length} Urgent
            </span>
          </div>
          <div className="card" style={{ padding: 12 }}>
            <span className="text-label-sm" style={{ color: "var(--on-surface-secondary)" }}>Freshness Avg</span>
            <span className="text-telemetry-md" style={{ color: "var(--primary-dark)", display: "block", marginTop: 4 }}>94.2%</span>
            <span className="text-label-sm" style={{ color: "var(--on-surface-secondary)", marginTop: 4, display: "block" }}>1 Node Stale</span>
          </div>
          <div className="card" style={{ padding: 12 }}>
            <span className="text-label-sm" style={{ color: "var(--on-surface-secondary)" }}>Reconciled</span>
            <span className="text-telemetry-md" style={{ color: "var(--primary)", display: "block", marginTop: 4 }}>{isResolved ? "19" : "18"}</span>
            <span className="text-label-sm" style={{ color: "var(--primary-dark)", marginTop: 4, display: "block" }}>Today</span>
          </div>
        </div>

        {/* Filter Tabs */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, overflowX: "auto", paddingBottom: 4, paddingTop: 8, scrollbarWidth: "none" }}>
          <button 
            className="badge"
            style={{ padding: "6px 12px", border: "none", fontSize: 13, background: filter === 'all' && !showEmpty ? "var(--primary)" : "var(--bg-dim)", color: filter === 'all' && !showEmpty ? "#fff" : "var(--on-surface-secondary)" }}
            onClick={() => { setFilter('all'); setShowEmpty(false); }}
          >
            All <span style={{ background: filter === 'all' && !showEmpty ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.05)", borderRadius: 10, padding: "0 6px", marginLeft: 6, fontSize: 11 }}>{(isResolved ? 3 : 4) + dynamicExceptions.length}</span>
          </button>
          <button 
            className="badge"
            style={{ padding: "6px 12px", border: "none", fontSize: 13, background: filter === 'high' && !showEmpty ? "var(--primary)" : "var(--bg-dim)", color: filter === 'high' && !showEmpty ? "#fff" : "var(--on-surface-secondary)" }}
            onClick={() => { setFilter('high'); setShowEmpty(false); }}
          >
            High Severity <span style={{ color: filter === 'high' && !showEmpty ? "#fff" : "var(--danger)", marginLeft: 6 }}>{(isResolved ? 0 : 1) + dynamicExceptions.length}</span>
          </button>
          <button 
            className="badge"
            style={{ padding: "6px 12px", border: "none", fontSize: 13, background: filter === 'med' && !showEmpty ? "var(--primary)" : "var(--bg-dim)", color: filter === 'med' && !showEmpty ? "#fff" : "var(--on-surface-secondary)" }}
            onClick={() => { setFilter('med'); setShowEmpty(false); }}
          >
            Medium <span style={{ color: filter === 'med' && !showEmpty ? "#fff" : "var(--warning)", marginLeft: 6 }}>2</span>
          </button>
          <button 
            className="badge"
            style={{ padding: "6px 12px", border: "none", fontSize: 13, background: filter === 'stale' && !showEmpty ? "var(--primary)" : "var(--bg-dim)", color: filter === 'stale' && !showEmpty ? "#fff" : "var(--on-surface-secondary)" }}
            onClick={() => { setFilter('stale'); setShowEmpty(false); }}
          >
            Stale Data <span style={{ marginLeft: 6 }}>1</span>
          </button>
          <button 
            className="badge"
            style={{ padding: "6px 12px", border: "none", fontSize: 13, background: showEmpty ? "var(--primary)" : "var(--bg-dim)", color: showEmpty ? "#fff" : "var(--on-surface-secondary)" }}
            onClick={toggleEmptyState}
          >
            Demo Empty
          </button>
        </div>
      </section>

      {!showEmpty && (
        <section style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* DYNAMIC EXCEPTIONS (from Field Reports) */}
          {dynamicExceptions.map((ex, idx) => (
            (filter === 'all' || filter === 'high') && (
              <article key={ex.id} className="card" style={{ padding: 24, borderLeft: "4px solid var(--danger)" }}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span className="badge badge-danger">High Severity</span>
                    <span className="badge" style={{ background: "var(--bg-dim)", border: "none" }}>FIELD-ALERT</span>
                  </div>
                  <span className="text-label-sm" style={{ color: "var(--on-surface-secondary)" }}>
                    {new Date(ex.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                
                <h2 className="text-headline-sm">Critical Staffing Shortage</h2>
                
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
                  <span className="text-label-md" style={{ color: "var(--on-surface)", fontWeight: 600 }}>{ex.facilityName}</span>
                  <span style={{ color: "var(--on-surface-tertiary)" }}>•</span>
                  <span className="text-label-md" style={{ color: "var(--danger-text)", fontWeight: 600 }}>Staff Absent: {ex.staffName}</span>
                </div>
                
                <div style={{ background: "var(--bg-alt)", padding: 12, borderRadius: 8, marginTop: 16, display: "flex", flexDirection: "column", gap: 8 }}>
                  <p className="text-body-md" style={{ color: "var(--on-surface)" }}>
                    "{ex.transcript}"
                  </p>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--danger)", paddingTop: 4 }}>
                    <span className="text-label-md" style={{ fontWeight: 600, color: "var(--danger-text)" }}>This will impact local triage capacity. Predictive Engine suggests diverting non-critical stock routes.</span>
                  </div>
                </div>
              </article>
            )
          ))}
          
          {/* ITEM 1: High Severity */}
          {(!isResolved) && (filter === 'all' || filter === 'high') && (
            <article className="card" style={{ padding: 24, opacity: resolving ? 0.4 : 1, pointerEvents: resolving ? 'none' : 'auto', borderLeft: "4px solid var(--danger)" }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span className="badge badge-danger">High Severity</span>
                  <span className="badge" style={{ background: "var(--bg-dim)", border: "none" }}>TR-00427</span>
                </div>
                <span className="text-label-sm" style={{ color: "var(--on-surface-secondary)" }}>10:52 AM</span>
              </div>
              
              <h2 className="text-headline-sm">Transfer Receipt Discrepancy</h2>
              
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
                <span className="text-label-md" style={{ color: "var(--on-surface)", fontWeight: 600 }}>PHC Barmer-03</span>
                <span style={{ color: "var(--on-surface-tertiary)" }}>•</span>
                <span className="text-label-md" style={{ color: "var(--on-surface-secondary)" }}>Sector North Route</span>
              </div>
              
              <div style={{ background: "var(--bg-alt)", padding: 12, borderRadius: 8, marginTop: 16, display: "flex", flexDirection: "column", gap: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span className="text-label-md" style={{ color: "var(--on-surface-secondary)" }}>Source Node:</span>
                  <span className="text-label-md" style={{ color: "var(--on-surface)", fontWeight: 600 }}>Jodhpur-07 Central Depot</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span className="text-label-md" style={{ color: "var(--on-surface-secondary)" }}>Asset:</span>
                  <span className="text-label-md" style={{ color: "var(--on-surface)", fontWeight: 600 }}>Oral Rehydration Salts (ORS 20.5g)</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 8, marginTop: 8, borderTop: "1px solid var(--border)" }}>
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    <span className="text-label-sm" style={{ color: "var(--danger-text)" }}>Expected vs Received</span>
                    <span className="text-body-md" style={{ color: "var(--on-surface)", fontWeight: 700 }}>120 units → 100 units</span>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <span className="text-label-sm" style={{ color: "var(--danger)", fontWeight: 700 }}>DISCREPANCY</span>
                    <span className="text-headline-md" style={{ color: "var(--danger)", display: "block" }}>-20 pkts</span>
                  </div>
                </div>
              </div>
              
              <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 12, padding: 8, borderRadius: 8, background: "var(--bg-dim)" }}>
                <img style={{ width: 48, height: 48, borderRadius: 8, objectFit: "cover", flexShrink: 0 }} alt="Audit" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCIxwtGm3yezMsCAAleeixQYqTTHomkrd3pHQ2d0v8fHBVALNgS5je_xdeEiKAViw1qDaGywltuY_CGZbGjsIJ-e_Ieiavz2oFclLirERF3cRAlOxi9ckA6PJR3OAUbG_eijlkTtkyfZ5aDrbCwxdeEjbzwM8dIdLRc9qCqCoBTcyrdGFRzpP4Opj67omzGtrSutMscjnF8tVenX3-9R5dZZdxB6HdQNcTNb9rW-VIz2Fvz8m4AlwIS"/>
                <div style={{ display: "flex", flexDirection: "column", minWidth: 0, paddingRight: 8 }}>
                  <span className="text-label-md" style={{ color: "var(--on-surface)", fontWeight: 600 }}>Crates Physical Count Manifest</span>
                  <span className="text-label-sm" style={{ color: "var(--on-surface-secondary)" }}>Batch #ORS-RAJ-884 • Bill #49281</span>
                </div>
              </div>
              
              <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
                <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => setShowModal(true)}>
                  Resolve Discrepancy
                </button>
                <button className="btn btn-ghost-neutral" style={{ flex: 1 }} onClick={() => alert('Displaying verified chain of custody log with 4 signature stages.')}>
                  Chain of Custody
                </button>
              </div>
            </article>
          )}

          {/* ITEM 2: Demand Surge Anomaly */}
          {(filter === 'all' || filter === 'med') && (
            <article className="card" style={{ padding: 24, borderLeft: "4px solid var(--warning)" }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span className="badge badge-warning">Demand Spike</span>
                  <span className="badge" style={{ background: "var(--info-bg)", color: "var(--info-text)", border: "none" }}>Epidemiology Signal</span>
                </div>
                <span className="text-label-sm" style={{ color: "var(--on-surface-secondary)" }}>09:30 AM</span>
              </div>
              
              <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 8 }}>
                <h2 className="text-headline-sm">Unexpected Demand Anomaly</h2>
                <span className="badge" style={{ background: "var(--warning)", color: "#fff", border: "none" }}>3.4x Baseline</span>
              </div>
              
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
                <span className="text-label-md" style={{ color: "var(--on-surface)", fontWeight: 600 }}>PHC Chohtan-01</span>
                <span style={{ color: "var(--on-surface-tertiary)" }}>•</span>
                <span className="text-label-md" style={{ color: "var(--on-surface-secondary)" }}>Thar Border Fringe</span>
              </div>
              
              <div style={{ background: "var(--bg-alt)", padding: 12, borderRadius: 8, marginTop: 16, display: "flex", flexDirection: "column", gap: 8 }}>
                <p className="text-body-md" style={{ color: "var(--on-surface)" }}>
                  <strong style={{ color: "var(--warning-text)" }}>95 ORS packets</strong> dispensed within a compressed 4-hour window (typical baseline: 12-16 units/day).
                </p>
                <div style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--danger)", paddingTop: 4 }}>
                  <span className="text-label-md" style={{ fontWeight: 600, color: "var(--danger-text)" }}>Potential acute diarrhoeal cluster flagged in Ward 4 &amp; 7.</span>
                </div>
              </div>
              
              <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
                <button className="btn btn-warning" style={{ flex: 1, background: "var(--warning)", color: "#fff" }} onClick={() => alert('Simulation running: Modeling replenishment transit from Balotra depot.')}>
                  Trigger Surge Simulation
                </button>
                <button className="btn btn-ghost-neutral" style={{ flex: 1 }} onClick={() => alert('Connecting to Dr. Vikram Singh (MO, Chohtan-01) at +91 94140 XXXXX...')}>
                  Contact MO
                </button>
              </div>
            </article>
          )}

          {/* ITEM 3: Physical Count Mismatch */}
          {(filter === 'all' || filter === 'med') && (
            <article className="card" style={{ padding: 24, borderLeft: "4px solid var(--warning)" }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span className="badge badge-warning">Count Variance</span>
                  <span className="badge" style={{ background: "var(--bg-dim)", border: "none" }}>Cycle Audit</span>
                </div>
                <span className="text-label-sm" style={{ color: "var(--on-surface-secondary)" }}>Yesterday</span>
              </div>
              
              <h2 className="text-headline-sm">Physical Inventory Count Mismatch</h2>
              
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
                <span className="text-label-md" style={{ color: "var(--on-surface)", fontWeight: 600 }}>PHC Balotra-02</span>
                <span style={{ color: "var(--on-surface-tertiary)" }}>•</span>
                <span className="text-label-md" style={{ color: "var(--on-surface-secondary)" }}>Sub-store Room B</span>
              </div>
              
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, background: "var(--bg-alt)", padding: 12, borderRadius: 8, marginTop: 16, textAlign: "center" }}>
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <span className="text-label-sm" style={{ color: "var(--on-surface-secondary)" }}>Ledger Balance</span>
                  <span className="text-headline-sm" style={{ color: "var(--on-surface)", marginTop: 4 }}>410</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <span className="text-label-sm" style={{ color: "var(--on-surface-secondary)" }}>Physical Audit</span>
                  <span className="text-headline-sm" style={{ color: "var(--on-surface)", marginTop: 4 }}>385</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", background: "var(--danger-bg)", borderRadius: 6 }}>
                  <span className="text-label-sm" style={{ color: "var(--danger-text)", fontWeight: 600 }}>Delta</span>
                  <span className="text-headline-sm" style={{ color: "var(--danger)", marginTop: 4 }}>-25</span>
                </div>
              </div>
              
              <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
                <button className="btn btn-primary" style={{ width: "100%" }} onClick={() => alert('Secondary physical count scheduled for PHC Balotra-02 with Senior Pharmacist.')}>
                  Schedule Re-audit &amp; Freeze Ledger
                </button>
              </div>
            </article>
          )}

          {/* ITEM 4: Stale Data Warning */}
          {(filter === 'all' || filter === 'stale') && (
            <article className="card" style={{ padding: 24, borderLeft: "4px solid var(--info)" }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span className="badge" style={{ background: "var(--bg-dim)", border: "none" }}>Stale Telemetry</span>
                  <span className="badge" style={{ background: "var(--bg-alt)" }}>&gt;6 Hours</span>
                </div>
                <span className="text-label-sm" style={{ color: "var(--danger)", fontWeight: 700 }}>6h 40m Silence</span>
              </div>
              
              <h2 className="text-headline-sm">Frontline Sync Delayed</h2>
              
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
                <span className="text-label-md" style={{ color: "var(--on-surface)", fontWeight: 600 }}>Sub-Centre Ramsar-04</span>
                <span style={{ color: "var(--on-surface-tertiary)" }}>•</span>
                <span className="text-label-md" style={{ color: "var(--on-surface-secondary)" }}>Deep Desert Outpost</span>
              </div>
              
              <div style={{ background: "var(--bg-alt)", padding: 12, borderRadius: 8, marginTop: 16, display: "flex", flexDirection: "column", gap: 8 }}>
                <p className="text-body-md" style={{ color: "var(--on-surface)" }}>
                  Scheduled packet sync overdue. Sector tower reports routine power maintenance; expected restoration at 14:00.
                </p>
                <div style={{ display: "flex", alignItems: "center", gap: 6, padding: 8, borderRadius: 4, background: "var(--info-bg)", color: "var(--info-text)" }}>
                  <span className="text-label-md"><strong>Safe Safeguard:</strong> Autonomously running conservative fallback forecast based on historical 30-day baseline.</span>
                </div>
              </div>
              
              <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
                <button className="btn btn-ghost-neutral" style={{ width: "100%", background: "var(--bg-dim)" }} onClick={() => alert('Sending low-bandwidth SMS handshake ping to Ramsar-04 offline tablet.')}>
                  Send SMS Fallback Ping
                </button>
              </div>
            </article>
          )}
        </section>
      )}

      {/* Empty State View */}
      {showEmpty && (
        <section className="card" style={{ padding: 48, display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", justifyContent: "center" }}>
          <div style={{ width: 64, height: 64, borderRadius: "50%", background: "var(--success-bg)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--success-text)" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
          </div>
          <h2 className="text-headline-md" style={{ color: "var(--on-surface)" }}>Resilience Ledger Clear</h2>
          <p className="text-body-md" style={{ maxWidth: 360, marginTop: 8 }}>
            All 34 primary health centers and peripheral depots in Barmer district are operating within verified tolerance buffers.
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 16px", borderRadius: 16, background: "var(--bg-dim)", marginTop: 16 }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--success)" }}></span>
            <span className="text-label-md">Next automated validation run in 04:32</span>
          </div>
          <button className="btn btn-primary" style={{ marginTop: 24 }} onClick={toggleEmptyState}>
            Return to Active Exceptions
          </button>
        </section>
      )}

      {/* Guardrails Card */}
      <section className="card" style={{ padding: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: "var(--primary-light)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--primary-dark)" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          </div>
          <div>
            <h3 className="text-headline-sm">System Guardrails &amp; Ethics</h3>
            <span className="text-label-sm" style={{ color: "var(--primary)" }}>Non-Negotiable Architecture</span>
          </div>
        </div>
        <p className="text-body-md" style={{ lineHeight: 1.5 }}>
          System Guardrails: AI handles voice transcription and human-readable explanation. All inventory calculations, allocation constraints, and transfer optimizations are 100% deterministic.
        </p>
      </section>

      {/* Action Modal Sheet */}
      {showModal && (
        <div style={{ position: "fixed", inset: 0, zIndex: 50, background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
          <div className="card" style={{ width: "100%", maxWidth: 450, padding: 24, display: "flex", flexDirection: "column", gap: 16, maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 32, height: 32, borderRadius: "50%", background: "var(--danger-bg)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--danger-text)" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><path d="M9 16l2 2 4-4"/></svg>
                </div>
                <div>
                  <h3 className="text-headline-sm">Resolve Discrepancy</h3>
                  <span className="text-label-sm" style={{ color: "var(--on-surface-secondary)" }}>TR-00427 • ORS 20.5g</span>
                </div>
              </div>
              <button onClick={() => setShowModal(false)} style={{ background: "transparent", border: "none", cursor: "pointer" }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--on-surface)"><path d="M18 6L6 18M6 6l12 12"/></svg>
              </button>
            </div>
            
            <p className="text-body-md">Record the verified human finding to reconcile the ledger between Jodhpur-07 and PHC Barmer-03.</p>
            
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <label style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: 12, borderRadius: 8, background: "var(--bg-alt)", cursor: "pointer" }}>
                <input type="radio" name="discrepancy" defaultChecked style={{ marginTop: 2, accentColor: "var(--primary)" }} />
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <span className="text-label-md" style={{ color: "var(--on-surface)", fontWeight: 600 }}>Damaged in Transit (-20 pkts)</span>
                  <span className="text-body-md" style={{ fontSize: 13 }}>Moisture ingress during sandstorm; destroyed per SOP-MED-09.</span>
                </div>
              </label>
              <label style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: 12, borderRadius: 8, background: "var(--bg-alt)", cursor: "pointer" }}>
                <input type="radio" name="discrepancy" style={{ marginTop: 2, accentColor: "var(--primary)" }} />
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <span className="text-label-md" style={{ color: "var(--on-surface)", fontWeight: 600 }}>Vendor Short-Packed at Dispatch</span>
                  <span className="text-body-md" style={{ fontSize: 13 }}>Jodhpur depot manifest erroneous; adjust source debit balance.</span>
                </div>
              </label>
            </div>
            
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <label className="text-label-sm">Physician / Pharmacist Attestation</label>
              <textarea placeholder="Add mandatory remarks for district audit trail..." rows={2} style={{ padding: 12, borderRadius: 8, border: "1px solid var(--border)", background: "var(--bg-alt)", fontFamily: "inherit", resize: "none" }}></textarea>
            </div>
            
            <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
              <button className="btn btn-ghost-neutral" style={{ flex: 1, background: "var(--bg-dim)" }} onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleResolve}>Sign &amp; Reconcile</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
