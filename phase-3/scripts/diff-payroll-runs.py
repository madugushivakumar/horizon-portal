import sqlite3

con1 = sqlite3.connect('prisma/dev.db')
con2 = sqlite3.connect('prisma/backups/dev-backup-pre-deploy-20261106T160910Z.db')

cur1 = con1.cursor()
cur2 = con2.cursor()

# Get column names for payroll_runs
cur1.execute("PRAGMA table_info(payroll_runs)")
cols1 = [c[1] for c in cur1.fetchall()]
cur2.execute("PRAGMA table_info(payroll_runs)")
cols2 = [c[1] for c in cur2.fetchall()]

print("payroll_runs cols in dev.db:", cols1)
print("payroll_runs cols in backup:", cols2)

cur1.execute("SELECT * FROM payroll_runs ORDER BY id")
rows1 = cur1.fetchall()
cur2.execute("SELECT * FROM payroll_runs ORDER BY id")
rows2 = cur2.fetchall()

for r1, r2 in zip(rows1, rows2):
    diffs = []
    for idx, (val1, val2) in enumerate(zip(r1, r2)):
        if val1 != val2:
            diffs.append(f"{cols1[idx]}: '{val1}' vs '{val2}'")
    if diffs:
        print(f"Run {r1[0]}: {', '.join(diffs)}")

print("\n--- Tasks Diff ---")
cur1.execute("PRAGMA table_info(tasks)")
tcols1 = [c[1] for c in cur1.fetchall()]
cur1.execute("SELECT * FROM tasks WHERE id = 'TASK-24250'")
t1 = cur1.fetchone()
cur2.execute("SELECT * FROM tasks WHERE id = 'TASK-24250'")
t2 = cur2.fetchone()
for idx, (v1, v2) in enumerate(zip(t1, t2)):
    if v1 != v2:
        print(f"TASK-24250 {tcols1[idx]}: '{v1}' vs '{v2}'")

con1.close()
con2.close()

