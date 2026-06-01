/* ═══════════════════════════════════════════════════
   KOTTAYAM RETAIL — EXECUTIVE DASHBOARD — app.js
   ═══════════════════════════════════════════════════ */

// ─── Chart.js Global Defaults ───────────────────────
Chart.defaults.font.family = "'Calibri', 'Outfit', sans-serif";
Chart.defaults.font.size = 14;
Chart.defaults.color = '#64748b';
Chart.defaults.borderColor = 'rgba(59,130,246,0.1)';
Chart.defaults.plugins.legend.labels.font = { family: "'Calibri', 'Outfit', sans-serif", size: 13 };
Chart.defaults.plugins.tooltip.bodyFont = { family: "'Calibri', 'Outfit', sans-serif", size: 13 };
Chart.defaults.plugins.tooltip.titleFont = { family: "'Calibri', 'Outfit', sans-serif", size: 14, weight: 'bold' };

const C = {
  blue:   '#3b82f6', teal: '#14b8a6', purple: '#f97316',
  pink:   '#ec4899', green:'#22c55e', red:    '#ef4444',
  amber:  '#f59e0b', gold: '#f5a623', orange: '#f97316',
  blueFade:   'rgba(59,130,246,0.15)',
  tealFade:   'rgba(20,184,166,0.15)',
  greenFade:  'rgba(34,197,94,0.15)',
  redFade:    'rgba(239,68,68,0.15)',
  amberFade:  'rgba(245,158,11,0.15)',
  purpleFade: 'rgba(249,115,22,0.15)',
};

function mkGrad(ctx, c1, c2) {
  const g = ctx.createLinearGradient(0,0,0,ctx.canvas.height);
  g.addColorStop(0, c1); g.addColorStop(1, c2);
  return g;
}

// ─── Tab Switching ───────────────────────────────────
const tabTitles = {
  executive: ['Executive Summary',  '₹6Cr → ₹10Cr Growth Trajectory • Kottayam Store'],
  sales:     ['Sales Deep-Dive',    'Hourly, Daily & Category Revenue Analysis'],
  customer:  ['Customer 360',       'Cohorts, CLV, Churn & NRI Segments'],
  inventory: ['Inventory War Room', 'Stock Alerts, Turnover & SKU Intelligence'],
  growth:    ['Growth Experiments', 'Marketing ROI, Campaigns & Predictive Forecast'],
};

function switchTab(tab) {
  document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('tab-' + tab).classList.add('active');
  document.querySelector(`[data-tab="${tab}"]`).classList.add('active');
  document.getElementById('pageTitle').textContent    = tabTitles[tab][0];
  document.getElementById('pageSubtitle').textContent = tabTitles[tab][1];
}

function setPeriod(p, el) {
  document.querySelectorAll('.period-btn').forEach(b => b.classList.remove('active'));
  el.classList.add('active');
}

// ─── Live Clock ──────────────────────────────────────
function updateClock() {
  const now = new Date();
  document.getElementById('lastUpdated').textContent =
    now.toLocaleTimeString('en-IN', {hour:'2-digit', minute:'2-digit', second:'2-digit'});
}
setInterval(updateClock, 1000); updateClock();

// ─── Historical Customer Baseline (pre-May 2026) ────
// Loaded once from server on page load. Used to classify May customers
// as Repeat (seen before May) or New (first time ever).
window.historicalCustomerSet = new Set();
window.historicalCustomersLoaded = false;

(function loadHistoricalCustomers() {
  const statusEl = document.getElementById('uploadStatus');
  if (statusEl) statusEl.textContent = 'Loading history...';
  fetch('/api/data/historical_customers')
    .then(r => r.json())
    .then(data => {
      if (data.mobiles && data.mobiles.length > 0) {
        data.mobiles.forEach(m => window.historicalCustomerSet.add(String(m).trim()));
        window.historicalCustomersLoaded = true;
        if (statusEl) statusEl.textContent = 'Live';
        console.log(`✅ Historical baseline loaded: ${data.count.toLocaleString()} customers (up to Apr 30 2026)`);
      } else {
        console.warn('⚠️ Historical baseline empty or missing:', data.error || 'no data');
        if (statusEl) statusEl.textContent = 'Live';
      }
    })
    .catch(err => {
      console.warn('⚠️ Could not load historical customers:', err);
      if (statusEl) statusEl.textContent = 'Live';
    });
})();


