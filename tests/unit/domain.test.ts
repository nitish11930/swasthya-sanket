/**
 * Unit tests — SWASTHYA-SANKET Domain Engine
 *
 * Tests the pure deterministic domain functions.
 * No DB, no network, no AI.
 */

import { describe, it, expect } from "vitest";
import {
  calculateDaysToStockout,
  forecastStockout,
  evaluateDonorSafety,
  evaluateTransferOptions,
  reconcileTransfer,
  calculateTimeToBreach,
  generateEngineEvidence,
  evaluateForecastAccuracy,
  evaluateInterventionScenario,
  optimizeIntervention,
  type MedicineStock,
  type CounterfactualScenario,
} from "../../src/domain/index";

// ─── Fixtures ────────────────────────────────────────────────────────────────

function makeStock(overrides: Partial<MedicineStock> = {}): MedicineStock {
  return {
    medicineId: "med-001",
    phcId: "phc-001",
    currentQuantity: 100,
    safetyBuffer: 20,
    averageDailyConsumption: 5,
    ...overrides,
  };
}

// ─── calculateDaysToStockout ──────────────────────────────────────────────────

describe("calculateDaysToStockout", () => {
  it("returns correct days for normal stock", () => {
    const stock = makeStock({ currentQuantity: 100, safetyBuffer: 20, averageDailyConsumption: 5 });
    // usableStock = 100 - 20 = 80; days = floor(80/5) = 16
    expect(calculateDaysToStockout(stock)).toBe(16);
  });

  it("returns 0 when already at or below safety buffer", () => {
    const stock = makeStock({ currentQuantity: 20, safetyBuffer: 20, averageDailyConsumption: 5 });
    expect(calculateDaysToStockout(stock)).toBe(0);
  });

  it("returns 0 when below safety buffer", () => {
    const stock = makeStock({ currentQuantity: 10, safetyBuffer: 20, averageDailyConsumption: 5 });
    expect(calculateDaysToStockout(stock)).toBe(0);
  });

  it("returns null when daily consumption is zero", () => {
    const stock = makeStock({ averageDailyConsumption: 0 });
    expect(calculateDaysToStockout(stock)).toBeNull();
  });

  it("returns null when daily consumption is negative", () => {
    const stock = makeStock({ averageDailyConsumption: -1 });
    expect(calculateDaysToStockout(stock)).toBeNull();
  });

  it("floors partial days", () => {
    // usableStock = 100 - 20 = 80; 80 / 7 = 11.4... → 11
    const stock = makeStock({ averageDailyConsumption: 7 });
    expect(calculateDaysToStockout(stock)).toBe(11);
  });
});

// ─── forecastStockout ─────────────────────────────────────────────────────────

describe("forecastStockout", () => {
  it("returns high confidence for near-term stockout", () => {
    const stock = makeStock({ currentQuantity: 50, safetyBuffer: 20, averageDailyConsumption: 10 });
    const forecast = forecastStockout(stock);
    expect(forecast.daysToStockout).toBe(3);
    expect(forecast.confidenceLevel).toBe("high");
    expect(forecast.projectedStockoutDate).not.toBeNull();
  });

  it("returns null projected date when consumption is zero", () => {
    const stock = makeStock({ averageDailyConsumption: 0 });
    const forecast = forecastStockout(stock);
    expect(forecast.daysToStockout).toBeNull();
    expect(forecast.projectedStockoutDate).toBeNull();
  });

  it("returns medium confidence for 31-day window", () => {
    const stock = makeStock({ currentQuantity: 1000, safetyBuffer: 10, averageDailyConsumption: 30 });
    // (1000 - 10) / 30 = 33 days → medium
    const forecast = forecastStockout(stock);
    expect(forecast.daysToStockout).toBe(33);
    expect(forecast.confidenceLevel).toBe("medium");
  });
});

// ─── evaluateDonorSafety ──────────────────────────────────────────────────────

