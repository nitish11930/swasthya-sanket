import type { Metadata } from "next";
import PageShell from "@/components/layout/PageShell";
import ExceptionsClient from "./ExceptionsClient";

export const metadata: Metadata = {
  title: "Exceptions & Resilience Triage",
  description: "Operational discrepancies and synchronization alerts — SWASTHYA-SANKET",
};

export default function ExceptionsPage() {
  return (
    <PageShell>
      <ExceptionsClient />
    </PageShell>
  );
}
