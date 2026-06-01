/* ═══ CATCHMENT MODULE JS ═══ */
'use strict';

// Ensure data is loaded
const D = typeof CATCHMENT_DATA !== 'undefined' ? CATCHMENT_DATA : null;

/* ── HELPERS ── */
const fmtRev = n => `₹${(n/100).toFixed(2)}Cr`;
// ========== DEFAULT SECTIONS RENDERING ==========
Chart.defaults.font.family = "'Calibri', 'Outfit', sans-serif";
Chart.defaults.font.size = 14;
Chart.defaults.color = '#94a3b8';
Chart.defaults.borderColor = 'rgba(59,130,246,0.08)';
Chart.defaults.plugins.legend.labels.font = { family: "'Calibri', 'Outfit', sans-serif", size: 12.5 };
Chart.defaults.plugins.tooltip.bodyFont = { family: "'Calibri', 'Outfit', sans-serif", size: 12.5 };
Chart.defaults.plugins.tooltip.titleFont = { family: "'Calibri', 'Outfit', sans-serif", size: 13.5, weight: 'bold' };

function renderRings() {
  if (!D) return;
  const colors = ['','#3b82f6','#ea580c','#14b8a6','#f59e0b','#ec4899'];
  const grid = document.getElementById('ringsGrid');
  if(!grid) return;
  grid.innerHTML = D.rings.map(r => {
    const pct = Math.min((r.pct / (r.target || r.pct)) * 100, 100);
    const ok = r.pct >= r.target * 0.9;
    return `<div class="ring-card" style="--ring-color:${colors[r.id]}">
      <div class="ring-card-label">${r.label}</div>
      <div class="ring-card-pct" style="color:${colors[r.id]}">${r.pct.toFixed(1)}%</div>
      <div class="ring-card-target">Target: ${r.target ? r.target.toFixed(1) : '—'}% ${r.target ? (ok ? '✅' : '⚠️') : ''}</div>
      <div class="ring-progress"><div class="ring-progress-fill" style="width:${pct}%;background:${colors[r.id]}"></div></div>
      <div class="ring-card-meta">
        <b>${r.cust.toLocaleString()}</b> customers<br>
        <b>${fmtRev(r.rev)}</b> revenue<br>
        ATV: <b>₹${r.atv.toLocaleString()}</b><br>
        ${r.delivDep ? `Delivery Cost Ratio: <b>${r.delivDep}%</b>` : 'Walk-in zone'}
      </div>
    </div>`;
  }).join('');
}

function renderCharts() {
  if (!D) return;
  const colors = ['#3b82f6','#ea580c','#14b8a6','#f59e0b','#ec4899'];
  const labels = D.monthlyTrend.labels;
  
  const ctxTrend = document.getElementById('chartRingTrend');
  if(ctxTrend) {
    new Chart(ctxTrend, {
      type:'line',
      data:{
        labels,
        datasets:[
          {label:'0–5km Core',  data:D.monthlyTrend.ring1, borderColor:colors[0], backgroundColor:'rgba(59,130,246,0.06)', tension:0.4, fill:true, borderWidth:2.5, pointRadius:3},
          {label:'5–10km',      data:D.monthlyTrend.ring2, borderColor:colors[1], backgroundColor:'transparent', tension:0.4, borderWidth:2, pointRadius:2},
          {label:'10–15km',     data:D.monthlyTrend.ring3, borderColor:colors[2], backgroundColor:'transparent', tension:0.4, borderWidth:2, pointRadius:2},
          {label:'15–20km',     data:D.monthlyTrend.ring4, borderColor:colors[3], backgroundColor:'transparent', tension:0.4, borderWidth:2, pointRadius:2},
        ]
      },
      options:{responsive:true, plugins:{legend:{position:'top',labels:{boxWidth:10,font:{size:12.5}}}}, scales:{y:{grid:{color:'rgba(255,255,255,0.04)'},ticks:{font:{size:12.5}}},x:{grid:{display:false},ticks:{font:{size:12.5}}}}}
    });
  }

  const ctxDonut = document.getElementById('chartRingDonut');
  if(ctxDonut) {
    new Chart(ctxDonut, {
      type:'doughnut',
      data:{
        labels:D.rings.map(r=>r.label),
        datasets:[{data:D.rings.map(r=>r.pct), backgroundColor:['rgba(59,130,246,0.8)','rgba(234,88,12,0.8)','rgba(20,184,166,0.8)','rgba(245,158,11,0.8)','rgba(236,72,153,0.8)'], borderWidth:0, hoverOffset:8}]
      },
      options:{responsive:true, cutout:'70%', plugins:{legend:{position:'right',labels:{boxWidth:10,font:{size:12.5}}}}}
    });
  }
}

