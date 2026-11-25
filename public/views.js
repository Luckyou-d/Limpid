'use strict';

(function () {
  const ALLOC_COLORS = ['#0ea5e9', '#10b981', '#6366f1', '#f59e0b', '#ec4899', '#8b5cf6', '#14b8a6', '#64748b'];

  const SVG_PATHS = {
    grid: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
    compass: '<circle cx="12" cy="12" r="9"/><polygon points="16.2 7.8 14.1 14.1 7.8 16.2 9.9 9.9 16.2 7.8"/>',
    chart: '<path d="M3 3v18h18"/><path d="m7 15 4-4 3 3 5-6"/>',
    briefcase: '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>',
    gitCompare: '<circle cx="6" cy="6" r="2.5"/><circle cx="18" cy="18" r="2.5"/><path d="M8.5 6H14a4 4 0 0 1 4 4v5.5M15.5 18H10a4 4 0 0 1-4-4V8.5"/>',
    scales: '<path d="M12 3v18M5 7h14M6 7l-2.5 6h5L6 7ZM18 7l-2.5 6h5L18 7ZM8 21h8"/>',
    bell: '<path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>',
    book: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>',
    fileText: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M8 13h8M8 17h5"/>',
    newspaper: '<path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2"/><path d="M10 6h8M10 10h8M10 14h4"/>',
    zap: '<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>',
    flask: '<path d="M9 3h6M10 3v6l-5 9a2 2 0 0 0 1.7 3h10.6a2 2 0 0 0 1.7-3l-5-9V3"/>',
    calendar: '<rect x="3" y="4" width="18" height="17" rx="2"/><path d="M8 2v4M16 2v4M3 10h18"/>',
    shield: '<path d="m12 3 8 3v5c0 5-3 8-8 10-5-2-8-5-8-10V6l8-3Z"/>',
    settings: '<circle cx="12" cy="12" r="3"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
    refresh: '<path d="M21 12a9 9 0 0 1-15.4 6.4L3 16M3 12a9 9 0 0 1 15.4-6.4L21 8"/><path d="M21 3v5h-5M3 21v-5h5"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
    smartphone: '<rect x="6" y="2" width="12" height="20" rx="2"/><path d="M12 18h.01"/>',
    monitor: '<rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 20h8M12 16v4"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    close: '<path d="M18 6 6 18M6 6l12 12"/>',
    check: '<path d="m5 12 5 5L20 7"/>',
    alert: '<path d="m10.3 3.9-8.5 14.7A2 2 0 0 0 3.5 21.6h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"/><path d="M12 9v4M12 17h.01"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/>',
    play: '<polygon points="6 4 20 12 6 20 6 4"/>',
    bot: '<rect x="4" y="6" width="16" height="13" rx="3"/><path d="M12 3v3M9 11v2M15 11v2M8 15h8"/>',
    brain: '<path d="M9.5 4a3.5 3.5 0 0 0-3.5 3.5c0 .5.1 1 .3 1.4A3.5 3.5 0 0 0 5 15.5 3.5 3.5 0 0 0 8.5 19H11V4H9.5ZM14.5 4A3.5 3.5 0 0 1 18 7.5c0 .5-.1 1-.3 1.4A3.5 3.5 0 0 1 19 15.5 3.5 3.5 0 0 1 15.5 19H13V4h1.5Z"/>',
    wrench: '<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76Z"/>',
    link: '<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>',
    arrowUpRight: '<path d="M7 17 17 7M8 7h9v9"/>',
    arrowRight: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    back: '<path d="m15 18-6-6 6-6"/>',
    menu: '<circle cx="12" cy="12" r="1.2"/><circle cx="19" cy="12" r="1.2"/><circle cx="5" cy="12" r="1.2"/>',
    send: '<path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/>',
    reset: '<path d="M3 12a9 9 0 1 0 3-6.7L3 8M3 3v5h5"/>',
  };

  function icon(name, size = 14) {
    return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.85" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;vertical-align:-2px;">${SVG_PATHS[name] || ''}</svg>`;
  }

  function esc(str) {
    return String(str ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function fmtUsd(val, digits = 2) {
    if (val === null || val === undefined || Number.isNaN(Number(val))) return '—';
    const n = Number(val);
    const sign = n < 0 ? '-' : '';
    return sign + 'US$' + Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits });
  }

  function fmtSignedUsd(val) {
    if (val === null || val === undefined || Number.isNaN(Number(val))) return '—';
    const n = Number(val);
    const sign = n > 0 ? '+' : n < 0 ? '-' : '';
    return sign + 'US$' + Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function fmtPct(val, digits = 2) {
    if (val === null || val === undefined || Number.isNaN(Number(val))) return '—';
    const n = Number(val);
    const sign = n > 0 ? '+' : '';
    return `${sign}${n.toFixed(digits)}%`;
  }

  function fmtVol(v) {
    if (!v && v !== 0) return '—';
    const n = Number(v);
    if (n >= 1e9) return (n / 1e9).toFixed(2) + 'B';
    if (n >= 1e6) return (n / 1e6).toFixed(2) + 'M';
    if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K';
    return String(n);
  }

  function chgClass(val) {
    const n = Number(val);
    if (!Number.isFinite(n) || n === 0) return 'muted';
    return n > 0 ? 'pos-text' : 'neg-text';
  }

  function inlineMd(text) {
    let s = esc(text);
    s = s.replace(/`([^`]+)`/g, '<code>$1</code>');
    s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    s = s.replace(/\*([^*]+)\*/g, '<em>$1</em>');
    return s;
  }

  function renderMarkdown(md) {
    if (!md) return '';
    const lines = String(md).replace(/\r\n/g, '\n').split('\n');
    const out = [];
    let i = 0;
    while (i < lines.length) {
      const line = lines[i];
      const trimmed = line.trim();
      if (!trimmed) {
        i++;
        continue;
      }
      if (trimmed.includes('|') && i + 1 < lines.length && /^\s*\|?[\s:-]+\|[\s|:-]*$/.test(lines[i + 1])) {
        const parseRow = (r) =>
          r
            .trim()
            .replace(/^\|/, '')
            .replace(/\|$/, '')
            .split('|')
            .map((c) => inlineMd(c.trim()));
        const headers = parseRow(line);
        i += 2;
        const rows = [];
        while (i < lines.length && lines[i].trim().includes('|')) {
          rows.push(parseRow(lines[i]));
          i++;
        }
        out.push(
          `<div class="md-table-wrap"><table><thead><tr>${headers.map((h) => `<th>${h}</th>`).join('')}</tr></thead><tbody>${rows
            .map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join('')}</tr>`)
            .join('')}</tbody></table></div>`
        );
        continue;
      }
      if (/^#{1,4}\s+/.test(trimmed)) {
        const lvl = Math.min(4, trimmed.match(/^#+/)[0].length);
        out.push(`<h${lvl}>${inlineMd(trimmed.replace(/^#{1,4}\s+/, ''))}</h${lvl}>`);
        i++;
        continue;
      }
      if (trimmed.startsWith('>')) {
        const qLines = [];
        while (i < lines.length && lines[i].trim().startsWith('>')) {
          qLines.push(inlineMd(lines[i].trim().replace(/^>\s?/, '')));
          i++;
        }
        out.push(`<blockquote>${qLines.join('<br/>')}</blockquote>`);
        continue;
      }
      if (/^[-*]\s+/.test(trimmed)) {
        const items = [];
        while (i < lines.length && /^[-*]\s+/.test(lines[i].trim())) {
          items.push(`<li>${inlineMd(lines[i].trim().replace(/^[-*]\s+/, ''))}</li>`);
          i++;
        }
        out.push(`<ul>${items.join('')}</ul>`);
        continue;
      }
      if (/^\d+\.\s+/.test(trimmed)) {
        const items = [];
        while (i < lines.length && /^\d+\.\s+/.test(lines[i].trim())) {
          items.push(`<li>${inlineMd(lines[i].trim().replace(/^\d+\.\s+/, ''))}</li>`);
          i++;
        }
        out.push(`<ol>${items.join('')}</ol>`);
        continue;
      }
      if (/^---+$/.test(trimmed)) {
        out.push('<hr style="border:none;border-top:1px solid var(--border);margin:8px 0;"/>');
        i++;
        continue;
      }
      out.push(`<p>${inlineMd(trimmed)}</p>`);
      i++;
    }
    return `<div class="md-body">${out.join('')}</div>`;
  }

  function computePortfolio(state, market) {
    const eq = market.equities || {};
    let equityValue = 0;
    let totalCost = 0;
    let dailyPnl = 0;

    const rows = state.holdings.map((h, idx) => {
      const q = eq[h.symbol];
      const price = q ? q.price : h.avgCost;
      const change = q ? q.change : 0;
      const changePct = q ? q.changePct : 0;
      const marketValue = h.qty * price;
      const costValue = h.qty * h.avgCost;
      const pnl = marketValue - costValue;
      const pnlPct = costValue > 0 ? (pnl / costValue) * 100 : 0;
      const dayPnl = h.qty * change;
      equityValue += marketValue;
      totalCost += costValue;
      dailyPnl += dayPnl;
      return {
        ...h,
        color: ALLOC_COLORS[idx % ALLOC_COLORS.length],
        name: q ? q.name : h.symbol,
        price,
        change,
        changePct,
        marketValue,
        costValue,
        pnl,
        pnlPct,
        dayPnl,
        rsi14: q?.rsi14 ?? null,
        ret1m: q?.ret1m ?? null,
        drawdown60d: q?.drawdown60d ?? null,
      };
    });

    const totalAssets = equityValue + (Number(state.cashUsd) || 0);
    rows.forEach((r) => {
      r.weightPct = totalAssets > 0 ? (r.marketValue / totalAssets) * 100 : 0;
    });
    rows.sort((a, b) => b.marketValue - a.marketValue);

    const cashWeightPct = totalAssets > 0 ? ((Number(state.cashUsd) || 0) / totalAssets) * 100 : 0;
    const hhi = Math.round(rows.reduce((s, r) => s + Math.pow(r.weightPct / 100, 2), 0) * 10000);
    const top1 = rows[0]?.weightPct || 0;
    const top3 = rows.slice(0, 3).reduce((s, r) => s + r.weightPct, 0);
    const semiWeight = rows.filter((r) => r.cluster === 'AI 半导体').reduce((s, r) => s + r.weightPct, 0);
    const totalPnl = equityValue - totalCost;
    const totalPnlPct = totalCost > 0 ? (totalPnl / totalCost) * 100 : 0;
    const dailyPct = totalAssets - dailyPnl > 0 ? (dailyPnl / (totalAssets - dailyPnl)) * 100 : 0;

    return {
      rows,
      cashUsd: Number(state.cashUsd) || 0,
      cashWeightPct,
      equityValue,
      totalCost,
      totalAssets,
      totalPnl,
      totalPnlPct,
      dailyPnl,
      dailyPct,
      hhi,
      top1,
      top3,
      semiWeight,
    };
  }

  function evaluateAlerts(state, market, portfolio) {
    const eq = market.equities || {};
    return state.alerts.map((al) => {
      let currentVal = null;
      let triggered = false;
      let currentStr = '—';
      if (al.type === 'price_below' && eq[al.symbol]) {
        currentVal = eq[al.symbol].price;
        currentStr = fmtUsd(currentVal);
        triggered = al.enabled && currentVal < al.threshold;
      } else if (al.type === 'price_above' && eq[al.symbol]) {
        currentVal = eq[al.symbol].price;
        currentStr = fmtUsd(currentVal);
        triggered = al.enabled && currentVal > al.threshold;
      } else if (al.type === 'rsi_below' && eq[al.symbol]) {
        currentVal = eq[al.symbol].rsi14;
        currentStr = currentVal !== null ? String(currentVal) : '—';
        triggered = al.enabled && currentVal !== null && currentVal < al.threshold;
      } else if (al.type === 'cluster_weight') {
        currentVal = portfolio.semiWeight;
        currentStr = `${currentVal.toFixed(1)}%`;
        triggered = al.enabled && currentVal > al.threshold;
      }
      return { ...al, currentVal, currentStr, triggered };
    });
  }

  function renderSparkline(values, positive) {
    if (!values || values.length < 2) return '';
    const min = Math.min(...values);
    const max = Math.max(...values);
    const span = max - min || 1;
    const w = 86;
    const h = 28;
    const pts = values
      .map((v, idx) => {
        const x = ((idx / (values.length - 1)) * w).toFixed(1);
        const y = (h - 3 - ((v - min) / span) * (h - 6)).toFixed(1);
        return `${x},${y}`;
      })
      .join(' ');
    const stroke = positive ? 'var(--positive)' : 'var(--negative)';
    return `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" fill="none"><polyline points="${pts}" stroke="${stroke}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  }

  function renderKlineSvg(eqItem, period, showEma, hoverIdx) {
    const bars = period === '1w' ? eqItem.weekly : eqItem.daily;
    if (!bars || !bars.length) return '<div class="muted small">暂无 K 线序列</div>';

    const W = 820;
    const H = 340;
    const padL = 12;
    const padR = 62;
    const padT = 16;
    const priceH = 228;
    const volTop = 258;
    const volH = 56;
    const plotW = W - padL - padR;

    let minP = Infinity;
    let maxP = -Infinity;
    let maxV = 1;
    let hiIdx = 0;
    let loIdx = 0;
    bars.forEach((b, i) => {
      if (b.low < minP) { minP = b.low; loIdx = i; }
      if (b.high > maxP) { maxP = b.high; hiIdx = i; }
      if (showEma) {
        [b.ema6, b.ema12, b.ema20].forEach((e) => {
          if (typeof e === 'number') {
            if (e < minP) minP = e;
            if (e > maxP) maxP = e;
          }
        });
      }
      if (b.volume > maxV) maxV = b.volume;
    });
    const padP = (maxP - minP) * 0.06 || 1;
    minP -= padP;
    maxP += padP;

    const xOf = (i) => padL + ((i + 0.5) / bars.length) * plotW;
    const yOf = (p) => padT + (1 - (p - minP) / (maxP - minP)) * priceH;
    const candleW = Math.max(3, Math.min(9, (plotW / bars.length) * 0.66));

    const gridLines = [];
    for (let g = 0; g <= 4; g++) {
      const val = maxP - ((maxP - minP) * g) / 4;
      const y = (padT + (priceH * g) / 4).toFixed(1);
      gridLines.push(
        `<line x1="${padL}" y1="${y}" x2="${W - padR}" y2="${y}" stroke="var(--border)" stroke-dasharray="2,2"/>` +
          `<text x="${W - padR + 6}" y="${Number(y) + 4}" font-size="10.5" fill="var(--text-subtle)" font-family="var(--font-mono)">${val.toFixed(2)}</text>`
      );
    }

    const candles = bars
      .map((b, i) => {
        const x = xOf(i);
        const isUp = b.close >= b.open;
        const color = isUp ? 'var(--positive)' : 'var(--negative)';
        const yHigh = yOf(b.high).toFixed(1);
        const yLow = yOf(b.low).toFixed(1);
        const yTop = yOf(Math.max(b.open, b.close));
        const yBot = yOf(Math.min(b.open, b.close));
        const rectH = Math.max(1.5, yBot - yTop);
        const vBarH = Math.max(1.5, (b.volume / maxV) * volH);
        const vY = volTop + volH - vBarH;
        return (
          `<g class="k-bar" data-kidx="${i}">` +
          `<rect x="${(x - plotW / bars.length / 2).toFixed(1)}" y="${padT}" width="${(plotW / bars.length).toFixed(1)}" height="${volTop + volH - padT}" fill="transparent"/>` +
          `<line x1="${x.toFixed(1)}" y1="${yHigh}" x2="${x.toFixed(1)}" y2="${yLow}" stroke="${color}" stroke-width="1.2"/>` +
          `<rect x="${(x - candleW / 2).toFixed(1)}" y="${yTop.toFixed(1)}" width="${candleW.toFixed(1)}" height="${rectH.toFixed(1)}" fill="${color}" rx="0.8"/>` +
          `<rect x="${(x - candleW / 2).toFixed(1)}" y="${vY.toFixed(1)}" width="${candleW.toFixed(1)}" height="${vBarH.toFixed(1)}" fill="${color}" opacity="0.45"/>` +
          `</g>`
        );
      })
      .join('');

    const emaPath = (key, stroke) => {
      if (!showEma) return '';
      const pts = bars
        .map((b, i) => (typeof b[key] === 'number' ? `${xOf(i).toFixed(1)},${yOf(b[key]).toFixed(1)}` : null))
        .filter(Boolean)
        .join(' ');
      return `<polyline points="${pts}" fill="none" stroke="${stroke}" stroke-width="1.35"/>`;
    };

    const lastBar = bars[bars.length - 1];
    const lastY = yOf(lastBar.close).toFixed(1);
    const lastColor = lastBar.close >= lastBar.open ? 'var(--positive)' : 'var(--negative)';

    const dateLabels = [0, Math.floor(bars.length * 0.25), Math.floor(bars.length * 0.5), Math.floor(bars.length * 0.75), bars.length - 1]
      .map((idx) => `<text x="${xOf(idx).toFixed(1)}" y="${H - 6}" text-anchor="middle" font-size="10" fill="var(--text-subtle)" font-family="var(--font-mono)">${esc(bars[idx].time)}</text>`)
      .join('');

    const activeIdx = hoverIdx !== null && hoverIdx >= 0 && hoverIdx < bars.length ? hoverIdx : bars.length - 1;
    const activeBar = bars[activeIdx];
    const crossHtml =
      hoverIdx !== null && hoverIdx >= 0 && hoverIdx < bars.length
        ? `<line x1="${xOf(hoverIdx).toFixed(1)}" y1="${padT}" x2="${xOf(hoverIdx).toFixed(1)}" y2="${volTop + volH}" stroke="var(--accent)" stroke-dasharray="3,3" stroke-width="1"/>`
        : '';

    const hiX = xOf(hiIdx).toFixed(1);
    const hiY = (yOf(bars[hiIdx].high) - 5).toFixed(1);
    const loX = xOf(loIdx).toFixed(1);
    const loY = (yOf(bars[loIdx].low) + 11).toFixed(1);

    return `
      <div class="kline-ohlc-bar tnum">
        <strong>${esc(eqItem.symbol)} · ${period.toUpperCase()}</strong>
        <span>Time: ${esc(activeBar.time)}</span>
        <span>O: ${activeBar.open.toFixed(2)}</span>
        <span>H: ${activeBar.high.toFixed(2)}</span>
        <span>L: ${activeBar.low.toFixed(2)}</span>
        <span>C: <strong class="${activeBar.close >= activeBar.open ? 'pos-text' : 'neg-text'}">${activeBar.close.toFixed(2)}</strong></span>
        <span>Vol: ${fmtVol(activeBar.volume)}</span>
        ${
          showEma
            ? `<span style="color:#f59e0b;">EMA6: ${activeBar.ema6?.toFixed(2)}</span>
               <span style="color:#8b5cf6;">EMA12: ${activeBar.ema12?.toFixed(2)}</span>
               <span style="color:var(--accent-text);">EMA20: ${activeBar.ema20?.toFixed(2)}</span>`
            : ''
        }
      </div>
      <svg class="kline-svg" id="kline-svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none">
        ${gridLines.join('')}
        <line x1="${padL}" y1="${volTop}" x2="${W - padR}" y2="${volTop}" stroke="var(--border)"/>
        ${candles}
        ${emaPath('ema6', '#f59e0b')}
        ${emaPath('ema12', '#8b5cf6')}
        ${emaPath('ema20', '#0ea5e9')}
        <line x1="${padL}" y1="${lastY}" x2="${W - padR}" y2="${lastY}" stroke="${lastColor}" stroke-dasharray="3,3" stroke-width="1"/>
        <rect x="${W - padR + 2}" y="${Number(lastY) - 9}" width="56" height="18" rx="4" fill="${lastColor}"/>
        <text x="${W - padR + 30}" y="${Number(lastY) + 3.5}" text-anchor="middle" font-size="10" font-weight="700" fill="#fff" font-family="var(--font-mono)">${lastBar.close.toFixed(2)}</text>
        <text x="${hiX}" y="${hiY}" text-anchor="middle" font-size="9.5" fill="var(--text-muted)" font-family="var(--font-mono)">H ${bars[hiIdx].high.toFixed(2)}</text>
        <text x="${loX}" y="${loY}" text-anchor="middle" font-size="9.5" fill="var(--text-muted)" font-family="var(--font-mono)">L ${bars[loIdx].low.toFixed(2)}</text>
        ${crossHtml}
        ${dateLabels}
      </svg>`;
  }

  function renderCompareCurveSvg(symbols, market) {
    const valid = symbols.filter((s) => market.equities[s]?.daily?.length >= 20);
    if (valid.length < 2) return '';
    const W = 760;
    const H = 190;
    const padL = 12;
    const padR = 56;
    const padT = 14;
    const padB = 24;
    const plotW = W - padL - padR;
    const plotH = H - padT - padB;

    const series = valid.map((sym, idx) => {
      const bars = market.equities[sym].daily.slice(-60);
      const base = bars[0].close || 1;
      const pcts = bars.map((b) => ((b.close - base) / base) * 100);
      return { sym, color: ALLOC_COLORS[idx % ALLOC_COLORS.length], pcts, bars };
    });

    let minV = -2;
    let maxV = 2;
    series.forEach((s) =>
      s.pcts.forEach((v) => {
        if (v < minV) minV = v;
        if (v > maxV) maxV = v;
      })
    );
    const pad = (maxV - minV) * 0.08 || 1;
    minV -= pad;
    maxV += pad;

    const yOf = (v) => padT + (1 - (v - minV) / (maxV - minV)) * plotH;
    const zeroY = yOf(0).toFixed(1);

    const lines = series
      .map((s) => {
        const pts = s.pcts
          .map((v, i) => {
            const x = padL + (i / (s.pcts.length - 1)) * plotW;
            return `${x.toFixed(1)},${yOf(v).toFixed(1)}`;
          })
          .join(' ');
        const endVal = s.pcts[s.pcts.length - 1];
        return `<polyline points="${pts}" fill="none" stroke="${s.color}" stroke-width="2"/>
                <text x="${W - padR + 5}" y="${yOf(endVal).toFixed(1)}" font-size="10" font-weight="650" fill="${s.color}" font-family="var(--font-mono)">${fmtPct(endVal, 1)}</text>`;
      })
      .join('');

    return `
      <div class="card compact" style="margin-bottom:14px;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
          <span class="small muted"><strong>近 60 个交易日归一化相对收益曲线 (%)</strong> · 基准 = 窗口首日收盘价 (0%)</span>
          <div style="display:flex;gap:12px;flex-wrap:wrap;">
            ${series.map((s) => `<span class="tiny" style="display:inline-flex;align-items:center;gap:5px;"><span class="alloc-dot" style="background:${s.color};"></span><strong>${esc(s.sym)}</strong></span>`).join('')}
          </div>
        </div>
        <svg width="100%" height="${H}" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none">
          <line x1="${padL}" y1="${zeroY}" x2="${W - padR}" y2="${zeroY}" stroke="var(--border-strong)" stroke-dasharray="3,3"/>
          <text x="${W - padR + 5}" y="${Number(zeroY) + 3}" font-size="10" fill="var(--text-subtle)" font-family="var(--font-mono)">0.0%</text>
          ${lines}
        </svg>
      </div>`;
  }

  function renderToday(state, market, portfolio) {
    const eq = market.equities;
    const indices = Object.values(market.indices || {});
    const movers = state.watchlist
      .filter((s) => eq[s])
      .map((s) => eq[s])
      .sort((a, b) => Math.abs(b.changePct) - Math.abs(a.changePct));
    const gainers = [...movers].filter((m) => m.changePct > 0).sort((a, b) => b.changePct - a.changePct).slice(0, 2);
    const losers = [...movers].filter((m) => m.changePct < 0).sort((a, b) => a.changePct - b.changePct).slice(0, 2);
    const briefObj = window.FOLIO_COPILOT_SCENARIOS.find((s) => s.id === 'morning-brief')?.modelOutputs['glm-5.3-flash'];
    const staleTheses = state.theses.filter((t) => t.needsReview);

    return `
      <div style="margin-bottom:16px;display:flex;justify-content:space-between;align-items:flex-end;gap:12px;flex-wrap:wrap;">
        <div>
          <h1 class="page-title">下午好</h1>
          <p class="page-sub">今天想了解关于你投资组合与自选标的的什么？</p>
        </div>
        <div style="display:flex;gap:8px;align-items:center;">
          <span class="badge info">行情源: Yahoo Finance · Delayed</span>
          <span class="badge warn">${icon('flask', 12)}<span>组合与日历: 示例数据</span></span>
        </div>
      </div>

      <div class="grid-today-hero" style="margin-bottom:14px;">
        <div class="card">
          <div class="card-header">
            <div>
              <span class="section-eyebrow">总资产</span>
              <div style="margin-top:4px;display:flex;align-items:baseline;gap:10px;flex-wrap:wrap;">
                <span class="tnum" style="font-size:28px;font-weight:750;letter-spacing:-0.02em;">${fmtUsd(portfolio.totalAssets)}</span>
                <span class="badge ${portfolio.totalPnl >= 0 ? 'pos' : 'neg'} tnum">总浮盈 ${fmtSignedUsd(portfolio.totalPnl)} (${fmtPct(portfolio.totalPnlPct)})</span>
              </div>
            </div>
            <span class="badge">${icon('flask', 12)}<span>示例数据</span></span>
          </div>

          <div class="grid-3" style="padding:10px 0;border-top:1px solid var(--border);border-bottom:1px solid var(--border);margin-bottom:12px;">
            <div>
              <div class="tiny subtle">现金储备</div>
              <div class="tnum" style="font-weight:650;margin-top:2px;">${fmtUsd(portfolio.cashUsd)} <span class="tiny muted">(${portfolio.cashWeightPct.toFixed(1)}%)</span></div>
            </div>
            <div>
              <div class="tiny subtle">单日估值变动</div>
              <div class="tnum ${chgClass(portfolio.dailyPnl)}" style="font-weight:650;margin-top:2px;">${fmtSignedUsd(portfolio.dailyPnl)} (${fmtPct(portfolio.dailyPct)})</div>
            </div>
            <div>
              <div class="tiny subtle">持仓数 / AI 半导体簇</div>
              <div class="tnum" style="font-weight:650;margin-top:2px;">${portfolio.rows.length} 只 · <span class="${portfolio.semiWeight > 35 ? 'warn-text' : ''}">${portfolio.semiWeight.toFixed(1)}%</span></div>
            </div>
          </div>

          <div class="grid-2">
            <div>
              <div class="tiny subtle" style="margin-bottom:5px;">自选涨幅居前</div>
              ${gainers.map((g) => `<div style="display:flex;justify-content:space-between;padding:3px 0;" class="small"><strong>${esc(g.symbol)}</strong><span class="tnum pos-text">${fmtPct(g.changePct)}</span></div>`).join('') || '<div class="tiny muted">暂无上涨标的</div>'}
            </div>
            <div>
              <div class="tiny subtle" style="margin-bottom:5px;">自选跌幅居前</div>
              ${losers.map((l) => `<div style="display:flex;justify-content:space-between;padding:3px 0;" class="small"><strong>${esc(l.symbol)}</strong><span class="tnum neg-text">${fmtPct(l.changePct)}</span></div>`).join('') || '<div class="tiny muted">暂无下跌标的</div>'}
            </div>
          </div>
        </div>

        <div class="card" style="display:flex;flex-direction:column;justify-content:space-between;">
          <div>
            <div class="card-header" style="margin-bottom:8px;">
              <span class="section-eyebrow">即将发生的事件</span>
              <span class="badge">${icon('flask', 12)}<span>示例数据</span></span>
            </div>
            ${window.FOLIO_DEMO_EVENTS.slice(0, 3)
              .map(
                (ev) => `
              <div style="padding:7px 0;border-bottom:1px solid var(--border);">
                <div style="display:flex;justify-content:space-between;gap:6px;">
                  <strong class="small">${esc(ev.symbol)} · ${esc(ev.category)}</strong>
                  <span class="tiny subtle tnum">${esc(ev.date)}</span>
                </div>
                <div class="tiny muted" style="margin-top:2px;display:-webkit-box;-webkit-line-clamp:1;-webkit-box-orient:vertical;overflow:hidden;">${esc(ev.title)}</div>
              </div>`
              )
              .join('')}
          </div>
          <button class="btn sm" style="width:100%;margin-top:10px;" data-nav="/events"><span>事件与催化剂</span>${icon('arrowRight', 13)}</button>
        </div>
      </div>

      <div class="grid-3" style="margin-bottom:14px;">
        <button class="quick-tile" data-nav="/research">
          <div style="display:flex;align-items:center;gap:10px;">
            <div class="quick-icon">${icon('search', 17)}</div>
            <div>
              <div style="font-weight:650;font-size:13px;">深度研究 (${esc(state.activeSymbol)})</div>
              <div class="tiny muted">基于证据的结构化报告</div>
            </div>
          </div>
          <span class="muted">${icon('arrowUpRight', 15)}</span>
        </button>
        <button class="quick-tile" data-run-scenario="portfolio-audit">
          <div style="display:flex;align-items:center;gap:10px;">
            <div class="quick-icon">${icon('briefcase', 17)}</div>
            <div>
              <div style="font-weight:650;font-size:13px;">复核投资组合风险</div>
              <div class="tiny muted">诊断集中度与浮亏敞口</div>
            </div>
          </div>
          <span class="muted">${icon('arrowUpRight', 15)}</span>
        </button>
        <button class="quick-tile" data-nav="/compare">
          <div style="display:flex;align-items:center;gap:10px;">
            <div class="quick-icon">${icon('gitCompare', 17)}</div>
            <div>
              <div style="font-weight:650;font-size:13px;">对比个股</div>
              <div class="tiny muted">对齐多周期回报与技术强弱</div>
            </div>
          </div>
          <span class="muted">${icon('arrowUpRight', 15)}</span>
        </button>
      </div>

      <div class="card" style="margin-bottom:14px;">
        <div class="card-header">
          <span class="section-eyebrow">市场脉搏 (Market Pulse · Yahoo Finance Delayed)</span>
          <span class="tiny subtle">点击任意自选行可同步切换工作台与右侧 Agent 上下文</span>
        </div>
        <div class="grid-4" style="margin-bottom:14px;">
          ${indices
            .map(
              (ix) => `
            <div class="card compact" style="background:var(--surface-muted);">
              <div style="display:flex;justify-content:space-between;align-items:center;">
                <strong class="small">${esc(ix.name)}</strong>
                <span class="tiny tnum ${chgClass(ix.changePct)}">${fmtPct(ix.changePct)}</span>
              </div>
              <div style="display:flex;justify-content:space-between;align-items:flex-end;margin-top:6px;">
                <span class="tnum" style="font-size:15px;font-weight:700;">${ix.price.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                ${renderSparkline(ix.spark, ix.changePct >= 0)}
              </div>
            </div>`
            )
            .join('')}
        </div>

        <table class="data-table">
          <thead>
            <tr>
              <th>自选标的</th>
              <th>赛道标签</th>
              <th class="right">最新价 (Yahoo)</th>
              <th class="right">单日涨跌</th>
              <th class="right">1个月回报</th>
              <th class="right">RSI(14)</th>
              <th class="right">操作</th>
            </tr>
          </thead>
          <tbody>
            ${movers
              .map(
                (m) => `
              <tr>
                <td><strong>${esc(m.symbol)}</strong> <span class="tiny muted">${esc(m.name)}</span></td>
                <td><span class="tiny muted">${esc(m.sectorTag)}</span></td>
                <td class="right tnum"><strong>${fmtUsd(m.price)}</strong></td>
                <td class="right tnum ${chgClass(m.changePct)}">${fmtPct(m.changePct)}</td>
                <td class="right tnum ${chgClass(m.ret1m)}">${fmtPct(m.ret1m)}</td>
                <td class="right tnum">${m.rsi14 !== null ? `<span class="${m.rsi14 < 30 ? 'neg-text' : ''}">${m.rsi14}</span>` : '—'}</td>
                <td class="right">
                  <button class="btn xs" data-open-sym="${esc(m.symbol)}">K 线</button>
                  <button class="btn xs" data-research-sym="${esc(m.symbol)}">研究</button>
                </td>
              </tr>`
              )
              .join('')}
          </tbody>
        </table>
      </div>

      <div class="grid-2">
        <div class="card">
          <div class="card-header">
            <div>
              <span class="section-eyebrow">每日简报</span>
              <div class="tiny subtle" style="margin-top:2px;">${esc(briefObj?.modelLabel || 'GLM-5.3-Flash')} · 耗时 ${briefObj?.elapsedMs || 0}ms</div>
            </div>
            <button class="btn sm" data-run-scenario="morning-brief">在 Copilot 展开</button>
          </div>
          <div style="max-height:280px;overflow-y:auto;">
            ${renderMarkdown(briefObj?.content || '')}
          </div>
        </div>

        <div class="card">
          <div class="card-header">
            <span class="section-eyebrow">待复核的投资逻辑 (${staleTheses.length})</span>
            <button class="btn sm" data-nav="/thesis"><span>逻辑库</span>${icon('arrowRight', 13)}</button>
          </div>
          ${state.theses
            .map(
              (th) => `
            <div style="padding:10px 12px;border:1px solid var(--border);border-radius:var(--radius-sm);margin-bottom:8px;background:${th.needsReview ? 'var(--warning-bg)' : 'var(--surface-muted)'};">
              <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;">
                <strong>${esc(th.symbol)}</strong>
                <span class="badge ${th.needsReview ? 'warn' : 'pos'}">${th.needsReview ? icon('alert', 12) + '<span>假设已偏离 · 需复核</span>' : icon('check', 12) + '<span>假设完好</span>'}</span>
              </div>
              <div class="small" style="margin-top:4px;font-weight:550;">${esc(th.title)}</div>
              <div style="margin-top:8px;display:flex;gap:6px;">
                <button class="btn xs" data-open-thesis="${esc(th.id)}">查看逻辑与假设</button>
                <button class="btn xs" data-run-scenario="thesis-reeval">重新评估</button>
              </div>
            </div>`
            )
            .join('')}
        </div>
      </div>`;
  }

  function renderDiscover(state, market) {
    const tasks = window.FOLIO_DISCOVER_TASKS;
    const activeTask = tasks.find((t) => t.id === state.discoverTaskId) || tasks[0];
    const eqList = Object.values(market.equities || {});

    let hits = [];
    if (activeTask.requires === 'yahoo') {
      if (activeTask.id === 'oversold-rsi') {
        hits = eqList.filter((q) => q.rsi14 !== null && q.rsi14 < 35 && q.volumeRatio >= 1.0);
      } else if (activeTask.id === 'rel-strength-1m') {
        hits = eqList.filter((q) => q.ret1m !== null && q.ret1m > 1.5 && q.price > q.sma20);
      } else if (activeTask.id === 'vol-expansion') {
        hits = eqList.filter((q) => Math.abs(q.changePct) >= 2.5 && q.volumeRatio >= 1.0);
      } else if (activeTask.id === 'deep-pullback-60d') {
        hits = eqList.filter((q) => q.drawdown60d <= -15.0);
      } else if (activeTask.id === 'near-52w-high') {
        hits = eqList.filter((q) => q.price >= q.fiftyTwoWeekHigh * 0.92);
      }
    }

    return `
      <div style="margin-bottom:16px;display:flex;justify-content:space-between;align-items:flex-start;gap:12px;">
        <div>
          <span class="section-eyebrow">Deterministic Screener · 确定性筛选器</span>
          <h1 class="page-title">机会发现</h1>
          <p class="page-sub">基于确定性行情规则筛选自选与美股观察池，不做黑盒模型扫描；数据不可用时如实返回空集。</p>
        </div>
        <span class="badge info">已接入: Yahoo Finance (8 只美股观察池)</span>
      </div>

      <div class="grid-today-hero">
        <div class="card">
          <div class="card-header">
            <span class="section-eyebrow">筛选任务清单 (${tasks.length} 项代表性规则)</span>
          </div>
          <div style="display:flex;flex-direction:column;gap:6px;">
            ${tasks
              .map(
                (t) => `
              <button class="watch-row ${t.id === activeTask.id ? 'active' : ''}" data-disc-task="${esc(t.id)}" style="padding:9px 11px;">
                <div>
                  <div style="display:flex;align-items:center;gap:6px;">
                    <span class="badge">${esc(t.family)}</span>
                    <strong style="font-size:12.8px;">${esc(t.name)}</strong>
                  </div>
                  <div class="tiny muted mono" style="margin-top:3px;">规则: ${esc(t.rule)}</div>
                </div>
                <span class="badge ${t.requires === 'yahoo' ? 'pos' : 'warn'}">${t.requires === 'yahoo' ? 'Yahoo 可用' : '需 Longbridge'}</span>
              </button>`
              )
              .join('')}
          </div>
        </div>

        <div class="card">
          <div class="card-header">
            <div>
              <span class="section-eyebrow">筛选结果 · ${esc(activeTask.name)}</span>
              <div class="tiny muted" style="margin-top:2px;">命中候选: <strong>${hits.length}</strong> 只</div>
            </div>
          </div>

          ${
            activeTask.requires !== 'yahoo'
              ? `<div style="padding:22px 14px;text-align:center;background:var(--surface-muted);border-radius:var(--radius-sm);">
                   <div style="font-weight:650;margin-bottom:6px;">当前连接无法执行该基本面/事件规则 (0 候选)</div>
                   <div class="small muted">原因：<code>Longbridge CLI is not installed</code>。Yahoo Finance 仅提供美股价格与日/周 K 线，不包含 TTM 市盈率或 EPS Surprise。</div>
                 </div>`
              : hits.length === 0
                ? `<div style="padding:22px 14px;text-align:center;background:var(--surface-muted);border-radius:var(--radius-sm);">
                     <div style="font-weight:650;margin-bottom:6px;">本次扫描命中 0 只候选标的</div>
                     <div class="small muted">当前观察池中暂无满足「${esc(activeTask.rule)}」的标的，可切换左侧其他筛选规则查看。</div>
                   </div>`
                : `<div style="display:flex;flex-direction:column;gap:8px;">
                     ${hits
                       .map(
                         (q) => `
                       <div style="padding:10px 12px;border:1px solid var(--border);border-radius:var(--radius-sm);">
                         <div style="display:flex;justify-content:space-between;align-items:center;">
                           <div>
                             <strong>${esc(q.symbol)}</strong>
                             <span class="tiny muted">${esc(q.name)}</span>
                           </div>
                           <span class="tnum" style="font-weight:700;">${fmtUsd(q.price)} <span class="${chgClass(q.changePct)}">(${fmtPct(q.changePct)})</span></span>
                         </div>
                         <div class="tiny muted tnum" style="margin-top:5px;">
                           1M: <strong class="${chgClass(q.ret1m)}">${fmtPct(q.ret1m)}</strong> · RSI(14): <strong>${q.rsi14}</strong> · 60D回撤: <strong>${fmtPct(q.drawdown60d)}</strong> · 量比: <strong>${q.volumeRatio}x</strong>
                         </div>
                         <div style="margin-top:8px;display:flex;gap:6px;">
                           <button class="btn xs accent" data-research-sym="${esc(q.symbol)}">深度研究</button>
                           <button class="btn xs" data-open-sym="${esc(q.symbol)}">查看 K 线</button>
                           <button class="btn xs" data-add-compare="${esc(q.symbol)}">加入对比</button>
                         </div>
                       </div>`
                       )
                       .join('')}
                   </div>`
          }
        </div>
      </div>`;
  }

  function renderWorkspace(state, market, portfolio) {
    const sym = state.activeSymbol || 'NVDA.US';
    const eqItem = market.equities[sym];

    if (!eqItem) {
      return `
        <div class="card" style="margin-bottom:14px;">
          <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;">
            <div>
              <div style="display:flex;align-items:center;gap:8px;">
                <h1 class="page-title">${esc(sym)}</h1>
                <span class="badge warn">行情不可用 · Provider Boundary</span>
              </div>
              <p class="page-sub">腾讯控股 (HKEX) · 非美股市场标的</p>
            </div>
            <button class="btn accent" data-run-scenario="honest-data-gap"><span>在 Copilot 查看缺口说明</span>${icon('arrowRight', 14)}</button>
          </div>
          <div style="margin-top:16px;padding:18px;border-radius:var(--radius-sm);background:var(--surface-muted);border:1px dashed var(--border-strong);">
            <div style="font-weight:650;margin-bottom:6px;">Yahoo Finance 适配器不支持港股/A股行情 (UNSUPPORTED_CAPABILITY)</div>
            <div class="small muted">明澈 中的 Yahoo Finance 通道仅提供美股（<code>.US</code>）延迟报价与日/周 K 线。要查看 <code>0700.HK</code> 的实时报价、盘口与财报，请在本机安装并登录 <code>longbridge auth login</code>。在未连接数据源时，明澈 严格保持 <code>—</code> 状态，绝不回退虚构价格。</div>
            <div style="margin-top:12px;">
              <button class="btn sm primary" data-open-sym="NVDA.US">切回 NVDA.US 美股工作台</button>
            </div>
          </div>
        </div>`;
    }

    const pos = portfolio.rows.find((r) => r.symbol === sym);
    const rep = window.FOLIO_RESEARCH_REPORTS[sym]?.parsed;

    let tabBody = '';
    if (state.workspaceTab === 'chart') {
      tabBody = `
        <div class="kline-wrap">
          <div style="display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:10px;">
            <div style="display:flex;gap:4px;align-items:center;">
              <button class="btn xs" data-kperiod-blocked="1m" title="需连接 Longbridge">1m</button>
              <button class="btn xs" data-kperiod-blocked="5m" title="需连接 Longbridge">5m</button>
              <button class="btn xs" data-kperiod-blocked="15m" title="需连接 Longbridge">15m</button>
              <button class="btn xs" data-kperiod-blocked="1h" title="需连接 Longbridge">1h</button>
              <button class="btn xs ${state.klinePeriod === '1d' ? 'accent' : ''}" data-kperiod="1d">1D 日线</button>
              <button class="btn xs ${state.klinePeriod === '1w' ? 'accent' : ''}" data-kperiod="1w">1W 周线</button>
              <label class="tiny muted" style="margin-left:8px;display:inline-flex;align-items:center;gap:4px;cursor:pointer;">
                <input type="checkbox" id="toggle-ema" ${state.showEma ? 'checked' : ''}/> 叠加 EMA(6,12,20)
              </label>
            </div>
            <span class="tiny subtle mono">Yahoo Finance · ${esc(eqItem.marketTimeUtc)} · Delayed</span>
          </div>
          <div id="kline-Dynamic-Container">
            ${renderKlineSvg(eqItem, state.klinePeriod, state.showEma, state.klineHoverIdx)}
          </div>
        </div>`;
    } else if (state.workspaceTab === 'overview') {
      tabBody = `
        <div class="grid-2">
          <div class="card">
            <div class="card-header">
              <span class="section-eyebrow">当前组合持仓联动</span>
              <span class="badge">${pos ? icon('flask', 12) + '<span>示例持仓已持有</span>' : '未持有 · 仅在自选'}</span>
            </div>
            ${
              pos
                ? `<div class="grid-2 tnum" style="gap:10px;">
                     <div><div class="tiny subtle">持仓数量 / 均价</div><div style="font-weight:700;">${pos.qty} 股 @ ${fmtUsd(pos.avgCost)}</div></div>
                     <div><div class="tiny subtle">最新持仓市值</div><div style="font-weight:700;">${fmtUsd(pos.marketValue)} (${pos.weightPct.toFixed(1)}%)</div></div>
                     <div><div class="tiny subtle">未实现浮动盈亏</div><div class="${chgClass(pos.pnl)}" style="font-weight:700;">${fmtSignedUsd(pos.pnl)} (${fmtPct(pos.pnlPct)})</div></div>
                     <div><div class="tiny subtle">所属风险簇</div><div style="font-weight:650;">${esc(pos.cluster)}</div></div>
                   </div>
                   <div class="small muted" style="margin-top:10px;padding-top:8px;border-top:1px solid var(--border);">备注：${esc(pos.note)}</div>`
                : `<div class="small muted">当前演示组合未持有 ${esc(sym)}。你可以在「投资组合」页面点击「导入 / 新增持仓」将其加入模拟测算。</div>`
            }
          </div>
          <div class="card">
            <div class="card-header">
              <span class="section-eyebrow">多周期回报与技术结构 (Yahoo)</span>
              <button class="btn xs accent" data-research-sym="${esc(sym)}"><span>完整研究报告</span>${icon('arrowRight', 12)}</button>
            </div>
            <div class="grid-3 tnum" style="gap:10px;">
              <div><div class="tiny subtle">近 5 日</div><div class="${chgClass(eqItem.ret5d)}" style="font-weight:650;">${fmtPct(eqItem.ret5d)}</div></div>
              <div><div class="tiny subtle">近 1 个月</div><div class="${chgClass(eqItem.ret1m)}" style="font-weight:650;">${fmtPct(eqItem.ret1m)}</div></div>
              <div><div class="tiny subtle">近 3 个月</div><div class="${chgClass(eqItem.ret3m)}" style="font-weight:650;">${fmtPct(eqItem.ret3m)}</div></div>
              <div><div class="tiny subtle">SMA20 / SMA50</div><div style="font-weight:650;">$${eqItem.sma20} / $${eqItem.sma50}</div></div>
              <div><div class="tiny subtle">RSI(14)</div><div style="font-weight:650;">${eqItem.rsi14}</div></div>
              <div><div class="tiny subtle">60日高点回撤</div><div class="neg-text" style="font-weight:650;">${fmtPct(eqItem.drawdown60d)}</div></div>
            </div>
            ${rep ? `<div class="small muted" style="margin-top:10px;padding-top:8px;border-top:1px solid var(--border);"><strong>研究结论 (${esc(rep.stance)} · ${rep.confidence}%)：</strong>${esc(rep.headline)}</div>` : ''}
          </div>
        </div>`;
    } else if (state.workspaceTab === 'financials') {
      tabBody = `
        <div class="card">
          <div class="card-header">
            <span class="section-eyebrow">财务报表与估值倍数 (Financials & Valuation)</span>
            <span class="badge warn">能力不可用 · Longbridge CLI 未安装</span>
          </div>
          <p class="small muted">明澈 状态契约规定：估值倍数（PE / PB / EV-EBITDA）与三大财务报表依赖 Longbridge 或已配置的付费数据源；在仅启用 Yahoo Finance 免费 chart 接口时明确标为 <code>—</code>，不展示过期或硬编码财报。</p>
          <table class="data-table" style="margin-top:10px;">
            <thead><tr><th>指标项</th><th class="right">当前值</th><th class="right">5年均值</th><th>状态说明</th></tr></thead>
            <tbody>
              <tr><td>市盈率 (TTM P/E)</td><td class="right tnum">—</td><td class="right tnum">—</td><td class="tiny muted">需 <code>fundamentals.valuation</code> (Longbridge)</td></tr>
              <tr><td>市销率 (P/S)</td><td class="right tnum">—</td><td class="right tnum">—</td><td class="tiny muted">需 <code>fundamentals.valuation</code> (Longbridge)</td></tr>
              <tr><td>单季营收同比增速</td><td class="right tnum">—</td><td class="right tnum">—</td><td class="tiny muted">需 <code>fundamentals.financials</code> (Longbridge)</td></tr>
              <tr><td>自由现金流 (FCF)</td><td class="right tnum">—</td><td class="right tnum">—</td><td class="tiny muted">需 <code>fundamentals.financials</code> (Longbridge)</td></tr>
            </tbody>
          </table>
        </div>`;
    } else {
      tabBody = `
        <div class="card">
          <div class="card-header">
            <span class="section-eyebrow">个股实时新闻与监管公告 (News & SEC Filings)</span>
            <span class="badge warn">Longbridge CLI 未安装</span>
          </div>
          <div style="padding:18px;background:var(--surface-muted);border-radius:var(--radius-sm);">
            <div style="font-weight:650;margin-bottom:4px;">新闻流能力 <code>content.news</code> 未就绪</div>
            <div class="small muted">未安装 Longbridge CLI 时，新闻页明确说明缺失原因而非留白。你仍可前往「事件」查看近期催化日历，或在「研究」中生成基于量价证据的结构化报告。</div>
          </div>
        </div>`;
    }

    return `
      <div class="card" style="margin-bottom:14px;">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:16px;flex-wrap:wrap;">
          <div>
            <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
              <h1 class="page-title" style="font-size:21px;">${esc(eqItem.name)}</h1>
              <span class="badge info mono">${esc(eqItem.symbol)}</span>
              <span class="tiny subtle">${esc(eqItem.exchange)} · ${esc(eqItem.sectorTag)}</span>
            </div>
            <div class="tiny subtle" style="margin-top:4px;">当前选中标的同步绑定至 K 线、研究报告与右侧 Agent Copilot 上下文</div>
          </div>

          <div style="display:flex;align-items:center;gap:14px;flex-wrap:wrap;">
            <div style="text-align:right;">
              <div class="tnum" style="font-size:26px;font-weight:750;line-height:1.1;">${fmtUsd(eqItem.price)}</div>
              <div class="tnum small ${chgClass(eqItem.changePct)}" style="font-weight:650;margin-top:2px;">
                ${eqItem.change >= 0 ? '+' : ''}${eqItem.change.toFixed(2)} (${fmtPct(eqItem.changePct)})
              </div>
              <div class="tiny subtle" style="margin-top:2px;">Yahoo Finance · ${esc(eqItem.marketTimeUtc)} · Delayed</div>
            </div>
            <button class="btn accent" data-research-sym="${esc(eqItem.symbol)}">${icon('search', 14)}<span>深度研究</span></button>
          </div>
        </div>

        <div class="grid-4 tnum" style="margin-top:14px;padding-top:12px;border-top:1px solid var(--border);gap:10px;">
          <div><span class="tiny subtle">今开 / 昨收</span><div style="font-weight:600;">${fmtUsd(eqItem.open)} / ${fmtUsd(eqItem.prevClose)}</div></div>
          <div><span class="tiny subtle">最高 / 最低</span><div style="font-weight:600;">${fmtUsd(eqItem.high)} / ${fmtUsd(eqItem.low)}</div></div>
          <div><span class="tiny subtle">成交量 / 20日量比</span><div style="font-weight:600;">${fmtVol(eqItem.volume)} (${eqItem.volumeRatio}x)</div></div>
          <div><span class="tiny subtle">52周区间</span><div style="font-weight:600;">$${eqItem.fiftyTwoWeekLow} – $${eqItem.fiftyTwoWeekHigh}</div></div>
        </div>
      </div>

      <div class="tabs-bar">
        <button class="tab-btn ${state.workspaceTab === 'overview' ? 'active' : ''}" data-wstab="overview">Overview 概览</button>
        <button class="tab-btn ${state.workspaceTab === 'chart' ? 'active' : ''}" data-wstab="chart">Chart K 线</button>
        <button class="tab-btn ${state.workspaceTab === 'financials' ? 'active' : ''}" data-wstab="financials">Financials 财务报表</button>
        <button class="tab-btn ${state.workspaceTab === 'news' ? 'active' : ''}" data-wstab="news">News 新闻</button>
      </div>

      ${tabBody}`;
  }

  function renderPortfolio(state, market, portfolio) {
    const segments = [
      { label: 'USD 现金', pct: portfolio.cashWeightPct, color: '#94a3b8' },
      ...portfolio.rows.map((r) => ({ label: r.symbol, pct: r.weightPct, color: r.color })),
    ];

    return `
      <div style="margin-bottom:16px;display:flex;justify-content:space-between;align-items:flex-start;gap:12px;flex-wrap:wrap;">
        <div>
          <div style="display:flex;align-items:center;gap:8px;">
            <h1 class="page-title">投资组合</h1>
            <span class="badge warn">${icon('flask', 12)}<span>示例数据</span></span>
          </div>
          <p class="page-sub">未接入券商账户时使用示例持仓账本，市值、盈亏、配置权重、HHI 指数与回撤实时按 Yahoo Finance 报价计算。</p>
        </div>
        <div style="display:flex;gap:8px;">
          <button class="btn" id="btn-open-import">${icon('plus', 14)}<span>导入 / 新增持仓</span></button>
          <button class="btn primary" data-run-scenario="portfolio-audit">${icon('bot', 14)}<span>复核组合敞口</span></button>
        </div>
      </div>

      <div class="card" style="margin-bottom:14px;">
        <div style="display:flex;justify-content:space-between;align-items:baseline;flex-wrap:wrap;gap:12px;">
          <div>
            <div class="tiny subtle">组合总资产 (Total Equity + Cash)</div>
            <div class="tnum" style="font-size:30px;font-weight:750;margin-top:2px;">${fmtUsd(portfolio.totalAssets)}</div>
          </div>
          <div style="text-align:right;">
            <div class="tnum ${chgClass(portfolio.totalPnl)}" style="font-size:15px;font-weight:700;">累计浮盈亏 ${fmtSignedUsd(portfolio.totalPnl)} (${fmtPct(portfolio.totalPnlPct)})</div>
            <div class="tiny muted tnum" style="margin-top:2px;">今日价格波动影响: <span class="${chgClass(portfolio.dailyPnl)}">${fmtSignedUsd(portfolio.dailyPnl)} (${fmtPct(portfolio.dailyPct)})</span></div>
          </div>
        </div>

        <div class="grid-4 tnum" style="margin-top:14px;padding-top:12px;border-top:1px solid var(--border);">
          <div><div class="tiny subtle">权益总市值</div><div style="font-weight:650;">${fmtUsd(portfolio.equityValue)}</div></div>
          <div><div class="tiny subtle">USD 现金缓冲</div><div style="font-weight:650;">${fmtUsd(portfolio.cashUsd)} (${portfolio.cashWeightPct.toFixed(1)}%)</div></div>
          <div><div class="tiny subtle">赫芬达尔指数 (HHI)</div><div style="font-weight:650;">${portfolio.hhi} <span class="tiny muted">(适度集中)</span></div></div>
          <div><div class="tiny subtle">AI 半导体簇敞口</div><div class="${portfolio.semiWeight > 35 ? 'warn-text' : ''}" style="font-weight:650;">${portfolio.semiWeight.toFixed(2)}%</div></div>
        </div>
      </div>

      <div class="card" style="margin-bottom:14px;">
        <div class="section-eyebrow" style="margin-bottom:10px;">资产配置占比 (Asset Allocation)</div>
        <div class="alloc-bar">
          ${segments.map((s) => `<div style="width:${Math.max(1, s.pct).toFixed(2)}%;background:${s.color};" title="${esc(s.label)}: ${s.pct.toFixed(1)}%"></div>`).join('')}
        </div>
        <div class="alloc-legend">
          ${segments
            .map(
              (s) => `
            <div class="small tnum" style="display:flex;align-items:center;gap:6px;">
              <span class="alloc-dot" style="background:${s.color};"></span>
              <span>${esc(s.label)}: <strong>${s.pct.toFixed(1)}%</strong></span>
            </div>`
            )
            .join('')}
        </div>
      </div>

      <div style="margin-bottom:8px;display:flex;justify-content:space-between;align-items:center;">
        <span class="section-eyebrow">持仓 (${portfolio.rows.length})</span>
        <span class="tiny subtle">每行可直接进入深度研究，或增减模拟持仓查看风险敞口变化</span>
      </div>

      <div style="margin-bottom:16px;">
        ${portfolio.rows
          .map(
            (r) => `
          <div class="pos-card">
            <div style="min-width:0;flex:1;">
              <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
                <span class="alloc-dot" style="background:${r.color};"></span>
                <strong style="font-size:14px;">${esc(r.symbol)}</strong>
                <span class="small muted">${esc(r.name)}</span>
                <span class="badge">${esc(r.cluster)}</span>
                ${r.rsi14 !== null && r.rsi14 < 30 ? '<span class="badge neg">RSI 超卖 ' + r.rsi14 + '</span>' : ''}
              </div>
              <div class="tiny muted tnum" style="margin-top:4px;">
                ${r.qty} 股 @ 成本 ${fmtUsd(r.avgCost)} · 权重 <strong>${r.weightPct.toFixed(2)}%</strong> · 60D回撤 ${fmtPct(r.drawdown60d)} · ${esc(r.note || '')}
              </div>
            </div>
            <div class="tnum" style="text-align:right;">
              <div style="font-weight:750;font-size:14.5px;">${fmtUsd(r.marketValue)}</div>
              <div class="tiny ${chgClass(r.pnl)}" style="font-weight:650;">
                ${fmtSignedUsd(r.pnl)} (${fmtPct(r.pnlPct)})
              </div>
              <div class="tiny subtle">现价 ${fmtUsd(r.price)} (${fmtPct(r.changePct)})</div>
            </div>
            <div style="display:flex;gap:6px;flex-shrink:0;">
              <button class="btn sm accent" data-research-sym="${esc(r.symbol)}">${icon('search', 13)}<span>研究</span></button>
              <button class="btn sm" data-open-sym="${esc(r.symbol)}">K 线</button>
              <button class="btn sm ghost" data-del-pos="${esc(r.id)}" title="移除该模拟持仓">${icon('close', 14)}</button>
            </div>
          </div>`
          )
          .join('')}
      </div>

      <div class="card">
        <div class="card-header">
          <span class="section-eyebrow">组合风险与集中度诊断面板</span>
          <span class="tiny subtle">自动同步最新持仓权重</span>
        </div>
        <div class="grid-3">
          <div style="padding:10px 12px;background:var(--surface-muted);border-radius:var(--radius-sm);">
            <div class="tiny subtle">前三大重仓合计 (Top-3)</div>
            <div class="tnum" style="font-size:18px;font-weight:700;margin-top:2px;">${portfolio.top3.toFixed(1)}%</div>
            <div class="tiny muted" style="margin-top:4px;">最大单一持仓为 ${esc(portfolio.rows[0]?.symbol || '—')} (${portfolio.top1.toFixed(1)}%)</div>
          </div>
          <div style="padding:10px 12px;background:var(--surface-muted);border-radius:var(--radius-sm);">
            <div class="tiny subtle">相关性簇暴露 (NVDA + AVGO)</div>
            <div class="tnum ${portfolio.semiWeight > 35 ? 'warn-text' : ''}" style="font-size:18px;font-weight:700;margin-top:2px;">${portfolio.semiWeight.toFixed(1)}%</div>
            <div class="tiny muted" style="margin-top:4px;">${portfolio.semiWeight > 35 ? '高于 35% 提醒阈值，内部呈现 ASIC 强 / GPU 弱分化' : '处于 35% 风控阈值以内'}</div>
          </div>
          <div style="padding:10px 12px;background:var(--surface-muted);border-radius:var(--radius-sm);">
            <div class="tiny subtle">最大拖累仓位</div>
            ${(() => {
              const worst = [...portfolio.rows].sort((a, b) => a.pnl - b.pnl)[0];
              return worst
                ? `<div class="tnum neg-text" style="font-size:18px;font-weight:700;margin-top:2px;">${esc(worst.symbol)} (${fmtSignedUsd(worst.pnl)})</div>
                   <div class="tiny muted" style="margin-top:4px;">浮亏幅度 ${fmtPct(worst.pnlPct)}，建议核对原投资逻辑假设</div>`
                : '<div class="small muted">—</div>';
            })()}
          </div>
        </div>
      </div>`;
  }

  function renderCompare(state, market) {
    const syms = state.compareSymbols;
    const allSyms = Object.keys(market.equities);
    const availableToAdd = allSyms.filter((s) => !syms.includes(s));

    const metricRows = [
      { label: '最新价格 (Yahoo)', fn: (q) => `<strong>${fmtUsd(q.price)}</strong>` },
      { label: '单日涨跌幅', fn: (q) => `<span class="${chgClass(q.changePct)}">${fmtPct(q.changePct)}</span>` },
      { label: '近 5 日回报', fn: (q) => `<span class="${chgClass(q.ret5d)}">${fmtPct(q.ret5d)}</span>` },
      { label: '1 个月回报', fn: (q) => `<strong class="${chgClass(q.ret1m)}">${fmtPct(q.ret1m)}</strong>` },
      { label: '3 个月回报', fn: (q) => `<span class="${chgClass(q.ret3m)}">${fmtPct(q.ret3m)}</span>` },
      { label: '1 年回报', fn: (q) => `<span class="${chgClass(q.ret1y)}">${fmtPct(q.ret1y)}</span>` },
      { label: '60 日高点回撤', fn: (q) => `<span class="neg-text">${fmtPct(q.drawdown60d)}</span>` },
      { label: 'RSI(14) 强弱', fn: (q) => (q.rsi14 < 30 ? `<strong class="neg-text">${q.rsi14} (超卖)</strong>` : String(q.rsi14)) },
      { label: 'SMA20 / SMA50', fn: (q) => `$${q.sma20} / $${q.sma50}` },
      { label: '20 日成交量比', fn: (q) => `${q.volumeRatio}x` },
      { label: '市值 (Market Cap)', fn: () => '<span class="subtle">—</span>' },
      { label: '市盈率 (TTM P/E)', fn: () => '<span class="subtle">—</span>' },
      { label: '毛利率 / ROE', fn: () => '<span class="subtle">—</span>' },
      { label: '分析师目标价均值', fn: () => '<span class="subtle">—</span>' },
    ];

    return `
      <div style="margin-bottom:14px;display:flex;justify-content:space-between;align-items:flex-start;gap:12px;flex-wrap:wrap;">
        <div>
          <span class="section-eyebrow">对比工作台 (2–4 只标的)</span>
          <h1 class="page-title">对比标的 (${syms.length})</h1>
          <p class="page-sub">当对比工作台处于焦点时，Agent 上下文自动携带当前对比组。未接入 Longbridge 的估值字段保持「—」。</p>
        </div>
        <button class="btn primary" data-run-scenario="compare-four">${icon('bot', 14)}<span>让 Agent 横评对比组</span></button>
      </div>

      <div class="card compact" style="margin-bottom:14px;display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap;">
        <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;">
          ${syms
            .map(
              (s) => `
            <span class="badge info" style="padding:5px 10px;font-size:12px;">
              <span>${esc(s)}</span>
              ${syms.length > 2 ? `<button class="btn xs ghost" data-rm-compare="${esc(s)}" style="padding:0 3px;margin-left:3px;">${icon('close', 12)}</button>` : ''}
            </span>`
            )
            .join('')}
        </div>
        ${
          syms.length < 4 && availableToAdd.length
            ? `<div style="display:flex;gap:6px;align-items:center;">
                 <select class="select sm" id="cmp-add-select">
                   ${availableToAdd.map((s) => `<option value="${esc(s)}">${esc(s)} · ${esc(market.equities[s].name)}</option>`).join('')}
                 </select>
                 <button class="btn sm accent" id="cmp-add-btn">${icon('plus', 12)}<span>添加对比</span></button>
               </div>`
            : '<span class="tiny muted">已达 4 只对比上限（可先移除再添加其他标的）</span>'
        }
      </div>

      ${renderCompareCurveSvg(syms, market)}

      <div class="card" style="padding:0;overflow:hidden;">
        <table class="data-table">
          <thead>
            <tr>
              <th>对齐维度</th>
              ${syms.map((s) => `<th class="right mono" style="color:var(--accent);">${esc(s)}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${metricRows
              .map(
                (row) => `
              <tr>
                <td>${esc(row.label)}</td>
                ${syms.map((s) => `<td class="right tnum">${market.equities[s] ? row.fn(market.equities[s]) : '—'}</td>`).join('')}
              </tr>`
              )
              .join('')}
          </tbody>
        </table>
      </div>`;
  }

  function renderResearch(state, market) {
    const sym = market.equities[state.activeSymbol] ? state.activeSymbol : 'NVDA.US';
    const eqItem = market.equities[sym];
    const repWrap = window.FOLIO_RESEARCH_REPORTS[sym];
    const rep = repWrap?.parsed;
    const strategies = ['综合策略', '技术与动量', '核心持仓复盘', '趋势与防守', '回调支撑诊断', '波动与风险复盘'];
    const stanceBadge = rep?.stance === '看多' ? 'pos' : rep?.stance === '看空' ? 'neg' : 'warn';

    return `
      <div style="margin-bottom:14px;display:flex;justify-content:space-between;align-items:flex-start;gap:12px;flex-wrap:wrap;">
        <div>
          <span class="section-eyebrow">Structured Synthesis · 结构化研究</span>
          <h1 class="page-title">深度研究 · ${esc(sym)}</h1>
          <p class="page-sub">${esc(sym)} 的结构化研究 — 事实来自只读能力层，分析由 Agent 合成。</p>
           <span class="badge warn">${icon('flask', 12)}<span>示例数据 · 预设分析</span></span>
        </div>
        <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;">
          <select class="select sm" id="res-sym-select">
            ${Object.keys(market.equities)
              .map((s) => `<option value="${esc(s)}" ${s === sym ? 'selected' : ''}>${esc(s)} · ${esc(market.equities[s].name)}</option>`)
              .join('')}
          </select>
          <select class="select sm" id="res-strat-select">
            ${strategies.map((st) => `<option value="${esc(st)}" ${st === state.researchStrategy ? 'selected' : ''}>策略: ${esc(st)}</option>`).join('')}
          </select>
          <button class="btn primary" id="btn-rerun-research">
            ${state.researchRunning ? icon('clock', 13) + '<span>正在核验 16 项能力...</span>' : icon('play', 12) + '<span>重新执行研究</span>'}
          </button>
        </div>
      </div>

      <div class="card compact" style="margin-bottom:14px;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;flex-wrap:wrap;gap:8px;">
          <span class="small"><strong>能力取数记录 (Capability Execution Record)</strong> · 部分运行 (3 / 16 成功)</span>
          <span class="tiny subtle mono">${esc(repWrap?.modelLabel)} · 耗时 ${repWrap?.elapsedMs}ms · Token ${repWrap?.usage?.total}</span>
        </div>
        <table class="data-table">
          <thead><tr><th>能力 ID</th><th>声明摘要</th><th>数据源与新鲜度</th><th class="right">状态</th></tr></thead>
          <tbody>
            <tr>
              <td class="mono">market.quote</td>
              <td>最新价 ${fmtUsd(eqItem.price)} (${fmtPct(eqItem.changePct)})，区间 $${eqItem.low}–$${eqItem.high}，量比 ${eqItem.volumeRatio}x</td>
              <td class="tiny muted">Yahoo Finance · ${esc(eqItem.marketTimeUtc)} (Delayed)</td>
              <td class="right"><span class="badge pos">${icon('check', 11)}<span>成功</span></span></td>
            </tr>
            <tr>
              <td class="mono">market.kline</td>
              <td>已审阅 65 根日线与 52 根周线：SMA20 $${eqItem.sma20} / SMA50 $${eqItem.sma50} / RSI(14) ${eqItem.rsi14}</td>
              <td class="tiny muted">Yahoo Finance · 1D & 1W OHLCV</td>
              <td class="right"><span class="badge pos">${icon('check', 11)}<span>成功</span></span></td>
            </tr>
            <tr>
              <td class="mono">company.profile</td>
              <td>${esc(eqItem.name)} · ${esc(eqItem.exchange)} (${esc(eqItem.currency)})</td>
              <td class="tiny muted">Yahoo Finance · Meta</td>
              <td class="right"><span class="badge pos">${icon('check', 11)}<span>成功</span></span></td>
            </tr>
            <tr>
              <td class="mono">fundamentals.* / depth / news (13 项)</td>
              <td class="muted">估值倍数、三大财报、盘口深度、逐笔资金流与新闻流未返回数据，报告置信度已做保守折减</td>
              <td class="tiny muted">Longbridge CLI 未安装</td>
              <td class="right"><span class="badge warn">不可用</span></td>
            </tr>
          </tbody>
        </table>
      </div>

      ${
        rep
          ? `<div class="card">
               <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px;flex-wrap:wrap;padding-bottom:12px;border-bottom:1px solid var(--border);">
                 <div>
                   <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
                     <span class="badge ${stanceBadge}" style="font-size:12.5px;padding:3px 10px;">立场: ${esc(rep.stance)}</span>
                     <span class="badge info">策略: ${esc(state.researchStrategy)}</span>
                     <span class="tiny muted">部分运行 — 不可用的数据已明确标注</span>
                   </div>
                   <h2 style="margin:0;font-size:17px;font-weight:700;">${esc(rep.headline)}</h2>
                 </div>
                 <div style="display:flex;align-items:center;gap:12px;">
                   <div style="text-align:right;">
                     <div class="tiny subtle">置信度</div>
                     <div class="tnum" style="font-size:22px;font-weight:750;">${rep.confidence}%</div>
                   </div>
                   <button class="btn sm" id="btn-export-md">导出 .md</button>
                   <button class="btn sm primary" id="btn-save-thesis"><span>保存为投资逻辑</span>${icon('arrowRight', 13)}</button>
                 </div>
               </div>

               <p style="font-size:13.5px;line-height:1.68;margin:14px 0 12px;">${esc(rep.summary)}</p>

               <div style="padding:10px 13px;border-radius:var(--radius-sm);background:var(--accent-soft);border:1px solid rgba(14, 165, 233,0.22);font-size:12.5px;display:flex;align-items:flex-start;gap:8px;">
                 <span style="color:var(--accent);margin-top:2px;">${icon('briefcase', 15)}</span>
                 <div><strong>组合敞口关联：</strong>${esc(rep.portfolioImpact)}</div>
               </div>

               <div class="quad-grid">
                 <div class="quad-box bull">
                   <strong class="pos-text small">看多与支撑依据 (Bull Case)</strong>
                   <ul>${(rep.bullPoints || []).map((p) => `<li>${esc(p)}</li>`).join('')}</ul>
                 </div>
                 <div class="quad-box bear">
                   <strong class="neg-text small">看空与压制依据 (Bear Case)</strong>
                   <ul>${(rep.bearPoints || []).map((p) => `<li>${esc(p)}</li>`).join('')}</ul>
                 </div>
                 <div class="quad-box cat">
                   <strong style="color:var(--accent);" class="small">催化剂与反转触发位 (Catalysts)</strong>
                   <ul>${(rep.catalysts || []).map((p) => `<li>${esc(p)}</li>`).join('')}</ul>
                 </div>
                 <div class="quad-box risk">
                   <strong class="warn-text small">风险与数据缺口边界 (Risks)</strong>
                   <ul>${(rep.risks || []).map((p) => `<li>${esc(p)}</li>`).join('')}</ul>
                 </div>
               </div>
             </div>`
          : '<div class="card muted">暂无该标的研究报告</div>'
      }`;
  }

  function renderThesis(state, market) {
    const active = state.theses.find((t) => t.id === state.activeThesisId) || state.theses[0];
    const eqItem = active ? market.equities[active.symbol] : null;

    return `
      <div style="margin-bottom:14px;display:flex;justify-content:space-between;align-items:flex-start;gap:12px;flex-wrap:wrap;">
        <div>
          <span class="section-eyebrow">Investment Thesis · 投资逻辑账本</span>
          <h1 class="page-title">投资逻辑 (${state.theses.length})</h1>
          <p class="page-sub">把研究报告保存为可追踪假设的投资逻辑，持续对照最新行情检验原假设是否仍然成立。</p>
           <span class="badge warn">${icon('flask', 12)}<span>示例数据</span></span>
        </div>
        <button class="btn primary" data-run-scenario="thesis-reeval">${icon('refresh', 13)}<span>重新评估逻辑</span></button>
      </div>

      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:14px;">
        ${state.theses
          .map(
            (t) => `
          <button class="btn ${t.id === active?.id ? 'accent' : ''}" data-open-thesis="${esc(t.id)}">
            ${t.needsReview ? icon('alert', 13) : icon('check', 13)}
            <span>${esc(t.symbol)} · ${t.needsReview ? '待复核' : '正常'}</span>
          </button>`
          )
          .join('')}
      </div>

      ${
        active
          ? `<div class="card" style="margin-bottom:14px;">
               <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px;flex-wrap:wrap;padding-bottom:12px;border-bottom:1px solid var(--border);">
                 <div>
                   <div style="display:flex;align-items:center;gap:8px;">
                     <strong style="font-size:18px;">${esc(active.symbol)}</strong>
                     <span class="badge ${active.needsReview ? 'warn' : 'pos'}">${esc(active.stance)}</span>
                     <span class="tiny subtle">置信度 ${active.confidence}% · 最近更新 ${esc(active.updatedAt)}</span>
                   </div>
                   <div style="font-weight:650;font-size:14.5px;margin-top:6px;">${esc(active.title)}</div>
                 </div>
                 <div style="display:flex;gap:6px;">
                   ${eqItem ? `<span class="badge info tnum">最新价 ${fmtUsd(eqItem.price)}</span>` : ''}
                   <button class="btn sm" id="btn-edit-thesis">编辑假设</button>
                   <button class="btn sm primary" id="btn-mark-reviewed">${active.needsReview ? '标记已复核' : '设为待复核'}</button>
                 </div>
               </div>

               <p class="small" style="line-height:1.65;margin:12px 0;">${esc(active.summary)}</p>

               <div style="margin-top:12px;">
                 <div class="section-eyebrow" style="margin-bottom:8px;">核心假设健康度核查 (Key Assumptions)</div>
                 ${(active.assumptions || [])
                   .map(
                     (a) => `
                   <div style="padding:9px 12px;border:1px solid var(--border);border-radius:var(--radius-sm);margin-bottom:6px;display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap;">
                     <div>
                       <div style="font-weight:600;font-size:12.8px;">${esc(a.text)}</div>
                       <div class="tiny muted" style="margin-top:2px;">行情核对: ${esc(a.note)}</div>
                     </div>
                     <span class="badge ${a.status === 'intact' ? 'pos' : a.status === 'broken' ? 'neg' : 'warn'}">
                       ${a.status === 'intact' ? icon('check', 11) + '<span>成立</span>' : a.status === 'broken' ? icon('close', 11) + '<span>已证伪</span>' : icon('clock', 11) + '<span>待验证</span>'}
                     </span>
                   </div>`
                   )
                   .join('')}
               </div>

               <div class="quad-grid">
                 <div class="quad-box bull"><strong class="pos-text small">看多论点</strong><ul>${(active.bullPoints || []).map((x) => `<li>${esc(x)}</li>`).join('')}</ul></div>
                 <div class="quad-box bear"><strong class="neg-text small">看空论点</strong><ul>${(active.bearPoints || []).map((x) => `<li>${esc(x)}</li>`).join('')}</ul></div>
                 <div class="quad-box cat"><strong style="color:var(--accent);" class="small">催化剂</strong><ul>${(active.catalysts || []).map((x) => `<li>${esc(x)}</li>`).join('')}</ul></div>
                 <div class="quad-box risk"><strong class="warn-text small">风险项</strong><ul>${(active.risks || []).map((x) => `<li>${esc(x)}</li>`).join('')}</ul></div>
               </div>
             </div>

             <div class="card">
               <div class="card-header">
                 <span class="section-eyebrow">重新评估历史 (${active.reevalHistory?.length || 0})</span>
               </div>
               ${
                 active.reevalHistory?.length
                   ? active.reevalHistory
                       .map(
                         (h) => `
                       <div>
                         <div style="display:flex;justify-content:space-between;margin-bottom:6px;" class="tiny muted mono">
                           <span>模型: ${esc(h.model)}</span>
                           <span>时间: ${esc(h.time)}</span>
                         </div>
                         <div style="padding:8px 11px;background:var(--warning-bg);border-radius:var(--radius-sm);font-weight:600;font-size:12.5px;margin-bottom:10px;">
                           ${esc(h.verdict)}
                         </div>
                         ${renderMarkdown(h.detail)}
                       </div>`
                       )
                       .join('')
                   : '<div class="small muted">暂无重新评估记录，点击右上角「重新评估逻辑」即可基于最新行情复核。</div>'
               }
             </div>`
          : ''
      }`;
  }

  function renderAlerts(state, market, portfolio) {
    const evaluated = evaluateAlerts(state, market, portfolio);
    const trigCount = evaluated.filter((a) => a.triggered).length;

    return `
      <div style="margin-bottom:14px;display:flex;justify-content:space-between;align-items:flex-start;gap:12px;flex-wrap:wrap;">
        <div>
          <span class="section-eyebrow">Deterministic Monitoring · 价格与敞口提醒</span>
          <h1 class="page-title">提醒规则 (${evaluated.length})</h1>
          <p class="page-sub">基于当前 Yahoo Finance 报价与组合权重自动判定触发状态，当前共 <strong>${trigCount}</strong> 条规则已触发。</p>
           <span class="badge warn">${icon('flask', 12)}<span>示例规则</span></span>
        </div>
        <button class="btn primary" id="btn-add-alert">${icon('plus', 14)}<span>新建价格提醒</span></button>
      </div>

      <div class="card" style="padding:0;overflow:hidden;">
        <table class="data-table">
          <thead>
            <tr>
              <th>监控对象</th>
              <th>提醒条件</th>
              <th class="right">阈值</th>
              <th class="right">当前实测值</th>
              <th>触发状态</th>
              <th class="right">启用开关</th>
            </tr>
          </thead>
          <tbody>
            ${evaluated
              .map(
                (al) => `
              <tr>
                <td><strong class="mono">${esc(al.symbol)}</strong><div class="tiny muted">${esc(al.note || '')}</div></td>
                <td>${esc(al.label)}</td>
                <td class="right tnum">${al.type.startsWith('price') ? fmtUsd(al.threshold) : al.type === 'cluster_weight' ? al.threshold + '%' : al.threshold}</td>
                <td class="right tnum"><strong>${esc(al.currentStr)}</strong></td>
                <td>
                  ${
                    !al.enabled
                      ? '<span class="badge">已暂停</span>'
                      : al.triggered
                        ? `<span class="badge neg">${icon('bell', 11)}<span>已触发提醒</span></span>`
                        : `<span class="badge pos">${icon('check', 11)}<span>监控中</span></span>`
                  }
                </td>
                <td class="right">
                  <button class="btn xs" data-toggle-alert="${esc(al.id)}">${al.enabled ? '暂停' : '启用'}</button>
                </td>
              </tr>`
              )
              .join('')}
          </tbody>
        </table>
      </div>`;
  }

  function renderEvents() {
    return `
      <div style="margin-bottom:14px;display:flex;justify-content:space-between;align-items:flex-start;gap:12px;">
        <div>
          <div style="display:flex;align-items:center;gap:8px;">
            <h1 class="page-title">事件与催化剂</h1>
            <span class="badge warn">${icon('flask', 12)}<span>示例数据</span></span>
          </div>
          <p class="page-sub">汇总财报电话会、宏观通胀数据与央行日历；每条事件均可带上下文跳转至工作台或深度研究。</p>
        </div>
      </div>

      <div style="display:flex;flex-direction:column;gap:10px;">
        ${window.FOLIO_DEMO_EVENTS.map(
          (ev) => `
          <div class="card">
            <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px;flex-wrap:wrap;">
              <div>
                <div style="display:flex;align-items:center;gap:8px;margin-bottom:5px;">
                  <span class="badge info mono">${esc(ev.date)}</span>
                  <span class="badge">${esc(ev.category)}</span>
                  <strong class="mono">${esc(ev.symbol)}</strong>
                  <span class="tiny warn-text">${esc(ev.impact)}</span>
                </div>
                <div style="font-weight:650;font-size:14.5px;">${esc(ev.title)}</div>
                <div class="small muted" style="margin-top:4px;">${esc(ev.desc)}</div>
              </div>
              <div style="display:flex;gap:6px;">
                ${ev.symbol !== 'SPX.US' ? `<button class="btn sm accent" data-research-sym="${esc(ev.symbol)}"><span>带上下文研究</span>${icon('arrowRight', 13)}</button>` : ''}
                <button class="btn sm" data-run-scenario="morning-brief">分析催化影响</button>
              </div>
            </div>
          </div>`
        ).join('')}
      </div>`;
  }

  function renderSkills(state) {
    const active = state.skills.find((s) => s.id === state.selectedSkillId) || state.skills[0];
    const badgeOf = (r, en) => {
      if (!en) return '<span class="badge">已禁用</span>';
      if (r === 'ready') return `<span class="badge pos">${icon('check', 11)}<span>完全就绪 (Yahoo)</span></span>`;
      if (r === 'partial') return '<span class="badge info">部分就绪 (Yahoo 覆盖核心)</span>';
      return `<span class="badge warn">${icon('alert', 11)}<span>缺少 Longbridge 能力</span></span>`;
    };

    return `
      <div style="margin-bottom:14px;">
        <span class="section-eyebrow">SkillHub · 按需加载技能索引</span>
        <h1 class="page-title">技能中心 (${state.skills.length})</h1>
        <p class="page-sub">SkillHub 仅向提示词注入轻量索引；Agent 按需读取 <code>SKILL.md</code>，严格校验必需/可选只读能力就绪度。</p>
      </div>

      <div class="grid-today-hero">
        <div class="card">
          <div style="display:flex;flex-direction:column;gap:6px;">
            ${state.skills
              .map(
                (s) => `
              <div class="watch-row ${s.id === active?.id ? 'active' : ''}" data-sel-skill="${esc(s.id)}" style="padding:9px 11px;cursor:pointer;">
                <div style="min-width:0;">
                  <div style="font-weight:650;font-size:13px;">${esc(s.name)}</div>
                  <div class="tiny muted mono">skills/${esc(s.id)}/SKILL.md</div>
                </div>
                <div style="display:flex;align-items:center;gap:8px;flex-shrink:0;">
                  ${badgeOf(s.readiness, s.enabled)}
                  <button class="btn xs" data-toggle-skill="${esc(s.id)}">${s.enabled ? '关闭' : '开启'}</button>
                </div>
              </div>`
              )
              .join('')}
          </div>
        </div>

        <div class="card">
          ${
            active
              ? `<div class="card-header">
                   <div>
                     <span class="section-eyebrow">技能契约详情</span>
                     <h3 style="margin:4px 0 0;font-size:16px;">${esc(active.name)}</h3>
                   </div>
                   ${badgeOf(active.readiness, active.enabled)}
                 </div>
                 <p class="small muted" style="line-height:1.6;">${esc(active.desc)}</p>
                 <div style="margin-top:12px;">
                   <div class="tiny subtle" style="margin-bottom:5px;">必需只读能力 (Required Capabilities)</div>
                   <div style="display:flex;gap:6px;flex-wrap:wrap;">
                     ${active.reqCaps.map((c) => `<span class="badge mono">${esc(c)}</span>`).join('')}
                   </div>
                 </div>
                 <div style="margin-top:12px;">
                   <div class="tiny subtle" style="margin-bottom:5px;">可选增强能力 (Optional Capabilities)</div>
                   <div style="display:flex;gap:6px;flex-wrap:wrap;">
                     ${active.optCaps.map((c) => `<span class="badge mono">${esc(c)}</span>`).join('')}
                   </div>
                 </div>
                 <div style="margin-top:14px;padding:10px 12px;background:var(--surface-muted);border-radius:var(--radius-sm);" class="tiny muted">
                   安全边界：<code>read_skill_resource</code> 已启用路径穿越与符号链接逃逸拦截，且技能无法注册任何写操作或下单工具。
                 </div>`
              : ''
          }
        </div>
      </div>`;
  }

  function renderEvaluation(state) {
    const ev = window.FOLIO_EVAL_SUMMARY;
    return `
      <div style="margin-bottom:14px;">
        <span class="section-eyebrow">Agent Engineering Loop · 基准评测中心</span>
        <h1 class="page-title">评测中心</h1>
        <p class="page-sub">Agent 工程循环的基准评测结果 — 检验任务完成度、工具选择、来源标注与部分失败诚实度。</p>
      </div>

      <div class="tabs-bar">
        <button class="tab-btn ${state.evalTab === 'overview' ? 'active' : ''}" data-evaltab="overview">概览 (${esc(ev.suite)})</button>
        <button class="tab-btn ${state.evalTab === 'models' ? 'active' : ''}" data-evaltab="models">模型对比</button>
      </div>

      ${
        state.evalTab === 'overview'
          ? `<div class="grid-4" style="margin-bottom:14px;">
               <div class="card compact"><div class="tiny subtle">冒烟评测集</div><div class="tnum" style="font-size:24px;font-weight:750;">${ev.smokeCases}</div><div class="tiny muted">全量基准含 ${ev.casesTotal} 用例</div></div>
               <div class="card compact"><div class="tiny subtle">门禁通过率</div><div class="tnum pos-text" style="font-size:24px;font-weight:750;">${esc(ev.passRate)}</div><div class="tiny muted">零幻觉编造违规</div></div>
               <div class="card compact"><div class="tiny subtle">综合质量得分</div><div class="tnum" style="font-size:24px;font-weight:750;">${esc(ev.overallScore)}</div><div class="tiny muted">含证据与时效合规</div></div>
               <div class="card compact"><div class="tiny subtle">主要失败模式</div><div class="tnum" style="font-size:24px;font-weight:750;">—</div><div class="tiny muted">工具缺口均如实声明</div></div>
             </div>
             <div class="card" style="padding:0;overflow:hidden;">
               <table class="data-table">
                 <thead><tr><th>评测分指标</th><th>评估器类型</th><th class="right">得分</th><th class="right">样本数</th></tr></thead>
                 <tbody>
                   ${ev.metrics.map((m) => `<tr><td><strong>${esc(m.name)}</strong></td><td class="muted">${esc(m.type)}</td><td class="right tnum"><strong>${esc(m.score)}</strong></td><td class="right tnum">${m.samples}</td></tr>`).join('')}
                 </tbody>
               </table>
             </div>`
          : `<div class="card" style="padding:0;overflow:hidden;">
               <div style="padding:12px 16px;border-bottom:1px solid var(--border);display:flex;justify-content:space-between;align-items:center;">
                 <strong>多模型基准用例运行对比 (Model Benchmark Runs)</strong>
                 <span class="badge info">耗时与 Token 指标</span>
               </div>
               <table class="data-table">
                 <thead><tr><th>评测场景</th><th>模型</th><th class="right">端到端耗时</th><th class="right">输入 / 输出 / 推理 Token</th><th>评估观察</th></tr></thead>
                 <tbody>
                   ${ev.modelRuns
                     .map(
                       (r) => `
                     <tr>
                       <td><strong>${esc(r.task)}</strong></td>
                       <td class="mono tiny">${esc(r.model)}</td>
                       <td class="right tnum">${(r.elapsedMs / 1000).toFixed(2)}s</td>
                       <td class="right tnum">${r.inputTok} / ${r.outputTok} / ${r.reasoningTok}</td>
                       <td class="tiny muted">${esc(r.note)}</td>
                     </tr>`
                     )
                     .join('')}
                 </tbody>
               </table>
             </div>`
      }`;
  }

  function renderProfile(state) {
    return `
      <div style="margin-bottom:14px;">
        <span class="section-eyebrow">Local-First & Read-Only · 工作区健康检查</span>
        <h1 class="page-title">个人与安全</h1>
        <p class="page-sub">明澈 默认将研究状态与会话保存在本地，且能力注册表中不包含任何下单或资金划转接口。</p>
      </div>

      <div class="grid-2">
        <div class="card">
          <div class="section-eyebrow" style="margin-bottom:10px;">安全与产品不变式核查</div>
          <div style="display:flex;flex-direction:column;gap:8px;" class="small">
            <div style="display:flex;justify-content:space-between;"><span>交易与下单能力数</span><span class="badge pos mono">0 (纯只读工作台)</span></div>
            <div style="display:flex;justify-content:space-between;"><span>美股行情与 K 线连接器</span><span class="badge info">Yahoo Finance · Delayed</span></div>
            <div style="display:flex;justify-content:space-between;"><span>本地演示状态持久化</span><span class="mono tiny">localStorage (${esc(state.yahooSourceMode)})</span></div>
            <div style="display:flex;justify-content:space-between;"><span>缺失数据回退策略</span><span class="mono tiny">严格显示「—」并声明缺口</span></div>
          </div>
        </div>
        <div class="card">
          <div class="section-eyebrow" style="margin-bottom:10px;">数据源状态摘要</div>
          <p class="small muted">最近一次 Yahoo Finance 数据同步时间：<code class="tnum">${esc(state.yahooLastSync)}</code></p>
          <div style="display:flex;gap:8px;margin-top:12px;">
            <button class="btn sm accent" data-action="refresh-yahoo">${icon('refresh', 13)}<span>刷新 Yahoo 行情</span></button>
            <button class="btn sm" data-nav="/settings"><span>前往连接与模型设置</span>${icon('arrowRight', 13)}</button>
          </div>
        </div>
      </div>`;
  }

  function renderSettings(state) {
    return `
      <div style="margin-bottom:14px;">
        <span class="section-eyebrow">Workspace Configuration · 设置与连接</span>
        <h1 class="page-title">设置</h1>
        <p class="page-sub">管理数据源连接器（ProviderRouter）、Agent 运行时配置与界面外观主题。</p>
      </div>

      <div class="grid-2">
        <div class="card">
          <div class="card-header">
            <span class="section-eyebrow">行情与券商数据连接 (Connections)</span>
          </div>
          <div style="display:flex;flex-direction:column;gap:10px;">
            <div style="padding:11px 13px;border:1px solid var(--border);border-radius:var(--radius-sm);">
              <div style="display:flex;justify-content:space-between;align-items:center;">
                <strong>Yahoo Finance (v8 Chart)</strong>
                <span class="badge pos">${icon('check', 11)}<span>已连接 · 主用美股源</span></span>
              </div>
              <div class="tiny muted" style="margin-top:4px;">免密钥提供美股延迟报价、日/周 K 线与公司简称。仅供个人研究使用。</div>
              <div style="margin-top:8px;display:flex;justify-content:space-between;align-items:center;">
                <span class="tiny subtle mono">状态: ${state.yahooSourceMode === 'live' ? '已刷新最新延迟行情' : '已加载延迟行情快照'}</span>
                <button class="btn xs accent" data-action="refresh-yahoo">${icon('refresh', 12)}<span>测试连接</span></button>
              </div>
            </div>

            <div style="padding:11px 13px;border:1px solid var(--border);border-radius:var(--radius-sm);opacity:0.85;">
              <div style="display:flex;justify-content:space-between;align-items:center;">
                <strong>Longbridge OpenAPI / CLI</strong>
                <span class="badge warn">未安装 CLI</span>
              </div>
              <div class="tiny muted" style="margin-top:4px;">提供港股/A股/美股实时深度、三大财务报表、新闻公告与券商持仓读取。未安装时依赖该能力的模块明确显示不可用原因。</div>
            </div>
          </div>
        </div>

        <div class="card">
          <div class="card-header">
            <span class="section-eyebrow">Agent 运行时与外观 (Runtime & Theme)</span>
          </div>
          <div style="display:flex;flex-direction:column;gap:12px;">
            <div style="padding:10px 12px;background:var(--surface-muted);border-radius:var(--radius-sm);">
              <div class="small" style="font-weight:600;margin-bottom:4px;">Pi Agent Runtime (只读沙箱)</div>
              <div class="tiny muted">当前选定模型：<code class="mono">${esc(state.copilotModel)}</code> · 推理等级：<code>${esc(state.copilotThinking)}</code>。凭证在桌面端通过系统 <code>safeStorage</code> 加密存储，界面不回显明文密钥。</div>
            </div>

            <div style="display:flex;justify-content:space-between;align-items:center;padding-top:6px;border-top:1px solid var(--border);">
              <span class="small" style="font-weight:600;">工作区外观主题</span>
              <div style="display:flex;gap:6px;">
                <button class="btn sm ${state.theme === 'light' ? 'primary' : ''}" data-set-theme="light">浅色 (Quiet Light)</button>
                <button class="btn sm ${state.theme === 'dark' ? 'primary' : ''}" data-set-theme="dark">深色 (Midnight)</button>
              </div>
            </div>
          </div>
        </div>
      </div>`;
  }

  function render(route, state, market) {
    const portfolio = computePortfolio(state, market);
    switch (route) {
      case '/today':
        return renderToday(state, market, portfolio);
      case '/discover':
        return renderDiscover(state, market);
      case '/workspace':
        return renderWorkspace(state, market, portfolio);
      case '/portfolio':
        return renderPortfolio(state, market, portfolio);
      case '/compare':
        return renderCompare(state, market);
      case '/research':
        return renderResearch(state, market);
      case '/thesis':
        return renderThesis(state, market);
      case '/alerts':
        return renderAlerts(state, market, portfolio);
      case '/events':
        return renderEvents();
      case '/skills':
        return renderSkills(state);
      case '/evaluation':
        return renderEvaluation(state);
      case '/profile':
        return renderProfile(state);
      case '/settings':
        return renderSettings(state);
      default:
        return renderToday(state, market, portfolio);
    }
  }

  window.FolioViews = {
    icon,
    esc,
    fmtUsd,
    fmtSignedUsd,
    fmtPct,
    chgClass,
    renderMarkdown,
    computePortfolio,
    evaluateAlerts,
    renderKlineSvg,
    render,
  };
})();