// ─── Modal ───────────────────────────────────────────
function openModal(title, body) {
  document.getElementById('modalTitle').textContent = title;
  document.getElementById('modalBody').innerHTML = body;
  document.getElementById('modalOverlay').classList.add('open');
}
function closeModal() {
  document.getElementById('modalOverlay').classList.remove('open');
}

// ─── Weekly Insight Cards ────────────────────────────
const INSIGHT_CARDS = [
  { type:'anomaly',     tag:'⚡ Anomaly Detected',
    text:'Tuesday sales dropped 18% vs. 4-week average (₹22.4L vs ₹27.3L). Likely linked to competitor flash sale.',
    action:'→ View competitive pricing dashboard',
    detail:'<b>Root Cause Analysis:</b><br>Competitor "FreshMart" ran a 15% discount on staples on Tuesday. Our Tuesday staples revenue fell ₹4.9L. Recommend: dynamic pricing alert on top 50 SKUs, match within 24hr window.<br><br><b>Action Items:</b><ul><li>Set up weekly competitor price scrape</li><li>Enable staff to offer 5% match on spot</li></ul>' },
  { type:'correlation', tag:'🔗 Correlation Alert',
    text:'ATV increased ₹94 (+8.3%) but footfall dropped 6%. Premium customers staying, value seekers leaving.',
    action:'→ Explore customer segmentation',
    detail:'<b>Insight:</b> Your top 20% customers (ATV > ₹2,000) are stable. Mid-tier (₹800–₹1,200) visiting less. Likely price-sensitive to recent MRP revisions.<br><br><b>Recommended Action:</b> Launch "Value Tuesday" promotion for mid-tier segment to recover footfall without hurting ATV.' },
  { type:'warning',     tag:'📦 Inventory Alert',
    text:'Top 3 SKUs for weekly revenue delta: Basmati Rice 5kg (+₹1.2L), Coconut Oil 1L (+₹0.8L), Atta 10kg (+₹0.7L).',
    action:'→ Open Inventory War Room',
    detail:'<b>Stock Status:</b><br>Basmati Rice 5kg: 42 units left (3 days cover) — <b>REORDER NOW</b><br>Coconut Oil 1L: 180 units (12 days cover) — OK<br>Atta 10kg: 95 units (6 days cover) — Monitor<br><br>Estimated lost sales if stock-out occurs: ₹2.8L/week.' },
  { type:'positive',    tag:'✅ Growth Signal',
    text:'Evening shift (5–8 PM) generates ATV of ₹1,340 vs morning shift ₹940 — 43% higher basket size.',
    action:'→ View shift analytics',
    detail:'<b>Shift ATV Breakdown:</b><br>Morning (9AM–1PM): ₹940 ATV, 28% conversion<br>Afternoon (1PM–5PM): ₹1,080 ATV, 32% conversion<br>Evening (5PM–9PM): ₹1,340 ATV, 41% conversion<br><br><b>Recommendation:</b> Deploy 2 additional experienced staff in evening shift. Consider bundled offers at 6–7 PM peak.' },
  { type:'warning',     tag:'💸 Discount Watch',
    text:'Discount rate grew from 8.2% to 8.6% (+0.4 pts) while revenue grew 4%. Discounting pace is outrunning growth.',
    action:'→ Review promotion ROI',
    detail:'<b>Discount Breakdown by Category:</b><br>FMCG: 12.4% avg discount<br>Apparel: 18.2% avg discount (High!)<br>Electronics: 6.1% avg discount<br><br><b>Action:</b> Cap apparel discount at 15% max. Switch to bundled promotions instead of percentage cuts.' },
  { type:'correlation', tag:'🔗 Lost Sales Alert',
    text:'Stock-outs caused an estimated ₹3.8L in lost sales this week across 23 SKU incidents.',
    action:'→ View stock-out tracker',
    detail:'<b>Top Stock-out Incidents:</b><br>1. Premium Basmati 5kg — ₹82,000 lost<br>2. Sunflower Oil 5L — ₹61,000 lost<br>3. Ariel 3kg — ₹44,000 lost<br><br>Systemic issue: reorder points set at 7-day cover but lead time is 10 days. Adjust safety stock formula.' },
];

const insightGrid = document.getElementById('insightCards');
if (insightGrid) {
  INSIGHT_CARDS.forEach(c => {
    const el = document.createElement('div');
    el.className = `insight-card ${c.type}`;
    el.innerHTML = `<span class="insight-tag">${c.tag}</span>
      <p class="insight-text">${c.text}</p>
      <span class="insight-action">${c.action}</span>`;
    el.onclick = () => openModal(c.tag, c.detail);
    insightGrid.appendChild(el);
  });
}

