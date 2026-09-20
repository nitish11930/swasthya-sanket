import { TransferDetail, TransferStatus, createTransferEvent, TransferEvent } from "../domain/transfers";
import { prisma } from "./db";

const INITIAL_HASH = "0000000000000000000000000000000000000000000000000000000000000000";

export class TransferStore {
  static async getTransfer(id: string): Promise<TransferDetail | undefined> {
    const transfer = await prisma.transfer.findUnique({
      where: { id },
      include: {
        sourceFacility: true,
        destFacility: true,
        medicine: true,
        events: {
          orderBy: { timestamp: 'asc' }
        }
      }
    });

    if (!transfer) return undefined;

    // Map Prisma models to our domain TransferDetail
    const receivedEvent = transfer.events.find(e => e.type === "RECEIVED");
    const dispatchedEvent = transfer.events.find(e => e.type === "DISPATCHED");

    return {
      id: transfer.id,
      title: "Priority Stock Relocation",
      donorId: transfer.sourceFacilityId,
      donorName: transfer.sourceFacility.name,
      recipientId: transfer.destFacilityId,
      recipientName: transfer.destFacility.name,
      medicineId: transfer.medicineId,
      medicineName: transfer.medicine.name,
      authorizedQuantity: transfer.quantity,
      dispatchedQuantity: dispatchedEvent ? dispatchedEvent.quantity : undefined,
      receivedQuantity: receivedEvent ? receivedEvent.quantity : undefined,
      status: transfer.status as TransferStatus,
      discrepancy: receivedEvent && dispatchedEvent ? receivedEvent.quantity - dispatchedEvent.quantity : undefined,
      createdAt: transfer.createdAt.toISOString(),
      updatedAt: transfer.updatedAt.toISOString(),
      events: transfer.events.map(e => ({
        id: e.id,
        transferId: e.transferId,
        type: e.type as TransferStatus,
        actorId: e.actorId,
        facility: e.facility,
        entity: e.entity,
        quantity: e.quantity,
        status: e.status as TransferStatus,
        correlationId: e.correlationId,
        timestamp: e.timestamp.toISOString(),
        payload: e.payload ? JSON.parse(e.payload) : undefined,
        previousHash: e.previousHash,
        hash: e.hash
      }))
    };
  }

  static async updateTransfer(id: string, updates: Partial<TransferDetail>): Promise<TransferDetail> {
    const data: any = {};
    if (updates.status) data.status = updates.status;
    
    await prisma.transfer.update({
      where: { id },
      data
    });

    const updated = await this.getTransfer(id);
    if (!updated) throw new Error("Failed to retrieve updated transfer");
    return updated;
  }

  static async appendEvent(
    id: string, 
    type: TransferStatus, 
    actorId: string, 
    facility: string,
    entity: string,
    quantity: number,
    correlationId: string,
    payload?: any
  ): Promise<TransferDetail> {
    // Determine previous hash
    const lastEvent = await prisma.transferEvent.findFirst({
      where: { transferId: id },
      orderBy: { timestamp: 'desc' }
    });
    
    const previousHash = lastEvent ? lastEvent.hash : INITIAL_HASH;

    // Use domain function to generate hash
    const newEvent = createTransferEvent(id, type, actorId, previousHash, facility, entity, quantity, correlationId, payload);
    
    await prisma.transferEvent.create({
      data: {
        id: newEvent.id,
        transferId: newEvent.transferId,
        type: newEvent.type,
        actorId: newEvent.actorId,
        facility: newEvent.facility,
        entity: newEvent.entity,
        quantity: newEvent.quantity,
        status: newEvent.status,
        correlationId: newEvent.correlationId,
        timestamp: new Date(newEvent.timestamp),
        payload: newEvent.payload ? JSON.stringify(newEvent.payload) : null,
        previousHash: newEvent.previousHash,
        hash: newEvent.hash
      }
    });

    const updated = await this.getTransfer(id);
    if (!updated) throw new Error("Failed to retrieve updated transfer");
    return updated;
  }

  static async tamperWithEvent(transferId: string, eventIndex: number, updates: any): Promise<void> {
    const events = await prisma.transferEvent.findMany({
      where: { transferId },
      orderBy: { timestamp: 'asc' }
    });

    if (events[eventIndex]) {
      const targetEvent = events[eventIndex];
      const data: any = {};
      
      if (updates.quantity !== undefined) data.quantity = updates.quantity;
      if (updates.type) data.type = updates.type;
      
      // Update DB silently without changing the hash
      await prisma.transferEvent.update({
        where: { id: targetEvent.id },
        data
      });
    }
  }
}
