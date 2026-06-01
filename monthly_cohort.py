import sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
import openpyxl
from collections import defaultdict
from datetime import datetime

wb = openpyxl.load_workbook(
    r'c:\Users\SHAHIN\Desktop\Kottayam Dashboard\Kottayam Future Complete Data.xlsx',
    read_only=True
)
ws = wb['Combined Sales Report']
all_rows = list(ws.iter_rows(values_only=True))
wb.close()

headers = [str(c).strip().lower() for c in all_rows[0]]
mob_idx = next(i for i, c in enumerate(headers) if 'mobile' in c or 'mob' in c)
date_idx = next(i for i, c in enumerate(headers) if 'date' in c)
inv_idx = next(i for i, c in enumerate(headers) if 'invoice' in c or 'inv' in c)
rev_idx = next(i for i, c in enumerate(headers) if any(k in c for k in ['amount','total','net','value','revenue','bill','sale','price']))

rows = all_rows[1:]

def parse_date(v):
    if v is None: return None
    try:
        if isinstance(v, str): return datetime.strptime(v.strip(), '%d/%m/%Y')
        if isinstance(v, datetime): return v
    except: pass
    return None

# CORRECT LOGIC:
# Single-purchase = customer has exactly 1 unique invoice (visited once)
# Repeat          = customer has 2+ unique invoices (came back at least once)
# Unit of measure = INVOICE (transaction), not month

cust_invoices = defaultdict(set)   # mob -> set of invoice numbers
cust_dates    = defaultdict(set)   # mob -> set of purchase dates (for cohort)
cust_months   = defaultdict(set)   # mob -> set of (year,month) for cohort retention

for r in rows:
    mob = str(r[mob_idx]).strip() if r[mob_idx] else None
    d   = parse_date(r[date_idx])
    inv = r[inv_idx]
    if mob and d and mob != 'None':
        if inv:
            cust_invoices[mob].add(inv)
        cust_dates[mob].add(d.date())
        cust_months[mob].add((d.year, d.month))

total_cust = len(cust_invoices)
single_inv = {m for m, invs in cust_invoices.items() if len(invs) == 1}
repeat_inv = {m for m, invs in cust_invoices.items() if len(invs) >= 2}

print(f"=== CORRECT SINGLE vs REPEAT LOGIC (by Invoice Count) ===")
print(f"Total unique customers (mobile): {total_cust:,}")
print(f"Single-purchase (1 invoice only): {len(single_inv):,} ({len(single_inv)/total_cust*100:.1f}%)")
print(f"Repeat customers (2+ invoices):   {len(repeat_inv):,} ({len(repeat_inv)/total_cust*100:.1f}%)")

# Distribution of invoice counts
print("\n=== INVOICE COUNT DISTRIBUTION ===")
inv_dist = defaultdict(int)
for m, invs in cust_invoices.items():
    inv_dist[len(invs)] += 1
for k in sorted(inv_dist.keys())[:15]:
    print(f"  {k} invoice(s): {inv_dist[k]:,} customers")

# --- Monthly cohort based on FIRST PURCHASE DATE ---
# Cohort = month of first invoice
# noReturn within cohort = customer who has exactly 1 invoice (single-purchase)
cust_first_month = {}
for mob, months in cust_months.items():
    cust_first_month[mob] = min(months)

cohorts = defaultdict(list)
for mob, first in cust_first_month.items():
    cohorts[first].append(mob)

ALL_MONTHS = sorted(set(
    ym for months in cust_months.values() for ym in months
))

print(f"\n=== MONTHLY COHORT TABLE (Single-purchase = 1 invoice ever) ===")
print(f"{'Cohort':<12} {'Size':>6} {'1-Invoice':>10} {'Single%':>8} {'M1 Ret%':>8} {'M2 Ret%':>8} {'M3 Ret%':>8} {'M4 Ret%':>8} {'M5 Ret%':>8} {'M6 Ret%':>8}")
print("-"*90)

