/**
 * Feature: Offline
 * Phase 0 stub.
 *
 * Offline events are queued in IndexedDB and synced when connectivity is restored.
 *
 * RULE: Offline events must NEVER silently disappear.
 * RULE: Server rejects conflicting events with HTTP 409 — user must resolve.
 * RULE: Each queued event has a unique client-generated idempotency key.
 */

export type OfflineEventStatus = "PENDING" | "SYNCING" | "SYNCED" | "CONFLICT" | "FAILED";

export interface OfflineQueuedEvent {
  id: string;              // client-generated UUID
  idempotencyKey: string;  // prevents duplicate server-side processing
  endpoint: string;
  method: "POST" | "PUT" | "PATCH";
  body: Record<string, unknown>;
  status: OfflineEventStatus;
  retryCount: number;
  createdAt: number;       // Unix timestamp
  lastAttemptAt?: number;
}

// TODO Phase 3: IndexedDB queue implementation
// - openDB() with 'offline-queue' object store
// - enqueue(event: OfflineQueuedEvent) → void
// - sync() → SyncResult
// - getQueueLength() → number
