// ==============================================================================
// VQCMS - XII | Queries Data Module
// All 11 business queries with metadata for the Live SQL Workbench
// ==============================================================================

const QUERIES = [
  {
    id: 1,
    title: "Real-Time Supplier Defect PPM",
    category: "Quality Metrics",
    icon: "📊",
    businessIntent: "Computes actual PPM versus contractual maximum limit, ranking suppliers from best to worst quality.",
    sql: `SELECT 
    s.supplier_code,
    s.company_name,
    s.country,
    sc.max_allowable_ppm AS contract_limit_ppm,
    COUNT(DISTINCT sr.receipt_id) AS total_lots_received,
    SUM(ir.sample_size) AS total_units_sampled,
    SUM(ir.defect_count) AS total_defective_units,
    ROUND((CAST(SUM(ir.defect_count) AS REAL) / SUM(ir.sample_size)) * 1000000.0, 2) AS calculated_defect_ppm,
    CASE 
        WHEN ((CAST(SUM(ir.defect_count) AS REAL) / SUM(ir.sample_size)) * 1000000.0) <= sc.max_allowable_ppm THEN 'COMPLIANT'
        ELSE 'SLA_BREACH_PENALTY'
    END AS contractual_compliance
FROM suppliers s
JOIN supplier_contracts sc ON s.supplier_id = sc.supplier_id
JOIN purchase_orders po ON s.supplier_id = po.supplier_id
JOIN po_line_items pli ON po.po_id = pli.po_id
JOIN shipment_receipts sr ON pli.po_line_id = sr.po_line_id
JOIN inspection_records ir ON sr.receipt_id = ir.receipt_id
GROUP BY s.supplier_code, s.company_name, s.country, sc.max_allowable_ppm
ORDER BY calculated_defect_ppm DESC;`
  },
  {
    id: 2,
    title: "Warranty Cross-Reference & Refund Claims",
    category: "Financial Recovery",
    icon: "🔗",
    businessIntent: "Links failed batch inspection certificates with supplier contracts to calculate enforceable warranty refund values.",
    sql: `SELECT 
    sr.batch_lot_number,
    c.part_number,
    c.component_name,
    c.criticality_tier,
    s.company_name AS vendor_name,
    sc.contract_code,
    sc.warranty_coverage_pct,
    ir.inspection_date,
    ir.defect_category,
    ir.defect_count,
    ir.coa_verified,
    bq.status AS quarantine_status,
    bq.storage_bay,
    ROUND(bq.quarantined_quantity * c.standard_cost * (sc.warranty_coverage_pct / 100.0), 2) AS enforceable_warranty_claim
FROM inspection_records ir
JOIN shipment_receipts sr ON ir.receipt_id = sr.receipt_id
JOIN po_line_items pli ON sr.po_line_id = pli.po_line_id
JOIN components c ON pli.component_id = c.component_id
JOIN purchase_orders po ON pli.po_id = po.po_id
JOIN suppliers s ON po.supplier_id = s.supplier_id
JOIN supplier_contracts sc ON s.supplier_id = sc.supplier_id
JOIN batch_quarantines bq ON ir.inspection_id = bq.inspection_id
WHERE ir.inspection_status = 'FAILED'
ORDER BY ir.inspection_date DESC;`
  },
  {
    id: 3,
    title: "Penalty Invoice & Debit Memo Generation",
    category: "Financial Recovery",
    icon: "💰",
    businessIntent: "Calculates liability from factory line stoppage plus base contract penalty fees for suppliers whose components halted production.",
    sql: `SELECT 
    di.incident_id,
    p.plant_name,
    di.assembly_line,
    s.company_name AS liable_supplier,
    sr.batch_lot_number,
    c.part_number,
    di.downtime_minutes,
    sc.hourly_downtime_penalty,
    ROUND((di.downtime_minutes / 60.0) * sc.hourly_downtime_penalty, 2) AS calculated_line_stoppage_fee,
    pi.base_penalty,
    pi.total_penalty_amount,
    pi.invoice_number AS generated_debit_memo,
    pi.payment_status
FROM downtime_incidents di
JOIN plants p ON di.plant_id = p.plant_id
JOIN shipment_receipts sr ON di.receipt_id = sr.receipt_id
JOIN po_line_items pli ON sr.po_line_id = pli.po_line_id
JOIN components c ON pli.component_id = c.component_id
JOIN purchase_orders po ON pli.po_id = po.po_id
JOIN suppliers s ON po.supplier_id = s.supplier_id
JOIN supplier_contracts sc ON s.supplier_id = sc.supplier_id
LEFT JOIN penalty_invoices pi ON di.incident_id = pi.incident_id
ORDER BY di.downtime_minutes DESC;`
  },
  {
    id: 4,
    title: "Quarantine & RMA Audit Trail",
    category: "Compliance & Audit",
    icon: "🔍",
    businessIntent: "Full traceability from dock arrival to RMA resolution — IATF 16949 / ISO 9001 audit standard.",
    sql: `SELECT 
    bq.quarantine_id,
    sr.batch_lot_number,
    p.plant_code,
    c.part_number,
    bq.quarantined_quantity,
    bq.storage_bay,
    bq.status AS containment_status,
    bq.authorized_by,
    rc.rma_number,
    rc.claim_type,
    rc.claimed_amount,
    rc.settlement_status,
    cal.action_type AS last_audit_action,
    cal.changed_at AS last_audit_timestamp
FROM batch_quarantines bq
JOIN inspection_records ir ON bq.inspection_id = ir.inspection_id
JOIN shipment_receipts sr ON ir.receipt_id = sr.receipt_id
JOIN plants p ON sr.plant_id = p.plant_id
JOIN po_line_items pli ON sr.po_line_id = pli.po_line_id
JOIN components c ON pli.component_id = c.component_id
LEFT JOIN rma_claims rc ON bq.quarantine_id = rc.quarantine_id
LEFT JOIN compliance_audit_log cal ON bq.quarantine_id = cal.record_id AND cal.table_name = 'batch_quarantines'
ORDER BY bq.quarantine_id ASC;`
  },
  {
    id: 5,
    title: "Downtime Breakdown by Plant & Subsystem",
    category: "Operations",
    icon: "🏭",
    businessIntent: "Quantifies the 14% factory downtime increase across engine and transmission subsystems at each plant.",
    sql: `SELECT 
    p.plant_name,
    c.category AS subsystem_category,
    COUNT(di.incident_id) AS stoppage_incidents,
    SUM(di.downtime_minutes) AS total_downtime_minutes,
    ROUND(SUM(di.downtime_minutes) / 60.0, 2) AS total_downtime_hours,
    SUM(di.line_stoppage_cost) AS total_financial_loss
FROM downtime_incidents di
JOIN plants p ON di.plant_id = p.plant_id
JOIN shipment_receipts sr ON di.receipt_id = sr.receipt_id
JOIN po_line_items pli ON sr.po_line_id = pli.po_line_id
JOIN components c ON pli.component_id = c.component_id
GROUP BY p.plant_name, c.category
ORDER BY total_financial_loss DESC;`
  },
  {
    id: 6,
    title: "Criticality Tier Ranking (Window Functions)",
    category: "Quality Metrics",
    icon: "⚠️",
    businessIntent: "Uses DENSE_RANK() to identify whether high-defect rates affect safety-critical Tier A parts.",
    sql: `WITH ComponentQualityMetrics AS (
    SELECT 
        c.component_id,
        c.part_number,
        c.component_name,
        c.criticality_tier,
        SUM(ir.sample_size) AS units_inspected,
        SUM(ir.defect_count) AS units_defective,
        ROUND((CAST(SUM(ir.defect_count) AS REAL) / SUM(ir.sample_size)) * 1000000.0, 2) AS component_ppm
    FROM components c
    JOIN po_line_items pli ON c.component_id = pli.component_id
    JOIN shipment_receipts sr ON pli.po_line_id = sr.po_line_id
    JOIN inspection_records ir ON sr.receipt_id = ir.receipt_id
    GROUP BY c.component_id, c.part_number, c.component_name, c.criticality_tier
)
SELECT 
    part_number,
    component_name,
    criticality_tier,
    units_inspected,
    units_defective,
    component_ppm,
    DENSE_RANK() OVER (PARTITION BY criticality_tier ORDER BY component_ppm DESC) AS defect_rank_within_tier
FROM ComponentQualityMetrics
ORDER BY criticality_tier ASC, component_ppm DESC;`
  },
  {
    id: 7,
    title: "PPM Breach Filter (HAVING Clause)",
    category: "Quality Metrics",
    icon: "🚨",
    businessIntent: "Filters out compliant suppliers and isolates chronic PPM violators exceeding their contractual limits.",
    sql: `SELECT 
    s.supplier_id,
    s.company_name,
    sc.max_allowable_ppm,
    ROUND((CAST(SUM(ir.defect_count) AS REAL) / SUM(ir.sample_size)) * 1000000.0, 2) AS actual_ppm,
    ROUND(((CAST(SUM(ir.defect_count) AS REAL) / SUM(ir.sample_size)) * 1000000.0) - sc.max_allowable_ppm, 2) AS ppm_excess
FROM suppliers s
JOIN supplier_contracts sc ON s.supplier_id = sc.supplier_id
JOIN purchase_orders po ON s.supplier_id = po.supplier_id
JOIN po_line_items pli ON po.po_id = pli.po_id
JOIN shipment_receipts sr ON pli.po_line_id = sr.po_line_id
JOIN inspection_records ir ON sr.receipt_id = ir.receipt_id
GROUP BY s.supplier_id, s.company_name, sc.max_allowable_ppm
HAVING ((CAST(SUM(ir.defect_count) AS REAL) / SUM(ir.sample_size)) * 1000000.0) > sc.max_allowable_ppm
ORDER BY ppm_excess DESC;`
  },
  {
    id: 8,
    title: "Financial Recovery & Settlement Aging",
    category: "Financial Recovery",
    icon: "📋",
    businessIntent: "Tracks pending vs settled warranty refunds and penalty collections across all suppliers.",
    sql: `SELECT 
    s.company_name AS supplier_name,
    rc.rma_number,
    rc.claim_date,
    rc.claim_type,
    rc.claimed_amount,
    rc.settled_amount,
    (rc.claimed_amount - rc.settled_amount) AS outstanding_unrecovered_amount,
    rc.settlement_status,
    pi.invoice_number AS penalty_debit_memo,
    pi.total_penalty_amount,
    pi.payment_status AS penalty_status
FROM rma_claims rc
JOIN suppliers s ON rc.supplier_id = s.supplier_id
LEFT JOIN penalty_invoices pi ON rc.rma_id = pi.rma_id
ORDER BY rc.claim_date ASC;`
  },
  {
    id: 9,
    title: "Plant First-Pass Yield (FPY) Comparison",
    category: "Operations",
    icon: "✅",
    businessIntent: "Compares quality screening performance and first-pass yield percentage across the 4 manufacturing plants.",
    sql: `SELECT 
    p.plant_code,
    p.plant_name,
    COUNT(ir.inspection_id) AS total_inspections_performed,
    SUM(CASE WHEN ir.inspection_status = 'PASSED' THEN 1 ELSE 0 END) AS passed_lots,
    SUM(CASE WHEN ir.inspection_status = 'FAILED' THEN 1 ELSE 0 END) AS rejected_lots,
    SUM(CASE WHEN ir.inspection_status = 'CONDITIONAL_PASS' THEN 1 ELSE 0 END) AS conditional_lots,
    ROUND((CAST(SUM(CASE WHEN ir.inspection_status = 'PASSED' THEN 1 ELSE 0 END) AS REAL) / COUNT(ir.inspection_id)) * 100.0, 2) AS first_pass_yield_pct
FROM plants p
JOIN shipment_receipts sr ON p.plant_id = sr.plant_id
JOIN inspection_records ir ON sr.receipt_id = ir.receipt_id
GROUP BY p.plant_code, p.plant_name
ORDER BY first_pass_yield_pct DESC;`
  },
  {
    id: 10,
    title: "Lot Recall & Containment Traceability",
    category: "Compliance & Audit",
    icon: "🔒",
    businessIntent: "Given a suspect lot (LOT-2026-BORG%), instantly isolates where it docked, who tested it, and its containment state.",
    sql: `SELECT 
    sr.batch_lot_number,
    p.plant_name AS receiving_plant,
    s.company_name AS vendor,
    c.part_number,
    c.component_name,
    po.po_number,
    sr.delivery_date,
    ir.inspection_status,
    ir.defect_category,
    q.status AS quarantine_containment,
    q.storage_bay
FROM shipment_receipts sr
JOIN plants p ON sr.plant_id = p.plant_id
JOIN po_line_items pli ON sr.po_line_id = pli.po_line_id
JOIN components c ON pli.component_id = c.component_id
JOIN purchase_orders po ON pli.po_id = po.po_id
JOIN suppliers s ON po.supplier_id = s.supplier_id
LEFT JOIN inspection_records ir ON sr.receipt_id = ir.receipt_id
LEFT JOIN batch_quarantines q ON ir.inspection_id = q.inspection_id
WHERE sr.batch_lot_number LIKE 'LOT-2026-BORG%'
ORDER BY sr.delivery_date DESC;`
  },
  {
    id: 11,
    title: "Supplier Governance Recommendation Engine",
    category: "Governance",
    icon: "🛡️",
    businessIntent: "Multi-condition evaluation (PPM breach + downtime) to recommend automated governance actions: ACTIVE, PROBATION, or SUSPEND.",
    sql: `WITH SupplierRiskMetrics AS (
    SELECT 
        s.supplier_id,
        s.company_name,
        s.compliance_rating,
        sc.max_allowable_ppm,
        ROUND((CAST(SUM(ir.defect_count) AS REAL) / SUM(ir.sample_size)) * 1000000.0, 2) AS actual_ppm,
        COALESCE(COUNT(di.incident_id), 0) AS downtime_incident_count,
        COALESCE(SUM(di.line_stoppage_cost), 0.00) AS total_downtime_cost
    FROM suppliers s
    JOIN supplier_contracts sc ON s.supplier_id = sc.supplier_id
    JOIN purchase_orders po ON s.supplier_id = po.supplier_id
    JOIN po_line_items pli ON po.po_id = pli.po_id
    JOIN shipment_receipts sr ON pli.po_line_id = sr.po_line_id
    JOIN inspection_records ir ON sr.receipt_id = ir.receipt_id
    LEFT JOIN downtime_incidents di ON sr.receipt_id = di.receipt_id
    GROUP BY s.supplier_id, s.company_name, s.compliance_rating, sc.max_allowable_ppm
)
SELECT 
    company_name,
    compliance_rating,
    max_allowable_ppm,
    actual_ppm,
    downtime_incident_count,
    total_downtime_cost,
    CASE 
        WHEN actual_ppm > (max_allowable_ppm * 2) AND downtime_incident_count > 0 THEN 'RECOMMEND_SUSPENSION'
        WHEN actual_ppm > max_allowable_ppm THEN 'RECOMMEND_PROBATION'
        ELSE 'RETAIN_ACTIVE'
    END AS automated_governance_action
FROM SupplierRiskMetrics
ORDER BY actual_ppm DESC;`
  }
];
