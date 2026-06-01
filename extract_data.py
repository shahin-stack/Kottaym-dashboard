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

rows = all_rows[1:]

TODAY = datetime(2026, 5, 12)

def parse_date(v):
    if v is None: return None
    try:
        if isinstance(v, str): return datetime.strptime(v.strip(), '%d/%m/%Y')
        if isinstance(v, datetime): return v
    except: pass
    return None

# ─── Build per-row records ────────────────────────────────────────
records = []  # (mob, date, invoice, revenue)
for r in rows:
    mob = str(r[mob_idx]).strip() if r[mob_idx] else None
    d   = parse_date(r[date_idx])
    inv = r[inv_idx]
    rev = r[rev_idx] if isinstance(r[rev_idx], (int, float)) else 0.0
    if mob and d:
        records.append((mob, d, inv, rev))

print(f"Valid records: {len(records)}")

# ─── Customer summary ──────────────────────────────────────────────
cust = defaultdict(lambda: {'dates': [], 'invoices': set(), 'revenue': 0.0})
for mob, d, inv, rev in records:
    cust[mob]['dates'].append(d)
    if inv: cust[mob]['invoices'].add(inv)
    cust[mob]['revenue'] += rev

print(f"Unique customers: {len(cust)}")

# Quarter helper
def get_quarter(d):
    if datetime(2025,8,1) <= d <= datetime(2025,10,31):  return 'ASO25'
    if datetime(2025,11,1) <= d <= datetime(2026,1,31):  return 'NDJ26'
    if datetime(2026,2,1)  <= d <= datetime(2026,4,30):  return 'FMA26'
    if datetime(2026,5,1)  <= d <= datetime(2026,5,12):  return 'MAY26'
    return None

# ─── SECTION 1: COHORT ────────────────────────────────────────────
cohort_sizes = defaultdict(int)
cohort_ret   = defaultdict(lambda: defaultdict(set))   # [year][offset] = set of mobs
cohort_rev   = defaultdict(lambda: defaultdict(float)) # [year][offset] = revenue

for mob, data in cust.items():
    if not data['dates']: continue
    first_yr = min(data['dates']).year
    cohort_sizes[first_yr] += 1
    for d in data['dates']:
        off = d.year - first_yr
        cohort_ret[first_yr][off].add(mob)

for mob, d, inv, rev in records:
    if mob not in cust: continue
    first_yr = min(cust[mob]['dates']).year
    off = d.year - first_yr
    cohort_rev[first_yr][off] += rev

print("\n=== COHORT TABLE ===")
output = {"cohort": {}, "rfm": {}, "gap": {}, "quarterly": {}}
for yr in sorted(cohort_sizes.keys()):
    sz = cohort_sizes[yr]
    ret = {off: round(len(cohort_ret[yr][off])/sz*100,1) for off in range(8)}
    rev = {off: round(cohort_rev[yr][off]/1e7, 2) for off in range(8)}
    no_ret = sz - len(cohort_ret[yr][1]) if sz > len(cohort_ret[yr][1]) else 0
    output["cohort"][yr] = {"size": sz, "no_return": no_ret, "retention": ret, "revenue_cr": rev}
    print(f"  {yr}: size={sz}, no_return={no_ret}, ret={ret}, rev={rev}")

# ─── SECTION 2: RFM ────────────────────────────────────────────────
rfm_list = []
for mob, data in cust.items():
    if not data['dates']: continue
    last = max(data['dates'])
    rfm_list.append({
        'mob': mob,
        'R_days': (TODAY - last).days,
        'F': len(data['invoices']),
        'M': data['revenue']
    })

n = len(rfm_list)
# M quintile (1=top spenders)
for i, r in enumerate(sorted(rfm_list, key=lambda x: -x['M'])):
    r['M_quintile'] = min(int(i/(n/5))+1, 5)
    r['M_score']    = 6 - r['M_quintile']
# R score (1=most recent=5)
for i, r in enumerate(sorted(rfm_list, key=lambda x: x['R_days'])):
    r['R_score'] = max(1, 5 - min(int(i/(n/5)), 4))
# F score
for i, r in enumerate(sorted(rfm_list, key=lambda x: x['F'])):
    r['F_score'] = max(1, min(int(i/(n/5))+1, 5))

seg_data = defaultdict(lambda: {'count':0,'revenue':0.0})
for r in rfm_list:
    rs, fs, ms = r['R_score'], r['F_score'], r['M_score']
    if rs>=4 and fs>=4 and ms>=4:   seg='Champions'
    elif rs>=3 and fs>=3 and ms>=3: seg='Loyal'
    elif rs>=4 and fs<=2:           seg='New'
    elif rs==2 and fs>=3 and ms>=3: seg='At Risk'
    elif rs==1:                     seg='Lost'
    else:                           seg='Others'
    seg_data[seg]['count']   += 1
    seg_data[seg]['revenue'] += r['M']

total_rev = sum(r['M'] for r in rfm_list)
print("\n=== RFM SEGMENTS ===")
for seg, v in sorted(seg_data.items(), key=lambda x: -x[1]['revenue']):
    print(f"  {seg}: n={v['count']}, rev={v['revenue']/1e7:.2f}Cr, share={v['revenue']/total_rev*100:.1f}%")

