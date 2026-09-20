# Swasthya-Sanket
## PHC Resilience and Accountability Engine

> **Predict the failure. Test the response. Prevent the shortage.**

---

## 🚨 The Problem
Primary Health Centres (PHCs) frequently face critical challenges in inventory and resource management:
- **Delayed Awareness:** Medicine stockouts are often discovered too late.
- **Stale Data:** Inventory records quickly become outdated.
- **Time Constraints:** Frontline health workers lack the time for manual data entry.
- **Poor Connectivity:** Unreliable internet access disrupts reporting.
- **Resource Imbalance:** One PHC may face severe shortages while a neighboring PHC has a surplus.
- **Lack of Traceability:** Once a transfer is approved, actual deliveries are rarely tracked.
- **Discrepancies:** Dispatched quantities often differ from received quantities without accountability.
- **Decision Paralysis:** Administrators lack data-driven insights to determine the safest course of action.

---

## 💡 The Solution
**Swasthya-Sanket** is a digital decision-support system designed to detect impending medicine shortages in Primary Health Centres, simulate possible interventions, recommend the safest resource transfers, secure authorized approvals, and verify actual receipt quantities.

It is more than just a dashboard. Its primary purpose is to **alert administrators before a shortage occurs, explain the rationale behind recommended actions, and track the tangible results of those actions.**

### How it solves the problem:
`Field Update → Validated Data → Shortage Forecast → Possible Responses → Safe Transfer Recommendation → Human Approval → Dispatch Tracking → Receipt Verification → Reconciliation`

---

## 👥 Target Audience
- **District Medical Officer / CMO:** Monitor the PHC network, anticipate upcoming shortages, approve safe transfers, and verify response outcomes.
- **PHC Administrator:** Validate facility inventory, update bed/staff status, and confirm incoming transfers.
- **Frontline Health Worker:** Record updates via voice commands, report medicine usage, and work seamlessly offline.
- **Auditor / Supervisor:** Audit transfer histories, compare dispatched vs. received quantities, and review discrepancies.

---

## ⚙️ Core Workflow

### 1. Observe
Frontline workers record updates naturally: *"Dispensed 40 ORS packets today. Bed number 3 is occupied. ANM Sita is absent."*
The system extracts and converts these updates into structured events.

### 2. Forecast
The system calculates the time-to-breach based on current inventory and historical demand.
*(Example: Current ORS: 180, Safety stock: 100, Forecast: 80/day → Time to breach = 1 day)*

### 3. Stress-Test
The system evaluates multiple potential responses (e.g., Do nothing, Transfer 80 units, Transfer 120 units, Transfer 220 units).

### 4. Optimize
The system evaluates critical constraints: *How much surplus does the donor have? Will the donor breach their own safety stock? Can the transfer arrive before the shortage breach? Which donor is the safest option?*

### 5. Approve
The CMO reviews the recommendation along with its rationale: *Why this donor? Why this quantity? What is the impact on the donor?* The CMO then approves, rejects, or requests a review.

### 6. Verify & Reconcile
The entire transfer lifecycle is tracked: `Recommended → Approved → Dispatched → In transit → Received → Reconciled`.
If a mismatch occurs (e.g., Dispatched: 120, Received: 100), the status is flagged as **Review Required**. The system ensures complete traceability and auditability without automated allegations.

---

## 🎯 Hero Scenario
- **Recipient PHC (Barmer-03):** 180 ORS, 100 Safety Stock, 24h to breach.
- **Donor PHC (Balotra-02):** 410 ORS, 180 Safety Stock, 3 hours travel time.
- **Donor PHC (Jodhpur-07):** 620 ORS, 200 Safety Stock, 4 hours 10 minutes travel time.
*Instead of blindly selecting the nearest donor, the system calculates and selects the safest feasible donor.*

---

## 🌟 Key Differentiators
Most systems merely state: *"A shortage will occur at this PHC."*
**Swasthya-Sanket provides actionable intelligence:** *"A shortage may occur in 24 hours. Here are 4 possible responses. Option A is unsafe. Option B is the safest and will delay the shortage significantly. Post-approval, the actual delivered quantity will be rigorously verified."*

---

## 🛠️ Project Implementation: What We Built
We have successfully transformed this conceptual architecture into a **working, production-grade prototype**:

1. **Field Capture (NLP Engine):** A resilient voice-to-text parser that successfully handles typos and unstructured commands (e.g., *"sitna,m off duty aaj"*) converting them into deterministic JSON payloads mapped to the database.
2. **Dashboard & Insights:** A real-time telemetry dashboard correlating live data with epidemiological alerts (e.g., linking Heatwave warnings with ORS consumption rates).
3. **Decision Engine (Simulator):** A functional constraint-solver evaluating multiple transfer scenarios while strictly enforcing safety-stock buffers (preventing the "Robbing Peter to pay Paul" scenario).
4. **Exceptions & Resilience Triage:** A dynamic queue actively monitoring `FieldReports`. Frontline absence reports instantly generate "High Severity" intervention cards requiring human reconciliation.
5. **Immutable Audit Ledger:** A tamper-evident history tracking every state change from the initial field signal to the final district approval.
6. **Next.js & Vanilla CSS Architecture:** The entire UI is built with a custom glassmorphism design system using pure CSS tokens—avoiding bloated frameworks while maintaining a premium, highly accessible aesthetic.

---

**Project Context:**
- Hack2Skill Hack AI: [https://hack2skill.com/hack/hack-ai](https://hack2skill.com/hack/hack-ai)
- Build with AI: [https://buildwithai.devaarambh.com/](https://buildwithai.devaarambh.com/)