// ─── Sparklines ──────────────────────────────────────
function spark(id, data, color) {
  const ctx = document.getElementById(id);
  if (!ctx) return;
  new Chart(ctx, {
    type: 'line',
    data: {
      labels: data.map((_,i) => i),
      datasets: [{ data, borderColor: color, borderWidth: 2,
        pointRadius: 0, tension: 0.4, fill: false }]
    },
    options: { responsive: false, plugins: { legend: { display: false }, tooltip: { enabled: false } },
      scales: { x: { display: false }, y: { display: false } },
      animation: { duration: 800 } }
  });
}

// Real monthly revenue sparkline (Nov→Apr ₹Cr)
spark('sparkRevenue',  [6.21,6.78,5.85,4.99,6.80,7.22], C.gold);
// Gap to ₹10Cr
spark('sparkGap',      [3.79,3.22,4.15,5.01,3.20,2.78], C.red);
// Daily invoices (proxy for footfall): NDJ→FMA quarters
spark('sparkFootfall', [118,126,110,103,119,128], C.teal);
// ATV trend (₹)
spark('sparkATV',      [16601,17901,17686,16178,18404,18723], C.blue);
// Repeat % trend
spark('sparkGM',       [0,11.6,11.6,17.3,17.3,25.3], C.green);
// Repeat customers trend
spark('sparkConv',     [0,866,866,1241,1241,231], C.amber);

// ─── Revenue vs Target Chart ─────────────────────────
(function() {
  const ctx = document.getElementById('chartRevenueTarget');
  if (!ctx) return;
  const months = ['Aug 25','Sep 25','Oct 25','Nov 25','Dec 25','Jan 26','Feb 26','Mar 26','Apr 26','May 26*','Jun 26','Jul 26'];
  // Real data from Kottayam Future Excel
  const actual  = [5.93, 9.65, 5.99, 6.21, 6.78, 5.85, 4.99, 6.80, 7.22, 5.67, null, null];
  const target  = [7.0,  7.2,  7.4,  7.6,  7.8,  8.0,  8.2,  8.5,  8.8,  9.0,  9.5,  10.0];
  const lastYr  = [null, null, null, null, null, null, null, null, null, null, null, null]; // No prior year data
  const g = ctx.getContext('2d');
  const grad = mkGrad(g, 'rgba(59,130,246,0.4)', 'rgba(59,130,246,0.01)');
  new Chart(ctx, {
    type: 'line',
    data: {
      labels: months,
      datasets: [
        { label: 'Actual (₹Cr)', data: actual, borderColor: C.blue, backgroundColor: grad,
          borderWidth: 2.5, fill: true, tension: 0.4, pointRadius: 4, pointBackgroundColor: C.blue },
        { label: 'Target', data: target, borderColor: C.amber, borderWidth: 2,
          borderDash: [6,3], fill: false, tension: 0.4, pointRadius: 0 },
        { label: 'Last Year', data: lastYr, borderColor: 'rgba(148,163,184,0.4)', borderWidth: 1.5,
          borderDash: [3,3], fill: false, tension: 0.4, pointRadius: 0 },
      ]
    },
    options: {
      responsive: true, interaction: { mode: 'index', intersect: false },
      plugins: { legend: { position: 'top', labels: { color: '#94a3b8', font: { size: 11 }, boxWidth: 12 } },
        tooltip: { backgroundColor: '#0d1829', titleColor: '#f0f4ff', bodyColor: '#94a3b8',
          borderColor: 'rgba(59,130,246,0.3)', borderWidth: 1 } },
      scales: {
        x: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#64748b', font: { size: 11 } } },
        y: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#64748b', font: { size: 11 },
          callback: v => '₹' + v + ' Cr' } }
      }
    }
  });
})();

// ─── Growth Levers Radar ─────────────────────────────
(function() {
  const ctx = document.getElementById('chartLevers');
  if (!ctx) return;
  new Chart(ctx, {
    type: 'radar',
    data: {
      labels: ['Footfall\nGrowth', 'Visit\nFrequency', 'Basket\nSize', 'Margin\nMix', 'Conversion\nRate'],
      datasets: [
        { label: 'Current', data: [68,42,55,36,60], borderColor: C.blue,
          backgroundColor: 'rgba(59,130,246,0.15)', borderWidth: 2, pointRadius: 4,
          pointBackgroundColor: C.blue },
        { label: 'Target', data: [100,100,100,100,100], borderColor: C.amber,
          backgroundColor: 'rgba(245,158,11,0.05)', borderWidth: 1.5,
          borderDash: [5,3], pointRadius: 0 }
      ]
    },
    options: {
      responsive: true,
      plugins: { legend: { position: 'bottom', labels: { color: '#94a3b8', font: { size: 10 }, boxWidth: 10 } } },
      scales: { r: { min: 0, max: 100, ticks: { display: false },
        grid: { color: 'rgba(255,255,255,0.07)' },
        pointLabels: { color: '#94a3b8', font: { size: 10 } } } }
    }
  });
})();

