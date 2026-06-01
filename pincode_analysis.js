/* ── PINCODE COORDINATE DATABASE (Kerala focus) ── */
const PC_COORDS = {
  '686001':[9.5916,76.5222],'686002':[9.5820,76.5240],'686003':[9.5950,76.5180],
  '686004':[9.5780,76.5300],'686005':[9.5700,76.5200],'686006':[9.5600,76.5150],
  '686101':[9.4400,76.5400],'686102':[9.4500,76.5450],'686103':[9.4350,76.5380],
  '686104':[9.4480,76.5500],'686501':[9.5200,76.5800],'686502':[9.5100,76.5700],
  '686503':[9.5000,76.5600],'686561':[9.6100,76.4200],'686562':[9.6050,76.4150],
  '686563':[9.6200,76.4300],'686564':[9.6300,76.4100],'686565':[9.6150,76.4050],
  '686601':[9.4900,76.5900],'686602':[9.4850,76.5950],'686603':[9.4800,76.6000],
  '686631':[9.6800,76.5600],'686632':[9.6900,76.5700],'686633':[9.7100,76.5800],
  '686634':[9.7200,76.5900],'686641':[9.5500,76.5900],'686651':[9.4700,76.5300],
  '686605':[9.5050,76.6100],'686612':[9.4600,76.5200],'686608':[9.5300,76.6200],
  '686301':[9.7500,76.6500],'686302':[9.7600,76.6600],'686303':[9.7400,76.6400],
  '686401':[9.8500,76.7800],'686402':[9.8600,76.7900],'686403':[9.8400,76.7700],
  '686143':[9.4100,76.5100],'686144':[9.4200,76.5050],'686121':[9.4300,76.5200],
};

const AREA_NAMES = {
  '686001':'Kottayam Town Core','686002':'Kottayam Town','686003':'Kottayam North',
  '686004':'Nagampadam','686005':'Thirunakkara','686006':'Kottayam South',
  '686101':'Changanassery','686102':'Changanassery North','686103':'Changanassery South',
  '686104':'Changanassery East','686501':'Kottayam East','686502':'Pampady',
  '686563':'Kumarakom','686564':'Kumarakom West','686565':'Kumarakom South',
  '686601':'Neendoor','686631':'Ettumanoor','686632':'Ettumanoor East',
  '686633':'Kuravilangad','686634':'Kuravilangad East','686641':'Pallom',
  '686651':'Puthuppally','686605':'Thalayolaparambu',
};

/* ── STATE ── */
let dbRows = [], salesRows = [], chartDb, chartAov, chartTrend, leafletMap, heatLayer;
let tableData = [], sortCol = 5, sortAsc = false;

/* ── HELPERS ── */
function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371, dLat = (lat2-lat1)*Math.PI/180, dLon = (lon2-lon1)*Math.PI/180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLon/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

function fmtInr(v) {
  if (v >= 1e7) return '₹' + (v/1e7).toFixed(2) + ' Cr';
  if (v >= 1e5) return '₹' + (v/1e5).toFixed(2) + ' L';
  return '₹' + Math.round(v).toLocaleString('en-IN');
}

function detectCol(headers, candidates) {
  const h = headers.map(x => (x||'').toString().toLowerCase().trim());
  for (const c of candidates) {
    const i = h.findIndex(x => x === c.toLowerCase());
    if (i >= 0) return headers[i];
  }
  for (const c of candidates) {
    const i = h.findIndex(x => x.includes(c.toLowerCase()));
    if (i >= 0) return headers[i];
  }
  return null;
}

function parseSheet(file, callback) {
  const reader = new FileReader();
  reader.onload = e => {
    const data = new Uint8Array(e.target.result);
    const wb = XLSX.read(data, {type:'array'});
    const ws = wb.Sheets[wb.SheetNames[0]];
    const dataJson = XLSX.utils.sheet_to_json(ws, {defval:''});
    callback(dataJson);
  };
  reader.readAsArrayBuffer(file);
}

/* ── FILE UPLOAD ── */
function dragOver(e, id) { e.preventDefault(); document.getElementById(id).classList.add('drag-over'); }
function dragLeave(id) { document.getElementById(id).classList.remove('drag-over'); }
function dropFile(e, inputId, cardId, nameId) {
  e.preventDefault();
  dragLeave(cardId);
  const f = e.dataTransfer.files[0];
  if (!f) return;
  const input = document.getElementById(inputId);
  const dt = new DataTransfer(); dt.items.add(f); input.files = dt.files;
  input.dispatchEvent(new Event('change'));
}

