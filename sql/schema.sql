-- ==============================================================================
-- Vendor Quality & Compliance Management System (VQCMS - XII)
-- Database Definition Language (DDL) Schema
-- Course: SEM I - Data Science and Technology / DBMS
-- Team: Team 12 | Client Domain: Precision Auto Parts
-- Engine Compatibility: ANSI SQL / SQLite / PostgreSQL
-- ==============================================================================

-- Enable Foreign Key Enforcement
PRAGMA foreign_keys = ON;

-- Drop Existing Views (in reverse dependency order)
DROP VIEW IF EXISTS v_financial_recovery_summary;
DROP VIEW IF EXISTS v_active_quarantine_dashboard;
DROP VIEW IF EXISTS v_supplier_quality_scorecard;

-- Drop Existing Triggers
DROP TRIGGER IF EXISTS trg_auto_calculate_ppm;
DROP TRIGGER IF EXISTS trg_audit_quarantine_insert;
DROP TRIGGER IF EXISTS trg_audit_quarantine_update;

-- Drop Existing Tables (topological dependency order)
DROP TABLE IF EXISTS compliance_audit_log;
DROP TABLE IF EXISTS penalty_invoices;
DROP TABLE IF EXISTS rma_claims;
DROP TABLE IF EXISTS downtime_incidents;
DROP TABLE IF EXISTS batch_quarantines;
DROP TABLE IF EXISTS inspection_records;
DROP TABLE IF EXISTS qc_inspectors;
DROP TABLE IF EXISTS shipment_receipts;
DROP TABLE IF EXISTS po_line_items;
DROP TABLE IF EXISTS purchase_orders;
DROP TABLE IF EXISTS components;
DROP TABLE IF EXISTS supplier_contracts;
DROP TABLE IF EXISTS suppliers;
DROP TABLE IF EXISTS plants;

-- ==============================================================================
-- 1. MASTER ENTITIES
-- ==============================================================================

-- 1.1 Manufacturing Plants (4 Global Facilities)
CREATE TABLE plants (
    plant_id INTEGER PRIMARY KEY AUTOINCREMENT,
    plant_code VARCHAR(10) NOT NULL UNIQUE,
    plant_name VARCHAR(100) NOT NULL,
    city VARCHAR(50) NOT NULL,
    country VARCHAR(50) NOT NULL,
    dock_capacity INTEGER NOT NULL CHECK (dock_capacity > 0),
    is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1))
);

-- 1.2 Global Suppliers (185 Tier-1 & Tier-2 Suppliers)
CREATE TABLE suppliers (
    supplier_id INTEGER PRIMARY KEY AUTOINCREMENT,
    supplier_code VARCHAR(20) NOT NULL UNIQUE,
    company_name VARCHAR(150) NOT NULL,
    country VARCHAR(50) NOT NULL,
    contact_email VARCHAR(100) NOT NULL UNIQUE,
    phone VARCHAR(30) NOT NULL,
    iso_certified INTEGER NOT NULL DEFAULT 1 CHECK (iso_certified IN (0, 1)),
    compliance_rating DECIMAL(3,2) NOT NULL DEFAULT 3.00 CHECK (compliance_rating BETWEEN 0.00 AND 5.00),
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'PROBATION', 'SUSPENDED', 'BLACKLISTED'))
);

-- 1.3 Supplier Contracts (SLA, Warranty, and Downtime Penalty Rates)
CREATE TABLE supplier_contracts (
    contract_id INTEGER PRIMARY KEY AUTOINCREMENT,
    supplier_id INTEGER NOT NULL,
    contract_code VARCHAR(30) NOT NULL UNIQUE,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    max_allowable_ppm INTEGER NOT NULL CHECK (max_allowable_ppm >= 0),
    hourly_downtime_penalty DECIMAL(10,2) NOT NULL CHECK (hourly_downtime_penalty >= 0.00),
    warranty_coverage_pct DECIMAL(5,2) NOT NULL DEFAULT 100.00 CHECK (warranty_coverage_pct BETWEEN 0.00 AND 100.00),
    terms_summary TEXT,
    FOREIGN KEY (supplier_id) REFERENCES suppliers(supplier_id) ON DELETE RESTRICT,
    CHECK (end_date > start_date)
);

