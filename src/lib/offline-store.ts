/**
 * Offline Store for Swasthya-Sanket (IndexedDB)
 * 
 * Provides a reliable local queue for events captured offline.
 */

export interface OfflineEvent {
  idempotencyKey: string;
  type: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  payload: any;
  timestamp: number;
  status: "pending" | "failed";
  retryCount: number;
}

const DB_NAME = "swasthya_offline_db";
const STORE_NAME = "pending_events";
const DB_VERSION = 1;

let dbPromise: Promise<IDBDatabase> | null = null;

function getDB(): Promise<IDBDatabase> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("IndexedDB is not available on the server"));
  }

  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: "idempotencyKey" });
        }
      };

      request.onsuccess = (event: Event) => {
        resolve((event.target as IDBOpenDBRequest).result);
      };

      request.onerror = (event: Event) => {
        reject((event.target as IDBOpenDBRequest).error);
      };
    });
  }
  return dbPromise;
}

export async function savePendingEvent(event: OfflineEvent): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const request = store.put(event);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function getPendingEvents(): Promise<OfflineEvent[]> {
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  } catch (e) {
    console.warn("Could not get pending events (likely server-side)", e);
    return [];
  }
}

export async function removePendingEvent(idempotencyKey: string): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const request = store.delete(idempotencyKey);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function updatePendingEventStatus(idempotencyKey: string, status: "failed", retryCount: number): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const request = store.get(idempotencyKey);

    request.onsuccess = () => {
      const data = request.result as OfflineEvent;
      if (data) {
        data.status = status;
        data.retryCount = retryCount;
        store.put(data);
      }
      resolve();
    };
    request.onerror = () => reject(request.error);
  });
}
