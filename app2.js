/* ═══════════════════════════════════════════════════
   KOTTAYAM RETAIL — app2.js (Customer + Inventory + Growth)
   ═══════════════════════════════════════════════════ */

// ─── CUSTOMER 360 TAB ────────────────────────────────

// Cohort Retention
(function() {
  const ctx = document.getElementById('chartCohort');
  if (!ctx) return;
  const months = ['Month 0','Month 1','Month 2','Month 3','Month 4','Month 5'];
  new Chart(ctx, {
    type: 'line',
    data: {
      labels: months,
      datasets: [
        { label: 'Nov Cohort', data: [100,62,48,38,31,28], borderColor:'#3b82f6', fill:false, tension:0.4, borderWidth:2, pointRadius:4, pointBackgroundColor:'#3b82f6' },
        { label: 'Oct Cohort', data: [100,58,44,35,29,null], borderColor:'#f97316', fill:false, tension:0.4, borderWidth:2, pointRadius:4, pointBackgroundColor:'#f97316' },
        { label: 'Sep Cohort', data: [100,64,50,40,null,null], borderColor:'#14b8a6', fill:false, tension:0.4, borderWidth:2, pointRadius:4, pointBackgroundColor:'#14b8a6' },
        { label: 'Aug Cohort', data: [100,61,47,null,null,null], borderColor:'#f59e0b', fill:false, tension:0.4, borderWidth:2, pointRadius:4, pointBackgroundColor:'#f59e0b' },
      ]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position:'top', labels:{ color:'#94a3b8', font:{size:12.5}, boxWidth:10 } },
        tooltip: { backgroundColor:'#0d1829', titleColor:'#f0f4ff', bodyColor:'#94a3b8',
          callbacks:{ label: ctx => ` ${ctx.dataset.label}: ${ctx.raw}% retention` } }
      },
      scales: {
        x: { grid:{color:'rgba(255,255,255,0.04)'}, ticks:{color:'#64748b', font:{size:12.5}} },
        y: { grid:{color:'rgba(255,255,255,0.04)'}, ticks:{color:'#64748b', font:{size:12.5}, callback: v=>v+'%'}, min:0, max:100 }
      }
    }
  });
})();

// New vs Repeat
(function() {
  const ctx = document.getElementById('chartNewRepeat');
  if (!ctx) return;
  const months = ['Jun','Jul','Aug','Sep','Oct','Nov','Dec','Jan'];
  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: months,
      datasets: [
        { label:'New Customers', data:[880,920,960,1010,1080,1120,1180,1240],
          backgroundColor:'rgba(59,130,246,0.8)', borderRadius:5, stack:'s' },
        { label:'Repeat Customers', data:[1640,1720,1780,1820,1900,1960,2040,2080],
          backgroundColor:'rgba(20,184,166,0.7)', borderRadius:5, stack:'s' }
      ]
    },
    options: {
      responsive: true,
      plugins: { legend:{ position:'bottom', labels:{ color:'#94a3b8', font:{size:12.5}, boxWidth:10 } },
        tooltip:{ backgroundColor:'#0d1829', titleColor:'#f0f4ff', bodyColor:'#94a3b8' } },
      scales: {
        x: { stacked:true, grid:{display:false}, ticks:{color:'#64748b', font:{size:12.5}} },
        y: { stacked:true, grid:{color:'rgba(255,255,255,0.04)'}, ticks:{color:'#64748b', font:{size:12.5}} }
      }
    }
  });
})();

// Frequency Distribution
(function() {
  const ctx = document.getElementById('chartFrequency');
  if (!ctx) return;
  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['1x/month','2x/month','3x/month','4x/month','5x+/month'],
      datasets: [{
        label: 'Customer Count',
        data: [3240, 2180, 1420, 680, 340],
        backgroundColor: ['rgba(239,68,68,0.7)','rgba(245,158,11,0.7)','rgba(59,130,246,0.7)','rgba(20,184,166,0.8)','rgba(34,197,94,0.9)'],
        borderRadius: 8, borderSkipped: false
      }]
    },
    options: {
      responsive: true,
      plugins: { legend:{display:false}, tooltip:{ backgroundColor:'#0d1829', bodyColor:'#94a3b8' } },
      scales: {
        x: { grid:{display:false}, ticks:{color:'#64748b', font:{size:12.5}} },
        y: { grid:{color:'rgba(255,255,255,0.04)'}, ticks:{color:'#64748b', font:{size:12.5}} }
      }
    }
  });
})();

