import sqlite3
import hashlib
import os
import json

db_path = os.path.join("prisma", "dev.db")
with open(db_path, "rb") as f:
    content = f.read()

sha256_hash = hashlib.sha256(content).hexdigest()
size_bytes = len(content)

con = sqlite3.connect(db_path)
cur = con.cursor()

runs_count = cur.execute("SELECT COUNT(1) FROM payroll_runs").fetchone()[0]
payslips_count = cur.execute("SELECT COUNT(1) FROM payslips").fetchone()[0]
employees_count = cur.execute("SELECT COUNT(1) FROM employees").fetchone()[0]
adjustments_count = cur.execute("SELECT COUNT(1) FROM payroll_adjustments").fetchone()[0]

pr08 = cur.execute("SELECT id, status, approval_status, employees_paid, total_gross, total_net, pay_date FROM payroll_runs WHERE id = 'PR-2026-08'").fetchone()
pr09 = cur.execute("SELECT id, status, approval_status, employees_paid, total_gross, total_net, pay_date FROM payroll_runs WHERE id = 'PR-2026-09'").fetchone()

integrity = cur.execute("PRAGMA integrity_check").fetchone()[0]
fk_check = cur.execute("PRAGMA foreign_key_check").fetchall()

print(json.dumps({
    "dbPath": db_path,
    "sizeBytes": size_bytes,
    "sha256": sha256_hash,
    "integrity": integrity,
    "foreignKeyViolations": len(fk_check),
    "counts": {
        "payroll_runs": runs_count,
        "payslips": payslips_count,
        "employees": employees_count,
        "payroll_adjustments": adjustments_count
    },
    "PR-2026-08": {
        "id": pr08[0],
        "status": pr08[1],
        "approval_status": pr08[2],
        "employees_paid": pr08[3],
        "total_gross": pr08[4],
        "total_net": pr08[5],
        "pay_date": pr08[6]
    },
    "PR-2026-09": {
        "id": pr09[0],
        "status": pr09[1],
        "approval_status": pr09[2],
        "employees_paid": pr09[3],
        "total_gross": pr09[4],
        "total_net": pr09[5],
        "pay_date": pr09[6]
    }
}, indent=2))

