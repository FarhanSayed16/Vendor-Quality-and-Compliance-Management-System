# Vendor Quality & Compliance Management System (VQCMS)
## Comprehensive Requirements Specification & Scope Document

**Course:** SEM I – Data Science and Technology / Database Management Systems  
**Project Group:** Team 12  
**Client / Domain:** Precision Auto Parts (Automotive OEM Supplier Quality Division)  
**System Title:** Vendor Quality & Compliance Management System (VQCMS - XII)

---

## 1. Executive Summary & Problem Background

Precision Auto Parts operates four major manufacturing assembly plants globally, sourcing over **4,200 unique engine and transmission components** across **185 global Tier-1 and Tier-2 suppliers**. 

In the status quo:
- Incoming parts undergo batch inspections at central and plant receiving docks, but quality data is manually captured in disconnected spreadsheet workbooks across four independent manufacturing plants.
- Rising defect rates on active assembly lines triggered a **14% spike in factory downtime**, contributing to high scrap rates and multimillion-dollar vehicle recall risks.
- When defective components halt an assembly line, procurement officers cannot quickly link batch numbers to supplier contracts or quality certificates to execute warranty refund claims.
- Annual supplier performance reviews and scorecards are subjective because the organization lacks consolidated historical metrics on delivery timelines, defect parts-per-million (PPM), and Return Merchandise Authorization (RMA) turnaround times.

This project delivers a relational database architecture and query engine that centralizes quality compliance, automates PPM tracking, executes penalty calculations, and enforces strict traceability.

---

## 2. Key Terms & Domain Terminology

| Term | Abbreviation | Definition & Domain Significance |
| :--- | :--- | :--- |
| **Parts Per Million** | **PPM** | Standard automotive quality metric calculating defective parts per million received: $\text{PPM} = \frac{\text{Total Defective Units}}{\text{Total Units Received}} \times 1,000,000$. Used to rate supplier tier levels. |
| **Return Merchandise Authorization** | **RMA** | A formal transaction granting permission to return defective parts to the vendor for credit, repair, or replacement. |
| **Certificate of Analysis** | **CoA** | A quality document supplied by the vendor verifying that a delivered component batch meets defined metallurgical, dimensional, and functional tolerances. |
| **Purchase Order** | **PO** | Legally binding contract specifying item quantity, agreed unit cost, delivery deadlines, quality warranties, and default penalty rates. |
| **Batch / Lot Number** | **Lot / Batch** | Unique production identifier assigned by the supplier to a group of parts manufactured under identical conditions; essential for recall isolation. |
| **Quarantine** | **QC Hold** | Physical and logical containment of suspect components to prevent defective parts from reaching production lines. |
| **Penalty Invoice** | **Debit Memo** | Automated financial debit issued against a supplier account when defect rates exceed agreed Service Level Agreement (SLA) contractual thresholds. |
| **Service Level Agreement** | **SLA** | Contractual commitment defining maximum allowable PPM, delivery timeliness, and root-cause response times (e.g., 8D report within 48 hours). |
| **Assembly Downtime Cost** | **Downtime Fee** | Calculated operational loss per minute of assembly line stoppage caused by component failures, back-charged to the responsible vendor. |

---

## 3. Project Scope: In-Scope vs. Out-of-Scope

Clear boundary demarcation prevents scope creep while guaranteeing complete fulfillment of academic and industry requirements.

```
+-----------------------------------------------------------------------------------+
|                            VQCMS PROJECT BOUNDARIES                               |
+-----------------------------------------------------------------------------------+
|  IN-SCOPE (Core System Modules)         |  OUT-OF-SCOPE (Enterprise Integrations) |
|  - Supplier & Contract Management       |  - Automated Wire/Bank Payout Gateway   |
|  - Component Catalog & Specs            |  - Shop-Floor CNC Machine Vision Feeds  |
|  - Multi-Plant PO & Receiving           |  - Finished Vehicle Dealership Portal   |
|  - Batch Inspection & Defect Logs       |  - End-to-End Freight GPS Tracking      |
|  - Real-Time Defect PPM Calculation     |  - General Ledger / Payroll Accounting  |
|  - Automated Penalty Debit Memo Engine  |                                         |
|  - Quarantine & RMA Audit Trail         |                                         |
|  - Role-Based Access Control (RBAC)     |                                         |
+-----------------------------------------------------------------------------------+
```

### 3.1 In-Scope Deliverables
1. **Centralized Master Registry:**
   - Unified repository for 185 suppliers, contracts, ISO certifications, and payment/credit terms.
   - Master component catalog classifying 4,200 parts across engine, transmission, and structural categories.
   - Plant registry for the 4 manufacturing facilities.
2. **Receiving & Inspection Engine:**
   - Registration of Purchase Orders and incoming delivery shipments.
   - Multi-stage Quality Control (QC) inspection recording (sample size, defect count, defect category, disposition).
3. **Automated Quality Scoring & Penalty Engine:**
   - Dynamic Defect PPM calculation across customizable date windows.
   - Automated contractual penalty trigger when PPM exceeds contract thresholds or downtime occurs.
4. **Quarantine & RMA Tracking:**
   - Batch containment status changes (Under Inspection $\to$ Accepted / Quarantined $\to$ RMA Dispatched $\to$ Closed).
   - Immutable audit trail recording user identity, timestamp, and previous-to-new state transitions.
