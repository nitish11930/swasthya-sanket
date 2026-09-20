"use client";

import { useState, useEffect } from "react";
import { getTransfersListAction } from "@/features/transfers/actions";
import { useRouter } from "next/navigation";

type TransferListItem = {
  id: string;
  donorName: string;
  recipientName: string;
  medicineName: string;
  authorizedQuantity: number;
  status: string;
  createdAt: string;
};

export default function TransfersClient() {
  const [transfers, setTransfers] = useState<TransferListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const router = useRouter();

  useEffect(() => {
    loadTransfers();
  }, []);

  async function loadTransfers() {
    try {
      setLoading(true);
      const data = await getTransfersListAction();
      setTransfers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const filteredTransfers = transfers.filter(t => 
    t.id.toLowerCase().includes(search.toLowerCase()) || 
    t.donorName.toLowerCase().includes(search.toLowerCase()) ||
    t.recipientName.toLowerCase().includes(search.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "EXCEPTION": return "var(--error)";
      case "RECONCILED": return "var(--success)";
      case "RECOMMENDED": return "var(--primary-dark)";
      case "APPROVED": return "var(--primary)";
      case "DISPATCHED": return "var(--warning)";
      case "IN_TRANSIT": return "var(--warning-text)";
      default: return "var(--warning)";
    }
  };

  return (
    <div className="card animate-fade-in animate-delay-1">
      <div className="card-body">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h2 className="text-title-md">Active & Historical Transfers</h2>
          <input 
            type="text" 
            placeholder="Search by ID or Facility..." 
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ padding: "8px 12px", borderRadius: "6px", border: "1px solid var(--border)", width: "250px", fontSize: "13px" }}
          />
        </div>

        {loading ? (
          <div style={{ padding: 24, textAlign: "center", color: "var(--on-surface-tertiary)" }}>Loading transfers...</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, textAlign: "left" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid var(--border)", color: "var(--on-surface-secondary)" }}>
                  <th style={{ padding: "12px 8px" }}>Transfer ID</th>
                  <th style={{ padding: "12px 8px" }}>Created</th>
                  <th style={{ padding: "12px 8px" }}>Source</th>
                  <th style={{ padding: "12px 8px" }}>Destination</th>
                  <th style={{ padding: "12px 8px" }}>Medicine</th>
                  <th style={{ padding: "12px 8px" }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransfers.map((t) => (
                  <tr 
                    key={t.id} 
                    onClick={() => router.push(`/ledger?id=${t.id}`)}
                    style={{ borderBottom: "1px solid var(--border)", cursor: "pointer" }}
                    onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "var(--surface-sunken)")}
                    onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                  >
                    <td style={{ padding: "12px 8px", fontFamily: "var(--font-mono)", fontWeight: 600 }}>{t.id.split("-").slice(0, 2).join("-")}...</td>
                    <td style={{ padding: "12px 8px", color: "var(--on-surface-secondary)" }}>
                      {new Date(t.createdAt).toLocaleDateString()}
                    </td>
                    <td style={{ padding: "12px 8px" }}>{t.donorName}</td>
                    <td style={{ padding: "12px 8px" }}>{t.recipientName}</td>
                    <td style={{ padding: "12px 8px" }}>
                      <span style={{ fontWeight: 600 }}>{t.authorizedQuantity}</span> {t.medicineName}
                    </td>
                    <td style={{ padding: "12px 8px" }}>
                      <span className="badge" style={{ background: "var(--bg)", border: `1px solid ${getStatusColor(t.status)}`, color: getStatusColor(t.status) }}>
                        {t.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {filteredTransfers.length === 0 && (
                  <tr>
                    <td colSpan={6} style={{ textAlign: "center", padding: 24, color: "var(--on-surface-tertiary)" }}>
                      No transfers found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
