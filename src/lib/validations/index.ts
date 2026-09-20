/**
 * Zod Validation Schemas — SWASTHYA-SANKET
 *
 * All API inputs MUST be validated here before reaching domain logic.
 *
 * RULE: Validation runs server-side. Frontend validation is UX only.
 * RULE: Never trust client-provided quantities, roles, or IDs.
 *
 * Phase 0: Core schemas defined. Expanded in Phase 1 with DB-backed checks.
 */

import { z } from "zod";

// ─── Common ──────────────────────────────────────────────────────────────────

export const PositiveIntSchema = z.number().int().positive();
export const NonNegativeIntSchema = z.number().int().nonnegative();
export const UUIDSchema = z.string().uuid();

// ─── Auth ─────────────────────────────────────────────────────────────────────

export const LoginSchema = z.object({
  employeeId: z
    .string()
    .min(4, "Employee ID must be at least 4 characters")
    .max(50)
    .regex(/^[A-Z0-9\-]+$/i, "Invalid Employee ID format"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(200),
});

export type LoginInput = z.infer<typeof LoginSchema>;

// ─── Inventory ────────────────────────────────────────────────────────────────

export const LogInventoryEventSchema = z.object({
  phcId: UUIDSchema,
  medicineId: UUIDSchema,
  quantity: NonNegativeIntSchema,
  eventType: z.enum(["RECEIPT", "DISPENSING", "ADJUSTMENT", "EXPIRY", "LOSS"]),
  notes: z.string().max(500).optional(),
  occurredAt: z.string().datetime().optional(),
});

export type LogInventoryEventInput = z.infer<typeof LogInventoryEventSchema>;

// ─── Transfer ─────────────────────────────────────────────────────────────────

export const TransferRequestSchema = z.object({
  donorPhcId: UUIDSchema,
  recipientPhcId: UUIDSchema,
  medicineId: UUIDSchema,
  requestedQuantity: PositiveIntSchema,
  urgencyLevel: z.enum(["CRITICAL", "HIGH", "MEDIUM", "LOW"]),
  notes: z.string().max(500).optional(),
});

export type TransferRequestInput = z.infer<typeof TransferRequestSchema>;

export const TransferApprovalSchema = z.object({
  transferId: UUIDSchema,
  action: z.enum(["APPROVE", "REJECT"]),
  approvedQuantity: PositiveIntSchema.optional(),
  rejectionReason: z.string().max(500).optional(),
});

export type TransferApprovalInput = z.infer<typeof TransferApprovalSchema>;

export const TransferReceiptSchema = z.object({
  transferId: UUIDSchema,
  receivedQuantity: NonNegativeIntSchema,
  receivedAt: z.string().datetime().optional(),
  notes: z.string().max(500).optional(),
});

export type TransferReceiptInput = z.infer<typeof TransferReceiptSchema>;

// ─── Audit ────────────────────────────────────────────────────────────────────

export const AuditQuerySchema = z.object({
  phcId: UUIDSchema.optional(),
  actorId: UUIDSchema.optional(),
  action: z.string().optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  limit: z.number().int().min(1).max(100).default(50),
  offset: z.number().int().nonnegative().default(0),
});

export type AuditQueryInput = z.infer<typeof AuditQuerySchema>;
