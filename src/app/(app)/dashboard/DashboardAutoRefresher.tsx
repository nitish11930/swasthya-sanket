"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getStoredSettings } from "@/lib/settings";

export default function DashboardAutoRefresher() {
  const router = useRouter();

  useEffect(() => {
    const settings = getStoredSettings();
    if (settings.dashboardRefresh === "off") return;

    const intervalMs = settings.dashboardRefresh === "30s" ? 30000 : 60000;
    
    const interval = setInterval(() => {
      router.refresh();
    }, intervalMs);

    return () => clearInterval(interval);
  }, [router]);

  return null;
}
