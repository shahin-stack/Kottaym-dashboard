"""
  KOTTAYAM RETAIL — Flask Backend (app.py)
  Converted from app.js + app2.js
  Serves all dashboard data as JSON API endpoints.
  [RELOAD TRIGGER] Sync cached data assets and metrics for 23,741 customers.
"""

from flask import Flask, jsonify, render_template_string, send_from_directory, Response
import os
import json
import pandas as pd

app = Flask(__name__, static_folder='.', static_url_path='')

# ---------------------------------------------------------------------------
# Historical Customer Baseline  (pre-May 2026)
# Read ONCE at startup from "Kottayam Future Complete Data.xlsx".
# Cached in memory — the API responds instantly after the first load.
# ---------------------------------------------------------------------------
_HIST_CACHE = None   # will hold {'count': N, 'mobiles': [...]} or error dict

def _load_historical_customers():
    """Load and cache unique customer mobiles up to Apr 30 2026."""
    global _HIST_CACHE
    
    # ── Check precomputed JSON cache first ────────────────────────────
    cache_name = 'historical_customers_cache.json'
    if os.path.exists(cache_name):
        try:
            with open(cache_name, 'r') as f:
                _HIST_CACHE = json.load(f)
            print(f'[OK] Historical baseline loaded from {cache_name}')
            return
        except Exception as exc:
            print(f'[WARN] Failed to load {cache_name}: {exc}. Falling back to Excel.')

    fname = 'Kottayam Future Complete Data.xlsx'
    if not os.path.exists(fname):
        _HIST_CACHE = {'error': f'{fname} not found', 'mobiles': [], 'count': 0}
        print(f'[WARN] {fname} not found - repeat/new classification will be unavailable.')
        return

    try:
        print(f'[INFO] Loading historical customer baseline from {fname} ...')
        df = pd.read_excel(fname, dtype=str)
        df.columns = [str(c).strip().lower() for c in df.columns]

        date_col   = next((c for c in df.columns if 'date' in c), None)
        mobile_col = next((c for c in df.columns if 'mobile' in c or 'mob' in c), None)

        if not date_col or not mobile_col:
            _HIST_CACHE = {
                'error': 'Could not find Date or Mobile column',
                'columns': list(df.columns),
                'mobiles': [],
                'count': 0,
            }
            print(f'[WARN] Columns found: {list(df.columns)}')
            return

        df[date_col] = pd.to_datetime(df[date_col], dayfirst=True, errors='coerce')
        df = df.dropna(subset=[date_col, mobile_col])
        df = df[df[mobile_col].str.strip() != '']

        cutoff  = pd.Timestamp('2026-04-30')
        hist    = df[df[date_col] <= cutoff]
        mobiles = hist[mobile_col].str.strip().unique().tolist()

        _HIST_CACHE = {'count': len(mobiles), 'mobiles': mobiles}
        print(f'[OK] Historical baseline ready: {len(mobiles):,} unique customers (up to Apr 30 2026)')

    except Exception as exc:
        _HIST_CACHE = {'error': str(exc), 'mobiles': [], 'count': 0}
        print(f'[ERROR] Error loading historical baseline: {exc}')

# Load at import time (runs once when Flask starts)
_load_historical_customers()


# ---------------------------------------------------------------------------
# Growth Lever Metrics  (computed from same Excel file at startup)
# Lever 01 — Daily Unique Customers (avg unique mobiles per day, last 30 days)
# Lever 02 — Visit Frequency        (avg distinct purchase days per customer
#                                     within the last rolling 30-day window)
# Lever 03 — ATV                    (avg spend per visit = revenue / visits,
#                                     where a visit = 1 day × 1 customer)
# ---------------------------------------------------------------------------
_LEVERS_CACHE = None

TARGETS = {
    'customers': 123,    # +25%  → Daily unique customers
    'frequency': 2.6,    # target visits/month per customer
    'atv':       28102,  # +20%  → Average Transaction Value (₹)
}

