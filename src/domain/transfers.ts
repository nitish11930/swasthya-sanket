import { createHash } from 'crypto';

export type TransferStatus =
  | "RECOMMENDED"
  | "APPROVED"
  | "DISPATCHED"
  | "IN_TRANSIT"
  | "RECEIVED"
  | "RECONCILED"
  | "EXCEPTION"
  | "REJECTED";

export interface TransferEvent {
  id: string;
  transferId: string;
  type: TransferStatus;
  actorId: string;
  facility: string;
  entity: string;
  quantity: number;
  status: TransferStatus;
  correlationId: string;
  timestamp: string;
  payload?: any;
  previousHash: string;
  hash: string;
}

export interface TransferDetail {
  id: string;
  title: string;
  donorId: string;
  donorName: string;
  recipientId: string;
  recipientName: string;
  medicineId: string;
  medicineName: string;
  authorizedQuantity: number;
  dispatchedQuantity?: number;
  receivedQuantity?: number;
  status: TransferStatus;
  events: TransferEvent[];
  createdAt: string;
  updatedAt: string;
  discrepancy?: number;
}

// ─── State Machine ──────────────────────────────────────────────

export function canTransition(current: TransferStatus, next: TransferStatus): boolean {
  const allowedTransitions: Record<TransferStatus, TransferStatus[]> = {
    RECOMMENDED: ["APPROVED", "REJECTED"],
    APPROVED: ["DISPATCHED"],
    DISPATCHED: ["IN_TRANSIT"],
    IN_TRANSIT: ["RECEIVED"],
    RECEIVED: ["RECONCILED", "EXCEPTION"],
    EXCEPTION: ["RECONCILED"],
    RECONCILED: [],
    REJECTED: [],
  };

  return allowedTransitions[current]?.includes(next) ?? false;
}

// ─── Immutable Ledger ───────────────────────────────────────────

export function generateEventHash(eventData: Omit<TransferEvent, 'hash'>): string {
  const dataString = `${eventData.id}:${eventData.transferId}:${eventData.type}:${eventData.actorId}:${eventData.facility}:${eventData.entity}:${eventData.quantity}:${eventData.status}:${eventData.correlationId}:${eventData.timestamp}:${eventData.previousHash}:${JSON.stringify(eventData.payload || {})}`;
  return createHash('sha256').update(dataString).digest('hex');
}

export function createTransferEvent(
  transferId: string,
  type: TransferStatus,
  actorId: string,
  previousHash: string,
  facility: string,
  entity: string,
  quantity: number,
  correlationId: string,
  payload?: any
): TransferEvent {
  const eventWithoutHash: Omit<TransferEvent, 'hash'> = {
    id: `EVT-${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
    transferId,
    type,
    actorId,
    facility,
    entity,
    quantity,
    status: type,
    correlationId,
    timestamp: new Date().toISOString(),
    previousHash,
    payload,
  };

  return {
    ...eventWithoutHash,
    hash: generateEventHash(eventWithoutHash),
  };
}

export function verifyTransferChain(events: TransferEvent[]): { valid: boolean, brokenAtIndex?: number, message: string } {
  if (events.length === 0) return { valid: true, message: "Chain is empty but valid" };

  for (let i = 0; i < events.length; i++) {
    const event = events[i];
    const { hash, ...eventWithoutHash } = event;
    const computedHash = generateEventHash(eventWithoutHash);
    
    if (computedHash !== hash) {
      return { valid: false, brokenAtIndex: i, message: `Tamper detected: Block ${event.id} hash mismatch.` };
    }

    if (i > 0) {
      const prevEvent = events[i - 1];
      if (event.previousHash !== prevEvent.hash) {
        return { valid: false, brokenAtIndex: i, message: `Tamper detected: Block ${event.id} previousHash mismatch.` };
      }
    }
  }

  return { valid: true, message: "Cryptographic chain is intact." };
}

export function calculateDiscrepancy(authorized: number, received: number): number {
  // 120 authorized, 100 received -> -20 discrepancy
  return received - authorized;
}