// ─── Seasonal Revenue Index ──────────────────────────
(function() {
  const ctx = document.getElementById('chartSeasonal');
  if (!ctx) return;
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const index  = [110,88,92,115,95,98,105,88,142,128,112,148];
  const events = ['NRI Peak','','Vishu','Easter','','','Bakrid','','Onam','','','Christmas'];
  const g = ctx.getContext('2d');
  const grad = mkGrad(g, 'rgba(20,184,166,0.5)', 'rgba(20,184,166,0.02)');
  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: months,
      datasets: [
        { label: 'Revenue Index', data: index, backgroundColor: index.map(v =>
            v >= 130 ? 'rgba(245,166,35,0.8)' : v >= 110 ? 'rgba(59,130,246,0.7)' : 'rgba(20,184,166,0.5)'),
          borderRadius: 6, borderSkipped: false },
        { label: 'Events', data: months.map((_,i) => events[i] ? 100 : null),
          type: 'line', borderColor: 'transparent', pointRadius: 0 }
      ]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false },
        tooltip: { backgroundColor: '#0d1829', titleColor: '#f0f4ff', bodyColor: '#94a3b8',
          borderColor: 'rgba(59,130,246,0.3)', borderWidth: 1,
          callbacks: { afterBody: (items) => {
            const ev = events[items[0].dataIndex];
            return ev ? ['', '📅 ' + ev] : [];
          }}}
      },
      scales: {
        x: { grid: { display: false }, ticks: { color: '#64748b', font: { size: 10 } } },
        y: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#64748b', font: { size: 10 } },
          title: { display: true, text: 'Index (100 = baseline)', color: '#475569', font: { size: 10 } } }
      }
    }
  });
})();

// ─── Profitability Waterfall ─────────────────────────
(function() {
  const ctx = document.getElementById('chartProfit');
  if (!ctx) return;
  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['Revenue','COGS','Gross\nProfit','Opex','Rent','Marketing','Net\nProfit'],
      datasets: [{
        data: [624,428,196,62,28,18,88],
        backgroundColor: [
          'rgba(59,130,246,0.8)','rgba(239,68,68,0.7)','rgba(34,197,94,0.8)',
          'rgba(239,68,68,0.6)','rgba(239,68,68,0.5)','rgba(239,68,68,0.5)','rgba(245,166,35,0.9)'
        ],
        borderRadius: 6, borderSkipped: false
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false },
        tooltip: { callbacks: { label: ctx => '₹' + ctx.raw + ' L' },
          backgroundColor: '#0d1829', titleColor: '#f0f4ff', bodyColor: '#94a3b8' } },
      scales: {
        x: { grid: { display: false }, ticks: { color: '#64748b', font: { size: 9 } } },
        y: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#64748b', font: { size: 9 },
          callback: v => '₹' + v + 'L' } }
      }
    }
  });
})();

// ─── Payment Mix ─────────────────────────────────────
(function() {
  const ctx = document.getElementById('chartPayment');
  if (!ctx) return;
  new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['UPI / QR', 'Debit Card', 'Credit Card', 'Cash', 'Loyalty Points'],
      datasets: [{ data: [48, 22, 14, 12, 4],
        backgroundColor: [C.blue, C.teal, C.purple, C.amber, C.green],
        borderWidth: 2, borderColor: '#060a12', hoverOffset: 8 }]
    },
    options: {
      responsive: true, cutout: '68%',
      plugins: {
        legend: { position: 'right', labels: { color: '#94a3b8', font: { size: 10 }, boxWidth: 10, padding: 8 } },
        tooltip: { backgroundColor: '#0d1829', titleColor: '#f0f4ff', bodyColor: '#94a3b8',
          callbacks: { label: ctx => ` ${ctx.label}: ${ctx.raw}%` } }
      }
    }
  });
})();

