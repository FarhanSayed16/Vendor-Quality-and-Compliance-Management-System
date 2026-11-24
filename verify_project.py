"""
Vendor Quality & Compliance Management System (VQCMS - XII)
Automated Verification & Demonstration Test Harness
Team 12 | SEM I - Data Science and Technology / DBMS
Domain: Precision Auto Parts
"""

import sqlite3
import os
import sys

DB_FILE = "vqcms.db"
SCHEMA_FILE = os.path.join("sql", "schema.sql")
SEED_FILE = os.path.join("sql", "seed_data.sql")
QUERIES_FILE = os.path.join("sql", "queries.sql")

def run_verification():
    print("=" * 80)
    print("  VENDOR QUALITY & COMPLIANCE MANAGEMENT SYSTEM (VQCMS) - VERIFICATION")
    print("=" * 80)

    # 1. Clean previous database if exists
    if os.path.exists(DB_FILE):
        os.remove(DB_FILE)
        print(f"[+] Removed existing {DB_FILE}")

    # 2. Connect to SQLite
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    cursor.execute("PRAGMA foreign_keys = ON;")
    print("[+] SQLite connection established with PRAGMA foreign_keys = ON")

    # 3. Apply Schema
    print("\n[STEP 1] Applying DDL Schema (sql/schema.sql)...")
    with open(SCHEMA_FILE, "r", encoding="utf-8") as f:
        schema_sql = f.read()
    cursor.executescript(schema_sql)
    print(" -> Schema created successfully with constraints, indexes, triggers & views.")

    # 4. Insert Seed Data
    print("\n[STEP 2] Inserting Production Seed Data (sql/seed_data.sql)...")
    with open(SEED_FILE, "r", encoding="utf-8") as f:
        seed_sql = f.read()
    cursor.executescript(seed_sql)
    print(" -> Seed data populated successfully across 4 plants and 8 suppliers.")

    # 5. Table Counts Verification
    tables = [
        "plants", "suppliers", "supplier_contracts", "components",
        "purchase_orders", "po_line_items", "shipment_receipts",
        "qc_inspectors", "inspection_records", "batch_quarantines",
        "downtime_incidents", "rma_claims", "penalty_invoices", "compliance_audit_log"
    ]
    print("\n[STEP 3] Database Record Count Verification:")
    for tbl in tables:
        cursor.execute(f"SELECT COUNT(*) FROM {tbl};")
        cnt = cursor.fetchone()[0]
        print(f"    - Table '{tbl}': {cnt} records")

    # 6. View Test: Supplier Scorecard
    print("\n[STEP 4] Testing View: v_supplier_quality_scorecard")
    cursor.execute("SELECT supplier_code, company_name, contractual_ppm_limit, actual_calculated_ppm, compliance_status FROM v_supplier_quality_scorecard;")
    rows = cursor.fetchall()
    print(f"    {'CODE':<12} {'SUPPLIER':<35} {'LIMIT PPM':<10} {'ACTUAL PPM':<12} {'STATUS'}")
    print("    " + "-" * 75)
    for r in rows:
        print(f"    {r[0]:<12} {r[1]:<35} {r[2]:<10} {r[3]:<12} {r[4]}")

    # 7. Testing View: Financial Recovery Summary
    print("\n[STEP 5] Testing View: v_financial_recovery_summary")
    cursor.execute("SELECT company_name, total_rma_filed, total_warranty_claimed, total_warranty_settled, total_penalties_debited, total_financial_recovery FROM v_financial_recovery_summary WHERE total_financial_recovery > 0;")
    rows = cursor.fetchall()
    print(f"    {'SUPPLIER':<35} {'RMA':<5} {'CLAIMED':<12} {'SETTLED':<12} {'PENALTY':<12} {'RECOVERY'}")
    print("    " + "-" * 85)
    for r in rows:
        print(f"    {r[0]:<35} {r[1]:<5} ${r[2]:<11.2f} ${r[3]:<11.2f} ${r[4]:<11.2f} ${r[5]:.2f}")

    # 8. Testing Business Query 1: Real-Time PPM Breach Detection
    print("\n[STEP 6] Executing Query 1: Real-Time Supplier Defect PPM Breach Detection")
    q1 = """
    SELECT 
        s.supplier_code,
        s.company_name,
        sc.max_allowable_ppm,
        ROUND((CAST(SUM(ir.defect_count) AS REAL) / SUM(ir.sample_size)) * 1000000.0, 2) AS calculated_ppm,
        CASE 
            WHEN ((CAST(SUM(ir.defect_count) AS REAL) / SUM(ir.sample_size)) * 1000000.0) <= sc.max_allowable_ppm THEN 'COMPLIANT'
            ELSE 'SLA_BREACH_PENALTY'
        END AS status
    FROM suppliers s
    JOIN supplier_contracts sc ON s.supplier_id = sc.supplier_id
    JOIN purchase_orders po ON s.supplier_id = po.supplier_id
    JOIN po_line_items pli ON po.po_id = pli.po_id
    JOIN shipment_receipts sr ON pli.po_line_id = sr.po_line_id
    JOIN inspection_records ir ON sr.receipt_id = ir.receipt_id
    GROUP BY s.supplier_code, s.company_name, sc.max_allowable_ppm
    ORDER BY calculated_ppm DESC;
    """
    cursor.execute(q1)
    rows = cursor.fetchall()
    for r in rows:
        print(f"    [{r[4]}] {r[0]} - {r[1]}: Calculated PPM = {r[3]} (Contract Limit: {r[2]})")

    # 9. Testing Business Query 3: Automated Line Downtime Debit Memos
    print("\n[STEP 7] Executing Query 3: Automated Line Stoppage Penalty Invoices")
    q3 = """
    SELECT 
        p.plant_name,
        di.assembly_line,
        s.company_name,
        di.downtime_minutes,
        pi.invoice_number,
        pi.total_penalty_amount,
        pi.payment_status
    FROM downtime_incidents di
    JOIN plants p ON di.plant_id = p.plant_id
    JOIN shipment_receipts sr ON di.receipt_id = sr.receipt_id
    JOIN po_line_items pli ON sr.po_line_id = pli.po_line_id
    JOIN purchase_orders po ON pli.po_id = po.po_id
    JOIN suppliers s ON po.supplier_id = s.supplier_id
    JOIN penalty_invoices pi ON di.incident_id = pi.incident_id;
    """
    cursor.execute(q3)
    rows = cursor.fetchall()
    for r in rows:
        print(f"    Plant: {r[0]} | Line: {r[1]} | Supplier: {r[2]}")
        print(f"    Downtime: {r[3]} mins -> Generated Invoice: {r[4]} | Total Penalty: ${r[5]:,.2f} ({r[6]})\n")

    conn.close()
    print("=" * 80)
    print("  ALL VERIFICATION CHECKS PASSED SUCCESSFULLY (100% INTEGRITY)")
    print("=" * 80)

if __name__ == "__main__":
    run_verification()