function handleFile(input, fileKey, cardId, nameId, type) {
  const f = input.files[0];
  if (!f) return;
  document.getElementById(nameId).textContent = '✓ ' + f.name;
  document.getElementById(cardId).classList.add('loaded');
  parseSheet(f, rows => {
    if (type === 'db') dbRows = rows;
    else salesRows = rows;
    checkReady();
  });
}

function checkReady() {
  const btn = document.getElementById('runBtn');
  btn.disabled = !(dbRows.length && salesRows.length);
}

/* ── MAIN ANALYSIS ── */
function runAnalysis() {
  showLoading('Matching pincodes...');
  setTimeout(() => {
    try { _compute(); } catch(e) { hideLoading(); alert('Error: ' + e.message); }
  }, 100);
}

function _compute() {
  const storeLat = parseFloat(document.getElementById('cfgLat').value);
  const storeLng = parseFloat(document.getElementById('cfgLng').value);
  const radius   = parseFloat(document.getElementById('cfgRadius').value);
  const minSales = parseFloat(document.getElementById('cfgMinSales').value) || 0;

  // Scan up to 1000 rows to ensure we don't miss columns that might be blank in the first few rows
  const dbHeaders = Array.from(new Set(dbRows.slice(0, 1000).flatMap(r => Object.keys(r))));
  const sHeaders = Array.from(new Set(salesRows.slice(0, 1000).flatMap(r => Object.keys(r))));
  const colMobile = detectCol(dbHeaders, ['mobile','phone','Mobile No','contact','mob']);
  const colPinDb  = detectCol(dbHeaders, ['pincode','pin','Pincode','PIN','zip','postal']);

  const colAmt   = detectCol(sHeaders, ['amount','bill_amount','sold price','sold_price','soldprice','price','total','value','revenue','net']);
  const colPinS  = detectCol(sHeaders, ['pincode','pin','Pincode','PIN','zip']);
  const colMobS  = detectCol(sHeaders, ['mobile','customer mobile','Customer Mobile','phone','mob']);
  const colDate  = detectCol(sHeaders, ['date','Date','invoice_date','bill_date','txn_date']);

  if (!colPinDb && !colMobile) { hideLoading(); alert('Cannot detect Mobile or Pincode column in Pincode DB. Found headers: ' + dbHeaders.join(', ')); return; }
  if (!colAmt) { hideLoading(); alert('Cannot detect Amount column in Sales data. Found headers: ' + sHeaders.join(', ')); return; }

  function cleanPin(val) {
    let s = String(val || '').split('.')[0]; 
    s = s.replace(/\D/g, ''); 
    if (s.length >= 6) return s.substring(0, 6);
    return s;
  }

  function parseDate(val) {
    if (!val) return 0;
    if (typeof val === 'number') return new Date(Math.round((val - 25569) * 86400 * 1000)).getTime();
    const str = String(val).trim();
    const parts = str.split(/[-/]/);
    if (parts.length === 3) {
      const p0 = parseInt(parts[0], 10);
      const p1 = parseInt(parts[1], 10);
      const p2 = parseInt(parts[2], 10);
      if (p0 > 1000) {
        return new Date(p0, p1 - 1, p2).getTime();
      } else if (p2 > 1000) {
        return new Date(p2, p1 - 1, p0).getTime();
      }
    }
    const parsed = new Date(str).getTime();
    if (!isNaN(parsed)) return parsed;
    return 0;
  }

  function cleanMobile(val) {
    let s = String(val || '').replace(/\D/g, ''); 
    if (s.length >= 10) return s.slice(-10);
    return s;
  }

  const cutoffTime = new Date('2026-04-28T00:00:00').getTime();

  // Build set of ALL mobiles in Kottayam complete data (full history — no date filter)
  // REPEAT = mobile exists in Kottayam sales (any time) → already a store customer
  // NEW    = mobile in Pincode DB but never purchased from Kottayam store
  const salesMobileSet = new Set();
  for (const r of salesRows) {
    const mob = colMobS ? cleanMobile(r[colMobS]) : '';
    if (mob) {
      salesMobileSet.add(mob);
    }
  }

  // Build DB map: pincode -> set of mobiles
  const dbMap = {};
  const dbMobileToPin = {}; // global lookup
  for (const r of dbRows) {
    let pin = cleanPin(r[colPinDb]);
    if (!pin || pin.length < 5) continue;
    
    if (!dbMap[pin]) dbMap[pin] = new Set();
    const mob = colMobile ? cleanMobile(r[colMobile]) : '';
    if (mob) {
      dbMap[pin].add(mob);
      dbMobileToPin[mob] = pin;
    }
  }

  // Build Sales map: pincode -> {total, buyers, orders, dates, mobRevenue}
  const salesMap = {};

  for (const r of salesRows) {
    const mob = colMobS ? cleanMobile(r[colMobS]) : '';
    if (!mob) continue; // Skip if no mobile

    // ONLY process if this customer exists in the Pincode DB!
    const dbPin = dbMobileToPin[mob];
    if (!dbPin) continue;

    const pin = dbPin; // Use their assigned pincode from the database
    const amt = parseFloat(String(r[colAmt]).replace(/[^\d.]/g,'')) || 0;
    const ts = parseDate(r[colDate]);

    if (!salesMap[pin]) salesMap[pin] = {total:0, buyers:new Set(), orders:0, dates:{}, mobRevenue:{}};
    salesMap[pin].total += amt;
    salesMap[pin].orders++;
    salesMap[pin].buyers.add(mob);
    salesMap[pin].mobRevenue[mob] = (salesMap[pin].mobRevenue[mob] || 0) + amt;
    
    if (!salesMap[pin].dates[mob]) salesMap[pin].dates[mob] = {before: false, after: false};
    if (ts > 0) {
      if (ts < cutoffTime) salesMap[pin].dates[mob].before = true;
      if (ts >= cutoffTime) salesMap[pin].dates[mob].after = true;
    }
  }

  // Restrict analysis to ONLY the pincodes explicitly provided in the uploaded Pincode DB
  const allPins = new Set(Object.keys(dbMap));

  // Filter by 20km & build result
  const result = [];
  for (const pin of allPins) {
    const coords = PC_COORDS[pin];
    let dist = null;
    if (coords) dist = haversine(storeLat, storeLng, coords[0], coords[1]);
    else {
      // Lookup nearby known pin (rough match on first 4 digits)
      const prefix = pin.substring(0, 4);
      const match = Object.entries(PC_COORDS).find(([k]) => k.startsWith(prefix));
      if (match) dist = haversine(storeLat, storeLng, match[1][0], match[1][1]);
    }
    if (dist === null || dist > radius) continue;

    const dbCount = dbMap[pin] ? dbMap[pin].size || (dbRows.filter(r=>String(r[colPinDb]||'').trim()===pin).length) : 0;
    const sData   = salesMap[pin] || {total:0, buyers:new Set(), orders:0, dates:{}};
    const totalSales = sData.total;
    if (totalSales < minSales && dbCount === 0) continue;

    const buyerCount = sData.buyers.size || sData.orders;

    // Classify DB mobiles as Repeat (in Kottayam sales data) vs New (never purchased)
    let dbRepeat = 0, dbNew = 0;
    if (dbMap[pin]) {
      for (const mob of dbMap[pin]) {
        if (salesMobileSet.has(mob)) dbRepeat++;
        else dbNew++;
      }
    }

    // Classify buyers: Repeat = had pre-Apr28 purchase; New = only post-Apr28
    let repeatBuyersTotal = 0, newBuyersTotal = 0;
    let repeatBuyersPostApr = 0, newBuyersPostApr = 0;
    let repeatSales = 0, newSales = 0;
    if (sData.dates) {
      for (const mob of sData.buyers) {
        const d = sData.dates[mob] || {};
        const mobRev = (sData.mobRevenue && sData.mobRevenue[mob]) || 0;
        if (d.before) {
          repeatBuyersTotal++;
          repeatSales += mobRev;
          if (d.after) repeatBuyersPostApr++;
        } else {
          newBuyersTotal++;
          newSales += mobRev;
          if (d.after) newBuyersPostApr++;
        }
      }
    }

    const aov = buyerCount > 0 ? totalSales / buyerCount : 0;
    const penetration = dbCount > 0 ? (buyerCount / dbCount * 100) : 0;

    result.push({
      pin, dist: dist.toFixed(1),
      area: AREA_NAMES[pin] || ('Zone ' + pin.substring(0,4) + 'xx'),
      dbCount, dbRepeat, dbNew,
      totalSales, repeatSales, newSales,
      buyerCount, repeatBuyersTotal, newBuyersTotal,
      repeatBuyersPostApr, newBuyersPostApr,
      aov, penetration,
      lat: (PC_COORDS[pin]||[storeLat])[0],
      lng: (PC_COORDS[pin]||[storeLat, storeLng])[1],
    });
  }

  // Sort by totalSales desc
  result.sort((a,b) => b.totalSales - a.totalSales);
  const totalRev = result.reduce((s,r) => s + r.totalSales, 0);
  result.forEach((r,i) => { r.rank = i+1; r.shareP = totalRev>0 ? (r.totalSales/totalRev*100) : 0; });

  // Group sales by month for catchment pincodes
  const monthlySales = {};
  const catchmentPins = new Set(result.map(r => r.pin));
  for (const r of salesRows) {
    const mob = colMobS ? cleanMobile(r[colMobS]) : '';
    if (!mob) continue;
    
    const dbPin = dbMobileToPin[mob];
    if (!dbPin || !catchmentPins.has(dbPin)) continue;
    
    const amt = parseFloat(String(r[colAmt]).replace(/[^\d.]/g,'')) || 0;
    const ts = parseDate(r[colDate]);
    if (ts > 0) {
      const dObj = new Date(ts);
      const y = dObj.getFullYear();
      const m = String(dObj.getMonth() + 1).padStart(2, '0');
      const monthKey = `${y}-${m}`;
      monthlySales[monthKey] = (monthlySales[monthKey] || 0) + amt;
    }
  }

  // Sort months chronologically starting from April 2026 and build trend labels/data
  const sortedMonths = Object.keys(monthlySales).filter(mKey => mKey >= '2026-04').sort();
  const monthNames = {
    '01':'Jan','02':'Feb','03':'Mar','04':'Apr','05':'May','06':'Jun',
    '07':'Jul','08':'Aug','09':'Sep','10':'Oct','11':'Nov','12':'Dec'
  };
  const trendLabels = sortedMonths.map(mKey => {
    const parts = mKey.split('-');
    return `${monthNames[parts[1]]} ${parts[0]}`;
  });
  const trendData = sortedMonths.map(mKey => monthlySales[mKey]);

  tableData = result;
  hideLoading();
  renderAll(result, totalRev, trendLabels, trendData);
}

