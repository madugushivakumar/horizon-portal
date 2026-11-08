import json
import sys

sys.stdout.reconfigure(encoding='utf-8')

with open('03_Data_Pack/payroll_runs.json', 'r', encoding='utf-8') as f:
    runs = json.load(f)
with open('03_Data_Pack/payslips.json', 'r', encoding='utf-8') as f:
    slips = json.load(f)
with open('03_Data_Pack/employees.json', 'r', encoding='utf-8') as f:
    emps = json.load(f)

run_map = {r['run_id']: r for r in runs}
r08 = run_map['PR-2026-08']
r09 = run_map['PR-2026-09']

slips08 = [s for s in slips if s['run_id'] == 'PR-2026-08']
slips09 = [s for s in slips if s['run_id'] == 'PR-2026-09']

print(f"Total employees in employees.json: {len(emps)}")
print(f"August payslips count: {len(slips08)}")
print(f"September payslips count: {len(slips09)}")

emp_ids_08 = [s['employee_id'] for s in slips08]
emp_ids_09 = [s['employee_id'] for s in slips09]
uniq_08 = set(emp_ids_08)
uniq_09 = set(emp_ids_09)

print(f"August unique employees: {len(uniq_08)} (Duplicates: {len(emp_ids_08) - len(uniq_08)})")
print(f"September unique employees: {len(uniq_09)} (Duplicates: {len(emp_ids_09) - len(uniq_09)})")

def to_paise(val):
    return round(float(val) * 100)

diff_count_08 = 0
for s in slips08:
    g = to_paise(s['gross_pay'])
    d = to_paise(s['total_deductions'])
    n = to_paise(s['net_pay'])
    if g - d != n:
        diff_count_08 += 1

diff_count_09 = 0
for s in slips09:
    g = to_paise(s['gross_pay'])
    d = to_paise(s['total_deductions'])
    n = to_paise(s['net_pay'])
    if g - d != n:
        diff_count_09 += 1

print(f"August payslip internal math errors: {diff_count_08}")
print(f"September payslip internal math errors: {diff_count_09}")

g08 = sum(to_paise(s['gross_pay']) for s in slips08)
d08 = sum(to_paise(s['total_deductions']) for s in slips08)
n08 = sum(to_paise(s['net_pay']) for s in slips08)

g09 = sum(to_paise(s['gross_pay']) for s in slips09)
d09 = sum(to_paise(s['total_deductions']) for s in slips09)
n09 = sum(to_paise(s['net_pay']) for s in slips09)

print(f"\nAugust itemized sums:")
print(f"  Gross: {g08} paise (INR {g08/100:.2f})")
print(f"  Deductions: {d08} paise (INR {d08/100:.2f})")
print(f"  Net: {n08} paise (INR {n08/100:.2f})")
print(f"  Gross - Deductions == Net: {g08 - d08 == n08}")

print(f"\nSeptember itemized sums:")
print(f"  Gross: {g09} paise (INR {g09/100:.2f})")
print(f"  Deductions: {d09} paise (INR {d09/100:.2f})")
print(f"  Net: {n09} paise (INR {n09/100:.2f})")
print(f"  Gross - Deductions == Net: {g09 - d09 == n09}")

hg08 = to_paise(r08['total_gross'])
hn08 = to_paise(r08['total_net'])
hd08 = hg08 - hn08

hg09 = to_paise(r09['total_gross'])
hn09 = to_paise(r09['total_net'])
hd09 = hg09 - hn09

print(f"\nAugust Variances (Itemized - Stored):")
print(f"  Headcount: {len(uniq_08) - r08['employees_paid']}")
print(f"  Gross: {g08 - hg08} paise (INR {(g08 - hg08)/100:.2f})")
print(f"  Deductions: {d08 - hd08} paise (INR {(d08 - hd08)/100:.2f})")
print(f"  Net: {n08 - hn08} paise (INR {(n08 - hn08)/100:.2f})")

print(f"\nSeptember Variances (Itemized - Stored):")
print(f"  Headcount: {len(uniq_09) - r09['employees_paid']}")
print(f"  Gross: {g09 - hg09} paise (INR {(g09 - hg09)/100:.2f})")
print(f"  Deductions: {d09 - hd09} paise (INR {(d09 - hd09)/100:.2f})")
print(f"  Net: {n09 - hn09} paise (INR {(n09 - hn09)/100:.2f})")

emp_dict = {e['employee_id']: e for e in emps}
absent_in_aug = [eid for eid in emp_dict if eid not in uniq_08]
absent_in_sep = [eid for eid in emp_dict if eid not in uniq_09]

print(f"\nEmployees absent in August ({len(absent_in_aug)}):")
for eid in sorted(absent_in_aug):
    e = emp_dict[eid]
    print(f"  {eid}: joined={e.get('joining_date')}, dept={e.get('department')}, designation={e.get('designation')}")

print(f"\nEmployees absent in September ({len(absent_in_sep)}): {absent_in_sep}")
