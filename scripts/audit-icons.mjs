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
const SESSION = opt("--session", null);
// `--click sel,sel` — открыть состояние (ящик фильтров, меню): закрытое скрыто, и
// селектор «ничего не находит»
const CLICKS = opt("--click", "") ? String(opt("--click")).split(",") : [];
// `--open sel,sel` — оверлей, до которого кликом не дойти (окно «Заказ
// оформлен» открывает только валидная форма): ему ставится `.is-open`.
const OPENS = opt("--open", "") ? String(opt("--open")).split(",") : [];
// `--scroll Y` — прокрутить окно: бар шага 0 заказа появляется только когда
// кнопка сводки ушла за экран (2029:126838 нарисован прокрученным)
const SCROLL = opt("--scroll", null);
const pos = argv.filter((a, i) => !a.startsWith("--") && !["--width", "--session", "--click", "--open", "--scroll"].includes(argv[i - 1]));
const [page, selector, figmaId] = pos;
if (!page || !selector || !figmaId) {
  console.error("usage: node scripts/audit-icons.mjs <page> <selector> <figma-id> [--width 1440]");
  process.exit(1);
}

// ---- карта файл → символ ----------------------------------------------------
const map = new Map();   // "header/icon-pin-20.svg" → { id, variant }
for (const line of readFileSync("docs/ICON-MAP.md", "utf8").split("\n")) {
  // в колонке символа может стоять несколько id через пробел — один файл на
  // варианты, различающиеся только цветом, который даёт CSS
  const m = line.match(/^\|\s*`([^`]+)`\s*\|\s*([0-9:\s]+?)\s*\|\s*([^|]*)\|/);
  if (m) map.set(m[1], { ids: m[2].trim().split(/\s+/), variant: m[3].trim() });
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
if (SESSION) await p.addInitScript((u) => localStorage.setItem("vivat:user", u), SESSION);
await p.goto(`file://${resolve(`dist/pages/${page}.html`)}`, { waitUntil: "domcontentloaded" });
await p.waitForTimeout(1000);
for (const c of CLICKS) {
  await p.$$eval(c, (els) => { const v = els.find((e) => e.getClientRects().length); if (v) v.click(); });
  await p.waitForTimeout(400);
}
for (const o of OPENS) {
  await p.$$eval(o, (els) => els.forEach((e) => e.classList.add("is-open")));
  await p.waitForTimeout(300);
}
if (SCROLL != null) {
  await p.evaluate((y) => window.scrollTo(0, Number(y)), SCROLL);
  await p.waitForTimeout(700);
}
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
// Холст файла против отрисованного размера. Иконка набора 24, поставленная в
// `size-4`, ужимает рисунок на треть: плашка «Внимание» и сноска сводки PDP
// показывали глиф ~9px вместо ~14 у настоящего символа `info 16`. Вариант при
// этом «сходился» — карта называла файл символом 16. Уменьшенный холст — это
// всегда не тот файл: у набора есть свой символ на каждый размер.
const canvasOf = (file) => {
  try {
    const m = readFileSync(`public/assets/${file}`, "utf8").match(/viewBox="0 0 ([\d.]+) ([\d.]+)"/);
    return m ? Number(m[1]) : null;
  } catch { return null; }
};
for (const f of files) {
  const cv = canvasOf(f.file);
  if (cv && f.w < cv - 0.5) { rows.push(["✗", `холст ${cv} ужат до ${f.w} — нужен символ ${f.w}`, `${f.file} ${f.w}x${f.h}`]); hard++; }
  const known = map.get(f.file);
  if (!known) { rows.push(["?", "не в карте", `${f.file} ${f.w}x${f.h}`]); soft++; continue; }
  const hit = pool.find((x) => !x.used && known.ids.includes(x.id));
  if (hit) { hit.used = true; rows.push([" ", `${hit.name} ${hit.variant} ${hit.id}`, `${f.file} ${f.w}x${f.h}`]); continue; }
  rows.push(["✗", `— (в кадре нет ${known.variant} ${known.ids.join("/")})`, `${f.file} ${f.w}x${f.h}`]); hard++;
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
