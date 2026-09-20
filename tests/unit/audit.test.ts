import { describe, it, expect } from 'vitest';
import { createAuditEvent, verifyAuditChain, generateAuditHash } from '../../src/domain/audit';

describe('Audit Domain: Cryptographic Ledger', () => {
  it('should generate valid event hashes', () => {
    const event1 = createAuditEvent(
      'admin-1',
      'SUPER_ADMIN',
      'TRANSFER_APPROVED',
      'Transfer:123',
      { status: 'RECOMMENDED' },
      { status: 'APPROVED' },
      'CORR-01',
      '0000000000000000000000000000000000000000000000000000000000000000'
    );
    
    expect(event1.hash).toBeDefined();
    expect(event1.hash.length).toBe(64); // SHA-256 hex length
    
    const { hash, ...eventWithoutHash } = event1;
    expect(generateAuditHash(eventWithoutHash)).toBe(hash);
  });

  it('should verify a valid chain', () => {
    const event1 = createAuditEvent(
      'admin-1',
      'SUPER_ADMIN',
      'CREATE',
      'Entity:1',
      {},
      { qty: 100 },
      'CORR-1',
      '0000'
    );
    
    const event2 = createAuditEvent(
      'user-1',
      'USER',
      'UPDATE',
      'Entity:1',
      { qty: 100 },
      { qty: 80 },
      'CORR-2',
      event1.hash
    );

    const result = verifyAuditChain([event1, event2]);
    expect(result.valid).toBe(true);
  });

  it('should detect a broken previousHash link', () => {
    const event1 = createAuditEvent('admin-1', 'SUPER_ADMIN', 'CREATE', 'Entity:1', {}, {}, 'CORR-1', '0000');
    const event2 = createAuditEvent('user-1', 'USER', 'UPDATE', 'Entity:1', {}, {}, 'CORR-2', 'INVALID_PREV_HASH');

    const result = verifyAuditChain([event1, event2]);
    expect(result.valid).toBe(false);
    expect(result.brokenAtIndex).toBe(1);
    expect(result.message).toMatch(/previousHash does not match/);
  });

  it('should detect unauthorized content mutation', () => {
    const event1 = createAuditEvent('admin-1', 'SUPER_ADMIN', 'CREATE', 'Entity:1', { qty: 120 }, { qty: 120 }, 'CORR-1', '0000');
    const event2 = createAuditEvent('user-1', 'USER', 'UPDATE', 'Entity:1', { qty: 120 }, { qty: 100 }, 'CORR-2', event1.hash);

    const chain = [event1, event2];

    // Malicious actor tampers with history silently without recalculating hashes
    chain[0] = { ...chain[0], after: { qty: 100 } };

    const result = verifyAuditChain(chain);
    expect(result.valid).toBe(false);
    expect(result.brokenAtIndex).toBe(0);
    expect(result.message).toMatch(/hash does not match content/);
  });
});
