import sqlite3

conn = sqlite3.connect('prisma/dev.db')
c = conn.cursor()

c.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='payroll_adjustments'")
adjustments_table = c.fetchall()
print("payroll_adjustments table exists:", len(adjustments_table) > 0)

c.execute("PRAGMA table_info(payroll_runs)")
cols = [row[1] for row in c.fetchall()]
print("payroll_runs original columns present:", [col for col in cols if "original" in col])

c.execute("SELECT COUNT(*) FROM _prisma_migrations")
print("applied migrations count:", c.fetchone()[0])

c.execute("SELECT migration_name FROM _prisma_migrations ORDER BY finished_at DESC LIMIT 3")
print("recent applied migrations:", [row[0] for row in c.fetchall()])
conn.close()

