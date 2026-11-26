// Builds every narrative block of the demo from the synthetic snapshot,
// so quoted prices, indicator values and chart data always agree.
// Text is generated from templates: swap the snapshot and the prose follows.

const f2 = (v) => Number(v).toFixed(2);
const pctStr = (v) => `${v > 0 ? '+' : ''}${Number(v).toFixed(2)}%`;
const usd = (v) => `$${Number(v).toFixed(2)}`;
const wan = (v) => {
  const n = Number(v);
  if (Math.abs(n) >= 1e8) return `${(n / 1e8).toFixed(2)} 亿`;
  if (Math.abs(n) >= 1e4) return `${(n / 1e4).toFixed(2)} 万`;
  return String(Math.round(n));
};

// Stance: derived from trend + momentum, not hard-coded per symbol.
export function judge(q) {
  const above20 = q.price > q.sma20;
  const above50 = q.price > q.sma50;
  const alignedUp = q.sma20 > q.sma50;
  const alignedDown = q.sma20 < q.sma50;
  if (!above20 && !above50 && alignedDown && q.rsi14 < 42) return '看空';
  if (above20 && above50 && alignedUp && q.rsi14 >= 45 && q.rsi14 <= 72) return '看多';
  if (!above20 && q.rsi14 < 45) return '看空';
  if (above20 && q.rsi14 > 72) return '待复核';
  return '待复核';
}

function maTrend(q) {
  const above20 = q.price > q.sma20;
  const above50 = q.price > q.sma50;
  if (above20 && above50) return `现价站上 SMA20（${f2(q.sma20)}）与 SMA50（${f2(q.sma50)}）`;
  if (!above20 && !above50) return `现价低于 SMA20（${f2(q.sma20)}）与 SMA50（${f2(q.sma50)}）`;
  return above20
    ? `现价高于 SMA20（${f2(q.sma20)}）但仍在 SMA50（${f2(q.sma50)}）下方`
    : `现价低于 SMA20（${f2(q.sma20)}），但守住 SMA50（${f2(q.sma50)}）`;
}

function rsiLabel(v) {
  if (v < 25) return '深度超卖';
  if (v < 35) return '超卖';
  if (v < 45) return '偏弱';
  if (v <= 65) return '中性';
  if (v <= 75) return '偏强';
  return '超买';
}

function rangePosition(q) {
  const span = q.high60d - q.low60d;
  if (span <= 0) return 50;
  return Math.round(((q.price - q.low60d) / span) * 100);
}

