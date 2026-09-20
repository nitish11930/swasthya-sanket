/**
 * SWASTHYA-SANKET Domain Engine
 *
 * RULE: All business-critical calculations live here as pure TypeScript
 * functions. No React, no Next.js, no DB calls, no AI calls.
 *
 * Deterministic. Testable. Auditable.
 *
 * Phase 0: Stubs only — signatures defined, implementations follow in Phase 2.
 */

// ─── Types ───────────────────────────────────────────────────────────────────

export interface MedicineStock {
  medicineId: string;
  phcId: string;
  currentQuantity: number;
  safetyBuffer: number;       // minimum quantity the PHC must retain
  averageDailyConsumption: number;
}

export interface StockoutForecast {
  medicineId: string;
  phcId: string;
  daysToStockout: number | null;  // null = no stockout predicted
  projectedStockoutDate: Date | null;
  confidenceLevel: "high" | "medium" | "low";
}

export interface TransferOption {
  donorPhcId: string;
  quantity: number;
  remainingAfterTransfer: number;
  safetyMarginAfterTransfer: number;  // must be >= 0
  isDonorSafe: boolean;               // deterministic: false = rejected
}

export interface TransferProposal {
  recipientPhcId: string;
  medicineId: string;
  requestedQuantity: number;
  options: TransferOption[];
}

// ─── Forecasting ─────────────────────────────────────────────────────────────

/**
 * Calculate days to stockout from current stock level.
 * Pure arithmetic — deterministic, never uses AI.
 *
 * @returns null if no stockout is predicted (consumption is zero or negative)
 */
export function calculateDaysToStockout(stock: MedicineStock): number | null {
  if (stock.averageDailyConsumption <= 0) return null;
  const usableStock = stock.currentQuantity - stock.safetyBuffer;
  if (usableStock <= 0) return 0;
  return Math.floor(usableStock / stock.averageDailyConsumption);
}

/**
 * Build a full stockout forecast for a medicine at a PHC.
 */
export function forecastStockout(stock: MedicineStock): StockoutForecast {
  const days = calculateDaysToStockout(stock);
  const projectedDate = days != null
    ? new Date(Date.now() + days * 24 * 60 * 60 * 1000)
    : null;

  let confidence: StockoutForecast["confidenceLevel"] = "high";
  // Confidence degrades as the forecast window extends
  if (days != null && days > 30) confidence = "medium";
  if (days != null && days > 60) confidence = "low";

  return {
    medicineId: stock.medicineId,
    phcId: stock.phcId,
    daysToStockout: days,
    projectedStockoutDate: projectedDate,
    confidenceLevel: confidence,
  };
}

// ─── Transfer Safety ──────────────────────────────────────────────────────────

/**
 * Evaluate whether a donor PHC can safely provide a given quantity.
 *
 * RULE: Deterministic — never AI. Safety buffer constraint is absolute.
 * A donor is only safe if remainingAfterTransfer >= safetyBuffer.
 */
export function evaluateDonorSafety(
  donorStock: MedicineStock,
  proposedQuantity: number
): TransferOption {
  const remainingAfterTransfer = donorStock.currentQuantity - proposedQuantity;
  const safetyMarginAfterTransfer = remainingAfterTransfer - donorStock.safetyBuffer;
  const isDonorSafe = safetyMarginAfterTransfer >= 0;

  return {
    donorPhcId: donorStock.phcId,
    quantity: proposedQuantity,
    remainingAfterTransfer,
    safetyMarginAfterTransfer,
    isDonorSafe,
  };
}

/**
 * Evaluate all candidate donors for a transfer proposal.
 * Returns only safe options (isDonorSafe === true).
 * An unsafe donor option is NEVER included — this is deterministic.
 */
export function evaluateTransferOptions(
  donorStocks: MedicineStock[],
  recipientPhcId: string,
  medicineId: string,
  requestedQuantity: number
): TransferProposal {
  const options = donorStocks
    .filter((d) => d.phcId !== recipientPhcId)
    .map((d) => evaluateDonorSafety(d, requestedQuantity))
    .filter((opt) => opt.isDonorSafe);

  return {
    recipientPhcId,
    medicineId,
    requestedQuantity,
    options,
  };
}

// ─── Reconciliation ───────────────────────────────────────────────────────────

export interface ReconciliationResult {
  isMatch: boolean;
  dispatchedQuantity: number;
  receivedQuantity: number;
  discrepancy: number;
  requiresHumanReview: boolean;
}

/**
 * Reconcile dispatched vs received quantities.
 *
 * RULE: Never auto-accuse anyone. Discrepancy → flag for human review.
 * Arithmetic is deterministic.
 */
