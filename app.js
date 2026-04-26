/* ============================================
   0DTE COCKPIT — App Logic
   Simulated data. No live broker connection.
   ============================================ */

// --------- Utility ---------
const $ = (id) => document.getElementById(id);
const fmt = {
  px: (n) => `$${n.toFixed(2)}`,
  pxSign: (n) => `${n >= 0 ? '+' : ''}${n.toFixed(2)}`,
  pct: (n) => `${n >= 0 ? '+' : ''}${n.toFixed(2)}%`,
  money: (n) => `${n >= 0 ? '+' : '-'}$${Math.abs(n).toFixed(0)}`,
  moneyAbs: (n) => `$${Math.abs(n).toFixed(0)}`,
};

// Seedable random for reproducible-ish demo data
function mulberry32(a) {
  return function() {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = a; t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296;
  }
}
const rng = mulberry32(42);

// --------- Clock ---------
function tickClock() {
  const now = new Date();
  const ny = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }));
  const hh = String(ny.getHours()).padStart(2, '0');
  const mm = String(ny.getMinutes()).padStart(2, '0');
  const ss = String(ny.getSeconds()).padStart(2, '0');
  $('clock').textContent = `${hh}:${mm}:${ss} ET`;

  // Market open status (NYSE: 9:30–16:00 ET, Mon–Fri, naive)
  const day = ny.getDay();
  const minutes = ny.getHours() * 60 + ny.getMinutes();
  const open = day >= 1 && day <= 5 && minutes >= 570 && minutes < 960;
  const el = $('market-status');
  if (open) {
    el.textContent = '● OPEN';
    el.className = 'text-emerald-400';
  } else {
    el.textContent = '● CLOSED';
    el.className = 'text-zinc-500';
  }
}
tickClock();
setInterval(tickClock, 1000);

// --------- Watchlist ---------
const watchlist = [
  { sym: 'TSLA', px: 248.32, chg: 0.87 },
  { sym: 'NVDA', px: 1142.50, chg: 1.42 },
  { sym: 'SPY',  px: 587.21, chg: 0.31 },
  { sym: 'QQQ',  px: 503.18, chg: 0.55 },
  { sym: 'AAPL', px: 224.15, chg: -0.28 },
  { sym: 'META', px: 612.40, chg: 0.92 },
  { sym: 'AMD',  px: 158.20, chg: -0.45 },
  { sym: 'VIX',  px: 14.82, chg: -2.10 },
];

function renderWatchlist() {
  const html = watchlist.map(t => {
    const cls = t.chg >= 0 ? 'chg-up' : 'chg-dn';
    return `<div class="ticker">
      <span class="sym">${t.sym}</span>
      <span class="px">${t.sym === 'VIX' ? t.px.toFixed(2) : '$' + t.px.toFixed(2)}</span>
      <span class="${cls}">${fmt.pct(t.chg)}</span>
    </div>`;
  }).join('');
  $('watchlist').innerHTML = html;
}
renderWatchlist();

function jitterWatchlist() {
  watchlist.forEach(t => {
    const drift = (rng() - 0.5) * 0.15;
    t.px = Math.max(0.01, t.px * (1 + drift / 100));
    t.chg = t.chg + drift * 0.5;
  });
  // Update TSLA hero too
  const tsla = watchlist.find(w => w.sym === 'TSLA');
  $('tsla-price').textContent = fmt.px(tsla.px);
  const chgEl = $('tsla-change');
  const chgAbs = tsla.px * tsla.chg / 100;
  chgEl.textContent = `${fmt.pxSign(chgAbs)} (${fmt.pct(tsla.chg)})`;
  chgEl.className = `font-mono text-sm ${tsla.chg >= 0 ? 'text-emerald-400' : 'text-red-400'}`;
  renderWatchlist();
}
setInterval(jitterWatchlist, 2200);

// --------- Gamma Exposure Chart ---------
const tslaSpot = 248.32;
const strikes = [];
for (let s = 235; s <= 265; s += 1) strikes.push(s);

function gammaCurve(strike, isCall) {
  // Synthetic gamma exposure peaking near ATM
  const d = strike - tslaSpot;
  const peak = Math.exp(-(d * d) / 18);
  const skew = isCall ? (d > 0 ? 1.1 : 0.6) : (d < 0 ? 1.2 : 0.5);
  return peak * skew * (0.6 + rng() * 0.4) * (isCall ? 1 : -1) * 100;
}

