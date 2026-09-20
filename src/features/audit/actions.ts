"use server";

import { AuditStore } from "../../lib/audit-store";
import { TransferStore } from "../../lib/transfer-store";
import { verifyAuditChain } from "../../domain/audit";
import { verifyTransferChain } from "../../domain/transfers";

export async function getAuditLogsAction() {
  return await AuditStore.getLogs();
}

export async function verifyAuditChainAction() {
  const logs = await AuditStore.getLogs();
  return verifyAuditChain(logs);
}

export async function verifyTransferChainAction(transferId: string) {
  const transfer = await TransferStore.getTransfer(transferId);
  if (!transfer) throw new Error("Transfer not found");
  return verifyTransferChain(transfer.events);
}

export async function tamperAuditLogAction(index: number, updates: any) {
  await AuditStore.tamperWithLog(index, updates);
  return true;
}

export async function tamperTransferEventAction(transferId: string, eventIndex: number, updates: any) {
  await TransferStore.tamperWithEvent(transferId, eventIndex, updates);
  return true;
}
