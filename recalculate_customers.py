import sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
import openpyxl, json
from collections import defaultdict
from datetime import datetime

FILE = r'c:\Users\SHAHIN\Desktop\Kottayam Dashboard\Kottayam Future Complete Data.xlsx'

wb = openpyxl.load_workbook(FILE, read_only=True)
ws = wb['Combined Sales Report']
all_rows = list(ws.iter_rows(values_only=True))
wb.close()

headers = [str(c).strip().lower() for c in all_rows[0]]
mob_idx = next(i for i, c in enumerate(headers) if 'mobile' in c or 'mob' in c)
date_idx = next(i for i, c in enumerate(headers) if 'date' in c)
rev_idx = next(i for i, c in enumerate(headers) if any(k in c for k in ['amount','total','net','value','revenue','bill','sale','price']))

rows = all_rows[1:]

def parse_date(v):
    if v is None: return None
    try:
        if isinstance(v, str): return datetime.strptime(v.strip(), '%d/%m/%Y').date()
        if isinstance(v, datetime): return v.date()
    except: pass
    return None

# CORRECT LOGIC:
# cust_dates[mob] = set of unique calendar DATES customer visited
# Multiple invoices on the SAME date = still 1 visit (set deduplication)
# Single-Purchase = len(cust_dates[mob]) == 1
# Repeat          = len(cust_dates[mob]) >= 2

cust_dates   = defaultdict(set)    # mob -> {date, date, ...}
cust_revenue = defaultdict(lambda: defaultdict(float))  # mob -> {(yr,mo): revenue}

for r in rows:
    mob = str(r[mob_idx]).strip() if r[mob_idx] else None
    d   = parse_date(r[date_idx])
    rev = r[rev_idx] if isinstance(r[rev_idx], (int, float)) else 0.0
    if mob and d and mob != 'None' and len(mob) >= 10:
        cust_dates[mob].add(d)
        cust_revenue[mob][(d.year, d.month)] += rev

# Overall stats
total_cust  = len(cust_dates)
single_cust = {m for m, dates in cust_dates.items() if len(dates) == 1}
repeat_cust = {m for m, dates in cust_dates.items() if len(dates) >= 2}
single_pct  = len(single_cust) / total_cust * 100
repeat_pct  = len(repeat_cust) / total_cust * 100

# Monthly cohorts based on FIRST visit date
cust_first_month = {}
for mob, dates in cust_dates.items():
    first = min(dates)
    cust_first_month[mob] = (first.year, first.month)

# All month-years a customer visited (for retention)
cust_months = defaultdict(set)
for mob, dates in cust_dates.items():
    for d in dates:
        cust_months[mob].add((d.year, d.month))

cohorts = defaultdict(list)
for mob, ym in cust_first_month.items():
    cohorts[ym].append(mob)

ALL_MONTHS = sorted({ym for mths in cust_months.values() for ym in mths})

print("=== CORRECTED COHORT TABLE (unit=unique visit days) ===")
cohort_data = []
for cohort_ym in sorted(cohorts.keys()):
    members = cohorts[cohort_ym]
    size = len(members)
    cy, cm = cohort_ym

    # Single-purchase: visited on exactly 1 unique date across entire history
    single_count = sum(1 for mob in members if len(cust_dates[mob]) == 1)
    single_pct_c = single_count / size * 100

    # M1-M6 retention
    retention = []
    for offset in range(1, 7):
        total_m = cm + offset
        ty = cy + (total_m - 1) // 12
        tm = (total_m - 1) % 12 + 1
        target_ym = (ty, tm)
        if target_ym > max(ALL_MONTHS):
            retention.append(None)
        else:
            returned = sum(1 for mob in members if target_ym in cust_months[mob])
            retention.append(round(returned / size * 100, 1))

    label = f"{cy}-{cm:02d}"
    cohort_data.append({
        'cohort': label, 'size': size,
        'single': single_count, 'singlePct': round(single_pct_c, 1),
        'retention': retention
    })
    r_str = "  ".join(f"{r:.1f}%" if r is not None else "  --  " for r in retention)
    print(f"{label:<12} size={size:>5,} single={single_count:>5,} ({single_pct_c:.1f}%)  {r_str}")

# Revenue per cohort
print("\n=== REVENUE PER COHORT ===")
cohort_revenues = []
for cohort_ym in sorted(cohorts.keys()):
    members = cohorts[cohort_ym]
    cy, cm = cohort_ym
    m0_rev = sum(cust_revenue[mob].get(cohort_ym, 0) for mob in members)
    m1_ym = (cy + cm//12, (cm % 12) + 1)
    m1_rev = sum(cust_revenue[mob].get(m1_ym, 0) for mob in members)
    label = f"{cy}-{cm:02d}"
    cohort_revenues.append({'cohort': label, 'm0Rev': round(m0_rev/1e5, 1), 'm1Rev': round(m1_rev/1e5, 1)})
    print(f"  {label}: M0=Rs{m0_rev/1e5:.1f}L  M1=Rs{m1_rev/1e5:.1f}L")

# Summary
mc_with_m1 = [c for c in cohort_data if c['retention'][0] is not None and c['size'] > 50]
avg_m1 = round(sum(c['retention'][0] for c in mc_with_m1) / len(mc_with_m1), 1) if mc_with_m1 else 0

print(f"\n=== KEY SUMMARY ===")
print(f"Total Unique Customers  : {total_cust:,}")
print(f"Single-Purchase (1 day) : {len(single_cust):,}  ({len(single_cust)/total_cust*100:.1f}%)")
print(f"Repeat (2+ days)        : {len(repeat_cust):,}  ({len(repeat_cust)/total_cust*100:.1f}%)")
print(f"Avg M1 Retention        : {avg_m1}%")

# Output JS block
print("\n=== JS DATA BLOCK FOR loyalty_data.js ===")
print("monthlyCohort: [")
for c in cohort_data:
    r = c['retention']
    def rv(x): return x if x is not None else 'null'
    print(f"  {{ cohort:'{c['cohort']}', size:{c['size']}, single:{c['single']}, singlePct:{c['singlePct']}, "
          f"m1:{rv(r[0])}, m2:{rv(r[1])}, m3:{rv(r[2])}, m4:{rv(r[3])}, m5:{rv(r[4])}, m6:{rv(r[5])} }},")
print("],")
print(f"cohortSummary: {{ totalCustomers:{total_cust}, singlePurchase:{len(single_cust)}, "
      f"repeatCustomers:{len(repeat_cust)}, singlePct:{len(single_cust)/total_cust*100:.1f}, "
      f"repeatPct:{len(repeat_cust)/total_cust*100:.1f}, avgM1Retention:{avg_m1} }},")