const gammaData = {
  labels: strikes.map(s => s.toString()),
  datasets: [
    {
      label: 'Call γ',
      data: strikes.map(s => gammaCurve(s, true)),
      backgroundColor: 'rgba(52, 211, 153, 0.55)',
      borderColor: 'rgba(52, 211, 153, 0.9)',
      borderWidth: 1,
      borderRadius: 0,
      barPercentage: 0.85,
      categoryPercentage: 0.95,
    },
    {
      label: 'Put γ',
      data: strikes.map(s => gammaCurve(s, false)),
      backgroundColor: 'rgba(248, 113, 113, 0.5)',
      borderColor: 'rgba(248, 113, 113, 0.9)',
      borderWidth: 1,
      borderRadius: 0,
      barPercentage: 0.85,
      categoryPercentage: 0.95,
    }
  ]
};

const gammaCtx = $('gammaChart').getContext('2d');
const gammaChart = new Chart(gammaCtx, {
  type: 'bar',
  data: gammaData,
  options: {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#0a0e0d',
        borderColor: '#34d399',
        borderWidth: 1,
        titleColor: '#f4f4f5',
        bodyColor: '#a1a1aa',
        titleFont: { family: 'JetBrains Mono', size: 11 },
        bodyFont: { family: 'JetBrains Mono', size: 11 },
        padding: 10,
        callbacks: {
          title: (items) => `Strike $${items[0].label}`,
          label: (ctx) => ` ${ctx.dataset.label}: ${ctx.parsed.y.toFixed(1)}`,
        }
      },
      annotation: {}
    },
    scales: {
      x: {
        stacked: true,
        ticks: {
          color: '#52525b',
          font: { family: 'JetBrains Mono', size: 9 },
          maxRotation: 0,
          autoSkip: true,
          maxTicksLimit: 16,
        },
        grid: { display: false, drawBorder: false },
      },
      y: {
        stacked: true,
        ticks: {
          color: '#52525b',
          font: { family: 'JetBrains Mono', size: 9 },
        },
        grid: { color: 'rgba(255,255,255,0.04)', drawBorder: false },
      }
    },
  },
  plugins: [{
    id: 'spotLine',
    afterDatasetsDraw(chart) {
      const { ctx, chartArea: { top, bottom }, scales: { x } } = chart;
      // Find nearest strike to spot
      const idx = strikes.findIndex(s => s >= tslaSpot);
      const xPx = x.getPixelForValue(idx);
      ctx.save();
      ctx.beginPath();
      ctx.setLineDash([4, 4]);
      ctx.lineWidth = 1;
      ctx.strokeStyle = 'rgba(251, 191, 36, 0.7)';
      ctx.moveTo(xPx, top);
      ctx.lineTo(xPx, bottom);
      ctx.stroke();
      // Label
      ctx.fillStyle = 'rgba(251, 191, 36, 0.9)';
      ctx.font = '10px JetBrains Mono';
      ctx.fillText(`SPOT $${tslaSpot.toFixed(2)}`, xPx + 6, top + 12);
      ctx.restore();
    }
  }]
});

// --------- IV Term Structure ---------
const ivLabels = ['0DTE', '1D', '2D', '3D', '7D', '14D', '21D', '30D'];
const ivValues = [38.2, 32.4, 30.1, 28.7, 27.5, 27.0, 26.8, 26.5];

const ivCtx = $('ivChart').getContext('2d');
new Chart(ivCtx, {
  type: 'line',
  data: {
    labels: ivLabels,
    datasets: [{
      label: 'IV %',
      data: ivValues,
      borderColor: '#34d399',
      backgroundColor: (ctx) => {
        const { chart: { ctx: c, chartArea } } = ctx;
        if (!chartArea) return 'rgba(52, 211, 153, 0.1)';
        const g = c.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
        g.addColorStop(0, 'rgba(52, 211, 153, 0.25)');
        g.addColorStop(1, 'rgba(52, 211, 153, 0)');
        return g;
      },
      fill: true,
      borderWidth: 2,
      tension: 0.35,
      pointRadius: 3,
      pointBackgroundColor: '#0a0e0d',
      pointBorderColor: '#34d399',
      pointBorderWidth: 1.5,
    }]
  },
  options: {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#0a0e0d',
        borderColor: '#34d399',
        borderWidth: 1,
        titleColor: '#f4f4f5',
        bodyColor: '#a1a1aa',
        titleFont: { family: 'JetBrains Mono', size: 11 },
        bodyFont: { family: 'JetBrains Mono', size: 11 },
        callbacks: {
          label: (ctx) => ` IV: ${ctx.parsed.y.toFixed(1)}%`,
        }
      }
    },
    scales: {
      x: {
        ticks: { color: '#52525b', font: { family: 'JetBrains Mono', size: 9 } },
        grid: { display: false, drawBorder: false },
      },
      y: {
        ticks: {
          color: '#52525b',
          font: { family: 'JetBrains Mono', size: 9 },
          callback: (v) => `${v}%`,
        },
        grid: { color: 'rgba(255,255,255,0.04)', drawBorder: false },
      }
    },
  }
});