function renderDelivery() {
  if (!D) return;
  const tbody = document.getElementById('deliveryBody');
  if(!tbody) return;
  tbody.innerHTML = D.deliveryZones.map(z => {
    const costPct = (z.delivCost).toFixed(1);
    const flagged = z.delivCost > 4.0;
    const tip = flagged ? 'Optimize delivery routes' : '✅ Profitable';
    return `<tr>
      <td><code class="pcode">${z.code}</code></td>
      <td>${z.area}</td>
      <td>₹${(z.rev/100).toFixed(2)}Cr</td>
      <td>${z.orders.toLocaleString()}</td>
      <td style="font-family:var(--font-mono);${parseFloat(costPct)>4?'color:#fca5a5;font-weight:700':''}">${costPct}%</td>
      <td>${z.netMargin.toFixed(1)}%</td>
      <td>
        <div style="display:flex;align-items:center;gap:8px">
          <div style="flex:1;height:6px;background:rgba(255,255,255,0.06);border-radius:99px;overflow:hidden">
            <div style="width:${z.movAchieved}%;height:100%;background:${z.movAchieved>70?'#22c55e':z.movAchieved>50?'#f59e0b':'#ef4444'};border-radius:99px"></div>
          </div>
          <span style="font-size:11px;font-weight:700;font-family:var(--font-mono)">${z.movAchieved}%</span>
        </div>
      </td>
      <td><span class="${flagged?'deliv-warn':'deliv-ok'} deliv-flag">${flagged?'⚠️':''}</span> <span class="optimizer-tip">${tip}</span></td>
    </tr>`;
  }).join('');
}

function renderOpportunities() {
  if (!D) return;
  const grid = document.getElementById('opportunityGrid');
  if(!grid) return;
  grid.innerHTML = D.topOpportunities.map((o, i) => `
    <div class="opp-card">
      <div class="opp-rank">#${i+1} High Impact Pincode</div>
      <div class="opp-code">${o.code}</div>
      <div class="opp-area">📍 ${o.area}</div>
      <div class="opp-potential">₹${o.potential.toFixed(2)}Cr <span>gap to target</span></div>
      <div class="opp-reason">${o.reason}</div>
      <ul class="opp-checklist">
        <li><input type="checkbox" checked disabled> QR campaign deployed?</li>
        <li><input type="checkbox" disabled> Repeat purchase rate >20%?</li>
        <li><input type="checkbox" disabled> AOV trending up?</li>
        <li><input type="checkbox" disabled> Delivery feasibility confirmed?</li>
      </ul>
    </div>`).join('');
}

function initDashboard() {
  if(D) {
    // Total unique customer count from base SQLite data
    const custCount = D.baseMobiles ? D.baseMobiles.length : 0;
    document.getElementById('glanceTotalCust').innerText = custCount.toLocaleString('en-IN');
    document.getElementById('glanceCoreShare').innerText = D.meta.coreRevPct.toFixed(1) + '%';
    renderRings();
    renderCharts();
    renderDelivery();
    renderOpportunities();
    preloadBaseData();
  }
}

document.addEventListener('DOMContentLoaded', initDashboard);

// ========== PRE VS POST MARKETING TRACKER LOGIC ==========

let fileData = { marketing: null, post: null, base: null };
let preloadedBaseMobiles = null;

