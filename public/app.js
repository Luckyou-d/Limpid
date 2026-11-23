'use strict';

(function () {
  const STORAGE_KEY = 'limpidwork_demo_state_v1';
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
  let toastTimer = null;
  let refreshingYahoo = false;

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
    document.body.appendChild(el);
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.remove(), 2800);
  }

  function getRoute() {
    const h = window.location.hash || '#/today';
    const p = h.startsWith('#') ? h.slice(1) : h;
    return p || '/today';
  }

  function navigate(path) {
    if (getRoute() !== path) {
      window.location.hash = '#' + path;
    } else {
      render();
    }
  }

  function openModal(title, bodyHtml, onSubmit, okLabel = '确认') {
    document.querySelector('.modal-backdrop')?.remove();
    const wrap = document.createElement('div');
    wrap.className = 'modal-backdrop';
    wrap.innerHTML = `
      <div class="modal-card">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
          <strong style="font-size:15.5px;">${V.esc(title)}</strong>
          <button class="btn sm ghost" id="modal-close">${V.icon('close', 15)}</button>
        </div>
        <div id="modal-body">${bodyHtml}</div>
        <div style="display:flex;justify-content:flex-end;gap:8px;margin-top:16px;">
          <button class="btn" id="modal-cancel">取消</button>
          <button class="btn primary" id="modal-ok">${V.esc(okLabel)}</button>
        </div>
      </div>`;
    document.body.appendChild(wrap);
    const close = () => wrap.remove();
    wrap.querySelector('#modal-close').onclick = close;
    wrap.querySelector('#modal-cancel').onclick = close;
    wrap.onclick = (e) => {
      if (e.target === wrap) close();
    };
    wrap.querySelector('#modal-ok').onclick = () => {
      if (onSubmit(wrap) !== false) close();
    };
  }

  function openCommandPalette() {
    const entries = [
      ...window.FOLIO_NAV_ITEMS.map((n) => ({ title: n.label, sub: '导航页面', type: 'nav', val: n.path })),
      { title: '设置与连接 (Connections & Runtime)', sub: '系统设置', type: 'nav', val: '/settings' },
      ...Object.values(market.equities).map((q) => ({
        title: `${q.symbol} · ${q.name}`,
        sub: `Yahoo 延迟报价 ${V.fmtUsd(q.price)} (${V.fmtPct(q.changePct)})`,
        type: 'sym',
        val: q.symbol,
      })),
      { title: '0700.HK · 腾讯控股 (非美股数据源边界)', sub: 'ProviderRouter 状态契约', type: 'sym', val: '0700.HK' },
      ...window.FOLIO_COPILOT_SCENARIOS.map((sc) => ({
        title: `Agent: ${sc.chip}`,
        sub: '工作台预设分析场景',
        type: 'scenario',
        val: sc.id,
      })),
    ];

    openModal(
      '命令面板 (Cmd+K)',
      `<input class="input" id="cmd-q" placeholder="搜索页面、股票代码 (如 NVDA, AVGO, 0700.HK) 或研究操作..." style="width:100%;margin-bottom:10px;" />
       <div id="cmd-list" style="max-height:280px;overflow-y:auto;display:flex;flex-direction:column;gap:4px;"></div>`,
      () => true,
      '关闭'
    );

    const qEl = document.getElementById('cmd-q');
    const listEl = document.getElementById('cmd-list');
    const drawList = (filterText) => {
      const f = (filterText || '').trim().toLowerCase();
      const matched = entries.filter((it) => !f || (it.title + ' ' + it.sub).toLowerCase().includes(f));
      listEl.innerHTML = matched
        .map(
          (it, idx) => `
        <button class="nav-item" data-cmd-idx="${idx}" style="justify-content:space-between;">
          <span style="font-weight:600;color:var(--text);">${V.esc(it.title)}</span>
          <span class="tiny muted">${V.esc(it.sub)}</span>
        </button>`
        )
        .join('');
      listEl.querySelectorAll('[data-cmd-idx]').forEach((btn) => {
        btn.onclick = () => {
          const item = matched[Number(btn.dataset.cmdIdx)];
          document.querySelector('.modal-backdrop')?.remove();
          if (item.type === 'nav') navigate(item.val);
          else if (item.type === 'sym') {
            state.activeSymbol = item.val;
            state.klineHoverIdx = null;
            saveState();
            navigate('/workspace');
          } else if (item.type === 'scenario') {
            runScenario(item.val);
          }
        };
      });
    };
    drawList('');
    qEl?.focus();
    qEl?.addEventListener('input', () => drawList(qEl.value));
  }

  async function refreshYahooData() {
    if (refreshingYahoo) return;
    refreshingYahoo = true;
    toast('正在请求 Yahoo Finance 同步延迟行情...');
    render();
    let updatedCount = 0;
    try {
      const syms = Object.keys(market.equities);
      await Promise.all(
        syms.map(async (folioSym) => {
          const item = market.equities[folioSym];
          const resp = await fetch(`./api/yahoo/chart?ticker=${encodeURIComponent(item.yahooTicker)}&range=3mo&interval=1d`, {
            cache: 'no-store',
          });
          if (!resp.ok) return;
          const json = await resp.json();
          const res = json?.data?.chart?.result?.[0];
          if (!res) return;
          const meta = res.meta || {};
          const ts = res.timestamp || [];
          const q = res.indicators?.quote?.[0] || {};
          const closes = [];
          for (let i = 0; i < ts.length; i++) {
            if (typeof q.close?.[i] === 'number') closes.push(Number(q.close[i].toFixed(2)));
          }
          if (closes.length >= 2) {
            const price = Number((meta.regularMarketPrice ?? closes[closes.length - 1]).toFixed(2));
            const prevClose = closes[closes.length - 2];
            const change = Number((price - prevClose).toFixed(2));
            const changePct = Number(((change / prevClose) * 100).toFixed(2));
            item.price = price;
            item.prevClose = prevClose;
            item.change = change;
            item.changePct = changePct;
            if (meta.regularMarketVolume) item.volume = Number(meta.regularMarketVolume);
            updatedCount++;
          }
        })
      );
    } catch {}
    refreshingYahoo = false;
    if (updatedCount > 0) {
      state.yahooSourceMode = 'live';
      state.yahooLastSync = new Date().toISOString();
      saveState();
      render();
      toast(`已从 Yahoo Finance 同步 ${updatedCount} 只美股最新延迟行情`);
    } else {
      render();
      toast('当前为纯静态环境，已加载内置 Yahoo Finance 行情快照');
    }
  }

  function getScenarioOutput(sc, preferredModel) {
    if (!sc) return null;
    if (sc.modelOutputs[preferredModel]) return sc.modelOutputs[preferredModel];
    return sc.modelOutputs[sc.defaultModel] || Object.values(sc.modelOutputs)[0];
  }

  function runScenario(scenarioId) {
    const sc = window.FOLIO_COPILOT_SCENARIOS.find((s) => s.id === scenarioId);
    if (!sc) return;
    state.copilotOpen = true;
    state.activeScenarioId = sc.id;
    if (sc.symbol) state.activeSymbol = sc.symbol;
    if (!sc.modelOutputs[state.copilotModel]) {
      state.copilotModel = sc.defaultModel;
    }
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
    if (sc.contextRoute && getRoute() !== sc.contextRoute) {
      navigate(sc.contextRoute);
    } else {
      render();
    }
    setTimeout(() => {
      const body = document.getElementById('copilot-scroll-body');
      if (body) body.scrollTop = body.scrollHeight;
    }, 30);
  }

  function sendCustomCopilotPrompt(text) {
    const promptText = (text || '').trim();
    if (!promptText) return;
    state.copilotOpen = true;
    const now = new Date();
    const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const portfolio = V.computePortfolio(state, market);
    const activeEq = market.equities[state.activeSymbol];
    const pos = portfolio.rows.find((r) => r.symbol === state.activeSymbol);

    const fallbackMd = activeEq
      ? `### 基于当前工作区上下文的只读核验 (${state.activeSymbol})\n\n` +
        `- **行情快照 (Yahoo Finance · Delayed)**：最新收盘价 **$${activeEq.price.toFixed(2)}**（单日 **${V.fmtPct(activeEq.changePct)}**，近 1 个月 **${V.fmtPct(activeEq.ret1m)}**），SMA20 **$${activeEq.sma20}** / SMA50 **$${activeEq.sma50}**，RSI(14) **${activeEq.rsi14}**。\n` +
        `- **组合敞口联动 (示例持仓)**：${
          pos
            ? `当前持有 **${pos.qty} 股**（成本 $${pos.avgCost.toFixed(2)}），占组合权重 **${pos.weightPct.toFixed(2)}%**，未实现浮盈亏 **${V.fmtSignedUsd(pos.pnl)} (${V.fmtPct(pos.pnlPct)})**。`
            : `当前演示组合（总资产 **${V.fmtUsd(portfolio.totalAssets)}**）未持有该标的。`
        }\n` +
        `- **能力边界提示**：当前演示工作台仅接入 Yahoo Finance 美股日/周线，未安装 Longbridge CLI（无实时 PE/财报流），可点击上方预设场景查看完整分析。`
      : `### 数据源边界说明 (${state.activeSymbol})\n\n当前 Yahoo Finance 适配器仅覆盖美股延迟行情，无法获取 \`${state.activeSymbol}\` 的实时报价与盘口；明澈 拒绝在缺失数据源时猜测数字。`;

    state.copilotTurns.push({
      id: 'turn-' + Date.now(),
      custom: true,
      prompt: promptText,
      time,
      modelLabel: 'LocalRuntimeAdapter',
      elapsedMs: 14,
      content: fallbackMd,
      tools: [
        { name: 'get_workspace_context', target: `${getRoute()} · ${state.activeSymbol}`, status: 'ok', ms: 3, source: 'Workspace State' },
        { name: 'get_quote', target: state.activeSymbol, status: activeEq ? 'ok' : 'error', ms: 11, source: activeEq ? 'Yahoo Finance · Delayed' : 'UNSUPPORTED' },
      ],
    });
    saveState();
    render();
    setTimeout(() => {
      const body = document.getElementById('copilot-scroll-body');
      if (body) body.scrollTop = body.scrollHeight;
    }, 30);
  }

  function renderCopilotPane(route, portfolio) {
    if (!state.copilotOpen) return '<aside class="copilot-pane closed"></aside>';
    const activePos = portfolio.rows.find((r) => r.symbol === state.activeSymbol);
    const routeLabel = window.FOLIO_NAV_ITEMS.find((n) => n.path === route)?.label || '设置';

    const turnsHtml = state.copilotTurns
      .map((turn) => {
        if (turn.custom) {
          return `
            <div class="copilot-user-msg">${V.esc(turn.prompt)}</div>
            <div class="copilot-assistant-card">
              <div class="copilot-meta-row">
                <span class="mono" style="display:inline-flex;align-items:center;gap:5px;">${V.icon('bot', 13)}<span>${V.esc(turn.modelLabel)}</span></span>
                <span>${turn.elapsedMs}ms · ${V.esc(turn.time)}</span>
              </div>
              ${V.renderMarkdown(turn.content)}
              <details class="fold-box">
                <summary><span style="display:inline-flex;align-items:center;gap:5px;">${V.icon('wrench', 12)}<span>工具活动 (${turn.tools?.length || 0} 次调用)</span></span><span>展开</span></summary>
                <div class="fold-content">
                  ${(turn.tools || [])
                    .map(
                      (t) => `<div style="display:flex;justify-content:space-between;padding:3px 0;"><span class="mono">${V.esc(t.name)}(${V.esc(t.target)})</span><span class="${t.status === 'ok' ? 'pos-text' : 'warn-text'}">${V.esc(t.source)} · ${t.ms}ms</span></div>`
                    )
                    .join('')}
                </div>
              </details>
            </div>`;
        }

        const sc = window.FOLIO_COPILOT_SCENARIOS.find((s) => s.id === turn.scenarioId) || window.FOLIO_COPILOT_SCENARIOS[0];
        const out = getScenarioOutput(sc, state.copilotModel);
        const multiModels = Object.keys(sc.modelOutputs || {});

        return `
          <div class="copilot-user-msg">${V.esc(turn.prompt)}</div>
          <div class="copilot-assistant-card">
            <div class="copilot-meta-row">
              <span class="mono" style="display:inline-flex;align-items:center;gap:5px;">${V.icon('bot', 13)}<span>${V.esc(out?.modelLabel || state.copilotModel)}</span></span>
              <span class="tnum">${out ? `${(out.elapsedMs / 1000).toFixed(1)}s · ${out.usage?.total || 0} tok` : ''}</span>
            </div>
            ${
              multiModels.length > 1
                ? `<div style="display:flex;gap:5px;flex-wrap:wrap;margin-bottom:8px;">
                     <span class="tiny subtle" style="align-self:center;">模型切换:</span>
                     ${multiModels
                       .map(
                         (mId) => `<button class="btn xs ${state.copilotModel === mId ? 'accent' : ''}" data-switch-model="${V.esc(mId)}">${V.esc(window.FOLIO_MODELS.find((x) => x.id === mId)?.label || mId)}</button>`
                       )
                       .join('')}
                   </div>`
                : ''
            }
            ${V.renderMarkdown(out?.content || '')}
            ${
              out?.reasoning
                ? `<details class="fold-box">
                     <summary><span style="display:inline-flex;align-items:center;gap:5px;">${V.icon('brain', 12)}<span>查看思考过程 (Reasoning)</span></span><span>展开</span></summary>
                     <div class="fold-content mono">${V.esc(out.reasoning)}</div>
                   </details>`
                : ''
            }
            <details class="fold-box">
              <summary><span style="display:inline-flex;align-items:center;gap:5px;">${V.icon('wrench', 12)}<span>工具活动 (${sc.tools.length} 次只读调用)</span></span><span>核验</span></summary>
              <div class="fold-content">
                ${sc.tools
                  .map(
                    (t) => `<div style="display:flex;justify-content:space-between;gap:8px;padding:3px 0;border-bottom:1px dashed var(--border);">
                              <span class="mono">${V.esc(t.name)}(${V.esc(t.target)})</span>
                              <span class="${t.status === 'ok' ? 'pos-text' : 'neg-text'}" style="white-space:nowrap;display:inline-flex;align-items:center;gap:3px;">${t.status === 'ok' ? V.icon('check', 11) : V.icon('close', 11)}<span>${V.esc(t.source)} (${t.ms}ms)</span></span>
                            </div>`
                  )
                  .join('')}
              </div>
            </details>
            <details class="fold-box">
              <summary><span style="display:inline-flex;align-items:center;gap:5px;">${V.icon('link', 12)}<span>来源检查器 (Source Inspector · ${sc.sources.length})</span></span><span>查看</span></summary>
              <div class="fold-content">
                ${sc.sources.map((s) => `<div style="padding:3px 0;"><strong>${V.esc(s.label)}：</strong>${V.esc(s.claim)}</div>`).join('')}
              </div>
            </details>
          </div>`;
      })
      .join('');

    return `
      <aside class="copilot-pane">
        <div class="copilot-header">
          <div style="display:flex;align-items:center;gap:6px;min-width:0;">
            <strong style="font-size:13px;white-space:nowrap;">Limpid 副驾驶</strong>
            <select class="select sm" id="copilot-model-select" style="max-width:142px;">
              ${window.FOLIO_MODELS.map((m) => `<option value="${V.esc(m.id)}" ${state.copilotModel === m.id ? 'selected' : ''}>${V.esc(m.label)}</option>`).join('')}
            </select>
          </div>
          <div style="display:flex;align-items:center;gap:4px;">
            <select class="select sm" id="copilot-thinking-select" title="推理等级">
              ${['Low', 'Medium', 'High'].map((lv) => `<option value="${lv}" ${state.copilotThinking === lv ? 'selected' : ''}>推理: ${lv}</option>`).join('')}
            </select>
            <button class="btn icon sm ghost" id="btn-close-copilot" title="收起 Agent 副驾驶">${V.icon('close', 14)}</button>
          </div>
        </div>

        <div class="copilot-ctx-bar">
          <span class="ctx-pill">视图: ${V.esc(routeLabel)}</span>
          <span class="ctx-pill mono">标的: ${V.esc(state.activeSymbol)}</span>
          ${activePos ? `<span class="ctx-pill tnum">持仓: ${activePos.qty}股 (${activePos.weightPct.toFixed(1)}%)</span>` : ''}
          ${route === '/compare' ? `<span class="ctx-pill">对比组: ${state.compareSymbols.length}只</span>` : ''}
        </div>

        <div class="copilot-scenarios">
          ${window.FOLIO_COPILOT_SCENARIOS.map(
            (sc) => `<button class="scenario-chip ${state.activeScenarioId === sc.id ? 'active' : ''}" data-run-scenario="${V.esc(sc.id)}">${V.esc(sc.chip)}</button>`
          ).join('')}
        </div>

        <div class="copilot-body" id="copilot-scroll-body">
          ${turnsHtml}
        </div>

        <div class="copilot-composer">
          <div class="composer-box">
            <textarea id="copilot-input" rows="2" placeholder="围绕当前标的或持仓提问..."></textarea>
            <button class="btn primary" id="copilot-send-btn" style="height:38px;">发送</button>
          </div>
          <div style="display:flex;justify-content:space-between;margin-top:5px;" class="tiny subtle">
            <span>只读保护 · 不含下单指令</span>
            <span>为 Harveydu 服务 · 本地优先</span>
          </div>
        </div>
      </aside>`;
  }

  function render() {
    document.documentElement.setAttribute('data-theme', state.theme === 'dark' ? 'dark' : 'light');
    const route = getRoute();
    const portfolio = V.computePortfolio(state, market);
    const evaluatedAlerts = V.evaluateAlerts(state, market, portfolio);
    const triggeredCount = evaluatedAlerts.filter((a) => a.triggered).length;
    const staleThesesCount = state.theses.filter((t) => t.needsReview).length;

    const app = document.getElementById('app');
    app.innerHTML = `
      <div class="shell">
        <aside class="sidebar ${state.sidebarCollapsed ? 'collapsed' : ''}">
          <div class="sidebar-brand">
            <div style="display:flex;align-items:center;gap:9px;min-width:0;">
              <div style="width:28px;height:28px;border-radius:8px;background:linear-gradient(135deg, #e0f2fe, #bae6fd);border:1px solid var(--border-strong);display:grid;place-items:center;flex-shrink:0;">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 3.5 20.5 18.5H3.5Z" stroke="#0369a1" stroke-width="2" stroke-linejoin="round"/><circle cx="12" cy="14.2" r="2.4" fill="#0ea5e9"/></svg>
              </div>
              <div class="brand-text-wrap">
                <div class="brand-title">明澈</div>
                <div class="brand-sub">Limpid · 股票投研</div>
              </div>
            </div>
            <button class="btn icon sm ghost" id="btn-collapse-sidebar" title="折叠导航栏">${V.icon('back', 14)}</button>
          </div>

          <button class="sidebar-new-btn" id="btn-new-session">
            ${V.icon('plus', 14)}<span>新建会话</span>
          </button>

          <nav class="sidebar-nav">
            ${window.FOLIO_NAV_ITEMS.map((item) => {
              const hasDot = item.dotKey === 'triggeredAlerts' && triggeredCount > 0;
              const badgeVal = item.badgeKey === 'staleTheses' && staleThesesCount > 0 ? staleThesesCount : 0;
              return `
                <button class="nav-item ${route === item.path ? 'active' : ''}" data-nav="${item.path}">
                  ${V.icon(item.icon, 15)}
                  <span class="nav-label">${V.esc(item.label)}</span>
                  ${hasDot ? '<span class="nav-dot" title="有已触发的价格/权重提醒"></span>' : ''}
                  ${badgeVal ? `<span class="nav-badge">${badgeVal}</span>` : ''}
                </button>`;
            }).join('')}
          </nav>

          <div class="watchlist-section">
            <div class="watchlist-header">
              <span>自选 (Yahoo)</span>
              <span class="tnum">${state.watchlist.length}</span>
            </div>
            ${state.watchlist
              .map((sym) => {
                const q = market.equities[sym];
                return `
                  <button class="watch-row ${state.activeSymbol === sym ? 'active' : ''}" data-watch-sym="${V.esc(sym)}">
                    <div style="min-width:0;">
                      <div class="watch-sym mono">${V.esc(sym)}</div>
                      <div class="watch-name">${V.esc(q ? q.name : 'HKEX · 需 Longbridge')}</div>
                    </div>
                    <div class="tnum">
                      <div class="watch-price">${q ? V.fmtUsd(q.price) : '—'}</div>
                      <div class="watch-chg ${q ? V.chgClass(q.changePct) : 'subtle'}">${q ? V.fmtPct(q.changePct) : '不可用'}</div>
                    </div>
                  </button>`;
              })
              .join('')}
          </div>

          <div class="sidebar-footer">
            <button class="nav-item ${route === '/settings' ? 'active' : ''}" data-nav="/settings">
              ${V.icon('settings', 15)}<span class="nav-label">设置</span>
            </button>
            <div class="tiny subtle nav-label" style="padding:8px 10px 0;">© Harveydu · 明澈 Limpid</div>
          </div>
        </aside>

        <div class="center-col">
          <header class="topbar">
            <div class="topbar-left">
              <span class="topbar-title">明澈 Research</span>
              <button class="topbar-tab ${route === '/workspace' && state.workspaceTab === 'chart' ? 'active' : ''}" data-quick-ws="chart">K 线</button>
              <button class="topbar-tab ${route === '/workspace' && state.workspaceTab === 'financials' ? 'active' : ''}" data-quick-ws="financials">财务报表</button>
              <button class="topbar-tab ${route === '/workspace' && state.workspaceTab === 'news' ? 'active' : ''}" data-quick-ws="news">新闻</button>
              <button class="topbar-tab ${route === '/research' ? 'active' : ''}" data-nav="/research">报告</button>
            </div>

            <div class="topbar-right">
              <button class="btn sm" id="btn-open-arch" type="button" title="查看设计架构与核心状态机">
                ${V.icon('fileText', 13)}<span>架构介绍</span>
              </button>
              <button class="btn sm" data-action="refresh-yahoo" title="同步 Yahoo Finance 行情">
                ${V.icon('refresh', 13)}<span>${refreshingYahoo ? '同步中...' : 'Yahoo 行情'}</span>
              </button>
              <a class="btn sm" href="mobile.html#${V.esc(route)}">${V.icon('smartphone', 13)}<span>手机端</span></a>
              <button class="btn sm" id="btn-cmdk">${V.icon('search', 13)}<span>搜索</span></button>
              <button class="btn icon sm" id="btn-theme" title="切换浅色/深色主题">${V.icon('sun', 14)}</button>
              <button class="btn sm" id="btn-reset-demo" title="重置演示数据">${V.icon('reset', 13)}<span>重置</span></button>
              <button class="btn sm ${state.copilotOpen ? 'accent' : ''}" id="btn-toggle-copilot">
                <span style="width:6px;height:6px;border-radius:50%;background:currentColor;display:inline-block;"></span>
                <span>AGENT</span>
              </button>
            </div>
          </header>

          <div class="demobar">
            <div class="demobar-left">
              ${V.icon('shield', 13)}
              <span>静态演示模式 · 本地优先的 AI 投资研究工作台（只读） · 美股报价与 K 线来自 <strong>Yahoo Finance (Delayed)</strong>，投资组合与事件日历为示例数据</span>
            </div>
            <span class="tiny mono subtle" style="white-space:nowrap;">当前标的: ${V.esc(state.activeSymbol)}</span>
          </div>

          <main class="workspace-scroll">
            <div class="workspace-inner">
              ${V.render(route, state, market)}
            </div>
          </main>
        </div>

        ${renderCopilotPane(route, portfolio)}
      </div>`;

    bindEvents();
  }

  function bindEvents() {
    document.querySelectorAll('[data-nav]').forEach((el) => {
      el.onclick = () => navigate(el.dataset.nav);
    });

    document.querySelectorAll('[data-quick-ws]').forEach((el) => {
      el.onclick = () => {
        state.workspaceTab = el.dataset.quickWs;
        saveState();
        navigate('/workspace');
      };
    });

    document.querySelectorAll('[data-watch-sym], [data-open-sym]').forEach((el) => {
      el.onclick = () => {
        const sym = el.dataset.watchSym || el.dataset.openSym;
        state.activeSymbol = sym;
        state.workspaceTab = 'chart';
        state.klineHoverIdx = null;
        saveState();
        if (el.dataset.openSym || getRoute() === '/workspace') {
          navigate('/workspace');
        } else {
          render();
        }
      };
    });

    document.querySelectorAll('[data-research-sym]').forEach((el) => {
      el.onclick = () => {
        state.activeSymbol = el.dataset.researchSym;
        saveState();
        navigate('/research');
      };
    });

    document.querySelectorAll('[data-run-scenario]').forEach((el) => {
      el.onclick = () => runScenario(el.dataset.runScenario);
    });

    document.querySelectorAll('[data-action="refresh-yahoo"]').forEach((el) => {
      el.onclick = refreshYahooData;
    });

    const openArchBtn = document.getElementById('btn-open-arch');
    if (openArchBtn) {
      openArchBtn.onclick = () => window.openProjectArchModal && window.openProjectArchModal('arch');
    }

    const collapseBtn = document.getElementById('btn-collapse-sidebar');
    if (collapseBtn) {
      collapseBtn.onclick = () => {
        state.sidebarCollapsed = !state.sidebarCollapsed;
        saveState();
        render();
      };
    }

    const newSessBtn = document.getElementById('btn-new-session');
    if (newSessBtn) {
      newSessBtn.onclick = () => {
        state.copilotOpen = true;
        state.copilotTurns = [
          {
            id: 'turn-' + Date.now(),
            scenarioId: 'morning-brief',
            prompt: window.FOLIO_COPILOT_SCENARIOS.find((s) => s.id === 'morning-brief').prompt,
            time: '刚刚',
            modelKey: 'glm-5.3-flash',
          },
        ];
        state.activeScenarioId = 'morning-brief';
        saveState();
        render();
        toast('已新建研究会话');
      };
    }

    const cmdBtn = document.getElementById('btn-cmdk');
    if (cmdBtn) cmdBtn.onclick = openCommandPalette;

    const themeBtn = document.getElementById('btn-theme');
    if (themeBtn) {
      themeBtn.onclick = () => {
        state.theme = state.theme === 'dark' ? 'light' : 'dark';
        saveState();
        render();
      };
    }

    document.querySelectorAll('[data-set-theme]').forEach((el) => {
      el.onclick = () => {
        state.theme = el.dataset.setTheme;
        saveState();
        render();
      };
    });

    const resetBtn = document.getElementById('btn-reset-demo');
    if (resetBtn) {
      resetBtn.onclick = () => {
        market = JSON.parse(JSON.stringify(window.FOLIO_MARKET_SNAPSHOT));
        state = window.createInitialFolioState();
        saveState();
        render();
        toast('已恢复初始演示数据');
      };
    }

    const toggleCopilot = document.getElementById('btn-toggle-copilot');
    if (toggleCopilot) {
      toggleCopilot.onclick = () => {
        state.copilotOpen = !state.copilotOpen;
        saveState();
        render();
      };
    }
    const closeCopilot = document.getElementById('btn-close-copilot');
    if (closeCopilot) {
      closeCopilot.onclick = () => {
        state.copilotOpen = false;
        saveState();
        render();
      };
    }

    document.querySelectorAll('[data-wstab]').forEach((el) => {
      el.onclick = () => {
        state.workspaceTab = el.dataset.wstab;
        saveState();
        render();
      };
    });

    document.querySelectorAll('[data-kperiod]').forEach((el) => {
      el.onclick = () => {
        state.klinePeriod = el.dataset.kperiod;
        state.klineHoverIdx = null;
        saveState();
        render();
      };
    });

    document.querySelectorAll('[data-kperiod-blocked]').forEach((el) => {
      el.onclick = () => {
        toast(`Yahoo Finance 仅提供日线 (1D) 与周线 (1W)，${el.dataset.kperiodBlocked} 周期需连接 Longbridge CLI`);
      };
    });

    const emaChk = document.getElementById('toggle-ema');
    if (emaChk) {
      emaChk.onchange = () => {
        state.showEma = emaChk.checked;
        saveState();
        render();
      };
    }

    const kContainer = document.getElementById('kline-Dynamic-Container');
    if (kContainer && market.equities[state.activeSymbol]) {
      const bindKbars = () => {
        kContainer.querySelectorAll('[data-kidx]').forEach((g) => {
          g.onmouseenter = () => {
            const idx = Number(g.dataset.kidx);
            if (state.klineHoverIdx !== idx) {
              state.klineHoverIdx = idx;
              kContainer.innerHTML = V.renderKlineSvg(market.equities[state.activeSymbol], state.klinePeriod, state.showEma, idx);
              bindKbars();
            }
          };
        });
        const svgEl = kContainer.querySelector('svg');
        if (svgEl) {
          svgEl.onmouseleave = () => {
            state.klineHoverIdx = null;
            kContainer.innerHTML = V.renderKlineSvg(market.equities[state.activeSymbol], state.klinePeriod, state.showEma, null);
            bindKbars();
          };
        }
      };
      bindKbars();
    }

    document.querySelectorAll('[data-disc-task]').forEach((el) => {
      el.onclick = () => {
        state.discoverTaskId = el.dataset.discTask;
        saveState();
        render();
      };
    });

    document.querySelectorAll('[data-add-compare]').forEach((el) => {
      el.onclick = () => {
        const sym = el.dataset.addCompare;
        if (!state.compareSymbols.includes(sym)) {
          if (state.compareSymbols.length >= 4) state.compareSymbols.pop();
          state.compareSymbols.push(sym);
          saveState();
        }
        navigate('/compare');
        toast(`已将 ${sym} 加入对比工作台`);
      };
    });

    const importBtn = document.getElementById('btn-open-import');
    if (importBtn) {
      importBtn.onclick = () => {
        const symOpts = Object.keys(market.equities)
          .map((s) => `<option value="${V.esc(s)}">${V.esc(s)} · 现价 $${market.equities[s].price}</option>`)
          .join('');
        openModal(
          '导入 / 新增模拟持仓',
          `<div style="display:flex;flex-direction:column;gap:10px;">
             <div>
               <label class="tiny muted">选择美股标的</label>
               <select class="select" id="imp-sym" style="width:100%;margin-top:4px;">${symOpts}</select>
             </div>
             <div class="grid-2">
               <div>
                 <label class="tiny muted">持仓股数 (Qty)</label>
                 <input class="input tnum" id="imp-qty" type="number" value="40" min="1" style="width:100%;margin-top:4px;"/>
               </div>
               <div>
                 <label class="tiny muted">持仓均价 (Avg Cost USD)</label>
                 <input class="input tnum" id="imp-cost" type="number" value="250.00" step="0.01" style="width:100%;margin-top:4px;"/>
               </div>
             </div>
             <div>
               <label class="tiny muted">所属风险簇标签</label>
               <input class="input" id="imp-cluster" value="电商与云基础设施" style="width:100%;margin-top:4px;"/>
             </div>
             <div>
               <label class="tiny muted">投资备注</label>
               <input class="input" id="imp-note" placeholder="如：回调分批建仓观察仓位" style="width:100%;margin-top:4px;"/>
             </div>
           </div>`,
          (wrap) => {
            const sym = wrap.querySelector('#imp-sym').value;
            const qty = Number(wrap.querySelector('#imp-qty').value);
            const avgCost = Number(wrap.querySelector('#imp-cost').value);
            const cluster = wrap.querySelector('#imp-cluster').value.trim() || '美股核心';
            const note = wrap.querySelector('#imp-note').value.trim() || '手动导入演示仓位';
            if (!qty || qty <= 0 || !avgCost || avgCost <= 0) {
              toast('请输入有效的股数与成本均价');
              return false;
            }
            const existing = state.holdings.find((h) => h.symbol === sym);
            if (existing) {
              const totalCost = existing.qty * existing.avgCost + qty * avgCost;
              existing.qty += qty;
              existing.avgCost = Number((totalCost / existing.qty).toFixed(2));
              existing.note = note;
            } else {
              state.holdings.push({ id: 'pos-' + Date.now(), symbol: sym, qty, avgCost, cluster, note });
            }
            saveState();
            render();
            toast(`已更新 ${sym} 持仓并重算组合风险敞口`);
          },
          '保存持仓'
        );
      };
    }

    document.querySelectorAll('[data-del-pos]').forEach((el) => {
      el.onclick = () => {
        if (state.holdings.length <= 1) {
          toast('演示组合至少保留 1 只持仓');
          return;
        }
        state.holdings = state.holdings.filter((h) => h.id !== el.dataset.delPos);
        saveState();
        render();
        toast('已移除该持仓并重新计算组合敞口');
      };
    });

    document.querySelectorAll('[data-rm-compare]').forEach((el) => {
      el.onclick = () => {
        state.compareSymbols = state.compareSymbols.filter((s) => s !== el.dataset.rmCompare);
        saveState();
        render();
      };
    });
    const cmpAddBtn = document.getElementById('cmp-add-btn');
    if (cmpAddBtn) {
      cmpAddBtn.onclick = () => {
        const sel = document.getElementById('cmp-add-select');
        if (sel?.value && state.compareSymbols.length < 4) {
          state.compareSymbols.push(sel.value);
          saveState();
          render();
        }
      };
    }

    const resSymSel = document.getElementById('res-sym-select');
    if (resSymSel) {
      resSymSel.onchange = () => {
        state.activeSymbol = resSymSel.value;
        saveState();
        render();
      };
    }
    const resStratSel = document.getElementById('res-strat-select');
    if (resStratSel) {
      resStratSel.onchange = () => {
        state.researchStrategy = resStratSel.value;
        saveState();
        render();
      };
    }
    const rerunResBtn = document.getElementById('btn-rerun-research');
    if (rerunResBtn) {
      rerunResBtn.onclick = () => {
        state.researchRunning = true;
        render();
        setTimeout(() => {
          state.researchRunning = false;
          render();
          toast(`已完成 ${state.activeSymbol} 能力核验与研究报告更新`);
        }, 650);
      };
    }
    const saveThesisBtn = document.getElementById('btn-save-thesis');
    if (saveThesisBtn) {
      saveThesisBtn.onclick = () => {
        const sym = market.equities[state.activeSymbol] ? state.activeSymbol : 'NVDA.US';
        const rep = window.FOLIO_RESEARCH_REPORTS[sym]?.parsed;
        if (!rep) return;
        const newId = 'thesis-' + sym.toLowerCase().replace('.', '-') + '-' + Date.now();
        state.theses.unshift({
          id: newId,
          symbol: sym,
          title: rep.headline,
          stance: rep.stance,
          confidence: rep.confidence,
          updatedAt: '2026-11-19',
          needsReview: false,
          summary: rep.summary,
          assumptions: [
            { text: (rep.catalysts && rep.catalysts[0]) || '关注关键均线收复确认', status: 'pending', note: '从深度研究保存，待后续交易日跟踪' },
          ],
          bullPoints: rep.bullPoints,
          bearPoints: rep.bearPoints,
          catalysts: rep.catalysts,
          risks: rep.risks,
          reevalHistory: [],
        });
        state.activeThesisId = newId;
        saveState();
        navigate('/thesis');
        toast(`已将 ${sym} 研究报告保存为投资逻辑`);
      };
    }
    const exportMdBtn = document.getElementById('btn-export-md');
    if (exportMdBtn) {
      exportMdBtn.onclick = () => {
        const sym = market.equities[state.activeSymbol] ? state.activeSymbol : 'NVDA.US';
        const repWrap = window.FOLIO_RESEARCH_REPORTS[sym];
        const rep = repWrap?.parsed;
        if (!rep) return;
        const md = [
          `# ${sym} 深度研究报告 — ${rep.headline}`,
          `- 立场: ${rep.stance} (置信度 ${rep.confidence}%)`,
          `- 模型: ${repWrap.modelLabel}`,
          `\n## 综合摘要\n${rep.summary}`,
          `\n## 组合敞口关联\n${rep.portfolioImpact}`,
          `\n## 看多依据\n${rep.bullPoints.map((p) => `- ${p}`).join('\n')}`,
          `\n## 看空依据\n${rep.bearPoints.map((p) => `- ${p}`).join('\n')}`,
          `\n## 催化剂\n${rep.catalysts.map((p) => `- ${p}`).join('\n')}`,
          `\n## 风险与数据缺口\n${rep.risks.map((p) => `- ${p}`).join('\n')}`,
        ].join('\n');
        const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `limpidwork-research-${sym}.md`;
        a.click();
        toast(`已下载 limpidwork-research-${sym}.md`);
      };
    }

    document.querySelectorAll('[data-open-thesis]').forEach((el) => {
      el.onclick = () => {
        state.activeThesisId = el.dataset.openThesis;
        saveState();
        navigate('/thesis');
      };
    });
    const markRevBtn = document.getElementById('btn-mark-reviewed');
    if (markRevBtn) {
      markRevBtn.onclick = () => {
        const th = state.theses.find((t) => t.id === state.activeThesisId);
        if (th) {
          th.needsReview = !th.needsReview;
          saveState();
          render();
          toast(th.needsReview ? '已标记为待复核' : '已确认复核完毕');
        }
      };
    }
    const editThesisBtn = document.getElementById('btn-edit-thesis');
    if (editThesisBtn) {
      editThesisBtn.onclick = () => {
        const th = state.theses.find((t) => t.id === state.activeThesisId);
        if (!th) return;
        openModal(
          `编辑投资逻辑 · ${th.symbol}`,
          `<div style="display:flex;flex-direction:column;gap:10px;">
             <div>
               <label class="tiny muted">核心论点标题</label>
               <input class="input" id="ed-th-title" value="${V.esc(th.title)}" style="width:100%;margin-top:4px;"/>
             </div>
             <div>
               <label class="tiny muted">新增一条待跟踪假设</label>
               <input class="input" id="ed-th-assump" placeholder="例如：下季度数据中心毛利率维持 73% 以上" style="width:100%;margin-top:4px;"/>
             </div>
           </div>`,
          (wrap) => {
            const newTitle = wrap.querySelector('#ed-th-title').value.trim();
            const newAssump = wrap.querySelector('#ed-th-assump').value.trim();
            if (newTitle) th.title = newTitle;
            if (newAssump) {
              th.assumptions.push({ text: newAssump, status: 'pending', note: '人工新增关键假设' });
            }
            saveState();
            render();
            toast('已更新投资逻辑与假设清单');
          }
        );
      };
    }

    document.querySelectorAll('[data-toggle-alert]').forEach((el) => {
      el.onclick = () => {
        const al = state.alerts.find((a) => a.id === el.dataset.toggleAlert);
        if (al) {
          al.enabled = !al.enabled;
          saveState();
          render();
        }
      };
    });
    const addAlertBtn = document.getElementById('btn-add-alert');
    if (addAlertBtn) {
      addAlertBtn.onclick = () => {
        const symOpts = Object.keys(market.equities)
          .map((s) => `<option value="${V.esc(s)}">${V.esc(s)} (现价 $${market.equities[s].price})</option>`)
          .join('');
        openModal(
          '新建确定性行情提醒',
          `<div style="display:flex;flex-direction:column;gap:10px;">
             <div><label class="tiny muted">监控标的</label><select class="select" id="al-sym" style="width:100%;margin-top:4px;">${symOpts}</select></div>
             <div class="grid-2">
               <div>
                 <label class="tiny muted">方向</label>
                 <select class="select" id="al-type" style="width:100%;margin-top:4px;">
                   <option value="price_below">价格跌破 (Below)</option>
                   <option value="price_above">价格突破 (Above)</option>
                 </select>
               </div>
               <div>
                 <label class="tiny muted">目标价格 (USD)</label>
                 <input class="input tnum" id="al-val" type="number" value="155.00" step="0.5" style="width:100%;margin-top:4px;"/>
               </div>
             </div>
           </div>`,
          (wrap) => {
            const symbol = wrap.querySelector('#al-sym').value;
            const type = wrap.querySelector('#al-type').value;
            const threshold = Number(wrap.querySelector('#al-val').value);
            if (!threshold || threshold <= 0) return false;
            state.alerts.unshift({
              id: 'al-' + Date.now(),
              symbol,
              type,
              threshold,
              enabled: true,
              label: `${type === 'price_below' ? '价格跌破' : '价格突破'} $${threshold.toFixed(2)}`,
              note: '自定义价格监控规则',
            });
            saveState();
            render();
            toast('已添加价格提醒规则');
          }
        );
      };
    }

    document.querySelectorAll('[data-sel-skill]').forEach((el) => {
      el.onclick = (e) => {
        if (e.target.closest('[data-toggle-skill]')) return;
        state.selectedSkillId = el.dataset.selSkill;
        saveState();
        render();
      };
    });
    document.querySelectorAll('[data-toggle-skill]').forEach((el) => {
      el.onclick = (e) => {
        e.stopPropagation();
        const sk = state.skills.find((s) => s.id === el.dataset.toggleSkill);
        if (sk) {
          sk.enabled = !sk.enabled;
          saveState();
          render();
          toast(`${sk.name} 已${sk.enabled ? '启用' : '禁用'}`);
        }
      };
    });

    document.querySelectorAll('[data-evaltab]').forEach((el) => {
      el.onclick = () => {
        state.evalTab = el.dataset.evaltab;
        saveState();
        render();
      };
    });

    const cpModel = document.getElementById('copilot-model-select');
    if (cpModel) {
      cpModel.onchange = () => {
        state.copilotModel = cpModel.value;
        saveState();
        render();
      };
    }
    document.querySelectorAll('[data-switch-model]').forEach((el) => {
      el.onclick = () => {
        state.copilotModel = el.dataset.switchModel;
        saveState();
        render();
      };
    });
    const cpThink = document.getElementById('copilot-thinking-select');
    if (cpThink) {
      cpThink.onchange = () => {
        state.copilotThinking = cpThink.value;
        saveState();
      };
    }
    const cpSend = document.getElementById('copilot-send-btn');
    const cpInput = document.getElementById('copilot-input');
    if (cpSend && cpInput) {
      cpSend.onclick = () => sendCustomCopilotPrompt(cpInput.value);
      cpInput.onkeydown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          sendCustomCopilotPrompt(cpInput.value);
        }
      };
    }
  }

  window.addEventListener('hashchange', render);
  window.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      openCommandPalette();
    }
  });

  render();
})();