5. **Analytical & Executive SQL Suite:**
   - Relational queries answering operational, tactical, and strategic questions for QC managers, procurement officers, and plant directors.

### 3.2 Out-of-Scope (Deliberately Demarcated Boundaries)
1. **Payment Gateway Settlement:** Processing bank wire transfers or credit card payouts (the system outputs verified debit memos for ERP accounts payable ingestion).
2. **Direct Shop-Floor Hardware Bus (SCADA/PLC):** Reading raw voltages or direct optical sensor pins (data is ingested via standardized QC dock logs).
3. **Logistics & Freight Telematics:** Live satellite tracking of maritime cargo containers before dock arrival.
4. **Customer-Facing Dealership Warranty System:** Post-sale dealership repairs (covered by downstream OEM warranty systems).

---

## 4. Detailed Functional Specifications

### Module 1: Supplier & Contract Management
- **FR-1.1:** System shall store supplier profile data (tax ID, DUNS number, country, compliance rating, ISO 9001/IATF 16949 certification expiry).
- **FR-1.2:** System shall associate each supplier with one or more contractual terms specifying:
  - Base warranty period (in months).
  - Maximum allowable Defect PPM threshold.
  - Per-hour downtime penalty charge.
  - Standard warranty refund percentage (e.g., 100% replacement + scrap surcharge).

### Module 2: Component Catalog & Plant Organization
- **FR-2.1:** System shall record component attributes (Part Number, Description, Category, Subsystem [Engine vs. Transmission], Criticality Tier [A/B/C], Material Spec, Unit Cost).
- **FR-2.2:** System shall support 4 plant entities (Plant ID, Plant Name, Location, QC Dock Capacity, Active Status).

### Module 3: Purchase Orders & Shipment Receipts
- **FR-3.1:** System shall capture PO headers and line items (Target Delivery Date, Unit Price, Order Qty).
- **FR-3.2:** System shall log incoming shipments against specific PO line items with Supplier Lot Number, Bill of Lading, Receiving Plant, and Delivery Date.

### Module 4: QC Batch Inspection & Defect Classification
- **FR-4.1:** System shall record batch inspection results: Sample Size Inspected, Total Defective Units Found, Defect Classification (Dimensional, Metallurgical, Finish, Structural), Inspection Status (Passed, Failed, Conditional).
- **FR-4.2:** System shall link inspection records to the inspecting QC Engineer.

### Module 5: Quarantine & RMA Workflow
- **FR-5.1:** Batches with failed inspections must automatically enter `QUARANTINED` status.
- **FR-5.2:** Quarantined items can only transition to `RMA_REQUESTED`, `RETURNED_TO_VENDOR`, or `SCRAPPED_ON_SITE` with mandatory reason documentation.
- **FR-5.3:** System must capture RMA tracking number, vendor credit acknowledgement, and refund claim settlement status.

### Module 6: Quality Metrics & Automated Debit Memos
- **FR-6.1:** Real-time computation of supplier Defect PPM based on verified inspection records.
- **FR-6.2:** Trigger-based or automated stored procedure generation of `PENALTY_INVOICE` when a batch causes line downtime or breaches allowable PPM.

---

## 5. Non-Functional Specifications

1. **Data Integrity & Consistency (ACID):**
   - Mandatory foreign keys on all relationships with appropriate `ON DELETE RESTRICT` rules to prevent orphaned quality records.
   - Domain `CHECK` constraints on numerical metrics (PPM $\ge$ 0, Defect Count $\le$ Sample Size, Sample Size > 0, Monetary values $\ge$ 0).
2. **Auditability & Traceability:**
   - Every quarantine and RMA transition must record timestamp, operating user ID, and source IP/terminal in an immutable log.
3. **Performance & Scalability:**
   - Designed to handle 4,200 components, 185 suppliers, and upwards of 500,000 annual inspection records with query response times under 50ms on indexed searches.
4. **Security & Role-Based Access Control (RBAC):**
   - Distinct database user roles: `QC_INSPECTOR` (read/write inspections), `PROCUREMENT_OFFICER` (read inspections, write claims/RMAs), `PLANT_MANAGER` (read-only dashboards), and `DBA_ADMIN` (full DDL/DML access).

---

## 6. "Thinking Beyond": Enterprise-Grade Architectural Considerations

To simulate how this system operates at Fortune 500 automotive scale, the design incorporates advanced enterprise capabilities:

1. **Bi-Temporal Lot Traceability:**
   - Tracking both *valid-time* (when the batch was manufactured/tested) and *transaction-time* (when the entry was posted to the database) to withstand ISO and government regulatory recalls (NHTSA).
2. **Automated SLA Breach Debit Memos:**
   - Transitioning from manual email disputes to systematic financial debits generated immediately upon verified inspection failure.
3. **Partitioning Strategy for High-Volume Inspections:**
   - Table partitioning by `Inspection_Date` (Range Partitioning by Quarter) to maintain indexing speed as records accumulate into millions.
4. **Data Warehouse (Star Schema) Readiness:**
   - Logical separation between transactional OLTP tables and dimension/fact tables for executive Business Intelligence (PowerBI / Tableau) integration.
