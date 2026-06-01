import openpyxl
from collections import defaultdict
from datetime import datetime
import json

wb = openpyxl.load_workbook(r'c:\Users\SHAHIN\Desktop\Kottayam Dashboard\Kottayam Future Complete Data.xlsx', read_only=True)
ws = wb['Combined Sales Report']
all_rows = list(ws.iter_rows(values_only=True))
wb.close()

headers = [str(c).strip().lower() for c in all_rows[0]]
date_idx = next(i for i, c in enumerate(headers) if 'date' in c)
qty_idx = next(i for i, c in enumerate(headers) if 'qty' in c)
rev_idx = next(i for i, c in enumerate(headers) if 'sold price' in c or 'revenue' in c or 'net value' in c or 'invoice value' in c or 'amount' in c)
cat_idx = next(i for i, c in enumerate(headers) if 'category' in c or 'cat' in c)

def parse_date(v):
    if v is None: return None
    try:
        if isinstance(v, str): return datetime.strptime(v.strip(), '%d/%m/%Y')
        if isinstance(v, datetime): return v
    except: pass
    return None

category_monthly = defaultdict(lambda: defaultdict(lambda: {'qty': 0, 'sales': 0.0}))

for r in all_rows[1:]:
    d = parse_date(r[date_idx])
    if not d: continue
    
    cat = str(r[cat_idx]).strip() if r[cat_idx] else 'Others'
    qty = r[qty_idx] if isinstance(r[qty_idx], (int, float)) else 1.0
    rev = r[rev_idx] if isinstance(r[rev_idx], (int, float)) else 0.0
    
    month_key = d.strftime('%Y-%m')
    category_monthly[cat][month_key]['qty'] += qty
    category_monthly[cat][month_key]['sales'] += rev

# Let's clean up and structure the result
result = {}
for cat, months in category_monthly.items():
    result[cat] = {}
    for m, vals in months.items():
        result[cat][m] = {
            'qty': int(vals['qty']),
            'sales': round(vals['sales'], 2)
        }

with open(r'c:\Users\SHAHIN\Desktop\Kottayam Dashboard\category_data.json', 'w') as f:
    json.dump(result, f, indent=2)

print("Done! Extracted category-wise monthly metrics.")
