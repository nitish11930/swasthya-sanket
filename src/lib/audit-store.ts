import { AuditEvent, createAuditEvent } from "../domain/audit";
import { prisma } from "./db";

const INITIAL_HASH = "0000000000000000000000000000000000000000000000000000000000000000";

export class AuditStore {
  static async getLogs(): Promise<AuditEvent[]> {
    const logs = await prisma.auditLog.findMany({
      orderBy: { timestamp: 'asc' }
    });
    
    return logs.map(log => ({
      id: log.id,
      action: log.action,
      actor: log.userId || "SYSTEM",
      role: log.role,
      entity: `${log.entityName}:${log.entityId}`,
      before: JSON.parse(log.changesBefore),
      after: JSON.parse(log.changesAfter),
      correlationId: log.correlationId,
      previousHash: log.previousHash,
      hash: log.hash,
      timestamp: log.timestamp.toISOString()
    }));
  }

  static async appendLog(
    actor: string,
    role: string,
    action: string,
    entity: string, // e.g. "Transfer:TR-00427"
    before: any,
    after: any,
    correlationId: string
  ): Promise<AuditEvent> {
    const [entityName, entityId] = entity.split(":");
    
    // Determine previous hash safely by querying the DB
    const lastEvent = await prisma.auditLog.findFirst({
      orderBy: { timestamp: 'desc' }
    });
    
    const previousHash = lastEvent ? lastEvent.hash : INITIAL_HASH;

    // Use our domain function to calculate the hash
    const newEvent = createAuditEvent(actor, role, action, entity, before, after, correlationId, previousHash);
    
    // Append to DB
    await prisma.auditLog.create({
      data: {
        id: newEvent.id,
        action: newEvent.action,
        entityName,
        entityId,
        userId: actor.length === 36 ? actor : null, // If actor is a uuid, link it. Otherwise null.
        role: newEvent.role,
        changesBefore: JSON.stringify(newEvent.before),
        changesAfter: JSON.stringify(newEvent.after),
        correlationId: newEvent.correlationId,
        previousHash: newEvent.previousHash,
        hash: newEvent.hash,
        timestamp: new Date(newEvent.timestamp)
      }
    });
    
    return newEvent;
  }

  static async tamperWithLog(index: number, updates: Partial<AuditEvent>): Promise<void> {
    const logs = await prisma.auditLog.findMany({
      orderBy: { timestamp: 'asc' }
    });
    
    if (index >= 0 && index < logs.length) {
      const targetLog = logs[index];
      
      const updateData: any = {};
      if (updates.action) updateData.action = updates.action;
      if (updates.after) updateData.changesAfter = JSON.stringify(updates.after);
      if (updates.previousHash) updateData.previousHash = updates.previousHash;
      
      // Update the DB silently without updating the hash field
      await prisma.auditLog.update({
        where: { id: targetLog.id },
        data: updateData
      });
    }
  }
}
