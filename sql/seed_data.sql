-- ==============================================================================
-- Vendor Quality & Compliance Management System (VQCMS - XII)
-- Comprehensive Seed Data Fixture
-- Represents 4 Global Assembly Plants, Tier-1 Suppliers, Component Specs,
-- Purchase Orders, Batch Inspections, Quarantines, Line Downtimes & Invoices.
-- ==============================================================================

-- 1. Insert Manufacturing Plants (4 Facilities)
INSERT INTO plants (plant_id, plant_code, plant_name, city, country, dock_capacity, is_active) VALUES
(1, 'PLT-DET', 'Detroit Assembly Plant #1', 'Detroit', 'USA', 12, 1),
(2, 'PLT-STU', 'Stuttgart Powertrain Works', 'Stuttgart', 'Germany', 8, 1),
(3, 'PLT-CHE', 'Chennai Engine & Transmission Center', 'Chennai', 'India', 15, 1),
(4, 'PLT-SHA', 'Shanghai High-Tech Assembly Plant', 'Shanghai', 'China', 10, 1);

-- 2. Insert Global Suppliers (Representative of the 185 Supplier Base)
INSERT INTO suppliers (supplier_id, supplier_code, company_name, country, contact_email, phone, iso_certified, compliance_rating, status) VALUES
(1, 'SUP-BOSCH', 'Bosch Precision Powertrain GmbH', 'Germany', 'qa.compliance@bosch-powertrain.de', '+49-711-811-0001', 1, 4.85, 'ACTIVE'),
(2, 'SUP-DENSO', 'Denso Thermal & Fuel Systems Corp', 'Japan', 'quality@denso.co.jp', '+81-566-25-5511', 1, 4.60, 'ACTIVE'),
(3, 'SUP-MAGNA', 'Magna Drivetrain Transmission Ltd', 'Canada', 'vendor.audit@magna.ca', '+1-905-726-2460', 1, 4.40, 'ACTIVE'),
(4, 'SUP-ZF', 'ZF Friedrichshafen Mobility AG', 'Germany', 'claims@zf.com', '+49-7541-77-0', 1, 3.90, 'ACTIVE'),
(5, 'SUP-AISIN', 'Aisin Seiki Drivetrain Products', 'Japan', 'compliance@aisin.co.jp', '+81-566-24-8266', 1, 4.70, 'ACTIVE'),
(6, 'SUP-BORG', 'BorgWarner Turbo & Emissions Inc', 'USA', 'warranty@borgwarner.com', '+1-248-754-0800', 1, 3.10, 'PROBATION'),
(7, 'SUP-BHARAT', 'Bharat Forge Heavy Engine Precision', 'India', 'qc.desk@bharatforge.com', '+91-20-6704-2777', 1, 4.25, 'ACTIVE'),
(8, 'SUP-SCHAEF', 'Schaeffler Roller & Bearing AG', 'Germany', 'automotive.qa@schaeffler.com', '+49-9132-82-0', 1, 3.40, 'PROBATION');

-- 3. Insert Supplier Contracts (SLAs & Penalty Stipulations)
INSERT INTO supplier_contracts (contract_id, supplier_id, contract_code, start_date, end_date, max_allowable_ppm, hourly_downtime_penalty, warranty_coverage_pct, terms_summary) VALUES
(1, 1, 'CTR-2025-BOSCH-01', '2025-01-01', '2027-12-31', 50, 4500.00, 100.00, 'Tier-1 zero-defect standard; 100% full replacement + express freight reimbursement on breach.'),
(2, 2, 'CTR-2025-DENSO-01', '2025-01-01', '2027-12-31', 60, 4000.00, 100.00, 'Max allowable PPM 60; 8D report mandatory within 48h of quarantine notice.'),
(3, 3, 'CTR-2025-MAGNA-01', '2025-03-01', '2028-02-28', 75, 4200.00, 95.00, 'Standard drivetrain supply; downtime compensation charged per minute of line stoppage.'),
(4, 4, 'CTR-2025-ZF-01', '2025-02-01', '2027-01-31', 70, 5000.00, 100.00, 'Transmission systems; defect rates exceeding 70 PPM trigger automatic 15% invoice holdback.'),
(5, 5, 'CTR-2025-AISIN-01', '2025-01-15', '2027-01-14', 50, 4000.00, 100.00, 'High-precision DCT components; mandatory Certificate of Analysis with each shipment lot.'),
(6, 6, 'CTR-2025-BORG-01', '2025-04-01', '2026-03-31', 90, 6000.00, 100.00, 'Turbos and thermal modules; probation terms with $6,000/hr line stoppage liability.'),
(7, 7, 'CTR-2025-BHARAT-01', '2025-01-01', '2027-12-31', 80, 3500.00, 100.00, 'Forged steel crank & cam parts; defect PPM above 80 incurs debit memo of full lot value.'),
(8, 8, 'CTR-2025-SCHAEF-01', '2025-05-01', '2026-04-30', 85, 4800.00, 90.00, 'Roller bearings; defect parts replaced within 5 calendar days at vendor expense.');

