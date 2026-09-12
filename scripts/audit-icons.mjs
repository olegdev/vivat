// Шестой аудит: те ли иконки стоят в блоке. Сверяется не силуэт (геометрию
// пути экспорт не отдаёт), а ВАРИАНТ символа: набор `service-icons` живёт по
// осям `size=24 Thin | Bold`, `name=print`, `color=secondary`, и «та же»
// пиктограмма другой толщины выгружается другим файлом. Так в строке
// «Выбрать все» стояли печать и «поделиться» из Bold-варианта — залитые
// кружки и обводка 2 — при Thin в кадре (2029:156849/156850).
//
//   node scripts/audit-icons.mjs <page> <selector> <figma-id> [--width 1440]
//   node scripts/audit-icons.mjs customer/pdp '[data-cta-bar]' 2483:246944 --width 768
//
// Две стороны:
//   макет    — `fig.mjs icons <id>`: каждая иконка в отрисовке поддерева с её
//              вариантом и id символа;
//   страница — каждый видимый `<img src="…/icon-*.svg">` под селектором.
// Мост между ними — docs/ICON-MAP.md: файл → id символа. Файл, которого в
// карте нет, сверить нельзя — он печатается как «не в карте» (подозрение), и
// это приглашение дописать строку, а не ошибка. Файл из карты, чьего символа
// в кадре нет, — расхождение: на странице стоит не та иконка.
//
// Иконки кадра, под которые файла не нашлось, — подозрение, не расхождение:
// экспорт не отличает скрытый слот иконки от показанного (SOLUTIONS ›
// «Инстанс молчит о том, чего не менял»), и у кнопки без иконки derived всё
// равно перечислит обе стрелки мастера.
import { chromium } from "playwright";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const argv = process.argv.slice(2);
const opt = (n, d) => { const i = argv.indexOf(n); return i === -1 ? d : argv[i + 1]; };
const WIDTH = Number(opt("--width", 1440));
const pos = argv.filter((a, i) => !a.startsWith("--") && argv[i - 1] !== "--width");
const [page, selector, figmaId] = pos;
if (!page || !selector || !figmaId) {
  console.error("usage: node scripts/audit-icons.mjs <page> <selector> <figma-id> [--width 1440]");
  process.exit(1);
}

// ---- карта файл → символ ----------------------------------------------------
const map = new Map();   // "header/icon-pin-20.svg" → { id, variant }
for (const line of readFileSync("docs/ICON-MAP.md", "utf8").split("\n")) {
  const m = line.match(/^\|\s*`([^`]+)`\s*\|\s*([0-9]+:[0-9]+)\s*\|\s*([^|]*)\|/);
  if (m) map.set(m[1], { id: m[2], variant: m[3].trim() });
}

// ---- макет ------------------------------------------------------------------
const figOut = execFileSync("node", ["scripts/fig.mjs", "icons", figmaId], { encoding: "utf8" });
const figIcons = [];
for (const l of figOut.split("\n").slice(1)) {
  const m = l.match(/^\s+(\S+)\s+(.*?)\s+([0-9]+:[0-9]+)\s+(.*)$/);
  if (m) figIcons.push({ name: m[1], variant: m[2].replace(/\s+/g, " ").trim(), id: m[3], via: m[4].replace(/^\(в инстансе\)\s*/, "") });
}

// ---- страница ---------------------------------------------------------------
const browser = await chromium.launch();
const p = await browser.newPage({ viewport: { width: WIDTH, height: 900 } });
await p.goto(`file://${resolve(`dist/pages/${page}.html`)}`, { waitUntil: "load" });
await p.waitForTimeout(400);
const files = await p.$$eval(selector, (roots) => {
  const root = roots.find((r) => r.getClientRects().length);
  if (!root) return null;
  const out = [];
  for (const img of root.querySelectorAll("img")) {
    const src = img.getAttribute("src") || "";
    // только иконки: логотип, постеры и карты — не из набора `service-icons`
    if (!/(^|\/)(icon-|chevron-|arrow-|nav-|cta-)[^/]*\.svg$/.test(src)) continue;
    const r = img.getBoundingClientRect();
    if (r.width < 1 || r.height < 1) continue;
    // `display:none` у предка даёт нулевой прямоугольник; opacity 0 — нет,
    // но такая иконка всё равно не «стоит в блоке»
    let hidden = false;
    for (let e = img; e; e = e.parentElement) if (getComputedStyle(e).opacity === "0") hidden = true;
    if (hidden) continue;
    out.push({ file: src.replace(/^(\.\.\/)+assets\//, ""), w: Math.round(r.width), h: Math.round(r.height) });
  }
  return out;
});
await browser.close();
if (!files) { console.error(`селектор ничего не нашёл (видимого): ${selector}`); process.exit(2); }

// ---- сверка -----------------------------------------------------------------
const pool = figIcons.map((f) => ({ ...f, used: false }));
const rows = [];
let hard = 0, soft = 0;
for (const f of files) {
  const known = map.get(f.file);
  if (!known) { rows.push(["?", "не в карте", `${f.file} ${f.w}x${f.h}`]); soft++; continue; }
  const hit = pool.find((x) => !x.used && x.id === known.id);
  if (hit) { hit.used = true; rows.push([" ", `${hit.name} ${hit.variant} ${hit.id}`, `${f.file} ${f.w}x${f.h}`]); continue; }
  rows.push(["✗", `— (в кадре нет ${known.variant} ${known.id})`, `${f.file} ${f.w}x${f.h}`]); hard++;
}
for (const x of pool.filter((x) => !x.used)) { rows.push(["м", `${x.name} ${x.variant} ${x.id}`, `— (${x.via})`]); soft++; }

console.log(`  ══ ${page} @ ${WIDTH}  ←→  ${figmaId}   ${selector}`);
console.log(`  ${"МАКЕТ".padEnd(46)} СТРАНИЦА`);
console.log(`  ${"—".repeat(44)}   ${"—".repeat(40)}`);
for (const [flag, a, b] of rows) console.log(`${flag} ${a.padEnd(46)} ${b}`);
console.log(
  `\n  иконок: в кадре ${figIcons.length}, на странице ${files.length}; расхождений ${hard}, подозрений ${soft}` +
    `\n  «✗» — файл из карты, чьего символа в кадре нет: стоит не та иконка.` +
    `\n  «?» — файла нет в docs/ICON-MAP.md: сверить нельзя, дописать строку.` +
    `\n  «м» — иконка кадра без файла: либо скрытый слот, либо мы её не поставили.`
);
process.exit(hard ? 1 : 0);
