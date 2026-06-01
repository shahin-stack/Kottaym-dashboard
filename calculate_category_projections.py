import json

with open(r'c:\Users\SHAHIN\Desktop\Kottayam Dashboard\category_data.json', 'r') as f:
    raw = json.load(f)

result = {}
# Categories list:
# CONSUMER ELECTRONICS, TELECOM, IT, ACCESSORIES, VALUE ADDED SERVICE, ENDPOINT PROTECTION, OTHERS

for cat, months in raw.items():
    # Calculate historical totals
    total_qty = 0
    total_sales = 0.0
    
    # Last 3 months (Feb, Mar, Apr 2026)
    recent_qty = 0
    recent_sales = 0.0
    recent_months = ['2026-02', '2026-03', '2026-04']
    
    active_months = 0
    for m, vals in months.items():
        sales_val = vals['sales']
        # If sales_val is negative (can happen due to returns/others), adjust to 0 for average
        if sales_val < 0:
            sales_val = 0
        total_qty += vals['qty']
        total_sales += sales_val
        active_months += 1
        
        if m in recent_months:
            recent_qty += vals['qty']
            recent_sales += sales_val

    avg_monthly_qty = total_qty / active_months if active_months > 0 else 0
    avg_monthly_sales = total_sales / active_months if active_months > 0 else 0
    
    recent_avg_qty = recent_qty / 3.0
    recent_avg_sales = recent_sales / 3.0
    
    # Projections:
    # Baseline future monthly sales = average of recent 3 months
    # Growth monthly projection (to reach ₹10Cr/mo overall target from ~₹7.22Cr recent run rate)
    # Let's apply a 38% growth factor to reach the ₹10Cr/mo target (scaled proportionally)
    projected_sales = recent_avg_sales * 1.385
    projected_qty = recent_avg_qty * 1.385
    
    result[cat] = {
        'total_qty': total_qty,
        'total_sales_cr': round(total_sales / 1e7, 3),
        'avg_qty': round(avg_monthly_qty),
        'avg_sales_cr': round(avg_monthly_sales / 1e7, 3),
        'recent_avg_qty': round(recent_avg_qty),
        'recent_avg_sales_cr': round(recent_avg_sales / 1e7, 3),
        'proj_qty': round(projected_qty),
        'proj_sales_cr': round(projected_sales / 1e7, 3),
        'monthly_data': {m: {'qty': vals['qty'], 'sales_cr': round(max(0, vals['sales']) / 1e7, 3)} for m, vals in months.items()}
    }

# Save the structured dataset
with open(r'c:\Users\SHAHIN\Desktop\Kottayam Dashboard\category_projections.json', 'w') as f:
    json.dump(result, f, indent=2)

print("Done! Projections computed and saved.")