describe("evaluateDonorSafety", () => {
  it("marks donor as safe when margin is positive", () => {
    const donor = makeStock({ phcId: "phc-donor", currentQuantity: 100, safetyBuffer: 20 });
    const result = evaluateDonorSafety(donor, 50);
    expect(result.isDonorSafe).toBe(true);
    expect(result.remainingAfterTransfer).toBe(50);
    expect(result.safetyMarginAfterTransfer).toBe(30);
  });

  it("marks donor as safe when exactly at safety buffer", () => {
    const donor = makeStock({ phcId: "phc-donor", currentQuantity: 70, safetyBuffer: 20 });
    const result = evaluateDonorSafety(donor, 50);
    // remaining = 20, margin = 20 - 20 = 0 → safe
    expect(result.isDonorSafe).toBe(true);
    expect(result.safetyMarginAfterTransfer).toBe(0);
  });

  it("marks donor as UNSAFE when below safety buffer after transfer", () => {
    const donor = makeStock({ phcId: "phc-donor", currentQuantity: 60, safetyBuffer: 20 });
    const result = evaluateDonorSafety(donor, 50);
    // remaining = 10, margin = 10 - 20 = -10 → NOT safe
    expect(result.isDonorSafe).toBe(false);
    expect(result.safetyMarginAfterTransfer).toBe(-10);
  });
});

// ─── evaluateTransferOptions ──────────────────────────────────────────────────

describe("evaluateTransferOptions", () => {
  it("excludes unsafe donors from options", () => {
    const donors: MedicineStock[] = [
      makeStock({ phcId: "phc-safe", currentQuantity: 200, safetyBuffer: 20 }),
      makeStock({ phcId: "phc-unsafe", currentQuantity: 30, safetyBuffer: 20 }),
    ];
    const proposal = evaluateTransferOptions(donors, "phc-recipient", "med-001", 50);
    expect(proposal.options).toHaveLength(1);
    expect(proposal.options[0].donorPhcId).toBe("phc-safe");
  });

  it("excludes recipient PHC from donor list", () => {
    const donors: MedicineStock[] = [
      makeStock({ phcId: "phc-recipient", currentQuantity: 500, safetyBuffer: 20 }),
    ];
    const proposal = evaluateTransferOptions(donors, "phc-recipient", "med-001", 10);
    expect(proposal.options).toHaveLength(0);
  });

  it("returns empty options when no safe donors exist", () => {
    const donors: MedicineStock[] = [
      makeStock({ phcId: "phc-a", currentQuantity: 21, safetyBuffer: 20 }),
    ];
    const proposal = evaluateTransferOptions(donors, "phc-recipient", "med-001", 50);
    expect(proposal.options).toHaveLength(0);
  });
});

// ─── reconcileTransfer ────────────────────────────────────────────────────────

describe("reconcileTransfer", () => {
  it("matches when quantities are equal", () => {
    const result = reconcileTransfer(100, 100);
    expect(result.isMatch).toBe(true);
    expect(result.discrepancy).toBe(0);
    expect(result.requiresHumanReview).toBe(false);
  });

  it("flags discrepancy when quantities differ", () => {
    const result = reconcileTransfer(100, 95);
    expect(result.isMatch).toBe(false);
    expect(result.discrepancy).toBe(5);
    expect(result.requiresHumanReview).toBe(true);
  });

  it("allows tolerance range for matched reconciliation", () => {
    const result = reconcileTransfer(100, 98, 2);
    expect(result.isMatch).toBe(true);
    expect(result.requiresHumanReview).toBe(false);
  });

  it("correctly handles zero received (complete loss scenario)", () => {
    const result = reconcileTransfer(100, 0);
    expect(result.isMatch).toBe(false);
    expect(result.discrepancy).toBe(100);
    expect(result.requiresHumanReview).toBe(true);
    // RULE: Never auto-accuse — just flag for human review
  });
});

