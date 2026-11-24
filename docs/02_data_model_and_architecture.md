# Database Architecture, Data Models & Normalization
## Vendor Quality & Compliance Management System (VQCMS - XII)

**Course:** SEM I – Data Science and Technology / Database Management Systems  
**Project Group:** Team 12  
**Client / Domain:** Precision Auto Parts  

---

## 1. Relational Normalization Analysis

In the previous legacy system, data was fragmented across disparate Excel spreadsheets in 4 manufacturing plants. This caused classic relational database anomalies.

### 1.1 Legacy Flat-File Anomalies
- **Insertion Anomaly:** Cannot register a new qualified supplier without entering an active purchase order or receipt.
- **Update Anomaly:** Updating a supplier's contractual warranty rate or compliance email required modifying thousands of historical rows; missing a single row caused legal discrepancies during refund claims.
- **Deletion Anomaly:** Deleting a canceled purchase order destroyed the entire supplier performance history and component specifications tied to that row.

### 1.2 Step-by-Step Normalization Journey

#### First Normal Form (1NF)
- **Rules Enforced:** 
  - Every column contains atomic (indivisible) values. No multi-valued attributes (e.g., storing multiple defect types or phone numbers in a single comma-separated string).
  - Each table has a defined unique Primary Key (PK).
  - Eliminates repeating groups across rows and columns.
- **Transformation:** Defect types, contact records, and line items were decoupled into dedicated atomic relations (`po_line_items`, `inspection_records`, `downtime_incidents`).

#### Second Normal Form (2NF)
- **Rules Enforced:**
  - Must satisfy 1NF.
  - No partial functional dependencies: all non-key attributes must depend on the *entire* primary key, not a subset of a composite key.
- **Transformation:** In purchase orders, line item pricing and component details were previously grouped under a composite key `(PO_ID, Part_Number)`. Component specifications (`component_name`, `material_spec`, `unit_cost`) depended solely on `Part_Number`. These were separated into the master `components` table, leaving `po_line_items` dependent only on `(po_id, line_id)`.

#### Third Normal Form (3NF) & Boyce-Codd Normal Form (BCNF)
- **Rules Enforced:**
  - Must satisfy 2NF.
  - No transitive dependencies: non-key attributes must not depend on other non-key attributes ($X \to Y \to Z$ is eliminated).
  - In every functional dependency $X \to Y$, $X$ must be a superkey.
- **Transformation:** 
  - Plant details (`city`, `country`, `dock_capacity`) depended on `plant_id`, which was embedded transitively inside inspection records. Plant attributes were separated into a standalone `plants` table.
  - Supplier penalty terms (`max_allowable_ppm`, `hourly_downtime_penalty`) depended on contractual agreements rather than the supplier entity directly. Extracted into `supplier_contracts`.

---

## 2. Relational Schema & Entity Specifications

The relational schema comprises 14 normalized tables across 5 logical operational modules, designed in strict 3NF/BCNF.

### 2.1 Entity Relationship & Cardinality Matrix

| Parent Entity | Relationship | Child Entity | Foreign Key Column | Cardinality | Business Meaning |
| :--- | :---: | :--- | :--- | :---: | :--- |
| `PLANTS` | 1 : N | `PURCHASE_ORDERS` | `purchase_orders.plant_id` | One-to-Many | A manufacturing facility issues multiple purchase orders. |
| `PLANTS` | 1 : N | `SHIPMENT_RECEIPTS` | `shipment_receipts.plant_id` | One-to-Many | A plant receives multiple shipment dock deliveries. |
| `PLANTS` | 1 : N | `QC_INSPECTORS` | `qc_inspectors.plant_id` | One-to-Many | A plant employs multiple certified quality engineers. |
| `PLANTS` | 1 : N | `DOWNTIME_INCIDENTS` | `downtime_incidents.plant_id` | One-to-Many | A plant records assembly line stoppage occurrences. |
| `SUPPLIERS` | 1 : N | `SUPPLIER_CONTRACTS` | `supplier_contracts.supplier_id` | One-to-Many | A supplier is bound by historical and active SLAs. |
| `SUPPLIERS` | 1 : N | `PURCHASE_ORDERS` | `purchase_orders.supplier_id` | One-to-Many | A supplier fulfills incoming component orders. |
| `SUPPLIERS` | 1 : N | `RMA_CLAIMS` | `rma_claims.supplier_id` | One-to-Many | A supplier is held liable for warranty refund claims. |
| `SUPPLIERS` | 1 : N | `PENALTY_INVOICES` | `penalty_invoices.supplier_id` | One-to-Many | A supplier receives debit memos for line downtime. |
| `COMPONENTS` | 1 : N | `PO_LINE_ITEMS` | `po_line_items.component_id` | One-to-Many | A master part is ordered across various order lines. |
| `PURCHASE_ORDERS` | 1 : N | `PO_LINE_ITEMS` | `po_line_items.po_id` | One-to-Many | A PO header contains multiple line item parts. |
| `PO_LINE_ITEMS` | 1 : N | `SHIPMENT_RECEIPTS` | `shipment_receipts.po_line_id` | One-to-Many | An ordered line item is delivered across batch lots. |
| `SHIPMENT_RECEIPTS` | 1 : N | `INSPECTION_RECORDS` | `inspection_records.receipt_id` | One-to-Many | A received lot is evaluated via sample inspections. |
| `SHIPMENT_RECEIPTS` | 1 : N | `DOWNTIME_INCIDENTS` | `downtime_incidents.receipt_id` | One-to-Many | A defective lot triggers an assembly line stoppage. |
| `QC_INSPECTORS` | 1 : N | `INSPECTION_RECORDS` | `inspection_records.inspector_id` | One-to-Many | An inspector performs batch sample tests. |
| `INSPECTION_RECORDS` | 1 : 1 | `BATCH_QUARANTINES` | `batch_quarantines.inspection_id` | One-to-One | A failed inspection immediately isolates the lot into quarantine. |
| `BATCH_QUARANTINES` | 1 : 1 | `RMA_CLAIMS` | `rma_claims.quarantine_id` | One-to-One | A quarantined lot escalates to a formal RMA claim. |
| `DOWNTIME_INCIDENTS` | 1 : 1 | `PENALTY_INVOICES` | `penalty_invoices.incident_id` | One-to-One (Optional) | Stoppage losses are billed via an automated debit memo. |
| `RMA_CLAIMS` | 1 : 1 | `PENALTY_INVOICES` | `penalty_invoices.rma_id` | One-to-One (Optional) | Settled warranty claims reconcile with debit memos. |