export function reconcileTransfer(
  dispatchedQuantity: number,
  receivedQuantity: number,
  toleranceUnits: number = 0
): ReconciliationResult {
  const discrepancy = Math.abs(dispatchedQuantity - receivedQuantity);
  const isMatch = discrepancy <= toleranceUnits;

  return {
    isMatch,
    dispatchedQuantity,
    receivedQuantity,
    discrepancy,
    requiresHumanReview: !isMatch,
  };
}

// ─── Phase 5: Deterministic Decision Engine ──────────────────────────────────

export interface ForecastEvaluation {
  mae: number;
  mape: number;
  bias: number;
  evaluationPeriodDays: number;
}

/**
 * Calculates time (in hours) until the stock breaches the safety buffer.
 * Hero scenario: Stock=180, Buffer=100, Demand=80/day
 * (180 - 100) / 80 = 1 day = 24 hours.
 */
export function calculateTimeToBreach(
  currentStock: number,
  safetyBuffer: number,
  dailyDemand: number
): number | null {
  if (dailyDemand <= 0) return null;
  const usableStock = currentStock - safetyBuffer;
  if (usableStock <= 0) return 0; // Already breached
  
  const daysToBreach = usableStock / dailyDemand;
  return daysToBreach * 24; // Return in hours
}

export interface EngineEvidence {
  category: "Frontline dispensing" | "Ward/epidemiology signal" | "Staffing bottleneck" | "Mathematical runout model";
  description: string;
}

/**
 * Generates deterministic evidence ("Why is this happening?") by comparing usage signals.
 */
export function generateEngineEvidence(
  currentDemand: number,
  historicalDemand: number,
  bedOccupancyRate: number,
  staffAbsentCount: number
): EngineEvidence[] {
  const evidence: EngineEvidence[] = [];

  // Mathematical runout
  if (currentDemand > 0 && currentDemand === historicalDemand) {
    evidence.push({
      category: "Mathematical runout model",
      description: "Consistent consumption is outpacing available safety stock."
    });
  }

  // Epidemiology / Ward signal
  if (bedOccupancyRate > 0.8 && currentDemand > historicalDemand * 1.2) {
    evidence.push({
      category: "Ward/epidemiology signal",
      description: `Inpatient beds are at ${(bedOccupancyRate * 100).toFixed(0)}% capacity, driving a ${((currentDemand / historicalDemand - 1) * 100).toFixed(0)}% surge in demand.`
    });
  } else if (currentDemand > historicalDemand * 1.2) {
    evidence.push({
      category: "Frontline dispensing",
      description: `Outpatient dispensing has surged by ${((currentDemand / historicalDemand - 1) * 100).toFixed(0)}% against historical baseline.`
    });
  }

  // Staffing
  if (staffAbsentCount > 0) {
    evidence.push({
      category: "Staffing bottleneck",
      description: `${staffAbsentCount} field staff absent, causing supply chain verification delays.`
    });
  }

  return evidence;
}

/**
 * Deterministically evaluates the accuracy of previous forecasts.
 */
export function evaluateForecastAccuracy(
  actuals: number[],
  predictions: number[]
): ForecastEvaluation | null {
  if (actuals.length === 0 || actuals.length !== predictions.length) return null;

  let sumAbsError = 0;
  let sumAbsPctError = 0;
  let sumError = 0;
  let validMapeCount = 0;

  for (let i = 0; i < actuals.length; i++) {
    const act = actuals[i];
    const pred = predictions[i];
    const error = act - pred;
    
    sumAbsError += Math.abs(error);
    sumError += error; // Bias
    
    if (act > 0) {
      sumAbsPctError += Math.abs(error) / act;
      validMapeCount++;
    }
  }

  return {
    mae: sumAbsError / actuals.length,
    bias: sumError / actuals.length, // Positive means actual > predicted (under-forecast)
    mape: validMapeCount > 0 ? (sumAbsPctError / validMapeCount) * 100 : 0,
    evaluationPeriodDays: actuals.length
  };
}

// ─── Counterfactual Intervention Engine ──────────────────────────────────────

export interface DonorState {
  phcId: string;
  currentStock: number;
  safetyBuffer: number;
  dailyDemand: number;
  travelTimeHours: number;
}

export interface CounterfactualScenario {
  id: string;
  type: "DO_NOTHING" | "TRANSFER";
  donor?: DonorState;
  transferQuantity: number;
}

export interface ScenarioEvaluation {
  scenarioId: string;
  // Recipient
  recipientProjectedStock: number;
  recipientBreachTimeHours: number | null;
  expectedShortageDelayHours: number | null;
  coverageGain: number;
  
  // Donor
  donorRemainingStock: number | null;
  donorSafetyMargin: number | null;
  donorBreachRisk: boolean;
  travelTimeHours: number | null;

