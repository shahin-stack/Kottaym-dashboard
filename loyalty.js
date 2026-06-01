/* loyalty.js — Charts, Tables, Interactors */
Chart.defaults.font.family="'Calibri','Outfit',sans-serif";
Chart.defaults.font.size=14;
Chart.defaults.color='#64748b';
Chart.defaults.borderColor='rgba(59,130,246,0.1)';
Chart.defaults.plugins.legend.labels.font={family:"'Calibri','Outfit',sans-serif",size:13};
Chart.defaults.plugins.tooltip.bodyFont={family:"'Calibri','Outfit',sans-serif",size:13};
Chart.defaults.plugins.tooltip.titleFont={family:"'Calibri','Outfit',sans-serif",size:14,weight:'bold'};

const C={blue:'#3b82f6',teal:'#14b8a6',green:'#22c55e',red:'#ef4444',amber:'#f59e0b',gold:'#f5a623',purple:'#ea580c'};

const TITLES={s1:'Cohort Retention & Yearly Performance Matrix',s6:'Pre-April Base Reactivation Tracking',s3:'Category Performance & Future Projections',s4:'Retail Loyalty Performance Matrix',s5:'Growth Bridge: ₹6.24 Cr → ₹10 Cr',s7:'🤖 LSTM Sales Intelligence Dashboard'};
function showSection(id,el){
  document.querySelectorAll('.section').forEach(s=>s.classList.remove('active'));
  document.querySelectorAll('.nav-link').forEach(l=>l.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  el.classList.add('active');
  document.getElementById('sectionTitle').textContent=TITLES[id];
  event.preventDefault();
}

// ─── S1: MONTHLY COHORT TABLE ────────────────────────────────
(function(){
  const mc  = D.monthlyCohort;
  const rev = D.cohortRevenue;
  const revMap = {};
  rev.forEach(r => revMap[r.cohort] = r);

  const tbody = document.getElementById('cohortBody');

  // Month labels for display
  const monthNames = {
    '2025-08':'Aug 2025','2025-09':'Sep 2025 (Onam)','2025-10':'Oct 2025',
    '2025-11':'Nov 2025','2025-12':'Dec 2025','2026-01':'Jan 2026',
    '2026-02':'Feb 2026','2026-03':'Mar 2026','2026-04':'Apr 2026','2026-05':'May 2026 (MTD)'
  };

  // Colour scale for retention percentage text
  function getRetColor(v) {
    if (v > 5) return '#15803d'; // Green
    if (v >= 2) return '#d97706'; // Amber
    return '#dc2626'; // Red
  }

  function getBg(idx) {
    return idx % 2 === 0 ? '#ffffff' : '#f8fafc';
  }

  function formatLakhs(val) {
    return val ? '₹' + val.toFixed(1) + 'L' : '—';
  }

  function retCell(v, size, revVal, colIdx, cohortMonth) {
    const bg = getBg(colIdx);
    if (v === null || v === undefined) {
      return `<td style="background:${bg};color:#94a3b8;text-align:left;vertical-align:top;border-right:1px solid #f1f5f9;padding:14px 16px">—</td>`;
    }
    const color = getRetColor(v);
    const count = Math.round((size * v) / 100).toLocaleString('en-IN');
    const revStr = revVal ? formatLakhs(revVal) : '—';
    return `<td style="position:relative;background:${bg};text-align:left;vertical-align:top;border-right:1px solid #f1f5f9;padding:14px 16px">
      <div style="font-weight:800;font-size:13px;color:${color}">${v.toFixed(2)}%</div>
      <div style="font-family:var(--mono);color:#475569;font-size:12px;font-weight:600;margin-top:4px">${count}</div>
      <div style="font-family:var(--mono);color:#94a3b8;font-size:10px;margin-top:2px">${revStr}</div>
      <button onclick="downloadCohortData('${cohortMonth}', ${colIdx})" style="position:absolute;top:10px;right:10px;background:none;border:none;cursor:pointer;color:#cbd5e1;padding:4px;border-radius:4px;display:flex;align-items:center;justify-content:center;transition:0.2s;" onmouseover="this.style.color='#3b82f6';this.style.background='#f1f5f9'" onmouseout="this.style.color='#cbd5e1';this.style.background='none'" title="Download Raw Customers">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
      </button>
    </td>`;
  }

  // Handle Download
  window.downloadCohortData = function(cohort, monthIdx) {
    window.location.href = `/api/download/cohort/${cohort}/${monthIdx}`;
  };

  window.downloadNoReturn = function(cohort) {
    window.location.href = `/api/download/cohort/${cohort}/no-return`;
  };

  // Reverse array to put newest at top
  const mcReversed = [...mc].reverse();

  mcReversed.forEach(r => {
    const rv = revMap[r.cohort] || {};
    const m0Bg = '#3b82f6';
    const m0Color = '#ffffff';

    tbody.innerHTML += `<tr style="border-bottom:1px solid #e2e8f0">
      <td style="padding:14px 16px;vertical-align:top">
        <div style="display:inline-block;background:#64748b;color:#fff;padding:4px 10px;border-radius:6px;font-size:11px;font-weight:700">
          ${monthNames[r.cohort] || r.cohort}
        </div>
      </td>
      <td style="padding:14px 16px;vertical-align:top;font-family:var(--mono);font-weight:600;font-size:13px;color:#1e293b">${r.size.toLocaleString('en-IN')}</td>
      <td style="position:relative;padding:14px 16px;vertical-align:top">
        <div style="color:#d97706;font-family:var(--mono);font-weight:800;font-size:14px">${r.single.toLocaleString('en-IN')}</div>
        <div style="color:#64748b;font-size:11px;font-weight:600;margin-top:3px">${r.singlePct.toFixed(1)}%</div>
        <button onclick="downloadNoReturn('${r.cohort}')" style="position:absolute;top:10px;right:10px;background:none;border:none;cursor:pointer;color:#cbd5e1;padding:4px;border-radius:4px;display:flex;align-items:center;justify-content:center;transition:0.2s;" onmouseover="this.style.color='#f59e0b';this.style.background='#fef3c7'" onmouseout="this.style.color='#cbd5e1';this.style.background='none'" title="Download No-Return Customers">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
        </button>
      </td>
      <td style="position:relative;background:${m0Bg};color:${m0Color};padding:14px 16px;vertical-align:top;border-right:1px solid #e2e8f0">
        <div style="font-weight:800;font-size:13px">100%</div>
        <div style="font-family:var(--mono);font-size:12px;font-weight:600;margin-top:4px">${r.size.toLocaleString('en-IN')}</div>
        <div style="font-family:var(--mono);font-size:10px;margin-top:2px;color:#bfdbfe">${formatLakhs(rv.m0Rev)}</div>
        <button onclick="downloadCohortData('${r.cohort}', 0)" style="position:absolute;top:10px;right:10px;background:none;border:none;cursor:pointer;color:#93c5fd;padding:4px;border-radius:4px;display:flex;align-items:center;justify-content:center;transition:0.2s;" onmouseover="this.style.color='#ffffff';this.style.background='rgba(255,255,255,0.2)'" onmouseout="this.style.color='#93c5fd';this.style.background='none'" title="Download Raw Customers">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
        </button>
      </td>
      ${retCell(r.m1, r.size, rv.m1Rev, 1, r.cohort)}
      ${retCell(r.m2, r.size, rv.m2Rev, 2, r.cohort)}
      ${retCell(r.m3, r.size, rv.m3Rev, 3, r.cohort)}
      ${retCell(r.m4, r.size, rv.m4Rev, 4, r.cohort)}
      ${retCell(r.m5, r.size, rv.m5Rev, 5, r.cohort)}
      ${retCell(r.m6, r.size, rv.m6Rev, 6, r.cohort)}
    </tr>`;
  });

  // Retention decay chart — use monthly cohorts with full M1–M6 data
  const ctx = document.getElementById('chartCohortRetention');
  if (!ctx) return;

  // Cohorts with enough data for a trend line (at least M3 known)
  const forChart = mc.filter(c => c.m3 !== null);
  // Also show industry benchmark and target
  new Chart(ctx, {type:'line', data:{
    labels: ['M0 (Acq)', 'M1', 'M2', 'M3', 'M4', 'M5', 'M6'],
    datasets: [
      {
        label: 'Aug-25 (Onam — Best)',
        data: [100, mc[0].m1, mc[0].m2, mc[0].m3, mc[0].m4, mc[0].m5, mc[0].m6],
        borderColor: C.gold, backgroundColor: 'rgba(245,166,35,0.1)', fill:true,
        tension:0.4, borderWidth:2.5, pointRadius:4, pointBackgroundColor:C.gold
      },
      {
        label: 'Sep-25 (Post-Onam)',
        data: [100, mc[1].m1, mc[1].m2, mc[1].m3, mc[1].m4, mc[1].m5, mc[1].m6],
        borderColor: C.blue, backgroundColor:'transparent',
        tension:0.4, borderWidth:2, pointRadius:3
      },
      {
        label: 'Avg Recent (Feb-Apr 26)',
        data: [100,
          ((mc[6].m1||0)+(mc[7].m1||0)+(mc[8].m1||0))/3,
          ((mc[6].m2||0)+(mc[7].m2||0))/2,
          mc[6].m3||null, null, null, null],
        borderColor: C.red, backgroundColor:'transparent',
        tension:0.4, borderWidth:2, borderDash:[5,3], pointRadius:3
      },
      {
        label: 'Industry Benchmark',
        data: [100, 25, 16, 10, 7, 5, 4],
        borderColor: C.amber, borderDash:[6,3], borderWidth:2,
        fill:false, tension:0.4, pointRadius:0
      },
      {
        label: 'Target (₹10Cr path)',
        data: [100, 12, 7, 5, 3, 2.5, 2],
        borderColor: C.green, borderDash:[4,4], borderWidth:1.5,
        fill:false, tension:0.4, pointRadius:0
      }
    ]},
    options:{responsive:true,
      plugins:{legend:{position:'bottom',labels:{color:'#94a3b8',font:{size:10},boxWidth:10}},
        tooltip:{backgroundColor:'#0d1829',titleColor:'#f0f4ff',bodyColor:'#94a3b8'}},
      scales:{
        x:{grid:{color:'rgba(255,255,255,0.04)'},ticks:{color:'#64748b',font:{size:10}}},
        y:{grid:{color:'rgba(255,255,255,0.04)'},ticks:{color:'#64748b',font:{size:10},callback:v=>v+'%'},min:0,max:105}
      }}
  });

  // Cumulative Cohort LTV (Lifetime Value)
  const ltvCtx = document.getElementById('chartCohortLTV');
  if (ltvCtx) {
    const calcLTV = (cohortData, revData) => {
      const size = cohortData.size;
      let cum = 0;
      const data = [];
      const keys = ['m0Rev', 'm1Rev', 'm2Rev', 'm3Rev', 'm4Rev', 'm5Rev', 'm6Rev'];
      for (let k of keys) {
        if (revData[k] !== null && revData[k] !== undefined) {
          cum += (revData[k] * 100000) / size;
          data.push(Math.round(cum));
        } else {
          data.push(null);
        }
      }
      return data;
    };
    
    const calcAvgLTV = (cohorts, revs) => {
        let totalSizes = [0,0,0,0,0,0,0];
        let totalRevs = [0,0,0,0,0,0,0];
        const keys = ['m0Rev', 'm1Rev', 'm2Rev', 'm3Rev', 'm4Rev', 'm5Rev', 'm6Rev'];
        
        for (let i = 0; i < cohorts.length; i++) {
            const size = cohorts[i].size;
            const rev = revs[i];
            for (let j = 0; j < keys.length; j++) {
                if (rev[keys[j]] !== null && rev[keys[j]] !== undefined) {
                    totalSizes[j] += size;
                    totalRevs[j] += rev[keys[j]] * 100000;
                }
            }
        }
        
        let cum = 0;
        const data = [];
        for (let j = 0; j < keys.length; j++) {
            if (totalSizes[j] > 0) {
                cum += totalRevs[j] / totalSizes[j];
                data.push(Math.round(cum));
            } else {
                data.push(null);
            }
        }
        return data;
    };

    const dAug = calcLTV(mc[0], revMap[mc[0].cohort]);
    const dSep = calcLTV(mc[1], revMap[mc[1].cohort]);
    const recentCohorts = [mc[6], mc[7], mc[8]]; // Feb, Mar, Apr
    const recentRevs = recentCohorts.map(c => revMap[c.cohort]);
    const dAvgRecent = calcAvgLTV(recentCohorts, recentRevs);

    new Chart(ltvCtx, {type:'line', data:{
      labels: ['M0 (Acq)', 'M1', 'M2', 'M3', 'M4', 'M5', 'M6'],
      datasets: [
        {
          label: 'Aug-25 (Onam — Best)',
          data: dAug,
          borderColor: C.gold, backgroundColor: 'rgba(245,166,35,0.1)', fill:true,
          tension:0.4, borderWidth:2.5, pointRadius:4, pointBackgroundColor:C.gold
        },
        {
          label: 'Sep-25 (Post-Onam)',
          data: dSep,
          borderColor: C.blue, backgroundColor:'transparent',
          tension:0.4, borderWidth:2, pointRadius:3
        },
        {
          label: 'Avg Recent (Feb-Apr 26)',
          data: dAvgRecent,
          borderColor: C.red, backgroundColor:'transparent',
          tension:0.4, borderWidth:2, borderDash:[5,3], pointRadius:3
        }
      ]},
      options:{responsive:true,
        plugins:{
          legend:{position:'bottom',labels:{color:'#94a3b8',font:{size:10},boxWidth:10}},
          tooltip:{
            backgroundColor:'#0d1829',titleColor:'#f0f4ff',bodyColor:'#94a3b8',
            callbacks: {
              label: (ctx) => ` ${ctx.dataset.label}: ₹${ctx.raw.toLocaleString()}`
            }
          }
        },
        scales:{
          x:{grid:{color:'rgba(255,255,255,0.04)'},ticks:{color:'#64748b',font:{size:10}}},
          y:{
            grid:{color:'rgba(255,255,255,0.04)'},
            ticks:{color:'#64748b',font:{size:10},callback:v=>'₹'+v.toLocaleString()}
          }
        }}
    });
  }

})();



// ─── S6: BASE REACTIVATION ──────────────────────────────────────────
(function(){
  const ctx = document.getElementById('chartBaseReactivation');
  if(!ctx) return;
  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['April 2026', 'May 2026 (MTD)', 'June 2026'],
      datasets: [{
        label: 'Reactivated Customers',
        data: [595, 187, 0],
        backgroundColor: [C.green, C.gold, '#475569'],
        borderRadius: 4
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#0d1829',
          bodyColor: '#94a3b8',
          callbacks: {
            label: (ctx) => ` ${ctx.raw} customers (${(ctx.raw / 21743 * 100).toFixed(2)}%)`
          }
        }
      },
      scales: {
        y: {
          grid: { color: 'rgba(255,255,255,0.04)' },
          ticks: { color: '#64748b', font: { size: 10 } }
        },
        x: {
          grid: { display: false },
          ticks: { color: '#64748b', font: { size: 10 } }
        }
      }
    }
  });
})();
// ─── S3: CATEGORY ANALYSIS ──────────────────────────────────
(function(){
  const tbody=document.getElementById('categoryBody');
  if(!tbody) return;

  const data = D.categoryProjections;
  
  // Calculate total sum of sales for contribution percentages
  let totalSalesSum = 0;
  for(let cat in data){
    totalSalesSum += data[cat].total_sales_cr;
  }

  // Render table rows
  for(let cat in data){
    const c = data[cat];
    const contribPct = totalSalesSum > 0 ? (c.total_sales_cr / totalSalesSum) * 100 : 0;
    tbody.innerHTML += `<tr>
      <td><b>${cat}</b></td>
      <td style="font-family:var(--mono)">${c.total_qty.toLocaleString()}</td>
      <td style="font-family:var(--mono)">₹${c.total_sales_cr.toFixed(3)} Cr</td>
      <td style="font-family:var(--mono);font-weight:600">${contribPct.toFixed(1)}%</td>
      <td style="font-family:var(--mono)">${c.recent_avg_qty.toLocaleString()}</td>
      <td style="font-family:var(--mono)">₹${c.recent_avg_sales_cr.toFixed(3)} Cr</td>
      <td style="font-family:var(--mono);color:#ea580c;font-weight:700;">${c.proj_qty.toLocaleString()}</td>
      <td style="font-family:var(--mono);color:#ea580c;font-weight:700;">₹${c.proj_sales_cr.toFixed(3)} Cr</td>
    </tr>`;
  }

  // Render chart comparisons
  const ctx = document.getElementById('chartCategoryProjections');
  if(!ctx) return;

  const categories = Object.keys(data);
  const currentSales = categories.map(cat => data[cat].recent_avg_sales_cr);
  const projectedSales = categories.map(cat => data[cat].proj_sales_cr);

  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: categories,
      datasets: [
        {
          label: 'Current Avg Sales (₹Cr/mo)',
          data: currentSales,
          backgroundColor: 'rgba(59,130,246,0.65)',
          borderRadius: 6
        },
        {
          label: 'Target Projected Sales (₹Cr/mo)',
          data: projectedSales,
          backgroundColor: 'rgba(249,115,22,0.8)',
          borderRadius: 6
        }
      ]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: 'bottom', labels: { color: '#94a3b8', font: { size: 10 }, boxWidth: 10 } },
        tooltip: { backgroundColor: '#0d1829', bodyColor: '#94a3b8' }
      },
      scales: {
        x: { grid: { display: false }, ticks: { color: '#64748b', font: { size: 8 } } },
        y: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#64748b', font: { size: 10 }, callback: v => '₹'+v+'Cr' } }
      }
    }
  });

  // ── Monthly Sales Trend Chart (MoM line per category) ──
  const trendCtx = document.getElementById('chartCategoryMonthlyTrend');
  if(trendCtx) {
    const monthKeys = ['2025-08','2025-09','2025-10','2025-11','2025-12','2026-01','2026-02','2026-03','2026-04'];
    const monthLabels = ['Aug 25','Sep 25','Oct 25','Nov 25','Dec 25','Jan 26','Feb 26','Mar 26','Apr 26'];
    // Palette per category (skip OTHERS for visual clarity, but include all)
    const palette = {
      'CONSUMER ELECTRONICS': {color:'#3b82f6', width:2.5},
      'TELECOM':              {color:'#f59e0b', width:2.5},
      'IT':                   {color:'#ea580c', width:2},
      'ACCESSORIES':          {color:'#22c55e', width:2},
      'VALUE ADDED SERVICE':  {color:'#14b8a6', width:1.5},
      'ENDPOINT PROTECTION':  {color:'#ef4444', width:1.5},
      'OTHERS':               {color:'#94a3b8', width:1, dash:[4,4]}
    };
    const trendDatasets = Object.keys(data).map(cat => {
      const md = data[cat].monthly_data || {};
      const p  = palette[cat] || {color:'#64748b', width:1.5};
      return {
        label: cat,
        data: monthKeys.map(m => md[m] ? md[m].sales_cr : null),
        borderColor: p.color,
        backgroundColor: 'transparent',
        borderWidth: p.width || 2,
        borderDash: p.dash || [],
        tension: 0.4,
        pointRadius: 4,
        pointBackgroundColor: p.color,
        spanGaps: false
      };
    });
    new Chart(trendCtx, {
      type: 'line',
      data: { labels: monthLabels, datasets: trendDatasets },
      options: {
        responsive: true,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: { position: 'bottom', labels: { color: '#94a3b8', font: { size: 10 }, boxWidth: 10, padding: 12 } },
          tooltip: {
            backgroundColor: '#0d1829', titleColor: '#f0f4ff', bodyColor: '#94a3b8',
            callbacks: { label: ctx => ` ${ctx.dataset.label}: ₹${ctx.raw !== null ? ctx.raw.toFixed(3) : '—'} Cr` }
          }
        },
        scales: {
          x: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#64748b', font: { size: 10 } } },
          y: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#64748b', font: { size: 10 }, callback: v => '₹'+v+'Cr' }, beginAtZero: true }
        }
      }
    });
  }
})();