-- 1.4 Automotive Components Master (4,200 Engine & Transmission Parts)
CREATE TABLE components (
    component_id INTEGER PRIMARY KEY AUTOINCREMENT,
    part_number VARCHAR(50) NOT NULL UNIQUE,
    component_name VARCHAR(120) NOT NULL,
    category VARCHAR(40) NOT NULL CHECK (category IN ('ENGINE', 'TRANSMISSION', 'DRIVETRAIN', 'CHASSIS')),
    subsystem VARCHAR(50) NOT NULL,
    criticality_tier CHAR(1) NOT NULL CHECK (criticality_tier IN ('A', 'B', 'C')), -- A: Safety Critical, B: High, C: Standard
    standard_cost DECIMAL(10,2) NOT NULL CHECK (standard_cost > 0.00),
    material_spec VARCHAR(100) NOT NULL
);

-- ==============================================================================
-- 2. PROCUREMENT & RECEIVING MODULE
-- ==============================================================================

-- 2.1 Purchase Orders
CREATE TABLE purchase_orders (
    po_id INTEGER PRIMARY KEY AUTOINCREMENT,
    po_number VARCHAR(30) NOT NULL UNIQUE,
    supplier_id INTEGER NOT NULL,
    plant_id INTEGER NOT NULL,
    order_date DATE NOT NULL,
    expected_delivery_date DATE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'ISSUED' CHECK (status IN ('ISSUED', 'PARTIAL_RECEIVED', 'FULFILLED', 'CANCELLED')),
    total_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00 CHECK (total_amount >= 0.00),
    FOREIGN KEY (supplier_id) REFERENCES suppliers(supplier_id) ON DELETE RESTRICT,
    FOREIGN KEY (plant_id) REFERENCES plants(plant_id) ON DELETE RESTRICT,
    CHECK (expected_delivery_date >= order_date)
);

-- 2.2 Purchase Order Line Items
CREATE TABLE po_line_items (
    po_line_id INTEGER PRIMARY KEY AUTOINCREMENT,
    po_id INTEGER NOT NULL,
    component_id INTEGER NOT NULL,
    ordered_quantity INTEGER NOT NULL CHECK (ordered_quantity > 0),
    unit_price DECIMAL(10,2) NOT NULL CHECK (unit_price > 0.00),
    line_total DECIMAL(12,2) NOT NULL CHECK (line_total >= 0.00),
    FOREIGN KEY (po_id) REFERENCES purchase_orders(po_id) ON DELETE CASCADE,
    FOREIGN KEY (component_id) REFERENCES components(component_id) ON DELETE RESTRICT
);

-- 2.3 Shipment Receipts & Dock Deliveries
CREATE TABLE shipment_receipts (
    receipt_id INTEGER PRIMARY KEY AUTOINCREMENT,
    po_line_id INTEGER NOT NULL,
    plant_id INTEGER NOT NULL,
    batch_lot_number VARCHAR(50) NOT NULL,
    quantity_received INTEGER NOT NULL CHECK (quantity_received > 0),
    delivery_date DATE NOT NULL,
    carrier_tracking VARCHAR(60),
    bill_of_lading VARCHAR(60) NOT NULL,
    dock_bay VARCHAR(20),
    FOREIGN KEY (po_line_id) REFERENCES po_line_items(po_line_id) ON DELETE RESTRICT,
    FOREIGN KEY (plant_id) REFERENCES plants(plant_id) ON DELETE RESTRICT
);

-- ==============================================================================
-- 3. QUALITY CONTROL & INSPECTION MODULE
-- ==============================================================================

-- 3.1 Quality Control Inspectors
CREATE TABLE qc_inspectors (
    inspector_id INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_code VARCHAR(20) NOT NULL UNIQUE,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    cert_level VARCHAR(30) NOT NULL CHECK (cert_level IN ('LEVEL_1_JUNIOR', 'LEVEL_2_CERTIFIED', 'LEVEL_3_LEAD_AUDITOR')),
    plant_id INTEGER NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    FOREIGN KEY (plant_id) REFERENCES plants(plant_id) ON DELETE RESTRICT
);

