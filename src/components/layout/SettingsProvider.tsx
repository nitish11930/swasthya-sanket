"use client";

import { useEffect } from "react";
import { getStoredSettings } from "@/lib/settings";

export default function SettingsProvider() {
  useEffect(() => {
    const applySettings = () => {
      const settings = getStoredSettings();
      // Apply table density
      if (settings.tableDensity === "compact") {
        document.body.classList.add("density-compact");
      } else {
        document.body.classList.remove("density-compact");
      }
    };

    applySettings();
    window.addEventListener("app-settings-changed", applySettings);
    return () => window.removeEventListener("app-settings-changed", applySettings);
  }, []);

  return null;
}
