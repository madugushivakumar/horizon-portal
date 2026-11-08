import sqlite3
import json

conn = sqlite3.connect('prisma/dev.db')
conn.row_factory = sqlite3.Row
c = conn.cursor()

results = {}

# 1. Table record counts
for table in ['payroll_runs', 'payslips', 'employees', 'payroll_adjustments']:
    c.execute(f"SELECT COUNT(*) FROM {table}")
    results[f"{table}_count"] = c.fetchone()[0]

# 2. PR-2026-08 and PR-2026-09 inspection
c.execute("SELECT id, status, approval_status, pay_date, payment_date, employees_paid, total_gross, total_net, original_total_gross, original_employees_paid FROM payroll_runs WHERE id IN ('PR-2026-08', 'PR-2026-09') ORDER BY id")
runs = [dict(row) for row in c.fetchall()]
results['runs'] = runs

# 3. All payroll runs status summary
c.execute("SELECT id, status, approval_status, employees_paid, total_gross, total_net FROM payroll_runs ORDER BY id")
all_runs = [dict(row) for row in c.fetchall()]
results['all_runs_count'] = len(all_runs)

# 4. PRAGMA integrity_check
c.execute("PRAGMA integrity_check")
results['integrity_check'] = c.fetchall()

# 5. PRAGMA foreign_key_check
c.execute("PRAGMA foreign_key_check")
results['foreign_key_check'] = c.fetchall()

# 6. Check columns of payroll_runs
c.execute("PRAGMA table_info(payroll_runs)")
pr_cols = [row['name'] for row in c.fetchall()]
results['payroll_runs_columns'] = pr_cols

# 7. Check columns of payroll_adjustments
c.execute("PRAGMA table_info(payroll_adjustments)")
adj_cols = [row['name'] for row in c.fetchall()]
results['payroll_adjustments_columns'] = adj_cols

# 8. Check foreign keys of payroll_adjustments
c.execute("PRAGMA foreign_key_list(payroll_adjustments)")
adj_fks = [dict(row) for row in c.fetchall()]
results['payroll_adjustments_foreign_keys'] = adj_fks

# 9. Check migrations table
c.execute("SELECT id, migration_name, finished_at, rolled_back_at FROM _prisma_migrations ORDER BY finished_at DESC")
results['applied_migrations'] = [dict(row) for row in c.fetchall()]

conn.close()

print(json.dumps(results, indent=2, default=str))