// --------- Strategy Templates ---------
const templates = [
  {
    id: 'iron-condor',
    name: 'Iron Condor',
    desc: 'Range-bound · Defined risk · Sell premium',
    legs: (spot, w, deltaDist) => {
      const putShort = Math.round(spot - deltaDist / 2);
      const putLong = putShort - w;
      const callShort = Math.round(spot + deltaDist / 2);
      const callLong = callShort + w;
      return [
        { side: 'BUY',  type: 'PUT',  strike: putLong,   px: 0.42 },
        { side: 'SELL', type: 'PUT',  strike: putShort,  px: 1.35 },
        { side: 'SELL', type: 'CALL', strike: callShort, px: 1.20 },
        { side: 'BUY',  type: 'CALL', strike: callLong,  px: 0.38 },
      ];
    }
  },
  {
    id: 'butterfly',
    name: 'Broken Wing Butterfly',
    desc: 'Pin to strike · Asymmetric · Low debit',
    legs: (spot, w) => {
      const center = Math.round(spot);
      return [
        { side: 'BUY',  type: 'CALL', strike: center - w, px: 3.50 },
        { side: 'SELL', type: 'CALL', strike: center,     px: 1.85 },
        { side: 'SELL', type: 'CALL', strike: center,     px: 1.85 },
        { side: 'BUY',  type: 'CALL', strike: center + w * 1.5, px: 0.55 },
      ];
    }
  },
  {
    id: 'short-straddle',
    name: 'Short Straddle',
    desc: 'Crush IV · High risk · Naked premium',
    legs: (spot) => {
      const k = Math.round(spot);
      return [
        { side: 'SELL', type: 'CALL', strike: k, px: 2.10 },
        { side: 'SELL', type: 'PUT',  strike: k, px: 2.05 },
      ];
    }
  },
  {
    id: 'put-credit',
    name: 'Put Credit Spread',
    desc: 'Bullish bias · Defined risk · Theta',
    legs: (spot, w, deltaDist) => {
      const sk = Math.round(spot - deltaDist / 2);
      const lk = sk - w;
      return [
        { side: 'BUY',  type: 'PUT', strike: lk, px: 0.38 },
        { side: 'SELL', type: 'PUT', strike: sk, px: 1.30 },
      ];
    }
  },
  {
    id: 'call-credit',
    name: 'Call Credit Spread',
    desc: 'Bearish bias · Defined risk · Theta',
    legs: (spot, w, deltaDist) => {
      const sk = Math.round(spot + deltaDist / 2);
      const lk = sk + w;
      return [
        { side: 'SELL', type: 'CALL', strike: sk, px: 1.20 },
        { side: 'BUY',  type: 'CALL', strike: lk, px: 0.35 },
      ];
    }
  },
];

let activeTemplate = 'iron-condor';

function renderTemplates() {
  const html = templates.map(t => `
    <div class="template-card ${t.id === activeTemplate ? 'active' : ''}" data-id="${t.id}">
      <div class="t-name">${t.name}</div>
      <div class="t-desc">${t.desc}</div>
    </div>
  `).join('');
  $('template-list').innerHTML = html;
  document.querySelectorAll('.template-card').forEach(el => {
    el.addEventListener('click', () => {
      activeTemplate = el.dataset.id;
      renderTemplates();
      updatePreview();
      $('builder-step').textContent = '2';
    });
  });
}

function getActiveLegs() {
  const tpl = templates.find(t => t.id === activeTemplate);
  const spot = parseFloat($('param-symbol').value === 'TSLA' ? tslaSpot : 100);
  const w = parseFloat($('param-width').value) || 5;
  const d = parseFloat($('param-delta').value) || 20;
  return tpl.legs(spot, w, d / 4); // delta -> $ distance approximation
}