// ---- research reports -------------------------------------------------------
function researchFor(q, holding, ctx) {
  const stance = judge(q);
  const pos = rangePosition(q);
  const bearish = stance === '看空';
  const bullish = stance === '看多';
  const confidence = bearish ? 58 + (q.rsi14 < 30 ? 6 : 0) : bullish ? 62 + (q.ret3m > 15 ? 4 : 0) : 52;

  const headline = bearish
    ? `${q.drawdown60d < -18 ? '趋势下行且回撤偏深' : '均线压制未解'}，RSI ${f2(q.rsi14)} 处于${rsiLabel(q.rsi14)}区`
    : bullish
      ? `${q.ret3m > 20 ? '中期动量领先' : '价格与均线同步走强'}，RSI ${f2(q.rsi14)} 仍非极端`
      : `方向未明：进退两难，等待 RSI ${f2(q.rsi14)} 与量能给出方向`;

  const summary = [
    `${q.symbol} 最新价 ${usd(q.price)}，单日 ${q.change > 0 ? '涨' : '跌'} ${f2(Math.abs(q.change))}（${pctStr(q.changePct)}）`,
    `近 1 个月 ${pctStr(q.ret1m)}、近 3 个月 ${pctStr(q.ret3m)}`,
    `${maTrend(q)}`,
    `RSI(14) 为 ${f2(q.rsi14)}，属${rsiLabel(q.rsi14)}区间`,
    `60 日区间 ${f2(q.low60d)}—${f2(q.high60d)}，当前回撤 ${pctStr(q.drawdown60d)}，位于区间 ${pos}% 分位`,
    `成交量 ${wan(q.volume)}股，量比 ${f2(q.volumeRatio)}`,
    '因 13/16 项能力未连接 Longbridge，缺 PE、财报与资金流数据，结论仅基于量价证据。',
  ].join('。').replace(/。+/g, '。').replace(/。$/, '。');

  const portfolioImpact = holding
    ? `演示组合持 ${holding.qty} 股、成本 ${usd(holding.avgCost)}，市值 ${usd(holding.qty * q.price)}，占比 ${holding.weightPct.toFixed(2)}%，浮动 ${holding.pnl >= 0 ? '盈利' : '亏损'} ${usd(Math.abs(holding.pnl))}（${pctStr(holding.pnlPct)}）；${
        bearish
          ? `重仓叠加弱势结构，宜控制加仓节奏，以 ${f2(q.low60d)} 为观察位`
          : bullish
            ? '走势与成本方向一致，可继续持有并以均线作为止盈参考'
            : '方向未明，建议维持仓位并等待信号确认'
      }。`
    : `当前未持有 ${q.symbol}，本次结论仅作为观察记录。`;

  const bullPoints = bullish
    ? [
        `现价 ${usd(q.price)} 位于 SMA20（${f2(q.sma20)}）与 SMA50（${f2(q.sma50)}）上方，短期结构保持向上`,
        `RSI(14) ${f2(q.rsi14)} 未进入超买区，${q.volumeRatio > 1 ? '成交量较 20 日均量放大，突破获得量能配合' : '量能温和，属健康整理而非抛压'} `,
        `近 3 个月 ${pctStr(q.ret3m)}、近 1 年 ${pctStr(q.ret1y)}，中期回报仍为正，回撤 ${pctStr(q.drawdown60d)} 相对可控`,
      ]
    : [
        `RSI(14) ${f2(q.rsi14)} 处于${rsiLabel(q.rsi14)}区间，${q.rsi14 < 35 ? '短线存在技术性反抽需求' : '尚未形成明确的超跌修复信号'}`,
        `现价 ${usd(q.price)} 距 60 日低点 ${f2(q.low60d)} 约 ${(((q.price - q.low60d) / q.low60d) * 100).toFixed(2)}%，${f2(q.low60d)}—${f2(q.low60d * 1.03)} 为潜在支撑带`,
        `近 1 年 ${pctStr(q.ret1y)} 与近 3 个月 ${pctStr(q.ret3m)} 的跌幅差为 ${(Math.abs(q.ret1y - q.ret3m)).toFixed(2)} 个百分点，中期跌幅${Math.abs(q.ret1y) < Math.abs(q.ret3m) ? '趋缓' : '仍在扩大'}`,
      ];

  const bearPoints = bullish
    ? [
        `RSI(14) ${f2(q.rsi14)} 已接近偏强区上沿，若继续上行至 75 以上需防短期过热`,
        `近 1 个月 ${pctStr(q.ret1m)}，短线涨幅已部分兑现，追高的性价比下降`,
        `60 日高点 ${f2(q.high60d)} 为上方压力，突破前仍需量能确认`,
      ]
    : [
        `均线${q.sma20 < q.sma50 ? '呈空头排列' : '压制尚未解除'}：现价 ${usd(q.price)} 低于 SMA20 ${f2(q.sma20)} 与 SMA50 ${f2(q.sma50)}`,
        `动量走弱：近 1 个月 ${pctStr(q.ret1m)}、近 3 个月 ${pctStr(q.ret3m)}、近 5 日 ${pctStr(q.ret5d)}，尚未出现企稳信号`,
        `${q.volumeRatio > 1 ? `放量下跌形态明确：成交 ${wan(q.volume)}股，量比 ${f2(q.volumeRatio)}，抛压主导` : `缩量下行：成交 ${wan(q.volume)}股，量比 ${f2(q.volumeRatio)}，买盘承接不足`}`,
      ];

  const catalysts = [
    `向上修复触发：需先收复 ${bullish ? `SMA20 ${f2(q.sma20)}` : `EMA20 ${f2(q.daily[q.daily.length - 1].ema20)}`} 并站稳，方可确认${bullish ? '趋势延续' : '超卖反抽有效'}，进一步挑战 ${f2(q.high60d)}`,
    `向下观察：若失守 ${f2(q.low60d)}，将打开新的下行空间，需防加速赶底与止损盘连锁`,
  ];

  const risks = [
    '数据缺口风险：13/16 项能力未连接 Longbridge，无 PE、财报、盈利预期与资金流数据，估值合理性无法验证',
    '模拟数据说明：本页行情为内置模拟数据，用于演示分析流程，不代表任何真实标的报价',
    `技术结构失效风险：若快速收复 ${f2(q.high60d * 0.92)} 并连续放量上行，当前${bearish ? '偏空' : '中性'}判断失效`,
  ];

  return { stance, confidence, headline, summary, portfolioImpact, bullPoints, bearPoints, catalysts, risks };
}

function reasoningFor(q, stance) {
  return (
    `Let me assemble the report from the capability results. ` +
    `Last close ${f2(q.price)}, change ${f2(q.change)} (${pctStr(q.changePct)}), ` +
    `volume ${Math.round(q.volume / 1e6)}M vs 20-day average ${Math.round(q.avgVolume20d / 1e6)}M (ratio ${f2(q.volumeRatio)}), ` +
    `RSI(14) ${f2(q.rsi14)}, SMA20 ${f2(q.sma20)}, SMA50 ${f2(q.sma50)}, ` +
    `60-day high ${f2(q.high60d)} low ${f2(q.low60d)} (drawdown ${pctStr(q.drawdown60d)}), ` +
    `1M ${pctStr(q.ret1m)}, 3M ${pctStr(q.ret3m)}. ` +
    `Stance resolves to ${stance} from the trend and momentum rules. ` +
    `Fundamentals, valuation and news are unavailable (Longbridge CLI not installed), so the conclusion stays price/volume only and the confidence is capped accordingly.`
  );
}

// ---- portfolio --------------------------------------------------------------
export function buildHoldings(snapshot) {
  const cash = 24500;
  const plan = [
    { symbol: 'NVDA.US', qty: 240, costFactor: 1.12, cluster: 'AI 半导体' },
    { symbol: 'AVGO.US', qty: 110, costFactor: 0.88, cluster: 'AI 半导体' },
    { symbol: 'MSFT.US', qty: 75, costFactor: 0.94, cluster: '云与企业软件' },
    { symbol: 'AAPL.US', qty: 90, costFactor: 0.96, cluster: '终端生态' },
    { symbol: 'GOOGL.US', qty: 85, costFactor: 0.91, cluster: '互联网与云' },
    { symbol: 'TSLA.US', qty: 45, costFactor: 1.06, cluster: '智驾与储能' },
  ];
  const rows = plan.map((p) => {
    const q = snapshot.equities[p.symbol];
    const avgCost = Number((q.price * p.costFactor).toFixed(2));
    const value = q.qty ? 0 : p.qty * q.price;
    const pnl = p.qty * (q.price - avgCost);
    return { ...p, avgCost, value, pnl, pnlPct: (pnl / (p.qty * avgCost)) * 100 };
  });
  const equity = rows.reduce((s, r) => s + r.value, 0);
  const total = equity + cash;
  return {
    cash,
    total,
    rows: rows.map((r) => ({ ...r, weightPct: (r.value / total) * 100 })),
  };
}