### 2.2 Master Data Dictionary & Table Definitions

| Table Name | Primary Key | Key Attributes & Data Types | Integrity & Domain Constraints |
| :--- | :--- | :--- | :--- |
| `plants` | `plant_id` (INT) | `plant_code` (VARCHAR), `plant_name` (VARCHAR), `city` (VARCHAR), `country` (VARCHAR), `dock_capacity` (INT) | `plant_code UNIQUE`, `dock_capacity > 0` |
| `suppliers` | `supplier_id` (INT) | `supplier_code` (VARCHAR), `company_name` (VARCHAR), `compliance_rating` (DECIMAL), `status` (VARCHAR) | `supplier_code UNIQUE`, `compliance_rating BETWEEN 0.00 AND 5.00` |
| `supplier_contracts` | `contract_id` (INT) | `supplier_id` (FK), `max_allowable_ppm` (INT), `hourly_downtime_penalty` (DECIMAL), `warranty_coverage_pct` (DECIMAL) | `max_allowable_ppm >= 0`, `end_date > start_date`, `FK RESTRICT` |
| `components` | `component_id` (INT) | `part_number` (VARCHAR), `category` (VARCHAR), `criticality_tier` (CHAR), `standard_cost` (DECIMAL) | `part_number UNIQUE`, `criticality_tier IN ('A','B','C')` |
| `purchase_orders` | `po_id` (INT) | `po_number` (VARCHAR), `supplier_id` (FK), `plant_id` (FK), `order_date` (DATE), `status` (VARCHAR) | `po_number UNIQUE`, `FK RESTRICT` |
| `po_line_items` | `po_line_id` (INT) | `po_id` (FK), `component_id` (FK), `ordered_quantity` (INT), `unit_price` (DECIMAL), `line_total` (DECIMAL) | `ordered_quantity > 0`, `unit_price > 0.00` |
| `shipment_receipts` | `receipt_id` (INT) | `po_line_id` (FK), `plant_id` (FK), `batch_lot_number` (VARCHAR), `quantity_received` (INT), `delivery_date` (DATE) | `quantity_received > 0`, `FK RESTRICT` |
| `qc_inspectors` | `inspector_id` (INT) | `employee_code` (VARCHAR), `first_name` (VARCHAR), `cert_level` (VARCHAR), `plant_id` (FK), `email` (VARCHAR) | `employee_code UNIQUE`, `email UNIQUE`, `FK RESTRICT` |
| `inspection_records` | `inspection_id` (INT) | `receipt_id` (FK), `inspector_id` (FK), `sample_size` (INT), `defect_count` (INT), `calculated_ppm` (DECIMAL) | `defect_count <= sample_size`, `sample_size > 0`, `calculated_ppm >= 0` |
| `batch_quarantines` | `quarantine_id` (INT) | `inspection_id` (FK, UNIQUE), `quarantined_quantity` (INT), `storage_bay` (VARCHAR), `status` (VARCHAR) | `quarantined_quantity > 0`, `inspection_id UNIQUE` |
| `downtime_incidents` | `incident_id` (INT) | `plant_id` (FK), `receipt_id` (FK), `assembly_line` (VARCHAR), `downtime_minutes` (INT), `line_stoppage_cost` (DECIMAL) | `downtime_minutes > 0`, `downtime_end > downtime_start` |
| `rma_claims` | `rma_id` (INT) | `quarantine_id` (FK), `supplier_id` (FK), `rma_number` (VARCHAR), `claimed_amount` (DECIMAL), `status` (VARCHAR) | `rma_number UNIQUE`, `claimed_amount >= 0.00` |
| `penalty_invoices` | `invoice_id` (INT) | `supplier_id` (FK), `incident_id` (FK), `invoice_number` (VARCHAR), `base_penalty` (DECIMAL), `total_penalty` (DECIMAL) | `invoice_number UNIQUE`, `total_penalty_amount >= 0.00` |
| `compliance_audit_log` | `audit_id` (INT) | `table_name` (VARCHAR), `record_id` (INT), `action_type` (VARCHAR), `previous_state` (TEXT), `new_state` (TEXT) | Immutable append-only audit trail |