def _load_growth_levers():
    """Compute growth lever KPIs from the full Excel dataset."""
    global _LEVERS_CACHE
    
    # ── Check precomputed JSON cache first ────────────────────────────
    cache_name = 'growth_levers_cache.json'
    if os.path.exists(cache_name):
        try:
            with open(cache_name, 'r') as f:
                _LEVERS_CACHE = json.load(f)
            print(f'[OK] Growth Levers loaded from {cache_name}')
            return
        except Exception as exc:
            print(f'[WARN] Failed to load {cache_name}: {exc}. Falling back to Excel.')

    fname = 'Kottayam Future Complete Data.xlsx'
    if not os.path.exists(fname):
        _LEVERS_CACHE = {'error': f'{fname} not found'}
        print(f'[WARN] Growth levers: {fname} not found.')
        return

    try:
        print('[INFO] Computing Growth Lever metrics...')
        df = pd.read_excel(fname, dtype=str)
        df.columns = [str(c).strip().lower() for c in df.columns]

        # ── Column detection ─────────────────────────────────────────────
        date_col   = next((c for c in df.columns if 'date' in c), None)
        mobile_col = next((c for c in df.columns if 'mobile' in c or 'mob' in c), None)
        amount_col = next((c for c in df.columns
                           if any(k in c for k in
                                  ['amount','total','net','value','revenue','bill','sale','price'])
                           ), None)

        if not date_col or not mobile_col:
            _LEVERS_CACHE = {
                'error': 'Required Date/Mobile columns not found',
                'columns': list(df.columns)
            }
            print(f'[WARN] Growth Levers — columns found: {list(df.columns)}')
            return

        # ── Clean ─────────────────────────────────────────────────────────
        df[date_col] = pd.to_datetime(df[date_col], dayfirst=True, errors='coerce')
        df = df.dropna(subset=[date_col, mobile_col])
        df[mobile_col] = df[mobile_col].str.strip()
        df = df[df[mobile_col] != '']

        if amount_col:
            df[amount_col] = pd.to_numeric(df[amount_col], errors='coerce').fillna(0)

        # ── Use last 30 days of available data ───────────────────────────
        max_date    = df[date_col].max()
        window_start = max_date - pd.Timedelta(days=29)
        recent = df[(df[date_col] >= window_start) & (df[date_col] <= max_date)].copy()

        # ── LEVER 01: Daily Unique Customer Count ────────────────────────
        # Average unique mobile numbers per calendar day
        daily_uniq   = recent.groupby(date_col)[mobile_col].nunique()
        avg_customers = round(float(daily_uniq.mean()), 0) if len(daily_uniq) > 0 else 0.0

        # ── LEVER 02: Rolling 30-day Visit Frequency ─────────────────────
        # For each customer: count distinct purchase days within the window
        # Then take the average across all customers who visited at least once
        cust_visit_days = recent.groupby(mobile_col)[date_col].nunique()
        avg_frequency   = round(float(cust_visit_days.mean()), 2) if len(cust_visit_days) > 0 else 0.0

        # ── LEVER 03: ATV ────────────────────────────────────────────────
        # ATV = average bill value per customer per visit
        # One "visit" = (date, mobile) pair
        if amount_col and recent[amount_col].sum() > 0:
            visit_spend = recent.groupby([date_col, mobile_col])[amount_col].sum()
            avg_atv     = round(float(visit_spend.mean()), 0)
        else:
            avg_atv = 1124.0   # fallback if no amount column found

        # ── Progress % (capped at 100) ───────────────────────────────────
        def pct(current, target):
            return round(min((current / target) * 100, 100.0), 1)

        p_cust = pct(avg_customers, TARGETS['customers'])
        p_freq = pct(avg_frequency, TARGETS['frequency'])
        p_atv  = pct(avg_atv,       TARGETS['atv'])

        # ── Full dataset date range (for display label) ──────────────────
        full_min_date = df[date_col].min()
        full_max_date = df[date_col].max()

        _LEVERS_CACHE = {
            'data_period': f"{full_min_date.strftime('%b %Y')} – {full_max_date.strftime('%b %Y')}",
            'monthly_revenue_estimate': round(
                avg_customers * avg_frequency * avg_atv * 30 / 1e7, 2
            ),  # ₹ Cr
            'levers': {
                'customers': {
                    'label':    'More Customers',
                    'number':   '01',
                    'current':  int(avg_customers),
                    'target':   TARGETS['customers'],
                    'current_fmt': f"{int(avg_customers):,}/day",
                    'target_fmt':  f"123/day (+25%)",
                    'progress': p_cust,
                    'status':   'On Track' if p_cust >= 60 else 'Needs Action',
                    'status_cls': 'yellow' if p_cust >= 60 else 'red',
                },
                'frequency': {
                    'label':    'Higher Frequency',
                    'number':   '02',
                    'current':  avg_frequency,
                    'target':   TARGETS['frequency'],
                    'current_fmt': f"{avg_frequency} visits/mo",
                    'target_fmt':  '2.6 visits/mo',
                    'progress': p_freq,
                    'status':   'On Track' if p_freq >= 60 else 'Needs Action',
                    'status_cls': 'yellow' if p_freq >= 60 else 'red',
                },
                'atv': {
                    'label':    'Larger Basket Size',
                    'number':   '03',
                    'current':  int(avg_atv),
                    'target':   TARGETS['atv'],
                    'current_fmt': f"₹{int(avg_atv):,}",
                    'target_fmt':  '₹28,102 (+20%)',
                    'progress': p_atv,
                    'status':   'On Track' if p_atv >= 60 else 'Needs Action',
                    'status_cls': 'yellow' if p_atv >= 60 else 'red',
                },
            },
        }
        print(f'[OK] Growth Levers: Customers={int(avg_customers)}/day | '
              f'Freq={avg_frequency} visits/mo | ATV=Rs.{int(avg_atv):,}')

    except Exception as exc:
        _LEVERS_CACHE = {'error': str(exc)}
        print(f'[ERROR] Growth Lever computation failed: {exc}')