-- 3.2 Batch Inspection Records
CREATE TABLE inspection_records (
    inspection_id INTEGER PRIMARY KEY AUTOINCREMENT,
    receipt_id INTEGER NOT NULL,
    inspector_id INTEGER NOT NULL,
    inspection_date DATE NOT NULL,
    sample_size INTEGER NOT NULL CHECK (sample_size > 0),
    defect_count INTEGER NOT NULL DEFAULT 0 CHECK (defect_count >= 0),
    defect_category VARCHAR(50) NOT NULL DEFAULT 'NONE' CHECK (defect_category IN ('NONE', 'DIMENSIONAL', 'METALLURGICAL', 'FINISH', 'STRUCTURAL', 'ELECTRONIC')),
    calculated_ppm DECIMAL(10,2) NOT NULL DEFAULT 0.00 CHECK (calculated_ppm >= 0.00),
    inspection_status VARCHAR(20) NOT NULL CHECK (inspection_status IN ('PASSED', 'FAILED', 'CONDITIONAL_PASS')),
    coa_verified INTEGER NOT NULL DEFAULT 1 CHECK (coa_verified IN (0, 1)),
    qc_notes TEXT,
    FOREIGN KEY (receipt_id) REFERENCES shipment_receipts(receipt_id) ON DELETE RESTRICT,
    FOREIGN KEY (inspector_id) REFERENCES qc_inspectors(inspector_id) ON DELETE RESTRICT,
    CHECK (defect_count <= sample_size)
);

-- 3.3 Batch Quarantine Containment
CREATE TABLE batch_quarantines (
    quarantine_id INTEGER PRIMARY KEY AUTOINCREMENT,
    inspection_id INTEGER NOT NULL UNIQUE,
    quarantine_timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    quarantined_quantity INTEGER NOT NULL CHECK (quarantined_quantity > 0),
    storage_bay VARCHAR(30) NOT NULL,
    quarantine_reason VARCHAR(100) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'HELD' CHECK (status IN ('HELD', 'RELEASED', 'RMA_ISSUED', 'SCRAPPED_ON_SITE')),
    authorized_by VARCHAR(50),
    FOREIGN KEY (inspection_id) REFERENCES inspection_records(inspection_id) ON DELETE RESTRICT
);

-- ==============================================================================
-- 4. CLAIMS, DOWNTIME & FINANCIAL PENALTIES
-- ==============================================================================

-- 4.1 Assembly Line Downtime Incidents
CREATE TABLE downtime_incidents (
    incident_id INTEGER PRIMARY KEY AUTOINCREMENT,
    plant_id INTEGER NOT NULL,
    receipt_id INTEGER NOT NULL,
    assembly_line VARCHAR(50) NOT NULL,
    downtime_start TIMESTAMP NOT NULL,
    downtime_end TIMESTAMP NOT NULL,
    downtime_minutes INTEGER NOT NULL CHECK (downtime_minutes > 0),
    line_stoppage_cost DECIMAL(12,2) NOT NULL CHECK (line_stoppage_cost >= 0.00),
    root_cause_summary TEXT NOT NULL,
    FOREIGN KEY (plant_id) REFERENCES plants(plant_id) ON DELETE RESTRICT,
    FOREIGN KEY (receipt_id) REFERENCES shipment_receipts(receipt_id) ON DELETE RESTRICT,
    CHECK (downtime_end > downtime_start)
);

-- 4.2 Return Merchandise Authorization (RMA) Claims
CREATE TABLE rma_claims (
    rma_id INTEGER PRIMARY KEY AUTOINCREMENT,
    quarantine_id INTEGER NOT NULL,
    supplier_id INTEGER NOT NULL,
    rma_number VARCHAR(30) NOT NULL UNIQUE,
    claim_date DATE NOT NULL,
    claim_type VARCHAR(30) NOT NULL CHECK (claim_type IN ('FULL_REFUND', 'REPLACEMENT_EXPEDITED', 'SCRAP_CREDIT')),
    claimed_amount DECIMAL(12,2) NOT NULL CHECK (claimed_amount >= 0.00),
    settled_amount DECIMAL(12,2) DEFAULT 0.00 CHECK (settled_amount >= 0.00),
    settlement_status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (settlement_status IN ('PENDING', 'SUPPLIER_ACKNOWLEDGED', 'APPROVED', 'REJECTED', 'SETTLED')),
    resolution_date DATE,
    FOREIGN KEY (quarantine_id) REFERENCES batch_quarantines(quarantine_id) ON DELETE RESTRICT,
    FOREIGN KEY (supplier_id) REFERENCES suppliers(supplier_id) ON DELETE RESTRICT
);

