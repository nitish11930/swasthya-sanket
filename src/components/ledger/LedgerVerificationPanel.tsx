"use client";

import { useState } from "react";
import { verifyTransferChainAction, tamperTransferEventAction } from "@/features/audit/actions";

export default function LedgerVerificationPanel({ transferId, events }: { transferId: string; events: any[] }) {
  const [verificationResult, setVerificationResult] = useState<{ valid: boolean; brokenAtIndex?: number; message: string } | null>(null);
  const [tampering, setTampering] = useState(false);

  async function handleVerify() {
    try {
      const result = await verifyTransferChainAction(transferId);
      setVerificationResult(result);
    } catch (err: any) {
      setVerificationResult({ valid: false, message: err.message });
    }
  }

  async function handleTamper() {
    setTampering(true);
    try {
      // Find a DISPATCHED event to tamper with
      const dispatchIndex = events.findIndex(e => e.type === "DISPATCHED");
      if (dispatchIndex !== -1) {
        // Silently mutate the dispatched quantity without updating the hash
        await tamperTransferEventAction(transferId, dispatchIndex, { quantity: 150 });
        alert("Silent Tamper successful: Dispatched quantity altered to 150 without updating hash. Run verification to detect.");
        setVerificationResult(null); // Reset result so user can verify again
      } else {
        alert("No dispatched event found to tamper with.");
      }
    } finally {
      setTampering(false);
    }
  }

  return (
    <div className="card animate-fade-in">
      <div className="card-body">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
            <h3 className="text-title-md">Chain of Custody & Hash Ledger</h3>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn btn-warning" onClick={handleTamper} disabled={tampering} style={{ fontSize: 11, padding: "4px 8px" }}>
              Simulate Unauthorized Mutation
            </button>
            <button className="btn btn-primary" onClick={handleVerify} style={{ fontSize: 11, padding: "4px 8px" }}>
              Verify Ledger Integrity
            </button>
          </div>
        </div>

        {verificationResult && (
          <div style={{ 
            padding: 12, 
            borderRadius: 8, 
            marginBottom: 16,
            background: verificationResult.valid ? "var(--success-bg)" : "var(--danger-bg)",
            border: `1px solid ${verificationResult.valid ? "var(--success)" : "var(--danger)"}`,
            color: verificationResult.valid ? "var(--success-text)" : "var(--danger-text)",
            fontWeight: 600
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {verificationResult.valid ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>
              )}
              {verificationResult.valid ? "Valid: Cryptographic Chain Intact" : "Tamper Detected: Chain Broken"}
            </div>
            <p style={{ fontSize: 12, marginTop: 4, fontWeight: 400 }}>{verificationResult.message}</p>
          </div>
        )}
        
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {[...events].reverse().map((evt, idx) => {
            const isTampered = verificationResult?.valid === false && verificationResult?.brokenAtIndex === (events.length - 1 - idx);
            return (
              <div key={evt.id} style={{ 
                display: "flex", flexDirection: "column", gap: 6, padding: 12, 
                border: isTampered ? "2px solid var(--danger)" : "1px solid var(--border)", 
                borderRadius: 8,
                background: isTampered ? "var(--danger-bg)" : "transparent"
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span className="badge" style={{ background: "var(--bg-dim)", border: "1px solid var(--border)", fontFamily: "var(--font-mono)", fontSize: 10 }}>{evt.id}</span>
                    <span style={{ fontWeight: 600, fontSize: 13 }}>{evt.type}</span>
                  </div>
                  <span style={{ fontSize: 11, color: "var(--on-surface-tertiary)" }}>
                    {new Date(evt.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                
                <div style={{ fontSize: 12 }}>
                  <span style={{ color: "var(--on-surface-secondary)" }}>Entity:</span> {evt.entity} <br />
                  <span style={{ color: "var(--on-surface-secondary)" }}>Qty:</span> {evt.quantity} <br />
                  <span style={{ color: "var(--on-surface-secondary)" }}>Actor:</span> {evt.actorId} @ {evt.facility}
                </div>

                {evt.payload && Object.keys(evt.payload).length > 0 && (
                  <div style={{ background: 'var(--surface-sunken)', padding: 8, borderRadius: 4, fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--on-surface-secondary)' }}>
                    {JSON.stringify(evt.payload)}
                  </div>
                )}
                
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 8, borderTop: "1px dashed var(--border)" }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span style={{ fontSize: 10, color: "var(--on-surface-tertiary)" }}>PREV:</span>
                    <p className="text-mono" style={{ color: "var(--border-strong)", fontSize: 10 }} title={evt.previousHash}>
                      {evt.previousHash.substring(0, 12)}...
                    </p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span style={{ fontSize: 10, color: "var(--on-surface-tertiary)" }}>HASH:</span>
                    <p className="text-mono" style={{ color: "var(--primary-dark)", fontSize: 10, fontWeight: 700 }} title={evt.hash}>
                      {evt.hash.substring(0, 12)}...
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