// NRI Spending Cycle
(function() {
  const ctx = document.getElementById('chartNRI');
  if (!ctx) return;
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const nri    = [48,12,8,10,9,18,22,14,10,12,16,42];
  const g = ctx.getContext('2d');
  const grad = g.createLinearGradient(0,0,0,ctx.canvas.offsetHeight||150);
  grad.addColorStop(0,'rgba(245,166,35,0.5)'); grad.addColorStop(1,'rgba(245,166,35,0.02)');
  new Chart(ctx, {
    type: 'line',
    data: {
      labels: months,
      datasets: [
        { label:'NRI Segment Revenue (₹L)', data:nri, borderColor:'#f5a623',
          backgroundColor: grad, fill:true, tension:0.4, borderWidth:2.5,
          pointRadius:4, pointBackgroundColor:'#f5a623' }
      ]
    },
    options: {
      responsive: true,
      plugins: { legend:{display:false},
        annotation: { annotations: {
          dec: { type:'box', xMin:11.5, xMax:12.5, backgroundColor:'rgba(245,166,35,0.08)', borderColor:'rgba(245,166,35,0.3)', borderWidth:1, label:{content:'NRI Peak',display:true,color:'#f5a623',font:{size:11.5}} },
          jan: { type:'box', xMin:-0.5, xMax:0.5, backgroundColor:'rgba(245,166,35,0.08)', borderColor:'rgba(245,166,35,0.3)', borderWidth:1 }
        }},
        tooltip: { backgroundColor:'#0d1829', titleColor:'#f0f4ff', bodyColor:'#94a3b8',
          callbacks:{ label: ctx => ' ₹'+ctx.raw+'L NRI revenue' } }
      },
      scales: {
        x: { grid:{display:false}, ticks:{color:'#64748b', font:{size:12.5}} },
        y: { grid:{color:'rgba(255,255,255,0.04)'}, ticks:{color:'#64748b', font:{size:12.5}, callback: v=>'₹'+v+'L'} }
      }
    }
  });
})();

// Loyalty Engagement
(function() {
  const ctx = document.getElementById('chartLoyalty');
  if (!ctx) return;
  new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels:['Active Redeemers','Points Earned Only','Enrolled Not Active','Non-Loyalty'],
      datasets:[{ data:[28,34,18,20],
        backgroundColor:['rgba(34,197,94,0.85)','rgba(59,130,246,0.75)','rgba(245,158,11,0.7)','rgba(71,85,105,0.6)'],
        borderWidth:2, borderColor:'#060a12', hoverOffset:8 }]
    },
    options: {
      responsive:true, cutout:'65%',
      plugins: {
        legend:{ position:'bottom', labels:{ color:'#94a3b8', font:{size:11.5}, boxWidth:9, padding:8 } },
        tooltip:{ backgroundColor:'#0d1829', callbacks:{ label: ctx=>' '+ctx.label+': '+ctx.raw+'%' } }
      }
    }
  });
})();

// Geo Table
const GEO_DATA = [
  { area:'Kottayam Town',      share:42, atv:1240, delivery:320, growth:'+8.2%' },
  { area:'Changanassery',      share:14, atv:1080, delivery:840, growth:'+14.6%' },
  { area:'Pala',               share:11, atv:1120, delivery:620, growth:'+11.2%' },
  { area:'Ettumanoor',         share:9,  atv:980,  delivery:410, growth:'+9.8%' },
  { area:'Kanjirappally',      share:7,  atv:960,  delivery:280, growth:'+6.4%' },
  { area:'Other / Walk-in',    share:17, atv:820,  delivery:0,   growth:'+3.1%' },
];
(function() {
  const tbody = document.getElementById('geoTableBody');
  if (!tbody) return;
  GEO_DATA.forEach(r => {
    const gClass = parseFloat(r.growth) >= 10 ? 'badge-green' : parseFloat(r.growth) >= 7 ? 'badge-blue' : 'badge-yellow';
    tbody.innerHTML += `<tr>
      <td><b>${r.area}</b></td>
      <td><div style="display:flex;align-items:center;gap:8px">
        <div style="flex:1;height:4px;background:rgba(255,255,255,0.07);border-radius:99px">
          <div style="width:${r.share*2.38}%;height:100%;background:#3b82f6;border-radius:99px"></div>
        </div>${r.share}%</div></td>
      <td>₹${r.atv.toLocaleString()}</td>
      <td>${r.delivery > 0 ? r.delivery + ' orders' : '—'}</td>
      <td><span class="badge ${gClass}">${r.growth}</span></td>
    </tr>`;
  });
})();

