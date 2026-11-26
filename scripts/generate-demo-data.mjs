// Regenerates the demo data block of public/data.js from the deterministic generators.
// Static configuration (nav, models, discovery tasks, skills) is copied verbatim from the
// current file, so only snapshot/narrative blocks are replaced.
//
//   node scripts/generate-demo-data.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import { buildSnapshot } from './lib/demo-market.mjs';
import { buildNarrative, buildHoldings, holdingsMeta } from './lib/demo-narrative.mjs';
import { retext } from './lib/provider-copy.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dataPath = join(root, 'public', 'data.js');

// Split the existing file into `window.X = ...;` blocks so static blocks can be reused verbatim.
function splitBlocks(source) {
  const start = source.indexOf('window.');
  const blocks = new Map();
  const re = /^window\.([A-Za-z_$][\w$]*)\s*=/gm;
  const marks = [];
  let m;
  while ((m = re.exec(source))) marks.push({ name: m[1], index: m.index });
  for (let i = 0; i < marks.length; i++) {
    const end = i + 1 < marks.length ? marks[i + 1].index : source.length;
    blocks.set(marks[i].name, source.slice(marks[i].index, end).trimEnd());
  }
  return blocks;
}

const STATIC_BLOCKS = ['FOLIO_NAV_ITEMS', 'FOLIO_MODELS', 'FOLIO_DISCOVER_TASKS', 'FOLIO_SKILLS_DEFAULT'];

const source = readFileSync(dataPath, 'utf8');
const blocks = splitBlocks(source);
for (const name of STATIC_BLOCKS) {
  if (!blocks.has(name)) throw new Error(`static block ${name} not found in data.js`);
}

const snapshot = buildSnapshot();
const port = buildHoldings(snapshot);
const narrative = buildNarrative(snapshot, port, {});

// Wire holding metadata (weight/percentage) used by the portfolio view.
const holdings = port.rows.map((r) => {
  const meta = {
    'NVDA.US': ['AI 半导体', '回调分批建仓，当前处于浮亏观察区'],
    'AVGO.US': ['AI 半导体', '定制 ASIC 与以太网交换芯片核心仓位'],
    'MSFT.US': ['云与企业软件', '核心底仓，现金流稳健压舱石'],
    'AAPL.US': ['终端生态', '防御型核心资产'],
    'GOOGL.US': ['互联网与云', '搜索与云业务底仓'],
    'TSLA.US': ['智驾与储能', '高弹性卫星仓位，严格控制仓位上限'],
  }[r.symbol];
  return {
    id: `pos-${r.symbol.split('.')[0].toLowerCase()}`,
    symbol: r.symbol,
    qty: r.qty,
    avgCost: Number(r.avgCost.toFixed(2)),
    cluster: meta[0],
    note: meta[1],
  };
});

const initialState = {
  theme: 'light',
  sidebarCollapsed: false,
  copilotOpen: true,
  activeSymbol: 'NVDA.US',
  workspaceTab: 'chart',
  klinePeriod: '1d',
  klineHoverIdx: null,
  showEma: true,
  discoverTaskId: 'oversold-rsi',
  compareSymbols: ['NVDA.US', 'AVGO.US', 'MSFT.US', 'AAPL.US'],
  researchStrategy: '综合策略',
  researchRunning: false,
  activeThesisId: 'thesis-nvda-1',
  selectedSkillId: 'longbridge-market-data',
  evalTab: 'overview',
  settingsTab: 'connections',
  copilotModel: 'deepseek-v4.1-flash',
  copilotThinking: 'High',
  activeScenarioId: 'portfolio-audit',
  yahooSourceMode: 'snapshot',
  yahooLastSync: snapshot.fetchedAt,
  watchlist: ['NVDA.US', 'AVGO.US', 'MSFT.US', 'AAPL.US', 'GOOGL.US', 'TSLA.US', 'AMZN.US', 'META.US', '0700.HK'],
  cashUsd: port.cash,
  holdings,
  theses: narrative.theses,
  alerts: narrative.alerts,
  skills: JSON.parse(blocks.get('FOLIO_SKILLS_DEFAULT').replace(/^window\.FOLIO_SKILLS_DEFAULT\s*=\s*/, '').replace(/;\s*$/, '')),
  copilotTurns: [
    {
      id: 'turn-init-1',
      scenarioId: 'portfolio-audit',
      prompt: '结合当前行情快照，帮我复核演示投资组合的集中度（HHI）、AI 半导体敞口与回撤风险，哪些仓位最需要优先处理或重点盯防？',
      time: '14:48',
      modelKey: 'deepseek-v4.1-flash',
    },
  ],
};

const j = (value) => JSON.stringify(value, null, 2);
const out = `'use strict';

// Demo data for the Limpid workspace.
// Everything below is SYNTHETIC: prices, candles, reports and copilot replies are generated
// deterministically by scripts/generate-demo-data.mjs (seed fixed, no network access).
// Regenerate with: node scripts/generate-demo-data.mjs

${blocks.get('FOLIO_NAV_ITEMS')}

${blocks.get('FOLIO_MODELS')}

window.FOLIO_MARKET_SNAPSHOT = ${JSON.stringify(snapshot)};

window.FOLIO_RESEARCH_REPORTS = ${JSON.stringify(narrative.research)};

window.FOLIO_COPILOT_SCENARIOS = ${JSON.stringify(narrative.copilotScenarios)};

${blocks.get('FOLIO_DISCOVER_TASKS')}

${blocks.get('FOLIO_SKILLS_DEFAULT')}

window.FOLIO_DEMO_EVENTS = ${JSON.stringify(narrative.events, null, 2)};

window.FOLIO_EVAL_SUMMARY = ${JSON.stringify(narrative.evalSummary, null, 2)};

window.createInitialFolioState = function createInitialFolioState() {
  return ${j(initialState)};
};
`;

// Rebrand data-source copy in the static blocks (skills, discovery tasks) too.
const branded = retext(out);

// Sanity: the generated file must evaluate and expose every expected key.
const sandbox = { window: {}, console };
vm.createContext(sandbox);
vm.runInContext(branded, sandbox, { filename: 'data.generated.js' });
for (const key of ['FOLIO_NAV_ITEMS', 'FOLIO_MODELS', 'FOLIO_MARKET_SNAPSHOT', 'FOLIO_RESEARCH_REPORTS',
  'FOLIO_COPILOT_SCENARIOS', 'FOLIO_DISCOVER_TASKS', 'FOLIO_SKILLS_DEFAULT', 'FOLIO_DEMO_EVENTS',
  'FOLIO_EVAL_SUMMARY', 'createInitialFolioState']) {
  if (sandbox.window[key] === undefined) throw new Error(`generated data is missing ${key}`);
}
const st = sandbox.window.createInitialFolioState();
if (!Array.isArray(st.holdings) || st.holdings.length === 0) throw new Error('generated state has no holdings');

writeFileSync(dataPath, branded);
const kb = (JSON.stringify(snapshot).length / 1024).toFixed(0);
console.log(`data.js regenerated: ${kb} KB snapshot, ${narrative.theses.length} theses, ${narrative.alerts.length} alerts, ${st.holdings.length} holdings`);
console.log(`total portfolio value: $${port.total.toFixed(2)} (cash $${port.cash.toFixed(2)})`);
