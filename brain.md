# SWASTHYA-SANKET — Brain

## PROJECT
PHC Resilience & Accountability Engine — a full-stack web application that predicts medicine shortages, simulates interventions, coordinates safe resource transfers between PHCs, and preserves an immutable audit trail.

## CORE PROMISE
No patient ever runs out of critical medicine because of a stock management failure that could have been predicted and prevented.

## NON-NEGOTIABLE RULES
1. AI is decision-support ONLY — it never authorizes anything autonomously.
2. AI can transcribe, extract, and describe — never command.
3. AI must NEVER independently authorize a transfer.
4. AI must NEVER independently alter authoritative inventory.
5. Critical arithmetic (stock math, forecasting) must be DETERMINISTIC — pure TypeScript domain services, no LLM for numbers.
6. Donor safety constraints are DETERMINISTIC — a PHC can never drop below its own safety buffer.
7. Human approval is MANDATORY for every state-changing operation (transfers, adjustments).
8. Every state-changing action must be auditable (immutable audit log in DB).
9. Never automatically accuse anyone when discrepancies occur.
10. Never expose secrets/API keys to the browser.
11. Offline events (captured in IndexedDB) must never silently disappear.
12. Backend authorization must NEVER depend only on frontend checks.
13. Do not create fake/stub buttons that pretend to perform real functionality.
14. Do not hardcode business calculations inside React components.

## CURRENT PHASE
Phase 10 — Audit & Compliance Export Engine (VERIFIED)

## COMPLETED
- [x] Repository inspection
- [x] Next.js 16 + TypeScript project bootstrapped
- [x] Full design system (`globals.css`)
- [x] Layout components (`AppShell`, `AppHeader`, `BottomNav`, `SideNav`, `PageShell`)
- [x] Prisma Schema created: Users, Hierarchical Facilities, Medicine, Stocks, Batches, Events, Forecasts, Alerts, Transfers, AuditLogs.
- [x] Auth.ts updated to query database for Users using bcrypt with demo fallback.
- [x] Idempotent Seed script created.
- [x] RBAC Implemented: Roles mapping to deterministic Permissions.
- [x] Hierarchical Scoping implemented via `canAccessFacility`.
- [x] Secure Server Action Wrapper (`authenticatedAction`) created with Zod validation.
- [x] Field Capture screen (`field-capture`) Client Component integrated with Simulated Transcript AI parser.
- [x] Offline First Sync Engine using IndexedDB (`offline-store.ts`) for deterministic queue syncing.
- [x] `commitFieldEventsAction` wired securely to update `FieldReport`, `FacilityStock`, and `InventoryEvent`.
- [x] Deterministic Forecast Engine built (`domain/index.ts`) with `calculateTimeToBreach`, `generateEngineEvidence`, `evaluateForecastAccuracy`.
- [x] HERO Counterfactual Intervention Engine: 4 demonstration scenarios calculated deterministically.
- [x] `optimizeIntervention` — deterministic constraint-based optimizer scoring by clinical outbreak coverage duration and donor stability.
- [x] Localhost Checkpoint verified via browser subagent for Decision Engine.
- [x] Interactive Transfer Ledger matched to Stitch UI: Visualizes `RECOMMENDED → APPROVED → DISPATCHED → IN_TRANSIT → RECEIVED → RECONCILED`.
- [x] Exceptions & Resilience Triage Screen: Handles high-severity `Transfer Receipt Discrepancy` and medium/info static demo alerts.
- [x] Immutable Resource Event Ledger: Enforced strict cryptographic hash-chain tracking (`hash` and `previousHash`) for transfers.
- [x] System Audit Log: Append-only ledger recording all `before` and `after` states globally, linked by correlation IDs.
- [x] Hash-Chain Validation Service (`verifyAuditChain`, `verifyTransferChain`): Deterministically recalculates block hashes to detect historical tampering.
- [x] Tamper Simulation: Added developer tool to silently alter records in memory and proved that verification engine rejects broken chains.
- [x] Comprehensive test coverage (`vitest`) for Domain state machine, Discrepancy calculation, RBAC enforcements, and Cryptographic Hash generation/verification.
- [x] Transitioned in-memory stores (`transfer-store`, `audit-store`) to real Prisma calls.
- [x] Connected SQLite database to handle real append-only audit rows and verify them from the DB.
- [x] Dynamic Dashboard Integration: Connected `/dashboard` to real SQLite telemetry (`getDashboardTelemetry`, `getLatestActiveTransfer`, `getProactiveOutcome`).
- [x] Integrated `@ducanh2912/next-pwa` to compile a Service Worker for offline resiliency.
- [x] Added `manifest.ts` for full PWA installation on mobile devices.
- [x] Built Audit & Compliance Export Engine (`exportLedgerToCSV`, `exportLedgerToPDF`).
- [x] Wired CSV & PDF Export buttons directly into the interactive Ledger UI.
- [x] Built "Transfers Hub" list view (`/transfers`) with global search filtering and direct routing to the Immutable Ledger.

## IN PROGRESS
- Nothing

## BLOCKERS
- None

## DEMO CREDENTIALS
| Employee ID | Role | Password |
|-------------|------|----------|
| FW-RJ-001  | Field Worker (ANM) | demo@1234 |
| PHC-RJ-001 | PHC Admin (MO) | demo@1234 |
| DO-RJ-001  | District Officer | demo@1234 |
| SA-RJ-001  | Super Admin | demo@1234 |
| AUD-RJ-001 | Auditor | demo@1234 |

## LOCALHOST
- URL: http://localhost:3000
- Login: http://localhost:3000/login
- Dashboard: http://localhost:3000/dashboard (protected)
- Field Capture: http://localhost:3000/field-capture
- Decision Engine: http://localhost:3000/engine
- Ledger: http://localhost:3000/ledger
- Exceptions: http://localhost:3000/exceptions
- Dev command: `npm run dev` (inside `swasthya-sanket/`)

## NEXT PHASE
**Project Complete! 🎉**
- The MVP for Swasthya-Sanket is functionally complete.
- We have successfully implemented a fully working web app from the Stitch references. All offline, cryptography, state, and PDF export logic are securely functioning!