// ─── INVENTORY WAR ROOM ──────────────────────────────

// Inventory Turnover by Category
(function() {
  const ctx = document.getElementById('chartInvTurnover');
  if (!ctx) return;
  const cats   = ['Staples','Dairy','Personal Care','Beverages','Snacks','Home Care','Apparel','Electronics'];
  const turns  = [9.2, 14.8, 6.4, 8.1, 7.2, 4.8, 2.9, 1.8];
  const margins= [22,  18,   38,  32,  35,  28,  44,  18 ];
  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: cats,
      datasets: [
        { label:'Inventory Turnover (x/yr)', data:turns,
          backgroundColor:'rgba(59,130,246,0.75)', borderRadius:6, yAxisID:'y' },
        { label:'Gross Margin %', data:margins, type:'line',
          borderColor:'#f59e0b', borderWidth:2.5, pointRadius:5,
          pointBackgroundColor:'#f59e0b', fill:false, yAxisID:'y1' }
      ]
    },
    options: {
      responsive:true, interaction:{ mode:'index' },
      plugins: {
        legend:{ position:'top', labels:{ color:'#94a3b8', font:{size:12.5}, boxWidth:10 } },
        tooltip:{ backgroundColor:'#0d1829', titleColor:'#f0f4ff', bodyColor:'#94a3b8' }
      },
      scales: {
        x: { grid:{display:false}, ticks:{color:'#64748b', font:{size:12.5}} },
        y: { grid:{color:'rgba(255,255,255,0.04)'}, ticks:{color:'#64748b', font:{size:12.5}, callback:v=>v+'x'} },
        y1:{ position:'right', grid:{display:false}, ticks:{color:'#f59e0b', font:{size:12.5}, callback:v=>v+'%'} }
      }
    }
  });
})();

// Stock-out by Category
(function() {
  const ctx = document.getElementById('chartStockout');
  if (!ctx) return;
  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['Staples','Dairy','Personal\nCare','Beverages','Snacks','Home\nCare'],
      datasets: [{
        label:'Stock-out Incidents',
        data:[8,4,3,3,2,3],
        backgroundColor:['rgba(239,68,68,0.85)','rgba(239,68,68,0.7)','rgba(245,158,11,0.7)',
          'rgba(245,158,11,0.65)','rgba(59,130,246,0.6)','rgba(59,130,246,0.6)'],
        borderRadius:8, borderSkipped:false
      }]
    },
    options: {
      responsive:true, indexAxis:'y',
      plugins:{ legend:{display:false}, tooltip:{ backgroundColor:'#0d1829' } },
      scales: {
        x:{ grid:{color:'rgba(255,255,255,0.04)'}, ticks:{color:'#64748b', font:{size:12.5}} },
        y:{ grid:{display:false}, ticks:{color:'#94a3b8', font:{size:12.5}} }
      }
    }
  });
})();