// ─── S4: PERFORMANCE MATRIX ──────────────────────────────────
(function(){
  const tbody=document.getElementById('perfBody');
  D.quarterly.forEach((q,i)=>{
    const qoqClass=q.qoq_pct>=0?'trend-up':'trend-dn';
    const qoqArrow=q.qoq_pct>=0?'▲':'▼';
    const repW=Math.min(q.repeat_pct*2,100);
    tbody.innerHTML+=`<tr>
      <td><b>${q.name}</b></td>
      <td style="font-family:var(--mono)">${q.total.toLocaleString()}</td>
      <td class="${qoqClass}">${qoqArrow} ${Math.abs(q.qoq_pct)}%</td>
      <td>${q.new.toLocaleString()}</td>
      <td>${q.repeat.toLocaleString()}</td>
      <td><div class="rep-bar"><div style="width:${repW}px;height:5px;border-radius:99px;background:#3b82f6;display:inline-block"></div> ${q.repeat_pct}%</div></td>
      <td>${q.retention_pct}%</td>
      <td style="font-family:var(--mono)">${q.cum_db.toLocaleString()}</td>
      <td style="font-family:var(--mono);color:#f0f4ff">₹${q.revenue_cr}Cr</td>
    </tr>`;
  });
  // Projected rows
  const projRows=[
    {name:'AMJ 2026 (Apr–Jun) proj',total:8500,new:6800,repeat:1700,repeat_pct:20,retention_pct:12,qoq_pct:831,cum_db:33068,revenue_cr:22.0},
    {name:'JAS 2026 (Jul–Sep) proj',total:9200,new:7200,repeat:2000,repeat_pct:22,retention_pct:14,qoq_pct:8.2,cum_db:42268,revenue_cr:26.0},
    {name:'OND 2026 (Oct–Dec) proj',total:9800,new:7400,repeat:2400,repeat_pct:24.5,retention_pct:16,qoq_pct:6.5,cum_db:52068,revenue_cr:30.0},
  ];
  projRows.forEach(q=>{
    tbody.innerHTML+=`<tr style="color:#f59e0b;font-style:italic">
      <td><b style="color:#f59e0b">${q.name}</b></td>
      <td style="font-family:var(--mono)">${q.total.toLocaleString()}</td>
      <td class="trend-up">▲ ${q.qoq_pct}%</td>
      <td>${q.new.toLocaleString()}</td>
      <td>${q.repeat.toLocaleString()}</td>
      <td>${q.repeat_pct}%</td>
      <td>${q.retention_pct}%</td>
      <td style="font-family:var(--mono)">${q.cum_db.toLocaleString()}</td>
      <td style="font-family:var(--mono);color:#f59e0b">₹${q.revenue_cr}Cr</td>
    </tr>`;
  });

})();