quint_out = {}
print("\n=== MONETARY QUINTILES ===")
labels_q = {1:'Top 20%',2:'Next 20%',3:'Middle 20%',4:'Next 20%',5:'Bottom 20%'}
for q in range(1,6):
    grp = [r for r in rfm_list if r['M_quintile']==q]
    tot = sum(x['M'] for x in grp)
    avg = tot/len(grp) if grp else 0
    quint_out[q] = {'n':len(grp),'avg':round(avg),'total_cr':round(tot/1e7,2),'share':round(tot/total_rev*100,1)}
    print(f"  Q{q} {labels_q[q]}: n={len(grp)}, avg={avg:,.0f}, total={tot/1e7:.2f}Cr, share={tot/total_rev*100:.1f}%")

output['rfm'] = {
    'segments': {s: {'count':v['count'],'revenue_cr':round(v['revenue']/1e7,2),'share':round(v['revenue']/total_rev*100,1)} for s,v in seg_data.items()},
    'quintiles': quint_out,
    'total_customers': n,
    'total_revenue_cr': round(total_rev/1e7,2)
}

# ─── SECTION 3: GAP ANALYSIS ──────────────────────────────────────
gaps_data = []
for mob, data in cust.items():
    if not data['dates']: continue
    last = max(data['dates'])
    gap  = (TODAY - last).days
    gaps_data.append({'gap': gap, 'revenue': data['revenue'], 'F': len(data['invoices'])})

bands = [
    (0,7,'1-7 Days','Very High','Immediate'),
    (8,30,'8-30 Days','High','High'),
    (31,60,'31-60 Days','High','Medium'),
    (61,90,'61-90 Days','Medium','Medium'),
    (91,180,'91-180 Days','Medium','Critical'),
    (181,365,'181-365 Days','Low','Reactivate'),
    (366,730,'1-2 Years','Very Low','Reactivate'),
    (731,99999,'2+ Years','Very Low','Ignore')
]
gap_out = []
total_c = len(gaps_data)
print("\n=== GAP ANALYSIS ===")
for lo,hi,label,loyalty,action in bands:
    grp = [g for g in gaps_data if lo<=g['gap']<=hi]
    cnt = len(grp)
    rev = sum(g['revenue'] for g in grp)
    avg_rev = rev/cnt if cnt else 0
    gap_out.append({'label':label,'count':cnt,'pct':round(cnt/total_c*100,1),
                    'loyalty':loyalty,'action':action,'revenue_cr':round(rev/1e7,2),
                    'avg_spend':round(avg_rev)})
    print(f"  {label}: n={cnt}, pct={cnt/total_c*100:.1f}%, rev={rev/1e7:.2f}Cr")

avg_gap = sum(g['gap'] for g in gaps_data)/len(gaps_data)
repeat_c = sum(1 for g in gaps_data if g['F']>1)
print(f"Avg gap: {avg_gap:.0f}d, Repeat: {repeat_c}/{total_c} ({repeat_c/total_c*100:.1f}%)")
output['gap'] = {'bands': gap_out, 'avg_gap': round(avg_gap), 'total': total_c,
                 'repeat': repeat_c, 'repeat_pct': round(repeat_c/total_c*100,1)}

# ─── SECTION 4: QUARTERLY ─────────────────────────────────────────
q_defs = [
    ('ASO25',  'Aug-Oct 2025',   datetime(2025,8,1),  datetime(2025,10,31)),
    ('NDJ26',  'Nov-Jan 25-26',  datetime(2025,11,1), datetime(2026,1,31)),
    ('FMA26',  'Feb-Apr 2026',   datetime(2026,2,1),  datetime(2026,4,30)),
    ('MAY26',  'May 2026 (MTD)', datetime(2026,5,1),  datetime(2026,5,12)),
]

# Pre-aggregate: mob -> list of (date, revenue)
mob_timeline = defaultdict(list)
for mob, d, inv, rev in records:
    mob_timeline[mob].append((d, rev))

prev_set = set()
cum_db   = set()
q_out    = []
print("\n=== QUARTERLY PERFORMANCE ===")
for qkey, qname, qstart, qend in q_defs:
    q_mobs = set(); new_m = set(); rep_m = set(); q_rev = 0.0
    for mob, timeline in mob_timeline.items():
        in_q = [t for t in timeline if qstart <= t[0] <= qend]
        if not in_q: continue
        q_mobs.add(mob)
        q_rev += sum(t[1] for t in in_q)
        first_ever = min(t[0] for t in mob_timeline[mob])
        if first_ever >= qstart: new_m.add(mob)
        else:                    rep_m.add(mob)
    cum_db.update(q_mobs)
    total = len(q_mobs)
    rep_pct = round(len(rep_m)/total*100,1) if total else 0
    ret_pct = round(len(q_mobs & prev_set)/len(prev_set)*100,1) if prev_set else 0
    qoq     = round((total-len(prev_set))/len(prev_set)*100,1) if prev_set else 0
    entry   = {'key':qkey,'name':qname,'total':total,'new':len(new_m),'repeat':len(rep_m),
               'repeat_pct':rep_pct,'retention_pct':ret_pct,'qoq_pct':qoq,
               'cum_db':len(cum_db),'revenue_cr':round(q_rev/1e7,2)}
    q_out.append(entry)
    prev_set = q_mobs
    print(f"  {qname}: total={total}, new={len(new_m)}, repeat={len(rep_m)}, rep%={rep_pct}, ret%={ret_pct}, qoq={qoq}%, rev={q_rev/1e7:.2f}Cr, cumDB={len(cum_db)}")

output['quarterly'] = q_out

# Save JSON
with open('loyalty_data.json', 'w') as f:
    json.dump(output, f, indent=2)
print("\n✅ Data saved to loyalty_data.json")