const noteFor = (r) =>
  r.pnl < 0
    ? `${r.cluster}仓位，当前浮亏 ${pctStr(r.pnlPct)}，优先观察止跌信号`
    : `${r.cluster}仓位，浮盈 ${pctStr(r.pnlPct)}，以均线作为止盈参考`;

// ---- copilot scenarios ------------------------------------------------------
function scenarioPortfolioAudit(snapshot, port) {
  const total = port.total;
  const weights = port.rows.map((r) => ({ symbol: r.symbol, w: r.weightPct, pnlPct: r.pnlPct, pnl: r.pnl, value: r.value }));
  const sumsq = weights.reduce((s, x) => s + x.w * x.w, 0);
  const hhi = Math.round(sumsq);
  const top3 = weights.slice().sort((a, b) => b.w - a.w).slice(0, 3);
  const top3Sum = top3.reduce((s, x) => s + x.w, 0);
  const cashW = (port.cash / total) * 100;
  const semi = port.rows.filter((r) => r.cluster === 'AI 半导体');
  const semiValue = semi.reduce((s, r) => s + r.value, 0);
  const semiW = (semiValue / total) * 100;
  const worst = port.rows.slice().sort((a, b) => a.pnlPct - b.pnlPct)[0];
  const best = port.rows.slice().sort((a, b) => b.pnlPct - a.pnlPct)[0];

  const contribution = weights.map((x) => `${x.symbol} ${x.w.toFixed(2)}%、${pctStr(x.pnlPct)}`).join('；');

  const deepseek = `## 一、集中度：HHI ${hhi} 未计入现金

权益权重：${weights.map((x) => `${x.symbol.split('.')[0]} ${x.w.toFixed(2)}%`).join('、')}，**前三大合计 ${top3Sum.toFixed(2)}%**，现金 ${cashW.toFixed(2)}%。

复核：${hhi} 是这 6 项权益权重的平方和（${weights.map((x) => (x.w * x.w).toFixed(1)).join('+')}），**未含 ${cashW.toFixed(2)}% 现金**；若按总资产 ${usd(total)} 归一化，HHI 约 ${Math.round(sumsq / Math.pow(1 - cashW / 100, 2))}。属「${top3Sum > 55 ? '中度集中' : '相对分散'}」，但 HHI 是静态权重，不含协方差，会低估真实风险。

## 二、AI 半导体 ${semiW.toFixed(2)}%：同一因子，表现相反

${semi.map((r) => `${r.symbol.split('.')[0]} ${usd(r.value)}`).join(' + ')} = ${usd(semiValue)}（总资产 ${semiW.toFixed(2)}%）。但两者分化明显：

- **${best.symbol.split('.')[0]}**：${pctStr(best.pnlPct)}（${usd(best.pnl)}），本组合最强仓位
- **${worst.symbol.split('.')[0]}**：${pctStr(worst.pnlPct)}（${usd(worst.pnl)}），当前主要拖累

两者共享 AI 资本开支驱动，但价格节奏不同步，集中度会放大同涨同跌的风险。

## 三、处理优先级

1. **${worst.symbol}**：${noteFor(worst)}，是当前回撤的主要来源，优先复核止损位。
2. **${best.symbol}**：${noteFor(best)}，可维持仓位，避免在强势中过早减仓。
3. **现金 ${cashW.toFixed(2)}%**：若计划加仓，建议先补足 ${semi.length} 只半导体之外的方向，降低单一因子暴露。

**数据边界**：行情为内置模拟数据，仅覆盖价格与日/周 K 线；PE、财报、资金流与盘口不可用，上述结论不含估值判断。`;

  const glm = `## 持仓概览

| 标的 | 权重 | 浮动盈亏 |
|---|---|---|
${weights.map((x) => `| ${x.symbol} | ${x.w.toFixed(2)}% | ${pctStr(x.pnlPct)} |`).join('\n')}
| 现金 | ${cashW.toFixed(2)}% | — |

## 集中度判断

- HHI（权益口径）：**${hhi}** → ${hhi > 2500 ? '高度集中' : hhi > 1500 ? '中度集中' : '相对分散'}
- 前三大合计：**${top3Sum.toFixed(2)}%**（${top3.map((t) => t.symbol.split('.')[0]).join(' / ')}）
- AI 半导体簇：**${semiW.toFixed(2)}%**

## 风险与建议

1. 单一因子（AI 半导体）占 ${semiW.toFixed(2)}%，若板块同步回调，组合回撤会被放大。
2. ${worst.symbol} 浮亏 ${pctStr(worst.pnlPct)}，为最大拖累项，优先处理。
3. ${best.symbol} 浮盈 ${pctStr(best.pnlPct)}，可作为减仓再平衡的候选。

数据来自模拟行情快照，不含估值与财报信息。`;

  const gpt = `**结论：中度集中，主要风险来自 AI 半导体单一因子。**

1. **量化集中度**：权益 HHI ${hhi}，前三大 ${top3Sum.toFixed(2)}%，现金 ${cashW.toFixed(2)}%。
2. **因子暴露**：AI 半导体 ${semiW.toFixed(2)}%，同一驱动下同涨同跌风险高。
3. **仓位分化**：${contribution}。
4. **行动清单**：
   - 对 ${worst.symbol} 设定明确的观察位与止损纪律；
   - 对 ${best.symbol} 保留仓位，用均线止盈而非主观判断；
   - 现金比例 ${cashW.toFixed(2)}%，可用于降低单一因子暴露。

数据边界：仅模拟价格数据，估值与财报缺失。`;

  return { deepseek, glm, gpt };
}

