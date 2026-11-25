'use strict';

(function () {
  const STORAGE_KEY = 'limpidwork_demo_state_v1';
  // Static site: market data is the built-in snapshot; no live requests are made from the browser.
  const SNAPSHOT_ONLY = true;
  const V = window.FolioViews;

  let market = JSON.parse(JSON.stringify(window.FOLIO_MARKET_SNAPSHOT));

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && Array.isArray(parsed.holdings)) return parsed;
      }
    } catch {}
    return window.createInitialFolioState();
  }

  let state = loadState();
  let sheetType = null;
  let watchSearch = '';
  let toastTimer = null;
  let syncingYahoo = false;

  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {}
  }

  function toast(msg) {
    document.querySelector('.toast')?.remove();
    const el = document.createElement('div');
    el.className = 'toast';
    el.textContent = msg;
    document.getElementById('mobile-app')?.appendChild(el);
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.remove(), 2300);
  }

  function getRoute() {
    const h = window.location.hash || '#/today';
    return (h.startsWith('#') ? h.slice(1) : h) || '/today';
  }

  function navigate(path) {
    sheetType = null;
    if (getRoute() !== path) {
      window.location.hash = '#' + path;
    } else {
      render();
    }
  }

  async function refreshYahooMobile() {
    if (SNAPSHOT_ONLY) {
      toast('静态演示站使用内置行情快照，不发起实时请求');
      return;
    }
    if (syncingYahoo) return;
    syncingYahoo = true;
    toast('正在连接 Yahoo Finance 同步行情...');
    render();
    let count = 0;
    try {
      await Promise.all(
        Object.keys(market.equities).map(async (folioSym) => {
          const item = market.equities[folioSym];
          const resp = await fetch(`./api/yahoo/chart?ticker=${encodeURIComponent(item.yahooTicker)}&range=3mo&interval=1d`, { cache: 'no-store' });
          if (!resp.ok) return;
          const json = await resp.json();
          const res = json?.data?.chart?.result?.[0];
          if (!res) return;
          const closes = (res.indicators?.quote?.[0]?.close || []).filter((x) => typeof x === 'number');
          if (closes.length >= 2) {
            const price = Number((res.meta?.regularMarketPrice ?? closes[closes.length - 1]).toFixed(2));
            const prevClose = Number(closes[closes.length - 2].toFixed(2));
            item.price = price;
            item.prevClose = prevClose;
            item.change = Number((price - prevClose).toFixed(2));
            item.changePct = Number(((item.change / prevClose) * 100).toFixed(2));
            count++;
          }
        })
      );
    } catch {}
    syncingYahoo = false;
    if (count > 0) {
      state.yahooSourceMode = 'live';
      state.yahooLastSync = new Date().toISOString();
      saveState();
      render();
      toast(`已同步 ${count} 只美股最新延迟行情`);
    } else {
      render();
      toast('已加载内置 Yahoo Finance 行情快照');
    }
  }

  function runScenarioMobile(scenarioId) {
    const sc = window.FOLIO_COPILOT_SCENARIOS.find((s) => s.id === scenarioId);
    if (!sc) return;
    state.activeScenarioId = sc.id;
    if (sc.symbol) state.activeSymbol = sc.symbol;
    if (!sc.modelOutputs[state.copilotModel]) state.copilotModel = sc.defaultModel;
    const now = new Date();
    const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    state.copilotTurns.push({
      id: 'turn-' + Date.now(),
      scenarioId: sc.id,
      prompt: sc.prompt,
      time,
      modelKey: state.copilotModel,
    });
    saveState();
    navigate('/copilot');
    setTimeout(() => {
      const box = document.getElementById('m-agent-messages');
      if (box) box.scrollTop = box.scrollHeight;
    }, 30);
  }

  function sendMobileCustomPrompt(text) {
    const promptText = (text || '').trim();
    if (!promptText) return;
    const now = new Date();
    const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const portfolio = V.computePortfolio(state, market);
    const activeEq = market.equities[state.activeSymbol];
    const pos = portfolio.rows.find((r) => r.symbol === state.activeSymbol);

    const fallbackMd = activeEq
      ? `### 移动端只读核验 (${state.activeSymbol})\n\n` +
        `- **Yahoo 延迟报价**：**$${activeEq.price.toFixed(2)}**（单日 **${V.fmtPct(activeEq.changePct)}**，1M **${V.fmtPct(activeEq.ret1m)}**，RSI **${activeEq.rsi14}**）。\n` +
        `- **组合持仓联动**：${pos ? `持有 **${pos.qty} 股** @ $${pos.avgCost.toFixed(2)}，权重 **${pos.weightPct.toFixed(1)}%**，浮盈亏 **${V.fmtSignedUsd(pos.pnl)}**。` : '当前演示组合未持有该标的。'}\n` +
        `- 可点击上方场景胶囊查看完整结构化分析。`
      : `### 数据源边界 (${state.activeSymbol})\n\nYahoo Finance 仅覆盖美股延迟行情，无法获取 \`${state.activeSymbol}\` 实时报价；明澈 不虚构缺失数据。`;

    state.copilotTurns.push({
      id: 'turn-' + Date.now(),
      custom: true,
      prompt: promptText,
      time,
      modelLabel: 'LocalRuntimeAdapter',
      elapsedMs: 12,
      content: fallbackMd,
      tools: [{ name: 'get_quote', target: state.activeSymbol, status: activeEq ? 'ok' : 'error', ms: 10, source: 'Yahoo Snapshot' }],
    });
    saveState();
    render();
    setTimeout(() => {
      const box = document.getElementById('m-agent-messages');
      if (box) box.scrollTop = box.scrollHeight;
    }, 30);
  }

  function renderTodayMobile(portfolio) {
    const indices = Object.values(market.indices || {});
    const staleTheses = state.theses.filter((t) => t.needsReview);
    const qFilter = watchSearch.trim().toLowerCase();
    const watchRows = state.watchlist.filter((sym) => {
      if (!qFilter) return true;
      const item = market.equities[sym];
      return (sym + ' ' + (item?.name || '') + ' ' + (item?.sectorTag || '')).toLowerCase().includes(qFilter);
    });
    const briefObj = window.FOLIO_COPILOT_SCENARIOS.find((s) => s.id === 'morning-brief')?.modelOutputs['glm-5.3-flash'];

    return `
      <div class="card">
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <span class="tiny subtle">总资产</span>
          <span class="badge warn">${V.icon('flask', 11)}<span>示例数据</span></span>
        </div>
        <div class="tnum" style="font-size:26px;font-weight:750;letter-spacing:-0.02em;margin-top:4px;">${V.fmtUsd(portfolio.totalAssets)}</div>
        <div style="display:flex;gap:8px;align-items:center;margin-top:4px;flex-wrap:wrap;">
          <span class="badge ${portfolio.totalPnl >= 0 ? 'pos' : 'neg'} tnum">总浮盈 ${V.fmtSignedUsd(portfolio.totalPnl)} (${V.fmtPct(portfolio.totalPnlPct)})</span>
          <span class="tiny tnum ${V.chgClass(portfolio.dailyPnl)}">今日 ${V.fmtSignedUsd(portfolio.dailyPnl)}</span>
        </div>

        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:12px;padding-top:10px;border-top:1px solid var(--border);">
          <div><div class="tiny subtle">现金缓冲</div><div class="tnum small" style="font-weight:700;">${portfolio.cashWeightPct.toFixed(1)}%</div></div>
          <div><div class="tiny subtle">HHI 指数</div><div class="tnum small" style="font-weight:700;">${portfolio.hhi}</div></div>
          <div><div class="tiny subtle">AI 半导体簇</div><div class="tnum small ${portfolio.semiWeight > 35 ? 'warn-text' : ''}" style="font-weight:700;">${portfolio.semiWeight.toFixed(1)}%</div></div>
        </div>
      </div>

      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:7px;">
        <button class="card compact" style="text-align:left;cursor:pointer;" data-m-nav="/research">
          <div style="color:var(--accent);">${V.icon('search', 16)}</div>
          <div style="font-weight:700;font-size:12px;margin-top:4px;">深度研究</div>
          <div class="tiny subtle mono">${V.esc(state.activeSymbol)}</div>
        </button>
        <button class="card compact" style="text-align:left;cursor:pointer;" data-m-run-sc="portfolio-audit">
          <div style="color:var(--accent);">${V.icon('briefcase', 16)}</div>
          <div style="font-weight:700;font-size:12px;margin-top:4px;">复核组合</div>
          <div class="tiny subtle">集中度与回撤</div>
        </button>
        <button class="card compact" style="text-align:left;cursor:pointer;" data-m-nav="/compare">
          <div style="color:var(--accent);">${V.icon('gitCompare', 16)}</div>
          <div style="font-weight:700;font-size:12px;margin-top:4px;">对比个股</div>
          <div class="tiny subtle">AVGO vs NVDA</div>
        </button>
      </div>

      ${
        staleTheses.length > 0
          ? `<div class="card compact" style="background:var(--warning-bg);border-color:rgba(180,83,9,0.25);display:flex;justify-content:space-between;align-items:center;gap:8px;">
               <div>
                 <strong class="small warn-text" style="display:inline-flex;align-items:center;gap:4px;">${V.icon('alert', 13)}<span>${staleTheses.length} 条投资逻辑待复核 (${V.esc(staleTheses[0].symbol)})</span></strong>
                 <div class="tiny muted">最新行情已偏离原定 SMA50 与 RSI 假设</div>
               </div>
               <button class="btn xs primary" data-m-nav="/thesis">去复核</button>
             </div>`
          : ''
      }

      <div class="card compact">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
          <strong class="small">市场脉搏 (Yahoo Delayed)</strong>
          <span class="tiny subtle">四大核心指数</span>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:7px;">
          ${indices
            .map(
              (ix) => `
            <div style="padding:8px 9px;border-radius:10px;background:var(--surface-muted);">
              <div style="display:flex;justify-content:space-between;align-items:center;">
                <span class="tiny" style="font-weight:650;">${V.esc(ix.name)}</span>
                <span class="tiny tnum ${V.chgClass(ix.changePct)}">${V.fmtPct(ix.changePct)}</span>
              </div>
              <div class="tnum" style="font-weight:750;font-size:14px;margin-top:3px;">${ix.price.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
            </div>`
            )
            .join('')}
        </div>
      </div>

      <details class="card compact">
        <summary style="cursor:pointer;font-weight:700;font-size:12.8px;display:flex;justify-content:space-between;align-items:center;list-style:none;">
          <span style="display:inline-flex;align-items:center;gap:6px;">${V.icon('newspaper', 14)}<span>每日研究简报</span></span>
          <span class="badge info">展开</span>
        </summary>
        <div style="margin-top:8px;padding-top:8px;border-top:1px solid var(--border);">
          ${V.renderMarkdown(briefObj?.content || '')}
        </div>
      </details>

      <div class="card compact">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
          <strong class="small">自选观察池 (${watchRows.length})</strong>
          <span class="tiny subtle">点选查看 K 线</span>
        </div>
        <div class="search-wrap" style="margin-bottom:8px;">
          ${V.icon('search', 14)}
          <input class="input" id="m-watch-search" placeholder="搜索代码或赛道，如 NVDA、ASIC、0700..." value="${V.esc(watchSearch)}" />
        </div>
        ${watchRows
          .map((sym) => {
            const q = market.equities[sym];
            return `
              <div data-m-open-sym="${V.esc(sym)}" style="display:flex;justify-content:space-between;align-items:center;padding:8px 2px;border-bottom:1px solid var(--border);cursor:pointer;">
                <div style="min-width:0;">
                  <div style="display:flex;align-items:center;gap:6px;">
                    <strong class="mono">${V.esc(sym)}</strong>
                    ${q && q.rsi14 < 30 ? `<span class="badge neg">RSI ${q.rsi14}</span>` : ''}
                  </div>
                  <div class="tiny muted" style="max-width:195px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${V.esc(q ? `${q.name} · ${q.sectorTag}` : '腾讯控股 · 需 Longbridge CLI')}</div>
                </div>
                <div class="tnum" style="text-align:right;">
                  <div style="font-weight:700;">${q ? V.fmtUsd(q.price) : '—'}</div>
                  <div class="tiny ${q ? V.chgClass(q.changePct) : 'subtle'}">${q ? V.fmtPct(q.changePct) : '不可用'}</div>
                </div>
              </div>`;
          })
          .join('')}
      </div>`;
  }

  function renderWorkspaceMobile(portfolio) {
    const sym = state.activeSymbol || 'NVDA.US';
    const eq = market.equities[sym];
    const strip = `
      <div class="pills-row">
        ${state.watchlist
          .map((s) => `<button class="pill mono ${s === sym ? 'active' : ''}" data-m-pick-sym="${V.esc(s)}">${V.esc(s)}</button>`).join('')}
      </div>`;

    if (!eq) {
      return `
        ${strip}
        <div class="card">
          <div style="display:flex;justify-content:space-between;align-items:center;">
            <strong style="font-size:16px;">${V.esc(sym)}</strong>
            <span class="badge warn">UNSUPPORTED_CAPABILITY</span>
          </div>
          <p class="small muted" style="margin:8px 0 12px;">明澈 的 Yahoo Finance 适配器仅提供美股（<code>.US</code>）延迟行情，不支持港股 <code>0700.HK</code>。在未安装 Longbridge CLI 时严格保持 <code>—</code>，不虚构价格。</p>
          <div style="display:flex;gap:8px;">
            <button class="btn sm accent" data-m-run-sc="honest-data-gap">查看缺口说明</button>
            <button class="btn sm" data-m-pick-sym="NVDA.US">切回 NVDA.US</button>
          </div>
        </div>`;
    }

    const pos = portfolio.rows.find((r) => r.symbol === sym);
    const subTab = ['chart', 'overview', 'financials'].includes(state.workspaceTab) ? state.workspaceTab : 'chart';

    return `
      ${strip}
      <div class="card compact">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px;">
          <div style="min-width:0;">
            <div style="font-weight:750;font-size:15.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${V.esc(eq.name)}</div>
            <div class="tiny subtle mono">${V.esc(eq.symbol)} · ${V.esc(eq.exchange)} · Delayed</div>
          </div>
          <div class="tnum" style="text-align:right;flex-shrink:0;">
            <div style="font-size:21px;font-weight:750;line-height:1.1;">${V.fmtUsd(eq.price)}</div>
            <div class="tiny ${V.chgClass(eq.changePct)}" style="font-weight:700;margin-top:2px;">
              ${eq.change >= 0 ? '+' : ''}${eq.change.toFixed(2)} (${V.fmtPct(eq.changePct)})
            </div>
          </div>
        </div>
        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin-top:10px;padding-top:8px;border-top:1px solid var(--border);" class="tiny tnum">
          <div><span class="subtle">最高</span><div>$${eq.high}</div></div>
          <div><span class="subtle">最低</span><div>$${eq.low}</div></div>
          <div><span class="subtle">量比</span><div>${eq.volumeRatio}x</div></div>
          <div><span class="subtle">RSI14</span><div class="${eq.rsi14 < 30 ? 'neg-text' : ''}">${eq.rsi14}</div></div>
        </div>
      </div>

      <div class="seg-bar">
        <button class="seg-btn ${subTab === 'chart' ? 'active' : ''}" data-m-wstab="chart">K 线图表</button>
        <button class="seg-btn ${subTab === 'overview' ? 'active' : ''}" data-m-wstab="overview">持仓与回报</button>
        <button class="seg-btn ${subTab === 'financials' ? 'active' : ''}" data-m-wstab="financials">财报边界</button>
      </div>

      ${
        subTab === 'chart'
          ? `<div class="kline-wrap">
               <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
                 <div style="display:flex;gap:5px;">
                   <button class="btn xs" data-m-kblock="5m">5m</button>
                   <button class="btn xs" data-m-kblock="1h">1h</button>
                   <button class="btn xs ${state.klinePeriod === '1d' ? 'accent' : ''}" data-m-kp="1d">1D 日线</button>
                   <button class="btn xs ${state.klinePeriod === '1w' ? 'accent' : ''}" data-m-kp="1w">1W 周线</button>
                 </div>
                 <label class="tiny muted" style="display:inline-flex;align-items:center;gap:3px;">
                   <input type="checkbox" id="m-ema-chk" ${state.showEma ? 'checked' : ''}/> EMA
                 </label>
               </div>
               <div id="m-kline-box">
                 ${V.renderKlineSvg(eq, state.klinePeriod, state.showEma, state.klineHoverIdx)}
               </div>
               <div class="tiny subtle" style="text-align:center;margin-top:4px;">点按或滑动 K 线柱可逐根查看 OHLCV 与均线数值</div>
             </div>`
          : subTab === 'overview'
            ? `<div class="card compact">
                 <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
                   <strong class="small">组合持仓上下文</strong>
                   <span class="badge">${pos ? '已持有' : '未持有'}</span>
                 </div>
                 ${
                   pos
                     ? `<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;" class="small tnum">
                          <div><span class="tiny subtle">股数 / 均价</span><div style="font-weight:700;">${pos.qty} @ $${pos.avgCost}</div></div>
                          <div><span class="tiny subtle">持仓市值 / 权重</span><div style="font-weight:700;">${V.fmtUsd(pos.marketValue)} (${pos.weightPct.toFixed(1)}%)</div></div>
                          <div><span class="tiny subtle">浮动盈亏</span><div class="${V.chgClass(pos.pnl)}" style="font-weight:700;">${V.fmtSignedUsd(pos.pnl)} (${V.fmtPct(pos.pnlPct)})</div></div>
                          <div><span class="tiny subtle">60日回撤</span><div class="neg-text" style="font-weight:700;">${V.fmtPct(eq.drawdown60d)}</div></div>
                        </div>`
                     : `<div class="small muted">当前演示组合未持有 ${V.esc(sym)}，可在「组合」页新增模拟仓位。</div>`
                 }
               </div>
               <div class="card compact">
                 <strong class="small">阶段真实回报 (Yahoo)</strong>
                 <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin-top:8px;" class="small tnum">
                   <div><span class="tiny subtle">5D</span><div class="${V.chgClass(eq.ret5d)}" style="font-weight:700;">${V.fmtPct(eq.ret5d)}</div></div>
                   <div><span class="tiny subtle">1M</span><div class="${V.chgClass(eq.ret1m)}" style="font-weight:700;">${V.fmtPct(eq.ret1m)}</div></div>
                   <div><span class="tiny subtle">3M</span><div class="${V.chgClass(eq.ret3m)}" style="font-weight:700;">${V.fmtPct(eq.ret3m)}</div></div>
                   <div><span class="tiny subtle">1Y</span><div class="${V.chgClass(eq.ret1y)}" style="font-weight:700;">${V.fmtPct(eq.ret1y)}</div></div>
                 </div>
               </div>`
            : `<div class="card compact">
                 <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
                   <strong class="small">财务与估值倍数</strong>
                   <span class="badge warn">需 Longbridge CLI</span>
                 </div>
                 <p class="tiny muted">未安装 Longbridge CLI 时，PE / PB / 自由现金流保持 <code>—</code>，不回退硬编码过期财报。</p>
               </div>`
      }

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
        <button class="btn accent" data-m-go-res="${V.esc(sym)}">${V.icon('search', 13)}<span>深度研究报告</span></button>
        <button class="btn" data-m-ask-sym="${V.esc(sym)}">${V.icon('bot', 14)}<span>询问 Agent</span></button>
      </div>`;
  }

  function renderPortfolioMobile(portfolio) {
    const segs = [
      { label: '现金', pct: portfolio.cashWeightPct, color: '#94a3b8' },
      ...portfolio.rows.map((r) => ({ label: r.symbol, pct: r.weightPct, color: r.color })),
    ];

    return `
      <div class="card">
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <span class="tiny subtle">组合总估值 (示例持仓)</span>
          <button class="btn xs accent" id="m-open-import">${V.icon('plus', 12)}<span>新增持仓</span></button>
        </div>
        <div class="tnum" style="font-size:25px;font-weight:750;margin-top:3px;">${V.fmtUsd(portfolio.totalAssets)}</div>
        <div class="tiny tnum ${V.chgClass(portfolio.totalPnl)}" style="font-weight:650;margin-top:2px;">
          累计 ${V.fmtSignedUsd(portfolio.totalPnl)} (${V.fmtPct(portfolio.totalPnlPct)}) · 今日 ${V.fmtSignedUsd(portfolio.dailyPnl)}
        </div>

        <div class="alloc-bar" style="margin-top:11px;">
          ${segs.map((s) => `<div style="width:${Math.max(1.5, s.pct)}%;background:${s.color};"></div>`).join('')}
        </div>
        <div style="display:flex;flex-wrap:wrap;gap:6px 10px;margin-top:8px;" class="tiny tnum">
          ${segs.map((s) => `<span style="display:inline-flex;align-items:center;gap:4px;"><span style="width:7px;height:7px;border-radius:50%;background:${s.color};"></span>${V.esc(s.label)} ${s.pct.toFixed(1)}%</span>`).join('')}
        </div>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
        <div class="card compact">
          <div class="tiny subtle">HHI 集中度 / Top-3</div>
          <div class="tnum" style="font-weight:750;font-size:15px;margin-top:2px;">${portfolio.hhi} · ${portfolio.top3.toFixed(1)}%</div>
        </div>
        <div class="card compact">
          <div class="tiny subtle">AI 半导体簇暴露</div>
          <div class="tnum ${portfolio.semiWeight > 35 ? 'warn-text' : ''}" style="font-weight:750;font-size:15px;margin-top:2px;">${portfolio.semiWeight.toFixed(1)}%</div>
        </div>
      </div>

      <button class="btn primary" style="width:100%;" data-m-run-sc="portfolio-audit">${V.icon('bot', 14)}<span>复核组合集中度与回撤风险</span></button>

      ${portfolio.rows
        .map(
          (r) => `
        <div class="card compact">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;">
            <div>
              <div style="display:flex;align-items:center;gap:6px;">
                <span style="width:8px;height:8px;border-radius:50%;background:${r.color};display:inline-block;"></span>
                <strong class="mono" style="font-size:14px;">${V.esc(r.symbol)}</strong>
                <span class="badge">${r.weightPct.toFixed(1)}%</span>
              </div>
              <div class="tiny muted tnum" style="margin-top:3px;">${r.qty} 股 @ 成本 $${r.avgCost.toFixed(2)} · 现价 $${r.price.toFixed(2)}</div>
            </div>
            <div class="tnum" style="text-align:right;">
              <div style="font-weight:750;font-size:14px;">${V.fmtUsd(r.marketValue)}</div>
              <div class="tiny ${V.chgClass(r.pnl)}" style="font-weight:650;">${V.fmtSignedUsd(r.pnl)} (${V.fmtPct(r.pnlPct)})</div>
            </div>
          </div>
          <div style="display:flex;justify-content:space-between;align-items:center;margin-top:8px;padding-top:7px;border-top:1px solid var(--border);">
            <span class="tiny muted">${V.esc(r.cluster)}</span>
            <div style="display:flex;gap:6px;">
              <button class="btn xs" data-m-open-sym="${V.esc(r.symbol)}">K 线</button>
              <button class="btn xs accent" data-m-go-res="${V.esc(r.symbol)}">研究</button>
              <button class="btn xs ghost" data-m-del-pos="${V.esc(r.id)}">移除</button>
            </div>
          </div>
        </div>`
        )
        .join('')}`;
  }

  function renderCopilotMobile(portfolio) {
    const pos = portfolio.rows.find((r) => r.symbol === state.activeSymbol);
    const messagesHtml = state.copilotTurns
      .map((turn) => {
        if (turn.custom) {
          return `
            <div class="m-user-bubble">${V.esc(turn.prompt)}</div>
            <div class="m-assistant-card">
              <div style="display:flex;justify-content:space-between;margin-bottom:6px;" class="tiny subtle mono">
                <span style="display:inline-flex;align-items:center;gap:4px;">${V.icon('bot', 12)}<span>${V.esc(turn.modelLabel)}</span></span>
                <span>${turn.elapsedMs}ms</span>
              </div>
              ${V.renderMarkdown(turn.content)}
            </div>`;
        }
        const sc = window.FOLIO_COPILOT_SCENARIOS.find((s) => s.id === turn.scenarioId) || window.FOLIO_COPILOT_SCENARIOS[0];
        const out = sc.modelOutputs[state.copilotModel] || sc.modelOutputs[sc.defaultModel] || Object.values(sc.modelOutputs)[0];
        const multiModels = Object.keys(sc.modelOutputs || {});
        return `
          <div class="m-user-bubble">${V.esc(turn.prompt)}</div>
          <div class="m-assistant-card">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;" class="tiny subtle mono">
              <span style="display:inline-flex;align-items:center;gap:4px;">${V.icon('bot', 12)}<span>${V.esc(out?.modelLabel)}</span></span>
              <span>${out ? `${(out.elapsedMs / 1000).toFixed(1)}s · ${out.usage?.total || 0} tok` : ''}</span>
            </div>
            ${
              multiModels.length > 1
                ? `<div class="pills-row" style="margin-bottom:7px;">
                     ${multiModels
                       .map(
                         (mId) => `<button class="btn xs ${state.copilotModel === mId ? 'accent' : ''}" data-m-switch-mdl="${V.esc(mId)}">${V.esc(window.FOLIO_MODELS.find((m) => m.id === mId)?.label || mId)}</button>`
                       )
                       .join('')}
                   </div>`
                : ''
            }
            ${V.renderMarkdown(out?.content || '')}
            ${
              out?.reasoning
                ? `<details class="fold-box">
                     <summary><span style="display:inline-flex;align-items:center;gap:4px;">${V.icon('brain', 12)}<span>查看思考过程</span></span><span>展开</span></summary>
                     <div class="fold-content mono">${V.esc(out.reasoning)}</div>
                   </details>`
                : ''
            }
            <details class="fold-box">
              <summary><span style="display:inline-flex;align-items:center;gap:4px;">${V.icon('wrench', 12)}<span>工具活动 (${sc.tools.length} 次只读调用)</span></span><span>核验</span></summary>
              <div class="fold-content">
                ${sc.tools
                  .map(
                    (t) => `<div style="display:flex;justify-content:space-between;padding:2px 0;"><span class="mono">${V.esc(t.name)}</span><span class="${t.status === 'ok' ? 'pos-text' : 'neg-text'}" style="display:inline-flex;align-items:center;gap:3px;">${t.status === 'ok' ? V.icon('check', 10) : V.icon('close', 10)}<span>${V.esc(t.source)}</span></span></div>`
                  )
                  .join('')}
              </div>
            </details>
          </div>`;
      })
      .join('');

    return `
      <div class="agent-thread-shell">
        <div class="agent-ctx-strip">
          <div style="display:flex;gap:5px;align-items:center;overflow-x:auto;">
            <span class="badge info mono">${V.esc(state.activeSymbol)}</span>
            ${pos ? `<span class="badge tnum">持仓 ${pos.qty}股 (${pos.weightPct.toFixed(1)}%)</span>` : ''}
          </div>
          <select class="select" id="m-mdl-sel" style="width:auto;padding:3px 7px;font-size:11.5px;">
            ${window.FOLIO_MODELS.map((m) => `<option value="${V.esc(m.id)}" ${state.copilotModel === m.id ? 'selected' : ''}>${V.esc(m.label)}</option>`).join('')}
          </select>
        </div>

        <div class="agent-scenarios-strip">
          <div class="pills-row">
            ${window.FOLIO_COPILOT_SCENARIOS.map(
              (sc) => `<button class="pill ${state.activeScenarioId === sc.id ? 'active' : ''}" data-m-run-sc="${V.esc(sc.id)}">${V.esc(sc.chip)}</button>`
            ).join('')}
          </div>
        </div>

        <div class="agent-messages" id="m-agent-messages">
          ${messagesHtml}
        </div>

        <div class="agent-composer">
          <div style="display:flex;gap:7px;align-items:center;">
            <input class="input" id="m-agent-input" placeholder="围绕当前标的或组合提问..." />
            <button class="btn primary" id="m-agent-send" style="padding:8px 12px;">${V.icon('send', 15)}</button>
          </div>
        </div>
      </div>`;
  }

  function renderSecondaryMobile(route, portfolio) {
    if (route === '/research') {
      const sym = market.equities[state.activeSymbol] ? state.activeSymbol : 'NVDA.US';
      const repWrap = window.FOLIO_RESEARCH_REPORTS[sym];
      const rep = repWrap?.parsed;
      const stanceCls = rep?.stance === '看多' ? 'pos' : rep?.stance === '看空' ? 'neg' : 'warn';
      return `
        <div class="pills-row">
          ${Object.keys(market.equities)
            .map((s) => `<button class="pill mono ${s === sym ? 'active' : ''}" data-m-res-sym="${V.esc(s)}">${V.esc(s)}</button>`).join('')}
        </div>
        <div class="card">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
            <div style="display:flex;gap:6px;align-items:center;">
              <span class="badge ${stanceCls}">立场: ${V.esc(rep?.stance)}</span>
              <span class="badge">部分运行 3/16</span>
            </div>
            <span class="tnum" style="font-weight:750;font-size:16px;">置信度 ${rep?.confidence}%</span>
          </div>
          <div style="font-weight:750;font-size:15px;margin-bottom:6px;">${V.esc(rep?.headline)}</div>
          <div class="tiny subtle mono" style="margin-bottom:8px;">${V.esc(repWrap?.modelLabel)} · ${(repWrap?.elapsedMs / 1000).toFixed(1)}s</div>
          <p class="small" style="line-height:1.6;">${V.esc(rep?.summary)}</p>
          <div style="padding:8px 10px;border-radius:9px;background:var(--accent-soft);font-size:12px;margin-top:8px;display:flex;gap:6px;align-items:flex-start;">
            <span style="color:var(--accent);margin-top:2px;">${V.icon('briefcase', 13)}</span>
            <div><strong>组合敞口关联：</strong>${V.esc(rep?.portfolioImpact)}</div>
          </div>
          <div class="quad-box bull"><strong class="pos-text tiny">看多与支撑依据</strong><ul>${(rep?.bullPoints || []).map((p) => `<li>${V.esc(p)}</li>`).join('')}</ul></div>
          <div class="quad-box bear"><strong class="neg-text tiny">看空与压制依据</strong><ul>${(rep?.bearPoints || []).map((p) => `<li>${V.esc(p)}</li>`).join('')}</ul></div>
          <div class="quad-box cat"><strong style="color:var(--accent);" class="tiny">关键催化与反转位</strong><ul>${(rep?.catalysts || []).map((p) => `<li>${V.esc(p)}</li>`).join('')}</ul></div>
          <div class="quad-box risk"><strong class="warn-text tiny">风险与数据缺口</strong><ul>${(rep?.risks || []).map((p) => `<li>${V.esc(p)}</li>`).join('')}</ul></div>
          <button class="btn primary" style="width:100%;margin-top:12px;" id="m-save-thesis"><span>保存为可追踪投资逻辑</span>${V.icon('arrowRight', 13)}</button>
        </div>`;
    }

    if (route === '/thesis') {
      const active = state.theses.find((t) => t.id === state.activeThesisId) || state.theses[0];
      return `
        <div class="pills-row">
          ${state.theses
            .map((t) => `<button class="pill ${t.id === active?.id ? 'active' : ''}" data-m-th-id="${V.esc(t.id)}">${t.needsReview ? V.icon('alert', 12) : V.icon('check', 12)}<span>${V.esc(t.symbol)}</span></button>`).join('')}
        </div>
        ${
          active
            ? `<div class="card">
                 <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
                   <strong class="mono" style="font-size:16px;">${V.esc(active.symbol)}</strong>
                   <span class="badge ${active.needsReview ? 'warn' : 'pos'}">${V.esc(active.stance)}</span>
                 </div>
                 <div style="font-weight:700;margin-bottom:8px;">${V.esc(active.title)}</div>
                 <div class="tiny subtle" style="margin-bottom:6px;">核心假设核对</div>
                 ${(active.assumptions || [])
                   .map(
                     (a) => `
                   <div style="padding:8px 10px;border:1px solid var(--border);border-radius:9px;margin-bottom:6px;">
                     <div style="display:flex;justify-content:space-between;gap:6px;">
                       <strong class="small">${V.esc(a.text)}</strong>
                       <span class="badge ${a.status === 'intact' ? 'pos' : a.status === 'broken' ? 'neg' : 'warn'}">${a.status === 'intact' ? '成立' : a.status === 'broken' ? '已证伪' : '待验证'}</span>
                     </div>
                     <div class="tiny muted" style="margin-top:3px;">${V.esc(a.note)}</div>
                   </div>`
                   )
                   .join('')}
                 <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:10px;">
                   <button class="btn sm" id="m-toggle-th-rev">${active.needsReview ? '标记已复核' : '设为待复核'}</button>
                   <button class="btn sm accent" data-m-run-sc="thesis-reeval">重新评估</button>
                 </div>
               </div>`
            : ''
        }`;
    }

    if (route === '/compare') {
      const syms = state.compareSymbols;
      return `
        <div class="card compact">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
            <strong class="small">多股横评 (${syms.length} 只)</strong>
            <button class="btn xs accent" data-m-run-sc="compare-four">Agent 横评</button>
          </div>
          <div style="overflow-x:auto;">
            <table style="width:100%;border-collapse:collapse;font-size:11.5px;" class="tnum">
              <thead>
                <tr style="border-bottom:1px solid var(--border);">
                  <th style="text-align:left;padding:6px 4px;">指标</th>
                  ${syms.map((s) => `<th style="text-align:right;padding:6px 4px;color:var(--accent);">${V.esc(s.replace('.US', ''))}</th>`).join('')}
                </tr>
              </thead>
              <tbody>
                <tr><td style="padding:6px 4px;">现价</td>${syms.map((s) => `<td style="text-align:right;padding:6px 4px;font-weight:700;">$${market.equities[s]?.price}</td>`).join('')}</tr>
                <tr><td style="padding:6px 4px;">单日</td>${syms.map((s) => `<td style="text-align:right;padding:6px 4px;" class="${V.chgClass(market.equities[s]?.changePct)}">${V.fmtPct(market.equities[s]?.changePct)}</td>`).join('')}</tr>
                <tr><td style="padding:6px 4px;">1个月</td>${syms.map((s) => `<td style="text-align:right;padding:6px 4px;font-weight:700;" class="${V.chgClass(market.equities[s]?.ret1m)}">${V.fmtPct(market.equities[s]?.ret1m)}</td>`).join('')}</tr>
                <tr><td style="padding:6px 4px;">3个月</td>${syms.map((s) => `<td style="text-align:right;padding:6px 4px;" class="${V.chgClass(market.equities[s]?.ret3m)}">${V.fmtPct(market.equities[s]?.ret3m)}</td>`).join('')}</tr>
                <tr><td style="padding:6px 4px;">RSI14</td>${syms.map((s) => `<td style="text-align:right;padding:6px 4px;">${market.equities[s]?.rsi14}</td>`).join('')}</tr>
                <tr><td style="padding:6px 4px;">PE估值</td>${syms.map(() => `<td style="text-align:right;padding:6px 4px;" class="subtle">—</td>`).join('')}</tr>
              </tbody>
            </table>
          </div>
        </div>`;
    }

    if (route === '/discover') {
      const tasks = window.FOLIO_DISCOVER_TASKS;
      const activeTask = tasks.find((t) => t.id === state.discoverTaskId) || tasks[0];
      const eqList = Object.values(market.equities);
      let hits = [];
      if (activeTask.requires === 'yahoo') {
        if (activeTask.id === 'oversold-rsi') hits = eqList.filter((q) => q.rsi14 < 35 && q.volumeRatio >= 1.0);
        else if (activeTask.id === 'rel-strength-1m') hits = eqList.filter((q) => q.ret1m > 1.5 && q.price > q.sma20);
        else if (activeTask.id === 'vol-expansion') hits = eqList.filter((q) => Math.abs(q.changePct) >= 2.5);
        else if (activeTask.id === 'deep-pullback-60d') hits = eqList.filter((q) => q.drawdown60d <= -15.0);
        else if (activeTask.id === 'near-52w-high') hits = eqList.filter((q) => q.price >= q.fiftyTwoWeekHigh * 0.92);
      }
      return `
        <div class="pills-row">
          ${tasks.map((t) => `<button class="pill ${t.id === activeTask.id ? 'active' : ''}" data-m-disc="${V.esc(t.id)}">${V.esc(t.name.slice(0, 10))}..</button>`).join('')}
        </div>
        <div class="card compact">
          <strong class="small">${V.esc(activeTask.name)}</strong>
          <div class="tiny muted mono" style="margin-top:3px;">${V.esc(activeTask.rule)}</div>
        </div>
        ${
          activeTask.requires !== 'yahoo'
            ? `<div class="card compact muted small">需安装 Longbridge CLI 获取估值/财报源，当前如实返回 0 候选。</div>`
            : hits
                .map(
                  (q) => `
              <div class="card compact" style="display:flex;justify-content:space-between;align-items:center;">
                <div>
                  <strong class="mono">${V.esc(q.symbol)}</strong>
                  <div class="tiny muted tnum">RSI ${q.rsi14} · 1M ${V.fmtPct(q.ret1m)}</div>
                </div>
                <div style="display:flex;gap:6px;align-items:center;">
                  <strong class="tnum">${V.fmtUsd(q.price)}</strong>
                  <button class="btn xs accent" data-m-go-res="${V.esc(q.symbol)}">研究</button>
                </div>
              </div>`
                )
                .join('') || '<div class="card compact muted small">当前观察池命中 0 只标的。</div>'
        }`;
    }

    if (route === '/alerts') {
      const evaluated = V.evaluateAlerts(state, market, portfolio);
      return `
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <span class="small muted">基于 Yahoo 报价自动判定</span>
          <button class="btn xs primary" id="m-open-alert-sheet">${V.icon('plus', 11)}<span>新建提醒</span></button>
        </div>
        ${evaluated
          .map(
            (al) => `
          <div class="card compact" style="display:flex;justify-content:space-between;align-items:center;gap:8px;">
            <div>
              <div style="display:flex;align-items:center;gap:6px;">
                <strong class="mono">${V.esc(al.symbol)}</strong>
                ${!al.enabled ? '<span class="badge">已暂停</span>' : al.triggered ? `<span class="badge neg">${V.icon('bell', 10)}<span>已触发</span></span>` : `<span class="badge pos">${V.icon('check', 10)}<span>监控中</span></span>`}
              </div>
              <div class="small" style="margin-top:2px;">${V.esc(al.label)}</div>
              <div class="tiny muted tnum">当前实测: ${V.esc(al.currentStr)}</div>
            </div>
            <button class="btn xs" data-m-tog-al="${V.esc(al.id)}">${al.enabled ? '暂停' : '启用'}</button>
          </div>`
          )
          .join('')}`;
    }

    if (route === '/events') {
      return window.FOLIO_DEMO_EVENTS.map(
        (ev) => `
        <div class="card compact">
          <div style="display:flex;justify-content:space-between;margin-bottom:4px;">
            <span class="badge info mono">${V.esc(ev.date)}</span>
            <span class="badge">${V.icon('flask', 10)}<span>示例数据</span></span>
          </div>
          <div style="font-weight:700;">${V.esc(ev.symbol)} · ${V.esc(ev.title)}</div>
          <div class="small muted" style="margin-top:4px;">${V.esc(ev.desc)}</div>
        </div>`
      ).join('');
    }

    if (route === '/evaluation') {
      const ev = window.FOLIO_EVAL_SUMMARY;
      return `
        <div class="card compact">
          <strong class="small">基准评测与模型运行对比 (${ev.modelRuns.length} 条记录)</strong>
          <div class="tiny muted" style="margin-top:2px;">套件: ${V.esc(ev.suite)} · 通过率 ${V.esc(ev.passRate)}</div>
        </div>
        ${ev.modelRuns
          .map(
            (r) => `
          <div class="card compact">
            <div style="display:flex;justify-content:space-between;">
              <strong class="small">${V.esc(r.task)}</strong>
              <span class="badge info tnum">${(r.elapsedMs / 1000).toFixed(1)}s</span>
            </div>
            <div class="tiny mono muted" style="margin-top:3px;">${V.esc(r.model)} · Tok ${r.inputTok}/${r.outputTok}/${r.reasoningTok}</div>
            <div class="tiny muted" style="margin-top:4px;">${V.esc(r.note)}</div>
          </div>`
          )
          .join('')}`;
    }

    return `
      <div class="card">
        <strong class="small">数据源与工作区设置</strong>
        <div style="display:flex;flex-direction:column;gap:10px;margin-top:10px;">
          <div style="display:flex;justify-content:space-between;align-items:center;">
            <div><div class="small" style="font-weight:600;">Yahoo Finance (Delayed)</div><div class="tiny muted">美股报价与日/周 K 线已连接</div></div>
            <button class="btn xs accent" id="m-sync-yahoo-btn">${V.icon('refresh', 11)}<span>测试连接</span></button>
          </div>
          <div style="display:flex;justify-content:space-between;align-items:center;padding-top:8px;border-top:1px solid var(--border);">
            <div><div class="small" style="font-weight:600;">Longbridge CLI</div><div class="tiny muted">未安装 · 财报与港股保持不可用标记</div></div>
            <span class="badge warn">未安装</span>
          </div>
        </div>
      </div>`;
  }

  function renderSheet() {
    if (!sheetType) return '';

    if (sheetType === 'import') {
      const symOpts = Object.keys(market.equities)
        .map((s) => `<option value="${V.esc(s)}">${V.esc(s)} · 现价 $${market.equities[s].price}</option>`)
        .join('');
      return `
        <div class="sheet-backdrop" id="sheet-backdrop">
          <div class="sheet">
            <div class="sheet-handle"></div>
            <div style="display:flex;justify-content:space-between;align-items:center;">
              <strong>新增 / 导入模拟持仓</strong>
              <button class="btn sm ghost" id="close-sheet">${V.icon('close', 16)}</button>
            </div>
            <div><label class="tiny muted">选择美股标的</label><select class="select" id="ms-imp-sym" style="margin-top:4px;">${symOpts}</select></div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
              <div><label class="tiny muted">股数</label><input class="input tnum" id="ms-imp-qty" type="number" value="30" style="margin-top:4px;"/></div>
              <div><label class="tiny muted">成本均价 ($)</label><input class="input tnum" id="ms-imp-cost" type="number" value="245.00" step="0.1" style="margin-top:4px;"/></div>
            </div>
            <button class="btn primary" id="ms-imp-save">保存并重算组合权重</button>
          </div>
        </div>`;
    }

    if (sheetType === 'alert') {
      const symOpts = Object.keys(market.equities)
        .map((s) => `<option value="${V.esc(s)}">${V.esc(s)} ($${market.equities[s].price})</option>`)
        .join('');
      return `
        <div class="sheet-backdrop" id="sheet-backdrop">
          <div class="sheet">
            <div class="sheet-handle"></div>
            <div style="display:flex;justify-content:space-between;align-items:center;">
              <strong>新建价格提醒规则</strong>
              <button class="btn sm ghost" id="close-sheet">${V.icon('close', 16)}</button>
            </div>
            <div><label class="tiny muted">监控标的</label><select class="select" id="ms-al-sym" style="margin-top:4px;">${symOpts}</select></div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
              <div>
                <label class="tiny muted">条件</label>
                <select class="select" id="ms-al-type" style="margin-top:4px;">
                  <option value="price_below">价格跌破</option>
                  <option value="price_above">价格突破</option>
                </select>
              </div>
              <div><label class="tiny muted">目标价 ($)</label><input class="input tnum" id="ms-al-val" type="number" value="155" style="margin-top:4px;"/></div>
            </div>
            <button class="btn primary" id="ms-al-save">添加监控</button>
          </div>
        </div>`;
    }

    return `
      <div class="sheet-backdrop" id="sheet-backdrop">
        <div class="sheet">
          <div class="sheet-handle"></div>
          <div style="display:flex;justify-content:space-between;align-items:center;">
            <strong>全部投研模块</strong>
            <button class="btn sm ghost" id="close-sheet">${V.icon('close', 16)}</button>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
            <button class="btn" style="justify-content:flex-start;" data-m-nav="/research">${V.icon('book', 14)}<span>深度研究报告</span></button>
            <button class="btn" style="justify-content:flex-start;" data-m-nav="/thesis">${V.icon('fileText', 14)}<span>投资逻辑复核</span></button>
            <button class="btn" style="justify-content:flex-start;" data-m-nav="/compare">${V.icon('gitCompare', 14)}<span>多标的横评</span></button>
            <button class="btn" style="justify-content:flex-start;" data-m-nav="/discover">${V.icon('compass', 14)}<span>机会发现筛选</span></button>
            <button class="btn" style="justify-content:flex-start;" data-m-nav="/alerts">${V.icon('bell', 14)}<span>价格与权重提醒</span></button>
            <button class="btn" style="justify-content:flex-start;" data-m-nav="/events">${V.icon('calendar', 14)}<span>催化事件日历</span></button>
            <button class="btn" style="justify-content:flex-start;" data-m-nav="/evaluation">${V.icon('flask', 14)}<span>基准评测对比</span></button>
            <button class="btn" style="justify-content:flex-start;" data-m-nav="/settings">${V.icon('settings', 14)}<span>连接与系统设置</span></button>
            <button class="btn" style="justify-content:flex-start;" id="ms-open-arch" type="button">${V.icon('fileText', 14)}<span>架构与项目介绍</span></button>
          </div>
          <div style="display:flex;gap:8px;padding-top:4px;border-top:1px solid var(--border);">
            <button class="btn" style="flex:1;" id="ms-theme">${V.icon('sun', 14)}<span>${state.theme === 'dark' ? '浅色模式' : '深色模式'}</span></button>
            <button class="btn" style="flex:1;" id="ms-reset">${V.icon('reset', 14)}<span>重置演示</span></button>
          </div>
          <a class="btn primary" href="index.html#${V.esc(getRoute() === '/copilot' ? '/today' : getRoute())}">${V.icon('monitor', 14)}<span>切换至三栏桌面工作台</span></a>
        </div>
      </div>`;
  }

  function render() {
    document.documentElement.setAttribute('data-theme', state.theme === 'dark' ? 'dark' : 'light');
    const route = getRoute();
    const portfolio = V.computePortfolio(state, market);
    const trigAlerts = V.evaluateAlerts(state, market, portfolio).filter((a) => a.triggered).length;
    const staleTheses = state.theses.filter((t) => t.needsReview).length;
    const moreBadge = trigAlerts + staleTheses;

    const titles = {
      '/today': '明澈 · 今日',
      '/workspace': '行情与 K 线',
      '/portfolio': '投资组合',
      '/copilot': 'Limpid 副驾驶',
      '/research': '深度研究',
      '/thesis': '投资逻辑',
      '/compare': '多标的对比',
      '/discover': '机会发现',
      '/alerts': '提醒规则',
      '/events': '事件与催化剂',
      '/evaluation': '评测中心',
      '/settings': '设置与连接',
    };

    const isPrimaryTab = ['/today', '/workspace', '/portfolio', '/copilot'].includes(route);
    const isFlush = route === '/copilot';

    let bodyHtml = '';
    if (route === '/today') bodyHtml = renderTodayMobile(portfolio);
    else if (route === '/workspace') bodyHtml = renderWorkspaceMobile(portfolio);
    else if (route === '/portfolio') bodyHtml = renderPortfolioMobile(portfolio);
    else if (route === '/copilot') bodyHtml = renderCopilotMobile(portfolio);
    else bodyHtml = renderSecondaryMobile(route, portfolio);

    document.getElementById('mobile-app').innerHTML = `
      <header class="m-header">
        <div class="m-header-left">
          ${
            !isPrimaryTab
              ? `<button class="btn sm ghost" id="m-back-today" style="padding:4px 6px;">${V.icon('back', 18)}</button>`
              : `<span class="m-logo"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 3.5 20.5 18.5H3.5Z" stroke="#0369a1" stroke-width="2" stroke-linejoin="round"/><circle cx="12" cy="14.2" r="2.4" fill="#0ea5e9"/></svg></span>`
          }
          <span class="m-title">${V.esc(titles[route] || '明澈 Mobile')}</span>
        </div>
        <div class="m-header-right">
          <button class="btn sm" id="m-open-arch" type="button" title="查看设计架构">${V.icon('fileText', 13)}<span>架构</span></button>
          <button class="btn sm" id="m-hdr-yahoo" title="同步 Yahoo 行情">${V.icon('refresh', 13)}<span>${syncingYahoo ? '同步..' : 'Yahoo'}</span></button>
          <a class="btn sm" href="index.html#${V.esc(route === '/copilot' ? '/today' : route)}">${V.icon('monitor', 13)}<span>桌面版</span></a>
        </div>
      </header>

      <div class="m-demobar">
        <div style="display:flex;align-items:center;gap:5px;min-width:0;">
          ${V.icon('shield', 12)}
          <span style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">演示模式 · Yahoo Finance 延迟行情 · 示例持仓 · 只读工作台</span>
        </div>
        <span class="mono tiny">${V.esc(state.activeSymbol)}</span>
      </div>

      <main class="m-body ${isFlush ? 'flush' : ''}">${bodyHtml}</main>

      <nav class="m-tabbar">
        <button class="m-tab ${route === '/today' ? 'active' : ''}" data-m-nav="/today">
          <span class="m-tab-icon">${V.icon('grid', 18)}</span><span>今日</span>
        </button>
        <button class="m-tab ${route === '/workspace' ? 'active' : ''}" data-m-nav="/workspace">
          <span class="m-tab-icon">${V.icon('chart', 18)}</span><span>行情</span>
        </button>
        <button class="m-tab ${route === '/portfolio' ? 'active' : ''}" data-m-nav="/portfolio">
          <span class="m-tab-icon">${V.icon('briefcase', 18)}</span><span>组合</span>
        </button>
        <button class="m-tab ${route === '/copilot' ? 'active' : ''}" data-m-nav="/copilot">
          <span class="m-tab-icon">${V.icon('bot', 18)}</span><span>Agent</span>
        </button>
        <button class="m-tab ${!isPrimaryTab ? 'active' : ''}" id="m-more-btn">
          <span class="m-tab-icon">${V.icon('menu', 18)}</span><span>更多</span>
          ${moreBadge > 0 ? `<span class="m-tab-badge">${moreBadge}</span>` : ''}
        </button>
      </nav>
      ${renderSheet()}
    `;

    bindEvents();
  }

  function bindEvents() {
    document.querySelectorAll('[data-m-nav]').forEach((el) => {
      el.onclick = () => navigate(el.dataset.mNav);
    });
    document.getElementById('m-back-today')?.addEventListener('click', () => navigate('/today'));
    document.getElementById('m-open-arch')?.addEventListener('click', () => {
      window.openProjectArchModal && window.openProjectArchModal('arch');
    });
    document.getElementById('ms-open-arch')?.addEventListener('click', () => {
      sheetType = null;
      render();
      window.openProjectArchModal && window.openProjectArchModal('arch');
    });
    document.getElementById('m-hdr-yahoo')?.addEventListener('click', refreshYahooMobile);
    document.getElementById('m-sync-yahoo-btn')?.addEventListener('click', refreshYahooMobile);
    document.getElementById('m-more-btn')?.addEventListener('click', () => {
      sheetType = sheetType === 'more' ? null : 'more';
      render();
    });
    document.getElementById('close-sheet')?.addEventListener('click', () => {
      sheetType = null;
      render();
    });
    document.getElementById('sheet-backdrop')?.addEventListener('click', (e) => {
      if (e.target.id === 'sheet-backdrop') {
        sheetType = null;
        render();
      }
    });
    document.getElementById('ms-theme')?.addEventListener('click', () => {
      state.theme = state.theme === 'dark' ? 'light' : 'dark';
      saveState();
      render();
    });
    document.getElementById('ms-reset')?.addEventListener('click', () => {
      market = JSON.parse(JSON.stringify(window.FOLIO_MARKET_SNAPSHOT));
      state = window.createInitialFolioState();
      sheetType = null;
      saveState();
      render();
      toast('已恢复初始演示数据');
    });

    document.getElementById('m-watch-search')?.addEventListener('input', (e) => {
      watchSearch = e.target.value;
      render();
      const inp = document.getElementById('m-watch-search');
      if (inp) {
        inp.focus();
        inp.setSelectionRange(inp.value.length, inp.value.length);
      }
    });

    document.querySelectorAll('[data-m-open-sym]').forEach((el) => {
      el.onclick = () => {
        state.activeSymbol = el.dataset.mOpenSym;
        state.workspaceTab = 'chart';
        state.klineHoverIdx = null;
        saveState();
        navigate('/workspace');
      };
    });

    document.querySelectorAll('[data-m-pick-sym]').forEach((el) => {
      el.onclick = () => {
        state.activeSymbol = el.dataset.mPickSym;
        state.klineHoverIdx = null;
        saveState();
        render();
      };
    });

    document.querySelectorAll('[data-m-wstab]').forEach((el) => {
      el.onclick = () => {
        state.workspaceTab = el.dataset.mWstab;
        saveState();
        render();
      };
    });

    document.querySelectorAll('[data-m-kp]').forEach((el) => {
      el.onclick = () => {
        state.klinePeriod = el.dataset.mKp;
        state.klineHoverIdx = null;
        saveState();
        render();
      };
    });

    document.querySelectorAll('[data-m-kblock]').forEach((el) => {
      el.onclick = () => toast(`Yahoo Finance 仅提供 1D/1W 延迟线，${el.dataset.mKblock} 需连接 Longbridge`);
    });

    document.getElementById('m-ema-chk')?.addEventListener('change', (e) => {
      state.showEma = e.target.checked;
      saveState();
      render();
    });

    const kBox = document.getElementById('m-kline-box');
    if (kBox && market.equities[state.activeSymbol]) {
      const eq = market.equities[state.activeSymbol];
      const bars = state.klinePeriod === '1w' ? eq.weekly : eq.daily;
      const scrubAtClientX = (clientX) => {
        const svgEl = kBox.querySelector('svg');
        if (!svgEl || !bars?.length) return;
        const rect = svgEl.getBoundingClientRect();
        const ratio = Math.max(0, Math.min(1, (clientX - rect.left - 8) / Math.max(1, rect.width - 56)));
        const idx = Math.min(bars.length - 1, Math.max(0, Math.floor(ratio * bars.length)));
        if (state.klineHoverIdx !== idx) {
          state.klineHoverIdx = idx;
          kBox.innerHTML = V.renderKlineSvg(eq, state.klinePeriod, state.showEma, idx);
        }
      };
      kBox.addEventListener('pointerdown', (e) => scrubAtClientX(e.clientX));
      kBox.addEventListener('pointermove', (e) => {
        if (e.buttons > 0 || e.pointerType === 'mouse') scrubAtClientX(e.clientX);
      });
    }

    document.querySelectorAll('[data-m-go-res]').forEach((el) => {
      el.onclick = () => {
        state.activeSymbol = el.dataset.mGoRes;
        saveState();
        navigate('/research');
      };
    });

    document.querySelectorAll('[data-m-ask-sym]').forEach((el) => {
      el.onclick = () => {
        const sym = el.dataset.mAskSym;
        state.activeSymbol = sym;
        if (sym === 'NVDA.US') runScenarioMobile('nvda-position-kline');
        else {
          saveState();
          navigate('/copilot');
          sendMobileCustomPrompt(`请结合最新行情简要分析 ${sym} 当前的价格趋势、RSI 与我的组合敞口关系。`);
        }
      };
    });

    document.querySelectorAll('[data-m-run-sc]').forEach((el) => {
      el.onclick = () => runScenarioMobile(el.dataset.mRunSc);
    });
    document.getElementById('m-mdl-sel')?.addEventListener('change', (e) => {
      state.copilotModel = e.target.value;
      saveState();
      render();
    });
    document.querySelectorAll('[data-m-switch-mdl]').forEach((el) => {
      el.onclick = () => {
        state.copilotModel = el.dataset.mSwitchMdl;
        saveState();
        render();
      };
    });
    document.getElementById('m-agent-send')?.addEventListener('click', () => {
      sendMobileCustomPrompt(document.getElementById('m-agent-input')?.value);
    });
    document.getElementById('m-agent-input')?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        sendMobileCustomPrompt(e.target.value);
      }
    });

    document.getElementById('m-open-import')?.addEventListener('click', () => {
      sheetType = 'import';
      render();
    });
    document.getElementById('ms-imp-save')?.addEventListener('click', () => {
      const sym = document.getElementById('ms-imp-sym').value;
      const qty = Number(document.getElementById('ms-imp-qty').value);
      const avgCost = Number(document.getElementById('ms-imp-cost').value);
      if (!qty || qty <= 0 || !avgCost || avgCost <= 0) {
        toast('请输入有效的股数与均价');
        return;
      }
      const ex = state.holdings.find((h) => h.symbol === sym);
      if (ex) {
        const tot = ex.qty * ex.avgCost + qty * avgCost;
        ex.qty += qty;
        ex.avgCost = Number((tot / ex.qty).toFixed(2));
      } else {
        state.holdings.push({ id: 'pos-' + Date.now(), symbol: sym, qty, avgCost, cluster: '移动端新增仓位', note: '移动端手动导入' });
      }
      sheetType = null;
      saveState();
      render();
      toast(`已保存 ${sym} 持仓并重算组合风险`);
    });
    document.querySelectorAll('[data-m-del-pos]').forEach((el) => {
      el.onclick = () => {
        if (state.holdings.length <= 1) {
          toast('至少保留 1 只演示持仓');
          return;
        }
        state.holdings = state.holdings.filter((h) => h.id !== el.dataset.mDelPos);
        saveState();
        render();
        toast('已移除持仓');
      };
    });

    document.querySelectorAll('[data-m-res-sym]').forEach((el) => {
      el.onclick = () => {
        state.activeSymbol = el.dataset.mResSym;
        saveState();
        render();
      };
    });
    document.getElementById('m-save-thesis')?.addEventListener('click', () => {
      const sym = market.equities[state.activeSymbol] ? state.activeSymbol : 'NVDA.US';
      const rep = window.FOLIO_RESEARCH_REPORTS[sym]?.parsed;
      if (!rep) return;
      const id = 'thesis-m-' + Date.now();
      state.theses.unshift({
        id,
        symbol: sym,
        title: rep.headline,
        stance: rep.stance,
        confidence: rep.confidence,
        updatedAt: '2026-11-19',
        needsReview: false,
        summary: rep.summary,
        assumptions: [{ text: rep.catalysts?.[0] || '跟踪关键均线收复', status: 'pending', note: '研究保存待跟踪' }],
        bullPoints: rep.bullPoints,
        bearPoints: rep.bearPoints,
        catalysts: rep.catalysts,
        risks: rep.risks,
        reevalHistory: [],
      });
      state.activeThesisId = id;
      saveState();
      navigate('/thesis');
      toast(`已保存 ${sym} 投资逻辑`);
    });
    document.querySelectorAll('[data-m-th-id]').forEach((el) => {
      el.onclick = () => {
        state.activeThesisId = el.dataset.mThId;
        saveState();
        render();
      };
    });
    document.getElementById('m-toggle-th-rev')?.addEventListener('click', () => {
      const th = state.theses.find((t) => t.id === state.activeThesisId);
      if (th) {
        th.needsReview = !th.needsReview;
        saveState();
        render();
      }
    });
    document.querySelectorAll('[data-m-disc]').forEach((el) => {
      el.onclick = () => {
        state.discoverTaskId = el.dataset.mDisc;
        saveState();
        render();
      };
    });
    document.getElementById('m-open-alert-sheet')?.addEventListener('click', () => {
      sheetType = 'alert';
      render();
    });
    document.getElementById('ms-al-save')?.addEventListener('click', () => {
      const symbol = document.getElementById('ms-al-sym').value;
      const type = document.getElementById('ms-al-type').value;
      const threshold = Number(document.getElementById('ms-al-val').value);
      if (!threshold || threshold <= 0) return;
      state.alerts.unshift({
        id: 'al-' + Date.now(),
        symbol,
        type,
        threshold,
        enabled: true,
        label: `${type === 'price_below' ? '价格跌破' : '价格突破'} $${threshold.toFixed(2)}`,
      });
      sheetType = null;
      saveState();
      render();
      toast('已添加价格监控');
    });
    document.querySelectorAll('[data-m-tog-al]').forEach((el) => {
      el.onclick = () => {
        const al = state.alerts.find((a) => a.id === el.dataset.mTogAl);
        if (al) {
          al.enabled = !al.enabled;
          saveState();
          render();
        }
      };
    });
  }

  window.addEventListener('hashchange', render);
  if (!window.location.hash) window.location.hash = '#/today';
  render();
})();