// ─── SALES TAB ───────────────────────────────────────
(function() {
  // Hourly
  const hCtx = document.getElementById('chartHourly');
  if (hCtx) {
    const hours = ['9AM','10','11','12','1PM','2','3','4','5','6','7','8PM'];
    const days  = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
    const data  = [
      [12,14,16,18,22,18,16,20,28,32,30,24],
      [10,12,13,15,18,14,12,16,22,26,24,18],
      [14,16,18,20,24,20,18,22,30,34,32,26],
      [13,15,17,19,23,19,17,21,29,33,31,25],
      [16,18,20,22,26,22,20,24,32,36,34,28],
      [22,26,28,30,34,30,28,32,40,44,42,36],
      [18,22,24,26,30,26,24,28,36,40,38,32],
    ];
    new Chart(hCtx, {
      type: 'bar',
      data: {
        labels: hours,
        datasets: days.map((d,i) => ({
          label: d, data: data[i],
          backgroundColor: `hsla(${200 + i*20},80%,60%,${i===5?0.9:0.55})`,
          borderRadius: 4,
        }))
      },
      options: {
        responsive: true,
        plugins: { legend: { position: 'top', labels: { color: '#94a3b8', font: { size: 10 }, boxWidth: 10 } },
          tooltip: { mode: 'index', backgroundColor: '#0d1829', titleColor: '#f0f4ff', bodyColor: '#94a3b8' } },
        scales: {
          x: { stacked: false, grid: { display: false }, ticks: { color: '#64748b', font: { size: 10 } } },
          y: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#64748b', font: { size: 10 },
            callback: v => '₹' + v + 'L' } }
        }
      }
    });
  }

  // Day-wise
  // Real day-wise revenue from Kottayam data (avg weekly ₹L)
  const dCtx = document.getElementById('chartDaywise');
  if (dCtx) {
  new Chart(dCtx, {
    type: 'bar',
    data: {
      labels: ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'],
      datasets: [{
        label: 'Avg Weekly Revenue (₹L)', data: [21.6, 20.0, 20.9, 22.3, 21.2, 30.7, 27.3],
        backgroundColor: ['rgba(59,130,246,0.7)','rgba(239,68,68,0.75)','rgba(59,130,246,0.7)','rgba(59,130,246,0.7)','rgba(20,184,166,0.7)','rgba(245,166,35,0.9)','rgba(139,92,246,0.8)'],
        borderRadius: 8, borderSkipped: false
      }]
    },
      options: {
        responsive: true, indexAxis: 'y',
        plugins: { legend: { display: false }, tooltip: { backgroundColor: '#0d1829' } },
        scales: {
          x: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#64748b', font: { size: 10 }, callback: v => '₹'+v+'L' } },
          y: { grid: { display: false }, ticks: { color: '#94a3b8', font: { size: 11 } } }
        }
      }
    });
  }

  // Real category data from Kottayam Future Excel
  const cCtx = document.getElementById('chartCategory');
  if (cCtx) {
    new Chart(cCtx, {
      type: 'bar',
      data: {
        labels: ['Telecom','Consumer Electronics','IT / Computers','Accessories','Value Added Svc','Others'],
        datasets: [
          { label: 'Revenue ₹Cr', data: [26.79, 24.64, 6.26, 2.88, 0.76, 0.26],
            backgroundColor: 'rgba(59,130,246,0.75)', borderRadius: 6, yAxisID: 'y' },
          { label: 'Revenue Share %', data: [43.4, 39.9, 10.2, 4.7, 1.2, 0.4],
            type: 'line', borderColor: C.amber, borderWidth: 2, pointRadius: 4,
            pointBackgroundColor: C.amber, fill: false, yAxisID: 'y1' }
        ]
      },
      options: {
        responsive: true, interaction: { mode: 'index' },
        plugins: { legend: { position: 'top', labels: { color: '#94a3b8', font: { size: 10 }, boxWidth: 10 } },
          tooltip: { backgroundColor: '#0d1829', titleColor: '#f0f4ff', bodyColor: '#94a3b8' } },
        scales: {
          x: { grid: { display: false }, ticks: { color: '#64748b', font: { size: 9 }, maxRotation: 30 } },
          y: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#64748b', font: { size: 10 }, callback: v => '₹'+v+'Cr' } },
          y1: { position: 'right', grid: { display: false }, ticks: { color: '#f59e0b', font: { size: 10 }, callback: v => v+'%' } }
        }
      }
    });
  }

  // YoY Growth — Real monthly revenue MoM trend
  const yCtx = document.getElementById('chartYoY');
  if (yCtx) {
    new Chart(yCtx, {
      type: 'line',
      data: {
        labels: ['Aug 25','Sep 25','Oct 25','Nov 25','Dec 25','Jan 26','Feb 26','Mar 26','Apr 26'],
        datasets: [{
          label: 'Monthly Revenue (₹Cr)', data: [5.93,9.65,5.99,6.21,6.78,5.85,4.99,6.80,7.22],
          borderColor: C.teal, backgroundColor: 'rgba(20,184,166,0.15)',
          fill: true, tension: 0.4, borderWidth: 2.5, pointRadius: 4, pointBackgroundColor: C.teal
        },{
          label:'₹10Cr Target/mo', data:[10,10,10,10,10,10,10,10,10],
          borderColor:'rgba(245,166,35,0.5)',borderDash:[6,3],borderWidth:1.5,pointRadius:0,fill:false
        }]
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false }, tooltip: { backgroundColor: '#0d1829' } },
        scales: {
          x: { grid: { display: false }, ticks: { color: '#64748b', font: { size: 10 } } },
          y: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#64748b', font: { size: 10 }, callback: v => v+'%' } }
        }
      }
    });
  }

  // Shift Table
  const shifts = [
    { shift:'Morning  9AM–1PM', staff:8,  footfall:520, conv:28.4, atv:940,  rph:82400, status:'Average' },
    { shift:'Afternoon 1PM–5PM',staff:10, footfall:610, conv:32.1, atv:1080, rph:95600, status:'Good' },
    { shift:'Evening  5PM–9PM', staff:12, footfall:712, conv:41.2, atv:1340, rph:142800,status:'Best' },
  ];
  const tbody = document.getElementById('shiftTableBody');
  if (tbody) shifts.forEach(s => {
    const statusClass = s.status==='Best'?'badge-green':s.status==='Good'?'badge-blue':'badge-yellow';
    tbody.innerHTML += `<tr>
      <td><b>${s.shift}</b></td><td>${s.staff}</td><td>${s.footfall.toLocaleString()}</td>
      <td>${s.conv}%</td><td>₹${s.atv.toLocaleString()}</td>
      <td>₹${s.rph.toLocaleString()}</td>
      <td><span class="badge ${statusClass}">${s.status}</span></td>
    </tr>`;
  });
})();

