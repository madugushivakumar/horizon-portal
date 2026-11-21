import sqlite3
import json

conn = sqlite3.connect('prisma/dev.db')
conn.row_factory = sqlite3.Row
c = conn.cursor()

# Get table info for payroll_runs to see column definitions & defaults
c.execute("PRAGMA table_info(payroll_runs)")
columns = [dict(row) for row in c.fetchall()]

# Select all payroll runs
c.execute("""
    SELECT 
        id, 
        status, 
        approval_status, 
        approved_by_id, 
        approved_at, 
        preparer_id,
        approval_notes,
        pay_date, 
        payment_date, 
        employees_paid, 
        total_gross, 
        total_net, 
        original_employees_paid,
        original_total_gross,
        original_total_deductions,
        original_total_net,
        reconciled_at,
        reconciled_by_id,
        created_at, 
        updated_at
    FROM payroll_runs 
    ORDER BY id
""")
runs = [dict(row) for row in c.fetchall()]

print("=== TABLE COLUMNS & DEFAULTS ===")
for col in columns:
    print(f"Col: {col['name']} | Type: {col['type']} | NotNull: {col['notnull']} | Default: {col['dflt_value']}")

print("\n=== ALL PAYROLL RUNS ===")
for r in runs:
    print(f"Run: {r['id']:12} | Status: {r['status']:25} | ApprovalStatus: {str(r['approval_status']):10} | ApprovedBy: {str(r['approved_by_id']):10} | PayDate: {str(r['pay_date']):15} | Gross: {r['total_gross']} | Net: {r['total_net']} | Headcount: {r['employees_paid']}")

conn.close()