/* ── RENDER ALL ── */
function renderAll(data, totalRev, trendLabels, trendData) {
  document.getElementById('emptyState').style.display = 'none';
  document.getElementById('kpiSection').style.display = 'flex';
  ['mapSection','trendSection','insightsSection','tableSection']
    .forEach(id => document.getElementById(id).style.display = '');
  renderKPIs(data, totalRev);
  renderMap(data);
  renderTrendChart(trendLabels, trendData);
  renderTable(data);
  renderInsights(data, totalRev);
}

function renderTrendChart(labels, data) {
  const ctx = document.getElementById('chartTrend');
  if (!ctx) return;
  
  if (chartTrend) chartTrend.destroy();
  
  const canvasCtx = ctx.getContext('2d');
  const gradient = canvasCtx.createLinearGradient(0, 0, 0, 300);
  gradient.addColorStop(0, 'rgba(249, 115, 22, 0.22)');
  gradient.addColorStop(1, 'rgba(249, 115, 22, 0.00)');
  
  chartTrend = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        label: 'Catchment Sales (₹)',
        data: data,
        borderColor: '#f97316',
        borderWidth: 3,
        backgroundColor: gradient,
        fill: true,
        tension: 0.35,
        pointRadius: 4,
        pointBackgroundColor: '#f97316',
        pointHoverRadius: 6,
        pointHoverBackgroundColor: '#ffffff',
        pointHoverBorderColor: '#f97316',
        pointHoverBorderWidth: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#0f172a',
          titleColor: '#f8fafc',
          bodyColor: '#94a3b8',
          padding: 12,
          cornerRadius: 8,
          callbacks: {
            label: (ctx) => ` Sales: ${fmtInr(ctx.raw)}`
          }
        }
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { color: '#6b7280', font: { family: 'Calibri', size: 13.5, weight: 500 } }
        },
        y: {
          grid: { color: 'rgba(249, 115, 22, 0.04)' },
          ticks: {
            color: '#6b7280',
            font: { family: 'Calibri', size: 13.5 },
            callback: (val) => fmtInr(val)
          }
        }
      }
    }
  });
}