// Top SKU Table
const TOP_SKUS = [
  { rank:1,  sku:'Basmati Rice 5kg',       cat:'Staples',       rev:'₹4.8L', margin:'22%', days:3,  alert:'reorder' },
  { rank:2,  sku:'Coconut Oil 1L (Parachute)', cat:'Staples',   rev:'₹3.6L', margin:'18%', days:12, alert:'ok' },
  { rank:3,  sku:'Ariel Powder 3kg',        cat:'Home Care',     rev:'₹2.8L', margin:'28%', days:6,  alert:'low' },
  { rank:4,  sku:'Aashirvaad Atta 10kg',    cat:'Staples',       rev:'₹2.6L', margin:'20%', days:8,  alert:'ok' },
  { rank:5,  sku:'Sunflower Oil 5L',         cat:'Staples',       rev:'₹2.4L', margin:'16%', days:4,  alert:'reorder' },
  { rank:6,  sku:'Dove Shampoo 650ml',       cat:'Personal Care', rev:'₹2.2L', margin:'38%', days:18, alert:'ok' },
  { rank:7,  sku:'Tata Tea Premium 500g',    cat:'Beverages',     rev:'₹2.0L', margin:'30%', days:14, alert:'ok' },
  { rank:8,  sku:'Surf Excel 3kg',           cat:'Home Care',     rev:'₹1.9L', margin:'26%', days:9,  alert:'low' },
  { rank:9,  sku:'Colgate Total 300g',       cat:'Personal Care', rev:'₹1.8L', margin:'35%', days:22, alert:'ok' },
  { rank:10, sku:'Hide & Seek Biscuits 400g',cat:'Snacks',        rev:'₹1.7L', margin:'34%', days:16, alert:'ok' },
];
(function() {
  const tbody = document.getElementById('skuTableBody');
  if (!tbody) return;
  TOP_SKUS.forEach(s => {
    const a = s.alert==='reorder' ? '<span class="badge badge-red">Reorder Now</span>'
            : s.alert==='low'     ? '<span class="badge badge-yellow">Low Stock</span>'
            :                       '<span class="badge badge-green">OK</span>';
    const daysColor = s.days <= 5 ? 'color:#ef4444;font-weight:700' : s.days <= 10 ? 'color:#f59e0b;font-weight:600' : 'color:#94a3b8';
    tbody.innerHTML += `<tr>
      <td style="color:#64748b;font-family:var(--font-mono)">#${s.rank}</td>
      <td><b style="color:#f0f4ff">${s.sku}</b></td>
      <td><span class="badge badge-blue">${s.cat}</span></td>
      <td style="font-family:var(--font-mono);color:#f0f4ff">${s.rev}</td>
      <td>${s.margin}</td>
      <td style="${daysColor}">${s.days}d</td>
      <td>${a}</td>
    </tr>`;
  });
})();

// ─── GROWTH EXPERIMENTS TAB ──────────────────────────

// Marketing ROI
(function() {
  const ctx = document.getElementById('chartMarketingROI');
  if (!ctx) return;
  const channels = ['WhatsApp\nBroadcast','Google\nAds','Instagram','Newspaper\nAds','SMS\nCampaigns','Loyalty\nReferral','In-store\nPOS'];
  const cac      = [84,  320, 280, 480, 210, 140, 60 ];
  const revenue  = [8.2, 4.2, 3.8, 2.1, 4.8, 6.4, 12.1];
  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: channels,
      datasets: [
        { label:'CAC (₹)', data:cac, backgroundColor:'rgba(239,68,68,0.7)', borderRadius:6, yAxisID:'y' },
        { label:'Revenue Attributed (₹L)', data:revenue, type:'line',
          borderColor:'#22c55e', borderWidth:2.5, pointRadius:5,
          pointBackgroundColor:'#22c55e', fill:false, yAxisID:'y1' }
      ]
    },
    options: {
      responsive:true, interaction:{ mode:'index' },
      plugins:{ legend:{ position:'top', labels:{ color:'#94a3b8', font:{size:12.5}, boxWidth:10 } },
        tooltip:{ backgroundColor:'#0d1829', titleColor:'#f0f4ff', bodyColor:'#94a3b8' } },
      scales: {
        x:{ grid:{display:false}, ticks:{color:'#64748b', font:{size:11.5}} },
        y:{ grid:{color:'rgba(255,255,255,0.04)'}, ticks:{color:'#ef4444', font:{size:12.5}, callback:v=>'₹'+v}, title:{display:true,text:'CAC (₹)',color:'#ef4444',font:{size:12.5}} },
        y1:{ position:'right', grid:{display:false}, ticks:{color:'#22c55e', font:{size:12.5}, callback:v=>'₹'+v+'L'}, title:{display:true,text:'Revenue (₹L)',color:'#22c55e',font:{size:12.5}} }
      }
    }
  });
})();