async function preloadBaseData() {
  const statusEl = document.getElementById('baseLoadingStatus');
  
  if (statusEl) {
    statusEl.innerHTML = `⏳ Auto-loading Kottayam Complete Data till April 27.xlsx...`;
    statusEl.style.color = '#94a3b8';
  }
  
  try {
    const res = await fetch('/api/base_mobiles');
    if (!res.ok) throw new Error("Base data not pre-loaded on server");
    const data = await res.json();
    
    if (data.mobiles && data.mobiles.length > 0) {
      preloadedBaseMobiles = new Set(data.mobiles);
      if (statusEl) {
        statusEl.innerHTML = `🟢 ✓ Base loaded: ${data.filename} (${data.mobiles.length.toLocaleString('en-IN')} customers)`;
        statusEl.style.color = '#4ade80';
      }
      
      fileData.base = { name: data.filename, isPreloaded: true };
      
      // Auto enable button if marketing and post files are already selected
      if (fileData.marketing && fileData.post) {
        document.getElementById('processBtn').disabled = false;
      }
    } else {
      throw new Error("Empty base dataset received");
    }
  } catch (err) {
    console.warn("Base data preloading failed:", err);
    if (statusEl) {
      statusEl.innerHTML = `🔴 Pre-loading base failed. Please ensure file exists in workspace.`;
      statusEl.style.color = '#f87171';
    }
  }
}

function handleFile(input, labelId, cardId, type) {
  if (input.files.length > 0) {
    document.getElementById(labelId).innerText = `Selected: ${input.files[0].name}`;
    fileData[type] = input.files[0];
    
    // Add visual success to card
    const card = document.getElementById(cardId);
    if(card) {
      card.style.background = 'rgba(34, 197, 94, 0.08)';
      card.style.borderColor = '#22c55e';
    }
    
    // Enable button only if all 3 files are loaded (either preloaded or chosen)
    if (fileData.marketing && fileData.post && fileData.base) {
      document.getElementById('processBtn').disabled = false;
    }
  }
}

async function readExcelFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = function(e) {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, {type: 'array'});
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json(firstSheet, {defval: null});
        resolve(json);
      } catch (err) { reject(err); }
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}

function parseDate(v) {
  if (!v) return null;
  if (typeof v === 'number') return new Date(Math.round((v - 25569)*86400*1000));
  if (typeof v === 'string') {
    let d = new Date(v);
    if (!isNaN(d.valueOf())) return d;
    let p = v.split('/');
    if (p.length === 3) return new Date(`${p[2]}-${p[1]}-${p[0]}`);
  }
  return null;
}

function normalizeMobile(val) {
  if (val === null || val === undefined) return '';
  let str = String(val).replace(/\s+/g, '').replace(/[-()+]/g, '').trim();
  if (str.length === 12 && str.startsWith('91')) {
    str = str.substring(2);
  }
  if (str.includes('.')) {
    str = str.split('.')[0];
  }
  return str;
}

function findMobileKey(row) {
  if (!row) return null;
  const keys = Object.keys(row);
  const exactCandidates = [
    'customer mobile', 'mobile', 'phone', 'contact', 'mobile number', 
    'phone number', 'customer_mobile', 'mobileno', 'mobile no', 'phone_number',
    'cust mobile', 'customer_phone', 'cust_mobile', 'mob', 'ph'
  ];
  for (let cand of exactCandidates) {
    let match = keys.find(k => k.toLowerCase().replace(/[^a-z0-9]/g, '') === cand.replace(/[^a-z0-9]/g, ''));
    if (match) return match;
  }
  let match = keys.find(k => {
    let lk = k.toLowerCase();
    return lk.includes('mobile') || lk.includes('phone') || lk.includes('contact') || lk.includes('mob');
  });
  if (match) return match;
  return keys[0] || null;
}