function renderKPIs(data, totalRev) {
  const totalDb            = data.reduce((s,r) => s+r.dbCount, 0);
  const totalDbRepeat      = data.reduce((s,r) => s+(r.dbRepeat||0), 0);
  const totalDbNew         = data.reduce((s,r) => s+(r.dbNew||0), 0);
  const totalBuyers        = data.reduce((s,r) => s+r.buyerCount, 0);
  const totalRepeatSales   = data.reduce((s,r) => s+(r.repeatSales||0), 0);
  const totalNewSales      = data.reduce((s,r) => s+(r.newSales||0), 0);
  const totalRepBuyers     = data.reduce((s,r) => s+(r.repeatBuyersTotal||0), 0);
  const totalNewBuyers     = data.reduce((s,r) => s+(r.newBuyersTotal||0), 0);
  const totalRepBuyersPost = data.reduce((s,r) => s+(r.repeatBuyersPostApr||0), 0);
  const totalNewBuyersPost = data.reduce((s,r) => s+(r.newBuyersPostApr||0), 0);
  const overallAov         = totalBuyers > 0 ? totalRev / totalBuyers : 0;
  const avgNewSale         = totalNewBuyers > 0 ? totalNewSales / totalNewBuyers : 0;
  const avgRepeatSale      = totalRepBuyers > 0 ? totalRepeatSales / totalRepBuyers : 0;

  document.getElementById('kpiPincodes').textContent    = data.length;
  document.getElementById('kpiPincodesub').textContent  = `Within ${document.getElementById('cfgRadius').value}km radius`;
  document.getElementById('kpiDbTotal').textContent     = totalDb.toLocaleString('en-IN');
  document.getElementById('kpiDbRepeat').textContent    = totalDbRepeat.toLocaleString('en-IN');
  document.getElementById('kpiDbNew').textContent       = totalDbNew.toLocaleString('en-IN');
  document.getElementById('kpiSalesTotal').textContent  = fmtInr(totalRepeatSales + totalNewSales);
  document.getElementById('kpiSalesRepeat').textContent = fmtInr(totalRepeatSales);
  document.getElementById('kpiSalesRepeatSub').textContent = `${totalRepBuyers.toLocaleString('en-IN')} repeat buyers · Avg ${fmtInr(avgRepeatSale)}`;
  document.getElementById('kpiSalesNew').textContent    = fmtInr(totalNewSales);
  document.getElementById('kpiSalesNewSub').textContent = `${totalNewBuyers.toLocaleString('en-IN')} new buyers · Avg ${fmtInr(avgNewSale)}`;
  document.getElementById('kpiBuyersTotal').textContent = (totalRepBuyers + totalNewBuyers).toLocaleString('en-IN');
  document.getElementById('kpiAoV').textContent         = fmtInr(overallAov);
  document.getElementById('kpiRepeatBuyers').textContent = totalRepBuyers.toLocaleString('en-IN');
  document.getElementById('kpiNewBuyers').textContent    = totalNewBuyers.toLocaleString('en-IN');
  document.getElementById('kpiRepBPost').textContent     = totalRepBuyersPost.toLocaleString('en-IN');
  document.getElementById('kpiNewBPost').textContent     = totalNewBuyersPost.toLocaleString('en-IN');

  // Avg Sale per New Customer breakdown card
  const el = document.getElementById('kpiAvgNewSale');
  if (el) el.textContent = fmtInr(avgNewSale);
  const elSub = document.getElementById('kpiAvgNewSaleSub');
  if (elSub) elSub.innerHTML = `<span style="opacity:0.7;font-size:11px">${fmtInr(totalNewSales)} ÷ ${totalNewBuyers.toLocaleString('en-IN')} buyers</span>`;

  const elR = document.getElementById('kpiAvgRepSale');
  if (elR) elR.textContent = fmtInr(avgRepeatSale);
  const elRSub = document.getElementById('kpiAvgRepSaleSub');
  if (elRSub) elRSub.innerHTML = `<span style="opacity:0.7;font-size:11px">${fmtInr(totalRepeatSales)} ÷ ${totalRepBuyers.toLocaleString('en-IN')} buyers</span>`;
}

