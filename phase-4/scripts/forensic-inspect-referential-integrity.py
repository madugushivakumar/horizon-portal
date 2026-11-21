import sqlite3
import json

conn = sqlite3.connect('prisma/dev.db')
conn.row_factory = sqlite3.Row
c = conn.cursor()

results = {}

# 1. PRAGMA foreign_key_list(payroll_adjustments)
c.execute("PRAGMA foreign_key_list(payroll_adjustments)")
results['foreign_key_list'] = [dict(row) for row in c.fetchall()]

# 2. PRAGMA table_info(payroll_adjustments)
c.execute("PRAGMA table_info(payroll_adjustments)")
results['table_info'] = [dict(row) for row in c.fetchall()]

# 3. PRAGMA index_list(payroll_adjustments)
c.execute("PRAGMA index_list(payroll_adjustments)")
results['index_list'] = [dict(row) for row in c.fetchall()]

# For each index, get its columns
for idx in results['index_list']:
    c.execute(f"PRAGMA index_info({idx['name']})")
    idx['columns'] = [dict(row) for row in c.fetchall()]

# 4. PRAGMA foreign_key_check
c.execute("PRAGMA foreign_key_check")
results['foreign_key_check'] = [dict(row) for row in c.fetchall()]

# 5. DDL for payroll_adjustments
c.execute("SELECT sql FROM sqlite_master WHERE type = 'table' AND name = 'payroll_adjustments'")
results['payroll_adjustments_sql'] = c.fetchone()['sql']

# 6. DDL for parent tables
c.execute("SELECT name, sql FROM sqlite_master WHERE type = 'table' AND name IN ('payroll_runs', 'audit_logs', 'users')")
results['parent_tables_sql'] = {row['name']: row['sql'] for row in c.fetchall()}

conn.close()

print(json.dumps(results, indent=2))