function findRevenueKey(row) {
  if (!row) return null;
  const keys = Object.keys(row);
  const candidates = ['sold price', 'revenue', 'amount', 'net amount', 'price', 'total', 'grand total', 'net_amount', 'net_amt', 'sale value', 'sale_value', 'value'];
  for (let cand of candidates) {
    let match = keys.find(k => k.toLowerCase().replace(/[^a-z0-9]/g, '') === cand.replace(/[^a-z0-9]/g, ''));
    if (match) return match;
  }
  let match = keys.find(k => {
    let lk = k.toLowerCase();
    return lk.includes('price') || lk.includes('revenue') || lk.includes('amount') || lk.includes('sale') || lk.includes('amt');
  });
  return match || null;
}

function findPincodeKey(row) {
  if (!row) return null;
  const keys = Object.keys(row);
  const candidates = ['pincode', 'pin', 'postal code', 'zip', 'zipcode', 'pin code', 'postal_code'];
  for (let cand of candidates) {
    let match = keys.find(k => k.toLowerCase().replace(/[^a-z0-9]/g, '') === cand.replace(/[^a-z0-9]/g, ''));
    if (match) return match;
  }
  let match = keys.find(k => {
    let lk = k.toLowerCase();
    return lk.includes('pin') || lk.includes('pincode') || lk.includes('postal') || lk.includes('zip');
  });
  return match || null;
}

function findDateKey(row) {
  if (!row) return null;
  const keys = Object.keys(row);
  const candidates = ['date', 'invoice date', 'sale date', 'invoice_date', 'sale_date', 'created_at', 'order date', 'order_date'];
  for (let cand of candidates) {
    let match = keys.find(k => k.toLowerCase().replace(/[^a-z0-9]/g, '') === cand.replace(/[^a-z0-9]/g, ''));
    if (match) return match;
  }
  let match = keys.find(k => {
    let lk = k.toLowerCase();
    return lk.includes('date') || lk.includes('time');
  });
  return match || null;
}

function fmtCrReal(val) {
  if (val >= 10000000) return `₹${(val / 10000000).toFixed(2)} Cr`;
  if (val >= 100000)  return `₹${(val / 100000).toFixed(2)} L`;
  if (val >= 1000)    return `₹${(val / 1000).toFixed(1)}K`;
  return `₹${Math.round(val).toLocaleString('en-IN')}`;
}

