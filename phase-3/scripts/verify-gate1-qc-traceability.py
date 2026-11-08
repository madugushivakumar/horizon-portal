"""
Gate 1 Final Quality-Control Pass - Cryptographic & Database Verification Script
Executes strictly read-only, non-mutating integrity checks across data packs and sqlite database.
"""
import sqlite3
import hashlib
import datetime
import sys

# Ensure UTF-8 output on Windows consoles
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")

def run_traceability_checks():
    timestamp = datetime.datetime.now(datetime.timezone(datetime.timedelta(hours=5, minutes=30))).isoformat()
    print(f"=== GATE 1 QC VERIFICATION TRACEABILITY RUN ===")
    print(f"Execution Timestamp (IST): {timestamp}")
    print(f"Python Runtime: {sys.version}")

    implemented_count = 0
    executed_count = 0
    passed_count = 0
    failed_count = 0
    skipped_count = 0

    # 1. Source JSON file hashes (4 checks)
    target_files = [
        ("V-HASH-01", "03_Data_Pack/payroll_runs.json", "D501C1C70B0515D77F39DC2AF9597B01B729E76EB3FEFF8D730C697131E74E21"),
        ("V-HASH-02", "03_Data_Pack/payslips.json", "9E6F7649E92F821FD680AD9963B730D087C7FAFA6A59EBFF8790A88C54A04196"),
        ("V-HASH-03", "03_Data_Pack/employees.json", "AB0D227444095287AEC9DBB21F0F31B98550336CD0A8BCFB74619B9947D26A90"),
        ("V-HASH-04", "prisma/dev.db", "B88E178B1B341FB44D7B676DC9F320FFF4079120AE63770D33ABD32E3F9EB4EA")
    ]
    implemented_count += len(target_files)

    for v_id, fpath, expected_hash in target_files:
        executed_count += 1
        h = hashlib.sha256()
        with open(fpath, "rb") as f:
            while chunk := f.read(65536):
                h.update(chunk)
        actual_hash = h.hexdigest().upper()
        match = actual_hash == expected_hash
        if match:
            passed_count += 1
            status = "PASS"
        else:
            failed_count += 1
            status = "FAIL"
        print(f"[{v_id}] {fpath} | Expected: {expected_hash} | Actual: {actual_hash} | Status: {status}")

    # 2. Database Queries (8 checks)
    conn = sqlite3.connect("prisma/dev.db")
    c = conn.cursor()

    db_checks = [
        ("V-CNT-01", "SELECT COUNT(*) FROM payroll_runs", 18, "payroll_runs row count"),
        ("V-CNT-02", "SELECT COUNT(*) FROM payslips", 2469, "payslips row count"),
        ("V-CNT-03", "SELECT COUNT(*) FROM employees", 441, "employees row count"),
        ("V-CNT-04", "SELECT COUNT(*) FROM payroll_adjustments", 0, "payroll_adjustments count"),
        ("V-CNT-05", "SELECT COUNT(*) FROM audit_logs", 87, "audit_logs count"),
        ("V-SQL-01", "PRAGMA quick_check", "ok", "SQLite quick_check integrity"),
        ("V-SQL-02", "PRAGMA foreign_key_check", 0, "SQLite foreign_key violations"),
        ("V-SEC-01", "SELECT COUNT(*) FROM payroll_runs WHERE preparer_id IS NULL", 18, "Historical null preparer_id runs")
    ]
    implemented_count += len(db_checks)

    for v_id, query, expected, desc in db_checks:
        executed_count += 1
        c.execute(query)
        res = c.fetchall()
        if v_id in ["V-CNT-01", "V-CNT-02", "V-CNT-03", "V-CNT-04", "V-CNT-05", "V-SEC-01"]:
            actual = res[0][0]
            if actual == expected:
                passed_count += 1
                status = "PASS"
            else:
                failed_count += 1
                status = "FAIL"
            print(f"[{v_id}] {desc} | Query: '{query}' | Expected: {expected} | Actual: {actual} | Status: {status}")
        elif v_id == "V-SQL-01":
            actual = res[0][0]
            if actual == expected:
                passed_count += 1
                status = "PASS"
            else:
                failed_count += 1
                status = "FAIL"
            print(f"[{v_id}] {desc} | Expected: '{expected}' | Actual: '{actual}' | Status: {status}")
        elif v_id == "V-SQL-02":
            actual = len(res)
            if actual == expected:
                passed_count += 1
                status = "PASS"
            else:
                failed_count += 1
                status = "FAIL"
            print(f"[{v_id}] {desc} | Expected: {expected} violations | Actual: {actual} violations | Status: {status}")

    conn.close()

    print(f"\n--- VERIFICATION EXECUTION BREAKDOWN ---")
    print(f"Total Implemented Checks: {implemented_count}")
    print(f"Total Executed Checks:    {executed_count}")
    print(f"Checks Passed:            {passed_count}")
    print(f"Checks Failed:            {failed_count}")
    print(f"Checks Skipped:           {skipped_count}")

    if executed_count == 12 and passed_count == 12 and failed_count == 0:
        print("ALL 12 VERIFICATION CHECKS FINISHED — ALL PASSED.")
        sys.exit(0)
    else:
        print("VERIFICATION CHECKS FINISHED — INCOMPLETE OR FAILED.")
        sys.exit(1)

if __name__ == "__main__":
    run_traceability_checks()
