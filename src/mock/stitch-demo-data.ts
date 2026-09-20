/**
 * SWASTHYA-SANKET — Stitch Demo Data
 *
 * Phase 1: Static presentation data ONLY.
 * All values match the Stitch reference screenshots exactly.
 *
 * REPLACE IN PHASE 2: Every value here should come from the database.
 * Nothing in this file should be imported by domain/business logic.
 * Only UI components may import from this file.
 */

// ─── Types ────────────────────────────────────────────────────

export type StockStatus = "healthy" | "monitor" | "low" | "critical" | "stockout";
export type TransferStatus = "approved" | "dispatched" | "in_transit" | "received" | "reconciled";
export type ExceptionSeverity = "high" | "medium" | "low" | "info";
export type LedgerEventStatus = "open_review" | "applied" | "verified" | "reconciled" | "pending";

export interface Medicine {
  id: string;
  name: string;
  unit: string;
  currentStock: number;
  safetyBuffer: number;
  avgDailyConsumption: number;
  daysToStockout: number;
  status: StockStatus;
}

export interface TransferEvent {
  id: string;
  transId: string;
  donorFacility: string;
  recipientFacility: string;
  medicine: string;
  authorizedQty: number;
  currentStep: number;
  totalSteps: number;
  lifecycle: LifecycleStep[];
  badge: string;
}

export interface LifecycleStep {
  label: string;
  time: string;
  state: "completed" | "current" | "pending";
}

export interface LedgerEntry {
  id: string;
  eventId: string;
  action: string;
  actor: string;
  location: string;
  time: string;
  hash: string;
  status: LedgerEventStatus;
  chainId: string;
}

export interface ExceptionItem {
  id: string;
  severity: ExceptionSeverity;
  type: string;
  title: string;
  description: string;
  time: string;
  badge?: string;
  detail?: Record<string, string | number>;
}

export interface PhcSummary {
  id: string;
  name: string;
  block: string;
  district: string;
  state: string;
  lat: number;
  lng: number;
  deviceId: string;
  isOffline: boolean;
  lastSyncMinutes: number;
  queuedEvents: number;
  activeBeds: number;
  totalBeds: number;
  staffOnDuty: number;
  freshnessScore: number;
}

// ─── PHC Data ─────────────────────────────────────────────────

export const DEMO_PHC: PhcSummary = {
  id: "phc-barmer-03",
  name: "PHC Barmer-03",
  block: "Baytu Block",
  district: "Barmer District",
  state: "Rajasthan",
  lat: 25.7532,
  lng: 71.3965,
  deviceId: "TAB-84",
  isOffline: true,
  lastSyncMinutes: 14,
  queuedEvents: 3,
  activeBeds: 1,
  totalBeds: 6,
  staffOnDuty: 2,
  freshnessScore: 94.2,
};

// ─── Medicine Stock ────────────────────────────────────────────

export const DEMO_MEDICINES: Medicine[] = [
  {
    id: "med-ors",
    name: "ORS (WHO Formulation)",
    unit: "packets",
    currentStock: 240,
    safetyBuffer: 100,
    avgDailyConsumption: 46,
    daysToStockout: 31,
    status: "healthy",
  },
  {
    id: "med-paracetamol",
    name: "Paracetamol 500mg",
    unit: "tablets",
    currentStock: 180,
    safetyBuffer: 60,
    avgDailyConsumption: 7,
    daysToStockout: 18,
    status: "monitor",
  },
  {
    id: "med-amox",
    name: "Amoxicillin 500mg",
    unit: "capsules",
    currentStock: 42,
    safetyBuffer: 30,
    avgDailyConsumption: 2,
    daysToStockout: 7,
    status: "low",
  },
  {
    id: "med-ifa",
    name: "Iron + Folic Acid",
    unit: "tablets",
    currentStock: 12,
    safetyBuffer: 20,
    avgDailyConsumption: 4,
    daysToStockout: 0,
    status: "critical",
  },
  {
    id: "med-zinc",
    name: "Zinc Sulfate",
    unit: "tablets",
    currentStock: 88,
    safetyBuffer: 40,
    avgDailyConsumption: 3,
    daysToStockout: 24,
    status: "monitor",
  },
  {
    id: "med-cotrimoxazole",
    name: "Co-trimoxazole",
    unit: "tablets",
    currentStock: 320,
    safetyBuffer: 80,
    avgDailyConsumption: 5,
    daysToStockout: 48,
    status: "healthy",
  },
  {
    id: "med-metronidazole",
    name: "Metronidazole 400mg",
    unit: "tablets",
    currentStock: 55,
    safetyBuffer: 40,
    avgDailyConsumption: 4,
    daysToStockout: 4,
    status: "critical",
  },
];