  // Feasibility
  isFeasible: boolean;
  rejectionReason: string | null;
}

/**
 * Deterministically evaluates a single intervention scenario.
 */
export function evaluateInterventionScenario(
  scenario: CounterfactualScenario,
  recipientCurrentStock: number,
  recipientSafetyBuffer: number,
  recipientDailyDemand: number
): ScenarioEvaluation {
  const recipientBaseBreachTime = calculateTimeToBreach(recipientCurrentStock, recipientSafetyBuffer, recipientDailyDemand);
  
  if (scenario.type === "DO_NOTHING" || !scenario.donor || scenario.transferQuantity === 0) {
    return {
      scenarioId: scenario.id,
      recipientProjectedStock: recipientCurrentStock,
      recipientBreachTimeHours: recipientBaseBreachTime,
      expectedShortageDelayHours: 0,
      coverageGain: 0,
      donorRemainingStock: null,
      donorSafetyMargin: null,
      donorBreachRisk: false,
      travelTimeHours: null,
      isFeasible: true,
      rejectionReason: null
    };
  }

  const { donor, transferQuantity } = scenario;
  
  // Calculate Donor Post-Transfer State
  const donorRemainingStock = donor.currentStock - transferQuantity;
  const donorSafetyMargin = donorRemainingStock - donor.safetyBuffer;
  
  // Donor breach calculation: time until donor breaches its own safety stock
  const donorBreachTimeHours = calculateTimeToBreach(donorRemainingStock, donor.safetyBuffer, donor.dailyDemand);

  // HARD CONSTRAINT: Rule R-08 (Donor Stability)
  // A donor cannot be recommended if the transfer causes the donor to violate its safety stock constraint
  // or leaves less than the required 24-hour operational stability floor above the safety buffer.
  const breachesSafetyBuffer = donorSafetyMargin < 0;
  const breachesOperationalStabilityFloor = donorBreachTimeHours !== null && donorBreachTimeHours < 24.0;
  const isDonorSafe = !breachesSafetyBuffer && !breachesOperationalStabilityFloor;
  
  // Calculate Recipient Post-Transfer State
  const recipientProjectedStock = recipientCurrentStock + transferQuantity;
  const recipientNewBreachTime = calculateTimeToBreach(recipientProjectedStock, recipientSafetyBuffer, recipientDailyDemand);
  
  let expectedShortageDelayHours: number | null = null;
  if (recipientBaseBreachTime !== null && recipientNewBreachTime !== null) {
    expectedShortageDelayHours = recipientNewBreachTime - recipientBaseBreachTime;
  } else if (recipientBaseBreachTime === null) {
    expectedShortageDelayHours = null; // No shortage
  } else {
    expectedShortageDelayHours = recipientNewBreachTime;
  }

  let isFeasible = true;
  let rejectionReason: string | null = null;

  if (breachesSafetyBuffer) {
    isFeasible = false;
    rejectionReason = "Rule R-08 (Donor Stability): Retained stock breaches donor safety buffer.";
  } else if (breachesOperationalStabilityFloor) {
    isFeasible = false;
    rejectionReason = `Rule R-08 (Donor Stability): Retained stock (${donorRemainingStock}) leaves only ${donorSafetyMargin} units margin, inducing donor safety breach in ${donorBreachTimeHours?.toFixed(1)}h (< 24h operational floor).`;
  }

  return {
    scenarioId: scenario.id,
    recipientProjectedStock,
    recipientBreachTimeHours: recipientNewBreachTime,
    expectedShortageDelayHours,
    coverageGain: transferQuantity,
    donorRemainingStock,
    donorSafetyMargin,
    donorBreachRisk: !isDonorSafe,
    travelTimeHours: donor.travelTimeHours,
    isFeasible,
    rejectionReason
  };
}

// ─── Deterministic Constraint-Based Optimizer ────────────────────────────────

export interface ScenarioRanking {
  scenarioId: string;
  evaluation: ScenarioEvaluation;
  /** Higher is better — 0 for infeasible or DO_NOTHING */
  score: number;
}

export interface OptimizerResult {
  recommendedScenarioId: string;
  recommendedQuantity: number;
  donorPhcId: string | null;
  recipientPhcId: string;
  /** Natural-language effect string (built from numbers — not invented by AI) */
  expectedEffect: string;
  donorEffect: string | null;
  alternatives: ScenarioRanking[];
  rejectedAlternatives: ScenarioRanking[];
  constraintViolations: string[];
  calculationEvidence: string[];
  allRankings: ScenarioRanking[];
}

/**
 * Scores a feasible scenario using clinical coverage duration and donor stability,
 * penalizing travel duration.
 * Prioritises sustained outbreak protection (+36h window) with resilient donor margin
 * — NOT simply nearest donor.
 * DO_NOTHING scores 0.
 */