// Campaign Attribution Donut
(function() {
  const ctx = document.getElementById('chartAttribution');
  if (!ctx) return;
  new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels:['WhatsApp','In-store Upsell','Loyalty Referral','Google Ads','Instagram','SMS','Organic / Walk-in'],
      datasets:[{ data:[24,22,16,12,8,6,12],
        backgroundColor:['#22c55e','#3b82f6','#14b8a6','#f97316','#ec4899','#f59e0b','#475569'],
        borderWidth:2, borderColor:'#060a12', hoverOffset:10 }]
    },
    options:{ responsive:true, cutout:'65%',
      plugins:{ legend:{ position:'right', labels:{ color:'#94a3b8', font:{size:11.5}, boxWidth:9, padding:6 } },
        tooltip:{ backgroundColor:'#0d1829', callbacks:{ label:ctx=>' '+ctx.label+': '+ctx.raw+'%' } } }
    }
  });
})();

// 90-Day Predictive Forecast
(function() {
  const ctx = document.getElementById('chartForecast');
  if (!ctx) return;
  const labels = [];
  const now = new Date(2026,4,12);
  for(let i=0;i<90;i+=5){
    const d = new Date(now); d.setDate(d.getDate()+i);
    labels.push(d.toLocaleDateString('en-IN',{day:'2-digit',month:'short'}));
  }
  const base      = [6.24,6.31,6.38,6.44,6.50,6.57,6.65,6.80,6.95,7.10,7.28,7.42,7.55,7.70,7.82,7.90,7.96,8.04];
  const upperBound= base.map((v,i)=>+(v+0.18+i*0.015).toFixed(2));
  const lowerBound= base.map((v,i)=>+(v-0.14-i*0.01).toFixed(2));
  const g = ctx.getContext('2d');
  const grad = g.createLinearGradient(0,0,0,ctx.canvas.offsetHeight||200);
  grad.addColorStop(0,'rgba(249,115,22,0.3)'); grad.addColorStop(1,'rgba(249,115,22,0.01)');
  new Chart(ctx, {
    type:'line',
    data:{ labels,
      datasets:[
        { label:'Forecast', data:base, borderColor:'#f97316', fill:false, tension:0.4, borderWidth:2.5, pointRadius:3, pointBackgroundColor:'#f97316' },
        { label:'Upper Bound', data:upperBound, borderColor:'rgba(249,115,22,0.25)', fill:'+1', tension:0.4, borderWidth:1, pointRadius:0, backgroundColor:'rgba(249,115,22,0.1)' },
        { label:'Lower Bound', data:lowerBound, borderColor:'rgba(249,115,22,0.25)', fill:false, tension:0.4, borderWidth:1, pointRadius:0 },
        { label:'Target', data:labels.map(()=>10), borderColor:'rgba(245,166,35,0.6)', borderDash:[6,3], borderWidth:1.5, pointRadius:0, fill:false }
      ]
    },
    options:{
      responsive:true,
      plugins:{ legend:{ position:'top', labels:{ color:'#94a3b8', font:{size:11.5}, boxWidth:9, filter: item=>item.text!=='Upper Bound'&&item.text!=='Lower Bound' } },
        tooltip:{ backgroundColor:'#0d1829', titleColor:'#f0f4ff', bodyColor:'#94a3b8', callbacks:{ label:ctx=>' '+ctx.dataset.label+': ₹'+ctx.raw+'Cr' } } },
      scales:{
        x:{ grid:{display:false}, ticks:{color:'#64748b', font:{size:11.5}, maxTicksLimit:8} },
        y:{ grid:{color:'rgba(255,255,255,0.04)'}, ticks:{color:'#64748b', font:{size:12.5}, callback:v=>'₹'+v+'Cr'}, min:5.5, max:11 }
      }
    }
  });
})();