// ─── Excel Data Processor ────────────────────────────
window.processMasterData = function(event) {
  const file = event.target.files[0];
  if (!file) return;
  document.getElementById('uploadStatus').textContent = 'Processing...';
  
  const reader = new FileReader();
  reader.onload = function(e) {
    const data = new Uint8Array(e.target.result);
    const workbook = XLSX.read(data, {type: 'array'});
    const sheetName = workbook.SheetNames.find(n => n.toLowerCase().includes('combined') || n.toLowerCase().includes('sales')) || workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(sheet, {header:1, cellDates: true, defval: ""});
    
    if (rows.length < 2) {
      alert('File is empty or invalid.');
      return;
    }
    
    // Find columns exactly
    const headers = rows[0].map(h => String(h).toLowerCase().trim());
    const dateCol = headers.findIndex(h => h === 'date');
    const mobCol = headers.findIndex(h => h === 'customer mobile' || h === 'mobile');
    const invCol = headers.findIndex(h => h === 'invoice number' || h === 'invoice no' || h === 'invoice');
    const revCol = headers.findIndex(h => h === 'sold price' || h === 'revenue' || h === 'net value' || h === 'invoice value');
    
    if (dateCol===-1 || mobCol===-1 || revCol===-1 || invCol===-1) {
      alert(`Could not find required columns. Found headers: ${headers.slice(0,10).join(', ')}...`);
      document.getElementById('uploadStatus').textContent = 'Live';
      return;
    }
    
    // Use the server-loaded historical baseline (all customers up to Apr 30 2026)
    // from Kottayam Future Complete Data.xlsx
    const preCutoffMobiles = window.historicalCustomerSet;
    if (!window.historicalCustomersLoaded) {
      console.warn('⚠️ Historical baseline not yet loaded — repeat/new counts may be inaccurate');
    }

    let mayRevenue = 0;
    let mayInvoices = new Set();
    let mayMobiles = new Set();
    // Map: dateKey -> Set of unique customer mobiles for that day
    let mayDailyMobiles = {};
    
    let aprRevenue = 0;
    let aprInvoices = new Set();
    let aprDailyMobiles = {};
    
    const aprStart = new Date(2026, 3, 1);
    const aprEnd = new Date(2026, 3, 30);
    const mayStart = new Date(2026, 4, 1);
    const mayEnd = new Date(2026, 4, 31);
    
    for (let i = 1; i < rows.length; i++) {
      const r = rows[i];
      if (!r || r.length === 0) continue;
      
      const mobStr = r[mobCol] ? String(r[mobCol]).trim() : '';
      if (!mobStr) continue;
      
      const dateVal = r[dateCol];
      if (!dateVal) continue;
      
      let d;
      if (dateVal instanceof Date) {
        d = dateVal;
      } else if (typeof dateVal === 'number') {
        d = new Date(Math.round((dateVal - 25569) * 86400 * 1000));
      } else if (typeof dateVal === 'string') {
        const dateStr = dateVal.trim();
        if (dateStr.includes('/')) {
          const parts = dateStr.split(' ')[0].split('/');
          if (parts.length === 3) {
            let y = parseInt(parts[2]);
            if (y < 100) y += 2000;
            d = new Date(y, parseInt(parts[1])-1, parseInt(parts[0]));
          }
        } else if (dateStr.includes('-')) {
          d = new Date(dateStr);
        } else if (!isNaN(dateStr) && dateStr !== '') {
          d = new Date(Math.round((parseInt(dateStr) - 25569) * 86400 * 1000));
        }
      }
      
      if (!d || isNaN(d)) continue;
      
      const rawRev = r[revCol];
      let rev = 0;
      if (typeof rawRev === 'number') rev = rawRev;
      else if (typeof rawRev === 'string') rev = parseFloat(rawRev.replace(/,/g,'')) || 0;
      
      const rawInv = r[invCol];
      const inv = rawInv ? String(rawInv).trim() : '';
      
      
      if (d >= aprStart && d <= aprEnd) {
        aprRevenue += rev;
        if (inv) aprInvoices.add(inv);
        const aprKey = d.getFullYear() + '-' + d.getMonth() + '-' + d.getDate();
        if (!aprDailyMobiles[aprKey]) aprDailyMobiles[aprKey] = new Set();
        aprDailyMobiles[aprKey].add(mobStr);
      }
      
      if (d >= mayStart && d <= mayEnd) {
        mayMobiles.add(mobStr);
        mayRevenue += rev;
        if (inv) mayInvoices.add(inv);
        const mayKey = d.getFullYear() + '-' + d.getMonth() + '-' + d.getDate();
        if (!mayDailyMobiles[mayKey]) mayDailyMobiles[mayKey] = new Set();
        mayDailyMobiles[mayKey].add(mobStr);
      }
    }
    
    // Calculate metrics
    const revCr = (mayRevenue / 10000000).toFixed(2);
    const aprRevCr = (aprRevenue / 10000000).toFixed(2);
    const revMoM = aprRevCr > 0 ? (((revCr - aprRevCr) / aprRevCr) * 100).toFixed(1) : 0;
    
    const gap = (10 - revCr).toFixed(2);
    const gapVal = gap > 0 ? gap : 0;
    
    const uniqueMay = mayMobiles.size;
    let repeatCount = 0;
    let newCount = 0;
    mayMobiles.forEach(m => {
      if (preCutoffMobiles.has(m)) repeatCount++;
      else newCount++;
    });
    
    const repRate = uniqueMay > 0 ? ((repeatCount / uniqueMay) * 100).toFixed(1) : '0.0';
    const newRate = uniqueMay > 0 ? ((newCount / uniqueMay) * 100).toFixed(1) : '0.0';
    
    const atv = mayInvoices.size > 0 ? Math.round(mayRevenue / mayInvoices.size) : 0;
    const aprAtv = aprInvoices.size > 0 ? Math.round(aprRevenue / aprInvoices.size) : 0;
    const atvMoM = aprAtv > 0 ? (((atv - aprAtv) / aprAtv) * 100).toFixed(1) : 0;
    
    // Daily average unique customers = total unique customers per day, averaged across active days
    const mayDays = Object.keys(mayDailyMobiles);
    const mayDailySum = mayDays.reduce((sum, k) => sum + mayDailyMobiles[k].size, 0);
    const dFootfall = mayDays.length > 0 ? Math.round(mayDailySum / mayDays.length) : 0;
    
    const aprDays = Object.keys(aprDailyMobiles);
    const aprDailySum = aprDays.reduce((sum, k) => sum + aprDailyMobiles[k].size, 0);
    const aprFootfall = aprDays.length > 0 ? Math.round(aprDailySum / aprDays.length) : 0;
    
    const footfallMoM = aprFootfall > 0 ? (((dFootfall - aprFootfall) / aprFootfall) * 100).toFixed(1) : 0;
    
    // Update UI
    document.getElementById('kpiRev').textContent = '₹' + revCr + ' Cr';
    document.getElementById('kpiGap').textContent = '₹' + gapVal + ' Cr';
    document.getElementById('kpiFootfall').textContent = dFootfall.toLocaleString();
    document.getElementById('kpiATV').textContent = '₹' + atv.toLocaleString();
    document.getElementById('kpiRepeat').textContent = repRate + '%';
    document.getElementById('kpiNew').textContent = newRate + '%';
    
    // Deltas
    const setDelta = (id, val, suffix, invert = false) => {
        const el = document.getElementById(id);
        if (val > 0) {
            el.textContent = '▲ ' + val + '% ' + suffix;
            el.className = invert ? 'kpi-delta negative' : 'kpi-delta positive';
        } else if (val < 0) {
            el.textContent = '▼ ' + Math.abs(val) + '% ' + suffix;
            el.className = invert ? 'kpi-delta positive' : 'kpi-delta negative';
        } else {
            el.textContent = '0% ' + suffix;
            el.className = 'kpi-delta';
        }
    };
    
    setDelta('kpiRevDelta', revMoM, 'vs Apr 26');
    document.getElementById('kpiGapDelta').textContent = ((gapVal / 10)*100).toFixed(1) + '% remaining';
    document.getElementById('kpiGapDelta').className = 'kpi-delta negative';
    setDelta('kpiFootfallDelta', footfallMoM, 'vs Apr avg');
    setDelta('kpiATVDelta', atvMoM, 'vs Apr 26');
    
    document.getElementById('kpiRepeatDelta').textContent = repeatCount.toLocaleString() + ' repeat buyers';
    document.getElementById('kpiRepeatDelta').className = 'kpi-delta positive';
    
    document.getElementById('kpiNewDelta').textContent = newCount.toLocaleString() + ' new buyers';
    document.getElementById('kpiNewDelta').className = 'kpi-delta positive';
    
    document.getElementById('uploadStatus').textContent = 'Data Applied';
    setTimeout(() => { document.getElementById('uploadStatus').textContent = 'Live'; }, 3000);
  };
  reader.readAsArrayBuffer(file);
};