-- 4. Insert Master Components (Engine & Transmission Components)
INSERT INTO components (component_id, part_number, component_name, category, subsystem, criticality_tier, standard_cost, material_spec) VALUES
(1, 'ENG-CRK-4001', 'Forged Steel Engine Crankshaft V6', 'ENGINE', 'Crankcase & Rotating', 'A', 285.50, '42CrMo4 Quenched Steel'),
(2, 'ENG-VVT-4002', 'Variable Valve Timing Oil Solenoid', 'ENGINE', 'Valvetrain', 'A', 42.00, 'Electro-Hydraulic IP67'),
(3, 'ENG-INJ-4003', 'Direct Common-Rail High-Pressure Injector', 'ENGINE', 'Fuel Injection', 'A', 115.00, 'Piezo Ceramic 2500 Bar'),
(4, 'ENG-GST-4004', 'Multi-Layer Steel (MLS) Cylinder Head Gasket', 'ENGINE', 'Combustion Chamber', 'A', 38.50, 'Stainless Spring Steel 301'),
(5, 'ENG-TUR-4005', 'Twin-Scroll Turbocharger Wastegate Actuator', 'ENGINE', 'Forced Induction', 'B', 88.00, 'Cast Inconel 713C'),
(6, 'TRN-SFT-5001', 'DCT Dual-Clutch Main Input Shaft', 'TRANSMISSION', 'Dual-Clutch Gearbox', 'A', 210.00, '16MnCr5 Case-Hardened Steel'),
(7, 'TRN-PLN-5002', 'Planetary Differential Ring Gear Carrier', 'TRANSMISSION', 'Differential Assembly', 'B', 145.00, 'Ductile Iron EN-GJS-700'),
(8, 'TRN-FLW-5003', 'Dual Mass Dynamic Damping Flywheel', 'TRANSMISSION', 'Torque Transfer', 'A', 195.00, 'Spring Steel Arc Damping'),
(9, 'TRN-SYN-5004', 'Carbon-Coated Brass Synchromesh Ring #3', 'TRANSMISSION', 'Manual/Sequential Synchronizer', 'B', 24.50, 'CuZn40Al2 Carbon Matrix'),
(10, 'ENG-OIL-4006', 'Die-Cast Aluminum Engine Oil Sump Pan', 'ENGINE', 'Lubrication System', 'C', 32.00, 'AlSi9Cu3 Cast Alloy');

-- 5. Insert Quality Control Inspectors Across Plants
INSERT INTO qc_inspectors (inspector_id, employee_code, first_name, last_name, cert_level, plant_id, email) VALUES
(1, 'QC-DET-01', 'Robert', 'Miller', 'LEVEL_3_LEAD_AUDITOR', 1, 'robert.miller@precisionparts.com'),
(2, 'QC-DET-02', 'Sarah', 'Jenkins', 'LEVEL_2_CERTIFIED', 1, 'sarah.jenkins@precisionparts.com'),
(3, 'QC-STU-01', 'Hans', 'Mueller', 'LEVEL_3_LEAD_AUDITOR', 2, 'hans.mueller@precisionparts.de'),
(4, 'QC-STU-02', 'Greta', 'Schneider', 'LEVEL_2_CERTIFIED', 2, 'greta.schneider@precisionparts.de'),
(5, 'QC-CHE-01', 'Rajesh', 'Venkatesh', 'LEVEL_3_LEAD_AUDITOR', 3, 'rajesh.v@precisionparts.in'),
(6, 'QC-CHE-02', 'Priya', 'Sundaram', 'LEVEL_2_CERTIFIED', 3, 'priya.s@precisionparts.in'),
(7, 'QC-SHA-01', 'Wei', 'Zhang', 'LEVEL_3_LEAD_AUDITOR', 4, 'wei.zhang@precisionparts.cn'),
(8, 'QC-SHA-02', 'Li', 'Na', 'LEVEL_1_JUNIOR', 4, 'li.na@precisionparts.cn');