_load_growth_levers()


# ---------------------------------------------------------------------------
# Serve static files (index.html, CSS, JS) from the dashboard folder
# ---------------------------------------------------------------------------
@app.route('/')
def index():
    return send_from_directory('.', 'index.html')


@app.route('/api/data/historical_customers')
def historical_customers():
    """Return cached set of unique customer mobiles who transacted up to Apr 30 2026."""
    if _HIST_CACHE is None:
        return jsonify({'error': 'Cache not ready', 'mobiles': [], 'count': 0}), 503
    return jsonify(_HIST_CACHE)


@app.route('/api/data/growth_levers')
def growth_levers():
    """Return computed Growth Lever KPIs from the real dataset."""
    if _LEVERS_CACHE is None:
        return jsonify({'error': 'Cache not ready'}), 503
    if 'error' in _LEVERS_CACHE:
        return jsonify(_LEVERS_CACHE), 500
    return jsonify(_LEVERS_CACHE)






# ===========================================================================
# ── app.js DATA  (Executive + Sales tabs) ───────────────────────────────────
# ===========================================================================

@app.route('/api/insights/ticker')
def insights_ticker():
    """AI Insight Engine ticker items."""
    return jsonify([
        { 'type': 'anomaly',     'text': '🚨 Feb 2026 revenue dropped to ₹4.99Cr — lowest month. Root cause: post-holiday slowdown + reduced new customer acquisition' },
        { 'type': 'positive',   'text': '✅ April 2026 is the best month at ₹7.22Cr — driven by strong Consumer Electronics demand' },
        { 'type': 'correlation','text': '🔗 Sep 2025 spike ₹9.65Cr linked to Onam festival — stock up Telecom & CE categories by Aug each year' },
        { 'type': 'anomaly',    'text': '🚨 Tuesday avg ₹20.0L — weakest day vs Saturday ₹30.7L. Consider Tuesday-specific promotions' },
        { 'type': 'positive',   'text': '✅ ATV growing consistently: ₹9,224 (Aug) → ₹18,723 (Apr 26) — customers upgrading to premium products' },
        { 'type': 'correlation','text': '🔗 90.5% of 2025 cohort never returned — Day-30 reactivation campaign is highest priority action' },
        { 'type': 'anomaly',    'text': '🚨 10,952 customers (44.6%) not visited in 181-365 days — ₹20.57Cr revenue dormant and at risk' },
        { 'type': 'positive',   'text': '✅ Repeat % rising: 0% (Aug 25) → 11.6% (NDJ26) → 17.3% (FMA26) → 25.3% (May MTD) — loyalty improving' },
        { 'type': 'correlation','text': '🔗 Top 20% customers (4,914) drive 60.4% of revenue at avg ₹75,879 spend — protect Champions segment' },
    ])


