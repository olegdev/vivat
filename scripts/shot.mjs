// Screenshots of the built pages, so "verify in the browser at both 1440 and
// 390" (CLAUDE.md) is a command and not a good intention.
//
//   npm run shot                    every page, both widths
//   npm run shot dealer/main        one page, both widths
//   npm run shot dealer/main 1440   one page, one width
//   npm run shot -- --no-build      skip the staleness rebuild
//   npm run shot -- --dpr 3         sharper (heavier) capture
//
// Shoots dist/ over file:// — those pages are self-contained, so no server is
// involved. dist/ is rebuilt first when src/ is newer, because looking at a
// stale screenshot and believing it is worse than waiting for a build.
import { chromium } from "playwright";
import { execFileSync } from "node:child_process";
import { mkdirSync, statSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { globSync } from "glob";

const root = process.cwd();
const argv = process.argv.slice(2);
const flag = (name) => argv.includes(name);
const opt = (name, def) => {
  const i = argv.indexOf(name);
  return i === -1 ? def : argv[i + 1];
};
const positional = argv.filter((a, i) => !a.startsWith("--") && argv[i - 1] !== "--dpr");

const DPR = Number(opt("--dpr", 1));
const OUT = resolve(root, ".shots");

const newest = (patterns) =>
  Math.max(...patterns.flatMap((p) => globSync(p)).map((f) => statSync(f).mtimeMs), 0);

if (!flag("--no-build")) {
  const src = newest(["src/**/*", "public/**/*", "scripts/*.mjs"]);
  const built = existsSync("dist/index.html") ? statSync("dist/index.html").mtimeMs : 0;
  if (src > built) {
    console.log("dist/ отстаёт от src/ — пересобираю…");
    execFileSync("npm", ["run", "build"], { stdio: "inherit" });
  }
}

const pages = globSync("dist/pages/**/*.html").map((f) =>
  f.replace(/^dist\/pages\//, "").replace(/\.html$/, "")
);
const targets = positional.length
  ? positional.filter((p) => !/^\d+$/.test(p))
  : pages;
const widths = positional.filter((p) => /^\d+$/.test(p)).map(Number);
const sizes = widths.length ? widths : [1440, 390];

const unknown = targets.filter((t) => !pages.includes(t));
if (unknown.length) {
  console.error(`нет таких страниц: ${unknown.join(", ")}\nесть: ${pages.join(", ")}`);
  process.exit(1);
}

mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch();

for (const page of targets) {
  for (const width of sizes) {
    const ctx = await browser.newContext({
      viewport: { width, height: 900 },
      deviceScaleFactor: DPR,
      // the pages autoplay video; a fixed clock keeps repeat shots comparable
      reducedMotion: "reduce",
    });
    const p = await ctx.newPage();
    await p.goto(`file://${resolve(root, "dist/pages", page)}.html`, { waitUntil: "load" });
    await p.waitForTimeout(2000); // let fonts, videos and the map settle
    const file = resolve(OUT, `${page.replace(/\//g, "-")}-${width}.png`);
    mkdirSync(dirname(file), { recursive: true });
    await p.screenshot({ path: file, fullPage: true });
    const h = await p.evaluate(() => document.body.scrollHeight);
    const overflow = await p.evaluate((w) => document.documentElement.scrollWidth > w, width);
    console.log(
      `${page} @${width}  ${h}px${overflow ? "  ⚠ горизонтальное переполнение" : ""}  → ${file.replace(root + "/", "")}`
    );
    await ctx.close();
  }
}

await browser.close();
