export type AppSettings = {
  dashboardRefresh: "off" | "30s" | "60s";
  tableDensity: "comfortable" | "compact";
  fieldCaptureSync: "auto" | "manual";
};

export const defaultSettings: AppSettings = {
  dashboardRefresh: "off",
  tableDensity: "comfortable",
  fieldCaptureSync: "auto",
};

export const SETTINGS_STORAGE_KEY = "swasthya_settings_v1";

export function getStoredSettings(): AppSettings {
  if (typeof window === "undefined") return defaultSettings;
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (raw) return { ...defaultSettings, ...JSON.parse(raw) };
  } catch (e) {
    console.error("Failed to parse settings", e);
  }
  return defaultSettings;
}

export function saveSettings(settings: AppSettings) {
  if (typeof window === "undefined") return;
  localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  // Dispatch a custom event so other components can react
  window.dispatchEvent(new Event("app-settings-changed"));
}
