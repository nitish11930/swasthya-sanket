/**
 * Feature: Transfers
 * Phase 0 stub.
 *
 * Transfer workflow (all steps require human action):
 *   REQUESTED → SIMULATED → APPROVED → DISPATCHED → RECEIVED → RECONCILED
 *
 * RULE: AI can suggest options (step SIMULATED) but cannot APPROVE.
 * RULE: Backend enforces donor safety constraint — never trust frontend.
 */

export type TransferStatus =
  | "REQUESTED"
  | "SIMULATED"
  | "APPROVED"
  | "REJECTED"
  | "DISPATCHED"
  | "RECEIVED"
  | "RECONCILED"
  | "DISCREPANCY_FLAGGED";

export interface Transfer {
  id: string;
  donorPhcId: string;
  recipientPhcId: string;
  medicineId: string;
  requestedQuantity: number;
  approvedQuantity?: number;
  dispatchedQuantity?: number;
  receivedQuantity?: number;
  status: TransferStatus;
  requestedById: string;
  approvedById?: string;
  createdAt: Date;
  updatedAt: Date;
}