function updatePreview() {
  const legs = getActiveLegs();
  const contracts = parseInt($('param-contracts').value) || 1;
  const symbol = $('param-symbol').value.toUpperCase() || 'TSLA';

  // Net credit
  let net = 0;
  legs.forEach(l => { net += (l.side === 'SELL' ? 1 : -1) * l.px; });
  const totalCredit = net * contracts * 100;
  const isCredit = net >= 0;

  // Buying power (rough: max strike width × contracts × 100 - credit)
  const strikes = legs.map(l => l.strike);
  const width = Math.max(...strikes) - Math.min(...strikes);
  const bp = Math.max(width * contracts * 100 - totalCredit, 50);

  // Render legs
  const html = legs.map(l => {
    const cls = l.side === 'SELL' ? 'text-emerald-400' : 'text-red-400';
    return `<div class="flex justify-between">
      <span><span class="${cls}">${l.side}</span> <span class="text-zinc-300">${contracts}x</span> ${symbol} ${l.strike}${l.type[0]}</span>
      <span class="text-zinc-500 tabular-nums">@ $${l.px.toFixed(2)}</span>
    </div>`;
  }).join('');
  $('order-preview').innerHTML = html || '<div class="text-zinc-600">No legs</div>';

  $('preview-credit').textContent = `${isCredit ? '+' : '-'}$${Math.abs(totalCredit).toFixed(0)}`;
  $('preview-credit').className = `tabular-nums ${isCredit ? 'text-emerald-400' : 'text-red-400'}`;
  $('preview-bp').textContent = `$${bp.toFixed(0)}`;

  $('builder-step').textContent = '3';
}

['param-symbol', 'param-contracts', 'param-width', 'param-delta'].forEach(id => {
  $(id).addEventListener('input', updatePreview);
});

renderTemplates();
updatePreview();

// --------- Risk Guard State ---------
const risk = {
  dailyPnL: -240,
  dailyLimit: -1000,
  trades: 3,
  tradeMax: 8,
  losses: 1,
  lossMax: 3,
  armed: true,
};

function refreshRisk() {
  // Daily P&L
  const dailyPct = Math.min(Math.abs(risk.dailyPnL) / Math.abs(risk.dailyLimit) * 100, 100);
  $('daily-pnl-text').textContent = `${fmt.money(risk.dailyPnL)} / ${fmt.money(risk.dailyLimit)}`;
  const dailyBar = $('daily-pnl-bar');
  dailyBar.style.width = `${dailyPct}%`;
  dailyBar.className = `h-full transition-all duration-500 ${
    dailyPct < 50 ? 'bg-emerald-400' : dailyPct < 80 ? 'bg-amber-400' : 'bg-red-400'
  }`;

  // Trades
  const tPct = (risk.trades / risk.tradeMax) * 100;
  $('trade-count-text').textContent = `${risk.trades} / ${risk.tradeMax}`;
  $('trade-count-bar').style.width = `${tPct}%`;

  // Losses
  const lPct = (risk.losses / risk.lossMax) * 100;
  $('loss-streak-text').textContent = `${risk.losses} / ${risk.lossMax}`;
  $('loss-streak-bar').style.width = `${lPct}%`;
  $('loss-streak-bar').className = `h-full transition-all duration-500 ${
    lPct < 67 ? 'bg-emerald-400' : 'bg-red-400'
  }`;

  // Header pnl
  $('header-pnl').textContent = fmt.money(risk.dailyPnL);
  $('header-pnl').className = `tabular-nums ${risk.dailyPnL >= 0 ? 'text-emerald-400' : 'text-red-400'}`;
}
refreshRisk();

// --------- Stage Order Action ---------
$('stage-order').addEventListener('click', () => {
  // Risk pre-check
  if (!risk.armed) {
    toast('error', 'BLOCKED', 'Risk Guard disarmed. Re-arm to stage orders.');
    return;
  }
  if (risk.dailyPnL <= risk.dailyLimit) {
    toast('error', 'BLOCKED', 'Daily loss limit reached. No new positions.');
    return;
  }
  if (risk.losses >= risk.lossMax) {
    toast('error', 'BLOCKED', `${risk.lossMax} consecutive losses. Trading paused.`);
    return;
  }
  if (risk.trades >= risk.tradeMax) {
    toast('warn', 'BLOCKED', 'Max trade count reached for today.');
    return;
  }

  const tpl = templates.find(t => t.id === activeTemplate);
  const contracts = parseInt($('param-contracts').value) || 1;
  toast('ok', 'STAGED', `${contracts}x ${tpl.name} on ${$('param-symbol').value.toUpperCase()} ready for review.`);

  // Add to journal
  addJournalRow({
    time: nowET(),
    symbol: $('param-symbol').value.toUpperCase(),
    strategy: tpl.name,
    credit: parseFloat($('preview-credit').textContent.replace(/[^0-9.-]/g, '')),
    pnl: 0,
    tag: 'discipline',
    status: 'staged',
  });
});