-- 4.3 Automated Penalty Invoices (Debit Memos)
CREATE TABLE penalty_invoices (
    invoice_id INTEGER PRIMARY KEY AUTOINCREMENT,
    supplier_id INTEGER NOT NULL,
    incident_id INTEGER,
    rma_id INTEGER,
    invoice_number VARCHAR(30) NOT NULL UNIQUE,
    invoice_date DATE NOT NULL,
    base_penalty DECIMAL(10,2) NOT NULL DEFAULT 0.00 CHECK (base_penalty >= 0.00),
    downtime_penalty DECIMAL(12,2) NOT NULL DEFAULT 0.00 CHECK (downtime_penalty >= 0.00),
    total_penalty_amount DECIMAL(12,2) NOT NULL CHECK (total_penalty_amount >= 0.00),
    payment_status VARCHAR(20) NOT NULL DEFAULT 'ISSUED' CHECK (payment_status IN ('ISSUED', 'DEDUCTED_FROM_PAYABLE', 'DISPUTED', 'PAID')),
    FOREIGN KEY (supplier_id) REFERENCES suppliers(supplier_id) ON DELETE RESTRICT,
    FOREIGN KEY (incident_id) REFERENCES downtime_incidents(incident_id) ON DELETE SET NULL,
    FOREIGN KEY (rma_id) REFERENCES rma_claims(rma_id) ON DELETE SET NULL
);

-- ==============================================================================
-- 5. AUDIT & ENTERPRISE COMPLIANCE LEDGER
-- ==============================================================================

