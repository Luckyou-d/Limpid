'use strict';

(function () {
  var STORAGE_KEY = 'limpidwork_arch_intro_v1';
  var STYLE_ID = 'folio-arch-modal-styles';
  var MODAL_ID = 'folio-arch-backdrop';

  var NODE_NOTES = {
    // Architecture nodes
    'arch-shell': {
      badge: '本地优先桌面壳',
      title: '三栏投研工作区 · 只读无交易风险 · 凭据本地隔离',
      body: 'Electron 渲染层、预加载白名单 IPC 与主进程内核严格隔离；凭据由 OS safeStorage 加密保存且永不回传前端。产品刻意保持只读研究定位，不含任何下单指令。',
    },
    'arch-runmgr': {
      badge: '内核控制面',
      title: 'RunManager：Session / Run 解耦与单活跃执行锁',
      body: '将“对话会话”与“单次执行”解耦，以单活跃锁拦截并发乱序；无论成功、用户取消、超时还是子进程异常，所有执行路径都强制收敛到明确终态并持久化。',
    },
    'arch-adapter': {
      badge: '运行时适配',
      title: 'PiRuntimeAdapter：单进程多会话隔离与扩展降级重试',
      body: '单 Pi 子进程按会话切换独立 JSONL 文件避免频繁冷启动；子进程异常退出自动重启，可选扩展加载失败时自动剥离并回退核心扩展重试，保障主研究流不断裂。',
    },
    'arch-skillhub': {
      badge: '上下文与知识',
      title: 'SkillHub V2：渐进式披露与路径逃逸防护',
      body: '严格区分跨用户复用的静态分析方法论（Skill）与实时持仓上下文：Prompt 仅常驻元数据索引，按需读取策略参考文档，同时拦截相对路径穿越与软链逃逸。',
    },
    'arch-privacy': {
      badge: '代码级安全边界',
      title: 'wrapToolsWithPrivacy：工具层分级脱敏（不靠 Prompt 约束）',
      body: '持仓、资产与现金流类工具的敏感数据保护下沉至代码包装层：在 minimal/standard 隐私等级硬截断 DATA 明文段仅保留摘要，原样透传 AbortSignal 且零误伤行情只读工具。',
    },
    'arch-registry': {
      badge: '统一契约层',
      title: 'Capability Registry：单一能力注册表驱动全链路',
      body: '一套类型化能力契约同时驱动数据源执行、Agent 工具暴露、UI 可用性提示与技能就绪态，确保 Agent 绝不会声称未接入的金融能力可用。',
    },
    'arch-router': {
      badge: '多源路由与溯源',
      title: 'ProviderRouter：主备数据源透明降级与真实 Provenance',
      body: '按主备顺序路由 Longbridge / Massive / 内置模拟快照的行情与财报能力：主源失败切换备源并强制保留真实备源 Provenance；遇到用户取消（ABORTED）立即终止，绝不触发无效备源降级。',
    },
    'arch-eval': {
      badge: '只读投影与评测门禁',
      title: 'projectTrace 只读投影 + EvaluatorRegistry 多维回归门禁',
      body: '来源中立的只读投影将执行事实与评估判断分离，保留 running 态不伪造成功；评测门禁组合数据新鲜度、部分失败诚实披露与跨工具恢复断言，LLM Judge 解析异常降级为 judge_error 不炸实验。',
    },
    // State machine nodes
    'fsm-idle': {
      badge: 'STATE · IDLE',
      title: 'Idle（就绪待命）',
      body: '工作区实时挂载当前标的、自选与组合敞口上下文，等待发起深度研究或副驾驶提问。',
    },
    'fsm-locked': {
      badge: 'STATE · LOCK & SWITCH',
      title: 'Locked & Switched（获取单活跃锁 · 切换 JSONL 会话）',
      body: 'RunManager 检查 activeRun 拦截并发冲突并持久化 Run；PiRuntimeAdapter 切换到该会话专属 JSONL 文件并注入 Skill 元数据索引。',
    },
    'fsm-exec': {
      badge: 'STATE · EXECUTING',
      title: 'Executing（代码层脱敏 → 主源路由执行）',
      body: '模型触发金融工具先经过 Privacy Wrapper 截断敏感明文，再经 ProviderRouter 按主源优先执行有界并发查询。',
    },
    'fsm-ext-deg': {
      badge: 'RECOVERY · EXTENSION',
      title: 'Extension Degraded（可选扩展异常 → 核扩展重试）',
      body: '若非核心扩展导致运行时启动或调用失败，自动标记 degraded=true 并仅携核心扩展重试一次，避免整条投研链路崩塌。',
    },
    'fsm-fallback': {
      badge: 'RECOVERY · PROVIDER',
      title: 'Fallback Provider（主源故障切备源 · 保留真实来源）',
      body: '主源报错或超时时切换备源继续拉取数据，强制标注真实备源 Provenance 与延迟属性，绝不伪装为主源实时数据。',
    },
    'fsm-abort': {
      badge: 'BOUNDARY · ABORTED',
      title: 'Aborted / Timed Out（取消立刻收束 · 严禁切备源）',
      body: 'AbortSignal 贯穿包装层与路由器：用户点击停止或超时直接中断执行并释放单活跃锁，杜绝取消后继续打备用接口产生拖尾请求。',
    },
    'fsm-partial': {
      badge: 'BOUNDARY · HONEST PARTIAL',
      title: 'Partial Honest（缺失指标诚实展示 — 与数据缺口）',
      body: '当部分券商基本面或非美股能力未接入时，系统诚实展示缺失项与覆盖范围，禁止大模型基于脑补数字拼凑估值结论。',
    },
    'fsm-done': {
      badge: 'TERMINAL · COMPLETED',
      title: 'Completed（带证据链的 ResearchReport）',
      body: '产出包含立场、置信度、多空论点、催化剂与风险的结构化报告，每条论断可回溯到对应工具执行与原始数据源。',
    },
    'fsm-eval': {
      badge: 'POST · TRACE & EVAL',
      title: 'Projected & Evaluated（只读 Trace 投影与回归门禁）',
      body: '全终态归档后进入 projectTrace 只读投影与多维评测断言，持续沉淀黄金路径与对抗回归基线。',
    },
  };

  var HIGHLIGHTS = [
    {
      tag: '代码级隐私边界',
      title: '工具输出分级隐私脱敏（Privacy Wrapper）',
      pain: '仅靠 System Prompt 嘱咐模型“别泄露持仓明细”极易被长上下文稀释或注入绕过。',
      design: '将持仓、资产与现金流保护下沉到工具包装层，按隐私等级截断 DATA 明文段仅保留摘要，并原样透传取消信号。',
      guard: '100% 代码层确定脱敏 · 零误伤行情工具',
    },
    {
      tag: '多源金融路由',
      title: '异构数据源 Provider Routing 与透明降级',
      pain: '单一金融源常出现局部字段缺失、限流或跨市场不可用，静默降级或伪造来源会误导投资判断。',
      design: '经统一能力注册表与 ProviderRouter 按主备顺序执行，强制保留真实备源 Provenance，遇 ABORTED 立刻终止不无效降级。',
      guard: '来源真实可核验 · 缺失绝不脑补',
    },
    {
      tag: '控制面收敛',
      title: 'Session / Run 解耦与单进程扩展降级重试',
      pain: '每会话起独立子进程冷启动重、并发易乱序；可选扩展故障或中途取消常导致状态卡死在 running。',
      design: '单 Pi 进程切换会话 JSONL 隔离状态，RunManager 持有单活跃锁，覆盖异常自启、可选扩展降级重试与全终态落盘收敛。',
      guard: '零状态卡死 · 单机低开销稳定收敛',
    },
    {
      tag: '可观测与评测',
      title: '只读 Trace 投影与多维确定性回归门禁',
      pain: '评估逻辑污染执行时间线、LLM Judge 格式漂移炸毁整批实验、或漏检陈旧数据与隐瞒部分失败。',
      design: '以来源中立的 projectTrace 隔离事实与评估；评测组合新鲜度、诚实失败披露与跨工具恢复断言，Judge 异常降级为 judge_error。',
      guard: '离线快速回归 · Judge 异常零中断',
    },
  ];

  var TECH_TAGS = [
    'TypeScript / Bun / Electron',
    'Pi Agent Runtime (JSONL)',
    'wrapToolsWithPrivacy',
    'Capability Registry',
    'ProviderRouter (Longbridge / 模拟快照)',
    'SkillHub V2',
    'projectTrace + Eval Gate',
  ];

  function injectStyles() {
    if (document.getElementById(STYLE_ID)) return;
    var style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = [
      ':root {',
      '  --am-bg: #ffffff;',
      '  --am-canvas: #f8fafc;',
      '  --am-elev: #f1f5f9;',
      '  --am-text: #0f172a;',
      '  --am-muted: #475569;',
      '  --am-border: #e2e8f0;',
      '  --am-border-strong: #cbd5e1;',
      '  --am-primary-bg: #0ea5e9;',
      '  --am-primary-fg: #03243a;',
      '  --am-brand: #0369a1;',
      '  --am-brand-soft: rgba(14, 165, 233, 0.10);',
      '  --am-brand-ring: rgba(14, 165, 233, 0.40);',
      '  --am-info: #4f46e5;',
      '  --am-info-soft: rgba(79, 70, 229, 0.10);',
      '  --am-ok: #047857;',
      '  --am-ok-soft: rgba(16, 185, 129, 0.12);',
      '  --am-warn: #b45309;',
      '  --am-warn-soft: rgba(180, 83, 9, 0.12);',
      '  --am-err: #b91c1c;',
      '  --am-err-soft: rgba(239, 68, 68, 0.11);',
      '  --am-node-fill: #ffffff;',
      '  --am-plane-fill: #f8fafc;',
      '  --am-line: #94a3b8;',
      '}',
      '[data-theme="dark"] {',
      '  --am-bg: #12161d;',
      '  --am-canvas: #0b0d12;',
      '  --am-elev: #1a212d;',
      '  --am-text: #f3f6fa;',
      '  --am-muted: #aab4c2;',
      '  --am-border: rgba(235, 241, 248, 0.13);',
      '  --am-border-strong: rgba(235, 241, 248, 0.25);',
      '  --am-primary-bg: #7dd3fc;',
      '  --am-primary-fg: #06202f;',
      '  --am-brand: #7dd3fc;',
      '  --am-brand-soft: rgba(125, 211, 252, 0.15);',
      '  --am-brand-ring: rgba(125, 211, 252, 0.48);',
      '  --am-info: #a5b4fc;',
      '  --am-info-soft: rgba(129, 140, 248, 0.18);',
      '  --am-ok: #6ee7b7;',
      '  --am-ok-soft: rgba(66, 201, 149, 0.16);',
      '  --am-warn: #fcd34d;',
      '  --am-warn-soft: rgba(227, 180, 91, 0.17);',
      '  --am-err: #fca5a5;',
      '  --am-err-soft: rgba(255, 107, 118, 0.17);',
      '  --am-node-fill: #161c26;',
      '  --am-plane-fill: #0f141c;',
      '  --am-line: #64748b;',
      '}',
      '.archm-backdrop {',
      '  position: fixed; inset: 0; z-index: 120;',
      '  background: rgba(8, 12, 22, 0.58);',
      '  backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px);',
      '  display: grid; place-items: center; padding: 18px;',
      '  animation: archmFadeIn 180ms ease-out;',
      '}',
      '@keyframes archmFadeIn { from { opacity: 0; } to { opacity: 1; } }',
      '.archm-dialog {',
      '  width: 100%; max-width: 960px; max-height: min(90dvh, 840px);',
      '  background: var(--am-bg); color: var(--am-text);',
      '  border: 1px solid var(--am-border); border-radius: 16px;',
      '  box-shadow: 0 24px 72px rgba(0, 0, 0, 0.30);',
      '  display: flex; flex-direction: column; overflow: hidden;',
      '  font-family: var(--font-sans, "Inter", -apple-system, BlinkMacSystemFont, "PingFang SC", sans-serif);',
      '}',
      '.archm-head {',
      '  padding: 18px 22px 14px; border-bottom: 1px solid var(--am-border);',
      '  display: flex; align-items: flex-start; justify-content: space-between; gap: 14px;',
      '  background: linear-gradient(180deg, var(--am-brand-soft) 0%, transparent 100%);',
      '  flex-shrink: 0;',
      '}',
      '.archm-head-left { display: flex; align-items: flex-start; gap: 12px; min-width: 0; }',
      '.archm-logo {',
      '  width: 40px; height: 40px; border-radius: 11px;',
      '  background: linear-gradient(135deg, #e0f2fe, #bae6fd);',
      '  border: 1px solid var(--am-border-strong);',
      '  display: grid; place-items: center; flex-shrink: 0; margin-top: 1px;',
      '}',
      '.archm-title-row { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }',
      '.archm-title { margin: 0; font-size: 18px; font-weight: 700; letter-spacing: -0.02em; line-height: 1.25; }',
      '.archm-kicker {',
      '  font-size: 11px; font-weight: 600; padding: 2px 8px; border-radius: 999px;',
      '  background: var(--am-brand-soft); color: var(--am-brand);',
      '  border: 1px solid var(--am-brand-ring); letter-spacing: 0.02em;',
      '}',
      '.archm-sub { margin: 5px 0 0; font-size: 13px; color: var(--am-muted); line-height: 1.5; }',
      '.archm-close {',
      '  width: 32px; height: 32px; border-radius: 9px; border: 1px solid var(--am-border);',
      '  background: var(--am-bg); color: var(--am-muted); cursor: pointer;',
      '  display: grid; place-items: center; flex-shrink: 0; font-size: 15px; transition: all 140ms;',
      '}',
      '.archm-close:hover { background: var(--am-elev); color: var(--am-text); }',
      '.archm-toolbar {',
      '  padding: 10px 22px; border-bottom: 1px solid var(--am-border);',
      '  display: flex; align-items: center; justify-content: space-between; gap: 10px; flex-wrap: wrap;',
      '  background: var(--am-bg); flex-shrink: 0;',
      '}',
      '.archm-tabs { display: inline-flex; gap: 4px; padding: 3px; border-radius: 10px; background: var(--am-elev); }',
      '.archm-tab {',
      '  border: 0; background: transparent; color: var(--am-muted); cursor: pointer;',
      '  padding: 6px 13px; border-radius: 8px; font-size: 12.5px; font-weight: 600;',
      '  display: inline-flex; align-items: center; gap: 6px; transition: all 150ms; white-space: nowrap;',
      '}',
      '.archm-tab:hover { color: var(--am-text); }',
      '.archm-tab.active {',
      '  background: var(--am-bg); color: var(--am-text);',
      '  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.09), 0 0 0 1px var(--am-border);',
      '}',
      '.archm-tab-num { font-family: var(--font-mono, monospace); font-size: 11px; color: var(--am-brand); }',
      '.archm-filters { display: inline-flex; align-items: center; gap: 5px; flex-wrap: wrap; }',
      '.archm-pill {',
      '  border: 1px solid var(--am-border); background: var(--am-bg); color: var(--am-muted);',
      '  padding: 4px 10px; border-radius: 999px; font-size: 11.5px; font-weight: 550; cursor: pointer; transition: all 140ms;',
      '}',
      '.archm-pill:hover { color: var(--am-text); border-color: var(--am-border-strong); }',
      '.archm-pill.active { background: var(--am-brand-soft); color: var(--am-brand); border-color: var(--am-brand-ring); }',
      '.archm-hint { font-size: 11.5px; color: var(--am-muted); }',
      '.archm-body { flex: 1; min-height: 0; overflow-y: auto; padding: 16px 22px 18px; background: var(--am-canvas); }',
      '.archm-svg-stage {',
      '  background: var(--am-bg); border: 1px solid var(--am-border); border-radius: 13px;',
      '  padding: 10px 12px; overflow-x: auto; -webkit-overflow-scrolling: touch;',
      '}',
      '.archm-svg { display: block; width: 100%; min-width: 680px; height: auto; user-select: none; }',
      '.archm-node { cursor: pointer; transition: opacity 180ms ease, filter 180ms ease; }',
      '.archm-node:hover .node-box { stroke: var(--am-brand); stroke-width: 2; }',
      '.archm-node.is-selected .node-box { stroke: var(--am-brand); stroke-width: 2.2; filter: drop-shadow(0 3px 10px var(--am-brand-soft)); }',
      '.archm-edge { transition: opacity 200ms ease; }',
      '.archm-dim { opacity: 0.18 !important; }',
      '.archm-callout {',
      '  margin-top: 12px; padding: 12px 15px; border-radius: 12px;',
      '  background: var(--am-bg); border: 1px solid var(--am-border);',
      '  border-left: 3px solid var(--am-brand);',
      '  display: flex; flex-direction: column; gap: 4px;',
      '}',
      '.archm-callout-head { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }',
      '.archm-callout-badge {',
      '  font-size: 10.5px; font-weight: 700; font-family: var(--font-mono, monospace);',
      '  padding: 2px 7px; border-radius: 6px; background: var(--am-brand-soft); color: var(--am-brand);',
      '}',
      '.archm-callout-title { font-size: 13.5px; font-weight: 650; color: var(--am-text); }',
      '.archm-callout-body { margin: 0; font-size: 12.5px; color: var(--am-muted); line-height: 1.62; }',
      '.archm-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }',
      '.archm-card {',
      '  background: var(--am-bg); border: 1px solid var(--am-border); border-radius: 13px;',
      '  padding: 15px 16px; display: flex; flex-direction: column; gap: 8px;',
      '}',
      '.archm-card-top { display: flex; align-items: center; justify-content: space-between; gap: 8px; flex-wrap: wrap; }',
      '.archm-card-tag { font-size: 11px; font-weight: 650; color: var(--am-brand); background: var(--am-brand-soft); padding: 2px 8px; border-radius: 999px; }',
      '.archm-card-guard { font-size: 11px; font-weight: 600; color: var(--am-ok); background: var(--am-ok-soft); padding: 2px 8px; border-radius: 999px; }',
      '.archm-card h3 { margin: 0; font-size: 14.5px; font-weight: 650; line-height: 1.35; letter-spacing: -0.01em; }',
      '.archm-kv { margin: 0; font-size: 12.5px; color: var(--am-muted); line-height: 1.6; }',
      '.archm-kv strong { color: var(--am-text); font-weight: 600; }',
      '.archm-tech-strip {',
      '  margin-top: 12px; padding: 11px 14px; border-radius: 12px;',
      '  background: var(--am-bg); border: 1px solid var(--am-border);',
      '  display: flex; align-items: center; gap: 7px; flex-wrap: wrap;',
      '}',
      '.archm-tech-label { font-size: 11.5px; font-weight: 650; color: var(--am-muted); margin-right: 4px; }',
      '.archm-chip {',
      '  font-size: 11.5px; font-family: var(--font-mono, monospace); padding: 3px 8px;',
      '  border-radius: 7px; background: var(--am-elev); color: var(--am-text); border: 1px solid var(--am-border);',
      '}',
      '.archm-foot {',
      '  padding: 12px 22px; border-top: 1px solid var(--am-border); background: var(--am-bg);',
      '  display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; flex-shrink: 0;',
      '}',
      '.archm-foot-note { font-size: 12px; color: var(--am-muted); }',
      '.archm-foot-actions { display: flex; align-items: center; gap: 8px; }',
      '.archm-btn {',
      '  display: inline-flex; align-items: center; justify-content: center; gap: 6px;',
      '  padding: 7px 14px; border-radius: 9px; font-size: 13px; font-weight: 600;',
      '  border: 1px solid var(--am-border); background: var(--am-bg); color: var(--am-text);',
      '  cursor: pointer; text-decoration: none; transition: all 140ms; line-height: 1.2;',
      '}',
      '.archm-btn:hover { background: var(--am-elev); }',
      '.archm-btn.primary { background: var(--am-primary-bg); color: var(--am-primary-fg); border-color: var(--am-primary-bg); }',
      '.archm-btn.primary:hover { opacity: 0.92; }',
      '@media (max-width: 720px) {',
      '  .archm-backdrop { padding: 8px; align-items: flex-end; }',
      '  .archm-dialog { max-height: 92dvh; border-radius: 16px; }',
      '  .archm-head { padding: 14px 14px 12px; }',
      '  .archm-title { font-size: 16px; }',
      '  .archm-toolbar { padding: 8px 14px; }',
      '  .archm-body { padding: 12px 14px; }',
      '  .archm-grid { grid-template-columns: 1fr; }',
      '  .archm-foot { padding: 10px 14px; }',
      '  .archm-foot-note { display: none; }',
      '  .archm-foot-actions { width: 100%; }',
      '  .archm-foot-actions .archm-btn { flex: 1; }',
      '}',
    ].join('\n');
    document.head.appendChild(style);
  }

  function renderArchSvg() {
    return (
      '<svg class="archm-svg" viewBox="0 0 880 492" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="明澈 系统设计架构图">' +
        '<defs>' +
          '<marker id="fol-arr" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="6.5" markerHeight="6.5" orient="auto-start-reverse">' +
            '<path d="M 1 1.5 L 9 5 L 1 8.5 z" fill="var(--am-line)"/>' +
          '</marker>' +
          '<marker id="fol-arr-brand" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="6.5" markerHeight="6.5" orient="auto-start-reverse">' +
            '<path d="M 1 1.5 L 9 5 L 1 8.5 z" fill="var(--am-brand)"/>' +
          '</marker>' +
          '<marker id="fol-arr-ok" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="6.5" markerHeight="6.5" orient="auto-start-reverse">' +
            '<path d="M 1 1.5 L 9 5 L 1 8.5 z" fill="var(--am-ok)"/>' +
          '</marker>' +
        '</defs>' +

        /* Plane 1: Local-First Desktop Shell */
        '<rect x="14" y="10" width="852" height="84" rx="13" fill="var(--am-plane-fill)" stroke="var(--am-border)" stroke-width="1.2"/>' +
        '<text x="28" y="29" font-size="11" font-weight="700" fill="var(--am-muted)" letter-spacing="0.04em">01 · 本地优先金融桌面壳  LOCAL-FIRST DESKTOP SHELL</text>' +
        '<g class="archm-node" data-node="arch-shell">' +
          '<rect class="node-box" x="28" y="38" width="256" height="46" rx="9" fill="var(--am-node-fill)" stroke="var(--am-brand-ring)" stroke-width="1.3"/>' +
          '<text x="42" y="57" font-size="12.5" font-weight="700" fill="var(--am-text)">三栏投研工作区（只读无交易）</text>' +
          '<text x="42" y="74" font-size="11" fill="var(--am-muted)">Today · K线财报 · 组合敞口 · 多标的横评</text>' +

          '<rect class="node-box" x="312" y="38" width="256" height="46" rx="9" fill="var(--am-node-fill)" stroke="var(--am-border)" stroke-width="1.2"/>' +
          '<text x="326" y="57" font-size="12.5" font-weight="700" fill="var(--am-text)">深度研究与论点演进</text>' +
          '<text x="326" y="74" font-size="11" fill="var(--am-muted)">ResearchReport · 证据引用 · Research Diff</text>' +

          '<rect class="node-box" x="596" y="38" width="256" height="46" rx="9" fill="var(--am-node-fill)" stroke="var(--am-border)" stroke-width="1.2"/>' +
          '<text x="610" y="57" font-size="12.5" font-weight="700" fill="var(--am-text)">白名单 IPC + safeStorage 隔离</text>' +
          '<text x="610" y="74" font-size="11" fill="var(--am-muted)">上下文隔离 · 凭据永不回传渲染进程</text>' +
        '</g>' +

        /* Connector P1 -> P2 */
        '<line x1="156" y1="94" x2="156" y2="127" stroke="var(--am-brand)" stroke-width="1.6" marker-end="url(#fol-arr-brand)"/>' +
        '<line x1="440" y1="94" x2="440" y2="127" stroke="var(--am-line)" stroke-width="1.4" marker-end="url(#fol-arr)"/>' +
        '<rect x="170" y="102" width="256" height="19" rx="9" fill="var(--am-bg)" stroke="var(--am-border)" stroke-width="0.9"/>' +
        '<text x="298" y="115" text-anchor="middle" font-size="10.5" font-weight="600" fill="var(--am-muted)">白名单 IPC + 当前标的 / 持仓动态上下文</text>' +

        /* Plane 2: Kernel Control Plane */
        '<rect x="14" y="130" width="852" height="132" rx="13" fill="var(--am-brand-soft)" stroke="var(--am-brand-ring)" stroke-width="1.3"/>' +
        '<text x="28" y="150" font-size="11" font-weight="700" fill="var(--am-brand)" letter-spacing="0.04em">02 · 内核控制面与渐进式能力装配  KERNEL CONTROL PLANE</text>' +

        '<g class="archm-node" data-node="arch-runmgr">' +
          '<rect class="node-box" x="28" y="162" width="256" height="86" rx="10" fill="var(--am-node-fill)" stroke="var(--am-brand)" stroke-width="1.5"/>' +
          '<rect x="40" y="172" width="114" height="17" rx="5" fill="var(--am-brand-soft)"/>' +
          '<text x="47" y="184" font-size="10" font-weight="700" fill="var(--am-brand)">RunManager Kernel</text>' +
          '<text x="40" y="206" font-size="12.5" font-weight="700" fill="var(--am-text)">Session / Run 解耦控制面</text>' +
          '<text x="40" y="223" font-size="10.8" fill="var(--am-muted)">显式单活跃锁拦截并发乱序</text>' +
          '<text x="40" y="238" font-size="10.8" fill="var(--am-muted)">全终态落盘收敛 · 绝不卡死 running</text>' +
        '</g>' +

        '<line x1="284" y1="205" x2="309" y2="205" stroke="var(--am-brand)" stroke-width="1.5" marker-end="url(#fol-arr-brand)"/>' +

        '<g class="archm-node" data-node="arch-adapter">' +
          '<rect class="node-box" x="312" y="162" width="256" height="86" rx="10" fill="var(--am-node-fill)" stroke="var(--am-border-strong)" stroke-width="1.2"/>' +
          '<rect x="324" y="172" width="116" height="17" rx="5" fill="var(--am-info-soft)"/>' +
          '<text x="331" y="184" font-size="10" font-weight="700" fill="var(--am-info)">PiRuntimeAdapter</text>' +
          '<text x="324" y="206" font-size="12.5" font-weight="700" fill="var(--am-text)">单进程多会话与降级重试</text>' +
          '<text x="324" y="223" font-size="10.8" fill="var(--am-muted)">按会话切换 JSONL 隔离上下文</text>' +
          '<text x="324" y="238" font-size="10.8" fill="var(--am-muted)">异常自启 · 可选扩展失败退回核扩展</text>' +
        '</g>' +

        '<line x1="568" y1="205" x2="593" y2="205" stroke="var(--am-brand)" stroke-width="1.5" marker-end="url(#fol-arr-brand)"/>' +

        '<g class="archm-node" data-node="arch-skillhub">' +
          '<rect class="node-box" x="596" y="162" width="256" height="86" rx="10" fill="var(--am-node-fill)" stroke="var(--am-border-strong)" stroke-width="1.2"/>' +
          '<rect x="608" y="172" width="96" height="17" rx="5" fill="var(--am-info-soft)"/>' +
          '<text x="615" y="184" font-size="10" font-weight="700" fill="var(--am-info)">SkillHub V2</text>' +
          '<text x="608" y="206" font-size="12.5" font-weight="700" fill="var(--am-text)">投研方法论渐进式披露</text>' +
          '<text x="608" y="223" font-size="10.8" fill="var(--am-muted)">静态 Skill 索引与动态持仓严格分离</text>' +
          '<text x="608" y="238" font-size="10.8" fill="var(--am-muted)">按需读取参考 · 拦截路径与软链逃逸</text>' +
        '</g>' +

        /* Trust Boundary + clean connectors terminating at Plane 3 top edge */
        '<line x1="156" y1="262" x2="156" y2="294" stroke="var(--am-brand)" stroke-width="1.6" marker-end="url(#fol-arr-brand)"/>' +
        '<line x1="724" y1="262" x2="724" y2="294" stroke="var(--am-line)" stroke-width="1.4" marker-end="url(#fol-arr)"/>' +
        '<line x1="24" y1="278" x2="856" y2="278" stroke="var(--am-border-strong)" stroke-width="1.1" stroke-dasharray="5 4"/>' +
        '<rect x="272" y="268" width="336" height="20" rx="9" fill="var(--am-bg)" stroke="var(--am-warn)" stroke-width="0.9"/>' +
        '<text x="440" y="281.5" text-anchor="middle" font-size="10.5" font-weight="650" fill="var(--am-warn)">代码级隐私脱敏边界（硬截断 DATA 明文 · 非 Prompt 约束）</text>' +

        /* Plane 3: Privacy & Provider Routing */
        '<rect x="14" y="297" width="852" height="100" rx="13" fill="var(--am-plane-fill)" stroke="var(--am-border)" stroke-width="1.2"/>' +
        '<text x="28" y="316" font-size="11" font-weight="700" fill="var(--am-muted)" letter-spacing="0.04em">03 · 隐私包装与异构数据路由面  PRIVACY &amp; PROVIDER ROUTING</text>' +

        '<g class="archm-node is-selected" data-node="arch-privacy">' +
          '<rect class="node-box" x="28" y="325" width="256" height="60" rx="10" fill="var(--am-node-fill)" stroke="var(--am-warn)" stroke-width="1.6"/>' +
          '<text x="42" y="345" font-size="12.5" font-weight="700" fill="var(--am-text)">wrapToolsWithPrivacy</text>' +
          '<text x="42" y="363" font-size="10.8" fill="var(--am-muted)">持仓/资产分级脱敏 · 保留摘要截断明文</text>' +
          '<text x="42" y="377" font-size="10.2" font-weight="600" fill="var(--am-warn)">透传 AbortSignal · 零误伤行情只读</text>' +
        '</g>' +

        '<line x1="284" y1="355" x2="309" y2="355" stroke="var(--am-line)" stroke-width="1.4" marker-end="url(#fol-arr)"/>' +

        '<g class="archm-node" data-node="arch-registry">' +
          '<rect class="node-box" x="312" y="325" width="256" height="60" rx="10" fill="var(--am-node-fill)" stroke="var(--am-brand-ring)" stroke-width="1.3"/>' +
          '<text x="326" y="345" font-size="12.5" font-weight="700" fill="var(--am-text)">Capability Registry 能力契约</text>' +
          '<text x="326" y="363" font-size="10.8" fill="var(--am-muted)">统一驱动工具 / UI 可用性 / 技能就绪态</text>' +
          '<text x="326" y="377" font-size="10.2" font-weight="600" fill="var(--am-brand)">缺失能力显式标注 · 绝不假装可用</text>' +
        '</g>' +

        '<line x1="568" y1="355" x2="593" y2="355" stroke="var(--am-line)" stroke-width="1.4" marker-end="url(#fol-arr)"/>' +

        '<g class="archm-node" data-node="arch-router">' +
          '<rect class="node-box" x="596" y="325" width="256" height="60" rx="10" fill="var(--am-node-fill)" stroke="var(--am-ok)" stroke-width="1.3"/>' +
          '<text x="610" y="345" font-size="12.5" font-weight="700" fill="var(--am-text)">ProviderRouter 主备路由</text>' +
          '<text x="610" y="363" font-size="10.8" fill="var(--am-muted)">Longbridge 主源 → Massive / 内置模拟快照</text>' +
          '<text x="610" y="377" font-size="10.2" font-weight="600" fill="var(--am-ok)">保留真实 Provenance · ABORT 不降级</text>' +
        '</g>' +

        /* Connector P3 -> P4 */
        '<line x1="440" y1="397" x2="440" y2="416" stroke="var(--am-ok)" stroke-width="1.4" marker-end="url(#fol-arr-ok)"/>' +

        /* Plane 4: Read-only Trace & Eval Gate */
        '<g class="archm-node" data-node="arch-eval">' +
          '<rect class="node-box" x="14" y="419" width="852" height="62" rx="13" fill="var(--am-node-fill)" stroke="var(--am-ok)" stroke-width="1.3"/>' +
          '<text x="28" y="439" font-size="11" font-weight="700" fill="var(--am-ok)" letter-spacing="0.04em">04 · 只读 TRACE 投影与多维回归门禁  READ-ONLY TRACE &amp; EVAL GATE</text>' +
          '<rect x="28" y="447" width="194" height="24" rx="6" fill="var(--am-elev)"/>' +
          '<text x="125" y="463" text-anchor="middle" font-size="11" font-weight="600" fill="var(--am-text)">projectTrace 来源中立只读投影</text>' +
          '<line x1="224" y1="459" x2="248" y2="459" stroke="var(--am-ok)" stroke-width="1.4" marker-end="url(#fol-arr-ok)"/>' +
          '<rect x="252" y="447" width="196" height="24" rx="6" fill="var(--am-elev)"/>' +
          '<text x="350" y="463" text-anchor="middle" font-size="11" font-weight="600" fill="var(--am-text)">新鲜度 / 诚实失败 / 恢复断言</text>' +
          '<line x1="450" y1="459" x2="474" y2="459" stroke="var(--am-ok)" stroke-width="1.4" marker-end="url(#fol-arr-ok)"/>' +
          '<rect x="478" y="447" width="174" height="24" rx="6" fill="var(--am-elev)"/>' +
          '<text x="565" y="463" text-anchor="middle" font-size="11" font-weight="600" fill="var(--am-text)">Judge 异常降级 judge_error</text>' +
          '<line x1="654" y1="459" x2="678" y2="459" stroke="var(--am-ok)" stroke-width="1.4" marker-end="url(#fol-arr-ok)"/>' +
          '<rect x="682" y="447" width="168" height="24" rx="6" fill="var(--am-ok-soft)"/>' +
          '<text x="766" y="463" text-anchor="middle" font-size="11" font-weight="700" fill="var(--am-ok)">PR Smoke &amp; 回归门禁</text>' +
        '</g>' +
      '</svg>'
    );
  }

  function renderFsmSvg() {
    return (
      '<svg class="archm-svg" viewBox="0 0 880 434" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="明澈 Run 生命周期与主备降级收敛状态机">' +
        '<defs>' +
          '<marker id="fol-fsm-ok" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="6.5" markerHeight="6.5" orient="auto-start-reverse">' +
            '<path d="M 1 1.5 L 9 5 L 1 8.5 z" fill="var(--am-ok)"/>' +
          '</marker>' +
          '<marker id="fol-fsm-brand" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="6.5" markerHeight="6.5" orient="auto-start-reverse">' +
            '<path d="M 1 1.5 L 9 5 L 1 8.5 z" fill="var(--am-brand)"/>' +
          '</marker>' +
          '<marker id="fol-fsm-warn" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="6.5" markerHeight="6.5" orient="auto-start-reverse">' +
            '<path d="M 1 1.5 L 9 5 L 1 8.5 z" fill="var(--am-warn)"/>' +
          '</marker>' +
          '<marker id="fol-fsm-err" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="6.5" markerHeight="6.5" orient="auto-start-reverse">' +
            '<path d="M 1 1.5 L 9 5 L 1 8.5 z" fill="var(--am-err)"/>' +
          '</marker>' +
        '</defs>' +

        /* EDGES */
        /* F1 -> F2 */
        '<g class="archm-edge" data-paths="main fallback abort">' +
          '<line x1="146" y1="62" x2="188" y2="62" stroke="var(--am-brand)" stroke-width="1.8" marker-end="url(#fol-fsm-brand)"/>' +
          '<text x="167" y="53" text-anchor="middle" font-size="10" font-weight="600" fill="var(--am-brand)">加锁</text>' +
        '</g>' +

        /* F2 -> F3 */
        '<g class="archm-edge" data-paths="main fallback abort">' +
          '<line x1="366" y1="62" x2="408" y2="62" stroke="var(--am-brand)" stroke-width="1.8" marker-end="url(#fol-fsm-brand)"/>' +
          '<text x="387" y="53" text-anchor="middle" font-size="10" font-weight="600" fill="var(--am-brand)">就绪</text>' +
        '</g>' +

        /* F3 -> F4 */
        '<g class="archm-edge" data-paths="main">' +
          '<line x1="622" y1="62" x2="664" y2="62" stroke="var(--am-ok)" stroke-width="1.8" marker-end="url(#fol-fsm-ok)"/>' +
          '<text x="643" y="53" text-anchor="middle" font-size="10" font-weight="600" fill="var(--am-ok)">主源成功</text>' +
        '</g>' +

        /* F3 -> F7 (ABORTED never falls back — clean top corridor y=114 -> left lane x=92) */
        '<g class="archm-edge" data-paths="abort">' +
          '<path d="M 482 96 L 482 114 L 92 114 L 92 332 L 184 332" fill="none" stroke="var(--am-err)" stroke-width="1.7" stroke-dasharray="4 3" marker-end="url(#fol-fsm-err)"/>' +
          '<rect x="20" y="210" width="144" height="20" rx="8" fill="var(--am-bg)" stroke="var(--am-err)" stroke-width="0.8"/>' +
          '<text x="92" y="223" text-anchor="middle" font-size="10" font-weight="600" fill="var(--am-err)">ABORTED 严禁切备源</text>' +
        '</g>' +

        /* F2 -> F5 (ext degraded) */
        '<g class="archm-edge" data-paths="fallback">' +
          '<line x1="258" y1="96" x2="258" y2="170" stroke="var(--am-warn)" stroke-width="1.7" marker-end="url(#fol-fsm-warn)"/>' +
          '<rect x="196" y="130" width="124" height="19" rx="8" fill="var(--am-bg)" stroke="var(--am-warn)" stroke-width="0.8"/>' +
          '<text x="258" y="143" text-anchor="middle" font-size="10" font-weight="600" fill="var(--am-warn)">可选扩展加载异常</text>' +
        '</g>' +

        /* F5 -> F3 (degraded retry) */
        '<g class="archm-edge" data-paths="fallback">' +
          '<path d="M 388 196 L 424 196 L 424 99" fill="none" stroke="var(--am-warn)" stroke-width="1.6" stroke-dasharray="4 3" marker-end="url(#fol-fsm-warn)"/>' +
          '<rect x="336" y="130" width="118" height="19" rx="8" fill="var(--am-bg)" stroke="var(--am-warn)" stroke-width="0.8"/>' +
          '<text x="395" y="143" text-anchor="middle" font-size="10" font-weight="600" fill="var(--am-warn)">仅核扩展重试续跑</text>' +
        '</g>' +

        /* F3 -> F6 (primary fails -> fallback provider) */
        '<g class="archm-edge" data-paths="fallback">' +
          '<line x1="549" y1="96" x2="549" y2="170" stroke="var(--am-warn)" stroke-width="1.8" marker-end="url(#fol-fsm-warn)"/>' +
          '<rect x="488" y="130" width="124" height="19" rx="8" fill="var(--am-bg)" stroke="var(--am-warn)" stroke-width="0.8"/>' +
          '<text x="550" y="143" text-anchor="middle" font-size="10" font-weight="600" fill="var(--am-warn)">主源故障 / 超时</text>' +
        '</g>' +

        /* F6 -> F4 (fallback ok) */
        '<g class="archm-edge" data-paths="fallback">' +
          '<path d="M 656 208 L 748 208 L 748 99" fill="none" stroke="var(--am-ok)" stroke-width="1.6" marker-end="url(#fol-fsm-ok)"/>' +
          '<rect x="668" y="148" width="136" height="19" rx="8" fill="var(--am-bg)" stroke="var(--am-border)" stroke-width="0.8"/>' +
          '<text x="736" y="161" text-anchor="middle" font-size="10" font-weight="600" fill="var(--am-ok)">保留备源 Provenance</text>' +
        '</g>' +

        /* F6 -> F8 (partial honest) */
        '<g class="archm-edge" data-paths="fallback abort">' +
          '<line x1="549" y1="242" x2="549" y2="294" stroke="var(--am-warn)" stroke-width="1.7" marker-end="url(#fol-fsm-warn)"/>' +
          '<rect x="481" y="256" width="136" height="19" rx="8" fill="var(--am-bg)" stroke="var(--am-warn)" stroke-width="0.8"/>' +
          '<text x="549" y="269" text-anchor="middle" font-size="10" font-weight="600" fill="var(--am-warn)">能力/字段仍缺失</text>' +
        '</g>' +

        /* F4, F8, F7 -> F9 (all terminals converge) */
        '<g class="archm-edge" data-paths="main fallback abort">' +
          '<path d="M 816 96 L 816 294" fill="none" stroke="var(--am-ok)" stroke-width="1.6" marker-end="url(#fol-fsm-ok)"/>' +
          '<line x1="650" y1="332" x2="684" y2="332" stroke="var(--am-ok)" stroke-width="1.6" marker-end="url(#fol-fsm-ok)"/>' +
          '<path d="M 300 366 L 300 384 L 772 384 L 772 370" fill="none" stroke="var(--am-err)" stroke-width="1.3" stroke-dasharray="3 3" marker-end="url(#fol-fsm-err)"/>' +
          '<rect x="444" y="375" width="192" height="17" rx="7" fill="var(--am-bg)" stroke="var(--am-border)" stroke-width="0.7"/>' +
          '<text x="540" y="387" text-anchor="middle" font-size="9.8" font-weight="600" fill="var(--am-muted)">释放单活跃锁 · 全终态归档投影</text>' +
        '</g>' +

        /* NODES */
        '<g class="archm-node" data-node="fsm-idle" data-paths="main fallback abort">' +
          '<rect class="node-box" x="20" y="30" width="124" height="64" rx="11" fill="var(--am-node-fill)" stroke="var(--am-border-strong)" stroke-width="1.4"/>' +
          '<text x="82" y="56" text-anchor="middle" font-size="12.5" font-weight="700" fill="var(--am-text)">Idle</text>' +
          '<text x="82" y="76" text-anchor="middle" font-size="10.8" fill="var(--am-muted)">挂载工作区上下文</text>' +
        '</g>' +

        '<g class="archm-node" data-node="fsm-locked" data-paths="main fallback abort">' +
          '<rect class="node-box" x="192" y="30" width="172" height="64" rx="11" fill="var(--am-node-fill)" stroke="var(--am-brand)" stroke-width="1.5"/>' +
          '<text x="278" y="56" text-anchor="middle" font-size="12.5" font-weight="700" fill="var(--am-text)">Locked &amp; Switched</text>' +
          '<text x="278" y="76" text-anchor="middle" font-size="10.8" fill="var(--am-muted)">单活跃锁 · 切 JSONL</text>' +
        '</g>' +

        '<g class="archm-node is-selected" data-node="fsm-exec" data-paths="main fallback abort">' +
          '<rect class="node-box" x="412" y="30" width="208" height="64" rx="11" fill="var(--am-node-fill)" stroke="var(--am-brand)" stroke-width="1.8"/>' +
          '<text x="516" y="56" text-anchor="middle" font-size="12.5" font-weight="700" fill="var(--am-text)">Executing (Privacy + Primary)</text>' +
          '<text x="516" y="76" text-anchor="middle" font-size="10.8" fill="var(--am-muted)">代码脱敏包装 → 主源并发查</text>' +
        '</g>' +

        '<g class="archm-node" data-node="fsm-done" data-paths="main fallback">' +
          '<rect class="node-box" x="668" y="30" width="188" height="64" rx="11" fill="var(--am-ok-soft)" stroke="var(--am-ok)" stroke-width="1.6"/>' +
          '<text x="762" y="56" text-anchor="middle" font-size="12.5" font-weight="700" fill="var(--am-ok)">Completed (Evidence)</text>' +
          '<text x="762" y="76" text-anchor="middle" font-size="10.8" fill="var(--am-text)">带溯源 ResearchReport</text>' +
        '</g>' +

        '<g class="archm-node" data-node="fsm-ext-deg" data-paths="fallback">' +
          '<rect class="node-box" x="192" y="174" width="196" height="68" rx="11" fill="var(--am-warn-soft)" stroke="var(--am-warn)" stroke-width="1.5"/>' +
          '<text x="290" y="201" text-anchor="middle" font-size="12.5" font-weight="700" fill="var(--am-warn)">Extension Degraded</text>' +
          '<text x="290" y="221" text-anchor="middle" font-size="10.8" fill="var(--am-text)">剥离可选扩展 · 核扩展保底</text>' +
        '</g>' +

        '<g class="archm-node" data-node="fsm-fallback" data-paths="fallback">' +
          '<rect class="node-box" x="444" y="174" width="210" height="68" rx="11" fill="var(--am-warn-soft)" stroke="var(--am-warn)" stroke-width="1.5"/>' +
          '<text x="549" y="201" text-anchor="middle" font-size="12.5" font-weight="700" fill="var(--am-warn)">Fallback Provider</text>' +
          '<text x="549" y="221" text-anchor="middle" font-size="10.8" fill="var(--am-text)">透明切备源 · 标明真实来源</text>' +
        '</g>' +

        '<g class="archm-node" data-node="fsm-abort" data-paths="abort">' +
          '<rect class="node-box" x="188" y="298" width="224" height="68" rx="11" fill="var(--am-err-soft)" stroke="var(--am-err)" stroke-width="1.6"/>' +
          '<text x="300" y="325" text-anchor="middle" font-size="12.5" font-weight="700" fill="var(--am-err)">Aborted / Timed Out</text>' +
          '<text x="300" y="345" text-anchor="middle" font-size="10.8" fill="var(--am-text)">透传取消信号 · 零无效降级</text>' +
        '</g>' +

        '<g class="archm-node" data-node="fsm-partial" data-paths="fallback abort">' +
          '<rect class="node-box" x="444" y="298" width="204" height="68" rx="11" fill="var(--am-node-fill)" stroke="var(--am-warn)" stroke-width="1.5" stroke-dasharray="5 3"/>' +
          '<text x="546" y="325" text-anchor="middle" font-size="12.5" font-weight="700" fill="var(--am-text)">Partial Honest</text>' +
          '<text x="546" y="345" text-anchor="middle" font-size="10.8" fill="var(--am-muted)">缺失项标明 — · 诚实披露缺口</text>' +
        '</g>' +

        '<g class="archm-node" data-node="fsm-eval" data-paths="main fallback abort">' +
          '<rect class="node-box" x="688" y="298" width="168" height="68" rx="11" fill="var(--am-ok-soft)" stroke="var(--am-ok)" stroke-width="1.5"/>' +
          '<text x="772" y="325" text-anchor="middle" font-size="12.5" font-weight="700" fill="var(--am-ok)">Trace &amp; Eval</text>' +
          '<text x="772" y="345" text-anchor="middle" font-size="10.8" fill="var(--am-text)">只读投影 · 回归门禁</text>' +
        '</g>' +

        /* Clean bottom legend bar */
        '<rect x="20" y="402" width="840" height="24" rx="7" fill="var(--am-plane-fill)" stroke="var(--am-border)" stroke-width="0.9"/>' +
        '<circle cx="40" cy="414" r="4" fill="var(--am-brand)"/>' +
        '<text x="50" y="418" font-size="10.5" font-weight="600" fill="var(--am-muted)">单活跃锁主执行链</text>' +
        '<circle cx="192" cy="414" r="4" fill="var(--am-warn)"/>' +
        '<text x="202" y="418" font-size="10.5" font-weight="600" fill="var(--am-muted)">扩展降级与主备路由</text>' +
        '<circle cx="354" cy="414" r="4" fill="var(--am-err)"/>' +
        '<text x="364" y="418" font-size="10.5" font-weight="600" fill="var(--am-muted)">ABORT 立刻中断边界</text>' +
        '<circle cx="520" cy="414" r="4" fill="var(--am-ok)"/>' +
        '<text x="530" y="418" font-size="10.5" font-weight="600" fill="var(--am-muted)">溯源归档与评测收敛</text>' +
        '<text x="848" y="418" text-anchor="end" font-size="10" fill="var(--am-muted)">点击任意状态查看边界</text>' +
      '</svg>'
    );
  }

  function renderHighlightsHtml() {
    return (
      '<div class="archm-grid">' +
        HIGHLIGHTS.map(function (h) {
          return (
            '<article class="archm-card">' +
              '<div class="archm-card-top">' +
                '<span class="archm-card-tag">' + h.tag + '</span>' +
                '<span class="archm-card-guard">' + h.guard + '</span>' +
              '</div>' +
              '<h3>' + h.title + '</h3>' +
              '<p class="archm-kv"><strong>痛点：</strong>' + h.pain + '</p>' +
              '<p class="archm-kv"><strong>设计：</strong>' + h.design + '</p>' +
            '</article>'
          );
        }).join('') +
      '</div>' +
      '<div class="archm-tech-strip">' +
        '<span class="archm-tech-label">架构组成</span>' +
        TECH_TAGS.map(function (t) { return '<span class="archm-chip">' + t + '</span>'; }).join('') +
      '</div>'
    );
  }

  function markSeen() {
    try { localStorage.setItem(STORAGE_KEY, '1'); } catch (e) {}
  }

  function openModal(initialTab) {
    injectStyles();
    var existing = document.getElementById(MODAL_ID);
    if (existing) existing.remove();

    var activeTab = initialTab || 'arch';
    var activeFsmPath = 'all';
    var selectedNode = { arch: 'arch-privacy', fsm: 'fsm-exec' };

    var wrap = document.createElement('div');
    wrap.className = 'archm-backdrop';
    wrap.id = MODAL_ID;
    wrap.setAttribute('role', 'dialog');
    wrap.setAttribute('aria-modal', 'true');
    wrap.setAttribute('aria-labelledby', 'folio-archm-title');

    function close() {
      markSeen();
      document.removeEventListener('keydown', onKey);
      wrap.remove();
    }

    function onKey(e) {
      if (e.key === 'Escape') close();
    }

    function renderCallout(nodeId) {
      var info = NODE_NOTES[nodeId];
      if (!info) return '';
      return (
        '<div class="archm-callout">' +
          '<div class="archm-callout-head">' +
            '<span class="archm-callout-badge">' + info.badge + '</span>' +
            '<span class="archm-callout-title">' + info.title + '</span>' +
          '</div>' +
          '<p class="archm-callout-body">' + info.body + '</p>' +
        '</div>'
      );
    }

    function applyFsmFilter() {
      if (activeTab !== 'fsm') return;
      var nodes = wrap.querySelectorAll('.archm-svg [data-paths]');
      for (var i = 0; i < nodes.length; i++) {
        var el = nodes[i];
        if (activeFsmPath === 'all') {
          el.classList.remove('archm-dim');
        } else {
          var paths = (el.getAttribute('data-paths') || '').split(/\s+/);
          if (paths.indexOf(activeFsmPath) >= 0) el.classList.remove('archm-dim');
          else el.classList.add('archm-dim');
        }
      }
    }

    function renderContent() {
      var toolbarRight = activeTab === 'fsm'
        ? '<div class="archm-filters">' +
            '<button class="archm-pill ' + (activeFsmPath === 'all' ? 'active' : '') + '" data-fsm-path="all" type="button">全部路径</button>' +
            '<button class="archm-pill ' + (activeFsmPath === 'main' ? 'active' : '') + '" data-fsm-path="main" type="button">标准投研主链</button>' +
            '<button class="archm-pill ' + (activeFsmPath === 'fallback' ? 'active' : '') + '" data-fsm-path="fallback" type="button">扩展与备源降级</button>' +
            '<button class="archm-pill ' + (activeFsmPath === 'abort' ? 'active' : '') + '" data-fsm-path="abort" type="button">取消与诚实收敛</button>' +
          '</div>'
        : activeTab === 'arch'
          ? '<span class="archm-hint">点击图中任意架构模块，查看设计边界说明</span>'
          : '<span class="archm-hint">痛点 → 架构设计 → 工程保障（简历亮点同步）</span>';

      var bodyHtml = '';
      if (activeTab === 'arch') {
        bodyHtml = '<div class="archm-svg-stage">' + renderArchSvg() + '</div>' + renderCallout(selectedNode.arch);
      } else if (activeTab === 'fsm') {
        bodyHtml = '<div class="archm-svg-stage">' + renderFsmSvg() + '</div>' + renderCallout(selectedNode.fsm);
      } else {
        bodyHtml = renderHighlightsHtml();
      }

      wrap.innerHTML =
        '<div class="archm-dialog">' +
          '<header class="archm-head">' +
            '<div class="archm-head-left">' +
              '<div class="archm-logo" aria-hidden="true">' +
                '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 3.5 20.5 18.5H3.5Z" stroke="#0369a1" stroke-width="2" stroke-linejoin="round"/><circle cx="12" cy="14.2" r="2.4" fill="#0ea5e9"/></svg>' +
              '</div>' +
              '<div>' +
                '<div class="archm-title-row">' +
                  '<h2 class="archm-title" id="folio-archm-title">明澈 · 设计架构导览</h2>' +
                  '<span class="archm-kicker">欢迎，Harveydu · 本地优先投研工作台 · 只读证据闭环</span>' +
                '</div>' +
                '<p class="archm-sub">围绕「代码级持仓隐私脱敏、异构数据源主备路由、单进程可控运行时收敛与只读 Trace/Eval 门禁」构建零交易风险的投研 Agent 架构。</p>' +
              '</div>' +
            '</div>' +
            '<button class="archm-close" id="archm-close" type="button" aria-label="关闭">✕</button>' +
          '</header>' +

          '<div class="archm-toolbar">' +
            '<div class="archm-tabs" role="tablist">' +
              '<button class="archm-tab ' + (activeTab === 'arch' ? 'active' : '') + '" data-tab="arch" role="tab" type="button"><span class="archm-tab-num">01</span> 架构全景</button>' +
              '<button class="archm-tab ' + (activeTab === 'fsm' ? 'active' : '') + '" data-tab="fsm" role="tab" type="button"><span class="archm-tab-num">02</span> 核心状态机</button>' +
              '<button class="archm-tab ' + (activeTab === 'highlights' ? 'active' : '') + '" data-tab="highlights" role="tab" type="button"><span class="archm-tab-num">03</span> 核心架构亮点</button>' +
            '</div>' +
            toolbarRight +
          '</div>' +

          '<div class="archm-body">' + bodyHtml + '</div>' +

          '<footer class="archm-foot">' +
            '<div class="archm-foot-note">展示完整桌面端设计架构 · 当前演示站使用内置模拟快照与只读示例持仓 · 由 Harveydu 搭建</div>' +
            '<div class="archm-foot-actions">' +
              '<button class="archm-btn primary" id="archm-enter" type="button">进入投研演示</button>' +
            '</div>' +
          '</footer>' +
        '</div>';

      wrap.querySelector('#archm-close').onclick = close;
      wrap.querySelector('#archm-enter').onclick = close;

      var tabBtns = wrap.querySelectorAll('[data-tab]');
      for (var i = 0; i < tabBtns.length; i++) {
        tabBtns[i].onclick = function () {
          activeTab = this.getAttribute('data-tab');
          renderContent();
        };
      }

      var fsmBtns = wrap.querySelectorAll('[data-fsm-path]');
      for (var j = 0; j < fsmBtns.length; j++) {
        fsmBtns[j].onclick = function () {
          activeFsmPath = this.getAttribute('data-fsm-path');
          renderContent();
        };
      }

      var nodeEls = wrap.querySelectorAll('.archm-node[data-node]');
      var currentSel = activeTab === 'arch' ? selectedNode.arch : selectedNode.fsm;
      for (var k = 0; k < nodeEls.length; k++) {
        var el = nodeEls[k];
        if (el.getAttribute('data-node') === currentSel) el.classList.add('is-selected');
        else el.classList.remove('is-selected');
        el.onclick = function () {
          var id = this.getAttribute('data-node');
          if (activeTab === 'arch') selectedNode.arch = id;
          else if (activeTab === 'fsm') selectedNode.fsm = id;
          renderContent();
        };
      }

      applyFsmFilter();
    }

    wrap.addEventListener('click', function (e) {
      if (e.target === wrap) close();
    });
    document.addEventListener('keydown', onKey);
    document.body.appendChild(wrap);
    renderContent();
  }

  window.openProjectArchModal = openModal;

  function autoMount() {
    if (document.getElementById(MODAL_ID)) return;
    try {
      if (localStorage.getItem(STORAGE_KEY)) return;
    } catch (e) {}
    openModal('arch');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', autoMount);
  } else {
    autoMount();
  }
})();