// ─── Phase 5: Decision Engine ──────────────────────────────────────────────────

describe("calculateTimeToBreach", () => {
  it("calculates exactly 24 hours for hero scenario (180 stock, 100 buffer, 80 demand)", () => {
    expect(calculateTimeToBreach(180, 100, 80)).toBe(24);
  });

  it("returns 0 if already below safety buffer", () => {
    expect(calculateTimeToBreach(90, 100, 80)).toBe(0);
  });

  it("returns null for zero demand", () => {
    expect(calculateTimeToBreach(180, 100, 0)).toBeNull();
  });
});

describe("generateEngineEvidence", () => {
  it("flags mathematical runout when current == historical", () => {
    const evidence = generateEngineEvidence(80, 80, 0.5, 0);
    expect(evidence[0].category).toBe("Mathematical runout model");
  });

  it("flags epidemiology signal when beds >80% and demand surges", () => {
    const evidence = generateEngineEvidence(100, 50, 0.85, 0);
    expect(evidence[0].category).toBe("Ward/epidemiology signal");
  });

  it("flags staffing bottleneck when staff are absent", () => {
    const evidence = generateEngineEvidence(80, 80, 0.5, 2);
    expect(evidence.some(e => e.category === "Staffing bottleneck")).toBe(true);
  });
});

describe("evaluateForecastAccuracy", () => {
  it("calculates MAE and MAPE correctly", () => {
    const actuals = [100, 120, 90];
    const predictions = [110, 120, 80];
    // Errors: -10, 0, 10
    // Abs Errors: 10, 0, 10 -> sum: 20 -> MAE: 6.666
    // Abs Pct: 0.1, 0, 0.111 -> sum: 0.211 -> MAPE: ~7.03%
    const evaluation = evaluateForecastAccuracy(actuals, predictions);
    expect(evaluation?.mae).toBeCloseTo(6.667, 3);
    expect(evaluation?.mape).toBeCloseTo(7.037, 3);
    expect(evaluation?.bias).toBe(0); // sum(-10 + 0 + 10) / 3 = 0
  });
});

// ─── Hero Scenario: evaluateInterventionScenario ──────────────────────────────

const HERO_SCENARIOS: CounterfactualScenario[] = [
  { id: "OPT_1", type: "DO_NOTHING", transferQuantity: 0 },
  { id: "OPT_2", type: "TRANSFER", transferQuantity: 80, donor: { phcId: "Balotra-02", currentStock: 410, safetyBuffer: 180, dailyDemand: 25, travelTimeHours: 3 } },
  { id: "OPT_3", type: "TRANSFER", transferQuantity: 120, donor: { phcId: "Jodhpur-07", currentStock: 620, safetyBuffer: 200, dailyDemand: 20, travelTimeHours: 4.17 } },
  { id: "OPT_4", type: "TRANSFER", transferQuantity: 220, donor: { phcId: "Balotra-02", currentStock: 410, safetyBuffer: 180, dailyDemand: 25, travelTimeHours: 3 } },
];

// Recipient: 180 stock, 100 buffer, 80/day demand → 24h breach

describe("evaluateInterventionScenario — OPT_1 Do Nothing", () => {
  it("returns baseline breach time of 24h", () => {
    const s = HERO_SCENARIOS[0];
    const result = evaluateInterventionScenario(s, 180, 100, 80);
    expect(result.recipientBreachTimeHours).toBe(24);
    expect(result.recipientProjectedStock).toBe(180);
    expect(result.isFeasible).toBe(true);
    expect(result.donorRemainingStock).toBeNull();
  });
});