// Delivery by Town
(function() {
  const ctx = document.getElementById('chartDelivery');
  if (!ctx) return;
  const months = ['Feb','Mar','Apr','May'];
  new Chart(ctx, {
    type:'bar',
    data:{
      labels: months,
      datasets:[
        { label:'Kottayam',    data:[42,48,52,58], backgroundColor:'rgba(59,130,246,0.8)', borderRadius:5, stack:'s' },
        { label:'Changanassery',data:[18,22,28,34], backgroundColor:'rgba(20,184,166,0.75)', borderRadius:5, stack:'s' },
        { label:'Pala',        data:[12,14,18,22], backgroundColor:'rgba(249,115,22,0.7)', borderRadius:5, stack:'s' },
        { label:'Ettumanoor',  data:[8, 10,12,16], backgroundColor:'rgba(245,158,11,0.75)', borderRadius:5, stack:'s' },
      ]
    },
    options:{
      responsive:true,
      plugins:{ legend:{ position:'bottom', labels:{ color:'#94a3b8', font:{size:11.5}, boxWidth:9 } },
        tooltip:{ backgroundColor:'#0d1829', bodyColor:'#94a3b8' } },
      scales:{
        x:{ stacked:true, grid:{display:false}, ticks:{color:'#64748b', font:{size:12.5}} },
        y:{ stacked:true, grid:{color:'rgba(255,255,255,0.04)'}, ticks:{color:'#64748b', font:{size:12.5}, callback:v=>'₹'+v+'L'} }
      }
    }
  });
})();

// A/B Experiments
const AB_TESTS = [
  { name:'Bundle Offer: Oil+Atta+Dal', status:'running', lift:'+9.2% ATV', conf:'82% confidence', days:'Day 14/21' },
  { name:'Evening Happy Hour 6–7 PM',  status:'winner',  lift:'+22% footfall in slot', conf:'96% confidence', days:'Concluded' },
  { name:'WhatsApp Reminder vs SMS',    status:'running', lift:'+6.1% open rate WA', conf:'74% confidence', days:'Day 7/14' },
  { name:'Premium Shelf Placement',     status:'neutral', lift:'+1.2% margin (insignificant)', conf:'41% confidence', days:'Day 21/21' },
];
(function() {
  const list = document.getElementById('abList');
  if (!list) return;
  AB_TESTS.forEach(t => {
    const liftClass = t.status==='winner'?'ab-lift':t.status==='neutral'?'ab-neutral':'ab-lift';
    list.innerHTML += `<div class="ab-item">
      <div class="ab-name">${t.name}</div>
      <div class="ab-meta">
        <span>${t.days}</span>
        <span class="${liftClass}">${t.lift}</span>
        <span>${t.conf}</span>
      </div>
    </div>`;
  });
})();

// Campaign Table
const CAMPAIGNS = [
  { name:'Onam Preview Sale',    ch:'WhatsApp',  spend:'28,400', reach:'12,400', conv:1480, cac:19,  rev:'8,20,000', roas:'28.9x' },
  { name:'Google Local Ads',     ch:'Google',    spend:'42,000', reach:'38,000', conv:360,  cac:117, rev:'3,60,000', roas:'8.6x' },
  { name:'Instagram Reel Boost', ch:'Instagram', spend:'18,000', reach:'24,000', conv:180,  cac:100, rev:'2,10,000', roas:'11.7x' },
  { name:'Newspaper Insert',     ch:'Print',     spend:'36,000', reach:'60,000', conv:120,  cac:300, rev:'1,80,000', roas:'5.0x' },
  { name:'Loyalty Referral',     ch:'Loyalty',   spend:'12,000', reach:'8,400',  conv:340,  cac:35,  rev:'4,80,000', roas:'40.0x' },
  { name:'SMS Blast — Festive',  ch:'SMS',       spend:'8,200',  reach:'9,200',  conv:180,  cac:46,  rev:'2,40,000', roas:'29.3x' },
];
(function() {
  const tbody = document.getElementById('campaignTableBody');
  if (!tbody) return;
  CAMPAIGNS.forEach(c => {
    const roasNum = parseFloat(c.roas);
    const roasClass = roasNum>=20?'badge-green':roasNum>=10?'badge-blue':roasNum>=5?'badge-yellow':'badge-red';
    tbody.innerHTML += `<tr>
      <td><b style="color:#f0f4ff">${c.name}</b></td>
      <td><span class="badge badge-blue">${c.ch}</span></td>
      <td style="font-family:var(--font-mono)">₹${c.spend}</td>
      <td>${parseInt(c.reach).toLocaleString()}</td>
      <td style="color:#22c55e;font-weight:600">${c.conv.toLocaleString()}</td>
      <td style="font-family:var(--font-mono)">₹${c.cac}</td>
      <td style="font-family:var(--font-mono);color:#f0f4ff">₹${c.rev}</td>
      <td><span class="badge ${roasClass}">${c.roas}</span></td>
    </tr>`;
  });
})();