// ─── Active Transfer ───────────────────────────────────────────

export const DEMO_TRANSFER: TransferEvent = {
  id: "transfer-427",
  transId: "TR-00427",
  donorFacility: "Jodhpur-07 Regional Depot",
  recipientFacility: "PHC Barmer-03",
  medicine: "ORS (WHO Formulation)",
  authorizedQty: 120,
  currentStep: 4,
  totalSteps: 5,
  badge: "Priority Stock Relocation",
  lifecycle: [
    { label: "Approved",    time: "04:12 AM", state: "completed" },
    { label: "Dispatched",  time: "02-01-0",  state: "completed" },
    { label: "In Transit",  time: "—",        state: "completed" },
    { label: "Received",    time: "12:45 AM", state: "current"   },
    { label: "Reconciled",  time: "—",        state: "pending"   },
  ],
};

// ─── Reconciliation Data ───────────────────────────────────────

export const DEMO_RECONCILIATION = {
  transId:       "TR-00427",
  expectedQty:   120,
  receivedQty:   100,
  deltaQty:      -20,
  deltaPct:      -16.6,
  batchLotId:    "ORS-LOT-2024-89",
  tamperSealId:  "INBO1 (Seal #S-9921)",
  custodian:     "ANM Meena Devi (Acting PHC Incharge)",
  sealVerified:  true,
  chainId:       "HXJ-71",
};

// ─── Immutable Ledger ──────────────────────────────────────────

export const DEMO_LEDGER: LedgerEntry[] = [
  {
    id: "svt-8899",
    eventId: "SVT-8899",
    action: "Discrepancy logged: −20 ORS",
    actor: "ANM M. Devi (PHC Barmer-03)",
    location: "PHC Barmer-03",
    time: "Just now",
    hash: "#a87...3b4",
    status: "open_review",
    chainId: "HXJ-71",
  },
  {
    id: "svt-8898",
    eventId: "SVT-8898",
    action: "Transfer In: 100 ORS received",
    actor: "Gate Terminal, Barmer-03",
    location: "PHC Barmer-03",
    time: "10:45 AM",
    hash: "#a47c...11a",
    status: "applied",
    chainId: "HXJ-71",
  },
  {
    id: "svt-8042",
    eventId: "SVT-8042",
    action: "Transfer Out: 120 ORS dispatched",
    actor: "S. Rathore (Jodhpur-07)",
    location: "Jodhpur-07 Depot",
    time: "06:30 AM",
    hash: "#d28...e40",
    status: "verified",
    chainId: "HXJ-71",
  },
  {
    id: "svt-8812",
    eventId: "SVT-8812",
    action: "Frontline Dispense: 40 ORS",
    actor: "Outpatient Registry, Barmer-03",
    location: "PHC Barmer-03",
    time: "Yesterday",
    hash: "#x11...8cc",
    status: "reconciled",
    chainId: "HXJ-71",
  },
];

// ─── Exceptions ────────────────────────────────────────────────

export const DEMO_EXCEPTIONS: ExceptionItem[] = [
  {
    id: "exc-001",
    severity: "high",
    type: "Transfer Receipt Discrepancy",
    title: "Transfer Receipt Discrepancy",
    time: "10:53 AM",
    badge: "TR-00427",
    description:
      "20 units do not reconcile. Expected: 120 units · Recorded at Gate: 100 units.",
    detail: {
      sourceNode: "Jodhpur-07 Central Depot",
      medicine: "Oral Rehydration Salts ICMS",
      expected: 120,
      received: 100,
    },
  },
  {
    id: "exc-002",
    severity: "medium",
    type: "Unexpected Demand Anomaly",
    title: "Unexpected Demand Anomaly",
    time: "09:15 AM",
    badge: "3.4× Baseline",
    description:
      "86 ORS packets dispensed within a compressed 4-hour window (typical baseline: 12–18 units/day). Potential acute diarrhoeal cluster flagged in Ward-6.",
    detail: {
      facility: "PHC Barmer-01 • Thor Border Fringe",
    },
  },
  {
    id: "exc-003",
    severity: "medium",
    type: "Physical Inventory Count Mismatch",
    title: "Physical Inventory Count Mismatch",
    time: "Yesterday",
    description: "Physical count diverges from ledger by 26 units (6.1%).",
    detail: {
      facility: "PHC Balotra-02 • Sub-store Room B",
      ledgerQty: 419,
      physicalQty: 393,
      delta: -26,
    },
  },
  {
    id: "exc-004",
    severity: "info",
    type: "Frontline Sync Delayed",
    title: "Frontline Sync Delayed",
    time: "6h 40min Overdue",
    description:
      "Scheduled packed sync overdue. Sector tower reports routine power maintenance; expected restoration at 14:00.",
    detail: {
      facilities: "Sub-Centre Farran-04 + Deen Dayal Outpost",
    },
  },
];