const PALETTE = ['#3b82f6','#14b8a6','#fb923c','#f59e0b','#22c55e','#ec4899','#f97316','#06b6d4','#a3e635','#e879f9'];



function renderMap(data) {
  const storeLat = parseFloat(document.getElementById('cfgLat').value);
  const storeLng = parseFloat(document.getElementById('cfgLng').value);
  
  if (leafletMap) {
    leafletMap.remove();
    leafletMap = null;
  }
  
  leafletMap = L.map('pincodeMap').setView([storeLat, storeLng], 11);
  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    {attribution:'©OpenStreetMap ©CARTO', maxZoom:18}).addTo(leafletMap);
  L.circle([storeLat,storeLng],{radius:parseInt(document.getElementById('cfgRadius').value)*1000,
    color:'#3b82f6',fillColor:'#3b82f6',fillOpacity:0.04,weight:1.5,dashArray:'6 4'}).addTo(leafletMap);
  L.marker([storeLat,storeLng]).bindPopup('<b>📍 myG Store — Kottayam Future (686006)</b>').addTo(leafletMap);

  const maxRev = Math.max(...data.map(r=>r.totalSales));
  const heatPoints = data.filter(r=>r.lat&&r.lng).map(r=>[r.lat,r.lng,r.totalSales/maxRev]);
  if (heatPoints.length) {
    heatLayer = L.heatLayer(heatPoints,{radius:35,blur:20,maxZoom:14,
      gradient:{0.2:'#1d4ed8',0.5:'#f59e0b',0.8:'#ef4444',1.0:'#ff0000'}}).addTo(leafletMap);
  }

  data.forEach(r => {
    if (!r.lat || !r.lng) return;
    const size = Math.max(8, Math.min(28, (r.totalSales/maxRev)*28));
    L.circleMarker([r.lat,r.lng],{radius:size,color:'rgba(255,255,255,0.5)',
      fillColor:PALETTE[Math.min(r.rank-1,9)],fillOpacity:0.85,weight:1})
      .bindPopup(`<b>${r.pin}</b> — ${r.area}<br/>
        <b>DB Count:</b> ${r.dbCount.toLocaleString('en-IN')}<br/>
        <b>Total Sales:</b> ${fmtInr(r.totalSales)}<br/>
        <b>AOV:</b> ${fmtInr(r.aov)}<br/>
        <b>Distance:</b> ${r.dist} km`)
      .addTo(leafletMap);
  });
}