async function processData() {
  if (!fileData.marketing || !fileData.post || !fileData.base) {
    alert("Please upload Marketing, Sales, and Kottayam Complete base files before processing.");
    return;
  }
  document.getElementById('loadingOverlay').style.display = 'flex';
  try {
    let mktgRaw, postRaw, baseRaw = null;
    if (fileData.base && fileData.base.isPreloaded) {
      const [mRaw, pRaw] = await Promise.all([
        readExcelFile(fileData.marketing),
        readExcelFile(fileData.post)
      ]);
      mktgRaw = mRaw;
      postRaw = pRaw;
    } else {
      const [mRaw, pRaw, bRaw] = await Promise.all([
        readExcelFile(fileData.marketing),
        readExcelFile(fileData.post),
        readExcelFile(fileData.base)
      ]);
      mktgRaw = mRaw;
      postRaw = pRaw;
      baseRaw = bRaw;
    }

    // 1. Build Kottayam Complete Set (till Apr 27)
    const baseMobiles = new Set();
    if (fileData.base && fileData.base.isPreloaded && preloadedBaseMobiles) {
      preloadedBaseMobiles.forEach(mob => baseMobiles.add(mob));
    } else if (baseRaw) {
      const baseMobKey = findMobileKey(baseRaw[0]);
      if (baseMobKey) {
        baseRaw.forEach(r => {
          let mob = normalizeMobile(r[baseMobKey]);
          if (mob) baseMobiles.add(mob);
        });
      }
    }

    // 2. Build Marketing Customer Set
    const mktgMobiles = new Set();
    const mktgNew = new Set();
    const mktgRepeat = new Set();
    
    const mktgMobKey = findMobileKey(mktgRaw[0]);
    if (mktgMobKey) {
      mktgRaw.forEach(r => {
        let mob = normalizeMobile(r[mktgMobKey]);
        if (mob) {
          mktgMobiles.add(mob);
          if (baseMobiles.has(mob)) {
            mktgRepeat.add(mob);
          } else {
            mktgNew.add(mob);
          }
        }
      });
    }

    // 3. Process Sales Report (Post-April 28 onwards)
    const postMobKey = findMobileKey(postRaw[0]);
    const postRevKey = findRevenueKey(postRaw[0]);
    const postPinKey = findPincodeKey(postRaw[0]);
    const postDateKey = findDateKey(postRaw[0]);

    // Set of purchased customers who exist in marketing
    const purchasedNewMobiles = new Set();
    const purchasedRepeatMobiles = new Set();
    const purchasedMobiles = new Set();

    let newPurchasedSales = 0;
    let repeatPurchasedSales = 0;
    let totalPurchasedSales = 0;

    const weeklyTrend = {};
    const pincodeData = {}; // pin -> { postRev: 0, attrRev: 0, newPurchCount: Set, repPurchCount: Set }

    postRaw.forEach(r => {
      let mob = postMobKey ? normalizeMobile(r[postMobKey]) : '';
      let rev = postRevKey ? parseFloat(r[postRevKey]) || 0 : 0;
      let pin = postPinKey ? String(r[postPinKey] || 'Unknown').trim() : 'Unknown';
      let d = postDateKey ? parseDate(r[postDateKey]) : null;

      if (rev <= 0) return;

      // Group post sales by pincode (total sales post-April 28)
      if (!pincodeData[pin]) {
        pincodeData[pin] = { postRev: 0, attrRev: 0, newPurchCount: new Set(), repPurchCount: new Set() };
      }
      pincodeData[pin].postRev += rev;

      // Check if buyer belongs to Marketing group
      if (mob && mktgMobiles.has(mob)) {
        totalPurchasedSales += rev;
        purchasedMobiles.add(mob);
        pincodeData[pin].attrRev += rev;

        let isRepeat = baseMobiles.has(mob);
        if (isRepeat) {
          purchasedRepeatMobiles.add(mob);
          repeatPurchasedSales += rev;
          pincodeData[pin].repPurchCount.add(mob);
        } else {
          purchasedNewMobiles.add(mob);
          newPurchasedSales += rev;
          pincodeData[pin].newPurchCount.add(mob);
        }

        if (d) {
          let w = getWeekStr(d);
          if (!weeklyTrend[w]) weeklyTrend[w] = { new: 0, rep: 0 };
          if (isRepeat) {
            weeklyTrend[w].rep += 1;
          } else {
            weeklyTrend[w].new += 1;
          }
        }
      }
    });

    // --- CARD RENDER LOGIC ---

    // Card 1 – Total Marketing Customers
    const totalMktg = mktgMobiles.size;
    const newMktg = mktgNew.size;
    const repMktg = mktgRepeat.size;
    
    document.getElementById('kpiMktgTotal').innerText = totalMktg.toLocaleString('en-IN');
    document.getElementById('kpiMktgNew').innerText = newMktg.toLocaleString('en-IN');
    document.getElementById('kpiMktgRepeat').innerText = repMktg.toLocaleString('en-IN');
    
    const newMktgPct = totalMktg > 0 ? ((newMktg / totalMktg) * 100).toFixed(1) : 0;
    const repMktgPct = totalMktg > 0 ? ((repMktg / totalMktg) * 100).toFixed(1) : 0;
    document.getElementById('kpiMktgNewPct').innerText = `🆕 New: ${newMktgPct}% · 🔄 Repeat: ${repMktgPct}%`;

    // Card 2 – Purchased Customers
    const purchTotal = purchasedMobiles.size;
    const purchNew = purchasedNewMobiles.size;
    const purchRep = purchasedRepeatMobiles.size;

    document.getElementById('kpiPurchTotal').innerText = purchTotal.toLocaleString('en-IN');
    document.getElementById('kpiPurchSales').innerText = fmtCrReal(totalPurchasedSales);
    document.getElementById('kpiPurchNewCount').innerText = purchNew.toLocaleString('en-IN');
    document.getElementById('kpiPurchRepCount').innerText = purchRep.toLocaleString('en-IN');
    
    const overallConv = totalMktg > 0 ? ((purchTotal / totalMktg) * 100).toFixed(1) : 0;
    document.getElementById('kpiPurchConvPct').innerText = `🎯 Attribution Conversion Rate: ${overallConv}%`;

    // Card 3 – New Purchased Customers
    document.getElementById('kpiNewPurchCount').innerText = purchNew.toLocaleString('en-IN');
    document.getElementById('kpiNewPurchSales').innerText = fmtCrReal(newPurchasedSales);
    
    const avgNewSale = purchNew > 0 ? Math.round(newPurchasedSales / purchNew) : 0;
    document.getElementById('kpiNewPurchAov').innerText = fmtCrReal(avgNewSale);
    
    const newConvRate = newMktg > 0 ? ((purchNew / newMktg) * 100).toFixed(1) : 0;
    document.getElementById('kpiNewConvRate').innerText = `${newConvRate}%`;

    // Card 4 – Repeat Purchased Customers
    document.getElementById('kpiRepPurchCount').innerText = purchRep.toLocaleString('en-IN');
    document.getElementById('kpiRepPurchSales').innerText = fmtCrReal(repeatPurchasedSales);
    
    const avgRepSale = purchRep > 0 ? Math.round(repeatPurchasedSales / purchRep) : 0;
    document.getElementById('kpiRepPurchAov').innerText = fmtCrReal(avgRepSale);
    
    const repConvRate = repMktg > 0 ? ((purchRep / repMktg) * 100).toFixed(1) : 0;
    document.getElementById('kpiRepConvRate').innerText = `${repConvRate}%`;


    // Display the Results
    document.getElementById('mktgResults').style.display = 'block';

    // 5. Render Weekly Trend Chart
    renderTrendChart(weeklyTrend);

  } catch (e) {
    alert("Error processing data: " + e.message);
    console.error(e);
  } finally {
    document.getElementById('loadingOverlay').style.display = 'none';
  }
}

