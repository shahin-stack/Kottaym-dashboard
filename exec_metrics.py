import sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
import openpyxl
from collections import defaultdict
from datetime import datetime
import json

wb = openpyxl.load_workbook(r'c:\Users\SHAHIN\Desktop\Kottayam Dashboard\Kottayam Future Complete Data.xlsx', read_only=True)
ws = wb['Combined Sales Report']
all_rows = list(ws.iter_rows(values_only=True))
wb.close()

headers = [str(c).strip().lower() for c in all_rows[0]]
mob_idx = next(i for i, c in enumerate(headers) if 'mobile' in c or 'mob' in c)
date_idx = next(i for i, c in enumerate(headers) if 'date' in c)
inv_idx = next(i for i, c in enumerate(headers) if 'invoice' in c or 'inv' in c)
rev_idx = next(i for i, c in enumerate(headers) if any(k in c for k in ['amount','total','net','value','revenue','bill','sale','price']))
cat_idx = next(i for i, c in enumerate(headers) if 'category' in c or 'cat' in c)
brand_idx = next(i for i, c in enumerate(headers) if 'brand' in c)
staff_idx = next(i for i, c in enumerate(headers) if 'staff' in c)
mop_idx = next(i for i, c in enumerate(headers) if 'mop' in c)

rows = all_rows[1:]

TODAY = datetime(2026, 5, 12)

def parse_date(v):
    if v is None: return None
    try:
        if isinstance(v, str): return datetime.strptime(v.strip(), '%d/%m/%Y')
        if isinstance(v, datetime): return v
    except: pass
    return None

# Build records
records = []
for r in rows:
    mob = str(r[mob_idx]).strip() if r[mob_idx] else None
    d   = parse_date(r[date_idx])
    inv = r[inv_idx]
    rev = r[rev_idx] if isinstance(r[rev_idx], (int, float)) else 0.0
    cat = r[cat_idx]
    brand = r[brand_idx]
    staff = r[staff_idx]
    mop = r[mop_idx]
    if d:
        records.append({'mob':mob,'date':d,'inv':inv,'rev':rev,'cat':cat,'brand':brand,'staff':staff,'mop':mop})

print(f"Total records: {len(records)}")

# Monthly revenue
monthly_rev = defaultdict(float)
monthly_inv = defaultdict(set)
monthly_cust = defaultdict(set)
for r in records:
    key = r['date'].strftime('%Y-%m')
    monthly_rev[key] += r['rev']
    if r['inv']: monthly_inv[key].add(r['inv'])
    if r['mob']: monthly_cust[key].add(r['mob'])

print("\n=== MONTHLY REVENUE (last 10 months) ===")
for k in sorted(monthly_rev.keys())[-10:]:
    days_in_month = 30
    if k == '2026-05': days_in_month = 12  # MTD
    print(f"  {k}: rev=Rs{monthly_rev[k]/1e7:.2f}Cr, invoices={len(monthly_inv[k])}, customers={len(monthly_cust[k])}, daily_inv={len(monthly_inv[k])/days_in_month:.0f}")

# Most recent full month: April 2026
apr_rev = monthly_rev.get('2026-04', 0)
apr_inv = len(monthly_inv.get('2026-04', set()))
apr_cust = len(monthly_cust.get('2026-04', set()))
print(f"\nApril 2026 (most recent full): Rev=Rs{apr_rev/1e7:.2f}Cr, Invoices={apr_inv}, Customers={apr_cust}")
print(f"  Daily invoices (30d): {apr_inv/30:.0f}")

# ATV per month
print("\n=== ATV BY MONTH ===")
for k in sorted(monthly_rev.keys())[-6:]:
    inv_count = len(monthly_inv[k])
    if inv_count > 0:
        atv = monthly_rev[k] / inv_count
        print(f"  {k}: ATV=Rs{atv:,.0f}")

# Category breakdown
cat_rev = defaultdict(float)
cat_inv = defaultdict(set)
for r in records:
    if r['cat']:
        cat_rev[r['cat']] += r['rev']
        if r['inv']: cat_inv[r['cat']].add(r['inv'])

