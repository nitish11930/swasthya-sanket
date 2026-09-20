import type { Metadata } from "next";
import PageShell from "@/components/layout/PageShell";
import LedgerClient from "./LedgerClient";

export const metadata: Metadata = {
  title: "Ledger — Immutable Audit",
  description: "Immutable transfer ledger and audit trail — SWASTHYA-SANKET",
};

export default function LedgerPage() {
  return (
    <PageShell>
      <div className="animate-fade-in" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <div>
          <h1 className="text-headline-md">Transfers Ledger</h1>
          <p className="text-body-md" style={{ marginTop: 2 }}>Append-only · Tamper-evident</p>
        </div>
      </div>

      <LedgerClient />

      <div className="card-proactive card-body animate-fade-in animate-delay-5" style={{ borderRadius: "var(--radius-md)", marginTop: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--primary-dark)" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
          <p style={{ fontSize: 12, fontWeight: 700, color: "var(--primary-dark)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Immutable Ledger Guarantee
          </p>
        </div>
        <p style={{ fontSize: 12, color: "var(--primary-dark)", lineHeight: "18px", opacity: 0.9 }}>
          All entries are append-only. No UPDATE or DELETE is permitted on the audit_log table. Database-level triggers enforce this constraint deterministically.
        </p>
      </div>
    </PageShell>
  );
}
