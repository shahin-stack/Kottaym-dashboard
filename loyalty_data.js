/* loyalty_data.js — Real data extracted from Kottayam Future Complete Data.xlsx (up to Apr 27 2026) */
const D = {
  /* ── MONTHLY COHORT (actual from data, unit = unique visit days) ──
     Single-purchase customers: 19,359 / 23,741 = 81.5%
     Multi-purchase (returned at least once): 4,382 / 23,741 = 18.5%
     Note: "single" = customers who only ever visited on 1 unique date across entire history.
           Apr 2026 cohort shows ~93% because not enough time has passed yet.
  */
  monthlyCohort: [
    { cohort:'2025-08', size:4037, single:2922, singlePct:72.4, m1:11.7, m2:3.4, m3:3.0, m4:2.6, m5:2.4, m6:2.1 },
    { cohort:'2025-09', size:4772, single:3812, singlePct:79.9, m1:3.9, m2:2.7, m3:2.8, m4:2.4, m5:2.1, m6:2.5 },
    { cohort:'2025-10', size:2527, single:2030, singlePct:80.3, m1:5.4, m2:3.6, m3:2.7, m4:2.7, m5:3.2, m6:2.5 },
    { cohort:'2025-11', size:2352, single:1895, singlePct:80.6, m1:4.5, m2:2.9, m3:3.1, m4:2.6, m5:2.6, m6:null },
    { cohort:'2025-12', size:2360, single:1981, singlePct:83.9, m1:5.3, m2:2.4, m3:2.7, m4:2.0, m5:null, m6:null },
    { cohort:'2026-01', size:1917, single:1621, singlePct:84.6, m1:3.9, m2:3.3, m3:2.1, m4:null, m5:null, m6:null },
    { cohort:'2026-02', size:1767, single:1492, singlePct:84.4, m1:6.2, m2:3.0, m3:null, m4:null, m5:null, m6:null },
    { cohort:'2026-03', size:2011, single:1750, singlePct:87.0, m1:4.5, m2:null, m3:null, m4:null, m5:null, m6:null },
    { cohort:'2026-04', size:1998, single:1856, singlePct:92.9, m1:null, m2:null, m3:null, m4:null, m5:null, m6:null },
  ],
  /* Revenue per cohort (in Lakhs: M0 = acquisition month spend, M1 = next-month spend) */
  cohortRevenue: [
    { cohort:'2025-08', m0Rev:592.7, m1Rev:48.4, m2Rev:20.9, m3Rev:16.3, m4Rev:17.0, m5Rev:14.9, m6Rev:13.4 },
    { cohort:'2025-09', m0Rev:916.9, m1Rev:34.8, m2Rev:27.9, m3Rev:37.4, m4Rev:24.1, m5Rev:25.1, m6Rev:28.4 },
    { cohort:'2025-10', m0Rev:543.0, m1Rev:20.4, m2Rev:14.0, m3Rev:16.9, m4Rev:12.1, m5Rev:19.2, m6Rev:14.7 },
    { cohort:'2025-11', m0Rev:556.4, m1Rev:15.7, m2Rev:17.8, m3Rev:12.8, m4Rev:13.0, m5Rev:10.4, m6Rev:null },
    { cohort:'2025-12', m0Rev:594.0, m1Rev:21.2, m2Rev:7.3,  m3Rev:13.8, m4Rev:8.8,  m5Rev:null, m6Rev:null },
    { cohort:'2026-01', m0Rev:489.8, m1Rev:9.8,  m2Rev:13.2, m3Rev:9.6,  m4Rev:null, m5Rev:null, m6Rev:null },
    { cohort:'2026-02', m0Rev:418.6, m1Rev:19.9, m2Rev:14.4, m3Rev:null, m4Rev:null, m5Rev:null, m6Rev:null },
    { cohort:'2026-03', m0Rev:549.5, m1Rev:15.7, m2Rev:null, m3Rev:null, m4Rev:null, m5Rev:null, m6Rev:null },
    { cohort:'2026-04', m0Rev:540.2, m1Rev:null, m2Rev:null, m3Rev:null, m4Rev:null, m5Rev:null, m6Rev:null },
  ],
  /* Summary stats from data */
  cohortSummary: { totalCustomers:23741, singlePurchase:19359, repeatCustomers:4382, singlePct:81.5, repeatPct:18.5, avgM1Retention:5.7, bestM1Cohort:'2025-08', worstM1Cohort:'2025-09' },
  rfm: {
    total: 23741,
    total_rev_cr: 58.84,
    segments: {
      Champions: { count:3121,  revenue_cr:19.46, share:33.1 },
      Loyal:     { count:3049,  revenue_cr:10.84, share:18.4 },
      Others:    { count:9055,  revenue_cr:11.75, share:20.0 },
      Lost:      { count:4748,  revenue_cr:7.22,  share:12.3 },
      'At Risk': { count:1327,  revenue_cr:5.07,  share:8.6  },
      New:       { count:2441,  revenue_cr:4.51,  share:7.7  }
    },
    quintiles: {
      1: { label:'Top 20%',    n:4749, avg:74855, total_cr:35.55, share:60.4 },
      2: { label:'Next 20%',   n:4748, avg:28926, total_cr:13.73, share:23.3 },
      3: { label:'Middle 20%', n:4748, avg:14667, total_cr:6.96,  share:11.8 },
      4: { label:'Next 20%',   n:4748, avg:4450,  total_cr:2.11,  share:3.6  },
      5: { label:'Bottom 20%', n:4748, avg:1007,  total_cr:0.48,  share:0.8  }
    }
  },
  gap: {
    total:23741, repeat:8453, repeat_pct:35.6, avg_gap:158,
    bands: [
      { label:'1-7 Days',      count:0,     pct:0.0,  rev_cr:0.00,  loyalty:'Very High', action:'Immediate',  priority:'low'  },
      { label:'8-30 Days',     count:1722,  pct:7.3,  rev_cr:6.15,  loyalty:'High',      action:'High',       priority:'med'  },
      { label:'31-60 Days',    count:2501,  pct:10.5, rev_cr:8.29,  loyalty:'High',      action:'Medium',     priority:'med'  },
      { label:'61-90 Days',    count:2136,  pct:9.0,  rev_cr:6.31,  loyalty:'Medium',    action:'Medium',     priority:'med'  },
      { label:'91-180 Days',   count:6358,  pct:26.8, rev_cr:17.36, loyalty:'Medium',    action:'Critical',   priority:'crit' },
      { label:'181-365 Days',  count:11024, pct:46.4, rev_cr:20.73, loyalty:'Low',       action:'Reactivate', priority:'high' },
      { label:'1-2 Years',     count:0,     pct:0,    rev_cr:0,     loyalty:'Very Low',  action:'Reactivate', priority:'low'  },
      { label:'2+ Years',      count:0,     pct:0,    rev_cr:0,     loyalty:'Very Low',  action:'Ignore',     priority:'low'  }
    ]
  },
  quarterly: [
    { key:'JAS25',  name:'JAS 2025 (Jul–Sep)', total:11336, new:11336, repeat:0,    repeat_pct:0.0,  retention_pct:0,   qoq_pct:0,     cum_db:11336, revenue_cr:21.57 },
    { key:'OND25',  name:'OND 2025 (Oct–Dec)', total:7495,  new:6629,  repeat:866,  repeat_pct:11.6, retention_pct:7.6, qoq_pct:-33.9, cum_db:17965, revenue_cr:18.84 },
    { key:'JFM26',  name:'JFM 2026 (Jan–Mar)', total:6994,  new:5776,  repeat:1218, repeat_pct:17.4, retention_pct:9.0, qoq_pct:-6.7,  cum_db:23741, revenue_cr:18.43 },
  ],
  categoryProjections: {
    "CONSUMER ELECTRONICS": {
      "total_qty": 35617, "total_sales_cr": 23.443,
      "avg_qty": 3957, "avg_sales_cr": 2.605,
      "recent_avg_qty": 3345, "recent_avg_sales_cr": 2.825,
      "proj_qty": 4633, "proj_sales_cr": 3.913,
      "monthly_data": {
        "2025-08":{"qty":7580,"sales_cr":2.82},
        "2025-09":{"qty":5868,"sales_cr":3.782},
        "2025-10":{"qty":2293,"sales_cr":1.703},
        "2025-11":{"qty":3852,"sales_cr":2.38},
        "2025-12":{"qty":3153,"sales_cr":2.515},
        "2026-01":{"qty":2835,"sales_cr":1.768},
        "2026-02":{"qty":2732,"sales_cr":1.954},
        "2026-03":{"qty":3618,"sales_cr":2.975},
        "2026-04":{"qty":3686,"sales_cr":3.546}
      }
    },
    "TELECOM": {
      "total_qty": 8500, "total_sales_cr": 25.558,
      "avg_qty": 944, "avg_sales_cr": 2.84,
      "recent_avg_qty": 676, "recent_avg_sales_cr": 2.426,
      "proj_qty": 936, "proj_sales_cr": 3.361,
      "monthly_data": {
        "2025-08":{"qty":904,"sales_cr":2.125},
        "2025-09":{"qty":1716,"sales_cr":4.373},
        "2025-10":{"qty":1141,"sales_cr":2.999},
        "2025-11":{"qty":958,"sales_cr":2.636},
        "2025-12":{"qty":932,"sales_cr":3.105},
        "2026-01":{"qty":821,"sales_cr":3.041},
        "2026-02":{"qty":661,"sales_cr":2.121},
        "2026-03":{"qty":729,"sales_cr":2.88},
        "2026-04":{"qty":638,"sales_cr":2.278}
      }
    },
    "IT": {
      "total_qty": 1393, "total_sales_cr": 6.052,
      "avg_qty": 155, "avg_sales_cr": 0.672,
      "recent_avg_qty": 108, "recent_avg_sales_cr": 0.534,
      "proj_qty": 150, "proj_sales_cr": 0.739,
      "monthly_data": {
        "2025-08":{"qty":153,"sales_cr":0.697},
        "2025-09":{"qty":231,"sales_cr":1.107},
        "2025-10":{"qty":224,"sales_cr":0.769},
        "2025-11":{"qty":172,"sales_cr":0.615},
        "2025-12":{"qty":142,"sales_cr":0.657},
        "2026-01":{"qty":147,"sales_cr":0.604},
        "2026-02":{"qty":128,"sales_cr":0.555},
        "2026-03":{"qty":116,"sales_cr":0.581},
        "2026-04":{"qty":80,"sales_cr":0.466}
      }
    },
    "ACCESSORIES": {
      "total_qty": 20844, "total_sales_cr": 2.732,
      "avg_qty": 2316, "avg_sales_cr": 0.304,
      "recent_avg_qty": 1496, "recent_avg_sales_cr": 0.237,
      "proj_qty": 2072, "proj_sales_cr": 0.329,
      "monthly_data": {
        "2025-08":{"qty":2346,"sales_cr":0.28},
        "2025-09":{"qty":4189,"sales_cr":0.337},
        "2025-10":{"qty":2637,"sales_cr":0.331},
        "2025-11":{"qty":3005,"sales_cr":0.385},
        "2025-12":{"qty":2013,"sales_cr":0.359},
        "2026-01":{"qty":2166,"sales_cr":0.33},
        "2026-02":{"qty":1653,"sales_cr":0.242},
        "2026-03":{"qty":1506,"sales_cr":0.256},
        "2026-04":{"qty":1329,"sales_cr":0.213}
      }
    },
    "VALUE ADDED SERVICE": {
      "total_qty": 4357, "total_sales_cr": 0.721,
      "avg_qty": 484, "avg_sales_cr": 0.08,
      "recent_avg_qty": 446, "recent_avg_sales_cr": 0.089,
      "proj_qty": 618, "proj_sales_cr": 0.124,
      "monthly_data": {
        "2025-08":{"qty":190,"sales_cr":0.02},
        "2025-09":{"qty":323,"sales_cr":0.04},
        "2025-10":{"qty":862,"sales_cr":0.109},
        "2025-11":{"qty":644,"sales_cr":0.11},
        "2025-12":{"qty":574,"sales_cr":0.097},
        "2026-01":{"qty":426,"sales_cr":0.078},
        "2026-02":{"qty":438,"sales_cr":0.078},
        "2026-03":{"qty":504,"sales_cr":0.097},
        "2026-04":{"qty":396,"sales_cr":0.092}
      }
    },
    "ENDPOINT PROTECTION": {
      "total_qty": 1677, "total_sales_cr": 0.093,
      "avg_qty": 186, "avg_sales_cr": 0.01,
      "recent_avg_qty": 179, "recent_avg_sales_cr": 0.009,
      "proj_qty": 248, "proj_sales_cr": 0.013,
      "monthly_data": {
        "2025-08":{"qty":16,"sales_cr":0.001},
        "2025-09":{"qty":78,"sales_cr":0.007},
        "2025-10":{"qty":307,"sales_cr":0.018},
        "2025-11":{"qty":251,"sales_cr":0.013},
        "2025-12":{"qty":264,"sales_cr":0.014},
        "2026-01":{"qty":223,"sales_cr":0.012},
        "2026-02":{"qty":124,"sales_cr":0.007},
        "2026-03":{"qty":128,"sales_cr":0.007},
        "2026-04":{"qty":286,"sales_cr":0.013}
      }
    },
    "OTHERS": {
      "total_qty": 22391, "total_sales_cr": 0.254,
      "avg_qty": 2488, "avg_sales_cr": 0.028,
      "recent_avg_qty": 1274, "recent_avg_sales_cr": 0.024,
      "proj_qty": 1764, "proj_sales_cr": 0.033,
      "monthly_data": {
        "2025-08":{"qty":1639,"sales_cr":0.0},
        "2025-09":{"qty":3407,"sales_cr":0.006},
        "2025-10":{"qty":2110,"sales_cr":0.057},
        "2025-11":{"qty":6233,"sales_cr":0.07},
        "2025-12":{"qty":2267,"sales_cr":0.035},
        "2026-01":{"qty":2914,"sales_cr":0.013},
        "2026-02":{"qty":1317,"sales_cr":0.034},
        "2026-03":{"qty":1289,"sales_cr":0.0},
        "2026-04":{"qty":1215,"sales_cr":0.038}
      }
    }
  }
};
