// Crop shot: a screenshot of ONE element of a built page, so "look at the block
// you changed" (CLAUDE.md) doesn't mean squinting at a 7000px page dump.
//
//   node scripts/crop.mjs dealer/main 1440 'header .rounded-l-\[32px\]'
//   node scripts/crop.mjs dealer/main 390  'header.md\:hidden' --out head
//   node scripts/crop.mjs dealer/main 390  '[data-price-sheet]' --click '[data-price-sheet-open]'
//
// --click runs a click (or several, comma-separated) before the capture, which
// is how open states — the price panel, the sheet — get photographed at all.
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
import { resolve } from "node:path";

const argv = process.argv.slice(2);
const opt = (name, def) => {
  const i = argv.indexOf(name);
  return i === -1 ? def : argv[i + 1];
};
const positional = argv.filter((a, i) => !a.startsWith("--") && !argv[i - 1]?.startsWith("--"));
const [page, width = "1440", selector] = positional;

if (!page || !selector) {
  console.error("usage: node scripts/crop.mjs <page> <width> <selector> [--click sel,sel] [--out name]");
  process.exit(1);
}

const OUT = resolve(process.cwd(), ".shots");
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();
const ctx = await browser.newContext({
  viewport: { width: Number(width), height: 900 },
  deviceScaleFactor: Number(opt("--dpr", 1)),
});
const p = await ctx.newPage();
await p.goto(`file://${resolve(process.cwd(), "dist/pages", `${page}.html`)}`);
await p.waitForTimeout(400);

for (const sel of (opt("--click", "") || "").split(",").filter(Boolean)) {
  await p.locator(sel).first().click();
  await p.waitForTimeout(250);
}

const name = opt("--out", page.replace(/\//g, "-"));
const file = resolve(OUT, `crop-${name}-${width}.png`);
await p.locator(selector).first().screenshot({ path: file });
console.log(file);

await browser.close();