@app.route('/api/insights/cards')
def insights_cards():
    """Weekly insight cards (anomaly/correlation/warning/positive)."""
    return jsonify([
        {
            'type': 'anomaly', 'tag': '⚡ Anomaly Detected',
            'text': 'Tuesday sales dropped 18% vs. 4-week average (₹22.4L vs ₹27.3L). Likely linked to competitor flash sale.',
            'action': '→ View competitive pricing dashboard',
            'detail': '<b>Root Cause Analysis:</b><br>Competitor "FreshMart" ran a 15% discount on staples on Tuesday. Our Tuesday staples revenue fell ₹4.9L. Recommend: dynamic pricing alert on top 50 SKUs, match within 24hr window.<br><br><b>Action Items:</b><ul><li>Set up weekly competitor price scrape</li><li>Enable staff to offer 5% match on spot</li></ul>'
        },
        {
            'type': 'correlation', 'tag': '🔗 Correlation Alert',
            'text': 'ATV increased ₹94 (+8.3%) but footfall dropped 6%. Premium customers staying, value seekers leaving.',
            'action': '→ Explore customer segmentation',
            'detail': '<b>Insight:</b> Your top 20% customers (ATV > ₹2,000) are stable. Mid-tier (₹800–₹1,200) visiting less. Likely price-sensitive to recent MRP revisions.<br><br><b>Recommended Action:</b> Launch "Value Tuesday" promotion for mid-tier segment to recover footfall without hurting ATV.'
        },
        {
            'type': 'warning', 'tag': '📦 Inventory Alert',
            'text': 'Top 3 SKUs for weekly revenue delta: Basmati Rice 5kg (+₹1.2L), Coconut Oil 1L (+₹0.8L), Atta 10kg (+₹0.7L).',
            'action': '→ Open Inventory War Room',
            'detail': '<b>Stock Status:</b><br>Basmati Rice 5kg: 42 units left (3 days cover) — <b>REORDER NOW</b><br>Coconut Oil 1L: 180 units (12 days cover) — OK<br>Atta 10kg: 95 units (6 days cover) — Monitor<br><br>Estimated lost sales if stock-out occurs: ₹2.8L/week.'
        },
        {
            'type': 'positive', 'tag': '✅ Growth Signal',
            'text': 'Evening shift (5–8 PM) generates ATV of ₹1,340 vs morning shift ₹940 — 43% higher basket size.',
            'action': '→ View shift analytics',
            'detail': '<b>Shift ATV Breakdown:</b><br>Morning (9AM–1PM): ₹940 ATV, 28% conversion<br>Afternoon (1PM–5PM): ₹1,080 ATV, 32% conversion<br>Evening (5PM–9PM): ₹1,340 ATV, 41% conversion<br><br><b>Recommendation:</b> Deploy 2 additional experienced staff in evening shift. Consider bundled offers at 6–7 PM peak.'
        },
        {
            'type': 'warning', 'tag': '💸 Discount Watch',
            'text': 'Discount rate grew from 8.2% to 8.6% (+0.4 pts) while revenue grew 4%. Discounting pace is outrunning growth.',
            'action': '→ Review promotion ROI',
            'detail': '<b>Discount Breakdown by Category:</b><br>FMCG: 12.4% avg discount<br>Apparel: 18.2% avg discount (High!)<br>Electronics: 6.1% avg discount<br><br><b>Action:</b> Cap apparel discount at 15% max. Switch to bundled promotions instead of percentage cuts.'
        },
        {
            'type': 'correlation', 'tag': '🔗 Lost Sales Alert',
            'text': 'Stock-outs caused an estimated ₹3.8L in lost sales this week across 23 SKU incidents.',
            'action': '→ View stock-out tracker',
            'detail': '<b>Top Stock-out Incidents:</b><br>1. Premium Basmati 5kg — ₹82,000 lost<br>2. Sunflower Oil 5L — ₹61,000 lost<br>3. Ariel 3kg — ₹44,000 lost<br><br>Systemic issue: reorder points set at 7-day cover but lead time is 10 days. Adjust safety stock formula.'
        },
    ])


@app.route('/api/charts/sparklines')
def sparklines():
    """KPI sparkline data for the executive header cards."""
    return jsonify({
        'revenue':  [6.21, 6.78, 5.85, 4.99, 6.80, 7.22],   # ₹Cr Nov→Apr
        'gap':      [3.79, 3.22, 4.15, 5.01, 3.20, 2.78],   # Gap to ₹10Cr
        'footfall': [118,  126,  110,  103,  119,  128],     # Daily invoices
        'atv':      [16601,17901,17686,16178,18404,18723],   # ₹ ATV
        'gm':       [0,    11.6, 11.6, 17.3, 17.3, 25.3],   # Repeat %
        'conv':     [0,    866,  866,  1241, 1241, 231],     # Repeat customers
    })


@app.route('/api/charts/revenue_target')
def chart_revenue_target():
    """Monthly Revenue vs Target (Aug 25 – Jul 26)."""
    return jsonify({
        'labels':  ['Aug 25','Sep 25','Oct 25','Nov 25','Dec 25','Jan 26','Feb 26','Mar 26','Apr 26','May 26*','Jun 26','Jul 26'],
        'actual':  [5.93, 9.65, 5.99, 6.21, 6.78, 5.85, 4.99, 6.80, 7.22, 5.67, None, None],
        'target':  [7.0,  7.2,  7.4,  7.6,  7.8,  8.0,  8.2,  8.5,  8.8,  9.0,  9.5,  10.0],
    })


@app.route('/api/charts/growth_levers')
def chart_growth_levers():
    """Radar chart — current vs target growth levers."""
    return jsonify({
        'labels':  ['Footfall Growth', 'Visit Frequency', 'Basket Size', 'Margin Mix', 'Conversion Rate'],
        'current': [68, 42, 55, 36, 60],
        'target':  [100,100,100,100,100],
    })


@app.route('/api/charts/seasonal')
def chart_seasonal():
    """Monthly seasonal revenue index + festival events."""
    months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
    index  = [110,  88,   92,  115,   95,   98,  105,   88,  142,  128,  112,  148]
    events = ['NRI Peak','','Vishu','Easter','','','Bakrid','','Onam','','','Christmas']
    return jsonify({'labels': months, 'index': index, 'events': events})