CREATE TABLE compliance_audit_log (
    audit_id INTEGER PRIMARY KEY AUTOINCREMENT,
    table_name VARCHAR(50) NOT NULL,
    record_id INTEGER NOT NULL,
    action_type VARCHAR(20) NOT NULL,
    previous_state TEXT,
    new_state TEXT,
    changed_by VARCHAR(50) NOT NULL,
    changed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ==============================================================================
-- 6. PERFORMANCE INDEXES
-- ==============================================================================

CREATE INDEX idx_receipts_lot ON shipment_receipts(batch_lot_number);
CREATE INDEX idx_receipts_delivery_date ON shipment_receipts(delivery_date);
CREATE INDEX idx_inspections_receipt ON inspection_records(receipt_id);
CREATE INDEX idx_inspections_date ON inspection_records(inspection_date);
CREATE INDEX idx_inspections_status ON inspection_records(inspection_status);
CREATE INDEX idx_quarantines_status ON batch_quarantines(status);
CREATE INDEX idx_rma_supplier ON rma_claims(supplier_id);
CREATE INDEX idx_rma_status ON rma_claims(settlement_status);
CREATE INDEX idx_downtime_plant ON downtime_incidents(plant_id);
CREATE INDEX idx_penalties_supplier ON penalty_invoices(supplier_id);

-- ==============================================================================
-- 7. AUTOMATED BUSINESS TRIGGERS
-- ==============================================================================

-- 7.1 Auto-compute Defect PPM upon Inspection Record Creation
CREATE TRIGGER trg_auto_calculate_ppm
AFTER INSERT ON inspection_records
FOR EACH ROW
WHEN NEW.calculated_ppm = 0.00 AND NEW.sample_size > 0
BEGIN
    UPDATE inspection_records
    SET calculated_ppm = (CAST(NEW.defect_count AS REAL) / NEW.sample_size) * 1000000.0
    WHERE inspection_id = NEW.inspection_id;
END;

-- 7.2 Audit Trail Logging for Quarantine Insertion
CREATE TRIGGER trg_audit_quarantine_insert
AFTER INSERT ON batch_quarantines
FOR EACH ROW
BEGIN
    INSERT INTO compliance_audit_log (table_name, record_id, action_type, previous_state, new_state, changed_by, changed_at)
    VALUES ('batch_quarantines', NEW.quarantine_id, 'QUARANTINE_HOLD', 'NONE', NEW.status, 'SYSTEM_TRIGGER', CURRENT_TIMESTAMP);
END;

-- 7.3 Audit Trail Logging for Quarantine Status Update
CREATE TRIGGER trg_audit_quarantine_update
AFTER UPDATE OF status ON batch_quarantines
FOR EACH ROW
BEGIN
    INSERT INTO compliance_audit_log (table_name, record_id, action_type, previous_state, new_state, changed_by, changed_at)
    VALUES ('batch_quarantines', NEW.quarantine_id, 'STATUS_CHANGE', OLD.status, NEW.status, 'SYSTEM_TRIGGER', CURRENT_TIMESTAMP);
END;

-- ==============================================================================
-- 8. OPERATIONAL & EXECUTIVE VIEWS
-- ==============================================================================

-- 8.1 Supplier Quality Scorecard View
CREATE VIEW v_supplier_quality_scorecard AS
SELECT 
    s.supplier_id,
    s.supplier_code,
    s.company_name,
    s.country,
    s.compliance_rating,
    sc.max_allowable_ppm AS contractual_ppm_limit,
    COUNT(DISTINCT sr.receipt_id) AS total_shipments_received,
    COALESCE(SUM(ir.sample_size), 0) AS total_units_inspected,
    COALESCE(SUM(ir.defect_count), 0) AS total_defects_found,
    CASE 
        WHEN COALESCE(SUM(ir.sample_size), 0) > 0 
        THEN ROUND((CAST(SUM(ir.defect_count) AS REAL) / SUM(ir.sample_size)) * 1000000.0, 2)
        ELSE 0.00 
    END AS actual_calculated_ppm,
    CASE 
        WHEN COALESCE(SUM(ir.sample_size), 0) = 0 THEN 'NO_DATA'
        WHEN ((CAST(SUM(ir.defect_count) AS REAL) / SUM(ir.sample_size)) * 1000000.0) <= sc.max_allowable_ppm THEN 'COMPLIANT'
        ELSE 'BREACH_PENALTY_RISK'
    END AS compliance_status
FROM suppliers s
LEFT JOIN supplier_contracts sc ON s.supplier_id = sc.supplier_id
LEFT JOIN purchase_orders po ON s.supplier_id = po.supplier_id
LEFT JOIN po_line_items pli ON po.po_id = pli.po_id
LEFT JOIN shipment_receipts sr ON pli.po_line_id = sr.po_line_id
LEFT JOIN inspection_records ir ON sr.receipt_id = ir.receipt_id
GROUP BY s.supplier_id, s.supplier_code, s.company_name, s.country, s.compliance_rating, sc.max_allowable_ppm;

-- 8.2 Real-Time Active Quarantine Dashboard View
CREATE VIEW v_active_quarantine_dashboard AS
SELECT 
    bq.quarantine_id,
    p.plant_code,
    p.plant_name,
    s.company_name AS supplier_name,
    c.part_number,
    c.component_name,
    sr.batch_lot_number,
    bq.quarantined_quantity,
    bq.storage_bay,
    bq.quarantine_timestamp,
    bq.quarantine_reason,
    bq.status AS quarantine_status,
    ROUND(bq.quarantined_quantity * c.standard_cost, 2) AS estimated_hold_value
FROM batch_quarantines bq
JOIN inspection_records ir ON bq.inspection_id = ir.inspection_id
JOIN shipment_receipts sr ON ir.receipt_id = sr.receipt_id
JOIN po_line_items pli ON sr.po_line_id = pli.po_line_id
JOIN components c ON pli.component_id = c.component_id
JOIN purchase_orders po ON pli.po_id = po.po_id
JOIN suppliers s ON po.supplier_id = s.supplier_id
JOIN plants p ON sr.plant_id = p.plant_id
WHERE bq.status IN ('HELD', 'RMA_ISSUED');

-- 8.3 Financial Recovery & Warranty Claims Summary View
CREATE VIEW v_financial_recovery_summary AS
SELECT 
    s.supplier_id,
    s.company_name,
    COUNT(DISTINCT r.rma_id) AS total_rma_filed,
    COALESCE(SUM(r.claimed_amount), 0.00) AS total_warranty_claimed,
    COALESCE(SUM(r.settled_amount), 0.00) AS total_warranty_settled,
    COALESCE(SUM(p.total_penalty_amount), 0.00) AS total_penalties_debited,
    (COALESCE(SUM(r.settled_amount), 0.00) + COALESCE(SUM(p.total_penalty_amount), 0.00)) AS total_financial_recovery
FROM suppliers s
LEFT JOIN rma_claims r ON s.supplier_id = r.supplier_id
LEFT JOIN penalty_invoices p ON s.supplier_id = p.supplier_id
GROUP BY s.supplier_id, s.company_name;
