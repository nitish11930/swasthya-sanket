/**
 * Feature: Audit
 * Phase 0 stub.
 *
 * RULE: audit_log is APPEND-ONLY. No UPDATE or DELETE.
 * RULE: Every state-changing action writes an audit record.
 * RULE: Audit records include: actor, role, action, entity, before/after, timestamp.
 */

export type AuditAction =
  | "USER_LOGIN"
  | "USER_LOGOUT"
  | "INVENTORY_EVENT_LOGGED"
  | "TRANSFER_REQUESTED"
  | "TRANSFER_APPROVED"
  | "TRANSFER_REJECTED"
  | "TRANSFER_DISPATCHED"
  | "TRANSFER_RECEIVED"
  | "TRANSFER_RECONCILED"
  | "DISCREPANCY_FLAGGED"
  | "DISCREPANCY_RESOLVED";

export interface AuditLogEntry {
  id: string;
  actorId: string;
  actorRole: string;
  action: AuditAction;
  entityType: string;
  entityId: string;
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  occurredAt: Date;
}