// ─── Growth Lever Tracker — Load Real Data ───────────────────────────────
(function loadGrowthLevers() {
  fetch('/api/data/growth_levers')
    .then(r => r.json())
    .then(data => {
      if (data.error) {
        console.warn('[GrowthLevers] API error:', data.error);
        return;
      }

      // Show data period subtitle
      const periodEl = document.getElementById('leverPeriod');
      if (periodEl && data.data_period) {
        periodEl.textContent = `📅 ${data.data_period}`;
      }

      const levers = data.levers || {};

      // Helper: animate a progress bar and set values
      function fillLever(key, currentId, targetId, barId, pctId, statusId) {
        const lev = levers[key];
        if (!lev) return;

        const currentEl = document.getElementById(currentId);
        const targetEl  = document.getElementById(targetId);
        const barEl     = document.getElementById(barId);
        const pctEl     = document.getElementById(pctId);
        const statusEl  = document.getElementById(statusId);

        if (currentEl) currentEl.textContent = lev.current_fmt;
        if (targetEl)  targetEl.textContent  = lev.target_fmt;
        if (pctEl)     pctEl.textContent     = lev.progress + '%';

        // Animate bar after a short delay
        if (barEl) {
          setTimeout(() => {
            barEl.style.setProperty('--pct', lev.progress + '%');
          }, 200);
        }

        if (statusEl) {
          statusEl.textContent  = lev.status;
          statusEl.className    = 'lever-status ' + lev.status_cls;
        }
      }

      fillLever('customers', 'lv-cust-current', 'lv-cust-target', 'lv-cust-bar', 'lv-cust-pct', 'lv-cust-status');
      fillLever('frequency', 'lv-freq-current', 'lv-freq-target', 'lv-freq-bar', 'lv-freq-pct', 'lv-freq-status');
      fillLever('atv',       'lv-atv-current',  'lv-atv-target',  'lv-atv-bar',  'lv-atv-pct',  'lv-atv-status');

      console.log('[GrowthLevers] Loaded. Est. Monthly Revenue: ₹' + data.monthly_revenue_estimate + ' Cr');
    })
    .catch(err => console.warn('[GrowthLevers] Fetch failed:', err));
})();