cohort_data = []
for cohort_ym in sorted(cohorts.keys()):
    members = cohorts[cohort_ym]
    size = len(members)
    cy, cm = cohort_ym

    # Single-purchase: exactly 1 invoice across entire history
    single_count = sum(1 for mob in members if len(cust_invoices[mob]) == 1)
    single_pct   = single_count / size * 100

    # M1–M6 retention: did customer purchase in that month (any invoice)
    retention = []
    for offset in range(1, 7):
        total_m = cm + offset
        target_year = cy + (total_m - 1) // 12
        target_month = (total_m - 1) % 12 + 1
        target_ym = (target_year, target_month)
        if target_ym > max(ALL_MONTHS):
            retention.append(None)
        else:
            returned = sum(1 for mob in members if target_ym in cust_months[mob])
            retention.append(round(returned / size * 100, 1))

    label = f"{cy}-{cm:02d}"
    r_str = "  ".join(f"{r:.1f}%" if r is not None else "  --  " for r in retention)
    print(f"{label:<12} {size:>6,} {single_count:>10,} {single_pct:>7.1f}%  {r_str}")

    cohort_data.append({
        'cohort': label, 'size': size,
        'single': single_count, 'singlePct': round(single_pct, 1),
        'retention': retention
    })

# Summary
print("\n=== KEY SUMMARY ===")
mc_with_m1 = [c for c in cohort_data if c['retention'][0] is not None and c['size'] > 50]
if mc_with_m1:
    avg_m1 = sum(c['retention'][0] for c in mc_with_m1) / len(mc_with_m1)
    print(f"Avg M1 retention: {avg_m1:.1f}%")
mc_with_m2 = [c for c in cohort_data if c['retention'][1] is not None and c['size'] > 50]
if mc_with_m2:
    avg_m2 = sum(c['retention'][1] for c in mc_with_m2) / len(mc_with_m2)
    print(f"Avg M2 retention: {avg_m2:.1f}%")

overall_single_pct = len(single_inv) / total_cust * 100
print(f"Overall single-purchase rate: {len(single_inv):,} / {total_cust:,} = {overall_single_pct:.1f}%")
print(f"Overall repeat rate:          {len(repeat_inv):,} / {total_cust:,} = {len(repeat_inv)/total_cust*100:.1f}%")

# Revenue per cohort
monthly_rev_by_mob = defaultdict(lambda: defaultdict(float))
for r in rows:
    mob = str(r[mob_idx]).strip() if r[mob_idx] else None
    d   = parse_date(r[date_idx])
    rev = r[rev_idx] if isinstance(r[rev_idx], (int, float)) else 0.0
    if mob and d and mob != 'None':
        ym = (d.year, d.month)
        monthly_rev_by_mob[mob][ym] += rev

print("\n=== REVENUE PER COHORT ===")
for cohort_ym in sorted(cohorts.keys())[:9]:
    members = cohorts[cohort_ym]
    m0_rev = sum(monthly_rev_by_mob[mob].get(cohort_ym, 0) for mob in members)
    cy, cm = cohort_ym
    m1_ym = (cy + cm//12, (cm % 12) + 1)
    m1_rev = sum(monthly_rev_by_mob[mob].get(m1_ym, 0) for mob in members)
    label = f"{cy}-{cm:02d}"
    print(f"  {label}: M0=Rs{m0_rev/1e5:.1f}L  M1=Rs{m1_rev/1e5:.1f}L  size={len(members)}")

print("\n=== JS DATA BLOCK ===")
print("monthlyCohort: [")
for c in cohort_data:
    r = c['retention']
    def rv(x): return x if x is not None else 'null'
    print(f"  {{ cohort:'{c['cohort']}', size:{c['size']}, single:{c['single']}, singlePct:{c['singlePct']}, "
          f"m1:{rv(r[0])}, m2:{rv(r[1])}, m3:{rv(r[2])}, m4:{rv(r[3])}, m5:{rv(r[4])}, m6:{rv(r[5])} }},")
print("],")
print(f"cohortSummary: {{ totalCustomers:{total_cust}, singlePurchase:{len(single_inv)}, "
      f"repeatCustomers:{len(repeat_inv)}, singlePct:{overall_single_pct:.1f}, "
      f"repeatPct:{len(repeat_inv)/total_cust*100:.1f} }},")