print("\n=== CATEGORY REVENUE ===")
total = sum(cat_rev.values())
for cat, rev in sorted(cat_rev.items(), key=lambda x: -x[1]):
    print(f"  {cat}: Rs{rev/1e7:.2f}Cr ({rev/total*100:.1f}%), invoices={len(cat_inv[cat])}")

# Staff performance (top 10)
staff_rev = defaultdict(float)
staff_inv = defaultdict(set)
for r in records:
    if r['staff']:
        staff_rev[r['staff']] += r['rev']
        if r['inv']: staff_inv[r['staff']].add(r['inv'])

print("\n=== TOP 10 STAFF BY REVENUE ===")
for s, rev in sorted(staff_rev.items(), key=lambda x: -x[1])[:10]:
    print(f"  {s}: Rs{rev/1e7:.2f}Cr, invoices={len(staff_inv[s])}")

# MOP (payment mode)
mop_rev = defaultdict(float)
for r in records:
    mop_key = str(r['mop']).strip() if r['mop'] else 'Unknown'
    mop_rev[mop_key] += r['rev']

print("\n=== PAYMENT MODE ===")
total_rev = sum(mop_rev.values())
for mop, rev in sorted(mop_rev.items(), key=lambda x: -x[1]):
    print(f"  {mop}: Rs{rev/1e7:.2f}Cr ({rev/total_rev*100:.1f}%)")

# Day of week
dow_rev = defaultdict(float)
dow_inv = defaultdict(set)
for r in records:
    day = r['date'].strftime('%A')
    dow_rev[day] += r['rev']
    if r['inv']: dow_inv[day].add(r['inv'])

print("\n=== DAY OF WEEK REVENUE ===")
days_order = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday']
for d in days_order:
    if d in dow_rev:
        weeks = len(set(r['date'].isocalendar()[1] for r in records if r['date'].strftime('%A')==d))
        avg = dow_rev[d]/max(weeks,1)/1e5
        print(f"  {d}: Rs{dow_rev[d]/1e7:.2f}Cr total, avg_weekly=Rs{avg:.1f}L, invoices={len(dow_inv[d])}")

# YoY comparison: only 2025 data for comparison window
# Sep-Dec 2025 vs same months (no prior year available, so note it)
print("\n=== QUARTERLY REVENUE DETAILS ===")
quarters = {
    'ASO25': (datetime(2025,8,1),  datetime(2025,10,31)),
    'NDJ26': (datetime(2025,11,1), datetime(2026,1,31)),
    'FMA26': (datetime(2026,2,1),  datetime(2026,4,30)),
    'MAY26': (datetime(2026,5,1),  datetime(2026,5,12)),
}
for qn, (qs, qe) in quarters.items():
    qrec = [r for r in records if qs <= r['date'] <= qe]
    qrev = sum(r['rev'] for r in qrec)
    qinv = len(set(r['inv'] for r in qrec if r['inv']))
    qdays = (qe - qs).days + 1
    if qn == 'MAY26': qdays = 12
    print(f"  {qn}: Rs{qrev/1e7:.2f}Cr, {qinv} invoices, daily_inv={qinv/qdays:.1f}, ATV=Rs{qrev/qinv:,.0f}" if qinv else f"  {qn}: no data")

# Brand top 10
brand_rev = defaultdict(float)
for r in records:
    if r['brand']: brand_rev[r['brand']] += r['rev']
print("\n=== TOP 10 BRANDS ===")
for b, rev in sorted(brand_rev.items(), key=lambda x:-x[1])[:10]:
    print(f"  {b}: Rs{rev/1e7:.2f}Cr")

# MTD May 2026 specific
may_recs = [r for r in records if r['date'].year==2026 and r['date'].month==5]
may_rev = sum(r['rev'] for r in may_recs)
may_inv = len(set(r['inv'] for r in may_recs if r['inv']))
may_cust = len(set(r['mob'] for r in may_recs if r['mob']))
print(f"\n=== MTD MAY 2026 (1-12 May, 12 days) ===")
print(f"  Revenue: Rs{may_rev/1e7:.2f}Cr")
print(f"  Daily avg: Rs{may_rev/12/1e5:.1f}L/day")
print(f"  Invoices: {may_inv} ({may_inv/12:.0f}/day)")
print(f"  Customers: {may_cust}")
print(f"  ATV: Rs{may_rev/may_inv:,.0f}" if may_inv else "  ATV: N/A")
