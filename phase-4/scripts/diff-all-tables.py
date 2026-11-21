import sqlite3
import json

db_live = 'prisma/dev.db'
db_bak = 'prisma/backups/dev-backup-pre-deploy-20261106T160910Z.db'

conn_live = sqlite3.connect(db_live)
conn_bak = sqlite3.connect(db_bak)

c_live = conn_live.cursor()
c_bak = conn_bak.cursor()

c_live.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name;")
tables_live = [r[0] for r in c_live.fetchall()]

c_bak.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name;")
tables_bak = set(r[0] for r in c_bak.fetchall())

print("=== TABLE COMPARISON ===")
diffs = {}
identical_tables = []
row_diff_tables = []

for t in tables_live:
    if t in ['_prisma_migrations', 'sqlite_stat1']:
        continue
    if t not in tables_bak:
        print(f"Table {t} is in live but not backup (new migration table)")
        continue

    # Get column names
    c_live.execute(f'PRAGMA table_info("{t}");')
    cols_live = [r[1] for r in c_live.fetchall()]
    c_bak.execute(f'PRAGMA table_info("{t}");')
    cols_bak = [r[1] for r in c_bak.fetchall()]

    common_cols = [c for c in cols_live if c in cols_bak]
    col_str = ", ".join(f'"{c}"' for c in common_cols)

    c_live.execute(f'SELECT {col_str} FROM "{t}" ORDER BY 1;')
    rows_live = c_live.fetchall()
    c_bak.execute(f'SELECT {col_str} FROM "{t}" ORDER BY 1;')
    rows_bak = c_bak.fetchall()

    if len(rows_live) != len(rows_bak):
        print(f"Table {t}: COUNT MISMATCH (live: {len(rows_live)}, bak: {len(rows_bak)})")
        row_diff_tables.append((t, f"Count diff: {len(rows_live)} vs {len(rows_bak)}"))
        continue

    # Check row differences
    table_diffs = []
    for idx, (r_l, r_b) in enumerate(zip(rows_live, rows_bak)):
        if r_l != r_b:
            # find which column differed
            col_diffs = {}
            for c_idx, c_name in enumerate(common_cols):
                if r_l[c_idx] != r_b[c_idx]:
                    col_diffs[c_name] = {'live': r_l[c_idx], 'backup': r_b[c_idx]}
            table_diffs.append({'row_pk': r_l[0], 'col_diffs': col_diffs})

    if table_diffs:
        diffs[t] = table_diffs
        print(f"Table {t}: {len(table_diffs)} row difference(s) found!")
        for td in table_diffs[:5]:
            print(f"  PK={td['row_pk']}: {td['col_diffs']}")
    else:
        identical_tables.append(t)
        # print(f"Table {t}: 100% IDENTICAL ({len(rows_live)} rows)")

print(f"\nTotal identical common tables: {len(identical_tables)}")
print(f"Identical tables: {identical_tables}")
print(f"\nTables with differences: {list(diffs.keys())}")

conn_live.close()
conn_bak.close()