/* ── TABLE ── */
function renderTable(data) {
  const maxRev = Math.max(...data.map(r=>r.totalSales));
  const body = document.getElementById('summaryTableBody');
  body.innerHTML = data.map(r => {
    const barW = maxRev>0 ? (r.totalSales/maxRev*100) : 0;
    const distClass = r.dist<=5?'d0':r.dist<=10?'d1':r.dist<=15?'d2':'d3';
    return `<tr>
      <td class="rank-cell">#${r.rank}</td>
      <td><div class="pincode-code">${r.pin}</div><div class="area-name">${r.area}</div></td>
      <td>${r.area}</td>
      <td><span class="pa-dist-tag ${distClass}">${r.dist} km</span></td>
      <td class="count-cell">${r.dbCount.toLocaleString('en-IN')}</td>
      <td class="rev-cell">${fmtInr(r.totalSales)}</td>
      <td class="count-cell">${r.buyerCount.toLocaleString('en-IN')}</td>
      <td>${fmtInr(r.aov)}</td>
      <td class="pa-bar-cell">
        <div class="pa-bar-bg"><div class="pa-bar-fill" style="width:${barW}%"></div></div>
        <div class="pa-pct-label">${r.shareP.toFixed(1)}%</div>
      </td>
    </tr>`;
  }).join('');
}

