"use server";

import { Role } from "@/domain/enums";
import { Permission, hasPermission } from "../../lib/permissions";
import { canTransition, calculateDiscrepancy, TransferStatus } from "../../domain/transfers";
import { TransferStore } from "../../lib/transfer-store";
import { AuditStore } from "../../lib/audit-store";

function enforcePermission(role: Role, permission: Permission) {
  if (!hasPermission(role, permission)) {
    throw new Error(`Unauthorized: Missing ${permission}`);
  }
}

// Helper to log to both event ledger and audit store
async function logStateChange(id: string, transfer: any, type: TransferStatus, userId: string, role: string, payload?: any) {
  let quantity = transfer.dispatchedQuantity ?? transfer.authorizedQuantity;
  if (type === "RECEIVED" && payload?.receivedQuantity !== undefined) {
    quantity = payload.receivedQuantity;
  }
  
  const correlationId = `CORR-${Date.now()}`;
  
  // 1. Immutable Event Ledger (Resource specific)
  await TransferStore.appendEvent(
    id, 
    type, 
    userId, 
    transfer.donorName, 
    transfer.medicineName, 
    quantity, 
    correlationId, 
    payload
  );

  // 2. System Audit Log (Global)
  const afterState = { ...transfer, status: type, updatedAt: new Date().toISOString() };
  await AuditStore.appendLog(
    userId,
    role,
    `TRANSFER_${type}`,
    `Transfer:${id}`,
    transfer,
    afterState,
    correlationId
  );
}

export async function getTransferDetailAction(id: string) {
  const transfer = await TransferStore.getTransfer(id);
  if (!transfer) throw new Error("Transfer not found");
  return transfer;
}

export async function approveTransferAction(id: string, userRole: Role, userId: string) {
  enforcePermission(userRole, Permission.APPROVE_TRANSFER);
  
  const transfer = await TransferStore.getTransfer(id);
  if (!transfer) throw new Error("Transfer not found");
  
  if (!canTransition(transfer.status, "APPROVED")) {
    throw new Error(`Invalid transition from ${transfer.status} to APPROVED`);
  }

  await TransferStore.updateTransfer(id, { status: "APPROVED" });
  await logStateChange(id, transfer, "APPROVED", userId, userRole);
  
  return await TransferStore.getTransfer(id);
}

export async function rejectTransferAction(id: string, userRole: Role, userId: string, reason: string) {
  enforcePermission(userRole, Permission.REJECT_TRANSFER);
  
  const transfer = await TransferStore.getTransfer(id);
  if (!transfer) throw new Error("Transfer not found");
  
  if (!canTransition(transfer.status, "REJECTED")) {
    throw new Error(`Invalid transition from ${transfer.status} to REJECTED`);
  }

  await TransferStore.updateTransfer(id, { status: "REJECTED" });
  await logStateChange(id, transfer, "REJECTED", userId, userRole, { reason });
  
  return await TransferStore.getTransfer(id);
}

export async function dispatchTransferAction(id: string, userRole: Role, userId: string) {
  enforcePermission(userRole, Permission.DISPATCH_TRANSFER);
  
  const transfer = await TransferStore.getTransfer(id);
  if (!transfer) throw new Error("Transfer not found");
  
  if (!canTransition(transfer.status, "DISPATCHED")) {
    throw new Error(`Invalid transition from ${transfer.status} to DISPATCHED`);
  }

  await TransferStore.updateTransfer(id, { 
    status: "DISPATCHED",
    dispatchedQuantity: transfer.authorizedQuantity
  });
  await logStateChange(id, transfer, "DISPATCHED", userId, userRole, { dispatchedQuantity: transfer.authorizedQuantity });
  
  return await TransferStore.getTransfer(id);
}

export async function markInTransitAction(id: string, userId: string) {
  const transfer = await TransferStore.getTransfer(id);
  if (!transfer) throw new Error("Transfer not found");
  
  if (!canTransition(transfer.status, "IN_TRANSIT")) {
    throw new Error(`Invalid transition from ${transfer.status} to IN_TRANSIT`);
  }

  await TransferStore.updateTransfer(id, { status: "IN_TRANSIT" });
  await logStateChange(id, transfer, "IN_TRANSIT", userId, Role.SUPER_ADMIN); // System trigger
  
  return await TransferStore.getTransfer(id);
}

export async function receiveTransferAction(id: string, userRole: Role, userId: string, receivedQuantity: number) {
  enforcePermission(userRole, Permission.CONFIRM_RECEIPT);
  
  const transfer = await TransferStore.getTransfer(id);
  if (!transfer) throw new Error("Transfer not found");
  
  if (!canTransition(transfer.status, "RECEIVED")) {
    throw new Error(`Invalid transition from ${transfer.status} to RECEIVED`);
  }

  const expectedQuantity = transfer.dispatchedQuantity ?? transfer.authorizedQuantity;
  const discrepancy = calculateDiscrepancy(expectedQuantity, receivedQuantity);
  
  const nextStatus: TransferStatus = discrepancy === 0 ? "RECONCILED" : "EXCEPTION";

  await TransferStore.updateTransfer(id, { 
    status: nextStatus,
    receivedQuantity,
    discrepancy
  });
  
  await logStateChange(id, transfer, "RECEIVED", userId, userRole, { receivedQuantity });

  // Add the next step automatically for Exception/Reconciled state
  const receivedTransfer = await TransferStore.getTransfer(id);
  await logStateChange(id, receivedTransfer, nextStatus, userId, userRole, { 
    discrepancy, 
    expected: expectedQuantity, 
    actual: receivedQuantity 
  });
  
  return await TransferStore.getTransfer(id);
}

export async function reconcileTransferAction(id: string, userRole: Role, userId: string, notes: string) {
  enforcePermission(userRole, Permission.RECONCILE_TRANSFER);
  
  const transfer = await TransferStore.getTransfer(id);
  if (!transfer) throw new Error("Transfer not found");
  
  if (!canTransition(transfer.status, "RECONCILED")) {
    throw new Error(`Invalid transition from ${transfer.status} to RECONCILED`);
  }

  await TransferStore.updateTransfer(id, { status: "RECONCILED" });
  await logStateChange(id, transfer, "RECONCILED", userId, userRole, { notes });
  
  return await TransferStore.getTransfer(id);
}

export async function getTransfersListAction() {
  const { prisma } = await import("@/lib/db");
  const transfers = await prisma.transfer.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      sourceFacility: true,
      destFacility: true,
      medicine: true
    }
  });

  return transfers.map(t => ({
    id: t.id,
    donorName: t.sourceFacility.name,
    recipientName: t.destFacility.name,
    medicineName: t.medicine.name,
    authorizedQuantity: t.quantity,
    status: t.status as TransferStatus,
    createdAt: t.createdAt.toISOString()
  }));
}