// ─── Dashboard summary ─────────────────────────────────────────

export const DEMO_DASHBOARD_STATS = {
  activeQueue:     4,
  urgentCount:     1,
  freshnessAvg:    94.2,
  nearStaleCount:  1,
  reconciledToday: 18,
};

// ─── Decision Engine ───────────────────────────────────────────

export const DEMO_ENGINE_SIGNAL = {
  medicine:            "ORS (WHO Formulation)",
  targetFacility:      "PHC Barmer-03",
  hoursToSafetyBreach: 24.0,
  currentStock:        240,
  safetyThreshold:     100,
  demandForecast:      58,
  inpatientBeds:       6,
  anmStaff:            2,
  confidence:          "Deterministic (100%)",
  scenarios: [
    {
      id: "s1",
      label: "Transfer 80 units from Jodhpur-07",
      daysGained: 31,
      safetyMargin: "+140 units",
      recommended: true,
    },
    {
      id: "s2",
      label: "Emergency procurement (District store)",
      daysGained: 45,
      safetyMargin: "+200 units",
      recommended: false,
    },
    {
      id: "s3",
      label: "Rationing protocol + partial transfer",
      daysGained: 18,
      safetyMargin: "+60 units",
      recommended: false,
    },
  ],
};

// ─── Field Capture ─────────────────────────────────────────────

export const DEMO_CAPTURE = {
  parsedSpeech: "Aaj 40 ORS packets diye. Bed number 3 occupied hai. Sita ANM aaj duty par nahi aayi.",
  nlpMatch: 96,
  audioDuration: "00:14",
  audioModel: "Hinglish Model (Devanagari-Latin)",
  audioBitrate: "24kbps OPUS",
  entities: [
    { label: "40 ORS",     icon: "📦", status: "Needs Conf.", statusClass: "badge-queued" },
    { label: "Bed #03",    icon: "🛏",  status: "Verified",   statusClass: "badge-synced" },
    { label: "Sita (ANM)", icon: "👤", status: "Absence Log", statusClass: "badge-neutral" },
  ],
};

// ─── Status color maps ─────────────────────────────────────────

export const STOCK_STATUS_CONFIG: Record<StockStatus, {
  label: string;
  badgeClass: string;
  barClass: string;
  color: string;
  days: string;
}> = {
  healthy:  { label: "Healthy",  badgeClass: "badge-synced",    barClass: "stock-healthy",  color: "var(--success)", days: ">30d" },
  monitor:  { label: "Monitor",  badgeClass: "badge-monitor",   barClass: "stock-monitor",  color: "var(--monitor)", days: "15–30d" },
  low:      { label: "Low",      badgeClass: "badge-queued",    barClass: "stock-low",      color: "var(--warning)", days: "7–14d" },
  critical: { label: "Critical", badgeClass: "badge-danger",    barClass: "stock-critical", color: "var(--danger)",  days: "<7d" },
  stockout: { label: "Stockout", badgeClass: "badge-danger",    barClass: "stock-critical", color: "var(--danger)",  days: "NOW" },
};

export const LEDGER_STATUS_CONFIG: Record<LedgerEventStatus, {
  label: string;
  badgeClass: string;
}> = {
  open_review: { label: "Open Review", badgeClass: "badge-danger"     },
  applied:     { label: "Applied",     badgeClass: "badge-primary"    },
  verified:    { label: "Verified",    badgeClass: "badge-synced"     },
  reconciled:  { label: "Reconciled", badgeClass: "badge-reconciled" },
  pending:     { label: "Pending",     badgeClass: "badge-neutral"    },
};
