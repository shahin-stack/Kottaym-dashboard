import os
import json
import pandas as pd

def precompute():
    print("Starting precomputation of cached assets...")

    # 1. Historical Baseline
    fname = 'Kottayam Future Complete Data.xlsx'
    if os.path.exists(fname):
        print(f"Loading {fname} for historical baseline...")
        df = pd.read_excel(fname, dtype=str)
        df.columns = [str(c).strip().lower() for c in df.columns]
        date_col = next((c for c in df.columns if 'date' in c), None)
        mobile_col = next((c for c in df.columns if 'mobile' in c or 'mob' in c), None)
        if date_col and mobile_col:
            df[date_col] = pd.to_datetime(df[date_col], dayfirst=True, errors='coerce')
            df = df.dropna(subset=[date_col, mobile_col])
            df = df[df[mobile_col].str.strip() != '']
            cutoff = pd.Timestamp('2026-04-30')
            hist = df[df[date_col] <= cutoff]
            mobiles = hist[mobile_col].str.strip().unique().tolist()
            
            hist_cache = {'count': len(mobiles), 'mobiles': mobiles}
            with open('historical_customers_cache.json', 'w') as f:
                json.dump(hist_cache, f)
            print(f"Saved historical_customers_cache.json with {len(mobiles)} mobiles.")
        else:
            print("Error: Could not find Date or Mobile column in Kottayam Future Complete Data.xlsx")
            
        # 2. Growth Levers
        print(f"Computing Growth Levers from {fname}...")
        amount_col = next((c for c in df.columns if any(k in c for k in ['amount','total','net','value','revenue','bill','sale','price'])), None)
        if date_col and mobile_col:
            df[mobile_col] = df[mobile_col].str.strip()
            if amount_col:
                df[amount_col] = pd.to_numeric(df[amount_col], errors='coerce').fillna(0)
            
            max_date = df[date_col].max()
            window_start = max_date - pd.Timedelta(days=29)
            recent = df[(df[date_col] >= window_start) & (df[date_col] <= max_date)].copy()
            
            daily_uniq = recent.groupby(date_col)[mobile_col].nunique()
            avg_customers = round(float(daily_uniq.mean()), 0) if len(daily_uniq) > 0 else 0.0
            
            cust_visit_days = recent.groupby(mobile_col)[date_col].nunique()
            avg_frequency = round(float(cust_visit_days.mean()), 2) if len(cust_visit_days) > 0 else 0.0
            
            if amount_col and recent[amount_col].sum() > 0:
                visit_spend = recent.groupby([date_col, mobile_col])[amount_col].sum()
                avg_atv = round(float(visit_spend.mean()), 0)
            else:
                avg_atv = 1124.0
                
            def pct(current, target):
                return round(min((current / target) * 100, 100.0), 1)
                
            TARGETS = {'customers': 123, 'frequency': 2.6, 'atv': 28102}
            p_cust = pct(avg_customers, TARGETS['customers'])
            p_freq = pct(avg_frequency, TARGETS['frequency'])
            p_atv = pct(avg_atv, TARGETS['atv'])
            
            full_min_date = df[date_col].min()
            full_max_date = df[date_col].max()
            
            levers_cache = {
                'data_period': f"{full_min_date.strftime('%b %Y')} – {full_max_date.strftime('%b %Y')}",
                'monthly_revenue_estimate': round(avg_customers * avg_frequency * avg_atv * 30 / 1e7, 2),
                'levers': {
                    'customers': {
                        'label': 'More Customers', 'number': '01', 'current': int(avg_customers), 'target': TARGETS['customers'],
                        'current_fmt': f"{int(avg_customers):,}/day", 'target_fmt': "123/day (+25%)", 'progress': p_cust,
                        'status': 'On Track' if p_cust >= 60 else 'Needs Action', 'status_cls': 'yellow' if p_cust >= 60 else 'red'
                    },
                    'frequency': {
                        'label': 'Higher Frequency', 'number': '02', 'current': avg_frequency, 'target': TARGETS['frequency'],
                        'current_fmt': f"{avg_frequency} visits/mo", 'target_fmt': '2.6 visits/mo', 'progress': p_freq,
                        'status': 'On Track' if p_freq >= 60 else 'Needs Action', 'status_cls': 'yellow' if p_freq >= 60 else 'red'
                    },
                    'atv': {
                        'label': 'Larger Basket Size', 'number': '03', 'current': int(avg_atv), 'target': TARGETS['atv'],
                        'current_fmt': f"₹{int(avg_atv):,}", 'target_fmt': '₹28,102 (+20%)', 'progress': p_atv,
                        'status': 'On Track' if p_atv >= 60 else 'Needs Action', 'status_cls': 'yellow' if p_atv >= 60 else 'red'
                    }
                }
            }
            with open('growth_levers_cache.json', 'w') as f:
                json.dump(levers_cache, f)
            print("Saved growth_levers_cache.json.")
    else:
        print(f"Error: {fname} not found.")

    # 3. Base Mobiles
    fname2 = 'Kottayam Complete Data till April 27.xlsx'
    if os.path.exists(fname2):
        print(f"Loading {fname2} for base mobiles...")
        df2 = pd.read_excel(fname2, dtype=str)
        df2.columns = [str(c).strip().lower() for c in df2.columns]
        mobile_col = next((c for c in df2.columns if 'mobile' in c or 'mob' in c or 'phone' in c or 'contact' in c), None)
        if not mobile_col:
            mobile_col = df2.columns[0]
            
        mobiles = df2[mobile_col].dropna().astype(str).str.replace(r'\s+', '', regex=True).str.replace(r'[-()+]', '', regex=True).str.strip()
        mobiles = mobiles.str.split('.').str[0]
        
        def clean_pref(val):
            if len(val) == 12 and val.startswith('91'):
                return val[2:]
            return val
        mobiles = mobiles.apply(clean_pref)
        moblist = mobiles[mobiles != ''].unique().tolist()
        
        base_mobiles_cache = {'mobiles': moblist, 'filename': fname2, 'count': len(moblist)}
        with open('base_mobiles_cache.json', 'w') as f:
            json.dump(base_mobiles_cache, f)
        print(f"Saved base_mobiles_cache.json with {len(moblist)} mobiles.")
    else:
        print(f"Error: {fname2} not found.")

if __name__ == '__main__':
    precompute()
