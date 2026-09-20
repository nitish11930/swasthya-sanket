import type { Metadata } from "next";
import PageShell from "@/components/layout/PageShell";
import TransfersClient from "./TransfersClient";

export const metadata: Metadata = {
  title: "Transfers",
  description: "Transfers Hub — SWASTHYA-SANKET",
};

export default function TransfersPage() {
  return (
    <PageShell>
      <div className="animate-fade-in" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <div>
          <h1 className="text-headline-md">Transfers Hub</h1>
          <p className="text-body-md" style={{ marginTop: 2 }}>Monitor and manage logistics across the network</p>
        </div>
      </div>
      <TransfersClient />
    </PageShell>
  );
}
