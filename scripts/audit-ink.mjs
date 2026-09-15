// Седьмой аудит, точечный: где внутри пилюли лежат БУКВЫ. Ни один из
// остальных этого не видит — коробка текста стоит по центру и у нас, и в
// Figma, а цифры в L-бейдже сидели на пиксель выше: Chrome кладёт базовую
// линию на целый пиксель с округлением вниз. Ловится только по чернилам.
//
//   node scripts/audit-ink.mjs <page> <selector> [--width 1440] [--scale 1,2,4] [--figma png --figma-scale 4] [--dark]
//   node scripts/audit-ink.mjs customer/main 'article .badge-l' --scale 1,2
//
// Печатает зазор от края пилюли до первого/последнего ряда чернил сверху и
// снизу, в CSS-пикселях, на каждой плотности. С `--figma` рядом печатается то
// же по экспорту из Figma (масштаб экспорта — `--figma-scale`). Разница
// сверху−снизу > 0.5 px на 2x — уже видно глазом. `--dark` — тёмный текст на
// светлой пилюле.
import { chromium } from "playwright";
import { execFileSync } from "node:child_process";
import { resolve } from "node:path";

const argv = process.argv.slice(2);
const opt = (n, d) => { const i = argv.indexOf(n); return i === -1 ? d : argv[i + 1]; };
const WIDTH = Number(opt("--width", 1440));
const SCALES = String(opt("--scale", "1,2")).split(",").map(Number);
const FIGMA = opt("--figma", null);
const FSCALE = Number(opt("--figma-scale", 4));
const DARK = argv.includes("--dark");
const pos = argv.filter((a, i) => !a.startsWith("--") && !["--width", "--scale", "--figma", "--figma-scale"].includes(argv[i - 1]));
const [page, selector] = pos;
if (!page || !selector) { console.error("usage: node scripts/audit-ink.mjs <page> <selector> [--scale 1,2] [--figma png]"); process.exit(1); }

const measure = (file, scale) => execFileSync("python3", ["scripts/ink.py", file, String(scale), ...(DARK ? ["dark"] : [])], { encoding: "utf8" }).trim();

const browser = await chromium.launch();
console.log(`  ══ ${page} @ ${WIDTH}   ${selector}`);
for (const scale of SCALES) {
  const p = await browser.newPage({ viewport: { width: WIDTH, height: 900 }, deviceScaleFactor: scale });
  await p.goto(`file://${resolve("dist/pages", page)}.html`, { waitUntil: "domcontentloaded" });
  await p.waitForTimeout(600);
  const el = (await p.$$(selector));
  let shot = null;
  for (const e of el) if (await e.isVisible()) { shot = `.shots/ink-${scale}x.png`; await e.screenshot({ path: shot }); break; }
  await p.close();
  if (!shot) { console.error(`селектор ничего не нашёл (видимого): ${selector}`); process.exit(2); }
  console.log(`  страница @${scale}x  ${measure(shot, scale)}`);
}
if (FIGMA) console.log(`  Figma    @${FSCALE}x  ${measure(FIGMA, FSCALE)}`);
await browser.close();