// ─── S3: CATEGORY ANALYSIS COMPARISON TOOL ───────────────────
(function(){
  const months = ['2025-08', '2025-09', '2025-10', '2025-11', '2025-12', '2026-01', '2026-02', '2026-03', '2026-04'];
  const monthLabels = {
    '2025-08': 'Aug 2025', '2025-09': 'Sep 2025', '2025-10': 'Oct 2025',
    '2025-11': 'Nov 2025', '2025-12': 'Dec 2025', '2026-01': 'Jan 2026',
    '2026-02': 'Feb 2026', '2026-03': 'Mar 2026', '2026-04': 'Apr 2026'
  };
  const quarters = [
    { key: 'JAS25', label: 'Q3 2025 (Aug–Sep)', months: ['2025-08', '2025-09'] },
    { key: 'OND25', label: 'Q4 2025 (Oct–Dec)', months: ['2025-10', '2025-11', '2025-12'] },
    { key: 'JFM26', label: 'Q1 2026 (Jan–Mar)', months: ['2026-01', '2026-02', '2026-03'] },
    { key: 'AMJ26', label: 'Q2 2026 (Apr)', months: ['2026-04'] }
  ];
  const ytds = [
    { key: 'YTD25', label: 'YTD 2025 (Aug–Dec)', months: ['2025-08', '2025-09', '2025-10', '2025-11', '2025-12'] },
    { key: 'YTD26', label: 'YTD 2026 (Jan–Apr)', months: ['2026-01', '2026-02', '2026-03', '2026-04'] }
  ];

  const compType = document.getElementById('compType');
  if(!compType) return;

  const baseSelect = document.getElementById('basePeriod');
  const compSelect = document.getElementById('compPeriod');
  const catSelect = document.getElementById('compCategory');
  const btnCompare = document.getElementById('btnRunCompare');
  const scorecardBody = document.getElementById('scorecardBody');

  // Populate category options dynamically
  for (let cat in D.categoryProjections) {
    const opt = document.createElement('option');
    opt.value = cat;
    opt.textContent = cat;
    catSelect.appendChild(opt);
  }

  function getMonthsForPeriod(type, key) {
    if (type === 'monthly') return [key];
    if (type === 'quarterly') {
      const q = quarters.find(item => item.key === key);
      return q ? q.months : [];
    }
    if (type === 'ytd') {
      const y = ytds.find(item => item.key === key);
      return y ? y.months : [];
    }
    return [];
  }

  function getPeriodLabel(type, key) {
    if (type === 'monthly') return monthLabels[key];
    if (type === 'quarterly') {
      const q = quarters.find(item => item.key === key);
      return q ? q.label.split(' ')[0] : key;
    }
    if (type === 'ytd') {
      const y = ytds.find(item => item.key === key);
      return y ? y.label.split(' ')[0] : key;
    }
    return key;
  }

  function updatePeriodDropdowns() {
    const type = compType.value;
    baseSelect.innerHTML = '';
    compSelect.innerHTML = '';
    
    if (type === 'monthly') {
      months.forEach(m => {
        baseSelect.add(new Option(monthLabels[m], m));
        compSelect.add(new Option(monthLabels[m], m));
      });
      baseSelect.value = '2026-03';
      compSelect.value = '2026-04';
    } else if (type === 'quarterly') {
      quarters.forEach(q => {
        baseSelect.add(new Option(q.label, q.key));
        compSelect.add(new Option(q.label, q.key));
      });
      baseSelect.value = 'OND25';
      compSelect.value = 'JFM26';
    } else if (type === 'ytd') {
      ytds.forEach(y => {
        baseSelect.add(new Option(y.label, y.key));
        compSelect.add(new Option(y.label, y.key));
      });
      baseSelect.value = 'YTD25';
      compSelect.value = 'YTD26';
    }
  }

  function formatGrowth(val) {
    if (val > 0) return `<span class="trend-up">▲ +${val.toFixed(1)}%</span>`;
    if (val < 0) return `<span class="trend-dn">▼ ${val.toFixed(1)}%</span>`;
    return `<span style="color:#64748b">0.0%</span>`;
  }

  function runComparison() {
    const type = compType.value;
    const baseVal = baseSelect.value;
    const compVal = compSelect.value;
    const selCat = catSelect.value;

    const baseMonths = getMonthsForPeriod(type, baseVal);
    const compMonths = getMonthsForPeriod(type, compVal);

    // Dynamic UI Labels for Selected Period Card
    const baseLabel = getPeriodLabel(type, baseVal);
    const compLabel = getPeriodLabel(type, compVal);
    document.getElementById('compPeriodVal').textContent = `${baseLabel} vs ${compLabel}`;
    document.getElementById('compPeriodSub').textContent = `Type: ${type.toUpperCase()} • Comparing timelines`;

    // Compute stats
    const catData = {};
    let overallBaseSales = 0, overallBaseQty = 0;
    let overallCompSales = 0, overallCompQty = 0;

    for (let cat in D.categoryProjections) {
      const c = D.categoryProjections[cat];
      let bSales = 0, bQty = 0;
      let cSales = 0, cQty = 0;
      
      baseMonths.forEach(m => {
        if (c.monthly_data && c.monthly_data[m]) {
          bSales += c.monthly_data[m].sales_cr;
          bQty += c.monthly_data[m].qty;
        }
      });
      compMonths.forEach(m => {
        if (c.monthly_data && c.monthly_data[m]) {
          cSales += c.monthly_data[m].sales_cr;
          cQty += c.monthly_data[m].qty;
        }
      });

      const bASP = bQty > 0 ? (bSales * 10000000) / bQty : 0;
      const cASP = cQty > 0 ? (cSales * 10000000) / cQty : 0;
      
      const salesGrowth = bSales > 0 ? ((cSales - bSales) / bSales) * 100 : 0;
      const qtyGrowth = bQty > 0 ? ((cQty - bQty) / bQty) * 100 : 0;
      const aspGrowth = bASP > 0 ? ((cASP - bASP) / bASP) * 100 : 0;

      catData[cat] = {
        baseSales: bSales, baseQty: bQty, baseASP: bASP,
        compSales: cSales, compQty: cQty, compASP: cASP,
        salesGrowth, qtyGrowth, aspGrowth
      };

      overallBaseSales += bSales;
      overallBaseQty += bQty;
      overallCompSales += cSales;
      overallCompQty += cQty;
    }

    // Render KPI Cards
    let activeBaseSales = overallBaseSales;
    let activeCompSales = overallCompSales;
    let activeBaseQty = overallBaseQty;
    let activeCompQty = overallCompQty;

    if (selCat !== 'all') {
      activeBaseSales = catData[selCat].baseSales;
      activeCompSales = catData[selCat].compSales;
      activeBaseQty = catData[selCat].baseQty;
      activeCompQty = catData[selCat].compQty;
    }

    const activeBaseASP = activeBaseQty > 0 ? (activeBaseSales * 10000000) / activeBaseQty : 0;
    const activeCompASP = activeCompQty > 0 ? (activeCompSales * 10000000) / activeCompQty : 0;

    const salesGrowthPct = activeBaseSales > 0 ? ((activeCompSales - activeBaseSales) / activeBaseSales) * 100 : 0;
    const qtyGrowthPct = activeBaseQty > 0 ? ((activeCompQty - activeBaseQty) / activeBaseQty) * 100 : 0;
    const aspGrowthPct = activeBaseASP > 0 ? ((activeCompASP - activeBaseASP) / activeBaseASP) * 100 : 0;

    document.getElementById('compSalesVal').textContent = `₹${activeCompSales.toFixed(3)} Cr`;
    document.getElementById('compSalesSub').innerHTML = `vs Base: ${formatGrowth(salesGrowthPct)}`;
    
    document.getElementById('compQtyVal').textContent = activeCompQty.toLocaleString('en-IN');
    document.getElementById('compQtySub').innerHTML = `vs Base: ${formatGrowth(qtyGrowthPct)}`;
    
    document.getElementById('compAspVal').textContent = `₹${Math.round(activeCompASP).toLocaleString('en-IN')}`;
    document.getElementById('compAspSub').innerHTML = `vs Base: ${formatGrowth(aspGrowthPct)}`;

    // Render Table Rows
    scorecardBody.innerHTML = '';
    const targets = selCat === 'all' ? Object.keys(catData) : [selCat];

    // Sort targets by Comp Sales in descending order
    if (selCat === 'all') {
      targets.sort((a, b) => catData[b].compSales - catData[a].compSales);
    }

    targets.forEach(cat => {
      const data = catData[cat];
      const compShare = overallCompSales > 0 ? (data.compSales / overallCompSales) * 100 : 0;
      
      scorecardBody.innerHTML += `<tr>
        <td><b>${cat}</b></td>
        <td style="font-family:var(--mono)">₹${data.baseSales.toFixed(3)} Cr</td>
        <td style="font-family:var(--mono)">₹${data.compSales.toFixed(3)} Cr</td>
        <td>${formatGrowth(data.salesGrowth)}</td>
        <td style="font-family:var(--mono)">${data.baseQty.toLocaleString('en-IN')}</td>
        <td style="font-family:var(--mono)">${data.compQty.toLocaleString('en-IN')}</td>
        <td>${formatGrowth(data.qtyGrowth)}</td>
        <td style="font-family:var(--mono)">₹${Math.round(data.baseASP).toLocaleString('en-IN')}</td>
        <td style="font-family:var(--mono)">₹${Math.round(data.compASP).toLocaleString('en-IN')}</td>
        <td>${formatGrowth(data.aspGrowth)}</td>
        <td style="font-family:var(--mono);font-weight:600">${compShare.toFixed(1)}%</td>
      </tr>`;
    });

    // Total Row
    if (selCat === 'all') {
      const overallBaseASP = overallBaseQty > 0 ? (overallBaseSales * 10000000) / overallBaseQty : 0;
      const overallCompASP = overallCompQty > 0 ? (overallCompSales * 10000000) / overallCompQty : 0;
      const overallSalesGrowth = overallBaseSales > 0 ? ((overallCompSales - overallBaseSales) / overallBaseSales) * 100 : 0;
      const overallQtyGrowth = overallBaseQty > 0 ? ((overallCompQty - overallBaseQty) / overallBaseQty) * 100 : 0;
      const overallAspGrowth = overallBaseASP > 0 ? ((overallCompASP - overallBaseASP) / overallBaseASP) * 100 : 0;

      scorecardBody.innerHTML += `<tr style="border-top:1.5px solid var(--border);background:rgba(109,40,217,0.04);font-weight:700">
        <td><b>Total Summary</b></td>
        <td style="font-family:var(--mono)">₹${overallBaseSales.toFixed(3)} Cr</td>
        <td style="font-family:var(--mono)">₹${overallCompSales.toFixed(3)} Cr</td>
        <td>${formatGrowth(overallSalesGrowth)}</td>
        <td style="font-family:var(--mono)">${overallBaseQty.toLocaleString('en-IN')}</td>
        <td style="font-family:var(--mono)">${overallCompQty.toLocaleString('en-IN')}</td>
        <td>${formatGrowth(overallQtyGrowth)}</td>
        <td style="font-family:var(--mono)">₹${Math.round(overallBaseASP).toLocaleString('en-IN')}</td>
        <td style="font-family:var(--mono)">₹${Math.round(overallCompASP).toLocaleString('en-IN')}</td>
        <td>${formatGrowth(overallAspGrowth)}</td>
        <td style="font-family:var(--mono)">100.0%</td>
      </tr>`;
    }
  }

  // Event Listeners
  compType.addEventListener('change', () => {
    updatePeriodDropdowns();
    runComparison();
  });
  btnCompare.addEventListener('click', runComparison);

  // Initialization
  updatePeriodDropdowns();
  runComparison();
})();