---

## 3. Visual Architecture & Diagram Reference

All visual system models are maintained as standalone, production-grade PlantUML specification files in the dedicated [`diagrams/`](file:///d:/DBMS_Team_12/diagrams) directory. This decouples visual rendering from this technical document, ensuring clean formatting when exporting to PDF or Markdown document viewers.

| Diagram Reference | Type | Key Architecture Elements Covered | Source File Link |
| :--- | :--- | :--- | :--- |
| **Relational Data Model (ERD)** | Crow's Foot ERD | All 14 relational tables, PK/FK constraints, cardinality relationships, domain groups | [01_entity_relationship.puml](file:///d:/DBMS_Team_12/diagrams/01_entity_relationship.puml) |
| **Enterprise System Architecture** | Component / C4 | Multi-plant edge ingestion (4 plants), API security gateway, ACID OLTP engine, triggers, ERP connector, BI dashboards | [02_system_architecture.puml](file:///d:/DBMS_Team_12/diagrams/02_system_architecture.puml) |
| **Batch Quarantine Lifecycle** | State Machine | Lot progression from `ORDERED` to dock receipt, QC inspection pass/fail, warehouse bay lock, RMA, and settlement | [03_quarantine_state_machine.puml](file:///d:/DBMS_Team_12/diagrams/03_quarantine_state_machine.puml) |
| **Downtime & Penalty Enforcement** | Sequence Flow | End-to-end incident response: assembly line jam, downtime tracking, automated PPM check, debit memo billing | [04_penalty_enforcement_sequence.puml](file:///d:/DBMS_Team_12/diagrams/04_penalty_enforcement_sequence.puml) |

> [!TIP]
> To preview or export vector formats (SVG, PDF, high-res PNG) of these diagrams, open any `.puml` file above in VS Code with the PlantUML extension (`Alt + D`) or paste the file contents into [PlantText](https://www.planttext.com/).

---

## 4. Enterprise Architecture & Data Lifecycle Flow

The end-to-end data processing lifecycle is structured into four distinct enterprise tiers:

| Processing Tier | Primary Components & Actors | Key Operations & Transactions | Data Integrity Guarantees |
| :--- | :--- | :--- | :--- |
| **Tier 1: Multi-Plant Edge Ingestion** | 4 Assembly Facilities (Detroit, Stuttgart, Chennai, Shanghai), Barcode Dock Scanners, Test Rigs | Shipment docking, lot number barcode capture, physical piece verification | Unique Bill of Lading & Lot identifiers prevent double-docking |
| **Tier 2: Relational OLTP Core** | `suppliers`, `components`, `purchase_orders`, `shipment_receipts`, `inspection_records` | Multi-stage sample testing, defect classification (dimensional, metallurgical, finish) | Foreign keys (`ON DELETE RESTRICT`) and check constraints guarantee relational integrity |
| **Tier 3: Automated Triggers & Containment** | Database Triggers (`trg_auto_calculate_ppm`, `trg_audit_quarantine`), Quarantine Storage Bays | Auto-calculation of Defect PPM, instant quarantine bay hold, immutable audit logging | Engine-level triggers eliminate application code calculation drift |
| **Tier 4: Financial Recovery & Analytics** | `downtime_incidents`, `rma_claims`, `penalty_invoices`, Executive Views | Cross-referencing failed lots with contracts, automated debit memo billing, supplier scorecards | Immutable audit ledger ensures compliance with IATF 16949 / ISO 9001 standards |

---

## 5. Security & Role-Based Access Control (RBAC) Specification

| Database Role | Privileges | Target Tables | Typical User Persona |
| :--- | :--- | :--- | :--- |
| `qc_inspector_role` | `SELECT`, `INSERT`, `UPDATE` (inspection fields only) | `shipment_receipts`, `inspection_records`, `batch_quarantines` | Shop-Floor Quality Control Engineers |
| `procurement_officer_role` | `SELECT`, `INSERT`, `UPDATE` | `suppliers`, `contracts`, `purchase_orders`, `rma_claims`, `penalty_invoices` | Sourcing & Vendor Relationship Managers |
| `plant_operations_role` | `SELECT`, `INSERT` | `plants`, `downtime_incidents`, `components` | Assembly Line Operations Managers |
| `executive_auditor_role` | `SELECT` ONLY (Read-Only) | All tables + `compliance_audit_log` | Quality VP, External ISO / IATF Auditors |
| `vqcms_admin_role` | `ALL PRIVILEGES` | Entire schema | Senior DBA / System Administrators |