@app.route('/api/charts/profitability')
def chart_profitability():
    """Profitability waterfall (₹L)."""
    return jsonify({
        'labels': ['Revenue','COGS','Gross Profit','Opex','Rent','Marketing','Net Profit'],
        'values': [624, 428, 196, 62, 28, 18, 88],
    })


@app.route('/api/charts/payment_mix')
def chart_payment_mix():
    """Payment method mix (%)."""
    return jsonify({
        'labels': ['UPI / QR', 'Debit Card', 'Credit Card', 'Cash', 'Loyalty Points'],
        'values': [48, 22, 14, 12, 4],
    })


# ── Sales Tab ──────────────────────────────────────────────────────────────

@app.route('/api/charts/hourly')
def chart_hourly():
    """Hourly revenue heatmap by day of week (₹L)."""
    return jsonify({
        'hours': ['9AM','10','11','12','1PM','2','3','4','5','6','7','8PM'],
        'days':  ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'],
        'data': [
            [12,14,16,18,22,18,16,20,28,32,30,24],  # Mon
            [10,12,13,15,18,14,12,16,22,26,24,18],  # Tue
            [14,16,18,20,24,20,18,22,30,34,32,26],  # Wed
            [13,15,17,19,23,19,17,21,29,33,31,25],  # Thu
            [16,18,20,22,26,22,20,24,32,36,34,28],  # Fri
            [22,26,28,30,34,30,28,32,40,44,42,36],  # Sat
            [18,22,24,26,30,26,24,28,36,40,38,32],  # Sun
        ],
    })


@app.route('/api/charts/daywise')
def chart_daywise():
    """Average weekly revenue by day (₹L)."""
    return jsonify({
        'labels': ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'],
        'values': [21.6, 20.0, 20.9, 22.3, 21.2, 30.7, 27.3],
    })


@app.route('/api/charts/category')
def chart_category():
    """Revenue and share by product category."""
    return jsonify({
        'labels':        ['Telecom','Consumer Electronics','IT / Computers','Accessories','Value Added Svc','Others'],
        'revenue_cr':    [26.79, 24.64, 6.26, 2.88, 0.76, 0.26],
        'revenue_share': [43.4,  39.9,  10.2, 4.7,  1.2,  0.4],
    })


@app.route('/api/charts/monthly_trend')
def chart_monthly_trend():
    """Month-over-month revenue trend (₹Cr)."""
    return jsonify({
        'labels': ['Aug 25','Sep 25','Oct 25','Nov 25','Dec 25','Jan 26','Feb 26','Mar 26','Apr 26'],
        'values': [5.93,   9.65,   5.99,   6.21,   6.78,   5.85,   4.99,   6.80,   7.22],
        'target': 10,
    })


@app.route('/api/data/shifts')
def data_shifts():
    """Shift-wise performance table."""
    return jsonify([
        { 'shift':'Morning  9AM–1PM',  'staff':8,  'footfall':520, 'conv':28.4, 'atv':940,  'rph':82400,  'status':'Average' },
        { 'shift':'Afternoon 1PM–5PM', 'staff':10, 'footfall':610, 'conv':32.1, 'atv':1080, 'rph':95600,  'status':'Good'    },
        { 'shift':'Evening  5PM–9PM',  'staff':12, 'footfall':712, 'conv':41.2, 'atv':1340, 'rph':142800, 'status':'Best'    },
    ])


# ===========================================================================
# ── app2.js DATA  (Customer 360 + Inventory + Growth tabs) ─────────────────
# ===========================================================================

# ── Customer 360 ───────────────────────────────────────────────────────────

@app.route('/api/charts/cohort')
def chart_cohort():
    """Monthly cohort retention curves (%)."""
    return jsonify({
        'labels': ['Month 0','Month 1','Month 2','Month 3','Month 4','Month 5'],
        'datasets': [
            { 'label':'Nov Cohort', 'data':[100,62,48,38,31,28],  'color':'#3b82f6' },
            { 'label':'Oct Cohort', 'data':[100,58,44,35,29,None],'color':'#f97316' },
            { 'label':'Sep Cohort', 'data':[100,64,50,40,None,None],'color':'#14b8a6'},
            { 'label':'Aug Cohort', 'data':[100,61,47,None,None,None],'color':'#f59e0b'},
        ]
    })


@app.route('/api/charts/new_repeat')
def chart_new_repeat():
    """New vs Repeat customer stacked bar."""
    return jsonify({
        'labels':  ['Jun','Jul','Aug','Sep','Oct','Nov','Dec','Jan'],
        'new':     [880,  920, 960, 1010,1080,1120,1180,1240],
        'repeat':  [1640,1720,1780,1820,1900,1960,2040,2080],
    })