function filterTable() {
  const q = document.getElementById('tableSearch').value.toLowerCase();
  const rows = document.querySelectorAll('#summaryTableBody tr');
  rows.forEach(r => { r.style.display = r.textContent.toLowerCase().includes(q) ? '' : 'none'; });
}

let _sortDir = {};
function sortTable(col) {
  _sortDir[col] = !_sortDir[col];
  const vals = [
    r=>r.rank, r=>r.pin, r=>r.area, r=>parseFloat(r.dist),
    r=>r.dbCount, r=>r.totalSales, r=>r.buyerCount, r=>r.aov, r=>r.shareP
  ];
  tableData.sort((a,b) => {
    const va=vals[col](a), vb=vals[col](b);
    return _sortDir[col] ? (va>vb?1:-1) : (va<vb?1:-1);
  });
  renderTable(tableData);
  document.querySelectorAll('.pa-table thead th').forEach((th,i) => {
    th.classList.remove('sort-asc','sort-desc');
    if (i===col) th.classList.add(_sortDir[col]?'sort-asc':'sort-desc');
  });
}

/* ── INSIGHTS ── */
function renderInsights(data, totalRev) {
  if (!data.length) return;
  const best   = data[0];
  const worst  = data[data.length-1];
  const topAov = [...data].filter(r=>r.buyerCount>0).sort((a,b)=>b.aov-a.aov)[0] || best;
  const radius = document.getElementById('cfgRadius').value;
  const totalDb = data.reduce((s,r)=>s+r.dbCount,0);
  const totalBuy = data.reduce((s,r)=>s+r.buyerCount,0);
  const overallPen = totalDb>0?(totalBuy/totalDb*100):0;

  const grid = document.getElementById('insightsGrid');
  grid.innerHTML = `
    <div class="pa-insight-card best">
      <div class="pa-insight-icon">🏆</div>
      <div class="pa-insight-title">Top Performing Pincode</div>
      <div class="pa-insight-body">${best.pin} — ${best.area}</div>
      <div class="pa-insight-sub">Sales: ${fmtInr(best.totalSales)} · DB: ${best.dbCount.toLocaleString('en-IN')}</div>
    </div>
    <div class="pa-insight-card worst">
      <div class="pa-insight-icon">⚠️</div>
      <div class="pa-insight-title">Lowest Performing Pincode</div>
      <div class="pa-insight-body">${worst.pin} — ${worst.area}</div>
      <div class="pa-insight-sub">Sales: ${fmtInr(worst.totalSales)} · DB: ${worst.dbCount.toLocaleString('en-IN')}</div>
    </div>
    <div class="pa-insight-card opportunity">
      <div class="pa-insight-icon">💡</div>
      <div class="pa-insight-title">Highest AOV Pincode</div>
      <div class="pa-insight-body">${topAov.pin} — ${topAov.area}</div>
      <div class="pa-insight-sub">Avg Sale / Customer: ${fmtInr(topAov.aov)} · Revenue: ${fmtInr(topAov.totalSales)}</div>
    </div>
    <div class="pa-insight-card coverage">
      <div class="pa-insight-icon">📍</div>
      <div class="pa-insight-title">Catchment Coverage</div>
      <div class="pa-insight-body">${data.length} Pincodes within ${radius}km</div>
      <div class="pa-insight-sub">Total DB: ${totalDb.toLocaleString('en-IN')} customers</div>
    </div>`;
}

/* ── EXPORT ── */
function exportToExcel() {
  const rows = tableData.map(r=>({
    Rank:r.rank, Pincode:r.pin, Area:r.area,
    'Distance (km)':parseFloat(r.dist),
    'Database Count':r.dbCount,
    'Total Sales (₹)':Math.round(r.totalSales),
    'Buying Customers':r.buyerCount,
    'Avg Sale / Customer (₹)':Math.round(r.aov),
    'Sales Share (%)':parseFloat(r.shareP.toFixed(2)),
  }));
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Pincode Analysis');
  XLSX.writeFile(wb, 'Pincode_Sales_Analysis.xlsx');
}

/* ── LOADING ── */
function showLoading(msg) {
  document.getElementById('loadingMsg').textContent = msg || 'Processing...';
  document.getElementById('loadingOverlay').classList.add('active');
}
function hideLoading() { document.getElementById('loadingOverlay').classList.remove('active'); }