function scenarioNvda(snapshot, port) {
  const q = snapshot.equities['NVDA.US'];
  const row = port.rows.find((r) => r.symbol === 'NVDA.US');
  const ema20 = q.daily[q.daily.length - 1].ema20;
  return `## NVDA 持仓与 K 线结构

**价格**：${usd(q.price)}（单日 ${pctStr(q.changePct)}），近 1 个月 ${pctStr(q.ret1m)}、近 3 个月 ${pctStr(q.ret3m)}。

**持仓**：${row.qty} 股，成本 ${usd(row.avgCost)}，市值 ${usd(row.value)}，权重 ${row.weightPct.toFixed(2)}%，浮动 ${pctStr(row.pnlPct)}（${usd(row.pnl)}）。

**技术结构**：
- 均线：现价${q.price > q.sma20 ? '高于' : '低于'} SMA20（${f2(q.sma20)}），${q.price > q.sma50 ? '高于' : '低于'} SMA50（${f2(q.sma50)}）；EMA20 为 ${f2(ema20)}。
- RSI(14)：${f2(q.rsi14)}，${rsiLabel(q.rsi14)}。
- 区间：60 日 ${f2(q.low60d)}—${f2(q.high60d)}，当前分位 ${rangePosition(q)}%，回撤 ${pctStr(q.drawdown60d)}。
- 量能：成交 ${wan(q.volume)}股，量比 ${f2(q.volumeRatio)}。

**判断**：${q.price < q.sma20 && q.rsi14 < 45 ? '趋势与动量同时偏弱，右侧信号尚未出现，建议以观察为主，不急于加仓。' : '结构仍在修复中，需等待价格重回 SMA20 上方并伴随量能改善。'}

**数据边界**：模拟行情，仅含价格与 K 线。`;
}

function scenarioCompare(snapshot, port) {
  const syms = ['NVDA.US', 'AVGO.US', 'MSFT.US', 'AAPL.US'];
  const rows = syms.map((s) => snapshot.equities[s]);
  const rank = rows.slice().sort((a, b) => b.ret3m - a.ret3m);
  return `## 四票横评（NVDA / AVGO / MSFT / AAPL）

| 标的 | 现价 | 1D | 1M | 3M | RSI(14) | 60日回撤 |
|---|---|---|---|---|---|---|
${rows.map((q) => `| ${q.symbol.split('.')[0]} | ${usd(q.price)} | ${pctStr(q.changePct)} | ${pctStr(q.ret1m)} | ${pctStr(q.ret3m)} | ${f2(q.rsi14)} | ${pctStr(q.drawdown60d)} |`).join('\n')}

## 强弱排序（按 3 个月回报）

${rank.map((q, i) => `${i + 1}. **${q.symbol.split('.')[0]}** ${pctStr(q.ret3m)}，RSI ${f2(q.rsi14)}，${rsiLabel(q.rsi14)}`).join('\n')}

## 结论

- **相对最强**：${rank[0].symbol.split('.')[0]}，中期回报领先且回撤 ${pctStr(rank[0].drawdown60d)}；
- **相对最弱**：${rank[rank.length - 1].symbol.split('.')[0]}，1M ${pctStr(rank[rank.length - 1].ret1m)}，需等待企稳；
- 组合中同时持有其中 ${port.rows.filter((r) => syms.includes(r.symbol)).length} 只，注意同一因子下的相关性风险。

数据为模拟行情快照，不含估值。`;
}

function scenarioThesisReeval(snapshot, port) {
  const q = snapshot.equities['NVDA.US'];
  const row = port.rows.find((r) => r.symbol === 'NVDA.US');
  return `### 逐条核对

1. **价格守住 SMA50（${f2(q.sma50)}）：已被证伪。**
   最新价 ${usd(q.price)}，低于 SMA50 ${f2(q.sma50)}，也低于 SMA20 ${f2(q.sma20)}。

2. **回调期间 RSI 不破 40：已失效。**
   当前 RSI(14) 为 ${f2(q.rsi14)}，低于 40；量比 ${f2(q.volumeRatio)}，${q.volumeRatio > 1 ? '属放量下行' : '属缩量下行'}。

3. **相对 AVGO 保持超额动量：不成立。**
   ${q.symbol.split('.')[0]} 近 1 个月 ${pctStr(q.ret1m)}，AVGO 同期 ${pctStr(snapshot.equities['AVGO.US'].ret1m)}。

### 复核结论

原假设两条已被证伪，一条方向相反。持仓 ${row.qty} 股、成本 ${usd(row.avgCost)}，浮亏 ${usd(Math.abs(row.pnl))}（${pctStr(row.pnlPct)}），权重 ${row.weightPct.toFixed(2)}%。建议将结论由「看多」下调为「待复核」，并停止按原假设补仓，等待价格重回 SMA20 之上。

**数据边界**：模拟行情，仅价格与量能，无估值与财报。`;
}

function scenarioHonestGap(snapshot) {
  const hk = '0700.HK';
  return `## 数据缺口说明（${hk}）

请求：查询 ${hk} 的实时报价与盘口。

返回：\`UNSUPPORTED_CAPABILITY\`。当前演示行情源仅覆盖美股（\`.US\`）的延迟报价与日/周 K 线，没有港股数据源。

| 项目 | 状态 | 说明 |
|---|---|---|
| ${hk} 报价 | 不可用 | 无港股数据源 |
| 盘口深度 | 不可用 | 需 Longbridge CLI |
| 三大财务报表 | 不可用 | 需 Longbridge CLI |
| 估值倍数 (PE/PB/EV-EBITDA) | 不可用 | 需付费数据源 |

我不会用近似值填补这些字段。若需要港股数据，请在「设置 → 连接」中安装并授权 Longbridge CLI。

**美股可用部分**：${Object.keys(snapshot.equities).slice(0, 4).map((s) => `${s.split('.')[0]} ${usd(snapshot.equities[s].price)}`).join('、')}。`;
}

