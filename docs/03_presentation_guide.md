# Presentation Blueprint & Viva Defense Guide
## Vendor Quality & Compliance Management System (VQCMS - XII)

**Institution:** K J Somaiya Institute of Management, Somaiya Vidyavihar University, India  
**Program & Batch:** Batch MCA 2026–2028  
**Course:** Database Management Systems (DBMS)  
**Project Group:** Team 12  
**Domain:** Precision Auto Parts (Automotive OEM Supplier Quality Division)  
**Detailed 14-Slide Blueprint:** [`docs/07_presentation_slides_master.md`](file:///d:/DBMS_Team_12/docs/07_presentation_slides_master.md)  

---

## 1. Slide-by-Slide Presentation Structure (10-12 Minutes)

| Slide # | Slide Title | Key Visuals / Artifacts | Recommended Speaker Time | Key Takeaway |
| :---: | :--- | :--- | :---: | :--- |
| **1** | **Title & Executive Summary** | Team members, Project title, Problem statement badge | 1.0 min | Transition from spreadsheet chaos to centralized quality governance. |
| **2** | **Industry Case & Problem Statement** | 14% downtime stat, 4,200 components, 185 suppliers, 4 plants diagram | 1.5 min | Highlight the $100K+ losses caused by fragmented Excel workbooks. |
| **3** | **Terminology & Scope Boundaries** | Definition matrix (PPM, RMA, CoA, Debit Memo), In-Scope vs Out-of-Scope | 1.0 min | Clear boundary demarcation showing academic rigor. |
| **4** | **Relational Normalization Journey** | 1NF $\to$ 2NF $\to$ 3NF/BCNF transition table | 1.5 min | Demonstrate elimination of insertion, update, and deletion anomalies. |
| **5** | **ER Diagram & Architecture** | PlantUML / Mermaid ER diagram (Color-coded by functional module) | 2.0 min | Walk through Master $\to$ Procurement $\to$ QC $\to$ Claims flow. |
| **6** | **Database Constraints & Triggers** | DDL constraints (`CHECK`, `UNIQUE`, `CASCADE`/`RESTRICT`), PPM trigger code | 1.5 min | Show data integrity enforced at engine level, not application code. |
| **7** | **Live Demonstration: PPM & Penalty Queries** | Output of Query 1 (PPM calculation) & Query 3 (Downtime Debit Memo) | 1.5 min | Show immediate calculation of supplier liability. |
| **8** | **Batch Quarantine & RMA Audit Trail** | Output of Query 2 (Warranty Cross-Ref) & Query 4 (Audit Trail) | 1.0 min | Prove regulatory compliance (IATF 16949 / ISO 9001). |
| **9** | **Thinking Beyond: Enterprise Scale** | Multi-plant sharding, RBAC table, Time-series range partitioning | 1.0 min | Show how system scales to millions of inspections globally. |
| **10** | **Conclusion & Business Impact** | ROI metrics (zero lost warranty claims, instant recall containment) | 1.0 min | Summarize deliverables and invite questions. |

---

## 2. Slide Scripts & Speaking Notes

### Slide 1 & 2: The Precision Auto Parts Crisis
> *"Good morning respected Professor and colleagues. We are Team 12, and today we present the Vendor Quality & Compliance Management System for Precision Auto Parts.  
> Precision Auto Parts sources over 4,200 unique engine and transmission parts from 185 global suppliers across 4 assembly plants in Detroit, Stuttgart, Chennai, and Shanghai.  
> Recently, component defects caused a staggering 14% increase in factory downtime. When an assembly line halted, procurement officers took days to track down which batch failed, who supplied it, and what contract terms applied. Inspection results were trapped in separate Excel files across four plants. Our database eliminates this silo."*

### Slide 3 & 4: Normalization & Core Definitions
> *"To solve this, we first normalized the legacy flat sheets. In 1NF, we eliminated repeating defect arrays into discrete inspection rows. In 2NF, we separated component specifications from purchase order lines to eliminate partial dependencies. In 3NF and BCNF, we decoupled plant operational details and contract terms into dedicated relations. This ensures zero data anomalies when suppliers or contracts change."*

### Slide 5 & 6: Data Architecture & Business Triggers
> *"Our ER model connects Master Registries, Procurement, QC Inspections, and Financial Claims. Notice our strict constraint architecture: check constraints ensure defect counts never exceed sample sizes, while database triggers calculate Defect Parts-Per-Million (PPM) automatically upon record insertion. Furthermore, every batch quarantine action is logged into an immutable audit ledger."*

### Slide 7 & 8: Query Execution & Business Impact
> *"Here is our query engine in action. Query 1 instantly identifies that BorgWarner and ZF exceeded their contractual PPM thresholds, while Bosch and Denso maintained perfect compliance. Query 3 calculates that 150 minutes of downtime on Detroit Engine Line 1 resulted in an automated $25,000 penalty debit memo against the responsible supplier. What used to take two weeks of spreadsheet reconciliations now executes in 15 milliseconds."*

### Slide 9 & 10: Thinking Beyond: Enterprise Readiness
> *"Beyond basic DBMS requirements, we architected this for enterprise scale: Role-Based Access Control isolates QC inspectors from financial debit memos, bi-temporal lot tracking prevents automotive recall liabilities, and range partitioning by inspection quarter guarantees sub-50ms query response times even at 500,000 records annually."*

---

## 3. High-Probability Professor / Viva Defense Q&A

### Q1: Why did you choose 3NF / BCNF instead of keeping a denormalized schema for faster reports?
**Answer:**  
In automotive manufacturing, data integrity and legal enforceability override raw read performance. A denormalized table creates update anomalies: if a supplier renegotiates their hourly downtime penalty rate, updating millions of historical rows risks data inconsistency. By enforcing 3NF/BCNF, contracts are updated in exactly one place (`supplier_contracts`), guaranteeing legal integrity during multi-thousand dollar warranty disputes. For reporting speed, we created pre-computed SQL Views (`v_supplier_quality_scorecard`) and strategic B-Tree indexes.

### Q2: Why use a Database Trigger for PPM calculation instead of calculating it in Python or frontend application code?
**Answer:**  
In a multi-plant enterprise, inspection data can be ingested from multiple entry points: web portals, barcode scanners, handheld QC terminals, and automated test rigs. If PPM calculation is placed in application code, a bug or omission in any single client creates corrupt quality data. Enforcing the formula $\text{PPM} = (\text{Defects} / \text{Sample}) \times 1,000,000$ via an engine-level `AFTER INSERT` trigger ensures data integrity regardless of which application or dock inserted the record.

### Q3: How does your database prevent unauthorized deletion of inspection records during an active recall investigation?
**Answer:**  
Two mechanisms prevent tampering:
1. Foreign key constraints utilize `ON DELETE RESTRICT` on `shipment_receipts`, `inspection_records`, and `batch_quarantines`. A user cannot delete an inspection record once child quarantine or downtime records exist.
2. In our RBAC design, QC inspectors and procurement officers only possess `SELECT` and `INSERT` privileges. Deletions are strictly prohibited, and every status transition triggers an automatic insertion into `compliance_audit_log`.

### Q4: How would this schema scale if the company expands from 4,200 components to 100,000 components and 50 million inspection rows?
**Answer:**  
1. **Range Partitioning:** We partition the `inspection_records` table by `inspection_date` (quarterly or yearly partitions), allowing query pruning so queries only scan relevant date ranges.
2. **Composite B-Tree Indexing:** We indexed `(batch_lot_number)` and `(receipt_id, inspection_date)` so recall lookups remain $O(\log N)$.
3. **Read-Replicas / OLAP Separation:** Analytical views (`v_supplier_quality_scorecard`) can be replicated to an OLAP columnar warehouse (e.g., ClickHouse, Snowflake, BigQuery) while keeping the transactional OLTP engine lean.

### Q5: What is the significance of the `criticality_tier` attribute in components?
**Answer:**  
Not all auto parts carry equal risk. Tier A components (crankshafts, steering shafts, fuel injectors) are safety-critical; failure causes vehicle accidents or engine seizures. Tier B components affect performance, and Tier C components are non-safety trim items. Our schema allows QC engineers to enforce stricter sample sizes and automated quarantine rules on Tier A components, preventing catastrophic vehicle recalls before parts reach the assembly line.

---

## 4. Suggested Team Role Allocation for Group Defense

- **Team Member 1 (Lead Presenter):** Introduction, problem statement, business domain background, executive ROI.
- **Team Member 2 (Systems Architect):** Key terms, scope boundaries, normalization journey (1NF $\to$ 3NF/BCNF).
- **Team Member 3 (Data Modeler):** ER diagrams (Mermaid / PlantUML), table schemas, constraints, and relational dependencies.
- **Team Member 4 (SQL / Query Specialist):** Live query execution (PPM calculation, warranty cross-reference, penalty invoice generation, audit trail).
- **Team Member 5 (Enterprise Specialist):** "Thinking Beyond" - Enterprise architecture, RBAC, scaling, and viva Q&A defense.
