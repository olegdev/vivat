// Седьмой аудит: сходится ли ПОТОК страницы с кадром по вертикали.
//
//   node scripts/audit-flow.mjs <page> <frame-id> [--width 360] [--session dealer]
//   node scripts/audit-flow.mjs customer/action 2248:110193 --width 360
//
// Зачем. `audit:spacing` сверяет воздух на стыках, `audit:box` — блок изнутри.
// Ни один не видит, что между двумя блоками стоит ЛИШНИЙ (блок соцсетей на 360
// Акций, которого в кадре нет) или что блок на 8px ниже, чем в кадре (рельс
// 436 при 444): стыки те же, воздух тот же, внутри всё совпало.
//
// Как. У кадра берутся дети верхнего уровня (видимые), их верх и низ. На
// странице — края всех видимых элементов потока (до глубины 6). Каждый край
// кадра обязан совпасть с каким-нибудь краем страницы с допуском 1.5px; тот, что
// не совпал, печатается с ближайшим краем страницы и разницей. Структуры при
// этом сравнивать не нужно: у нас «шапка + крошки» могут быть одним блоком, а
// у кадра двумя, — край всё равно найдётся.
//
// Первый несошедшийся край — место, где поток разошёлся; всё ниже обычно
// съезжает на ту же величину, поэтому печатается и сдвиг «относительно
// предыдущего расхождения»: одинаковый сдвиг — одна причина.
import { chromium } from "playwright";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const argv = process.argv.slice(2);
const opt = (n, d) => { const i = argv.indexOf(n); return i === -1 ? d : argv[i + 1]; };
const WIDTH = Number(opt("--width", 1440));
const SESSION = opt("--session", null);
const TOL = 1.5; // 2 ловил случайные края: низ последнего фото плитки (2077.5) «совпадал» с низом сетки кадра (2075.6)
const [page, frameId] = argv.filter((a, i) => !a.startsWith("--") && !["--width", "--session"].includes(argv[i - 1]));
if (!page || !frameId) {
  console.error("usage: node scripts/audit-flow.mjs <page> <frame-id> [--width 1440]");
  process.exit(2);
}

const idx = JSON.parse(readFileSync("VIVAT_SOURCES/canvas.index.json", "utf8"));
const id = frameId.replace("-", ":");
const kids = idx.nodes.filter((n) => n.parent === id && !n.hidden && n.h != null && n.h > 0);
if (!kids.length) { console.error(`у ${frameId} нет видимых детей`); process.exit(2); }
kids.sort((a, b) => a.y - b.y);
const figEdges = [];
for (const k of kids) {
  figEdges.push({ y: k.y, what: `${k.name} ↑` });
  figEdges.push({ y: k.y + k.h, what: `${k.name} ↓` });
}

const browser = await chromium.launch();
const p = await browser.newPage({ viewport: { width: WIDTH, height: 900 } });
if (SESSION) await p.addInitScript((u) => localStorage.setItem("vivat:user", u), SESSION);
await p.goto(`file://${resolve(`dist/pages/${page}.html`)}`, { waitUntil: "load" });
await p.waitForTimeout(1200);
const domEdges = await p.evaluate(() => {
  const out = [];
  const label = (el) => el.getAttribute("data-section") || `${el.tagName.toLowerCase()}.${(el.getAttribute("class") || "").split(/\s+/).slice(0, 2).join(".")}`;
  const walk = (el, d) => {
    for (const c of el.children) {
      const cs = getComputedStyle(c);
      if (cs.display === "none" || cs.position === "fixed" || cs.visibility === "hidden") continue;
      const r = c.getBoundingClientRect();
      // только блоки потока — во всю ширину (≥85% окна, поля page-x не в
      // счёт): иначе край кадра «находит» картинку или подпись внутри блока и
      // расхождение прячется
      if (r.height >= 8 && r.width >= innerWidth * 0.85) {
        out.push({ y: r.top + scrollY, what: `${label(c)} ↑` });
        out.push({ y: r.bottom + scrollY, what: `${label(c)} ↓` });
        // и края содержимого: кадр рисует отступ отдельным `spacing`, мы —
        // паддингом того же блока (сетка акций `pt-6`)
        const pt = parseFloat(cs.paddingTop), pb = parseFloat(cs.paddingBottom);
        if (pt) out.push({ y: r.top + pt + scrollY, what: `${label(c)} ↑+pt` });
        if (pb) out.push({ y: r.bottom - pb + scrollY, what: `${label(c)} ↓−pb` });
      }
      if (d < 6) walk(c, d + 1);
    }
  };
  walk(document.body, 0);
  return out;
});
await browser.close();

let bad = 0;
let lastShift = null;
console.log(`  ══ ${page} @ ${WIDTH}  ←→  ${frameId}`);
for (const e of figEdges) {
  let best = null;
  for (const d of domEdges) if (!best || Math.abs(d.y - e.y) < Math.abs(best.y - e.y)) best = d;
  const diff = best ? best.y - e.y : Infinity;
  if (Math.abs(diff) <= TOL) continue;
  bad++;
  // ближайший край НИЖЕ ожидаемого — чаще всего это тот же край, съехавший
  const below = domEdges.filter((d) => d.y > e.y).sort((a, b) => a.y - b.y)[0];
  const shift = below ? Math.round(below.y - e.y) : null;
  const same = shift != null && lastShift != null && Math.abs(shift - lastShift) <= TOL ? "  (тот же сдвиг)" : "";
  lastShift = shift;
  console.log(`✗ ${e.what.padEnd(34)} макет ${e.y.toFixed(1).padStart(7)}   ближайший на странице ${best.y.toFixed(1).padStart(7)} ${best.what.slice(0, 40)}${same}`);
}
console.log(bad ? `\n  краёв кадра без пары: ${bad} из ${figEdges.length}` : `  все ${figEdges.length} краёв кадра нашлись на странице`);
process.exit(bad ? 1 : 0);
