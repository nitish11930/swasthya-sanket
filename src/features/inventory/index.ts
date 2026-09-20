/**
 * Feature: Inventory
 * Phase 0 stub.
 * Phase 1: Server actions for logging events, reading stock levels.
 * Phase 2: Real-time stock monitoring, low-stock alerts.
 */

export type InventoryEventType =
  | "RECEIPT"
  | "DISPENSING"
  | "ADJUSTMENT"
  | "EXPIRY"
  | "LOSS";

export interface InventoryEvent {
  id: string;
  phcId: string;
  medicineId: string;
  quantity: number;
  eventType: InventoryEventType;
  actorId: string;
  notes?: string;
  occurredAt: Date;
  createdAt: Date;
}
