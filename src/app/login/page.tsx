"use client";

/**
 * Login Page — SWASTHYA-SANKET
 *
 * Connected to loginAction (server action) via React useFormState.
 * On success: server redirects to /dashboard.
 * On error: displays inline error message.
 *
 * SECURITY: Credentials NEVER logged or stored client-side.
 */

import { useActionState, useRef } from "react";
import { loginAction, type LoginResult } from "./actions";

const DEMO_CREDENTIALS = [
  { employeeId: "FW-RJ-001", label: "Field Worker", color: "#0D9488" },
  { employeeId: "PHC-RJ-001", label: "PHC Admin", color: "#2563EB" },
  { employeeId: "DO-RJ-001", label: "District Officer", color: "#EA580C" },
  { employeeId: "SA-RJ-001", label: "Super Admin", color: "#DC2626" },
  { employeeId: "AUD-RJ-001", label: "Auditor", color: "#7C3AED" },
] as const;

const initialState: LoginResult = { success: false, error: "" };

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(
    loginAction,
    initialState
  );

  const employeeIdRef = useRef<HTMLInputElement>(null);

  function fillCredential(employeeId: string) {
    if (employeeIdRef.current) {
      employeeIdRef.current.value = employeeId;
      employeeIdRef.current.focus();
    }
  }

  return (
    <div
      style={{
        minHeight: "100dvh",
        background: "var(--bg)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* ── Teal Header ── */}
      <header
        style={{
          background: "var(--header-bg)",
          padding: "24px 20px 32px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 10,
        }}
      >
        {/* ECG Logo mark */}
        <div
          style={{
            width: 76,
            height: 76,
            borderRadius: 20,
            background: "rgba(255,255,255,0.15)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 4,
            boxShadow: "0 4px 16px rgba(0,0,0,0.15)",
          }}
        >
          <svg width="50" height="34" viewBox="0 0 50 34" fill="none" aria-hidden>
            <circle cx="5" cy="20" r="4" fill="rgba(204,235,233,0.85)" />
            <polyline
              points="5,20 13,20 17,11 21,28 25,5 29,23 33,20 41,20"
              stroke="white"
              strokeWidth="2.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
            <circle cx="45" cy="16" r="4" fill="rgba(204,235,233,0.85)" />
          </svg>
        </div>

        <h1
          style={{
            fontSize: 24,
            fontWeight: 800,
            color: "white",
            letterSpacing: "-0.02em",
            textAlign: "center",
          }}
        >
          Swasthya-Sanket
        </h1>
        <p style={{ fontSize: 12, color: "rgba(255,255,255,0.75)", textAlign: "center" }}>
          PHC Resilience &amp; Accountability Engine
        </p>

        {/* Sync status */}
        <span
          className="badge"
          style={{
            background: "rgba(22,163,74,0.2)",
            color: "rgba(255,255,255,0.9)",
            border: "1px solid rgba(255,255,255,0.25)",
            marginTop: 4,
          }}
        >
          <span
            className="status-dot"
            style={{ width: 6, height: 6, background: "#4ade80", boxShadow: "0 0 4px #4ade80" }}
          />
          System Online
        </span>
      </header>

      {/* ── Login Card ── */}
      <main
        style={{
          flex: 1,
          padding: "20px 16px 32px",
          display: "flex",
          flexDirection: "column",
          gap: 12,
          maxWidth: 440,
          width: "100%",
          margin: "0 auto",
        }}
      >
        <form
          action={formAction}
          style={{ display: "flex", flexDirection: "column", gap: 12 }}
        >
          <div className="card animate-fade-in">
            <div
              className="card-body"
              style={{ display: "flex", flexDirection: "column", gap: 16 }}
            >
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 700, color: "var(--on-surface)" }}>
                  Sign in
                </h2>
                <p style={{ fontSize: 13, color: "var(--on-surface-tertiary)", marginTop: 3 }}>
                  Use your government Employee ID
                </p>
              </div>

              {/* Error message */}
              {state && !state.success && state.error && (
                <div
                  role="alert"
                  aria-live="assertive"
                  style={{
                    padding: "10px 12px",
                    background: "var(--danger-bg)",
                    border: "1px solid var(--danger-border)",
                    borderRadius: "var(--radius-xs)",
                    display: "flex",
                    gap: 8,
                    alignItems: "flex-start",
                  }}
                >
                  <svg
                    width="15"
                    height="15"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="var(--danger)"
                    strokeWidth="2"
                    style={{ flexShrink: 0, marginTop: 1 }}
                  >
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  <p style={{ fontSize: 13, color: "var(--danger-text)" }}>{state.error}</p>
                </div>
              )}

              {/* Employee ID */}
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label
                  htmlFor="employeeId"
                  style={{ fontSize: 13, fontWeight: 600, color: "var(--on-surface-secondary)" }}
                >
                  Employee ID
                </label>
                <div style={{ position: "relative" }}>
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="var(--on-surface-tertiary)"
                    strokeWidth="2"
                    style={{
                      position: "absolute",
                      left: 14,
                      top: "50%",
                      transform: "translateY(-50%)",
                      pointerEvents: "none",
                    }}
                  >
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                  <input
                    ref={employeeIdRef}
                    id="employeeId"
                    name="employeeId"
                    type="text"
                    placeholder="e.g. ANM-RJ-001"
                    className="input-field"
                    style={{ paddingLeft: 42 }}
                    autoComplete="username"
                    autoCapitalize="characters"
                    required
                    disabled={isPending}
                    defaultValue=""
                  />
                </div>
              </div>

              {/* Password */}
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label
                  htmlFor="password"
                  style={{ fontSize: 13, fontWeight: 600, color: "var(--on-surface-secondary)" }}
                >
                  Password
                </label>
                <div style={{ position: "relative" }}>
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="var(--on-surface-tertiary)"
                    strokeWidth="2"
                    style={{
                      position: "absolute",
                      left: 14,
                      top: "50%",
                      transform: "translateY(-50%)",
                      pointerEvents: "none",
                    }}
                  >
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="Enter your password"
                    className="input-field"
                    style={{ paddingLeft: 42 }}
                    autoComplete="current-password"
                    required
                    disabled={isPending}
                  />
                </div>
              </div>

              {/* Submit */}
              <button
                id="login-btn"
                type="submit"
                className="btn btn-primary"
                style={{ width: "100%", marginTop: 4, position: "relative" }}
                disabled={isPending}
                aria-label={isPending ? "Signing in…" : "Sign in"}
              >
                {isPending ? (
                  <>
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      style={{ animation: "spin 0.8s linear infinite" }}
                    >
                      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                    </svg>
                    Signing in…
                  </>
                ) : (
                  "Sign In →"
                )}
              </button>
            </div>
          </div>
        </form>

        {/* ── Demo Credential Quick-Fill ── */}
        <div
          className="card animate-fade-in animate-delay-100"
          style={{ background: "var(--primary-xlight)", border: "1px solid var(--primary-light)" }}
        >
          <div className="card-body" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div>
              <p style={{ fontSize: 12, fontWeight: 700, color: "var(--primary-dark)" }}>
                🎯 Demo Credentials
              </p>
              <p style={{ fontSize: 11, color: "var(--on-surface-tertiary)", marginTop: 2 }}>
                Tap a role to fill the Employee ID. Password for all:{" "}
                <code
                  style={{
                    fontFamily: "monospace",
                    fontWeight: 700,
                    color: "var(--primary-dark)",
                    background: "rgba(13,148,136,0.1)",
                    padding: "1px 5px",
                    borderRadius: 4,
                  }}
                >
                  demo@1234
                </code>
              </p>
            </div>

            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {DEMO_CREDENTIALS.map(({ employeeId, label, color }) => (
                <button
                  key={employeeId}
                  type="button"
                  onClick={() => fillCredential(employeeId)}
                  style={{
                    padding: "4px 10px",
                    borderRadius: "var(--radius-full)",
                    border: `1.5px solid ${color}22`,
                    background: `${color}15`,
                    color: color,
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: "pointer",
                    fontFamily: "var(--font-sans)",
                    transition: "all 0.15s ease",
                  }}
                  title={`Fill: ${employeeId}`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Credentials table */}
            <div
              style={{
                background: "rgba(255,255,255,0.7)",
                borderRadius: "var(--radius-xs)",
                overflow: "hidden",
                border: "1px solid var(--border)",
              }}
            >
              {DEMO_CREDENTIALS.map(({ employeeId, label }, i) => (
                <div
                  key={employeeId}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "6px 10px",
                    borderBottom: i < DEMO_CREDENTIALS.length - 1 ? "1px solid var(--border)" : "none",
                  }}
                >
                  <span style={{ fontSize: 11, fontWeight: 600, color: "var(--on-surface-secondary)" }}>
                    {label}
                  </span>
                  <code style={{ fontSize: 11, color: "var(--primary-dark)", fontFamily: "monospace" }}>
                    {employeeId}
                  </code>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Safety notice */}
        <p
          className="animate-fade-in animate-delay-200"
          style={{ fontSize: 11, color: "var(--on-surface-tertiary)", textAlign: "center", lineHeight: "16px", padding: "0 8px" }}
        >
          🔒 All actions require human approval and are permanently recorded in an immutable audit trail.
        </p>
      </main>
    </div>
  );
}
