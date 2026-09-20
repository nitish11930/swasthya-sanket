# Swasthya-Sanket
## PHC Resilience and Accountability Engine

> **Predict the failure. Test the response. Prevent the shortage.**

---

## Idea kya hai? (What is the idea?)
Swasthya-Sanket ek digital decision-support system hai jo Primary Health Centres mein medicine shortage ko pehle detect karta hai, possible solutions ko simulate karta hai, safest resource transfer recommend karta hai, authorized officer se approval leta hai, aur transfer ke baad verify karta hai ki actual quantity receive hui ya nahi.

Yeh sirf dashboard nahi hai. Iska main purpose hai:
**Shortage hone se pehle administrator ko batana ki kya action lena chahiye, kyun lena chahiye, aur action ke baad result kya hua.**

## Kis ke liye hai? (Who is it for?)
- **District Medical Officer / CMO:** PHC network monitor karne, upcoming shortages dekhne, safe transfers approve karne, aur response results verify karne ke liye.
- **PHC Administrator:** Facility inventory validate karne, beds/staff status update karne, aur incoming transfers confirm karne ke liye.
- **Frontline Health Worker:** Voice ke through updates record karne, medicine usage report karne, aur internet na hone par offline kaam karne ke liye.
- **Auditor / Supervisor:** Transfer history check karne, dispatch aur received quantity compare karne, aur discrepancies/audit records review karne ke liye.

---

## Kaunsi problem solve karta hai?
PHCs mein aksar:
- Medicine stockout ka pata late chalta hai
- Inventory data stale hota hai
- Field workers ke paas typing ka time nahi hota
- Internet connectivity unreliable hoti hai
- Ek PHC mein shortage hota hai jabki doosre PHC mein surplus available hota hai
- Transfer approve hone ke baad actual delivery track nahi hoti
- Dispatched aur received quantity alag ho sakti hai
- Administrator ko clear nahi hota ki safest action kya hai

**Swasthya-Sanket iska complete solution provide karta hai:**
`Field update → Validated data → Shortage forecast → Possible responses → Safe transfer recommendation → Human approval → Dispatch tracking → Receipt verification → Reconciliation`

---

## Core Workflow

### 1. Observe
Frontline worker update record karta hai: *"Aaj 40 ORS diye. Bed number 3 occupied hai. Sita ANM aaj duty par nahi aayi."*
System is update ko structured events mein convert karta hai (40 ORS dispensed, Bed 3 occupied, ANM Sita absent).

### 2. Forecast
System current inventory aur demand history ke basis par calculate karta hai:
*(Example: Current ORS: 180, Safety stock: 100, Forecast: 80/day → Time to breach = 1 day)*

### 3. Stress-test
System multiple possible responses evaluate karta hai (Kuch na karna, 80 units transfer, 120 units transfer, 220 units transfer).

### 4. Optimize
System check karta hai: Donor ke paas kitna surplus hai? Donor safety stock se neeche to nahi jayega? Transfer breach se pehle pahunch sakta hai? Kaunsa donor safest hai?

### 5. Approve
CMO recommendation review karta hai: *Why this donor? Why this quantity? Donor par kya impact hoga?* Phir approve, reject ya review request karta hai.

### 6. Verify & Reconcile
Transfer lifecycle track hota hai: `Recommended → Approved → Dispatched → In transit → Received → Reconciled`
Agar mismatch ho (e.g., Dispatched: 120, Received: 100), toh status **Review required** ho jata hai. System kisi par automatically allegation nahi lagata, sirf discrepancy ko traceable aur auditable banata hai.

---

## Hero Scenario
- **Recipient PHC (Barmer-03):** 180 ORS, 100 Safety, 24h to breach.
- **Donor PHC (Balotra-02):** 410 ORS, 180 Safety, 3 hours travel time.
- **Donor PHC (Jodhpur-07):** 620 ORS, 200 Safety, 4 hours 10 minutes travel time.
*System nearest donor ko blindly choose nahi karega. Safest feasible donor select karega.*

---

## Main Differentiator
Most systems show: *"PHC mein shortage hone wali hai."*
**Swasthya-Sanket shows:** *"Shortage 24 hours mein ho sakta hai. Yeh 4 possible responses hain. Yeh option unsafe hai. Yeh option safest hai. Isse shortage itna delay hoga. Approval ke baad actual quantity bhi verify hogi."*

---

## Project Conclusion: What We Actually Built
In this repository, we have successfully transformed this conceptual pitch into a **working, production-grade prototype**:

1. **Field Capture (NLP Engine):** We built a resilient voice-to-text parser that successfully handles typos and unstructured Hindi/English commands (e.g., *"sitna,m off duty aaj"*) and converts them into deterministic JSON payloads mapped to the database.
2. **Dashboard & Insights:** A real-time telemetry dashboard that correlates live data with epidemiological alerts (e.g., linking Heatwave warnings with ORS consumption rates).
3. **Decision Engine (Simulator):** A functional constraint-solver that evaluates multiple transfer scenarios, strictly enforcing safety-stock buffers (preventing "Robbing Peter to pay Paul").
4. **Exceptions & Resilience Triage:** A dynamic queue that actively monitors `FieldReports`. When a frontline worker reports an absence, it instantly generates a "High Severity" intervention card requiring human reconciliation.
5. **Immutable Audit Ledger:** A tamper-evident history tracking every state change from field signal to final district approval.
6. **Next.js & Vanilla CSS Architecture:** The entire UI is built with a custom glassmorphism design system using pure CSS tokens—avoiding bloated frameworks while maintaining a premium, accessible aesthetic.

---