// ─── S7: LSTM SALES INTELLIGENCE DASHBOARD ──────────────────────────────────
(function(){
  /* ── Historical actuals (Aug 2025 – May 2026 MTD) ── */
  const historicalLabels = ['Aug 2025','Sep 2025','Oct 2025','Nov 2025','Dec 2025','Jan 2026','Feb 2026','Mar 2026','Apr 2026','May 2026'];
  const historicalActual = [5.94, 9.64, 5.59, 5.86, 6.42, 5.53, 4.44, 6.80, 6.56, 3.10]; // ₹Cr

  /* ── LSTM back-test predictions (Jan–May window) ── */
  const predictedInSample = [null,null,null,null,null, 5.42, 4.56, 6.64, 6.41, null];

  /* ── Future forecast: Jun–Nov 2026 ── */
  const forecastLabels  = ['Jun 2026','Jul 2026','Aug 2026','Sep 2026','Oct 2026','Nov 2026'];
  const forecastValues  = [6.91,  7.48, 10.85,  7.21,  6.85,  7.15];
  const forecastUpper   = [7.28,  7.94, 11.55,  7.77,  7.45,  7.80];
  const forecastLower   = [6.54,  7.02, 10.15,  6.65,  6.25,  6.50];

  /* ── All labels combined ── */
  const allLabels = [...historicalLabels, ...forecastLabels];

  const actualFull    = [...historicalActual, ...forecastValues.map(()=>null)];
  const predictedFull = [...predictedInSample, ...forecastValues.map(()=>null)];
  const upperFull     = [...historicalActual.map(()=>null), ...forecastUpper];
  const lowerFull     = [...historicalActual.map(()=>null), ...forecastLower];
  const forecastFull  = [...historicalActual.map(()=>null), ...forecastValues];

  /* ── 1. Main Forecast Chart ── */
  const ctxF = document.getElementById('chartLSTMForecast');
  if(ctxF){
    new Chart(ctxF, {
      type: 'line',
      data: {
        labels: allLabels,
        datasets: [
          {
            label: 'Upper Bound (90% CI)',
            data: upperFull,
            borderColor: 'transparent',
            backgroundColor: 'rgba(249,115,22,0.10)',
            fill: '+1',
            pointRadius: 0,
            tension: 0.4,
            order: 4
          },
          {
            label: 'Lower Bound (90% CI)',
            data: lowerFull,
            borderColor: 'transparent',
            backgroundColor: 'rgba(249,115,22,0.10)',
            fill: false,
            pointRadius: 0,
            tension: 0.4,
            order: 5
          },
          {
            label: 'LSTM Forecast',
            data: forecastFull,
            borderColor: '#f97316',
            backgroundColor: 'rgba(249,115,22,0.15)',
            borderWidth: 2.5,
            borderDash: [6,3],
            pointRadius: 4,
            pointBackgroundColor: '#f97316',
            pointBorderColor:'#fff',
            pointBorderWidth:2,
            tension: 0.4,
            fill: false,
            order: 1
          },
          {
            label: 'LSTM Predicted (Test)',
            data: predictedFull,
            borderColor: '#14b8a6',
            borderWidth: 2,
            borderDash: [3,3],
            pointRadius: 4,
            pointBackgroundColor: '#14b8a6',
            pointBorderColor:'#fff',
            pointBorderWidth:2,
            tension: 0.4,
            fill: false,
            order: 2
          },
          {
            label: 'Actual Revenue',
            data: actualFull,
            borderColor: '#3b82f6',
            backgroundColor: 'rgba(59,130,246,0.08)',
            borderWidth: 2.5,
            pointRadius: 5,
            pointBackgroundColor: '#3b82f6',
            pointBorderColor:'#fff',
            pointBorderWidth:2,
            tension: 0.35,
            fill: false,
            order: 0
          }
        ]
      },
      options: {
        responsive: true,
        interaction: { mode:'index', intersect:false },
        plugins: {
          legend: {
            labels: { font:{ size:11 }, usePointStyle:true, pointStyleWidth:10 }
          },
          tooltip: {
            callbacks: {
              label: ctx => {
                if(ctx.parsed.y===null) return null;
                return ` ${ctx.dataset.label}: ₹${ctx.parsed.y.toFixed(2)} Cr`;
              }
            }
          },
          annotation: {
            annotations: {
              divider: {
                type:'line', xMin:9.5, xMax:9.5,
                borderColor:'rgba(249,115,22,0.4)',
                borderWidth:1.5, borderDash:[4,4],
                label:{ content:'Forecast →', enabled:true, position:'start', color:'#f97316', font:{size:10, weight:'700'} }
              },
              target: {
                type:'line', yMin:10, yMax:10,
                borderColor:'rgba(34,197,94,0.6)',
                borderWidth:1.5, borderDash:[4,4],
                label:{ content:'₹10 Cr Target', enabled:true, position:'end', color:'#16a34a', font:{size:10, weight:'700'} }
              }
            }
          }
        },
        scales: {
          x: { grid:{color:'rgba(226,232,240,0.6)'}, ticks:{font:{size:10}, maxRotation:35} },
          y: {
            grid:{color:'rgba(226,232,240,0.6)'},
            ticks:{ font:{size:10}, callback: v=>'₹'+v.toFixed(1)+' Cr' },
            title:{ display:true, text:'Revenue (₹ Crore)', font:{size:10}, color:'#64748b' }
          }
        }
      }
    });
  }

  /* ── 2. Feature Importance Bars ── */
  const features = [
    { name:'Repeat Purchase Rate', shap:0.38, color:'#f97316' },
    { name:'New Customer Volume',  shap:0.24, color:'#3b82f6' },
    { name:'Avg Basket Size',      shap:0.17, color:'#14b8a6' },
    { name:'Seasonality Index',    shap:0.12, color:'#f59e0b' },
    { name:'Days Since Last Visit', shap:0.06, color:'#ea580c' },
    { name:'Category Diversity',   shap:0.03, color:'#22c55e' },
  ];
  const fiDiv = document.getElementById('lstmFeatureImportance');
  if(fiDiv){
    fiDiv.innerHTML = features.map(f=>`
      <div style="margin-bottom:12px;">
        <div style="display:flex;justify-content:space-between;margin-bottom:3px;">
          <span style="font-size:11px;font-weight:600;color:#334155">${f.name}</span>
          <span style="font-size:11px;font-weight:800;color:${f.color};font-family:var(--mono)">${f.shap.toFixed(2)}</span>
        </div>
        <div style="background:rgba(226,232,240,0.6);border-radius:99px;height:8px;overflow:hidden;">
          <div style="width:0%;height:100%;background:linear-gradient(90deg,${f.color},${f.color}88);border-radius:99px;transition:width 1s ease;"
               data-target="${(f.shap/0.38*100).toFixed(1)}%"
               class="lstm-bar"></div>
        </div>
      </div>
    `).join('');
    // Animate bars when section becomes visible
    setTimeout(()=>{
      document.querySelectorAll('.lstm-bar').forEach(b=>{
        b.style.width = b.dataset.target;
      });
    }, 400);
  }

  /* ── 3. Category Forecast Chart ── */
  const ctxC = document.getElementById('chartLSTMCategory');
  if(ctxC){
    const categories = ['Telecom','Consumer Electronics','IT','Accessories','Value Added Service','Others'];
    const jun = [2.93, 2.82, 0.73, 0.30, 0.09, 0.04];
    const jul = [3.17, 3.05, 0.80, 0.32, 0.10, 0.04];
    const aug = [4.60, 4.45, 1.15, 0.48, 0.14, 0.06];
    new Chart(ctxC,{
      type:'bar',
      data:{
        labels: categories,
        datasets:[
          { label:'Jun 2026', data:jun, backgroundColor:'rgba(59,130,246,0.75)', borderRadius:4, borderSkipped:false },
          { label:'Jul 2026', data:jul, backgroundColor:'rgba(249,115,22,0.75)', borderRadius:4, borderSkipped:false },
          { label:'Aug 2026', data:aug, backgroundColor:'rgba(34,197,94,0.75)',  borderRadius:4, borderSkipped:false }
        ]
      },
      options:{
        responsive:true,
        plugins:{
          legend:{ labels:{ font:{size:11}, usePointStyle:true } },
          tooltip:{ callbacks:{ label: c=>' ₹'+c.parsed.y.toFixed(2)+' Cr' } }
        },
        scales:{
          x:{ grid:{display:false}, ticks:{font:{size:10}} },
          y:{ grid:{color:'rgba(226,232,240,0.6)'}, ticks:{ callback:v=>'₹'+v.toFixed(1)+' Cr', font:{size:10} } }
        }
      }
    });
  }

  /* ── 4. Model Accuracy Table ── */
  const accuracyData = [
    { month:'Jan 2026', actual:5.53, predicted:5.42 },
    { month:'Feb 2026', actual:4.44, predicted:4.56 },
    { month:'Mar 2026', actual:6.80, predicted:6.64 },
    { month:'Apr 2026', actual:6.56, predicted:6.41 },
  ];
  const tbody = document.getElementById('lstmAccuracyBody');
  if(tbody){
    tbody.innerHTML = accuracyData.map(r=>{
      const err = Math.abs((r.predicted - r.actual)/r.actual*100);
      const ok  = err < 5;
      const badge = ok
        ? `<span class="badge-green" style="font-size:10px;padding:2px 8px">✓ Good</span>`
        : `<span class="badge-red"   style="font-size:10px;padding:2px 8px">⚠ Review</span>`;
      const errColor = ok ? '#15803d' : '#b91c1c';
      return `<tr>
        <td style="font-weight:600">${r.month}</td>
        <td style="font-family:var(--mono)">₹${r.actual.toFixed(2)}</td>
        <td style="font-family:var(--mono)">₹${r.predicted.toFixed(2)}</td>
        <td style="font-weight:700;color:${errColor};font-family:var(--mono)">${err.toFixed(1)}%</td>
        <td>${badge}</td>
      </tr>`;
    }).join('');
  }

  /* ── Re-animate bars whenever S7 section is clicked ── */
  document.querySelectorAll('.nav-link').forEach(link=>{
    link.addEventListener('click', ()=>{
      if(link.getAttribute('href')==='#s7'){
        setTimeout(()=>{
          document.querySelectorAll('.lstm-bar').forEach(b=>{ b.style.width = b.dataset.target; });
        }, 350);
      }
    });
  });
})();