@app.route('/api/charts/frequency')
def chart_frequency():
    """Visit frequency distribution."""
    return jsonify({
        'labels': ['1x/month','2x/month','3x/month','4x/month','5x+/month'],
        'values': [3240, 2180, 1420, 680, 340],
    })


@app.route('/api/charts/nri')
def chart_nri():
    """NRI segment monthly revenue (₹L)."""
    return jsonify({
        'labels': ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'],
        'values': [48,   12,   8,   10,   9,   18,  22,  14,  10,  12,  16,  42],
    })


@app.route('/api/charts/loyalty')
def chart_loyalty():
    """Loyalty engagement donut."""
    return jsonify({
        'labels': ['Active Redeemers','Points Earned Only','Enrolled Not Active','Non-Loyalty'],
        'values': [28, 34, 18, 20],
    })


@app.route('/api/data/geo')
def data_geo():
    """Geographic customer distribution table."""
    return jsonify([
        { 'area':'Kottayam Town',   'share':42, 'atv':1240, 'delivery':320, 'growth':'+8.2%'  },
        { 'area':'Changanassery',   'share':14, 'atv':1080, 'delivery':840, 'growth':'+14.6%' },
        { 'area':'Pala',            'share':11, 'atv':1120, 'delivery':620, 'growth':'+11.2%' },
        { 'area':'Ettumanoor',      'share':9,  'atv':980,  'delivery':410, 'growth':'+9.8%'  },
        { 'area':'Kanjirappally',   'share':7,  'atv':960,  'delivery':280, 'growth':'+6.4%'  },
        { 'area':'Other / Walk-in', 'share':17, 'atv':820,  'delivery':0,   'growth':'+3.1%'  },
    ])


# ── Inventory War Room ──────────────────────────────────────────────────────

@app.route('/api/charts/inventory_turnover')
def chart_inventory_turnover():
    """Inventory turnover vs gross margin by category."""
    return jsonify({
        'categories': ['Staples','Dairy','Personal Care','Beverages','Snacks','Home Care','Apparel','Electronics'],
        'turnover':   [9.2,  14.8, 6.4, 8.1, 7.2, 4.8, 2.9, 1.8],
        'margin':     [22,   18,   38,  32,  35,  28,  44,  18],
    })


@app.route('/api/charts/stockout')
def chart_stockout():
    """Stock-out incidents by category."""
    return jsonify({
        'labels': ['Staples','Dairy','Personal Care','Beverages','Snacks','Home Care'],
        'values': [8, 4, 3, 3, 2, 3],
    })


@app.route('/api/data/top_skus')
def data_top_skus():
    """Top 10 SKUs by revenue with stock alert status."""
    return jsonify([
        { 'rank':1,  'sku':'Basmati Rice 5kg',           'cat':'Staples',       'rev':'₹4.8L', 'margin':'22%', 'days':3,  'alert':'reorder' },
        { 'rank':2,  'sku':'Coconut Oil 1L (Parachute)',  'cat':'Staples',       'rev':'₹3.6L', 'margin':'18%', 'days':12, 'alert':'ok'      },
        { 'rank':3,  'sku':'Ariel Powder 3kg',            'cat':'Home Care',     'rev':'₹2.8L', 'margin':'28%', 'days':6,  'alert':'low'     },
        { 'rank':4,  'sku':'Aashirvaad Atta 10kg',        'cat':'Staples',       'rev':'₹2.6L', 'margin':'20%', 'days':8,  'alert':'ok'      },
        { 'rank':5,  'sku':'Sunflower Oil 5L',            'cat':'Staples',       'rev':'₹2.4L', 'margin':'16%', 'days':4,  'alert':'reorder' },
        { 'rank':6,  'sku':'Dove Shampoo 650ml',          'cat':'Personal Care', 'rev':'₹2.2L', 'margin':'38%', 'days':18, 'alert':'ok'      },
        { 'rank':7,  'sku':'Tata Tea Premium 500g',       'cat':'Beverages',     'rev':'₹2.0L', 'margin':'30%', 'days':14, 'alert':'ok'      },
        { 'rank':8,  'sku':'Surf Excel 3kg',              'cat':'Home Care',     'rev':'₹1.9L', 'margin':'26%', 'days':9,  'alert':'low'     },
        { 'rank':9,  'sku':'Colgate Total 300g',          'cat':'Personal Care', 'rev':'₹1.8L', 'margin':'35%', 'days':22, 'alert':'ok'      },
        { 'rank':10, 'sku':'Hide & Seek Biscuits 400g',   'cat':'Snacks',        'rev':'₹1.7L', 'margin':'34%', 'days':16, 'alert':'ok'      },
    ])


