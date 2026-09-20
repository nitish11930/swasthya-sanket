import type { Metadata } from "next";
import PageShell from "@/components/layout/PageShell";
import { DEMO_PHC } from "@/mock/stitch-demo-data";
import CaptureClient from "./CaptureClient";
import { auth } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Field Capture",
  description: "Voice-driven field capture — SWASTHYA-SANKET",
};

export default async function FieldCapturePage() {
  const session = await auth();
  
  return (
    <PageShell>
      <CaptureClient 
        phcName={session?.user?.phcName || DEMO_PHC.name} 
        block={session?.user?.districtName || DEMO_PHC.block} 
        deviceId={DEMO_PHC.deviceId}
      />
    </PageShell>
  );
}