-- 6. Insert Purchase Orders
INSERT INTO purchase_orders (po_id, po_number, supplier_id, plant_id, order_date, expected_delivery_date, status, total_amount) VALUES
(1, 'PO-2026-001', 1, 1, '2026-01-10', '2026-01-25', 'FULFILLED', 115000.00),
(2, 'PO-2026-002', 3, 1, '2026-01-15', '2026-02-01', 'FULFILLED', 105000.00),
(3, 'PO-2026-003', 7, 3, '2026-01-20', '2026-02-05', 'FULFILLED', 142750.00),
(4, 'PO-2026-004', 6, 2, '2026-02-01', '2026-02-15', 'FULFILLED', 44000.00),
(5, 'PO-2026-005', 4, 2, '2026-02-05', '2026-02-20', 'FULFILLED', 72500.00),
(6, 'PO-2026-006', 2, 4, '2026-02-10', '2026-02-25', 'FULFILLED', 57500.00),
(7, 'PO-2026-007', 8, 3, '2026-02-15', '2026-03-01', 'FULFILLED', 12250.00),
(8, 'PO-2026-008', 6, 1, '2026-02-20', '2026-03-05', 'FULFILLED', 88000.00);

-- 7. Insert PO Line Items
INSERT INTO po_line_items (po_line_id, po_id, component_id, ordered_quantity, unit_price, line_total) VALUES
(1, 1, 3, 1000, 115.00, 115000.00), -- High-pressure injectors from Bosch
(2, 2, 6, 500, 210.00, 105000.00),  -- DCT Input shafts from Magna
(3, 3, 1, 500, 285.50, 142750.00),  -- Crankshafts from Bharat Forge
(4, 4, 5, 500, 88.00, 44000.00),    -- Wastegate actuators from BorgWarner
(5, 5, 7, 500, 145.00, 72500.00),   -- Planetary carriers from ZF
(6, 6, 3, 500, 115.00, 57500.00),   -- Injectors from Denso
(7, 7, 9, 500, 24.50, 12250.00),    -- Synchromesh rings from Schaeffler
(8, 8, 5, 1000, 88.00, 88000.00);   -- Turbo actuators from BorgWarner (Detroit)

-- 8. Insert Shipment Receipts & Dock Deliveries
INSERT INTO shipment_receipts (receipt_id, po_line_id, plant_id, batch_lot_number, quantity_received, delivery_date, carrier_tracking, bill_of_lading, dock_bay) VALUES
(1, 1, 1, 'LOT-2026-BOSCH-8801', 1000, '2026-01-24', 'TRK-DHL-99120', 'BOL-DET-00192', 'BAY-02'),
(2, 2, 1, 'LOT-2026-MAGNA-1102', 500, '2026-01-30', 'TRK-FDX-88210', 'BOL-DET-00204', 'BAY-04'),
(3, 3, 3, 'LOT-2026-BHARAT-339', 500, '2026-02-04', 'TRK-CON-44012', 'BOL-CHE-00811', 'BAY-01'),
(4, 4, 2, 'LOT-2026-BORG-7714', 500, '2026-02-14', 'TRK-UPS-33100', 'BOL-STU-00445', 'BAY-03'),
(5, 5, 2, 'LOT-2026-ZF-4921', 500, '2026-02-18', 'TRK-SCH-55219', 'BOL-STU-00489', 'BAY-02'),
(6, 6, 4, 'LOT-2026-DENSO-601', 500, '2026-02-23', 'TRK-SF-88912', 'BOL-SHA-00312', 'BAY-05'),
(7, 7, 3, 'LOT-2026-SCHAEF-19', 500, '2026-02-28', 'TRK-CON-44981', 'BOL-CHE-00902', 'BAY-02'),
(8, 8, 1, 'LOT-2026-BORG-7890', 1000, '2026-03-03', 'TRK-DHL-99882', 'BOL-DET-00341', 'BAY-01');

