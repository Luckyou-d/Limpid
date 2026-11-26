// Deterministic synthetic market data for the Limpid demo.
// No network access, no real market data: the same seed always produces the same prices.
// All quote fields are computed from the generated price series, so charts and narrative stay consistent.

// Mulberry32: tiny deterministic PRNG.
export function createRandom(seed) {
  let a = seed >>> 0;
  return function random() {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Standard normal via Box-Muller.
function normal(random) {
  const u = Math.max(random(), 1e-9);
  const v = random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

const round = (v, d = 2) => Number(v.toFixed(d));
const iso = (d) => d.toISOString().slice(0, 10);

// US market dates: weekdays only, ending on `end`.
function tradingDays(count, end) {
  const days = [];
  const cursor = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate()));
  while (days.length < count) {
    const dow = cursor.getUTCDay();
    if (dow !== 0 && dow !== 6) days.push(new Date(cursor));
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }
  return days.reverse();
}

function ema(values, span) {
  const k = 2 / (span + 1);
  let prev = values[0];
  return values.map((v, i) => (i === 0 ? (prev = v) : (prev = v * k + prev * (1 - k))));
}

// Simple RSI (Wilder smoothing) over closes.
function rsi(closes, period = 14) {
  if (closes.length <= period) return 50;
  let gain = 0;
  let loss = 0;
  for (let i = 1; i <= period; i++) {
    const d = closes[i] - closes[i - 1];
    if (d >= 0) gain += d; else loss -= d;
  }
  gain /= period;
  loss /= period;
  for (let i = period + 1; i < closes.length; i++) {
    const d = closes[i] - closes[i - 1];
    gain = (gain * (period - 1) + Math.max(d, 0)) / period;
    loss = (loss * (period - 1) + Math.max(-d, 0)) / period;
  }
  if (loss === 0) return 100;
  const rs = gain / loss;
  return round(100 - 100 / (1 + rs), 1);
}

const avg = (arr) => arr.reduce((a, b) => a + b, 0) / arr.length;
const pct = (a, b) => round(((a - b) / b) * 100, 2);

// Generate one symbol's daily series with a drift + volatility regime.
function generateSeries(spec, random, days) {
  const { startPrice, drift, vol, volumeBase, shock } = spec;
  const bars = [];
  let price = startPrice;
  for (let i = 0; i < days.length; i++) {
    const progress = i / (days.length - 1);
    // Trend: drift per day, with a mid-series regime shift for a few names.
    let dailyDrift = drift;
    if (shock && progress >= shock.at) dailyDrift += shock.extra;
    // Mean reversion keeps index levels (especially VIX) inside a believable band.
    if (spec.revert) dailyDrift += ((spec.mean - price) / price) * spec.revert;
    const ret = dailyDrift + normal(random) * vol;
    const open = price;
    const close = Math.max(1, open * (1 + ret));
    const swing = Math.abs(normal(random)) * vol * 0.8;
    const high = Math.max(open, close) * (1 + swing * random());
    const low = Math.min(open, close) * (1 - swing * random());
    const volume = Math.round(volumeBase * (0.7 + random() * 0.5) * (1 + Math.abs(ret) * 12));
    bars.push({
      time: iso(days[i]),
      timestamp: Math.floor(days[i].getTime() / 1000) + 20 * 3600,
      open: round(open),
      high: round(high),
      low: round(low),
      close: round(close),
      volume,
    });
    price = close;
  }
  return bars;
}

// Aggregate daily bars into weekly (Friday-ending) bars.
function toWeekly(bars) {
  const weeks = [];
  let bucket = [];
  for (const bar of bars) {
    bucket.push(bar);
    const day = new Date(`${bar.time}T00:00:00Z`).getUTCDay();
    if (day === 5) { weeks.push(bucket); bucket = []; }
  }
  if (bucket.length) weeks.push(bucket);
  return weeks.map((w) => ({
    time: w[w.length - 1].time,
    timestamp: w[w.length - 1].timestamp,
    open: w[0].open,
    high: round(Math.max(...w.map((b) => b.high))),
    low: round(Math.min(...w.map((b) => b.low))),
    close: w[w.length - 1].close,
    volume: w.reduce((sum, b) => sum + b.volume, 0),
  }));
}

function withEma(bars) {
  for (const span of [6, 12, 20]) {
    const values = ema(bars.map((b) => b.close), span);
    bars.forEach((b, i) => { b[`ema${span}`] = round(values[i]); });
  }
  return bars;
}

function sma(closes, n) {
  if (closes.length < n) return round(avg(closes));
  return round(avg(closes.slice(-n)));
}

// Build the full quote object for one symbol from its bars.
export function buildQuote(symbol, meta, bars, weekly) {
  const closes = bars.map((b) => b.close);
  const last = bars[bars.length - 1];
  const prev = bars[bars.length - 2];
  const price = last.close;
  const window60 = bars.slice(-60);
  const high60 = round(Math.max(...window60.map((b) => b.high)));
  const low60 = round(Math.min(...window60.map((b) => b.low)));
  const vol20 = avg(bars.slice(-20).map((b) => b.volume));
  const change = round(price - prev.close);
  const ago = (n) => bars[Math.max(0, bars.length - 1 - n)].close;

  return {
    symbol,
    yahooTicker: meta.ticker,
    name: meta.name,
    sectorTag: meta.sectorTag,
    currency: 'USD',
    exchange: 'NasdaqGS',
    timezone: 'America/New_York',
    price,
    prevClose: prev.close,
    change,
    changePct: round((change / prev.close) * 100),
    open: last.open,
    high: last.high,
    low: last.low,
    volume: last.volume,
    avgVolume20d: Math.round(vol20),
    volumeRatio: round(last.volume / vol20),
    fiftyTwoWeekHigh: round(Math.max(...bars.map((b) => b.high))),
    fiftyTwoWeekLow: round(Math.min(...bars.map((b) => b.low))),
    sma20: sma(closes, 20),
    sma50: sma(closes, 50),
    rsi14: rsi(closes),
    drawdown60d: pct(price, high60),
    high60d: high60,
    low60d: low60,
    ret5d: pct(price, ago(5)),
    ret1m: pct(price, ago(21)),
    ret3m: pct(price, ago(63 > bars.length - 1 ? bars.length - 1 : 63)),
    ret6m: pct(price, bars[0].close),
    ret1y: pct(price, bars[0].close),
    marketTimestamp: last.timestamp,
    marketTimeUtc: `${last.time} 21:00 UTC`,
    provider: 'Limpid Demo Feed',
    delayed: true,
    daily: withEma(bars.map((b) => ({ ...b }))),
    weekly: withEma(weekly.map((b) => ({ ...b }))),
  };
}

// Deterministic synthetic data for the demo workspace. Values are illustrative only.
export const SYMBOL_SPECS = [
  { symbol: 'NVDA.US', ticker: 'NVDA', name: 'NVIDIA Corporation', sectorTag: '半导体 · AI 算力', seed: 1001, startPrice: 138, drift: 0.0018, vol: 0.021, volumeBase: 210_000_000, shock: { at: 0.62, extra: -0.006 } },
  { symbol: 'AVGO.US', ticker: 'AVGO', name: 'Broadcom Inc.', sectorTag: '定制 ASIC · 网络芯片', seed: 1010, startPrice: 265, drift: 0.0014, vol: 0.017, volumeBase: 24_000_000 },
  { symbol: 'MSFT.US', ticker: 'MSFT', name: 'Microsoft Corporation', sectorTag: '云与企业软件', seed: 1003, startPrice: 415, drift: 0.0008, vol: 0.011, volumeBase: 21_000_000 },
  { symbol: 'AAPL.US', ticker: 'AAPL', name: 'Apple Inc.', sectorTag: '终端生态', seed: 1004, startPrice: 232, drift: 0.0006, vol: 0.010, volumeBase: 48_000_000 },
  { symbol: 'GOOGL.US', ticker: 'GOOGL', name: 'Alphabet Inc.', sectorTag: '搜索与云', seed: 1005, startPrice: 176, drift: 0.0009, vol: 0.012, volumeBase: 27_000_000 },
  { symbol: 'TSLA.US', ticker: 'TSLA', name: 'Tesla, Inc.', sectorTag: '智驾与储能', seed: 1006, startPrice: 288, drift: -0.0004, vol: 0.026, volumeBase: 92_000_000 },
  { symbol: 'AMZN.US', ticker: 'AMZN', name: 'Amazon.com, Inc.', sectorTag: '电商履约 · AWS 云', seed: 1007, startPrice: 196, drift: 0.0011, vol: 0.013, volumeBase: 39_000_000 },
  { symbol: 'META.US', ticker: 'META', name: 'Meta Platforms, Inc.', sectorTag: '社交广告 · 推荐系统', seed: 1008, startPrice: 512, drift: 0.0010, vol: 0.016, volumeBase: 15_000_000 },
];

export const INDEX_SPECS = [
  { symbol: 'SPX.US', ticker: '^GSPC', name: 'S&P 500', seed: 2001, startPrice: 6420, drift: 0.0001, vol: 0.007, revert: 0.01, mean: 6420, volumeBase: 2_400_000_000 },
  { symbol: 'NDX.US', ticker: '^NDX', name: 'Nasdaq 100', seed: 2002, startPrice: 22400, drift: 0.0002, vol: 0.009, revert: 0.01, mean: 22400, volumeBase: 1_100_000_000 },
  { symbol: 'DJI.US', ticker: '^DJI', name: 'Dow Jones', seed: 2003, startPrice: 44200, drift: 0.0001, vol: 0.006, revert: 0.01, mean: 44200, volumeBase: 620_000_000 },
  { symbol: 'VIX.US', ticker: '^VIX', name: 'CBOE VIX', seed: 2004, startPrice: 17, drift: 0, vol: 0.035, revert: 0.06, mean: 17, volumeBase: 120_000_000 },
];

// Build the whole snapshot. `end` is the last trading day.
export function buildSnapshot({ end = new Date(Date.UTC(2026, 10, 18)), historyBars = 270, chartBars = 65 } = {}) {
  // Generate a long history so 1M/3M/1Y returns and 52 weekly bars are real,
  // then keep the most recent `chartBars` daily bars for the candle chart.
  const days = tradingDays(historyBars, end);
  const equities = {};
  for (const spec of SYMBOL_SPECS) {
    const random = createRandom(spec.seed);
    const full = generateSeries(spec, random, days);
    const weekly = toWeekly(full).slice(-52);
    equities[spec.symbol] = buildQuote(spec.symbol, spec, full.slice(-chartBars), weekly);
  }
  const indices = {};
  for (const spec of INDEX_SPECS) {
    const random = createRandom(spec.seed);
    const full = generateSeries(spec, random, days);
    const quote = buildQuote(spec.symbol, spec, full.slice(-chartBars), toWeekly(full).slice(-52));
    indices[spec.symbol] = {
      symbol: quote.symbol,
      yahooTicker: quote.yahooTicker,
      name: quote.name,
      price: quote.price,
      prevClose: quote.prevClose,
      change: quote.change,
      changePct: quote.changePct,
      ret1m: quote.ret1m,
      spark: quote.daily.slice(-30).map((b) => b.close),
      provider: quote.provider,
      delayed: quote.delayed,
    };
  }
  return { fetchedAt: `${iso(end)}T21:00:00.000000+00:00`, equities, indices };
}
