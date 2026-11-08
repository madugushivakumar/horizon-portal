import sqlite3
import hashlib

def get_hash(path):
    with open(path, 'rb') as f:
        return hashlib.sha256(f.read()).hexdigest()

db1_path = 'prisma/dev.db'
db2_path = 'prisma/backups/dev-backup-pre-deploy-20261106T160910Z.db'

print(f"Current dev.db hash: {get_hash(db1_path)}")
print(f"Backup db hash:     {get_hash(db2_path)}")

con1 = sqlite3.connect(db1_path)
con2 = sqlite3.connect(db2_path)

cur1 = con1.cursor()
cur2 = con2.cursor()

cur1.execute("SELECT name FROM sqlite_master WHERE type='table'")
tables1 = set(r[0] for r in cur1.fetchall() if not r[0].startswith('sqlite_'))

cur2.execute("SELECT name FROM sqlite_master WHERE type='table'")
tables2 = set(r[0] for r in cur2.fetchall() if not r[0].startswith('sqlite_'))

print('\nTables in current dev.db:', len(tables1))
print('Tables in pre-deploy backup:', len(tables2))
if tables1 ^ tables2:
    print('Table differences:', tables1 ^ tables2)

print("\n--- TABLE BY TABLE COMPARISON ---")
for t in sorted(tables1 | tables2):
    if t not in tables1:
        print(f"Table {t} missing from current dev.db")
        continue
    if t not in tables2:
        print(f"Table {t} only in current dev.db")
        continue
        
    cur1.execute(f"SELECT COUNT(*) FROM {t}")
    c1 = cur1.fetchone()[0]
    cur2.execute(f"SELECT COUNT(*) FROM {t}")
    c2 = cur2.fetchone()[0]
    
    cur1.execute(f"SELECT * FROM {t}")
    rows1 = cur1.fetchall()
    cur2.execute(f"SELECT * FROM {t}")
    rows2 = cur2.fetchall()
    
    identical = (rows1 == rows2)
    print(f"Table {t:22}: count dev.db={c1:5}, backup={c2:5} | identical={identical}")
    
    if not identical:
        # Compare row by row
        s1 = set(map(str, rows1))
        s2 = set(map(str, rows2))
        diff_plus = s1 - s2
        diff_minus = s2 - s1
        print(f"  Differences: +{len(diff_plus)} in dev.db, -{len(diff_minus)} in backup")
        for r in list(diff_plus)[:3]:
            print(f"    [+] {r[:120]}")
        for r in list(diff_minus)[:3]:
            print(f"    [-] {r[:120]}")

cur1.execute("PRAGMA integrity_check")
print("\ndev.db PRAGMA integrity_check:", cur1.fetchone()[0])
cur1.execute("PRAGMA foreign_key_check")
print("dev.db PRAGMA foreign_key_check violations:", len(cur1.fetchall()))

con1.close()
con2.close()