# ── Growth Experiments ──────────────────────────────────────────────────────

@app.route('/api/charts/marketing_roi')
def chart_marketing_roi():
    """Marketing channel CAC vs Revenue attributed."""
    return jsonify({
        'channels': ['WhatsApp Broadcast','Google Ads','Instagram','Newspaper Ads','SMS Campaigns','Loyalty Referral','In-store POS'],
        'cac':      [84,  320, 280, 480, 210, 140,  60],
        'revenue':  [8.2, 4.2, 3.8, 2.1, 4.8, 6.4, 12.1],
    })


@app.route('/api/charts/attribution')
def chart_attribution():
    """Campaign revenue attribution donut (%)."""
    return jsonify({
        'labels': ['WhatsApp','In-store Upsell','Loyalty Referral','Google Ads','Instagram','SMS','Organic / Walk-in'],
        'values': [24, 22, 16, 12, 8, 6, 12],
    })


@app.route('/api/charts/forecast')
def chart_forecast():
    """90-day predictive revenue forecast (₹Cr)."""
    from datetime import datetime, timedelta
    base       = [6.24,6.31,6.38,6.44,6.50,6.57,6.65,6.80,6.95,7.10,7.28,7.42,7.55,7.70,7.82,7.90,7.96,8.04]
    upper      = [round(v + 0.18 + i * 0.015, 2) for i, v in enumerate(base)]
    lower      = [round(v - 0.14 - i * 0.01,  2) for i, v in enumerate(base)]
    start      = datetime(2026, 5, 12)
    labels     = [(start + timedelta(days=i*5)).strftime('%d %b') for i in range(len(base))]
    return jsonify({'labels': labels, 'base': base, 'upper': upper, 'lower': lower, 'target': 10})


@app.route('/api/charts/delivery')
def chart_delivery():
    """Delivery orders by town (₹L stacked)."""
    return jsonify({
        'labels':        ['Feb','Mar','Apr','May'],
        'kottayam':      [42, 48, 52, 58],
        'changanassery': [18, 22, 28, 34],
        'pala':          [12, 14, 18, 22],
        'ettumanoor':    [8,  10, 12, 16],
    })


@app.route('/api/data/ab_tests')
def data_ab_tests():
    """A/B experiment results."""
    return jsonify([
        { 'name':'Bundle Offer: Oil+Atta+Dal',  'status':'running', 'lift':'+9.2% ATV',                  'conf':'82% confidence', 'days':'Day 14/21'  },
        { 'name':'Evening Happy Hour 6–7 PM',   'status':'winner',  'lift':'+22% footfall in slot',       'conf':'96% confidence', 'days':'Concluded'  },
        { 'name':'WhatsApp Reminder vs SMS',    'status':'running', 'lift':'+6.1% open rate WA',          'conf':'74% confidence', 'days':'Day 7/14'   },
        { 'name':'Premium Shelf Placement',     'status':'neutral', 'lift':'+1.2% margin (insignificant)','conf':'41% confidence', 'days':'Day 21/21'  },
    ])


@app.route('/api/data/campaigns')
def data_campaigns():
    """Campaign performance table."""
    return jsonify([
        { 'name':'Onam Preview Sale',    'channel':'WhatsApp',  'spend':'28,400', 'reach':'12,400', 'conv':1480, 'cac':19,  'rev':'8,20,000', 'roas':'28.9x' },
        { 'name':'Google Local Ads',     'channel':'Google',    'spend':'42,000', 'reach':'38,000', 'conv':360,  'cac':117, 'rev':'3,60,000', 'roas':'8.6x'  },
        { 'name':'Instagram Reel Boost', 'channel':'Instagram', 'spend':'18,000', 'reach':'24,000', 'conv':180,  'cac':100, 'rev':'2,10,000', 'roas':'11.7x' },
        { 'name':'Newspaper Insert',     'channel':'Print',     'spend':'36,000', 'reach':'60,000', 'conv':120,  'cac':300, 'rev':'1,80,000', 'roas':'5.0x'  },
        { 'name':'Loyalty Referral',     'channel':'Loyalty',   'spend':'12,000', 'reach':'8,400',  'conv':340,  'cac':35,  'rev':'4,80,000', 'roas':'40.0x' },
        { 'name':'SMS Blast — Festive',  'channel':'SMS',       'spend':'8,200',  'reach':'9,200',  'conv':180,  'cac':46,  'rev':'2,40,000', 'roas':'29.3x' },
    ])


