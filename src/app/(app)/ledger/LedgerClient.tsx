"use client";

import { useState, useEffect } from "react";
import { Role } from "@/domain/enums";
import { TransferDetail, TransferEvent, TransferStatus } from "@/domain/transfers";
import {
  getTransferDetailAction,
  approveTransferAction,
  rejectTransferAction,
  dispatchTransferAction,
  markInTransitAction,
  receiveTransferAction,
  reconcileTransferAction
} from "@/features/transfers/actions";
import { exportLedgerToCSV, exportLedgerToPDF } from "@/lib/export-utils";

export default function LedgerClient() {
  const HERO_ID = "TR-00427";
  const [transfer, setTransfer] = useState<TransferDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Simulation controls
  const [activeRole, setActiveRole] = useState<Role>(Role.DISTRICT_OFFICER);
  const [activeUserId, setActiveUserId] = useState("user-do-01");
  const [receiveInput, setReceiveInput] = useState<number>(100);
  const [reconcileNotes, setReconcileNotes] = useState<string>("Factual investigation complete. Missing stock unaccounted for.");

  useEffect(() => {
    loadTransfer();
  }, []);

  async function loadTransfer() {
    try {
      setLoading(true);
      const data = await getTransferDetailAction(HERO_ID);
      setTransfer(data);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleAction(actionFn: () => Promise<TransferDetail | undefined>) {
    try {
      setError(null);
      const updated = await actionFn();
      if (updated) setTransfer(updated);
    } catch (err: any) {
      setError(err.message);
    }
  }

  if (loading && !transfer) {
    return <div className="p-4">Loading transfer data...</div>;
  }

  if (!transfer) {
    return <div className="p-4 text-error">Transfer not found.</div>;
  }

  const isDiscrepancy = transfer.status === "EXCEPTION" || (transfer.status === "RECONCILED" && transfer.discrepancy !== 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      
      {/* Role Switcher (Simulation) */}
      <div className="card-subtle card-body" style={{ display: 'flex', gap: 12, alignItems: 'center', background: 'var(--surface-sunken)' }}>
        <p style={{ fontSize: 12, fontWeight: 600 }}>Simulate User Role:</p>
        <select 
          value={activeRole} 
          onChange={(e) => setActiveRole(e.target.value as Role)}
          style={{ padding: "4px 8px", borderRadius: 4, border: '1px solid var(--border)' }}
        >
          <option value={Role.SUPER_ADMIN}>Super Admin (All Access)</option>
          <option value={Role.DISTRICT_OFFICER}>District Officer (Approver)</option>
          <option value={Role.PHC_ADMIN}>PHC Admin (Dispatcher/Receiver)</option>
          <option value={Role.FIELD_WORKER}>Field Worker (No Approval Access)</option>
        </select>
        <div style={{ marginLeft: "auto", fontSize: 12, color: 'var(--error)' }}>
          {error && <span className="animate-fade-in">{error}</span>}
        </div>
      </div>

      {/* 1. Header Card */}
      <div className="card animate-fade-in">
        <div className="card-body">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                <span className="badge" style={{ background: "var(--bg-dim)", border: "1px solid var(--border)", fontFamily: "var(--font-mono)" }}>
                  {transfer.id}
                </span>
                <span className="badge badge-success">{transfer.status}</span>
              </div>
              <h2 className="text-title-lg">{transfer.title}</h2>
            </div>
            <div style={{ textAlign: "right", display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}>
              <div>
                <p className="text-headline-md" style={{ color: "var(--primary)" }}>{transfer.authorizedQuantity} units</p>
                <p className="text-body-sm">{transfer.medicineName}</p>
              </div>
              
              <div style={{ display: "flex", gap: 8 }}>
                <button className="btn btn-secondary" onClick={() => exportLedgerToCSV(transfer)} style={{ padding: "6px 12px", fontSize: 12 }}>
                  CSV
                </button>
                <button className="btn btn-secondary" onClick={() => exportLedgerToPDF(transfer)} style={{ padding: "6px 12px", fontSize: 12 }}>
                  PDF Export
                </button>
              </div>
            </div>
          </div>

          <div style={{ display: "flex", gap: 16, alignItems: "center", background: "var(--surface-sunken)", padding: 12, borderRadius: 8 }}>
            <div style={{ flex: 1 }}>
              <p className="text-body-sm" style={{ color: "var(--on-surface-secondary)" }}>Source</p>
              <p style={{ fontWeight: 600 }}>{transfer.donorName}</p>
            </div>
            <div style={{ color: "var(--primary)", fontSize: 24 }}>➔</div>
            <div style={{ flex: 1, textAlign: "right" }}>
              <p className="text-body-sm" style={{ color: "var(--on-surface-secondary)" }}>Destination</p>
              <p style={{ fontWeight: 600 }}>{transfer.recipientName}</p>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Discrepancy Alert */}
      {isDiscrepancy && (
        <div className="card animate-fade-in" style={{ borderLeft: "4px solid var(--error)", background: "var(--bg-dim)" }}>
          <div className="card-body">
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, color: "var(--error)" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
              <h3 className="text-title-md" style={{ fontWeight: 700 }}>Quantity Discrepancy Flagged</h3>
            </div>
            <p className="text-body-md" style={{ marginBottom: 12, fontWeight: 500 }}>
              {Math.abs(transfer.discrepancy!)} units do not reconcile (Delta: {((transfer.discrepancy! / transfer.authorizedQuantity) * 100).toFixed(1)}%)
            </p>
            <div style={{ display: "flex", gap: 24, fontSize: 13, marginBottom: 16 }}>
              <div>
                <span style={{ color: "var(--on-surface-tertiary)" }}>Expected: </span>
                <span style={{ fontWeight: 600 }}>{transfer.dispatchedQuantity ?? transfer.authorizedQuantity} units</span>
              </div>
              <div>
                <span style={{ color: "var(--on-surface-tertiary)" }}>Recorded at Gate: </span>
                <span style={{ fontWeight: 600, color: "var(--error)" }}>{transfer.receivedQuantity} units</span>
              </div>
            </div>
            <div className="card-subtle" style={{ padding: 12, borderRadius: 6, fontSize: 12, color: "var(--on-surface-secondary)" }}>
              <strong>Notice:</strong> The system records strictly factual observations. No silent edits are permitted; the original dispatch manifest is permanently preserved in the immutable hash ledger. Fraud or negligence is not automatically inferred.
            </div>
          </div>
        </div>
      )}

      {/* Interactive Controls */}
      <div className="card animate-fade-in">
        <div className="card-body">
          <h3 className="text-title-sm" style={{ marginBottom: 12 }}>Lifecycle Actions</h3>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: 'center' }}>
            {transfer.status === "RECOMMENDED" && (
              <>
                <button 
                  className="btn btn-primary"
                  onClick={() => handleAction(() => approveTransferAction(transfer.id, activeRole, activeUserId))}
                >
                  Approve Transfer
                </button>
                <button 
                  className="btn btn-secondary"
                  onClick={() => handleAction(() => rejectTransferAction(transfer.id, activeRole, activeUserId, "Not feasible"))}
                >
                  Reject
                </button>
              </>
            )}
            
            {transfer.status === "APPROVED" && (
              <button 
                className="btn btn-primary"
                onClick={() => handleAction(() => dispatchTransferAction(transfer.id, activeRole, activeUserId))}
              >
                Dispatch Stock
              </button>
            )}
            
            {transfer.status === "DISPATCHED" && (
              <button 
                className="btn btn-secondary"
                onClick={() => handleAction(() => markInTransitAction(transfer.id, "SYSTEM"))}
              >
                Mark In-Transit (System Trigger)
              </button>
            )}

            {transfer.status === "IN_TRANSIT" && (
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', background: 'var(--surface-sunken)', padding: 8, borderRadius: 8 }}>
                <span style={{ fontSize: 12 }}>Recv Qty:</span>
                <input 
                  type="number" 
                  value={receiveInput} 
                  onChange={e => setReceiveInput(parseInt(e.target.value))}
                  style={{ width: 80, padding: "4px 8px", borderRadius: 4, border: '1px solid var(--border)' }}
                />
                <button 
                  className="btn btn-primary"
                  onClick={() => handleAction(() => receiveTransferAction(transfer.id, activeRole, activeUserId, receiveInput))}
                >
                  Confirm Receipt
                </button>
              </div>
            )}

            {transfer.status === "EXCEPTION" && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%', background: 'var(--surface-sunken)', padding: 12, borderRadius: 8 }}>
                <p style={{ fontSize: 12, fontWeight: 600 }}>Reconcile Exception (DO Only)</p>
                <input 
                  type="text" 
                  value={reconcileNotes} 
                  onChange={e => setReconcileNotes(e.target.value)}
                  placeholder="Factual notes on discrepancy"
                  style={{ padding: "8px", borderRadius: 4, border: '1px solid var(--border)' }}
                />
                <button 
                  className="btn btn-primary" style={{ width: 'fit-content' }}
                  onClick={() => handleAction(() => reconcileTransferAction(transfer.id, activeRole, activeUserId, reconcileNotes))}
                >
                  Reconcile & Close
                </button>
              </div>
            )}
            
            {transfer.status === "RECONCILED" && (
              <div className="badge badge-success" style={{ padding: "8px 12px" }}>
                Transfer Completed & Reconciled
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 5. Immutable Ledger */}
      <div className="card animate-fade-in">
        <div className="card-body">
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
            <h3 className="text-title-md">Immutable Hash Ledger</h3>
          </div>
          
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {[...transfer.events].reverse().map((evt) => (
              <div key={evt.id} style={{ display: "flex", flexDirection: "column", gap: 6, padding: 12, border: "1px solid var(--border)", borderRadius: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span className="badge" style={{ background: "var(--bg-dim)", border: "1px solid var(--border)", fontFamily: "var(--font-mono)", fontSize: 10 }}>{evt.id}</span>
                    <span style={{ fontWeight: 600, fontSize: 13 }}>{evt.type}</span>
                  </div>
                  <span style={{ fontSize: 11, color: "var(--on-surface-tertiary)" }}>
                    {new Date(evt.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                
                {evt.payload && Object.keys(evt.payload).length > 0 && (
                  <div style={{ background: 'var(--surface-sunken)', padding: 8, borderRadius: 4, fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--on-surface-secondary)' }}>
                    {JSON.stringify(evt.payload)}
                  </div>
                )}
                
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 8, borderTop: "1px dashed var(--border)" }}>
                  <p style={{ fontSize: 11, color: "var(--on-surface-tertiary)", display: "flex", alignItems: "center", gap: 4 }}>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                    {evt.actorId}
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="var(--on-surface-tertiary)" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                    <p className="text-mono" style={{ color: "var(--border-strong)", fontSize: 10 }} title={evt.hash}>
                      {evt.hash.substring(0, 16)}...
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
}