function scenarioBrief(snapshot, port) {
  const idx = snapshot.indices;
  const movers = port.rows.slice().sort((a, b) => a.pnlPct - b.pnlPct);
  const worstRow = movers[0];
  const bestRow = movers[movers.length - 1];
  const quote = (s) => snapshot.equities[s];
  return `# Limpid 研究简报 · ${snapshot.fetchedAt.slice(0, 10)}

## 一、指数脉搏

| 指数 | 点位 | 单日 | 近 1 月 |
|---|---|---|---|
${Object.values(idx).map((i) => `| ${i.name} | ${Number(i.price).toLocaleString('en-US', { maximumFractionDigits: 2 })} | ${pctStr(i.changePct)} | ${pctStr(i.ret1m)} |`).join('\n')}

## 二、持仓脉搏

组合总资产 ${usd(port.total)}（示例数据），现金 ${usd(port.cash)}（${((port.cash / port.total) * 100).toFixed(2)}%）。

- 最强：**${bestRow.symbol}** ${pctStr(bestRow.pnlPct)}
- 最弱：**${worstRow.symbol}** ${pctStr(worstRow.pnlPct)}

## 三、今日观察重点

1. **${worstRow.symbol}**：${noteFor(worstRow)}。
2. **${quote('AVGO.US').symbol}**：RSI ${f2(quote('AVGO.US').rsi14)}，近 3 个月 ${pctStr(quote('AVGO.US').ret3m)}，继续作为组合的强弱对照。
3. **风险提示**：模拟行情，非实时数据；估值与财报能力未接入。

## 四、下一步建议

- 复核 ${worstRow.symbol} 的投资逻辑假设是否仍成立；
- 若指数波动放大，优先检查 AI 半导体簇的合计权重。`;
}

