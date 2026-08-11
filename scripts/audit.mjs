// Ordered text diff: what a Figma INSTANCE renders vs what the page renders.
//
//   node scripts/audit.mjs <page> <selector> <figma-id>
//   node scripts/audit.mjs dealer/main 'header:not(.md\\:hidden)' 882:107883
//
// Why: every copy defect on the dealer page was mechanical — a button missing,
// two buttons in the wrong order, a label read off the master instead of the
// instance. Eyes miss those; an ordered diff does not.
//
// The Figma side is built the way `fig.mjs inst` reads a component:
//   • walk the MASTER subtree in auto-layout child order (that is visual order);
//   • a node renders if it participates in the instance's `derivedSymbolData`,
//     even when the master marks it hidden — that is the trap that cost the
//     news buttons;
//   • its copy is the instance's `symbolOverrides` text when present, the
//     master's text otherwise.
//
// Where it works: instances whose copy the designer actually overrode — title
// blocks, button rows, menus. There it is exact, and it catches a missing
// element, an extra one and a wrong ORDER, which a screenshot does not.
//
// Where it does not: instances that carry no text overrides at all, so the walk
// can only report the master's filler. The dealer header strip is the example —
// its real labels («Показывать цену», «Выход») live only in the live Figma. For
// those, `fig.mjs inst` and the derived box size are the tool: a 43x18 text box
// is five characters, which is how «Выход» was identified. Product rails are
// mock fixtures and will diff noisily by design.
import { chromium } from "playwright";
import { execFileSync } from "node:child_process";
import { resolve } from "node:path";

const [page, selector, figmaId] = process.argv.slice(2);
if (!page || !selector || !figmaId) {
  console.error("usage: node scripts/audit.mjs <page> <selector> <figma-id>");
  process.exit(1);
}

// ---- Figma side --------------------------------------------------------------
const raw = (id) => JSON.parse(execFileSync("node", ["scripts/fig.mjs", "raw", id], { maxBuffer: 1 << 28 }));
const idx = JSON.parse(
  execFileSync("node", ["-e", `
    const {readFileSync}=require("fs");
    process.stdout.write(readFileSync("VIVAT_SOURCES/canvas.index.json","utf8"));
  `], { maxBuffer: 1 << 30 })
);
const byId = new Map(idx.nodes.map((n) => [n.id, n]));
const kids = new Map();
for (const n of idx.nodes) {
  if (!n.parent) continue;
  if (!kids.has(n.parent)) kids.set(n.parent, []);
  kids.get(n.parent).push(n);
}
for (const a of kids.values()) a.sort((x, y) => String(x.order).localeCompare(String(y.order)));

const inst = raw(figmaId.replace("-", ":"));
if (!inst?.symbolData) {
  console.error(`${figmaId} is not an INSTANCE`);
  process.exit(1);
}
const pathOf = (g) => g.guids.map((x) => `${x.sessionID}:${x.localID}`).join(".");
const overrides = new Map();
for (const o of inst.symbolData.symbolOverrides ?? [])
  if (o.textData?.characters) overrides.set(pathOf(o.guidPath), o.textData.characters);
const participates = new Set((inst.derivedSymbolData ?? []).map((e) => pathOf(e.guidPath)));

const figText = [];
(function walk(nodeId, prefix, seen) {
  for (const c of kids.get(nodeId) ?? []) {
    const path = prefix ? `${prefix}.${c.id}` : c.id;
    // A node renders when the instance lays it out (`derivedSymbolData`) or
    // overrides its copy. Absence from both means a variant dropped it — the
    // news title-block's description is exactly that: no override, no derived
    // entry, and its container comes out 783x44 instead of the master's 783x74.
    // Reading the master's `visible` flag alone gets this wrong in both
    // directions, which is why it is not consulted here.
    const shown = participates.has(path) || overrides.has(path);
    const t = overrides.get(path) ?? c.text;
    if (t && t.trim() && shown) figText.push(t.replace(/\s+/g, " ").trim());
    if (c.symbol) {
      if (seen.has(c.symbol)) continue;
      walk(c.symbol, path, new Set([...seen, c.symbol]));
    } else {
      walk(c.id, prefix, seen);
    }
  }
})(inst.symbolData.symbolID ? `${inst.symbolData.symbolID.sessionID}:${inst.symbolData.symbolID.localID}` : figmaId, "", new Set());

// ---- DOM side ----------------------------------------------------------------
const browser = await chromium.launch();
const p = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
await p.goto(`file://${resolve("dist/pages", page)}.html`, { waitUntil: "load" });
await p.waitForTimeout(1500);
const domText = await p.evaluate((sel) => {
  const root = document.querySelector(sel);
  if (!root) return null;
  const out = [];
  const walk = (el) => {
    for (const n of el.childNodes) {
      if (n.nodeType === 3) {
        const t = n.textContent.replace(/\s+/g, " ").trim();
        if (t) out.push(t);
      } else if (n.nodeType === 1) {
        const cs = getComputedStyle(n);
        if (cs.display === "none" || cs.visibility === "hidden") continue;
        walk(n);
      }
    }
  };
  walk(root);
  return out;
}, selector);
await browser.close();

if (domText === null) {
  console.error(`selector matched nothing: ${selector}`);
  process.exit(1);
}

// ---- report ------------------------------------------------------------------
const norm = (s) => s.toLowerCase().replace(/[«»"'` ]/g, "").replace(/\s+/g, " ").trim();
const rows = Math.max(figText.length, domText.length);
console.log(`\n  ${"FIGMA".padEnd(46)} PAGE`);
console.log(`  ${"—".repeat(46)} ${"—".repeat(46)}`);
let mismatched = 0;
for (let i = 0; i < rows; i++) {
  const f = figText[i] ?? "";
  const d = domText[i] ?? "";
  const ok = norm(f) === norm(d);
  if (!ok) mismatched++;
  console.log(`${ok ? "  " : "✗ "}${f.slice(0, 45).padEnd(46)} ${d.slice(0, 45)}`);
}
console.log(
  `\n  ${figText.length} строк в макете, ${domText.length} на странице, расхождений ${mismatched}`
);
process.exit(mismatched ? 1 : 0);