// --------- Emergency Flatten ---------
$('emergency-stop').addEventListener('click', () => {
  if (!confirm('Flatten all positions and disarm risk guard for the rest of the session?')) return;
  risk.armed = false;
  refreshRisk();
  toast('warn', 'FLATTENED', 'All positions closed. Risk Guard disarmed for the day.');
});

// --------- Journal ---------
const journalRows = [
  { time: '09:42:17', symbol: 'TSLA', strategy: 'Iron Condor', credit: 185, pnl: 142, tag: 'discipline', status: 'closed' },
  { time: '10:15:38', symbol: 'NVDA', strategy: 'Put Credit Spread', credit: 72, pnl: -180, tag: 'fomo', status: 'closed' },
  { time: '11:03:51', symbol: 'TSLA', strategy: 'Broken Wing Butterfly', credit: 95, pnl: 68, tag: 'pattern', status: 'closed' },
  { time: '12:47:09', symbol: 'SPY', strategy: 'Iron Condor', credit: 110, pnl: 0, tag: 'discipline', status: 'open' },
];

function nowET() {
  const ny = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/New_York' }));
  return [ny.getHours(), ny.getMinutes(), ny.getSeconds()].map(n => String(n).padStart(2, '0')).join(':');
}

function renderJournal() {
  const html = journalRows.map(r => {
    const pnlCls = r.pnl > 0 ? 'text-emerald-400' : r.pnl < 0 ? 'text-red-400' : 'text-zinc-500';
    const statusCls = r.status === 'closed' ? 'text-zinc-500' : r.status === 'open' ? 'text-emerald-400' : 'text-amber-400';
    return `<tr>
      <td class="text-zinc-500 tabular-nums">${r.time}</td>
      <td class="text-zinc-200">${r.symbol}</td>
      <td class="text-zinc-300">${r.strategy}</td>
      <td class="text-right tabular-nums text-zinc-300">${fmt.moneyAbs(r.credit)}</td>
      <td class="text-right tabular-nums ${pnlCls}">${r.pnl === 0 ? '—' : fmt.money(r.pnl)}</td>
      <td><span class="tag tag-${r.tag}">${r.tag}</span></td>
      <td class="${statusCls} uppercase text-[10px] tracking-wider">● ${r.status}</td>
    </tr>`;
  }).join('');
  $('journal-tbody').innerHTML = html;

  // Stats
  const wins = journalRows.filter(r => r.pnl > 0).length;
  const losses = journalRows.filter(r => r.pnl < 0).length;
  $('stat-win').textContent = wins;
  $('stat-loss').textContent = losses;
}

function addJournalRow(row) {
  journalRows.unshift(row);
  renderJournal();
}
renderJournal();

// --------- Toast ---------
function toast(kind, label, msg) {
  const wrap = $('toast-container');
  const el = document.createElement('div');
  el.className = `toast ${kind === 'warn' ? 'toast-warn' : kind === 'error' ? 'toast-error' : ''}`;
  el.innerHTML = `<div class="toast-label">▸ ${label}</div><div>${msg}</div>`;
  wrap.appendChild(el);
  setTimeout(() => {
    el.style.transition = 'opacity 220ms, transform 220ms';
    el.style.opacity = '0';
    el.style.transform = 'translateX(20px)';
    setTimeout(() => el.remove(), 220);
  }, 4200);
}

// --------- Conviction recompute (light simulation) ---------
function recomputeConviction() {
  const base = 65 + Math.sin(Date.now() / 18000) * 12;
  const score = Math.round(base + (rng() - 0.5) * 4);
  $('conviction-score').textContent = score;
  const el = $('conviction-score');
  el.className = `font-bebas text-4xl ${score >= 70 ? 'text-emerald-400' : score >= 50 ? 'text-amber-400' : 'text-red-400'}`;
}
setInterval(recomputeConviction, 4000);

// --------- Smooth scroll for nav ---------
document.querySelectorAll('nav a').forEach(a => {
  a.addEventListener('click', (e) => {
    e.preventDefault();
    document.querySelectorAll('nav a').forEach(x => {
      x.classList.remove('text-emerald-400', 'border-b', 'border-emerald-400');
      x.classList.add('text-zinc-500');
    });
    a.classList.add('text-emerald-400', 'border-b', 'border-emerald-400');
    a.classList.remove('text-zinc-500');
    const id = a.getAttribute('href').slice(1);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
});

// Initial welcome toast
setTimeout(() => {
  toast('ok', 'CONNECTED', 'Simulation feed active. Risk Guard armed.');
}, 600);