-- 9. Insert Inspection Records (Trigger will automatically compute calculated_ppm)
-- Note: Batch 4 (BorgWarner) and Batch 8 (BorgWarner) have severe defect counts!
-- Note: Batch 5 (ZF) has borderline defect count causing quarantine.
INSERT INTO inspection_records (inspection_id, receipt_id, inspector_id, inspection_date, sample_size, defect_count, defect_category, calculated_ppm, inspection_status, coa_verified, qc_notes) VALUES
(1, 1, 1, '2026-01-25', 200, 0, 'NONE', 0.00, 'PASSED', 1, 'Perfect metallurgical and pressure tolerance test.'),
(2, 2, 2, '2026-01-31', 100, 0, 'NONE', 0.00, 'PASSED', 1, 'Spline runout within +/- 3 microns.'),
(3, 3, 5, '2026-02-05', 100, 0, 'NONE', 0.00, 'PASSED', 1, 'Dynamic balance test within G2.5 spec.'),
(4, 4, 3, '2026-02-15', 150, 9, 'DIMENSIONAL', 0.00, 'FAILED', 0, 'Actuator linkage out of roundness by 0.12mm. Reject lot.'),
(5, 5, 4, '2026-02-19', 100, 3, 'METALLURGICAL', 0.00, 'FAILED', 1, 'Micro-fissures detected during ultrasonic scanning.'),
(6, 6, 7, '2026-02-24', 100, 0, 'NONE', 0.00, 'PASSED', 1, 'Flow bench verified at 2500 bar.'),
(7, 7, 6, '2026-03-01', 100, 1, 'FINISH', 0.00, 'CONDITIONAL_PASS', 1, 'Minor burr removed on bench. Accept under waiver.'),
(8, 8, 1, '2026-03-04', 200, 14, 'DIMENSIONAL', 0.00, 'FAILED', 0, 'Severely defective batch. Caused assembly line freeze.');

-- 10. Insert Batch Quarantines
INSERT INTO batch_quarantines (quarantine_id, inspection_id, quarantine_timestamp, quarantined_quantity, storage_bay, quarantine_reason, status, authorized_by) VALUES
(1, 4, '2026-02-15 11:30:00', 500, 'BAY-Q-STU-01', 'Severe dimensional failure on linkage pin', 'RMA_ISSUED', 'Hans Mueller'),
(2, 5, '2026-02-19 14:15:00', 500, 'BAY-Q-STU-03', 'Subsurface micro-cracking in carrier casting', 'HELD', 'Greta Schneider'),
(3, 8, '2026-03-04 09:45:00', 1000, 'BAY-Q-DET-04', 'Critical dimension breach; halted Detroit Assembly Line 1', 'RMA_ISSUED', 'Robert Miller');

-- 11. Insert Assembly Line Downtime Incidents
INSERT INTO downtime_incidents (incident_id, plant_id, receipt_id, assembly_line, downtime_start, downtime_end, downtime_minutes, line_stoppage_cost, root_cause_summary) VALUES
(1, 2, 4, 'Stuttgart Powertrain Line #2', '2026-02-16 08:30:00', '2026-02-16 10:00:00', 90, 9000.00, 'Actuator linkage jammed in automated robotic feeder. 90 minutes downtime before defective lot quarantined.'),
(2, 1, 8, 'Detroit Engine Line #1', '2026-03-04 10:15:00', '2026-03-04 12:45:00', 150, 15000.00, 'Defective turbo wastegate caused complete line stoppage. 150 minutes downtime charged at contract penalty rate.');

-- 12. Insert RMA Claims
INSERT INTO rma_claims (rma_id, quarantine_id, supplier_id, rma_number, claim_date, claim_type, claimed_amount, settled_amount, settlement_status, resolution_date) VALUES
(1, 1, 6, 'RMA-2026-BORG-001', '2026-02-17', 'FULL_REFUND', 44000.00, 44000.00, 'SETTLED', '2026-02-28'),
(2, 2, 4, 'RMA-2026-ZF-001', '2026-02-21', 'REPLACEMENT_EXPEDITED', 72500.00, 0.00, 'SUPPLIER_ACKNOWLEDGED', NULL),
(3, 3, 6, 'RMA-2026-BORG-002', '2026-03-05', 'FULL_REFUND', 88000.00, 0.00, 'APPROVED', NULL);

-- 13. Insert Penalty Invoices (Automated Debit Memos)
INSERT INTO penalty_invoices (invoice_id, supplier_id, incident_id, rma_id, invoice_number, invoice_date, base_penalty, downtime_penalty, total_penalty_amount, payment_status) VALUES
(1, 6, 1, 1, 'DEBIT-2026-001', '2026-02-20', 5000.00, 9000.00, 14000.00, 'DEDUCTED_FROM_PAYABLE'),
(2, 6, 2, 3, 'DEBIT-2026-002', '2026-03-06', 10000.00, 15000.00, 25000.00, 'ISSUED');

-- 14. Manual trigger simulation / verification check:
-- Ensure calculated_ppm matches exactly for all rows
UPDATE inspection_records 
SET calculated_ppm = (CAST(defect_count AS REAL) / sample_size) * 1000000.0 
WHERE calculated_ppm = 0.00 AND defect_count > 0;
