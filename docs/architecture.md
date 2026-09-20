# Architecture — SWASTHYA-SANKET

## Overview

SWASTHYA-SANKET is a Next.js 16 App Router application with a PostgreSQL database, deployed as a progressive web app.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│                     Browser / PWA                        │
│  ┌──────────────────────────────────────────────────┐   │
│  │  Next.js App Router (React Server Components)    │   │
│  │  ├── /login          (no auth required)          │   │
│  │  ├── /dashboard      (role: any authenticated)   │   │
│  │  ├── /inventory      (role: ANM+)                │   │
│  │  ├── /transfers      (role: MO+)                 │   │
│  │  ├── /audit          (role: PHC-Head+)           │   │
│  │  └── /api/*          (server-side only)          │   │
│  └──────────────────────────────────────────────────┘   │
│  ┌──────────────┐  ┌─────────────────────────────────┐  │
│  │  IndexedDB   │  │  Service Worker (offline queue) │  │
│  └──────────────┘  └─────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                          │ HTTPS
                          ▼
┌─────────────────────────────────────────────────────────┐
│                   Next.js Server                         │
│  ┌─────────────────────────────────────────────────┐    │
│  │  API Routes (src/app/api/)                       │    │
│  │  ├── Zod validation (mandatory, server-side)     │    │
│  │  ├── RBAC check (mandatory, server-side)         │    │
│  │  ├── Domain service call                         │    │
│  │  ├── Prisma DB call                              │    │
│  │  └── Audit log write (append-only)               │    │
│  └─────────────────────────────────────────────────┘    │
│  ┌─────────────────────────────────────────────────┐    │
│  │  Domain Engine (src/domain/)                     │    │
│  │  Pure TypeScript — no side effects               │    │
│  │  ├── forecastStockout()      — deterministic     │    │
│  │  ├── evaluateDonorSafety()   — deterministic     │    │
│  │  ├── evaluateTransferOptions() — deterministic   │    │
│  │  └── reconcileTransfer()    — deterministic      │    │
│  └─────────────────────────────────────────────────┘    │
│  ┌─────────────────────────────────────────────────┐    │
│  │  AI Abstraction Layer (Phase 2)                  │    │
│  │  ├── Provider: Gemini / OpenAI (configurable)    │    │
│  │  ├── Only for: transcription, description, narr. │    │
│  │  └── Never for: arithmetic, authorization        │    │
│  └─────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
                          │ TLS
                          ▼
┌─────────────────────────────────────────────────────────┐
│                   PostgreSQL 15+                          │
│  Tables: users, phcs, districts, medicines,              │
│          inventory_snapshots, inventory_events,          │
│          transfers, audit_log, system_config             │
│                                                          │
│  Constraints:                                            │
│  - audit_log: APPEND-ONLY (trigger enforced)            │
│  - transfers: status machine (DB CHECK constraint)      │
└─────────────────────────────────────────────────────────┘
```

## Folder Structure

| Path | Purpose |
|------|---------|
| `src/app/` | Next.js App Router — pages and API routes |
| `src/components/ui/` | Design system primitives (Button, Card, Input, Badge) |
| `src/components/layout/` | Page shells, navigation |
| `src/features/` | Domain feature slices (auth, inventory, transfers, audit, offline) |
| `src/domain/` | Pure deterministic business logic — no side effects |
| `src/lib/` | DB client, auth config, Zod schemas |
| `src/styles/` | Global CSS with design tokens |
| `tests/unit/` | Vitest unit tests (domain + validations) |
| `tests/e2e/` | Playwright E2E tests |
| `prisma/` | Schema, migrations, seed |
| `public/` | Static assets, PWA manifest, service worker |
| `docs/` | Documentation |

## Data Flow: Transfer Request

```
1. ANM notices low stock → clicks "Request Transfer"
2. Frontend: form validated with Zod (client-side UX only)
3. POST /api/transfers/request
4. Server: Zod validates body (authoritative)
5. Server: RBAC check — caller must be MO+ for cross-PHC
6. Server: domain.evaluateTransferOptions() — deterministic
7. Server: writes Transfer{status: REQUESTED} to DB
8. Server: writes AuditLog entry
9. District Officer notified
10. GET /api/transfers/{id}/simulate — runs stress-test
11. District Officer: POST /api/transfers/{id}/approve — human gate
12. Server: RBAC check (must be District Officer+)
13. Server: re-runs donor safety check (deterministic)
14. Server: updates Transfer{status: APPROVED}
15. Server: writes AuditLog entry
16. Donor PHC: dispatches medicine
17. POST /api/transfers/{id}/dispatch
18. Recipient PHC: logs receipt
19. POST /api/transfers/{id}/receive
20. Server: reconcileTransfer() — deterministic
21. Server: if discrepancy → Transfer{status: DISCREPANCY_FLAGGED}
22. Human review → POST /api/transfers/{id}/resolve
```

## Security Layers

1. **Transport**: HTTPS only
2. **Auth**: NextAuth httpOnly session cookie
3. **Authorization**: Server-side RBAC on every mutation
4. **Validation**: Zod schema on every API input
5. **Audit**: Append-only DB log on every mutation
6. **Secrets**: Never in source code or client bundle