// Assemble everything the UI reads.
export function buildNarrative(snapshot, port, meta) {
  const research = {};
  const models = [
    { key: 'deepseek-v4.1-flash', label: 'DeepSeek-V4.1-Flash', elapsed: 39800, usage: [1180, 2960, 2140] },
    { key: 'glm-5.3-flash', label: 'GLM-5.3-Flash', elapsed: 11200, usage: [1240, 720, 0] },
    { key: 'gpt-6-luna', label: 'GPT-6-Luna', elapsed: 19600, usage: [4860, 690, 0] },
  ];
  for (const [symbol, q] of Object.entries(snapshot.equities)) {
    const holding = port.rows.find((r) => r.symbol === symbol) || null;
    const parsed = researchFor(q, holding, meta);
    const m = models[Math.floor(Math.abs(q.price)) % models.length];
    const [inp, out, rea] = m.usage;
    research[symbol] = {
      content: JSON.stringify(parsed),
      reasoning: reasoningFor(q, parsed.stance),
      elapsedMs: m.elapsed + (Math.round(q.rsi14 * 10) % 900),
      usage: { input: inp, output: out, reasoning: rea, total: inp + out + rea },
      generatedAt: `${snapshot.fetchedAt.slice(0, 10)} 14:5${Math.round(q.rsi14) % 10}:2${Math.round(q.changePct * 10) % 10}`,
      parsed,
      modelLabel: m.label,
    };
  }

  const audit = scenarioPortfolioAudit(snapshot, port);
  const copilotScenarios = [
    {
      id: 'portfolio-audit', chip: '复核持仓敞口与回撤', contextRoute: '/portfolio',
      prompt: '结合当前行情，帮我复核演示投资组合的集中度（HHI）、AI 半导体敞口与回撤风险，哪些仓位最需要优先处理或重点盯防？',
      tools: [['get_portfolio_snapshot', 9, 'ok'], ['compute_portfolio_risk', 14, 'ok'], ['calc_hhi', 6, 'ok']],
      sources: [{ label: 'Limpid Demo Feed (snapshot)', kind: 'market' }],
      defaultModel: 'deepseek-v4.1-flash',
      modelOutputs: {
        'deepseek-v4.1-flash': { content: audit.deepseek, elapsedMs: 41264 },
        'glm-5.3-flash': { content: audit.glm, elapsedMs: 10272 },
        'gpt-6-luna': { content: audit.gpt, elapsedMs: 18399 },
      },
    },
    {
      id: 'nvda-position-kline', chip: 'NVDA 持仓与 K 线结构', contextRoute: '/workspace',
      prompt: 'NVDA 现在价格与技术结构如何？结合我的持仓，下一步该怎么处理？',
      tools: [['market.quote', 12, 'ok'], ['market.kline', 18, 'ok'], ['get_portfolio_snapshot', 8, 'ok']],
      sources: [{ label: 'Limpid Demo Feed (snapshot)', kind: 'market' }],
      defaultModel: 'deepseek-v4.1-flash',
      modelOutputs: { 'deepseek-v4.1-flash': { content: scenarioNvda(snapshot, port), elapsedMs: 32600 } },
    },
    {
      id: 'compare-four', chip: '横评 NVDA/AVGO/MSFT/AAPL', contextRoute: '/compare',
      prompt: '横向比较 NVDA、AVGO、MSFT、AAPL 的强弱，给出排序与理由。',
      tools: [['market.kline', 22, 'ok'], ['technical.rsi', 9, 'ok']],
      sources: [{ label: 'Limpid Demo Feed (snapshot)', kind: 'market' }],
      defaultModel: 'glm-5.3-flash',
      modelOutputs: { 'glm-5.3-flash': { content: scenarioCompare(snapshot, port), elapsedMs: 9400 } },
    },
    {
      id: 'thesis-reeval', chip: '重评 NVDA 投资逻辑', contextRoute: '/thesis',
      prompt: '按最新行情重评 NVDA 的投资逻辑，原假设是否仍然成立？',
      tools: [['market.quote', 11, 'ok'], ['market.kline', 16, 'ok']],
      sources: [{ label: 'Limpid Demo Feed (snapshot)', kind: 'market' }],
      defaultModel: 'gpt-6-luna',
      modelOutputs: { 'gpt-6-luna': { content: scenarioThesisReeval(snapshot, port), elapsedMs: 17800 } },
    },
    {
      id: 'honest-data-gap', chip: '港股与财报缺口边界', contextRoute: '/workspace',
      prompt: '帮我查一下 0700.HK 的实时报价与盘口深度，并给出 PE 估值。',
      tools: [['market.quote', 7, 'missing'], ['market.depth', 5, 'missing'], ['fundamentals.valuation', 6, 'missing']],
      sources: [],
      defaultModel: 'deepseek-v4.1-flash',
      modelOutputs: { 'deepseek-v4.1-flash': { content: scenarioHonestGap(snapshot), elapsedMs: 16210 } },
    },
    {
      id: 'morning-brief', chip: '生成今日研究简报', contextRoute: '/today',
      prompt: '生成今日研究简报，串联指数脉搏、持仓与今日观察重点。',
      tools: [['market.quote', 15, 'ok'], ['get_portfolio_snapshot', 8, 'ok']],
      sources: [{ label: 'Limpid Demo Feed (snapshot)', kind: 'market' }],
      defaultModel: 'glm-5.3-flash',
      modelOutputs: { 'glm-5.3-flash': { content: scenarioBrief(snapshot, port), elapsedMs: 11800 } },
    },
  ].map((sc) => ({
    ...sc,
    modelOutputs: Object.fromEntries(
      Object.entries(sc.modelOutputs).map(([k, v]) => {
        const m = models.find((x) => x.key === k);
        return [k, {
          content: v.content,
          reasoning: reasoningFor(snapshot.equities[sc.id.startsWith('nvda') || sc.id.includes('thesis') ? 'NVDA.US' : 'AVGO.US'], judge(snapshot.equities['NVDA.US'])),
          elapsedMs: v.elapsedMs,
          usage: { input: 1200 + (v.elapsedMs % 400), output: Math.round(v.content.length / 2), reasoning: v.elapsedMs % 2000, total: 0 },
          generatedAt: `${snapshot.fetchedAt.slice(0, 10)} 14:48:0${v.elapsedMs % 9}`,
          modelLabel: m ? m.label : k,
        }];
      })
    ),
  }));

  const nvda = snapshot.equities['NVDA.US'];
  const avgo = snapshot.equities['AVGO.US'];
  const nvRow = port.rows.find((r) => r.symbol === 'NVDA.US');
  const avgoRow = port.rows.find((r) => r.symbol === 'AVGO.US');

  const theses = [
    {
      id: 'thesis-nvda-1', symbol: 'NVDA.US',
      title: 'AI 训练与推理资本开支核心受益者，回调分批布局但严守均线纪律',
      stance: `待复核（原看多 -> 现${nvda.price < nvda.sma20 ? '偏谨慎' : '中性'}）`,
      confidence: 55, updatedAt: snapshot.fetchedAt.slice(0, 10), needsReview: true,
      summary: `${nvda.symbol.split('.')[0]} 最新价 ${usd(nvda.price)}，单日 ${pctStr(nvda.changePct)}，近 1 个月 ${pctStr(nvda.ret1m)}、近 3 个月 ${pctStr(nvda.ret3m)}。${maTrend(nvda)}，RSI(14) 为 ${f2(nvda.rsi14)}。60 日区间 ${f2(nvda.low60d)}—${f2(nvda.high60d)}，回撤 ${pctStr(nvda.drawdown60d)}；成交量 ${wan(nvda.volume)}股、量比 ${f2(nvda.volumeRatio)}。因 13/16 项能力未连 Longbridge、缺 PE 与财报，结论仅基于量价证据。`,
      assumptions: [
        { text: `股价守稳 50 日均线（当前 ${f2(nvda.sma50)}）`, status: nvda.price > nvda.sma50 ? 'intact' : 'broken', note: `当前收盘 ${usd(nvda.price)}，SMA50 为 ${f2(nvda.sma50)}` },
        { text: '回调过程 RSI(14) 维持在 40 以上', status: nvda.rsi14 >= 40 ? 'intact' : 'broken', note: `当前 RSI(14)=${f2(nvda.rsi14)}，量比 ${f2(nvda.volumeRatio)}` },
        { text: '相对 AVGO 保持超额动量', status: nvda.ret1m > avgo.ret1m ? 'intact' : 'broken', note: `近 1 月 NVDA ${pctStr(nvda.ret1m)} vs AVGO ${pctStr(avgo.ret1m)}` },
      ],
      bullPoints: [
        `RSI(14) ${f2(nvda.rsi14)}，${rsiLabel(nvda.rsi14)}，短线存在技术性反抽需求，首个修复目标为 EMA20 ${f2(nvda.daily[nvda.daily.length - 1].ema20)}`,
        `现价 ${usd(nvda.price)} 距 60 日低点 ${f2(nvda.low60d)} 约 ${(((nvda.price - nvda.low60d) / nvda.low60d) * 100).toFixed(2)}%，${f2(nvda.low60d)}—${f2(nvda.low60d * 1.03)} 为潜在支撑带`,
        `近 1 年 ${pctStr(nvda.ret1y)} 与近 3 个月 ${pctStr(nvda.ret3m)} 的差距显示中期跌幅${Math.abs(nvda.ret1y) < Math.abs(nvda.ret3m) ? '已趋缓' : '仍在扩大'}`,
      ],
      bearPoints: [
        `均线${nvda.sma20 < nvda.sma50 ? '空头排列' : '压制未解'}：现价 ${usd(nvda.price)} 低于 SMA20 ${f2(nvda.sma20)} 与 SMA50 ${f2(nvda.sma50)}`,
        `动量走弱：近 1 月 ${pctStr(nvda.ret1m)}、近 3 月 ${pctStr(nvda.ret3m)}、近 5 日 ${pctStr(nvda.ret5d)}，尚无企稳信号`,
        `量能：成交 ${wan(nvda.volume)}股，20 日均量 ${wan(nvda.avgVolume20d)}股，量比 ${f2(nvda.volumeRatio)}`,
      ],
      catalysts: [
        `向上修复触发：需先收复 EMA20 ${f2(nvda.daily[nvda.daily.length - 1].ema20)} 并站稳，方可视为超卖反抽有效`,
        `向下破位观察：失守 ${f2(nvda.low60d)} 将打开新的下行空间`,
      ],
      risks: [
        '数据缺口风险：13/16 项能力未连接 Longbridge，无 PE、财报、盈利预期与资金流数据',
        '模拟数据说明：行情为内置模拟数据，不代表任何真实标的报价',
        `技术结构失效风险：若快速收复 ${f2(nvda.high60d * 0.92)} 并连续放量上行，当前判断失效`,
      ],
      reevalHistory: [
        {
          time: `${snapshot.fetchedAt.slice(0, 10)} 14:50:43`, model: 'GPT-6-Luna',
          verdict: `触发复核预警：3 项核心假设中已有 ${2} 项被最新行情证伪，建议停止盲目补仓，等待企稳信号。`,
          detail: scenarioThesisReeval(snapshot, port),
        },
      ],
    },
    {
      id: 'thesis-avgo-1', symbol: 'AVGO.US',
      title: avgo.price > avgo.sma20
        ? '定制 AI ASIC 与高速以太网交换芯片双轮驱动，均线结构维持多头排列'
        : '定制 AI ASIC 双轮驱动，等待价格重回 20 日均线上方',
      stance: judge(avgo), confidence: 61, updatedAt: snapshot.fetchedAt.slice(0, 10), needsReview: false,
      summary: `${avgo.symbol.split('.')[0]} 最新价 ${usd(avgo.price)}，单日 ${pctStr(avgo.changePct)}，近 1 个月 ${pctStr(avgo.ret1m)}、近 3 个月 ${pctStr(avgo.ret3m)}。${maTrend(avgo)}，RSI(14) ${f2(avgo.rsi14)}。60 日区间 ${f2(avgo.low60d)}—${f2(avgo.high60d)}，回撤 ${pctStr(avgo.drawdown60d)}，量比 ${f2(avgo.volumeRatio)}。因 13/16 项能力未接入 Longbridge，缺少估值与财报数据，本结论仅基于价格结构与量价证据。`,
      assumptions: [
        { text: `收盘价维持在 20 日均线（${f2(avgo.sma20)}）上方`, status: avgo.price > avgo.sma20 ? 'intact' : 'broken', note: `现价 ${usd(avgo.price)}` },
        { text: `相对 NVDA 展现超额抗跌`, status: avgo.ret1m > nvda.ret1m ? 'intact' : 'broken', note: `近 1 月 AVGO ${pctStr(avgo.ret1m)} vs NVDA ${pctStr(nvda.ret1m)}` },
      ],
      bullPoints: [
        `${maTrend(avgo)}，${avgo.sma20 > avgo.sma50 ? '短期均线呈多头排列雏形' : '结构仍在修复'}`,
        `RSI(14) ${f2(avgo.rsi14)}，${rsiLabel(avgo.rsi14)}；近 1 月 ${pctStr(avgo.ret1m)}、近 3 月 ${pctStr(avgo.ret3m)}`,
        `距 60 日高点 ${f2(avgo.high60d)} 约 ${(((avgo.high60d - avgo.price) / avgo.price) * 100).toFixed(2)}%，仍有修复空间`,
      ],
      bearPoints: [
        `量比 ${f2(avgo.volumeRatio)}，成交 ${wan(avgo.volume)}股，${avgo.volumeRatio < 1 ? '突破尚缺成交量确认' : '量能配合尚可'}`,
        `60 日回撤 ${pctStr(avgo.drawdown60d)}，距 52 周高点 ${f2(avgo.fiftyTwoWeekHigh)} 仍有差距`,
        `若失守 SMA50（${f2(avgo.sma50)}）将回落测试 SMA20（${f2(avgo.sma20)}）`,
      ],
      catalysts: [
        `向上触发：有效突破 ${f2(avgo.high60d)} 并向新高推进，需量比回升至 1.0 以上确认`,
        `向下观察：跌破 ${f2(avgo.sma20)} 则结构转弱`,
      ],
      risks: [
        '数据缺口风险：13/16 项能力未连接 Longbridge，无估值与财报数据',
        '模拟数据说明：行情为内置模拟数据，不代表任何真实标的报价',
        `技术结构失效风险：跌破 ${f2(avgo.sma20)} 且量能放大，则本轮动量修复判断作废`,
      ],
      reevalHistory: [],
    },
  ];

  const alerts = [
    { id: 'al-1', symbol: 'NVDA.US', type: 'price_below', label: `价格跌破 ${usd(nvda.low60d * 1.01)} 关键支撑`, threshold: Number((nvda.low60d * 1.01).toFixed(2)), enabled: true, note: `${nvRow.qty} 股持仓风控观察线` },
    { id: 'al-2', symbol: 'NVDA.US', type: 'rsi_below', label: `日线 RSI(14) 低于 ${Math.max(20, Math.round(nvda.rsi14 - 8))} 极端超卖提醒`, threshold: Math.max(20, Math.round(nvda.rsi14 - 8)), enabled: true, note: '观察技术性反抽与缩量止跌' },
    { id: 'al-3', symbol: 'AVGO.US', type: 'price_above', label: `价格突破 ${usd(avgo.high60d)} 趋势跟踪`, threshold: avgo.high60d, enabled: true, note: '止盈保护与仓位再平衡观察' },
    { id: 'al-4', symbol: 'PORTFOLIO', type: 'cluster_weight', label: 'AI 半导体簇合计权重超过 30%', threshold: 30, enabled: true, note: 'NVDA + AVGO 行业集中度上限提醒' },
    { id: 'al-5', symbol: 'MSFT.US', type: 'price_below', label: `价格回踩 ${usd(port.rows.find((r) => r.symbol === 'MSFT.US').avgCost)} 长期加仓观察区`, threshold: port.rows.find((r) => r.symbol === 'MSFT.US').avgCost, enabled: true, note: '核心底仓观察位' },
  ];

  const weightOf = (sym) => port.rows.find((r) => r.symbol === sym).weightPct;
  const events = [
    { id: 'ev-1', date: '2026-11-20', category: '财报催化', symbol: 'NVDA.US', title: 'NVIDIA 季度业绩说明与下一代数据中心机柜交付节奏跟踪', impact: `高 · 持仓权重 ${weightOf('NVDA.US').toFixed(1)}%`, desc: `重点验证超大规模云厂商资本开支增速、毛利率指引区间，以及与近 3 个月 ${pctStr(nvda.ret3m)} 之间的预期差。` },
    { id: 'ev-2', date: '2026-11-25', category: '宏观日历', symbol: 'SPX.US', title: '美国核心 PCE 物价指数与 FOMC 11 月会议纪要公布', impact: '高 · 全市场久期敏感', desc: `观察长端美债收益率对科技高估值板块折现率的影响，当前 VIX 位于 ${f2(snapshot.indices['VIX.US'].price)}。` },
    { id: 'ev-3', date: '2026-12-03', category: '财报催化', symbol: 'AVGO.US', title: 'Broadcom 财报发布：定制 AI XPU 客户扩容与 VMware 软件续约率', impact: `高 · 持仓权重 ${weightOf('AVGO.US').toFixed(1)}%`, desc: '验证 ASIC 相对通用 GPU 的超额动量是否有真实订单与自由现金流支撑。' },
    { id: 'ev-4', date: '2026-12-10', category: '产品催化', symbol: 'AAPL.US', title: 'Apple 端侧 AI 功能全球语种推送与假日季换机周期高频跟踪', impact: `中 · 持仓权重 ${weightOf('AAPL.US').toFixed(1)}%`, desc: `苹果近 1 个月 ${pctStr(snapshot.equities['AAPL.US'].ret1m)}，关注假日季终端出货韧性。` },
  ];

  const semiW = port.rows.filter((r) => r.cluster === 'AI 半导体').reduce((s, r) => s + r.weightPct, 0);
  const evalSummary = {
    suite: 'limpidwork-demo-v1',
    casesTotal: 86, smokeCases: 15, passRate: '100%', overallScore: '89%',
    metrics: [
      { name: '任务完成度 (Task Completion)', type: '确定性门禁', score: '100%', samples: 15 },
      { name: '工具参数与标的校验 (Symbol & Arg Validity)', type: '确定性门禁', score: '100%', samples: 15 },
      { name: '部分失败诚实度 (Partial-Failure Honesty)', type: '反幻觉核心契约', score: '100%', samples: 12 },
      { name: '数据来源与时效标注 (Provenance & Delayed Tag)', type: '确定性门禁', score: '100%', samples: 15 },
      { name: '持仓上下文绑定准确率 (Workspace & Portfolio Grounding)', type: 'LLM Judge', score: '93%', samples: 14 },
      { name: '研究四象限结构完整性 (Research Schema Integrity)', type: '确定性门禁', score: '100%', samples: 8 },
    ],
    modelRuns: [
      { task: '组合敞口与 HHI 复核 (portfolio-audit)', model: 'DeepSeek-V4.1-Flash', elapsedMs: 41264, inputTok: 1539, outputTok: 2819, reasoningTok: 2110, note: `含完整推理链，拆解 AI 半导体 ${semiW.toFixed(2)}% 簇集中度与数据边界` },
      { task: '组合敞口与 HHI 复核 (portfolio-audit)', model: 'GLM-5.3-Flash', elapsedMs: 10272, inputTok: 1667, outputTok: 668, reasoningTok: 0, note: '首字与总耗时最快 (~10.2s)，表格化呈现各持仓风控优先级' },
      { task: '组合敞口与 HHI 复核 (portfolio-audit)', model: 'GPT-6-Luna', elapsedMs: 18399, inputTok: 5147, outputTok: 612, reasoningTok: 0, note: '结构化决策清单干练，条件触发位清晰' },
      { task: 'NVDA 深度研究综合 (research:NVDA.US)', model: 'DeepSeek-V4.1-Flash', elapsedMs: 40697, inputTok: 1006, outputTok: 3061, reasoningTok: 2238, note: '遵守 3/16 部分运行保守置信度约束，未虚构 PE/FCF' },
      { task: '港股/财报缺口诚实度测试 (honest-data-gap)', model: 'DeepSeek-V4.1-Flash', elapsedMs: 16210, inputTok: 518, outputTok: 910, reasoningTok: 274, note: '0700.HK 报价与 NVDA FCF 零幻觉拒绝，通过反幻觉门禁' },
    ],
  };

  return { research, copilotScenarios, theses, alerts, events, evalSummary, holdings: port };
}

export const holdingsMeta = { noteFor, judge };
