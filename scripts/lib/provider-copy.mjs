// Single source of truth for data-source copy in the UI.
// The demo runs on synthetic data, so user-facing references to the old feed name are
// rewritten here. Identifiers are preserved: `refreshYahooData`, `refreshYahooMobile`,
// `refreshingYahoo`, `yahooTicker`, `state.yahooSourceMode` and `requires: 'yahoo'`
// must keep their names, so prose-only patterns use word boundaries.

export const SOURCE_NAME = 'Limpid Demo Feed';

// Prose replacements, applied in order: longer phrases first.
const PHRASES = [
  ['行情源: Yahoo Finance · Delayed', `行情源: ${SOURCE_NAME} · 模拟快照`],
  ['Yahoo Finance · Delayed', `${SOURCE_NAME} · 模拟快照`],
  ['Yahoo Finance Delayed', `${SOURCE_NAME} · 模拟快照`],
  ['Yahoo Finance (v8 Chart)', `${SOURCE_NAME}（内置模拟数据）`],
  ['Yahoo Finance 适配器不支持港股/A股行情', '模拟行情源不支持港股/A股行情'],
  ['明澈 中的 Yahoo Finance 通道仅提供美股', '明澈 中的模拟行情通道仅提供美股'],
  ['Yahoo Finance 仅提供美股价格与日/周 K 线', '模拟行情源仅提供美股价格与日/周 K 线'],
  ['在仅启用 Yahoo Finance 免费 chart 接口时', '在仅启用内置模拟快照时'],
  ['Yahoo Finance 报价计算', '模拟行情报价计算'],
  ['基于当前 Yahoo Finance 报价', '基于当前模拟行情报价'],
  ['Yahoo Finance 数据同步时间', '模拟行情数据时间'],
  ['已接入: Yahoo Finance (8 只美股观察池)', '已接入: 模拟快照 (8 只美股观察池)'],
  ['Yahoo Finance (Delayed)', `${SOURCE_NAME} (模拟快照)`],
  ['Yahoo Finance (8 只美股观察池)', '模拟快照 (8 只美股观察池)'],
  ['Yahoo Finance 美股日/周线', '模拟行情美股日/周线'],
  ['仅接入 Yahoo Finance', '仅接入模拟快照'],
  ['Yahoo Finance · 1D & 1W OHLCV', `${SOURCE_NAME} · 1D & 1W OHLCV`],
  ['Yahoo Finance · Meta', `${SOURCE_NAME} · Meta`],
  ['Yahoo Finance 仅提供日线', '模拟快照仅提供日线'],
  ['Yahoo Finance 仅覆盖美股延迟行情', '模拟行情源仅覆盖美股延迟行情'],
  ['从 Yahoo Finance 同步', '同步模拟行情'],
  ['请求 Yahoo Finance 同步延迟行情', '重新载入内置模拟快照'],
  ['同步 Yahoo Finance 行情', '同步模拟行情'],
  ['刷新 Yahoo 行情', '刷新模拟行情'],
  ['Yahoo 延迟报价', '模拟行情报价'],
  ['完全就绪 (Yahoo)', '完全就绪 (快照)'],
  ['部分就绪 (Yahoo 覆盖核心)', '部分就绪 (快照覆盖核心)'],
  ['多周期回报与技术结构 (Yahoo)', '多周期回报与技术结构 (模拟)'],
  ['最新价格 (Yahoo)', '最新价格 (模拟)'],
  ['最新价 (Yahoo)', '最新价 (模拟)'],
  ['自选 (Yahoo)', '自选 (模拟)'],
  ['Yahoo 可用', '快照可用'],
  ['Yahoo 行情', '模拟行情'],
];

// Final sweep: any remaining bare word "Yahoo" in prose. The lookarounds keep it away from
// identifiers (`refreshYahooData`) and existing hyphenated keys (`refresh-yahoo`).
const BARE_WORD = /(?<![A-Za-z0-9_$.-])Yahoo(?![A-Za-z0-9_$-])/g;

export function retext(source) {
  let out = source;
  for (const [from, to] of PHRASES) out = out.split(from).join(to);
  out = out.replace(BARE_WORD, '模拟');
  // Clean up half-swapped leftovers such as "模拟 Finance"/"模拟 Snapshot".
  out = out.replace(/模拟 Finance/g, SOURCE_NAME);
  out = out.replace(/模拟 Snapshot/g, '模拟快照');
  out = out.replace(/模拟 Delayed/g, '模拟延迟');
  // tidy double spaces introduced by phrase swaps
  out = out.replace(/模拟 (行情|快照|延迟)/g, '模拟$1');
  return out.replace(/ {2,}(S)/g, ' $1');
}