function scoreScenario(evaluation: ScenarioEvaluation): number {
  if (!evaluation.isFeasible) return 0;
  if (evaluation.travelTimeHours === null) return 0;
  const coverageGainHours = evaluation.expectedShortageDelayHours ?? 0;
  return (coverageGainHours * 1.5) - (evaluation.travelTimeHours * 1.0);
}

/**
 * Deterministic constraint-based optimizer across all counterfactual scenarios.
 *
 * HARD CONSTRAINT: Any scenario that violates donor safety stock is REJECTED.
 * RULE: No LLM involved in any numerical result.
 */
export function optimizeIntervention(
  scenarios: CounterfactualScenario[],
  recipientPhcId: string,
  recipientCurrentStock: number,
  recipientSafetyBuffer: number,
  recipientDailyDemand: number
): OptimizerResult {
  const evidence: string[] = [];
  const violations: string[] = [];

  evidence.push(`STEP 1: Evaluate all ${scenarios.length} scenarios`);
  evidence.push(`  Recipient: ${recipientPhcId} | Stock: ${recipientCurrentStock} | Buffer: ${recipientSafetyBuffer} | Demand: ${recipientDailyDemand}/day`);

  const allRankings: ScenarioRanking[] = scenarios.map((s) => {
    const evaluation = evaluateInterventionScenario(
      s,
      recipientCurrentStock,
      recipientSafetyBuffer,
      recipientDailyDemand
    );
    const score = scoreScenario(evaluation);
    const donorId = s.donor?.phcId ?? "—";

    evidence.push(
      `  [${s.id}] type=${s.type} qty=${s.transferQuantity} donor=${donorId}` +
      ` → projStock=${evaluation.recipientProjectedStock}` +
      ` breachTime=${evaluation.recipientBreachTimeHours?.toFixed(1) ?? "null"}h` +
      ` donorMargin=${evaluation.donorSafetyMargin ?? "—"}` +
      ` feasible=${evaluation.isFeasible}` +
      ` score=${score.toFixed(3)}`
    );

    if (!evaluation.isFeasible && evaluation.rejectionReason) {
      violations.push(`[${s.id}] qty=${s.transferQuantity} from ${donorId}: ${evaluation.rejectionReason}`);
    }

    return { scenarioId: s.id, evaluation, score };
  });

  const feasible = allRankings
    .filter((r) => r.evaluation.isFeasible)
    .sort((a, b) => b.score - a.score);
  const rejected = allRankings.filter((r) => !r.evaluation.isFeasible);

  evidence.push(`STEP 2: ${feasible.length} feasible, ${rejected.length} rejected by constraint`);

  // Prefer the best-scored transfer; fall back to DO_NOTHING
  const bestTransfer = feasible.find((r) => {
    const s = scenarios.find((sc) => sc.id === r.scenarioId);
    return s?.type === "TRANSFER";
  });
  const doNothingRanking = feasible.find((r) => {
    const s = scenarios.find((sc) => sc.id === r.scenarioId);
    return s?.type === "DO_NOTHING";
  });
  const recommendation = bestTransfer ?? doNothingRanking ?? feasible[0];
  const recommendedScenario = scenarios.find((s) => s.id === recommendation.scenarioId)!;

  evidence.push(`STEP 3: Recommended = ${recommendation.scenarioId} | score = ${recommendation.score.toFixed(3)}`);

  const alternatives = feasible.filter((r) => r.scenarioId !== recommendation.scenarioId);

  const rec = recommendation.evaluation;
  const expectedEffect =
    rec.travelTimeHours !== null
      ? `+${(rec.expectedShortageDelayHours ?? 0).toFixed(1)}h shortage delay after ${rec.travelTimeHours}h delivery. Projected stock: ${rec.recipientProjectedStock}.`
      : `No transfer. Current breach in ${rec.recipientBreachTimeHours?.toFixed(1) ?? "N/A"}h.`;

  const donorEffect =
    rec.donorRemainingStock !== null
      ? `Remaining: ${rec.donorRemainingStock} (safety margin: ${rec.donorSafetyMargin ?? 0}). Breach risk: ${rec.donorBreachRisk ? "YES ⚠" : "NO ✓"}.`
      : null;

  return {
    recommendedScenarioId: recommendation.scenarioId,
    recommendedQuantity: recommendedScenario.transferQuantity,
    donorPhcId: recommendedScenario.donor?.phcId ?? null,
    recipientPhcId,
    expectedEffect,
    donorEffect,
    alternatives,
    rejectedAlternatives: rejected,
    constraintViolations: violations,
    calculationEvidence: evidence,
    allRankings,
  };
}
