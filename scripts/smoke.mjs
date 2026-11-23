// Smoke checks for Limpid. No dependencies: `node scripts/smoke.mjs`
// Exits with a non-zero code if any check fails.
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const pub = join(root, 'public');
let failures = 0;
const pass = (msg) => console.log(`  PASS ${msg}`);
const fail = (msg) => { failures++; console.log(`  FAIL ${msg}`); };
const section = (title) => console.log(`\n== ${title}`);
const rel = (p) => relative(root, p).replaceAll('\\', '/');

// 1. JavaScript syntax
section('1. JavaScript syntax (node --check)');
const jsFiles = [
  ...readdirSync(pub).filter((f) => f.endsWith('.js')).map((f) => join(pub, f)),
  join(root, 'src', 'worker.js'),
];
for (const file of jsFiles) {
  try {
    execFileSync(process.execPath, ['--check', file], { stdio: 'pipe' });
    pass(rel(file));
  } catch (err) {
    fail(`${rel(file)}: ${String(err.stderr || err.message).split('\n').slice(0, 3).join(' ')}`);
  }
}

// 2. Data integrity: load public/data.js in a sandbox and check the shapes the UI relies on
section('2. Demo data integrity (public/data.js)');
const sandbox = { window: {}, console };
vm.createContext(sandbox);
vm.runInContext(readFileSync(join(pub, 'data.js'), 'utf8'), sandbox, { filename: 'data.js' });
const W = sandbox.window;
for (const key of [
  'FOLIO_NAV_ITEMS', 'FOLIO_MODELS', 'FOLIO_MARKET_SNAPSHOT', 'FOLIO_RESEARCH_REPORTS',
  'FOLIO_COPILOT_SCENARIOS', 'FOLIO_DISCOVER_TASKS', 'FOLIO_SKILLS_DEFAULT',
  'FOLIO_DEMO_EVENTS', 'FOLIO_EVAL_SUMMARY',
]) {
  if (W[key] !== undefined) pass(`${key} defined`);
  else fail(`${key} missing`);
}
const equities = Object.values(W.FOLIO_MARKET_SNAPSHOT?.equities || {});
if (equities.length > 0) pass(`${equities.length} equities in market snapshot`);
else fail('market snapshot has no equities');
const barFields = ['time', 'open', 'high', 'low', 'close', 'volume'];
const badBars = equities.flatMap((e) => (e.daily || []).filter((b) => !barFields.every((f) => f in b)));
if (badBars.length === 0) pass('daily bars carry OHLCV fields');
else fail(`${badBars.length} daily bars missing OHLCV fields`);
if (typeof W.createInitialFolioState === 'function') {
  const initial = W.createInitialFolioState();
  if (Array.isArray(initial.holdings) && initial.holdings.length > 0) pass(`initial state loads ${initial.holdings.length} holdings`);
  else fail('initial state has no holdings');
} else {
  fail('createInitialFolioState is not a function');
}

// 3. HTML entry points: titles, favicon and every local asset they reference must exist
section('3. HTML entry points');
for (const page of ['index.html', 'mobile.html']) {
  const html = readFileSync(join(pub, page), 'utf8');
  if (/<title>[^<]+<\/title>/.test(html)) pass(`${page} has <title>`);
  else fail(`${page} has no <title>`);
  if (/<link rel="icon"/.test(html)) pass(`${page} has favicon`);
  else fail(`${page} has no favicon`);
  const refs = [...html.matchAll(/(?:src|href)="([^"#?:]+)"/g)].map((m) => m[1]);
  for (const ref of refs) {
    if (existsSync(join(pub, ref))) pass(`${page} -> ${ref}`);
    else fail(`${page} references missing file ${ref}`);
  }
}

// 4. Residual brand names and sample data from the source projects
section('4. Residual brand names and visible copy');
const forbidden = [/helson/i, /Pi Native/, /AiNativeCrm/, /OpenDot/, /林晓梅|陈伟|王芳|赵强|周敏/];
const visibleFolio = /(?<![A-Za-z._-])Folio(?![A-Za-z])/;
const textFiles = readdirSync(pub, { recursive: true })
  .filter((f) => /\.(html|css|js)$/.test(f))
  .map((f) => join(pub, f));
let residue = 0;
for (const file of textFiles) {
  const text = readFileSync(file, 'utf8');
  for (const re of [...forbidden, visibleFolio]) {
    if (re.test(text)) { residue++; fail(`${rel(file)} matches ${re}`); }
  }
}
if (residue === 0) pass(`no residue in ${textFiles.length} files`);

// 5. Deployment config
section('5. Deployment config');
try {
  const wrangler = JSON.parse(readFileSync(join(root, 'wrangler.jsonc'), 'utf8'));
  if (wrangler.main && wrangler.assets?.directory) pass(`wrangler.jsonc (${wrangler.name})`);
  else fail('wrangler.jsonc missing main or assets.directory');
} catch (err) { fail(`wrangler.jsonc is not valid JSON: ${err.message}`); }
try {
  JSON.parse(readFileSync(join(root, 'vercel.json'), 'utf8'));
  pass('vercel.json is valid JSON');
} catch (err) { fail(`vercel.json is not valid JSON: ${err.message}`); }

console.log(failures === 0 ? '\nAll smoke checks passed.' : `\n${failures} check(s) failed.`);
process.exit(failures === 0 ? 0 : 1);