# ---------------------------------------------------------------------------
# Cohort CSV Download
# ---------------------------------------------------------------------------
@app.route('/api/download/cohort/<cohort_month>/<int:retention_month>')
def download_cohort_data(cohort_month, retention_month):
    """Downloads raw customer data for a specific cohort and retention month."""
    try:
        # Load pre-processed export data
        df = pd.read_csv('cohorts_export.csv')
        
        # Filter down to just the requested month
        filtered = df[(df['Cohort'] == cohort_month) & (df['Retention_Month'] == retention_month)]
        
        # Format the CSV
        csv_data = filtered.to_csv(index=False)
        
        # Return as a downloadable file
        return Response(
            csv_data,
            mimetype='text/csv',
            headers={'Content-disposition': f'attachment; filename=Kottayam_Cohort_{cohort_month}_M{retention_month}.csv'}
        )
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/download/cohort/<cohort_month>/no-return')
def download_noreturn_data(cohort_month):
    """Downloads raw customer data for users who purchased in M0 but never returned."""
    try:
        df = pd.read_csv('cohorts_export.csv')
        cohort_df = df[df['Cohort'] == cohort_month]
        
        # Customers who purchased in M0
        m0_customers = cohort_df[cohort_df['Retention_Month'] == 0]['Customer Mobile'].unique()
        
        # Customers who purchased in M1+ (Retention_Month > 0)
        returned_customers = cohort_df[cohort_df['Retention_Month'] > 0]['Customer Mobile'].unique()
        
        # No-return customers are those in M0 who are NOT in M1+
        no_return_mobiles = set(m0_customers) - set(returned_customers)
        
        filtered = cohort_df[(cohort_df['Retention_Month'] == 0) & (cohort_df['Customer Mobile'].isin(no_return_mobiles))]
        
        csv_data = filtered.to_csv(index=False)
        return Response(
            csv_data,
            mimetype='text/csv',
            headers={'Content-disposition': f'attachment; filename=Kottayam_Cohort_{cohort_month}_NoReturn.csv'}
        )
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ---------------------------------------------------------------------------
# Cached Complete Data Attribution Endpoint
# ---------------------------------------------------------------------------
_BASE_MOBILES_CACHE = None

@app.route('/api/base_mobiles')
def api_base_mobiles():
    global _BASE_MOBILES_CACHE
    if _BASE_MOBILES_CACHE is not None:
        return jsonify(_BASE_MOBILES_CACHE)
    
    # ── Check precomputed JSON cache first ────────────────────────────
    cache_name = 'base_mobiles_cache.json'
    if os.path.exists(cache_name):
        try:
            with open(cache_name, 'r') as f:
                _BASE_MOBILES_CACHE = json.load(f)
            print(f'[OK] Base mobiles cache loaded from {cache_name}')
            return jsonify(_BASE_MOBILES_CACHE)
        except Exception as exc:
            print(f'[WARN] Failed to load {cache_name}: {exc}. Falling back to Excel.')

    import os
    import pandas as pd
    fname = 'Kottayam Complete Data till April 27.xlsx'
    if not os.path.exists(fname):
        return jsonify({'error': f'{fname} not found'}), 404
    try:
        print(f"[INFO] Pre-loading customer base from {fname} ...")
        df = pd.read_excel(fname, dtype=str)
        df.columns = [str(c).strip().lower() for c in df.columns]
        mobile_col = next((c for c in df.columns if 'mobile' in c or 'mob' in c or 'phone' in c or 'contact' in c), None)
        if not mobile_col:
            mobile_col = df.columns[0]
        
        # Clean and normalize mobiles
        mobiles = df[mobile_col].dropna().astype(str).str.replace(r'\s+', '', regex=True).str.replace(r'[-()+]', '', regex=True).str.strip()
        
        # Strip .0 decimal parts if any
        mobiles = mobiles.str.split('.').str[0]
        
        # Normalize: Strip 91 country prefix if 12 digits
        def clean_pref(val):
            if len(val) == 12 and val.startswith('91'):
                return val[2:]
            return val
        mobiles = mobiles.apply(clean_pref)
        
        moblist = mobiles[mobiles != ''].unique().tolist()
        
        _BASE_MOBILES_CACHE = {'mobiles': moblist, 'filename': fname, 'count': len(moblist)}
        print(f"[OK] Preloaded base data cache ready: {len(moblist):,} unique customer mobiles.")
        return jsonify(_BASE_MOBILES_CACHE)
    except Exception as e:
        print(f"[ERROR] Failed to load {fname}: {e}")
        return jsonify({'error': str(e)}), 500


# ---------------------------------------------------------------------------
# Health check
# ---------------------------------------------------------------------------
@app.route('/health')
def health():
    return jsonify({'status': 'ok'}), 200


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------
if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5001))
    print(f"Starting Kottayam Dashboard server on http://localhost:{port}")
    app.run(host='0.0.0.0', port=port, debug=True, use_reloader=True)
# Trigger reload after data source update: 2026-05-25 14:08:00


