"use client";

import { useState, useEffect, useTransition } from "react";
import { parseTranscriptAction, commitFieldEventsAction, type ExtractedEvent } from "./actions";
import { savePendingEvent, getPendingEvents, removePendingEvent, type OfflineEvent } from "@/lib/offline-store";
import { getStoredSettings } from "@/lib/settings";

export default function CaptureClient({ phcName, block, deviceId }: { phcName: string, block: string, deviceId: string }) {
  const [isOnline, setIsOnline] = useState(true);
  const [pendingQueue, setPendingQueue] = useState<OfflineEvent[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStrategy, setSyncStrategy] = useState("auto");
  
  const [transcript, setTranscript] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [extractedEvents, setExtractedEvents] = useState<ExtractedEvent[]>([]);
  
  const [isPending, startTransition] = useTransition();

  const loadQueue = async () => {
    const events = await getPendingEvents();
    setPendingQueue(events);
  };

  const syncPendingQueue = async () => {
    if (!navigator.onLine || isSyncing) return;
    setIsSyncing(true);
    try {
      const events = await getPendingEvents();
      for (const ev of events) {
        if (ev.type === "FIELD_CAPTURE") {
          const res = await commitFieldEventsAction(ev.payload);
          if (res.success || res.error?.includes("Already synced")) {
            await removePendingEvent(ev.idempotencyKey);
          }
        }
      }
      await loadQueue();
    } finally {
      setIsSyncing(false);
    }
  };

  // Network & Sync Loop
  useEffect(() => {
    const settings = getStoredSettings();
    setSyncStrategy(settings.fieldCaptureSync);

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsOnline(navigator.onLine);
    const handleOnline = () => { 
      setIsOnline(true); 
      if (getStoredSettings().fieldCaptureSync === "auto") syncPendingQueue(); 
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Initial load of queue
    loadQueue();

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSimulateTranscript = async () => {
    if (!transcript) return;
    startTransition(async () => {
      const res = await parseTranscriptAction(transcript);
      if (res.success && res.data) {
        setExtractedEvents(res.data);
      } else {
        alert(res.error || "Failed to extract events.");
      }
    });
  };

  const handleConfirmAndQueue = async () => {
    if (extractedEvents.length === 0) return;
    
    const idempotencyKey = crypto.randomUUID();
    const payload = {
      idempotencyKey,
      events: extractedEvents,
      transcript,
    };

    // Save to indexedDB immediately
    await savePendingEvent({
      idempotencyKey,
      type: "FIELD_CAPTURE",
      payload,
      timestamp: Date.now(),
      status: "pending",
      retryCount: 0
    });

    await loadQueue();
    setTranscript("");
    setExtractedEvents([]);

    // Attempt sync if online
    if (navigator.onLine && getStoredSettings().fieldCaptureSync === "auto") {
      syncPendingQueue();
    }
  };

  const removeEvent = (id: string) => {
    setExtractedEvents(prev => prev.filter(e => e.id !== id));
  };

  return (
    <>
      {/* PHC Header */}
      <div className="card animate-fade-in" style={{ padding: "12px 16px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
          <div>
            <h1 className="text-headline-md">{phcName}</h1>
            <span className="badge badge-neutral" style={{ marginTop: 4 }}>{block}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span className={`badge ${pendingQueue.length > 0 ? "badge-warning" : "badge-neutral"}`} style={pendingQueue.length > 0 ? { background: "#FDE68A", color: "#92400E", border: "none" } : {}}>
              ● {pendingQueue.length} Queued
            </span>
            {syncStrategy === "manual" && pendingQueue.length > 0 && (
              <button 
                onClick={syncPendingQueue} 
                disabled={!isOnline || isSyncing}
                className="btn btn-primary"
                style={{ fontSize: 10, padding: "4px 8px", height: "auto" }}
              >
                {isSyncing ? "Syncing..." : "Sync Now"}
              </button>
            )}
          </div>
        </div>
        
        <div style={{ display: "flex", gap: 16, marginTop: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            {isOnline ? (
               <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.55a11 11 0 0 1 14.08 0"></path><path d="M1.42 9a16 16 0 0 1 21.16 0"></path><path d="M8.53 16.11a6 6 0 0 1 6.95 0"></path><line x1="12" y1="20" x2="12.01" y2="20"></line></svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#92400E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m2 2 20 20"></path><path d="M8.5 8.5c-1-1.5-2.5-2-4-2"></path><path d="M11 11c-2-2-5-2-7.5-1"></path><path d="M14.5 14.5c-3-3-8-3-11.5-1.5"></path></svg>
            )}
            <span className="text-body-md">{isOnline ? "Online (Live Sync)" : "Offline Mode (Local SQLite active)"}</span>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 12px", background: "var(--primary-light)", borderRadius: "var(--radius-xs)", marginTop: 12 }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: "var(--primary-dark)" }}>Location Captured ✓</span>
          <span className="text-mono" style={{ color: "var(--primary-dark)", fontSize: 10 }}>{deviceId}</span>
        </div>
      </div>

      {/* Voice Shift Debrief */}
      <div className="card animate-fade-in animate-delay-2" style={{ marginTop: 16 }}>
        <div className="card-body">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
            <div>
              <h2 className="text-headline-sm">Voice Shift Debrief</h2>
              <p className="text-body-md" style={{ marginTop: 2 }}>Tap mic or type to log inventory & attendance</p>
            </div>
            <span className="badge badge-synced" style={{ background: "var(--primary-light)", color: "var(--primary-dark)" }}>Acoustic v3.2</span>
          </div>

          <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
            <textarea 
              className="input-field" 
              placeholder="e.g., Aaj 40 ORS packets diye. Bed number 3 occupied hai. Sita ANM aaj duty par nahi aayi."
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              style={{ flex: 1, minHeight: 80, resize: "none" }}
            />
          </div>
          
          <div style={{ display: "flex", justifyContent: "center", gap: 12, marginBottom: 24 }}>
            <button className="mic-btn" onClick={() => setIsRecording(!isRecording)} style={isRecording ? { background: "var(--danger)" } : {}}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                {isRecording ? <rect x="6" y="6" width="12" height="12" /> : <><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" x2="12" y1="19" y2="22"></line></>}
              </svg>
            </button>
            <button className="btn btn-secondary" onClick={handleSimulateTranscript} disabled={!transcript || isPending}>
              {isPending ? "Parsing..." : "Extract Entities"}
            </button>
          </div>

          {/* Extracted Entities */}
          {extractedEvents.length > 0 && (
            <div style={{ background: "var(--bg-alt)", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", padding: "12px", marginTop: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2"><path d="M4 7V4h16v3M9 20h6M12 4v16"/></svg>
                  <span style={{ fontSize: 10, fontWeight: 700, color: "var(--on-surface-secondary)", letterSpacing: "0.05em" }}>LIVE ENTITY PARSING</span>
                </div>
              </div>
              
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {extractedEvents.map((entity) => (
                  <div key={entity.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "white", padding: "8px 12px", borderRadius: 6, border: "1px solid var(--border)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 18 }}>{entity.icon}</span>
                      <span style={{ fontSize: 13, fontWeight: 600 }}>{entity.label}</span>
                      <span className={`badge ${entity.statusClass}`} style={{ fontSize: 9 }}>{entity.status}</span>
                    </div>
                    <button onClick={() => removeEvent(entity.id)} style={{ color: "var(--danger)", background: "none", border: "none", cursor: "pointer" }}>×</button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="animate-fade-in animate-delay-4" style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 16 }}>
        <button 
          className="btn btn-primary" 
          style={{ width: "100%", height: 48 }}
          onClick={handleConfirmAndQueue}
          disabled={extractedEvents.length === 0}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" x2="12" y1="3" y2="15"></line></svg>
          {extractedEvents.length > 0 ? `Confirm & Queue ${extractedEvents.length} Events` : "Capture to Queue"}
        </button>
      </div>
    </>
  );
}
