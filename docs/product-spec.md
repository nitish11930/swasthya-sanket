# Product Specification — SWASTHYA-SANKET

## Problem Statement

India's Primary Health Centre (PHC) network serves over 1.4 billion people. Despite large government procurement, critical medicines frequently run out at the point-of-care — not because they don't exist, but because:

1. **Demand is poorly predicted** — consumption tracking is manual and delayed
2. **Transfers are ad-hoc** — no systematic view of which nearby PHC has surplus
3. **Accountability is weak** — discrepancies between dispatched and received quantities are common and rarely followed up
4. **Connectivity is intermittent** — field workers often operate in low/no-connectivity areas

## Core Promise

> No patient ever runs out of a critical medicine because of a stock management failure that could have been predicted and prevented.

## Users & Roles

| Role | Description | Key Permissions |
|------|-------------|----------------|
| ANM (Auxiliary Nurse Midwife) | Field health worker at sub-centre level | Log dispensing events, view own PHC stock |
| MO (Medical Officer) | PHC-level doctor | Log events, request/approve transfers within PHC |
| PHC-Head | Administrative head of PHC | Full PHC control, escalate to district |
| District Officer | District health officer | Cross-PHC transfers, district-wide view |
| State Admin | State health ministry | Full read access + audit |

## Core Workflow

```
Observe → Validate → Forecast → Stress-test → Optimize
→ Human Approve → Dispatch → Verify → Reconcile → Audit
```

### Step 1: Observe
- System displays real-time stock levels per PHC per medicine
- Sources: logged receipt events + dispensing events

### Step 2: Validate
- AI may flag potential data entry errors (impossible quantities, outliers)
- AI NEVER corrects data autonomously — flags for human review only

### Step 3: Forecast
- Deterministic algorithm: `days_to_stockout = (current - safety_buffer) / avg_daily_consumption`
- Color coding: Green (>30 days), Yellow (15–30 days), Orange (7–14 days), Red (<7 days)

### Step 4: Stress-test
- System simulates "what if this trend continues?" scenarios
- Shows projected date and quantity at stockout

### Step 5: Optimize
- System identifies candidate donor PHCs that have surplus above safety buffer
- Displays ranked options with safety margin

### Step 6: Human Approve
- District Officer (or PHC-Head for same-district) reviews options
- Selects approved quantity — may differ from requested
- Signs off with their credentials (session + re-auth for critical ops)

### Step 7: Dispatch
- Transfer order generated with unique ID
- Donor PHC receives dispatch notification
- Quantities are "reserved" (not deducted from inventory until receipt confirmed)

### Step 8: Verify
- Recipient PHC logs received quantity
- System timestamps the receipt event

### Step 9: Reconcile
- System compares dispatched vs received
- Any discrepancy → flagged for human review (never auto-accused)
- Human investigates and closes the discrepancy with a note

### Step 10: Audit
- Immutable record of every action: who, what, when, before, after
- Exportable for government reporting

## Non-Functional Requirements

| Requirement | Target |
|-------------|--------|
| Availability | 99.5% (excluding planned maintenance) |
| Offline Capability | Core logging works with no connectivity |
| Response Time | p95 < 2s for all read endpoints |
| Data Integrity | Zero data loss for offline events |
| Audit Completeness | 100% of mutations captured |
| Mobile | Usable on Android 6+ with 3G connection |
