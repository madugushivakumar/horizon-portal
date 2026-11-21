import sqlite3

conn = sqlite3.connect('prisma/dev.db')
c = conn.cursor()

c.execute('SELECT id, period_start, period_end, total_gross, total_net, employees_paid, status, original_total_gross, original_total_net, original_employees_paid FROM payroll_runs ORDER BY period_start')
runs = c.fetchall()

print(f"Total runs: {len(runs)}")
print(f"{'ID':<10} {'Start':<12} {'End':<12} {'H_Gross':<14} {'H_Net':<14} {'I_Gross':<14} {'I_Net':<14} {'Net_Diff':<14} {'H_Emp':<6} {'I_Emp':<6}")

all_h_gross, all_h_net, all_i_gross, all_i_net = 0, 0, 0, 0
disc_runs = []

for r in runs:
    run_id, p_start, p_end, h_gross, h_net, h_emp, status, orig_gross, orig_net, orig_emp = r
    c.execute('SELECT COUNT(*), SUM(gross_pay), SUM(net_pay), SUM(deductions) FROM payslips WHERE payroll_run_id = ?', (run_id,))
    i_cnt, i_gross, i_net, i_ded = c.fetchone()
    i_gross = i_gross or 0
    i_net = i_net or 0
    net_diff = round(h_net - i_net, 2)
    
    all_h_gross += h_gross
    all_h_net += h_net
    all_i_gross += i_gross
    all_i_net += i_net
    
    is_disc = (abs(net_diff) > 0.001) or (h_emp != i_cnt)
    if is_disc:
        disc_runs.append((run_id, p_start, p_end, h_gross, h_net, i_gross, i_net, net_diff, h_emp, i_cnt))
    
    print(f"{run_id:<10} {str(p_start)[:10]:<12} {str(p_end)[:10]:<12} {h_gross:<14.2f} {h_net:<14.2f} {i_gross:<14.2f} {i_net:<14.2f} {net_diff:<14.2f} {h_emp:<6} {i_cnt:<6}")

print("-" * 115)
print(f"ALL 18 RUNS: H_Gross={all_h_gross:,.2f}, H_Net={all_h_net:,.2f}, I_Gross={all_i_gross:,.2f}, I_Net={all_i_net:,.2f}, Net_Diff={all_h_net - all_i_net:,.2f}")

disc_h_gross = sum(x[3] for x in disc_runs)
disc_h_net = sum(x[4] for x in disc_runs)
disc_i_gross = sum(x[5] for x in disc_runs)
disc_i_net = sum(x[6] for x in disc_runs)
disc_diff = disc_h_net - disc_i_net
print(f"DISCREPANCY RUNS ({len(disc_runs)}): H_Gross={disc_h_gross:,.2f}, H_Net={disc_h_net:,.2f}, I_Gross={disc_i_gross:,.2f}, I_Net={disc_i_net:,.2f}, Net_Diff={disc_diff:,.2f}")
