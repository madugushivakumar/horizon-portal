import os
import hashlib
import sqlite3

def hash_file(path):
    if not os.path.exists(path):
        return None, 0
    h = hashlib.sha256()
    size = os.path.getsize(path)
    with open(path, 'rb') as f:
        while chunk := f.read(65536):
            h.update(chunk)
    return h.hexdigest(), size

files = [
    '03_Data_Pack/payroll_runs.json',
    '03_Data_Pack/payslips.json',
    '03_Data_Pack/employees.json',
    'prisma/dev.db',
    'prisma/backups/dev-backup-pre-deploy-20261106T160910Z.db'
]

print("=== FILE HASHES & SIZES ===")
for fp in files:
    h, sz = hash_file(fp)
    print(f'{fp}: {sz:,} bytes | SHA-256: {h}')

print("\n=== DATABASE INTEGRITY & COUNTS (prisma/dev.db) ===")
conn = sqlite3.connect('prisma/dev.db')
cursor = conn.cursor()

cursor.execute('PRAGMA integrity_check;')
print(f'PRAGMA integrity_check: {cursor.fetchall()}')

cursor.execute('PRAGMA foreign_key_check;')
fk = cursor.fetchall()
print(f'PRAGMA foreign_key_check violations: {len(fk)}')

cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name;")
tables = [r[0] for r in cursor.fetchall()]
print(f'Total tables: {len(tables)}')
for t in tables:
    cursor.execute(f'SELECT COUNT(*) FROM "{t}";')
    cnt = cursor.fetchone()[0]
    print(f'  {t}: {cnt} rows')

conn.close()

print("\n=== DATABASE ROW COMPARISON WITH PRE-DEPLOY BACKUP ===")
conn_live = sqlite3.connect('prisma/dev.db')
conn_bak = sqlite3.connect('prisma/backups/dev-backup-pre-deploy-20261106T160910Z.db')
c_live = conn_live.cursor()
c_bak = conn_bak.cursor()

c_bak.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name;")
bak_tables = set(r[0] for r in c_bak.fetchall())

for t in tables:
    if t in ['_prisma_migrations', 'sqlite_stat1']:
        continue
    c_live.execute(f'SELECT COUNT(*) FROM "{t}";')
    cnt_live = c_live.fetchone()[0]
    if t not in bak_tables:
        print(f'  {t}: live={cnt_live}, backup=TABLE_NOT_IN_BACKUP (Added in Step 1 migration)')
        continue
    c_bak.execute(f'SELECT COUNT(*) FROM "{t}";')
    cnt_bak = c_bak.fetchone()[0]
    match_str = "MATCH" if cnt_live == cnt_bak else "DIFF"
    print(f'  {t}: live={cnt_live}, backup={cnt_bak} -> {match_str}')

conn_live.close()
conn_bak.close()
