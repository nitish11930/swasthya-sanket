import { describe, it, expect, beforeEach } from 'vitest';
import { canTransition, calculateDiscrepancy } from '../../src/domain/transfers';
import { TransferStore } from '../../src/lib/transfer-store';
import { approveTransferAction, dispatchTransferAction, markInTransitAction, receiveTransferAction, reconcileTransferAction } from '../../src/features/transfers/actions';
import { Role } from '../../src/domain/enums';
import { prisma } from '../../src/lib/db';

describe('Transfer Domain', () => {
  it('allows valid state transitions', () => {
    expect(canTransition('RECOMMENDED', 'APPROVED')).toBe(true);
    expect(canTransition('APPROVED', 'DISPATCHED')).toBe(true);
    expect(canTransition('DISPATCHED', 'IN_TRANSIT')).toBe(true);
    expect(canTransition('IN_TRANSIT', 'RECEIVED')).toBe(true);
    expect(canTransition('RECEIVED', 'RECONCILED')).toBe(true);
    expect(canTransition('RECEIVED', 'EXCEPTION')).toBe(true);
  });

  it('rejects invalid state transitions', () => {
    expect(canTransition('RECOMMENDED', 'DISPATCHED')).toBe(false);
    expect(canTransition('APPROVED', 'RECONCILED')).toBe(false);
    expect(canTransition('DISPATCHED', 'APPROVED')).toBe(false);
  });

  it('calculates factual discrepancy', () => {
    expect(calculateDiscrepancy(120, 100)).toBe(-20);
    expect(calculateDiscrepancy(120, 120)).toBe(0);
    expect(calculateDiscrepancy(120, 130)).toBe(10);
  });
});

describe('Transfer Actions & Store', () => {
  const HERO_ID = 'TR-00427';
  
  beforeEach(async () => {
    // Reset store before each test 
    await prisma.transferEvent.deleteMany({
      where: { transferId: HERO_ID, type: { not: 'RECOMMENDED' } }
    });
    await TransferStore.updateTransfer(HERO_ID, { status: 'RECOMMENDED' });
  });

  it('enforces RBAC for approvals', async () => {
    await expect(
      approveTransferAction(HERO_ID, Role.FIELD_WORKER, 'user-1')
    ).rejects.toThrow(/Unauthorized/);

    const approved = await approveTransferAction(HERO_ID, Role.DISTRICT_OFFICER, 'user-2');
    expect(approved?.status).toBe('APPROVED');
  });

  it('handles the full valid lifecycle to RECONCILED', async () => {
    await approveTransferAction(HERO_ID, Role.DISTRICT_OFFICER, 'do-1');
    await dispatchTransferAction(HERO_ID, Role.PHC_ADMIN, 'admin-1');
    await markInTransitAction(HERO_ID, 'system');
    const received = await receiveTransferAction(HERO_ID, Role.PHC_ADMIN, 'admin-2', 120);
    
    expect(received?.status).toBe('RECONCILED'); // 120 == 120, auto-reconciles in action
    expect(received?.discrepancy).toBe(0);
  });

  it('handles the discrepancy hero flow to EXCEPTION', async () => {
    await approveTransferAction(HERO_ID, Role.DISTRICT_OFFICER, 'do-1');
    await dispatchTransferAction(HERO_ID, Role.PHC_ADMIN, 'admin-1');
    await markInTransitAction(HERO_ID, 'system');
    
    // Receive 100 against 120 authorized
    const received = await receiveTransferAction(HERO_ID, Role.PHC_ADMIN, 'admin-2', 100);
    
    expect(received?.status).toBe('EXCEPTION');
    expect(received?.discrepancy).toBe(-20);
    
    // Test manual reconciliation of exception
    const reconciled = await reconcileTransferAction(HERO_ID, Role.DISTRICT_OFFICER, 'do-1', 'Investigated and resolved');
    expect(reconciled?.status).toBe('RECONCILED');
  });
});
