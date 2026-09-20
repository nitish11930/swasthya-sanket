# Demo Script — SWASTHYA-SANKET Hackathon

## Setup

1. `cd swasthya-sanket && npm run dev`
2. Open http://localhost:3000
3. Have a second browser window ready for "District Officer" role

---

## Opening (30 seconds)

> "Every year, millions of patients in India's rural PHCs miss critical medicines — not because the medicine doesn't exist in the district, but because no one knows which PHC has surplus and which one is running dry. SWASTHYA-SANKET fixes that."

Show the login screen → branding → glassmorphic design → role chips.

---

## Phase 0 Demo Points (Foundation)

1. **Login Page** — dark glassmorphism, branded, accessible
2. **Dashboard** — phase roadmap cards showing the system vision
3. **Health API** — open http://localhost:3000/api/health → JSON response
4. **Architecture** — show `docs/architecture.md` diagram in terminal

---

## Phase 1+ Demo Points (planned)

1. **Log Dispensing Event** (ANM role) → medicine quantity updates
2. **Forecast Panel** → days-to-stockout heat map across PHCs
3. **Simulate Transfer** → donor safety constraint enforcement
4. **Human Approval Gate** → District Officer reviews and approves
5. **Dispatch → Receipt → Reconcile** → full workflow
6. **Audit Trail** → immutable log, every action traced

---

## Key Messages

- **AI as co-pilot, not autopilot** — every AI suggestion requires human approval
- **Safety constraints are hard** — donor PHC can never go below buffer
- **Works offline** — ANMs in low-connectivity areas still log events
- **Immutable audit** — government accountability built in

---

## Safety Rules to Emphasize

> "The system cannot and will not transfer medicines automatically.
>  A real human with the right authority must approve every single transfer.
>  The audit trail is permanent — you can see exactly who approved what, when, and why."