describe("evaluateInterventionScenario — OPT_2 Balotra-02 80 ORS", () => {
  it("OPT_2: donor safe, extends recipient breach", () => {
    const s = HERO_SCENARIOS[1];
    const result = evaluateInterventionScenario(s, 180, 100, 80);
    // Donor: 410 - 80 = 330; margin = 330 - 180 = 150 → safe
    expect(result.donorRemainingStock).toBe(330);
    expect(result.donorSafetyMargin).toBe(150);
    expect(result.donorBreachRisk).toBe(false);
    expect(result.isFeasible).toBe(true);
    // Recipient: 180 + 80 = 260; (260-100)/80 = 2 days = 48h
    expect(result.recipientProjectedStock).toBe(260);
    expect(result.recipientBreachTimeHours).toBe(48);
  });
});

describe("evaluateInterventionScenario — OPT_4 Balotra-02 220 ORS REJECTED", () => {
  it("OPT_4: donor constraint violated — 220 breaches Balotra-02 Rule R-08 stability floor", () => {
    const s = HERO_SCENARIOS[3];
    const result = evaluateInterventionScenario(s, 180, 100, 80);
    // Donor: 410 - 220 = 190; margin = 190 - 180 = 10 units
    // At 25/day demand: 10 / 25 = 9.6 hours to donor breach (< 24h operational floor)
    expect(result.donorRemainingStock).toBe(190);
    expect(result.donorSafetyMargin).toBe(10);
    expect(result.donorBreachRisk).toBe(true);
    // Hard constraint: must be rejected
    expect(result.isFeasible).toBe(false);
    expect(result.rejectionReason).toContain("Rule R-08 (Donor Stability)");
  });
});

describe("optimizeIntervention — Hero Scenario", () => {
  it("recommends a feasible TRANSFER (not DO_NOTHING) for 180/100/80 hero data", () => {
    const result = optimizeIntervention(HERO_SCENARIOS, "Barmer-03", 180, 100, 80);
    expect(result.recommendedScenarioId).not.toBe("OPT_1");
    expect(result.donorPhcId).not.toBeNull();
  });

  it("produces calculation evidence with at least 3 steps", () => {
    const result = optimizeIntervention(HERO_SCENARIOS, "Barmer-03", 180, 100, 80);
    expect(result.calculationEvidence.length).toBeGreaterThanOrEqual(3);
  });

  it("does not recommend by nearest donor — scores by coverage and donor stability to recommend OPT_3", () => {
    // OPT_2: Balotra-02 (3h travel, 80 ORS) -> +24h delay (breaches at 48h, partial coverage)
    // OPT_3: Jodhpur-07 (4.17h travel, 120 ORS) -> +36h delay (60h full outbreak protection, 500 units safe)
    // OPT_4: Balotra-02 (220 ORS) -> REJECTED by Rule R-08
    // Result: OPT_3 wins because it offers full outbreak coverage with resilient donor margin,
    // demonstrating that the optimizer does NOT simply choose the nearest donor.
    const result = optimizeIntervention(HERO_SCENARIOS, "Barmer-03", 180, 100, 80);
    expect(result.recommendedScenarioId).toBe("OPT_3");
    expect(result.recommendedQuantity).toBe(120);
    expect(result.donorPhcId).toBe("Jodhpur-07");
    // And NOT simply the nearest (Balotra-02 OPT_2)
    expect(result.recommendedScenarioId).not.toBe("OPT_2");
  });

  it("returns rejected alternatives list for infeasible scenarios", () => {
    const result = optimizeIntervention(HERO_SCENARIOS, "Barmer-03", 180, 100, 80);
    expect(Array.isArray(result.rejectedAlternatives)).toBe(true);
    expect(result.rejectedAlternatives.some((r) => r.scenarioId === "OPT_4")).toBe(true);
    expect(Array.isArray(result.alternatives)).toBe(true);
    expect(result.alternatives.some((r) => r.scenarioId === "OPT_2")).toBe(true);
    expect(Array.isArray(result.constraintViolations)).toBe(true);
    expect(result.constraintViolations.length).toBeGreaterThanOrEqual(1);
    expect(result.constraintViolations[0]).toContain("OPT_4");
  });
});