function getWeekStr(d) {
  const date = new Date(d.getTime());
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + 3 - (date.getDay() + 6) % 7);
  const week1 = new Date(date.getFullYear(), 0, 4);
  const weekNumber = 1 + Math.round(((date.getTime() - week1.getTime()) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
  return `${date.getFullYear()}-W${weekNumber.toString().padStart(2, '0')}`;
}

let mktChart = null;
function renderTrendChart(weeklyTrend) {
  const canvasEl = document.getElementById('trendChart');
  if (!canvasEl) return;
  const ctx = canvasEl.getContext('2d');
  if (mktChart) mktChart.destroy();

  const labels = Object.keys(weeklyTrend).sort();
  const dataNew = labels.map(l => weeklyTrend[l].new);
  const dataRep = labels.map(l => weeklyTrend[l].rep);

  if (labels.length === 0) {
    canvasEl.parentElement.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:#94a3b8;font-size:13px">📊 No weekly data — ensure Sales Report has dates</div>';
    return;
  }

  mktChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [
        { label: '🆕 New Buyers', data: dataNew, backgroundColor: 'rgba(34,197,94,0.85)', borderRadius: 5 },
        { label: '🔄 Repeat Buyers', data: dataRep, backgroundColor: 'rgba(245,158,11,0.85)', borderRadius: 5 }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'top', labels: { color: '#94a3b8', boxWidth: 12, font: { size: 12 } } },
        tooltip: {
          callbacks: {
            label: ctx => ` ${ctx.dataset.label}: ${ctx.raw} customers`
          }
        }
      },
      scales: {
        x: { stacked: true, grid: { display: false }, ticks: { color: '#94a3b8', font: { size: 11 } } },
        y: { stacked: true, grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#94a3b8', font: { size: 11 }, stepSize: 1 } }
      }
    }
  });
}
