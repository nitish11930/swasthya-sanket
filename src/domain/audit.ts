import { createHash } from 'crypto';

export interface AuditEvent {
  id: string;
  hash: string;
  previousHash: string;
  actor: string;
  role: string;
  timestamp: string;
  action: string;
  entity: string;
  before: any;
  after: any;
  correlationId: string;
}

export function generateAuditHash(eventData: Omit<AuditEvent, 'hash'>): string {
  const dataString = `${eventData.id}:${eventData.previousHash}:${eventData.actor}:${eventData.role}:${eventData.timestamp}:${eventData.action}:${eventData.entity}:${JSON.stringify(eventData.before)}:${JSON.stringify(eventData.after)}:${eventData.correlationId}`;
  return createHash('sha256').update(dataString).digest('hex');
}

export function createAuditEvent(
  actor: string,
  role: string,
  action: string,
  entity: string,
  before: any,
  after: any,
  correlationId: string,
  previousHash: string
): AuditEvent {
  const eventWithoutHash: Omit<AuditEvent, 'hash'> = {
    id: `AUD-${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
    previousHash,
    actor,
    role,
    timestamp: new Date().toISOString(),
    action,
    entity,
    before,
    after,
    correlationId,
  };

  return {
    ...eventWithoutHash,
    hash: generateAuditHash(eventWithoutHash),
  };
}

export interface VerificationResult {
  valid: boolean;
  brokenAtIndex?: number;
  message: string;
}

export function verifyAuditChain(events: AuditEvent[]): VerificationResult {
  if (events.length === 0) return { valid: true, message: "Chain is empty but valid" };

  for (let i = 0; i < events.length; i++) {
    const event = events[i];

    // Verify current block hash
    const { hash, ...eventWithoutHash } = event;
    const computedHash = generateAuditHash(eventWithoutHash);
    
    if (computedHash !== hash) {
      return {
        valid: false,
        brokenAtIndex: i,
        message: `Tamper detected: Block ${event.id} hash does not match content.`
      };
    }

    // Verify chain linkage
    if (i > 0) {
      const prevEvent = events[i - 1];
      if (event.previousHash !== prevEvent.hash) {
        return {
          valid: false,
          brokenAtIndex: i,
          message: `Tamper detected: Block ${event.id} previousHash does not match Block ${prevEvent.id} hash.`
        };
      }
    }
  }

  return { valid: true, message: "Cryptographic chain is intact." };
}
